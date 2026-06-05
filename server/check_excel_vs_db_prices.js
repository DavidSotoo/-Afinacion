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
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const records = [];
  
  // Skip header: "CLAVE","DESCRIPCION",PRECIO
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling quotes
    // Simplistic CSV parser for this specific format
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

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas.\n');

    // 1. Fetch all prices currently in DB
    const dbPrices = await PrecioUnifil.find({}).lean();
    const dbPriceMap = new Map();
    dbPrices.forEach(p => {
      dbPriceMap.set(p.clave.toUpperCase(), p);
    });
    console.log(`Loaded ${dbPrices.length} prices from preciounifils collection.\n`);

    // 2. Fetch all unique active UNIFIL filter keys used in vehicles
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
    console.log(`Found ${activeUnifilClaves.size} unique active UNIFIL SKUs referenced in the vehicle database.\n`);

    // 3. Process CSV files and check discrepancies
    const missingInDb = [];
    const mismatchedPrices = [];
    const csvClaves = new Set();

    for (const file of files) {
      console.log(`Processing CSV sheet: ${file.name}...`);
      const records = parseCsv(file.path);
      console.log(`  Parsed ${records.length} records.`);
      
      records.forEach(rec => {
        csvClaves.add(rec.clave);
        const dbPrice = dbPriceMap.get(rec.clave);
        if (!dbPrice) {
          missingInDb.push({ sheet: file.name, ...rec });
        } else {
          // Compare prices with minor tolerance for precision float errors
          if (Math.abs(dbPrice.precio - rec.precio) > 0.01) {
            mismatchedPrices.push({
              clave: rec.clave,
              sheet: file.name,
              descripcion: rec.descripcion,
              excelPrecio: rec.precio,
              dbPrecio: dbPrice.precio
            });
          }
        }
      });
    }

    console.log('\n==================================================');
    console.log(`RESULT 1: Claves in Excel but MISSING from preciounifils collection: ${missingInDb.length}`);
    console.log('==================================================');
    if (missingInDb.length > 0) {
      // Group by sheet for clean display
      const grouped = {};
      missingInDb.forEach(m => {
        if (!grouped[m.sheet]) grouped[m.sheet] = [];
        grouped[m.sheet].push(m);
      });
      for (const [sheetName, items] of Object.entries(grouped)) {
        console.log(`\nSheet: ${sheetName} (${items.length} missing)`);
        items.slice(0, 15).forEach(item => {
          console.log(`  - Clave: ${item.clave} | Precio: $${item.precio} | Desc: ${item.descripcion.substring(0, 80)}...`);
        });
        if (items.length > 15) {
          console.log(`  ... and ${items.length - 15} more`);
        }
      }
    } else {
      console.log('No keys from Excel are missing in the database collection.');
    }

    console.log('\n==================================================');
    console.log(`RESULT 2: Price mismatches between Excel and preciounifils collection: ${mismatchedPrices.length}`);
    console.log('==================================================');
    if (mismatchedPrices.length > 0) {
      mismatchedPrices.slice(0, 20).forEach(m => {
        console.log(`  - Clave: ${m.clave} | Excel: $${m.excelPrecio} | DB: $${m.dbPrecio} | Desc: ${m.descripcion.substring(0, 60)}...`);
      });
      if (mismatchedPrices.length > 20) {
        console.log(`  ... and ${mismatchedPrices.length - 20} more`);
      }
    } else {
      console.log('All matching keys have identical prices.');
    }

    // 4. Check which active filter SKUs used in vehicles are missing prices in preciounifils
    const activeMissingPrices = [];
    activeUnifilClaves.forEach(sku => {
      if (!dbPriceMap.has(sku)) {
        activeMissingPrices.push(sku);
      }
    });

    console.log('\n==================================================');
    console.log(`RESULT 3: Active UNIFIL SKUs in vehicles missing a registered price in DB: ${activeMissingPrices.length}`);
    console.log('==================================================');
    if (activeMissingPrices.length > 0) {
      activeMissingPrices.forEach(sku => {
        const inExcel = csvClaves.has(sku);
        console.log(`  - Active SKU: ${sku} | Present in Excel: ${inExcel ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('All active UNIFIL SKUs used in the vehicles database have a registered price.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

main();
