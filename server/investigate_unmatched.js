const fs = require('fs');
const path = require('path');
require('dotenv').config();

const files = [
  { name: 'FILTRO DE ACEITE', path: path.join(__dirname, '../public/data/PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE ACEITE.csv') },
  { name: 'FILTRO DE AIRE', path: path.join(__dirname, '../public/data/PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE AIRE.csv') },
  { name: 'FILTRO DE CABINA', path: path.join(__dirname, '../public/data/PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE CABINA.csv') },
  { name: 'FILTRO DE GASOLINA', path: path.join(__dirname, '../public/data/PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE GASOLINA.csv') }
];

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let parts = [];
    let current = '';
    let inQuotes = false;
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);
    if (parts.length >= 3) {
      const clave = parts[0].trim().toUpperCase();
      const descripcion = parts[1].trim();
      const precioVal = parseFloat(parts[2].trim());
      if (clave && !isNaN(precioVal)) {
        records.push({ clave, descripcion, precio: precioVal });
      }
    }
  }
  return records;
}

const unmatchedNums = [
  '18050', '10436', '308', '9766', 'FO-4', '267', '5790', '11367', '10455', '2357', '3657', '2664', '99542', '12733', '10547'
];

async function main() {
  const excelRecords = [];
  for (const file of files) {
    const records = parseCsv(file.path);
    records.forEach(r => {
      excelRecords.push({ sheet: file.name, ...r });
    });
  }

  console.log('=== INVESTIGATING UNMATCHED SKUS ===\n');

  unmatchedNums.forEach(num => {
    console.log(`Searching for "${num}" in Excel keys...`);
    const matches = excelRecords.filter(r => r.clave.includes(num));
    if (matches.length > 0) {
      matches.forEach(m => {
        console.log(`  Found in ${m.sheet}: Clave: ${m.clave} | Precio: $${m.precio} | Desc: ${m.descripcion.substring(0, 80)}`);
      });
    } else {
      console.log('  No matches found.');
    }
    console.log();
  });
}

main();
