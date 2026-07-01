const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Vehiculo = require('./models/Vehiculo');
const pdfPath = path.join(__dirname, '../public/data/2025 CATALOGO page 5 listo version 14-05.pdf');

function cleanModelName(name) {
  if (!name) return '';
  return name.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchBmwModel(dbModel, pdfModel) {
  const dbClean = dbModel.toUpperCase().trim();
  const pdfClean = pdfModel.toUpperCase().trim();

  // Match Series
  if (dbClean === 'SERIE 1' && /^[1]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 2' && /^[2]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 3' && /^[3]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 4' && /^[4]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 5' && /^[5]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 6' && /^[6]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 7' && /^[7]\d{2}/.test(pdfClean)) return true;

  // Match X and Z series
  if (dbClean === 'X1' && (pdfClean === 'X1' || pdfClean.startsWith('X1 '))) return true;
  if (dbClean === 'X2' && (pdfClean === 'X2' || pdfClean.startsWith('X2 '))) return true;
  if (dbClean === 'X3' && (pdfClean === 'X3' || pdfClean.startsWith('X3 '))) return true;
  if (dbClean === 'X4' && (pdfClean === 'X4' || pdfClean.startsWith('X4 '))) return true;
  if (dbClean === 'X5' && (pdfClean === 'X5' || pdfClean.startsWith('X5 '))) return true;
  if (dbClean === 'X6' && (pdfClean === 'X6' || pdfClean.startsWith('X6 '))) return true;
  if (dbClean === 'Z4' && (pdfClean === 'Z4' || pdfClean.startsWith('Z4 '))) return true;

  return dbClean === pdfClean;
}

function buildFilterObject(sku, filterTypeLabel) {
  if (!sku) return null;
  if (sku.toUpperCase() === 'SELLADO') {
    return { tipo: filterTypeLabel, sku: 'SELLADO', marca: null, hasData: true, alternos: [] };
  }
  return { tipo: filterTypeLabel, sku, marca: 'UNIFIL', hasData: true, alternos: [] };
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const dbVehicles = await Vehiculo.find({ marca: /bmw/i });
    console.log(`Total BMW vehicles in database: ${dbVehicles.length}`);

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    
    // Parse BMW pages (11 to 14)
    const result = await parser.getText({ first: 11, last: 14 });
    const pdfRecords = [];

    result.pages.forEach((p, idx) => {
      const pageNum = idx + 11;
      const lines = p.text.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const tokens = trimmed.split(/[\s\t]+/);
        // Find year token (e.g. 2011, 2011-2012, 2008-2013)
        const yearIndex = tokens.findIndex(t => /^(19|20)\d{2}(-(19|20)\d{2})?$/.test(t));
        if (yearIndex === -1) return;
        
        // The tokens before the year index are the model (excluding "BMW" if it is the first token)
        let startIdx = 0;
        if (tokens[0].toUpperCase() === 'BMW') {
          startIdx = 1;
        }
        
        const model = tokens.slice(startIdx, yearIndex).join(' ').toUpperCase().trim();
        if (!model) return; // Skip empty model lines
        
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
          anio_inicio,
          anio_fin,
          litros,
          filters: { aceite, aire, cabina, gasolina },
          rawLine: trimmed
        });
      });
    });

    console.log(`Parsed ${pdfRecords.length} records from PDF.`);

    let updatedCount = 0;

    for (const dbV of dbVehicles) {
      const dbLitros = parseFloat(dbV.litros);
      const dbStart = dbV.anio_inicio;
      const dbEnd = dbV.anio_fin;

      const matches = pdfRecords.filter(r => {
        let modelMatches = matchBmwModel(dbV.modelo, r.model);
        if (!modelMatches) return false;

        let litrosMatches = false;
        if (r.litros !== null) {
          litrosMatches = Math.abs(r.litros - dbLitros) < 0.05;
        } else {
          litrosMatches = isNaN(dbLitros);
        }
        if (!litrosMatches) return false;

        const yearsOverlap = !(dbEnd < r.anio_inicio || dbStart > r.anio_fin);
        return yearsOverlap;
      });

      if (matches.length > 0) {
        const combinedFilters = { aceite: null, aire: null, cabina: null, gasolina: null };
        matches.forEach(m => {
          if (m.filters.aceite) combinedFilters.aceite = m.filters.aceite;
          if (m.filters.aire) combinedFilters.aire = m.filters.aire;
          if (m.filters.cabina) combinedFilters.cabina = m.filters.cabina;
          if (m.filters.gasolina) combinedFilters.gasolina = m.filters.gasolina;
        });

        let kit = dbV.kit_afinacion || {};

        if (!kit.filtro_aceite || !kit.filtro_aceite.sku) {
          kit.filtro_aceite = buildFilterObject(combinedFilters.aceite, 'Intercambiable / Cartucho');
        }
        if (!kit.filtro_aire || !kit.filtro_aire.sku) {
          kit.filtro_aire = buildFilterObject(combinedFilters.aire, 'Panel / Cilíndrico');
        }
        if (!kit.filtro_gasolina || !kit.filtro_gasolina.sku) {
          kit.filtro_gasolina = buildFilterObject(combinedFilters.gasolina, 'Línea');
        }
        if (!kit.filtro_cabina || !kit.filtro_cabina.sku) {
          kit.filtro_cabina = buildFilterObject(combinedFilters.cabina, 'Polen');
        }

        let fUnifil = dbV.filtros_unifil || {};
        fUnifil.filtro_aceite = combinedFilters.aceite || fUnifil.filtro_aceite;
        fUnifil.filtro_aire = combinedFilters.aire || fUnifil.filtro_aire;
        fUnifil.filtro_gasolina = combinedFilters.gasolina || fUnifil.filtro_gasolina;
        fUnifil.filtro_cabina = combinedFilters.cabina || fUnifil.filtro_cabina;

        await Vehiculo.updateOne({ _id: dbV._id }, { 
          $set: { 
            kit_afinacion: kit,
            filtros_unifil: fUnifil
          } 
        });
        
        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} BMW vehicles in MongoDB.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

main();
