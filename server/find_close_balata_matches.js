const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');
const Balata = require('./models/Balata');

async function findCloseMatches() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  const vehicles = await Vehiculo.find({});
  const balatas = await Balata.find({});

  console.log(`Loaded ${vehicles.length} vehicles and ${balatas.length} balatas.`);

  // Set of all unique vehicle model names in the DB grouped by brand
  const dbModelsByBrand = {};
  vehicles.forEach(v => {
    const brand = v.marca.toUpperCase().trim();
    if (!dbModelsByBrand[brand]) dbModelsByBrand[brand] = new Set();
    dbModelsByBrand[brand].add(v.modelo.toUpperCase().trim());
  });

  const potentialMatches = [];
  const brands = ['CHEVROLET', 'NISSAN', 'VOLKSWAGEN', 'FORD', 'HONDA', 'TOYOTA', 'MAZDA', 'SEAT', 'DODGE', 'MITSUBISHI', 'AUDI', 'BMW'];

  for (const b of balatas) {
    for (const vc of b.vehiculos_compatibles) {
      const fullVcModel = vc.modelo.toUpperCase().trim();
      const vcStart = vc.anio_inicio;
      const vcEnd = vc.anio_fin;

      // Extract the brand and clean the model name
      let detectedBrand = null;
      let cleanedVcModel = fullVcModel;

      for (const brand of brands) {
        if (fullVcModel.startsWith(brand + ' ')) {
          detectedBrand = brand;
          cleanedVcModel = fullVcModel.substring(brand.length + 1).trim();
          break;
        }
      }

      if (!detectedBrand) {
        // Fallback: check if any brand is inside
        for (const brand of brands) {
          if (fullVcModel.includes(brand)) {
            detectedBrand = brand;
            cleanedVcModel = fullVcModel.replace(brand, '').trim();
            break;
          }
        }
      }

      if (!detectedBrand) continue;

      // Now see if we have this brand in DB
      const dbModels = dbModelsByBrand[detectedBrand];
      if (!dbModels) continue;

      // Check if we have an exact match first
      const hasExactMatch = Array.from(dbModels).some(dbModel => dbModel === cleanedVcModel);
      if (hasExactMatch) continue;

      // Find close matches
      for (const dbModel of dbModels) {
        const cleanVc = cleanedVcModel.replace(/[^A-Z0-9]/g, '');
        const cleanDb = dbModel.replace(/[^A-Z0-9]/g, '');

        if (!cleanVc || !cleanDb) continue;

        const isSub = cleanVc.includes(cleanDb) || cleanDb.includes(cleanVc);
        const lenDiff = Math.abs(cleanVc.length - cleanDb.length);
        const isVeryClose = isSub && lenDiff <= 6;

        if (isVeryClose) {
          // Check if there is year overlap with any vehicle of this brand/model
          const matchingVehicles = vehicles.filter(v => {
            return v.marca.toUpperCase() === detectedBrand && 
                   v.modelo.toUpperCase().trim() === dbModel &&
                   !(v.anio_fin < vcStart || v.anio_inicio > vcEnd);
          });

          if (matchingVehicles.length > 0) {
            potentialMatches.push({
              balataSku: b.sku_dynamic,
              brand: detectedBrand,
              balataModel: cleanedVcModel,
              dbModel: dbModel,
              years: `${vcStart}-${vcEnd}`,
              wagner: b.sku_equivalente_wagner
            });
          }
        }
      }
    }
  }

  console.log(`\nFound ${potentialMatches.length} potential matches due to naming differences with year overlap:`);
  
  // Deduplicate suggested matches
  const uniqueSuggestions = {};
  potentialMatches.forEach(pm => {
    const key = `${pm.brand} | Vehicle: ${pm.dbModel} -> Balata: ${pm.balataModel}`;
    if (!uniqueSuggestions[key]) {
      uniqueSuggestions[key] = {
        count: 0,
        examples: []
      };
    }
    uniqueSuggestions[key].count++;
    if (uniqueSuggestions[key].examples.length < 3) {
      uniqueSuggestions[key].examples.push(`${pm.balataSku} (${pm.wagner}) for years ${pm.years}`);
    }
  });

  Object.entries(uniqueSuggestions).forEach(([s, data]) => {
    console.log(`  - ${s}`);
    console.log(`    └─ Matches: ${data.count} items, e.g.: ${data.examples.join(', ')}`);
  });

  await mongoose.disconnect();
}

findCloseMatches();
