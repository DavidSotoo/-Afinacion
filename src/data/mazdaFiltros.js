/**
 * data/mazdaFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos MAZDA importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import mazdaInterfilData from './mazda_interfil.json';

const MAZDA_FILTROS_REAL = mazdaInterfilData || [];

export default MAZDA_FILTROS_REAL;
