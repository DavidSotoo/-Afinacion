require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Balata = require('./models/Balata');

async function importBalataPrices() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("Missing MONGO_URI in environment variables.");
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to DB.');

    // Fetch all balatas from DB
    const balatasDb = await Balata.find({});
    console.log(`Loaded ${balatasDb.length} balatas from database.`);

    // Load Excel sheet
    const excelPath = path.join(__dirname, 'Lista de precios.xlsx');
    console.log('Loading Excel file:', excelPath);
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log(`Loaded ${rows.length} rows from Excel sheet.`);

    // Create a map of Excel prices
    const excelPriceMap = new Map();
    rows.forEach(row => {
      const npc = (row.NPC || '').toString().trim().toUpperCase();
      const precio = parseFloat(row['18+12']);
      if (npc && !isNaN(precio)) {
        excelPriceMap.set(npc, precio);
      }
    });

    const bulkOperations = [];
    let matchCount = 0;

    balatasDb.forEach(b => {
      const sku = (b.sku_dynamic || '').trim().toUpperCase();
      let price = null;

      // 1. Try Exact match
      if (excelPriceMap.has(sku)) {
        price = excelPriceMap.get(sku);
      }
      
      // 2. Try Stripped match (removing CK, LM, SM suffix)
      if (price === null) {
        const stripped = sku.replace(/(CK|LM|SM)$/i, '');
        if (excelPriceMap.has(stripped)) {
          price = excelPriceMap.get(stripped);
        }
      }

      if (price !== null) {
        // Round to 2 decimal places for clean prices
        const finalPrice = parseFloat(price.toFixed(2));
        bulkOperations.push({
          updateOne: {
            filter: { _id: b._id },
            update: { $set: { precio: finalPrice } }
          }
        });
        matchCount++;
      }
    });

    console.log(`Found ${matchCount} matching balatas to update.`);

    if (bulkOperations.length > 0) {
      console.log('Executing bulk update in MongoDB...');
      const result = await Balata.bulkWrite(bulkOperations);
      console.log(`¡Success! Updated ${result.modifiedCount} balatas in the database.`);
    } else {
      console.log('No matching balatas found to update.');
    }

  } catch (err) {
    console.error('❌ Error during import:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

importBalataPrices();
