const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

const updates = [
  {
    filterQuery: { modelo: '200SX', litros: 1.6, anio_inicio: 1995 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4309', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FG-27', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: '240SX', litros: 2.4, anio_inicio: 1993 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4309', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FG-27', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: '300ZX', motor: 'VG30DE' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4310', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FG-27', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: '300ZX', motor: 'VG30DETT' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4310', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FG-27', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: '370Z Nismo' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-10544', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'FC-10550', marca: 'UNIFIL', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Kicks e-POWER' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-5RA0A', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'FC-12552', marca: 'UNIFIL', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Pathfinder', anio_inicio: 2023 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4309', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'FC-2725', marca: 'UNIFIL', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Tsuru', litros: 1.6 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4309', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FG-27', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Tsuru', litros: 2 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-4309', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FG-27', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Z', anio_inicio: 2023 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'FO-6607', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'FA-10544', marca: 'UNIFIL', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'UNIFIL', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'FC-10550', marca: 'UNIFIL', hasData: true, alternos: [] }
    }
  }
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para actualizar Nissan...\n');

    let totalUpdated = 0;

    for (const item of updates) {
      const query = { marca: /nissan/i, ...item.filterQuery };
      const res = await Vehiculo.updateMany(query, { $set: { kit_afinacion: item.kit } });
      console.log(`Query: ${JSON.stringify(item.filterQuery)} -> Modificados: ${res.modifiedCount}`);
      totalUpdated += res.modifiedCount;
    }

    console.log(`\n¡Actualización completada! Total vehículos actualizados: ${totalUpdated}`);

    // Verify Nissan state
    const nissans = await Vehiculo.find({ marca: /nissan/i });
    const sinKit = nissans.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });

    console.log(`\nESTADO FINAL NISSAN: ${nissans.length - sinKit.length} / ${nissans.length} vehículos con Kit asignado (${(((nissans.length - sinKit.length)/nissans.length)*100).toFixed(1)}%).`);

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
