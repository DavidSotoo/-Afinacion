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

// Set secure HTTP headers
app.use(helmet());

// Configure CORS restrictions
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

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
