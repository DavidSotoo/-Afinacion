const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const vws = await Vehiculo.find({
    marca: /volkswagen/i,
    litros: 1.8,
    aspiracion: 'T'
  }).lean();

  console.log(`Found ${vws.length} vehicles matching VW 1.8L T:`);
  vws.forEach(v => {
    console.log(JSON.stringify({
      modelo: v.modelo,
      anio_inicio: v.anio_inicio,
      anio_fin: v.anio_fin,
      motor: v.motor,
      kit_afinacion: v.kit_afinacion,
      filtros_unifil: v.filtros_unifil
    }, null, 2));
  });

  await mongoose.disconnect();
}

main();
