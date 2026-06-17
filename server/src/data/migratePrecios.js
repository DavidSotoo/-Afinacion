require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PrecioFiltro = require('../../models/PrecioFiltro');

const CSV_DIR = path.resolve(__dirname, '../../../public/data');
const CSV_FILES = [
  'PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE CABINA.csv',
  'PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE ACEITE.csv',
  'PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE AIRE.csv',
  'PRECIOS FILTROS UNIFIL 18-05-2026.xlsx - FILTRO DE GASOLINA.csv'
];

// Helper to parse double-quoted CSV fields correctly
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function runMigration() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is not defined in the environment variables.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected to database.');

  const bulkOps = [];
  let totalRowsRead = 0;

  for (const filename of CSV_FILES) {
    const csvPath = path.join(CSV_DIR, filename);
    if (!fs.existsSync(csvPath)) {
      console.warn(`WARNING: CSV file not found: ${csvPath}`);
      continue;
    }

    console.log(`Reading CSV file: ${filename}...`);
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/);

    let skippedHeader = false;
    for (const line of lines) {
      if (!line.trim()) continue;

      const cells = parseCsvLine(line);
      // Skip header row
      if (!skippedHeader) {
        skippedHeader = true;
        continue;
      }

      const clave = (cells[0] || '').trim();
      const descripcion = (cells[1] || '').trim();
      const precioStr = (cells[2] || '').trim();
      const precio = parseFloat(precioStr);

      if (!clave || isNaN(precio)) {
        continue; // Skip invalid or empty rows
      }

      totalRowsRead++;
      
      // Prepare bulkWrite upsert operation
      bulkOps.push({
        updateOne: {
          filter: { clave: clave },
          update: {
            $set: {
              clave: clave,
              descripcion: descripcion,
              precio: precio
            }
          },
          upsert: true
        }
      });
    }
  }

  console.log(`Parsed ${totalRowsRead} valid price rows from CSVs.`);

  if (bulkOps.length > 0) {
    console.log(`Executing bulkWrite with ${bulkOps.length} operations...`);
    const result = await PrecioFiltro.bulkWrite(bulkOps);
    console.log('Bulk upsert finished.');
    console.log(`- Matched: ${result.matchedCount}`);
    console.log(`- Modified: ${result.modifiedCount}`);
    console.log(`- Upserted: ${result.upsertedCount}`);
  } else {
    console.log('No valid operations to execute.');
  }

  const activeCount = await PrecioFiltro.countDocuments();
  console.log(`Total active UNIFIL prices in database: ${activeCount}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
  return activeCount;
}

runMigration()
  .then((count) => {
    console.log('Migration completed successfully.');
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
