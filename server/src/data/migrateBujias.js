require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PrecioBujia = require('../../models/PrecioBujia');

const CSV_PATH = path.resolve(__dirname, '../../../public/data/Lista de precios -NGK.csv');

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

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: CSV file not found at: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected to database.');

  console.log(`Reading CSV file from: ${CSV_PATH}...`);
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = content.split(/\r?\n/);

  const bulkOps = [];
  let totalRowsRead = 0;
  let skippedHeader = false;

  for (const line of lines) {
    if (!line.trim()) continue;

    const cells = parseCsvLine(line);
    
    // Skip header row (SKU,Descripción, Costo ,Costo +IVA,Precio Clt  25%)
    if (!skippedHeader) {
      skippedHeader = true;
      continue;
    }

    const sku = (cells[0] || '').trim();
    const descripcion = (cells[1] || '').trim();
    const precioStr = (cells[4] || '').trim().replace('$', '').trim();
    const precio_cliente = parseFloat(precioStr);

    if (!sku || isNaN(precio_cliente)) {
      continue; // Skip invalid or empty rows
    }

    totalRowsRead++;

    bulkOps.push({
      updateOne: {
        filter: { sku: sku },
        update: {
          $set: {
            sku: sku,
            descripcion: descripcion,
            precio_cliente: precio_cliente
          }
        },
        upsert: true
      }
    });
  }

  console.log(`Parsed ${totalRowsRead} valid spark plug price rows from CSV.`);

  if (bulkOps.length > 0) {
    console.log(`Executing bulkWrite with ${bulkOps.length} operations...`);
    const result = await PrecioBujia.bulkWrite(bulkOps);
    console.log('Bulk upsert finished.');
    console.log(`- Matched: ${result.matchedCount}`);
    console.log(`- Modified: ${result.modifiedCount}`);
    console.log(`- Upserted: ${result.upsertedCount}`);
  } else {
    console.log('No valid operations to execute.');
  }

  const activeCount = await PrecioBujia.countDocuments();
  console.log(`Total active spark plug prices in database: ${activeCount}`);

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
