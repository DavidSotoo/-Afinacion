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
    
    // Sincronizar de inmediato los registros de VW, Chevrolet, Ford, Honda, Toyota y Mazda en MongoDB
    if (typeof vehiculosRoutes.syncVwFiltersInDatabase === 'function') {
      vehiculosRoutes.syncVwFiltersInDatabase();
    }
    if (typeof vehiculosRoutes.syncChevroletFiltersInDatabase === 'function') {
      vehiculosRoutes.syncChevroletFiltersInDatabase();
    }
    if (typeof vehiculosRoutes.syncFordFiltersInDatabase === 'function') {
      vehiculosRoutes.syncFordFiltersInDatabase();
    }
    if (typeof vehiculosRoutes.syncHondaFiltersInDatabase === 'function') {
      vehiculosRoutes.syncHondaFiltersInDatabase();
    }
    if (typeof vehiculosRoutes.syncToyotaFiltersInDatabase === 'function') {
      vehiculosRoutes.syncToyotaFiltersInDatabase();
    }
    if (typeof vehiculosRoutes.syncMazdaFiltersInDatabase === 'function') {
      vehiculosRoutes.syncMazdaFiltersInDatabase();
    }
    if (typeof vehiculosRoutes.syncNissanAireJoe === 'function') {
      vehiculosRoutes.syncNissanAireJoe();
    }
    if (typeof vehiculosRoutes.syncNissanUnifil === 'function') {
      vehiculosRoutes.syncNissanUnifil();
    }
    if (typeof vehiculosRoutes.syncVolkswagenUnifil === 'function') {
      vehiculosRoutes.syncVolkswagenUnifil();
    }
    if (typeof vehiculosRoutes.syncVWAireJoe === 'function') {
      vehiculosRoutes.syncVWAireJoe();
    }
    if (typeof vehiculosRoutes.syncChevroletAireJoe === 'function') {
      vehiculosRoutes.syncChevroletAireJoe();
    }
    if (typeof vehiculosRoutes.syncFordAireJoe === 'function') {
      vehiculosRoutes.syncFordAireJoe();
    }
    if (typeof vehiculosRoutes.syncHondaAireJoe === 'function') {
      vehiculosRoutes.syncHondaAireJoe();
    }
    if (typeof vehiculosRoutes.syncToyotaAireJoe === 'function') {
      vehiculosRoutes.syncToyotaAireJoe();
    }
    if (typeof vehiculosRoutes.syncMazdaAireJoe === 'function') {
      vehiculosRoutes.syncMazdaAireJoe();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
