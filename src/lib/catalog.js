/**
 * lib/catalog.js
 * ─────────────────────────────────────────────────────────────
 * Pure utility functions for building and querying the catalog.
 * Each record is enriched with kit_data (oil + filter specs)
 * derived from engine parameters via kitDefaults.js.
 *
 * Runs exactly ONCE at module-load time — not inside React.
 * ─────────────────────────────────────────────────────────────
 */
import nissanData from '../data/nissan_bujias_ngk_2025.json';
import vwRaw      from '../data/volkswagen_bujias_ngk_2025.json';
import chevAC     from '../data/chevrolet_bujias_ngk_2025_bloque_AC.json';
import chevDM     from '../data/chevrolet_bujias_ngk_2025_bloque_DM.json';
import chevNZ     from '../data/chevrolet_bujias_ngk_2025_bloque_NZ.json';
import { computeKitAfinacion } from './kitDefaults';

/**
 * Normalize and merge all brand data into a flat, uniquely-keyed array.
 * Each record gets:
 *  • Unique prefixed id       (nissan-X, vw-X, chev-X)
 *  • Explicit marca field     (Nissan, Volkswagen, Chevrolet)
 *  • kit_afinacion            (5-piece filter placeholders derived from engine)
 */
function buildCatalog() {
  const enrich = (r) => ({ ...r, kit_afinacion: computeKitAfinacion(r) });

  const nissan = nissanData.map((r, i) => enrich({
    ...r,
    id:    `nissan-${r.id ?? i}`,
    marca: 'Nissan',
  }));

  const vw = (vwRaw.registros ?? []).map((r, i) => enrich({
    ...r,
    id: `vw-${r.id ?? i}`,
  }));

  const chevrolet = [
    ...(chevAC.registros ?? []),
    ...(chevDM.registros ?? []),
    ...(chevNZ.registros ?? []),
  ].map((r, i) => enrich({
    ...r,
    id: `chev-${r.id ?? i}`,
  }));

  return [...nissan, ...vw, ...chevrolet];
}

/** Full catalog — built once at module-load time. */
export const CATALOG = buildCatalog();

/** Pre-computed hero stats. */
export const CATALOG_STATS = {
  total:  CATALOG.length,
  models: new Set(CATALOG.map(r => `${r.marca}-${r.modelo}`)).size,
  brands: new Set(CATALOG.map(r => r.marca).filter(Boolean)).size,
};

/**
 * Filter the catalog by marca / modelo / año.
 * Pure function — does NOT mutate CATALOG.
 *
 * @param {{ marca?: string, modelo?: string, anio?: number }} params
 * @returns {Array}
 */
export function filterCatalog({ marca, modelo, anio }) {
  let results = CATALOG;
  if (marca)  results = results.filter(r => r.marca === marca);
  if (modelo) results = results.filter(r => r.modelo === modelo);
  if (anio)   results = results.filter(r => anio >= r.anio_inicio && anio <= r.anio_fin);
  return results;
}
