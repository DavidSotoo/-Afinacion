const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

const MITSUBISHI_VEHICLES = [
  // Mirage
  {
    modelo: "Mirage",
    anio_inicio: 2014,
    anio_fin: 2024,
    motor: "3A92",
    litros: 1.2,
    cilindros_config: "L3",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5BI-11", codigo: "93298" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-617",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-7850"
  },
  // Mirage G4
  {
    modelo: "Mirage G4",
    anio_inicio: 2017,
    anio_fin: 2024,
    motor: "3A92",
    litros: 1.2,
    cilindros_config: "L3",
    aspiracion: "NA",
    bujia_stock: { tipo: "LZFR5BI-11", codigo: "93298" },
    bujia_iridium_ix: { tipo: "LFR5AIX-11", codigo: "4469" },
    bujia_g_power: { tipo: "LFR5AGP", codigo: "5018" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-917",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-7850"
  },
  // Lancer 2.0
  {
    modelo: "Lancer",
    anio_inicio: 2008,
    anio_fin: 2017,
    motor: "4B11",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "DIFR6C11", codigo: "1312" },
    bujia_iridium_ix: { tipo: "BKR6EIX-11", codigo: "3764" },
    bujia_g_power: { tipo: "BKR6EGP", codigo: "7092" },
    bujia_v_power: { tipo: "BKR6E-11", codigo: "96326" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10497",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Lancer 2.4
  {
    modelo: "Lancer",
    anio_inicio: 2009,
    anio_fin: 2017,
    motor: "4B12",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "DIFR5C11", codigo: "1311" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10497",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Outlander 2.4 (08-13)
  {
    modelo: "Outlander",
    anio_inicio: 2008,
    anio_fin: 2013,
    motor: "4B12",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "DIFR5C11", codigo: "1311" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-9688",
    aireSku: "FA-10497",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Outlander 2.4 (14-22)
  {
    modelo: "Outlander",
    anio_inicio: 2014,
    anio_fin: 2022,
    motor: "4J12",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "DILKR6D11G", codigo: "95264" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10910",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Outlander 3.0 (07-13)
  {
    modelo: "Outlander",
    anio_inicio: 2007,
    anio_fin: 2013,
    motor: "6B31",
    litros: 3.0,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "ILKR7B8", codigo: "1989" },
    bujia_iridium_ix: { tipo: "LKR7AIX", codigo: "93911" },
    bujia_g_power: { tipo: "LKR7BGP-8", codigo: "95983" },
    bujia_v_power: null,
    calibracion_mm: 0.8,
    aceiteSku: "FO-6607",
    aireSku: "FA-10497",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Outlander 3.0 (14-20)
  {
    modelo: "Outlander",
    anio_inicio: 2014,
    anio_fin: 2020,
    motor: "6B31",
    litros: 3.0,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "DILKR7C11", opacity: "94731" },
    bujia_iridium_ix: { tipo: "LKR7DIX-11S", codigo: "93175" },
    bujia_g_power: { tipo: "LKR7BGP-S", codigo: "97390" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10910",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Outlander Sport 2.0
  {
    modelo: "Outlander Sport",
    anio_inicio: 2013,
    anio_fin: 2024,
    motor: "4B11",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "DIFR6C11", codigo: "1312" },
    bujia_iridium_ix: { tipo: "BKR6EIX-11", codigo: "3764" },
    bujia_g_power: { tipo: "BKR6EGP", codigo: "7092" },
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10190",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // L200 2.4 Gas
  {
    modelo: "L200",
    anio_inicio: 2008,
    anio_fin: 2020,
    motor: "4G64",
    litros: 2.4,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "BKR5E-11", codigo: "5101" },
    bujia_iridium_ix: { tipo: "BKR5EIX-11", codigo: "5464" },
    bujia_g_power: { tipo: "BKR5EGP", codigo: "7090" },
    bujia_v_power: { tipo: "BKR5E-11", codigo: "5101" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10355",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10746"
  },
  // ASX
  {
    modelo: "ASX",
    anio_inicio: 2013,
    anio_fin: 2015,
    motor: "4B11",
    litros: 2.0,
    cilindros_config: "L4",
    aspiracion: "NA",
    bujia_stock: { tipo: "DIFR6C11", codigo: "1312" },
    bujia_iridium_ix: { tipo: "BKR6EIX-11", codigo: "3764" },
    bujia_g_power: { tipo: "BKR6EGP", codigo: "7092" },
    bujia_v_power: { tipo: "BKR6E-11", codigo: "96326" },
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10910",
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Eclipse Cross
  {
    modelo: "Eclipse Cross",
    anio_inicio: 2018,
    anio_fin: 2024,
    motor: "4B40",
    litros: 1.5,
    cilindros_config: "L4",
    aspiracion: "T",
    bujia_stock: { tipo: "SILKR7H8", codigo: "92154" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 0.8,
    aceiteSku: "FO-6607",
    aireSku: null,
    gasolinaSku: "SELLADO",
    cabinaSku: "FC-10140"
  },
  // Montero Sport
  {
    modelo: "Montero Sport",
    anio_inicio: 2018,
    anio_fin: 2022,
    motor: "6B31",
    litros: 3.0,
    cilindros_config: "V6",
    aspiracion: "NA",
    bujia_stock: { tipo: "DILKR7C11", codigo: "94731" },
    bujia_iridium_ix: null,
    bujia_g_power: null,
    bujia_v_power: null,
    calibracion_mm: 1.1,
    aceiteSku: "FO-6607",
    aireSku: "FA-10355",
    gasolinaSku: "SELLADO",
    cabinaSku: null
  }
];

const FILTER_ALTERNATES = {
  // Mitsubishi Air Filters
  'FA-617': { interfil: 'F-101A25', joe: 'JA11617' },
  'FA-917': { interfil: 'F-91A17', joe: 'JA917' },
  'FA-10497': { interfil: 'F-104A97', joe: 'JA10497' },
  'FA-10910': { interfil: 'F-109A10', joe: 'JA10910' },
  'FA-10190': { interfil: 'F-101A90', joe: 'JA10190' },
  'FA-10355': { interfil: 'F-103A55', joe: 'JA10355' },
  'FA-12967': { interfil: 'F-129A67', joe: 'JA12967' },

  // Oil Filters
  'FO-6607': { interfil: 'OF-6607' },
  'FO-9688': { interfil: 'OF-9688' },

  // Cabin Filters
  'FC-10140': { interfil: 'CFI-10140' },
  'FC-7850': { interfil: 'CFI-7850' },
  'FC-10746': { interfil: 'CFI-10746' }
};

function makeFilter(unifilSku, tipo) {
  if (!unifilSku) return null;
  if (unifilSku === 'SELLADO') {
    return {
      tipo,
      sku: 'SELLADO',
      marca: null,
      hasData: true,
      alternos: []
    };
  }

  const alternos = [];
  const altInfo = FILTER_ALTERNATES[unifilSku];
  if (altInfo) {
    if (altInfo.interfil) {
      alternos.push({ marca: 'INTERFIL', sku: altInfo.interfil });
    }
    if (altInfo.joe) {
      alternos.push({ marca: 'JOE', sku: altInfo.joe });
    }
  }

  return {
    tipo,
    sku: unifilSku,
    marca: 'UNIFIL',
    hasData: true,
    alternos
  };
}

function getFilterDescription(brand, sku) {
  const brandClean = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  let type = 'Aire';
  if (sku.startsWith('OF')) type = 'Aceite';
  else if (sku.startsWith('FGI')) type = 'Gasolina';
  else if (sku.startsWith('CFI')) type = 'Cabina';
  return `Filtro de ${type} (${brandClean})`;
}

async function ensureAlternatesInPrecioFiltro() {
  const PrecioFiltro = require('./models/PrecioFiltro');
  const uniqueKeys = new Map();

  for (const [unifilSku, alt] of Object.entries(FILTER_ALTERNATES)) {
    if (alt.interfil) {
      uniqueKeys.set(`INTERFIL_${alt.interfil}`, {
        clave: alt.interfil,
        marca: 'INTERFIL',
        precio: 80.0,
        descripcion: getFilterDescription('INTERFIL', alt.interfil)
      });
    }
    if (alt.joe) {
      uniqueKeys.set(`JOE_${alt.joe}`, {
        clave: alt.joe,
        marca: 'JOE',
        precio: 80.0,
        descripcion: getFilterDescription('JOE', alt.joe)
      });
    }
  }

  console.log(`⏳ Verificando ${uniqueKeys.size} claves de filtros alternos en la colección preciounifils...`);
  const bulkOps = [];
  
  for (const [key, filterData] of uniqueKeys.entries()) {
    const exists = await PrecioFiltro.findOne({
      marca: filterData.marca,
      clave: filterData.clave
    });
    if (!exists) {
      bulkOps.push({
        insertOne: {
          document: filterData
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    console.log(`   └─ Insertando ${bulkOps.length} nuevos filtros alternos en la base de datos...`);
    await PrecioFiltro.bulkWrite(bulkOps);
    console.log(`   └─ Filtros alternos insertados con éxito.`);
  } else {
    console.log(`   └─ Todos los filtros alternos ya existen en preciounifils.`);
  }
}

async function seed() {
  try {
    console.log('⚡ Conectando a MongoDB Atlas para sincronizar la marca Mitsubishi...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión establecida.');

    await ensureAlternatesInPrecioFiltro();

    console.log('⏳ Limpiando registros anteriores de Mitsubishi...');
    const deleteRes = await Vehiculo.deleteMany({ marca: /^mitsubishi$/i });
    console.log(`   └─ Eliminados ${deleteRes.deletedCount} vehículos Mitsubishi antiguos.`);

    const recordsToInsert = MITSUBISHI_VEHICLES.map(v => {
      return {
        marca: "Mitsubishi",
        modelo: v.modelo,
        anio_inicio: v.anio_inicio,
        anio_fin: v.anio_fin,
        motor: v.motor,
        litros: v.litros,
        cilindros_config: v.cilindros_config,
        aspiracion: v.aspiracion,
        bujia_stock: v.bujia_stock,
        bujia_iridium_ix: v.bujia_iridium_ix,
        bujia_g_power: v.bujia_g_power,
        bujia_v_power: v.bujia_v_power,
        calibracion_mm: v.calibracion_mm,
        filtros_unifil: {
          filtro_aire: v.aireSku || null,
          filtro_aceite: v.aceiteSku || null,
          filtro_gasolina: v.gasolinaSku === 'SELLADO' ? null : (v.gasolinaSku || null),
          filtro_cabina: v.cabinaSku || null
        },
        referencias_alternas: {
          filtro_aire_joe: FILTER_ALTERNATES[v.aireSku]?.joe || null,
          filtro_aceite_joe: FILTER_ALTERNATES[v.aceiteSku]?.joe || null,
          filtro_gasolina_joe: FILTER_ALTERNATES[v.gasolinaSku]?.joe || null,
          filtro_cabina_joe: FILTER_ALTERNATES[v.cabinaSku]?.joe || null
        },
        kit_afinacion: {
          filtro_aceite: makeFilter(v.aceiteSku, "Intercambiable / Cartucho"),
          filtro_aire: makeFilter(v.aireSku, "Panel / Cilíndrico"),
          filtro_gasolina: makeFilter(v.gasolinaSku, "Línea"),
          filtro_cabina: makeFilter(v.cabinaSku, "Polen")
        }
      };
    });

    console.log(`⏳ Insertando ${recordsToInsert.length} vehículos Mitsubishi nuevos en MongoDB Atlas...`);
    const insertRes = await Vehiculo.insertMany(recordsToInsert);
    console.log(`🎉 Inserción completada con éxito. Insertados ${insertRes.length} vehículos.`);

  } catch (err) {
    console.error('❌ Error durante el seed de Mitsubishi:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión con MongoDB cerrada.');
    process.exit(0);
  }
}

seed();

