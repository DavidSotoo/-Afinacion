const mongoose = require('mongoose');
require('dotenv').config();
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB Atlas.');

    const vehiculos = await Vehiculo.find({});
    console.log(`Total de vehículos antes de la limpieza: ${vehiculos.length}`);

    const seen = new Set();
    const toDelete = [];

    for (const v of vehiculos) {
      const key = `${v.marca}-${v.modelo}-${v.anio_inicio}-${v.anio_fin}-${v.motor || ''}-${v.litros || ''}-${v.cilindros_config || ''}`.toUpperCase();
      if (seen.has(key)) {
        toDelete.push(v._id);
      } else {
        seen.add(key);
      }
    }

    console.log(`Encontrados ${toDelete.length} registros duplicados para borrar.`);

    if (toDelete.length > 0) {
      const result = await Vehiculo.deleteMany({ _id: { $in: toDelete } });
      console.log(`Eliminados exitosamente ${result.deletedCount} registros duplicados de la base de datos.`);
    } else {
      console.log('No se encontraron registros duplicados.');
    }

  } catch (err) {
    console.error('Error durante la limpieza:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  }
}

main();
