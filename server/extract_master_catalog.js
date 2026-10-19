// Extracts vehicle-application tables from the master Interfil catalog PDF
// using real (x,y) text positions (not linear reading order, which scrambles
// these particular pages) via pdfjs-dist directly.
//
// Exports a function usable by other scripts; also runnable standalone to
// dump the parsed Chevrolet rows as JSON for inspection.

const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

const PDF_PATH = path.join(__dirname, '../public/data/CATALOGO-INTERFIL-2020-2021.pdf');

// Column x-boundaries (start-x of each column), derived from inspecting the
// header row on multiple sample pages (9, 50 for aceite/aire/combustible;
// 156, 180 for cabina) — stable across the whole section.
const ACEITE_COLUMNS = [
  { key: 'cil', from: 0 },
  { key: 'litros', from: 75 },
  { key: 'anio', from: 127 },
  { key: 'aceite_spin', from: 168 },
  { key: 'aceite_sint', from: 229 },
  { key: 'aceite_cart', from: 317 },
  { key: 'aire', from: 404 },
  { key: 'combustible', from: 475 },
];

const CABINA_COLUMNS = [
  { key: 'cil', from: 0 },
  { key: 'litros', from: 100 },
  { key: 'anio', from: 210 },
  { key: 'particulas', from: 330 },
  { key: 'carbon_activado', from: 430 },
];

// Every brand that appears as a section header in this catalog (not just the
// ones this shop carries). Verified against the actual document — using only
// the shop's own brand list here would make a brand we don't carry (e.g.
// CHRYSLER) invisible as a section boundary, so its rows silently get
// attributed to whichever carried brand came right before it.
const ALL_CATALOG_BRANDS = [
  'ACURA', 'ALFA ROMEO', 'AUDI', 'BAIC', 'BMW', 'BUICK', 'CADILLAC', 'CHANGAN',
  'CHEVROLET', 'CHRYSLER', 'DODGE', 'EAGLE', 'FAW', 'FIAT', 'FORD', 'GEO',
  'GMC', 'HINO', 'HONDA', 'HUMMER', 'HYUNDAI', 'INFINITI', 'ISUZU', 'JAC',
  'JAGUAR', 'JEEP', 'KIA', 'LAND ROVER', 'LEXUS', 'LINCOLN', 'MAZDA',
  'MERCEDES BENZ', 'MERCURY', 'MG', 'MINI', 'MITSUBISHI', 'NISSAN',
  'OLDSMOBILE', 'PEUGEOT', 'PLYMOUTH', 'PONTIAC', 'PORSCHE', 'RAM',
  'RENAULT', 'ROVER', 'SAAB', 'SATURN', 'SEAT', 'SMART', 'SUBARU', 'SUZUKI',
  'TOYOTA', 'VAM - AMC', 'VOLKSWAGEN', 'VOLVO',
];

function bucketColumn(x, columns) {
  let col = columns[0].key;
  for (const c of columns) {
    if (x >= c.from) col = c.key;
  }
  return col;
}

function isCilToken(s) {
  return /^(\d+\s*Cil\.?|V\d{1,2}|L\d{1,2})$/i.test(s.trim());
}
function isYearToken(s) {
  return /^(19|20)\d{2}(-(19|20)\d{2})?$/.test(s.trim());
}

