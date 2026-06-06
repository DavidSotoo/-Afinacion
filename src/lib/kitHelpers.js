/**
 * lib/kitHelpers.js
 * ─────────────────────────────────────────────────────────────
 * Funciones auxiliares ligeras para los kits de afinación.
 * Este archivo no tiene dependencias de datos estáticos pesados
 * y es seguro importarlo en el hilo principal del cliente.
 * ─────────────────────────────────────────────────────────────
 */

export const FILTRO_KEYS = /** @type {const} */ ([
  'filtro_aceite',
  'filtro_aire',
  'filtro_gasolina',
  'filtro_cabina',
]);

/**
 * Comprueba si un FiltroResuelto tiene SKU real asignado.
 * Uso en UI: if (filtroTieneSkuReal(filtro)) { mostrar SKU } else { mostrar fallback }
 *
 * @param {Object} filtro
 * @returns {boolean}
 */
export function filtroTieneSkuReal(filtro) {
  return filtro?.hasData === true && filtro?.sku !== null;
}

/**
 * Genera la recomendación de aceite de motor predeterminada según el vehículo.
 *
 * @param {Object} bujia  Registro del vehículo/bujía
 * @returns {Object} Configuración recomendada por defecto
 */
export function recomendarAceiteDefault(bujia) {
  const anio = parseInt(bujia.anio_inicio, 10) || 2015;
  const cilindros = (bujia.cilindros_config || '').toUpperCase();

  let viscosidad = '5W-30';
  let tecnologia = 'Semisintético';
  let litros = 4;

  // 1. Viscosidad y tecnología inteligente por año
  if (anio >= 2010) {
    tecnologia = 'Semisintético';
    if (anio >= 2016) {
      viscosidad = '5W-30';
    } else {
      viscosidad = '10W-30';
    }
  } else {
    tecnologia = 'Mineral';
    viscosidad = '20W-50';
  }

  // 2. Cantidad de Litros según cilindros
  if (cilindros.includes('8') || cilindros.includes('V8')) {
    litros = 6;
  } else if (cilindros.includes('6') || cilindros.includes('V6')) {
    litros = 5;
  } else {
    litros = 4;
  }

  // 3. Marca sugerida por defecto (interna)
  const marcaAceite = 'Mobil Super';

  // Presentación por defecto
  let presentacion = 'Garrafa (4 Litros)';
  if (litros === 5) {
    presentacion = 'Garrafa (5 Litros)';
  } else if (litros > 5) {
    presentacion = `Garrafa (4L) + ${litros - 4} Botella(s) (1L)`;
  }

  return {
    viscosidad,
    tecnologia,
    litros,
    marca: marcaAceite,
    presentacion
  };
}

/**
 * Calcula el precio dinámico del aceite según año, tipo y litros.
 *
 * @param {number|string} anioInicio  Año de inicio del vehículo
 * @param {string} tecnologia          Tecnología del aceite
 * @param {number} litros              Capacidad en litros
 * @returns {number}                   Precio en MXN
 */
export function calculateOilPrice(anioInicio, tecnologia, litros) {
  const anio = parseInt(anioInicio, 10) || 2015;
  const l = parseInt(litros, 10) || 4;

  const tecLower = (tecnologia || '').toLowerCase();
  const isSintetico = (tecLower.includes('sintetico') || tecLower.includes('sintético')) && !tecLower.includes('semi');

  if (anio >= 2010) {
    if (isSintetico) {
      // Sintético (5W30): $780 base (4L) + $160 por litro extra
      const basePrice = 780;
      const extraLiters = Math.max(0, l - 4);
      return basePrice + extraLiters * 160;
    } else {
      // Semi-Sintético (5W30, 10W30, 10W40): $600 base (4L) + $120 por litro extra
      const basePrice = 600;
      const extraLiters = Math.max(0, l - 4);
      return basePrice + extraLiters * 120;
    }
  } else {
    // Multigrado (Mineral): litros * $110 flat
    return l * 110;
  }
}

/**
 * Formatea el nombre genérico del aceite enmascarando la marca.
 *
 * @param {string} tecnologia  Tecnología del aceite
 * @param {string} viscosidad  Viscosidad del aceite
 * @returns {string}           Nombre formateado
 */
export function formatOilName(tecnologia, viscosidad) {
  let tipo = 'Multigrado';
  const tecLower = (tecnologia || '').toLowerCase();
  if (tecLower.includes('semi')) {
    tipo = 'Semi-Sintético';
  } else if (tecLower.includes('sintetico') || tecLower.includes('sintético')) {
    tipo = 'Sintético';
  } else if (tecLower.includes('mineral') || tecLower.includes('multigrado')) {
    tipo = 'Multigrado';
  }
  const cleanVisc = (viscosidad || '').replace('-', '');
  return `Aceite ${tipo} ${cleanVisc}`;
}
