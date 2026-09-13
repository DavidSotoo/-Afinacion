const PrecioFiltro = require('../models/PrecioFiltro');
const PrecioBujia = require('../models/PrecioBujia');
const Balata = require('../models/Balata');
const { getFullModelSearchKeys } = require('../models/modelNormalizer');

let priceCache = {
  preciosMap: null,
  bujiasMap: null,
  balatasList: null,
  balatasByModelKey: null,
  lastUpdated: 0
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Enriches vehicle records with live pricing from MongoDB for filters, spark plugs,
 * and matches front/rear brake pads (Balatas) based on catalog model and year compatibility.
 * Calculates costs for UNIFIL items and provides a fallback for other brands.
 */
async function enrichVehiculosWithPrices(vehiculos) {
  try {
    const now = Date.now();
    if (!priceCache.preciosMap || !priceCache.bujiasMap || !priceCache.balatasList || (now - priceCache.lastUpdated > CACHE_TTL)) {
      const [preciosList, bujiasList, balatasList] = await Promise.all([
        PrecioFiltro.find({}),
        PrecioBujia.find({}),
        Balata.find({})
      ]);

      const preciosMap = new Map();
      preciosList.forEach(p => {
        if (p.clave) {
          const brand = (p.marca || 'UNIFIL').trim().toUpperCase();
          const clave = p.clave.trim().toUpperCase();
          preciosMap.set(`${brand}_${clave}`, p.precio);
          if (brand === 'UNIFIL') {
            preciosMap.set(clave, p.precio); // fallback
          }
        }
      });

      const bujiasMap = new Map();
      bujiasList.forEach(b => {
        if (b.sku) {
          bujiasMap.set(b.sku.trim().toUpperCase(), b.precio_cliente);
        }
      });

      // Index balatas by compatible model name so per-vehicle matching below is
      // a map lookup instead of a full scan of every balata (PERF-05: this used
      // to re-scan the entire balatas collection — twice — for every single
      // vehicle in the result set, making brands with many vehicles, e.g.
      // Chevrolet with 642, take 13+ seconds to respond).
      const balatasByModelKey = new Map();
      balatasList.forEach(b => {
        (b.vehiculos_compatibles || []).forEach(vc => {
          const key = (vc.modelo || '').toUpperCase().trim();
          if (!key) return;
          if (!balatasByModelKey.has(key)) balatasByModelKey.set(key, []);
          balatasByModelKey.get(key).push({ balata: b, vc });
        });
      });

      priceCache = {
        preciosMap,
        bujiasMap,
        balatasList,
        balatasByModelKey,
        lastUpdated: now
      };
    }

    const { preciosMap, bujiasMap, balatasByModelKey } = priceCache;
    const DEFAULT_COST = 80;

    // Deduplicate vehicle results list before enrichment
    let listToEnrich = vehiculos;
    if (vehiculos.length > 1) {
      const seen = new Set();
      listToEnrich = vehiculos.filter(v => {
        const key = `${v.marca}-${v.modelo}-${v.anio_inicio}-${v.anio_fin}-${v.motor || ''}-${v.litros || ''}-${v.cilindros_config || ''}`.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return listToEnrich.map(v => {
      const vObj = v.toObject();
      
      const vehicleModelUpper = (vObj.modelo || '').trim().toUpperCase();
      const vehicleBrandUpper = (vObj.marca || '').trim().toUpperCase();

      // Build all candidate search keys including aliases
      const candidateKeys = getFullModelSearchKeys(vehicleBrandUpper, vehicleModelUpper);

      // Look up only the balatas whose compatible-model entries match one of
      // this vehicle's candidate keys, via the precomputed index — instead of
      // scanning every balata in the catalog for every vehicle.
      const candidateEntries = [];
      candidateKeys.forEach(key => {
        const entries = balatasByModelKey.get(key);
        if (entries) candidateEntries.push(...entries);
      });

      const nameOnlyBalatasSet = new Set(candidateEntries.map(e => e.balata));
      const hasNameMatch = nameOnlyBalatasSet.size > 0;

      const matchingBalatasSet = new Set();
      candidateEntries.forEach(({ balata, vc }) => {
        const yearOverlap = !(vObj.anio_fin < vc.anio_inicio || vObj.anio_inicio > vc.anio_fin);
        if (yearOverlap) matchingBalatasSet.add(balata);
      });
      const matchingBalatas = Array.from(matchingBalatasSet);
      const hasYearMatch = matchingBalatas.length > 0;

      vObj.balatas = matchingBalatas.map(b => ({
        sku_dynamic: b.sku_dynamic,
        sku_equivalente_wagner: b.sku_equivalente_wagner,
        fmsi: b.fmsi,
        posicion: b.posicion,
        precio: b.precio || 0
      }));

      // Metadata: helps UI decide messaging ("en catálogo pero años sin datos" vs "sin datos")
      vObj.balatas_meta = {
        tiene_nombre_en_catalogo: hasNameMatch,
        tiene_cobertura_en_anio: hasYearMatch,
      };
      
      // Parse cylinders/spark plugs count
      const matchCyl = (vObj.cilindros_config || '').match(/\d+/);
      const numCilindros = matchCyl ? parseInt(matchCyl[0], 10) : 4;

      const getBujiaPrice = (sku) => {
        if (!sku) return 0;
        const skuUpper = sku.trim().toUpperCase();
        if (bujiasMap.has(skuUpper)) {
          return bujiasMap.get(skuUpper);
        }
        return 50; // default unit price: $50
      };

      if (vObj.kit_afinacion) {
        let costoTotal = 0;
        const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
        
        keys.forEach(key => {
          const filtro = vObj.kit_afinacion[key];
          if (filtro && filtro.sku) {
            // Swap UNIFIL brand from alternos if available to prefer UNIFIL
            if (filtro.marca && filtro.marca.trim().toUpperCase() !== 'UNIFIL' && Array.isArray(filtro.alternos)) {
              const unifilAltIdx = filtro.alternos.findIndex(alt => alt && alt.marca && alt.marca.trim().toUpperCase() === 'UNIFIL');
              if (unifilAltIdx !== -1) {
                const unifilAlt = filtro.alternos[unifilAltIdx];
                const originalFiltro = {
                  marca: filtro.marca,
                  sku: filtro.sku
                };
                filtro.marca = unifilAlt.marca;
                filtro.sku = unifilAlt.sku;
                filtro.alternos[unifilAltIdx] = originalFiltro;
              }
            }

            const skuUpper = (filtro.sku || '').trim().toUpperCase();
            if (skuUpper === 'SELLADO') {
              filtro.costo = 0;
            } else {
              let costo = DEFAULT_COST;
              const nameUpper = (filtro.marca || 'UNIFIL').trim().toUpperCase();
              
              // Handle combined SKUs separated by '/' (split and try to find any key)
              const skus = skuUpper.split('/').map(s => s.trim());
              let priceFound = false;
              for (const singleSku of skus) {
                if (!singleSku) continue;
                const lookupKey = `${nameUpper}_${singleSku}`;
                if (preciosMap.has(lookupKey)) {
                   costo = preciosMap.get(lookupKey);
                   priceFound = true;
                   break;
                } else if (preciosMap.has(singleSku)) {
                   costo = preciosMap.get(singleSku);
                   priceFound = true;
                   break;
                }
              }
              filtro.costo = costo;
              costoTotal += costo;
            }
          } else if (filtro) {
            filtro.costo = 0;
          }
        });
        vObj.kit_afinacion.costo_total = parseFloat(costoTotal.toFixed(2));

        // Add dynamic spark plug prices to the kit_afinacion structure
        const iridiumPriceUnit = getBujiaPrice(vObj.bujia_iridium_ix?.tipo);
        const platinoPriceUnit = getBujiaPrice(vObj.bujia_g_power?.tipo);
        const vpowerPriceUnit = getBujiaPrice(vObj.bujia_v_power?.tipo);
        const stockPriceUnit = getBujiaPrice(vObj.bujia_stock?.tipo);

        vObj.kit_afinacion.bujias = {
          iridium: {
            sku: vObj.bujia_iridium_ix?.tipo || null,
            precio_unitario: iridiumPriceUnit,
            precio_total: parseFloat((iridiumPriceUnit * numCilindros).toFixed(2))
          },
          platino: {
            sku: vObj.bujia_g_power?.tipo || null,
            precio_unitario: platinoPriceUnit,
            precio_total: parseFloat((platinoPriceUnit * numCilindros).toFixed(2))
          },
          vpower: {
            sku: vObj.bujia_v_power?.tipo || null,
            precio_unitario: vpowerPriceUnit,
            precio_total: parseFloat((vpowerPriceUnit * numCilindros).toFixed(2))
          },
          stock: {
            sku: vObj.bujia_stock?.tipo || null,
            precio_unitario: stockPriceUnit,
            precio_total: parseFloat((stockPriceUnit * numCilindros).toFixed(2))
          }
        };
      }
      return vObj;
    });
  } catch (err) {
    console.error('Error enriching vehicles with prices:', err.message);
    let listToEnrich = vehiculos;
    if (vehiculos.length > 1) {
      const seen = new Set();
      listToEnrich = vehiculos.filter(v => {
        const key = `${v.marca}-${v.modelo}-${v.anio_inicio}-${v.anio_fin}-${v.motor || ''}-${v.litros || ''}-${v.cilindros_config || ''}`.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return listToEnrich.map(v => {
      const vObj = v.toObject();
      
      const matchCyl = (vObj.cilindros_config || '').match(/\d+/);
      const numCilindros = matchCyl ? parseInt(matchCyl[0], 10) : 4;
      const fallbackUnit = 50;
      const fallbackTotal = fallbackUnit * numCilindros;

      if (vObj.kit_afinacion) {
        let costoTotal = 0;
        const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
        keys.forEach(key => {
          const filtro = vObj.kit_afinacion[key];
          if (filtro && filtro.sku) {
            // Swap UNIFIL brand from alternos if available to prefer UNIFIL in fallback
            if (filtro.marca && filtro.marca.trim().toUpperCase() !== 'UNIFIL' && Array.isArray(filtro.alternos)) {
              const unifilAltIdx = filtro.alternos.findIndex(alt => alt && alt.marca && alt.marca.trim().toUpperCase() === 'UNIFIL');
              if (unifilAltIdx !== -1) {
                const unifilAlt = filtro.alternos[unifilAltIdx];
                const originalFiltro = {
                  marca: filtro.marca,
                  sku: filtro.sku
                };
                filtro.marca = unifilAlt.marca;
                filtro.sku = unifilAlt.sku;
                filtro.alternos[unifilAltIdx] = originalFiltro;
              }
            }

            if (filtro.sku !== 'SELLADO') {
              filtro.costo = 80;
              costoTotal += 80;
            } else {
              filtro.costo = 0;
            }
          } else if (filtro) {
            filtro.costo = 0;
          }
        });
        vObj.kit_afinacion.costo_total = costoTotal;
        // Fallback spark plug pricing structures
        vObj.kit_afinacion.bujias = {
          iridium: { sku: vObj.bujia_iridium_ix?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal },
          platino: { sku: vObj.bujia_g_power?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal },
          vpower: { sku: vObj.bujia_v_power?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal },
          stock: { sku: vObj.bujia_stock?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal }
        };
      }
      return vObj;
    });
  }
}

module.exports = { enrichVehiculosWithPrices };
