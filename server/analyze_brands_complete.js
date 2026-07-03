const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Vehiculo = require('./models/Vehiculo');

async function analyze() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB Atlas.');

    const vehiculos = await Vehiculo.find({});
    console.log(`Total de vehículos registrados en la base de datos: ${vehiculos.length}\n`);

    const marcasMap = {};

    for (const v of vehiculos) {
      const marca = (v.marca || 'DESCONOCIDA').trim().toUpperCase();
      if (!marcasMap[marca]) {
        marcasMap[marca] = {
          total: 0,
          conBujiaStock: 0,
          conBujiaIridium: 0,
          conBujiaGPower: 0,
          conBujiaVPower: 0,
          sinNingunaBujia: 0,
          ejemplosSinBujia: [],

          conKitCompleto: 0,
          conAlgunFiltro: 0,
          sinFiltros: 0,
          ejemplosSinFiltros: [],

          filtrosDetalle: {
            aceite: 0,
            aire: 0,
            gasolina: 0,
            cabina: 0
          }
        };
      }

      const stats = marcasMap[marca];
      stats.total++;

      // Analysis of Bujias
      const tieneStock = !!(v.bujia_stock && v.bujia_stock.codigo);
      const tieneIridium = !!(v.bujia_iridium_ix && v.bujia_iridium_ix.codigo);
      const tieneGPower = !!(v.bujia_g_power && v.bujia_g_power.codigo);
      const tieneVPower = !!(v.bujia_v_power && v.bujia_v_power.codigo);

      if (tieneStock) stats.conBujiaStock++;
      if (tieneIridium) stats.conBujiaIridium++;
      if (tieneGPower) stats.conBujiaGPower++;
      if (tieneVPower) stats.conBujiaVPower++;

      const tieneAlgunaBujia = tieneStock || tieneIridium || tieneGPower || tieneVPower;
      if (!tieneAlgunaBujia) {
        stats.sinNingunaBujia++;
        if (stats.ejemplosSinBujia.length < 5) {
          stats.ejemplosSinBujia.push(`${v.modelo} ${v.litros || ''}L (${v.anio_inicio}-${v.anio_fin})`);
        }
      }

      // Analysis of Kit & Filtros
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      const fGasolina = kit.filtro_gasolina && kit.filtro_gasolina.sku;
      const fCabina = kit.filtro_cabina && kit.filtro_cabina.sku;

      if (fAceite) stats.filtrosDetalle.aceite++;
      if (fAire) stats.filtrosDetalle.aire++;
      if (fGasolina) stats.filtrosDetalle.gasolina++;
      if (fCabina) stats.filtrosDetalle.cabina++;

      const tieneAceiteValido = fAceite && fAceite !== 'SELLADO';
      const tieneAireValido = fAire && fAire !== 'SELLADO';

      const cuentaFiltrosValidos = [fAceite, fAire, fGasolina, fCabina].filter(f => f && f !== 'SELLADO').length;
      const cuentaFiltrosTotales = [fAceite, fAire, fGasolina, fCabina].filter(Boolean).length;

      if (cuentaFiltrosTotales > 0) {
        stats.conAlgunFiltro++;
      } else {
        stats.sinFiltros++;
        if (stats.ejemplosSinFiltros.length < 5) {
          stats.ejemplosSinFiltros.push(`${v.modelo} ${v.litros || ''}L (${v.anio_inicio}-${v.anio_fin})`);
        }
      }

      // Deﬁnir kit completo (por lo menos aceite y aire o lo necesario)
      if (tieneAceiteValido && tieneAireValido) {
        stats.conKitCompleto++;
      }
    }

    console.log('================================================================================');
    console.log('                    REPORTE GENERAL DE MARCAS EN CATÁLOGO                      ');
    console.log('================================================================================\n');

    for (const [marca, data] of Object.entries(marcasMap)) {
      console.log(`MARCA: ${marca}`);
      console.log(`  - Total de Vehículos / Variantes: ${data.total}`);
      console.log(`  - BUJÍAS:`);
      console.log(`    * Con Stock: ${data.conBujiaStock} | Iridium: ${data.conBujiaIridium} | G-Power: ${data.conBujiaGPower} | V-Power: ${data.conBujiaVPower}`);
      console.log(`    * Vehículos SIN ninguna bujía: ${data.sinNingunaBujia}`);
      if (data.sinNingunaBujia > 0) {
        console.log(`      Ejemplos sin bujía: ${data.ejemplosSinBujia.join(', ')}`);
      }
      console.log(`  - FILTROS / KIT DE AFINACIÓN:`);
      console.log(`    * Con algún filtro asignado: ${data.conAlgunFiltro} (${((data.conAlgunFiltro/data.total)*100).toFixed(1)}%)`);
      console.log(`    * Con Kit con Aceite + Aire válidos: ${data.conKitCompleto}`);
      console.log(`    * Vehículos SIN filtros/kit asignados: ${data.sinFiltros} (${((data.sinFiltros/data.total)*100).toFixed(1)}%)`);
      console.log(`    * Desglose Filtros -> Aceite: ${data.filtrosDetalle.aceite} | Aire: ${data.filtrosDetalle.aire} | Gasolina: ${data.filtrosDetalle.gasolina} | Cabina: ${data.filtrosDetalle.cabina}`);
      if (data.sinFiltros > 0) {
        console.log(`      Ejemplos sin filtros: ${data.ejemplosSinFiltros.join(', ')}`);
      }
      console.log('--------------------------------------------------------------------------------');
    }

  } catch (err) {
    console.error('Error durante el análisis:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB.');
  }
}

analyze();
