const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const mazdas = await Vehiculo.find({ marca: /mazda/i });
    const sinKit = mazdas.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });

    const sinBujia = mazdas.filter(v => !v.bujia_stock?.codigo && !v.bujia_iridium_ix?.codigo && !v.bujia_g_power?.codigo && !v.bujia_v_power?.codigo);

    console.log(`=== ENCONTRADOS ${sinKit.length} MAZDA SIN KIT ===\n`);
    sinKit.forEach(v => {
      console.log(`ID: ${v._id} | Modelo: ${v.modelo} | Litros: ${v.litros}L | Motor: ${v.motor} | Años: ${v.anio_inicio}-${v.anio_fin}`);
    });

    console.log(`\n=== ENCONTRADOS ${sinBujia.length} MAZDA SIN BUJÍA ===\n`);
    sinBujia.forEach(v => {
      console.log(`ID: ${v._id} | Modelo: ${v.modelo} | Litros: ${v.litros}L | Motor: ${v.motor} | Años: ${v.anio_inicio}-${v.anio_fin}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
