const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Vehiculo = require('./models/Vehiculo');

/**
 * seed_bmw.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Vehículos BMW para el mercado mexicano (gasolina).
 *
 * Motores y bujías NGK:
 *  • N20B20  (2.0L 4-cil Turbo, 2012-2016)  → ILZKR7B8EGS  (código 93924)
 *  • N55B30  (3.0L 6-cil Turbo, 2012-2016)  → SILZKBR8D8S  (código 97952)
 *  • B38B15  (1.5L 3-cil Turbo, 2014+)      → SILZKR8D8EG  (código 97507)
 *  • B48B20  (2.0L 4-cil Turbo, 2014+)      → SILZKR8D8EG  (código 97507)
 *  • B58B30  (3.0L 6-cil Turbo, 2015+)      → ILZKR7B8EGS  (código 93924)
 *  • B46B20  (2.0L 4-cil Turbo, 2019+)      → SILZKR8D8EG  (código 97507)
 *
 * Fuente NGK: TecAlliance NGK Catalog / ngkntk.com.mx
 * Calibración: 0.8 mm (estándar turbo BMW)
 *
 * Filtros: Pendientes de catálogo Interfil/Unifil BMW.
 *          Se marcan como null → UI muestra "en verificación".
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Alias de bujías para legibilidad
const PLUGS = {
  // N20 (2.0T 4-cil, gen anterior)
  N20:  { tipo: 'ILZKR7B8EGS', codigo: '93924', cal: 0.8 },
  // N55 (3.0T 6-cil, gen anterior TwinPower)
  N55:  { tipo: 'SILZKBR8D8S', codigo: '97952', cal: 0.8 },
  // B38 (1.5T 3-cil, gen actual)
  B38:  { tipo: 'SILZKR8D8EG', codigo: '97507', cal: 0.8 },
  // B48 (2.0T 4-cil, gen actual)
  B48:  { tipo: 'SILZKR8D8EG', codigo: '97507', cal: 0.8 },
  // B46 (2.0T 4-cil, variante posterior 2019+)
  B46:  { tipo: 'SILZKR8D8EG', codigo: '97507', cal: 0.8 },
  // B58 (3.0T 6-cil, gen actual)
  B58:  { tipo: 'ILZKR7B8EGS', codigo: '93924', cal: 0.8 },
};

function plug(engine) {
  return {
    bujia_stock:      { tipo: PLUGS[engine].tipo, codigo: PLUGS[engine].codigo },
    bujia_iridium_ix: null,  // BMW turbo no tiene línea Iridium IX equivalente
    bujia_g_power:    null,
    bujia_v_power:    null,
    calibracion_mm:   PLUGS[engine].cal,
  };
}

const BMW_VEHICLES = [

  // ══════════════════════════════════════════════════════════════════════════
  //  SERIE 1
  // ══════════════════════════════════════════════════════════════════════════

  // 118i — N13 1.6T → desde ~2012 México usó motor N20 en algunos mercados,
  // pero en MX la 118i vino con N20 (sedán) o B38 (hatch F20 facelift)
  {
    modelo: 'Serie 1', motor: 'N20/CABA', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2012, anio_fin: 2014,
    ...plug('N20'),
  },
  {
    modelo: 'Serie 1', motor: 'B38B15', litros: 1.5, cilindros_config: 'L3',
    aspiracion: 'T', anio_inicio: 2015, anio_fin: 2021,
    ...plug('B38'),
  },
  {
    modelo: 'Serie 1', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2015, anio_fin: 2021,
    ...plug('B48'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  SERIE 2
  // ══════════════════════════════════════════════════════════════════════════

  {
    modelo: 'Serie 2', motor: 'B38B15', litros: 1.5, cilindros_config: 'L3',
    aspiracion: 'T', anio_inicio: 2014, anio_fin: 2022,
    ...plug('B38'),
  },
  {
    modelo: 'Serie 2', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2014, anio_fin: 2022,
    ...plug('B48'),
  },
  {
    modelo: 'Serie 2', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2015, anio_fin: 2022,
    ...plug('B58'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  SERIE 3
  // ══════════════════════════════════════════════════════════════════════════

  // F30 — 320i con N20
  {
    modelo: 'Serie 3', motor: 'N20B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2012, anio_fin: 2018,
    ...plug('N20'),
  },
  // G20 — 320i con B48
  {
    modelo: 'Serie 3', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2019, anio_fin: 2025,
    ...plug('B48'),
  },
  // F30 — 328i con N20 (también presente en MX)
  {
    modelo: 'Serie 3', motor: 'N20B20-S', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2012, anio_fin: 2015,
    ...plug('N20'),
  },
  // 330i — B46/B48
  {
    modelo: 'Serie 3', motor: 'B46B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2016, anio_fin: 2025,
    ...plug('B46'),
  },
  // 340i / M340i — B58
  {
    modelo: 'Serie 3', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2016, anio_fin: 2025,
    ...plug('B58'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  SERIE 4
  // ══════════════════════════════════════════════════════════════════════════

  // F32/G22 — 420i con N20 luego B48
  {
    modelo: 'Serie 4', motor: 'N20B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2013, anio_fin: 2020,
    ...plug('N20'),
  },
  {
    modelo: 'Serie 4', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2020, anio_fin: 2025,
    ...plug('B48'),
  },
  // 430i / M440i — B58
  {
    modelo: 'Serie 4', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2016, anio_fin: 2025,
    ...plug('B58'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  SERIE 5
  // ══════════════════════════════════════════════════════════════════════════

  // F10 — 520i con N20
  {
    modelo: 'Serie 5', motor: 'N20B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2011, anio_fin: 2016,
    ...plug('N20'),
  },
  // G30 — 520i con B48
  {
    modelo: 'Serie 5', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2017, anio_fin: 2025,
    ...plug('B48'),
  },
  // 528i/530i — N20/B48
  {
    modelo: 'Serie 5', motor: 'B46B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2016, anio_fin: 2025,
    ...plug('B46'),
  },
  // 540i / M550i — B58
  {
    modelo: 'Serie 5', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2017, anio_fin: 2025,
    ...plug('B58'),
  },
  // 535i — N55
  {
    modelo: 'Serie 5', motor: 'N55B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2011, anio_fin: 2016,
    ...plug('N55'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  X1
  // ══════════════════════════════════════════════════════════════════════════

  // E84 — X1 20i con N20
  {
    modelo: 'X1', motor: 'N20B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2011, anio_fin: 2015,
    ...plug('N20'),
  },
  // F48 — X1 18i con B38
  {
    modelo: 'X1', motor: 'B38B15', litros: 1.5, cilindros_config: 'L3',
    aspiracion: 'T', anio_inicio: 2015, anio_fin: 2022,
    ...plug('B38'),
  },
  // F48/U11 — X1 20i con B48
  {
    modelo: 'X1', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2015, anio_fin: 2025,
    ...plug('B48'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  X2
  // ══════════════════════════════════════════════════════════════════════════

  {
    modelo: 'X2', motor: 'B38B15', litros: 1.5, cilindros_config: 'L3',
    aspiracion: 'T', anio_inicio: 2018, anio_fin: 2024,
    ...plug('B38'),
  },
  {
    modelo: 'X2', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2018, anio_fin: 2024,
    ...plug('B48'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  X3
  // ══════════════════════════════════════════════════════════════════════════

  // F25 — xDrive20i con N20
  {
    modelo: 'X3', motor: 'N20B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2011, anio_fin: 2017,
    ...plug('N20'),
  },
  // G01 — xDrive20i con B48
  {
    modelo: 'X3', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2017, anio_fin: 2025,
    ...plug('B48'),
  },
  // xDrive30i — B48/B58
  {
    modelo: 'X3', motor: 'B46B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2019, anio_fin: 2025,
    ...plug('B46'),
  },
  // xDrive30i 3.0T / M40i — B58
  {
    modelo: 'X3', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2018, anio_fin: 2025,
    ...plug('B58'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  X4
  // ══════════════════════════════════════════════════════════════════════════

  {
    modelo: 'X4', motor: 'N20B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2014, anio_fin: 2018,
    ...plug('N20'),
  },
  {
    modelo: 'X4', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2018, anio_fin: 2025,
    ...plug('B48'),
  },
  {
    modelo: 'X4', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2018, anio_fin: 2025,
    ...plug('B58'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  X5
  // ══════════════════════════════════════════════════════════════════════════

  // F15 — xDrive35i con N55
  {
    modelo: 'X5', motor: 'N55B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2013, anio_fin: 2018,
    ...plug('N55'),
  },
  // G05 — xDrive40i con B58
  {
    modelo: 'X5', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2018, anio_fin: 2025,
    ...plug('B58'),
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  Z4
  // ══════════════════════════════════════════════════════════════════════════

  // G29 — sDrive20i con B48
  {
    modelo: 'Z4', motor: 'B48B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2019, anio_fin: 2025,
    ...plug('B48'),
  },
  // G29 — sDrive30i con B46/B58
  {
    modelo: 'Z4', motor: 'B46B20', litros: 2.0, cilindros_config: 'L4',
    aspiracion: 'T', anio_inicio: 2019, anio_fin: 2025,
    ...plug('B46'),
  },
  {
    modelo: 'Z4', motor: 'B58B30', litros: 3.0, cilindros_config: 'L6',
    aspiracion: 'T', anio_inicio: 2019, anio_fin: 2025,
    ...plug('B58'),
  },
];

// ─── Seed principal ──────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('⚡ Conectando a MongoDB Atlas para sincronizar BMW...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión establecida.');

    console.log('⏳ Limpiando registros anteriores de BMW...');
    const del = await Vehiculo.deleteMany({ marca: /^bmw$/i });
    console.log(`   └─ Eliminados ${del.deletedCount} vehículos BMW anteriores.`);

    // Filtros → null por ahora (catálogo Interfil/JOE BMW pendiente de confirmar)
    const records = BMW_VEHICLES.map(v => ({
      marca:            'BMW',
      modelo:           v.modelo,
      anio_inicio:      v.anio_inicio,
      anio_fin:         v.anio_fin,
      motor:            v.motor,
      litros:           v.litros,
      cilindros_config: v.cilindros_config,
      aspiracion:       v.aspiracion,
      bujia_stock:      v.bujia_stock,
      bujia_iridium_ix: v.bujia_iridium_ix,
      bujia_g_power:    v.bujia_g_power,
      bujia_v_power:    v.bujia_v_power,
      calibracion_mm:   v.calibracion_mm,
      filtros_unifil:   {},     // pendiente de catálogo BMW
      referencias_alternas: {},
      // kit_afinacion con filtros null → UI muestra "en verificación"
      kit_afinacion: {
        filtro_aceite:   null,
        filtro_aire:     null,
        filtro_gasolina: null,
        filtro_cabina:   null,
      },
    }));

    const inserted = await Vehiculo.insertMany(records);
    console.log(`\n🎉 Insertados ${inserted.length} vehículos BMW exitosamente.`);

    console.log('\nModelos agregados:');
    const byModel = {};
    records.forEach(r => { byModel[r.modelo] = (byModel[r.modelo] || 0) + 1; });
    Object.entries(byModel).forEach(([m, n]) => console.log(`   • ${m}: ${n} variante(s)`));

    console.log('\nResumen de bujías NGK:');
    const byPlug = {};
    records.forEach(r => {
      const t = r.bujia_stock?.tipo || '–';
      byPlug[t] = (byPlug[t] || 0) + 1;
    });
    Object.entries(byPlug).forEach(([t, n]) => console.log(`   • ${t}: ${n} aplicaciones`));

  } catch (err) {
    console.error('❌ Error durante el seed de BMW:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Conexión cerrada.');
    process.exit(0);
  }
}

seed();
