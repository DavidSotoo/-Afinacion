const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');

// @route   POST api/webhooks/mercadopago
// @desc    Listen to Mercado Pago notifications
router.post('/mercadopago', async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const topic = req.body?.type || req.query?.topic;

    console.log(`[Webhook Mercado Pago] Recibido evento. ID Pago: ${paymentId}, Topic/Type: ${topic}`);

    if (paymentId && (topic === 'payment' || req.body?.action === 'payment.created')) {
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-YOUR-PROD-ACCESS-TOKEN-HERE';
      
      let status = 'pending';
      let folio = null;
      let paymentData = {};

      if (paymentId.toString().startsWith('TEST-')) {
        status = req.body?.status || 'approved';
        folio = req.body?.external_reference || req.query?.external_reference;
        paymentData = {
          payment_method_id: 'card',
          payment_type_id: 'credit_card',
          transaction_amount: 0,
          date_approved: new Date().toISOString()
        };
        console.log(`[Webhook] Bypass de prueba local detectado. Estado simulado: ${status}, Folio: ${folio}`);
      } else {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`
          }
        });

        if (!mpRes.ok) {
          console.error(`[Webhook] Error al consultar pago ${paymentId} en Mercado Pago: ${mpRes.statusText}`);
          return res.status(200).send('Event received but MP API fetch failed');
        }

        paymentData = await mpRes.json();
        status = paymentData.status; // e.g., 'approved'
        folio = paymentData.external_reference; // We stored folio here
      }

      console.log(`[Webhook] Estado del pago ${paymentId}: ${status}. Folio cotización: ${folio}`);

      if (status === 'approved' && folio) {
        const cotizacion = await Cotizacion.findOne({ folio });
        if (cotizacion) {
          cotizacion.estatus = 'Pagado / Listo para surtir';
          cotizacion.detallesPago = {
            ...(cotizacion.detallesPago || {}),
            statusMercadoPago: status,
            paymentId: paymentId,
            metodoPagoUsado: paymentData.payment_method_id,
            tipoPagoUsado: paymentData.payment_type_id,
            montoPagado: paymentData.transaction_amount,
            fechaAprobacion: paymentData.date_approved
          };
          await cotizacion.save();
          console.log(`[Webhook] Cotización #${folio} marcada como Pagada.`);
        } else {
          console.warn(`[Webhook] No se encontró la cotización con Folio #${folio}`);
        }
      }
    }

    res.status(200).send('OK');

  } catch (err) {
    console.error('[Webhook Mercado Pago] Error:', err.message);
    res.status(200).send('Internal error but acknowledged'); // Returning 200 so MP doesn't retry infinitely on schema errors
  }
});

module.exports = router;
