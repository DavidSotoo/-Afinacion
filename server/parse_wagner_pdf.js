const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Vehiculo = require('./models/Vehiculo');
const Balata = require('./models/Balata');

const pdfPath = path.join(__dirname, '../public/data/catalogo-wagner-2022-2023.pdf');
const excelPath = path.join(__dirname, 'Lista de precios.xlsx');

const BRANDS = {
  AUDI: { firstPage: 12, lastPage: 18 },
  BMW: { firstPage: 18, lastPage: 22 },
  DODGE: { firstPage: 46, lastPage: 55 },
  MITSUBISHI: { firstPage: 95, lastPage: 98 },
  SEAT: { firstPage: 111, lastPage: 113 }
};

function isValidModelHeader(line) {
  const clean = line.trim();
  if (!clean) return false;
  if (clean.length > 30) return false;
  if (/\b(W[CDX]\d+|OEX\d+|Formulaci|Herraje|EJE|Parte|AÑO|FMSI|Eje|Trase|Delan|PR-|Excepto|Espesor|Diámet|sin\b|con\b|Eje\b|Rines\b|Llantas\b|Disco\b|Tambor\b)/i.test(clean)) return false;
  if (/^\d+/.test(clean)) return false; // should not start with numbers
  return true;
}

function matchBmwModel(dbModel, pdfModel) {
  const dbClean = dbModel.toUpperCase().trim();
  const pdfClean = pdfModel.toUpperCase().trim();

  if (dbClean === 'SERIE 1' && /^[1]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 2' && /^[2]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 3' && /^[3]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 4' && /^[4]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 5' && /^[5]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 6' && /^[6]\d{2}/.test(pdfClean)) return true;
  if (dbClean === 'SERIE 7' && /^[7]\d{2}/.test(pdfClean)) return true;

  if (dbClean === 'X1' && (pdfClean === 'X1' || pdfClean.startsWith('X1 '))) return true;
  if (dbClean === 'X2' && (pdfClean === 'X2' || pdfClean.startsWith('X2 '))) return true;
  if (dbClean === 'X3' && (pdfClean === 'X3' || pdfClean.startsWith('X3 '))) return true;
  if (dbClean === 'X4' && (pdfClean === 'X4' || pdfClean.startsWith('X4 '))) return true;
  if (dbClean === 'X5' && (pdfClean === 'X5' || pdfClean.startsWith('X5 '))) return true;
  if (dbClean === 'X6' && (pdfClean === 'X6' || pdfClean.startsWith('X6 '))) return true;
  if (dbClean === 'Z4' && (pdfClean === 'Z4' || pdfClean.startsWith('Z4 '))) return true;

  return dbClean === pdfClean;
}

function matchVehicleModel(brand, dbModel, pdfModel) {
  const brandUpper = brand.toUpperCase().trim();
  if (brandUpper === 'BMW') {
    return matchBmwModel(dbModel, pdfModel);
  }
  
  // Standard comparison for other brands (sub-string or exact matches)
  const dbClean = dbModel.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  const pdfClean = pdfModel.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  
  return dbClean === pdfClean || pdfClean.includes(dbClean) || dbClean.includes(pdfClean);
}

function findBalataInExcel(wagnerSku, fmsi, excelRows) {
  const cleanWagner = wagnerSku.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const cleanFmsi = fmsi ? fmsi.replace(/[^A-Z0-9]/gi, '').toUpperCase() : '';
  
  // 1. Exact match on NPC
  let row = excelRows.find(r => {
    const npc = (r.NPC || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/gi, '');
    return npc === cleanWagner || (cleanFmsi && npc.includes(cleanFmsi));
  });
  
  // 2. Search in DESCRIPTION
  if (!row) {
    row = excelRows.find(r => {
      const desc = (r.DESCRIPCION || '').toString().trim().toUpperCase();
      return desc.includes(cleanWagner) || (cleanFmsi && desc.includes(cleanFmsi));
    });
  }

  // 3. Search NPC containing Wagner SKU
  if (!row) {
    row = excelRows.find(r => {
      const npc = (r.NPC || '').toString().trim().toUpperCase();
      return npc.includes(cleanWagner);
    });
  }

  return row;
}

async function main() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database.');

    // Load Excel sheet
    console.log('Loading Excel sheet...');
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = xlsx.utils.sheet_to_json(sheet);
    console.log(`Loaded ${excelRows.length} rows from Excel price sheet.`);

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });

    const fmsiRegex = /\b(\d{4,5}[A-Z]?-D\d{3,4}[A-Z]?)\b/g;
    const wagnerRegex = /\b(W[CDX]\d{2,6}[A-Z]?(\(\d+\))?|OEX\d{4}[A-Z]?)\b/g;

    let totalInserted = 0;
    let totalUpdated = 0;

    for (const [brand, range] of Object.entries(BRANDS)) {
      console.log(`\n================ Parsing ${brand} (Pages ${range.firstPage} - ${range.lastPage}) ================`);
      
      const dbVehicles = await Vehiculo.find({ marca: new RegExp(`^${brand}$`, 'i') });
      console.log(`Loaded ${dbVehicles.length} vehicles for ${brand} from DB.`);

      const result = await parser.getText({ first: range.firstPage, last: range.lastPage });
      let currentModel = '';

      const parsedEntries = [];

      result.pages.forEach((page, index) => {
        const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
        
        lines.forEach(line => {
          if (line.toUpperCase().startsWith(brand) || line.includes('Formulaciones:') || line.includes('EJE DELANTERO') || line.includes('EJE TRASERO')) {
            return;
          }

          const yearMatch = line.match(/^(\d{4})\s+(\d{4})\b/);
          if (yearMatch) {
            const startYear = parseInt(yearMatch[1], 10);
            const endYear = parseInt(yearMatch[2], 10);
            
            const fmsis = line.match(fmsiRegex) || [];
            const wagners = line.match(wagnerRegex) || [];
            
            if (wagners.length > 0 && currentModel) {
              parsedEntries.push({
                model: currentModel,
                startYear,
                endYear,
                fmsis,
                wagners,
                line
              });
            }
          } else {
            if (isValidModelHeader(line)) {
              currentModel = line.trim();
            }
          }
        });
      });

      console.log(`Parsed ${parsedEntries.length} applications for ${brand}.`);

      // Match and insert/update
      for (const entry of parsedEntries) {
        // Find matching vehicles
        const matchingVehs = dbVehicles.filter(v => {
          const modelMatch = matchVehicleModel(brand, v.modelo, entry.model);
          const yearOverlap = !(v.anio_fin < entry.startYear || v.anio_inicio > entry.endYear);
          return modelMatch && yearOverlap;
        });

        if (matchingVehs.length === 0) continue;

        // Determine parts:
        // entry.wagners contains Wagner SKUs
        // If 2 Wagners are present, 1st is front, 2nd is rear.
        // If 1 Wagner is present, we check if we can find its position.
        const partsToProcess = [];
        if (entry.wagners.length >= 2) {
          partsToProcess.push({ wagner: entry.wagners[0], fmsi: entry.fmsis[0] || '', posicion: 'Delantero' });
          partsToProcess.push({ wagner: entry.wagners[1], fmsi: entry.fmsis[1] || '', posicion: 'Trasero' });
        } else if (entry.wagners.length === 1) {
          partsToProcess.push({ wagner: entry.wagners[0], fmsi: entry.fmsis[0] || '', posicion: 'Delantero' }); // default to Front
        }

        for (const part of partsToProcess) {
          // 1. Search Excel for price & NPC
          const excelRow = findBalataInExcel(part.wagner, part.fmsi, excelRows);
          
          let sku_dynamic = '';
          let precio = 0;
          let marca = 'Dynamic';

          if (excelRow) {
            sku_dynamic = (excelRow.NPC || '').toString().trim().toUpperCase();
            precio = parseFloat(parseFloat(excelRow['18+12']).toFixed(2)) || 0;
            marca = excelRow.MARCA || 'Dynamic';
          } else {
            // Generate dynamic SKU fallback
            const cleanFmsi = part.fmsi ? part.fmsi.replace(/[^A-Z0-9]/gi, '') : '';
            if (cleanFmsi) {
              sku_dynamic = 'DNK' + cleanFmsi + (part.wagner.startsWith('WD') || part.wagner.startsWith('WC') ? 'CK' : 'LM');
            } else {
              sku_dynamic = 'DNK' + part.wagner.replace(/[^A-Z0-9]/gi, '') + 'CK';
            }
          }

          // Build compatible vehicles list
          const compatList = matchingVehs.map(v => ({
            modelo: `${brand} ${v.modelo}`.toUpperCase().trim(),
            anio_inicio: entry.startYear,
            anio_fin: entry.endYear
          }));

          // Check if this balata exists in DB
          let balataDoc = await Balata.findOne({ sku_dynamic });
          if (!balataDoc) {
            // Check by wagner SKU
            balataDoc = await Balata.findOne({ sku_equivalente_wagner: part.wagner.toUpperCase().trim() });
          }

          if (balataDoc) {
            // Update compatibles list
            let modified = false;
            compatList.forEach(c => {
              const alreadyExists = balataDoc.vehiculos_compatibles.some(vc => {
                return vc.modelo === c.modelo && vc.anio_inicio === c.anio_inicio && vc.anio_fin === c.anio_fin;
              });
              if (!alreadyExists) {
                balataDoc.vehiculos_compatibles.push(c);
                modified = true;
              }
            });

            // Update price if it was 0 or different
            if (precio > 0 && balataDoc.precio !== precio) {
              balataDoc.precio = precio;
              modified = true;
            }

            if (modified) {
              await balataDoc.save();
              totalUpdated++;
            }
          } else {
            // Insert new balata
            const newBalata = new Balata({
              marca: marca,
              sku_dynamic,
              sku_equivalente_wagner: part.wagner.toUpperCase().trim(),
              fmsi: part.fmsi || 'N/A',
              posicion: part.posicion,
              precio: precio,
              vehiculos_compatibles: compatList
            });

            await newBalata.save();
            totalInserted++;
          }
        }
      }
    }

    console.log(`\nImport completed successfully.`);
    console.log(`- New balatas inserted: ${totalInserted}`);
    console.log(`- Existing balatas updated: ${totalUpdated}`);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

main();
