/**
 * data/hondaFiltros.js
 * ─────────────────────────────────────────────────────────────
 * Catálogo de filtros para vehículos HONDA importado desde Interfil.
 * Exporta el array de registros limpiamente.
 * ─────────────────────────────────────────────────────────────
 */
import hondaInterfilData from './honda_interfil_catalogo.json';

const HONDA_FILTROS_REAL = hondaInterfilData || [];

export default HONDA_FILTROS_REAL;
