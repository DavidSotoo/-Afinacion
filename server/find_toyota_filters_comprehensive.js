const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const toyotas = await Vehiculo.find({ marca: /toyota/i });
    const sinKit = toyotas.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });

    const sinBujia = toyotas.filter(v => !v.bujia_stock?.codigo && !v.bujia_iridium_ix?.codigo && !v.bujia_g_power?.codigo && !v.bujia_v_power?.codigo);

    console.log(`=== ENCONTRADOS ${sinKit.length} TOYOTA SIN KIT ===\n`);
    sinKit.forEach(v => {
      console.log(`ID: ${v._id} | Modelo: ${v.modelo} | Litros: ${v.litros}L | Motor: ${v.motor} | Años: ${v.anio_inicio}-${v.anio_fin}`);
    });

    console.log(`\n=== ENCONTRADOS ${sinBujia.length} TOYOTA SIN BUJÍA ===\n`);
    sinBujia.forEach(v => {
      console.log(`ID: ${v._id} | Modelo: ${v.modelo} | Litros: ${v.litros}L | Motor: ${v.motor} | Años: ${v.anio_inicio}-${v.anio_fin}`);
    });

    // Load available filter catalog files
    const interfilPath = path.join(__dirname, '../public/data/toyota_interfil.json');
    const joePath = path.join(__dirname, '../public/data/toyota_filtros_aire_JOE.json');

    console.log('\n=== SEARCHING TOYOTA INTERFIL JSON ===');
    if (fs.existsSync(interfilPath)) {
      const interfil = JSON.parse(fs.readFileSync(interfilPath, 'utf8'));
      interfil.forEach(item => {
        const str = JSON.stringify(item).toUpperCase();
        if (str.includes('AVALON') || str.includes('AVANZA') || str.includes('MR2') || str.includes('RAIZE') || str.includes('RUSH')) {
          console.log(`[INTERFIL]`, item);
        }
      });
    }

    console.log('\n=== SEARCHING TOYOTA JOE JSON ===');
    if (fs.existsSync(joePath)) {
      const joe = JSON.parse(fs.readFileSync(joePath, 'utf8'));
      joe.forEach(item => {
        const str = JSON.stringify(item).toUpperCase();
        if (str.includes('AVALON') || str.includes('AVANZA') || str.includes('MR2') || str.includes('RAIZE') || str.includes('RUSH')) {
          console.log(`[JOE]`, item);
        }
      });
    }

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
