require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Balata = require('./models/Balata');

async function checkMatches() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB:', mongoUri.substring(0, 30) + '...');
    await mongoose.connect(mongoUri);
    console.log('Connected to DB.');

    // Fetch all balatas from DB
    const balatasDb = await Balata.find({});
    console.log(`Total balatas in DB: ${balatasDb.length}`);

    // Load Excel sheet
    const excelPath = path.join(__dirname, 'Lista de precios.xlsx');
    console.log('Loading Excel:', excelPath);
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log(`Total rows in Excel sheet: ${rows.length}`);

    // Create a map of Excel prices
    const excelPriceMap = new Map();
    rows.forEach(row => {
      const npc = (row.NPC || '').toString().trim().toUpperCase();
      const precio = parseFloat(row['18+12']);
      if (npc && !isNaN(precio)) {
        excelPriceMap.set(npc, precio);
      }
    });

    let matchCount = 0;
    let zeroCount = 0;
    const matchMethods = {
      exact: 0,
      stripped: 0,
      fmsi: 0,
      wagner: 0,
      no_match: 0
    };

    const sampleNoMatches = [];

    balatasDb.forEach(b => {
      const sku = (b.sku_dynamic || '').trim().toUpperCase();
      const fmsiClean = (b.fmsi || '').replace(/[^A-Z0-9]/gi, '').trim().toUpperCase();
      const wagnerClean = (b.sku_equivalente_wagner || '').replace(/[^A-Z0-9]/gi, '').trim().toUpperCase();

      let price = null;
      let method = null;

      // 1. Exact match
      if (excelPriceMap.has(sku)) {
        price = excelPriceMap.get(sku);
        method = 'exact';
      }
      
      // 2. Strip suffix (CK, LM, SM)
      if (price === null) {
        const stripped = sku.replace(/(CK|LM|SM)$/i, '');
        if (excelPriceMap.has(stripped)) {
          price = excelPriceMap.get(stripped);
          method = 'stripped';
        }
      }

      // 3. FMSI based (DNK + FMSI)
      if (price === null && fmsiClean) {
        const dnkFmsi = 'DNK' + fmsiClean;
        if (excelPriceMap.has(dnkFmsi)) {
          price = excelPriceMap.get(dnkFmsi);
          method = 'fmsi';
        }
      }

      // 4. Wagner based
      if (price === null && wagnerClean) {
        if (excelPriceMap.has(wagnerClean)) {
          price = excelPriceMap.get(wagnerClean);
          method = 'wagner';
        }
      }

      if (price !== null) {
        matchCount++;
        matchMethods[method]++;
      } else {
        matchMethods.no_match++;
        if (sampleNoMatches.length < 10) {
          sampleNoMatches.push({
            sku,
            fmsi: b.fmsi,
            wagner: b.sku_equivalente_wagner
          });
        }
      }

      if (b.precio === 0) {
        zeroCount++;
      }
    });

    console.log(`Matching balatas: ${matchCount} out of ${balatasDb.length} (${((matchCount/balatasDb.length)*100).toFixed(1)}%)`);
    console.log(`Match breakdown:`, matchMethods);
    console.log(`Sample of remaining non-matching balatas:`, sampleNoMatches);

    console.log('\n--- Searching Excel for specific terms ---');
    const searchTerms = ['1019', '7922', '1886', '1422', '792'];
    searchTerms.forEach(term => {
      console.log(`Results for term "${term}":`);
      let found = 0;
      rows.forEach((row, idx) => {
        const rowStr = JSON.stringify(row).toLowerCase();
        if (rowStr.includes(term.toLowerCase())) {
          if (found < 3) {
            console.log(`  Row ${idx + 2}:`, row);
          }
          found++;
        }
      });
      console.log(`  Total found for "${term}": ${found}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

checkMatches();
