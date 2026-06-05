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
    const dbVehicles = await Vehiculo.find({ marca: /nissan/i }).lean();
    console.log(`Loaded ${dbVehicles.length} Nissan vehicles from DB.`);

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    
    // Nissan is on pages 60-63 (start page is 60, but let's parse 60 to 63)
    const result = await parser.getText({ first: 60, last: 63 });
    console.log(`Parsed pages count: ${result.pages.length}`);

    const pdfRecords = [];
    result.pages.forEach((p, idx) => {
      const pageNum = idx + 60;
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const tokens = trimmed.split(/[\s\t]+/);
        const yearIndex = tokens.findIndex(t => /^(19|20)\d{2}(-(19|20)\d{2})?$/.test(t));
        if (yearIndex === -1) return;
        
        const rawModel = tokens.slice(0, yearIndex).join(' ').toUpperCase().trim();
        const yearToken = tokens[yearIndex];
        
        // Skip header lines or other brand titles if any
        if (rawModel === 'MODELO' || rawModel === 'MODEL') return;
        
        // Clean model name from brand prefix e.g. "NISSAN ALMERA" -> "ALMERA"
        let model = rawModel;
        if (model.startsWith('NISSAN ')) {
          model = model.replace(/^NISSAN\s+/, '');
        }

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
        
        // Extract cylinders
        let cilindros = '';
        const cylToken = restTokens.find(t => /^(L[3456]|V[68])$/i.test(t));
        if (cylToken) {
          cilindros = cylToken.toUpperCase();
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
          cilindros,
          filters: { aceite, aire, cabina, gasolina },
          rawLine: trimmed
        });
      });
    });

    console.log(`Parsed ${pdfRecords.length} records from PDF.`);

    // Perform match
    let matchedCount = 0;
    const matchedList = [];
    const unmatchedList = [];

    for (const dbV of dbVehicles) {
      const dbModelClean = cleanModelName(dbV.modelo);
      const dbLitros = parseFloat(dbV.litros);
      const dbStart = dbV.anio_inicio;
      const dbEnd = dbV.anio_fin;

      // Matching rules
      const matches = pdfRecords.filter(r => {
        // Model matching:
        let modelMatches = false;
        
        // Handle TSURU (PDF has "TSURU I", "TSURU II", "TSURU III" or just "TSURU")
        // DB has "TSURU"
        if (dbModelClean === 'TSURU') {
          modelMatches = r.cleanModel.startsWith('TSURU');
        } else if (dbModelClean === 'TIIDA') {
          modelMatches = r.cleanModel === 'TIDA';
        } else if (dbModelClean === 'NV350 URVAN' || dbModelClean === 'URVAN') {
          modelMatches = r.cleanModel.includes('URVAN');
        } else if (dbModelClean === 'Z') {
          modelMatches = r.cleanModel === 'Z';
        } else if (dbModelClean === '370Z NISMO') {
          modelMatches = r.cleanModel.includes('370Z');
        } else if (dbModelClean === 'SENTRA NISMO') {
          modelMatches = r.cleanModel === 'SENTRA';
        } else if (dbModelClean === 'KICKS E-POWER') {
          modelMatches = r.cleanModel === 'KICKS';
        } else if (dbModelClean === 'X-TRAIL E-POWER') {
          modelMatches = r.cleanModel.includes('XTRAIL') || r.cleanModel.includes('X-TRAIL');
        } else {
          modelMatches = (r.cleanModel === dbModelClean) || 
                         r.cleanModel.startsWith(dbModelClean) || 
                         dbModelClean.startsWith(r.cleanModel) ||
                         r.cleanModel.replace(/\s/g, '') === dbModelClean.replace(/\s/g, '');
        }

        if (!modelMatches) return false;

        // Litros matching:
        const litrosMatches = (r.litros !== null && Math.abs(r.litros - dbLitros) < 0.05) || (isNaN(dbLitros) || r.litros === null);
        if (!litrosMatches) return false;

        // Year overlap:
        const yearsOverlap = !(dbEnd < r.anio_inicio || dbStart > r.anio_fin);
        return yearsOverlap;
      });

      if (matches.length > 0) {
        matchedCount++;
        matchedList.push({
          vehicle: `${dbV.modelo} ${dbV.litros}L (${dbV.anio_inicio}-${dbV.anio_fin})`,
          matches: matches.map(m => `${m.model} ${m.litros}L (${m.anio_inicio}-${m.anio_fin}) [FO:${m.filters.aceite} FA:${m.filters.aire} FC:${m.filters.cabina} FG:${m.filters.gasolina}]`)
        });
      } else {
        unmatchedList.push(dbV);
      }
    }

    console.log(`\n=== MATCHING RESULTS: ${matchedCount} / ${dbVehicles.length} (${((matchedCount/dbVehicles.length)*100).toFixed(1)}%) ===`);
    
    console.log('\n--- SAMPLE MATCHES (FIRST 15) ---');
    matchedList.slice(0, 15).forEach(m => {
      console.log(`DB: ${m.vehicle}`);
      console.log(`  PDF matches: ${m.matches.join(' | ')}`);
    });

    console.log('\n--- UNMATCHED DB VEHICLES ---');
    unmatchedList.forEach(u => {
      console.log(`  - ${u.modelo} ${u.litros}L (${u.motor}) [${u.anio_inicio}-${u.anio_fin}]`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
