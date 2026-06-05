const mongoose = require('mongoose');
require('dotenv').config();
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB.');

    const vehicles = await Vehiculo.find({ marca: /honda/i });
    console.log(`Total Honda vehicles in DB: ${vehicles.length}`);

    const uniqueModels = new Set();
    const modelsInfo = {};

    vehicles.forEach(v => {
      const model = v.modelo.toUpperCase();
      uniqueModels.add(model);
      
      if (!modelsInfo[model]) {
        modelsInfo[model] = {
          count: 0,
          years: new Set(),
          engines: new Set()
        };
      }
      modelsInfo[model].count++;
      modelsInfo[model].years.add(`${v.anio_inicio}-${v.anio_fin}`);
      modelsInfo[model].engines.add(`${v.litros}L (${v.motor})`);
    });

    console.log('\n=== UNIQUE HONDA MODELS IN DB ===');
    console.log(Array.from(uniqueModels).sort());

    console.log('\n=== ENGINES FOR MAIN HONDA MODELS ===');
    const mainModels = ['ACCORD', 'CIVIC', 'CR-V', 'HR-V', 'CITY', 'FIT', 'ODYSSEY', 'PILOT', 'RIDGELINE'];
    mainModels.forEach(m => {
      const dbMatch = Object.keys(modelsInfo).filter(k => k.includes(m));
      if (dbMatch.length > 0) {
        console.log(`\nMatches for "${m}":`);
        dbMatch.forEach(k => {
          const info = modelsInfo[k];
          console.log(`  - DB Model: "${k}" (Count: ${info.count})`);
          console.log(`    Engines: ${Array.from(info.engines).join(', ')}`);
        });
      }
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB.');
  }
}

main();
