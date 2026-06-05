const mongoose = require('mongoose');
require('dotenv').config();
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const vehicles = await Vehiculo.find({ marca: /volkswagen/i }).lean();
    
    console.log(`Total Volkswagen vehicles: ${vehicles.length}`);
    const summary = {};
    for (const v of vehicles) {
      const model = v.modelo.toUpperCase();
      if (!summary[model]) {
        summary[model] = [];
      }
      summary[model].push({
        litros: v.litros,
        motor: v.motor,
        anios: `${v.anio_inicio}-${v.anio_fin}`,
        hasUnifil: v.filtros_unifil && Object.keys(v.filtros_unifil).length > 0 && Object.values(v.filtros_unifil).some(x => x !== null)
      });
    }
    
    console.log('=== VOLKSWAGEN MODELS IN DB ===');
    for (const [model, list] of Object.entries(summary)) {
      console.log(`\nModel: ${model} (${list.length} variants)`);
      list.forEach(v => {
        console.log(`  - ${v.litros}L (${v.motor}) | Years: ${v.anios} | Has Unifil: ${v.hasUnifil}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
