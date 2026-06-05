const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in env.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');
  const count = await Vehiculo.countDocuments({ marca: /seat/i });
  console.log(`Number of SEAT vehicles in DB: ${count}`);
  const samples = await Vehiculo.find({ marca: /seat/i }).limit(10).lean();
  console.log('Sample SEAT vehicles in DB:', JSON.stringify(samples, null, 2));
  await mongoose.disconnect();
}

main();
