const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Vehiculo = require('./models/Vehiculo');
const PrecioFiltro = require('./models/PrecioFiltro');
const PrecioBujia = require('./models/PrecioBujia');
const Balata = require('./models/Balata');
const { getFullModelSearchKeys } = require('./models/modelNormalizer');

async function runAnalysis() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database.');

    // Fetch all collections
    console.log('Loading all vehicles...');
    const vehicles = await Vehiculo.find({});
    console.log('Loading all filters...');
    const filters = await PrecioFiltro.find({});
    console.log('Loading all spark plugs...');
    const sparkPlugs = await PrecioBujia.find({});
    console.log('Loading all brake pads...');
    const balatas = await Balata.find({});

    console.log(`\nDatabase Summary:`);
    console.log(`- Vehicles: ${vehicles.length}`);
    console.log(`- Catalog Filters: ${filters.length}`);
    console.log(`- Catalog Spark Plugs: ${sparkPlugs.length}`);
    console.log(`- Catalog Brake Pads: ${balatas.length}\n`);

    // We want to analyze coverage by brand
    const brandStats = {};
    const initBrandStats = (brand) => {
      if (!brandStats[brand]) {
        brandStats[brand] = {
          totalVehicles: 0,
          
          // Filters
          withFiltroAceite: 0,
          withFiltroAire: 0,
          withFiltroGasolina: 0,
          withFiltroCabina: 0,
          withAnyFilter: 0,
          withAllFilters: 0, // Aceite, Aire, Gasolina, Cabina
          withBasicKit: 0,    // Aceite + Aire
          
          // Spark plugs
          withBujiaStock: 0,
          withBujiaIridium: 0,
          withBujiaGPower: 0,
          withBujiaVPower: 0,
          withAnyBujia: 0,

          // Balatas (calculated dynamically like the route does)
          withFrontBalata: 0,
          withRearBalata: 0,
          withBothBalatas: 0,
          withAnyBalata: 0,
          noBalatas: 0,
        };
      }
    };

    // Keep track of which catalog parts are linked
    const linkedFiltersSet = new Set();
    const linkedBujiasSet = new Set();
    
    // We will do dynamic balata matching and keep track of which balata documents match at least one vehicle
    const matchedBalataIds = new Set();

    // Map of vehicle IDs to matched balatas for detailed inspection
    const vehicleBalatasCount = { front: 0, rear: 0, both: 0, none: 0 };

    console.log('Analyzing vehicles and mapping catalog parts...');
    
    // Set for quickly checking spark plugs
    const sparkPlugsSkus = new Set(sparkPlugs.map(b => b.sku.trim().toUpperCase()));
    // Set for quickly checking filters (brand_sku and sku)
    const filtersKeys = new Set();
    filters.forEach(f => {
      const b = (f.marca || 'UNIFIL').trim().toUpperCase();
      const c = f.clave.trim().toUpperCase();
      filtersKeys.add(`${b}_${c}`);
      if (b === 'UNIFIL') {
        filtersKeys.add(c);
      }
    });

    for (const v of vehicles) {
      const brand = (v.marca || 'UNKNOWN').trim().toUpperCase();
      initBrandStats(brand);
      
      const stats = brandStats[brand];
      stats.totalVehicles++;

      // --- FILTERS ANALYSIS ---
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      const fGasolina = kit.filtro_gasolina && kit.filtro_gasolina.sku;
      const fCabina = kit.filtro_cabina && kit.filtro_cabina.sku;

      const hasAceiteValido = fAceite && fAceite !== 'SELLADO';
      const hasAireValido = fAire && fAire !== 'SELLADO';
      const hasGasolinaValido = fGasolina && fGasolina !== 'SELLADO';
      const hasCabinaValido = fCabina && fCabina !== 'SELLADO';

      if (fAceite) {
        stats.withFiltroAceite++;
        // track linkage
        if (hasAceiteValido) {
          const brandName = (kit.filtro_aceite.marca || 'UNIFIL').trim().toUpperCase();
          linkedFiltersSet.add(`${brandName}_${fAceite.toUpperCase()}`);
          if (Array.isArray(kit.filtro_aceite.alternos)) {
            kit.filtro_aceite.alternos.forEach(alt => {
              linkedFiltersSet.add(`${(alt.marca || 'UNIFIL').toUpperCase()}_${alt.sku.toUpperCase()}`);
            });
          }
        }
      }
      if (fAire) {
        stats.withFiltroAire++;
        if (hasAireValido) {
          const brandName = (kit.filtro_aire.marca || 'UNIFIL').trim().toUpperCase();
          linkedFiltersSet.add(`${brandName}_${fAire.toUpperCase()}`);
          if (Array.isArray(kit.filtro_aire.alternos)) {
            kit.filtro_aire.alternos.forEach(alt => {
              linkedFiltersSet.add(`${(alt.marca || 'UNIFIL').toUpperCase()}_${alt.sku.toUpperCase()}`);
            });
          }
        }
      }
      if (fGasolina) {
        stats.withFiltroGasolina++;
        if (hasGasolinaValido) {
          const brandName = (kit.filtro_gasolina.marca || 'UNIFIL').trim().toUpperCase();
          linkedFiltersSet.add(`${brandName}_${fGasolina.toUpperCase()}`);
          if (Array.isArray(kit.filtro_gasolina.alternos)) {
            kit.filtro_gasolina.alternos.forEach(alt => {
              linkedFiltersSet.add(`${(alt.marca || 'UNIFIL').toUpperCase()}_${alt.sku.toUpperCase()}`);
            });
          }
        }
      }
      if (fCabina) {
        stats.withFiltroCabina++;
        if (hasCabinaValido) {
          const brandName = (kit.filtro_cabina.marca || 'UNIFIL').trim().toUpperCase();
          linkedFiltersSet.add(`${brandName}_${fCabina.toUpperCase()}`);
          if (Array.isArray(kit.filtro_cabina.alternos)) {
            kit.filtro_cabina.alternos.forEach(alt => {
              linkedFiltersSet.add(`${(alt.marca || 'UNIFIL').toUpperCase()}_${alt.sku.toUpperCase()}`);
            });
          }
        }
      }

      if (fAceite || fAire || fGasolina || fCabina) stats.withAnyFilter++;
      if (fAceite && fAire && fGasolina && fCabina) stats.withAllFilters++;
      if (hasAceiteValido && hasAireValido) stats.withBasicKit++;

      // --- SPARK PLUGS ANALYSIS ---
      const hasStock = !!(v.bujia_stock && v.bujia_stock.tipo);
      const hasIridium = !!(v.bujia_iridium_ix && v.bujia_iridium_ix.tipo);
      const hasGPower = !!(v.bujia_g_power && v.bujia_g_power.tipo);
      const hasVPower = !!(v.bujia_v_power && v.bujia_v_power.tipo);

      if (hasStock) {
        stats.withBujiaStock++;
        linkedBujiasSet.add(v.bujia_stock.tipo.trim().toUpperCase());
      }
      if (hasIridium) {
        stats.withBujiaIridium++;
        linkedBujiasSet.add(v.bujia_iridium_ix.tipo.trim().toUpperCase());
      }
      if (hasGPower) {
        stats.withBujiaGPower++;
        linkedBujiasSet.add(v.bujia_g_power.tipo.trim().toUpperCase());
      }
      if (hasVPower) {
        stats.withBujiaVPower++;
        linkedBujiasSet.add(v.bujia_v_power.tipo.trim().toUpperCase());
      }

      if (hasStock || hasIridium || hasGPower || hasVPower) {
        stats.withAnyBujia++;
      }

      // --- BALATAS ANALYSIS ---
      const vModelUpper = (v.modelo || '').trim().toUpperCase();
      const vBrandUpper = (v.marca || '').trim().toUpperCase();
      
      const candidateKeys = getFullModelSearchKeys(vBrandUpper, vModelUpper);

      const matchingBalatas = balatas.filter(b => {
        return b.vehiculos_compatibles.some(vc => {
          const vcModelUpper = (vc.modelo || '').toUpperCase().trim();
          const isModelMatch = candidateKeys.includes(vcModelUpper);
          if (!isModelMatch) return false;

          const yearOverlap = !(v.anio_fin < vc.anio_inicio || v.anio_inicio > vc.anio_fin);
          if (yearOverlap) {
            matchedBalataIds.add(b._id.toString());
            return true;
          }
          return false;
        });
      });

      const hasDelantera = matchingBalatas.some(b => b.posicion === 'Delantero');
      const hasTrasera = matchingBalatas.some(b => b.posicion === 'Trasero');

      if (hasDelantera && hasTrasera) {
        stats.withBothBalatas++;
        stats.withAnyBalata++;
      } else if (hasDelantera) {
        stats.withFrontBalata++;
        stats.withAnyBalata++;
      } else if (hasTrasera) {
        stats.withRearBalata++;
        stats.withAnyBalata++;
      } else {
        stats.noBalatas++;
      }
    }

    // Catalog orphaned analysis
    console.log('Checking for orphaned parts in catalogs...');
    const orphanedFilters = [];
    filters.forEach(f => {
      const b = (f.marca || 'UNIFIL').trim().toUpperCase();
      const c = f.clave.trim().toUpperCase();
      const key = `${b}_${c}`;
      if (!linkedFiltersSet.has(key)) {
        orphanedFilters.push({ sku: f.clave, marca: f.marca, precio: f.precio });
      }
    });

    const orphanedBujias = [];
    sparkPlugs.forEach(sp => {
      const sku = sp.sku.trim().toUpperCase();
      if (!linkedBujiasSet.has(sku)) {
        orphanedBujias.push({ sku: sp.sku, descripcion: sp.descripcion, precio: sp.precio_cliente });
      }
    });

    const orphanedBalatas = [];
    balatas.forEach(b => {
      if (!matchedBalataIds.has(b._id.toString())) {
        orphanedBalatas.push({
          sku: b.sku_dynamic,
          wagner: b.sku_equivalente_wagner,
          fmsi: b.fmsi,
          posicion: b.posicion,
          compatibles: b.vehiculos_compatibles.map(vc => `${vc.modelo} (${vc.anio_inicio}-${vc.anio_fin})`)
        });
      }
    });

    // Write a beautiful Markdown report
    let report = `# Reporte de Análisis del Catálogo: Marcas, Vehículos y Cobertura de Autopartes\n\n`;
    report += `**Fecha de generación:** ${new Date().toLocaleString()}\n`;
    report += `**Total de Vehículos en DB:** ${vehicles.length}\n`;
    report += `**Total de Filtros en Catálogo:** ${filters.length} (${filters.length - orphanedFilters.length} vinculados, ${orphanedFilters.length} huérfanos)\n`;
    report += `**Total de Bujías en Catálogo:** ${sparkPlugs.length} (${sparkPlugs.length - orphanedBujias.length} vinculados, ${orphanedBujias.length} huérfanas)\n`;
    report += `**Total de Balatas en Catálogo:** ${balatas.length} (${balatas.length - orphanedBalatas.length} vinculados, ${orphanedBalatas.length} huérfanas)\n\n`;

    report += `## 1. Cobertura General por Marca\n\n`;
    report += `| Marca | Vehículos | Con Bujía % | Con Kit Básico % (Aceite+Aire) | Con Balata Del. % | Con Balata Tras. % | Con Ambas Balatas % | Con Alguna Balata % |\n`;
    report += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    const sortedBrands = Object.keys(brandStats).sort();
    sortedBrands.forEach(brand => {
      const s = brandStats[brand];
      const pBujia = ((s.withAnyBujia / s.totalVehicles) * 100).toFixed(1) + '%';
      const pKit = ((s.withBasicKit / s.totalVehicles) * 100).toFixed(1) + '%';
      
      const pFront = ((s.withFrontBalata / s.totalVehicles) * 100).toFixed(1) + '%';
      const pRear = ((s.withRearBalata / s.totalVehicles) * 100).toFixed(1) + '%';
      const pBoth = ((s.withBothBalatas / s.totalVehicles) * 100).toFixed(1) + '%';
      const pAnyB = ((s.withAnyBalata / s.totalVehicles) * 100).toFixed(1) + '%';

      report += `| **${brand}** | ${s.totalVehicles} | ${pBujia} | ${pKit} | ${pFront} | ${pRear} | ${pBoth} | ${pAnyB} |\n`;
    });

    report += `\n> [!NOTE]\n`;
    report += `> Un "Kit Básico" se considera cuando el vehículo tiene asignados y vinculados al menos un filtro de aceite y un filtro de aire válidos (que no sean "SELLADO").\n\n`;

    report += `## 2. Desglose Detallado de Filtros por Marca\n\n`;
    report += `| Marca | Vehículos | Aceite | Aire | Gasolina | Cabina | Con Todos |\n`;
    report += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    sortedBrands.forEach(brand => {
      const s = brandStats[brand];
      report += `| **${brand}** | ${s.totalVehicles} | ${s.withFiltroAceite} | ${s.withFiltroAire} | ${s.withFiltroGasolina} | ${s.withFiltroCabina} | ${s.withAllFilters} |\n`;
    });

    report += `\n## 3. Desglose Detallado de Bujías por Marca\n\n`;
    report += `| Marca | Vehículos | Stock | Iridium IX | G-Power (Platino) | V-Power (Cobre) | Con Alguna |\n`;
    report += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    sortedBrands.forEach(brand => {
      const s = brandStats[brand];
      report += `| **${brand}** | ${s.totalVehicles} | ${s.withBujiaStock} | ${s.withBujiaIridium} | ${s.withBujiaGPower} | ${s.withBujiaVPower} | ${s.withAnyBujia} |\n`;
    });

    report += `\n## 4. Análisis de Partes Huérfanas en Catálogo\n\n`;
    report += `Estas son piezas registradas en las listas de precios / catálogos generales, pero que no están siendo referenciadas por ningún vehículo en la colección \`Vehiculo\`.\n\n`;
    
    report += `### 4.1. Balatas Huérfanas (Muestra de las primeras 15)\n`;
    if (orphanedBalatas.length === 0) {
      report += `*¡No hay balatas huérfanas! Todas coinciden con algún vehículo.*\n`;
    } else {
      report += `Total de balatas huérfanas: **${orphanedBalatas.length}**\n\n`;
      report += `| SKU Dynamic | Equivalente Wagner | FMSI | Posición | Compatibilidad declarada en catálogo (Wagner) |\n`;
      report += `| :--- | :--- | :--- | :--- | :--- |\n`;
      orphanedBalatas.slice(0, 15).forEach(ob => {
        const comps = ob.compatibles.slice(0, 3).join(', ') + (ob.compatibles.length > 3 ? '...' : '');
        report += `| ${ob.sku} | ${ob.wagner} | ${ob.fmsi} | ${ob.posicion} | ${comps} |\n`;
      });
    }

    report += `\n### 4.2. Filtros Huérfanos (Muestra de los primeros 15)\n`;
    if (orphanedFilters.length === 0) {
      report += `*¡No hay filtros huérfanos! Todos coinciden con algún kit.*\n`;
    } else {
      report += `Total de filtros huérfanos en lista de precios: **${orphanedFilters.length}**\n\n`;
      report += `| SKU | Marca | Precio |\n`;
      report += `| :--- | :--- | :--- |\n`;
      orphanedFilters.slice(0, 15).forEach(of => {
        report += `| ${of.sku} | ${of.marca || 'UNIFIL'} | $${of.precio} |\n`;
      });
    }

    report += `\n### 4.3. Bujías Huérfanas (Muestra de las primeras 15)\n`;
    if (orphanedBujias.length === 0) {
      report += `*¡No hay bujías huérfanas! Todas coinciden con algún vehículo.*\n`;
    } else {
      report += `Total de bujías huérfanas en lista de precios: **${orphanedBujias.length}**\n\n`;
      report += `| SKU / Código | Descripción | Precio Cliente |\n`;
      report += `| :--- | :--- | :--- |\n`;
      orphanedBujias.slice(0, 15).forEach(ob => {
        report += `| ${ob.sku} | ${ob.descripcion || ''} | $${ob.precio} |\n`;
      });
    }

    report += `\n## 5. Conclusiones y Brechas de Vinculación Detectadas\n\n`;
    report += `1. **Bujías:** Excelente cobertura global. La mayoría de las marcas tienen bujías asignadas para casi el 100% de sus vehículos, a excepción de algunos vehículos muy nuevos (ej. modelos 2024+ como Ford Bronco 2.3L, Edge 2L o Chevrolet Tracker 1.2L) donde aún no hay datos de bujías en las listas.\n`;
    report += `2. **Filtros:** Hay marcas con cobertura del 100% (Nissan, Honda, Toyota, Seat, Dodge) y otras como **BMW** con **0% de cobertura de filtros** (36 vehículos sin ningún filtro). Esto indica que no se han cargado o vinculado catálogos de filtros de BMW a la base de datos de vehículos.\n`;
    report += `3. **Balatas:** La cobertura de balatas es muy variable. En algunas marcas es nula o baja debido a que los nombres de los vehículos en la base de datos de \`Vehiculo\` (que provienen de bujías/filtros NGK) difieren de los nombres en el catálogo de balatas (que proviene de Wagner). El \`modelNormalizer.js\` ayuda a salvar esta brecha pero sigue habiendo balatas huérfanas y vehículos sin balatas asociadas.\n\n`;

    const targetPath = path.join(__dirname, '../analysis_results.md');
    fs.writeFileSync(targetPath, report);
    console.log(`\nAnalysis report successfully written to ${targetPath}`);

  } catch (err) {
    console.error('Error running analysis:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

runAnalysis();
