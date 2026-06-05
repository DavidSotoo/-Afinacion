const mongoose = require('mongoose');
require('dotenv').config();

const Vehiculo = require('./models/Vehiculo');

const targetSkus = [
  'FG-18050', 'FA-10436', 'FG-308', 'FG-9766', 'FO-4', 'FG-267', 'FA-5790', 
  'FA-11367', 'FA-10455', 'FC-2357', 'FO-3657', 'FA-2664', 'FA-99542', 'FC-12733', 'FA-10547/CA'
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    for (const sku of targetSkus) {
      // Find vehicles where filters_unifil has this sku or kit_afinacion has this sku
      const vehicles = await Vehiculo.find({
        $or: [
          { 'filtros_unifil.filtro_aceite': sku },
          { 'filtros_unifil.filtro_aire': sku },
          { 'filtros_unifil.filtro_cabina': sku },
          { 'filtros_unifil.filtro_gasolina': sku },
          { 'kit_afinacion.filtro_aceite.sku': sku },
          { 'kit_afinacion.filtro_aire.sku': sku },
          { 'kit_afinacion.filtro_cabina.sku': sku },
          { 'kit_afinacion.filtro_gasolina.sku': sku }
        ]
      }).lean();

      if (vehicles.length > 0) {
        console.log(`Clave: ${sku} | Used in ${vehicles.length} vehicles:`);
        vehicles.forEach(v => {
          console.log(`  - DB ID: ${v._id} | Vehicle: ${v.marca} ${v.modelo} ${v.litros}L (${v.anio_inicio}-${v.anio_fin})`);
          console.log(`    Filtros Unifil:`, JSON.stringify(v.filtros_unifil));
          console.log(`    Kit Afinacion:`, JSON.stringify(v.kit_afinacion).substring(0, 150) + '...');
        });
      } else {
        console.log(`Clave: ${sku} | NOT found in any vehicle document.`);
      }
      console.log();
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
