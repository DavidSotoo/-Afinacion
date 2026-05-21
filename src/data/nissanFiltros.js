/**
 * data/nissanFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos NISSAN importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import nissanInterfilData from './nissan_filtros_interfil_2020_2021.json';

const NISSAN_FILTROS = nissanInterfilData.registros || [];

export default NISSAN_FILTROS;
