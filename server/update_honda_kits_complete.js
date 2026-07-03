const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

const updates = [
  {
    filterQuery: { modelo: 'BR-V', anio_inicio: 2024 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'JA2055', marca: 'JOE', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8092', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'City', anio_inicio: 2024 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'JA2055', marca: 'JOE', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8092', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Civic', litros: 1.6, anio_inicio: 1993 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-71A74', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FGI-45', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Civic', litros: 2, anio_inicio: 2022 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-22A05', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8092', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Civic Type R' },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'JA10967', marca: 'JOE', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8092', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'HR-V', litros: 2, anio_inicio: 2023 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-22A05', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8092', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'HR-V', litros: 2, anio_inicio: 2024 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-22A05', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'CFI-8092', marca: 'Interfil', hasData: true, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Passport', litros: 3.2, anio_inicio: 1994 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-74A20', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FGI-52', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Passport', litros: 2.6 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-74A20', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FGI-52', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] }
    }
  },
  {
    filterQuery: { modelo: 'Passport', litros: 3.2, anio_inicio: 1996 },
    kit: {
      filtro_aceite: { tipo: 'Intercambiable / Cartucho', sku: 'OF-3593', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_aire: { tipo: 'Panel / Cilíndrico', sku: 'F-74A20', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_gasolina: { tipo: 'Línea', sku: 'FGI-52', marca: 'Interfil', hasData: true, alternos: [] },
      filtro_cabina: { tipo: 'Polen', sku: 'SELLADO', marca: 'Interfil', hasData: false, alternos: [] }
    }
  }
];

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB para actualizar Honda...\n');

    let totalUpdated = 0;

    for (const item of updates) {
      const query = { marca: /honda/i, ...item.filterQuery };
      const res = await Vehiculo.updateMany(query, { $set: { kit_afinacion: item.kit } });
      console.log(`Query: ${JSON.stringify(item.filterQuery)} -> Modificados: ${res.modifiedCount}`);
      totalUpdated += res.modifiedCount;
    }

    console.log(`\n¡Actualización completada! Total vehículos actualizados: ${totalUpdated}`);

    // Verify Honda state
    const hondas = await Vehiculo.find({ marca: /honda/i });
    const sinKit = hondas.filter(v => {
      const kit = v.kit_afinacion || {};
      const fAceite = kit.filtro_aceite && kit.filtro_aceite.sku;
      const fAire = kit.filtro_aire && kit.filtro_aire.sku;
      return !fAceite && !fAire;
    });

    console.log(`\nESTADO FINAL HONDA: ${hondas.length - sinKit.length} / ${hondas.length} vehículos con Kit asignado (${(((hondas.length - sinKit.length)/hondas.length)*100).toFixed(1)}%).`);

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

main();
