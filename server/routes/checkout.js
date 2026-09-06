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

/**
 * HAL-05: Verifica si una preferencia de MP existente sigue vigente.
 * Devuelve { valid: true, preference } si no ha expirado,
 * o { valid: false } si expiró o no se pudo leer.
 *
 * Notas sobre expiración:
 * - Nuestras preferencias incluyen `expiration_date_to: +24h` al crearlas.
 * - MP también tiene una expiración default si no se configura (normalmente 30 días),
 *   pero nosotros siempre la configuramos explícitamente en 24h.
 * - Este check recupera la preferencia de la API de MP y compara `expiration_date_to`
 *   con el momento actual. Si ya pasó, se crea una preferencia nueva.
 *
 * @param {string} preferenceId  — ID de la preferencia guardado en la cotización
 */
async function checkExistingPreference(preferenceId) {
  try {
    const preferenceClient = getMPClient();
    const pref = await preferenceClient.get({ preferenceId });

    // Si la preferencia tiene fecha de expiración, verificarla
    if (pref.expiration_date_to) {
      const expiresAt = new Date(pref.expiration_date_to);
      if (expiresAt <= new Date()) {
        console.log(`[Checkout] Preferencia ${preferenceId} expiró el ${expiresAt.toISOString()} — se creará una nueva.`);
        return { valid: false };
      }
    }

    // Vigente: devolver los init_points sin crear nada nuevo
    console.log(`[Checkout] Reutilizando preferencia existente: ${preferenceId}`);
    return {
      valid: true,
      preference: {
        preferenceId: pref.id,
        init_point: pref.init_point,
        sandbox_init_point: pref.sandbox_init_point,
      }
    };
  } catch (err) {
    // Si MP devuelve 404 u otro error, consideramos la preferencia inválida
    console.warn(`[Checkout] No se pudo verificar preferencia ${preferenceId}: ${err.message} — se creará una nueva.`);
    return { valid: false };
  }
}

// @route   POST api/checkout/create-preference
// @desc    Create (or reuse) a Mercado Pago Checkout Pro payment preference
router.post('/create-preference', async (req, res) => {
  try {
    const { cotizacionId } = req.body;

    if (!cotizacionId) {
      return res.status(400).json({ error: 'Falta el ID de la cotización' });
    }

    // SEC-02: Never trust the price sent by the client.
    // Fetch the authoritative total from the database record.
    const cotizacion = await Cotizacion.findById(cotizacionId);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    // Use the server-stored total ONLY.
    // We removed the totalCart fallback because it allowed price manipulation.
    if (!cotizacion.totalFinal || cotizacion.totalFinal <= 0) {
      return res.status(400).json({ error: 'La cotización no tiene un total válido calculado por el servidor.' });
    }

    // ── HAL-05: Idempotencia ─────────────────────────────────────────────────
    // Si ya existe una preferencia guardada en esta cotización, verificar si
    // sigue vigente antes de crear una nueva. Esto evita preferencias duplicadas
    // cuando el usuario presiona "Atrás" y vuelve a intentar el pago.
    const existingPrefId = cotizacion.detallesPago?.preferenceId;
    if (existingPrefId) {
      const check = await checkExistingPreference(existingPrefId);
      if (check.valid) {
        console.log(`[Checkout] Preferencia reutilizada para folio ${cotizacion.folio} (sin crear nueva en MP)`);
        return res.json(check.preference);
      }
      // Si llegamos aquí, la preferencia expiró — continuamos a crear una nueva
    }
    // ── Fin HAL-05 ───────────────────────────────────────────────────────────

    const total = cotizacion.totalFinal;

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
      // NOTA: auto_return omitido intencionalmente.
      // MP requiere HTTPS público para auto_return. En sandbox/localhost
      // el usuario regresa al sitio usando el botón "Volver" de la página de MP.
      // En producción con HTTPS real se puede re-habilitar: auto_return: 'approved'
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

    console.log(`[Checkout] Nueva preferencia MP creada: ${response.id} | Folio: ${folioRef} | Total: $${total}`);

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
