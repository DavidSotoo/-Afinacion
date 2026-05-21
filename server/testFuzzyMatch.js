require('dotenv').config();
const mongoose = require('mongoose');
const Vehiculo = require('./models/Vehiculo');
const fs = require('fs');
const path = require('path');

// Cargar catálogos de filtros
const vwFiltros = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/vw_filtros_interfil_2020_2021.json'), 'utf8')).registros || [];
const chevroletFiltros = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/interfil_chevrolet.json'), 'utf8')).CHEVROLET || [];
const fordFiltros = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/ford_interfil_catalogo.json'), 'utf8')) || [];
const hondaFiltros = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/honda_interfil_catalogo.json'), 'utf8')) || [];
const toyotaFiltros = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/toyota_interfil.json'), 'utf8')) || [];
const mazdaFiltros = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/mazda_interfil.json'), 'utf8')) || [];

function normalizeMazdaModelo(modelo) {
  const m = (modelo || '').trim();
  if (/^\d$/.test(m)) return `MAZDA ${m}`;
  const cxFull = m.match(/^CX-(\d+)$/i);
  if (cxFull) {
    const num = cxFull[1].length > 1 ? cxFull[1][0] : cxFull[1];
    return `CX${num}`;
  }
  const bMatch = m.match(/^B(\d{4})$/i);
  if (bMatch) return `B-${bMatch[1]}`;
  return m.toUpperCase();
}

function analyzeMismatch(bujia, catalog, brandName) {
  let modelNorm = bujia.modelo.toUpperCase();
  if (brandName === 'MAZDA') {
    modelNorm = normalizeMazdaModelo(bujia.modelo);
  }

  // Filtrar por modelo
  const modelMatches = catalog.filter(r => {
    let rMod = (r.modelo || '').toUpperCase();
    if (brandName === 'VW' && rMod === 'ATLANTIC GLS' && modelNorm === 'ATLANTIC') return true;
    return rMod === modelNorm;
  });

  if (modelMatches.length === 0) {
    return {
      reason: 'MODEL_NOT_FOUND',
      details: `Ningún registro en el catálogo de filtros de ${brandName} coincide con el modelo "${modelNorm}"`
    };
  }

  // Filtrar por litros (motor)
  const litBujia = parseFloat(bujia.litros);
  const motorMatches = modelMatches.filter(r => {
    if (isNaN(litBujia)) return true;
    const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
    const litRecord = match ? parseFloat(match[1]) : null;
    return litRecord === litBujia;
  });

  if (motorMatches.length === 0) {
    const motorsAvail = [...new Set(modelMatches.map(r => r.motor))];
    return {
      reason: 'MOTOR_DISPLACEMENT_MISMATCH',
      details: `Se encontró el modelo "${modelNorm}" pero con motores [${motorsAvail.join(', ')}]. Ninguno coincide con la cilindrada consultada de ${litBujia}L`
    };
  }

  // Filtrar por año
  const yearMatches = motorMatches.filter(r => {
    if (!r.anio) return true;
    const parts = r.anio.split('-');
    const start = parseInt(parts[0], 10);
    const end = parts.length === 2 ? parseInt(parts[1], 10) : start;
    if (isNaN(start) || isNaN(end)) return true;
    return !(bujia.anio_fin < start || bujia.anio_inicio > end);
  });

  if (yearMatches.length === 0) {
    const yearsAvail = motorMatches.map(r => `${r.motor}: ${r.anio}`);
    return {
      reason: 'YEAR_OUT_OF_RANGE',
      details: `Se encontró el modelo "${modelNorm}" y motor de ${litBujia}L, pero los rangos de año disponibles son [${yearsAvail.join(', ')}]. El vehículo de consulta es año ${bujia.anio_inicio}-${bujia.anio_fin}`
    };
  }

  return {
    reason: 'MATCHED_BUT_STATS_WRONG',
    details: 'Se encontró coincidencia pero por alguna razón el script principal no lo detectó como resuelto.'
  };
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const vehiculos = await Vehiculo.find({});

    const counts = {};
    const report = [];

    for (const v of vehiculos) {
      const brand = v.marca.toUpperCase();
      const kit = v.kit_afinacion || {};
      const tieneAceite = kit.filtro_aceite && kit.filtro_aceite.sku && kit.filtro_aceite.sku !== 'SELLADO';
      const tieneAire = kit.filtro_aire && kit.filtro_aire.sku;
      const tieneGasolina = kit.filtro_gasolina && kit.filtro_gasolina.sku && kit.filtro_gasolina.sku !== 'SELLADO';
      const tieneCabina = kit.filtro_cabina && kit.filtro_cabina.sku;
      const tieneAlgunaData = tieneAceite || tieneAire || tieneGasolina || tieneCabina;

      if (!tieneAlgunaData) {
        let catalog = [];
        let brandName = '';
        if (brand.includes('NISSAN')) { /* nissan tiene otra lógica */ continue; }
        else if (brand.includes('VOLKSWAGEN')) { catalog = vwFiltros; brandName = 'VW'; }
        else if (brand.includes('CHEVROLET')) { catalog = chevroletFiltros; brandName = 'CHEVROLET'; }
        else if (brand.includes('FORD')) { catalog = fordFiltros; brandName = 'FORD'; }
        else if (brand.includes('HONDA')) { catalog = hondaFiltros; brandName = 'HONDA'; }
        else if (brand.includes('TOYOTA')) { catalog = toyotaFiltros; brandName = 'TOYOTA'; }
        else if (brand.includes('MAZDA')) { catalog = mazdaFiltros; brandName = 'MAZDA'; }
        else continue;

        const analysis = analyzeMismatch(v, catalog, brandName);
        report.push({
          marca: brandName,
          modelo: v.modelo,
          motor: v.motor,
          litros: v.litros,
          anio: `${v.anio_inicio}-${v.anio_fin}`,
          reason: analysis.reason,
          details: analysis.details
        });

        counts[analysis.reason] = (counts[analysis.reason] || 0) + 1;
      }
    }

    console.log('=== RESUMEN DE CAUSAS DE NO COINCIDENCIA ===');
    console.log(JSON.stringify(counts, null, 2));

    console.log('\n=== DETALLE DE ALGUNOS CASOS CLAVE POR MARCA ===');
    const marcasDisponibles = ['VW', 'CHEVROLET', 'FORD', 'HONDA', 'TOYOTA', 'MAZDA'];
    for (const m of marcasDisponibles) {
      console.log(`\nMarca: ${m}`);
      const casosMarca = report.filter(r => r.marca === m);
      console.log(`Total sin filtros: ${casosMarca.length}`);
      
      // Mostrar primeros 3 casos de cada tipo de error
      const tiposError = ['MODEL_NOT_FOUND', 'MOTOR_DISPLACEMENT_MISMATCH', 'YEAR_OUT_OF_RANGE'];
      for (const t of tiposError) {
        const subCasos = casosMarca.filter(c => c.reason === t).slice(0, 2);
        if (subCasos.length > 0) {
          console.log(`  Tipo: ${t}`);
          subCasos.forEach(c => {
            console.log(`    * ${c.modelo} ${c.litros}L (${c.anio}): ${c.details}`);
          });
        }
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
