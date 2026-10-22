// Extracts brake-pad applications from the Wagner catalog PDF using real
// (x, y) text positions and font size, instead of linear reading order.
//
// Page layout (verified on rendered pages): a centered brand header (font
// ~16, "Chevrolet (Cont.)"), left-aligned model headers (font ~12), then
// data rows (font ~8): Ini | Fin | Versiones/Especificaciones | front axle
// (FMSI, Wagner part, formulación, herrajes) | rear axle (same four).
// Continuation rows leave the year cells empty and belong to the year block
// above; a specification cell spans the continuation rows below it.
//
// Usage: node extract_wagner_catalog.js [firstPage] [lastPage]
//   writes wagner_rows_all.json next to this file.

const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

const PDF_PATH = path.join(__dirname, '../public/data/catalogo-wagner-2022-2023.pdf');

// Column start positions measured on an even page, where the "Ini." header
// sits at x=37. Odd pages are mirrored for binding and shifted right by a
// constant amount, so each page is re-anchored on its own "Ini." header.
const REFERENCE_INI_X = 37;
const COLUMNS = [
  { key: 'ini', from: 0 },
  { key: 'fin', from: 45 },
  { key: 'spec', from: 68 },
  { key: 'front_fmsi', from: 225 },
  { key: 'front_part', from: 278 },
  { key: 'front_form', from: 335 },
  { key: 'front_herr', from: 355 },
  { key: 'rear_fmsi', from: 390 },
  { key: 'rear_part', from: 440 },
  { key: 'rear_form', from: 500 },
  { key: 'rear_herr', from: 518 },
];

const PAGE_CHROME = /^(Números de Parte|AÑO|EJE DELANTERO|EJE TRASERO|Ini\.|Fin\.|FMSI|No\. de Parte|Versiones \/ Especificaciones|Formulación|Herrajes|Formulaciones:.*|Herrajes:.*)$/i;
const YEAR = /^(19|20)\d{2}$/;
const PART = /^(W[CDXSZ]\d{1,6}[A-Z]{0,3}|OEX\d{2,6}[A-Z]{0,2}|SX\d{2,6}[A-Z]{0,2})$/;

function column(x, dx) {
  let key = COLUMNS[0].key;
  for (const c of COLUMNS) if (x >= c.from + dx) key = c.key;
  return key;
}
function stripCont(s) {
  return s.replace(/\(\s*Cont\.?\s*\)/i, '').trim();
}

