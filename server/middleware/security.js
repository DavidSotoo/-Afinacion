const xssLib = require('xss');

/**
 * SEC-03: Input sanitization middleware bundle.
 *
 * xssMiddleware          — recursively strips XSS payloads from req.body,
 *                          req.query and req.params using the `xss` package.
 * mongoSanitizeMiddleware — removes/renames MongoDB operator keys ($where, $gt,
 *                           keys containing '.') to prevent NoSQL injection.
 *
 * NOTE: express-mongo-sanitize@2.2.0 is incompatible with Express 5 — it
 * attempts `req.query = sanitized` which throws TypeError because req.query
 * is a getter-only property in Express 5. This inline implementation mutates
 * the object in-place (obj[key] / delete obj[key]) and never reassigns the
 * req.query reference, making it fully compatible with Express 4 and 5.
 */

/** Recursively sanitize all string values in an object against XSS */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = xssLib(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

/**
 * Recursively sanitize MongoDB operator keys in-place.
 * Keys starting with '$' or containing '.' are renamed ($ → _, . → _)
 * so that Mongoose never interprets them as query operators.
 * Matches the previous behavior of express-mongo-sanitize({ replaceWith: '_' }).
 */
function sanitizeMongoInPlace(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (key.startsWith('$') || key.includes('.')) {
      const safeKey = key.replace(/^\$+/, '_').replace(/\./g, '_');
      console.warn(`[SEC-03] NoSQL injection attempt blocked: key "${key}" → "${safeKey}"`);
      obj[safeKey] = value;
      delete obj[key];
    }
    // Recurse into nested objects (including the potentially renamed value)
    const currentValue = obj[key.startsWith('$') || key.includes('.') ? key.replace(/^\$+/, '_').replace(/\./g, '_') : key];
    if (currentValue && typeof currentValue === 'object') {
      sanitizeMongoInPlace(currentValue);
    }
  }
}

const xssMiddleware = (req, _res, next) => {
  if (req.body)   sanitizeObject(req.body);
  if (req.query)  sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

/**
 * In-place MongoDB sanitization — no req.query reassignment.
 * Replaces express-mongo-sanitize which broke on Express 5.
 */
const mongoSanitizeMiddleware = (req, _res, next) => {
  if (req.body)   sanitizeMongoInPlace(req.body);
  if (req.query)  sanitizeMongoInPlace(req.query);
  if (req.params) sanitizeMongoInPlace(req.params);
  next();
};

module.exports = { xssMiddleware, mongoSanitizeMiddleware };
