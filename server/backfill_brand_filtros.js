// Generic version of backfill_chevrolet_master.js / backfill_chevrolet_interfil.js:
// fills missing kit_afinacion fields for a given brand from two verified
// Interfil sources — a curated per-brand JSON (public/data/*_interfil_*.json
// or interfil_<brand>.json, when one exists) and the master catalog's
// vehicle-application tables (master_aceite_rows_all.json /
// master_cabina_rows_all.json, produced by extract_master_catalog.js).
//
// Same conservative rules throughout: only fills EMPTY fields, requires an
// exact engine-displacement match plus year overlap, and skips (reports)
// any field where sources disagree instead of guessing.
//
// Usage:
//   node backfill_brand_filtros.js --brand=Ford [--curated=ford_interfil_catalogo.json] [--apply]

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Vehiculo = require('./models/Vehiculo');

const args = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));

const APPLY = !!args.apply;
const BRAND = args.brand;
if (!BRAND) {
  console.error('Uso: node backfill_brand_filtros.js --brand=Ford [--curated=archivo.json] [--apply]');
  process.exit(1);
}
const BRAND_UPPER = BRAND.toUpperCase();

function normalize(s) {
  return (s || '').toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s) { return normalize(s).split(' ').filter(Boolean); }
function isPrefixMatch(a, b) {
  const ta = tokens(a), tb = tokens(b);
  const len = Math.min(ta.length, tb.length);
  if (len === 0) return false;
  for (let i = 0; i < len; i++) if (ta[i] !== tb[i]) return false;
  return true;
}
function splitAlternatives(modelo) {
  return (modelo || '').split(/[\/,]/).map(s => s.trim()).filter(Boolean);
}
function cleanSku(v) {
  if (!v) return null;
  const t = String(v).trim();
  return (!t || t === '.') ? null : t;
}
// A matched filter candidate always carries its source brand (Interfil,
// UNIFIL, ...) alongside the SKU — different catalog brands can share a
// SKU-looking string, and the price lookup is keyed by brand+SKU, so the
// brand must travel with the match, never be assumed.
function mkField(sku, marca) {
  return sku ? { sku, marca: (marca || 'Interfil').trim() } : null;
}
function fieldKey(f) {
  return `${f.marca.toUpperCase()}|${f.sku.toUpperCase()}`;
}
function parseLitros(motorStr) {
  if (!motorStr) return null;
  const m = motorStr.match(/(\d+(?:\.\d+)?)\s*L/i);
  return m ? parseFloat(m[1]) : null;
}
function parseYearRange(anioStr) {
  if (!anioStr) return null;
  if (String(anioStr).toUpperCase() === 'ALL') return { start: 0, end: 9999 };
  const m = String(anioStr).match(/(\d{4})(?:-(\d{4}))?/);
  if (!m) return null;
  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : start;
  return { start, end };
}

