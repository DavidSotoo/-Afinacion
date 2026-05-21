/**
 * data/fordFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos FORD importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import fordInterfilData from './ford_interfil_catalogo.json';

const FORD_FILTROS_REAL = fordInterfilData || [];

export default FORD_FILTROS_REAL;
