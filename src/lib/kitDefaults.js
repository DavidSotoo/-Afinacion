/**
 * lib/kitDefaults.js
 * ─────────────────────────────────────────────────────────────
 * Motor relacional de filtros para el Kit de Afinación de 5 piezas.
 *
 * Jerarquía de búsqueda (de más específico a más genérico):
 *   1. modelo + motor        → match exacto
 *   2. modelo + motor=null   → registro genérico del modelo
 *   3. Sin match             → estado FALLBACK: "Consultar SKU con mostrador"
 *
 * Flujo de build (ejecutado UNA SOLA VEZ al cargar el módulo):
 *   • Importa los 3 catálogos de filtros (nissan / vw / chevrolet)
 *   • Construye un Map<string, FiltroRecord> indexado por clave canónica
 *   • computeKitAfinacion(bujia) consulta el Map y aplica fallback si necesario
 *
 * Para AÑADIR un filtro real: solo edita el archivo de datos correspondiente
 * (nissan_filtros.js, vw_filtros.js o chevrolet_filtros.js).
 * NO es necesario tocar este archivo.
 * ─────────────────────────────────────────────────────────────
 */

import NISSAN_FILTROS    from '../data/nissan_filtros.js';
import VW_FILTROS        from '../data/vw_filtros.js';
import CHEVROLET_FILTROS from '../data/chevrolet_filtros.js';

/* ─── Tipos / JSDoc ──────────────────────────────────────────────────────── */

/**
 * @typedef {Object} FiltroEntry
 * @property {string|null} marca   Marca comercial (FRAM, GONHER, INTERFIL, etc.)
 * @property {string|null} sku     Código real de catálogo, o null si aún no hay
 */

/**
 * @typedef {Object} FiltroRecord
 * @property {string}       modelo          Modelo del vehículo (UPPERCASE)
 * @property {string|null}  motor           Código de motor (UPPERCASE), null = genérico
 * @property {FiltroEntry}  filtro_aceite
 * @property {FiltroEntry}  filtro_aire
 * @property {FiltroEntry}  filtro_gasolina
 * @property {FiltroEntry}  filtro_cabina
 */

/**
 * @typedef {Object} FiltroResuelto
 * @property {string}      tipo    Tipo de filtro (ej. 'Intercambiable / Cartucho')
 * @property {string|null} marca   Marca comercial o null
 * @property {string|null} sku     SKU real o null (null → mostrar fallback en UI)
 * @property {boolean}     hasData true si el registro existe en el catálogo
 */

/**
 * @typedef {Object} KitAfinacion
 * @property {FiltroResuelto} filtro_aceite
 * @property {FiltroResuelto} filtro_aire
 * @property {FiltroResuelto} filtro_gasolina
 * @property {FiltroResuelto} filtro_cabina
 */

/* ─── Tipos de filtro (estáticos) ───────────────────────────────────────── */

const TIPO_FILTRO = {
  filtro_aceite:   'Intercambiable / Cartucho',
  filtro_aire:     'Panel / Cilíndrico',
  filtro_gasolina: 'Línea',
  filtro_cabina:   'Polen',
};

/** Claves de los 4 filtros — usada para iterar de forma segura */
export const FILTRO_KEYS = /** @type {const} */ ([
  'filtro_aceite',
  'filtro_aire',
  'filtro_gasolina',
  'filtro_cabina',
]);

/* ─── Construcción del índice relacional ────────────────────────────────── */

/**
 * Genera la clave canónica de búsqueda.
 * Siempre en UPPERCASE para evitar colisiones por capitalización.
 *
 * @param {string}      modelo
 * @param {string|null} motor
 * @returns {string}
 */
function makeKey(modelo, motor) {
  const m = (modelo ?? '').toUpperCase().trim();
  const e = (motor  ?? '').toUpperCase().trim();
  return e ? `${m}::${e}` : `${m}::*`;
}

/**
 * Construye el Map relacional a partir de los 3 catálogos de datos.
 * Ejecutado ONCE al importar el módulo.
 *
 * @returns {Map<string, FiltroRecord>}
 */
