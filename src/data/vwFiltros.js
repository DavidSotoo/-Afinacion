/**
 * data/vwFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos VOLKSWAGEN importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import vwInterfilData from './vw_filtros_interfil_2020_2021.json';

const VW_FILTROS_REAL = vwInterfilData.registros || [];

export default VW_FILTROS_REAL;
