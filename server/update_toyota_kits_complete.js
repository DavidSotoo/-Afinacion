const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

const updates = [
  {
    filterQuery: { modelo: 'Avalon', litros: 2.5 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-9972', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-49A31', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8719', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Avanza', anio_inicio: 2023 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-4967', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-101A25', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8719', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'MR2 Spyder' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-4967', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'JA6395', marca: 'JOE', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: null, hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Raize' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-4967', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'JAZ110', marca: 'JOE', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8719', marca: 'Interfil', hasData: true, alternos: [] }
    },
    bujia_stock: { tipo: 'Laser Iridium', codigo: 'SILKAR7G8G' }
  },
  {
    filterQuery: { modelo: 'Rush' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-4967', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-17A10', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: null, hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Supra' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-9972', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'JA12377', marca: 'JOE', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8719', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Tacoma', litros: 3.4 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3614', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-11A69', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: null, hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8719', marca: 'Interfil', hasData: true, alternos: [] }
    }
  }
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para actualizar Toyota...\n');

    let totalUpdated = 0;

    for (const item of updates) {
      const query = { marca: /toyota/i, ...item.filterQuery };
      const updateDoc = { kit_afinacion: item.kit };
      if (item.bujia_stock) {
        updateDoc.bujia_stock = item.bujia_stock;
      }
      const res = await Vehiculo.updateMany(query, { $set: updateDoc });
      console.log(`Query: ${JSON.stringify(item.filterQuery)} -> Modificados: ${res.modifiedCount}`);
      totalUpdated += res.modifiedCount;
    }

    console.log(`\n¡Actualización completada! Total vehículos actualizados: ${totalUpdated}`);

    // Verify Toyota state
    const toyotas = await Vehiculo.find({ marca: /toyota/i });
    const sinKit = toyotas.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });
    const sinBujia = toyotas.filter(v => !v.bujia_stock?.codigo && !v.bujia_iridium_ix?.codigo && !v.bujia_g_power?.codigo && !v.bujia_v_power?.codigo);

    console.log(`\nESTADO FINAL TOYOTA:`);
    console.log(`- Kits asignados: ${toyotas.length - sinKit.length} / ${toyotas.length} (${(((toyotas.length - sinKit.length)/toyotas.length)*100).toFixed(1)}%).`);
    console.log(`- Bujías asignadas: ${toyotas.length - sinBujia.length} / ${toyotas.length} (${(((toyotas.length - sinBujia.length)/toyotas.length)*100).toFixed(1)}%).`);

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