// Curated per-brand JSON files come in a few shapes depending on who/when
// they were built:
//   - a bare array of records
//   - { "<BRAND>": [...] }                      (e.g. interfil_chevrolet.json)
//   - { registros: [...] }                      (e.g. vw_filtros_interfil_2020_2021.json)
// and each record's filters are either { marca, sku } objects, or a flat
// { filtros: { filtro_aceite: "FO-123", ... } } map of plain SKU strings
// (e.g. volkswagen_unifil_filtros.json — UNIFIL brand, implied by the file).
function loadOneCuratedFile(filename) {
  const fp = path.join(__dirname, '../public/data', filename);
  if (!fs.existsSync(fp)) {
    console.warn(`(aviso: no existe ${filename}, se omite esa fuente)`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const list = Array.isArray(raw) ? raw
    : Array.isArray(raw.registros) ? raw.registros
    : (raw[BRAND_UPPER] || raw[BRAND] || []);

  return list.map(r => {
    const litros = parseLitros(r.motor);
    const yearRange = parseYearRange(r.anio);
    if (litros == null || !yearRange) return null;

    const flat = r.filtros; // { filtro_aceite: "FO-123", ... } plain-string shape — UNIFIL, implied by the file
    const field = (objKey, flatKey) => flat
      ? mkField(cleanSku(flat[flatKey]), 'UNIFIL')
      : mkField(cleanSku(r[objKey]?.sku), r[objKey]?.marca);

    return {
      model: r.modelo,
      litros,
      anioInicio: yearRange.start,
      anioFin: yearRange.end,
      filtro_aceite: field('filtro_aceite', 'filtro_aceite') || field('filtro_aceite_cartucho', 'filtro_aceite'),
      filtro_aire: field('filtro_aire', 'filtro_aire'),
      filtro_gasolina: field('filtro_gasolina', 'filtro_gasolina'),
      filtro_cabina: field('filtro_cabina', 'filtro_cabina'),
    };
  }).filter(Boolean);
}

function loadCuratedCandidates(filenames) {
  if (!filenames) return [];
  return String(filenames).split(',').map(s => s.trim()).filter(Boolean)
    .flatMap(loadOneCuratedFile);
}

function loadMasterCandidates() {
  const aceitePath = path.join(__dirname, 'master_aceite_rows_all.json');
  const cabinaPath = path.join(__dirname, 'master_cabina_rows_all.json');
  const aceiteRows = fs.existsSync(aceitePath) ? JSON.parse(fs.readFileSync(aceitePath, 'utf8')) : [];
  const cabinaRows = fs.existsSync(cabinaPath) ? JSON.parse(fs.readFileSync(cabinaPath, 'utf8')) : [];

  // The master catalog PDF is exclusively Interfil's own, so every field
  // extracted from it is unambiguously Interfil-branded.
  const aceite = aceiteRows
    .filter(r => r.brand === BRAND_UPPER && r.model && r.litros != null)
    .map(r => ({
      model: r.model, litros: r.litros, anioInicio: r.anioInicio, anioFin: r.anioFin,
      filtro_aceite: mkField(cleanSku(r.values.aceite_spin) || cleanSku(r.values.aceite_cart), 'Interfil'),
      filtro_aire: mkField(cleanSku(r.values.aire), 'Interfil'),
      filtro_gasolina: mkField(cleanSku(r.values.combustible), 'Interfil'),
    }));

  const cabina = cabinaRows
    .filter(r => r.brand === BRAND_UPPER && r.model && r.litros != null)
    .map(r => ({
      model: r.model, litros: r.litros, anioInicio: r.anioInicio, anioFin: r.anioFin,
      filtro_cabina: mkField(cleanSku(r.values.particulas) || cleanSku(r.values.carbon_activado), 'Interfil'),
    }));

  return { aceite, cabina };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected (${APPLY ? 'APPLY MODE — will write to DB' : 'DRY RUN — no writes'}) — marca: ${BRAND}`);

  const curated = loadCuratedCandidates(args.curated);
  const { aceite: masterAceite, cabina: masterCabina } = loadMasterCandidates();

  // aceite/aire/gasolina candidates: curated + master aceite table
  const aceiteGasPool = [...curated, ...masterAceite];
  // cabina candidates: curated (has filtro_cabina too) + master cabina table
  const cabinaPool = [...curated, ...masterCabina];

  console.log(`Candidatos — curado: ${curated.length}, maestro aceite/aire/gasolina: ${masterAceite.length}, maestro cabina: ${masterCabina.length}`);

  const vehicles = await Vehiculo.find({ marca: new RegExp(`^${BRAND}$`, 'i') });
  console.log(`Vehículos ${BRAND} en DB: ${vehicles.length}`);

  function findCandidates(pool, vehiculo) {
    const dbLitros = vehiculo.litros != null ? parseFloat(vehiculo.litros) : null;
    if (dbLitros == null) return [];
    return pool.filter(c => {
      const modelOk = splitAlternatives(c.model).some(alt => isPrefixMatch(vehiculo.modelo, alt))
        || splitAlternatives(vehiculo.modelo).some(alt => isPrefixMatch(alt, c.model));
      if (!modelOk) return false;
      if (Math.abs(dbLitros - c.litros) > 0.05) return false;
      const yearsOverlap = !(vehiculo.anio_fin < c.anioInicio || vehiculo.anio_inicio > c.anioFin);
      return yearsOverlap;
    });
  }

  let vehiclesWithMissing = 0;
  let vehiclesTouched = 0;
  let fieldsFilledTotal = 0;
  let fieldsAmbiguousTotal = 0;
  const perField = { filtro_aceite: 0, filtro_aire: 0, filtro_gasolina: 0, filtro_cabina: 0 };
  const sampleFilled = [];
  const sampleAmbiguous = [];

  for (const v of vehicles) {
    const kit = v.kit_afinacion || {};
    const missingFields = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina']
      .filter(f => !kit[f]?.sku);
    if (missingFields.length === 0) continue;
    vehiclesWithMissing++;

    const gasMatches = findCandidates(aceiteGasPool, v);
    const cabMatches = findCandidates(cabinaPool, v);

    const updates = {};
    const ambiguousFields = [];

    for (const field of missingFields) {
      const pool = field === 'filtro_cabina' ? cabMatches : gasMatches;
      const byKey = new Map();
      pool.forEach(c => { if (c[field]) byKey.set(fieldKey(c[field]), c[field]); });
      if (byKey.size === 1) {
        updates[field] = [...byKey.values()][0];
      } else if (byKey.size > 1) {
        ambiguousFields.push(field);
      }
    }

    if (Object.keys(updates).length > 0) {
      vehiclesTouched++;
      fieldsFilledTotal += Object.keys(updates).length;
      Object.keys(updates).forEach(f => perField[f]++);
      if (sampleFilled.length < 25) {
        sampleFilled.push(`${v.marca} ${v.modelo} ${v.litros}L ${v.anio_inicio}-${v.anio_fin}: ` +
          Object.entries(updates).map(([f, val]) => `${f}=${val.marca} ${val.sku}`).join(', '));
      }
      if (APPLY) {
        const setOps = {};
        for (const [field, val] of Object.entries(updates)) {
          setOps[`kit_afinacion.${field}`] = {
            tipo: kit[field]?.tipo || null,
            sku: val.sku,
            marca: val.marca,
            hasData: true,
            alternos: kit[field]?.alternos || [],
          };
        }
        await Vehiculo.updateOne({ _id: v._id }, { $set: setOps });
      }
    }

    if (ambiguousFields.length > 0) {
      fieldsAmbiguousTotal += ambiguousFields.length;
      if (sampleAmbiguous.length < 15) {
        sampleAmbiguous.push(`${v.marca} ${v.modelo} ${v.litros}L ${v.anio_inicio}-${v.anio_fin}: ${ambiguousFields.join(',')}`);
      }
    }
  }

  console.log('\n=== REPORTE ===');
  console.log(`Vehículos ${BRAND} con algún filtro faltante (antes de este paso): ${vehiclesWithMissing}`);
  console.log(`Vehículos a los que se les llenó al menos 1 campo: ${vehiclesTouched}`);
  console.log(`Total de campos llenados: ${fieldsFilledTotal}`);
  console.log(`  aceite: ${perField.filtro_aceite}, aire: ${perField.filtro_aire}, gasolina: ${perField.filtro_gasolina}, cabina: ${perField.filtro_cabina}`);
  console.log(`Campos ambiguos (valores en conflicto, no se tocan): ${fieldsAmbiguousTotal}`);

  console.log('\n--- Muestra de campos llenados (25) ---');
  sampleFilled.forEach(s => console.log(' ', s));

  console.log('\n--- Muestra de campos ambiguos ---');
  sampleAmbiguous.forEach(s => console.log(' ', s));

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