async function extractRows({ firstPage, lastPage, columns }) {
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const brandSet = new Set(ALL_CATALOG_BRANDS);

  const rows = []; // { brand, model, cil, litros, anioInicio, anioFin, values: {...} }
  let currentBrand = null;
  let currentModel = null;
  const unclassified = [];

  for (let pageNum = firstPage; pageNum <= lastPage; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items
      .map(it => ({ text: it.str, x: Math.round(it.transform[4]), y: Math.round(it.transform[5]) }))
      .filter(it => it.text.trim());

    // Cluster into rows by y (descending = top to bottom)
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const pageRows = [];
    let cur = null;
    for (const it of sorted) {
      if (!cur || Math.abs(cur.y - it.y) > 3) {
        cur = { y: it.y, items: [] };
        pageRows.push(cur);
      }
      cur.items.push(it);
    }
    // within-row items already roughly x-sorted since we sorted by (y desc, x asc) before clustering;
    // re-sort defensively
    pageRows.forEach(r => r.items.sort((a, b) => a.x - b.x));

    for (const row of pageRows) {
      const texts = row.items.map(i => i.text.trim());
      // Header/title rows & table column headers to ignore outright
      // Section running-title text repeated on every page of its table
      // (e.g. "Cabina" atop every page of the cabin-filter application
      // table) — never a vehicle model, so it must never reset currentModel.
      if (texts.some(t => /^(Aplicaciones|Cil \/ Cyl|Año \/ Year|CATÁLOGO|INTERFIL|Aceite|Aire|Combustible|Cabina)$/i.test(t))) continue;
      // Bare page number in the corner — matched against the actual page being
      // parsed (not just "any lone digit string") so a numeric model/trim
      // label like "2500" or "3500" is never mistaken for a page number.
      if (row.items.length === 1 && texts[0] === String(pageNum)) continue;

      const hasCil = row.items.some(i => isCilToken(i.text));
      const hasYear = row.items.some(i => isYearToken(i.text));

      if (hasCil && hasYear) {
        // Data row
        const values = {};
        for (const col of columns) values[col.key] = null;
        for (const it of row.items) {
          const col = bucketColumn(it.x, columns);
          values[col] = values[col] ? `${values[col]} ${it.text}` : it.text;
        }
        const cil = values.cil;
        const litrosMatch = (values.litros || '').match(/(\d+(?:\.\d+)?)\s*L/i);
        const litros = litrosMatch ? parseFloat(litrosMatch[1]) : null;
        const yearMatch = (values.anio || '').match(/(\d{4})(?:-(\d{4}))?/);
        if (!yearMatch) continue;
        const anioInicio = parseInt(yearMatch[1], 10);
        const anioFin = yearMatch[2] ? parseInt(yearMatch[2], 10) : anioInicio;

        rows.push({
          brand: currentBrand,
          model: currentModel,
          cil,
          litros,
          anioInicio,
          anioFin,
          values,
        });
      } else if (row.items.length <= 3) {
        // Likely a brand or model label row
        const label = texts.join(' ').trim().toUpperCase();
        if (!label) continue;
        if (brandSet.has(label)) {
          currentBrand = label;
          currentModel = null;
        } else {
          currentModel = texts.join(' ').trim();
        }
      } else {
        unclassified.push({ page: pageNum, texts });
      }
    }
  }

  return { rows, unclassified };
}

module.exports = { extractRows, ACEITE_COLUMNS, CABINA_COLUMNS, ALL_CATALOG_BRANDS, bucketColumn };

if (require.main === module) {
  (async () => {
    const { rows, unclassified } = await extractRows({
      firstPage: 1, lastPage: 82, columns: ACEITE_COLUMNS,
    });
    const chevRows = rows.filter(r => r.brand === 'CHEVROLET');
    console.log(`Total rows parsed (aceite/aire/combustible section): ${rows.length}`);
    console.log(`Chevrolet rows: ${chevRows.length}`);
    console.log(`Unclassified (multi-item, non-data) rows: ${unclassified.length}`);
    console.log('\nSample Chevrolet rows:');
    chevRows.slice(0, 15).forEach(r => console.log(JSON.stringify(r)));
    console.log('\nSample unclassified rows (first 10):');
    unclassified.slice(0, 10).forEach(r => console.log(JSON.stringify(r)));

    fs.writeFileSync(
      path.join(__dirname, 'chevrolet_master_aceite_rows.json'),
      JSON.stringify(chevRows, null, 2)
    );
    console.log('\nSaved chevrolet_master_aceite_rows.json');
  })().catch(err => { console.error(err); process.exit(1); });
}
