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
  
  if (pdfClean.startsWith(dbClean) || dbClean.startsWith(pdfClean)) return true;
  
  if (dbClean === 'LOBO' && (pdfClean.includes('F150') || pdfClean.includes('F 150'))) return true;
  if ((dbClean.includes('F150') || dbClean.includes('F 150')) && pdfClean === 'LOBO') return true;
  
  if (dbClean === 'FIESTA IKON' && pdfClean === 'IKON') return true;
  if (dbClean === 'IKON' && pdfClean === 'FIESTA IKON') return true;
  
  const dbNoHyphen = dbClean.replace('-', '');
  const pdfNoHyphen = pdfClean.replace('-', '');
  if (dbNoHyphen === pdfNoHyphen) return true;
  if (pdfNoHyphen.startsWith(dbNoHyphen) || dbNoHyphen.startsWith(pdfNoHyphen)) return true;

  return false;
}

function parseDisplacements(motorStr) {
  if (!motorStr) return [];
  const matches = motorStr.match(/(\d+\.\d+)/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m));
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
    const dbVehicles = await Vehiculo.find({ marca: /ford/i });
    console.log(`Total Ford vehicles in DB: ${dbVehicles.length}`);

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText({ first: 41, last: 46 });
    
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
        });
      });
    });

    console.log(`Parsed ${pdfRecords.length} records from PDF.`);

    let updatedCount = 0;

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

    console.log(`\nSuccessfully updated ${updatedCount} Ford vehicles.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  }
}

main();
