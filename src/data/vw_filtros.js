/**
 * data/vw_filtros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos VOLKSWAGEN.
 *
 * INSTRUCCIONES PARA LLENAR:
 *  1. Cada entrada es un "perfil de filtros" identificado por
 *     modelo (UPPERCASE) + motor (UPPERCASE).
 *  2. Deja sku: null hasta tener el código real del mostrador.
 *  3. Cuando tengas el SKU real, reemplaza null con el string.
 *
 * MARCA PRINCIPALES VW: MANN, MAHLE, FRAM, INTERFIL
 * ─────────────────────────────────────────────────────────────
 */

/** @type {Array<import('../lib/kitDefaults').FiltroRecord>} */
const VW_FILTROS = [

  // ── JETTA (2.0 AZG / BRM) ──────────────────────────────────
  {
    modelo:          'JETTA',
    motor:           'AZG',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'INTERFIL', sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },
  {
    modelo:          'JETTA',
    motor:           'BRM',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'INTERFIL', sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },

  // ── JETTA (1.4 CZEA / TSI) ─────────────────────────────────
  {
    modelo:          'JETTA',
    motor:           'CZEA',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'MANN',     sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },

  // ── GOLF (1.6 BSE / MKV) ───────────────────────────────────
  {
    modelo:          'GOLF',
    motor:           'BSE',
    filtro_aceite:   { marca: 'MAHLE',    sku: null },
    filtro_aire:     { marca: 'MAHLE',    sku: null },
    filtro_gasolina: { marca: 'INTERFIL', sku: null },
    filtro_cabina:   { marca: 'MAHLE',    sku: null },
  },

  // ── POLO (1.6 CFNA) ────────────────────────────────────────
  {
    modelo:          'POLO',
    motor:           'CFNA',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'INTERFIL', sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },

  // ── TIGUAN (1.4 CAXA / TSI) ────────────────────────────────
  {
    modelo:          'TIGUAN',
    motor:           'CAXA',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'MANN',     sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },

  // ── VENTO (1.6 CFNA) ───────────────────────────────────────
  {
    modelo:          'VENTO',
    motor:           'CFNA',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'INTERFIL', sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },

  // ── PASSAT (1.8 CDAB) ──────────────────────────────────────
  {
    modelo:          'PASSAT',
    motor:           'CDAB',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'MANN',     sku: null },
    filtro_cabina:   { marca: 'MANN',     sku: null },
  },

  // ── SAVEIRO (1.6 CFNA) ─────────────────────────────────────
  {
    modelo:          'SAVEIRO',
    motor:           'CFNA',
    filtro_aceite:   { marca: 'MANN',     sku: null },
    filtro_aire:     { marca: 'MANN',     sku: null },
    filtro_gasolina: { marca: 'INTERFIL', sku: null },
    filtro_cabina:   { marca: null,       sku: null }, // No aplica en Saveiro
  },

];

export default VW_FILTROS;
