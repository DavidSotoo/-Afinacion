// Dry-run (default) / apply backfill of missing Chevrolet filters from the
// curated public/data/interfil_chevrolet.json catalog (same Interfil source
// already used for the vehicles that do have filters linked).
//
// Only fills kit_afinacion fields that are currently EMPTY — never
// overwrites existing data. Matching requires: model name prefix match
// (token-wise) + exact engine displacement (litros) match + year overlap.
// If litros is missing on either side, or multiple JSON records disagree on
// a field's value, that field is left untouched and reported for manual
// review instead of guessed.
//
// Usage:
//   node backfill_chevrolet_interfil.js            # dry run, writes report only
//   node backfill_chevrolet_interfil.js --apply     # actually updates MongoDB

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Vehiculo = require('./models/Vehiculo');

const APPLY = process.argv.includes('--apply');

function normalize(s) {
  return (s || '').toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(s) {
  return normalize(s).split(' ').filter(Boolean);
}

function isPrefixMatch(dbModelo, jsonModelo) {
  const ta = tokens(dbModelo);
  const tb = tokens(jsonModelo);
  const len = Math.min(ta.length, tb.length);
  if (len === 0) return false;
  for (let i = 0; i < len; i++) {
    if (ta[i] !== tb[i]) return false;
  }
  return true;
}

function splitAlternatives(modelo) {
  return modelo.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
}

function parseLitros(motorStr) {
  if (!motorStr) return null;
  const m = motorStr.match(/(\d+(?:\.\d+)?)\s*L/i);
  return m ? parseFloat(m[1]) : null;
}

function parseYearRange(anioStr) {
  if (!anioStr) return null;
  if (anioStr.toUpperCase() === 'ALL') return { start: 0, end: 9999 };
  const m = anioStr.match(/(\d{4})(?:-(\d{4}))?/);
  if (!m) return null;
  const start = parseInt(m[1], 10);
  const end = m[2] ? parseInt(m[2], 10) : start;
  return { start, end };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected (${APPLY ? 'APPLY MODE — will write to DB' : 'DRY RUN — no writes'})`);

  const catalogRaw = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../public/data/interfil_chevrolet.json'), 'utf8'
  ));
  const catalog = catalogRaw.CHEVROLET.map(r => ({
    ...r,
    litros: parseLitros(r.motor),
    yearRange: parseYearRange(r.anio),
  }));

  const vehicles = await Vehiculo.find({ marca: /^chevrolet$/i });
  console.log(`Chevrolet vehicles in DB: ${vehicles.length}`);

  const FIELD_MAP = {
    filtro_aceite: 'filtro_aceite',
    filtro_aire: 'filtro_aire',
    filtro_gasolina: 'filtro_gasolina',
    filtro_cabina: 'filtro_cabina',
  };

  let vehiclesWithMissing = 0;
  let vehiclesTouched = 0;
  let fieldsFilledTotal = 0;
  let fieldsAmbiguousTotal = 0;
  let vehiclesNoMatch = 0;
  const sampleFilled = [];
  const sampleAmbiguous = [];
  const sampleNoMatch = [];

  for (const v of vehicles) {
    const kit = v.kit_afinacion || {};
    const missingFields = Object.keys(FIELD_MAP).filter(f => !kit[f]?.sku);
    if (missingFields.length === 0) continue;
    vehiclesWithMissing++;

    const dbLitros = v.litros != null ? parseFloat(v.litros) : null;

    const candidates = catalog.filter(r => {
      const modelOk = splitAlternatives(r.modelo).some(alt => isPrefixMatch(v.modelo, alt));
      if (!modelOk) return false;
      if (dbLitros == null || r.litros == null) return false;
      if (Math.abs(dbLitros - r.litros) > 0.05) return false;
      if (!r.yearRange) return false;
      const yearsOverlap = !(v.anio_fin < r.yearRange.start || v.anio_inicio > r.yearRange.end);
      return yearsOverlap;
    });

    if (candidates.length === 0) {
      vehiclesNoMatch++;
      if (sampleNoMatch.length < 15) {
        sampleNoMatch.push(`${v.marca} ${v.modelo} ${dbLitros ?? '?'}L ${v.anio_inicio}-${v.anio_fin} [falta: ${missingFields.join(',')}]`);
      }
      continue;
    }

    const updates = {};
    const ambiguousFields = [];

    for (const field of missingFields) {
      const values = new Set();
      candidates.forEach(c => {
        const f = c[field];
        if (f?.sku) values.add(`${f.marca || 'Interfil'}|${f.sku}`);
      });
      if (values.size === 1) {
        const [marca, sku] = [...values][0].split('|');
        updates[field] = { marca, sku };
      } else if (values.size > 1) {
        ambiguousFields.push(field);
      }
    }

    if (Object.keys(updates).length > 0) {
      vehiclesTouched++;
      fieldsFilledTotal += Object.keys(updates).length;
      if (sampleFilled.length < 20) {
        sampleFilled.push(`${v.marca} ${v.modelo} ${dbLitros}L ${v.anio_inicio}-${v.anio_fin}: ` +
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
        sampleAmbiguous.push(`${v.marca} ${v.modelo} ${dbLitros}L ${v.anio_inicio}-${v.anio_fin}: campos con valores en conflicto -> ${ambiguousFields.join(',')}`);
      }
    }
  }

  console.log('\n=== REPORTE ===');
  console.log(`Vehículos Chevrolet con algún filtro faltante: ${vehiclesWithMissing}`);
  console.log(`Vehículos a los que se les pudo llenar al menos 1 campo: ${vehiclesTouched}`);
  console.log(`Total de campos llenados: ${fieldsFilledTotal}`);
  console.log(`Campos ambiguos (valores en conflicto entre registros del catálogo, no se tocan): ${fieldsAmbiguousTotal}`);
  console.log(`Vehículos sin ningún candidato en el catálogo Interfil: ${vehiclesNoMatch}`);

  console.log('\n--- Muestra de campos que se llenarían ---');
  sampleFilled.forEach(s => console.log(' ', s));

  console.log('\n--- Muestra de campos ambiguos (requieren revisión manual) ---');
  sampleAmbiguous.forEach(s => console.log(' ', s));

  console.log('\n--- Muestra de vehículos sin match en catálogo (litros/modelo/año no coincide) ---');
  sampleNoMatch.forEach(s => console.log(' ', s));

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
