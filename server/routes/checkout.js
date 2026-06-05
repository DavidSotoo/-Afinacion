const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Init Mercado Pago client
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-YOUR-PROD-ACCESS-TOKEN-HERE';
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
const preferenceClient = new Preference(client);

// @route   POST api/checkout/create-preference
// @desc    Create a Mercado Pago payment preference
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

    // Create Preference Object
    const preferenceBody = {
      items: [
        {
          id: cotizacion._id.toString(),
          title: `Refacciones y Kit - Folio #${cotizacion.folio}`,
          quantity: 1,
          unit_price: total,
          currency_id: 'MXN'
        }
      ],
      back_urls: {
        success: `http://localhost:5173/checkout?status=approved&folio=${cotizacion.folio}`,
        failure: `http://localhost:5173/checkout?status=rejected&folio=${cotizacion.folio}`,
        pending: `http://localhost:5173/checkout?status=pending&folio=${cotizacion.folio}`
      },
      auto_return: 'approved',
      external_reference: cotizacion.folio
    };

    const response = await preferenceClient.create({ body: preferenceBody });

    // Save preference ID in database for future reference
    cotizacion.detallesPago = {
      ...(cotizacion.detallesPago || {}),
      preferenceId: response.id
    };
    await cotizacion.save();

    res.json({
      preferenceId: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });

  } catch (err) {
    console.error('Error al crear preferencia Mercado Pago:', err);
    res.status(500).json({ error: 'Error del servidor al iniciar el pago' });
  }
});

module.exports = router;
