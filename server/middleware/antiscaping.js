const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter Middleware for protecting the catalog search endpoint.
 * - Window: 5 minutes (300,000 ms)
 * - Max: 15 requests per IP
 * - Status: 429 Too Many Requests
 * - Payload: JSON error object with a descriptive message
 */
const catalogRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (300,000 ms)
  max: 150, // Limit each IP to 150 requests per windowMs
  statusCode: 429,
  message: {
    error: 'Actividad inusual detectada. Por seguridad, las consultas se han congelado temporalmente. Intenta más tarde.'
  },
  standardHeaders: true, // Return rate limit info in standard HTTP headers
  legacyHeaders: false, // Disable older X-RateLimit headers
});

module.exports = catalogRateLimiter;
