const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const PrecioUnifil = require('./models/PrecioUnifil');
const Vehiculo = require('./models/Vehiculo');

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
      const precioVal = parseFloat(parts[2].trim());
      if (clave && !isNaN(precioVal)) {
        records.push({ clave, precio: precioVal });
      }
    }
  }
  return records;
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Load Excel keys
    const excelKeys = new Set();
    const excelPriceMap = new Map();
    for (const file of files) {
      const records = parseCsv(file.path);
      records.forEach(r => {
        excelKeys.add(r.clave);
        excelPriceMap.set(r.clave, r.precio);
      });
    }

    // Load active SKUs from DB
    const vehicles = await Vehiculo.find({}).lean();
    const activeUnifilClaves = new Set();
    vehicles.forEach(v => {
      if (v.filtros_unifil) {
        Object.values(v.filtros_unifil).forEach(sku => {
          if (sku && sku !== 'SELLADO') {
            activeUnifilClaves.add(sku.toUpperCase().trim());
          }
        });
      }
      if (v.kit_afinacion) {
        Object.keys(v.kit_afinacion).forEach(key => {
          const filt = v.kit_afinacion[key];
          if (filt && filt.marca === 'UNIFIL' && filt.sku && filt.sku !== 'SELLADO') {
            activeUnifilClaves.add(filt.sku.toUpperCase().trim());
          }
        });
      }
    });

    const dbPrices = await PrecioUnifil.find({}).lean();
    const dbPriceMap = new Map();
    dbPrices.forEach(p => {
      dbPriceMap.set(p.clave.toUpperCase(), p);
    });

    console.log('=== ANALYSIS OF MISSING PRICE RESOLUTION ===\n');

    const missingUnifil = [];
    activeUnifilClaves.forEach(sku => {
      if (!dbPriceMap.has(sku)) {
        missingUnifil.push(sku);
      }
    });

    console.log(`Found ${missingUnifil.length} active vehicle SKUs that have no direct price in DB.\n`);

    missingUnifil.forEach(sku => {
      // 1. Try removing slash (e.g. FC-12552/CA -> FC-12552CA)
      let resolved = false;
      let reason = '';
      
      const noSlash = sku.replace('/', '');
      if (dbPriceMap.has(noSlash)) {
        resolved = true;
        reason = `Matches DB price as "${noSlash}" (Price: $${dbPriceMap.get(noSlash).precio})`;
      } else if (excelPriceMap.has(noSlash)) {
        resolved = true;
        reason = `Matches Excel price as "${noSlash}" (Price: $${excelPriceMap.get(noSlash)})`;
      }
      
      // 2. Try removing trailing /CA and matching the base filter
      if (!resolved && sku.endsWith('/CA')) {
        const baseFilter = sku.replace('/CA', '');
        if (dbPriceMap.has(baseFilter)) {
          resolved = true;
          reason = `Matches DB base filter "${baseFilter}" (Price: $${dbPriceMap.get(baseFilter).precio})`;
        } else if (excelPriceMap.has(baseFilter)) {
          resolved = true;
          reason = `Matches Excel base filter "${baseFilter}" (Price: $${excelPriceMap.get(baseFilter)})`;
        }
      }

      // 3. Try suffixing 'N' or 'STK' or 'R' or cleaning up
      if (!resolved) {
        // Try suffixing 'N' (e.g., FA-3588 -> FA-3588N)
        const withN = sku + 'N';
        if (dbPriceMap.has(withN)) {
          resolved = true;
          reason = `Matches DB with 'N' suffix: "${withN}" (Price: $${dbPriceMap.get(withN).precio})`;
        } else if (excelPriceMap.has(withN)) {
          resolved = true;
          reason = `Matches Excel with 'N' suffix: "${withN}" (Price: $${excelPriceMap.get(withN)})`;
        }
      }

      if (!resolved) {
        // Try other variants (e.g., FO-4 -> FO-4STK? or FA-9022 -> FA-9022N?)
        const withStk = sku + 'STK';
        if (dbPriceMap.has(withStk)) {
          resolved = true;
          reason = `Matches DB with 'STK' suffix: "${withStk}" (Price: $${dbPriceMap.get(withStk).precio})`;
        } else if (excelPriceMap.has(withStk)) {
          resolved = true;
          reason = `Matches Excel with 'STK' suffix: "${withStk}" (Price: $${excelPriceMap.get(withStk)})`;
        }
      }

      if (resolved) {
        console.log(`🟢 Clave: ${sku.padEnd(15)} | ${reason}`);
      } else {
        console.log(`❌ Clave: ${sku.padEnd(15)} | No match found in Excel or DB!`);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
