const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');
const PrecioBujia = require('./models/PrecioBujia');
const PrecioUnifil = require('./models/PrecioUnifil');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const seatVehicles = await Vehiculo.find({ marca: /seat/i }).lean();
  console.log(`Found ${seatVehicles.length} SEAT vehicles in database.`);

  const bujiasList = await PrecioBujia.find({});
  const bujiasMap = new Map();
  bujiasList.forEach(b => {
    if (b.sku) bujiasMap.set(b.sku.toUpperCase().trim(), b.precio_cliente);
  });

  const preciosUnifilList = await PrecioUnifil.find({});
  const preciosUnifilMap = new Map();
  preciosUnifilList.forEach(p => {
    if (p.clave) preciosUnifilMap.set(p.clave.toUpperCase().trim(), p.precio);
  });

  let missingBujiaPricesCount = 0;
  let missingFilterPricesCount = 0;

  seatVehicles.forEach(v => {
    // Check spark plugs
    const plugsToCheck = [];
    if (v.bujia_stock?.tipo) plugsToCheck.push({ role: 'stock', sku: v.bujia_stock.tipo });
    if (v.bujia_iridium_ix?.tipo) plugsToCheck.push({ role: 'iridium_ix', sku: v.bujia_iridium_ix.tipo });
    if (v.bujia_g_power?.tipo) plugsToCheck.push({ role: 'g_power', sku: v.bujia_g_power.tipo });
    if (v.bujia_v_power?.tipo) plugsToCheck.push({ role: 'v_power', sku: v.bujia_v_power.tipo });

    plugsToCheck.forEach(plug => {
      const skuUpper = plug.sku.toUpperCase().trim();
      if (!bujiasMap.has(skuUpper)) {
        console.log(`❌ Missing price for spark plug: ${plug.sku} (${plug.role}) on ${v.modelo} ${v.anio_inicio}-${v.anio_fin} ${v.motor}`);
        missingBujiaPricesCount++;
      }
    });

    // Check filters
    if (v.kit_afinacion) {
      const filterKeys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
      filterKeys.forEach(key => {
        const f = v.kit_afinacion[key];
        if (f && f.sku && f.sku !== 'SELLADO') {
          const skuUpper = f.sku.toUpperCase().trim();
          const brandUpper = (f.marca || '').toUpperCase().trim();
          
          // Check referential _id
          if (!f._id) {
            console.log(`❌ Missing _id reference for filter: ${f.sku} (${key}) on ${v.modelo} ${v.anio_inicio}-${v.anio_fin} ${v.motor}`);
            missingFilterPricesCount++;
          } else {
            const correspondingPrecioDoc = preciosUnifilList.find(p => p._id.toString() === f._id.toString());
            if (!correspondingPrecioDoc) {
              console.log(`❌ Invalid _id reference for filter: ${f.sku} (${key}) on ${v.modelo} pointing to non-existent document ID ${f._id}`);
              missingFilterPricesCount++;
            } else if (correspondingPrecioDoc.clave.toUpperCase().trim() !== skuUpper) {
              console.log(`❌ Mismatched SKU on reference: filter ${f.sku} (${key}) has _id pointing to document with SKU ${correspondingPrecioDoc.clave}`);
              missingFilterPricesCount++;
            }
          }

          if (brandUpper === 'UNIFIL') {
            if (!preciosUnifilMap.has(skuUpper)) {
              console.log(`⚠️ Missing price for filter: ${f.sku} (${key}) on ${v.modelo} ${v.anio_inicio}-${v.anio_fin} ${v.motor}`);
              missingFilterPricesCount++;
            }
          }
        }
      });
    }
  });

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`Missing spark plug prices: ${missingBujiaPricesCount}`);
  console.log(`Missing UNIFIL filter prices: ${missingFilterPricesCount}`);

  await mongoose.disconnect();
}

main();
