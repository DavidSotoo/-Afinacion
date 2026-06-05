const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const sample = await Vehiculo.findOne({ marca: /volkswagen/i }).lean();
  console.log('Sample vehicle from DB:', JSON.stringify(sample, null, 2));
  await mongoose.disconnect();
}

main();
