const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const nissans = await Vehiculo.find({ marca: /nissan/i });
    const sinKit = nissans.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });

    console.log(`=== ENCONTRADOS ${sinKit.length} NISSAN SIN KIT ===\n`);

    // Load available filter catalog files
    const unifilPath = path.join(__dirname, '../public/data/nissan_unifil_filtros.json');
    const joePath = path.join(__dirname, '../public/data/nissan_filtros_aire_JOE.json');

    let unifilData = [];
    let joeData = [];

    if (fs.existsSync(unifilPath)) unifilData = JSON.parse(fs.readFileSync(unifilPath, 'utf8'));
    if (fs.existsSync(joePath)) joeData = JSON.parse(fs.readFileSync(joePath, 'utf8'));

    console.log(`Registros Unifil Nissan: ${unifilData.length}`);
    console.log(`Registros JOE Nissan: ${joeData.length}\n`);

    sinKit.forEach(v => {
      console.log(`ID: ${v._id} | Modelo: ${v.modelo} | Litros: ${v.litros}L | Motor: ${v.motor} | Años: ${v.anio_inicio}-${v.anio_fin}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
