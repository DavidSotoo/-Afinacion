// Links vehicles to brake pads the store already sells, using applications
// extracted from the Wagner catalog (wagner_rows_all.json, produced by
// extract_wagner_catalog.js).
//
// Conservative by design:
//   - Only fills an axle (Delantero / Trasero) that currently has NO pad for
//     that vehicle; axles that already show pads are left untouched.
//   - Model names must match exactly (ignoring case, accents, spaces and
//     punctuation). No prefix matching: "CX-30" is not "CX-3".
//   - Only links pads that already exist as products (Balata documents) —
//     never invents a product or a price.
//   - Uses the catalog row's own year range.
//   - Reports (never auto-fixes) products whose stored axle disagrees with
//     Wagner.
//
// Adds { modelo: "<MARCA> <MODELO>", anio_inicio, anio_fin, especificaciones }
// entries to Balata.vehiculos_compatibles, the same shape the storefront
// already matches on via models/modelNormalizer.js.
//
// Usage:
//   node backfill_balatas_wagner.js            # dry run, report only
//   node backfill_balatas_wagner.js --apply    # write to MongoDB

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const Vehiculo = require('./models/Vehiculo');
const Balata = require('./models/Balata');
const { getFullModelSearchKeys } = require('./models/modelNormalizer');

const APPLY = process.argv.includes('--apply');

function compact(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
// Wagner splits most makes into a car and a truck section.
function wagnerSections(dbBrand) {
  const b = dbBrand.toUpperCase();
  return new Set([b, `${b} TRUCK`, `${b} LIGHT DUTY TRUCK`, `${b} CAR`]);
}
const overlap = (a1, a2, b1, b2) => !(a2 < b1 || a1 > b2);

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(APPLY ? 'APPLY MODE — will write to DB' : 'DRY RUN — no writes');

  const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'wagner_rows_all.json'), 'utf8'));
  const [vehicles, balatas] = await Promise.all([Vehiculo.find({}).lean(), Balata.find({})]);

  const byWagner = new Map();
  balatas.forEach(b => byWagner.set(b.sku_equivalente_wagner.toUpperCase(), b));

  // Current matches per vehicle, using the live storefront logic.
  const byKey = new Map();
  balatas.forEach(b => b.vehiculos_compatibles.forEach(vc => {
    const k = (vc.modelo || '').toUpperCase().trim();
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push({ b, vc });
  }));
  function currentAxles(v) {
    const axles = new Set();
    getFullModelSearchKeys(v.marca, v.modelo).forEach(k => (byKey.get(k) || []).forEach(({ b, vc }) => {
      if (overlap(v.anio_inicio, v.anio_fin, vc.anio_inicio, vc.anio_fin)) axles.add(b.posicion);
    }));
    return axles;
  }

  // Wagner rows indexed by section + compact model name.
  const rowIndex = new Map();
  rows.forEach(r => {
    const k = `${r.brand}|${compact(r.model)}`;
    if (!rowIndex.has(k)) rowIndex.set(k, []);
    rowIndex.get(k).push(r);
  });

  const additions = new Map(); // balata _id -> { doc, entries: Map(key -> entry) }
  const axleMismatch = new Map();
  const notInStore = new Map(); // wagner part -> count of vehicle-axles it would cover
  let vehiclesGaining = 0;
  const gainedAxles = { Delantero: 0, Trasero: 0 };
  const samples = [];
  const before = { both: 0, any: 0 };
  const after = { both: 0, any: 0 };

  for (const v of vehicles) {
    const have = currentAxles(v);
    if (have.size) before.any++;
    if (have.has('Delantero') && have.has('Trasero')) before.both++;

    const sections = wagnerSections(v.marca);
    const cm = compact(v.modelo);
    const candidates = [];
    sections.forEach(s => (rowIndex.get(`${s}|${cm}`) || []).forEach(r => candidates.push(r)));
    const yearRows = candidates.filter(r => overlap(v.anio_inicio, v.anio_fin, r.anioInicio, r.anioFin));

    const gained = new Set();
    for (const r of yearRows) {
      const doc = byWagner.get(r.wagner.toUpperCase());
      if (doc && doc.posicion !== r.posicion) {
        axleMismatch.set(doc.sku_dynamic, { doc, wagnerAxle: r.posicion, page: r.page });
      }
      if (have.has(r.posicion)) continue;
      if (!doc) {
        notInStore.set(r.wagner, (notInStore.get(r.wagner) || 0) + 1);
        continue;
      }
      if (doc.posicion !== r.posicion) continue; // never link a pad to the axle its product record disagrees with

      const entry = {
        modelo: `${v.marca} ${v.modelo}`.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(),
        anio_inicio: r.anioInicio,
        anio_fin: r.anioFin,
        especificaciones: r.spec || undefined,
      };
      const exists = doc.vehiculos_compatibles.some(vc =>
        vc.modelo === entry.modelo && vc.anio_inicio === entry.anio_inicio && vc.anio_fin === entry.anio_fin);
      if (exists) continue;
      if (!additions.has(String(doc._id))) additions.set(String(doc._id), { doc, entries: new Map() });
      additions.get(String(doc._id)).entries.set(`${entry.modelo}|${entry.anio_inicio}|${entry.anio_fin}|${entry.especificaciones || ''}`, entry);
      gained.add(r.posicion);
    }

    const final = new Set([...have, ...gained]);
    if (final.size) after.any++;
    if (final.has('Delantero') && final.has('Trasero')) after.both++;
    if (gained.size) {
      vehiclesGaining++;
      gained.forEach(a => gainedAxles[a]++);
      if (samples.length < 30) samples.push(`${v.marca} ${v.modelo} ${v.anio_inicio}-${v.anio_fin}: +${[...gained].join(' +')}`);
    }
  }

  let entriesTotal = 0;
  additions.forEach(a => { entriesTotal += a.entries.size; });

  console.log('\n=== REPORTE ===');
  console.log(`Vehículos: ${vehicles.length}`);
  console.log(`Con alguna balata: ${before.any} -> ${after.any}`);
  console.log(`Con ambos ejes:    ${before.both} -> ${after.both}`);
  console.log(`Vehículos que ganan al menos un eje: ${vehiclesGaining} (delantero +${gainedAxles.Delantero}, trasero +${gainedAxles.Trasero})`);
  console.log(`Entradas nuevas en vehiculos_compatibles: ${entriesTotal}, en ${additions.size} productos existentes`);
  console.log(`Números Wagner aplicables que la tienda NO tiene como producto: ${notInStore.size}`);
  console.log('\nMuestra:');
  samples.forEach(s => console.log('  ' + s));
  console.log(`\nProductos cuya posición guardada NO coincide con Wagner (${axleMismatch.size}) — solo se reportan:`);
  [...axleMismatch.values()].slice(0, 30).forEach(({ doc, wagnerAxle, page }) =>
    console.log(`  ${doc.sku_dynamic} (${doc.sku_equivalente_wagner}): guardada ${doc.posicion}, Wagner dice ${wagnerAxle} (pág. ${page})`));
  const topMissing = [...notInStore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('\nNúmeros Wagner más útiles que no existen como producto:');
  topMissing.forEach(([w, n]) => console.log(`  ${w}: cubriría ${n} vehículo-eje`));

  if (APPLY) {
    for (const { doc, entries } of additions.values()) {
      await Balata.updateOne({ _id: doc._id }, { $push: { vehiculos_compatibles: { $each: [...entries.values()] } } });
    }
    console.log(`\nAplicado: ${entriesTotal} entradas en ${additions.size} productos.`);
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
