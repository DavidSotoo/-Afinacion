// Fills remaining missing Chevrolet kit_afinacion fields using rows
// extracted (via extract_master_catalog.js) from the master Interfil
// catalog's vehicle-application tables — the same source already used,
// via its curated 165-record subset, for the earlier small backfill.
//
// Same conservative rules as backfill_chevrolet_interfil.js: only fills
// EMPTY fields, requires an exact engine-displacement match plus year
// overlap, and skips (reports as ambiguous) any field where matching rows
// disagree on the value, rather than guessing.
//
// Usage:
//   node backfill_chevrolet_master.js            # dry run, report only
//   node backfill_chevrolet_master.js --apply     # write to MongoDB

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
function isPrefixMatch(dbModelo, catModelo) {
  const ta = tokens(dbModelo);
  const tb = tokens(catModelo);
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
  const t = v.trim();
  return (!t || t === '.') ? null : t;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected (${APPLY ? 'APPLY MODE — will write to DB' : 'DRY RUN — no writes'})`);

  const aceiteRows = JSON.parse(fs.readFileSync(path.join(__dirname, 'chevrolet_master_aceite_rows.json'), 'utf8'));
  const cabinaRows = JSON.parse(fs.readFileSync(path.join(__dirname, 'chevrolet_master_cabina_rows.json'), 'utf8'));

  // Normalize both sources into a common candidate shape per field.
  const aceiteCandidates = aceiteRows
    .filter(r => r.model && r.litros != null)
    .map(r => ({
      model: r.model, litros: r.litros, anioInicio: r.anioInicio, anioFin: r.anioFin,
      filtro_aceite: cleanSku(r.values.aceite_spin) || cleanSku(r.values.aceite_cart),
      filtro_aire: cleanSku(r.values.aire),
      filtro_gasolina: cleanSku(r.values.combustible),
    }));

  const cabinaCandidates = cabinaRows
    .filter(r => r.model && r.litros != null)
    .map(r => ({
      model: r.model, litros: r.litros, anioInicio: r.anioInicio, anioFin: r.anioFin,
      filtro_cabina: cleanSku(r.values.particulas) || cleanSku(r.values.carbon_activado),
    }));

  const vehicles = await Vehiculo.find({ marca: /^chevrolet$/i });
  console.log(`Chevrolet vehicles in DB: ${vehicles.length}`);

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

    const aceiteMatches = findCandidates(aceiteCandidates, v);
    const cabinaMatches = findCandidates(cabinaCandidates, v);

    const updates = {};
    const ambiguousFields = [];

    for (const field of missingFields) {
      const pool = field === 'filtro_cabina' ? cabinaMatches : aceiteMatches;
      const values = new Set();
      pool.forEach(c => { if (c[field]) values.add(c[field]); });
      if (values.size === 1) {
        updates[field] = [...values][0];
      } else if (values.size > 1) {
        ambiguousFields.push(field);
      }
    }

    if (Object.keys(updates).length > 0) {
      vehiclesTouched++;
      fieldsFilledTotal += Object.keys(updates).length;
      Object.keys(updates).forEach(f => perField[f]++);
      if (sampleFilled.length < 25) {
        sampleFilled.push(`${v.marca} ${v.modelo} ${v.litros}L ${v.anio_inicio}-${v.anio_fin}: ` +
          Object.entries(updates).map(([f, sku]) => `${f}=${sku}`).join(', '));
      }
      if (APPLY) {
        const setOps = {};
        for (const [field, sku] of Object.entries(updates)) {
          setOps[`kit_afinacion.${field}`] = {
            tipo: kit[field]?.tipo || null,
            sku,
            marca: 'Interfil',
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
  console.log(`Vehículos Chevrolet con algún filtro faltante (antes de este paso): ${vehiclesWithMissing}`);
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
