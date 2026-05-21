/**
 * data/chevroletFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos CHEVROLET importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import chevroletInterfilData from './interfil_chevrolet.json';

const CHEVROLET_FILTROS_REAL = chevroletInterfilData.CHEVROLET || [];

export default CHEVROLET_FILTROS_REAL;
