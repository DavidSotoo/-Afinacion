const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const PrecioBujia = require('./models/PrecioBujia');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const bujias = await PrecioBujia.find({}).sort({ sku: 1 }).lean();
  console.log(`Loaded ${bujias.length} spark plug prices from DB:`);
  bujias.forEach(b => {
    console.log(`  - SKU: ${b.sku} | Price: $${b.precio_cliente} | Desc: ${b.descripcion}`);
  });
  await mongoose.disconnect();
}

main();
