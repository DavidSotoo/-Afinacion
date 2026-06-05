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

function matchModel(dbModel, pdfModel) {
  const dbClean = cleanModelName(dbModel);
  const pdfClean = cleanModelName(pdfModel);
  
  if (dbClean === pdfClean) return true;
  
  // Prefix / Suffix matching
  if (pdfClean.startsWith(dbClean) || dbClean.startsWith(pdfClean)) return true;

  return false;
}

function parseDisplacements(motorStr) {
  if (!motorStr) return [];
  const matches = motorStr.match(/(\d+\.\d+)/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m));
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbVehicles = await Vehiculo.find({ marca: /mazda/i });
    console.log(`Total Mazda vehicles in DB: ${dbVehicles.length}`);

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText({ first: 55, last: 56 });
    
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
        
        const displacementString = restTokens.find(t => /\d+\.\d+L?/i.test(t));
        const litrosList = parseDisplacements(displacementString);
        
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
          anio_inicio,
          anio_fin,
          litrosList,
          filters: { aceite, aire, cabina, gasolina },
          rawLine: trimmed
        });
      });
    });

    console.log(`Parsed ${pdfRecords.length} records from PDF.`);

    let matchedCount = 0;
    const matchDetails = [];
    const unmatched = [];

    for (const dbV of dbVehicles) {
      const dbModelClean = cleanModelName(dbV.modelo);
      const dbLitros = parseFloat(dbV.litros);
      const dbStart = dbV.anio_inicio;
      const dbEnd = dbV.anio_fin;

      const matches = pdfRecords.filter(r => {
        let modelMatches = matchModel(dbV.modelo, r.model);
        if (!modelMatches) return false;

        let litrosMatches = false;
        if (r.litrosList.length > 0) {
          litrosMatches = r.litrosList.some(v => Math.abs(v - dbLitros) < 0.05);
        } else {
          litrosMatches = isNaN(dbLitros);
        }
        if (!litrosMatches) return false;

        const yearsOverlap = !(dbEnd < r.anio_inicio || dbStart > r.anio_fin);
        return yearsOverlap;
      });

      if (matches.length > 0) {
        matchedCount++;
        const combinedFilters = { aceite: null, aire: null, cabina: null, gasolina: null };
        matches.forEach(m => {
          if (m.filters.aceite) combinedFilters.aceite = m.filters.aceite;
          if (m.filters.aire) combinedFilters.aire = m.filters.aire;
          if (m.filters.cabina) combinedFilters.cabina = m.filters.cabina;
          if (m.filters.gasolina) combinedFilters.gasolina = m.filters.gasolina;
        });

        matchDetails.push({
          vehicleId: dbV._id,
          modelo: dbV.modelo,
          litros: dbV.litros,
          years: `${dbStart}-${dbEnd}`,
          filters: combinedFilters,
          pdfSource: matches.map(m => `${m.model} (${m.anio_inicio}-${m.anio_fin})`).join(' | ')
        });
      } else {
        unmatched.push({
          modelo: dbV.modelo,
          litros: dbV.litros,
          years: `${dbStart}-${dbEnd}`
        });
      }
    }

    console.log(`\n=== MATCHING RESULTS ===`);
    console.log(`Matched: ${matchedCount} / ${dbVehicles.length} (${((matchedCount/dbVehicles.length)*100).toFixed(1)}%)`);
    console.log(`Unmatched: ${unmatched.length}`);
    console.log(JSON.stringify(unmatched.slice(0, 30), null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB.');
  }
}

main();
