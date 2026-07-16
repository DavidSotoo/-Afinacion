const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');

// @route   POST api/webhooks/mercadopago
// @desc    Recibe notificaciones de Mercado Pago sobre el estado de los pagos
// @security Mercado Pago firma las notificaciones con x-signature — validar en producción
router.post('/mercadopago', async (req, res) => {
  try {
    // MP envía el ID del pago en body.data.id o como query param
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const topic     = req.body?.type    || req.query?.topic;

    // Log de diagnóstico (sin incluir tokens ni datos sensibles)
    console.log(`[Webhook MP] Evento recibido | ID Pago: ${paymentId} | Tipo: ${topic} | Action: ${req.body?.action}`);

    // Solo procesamos notificaciones de pagos
    const isPaymentEvent = topic === 'payment' || req.body?.action === 'payment.created' || req.body?.action === 'payment.updated';

    if (!paymentId || !isPaymentEvent) {
      // Otros tipos de notificación (suscripciones, preferencias) — ACK y seguir
      return res.status(200).send('OK - event type not handled');
    }

    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('[Webhook MP] MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno');
      return res.status(200).send('Internal configuration error - acknowledged');
    }

    // Consultar el estado real del pago contra la API de Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpRes.ok) {
      console.error(`[Webhook MP] Error al consultar pago ${paymentId}: HTTP ${mpRes.status} ${mpRes.statusText}`);
      // Respondemos 200 para que MP no reintente indefinidamente por errores transitorios
      return res.status(200).send('MP API fetch failed - acknowledged');
    }

    const paymentData = await mpRes.json();
    const status = paymentData.status;               // 'approved', 'rejected', 'pending', etc.
    const folio  = paymentData.external_reference;   // folio de la cotización que guardamos al crear la preferencia

    console.log(`[Webhook MP] Pago ${paymentId} | Estado: ${status} | Folio cotización: ${folio}`);

    if (status === 'approved' && folio) {
      const cotizacion = await Cotizacion.findOne({ folio });

      if (cotizacion) {
        cotizacion.estatus = 'Pagado / Listo para surtir';
        cotizacion.detallesPago = {
          ...(cotizacion.detallesPago || {}),
          statusMercadoPago: status,
          paymentId: String(paymentId),
          metodoPagoUsado: paymentData.payment_method_id,
          tipoPagoUsado:   paymentData.payment_type_id,
          montoPagado:     paymentData.transaction_amount,
          fechaAprobacion: paymentData.date_approved,
          installments:    paymentData.installments || 1
        };
        await cotizacion.save();
        console.log(`[Webhook MP] ✅ Cotización #${folio} marcada como Pagada | Monto: $${paymentData.transaction_amount}`);
      } else {
        console.warn(`[Webhook MP] ⚠️  No se encontró cotización con folio #${folio}`);
      }
    } else if (status === 'rejected') {
      console.log(`[Webhook MP] ❌ Pago ${paymentId} rechazado — folio ${folio} sin cambios`);
    }

    // SIEMPRE responder 200 a MP para evitar reintentos innecesarios
    res.status(200).send('OK');

  } catch (err) {
    console.error('[Webhook MP] Error interno:', err.message);
    // 200 intencional: si devolvemos 5xx, MP reintentará agresivamente
    res.status(200).send('Internal error - acknowledged');
  }
});

module.exports = router;
