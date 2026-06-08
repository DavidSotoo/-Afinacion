require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const vehiculosRoutes    = require('./routes/vehiculos');
const cotizacionesRoutes = require('./routes/cotizaciones');
const authRoutes         = require('./routes/auth');
const checkoutRoutes     = require('./routes/checkout');
const webhooksRoutes     = require('./routes/webhooks');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/vehiculos',    vehiculosRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/checkout',     checkoutRoutes);
app.use('/api/webhooks',     webhooksRoutes);

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
