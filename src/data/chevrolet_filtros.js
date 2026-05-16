/**
 * data/chevrolet_filtros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos CHEVROLET / GM.
 *
 * INSTRUCCIONES PARA LLENAR:
 *  1. Cada entrada es un "perfil de filtros" identificado por
 *     modelo (UPPERCASE) + motor (UPPERCASE, puede ser null).
 *  2. Deja sku: null hasta tener el código real del mostrador.
 *  3. Cuando tengas el SKU real, reemplaza null con el string.
 *
 * MARCAS PRINCIPALES CHEV: FRAM, GONHER, DELCO, INTERFIL
 * ─────────────────────────────────────────────────────────────
 */

/** @type {Array<import('../lib/kitDefaults').FiltroRecord>} */
const CHEVROLET_FILTROS = [

  // ── AVEO (Z14XEP / L4 1.4) ────────────────────────────────
  {
    modelo:          'AVEO',
    motor:           'Z14XEP',
    filtro_aceite:   { marca: 'FRAM',     sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── SONIC (A14NET / 1.4T) ──────────────────────────────────
  {
    modelo:          'SONIC',
    motor:           'A14NET',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── SPARK (B10D1 / 1.0) ────────────────────────────────────
  {
    modelo:          'SPARK',
    motor:           'B10D1',
    filtro_aceite:   { marca: 'FRAM',     sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── CRUZE (F18D4 / 1.8) ───────────────────────────────────
  {
    modelo:          'CRUZE',
    motor:           'F18D4',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── TRAX (A14NET / 1.4T) ───────────────────────────────────
  {
    modelo:          'TRAX',
    motor:           'A14NET',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── EQUINOX (2.4 LE9) ──────────────────────────────────────
  {
    modelo:          'EQUINOX',
    motor:           'LE9',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── SILVERADO (L96 / 5.3 V8) ───────────────────────────────
  {
    modelo:          'SILVERADO',
    motor:           'L96',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── TAHOE (L96 / 5.3 V8) ───────────────────────────────────
  {
    modelo:          'TAHOE',
    motor:           'L96',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── MALIBU (2.4 LE9) ───────────────────────────────────────
  {
    modelo:          'MALIBU',
    motor:           'LE9',
    filtro_aceite:   { marca: 'DELCO',    sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

  // ── CAPTIVA (Z24XE / 2.4) ──────────────────────────────────
  {
    modelo:          'CAPTIVA',
    motor:           'Z24XE',
    filtro_aceite:   { marca: 'FRAM',     sku: null },
    filtro_aire:     { marca: 'INTERFIL', sku: null },
    filtro_gasolina: { marca: 'GONHER',   sku: null },
    filtro_cabina:   { marca: 'INTERFIL', sku: null },
  },

];

export default CHEVROLET_FILTROS;
