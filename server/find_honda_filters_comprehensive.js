const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hondas = await Vehiculo.find({ marca: /honda/i });
    const sinKit = hondas.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });

    console.log(`=== ENCONTRADOS ${sinKit.length} HONDA SIN KIT ===\n`);
    sinKit.forEach(v => {
      console.log(`ID: ${v._id} | Modelo: ${v.modelo} | Litros: ${v.litros}L | Motor: ${v.motor} | Años: ${v.anio_inicio}-${v.anio_fin}`);
    });

    // Load available filter catalog files
    const interfilPath = path.join(__dirname, '../public/data/honda_interfil_catalogo.json');
    const joePath = path.join(__dirname, '../public/data/honda_filtros_aire_JOE.json');
    const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');

    console.log('\n=== SEARCHING PDF FOR HONDA MISSING MODELS ===');
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    
    // Parse pages 40 to 50 for Honda
    const result = await parser.getText({ first: 40, last: 50 });
    result.pages.forEach((p, idx) => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const u = line.toUpperCase();
        if (u.includes('CIVIC') || u.includes('CITY') || u.includes('BR-V') || u.includes('HR-V') || u.includes('PASSPORT')) {
          console.log(`[PDF P${idx+40}] ${line.trim()}`);
        }
      });
    });

    console.log('\n=== SEARCHING HONDA INTERFIL JSON ===');
    if (fs.existsSync(interfilPath)) {
      const interfil = JSON.parse(fs.readFileSync(interfilPath, 'utf8'));
      interfil.forEach(item => {
        const str = JSON.stringify(item).toUpperCase();
        if (str.includes('BR-V') || str.includes('CITY') || str.includes('CIVIC') || str.includes('HR-V') || str.includes('PASSPORT')) {
          console.log(`[INTERFIL]`, item);
        }
      });
    }

    console.log('\n=== SEARCHING HONDA JOE JSON ===');
    if (fs.existsSync(joePath)) {
      const joe = JSON.parse(fs.readFileSync(joePath, 'utf8'));
      joe.forEach(item => {
        const str = JSON.stringify(item).toUpperCase();
        if (str.includes('BR-V') || str.includes('CITY') || str.includes('CIVIC') || str.includes('HR-V') || str.includes('PASSPORT')) {
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
