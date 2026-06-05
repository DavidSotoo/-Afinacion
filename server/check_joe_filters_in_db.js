const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const PrecioUnifil = require('./models/PrecioUnifil');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // Find any records that start with JA or JA- in preciounifils
  const joeRecords = await PrecioUnifil.find({
    clave: { $regex: /^JA/i }
  }).lean();

  console.log(`Found ${joeRecords.length} JOE filter records in preciounifils:`);
  joeRecords.slice(0, 20).forEach(r => {
    console.log(`  - Clave: ${r.clave} | Precio: $${r.precio} | Desc: ${r.descripcion}`);
  });

  await mongoose.disconnect();
}

main();
