const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');
const { MercadoPagoConfig, Preference } = require('mercadopago');

/**
 * Crea un cliente de Mercado Pago en tiempo de ejecución (no en carga del módulo)
 * para que siempre use el token actual de process.env — útil si el env se
 * carga después del require() inicial.
 */
function getMPClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token || token === 'TEST-YOUR-PROD-ACCESS-TOKEN-HERE') {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN no configurado. ' +
      'Agrega el token en server/.env antes de procesar pagos.'
    );
  }
  const client = new MercadoPagoConfig({ accessToken: token });
  return new Preference(client);
}

// @route   POST api/checkout/create-preference
// @desc    Create a Mercado Pago Checkout Pro payment preference
router.post('/create-preference', async (req, res) => {
  try {
    const { cotizacionId, totalCart } = req.body;

    if (!cotizacionId) {
      return res.status(400).json({ error: 'Falta el ID de la cotización' });
    }

    // Validate quote against database to prevent pricing fraud
    const cotizacion = await Cotizacion.findById(cotizacionId);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const total = parseFloat(totalCart);
    if (isNaN(total) || total <= 0) {
      return res.status(400).json({ error: 'El total de la compra no es válido' });
    }

    // Build dynamic URLs from environment variables — NEVER hardcoded
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backendUrl  = process.env.BACKEND_URL  || 'http://localhost:5000';
    const folioRef    = cotizacion.folio;

    const preferenceBody = {
      items: [
        {
          id: cotizacion._id.toString(),
          title: `+AFINACIÓN — Kit Afinación Folio #${folioRef}`,
          description: `${cotizacion.vehiculo?.marca || ''} ${cotizacion.vehiculo?.modelo || ''} — Refacciones y servicio`,
          quantity: 1,
          unit_price: total,
          currency_id: 'MXN'
        }
      ],
      back_urls: {
        success: `${frontendUrl}/checkout?status=approved&folio=${folioRef}`,
        failure: `${frontendUrl}/checkout?status=rejected&folio=${folioRef}`,
        pending: `${frontendUrl}/checkout?status=pending&folio=${folioRef}`
      },
      // Redirige automáticamente al back_url de éxito sin necesidad de clic
      auto_return: 'approved',
      // Referencia interna para identificar la cotización en el webhook
      external_reference: folioRef,
      // Webhook: Mercado Pago notifica aquí aunque el usuario cierre el browser
      notification_url: `${backendUrl}/api/webhooks/mercadopago`,
      // Tiempo de expiración de la preferencia: 24 horas
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const preferenceClient = getMPClient();
    const response = await preferenceClient.create({ body: preferenceBody });

    // Persist preference ID in the quote for traceability
    cotizacion.detallesPago = {
      ...(cotizacion.detallesPago || {}),
      preferenceId: response.id,
      totalAutorizado: total
    };
    await cotizacion.save();

    console.log(`[Checkout] Preferencia MP creada: ${response.id} | Folio: ${folioRef} | Total: $${total}`);

    res.json({
      preferenceId: response.id,
      // init_point = producción | sandbox_init_point = pruebas
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });

  } catch (err) {
    console.error('[Checkout] Error al crear preferencia Mercado Pago:', err.message || err);
    const status = err.message?.includes('MERCADOPAGO_ACCESS_TOKEN') ? 503 : 500;
    res.status(status).json({ error: err.message || 'Error del servidor al iniciar el pago' });
  }
});

module.exports = router;
