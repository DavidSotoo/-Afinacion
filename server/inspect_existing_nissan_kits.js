const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const sample = await Vehiculo.findOne({ 
      marca: /nissan/i, 
      'kit_afinacion.filtro_aceite.sku': { $ne: null } 
    });
    if (sample) {
      console.log(`Modelo: ${sample.modelo} ${sample.litros}L (${sample.anio_inicio}-${sample.anio_fin})`);
      console.log('Kit:\n', JSON.stringify(sample.kit_afinacion, null, 2));
    } else {
      console.log('No sample found with non-null filtro_aceite.sku');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
