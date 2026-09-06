/**
 * server/lib/pricingEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de cálculo de precios del lado del servidor.
 * Replica exactamente la lógica de CartContext.jsx#subtotal para que el backend
 * sea la fuente de verdad del precio que se cobra a Mercado Pago.
 *
 * REGLAS COPIADAS DE:
 *   - src/context/CartContext.jsx  (subtotal + computeShipping)
 *   - src/lib/kitHelpers.js        (calculateOilPrice)
 *   - src/lib/constants.js         (DELIVERY_OPTIONS, FREE_SHIPPING_THRESHOLD)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

// ── Constantes replicadas de src/lib/constants.js ────────────────────────────
const FREE_SHIPPING_THRESHOLD = 1500;

const DELIVERY_BASE_COSTS = {
  local:   0,
  zmg:     80,   // gratis si hay kit o subtotal > FREE_SHIPPING_THRESHOLD
  foraneo: 150,
};

const SERVICE_COSTS = {
  ninguno:  0,
  basico:   200,
  medio:    400,
  completo: 600,
};

// ── calculateOilPrice — réplica exacta de src/lib/kitHelpers.js ──────────────
function calculateOilPrice(anioInicio, tecnologia, litros) {
  const anio = parseInt(anioInicio, 10) || 2015;
  const l    = parseInt(litros,     10) || 4;

  const tecLower = (tecnologia || '').toLowerCase();
  const isSintetico =
    (tecLower.includes('sintetico') || tecLower.includes('sintético')) &&
    !tecLower.includes('semi');

  if (anio >= 2010) {
    if (isSintetico) {
      return 780 + Math.max(0, l - 4) * 160;
    } else {
      return 600 + Math.max(0, l - 4) * 120;
    }
  } else {
    return l * 110;
  }
}

// ── computeShipping — réplica exacta de CartContext#computeShipping ───────────
function computeShipping(deliveryId, hasKit, subtotal) {
  const baseCost = DELIVERY_BASE_COSTS[deliveryId];
  if (baseCost === undefined) return 0;

  if (deliveryId === 'zmg') {
    const qualifiesFree = hasKit || subtotal > FREE_SHIPPING_THRESHOLD;
    return qualifiesFree ? 0 : baseCost;
  }
  return baseCost;
}

/**
 * Calcula el total verificado desde el carrito usando consultas a la BD.
 * Esto asegura que el cliente no pueda manipular los precios.
 *
 * @param {Array}  rawItems       — Array de items del carrito
 * @param {string} deliveryId     — 'local' | 'zmg' | 'foraneo'
 * @param {string} servicioTaller — 'ninguno' | 'basico' | 'medio' | 'completo'
 *
 * @returns {Promise<{ subtotal: number, shipping: number, serviceCost: number, total: number }>}
 */
async function calcularTotalDesdeCartSecure(rawItems, deliveryId, servicioTaller) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('El carrito está vacío o es inválido.');
  }

  // Se necesita Vehiculo y la función enrichVehiculosWithPrices para obtener los costos
  const Vehiculo = require('../models/Vehiculo');
  const { enrichVehiculosWithPrices } = require('../routes/vehiculos');

  let subtotal = 0;
  let hasKit = false;

  for (const item of rawItems) {
    const qty = parseInt(item.qty, 10) || 1;
    
    // Obtenemos el vehículo de la BD y lo enriquecemos para tener los costos reales
    const vehiculoBase = await Vehiculo.findById(item.bujia?._id || item.bujia?.id);
    if (!vehiculoBase) {
      throw new Error(`Vehículo no encontrado en la BD: ${item.bujia?._id}`);
    }
    const [vehiculoEnriquecido] = await enrichVehiculosWithPrices([vehiculoBase]);
    const kit = vehiculoEnriquecido.kit_afinacion || {};

    if (item.type === 'kit') {
      hasKit = true;
      let kitPrice = 0;
      const excludedParts = item.excludedParts || [];
      const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
      
      keys.forEach(k => {
        if (!excludedParts.includes(k)) {
          const f = kit[k];
          kitPrice += (f && f.costo !== undefined) ? f.costo : 85;
        }
      });

      if (!excludedParts.includes('bujias')) {
        const bujiasPriceObj = kit.bujias?.[item.tipoLinea];
        const bujiasPrice = (bujiasPriceObj && bujiasPriceObj.precio_total !== undefined)
          ? bujiasPriceObj.precio_total
          : 200;
        kitPrice += bujiasPrice;
      }

      if (item.aceite_motor && !excludedParts.includes('aceite_motor')) {
        kitPrice += calculateOilPrice(vehiculoEnriquecido.anio_inicio, item.aceite_motor.tecnologia, item.aceite_motor.litros);
      }

      subtotal += kitPrice * qty;

    } else if (item.type === 'pieza') {
      const bujiasPriceObj = kit.bujias?.[item.tipoLinea];
      const bujiasPrice = (bujiasPriceObj && bujiasPriceObj.precio_unitario !== undefined)
        ? bujiasPriceObj.precio_unitario
        : 120;
      subtotal += bujiasPrice * qty;

    } else if (item.type === 'filtro') {
      const f = kit[item.filterKey];
      const filterPrice = (f && f.costo !== undefined) ? f.costo : 85;
      subtotal += filterPrice * qty;
    }
  }

  const shippingCost = computeShipping(deliveryId || 'local', hasKit, subtotal);
  const serviceCost  = SERVICE_COSTS[servicioTaller] || 0;
  const total        = subtotal + shippingCost + serviceCost;

  if (total <= 0 || total > 9999999) {
    throw new Error(`Total calculado fuera de rango: $${total} MXN.`);
  }

  return { subtotal, shipping: shippingCost, serviceCost, total };
}

module.exports = { calcularTotalDesdeCartSecure, calculateOilPrice, computeShipping };
