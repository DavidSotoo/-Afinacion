require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const vehiculosRoutes    = require('./routes/vehiculos');
const cotizacionesRoutes = require('./routes/cotizaciones');
const authRoutes         = require('./routes/auth');
const checkoutRoutes     = require('./routes/checkout');
const webhooksRoutes     = require('./routes/webhooks');
const filtrosRoutes      = require('./routes/filtros');
const balatasRoutes      = require('./routes/balatas');
const bujiasRoutes       = require('./routes/bujias');

const helmet = require('helmet');

const app = express();

// Trust proxy headers (needed for rate limiters behind Cloudflare/Render)
app.set('trust proxy', 1);

// Set secure HTTP headers
// crossOriginResourcePolicy must be 'cross-origin' to allow the frontend
// (masafinacion.com) to consume API responses from this backend (onrender.com).
// Without this, mobile browsers with strict CORP enforcement block the response.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Configure CORS restrictions
// The catalog API is read-only public data. We allow any HTTPS origin in production
// so that mobile browsers (which send the real site origin) are never rejected.
// Admin-only write routes are protected by JWT; CORS alone is not a security boundary here.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const isDevelopment = process.env.NODE_ENV !== 'production';
    // In production: allow localhost (dev testing) and any HTTPS origin.
    // The data served is public catalog info — no credentials are exposed.
    if (
      isDevelopment ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.startsWith('https://')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
// Handle preflight OPTIONS requests for all routes
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Health-check endpoint — used by warm-up pings to avoid consuming API rate-limit quota
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', ts: Date.now() });
});

app.use('/api/vehiculos',    vehiculosRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/checkout',     checkoutRoutes);
app.use('/api/webhooks',     webhooksRoutes);
app.use('/api/filtros',      filtrosRoutes);
app.use('/api/balatas',      balatasRoutes);
app.use('/api/bujias',       bujiasRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("¡Conectado exitosamente a MongoDB Atlas en la nube!");
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
