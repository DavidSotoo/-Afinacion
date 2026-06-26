const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

/**
 * seed_audi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Vehículos Audi para el mercado mexicano.
 *
 * Bujías NGK: Todos los motores TFSI/TSI turbo usan bujías de Laser-Platino o
 * Laser-Iridio NGK. NO existen equivalentes Iridium IX ni G-Power en el
 * catálogo NGK México para estos motores turbo de inyección directa.
 *
 * Fuente NGK: Catálogo TecAlliance NGK MX / ngkntk.com.mx
 *
 * Filtros: Grupo VAG (Volkswagen-Audi). Se usan SKUs Unifil con alternos
 * Interfil y JOE.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AUDI_VEHICLES = [

  // ─── A1 ───────────────────────────────────────────────────────────────────
  {
    modelo: 'A1',
    anio_inicio: 2011, anio_fin: 2018,
    motor: 'CAVG/CZCA', litros: 1.4, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR6R — código NGK 2513
    bujia_stock:      { tipo: 'PZFR6R',     codigo: '2513' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'A1',
    anio_inicio: 2019, anio_fin: 2023,
    motor: 'DKLA', litros: 1.5, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },

  // ─── A3 ───────────────────────────────────────────────────────────────────
  {
    modelo: 'A3',
    anio_inicio: 2009, anio_fin: 2016,
    motor: 'CAXC/CHPA', litros: 1.4, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR6R — código NGK 2513
    bujia_stock:      { tipo: 'PZFR6R',     codigo: '2513' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'A3',
    anio_inicio: 2008, anio_fin: 2016,
    motor: 'CJSA/CZEA', litros: 1.8, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'A3',
    anio_inicio: 2008, anio_fin: 2013,
    motor: 'CDLB/CHHB', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR7HG — código NGK 1423
    bujia_stock:      { tipo: 'PZFR7HG',    codigo: '1423' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'A3',
    anio_inicio: 2013, anio_fin: 2022,
    motor: 'CZPB/DKZA', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },

  // ─── A4 ───────────────────────────────────────────────────────────────────
  {
    modelo: 'A4',
    anio_inicio: 2008, anio_fin: 2015,
    motor: 'CABA/CDNB', litros: 1.8, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'A4',
    anio_inicio: 2008, anio_fin: 2015,
    motor: 'CDNC/CDLB', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR7HG — código NGK 1423
    bujia_stock:      { tipo: 'PZFR7HG',    codigo: '1423' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'A4',
    anio_inicio: 2015, anio_fin: 2022,
    motor: 'CYRA/DETA', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },

  // ─── Q3 ───────────────────────────────────────────────────────────────────
  {
    modelo: 'Q3',
    anio_inicio: 2013, anio_fin: 2018,
    motor: 'CCZC/CLLA', litros: 1.4, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR6R — código NGK 2513
    bujia_stock:      { tipo: 'PZFR6R',     codigo: '2513' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'Q3',
    anio_inicio: 2012, anio_fin: 2018,
    motor: 'CCZB/CULB', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR7HG — código NGK 1423
    bujia_stock:      { tipo: 'PZFR7HG',    codigo: '1423' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'Q3',
    anio_inicio: 2019, anio_fin: 2024,
    motor: 'DKLA', litros: 1.5, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'Q3',
    anio_inicio: 2019, anio_fin: 2024,
    motor: 'DKZB/DKZD', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-1793',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },

  // ─── Q5 ───────────────────────────────────────────────────────────────────
  {
    modelo: 'Q5',
    anio_inicio: 2009, anio_fin: 2017,
    motor: 'CDNB/CAHA', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR7HG — código NGK 1423
    bujia_stock:      { tipo: 'PZFR7HG',    codigo: '1423' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'Q5',
    anio_inicio: 2017, anio_fin: 2024,
    motor: 'CYPA/CZPA', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },

  // ─── Q7 ───────────────────────────────────────────────────────────────────
  {
    modelo: 'Q7',
    anio_inicio: 2010, anio_fin: 2019,
    motor: 'CREC/CGRA', litros: 3.0, cilindros_config: 'V6', aspiracion: 'T',
    // NGK Laser Iridium IZFR6K11 — código NGK 3764  (supercharged V6)
    bujia_stock:      { tipo: 'IZFR6K11',   codigo: '93632' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 1.1,
    aceiteSku:    'FO-3',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },

  // ─── TT ───────────────────────────────────────────────────────────────────
  {
    modelo: 'TT',
    anio_inicio: 2008, anio_fin: 2014,
    motor: 'CESA', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Platinum PZFR7HG — código NGK 1423
    bujia_stock:      { tipo: 'PZFR7HG',    codigo: '1423' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
  {
    modelo: 'TT',
    anio_inicio: 2015, anio_fin: 2022,
    motor: 'DNWA', litros: 2.0, cilindros_config: 'L4', aspiracion: 'T',
    // NGK Laser Iridium ILZKR7B8EGS — código NGK 93924
    bujia_stock:      { tipo: 'ILZKR7B8EGS', codigo: '93924' },
    bujia_iridium_ix: null,
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm: 0.8,
    aceiteSku:    'FO-14',
    aireSku:      'FA-11613',
    gasolinaSku:  'SELLADO',
    cabinaSku:    'FC-11566',
  },
];

// ─── Filtros alternos por SKU Unifil ────────────────────────────────────────
const FILTER_ALTERNATES = {
  // Filtros de Aceite
  'FO-14':    { interfil: 'OF-14' },
  'FO-3':     { interfil: 'OF-3'  },

  // Filtros de Aire
  'FA-1793':  { interfil: 'F-17A93',  joe: 'JA1793'  },
  'FA-11613': { interfil: 'F-116A13', joe: 'JA11613' },

  // Filtros de Cabina
  'FC-11566': { interfil: 'CFI-11566', joe: 'JC11566' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function makeFilter(unifilSku, tipo) {
  if (!unifilSku) return null;
  if (unifilSku === 'SELLADO') {
    return { tipo, sku: 'SELLADO', marca: null, hasData: true, alternos: [] };
  }
  const alternos = [];
  const altInfo = FILTER_ALTERNATES[unifilSku];
  if (altInfo) {
    if (altInfo.interfil) alternos.push({ marca: 'INTERFIL', sku: altInfo.interfil });
    if (altInfo.joe)     alternos.push({ marca: 'JOE',      sku: altInfo.joe     });
  }
  return { tipo, sku: unifilSku, marca: 'UNIFIL', hasData: true, alternos };
}

function getFilterDescription(brand, sku) {
  let type = 'Aire';
  if (sku.startsWith('OF'))  type = 'Aceite';
  if (sku.startsWith('CFI')) type = 'Cabina';
  return `Filtro de ${type} (${brand})`;
}

async function ensureAlternatesInPrecioFiltro() {
  const PrecioFiltro = require('./models/PrecioFiltro');
  const uniqueKeys = new Map();

  for (const [, alt] of Object.entries(FILTER_ALTERNATES)) {
    if (alt.interfil) {
      uniqueKeys.set(`INTERFIL_${alt.interfil}`, {
        clave: alt.interfil, marca: 'INTERFIL', precio: 80.0,
        descripcion: getFilterDescription('INTERFIL', alt.interfil)
      });
    }
    if (alt.joe) {
      uniqueKeys.set(`JOE_${alt.joe}`, {
        clave: alt.joe, marca: 'JOE', precio: 80.0,
        descripcion: getFilterDescription('JOE', alt.joe)
      });
    }
  }

  console.log(`⏳ Verificando ${uniqueKeys.size} claves de filtros alternos Audi...`);
  const bulkOps = [];
  for (const [, filterData] of uniqueKeys.entries()) {
    const exists = await PrecioFiltro.findOne({ marca: filterData.marca, clave: filterData.clave });
    if (!exists) bulkOps.push({ insertOne: { document: filterData } });
  }
  if (bulkOps.length > 0) {
    await PrecioFiltro.bulkWrite(bulkOps);
    console.log(`   └─ Insertados ${bulkOps.length} filtros alternos.`);
  } else {
    console.log(`   └─ Todos los filtros alternos ya existen.`);
  }
}

// ─── Seed principal ──────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('⚡ Conectando a MongoDB Atlas para sincronizar Audi...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión establecida.');

    await ensureAlternatesInPrecioFiltro();

    console.log('⏳ Limpiando registros anteriores de Audi...');
    const del = await Vehiculo.deleteMany({ marca: /^audi$/i });
    console.log(`   └─ Eliminados ${del.deletedCount} vehículos Audi anteriores.`);

    const records = AUDI_VEHICLES.map(v => ({
      marca:             'Audi',
      modelo:            v.modelo,
      anio_inicio:       v.anio_inicio,
      anio_fin:          v.anio_fin,
      motor:             v.motor,
      litros:            v.litros,
      cilindros_config:  v.cilindros_config,
      aspiracion:        v.aspiracion,
      bujia_stock:       v.bujia_stock,
      bujia_iridium_ix:  v.bujia_iridium_ix,
      bujia_g_power:     v.bujia_g_power,
      bujia_v_power:     v.bujia_v_power,
      calibracion_mm:    v.calibracion_mm,
      filtros_unifil: {
        filtro_aire:      v.aireSku   || null,
        filtro_aceite:    v.aceiteSku || null,
        filtro_gasolina:  v.gasolinaSku === 'SELLADO' ? null : (v.gasolinaSku || null),
        filtro_cabina:    v.cabinaSku  || null,
      },
      referencias_alternas: {
        filtro_aire_joe:      FILTER_ALTERNATES[v.aireSku]?.joe      || null,
        filtro_aceite_joe:    FILTER_ALTERNATES[v.aceiteSku]?.joe    || null,
        filtro_gasolina_joe:  FILTER_ALTERNATES[v.gasolinaSku]?.joe  || null,
        filtro_cabina_joe:    FILTER_ALTERNATES[v.cabinaSku]?.joe    || null,
      },
      kit_afinacion: {
        filtro_aceite:   makeFilter(v.aceiteSku,   'Intercambiable / Cartucho'),
        filtro_aire:     makeFilter(v.aireSku,     'Panel / Cilíndrico'),
        filtro_gasolina: makeFilter(v.gasolinaSku, 'Línea'),
        filtro_cabina:   makeFilter(v.cabinaSku,   'Polen'),
      }
    }));

    const inserted = await Vehiculo.insertMany(records);
    console.log(`\n🎉 Insertados ${inserted.length} vehículos Audi exitosamente.`);
    console.log('\nModelos agregados:');
    const byModel = {};
    records.forEach(r => { byModel[r.modelo] = (byModel[r.modelo] || 0) + 1; });
    Object.entries(byModel).forEach(([m, n]) => console.log(`   • ${m}: ${n} variante(s)`));

  } catch (err) {
    console.error('❌ Error durante el seed de Audi:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Conexión cerrada.');
    process.exit(0);
  }
}

seed();
