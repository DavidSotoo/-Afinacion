const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function search() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const searchModels = ['SRX', 'CABSTAR', 'ROGUE', 'LUMINA', 'ZAFIRA', 'ALMERA', 'TSURU', 'CRAFTER'];
  
  for (const m of searchModels) {
    const results = await Vehiculo.find({ modelo: new RegExp(m, 'i') });
    console.log(`\nSearch for "${m}": found ${results.length} vehicles.`);
    results.forEach(v => {
      console.log(`  - ${v.marca} ${v.modelo} (${v.anio_inicio}-${v.anio_fin})`);
    });
  }

  await mongoose.disconnect();
}

search();
