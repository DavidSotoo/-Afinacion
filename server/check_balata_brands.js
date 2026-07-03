const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Balata = require('./models/Balata');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  const balatas = await Balata.find({});
  console.log(`Total balatas in DB: ${balatas.length}`);

  const brands = new Set();
  
  balatas.forEach(b => {
    b.vehiculos_compatibles.forEach(vc => {
      // Extract brand (usually the first word of vc.modelo)
      const firstWord = (vc.modelo || '').split(' ')[0].toUpperCase().trim();
      brands.add(firstWord);
    });
  });

  console.log('\n=== Brands represented in the Balata (vehiculos_compatibles) catalog: ===');
  console.log(Array.from(brands).sort().join(', '));

  await mongoose.disconnect();
}

main();
