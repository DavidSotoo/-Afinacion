// Corrects Balata.posicion for products the Wagner catalog only ever lists on
// the other axle. The original importer (parse_wagner_pdf.js) defaulted every
// single-part row to "Delantero", so rear pads were stored as front pads.
//
// Only changes a product when Wagner places its part on the other axle in
// every application and never on the stored one. Parts Wagner uses on both
// axles (depending on the vehicle) are left alone and reported.
//
// Usage:
//   node fix_balatas_posicion.js           # dry run
//   node fix_balatas_posicion.js --apply   # write to MongoDB

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const Balata = require('./models/Balata');

const APPLY = process.argv.includes('--apply');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(APPLY ? 'APPLY MODE — will write to DB' : 'DRY RUN — no writes');

  const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'wagner_rows_all.json'), 'utf8'));
  const axles = new Map();
  rows.forEach(r => {
    const k = r.wagner.toUpperCase();
    if (!axles.has(k)) axles.set(k, { Delantero: 0, Trasero: 0 });
    axles.get(k)[r.posicion]++;
  });

  const balatas = await Balata.find({}).lean();
  const fixes = [];
  let mixed = 0;
  for (const b of balatas) {
    const a = axles.get(b.sku_equivalente_wagner.toUpperCase());
    if (!a) continue;
    const other = b.posicion === 'Delantero' ? 'Trasero' : 'Delantero';
    if (a[b.posicion] === 0 && a[other] > 0) fixes.push({ b, to: other, n: a[other] });
    else if (a[b.posicion] > 0 && a[other] > 0) mixed++;
  }

  console.log(`Productos a corregir: ${fixes.length}`);
  const byDir = {};
  fixes.forEach(f => { const k = `${f.b.posicion} -> ${f.to}`; byDir[k] = (byDir[k] || 0) + 1; });
  console.log(byDir);
  console.log(`Productos que Wagner usa en ambos ejes (sin cambio): ${mixed}`);

  if (APPLY) {
    const res = await Balata.bulkWrite(fixes.map(f => ({
      updateOne: { filter: { _id: f.b._id, posicion: f.b.posicion }, update: { $set: { posicion: f.to } } },
    })));
    console.log(`Modificados: ${res.modifiedCount}`);
  }
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