function buildFiltrosIndex() {
  const index = new Map();

  const allRecords = [
    ...NISSAN_FILTROS,
    ...VW_FILTROS,
    ...CHEVROLET_FILTROS,
  ];

  for (const record of allRecords) {
    // Clave específica (con motor)
    const specificKey = makeKey(record.modelo, record.motor);
    index.set(specificKey, record);

    // Si el motor es null, también registramos clave genérica del modelo
    if (!record.motor) {
      const genericKey = makeKey(record.modelo, null);
      if (!index.has(genericKey)) {
        index.set(genericKey, record);
      }
    }
  }

  return index;
}

/** Índice relacional — construido UNA VEZ al cargar el módulo */
const FILTROS_INDEX = buildFiltrosIndex();

/* ─── Lookup y resolución con fallback ──────────────────────────────────── */

/**
 * Busca el registro de filtros para un vehículo dado.
 * Prioridad: modelo+motor → modelo+* → null
 *
 * @param {string}      modelo
 * @param {string|null} motor
 * @returns {FiltroRecord|null}
 */
function lookupFiltroRecord(modelo, motor) {
  // Intento 1: match exacto modelo + motor
  const specificKey = makeKey(modelo, motor);
  if (FILTROS_INDEX.has(specificKey)) {
    return FILTROS_INDEX.get(specificKey);
  }

  // Intento 2: match genérico del modelo (motor=null en el catálogo)
  const genericKey = makeKey(modelo, null);
  if (FILTROS_INDEX.has(genericKey)) {
    return FILTROS_INDEX.get(genericKey);
  }

  // Sin match
  return null;
}

/**
 * Convierte un FiltroEntry (crudo del catálogo) en un FiltroResuelto
 * listo para consumir en la UI.
 *
 * @param {FiltroEntry|null} entry
 * @param {string}           tipoKey  — clave del tipo de filtro
 * @param {boolean}          hasData  — si el registro existe en catálogo
 * @returns {FiltroResuelto}
 */
function resolveFiltro(entry, tipoKey, hasData) {
  return {
    tipo:    TIPO_FILTRO[tipoKey],
    marca:   entry?.marca  ?? null,
    sku:     entry?.sku    ?? null,
    hasData,
  };
}

/* ─── API pública ────────────────────────────────────────────────────────── */

/**
 * Calcula el kit_afinacion completo para un registro del catálogo.
 * Busca en el índice relacional y aplica fallback si no hay datos.
 *
 * @param {Object} bujia  Registro del catálogo (de catalog.js)
 * @returns {KitAfinacion}
 */
export function computeKitAfinacion(bujia) {
  const record  = lookupFiltroRecord(bujia.modelo, bujia.motor);
  const hasData = record !== null;

  return {
    filtro_aceite:   resolveFiltro(record?.filtro_aceite,   'filtro_aceite',   hasData),
    filtro_aire:     resolveFiltro(record?.filtro_aire,     'filtro_aire',     hasData),
    filtro_gasolina: resolveFiltro(record?.filtro_gasolina, 'filtro_gasolina', hasData),
    filtro_cabina:   resolveFiltro(record?.filtro_cabina,   'filtro_cabina',   hasData),
  };
}

/**
 * Alias de compatibilidad — catalog.js lo importa como computeKitData.
 * @deprecated Usar computeKitAfinacion directamente.
 */
export function computeKitData(bujia) {
  return computeKitAfinacion(bujia);
}

/**
 * Comprueba si un FiltroResuelto tiene SKU real asignado.
 * Uso en UI: if (filtroTieneSkuReal(filtro)) { mostrar SKU } else { mostrar fallback }
 *
 * @param {FiltroResuelto} filtro
 * @returns {boolean}
 */
export function filtroTieneSkuReal(filtro) {
  return filtro?.hasData === true && filtro?.sku !== null;
}

/** Viscosidad recomendada (helper informativo, no parte del kit) */
export function getViscosidadRecomendada(litros = 1.6, cilindros_config = '4cil') {
  const L    = parseFloat(litros) || 1.6;
  const isV8 = /v8/i.test(cilindros_config);
  const isV6 = /v6/i.test(cilindros_config);
  if (isV8 || L >= 5.0) return '5W-40';
  if (isV6 || L >= 3.0) return '5W-40';
  return '5W-30';
}

/** Marcas de aceite — para posibles selectores futuros */
export const ACEITE_MARCAS = [
  'Seleccionar marca',
  'Mobil 1', 'Castrol', 'Pennzoil', 'Valvoline',
  'Shell Helix', 'Total Quartz', 'Roshfrans',
];
