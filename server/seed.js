require('dotenv').config();
const mongoose = require('mongoose');
const vehiculosRoutes = require('./routes/vehiculos');

async function seed() {
  try {
    console.log('⚡ Conectando a MongoDB Atlas para iniciar la sincronización de catálogos...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión establecida con éxito.');

    const syncFunctions = [
      { name: 'VW Filters', fn: vehiculosRoutes.syncVwFiltersInDatabase },
      { name: 'Chevrolet Filters', fn: vehiculosRoutes.syncChevroletFiltersInDatabase },
      { name: 'Ford Filters', fn: vehiculosRoutes.syncFordFiltersInDatabase },
      { name: 'Honda Filters', fn: vehiculosRoutes.syncHondaFiltersInDatabase },
      { name: 'Toyota Filters', fn: vehiculosRoutes.syncToyotaFiltersInDatabase },
      { name: 'Mazda Filters', fn: vehiculosRoutes.syncMazdaFiltersInDatabase },
      { name: 'Nissan Aire Joe', fn: vehiculosRoutes.syncNissanAireJoe },
      { name: 'Nissan Unifil', fn: vehiculosRoutes.syncNissanUnifil },
      { name: 'Volkswagen Unifil', fn: vehiculosRoutes.syncVolkswagenUnifil },
      { name: 'VW Aire Joe', fn: vehiculosRoutes.syncVWAireJoe },
      { name: 'Chevrolet Aire Joe', fn: vehiculosRoutes.syncChevroletAireJoe },
      { name: 'Ford Aire Joe', fn: vehiculosRoutes.syncFordAireJoe },
      { name: 'Honda Aire Joe', fn: vehiculosRoutes.syncHondaAireJoe },
      { name: 'Toyota Aire Joe', fn: vehiculosRoutes.syncToyotaAireJoe },
      { name: 'Mazda Aire Joe', fn: vehiculosRoutes.syncMazdaAireJoe }
    ];

    for (const sync of syncFunctions) {
      if (typeof sync.fn === 'function') {
        console.log(`⏳ Sincronizando: ${sync.name}...`);
        await sync.fn();
        console.log(`   └─ Sincronizado: ${sync.name}`);
      } else {
        console.warn(`⚠️ Función no encontrada para: ${sync.name}`);
      }
    }

    console.log('\n🎉 Sincronización de catálogos completada con éxito.');
  } catch (err) {
    console.error('❌ Error durante la sincronización:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión con MongoDB cerrada.');
    process.exit(0);
  }
}

seed();
