const mongoose = require('mongoose');
require('dotenv').config();
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const vehicles = await Vehiculo.find({});
    
    // Group by brand
    const stats = {};
    for (const v of vehicles) {
      const brand = v.marca.toUpperCase();
      if (!stats[brand]) {
        stats[brand] = {
          total: 0,
          conUnifil: 0
        };
      }
      stats[brand].total++;
      
      // Check if filtros_unifil has data
      const hasUnifil = v.filtros_unifil && Object.keys(v.filtros_unifil).length > 0 && 
                        Object.values(v.filtros_unifil).some(val => val !== null);
      if (hasUnifil) {
        stats[brand].conUnifil++;
      }
    }
    
    console.log('=== COBERTURA DE FILTROS UNIFIL POR MARCA EN ATLAS ===');
    console.log(String.prototype.padEnd ? 'Marca'.padEnd(20) + 'Total'.padStart(10) + 'Con UNIFIL'.padStart(15) + 'Cobertura'.padStart(12) : 'Marca, Total, Con UNIFIL, Cobertura');
    
    for (const [brand, data] of Object.entries(stats)) {
      const percentage = ((data.conUnifil / data.total) * 100).toFixed(1) + '%';
      if (String.prototype.padEnd) {
        console.log(brand.padEnd(20) + String(data.total).padStart(10) + String(data.conUnifil).padStart(15) + percentage.padStart(12));
      } else {
        console.log(`${brand}: ${data.total} total, ${data.conUnifil} con UNIFIL (${percentage})`);
      }
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
