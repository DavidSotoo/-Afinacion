/**
 * data/toyotaFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos TOYOTA importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import toyotaInterfilData from './toyota_interfil.json';

const TOYOTA_FILTROS_REAL = toyotaInterfilData || [];

export default TOYOTA_FILTROS_REAL;
