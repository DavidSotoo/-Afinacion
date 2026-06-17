const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if no token
  if (!authHeader) {
    return res.status(401).json({ ok: false, message: 'Acceso denegado. No se proporcionó un token.' });
  }

  // Check if Bearer format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ ok: false, message: 'Formato de token inválido. Debe ser Bearer <token>.' });
  }

  const token = parts[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ ok: false, message: 'Falta configurar JWT_SECRET en las variables de entorno.' });
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ ok: false, message: 'Token inválido o expirado.' });
  }
};
