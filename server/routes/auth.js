const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Config  = require('../models/Config');
const auth    = require('../middleware/auth');

/**
 * Mapa de intentos fallidos por IP.
 * { [ip]: { count: number, blockedUntil: number | null } }
 */
const intentosFallidos = new Map();

const MAX_INTENTOS   = 3;   // Bloqueo tras 3 fallos
const BLOQUEO_MS     = 30 * 1000; // 30 segundos

function getEstadoIP(ip) {
  if (!intentosFallidos.has(ip)) {
    intentosFallidos.set(ip, { count: 0, blockedUntil: null });
  }
  return intentosFallidos.get(ip);
}

/**
 * Obtiene el PIN actual de MongoDB.
 * Si no existe, lo crea usando el valor del .env como semilla.
 */
async function getAdminPin() {
  let pinDoc = await Config.findOne({ key: 'admin_pin' });
  if (pinDoc) {
    return pinDoc.value;
  } else {
    const fallbackPin = process.env.ADMIN_PIN || '1234';
    try {
      await Config.create({ key: 'admin_pin', value: fallbackPin });
    } catch (e) {
      // Ignorar error si se intentaron crear dos simultáneamente
    }
    return fallbackPin;
  }
}

/**
 * POST /api/auth/login
 * Body: { pin: string }
 */
router.post('/login', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    const estado = getEstadoIP(ip);

    // ── Verificar si la IP está bloqueada ─────────────────────────────────────
    if (estado.blockedUntil && Date.now() < estado.blockedUntil) {
      const remainingMs = estado.blockedUntil - Date.now();
      return res.status(429).json({
        ok: false,
        blocked: true,
        remainingMs,
        message: `Demasiados intentos. Espera ${Math.ceil(remainingMs / 1000)} segundos.`
      });
    }

    if (estado.blockedUntil && Date.now() >= estado.blockedUntil) {
      estado.count = 0;
      estado.blockedUntil = null;
    }

    // ── Validar PIN ────────────────────────────────────────────────────────────
    const { pin } = req.body;
    const pinCorrecto = await getAdminPin();

    if (!pin) {
      return res.status(400).json({ ok: false, message: 'PIN requerido' });
    }

    if (pin === pinCorrecto) {
      estado.count = 0;
      estado.blockedUntil = null;
      const secret = process.env.JWT_SECRET || 'afinacion-jwt-super-secret-key-2026';
      const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });
      return res.json({ ok: true, token });
    }

    // ── PIN incorrecto ─────────────────────────────────────────────────────────
    estado.count += 1;

    if (estado.count >= MAX_INTENTOS) {
      estado.blockedUntil = Date.now() + BLOQUEO_MS;
      return res.status(429).json({
        ok: false,
        blocked: true,
        remainingMs: BLOQUEO_MS,
        message: `Demasiados intentos. Bloqueado por ${BLOQUEO_MS / 1000} segundos.`
      });
    }

    const attemptsLeft = MAX_INTENTOS - estado.count;
    return res.status(401).json({
      ok: false,
      blocked: false,
      attemptsLeft,
      message: `PIN incorrecto. ${attemptsLeft} intento${attemptsLeft > 1 ? 's' : ''} restante${attemptsLeft > 1 ? 's' : ''}.`
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
});

/**
 * PUT /api/auth/change-pin
 * Body: { currentPin: string, newPin: string }
 */
router.put('/change-pin', auth, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    
    if (!currentPin || !newPin) {
      return res.status(400).json({ ok: false, message: 'Se requiere PIN actual y nuevo.' });
    }

    if (newPin.length < 4 || newPin.length > 8) {
      return res.status(400).json({ ok: false, message: 'El PIN debe tener entre 4 y 8 caracteres.' });
    }

    const pinCorrecto = await getAdminPin();
    
    if (currentPin !== pinCorrecto) {
      return res.status(401).json({ ok: false, message: 'El PIN actual es incorrecto.' });
    }

    await Config.findOneAndUpdate(
      { key: 'admin_pin' },
      { value: newPin },
      { upsert: true, new: true }
    );

    return res.json({ ok: true, message: 'PIN actualizado exitosamente.' });
  } catch (error) {
    console.error('Error changing PIN:', error);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
});

module.exports = router;
