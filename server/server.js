require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const vehiculosRoutes = require('./routes/vehiculos');
const cotizacionesRoutes = require('./routes/cotizaciones');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);

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

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