async function extract(firstPage, lastPage) {
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise;
  const last = Math.min(lastPage || doc.numPages, doc.numPages);

  const rows = [];
  const anomalies = [];
  let brand = null;
  let model = null;
  let ini = null, fin = null;
  // Shared by every row of the current option so a wrapped second line of
  // the spec cell (rendered below the first data row) reaches them all.
  let spec = { text: '' };

  for (let pageNum = firstPage || 1; pageNum <= last; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items
      .map(it => ({ t: it.str.trim(), x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), h: Math.round(Math.abs(it.transform[3])) }))
      .filter(it => it.t);

    // Only application-table pages carry the axle headers and the "Ini." column header.
    const iniHeader = items.find(i => i.t === 'Ini.');
    if (!iniHeader || !items.some(i => i.t === 'EJE DELANTERO') || !items.some(i => i.t === 'EJE TRASERO')) continue;
    const dx = iniHeader.x - REFERENCE_INI_X;

    const usable = items.filter(i => i.h >= 7 && !PAGE_CHROME.test(i.t));
    usable.sort((a, b) => b.y - a.y || a.x - b.x);

    const clusters = [];
    for (const it of usable) {
      const c = clusters[clusters.length - 1];
      if (c && Math.abs(c.y - it.y) <= 2) c.items.push(it);
      else clusters.push({ y: it.y, items: [it] });
    }

    for (const cl of clusters) {
      cl.items.sort((a, b) => a.x - b.x);
      const maxH = Math.max(...cl.items.map(i => i.h));
      const text = cl.items.map(i => i.t).join(' ');

      // Page number at the bottom (rendered in a large font, so it must be
      // ruled out before the font-size header checks below).
      if (cl.y < 30 && /^[\d\s]+$/.test(text)) continue;

      if (maxH >= 14) {
        const newBrand = stripCont(text).toUpperCase();
        if (newBrand !== brand) model = null;
        brand = newBrand;
        continue;
      }
      if (maxH >= 10) {
        const newModel = stripCont(text);
        // "Impala (Cont.)" atop a new page continues the same model, possibly
        // mid year-block — keep the year/spec state in that case.
        if (newModel !== model) {
          ini = fin = null;
          spec = { text: '' };
        }
        model = newModel;
        continue;
      }

      const cells = {};
      for (const it of cl.items) {
        let col = column(it.x, dx);
        let t = it.t;
        // "2003 con Paquete Policía": Fin year and spec rendered as one text run.
        if (col === 'fin' && /^(19|20)\d{2}\s+\S/.test(t)) {
          cells.fin = t.slice(0, 4);
          t = t.slice(5).trim();
          col = 'spec';
        }
        cells[col] = cells[col] ? `${cells[col]} ${t}` : t;
      }
      // Note: a part like "WX1278S" with an empty formulación column is a
      // distinct Wagner part (the variant with hardware), not "WX1278" with
      // its formulación glued on — keep the token whole.

      const hasParts = PART.test(cells.front_part || '') || PART.test(cells.rear_part || '');
      const onlySpec = cells.spec && Object.keys(cells).length === 1;

      if (onlySpec) {
        // Second line of a spec cell that wrapped: it belongs to the option above.
        spec.text = `${spec.text} ${cells.spec}`.trim();
        continue;
      }
      if (cells.ini && YEAR.test(cells.ini) && cells.fin && YEAR.test(cells.fin)) {
        ini = parseInt(cells.ini, 10);
        fin = parseInt(cells.fin, 10);
        spec = { text: cells.spec || '' };
      } else if (cells.ini || cells.fin) {
        anomalies.push({ page: pageNum, reason: 'bad-year', text });
        continue;
      } else if (cells.spec) {
        spec = { text: cells.spec }; // new option inside the same year block
      }

      if (!hasParts) {
        anomalies.push({ page: pageNum, reason: 'no-parts', text });
        continue;
      }
      if (!brand || !model || ini == null) {
        anomalies.push({ page: pageNum, reason: 'no-context', text });
        continue;
      }

      for (const axle of ['front', 'rear']) {
        const part = cells[`${axle}_part`];
        if (!part) continue;
        if (!PART.test(part)) {
          anomalies.push({ page: pageNum, reason: `bad-${axle}-part`, text });
          continue;
        }
        rows.push({
          page: pageNum,
          brand,
          model,
          anioInicio: Math.min(ini, fin),
          anioFin: Math.max(ini, fin),
          spec,
          posicion: axle === 'front' ? 'Delantero' : 'Trasero',
          wagner: part,
          fmsi: cells[`${axle}_fmsi`] || null,
          formulacion: cells[`${axle}_form`] || null,
        });
      }
    }
  }
  return { rows: rows.map(r => ({ ...r, spec: r.spec.text })), anomalies };
}

module.exports = { extract };

if (require.main === module) {
  (async () => {
    const [first, last] = process.argv.slice(2).map(n => parseInt(n, 10));
    const { rows, anomalies } = await extract(first || 1, last);
    fs.writeFileSync(path.join(__dirname, 'wagner_rows_all.json'), JSON.stringify(rows));
    const byBrand = {};
    rows.forEach(r => { byBrand[r.brand] = (byBrand[r.brand] || 0) + 1; });
    console.log(`rows: ${rows.length}, anomalies: ${anomalies.length}`);
    console.log(byBrand);
    const byReason = {};
    anomalies.forEach(a => { byReason[a.reason] = (byReason[a.reason] || 0) + 1; });
    console.log('anomalies by reason:', byReason);
    anomalies.slice(0, 25).forEach(a => console.log(`  p${a.page} ${a.reason}: ${a.text}`));
  })().catch(e => { console.error(e); process.exit(1); });
}
