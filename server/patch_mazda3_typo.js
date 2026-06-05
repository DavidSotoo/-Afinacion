const mongoose = require('mongoose');
require('dotenv').config();

const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.');

    // Find Mazda vehicles (marca: mazda, modelo: '3' or containing '3') with filtro_cabina 'FC-12733'
    const query = {
      marca: /mazda/i,
      $or: [
        { 'filtros_unifil.filtro_cabina': 'FC-12733' },
        { 'kit_afinacion.filtro_cabina.sku': 'FC-12733' }
      ]
    };

    const vehicles = await Vehiculo.find(query);
    console.log(`Found ${vehicles.length} Mazda vehicles with the FC-12733 typo.`);

    let updatedCount = 0;
    for (const v of vehicles) {
      if (v.filtros_unifil) {
        v.filtros_unifil.filtro_cabina = 'FC-12773CA';
      }
      if (v.kit_afinacion && v.kit_afinacion.filtro_cabina) {
        v.kit_afinacion.filtro_cabina.sku = 'FC-12773CA';
        v.kit_afinacion.filtro_cabina.marca = 'UNIFIL';
        v.kit_afinacion.filtro_cabina.hasData = true;
      }
      v.markModified('filtros_unifil');
      v.markModified('kit_afinacion');
      await v.save();
      updatedCount++;
    }

    console.log(`Successfully patched ${updatedCount} vehicle documents.`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
