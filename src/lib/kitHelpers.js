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
  const marcaVehiculo = (bujia.marca || '').toUpperCase();

  let viscosidad = '5W-30';
  let tecnologia = 'Sintético';
  let litros = 4;

  // 1. Viscosidad inteligente en base a años y marcas
  if (anio >= 2016) {
    if (marcaVehiculo === 'HONDA' || marcaVehiculo === 'TOYOTA' || marcaVehiculo === 'MAZDA') {
      viscosidad = '0W-20';
    } else {
      viscosidad = '5W-30';
    }
    tecnologia = 'Sintético';
  } else if (anio >= 2006 && anio <= 2015) {
    viscosidad = '10W-30';
    tecnologia = 'Semisintético';
  } else {
    viscosidad = '15W-40';
    tecnologia = 'Mineral';
  }

  // 2. Cantidad de Litros según cilindros
  if (cilindros.includes('8') || cilindros.includes('V8')) {
    litros = 6;
  } else if (cilindros.includes('6') || cilindros.includes('V6')) {
    litros = 5;
  } else {
    litros = 4;
  }

  // 3. Marca sugerida por defecto
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
