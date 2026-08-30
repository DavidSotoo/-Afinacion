const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Cotizacion = require('../models/Cotizacion');

// ─────────────────────────────────────────────────────────────────────────────
// Validación de firma x-signature (opcional en sandbox, obligatorio en prod)
//
// MP firma cada notificación con HMAC-SHA256 usando la clave secreta del webhook.
// Si MERCADOPAGO_WEBHOOK_SECRET está configurado, rechazamos notificaciones sin
// firma válida. Si no está configurado, aceptamos todas (útil en sandbox local).
//
// Documentación: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/notifications/webhooks
// ─────────────────────────────────────────────────────────────────────────────
function verifyMPSignature(req) {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // Si no hay clave configurada, omitir validación (modo sandbox/dev)
  if (!webhookSecret) {
    return true;
  }

  try {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];

    if (!xSignature) {
      console.warn('[Webhook MP] ⚠️  x-signature ausente pero MERCADOPAGO_WEBHOOK_SECRET configurado — rechazando');
      return false;
    }

    // Extraer ts y v1 del header x-signature
    // Formato: "ts=<timestamp>,v1=<hash>"
    const parts = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) parts[key.trim()] = value.trim();
    });

    const { ts, v1 } = parts;
    if (!ts || !v1) return false;

    // Construir el string de firma: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
    const dataId = req.body?.data?.id || '';
    const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;

    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(v1, 'hex')
    );

    if (!isValid) {
      console.warn(`[Webhook MP] ⚠️  Firma inválida — posible notificación fraudulenta | manifest: ${manifest}`);
    }

    return isValid;
  } catch (err) {
    console.error('[Webhook MP] Error al verificar firma:', err.message);
    return false;
  }
}

// Mapeo de estados de MP a estatus interno de la cotización
const STATUS_MAP = {
  approved:    'Pagado / Listo para surtir',
  pending:     'Pago Pendiente (MP)',
  in_process:  'Pago Pendiente (MP)',
  in_mediation:'En Disputa (MP)',
  rejected:    'Pendiente',   // Vuelve a pendiente para reintentar pago
  cancelled:   'Pendiente',
  refunded:    'Cancelada',
  charged_back:'Cancelada'
};

// @route   POST api/webhooks/mercadopago
// @desc    Recibe notificaciones de Mercado Pago sobre el estado de los pagos
router.post('/mercadopago', async (req, res) => {
  try {
    // ── Validación de firma ────────────────────────────────────────────────
    if (!verifyMPSignature(req)) {
      // Respondemos 200 (no 401) para que MP no reintente indefinidamente
      return res.status(200).send('Signature verification failed - acknowledged');
    }

    // MP envía el ID del pago en body.data.id o como query param
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const topic     = req.body?.type    || req.query?.topic;
    const action    = req.body?.action;

    // Log de diagnóstico (sin incluir tokens ni datos sensibles)
    console.log(`[Webhook MP] Evento recibido | ID: ${paymentId} | Tipo: ${topic} | Action: ${action}`);

    // Solo procesamos notificaciones de pagos
    const isPaymentEvent = topic === 'payment' || action === 'payment.created' || action === 'payment.updated';

    if (!paymentId || !isPaymentEvent) {
      // Otros tipos (suscripciones, preferencias) — ACK y seguir
      return res.status(200).send('OK - event type not handled');
    }

    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('[Webhook MP] MERCADOPAGO_ACCESS_TOKEN no configurado en variables de entorno');
      return res.status(200).send('Internal configuration error - acknowledged');
    }

    // ── Consultar estado real del pago contra la API de MP ─────────────────
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpRes.ok) {
      console.error(`[Webhook MP] Error al consultar pago ${paymentId}: HTTP ${mpRes.status} ${mpRes.statusText}`);
      // Responder 200 para que MP no reintente indefinidamente por errores transitorios
      return res.status(200).send('MP API fetch failed - acknowledged');
    }

    const paymentData = await mpRes.json();
    const status = paymentData.status;             // 'approved', 'rejected', 'pending', etc.
    const folio  = paymentData.external_reference; // folio de la cotización

    console.log(`[Webhook MP] Pago ${paymentId} | Estado: ${status} | Folio: ${folio}`);

    // ── Actualizar la cotización según el estado ───────────────────────────
    if (folio) {
      const nuevoEstatus = STATUS_MAP[status];

      if (nuevoEstatus) {
        const cotizacion = await Cotizacion.findOne({ folio });

        if (cotizacion) {
          // Solo actualizamos si el nuevo estatus es diferente al actual
          // (evitar sobreescribir "Pagado" con "Pendiente" en reintentos tardíos)
          const debeActualizar =
            status === 'approved' ||
            (status !== 'rejected' && status !== 'cancelled' && cotizacion.estatus === 'Pendiente');

          if (debeActualizar || status === 'approved') {
            cotizacion.estatus = nuevoEstatus;
            cotizacion.detallesPago = {
              ...(cotizacion.detallesPago || {}),
              statusMercadoPago:  status,
              paymentId:          String(paymentId),
              metodoPagoUsado:    paymentData.payment_method_id,
              tipoPagoUsado:      paymentData.payment_type_id,
              montoPagado:        paymentData.transaction_amount,
              fechaAprobacion:    paymentData.date_approved,
              installments:       paymentData.installments || 1,
              ultimaActualizacion: new Date().toISOString()
            };
            await cotizacion.save();

            const emoji = status === 'approved' ? '✅' : status === 'pending' || status === 'in_process' ? '⏳' : '❌';
            console.log(`[Webhook MP] ${emoji} Cotización #${folio} → "${nuevoEstatus}" | Monto: $${paymentData.transaction_amount}`);
          } else {
            console.log(`[Webhook MP] ⏭️  Cotización #${folio} no actualizada (ya tiene estatus: "${cotizacion.estatus}")`);
          }
        } else {
          console.warn(`[Webhook MP] ⚠️  No se encontró cotización con folio #${folio}`);
        }
      } else {
        console.log(`[Webhook MP] Estado "${status}" no mapeado — sin cambios en BD`);
      }
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
