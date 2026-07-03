const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a DB.\n');

    const marcas = ['HONDA', 'NISSAN', 'TOYOTA', 'MAZDA', 'VOLKSWAGEN', 'SEAT', 'DODGE', 'MITSUBISHI', 'AUDI', 'BMW', 'CHEVROLET', 'FORD'];

    for (const marca of marcas) {
      const vehiculos = await Vehiculo.find({ marca: new RegExp(`^${marca}$`, 'i') });
      const sinFiltros = vehiculos.filter(v => {
        const kit = v.kit_afinacion || {};
        const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
        const fAire = kit.filtro_aire && kit.filtro_aire.sku;
        return !fAceite && !fAire;
      });

      console.log(`Marca: ${marca.padEnd(12)} | Total en DB: ${String(vehiculos.length).padEnd(4)} | Sin Kit/Filtros: ${sinFiltros.length}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
