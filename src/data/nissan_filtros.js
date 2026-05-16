/**
 * data/nissan_filtros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos NISSAN.
 *
 * INSTRUCCIONES PARA LLENAR:
 *  1. Cada entrada del array es un "perfil de filtros" para un
 *     conjunto de vehículos identificados por modelo + motor.
 *  2. La clave de búsqueda es: modelo (uppercase) + motor (uppercase).
 *     Si un motor aplica para varios años, no es necesario duplicarlo.
 *  3. Deja sku: null en los filtros que aún no tienes código.
 *  4. Cuando tengas el SKU real, reemplaza null con el string exacto.
 *
 * FORMATO DE CADA REGISTRO:
 * {
 *   // Identificadores de match (ambos en UPPERCASE)
 *   modelo: 'VERSA',
 *   motor:  'HR16DE',          // null si aplica a todos los motores del modelo
 *
 *   // Filtros reales del mercado
 *   filtro_aceite:   { marca: 'FRAM',     sku: 'PH6607A'  },
 *   filtro_aire:     { marca: 'INTERFIL', sku: 'CA-271'   },
 *   filtro_gasolina: { marca: 'GONHER',   sku: 'G-1234'   },
 *   filtro_cabina:   { marca: 'INTERFIL', sku: 'CF-1015'  },
 * }
 * ─────────────────────────────────────────────────────────────
 */

/** @type {Array<import('../lib/kitDefaults').FiltroRecord>} */
const NISSAN_FILTROS = [

  // ── VERSA (HR16DE) ─────────────────────────────────────────
  {
    modelo:          'VERSA',
    motor:           'HR16DE',
    filtro_aceite:   { marca: 'FRAM',     sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── SENTRA (MR20DD) ────────────────────────────────────────
  {
    modelo:          'SENTRA',
    motor:           'MR20DD',
    filtro_aceite:   { marca: 'GONHER',   sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── MARCH (HR12DE) ─────────────────────────────────────────
  {
    modelo:          'MARCH',
    motor:           'HR12DE',
    filtro_aceite:   { marca: 'FRAM',     sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── NP300 / ESTACAS (KA24DE) ───────────────────────────────
  {
    modelo:          'NP300',
    motor:           'KA24DE',
    filtro_aceite:   { marca: 'GONHER',   sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: null,       sku: null }, // No aplica en NP300
  },

  // ── TSURU (GA16DE) — Clásico sin filtro cabina ─────────────
  {
    modelo:          'TSURU',
    motor:           'GA16DE',
    filtro_aceite:   { marca: 'GONHER',   sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: null,       sku: null }, // No aplica
  },

  // ── KICKS (HR16DE) ─────────────────────────────────────────
  {
    modelo:          'KICKS',
    motor:           'HR16DE',
    filtro_aceite:   { marca: 'FRAM',     sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── X-TRAIL (MR20DD) ───────────────────────────────────────
  {
    modelo:          'X-TRAIL',
    motor:           'MR20DD',
    filtro_aceite:   { marca: 'GONHER',   sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── FRONTIER (VQ40DE) — V6 ─────────────────────────────────
  {
    modelo:          'FRONTIER',
    motor:           'VQ40DE',
    filtro_aceite:   { marca: 'GONHER',   sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── PATHFINDER (VQ35DE) ────────────────────────────────────
  {
    modelo:          'PATHFINDER',
    motor:           'VQ35DE',
    filtro_aceite:   { marca: 'GONHER',   sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

];

export default NISSAN_FILTROS;
