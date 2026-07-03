const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('--- NISSAN SIN KIT ---');
    const nissans = await Vehiculo.find({ marca: /nissan/i });
    nissans.filter(v => !v.kit_afinacion?.filtro_aceite?.sku && !v.kit_afinacion?.filtro_aire?.sku)
           .forEach(v => console.log(`- ${v.modelo} ${v.litros}L (${v.anio_inicio}-${v.anio_fin}) [Motor: ${v.motor}]`));

    console.log('\n--- HONDA SIN KIT ---');
    const hondas = await Vehiculo.find({ marca: /honda/i });
    hondas.filter(v => !v.kit_afinacion?.filtro_aceite?.sku && !v.kit_afinacion?.filtro_aire?.sku)
          .forEach(v => console.log(`- ${v.modelo} ${v.litros}L (${v.anio_inicio}-${v.anio_fin}) [Motor: ${v.motor}]`));

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
