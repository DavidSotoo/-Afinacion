require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PrecioFiltro = require('../../models/PrecioFiltro');

const SCAN_DIRS = [
  path.resolve(__dirname, '.'),                         // server/src/data
  path.resolve(__dirname, '../../../src/data')         // src/data
];

// Helper to determine type of filter from object key
function findFiltersInObject(obj, foundFilters, currentKey = '') {
  if (!obj || typeof obj !== 'object') return;
  
  if (obj.marca && obj.sku) {
    const brand = obj.marca.trim().toUpperCase();
    if (brand !== 'UNIFIL') {
      const skus = obj.sku.split('/').map(s => s.trim().toUpperCase());
      let type = 'Filtro';
      const keyLower = currentKey.toLowerCase();
      if (keyLower.includes('aceite')) type = 'Aceite';
      else if (keyLower.includes('aire')) type = 'Aire';
      else if (keyLower.includes('gasolina')) type = 'Gasolina';
      else if (keyLower.includes('cabina')) type = 'Cabina';

      skus.forEach(sku => {
        if (sku && sku !== 'SELLADO') {
          foundFilters.push({ brand, sku, type });
        }
      });
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        findFiltersInObject(obj[key], foundFilters, key);
      }
    }
  }
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

  // 1. Clean up index: drop the old single-field unique index 'clave_1'
  try {
    console.log('Dropping old unique index clave_1 to allow duplicate keys across different brands...');
    await PrecioFiltro.collection.dropIndex('clave_1');
    console.log('Index clave_1 successfully dropped.');
  } catch (err) {
    console.log('Note: Index clave_1 was not dropped (it might not exist or is not a unique index):', err.message);
  }

  // 1b. Clean up existing records (set default brand to UNIFIL where missing or null)
  console.log('Cleansing existing preciounifils: setting brand to UNIFIL where null or missing...');
  const cleanseResult = await PrecioFiltro.updateMany(
    { $or: [{ marca: null }, { marca: { $exists: false } }] },
    { $set: { marca: 'UNIFIL' } }
  );
  console.log(`Cleansed ${cleanseResult.modifiedCount} filter records to have marca: 'UNIFIL'.`);

  // 2. Fetch all existing filters in the DB to avoid duplicates
  const existingFilters = await PrecioFiltro.find({}).lean();
  const existingSet = new Set(
    existingFilters.map(f => `${(f.marca || 'UNIFIL').trim().toUpperCase()}_${f.clave.trim().toUpperCase()}`)
  );
  console.log(`Loaded ${existingFilters.length} existing filter keys from database.`);

  // 3. Scan directories for filter mapping files
  const foundFilters = [];
  
  for (const scanDir of SCAN_DIRS) {
    if (!fs.existsSync(scanDir)) {
      console.warn(`WARNING: Scan directory not found: ${scanDir}`);
      continue;
    }
    
    console.log(`Scanning directory: ${scanDir}...`);
    const files = fs.readdirSync(scanDir);
    
    for (const file of files) {
      // Skip migration and inspection scripts
      if (
        file.startsWith('migrate') || 
        file.startsWith('inspect') || 
        file.startsWith('check') || 
        file.startsWith('test') || 
        file.startsWith('verify') || 
        file.startsWith('find') || 
        file.startsWith('search') ||
        file === 'seed.js' ||
        file === 'server.js'
      ) {
        continue;
      }
      
      const filePath = path.join(scanDir, file);
      
      try {
        let content;
        if (file.endsWith('.json')) {
          content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else if (file.endsWith('Joe.js') || file.endsWith('Unifil.js')) {
          content = require(filePath);
        } else {
          continue; // skip other formats or script files
        }
        
        findFiltersInObject(content, foundFilters);
      } catch (err) {
        console.error(`Error parsing file ${file}:`, err.message);
      }
    }
  }

  console.log(`Found a total of ${foundFilters.length} filter brand/SKU occurrences in catalog files.`);

  // Deduplicate found filters
  const uniqueFilters = new Map();
  foundFilters.forEach(f => {
    const key = `${f.brand}_${f.sku}`;
    if (!uniqueFilters.has(key)) {
      uniqueFilters.set(key, f);
    } else {
      // Prefer type other than generic 'Filtro' if available
      const existing = uniqueFilters.get(key);
      if (existing.type === 'Filtro' && f.type !== 'Filtro') {
        uniqueFilters.set(key, f);
      }
    }
  });

  console.log(`Deduplicated to ${uniqueFilters.size} unique non-UNIFIL filters.`);

  // 4. Prepare bulk insertions for missing filters
  const bulkOps = [];
  let newInterfilCount = 0;
  let newJoeCount = 0;
  let newOthersCount = 0;

  for (const [key, filter] of uniqueFilters) {
    if (!existingSet.has(key)) {
      // Proper casing of description depending on brand/type
      const brandClean = filter.brand.charAt(0).toUpperCase() + filter.brand.slice(1).toLowerCase();
      const desc = `Filtro de ${filter.type} (${brandClean})`;
      
      bulkOps.push({
        insertOne: {
          document: {
            clave: filter.sku,
            marca: filter.brand,
            precio: 80.0, // Default cost
            descripcion: desc
          }
        }
      });

      if (filter.brand === 'INTERFIL') newInterfilCount++;
      else if (filter.brand === 'JOE') newJoeCount++;
      else newOthersCount++;
    }
  }

  console.log(`Prepared ${bulkOps.length} new filters to insert:`);
  console.log(`- Interfil: ${newInterfilCount}`);
  console.log(`- Joe:      ${newJoeCount}`);
  console.log(`- Others:   ${newOthersCount}`);

  if (bulkOps.length > 0) {
    console.log(`Executing bulkWrite with ${bulkOps.length} insertions...`);
    const result = await PrecioFiltro.bulkWrite(bulkOps);
    console.log('Bulk insert finished successfully.');
    console.log(`- Inserted: ${result.insertedCount}`);
  } else {
    console.log('All scanned filters are already present in the database.');
  }

  // Double check count by brand
  const counts = await PrecioFiltro.aggregate([
    { $group: { _id: '$marca', count: { $sum: 1 } } }
  ]);
  console.log('\nFinal brands count in preciounifils database collection:');
  counts.forEach(c => {
    console.log(`- ${c._id || 'UNIFIL'}: ${c.count} filters`);
  });

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB.');
}

runMigration()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:');
    console.error(err.message || err);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(0, 10).join('\n'));
    }
    process.exit(1);
  });
