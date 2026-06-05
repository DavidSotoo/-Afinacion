const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
require('dotenv').config();
const Vehiculo = require('./models/Vehiculo');

const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');

function cleanModelName(name) {
  if (!name) return '';
  return name.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbVehicles = await Vehiculo.find({ marca: /chevrolet/i });

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText({ first: 19, last: 33 });
    
    const pdfRecords = [];
    result.pages.forEach(p => {
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const tokens = trimmed.split(/[\s\t]+/);
        const yearIndex = tokens.findIndex(t => /^(19|20)\d{2}(-(19|20)\d{2})?$/.test(t));
        if (yearIndex === -1) return;
        
        const model = tokens.slice(0, yearIndex).join(' ').toUpperCase().trim();
        const yearToken = tokens[yearIndex];
        
        let anio_inicio = 0;
        let anio_fin = 0;
        if (yearToken.includes('-')) {
          const parts = yearToken.split('-');
          anio_inicio = parseInt(parts[0], 10);
          anio_fin = parseInt(parts[1], 10);
        } else {
          anio_inicio = parseInt(yearToken, 10);
          anio_fin = anio_inicio;
        }
        
        const restTokens = tokens.slice(yearIndex + 1);
        
        // Extract displacement (liters)
        let litros = null;
        const litToken = restTokens.find(t => /^\d+(\.\d+)?L?$/i.test(t) && !/^(19|20)\d{2}$/.test(t) && !/^\d+$/.test(t));
        if (litToken) {
          litros = parseFloat(litToken.replace(/L/i, ''));
        } else {
          const numToken = restTokens.find(t => /^\d+\.\d+$/.test(t));
          if (numToken) {
            litros = parseFloat(numToken);
          }
        }
        
        // Extract filters
        let aceite = null;
        let aire = null;
        let cabina = null;
        let gasolina = null;
        
        restTokens.forEach(t => {
          let cleanToken = t.trim();
          if (/^(FO|OF)-\w+/i.test(cleanToken)) {
            cleanToken = cleanToken.replace(/^OF-/i, 'FO-').replace(/\(\w+/g, '');
            aceite = cleanToken;
          } else if (/^FA-\w+/i.test(cleanToken)) {
            cleanToken = cleanToken.replace(/\(\w+/g, '');
            aire = cleanToken;
          } else if (/^(FC|F)-\w+/i.test(cleanToken)) {
            if (cleanToken.startsWith('F-') || cleanToken.startsWith('f-')) {
              cleanToken = 'FC-' + cleanToken.substring(2);
            }
            cleanToken = cleanToken.replace(/\(\w+/g, '');
            cabina = cleanToken;
          } else if (/^(FG|FD)-\w+/i.test(cleanToken)) {
            if (cleanToken.startsWith('FD-') || cleanToken.startsWith('fd-')) {
              cleanToken = 'FG-' + cleanToken.substring(3);
            }
            cleanToken = cleanToken.replace(/\(\w+/g, '');
            gasolina = cleanToken;
          }
        });
        
        pdfRecords.push({
          model,
          cleanModel: cleanModelName(model),
          anio_inicio,
          anio_fin,
          litros,
          filters: { aceite, aire, cabina, gasolina }
        });
      });
    });

    const targetModels = [
      'CHEVY', 'AVEO', 'SPARK', 'BEAT', 'SONIC', 'CRUZE', 'TRAX', 'TORNADO', 
      'CAPTIVA', 'TRACKER', 'S10', 'SILVERADO', 'SUBURBAN', 'CHEYENNE', 
      'OPTRA', 'CORSA', 'MERIVA'
    ];

    const unmatchedTargets = [];

    dbVehicles.forEach(dbV => {
      const dbModelClean = cleanModelName(dbV.modelo);
      
      // Check if it belongs to targets
      const isTarget = targetModels.some(tm => dbModelClean.includes(tm));
      if (!isTarget) return;

      const dbLitros = parseFloat(dbV.litros);
      const dbStart = dbV.anio_inicio;
      const dbEnd = dbV.anio_fin;

      const matches = pdfRecords.filter(r => {
        let modelMatches = (r.cleanModel === dbModelClean) || r.cleanModel.startsWith(dbModelClean) || dbModelClean.startsWith(r.cleanModel);
        if (!modelMatches) return false;

        const litrosMatches = (r.litros !== null && Math.abs(r.litros - dbLitros) < 0.05) || (isNaN(dbLitros) || r.litros === null);
        if (!litrosMatches) return false;

        const yearsOverlap = !(dbEnd < r.anio_inicio || dbStart > r.anio_fin);
        return yearsOverlap;
      });

      if (matches.length === 0) {
        unmatchedTargets.push({
          modelo: dbV.modelo,
          litros: dbV.litros,
          years: `${dbStart}-${dbEnd}`
        });
      }
    });

    console.log(`=== UNMATCHED TARGET MODELS: ${unmatchedTargets.length} ===`);
    console.log(JSON.stringify(unmatchedTargets, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB.');
  }
}

main();
