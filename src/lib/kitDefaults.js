/**
 * lib/kitDefaults.js
 * ─────────────────────────────────────────────────────────────
 * Motor relacional de filtros para el Kit de Afinación de 5 piezas.
 *
 * Jerarquía de búsqueda (de más específico a más genérico):
 *   1. modelo + motor        → match exacto
 *   2. modelo + motor=null   → registro genérico del modelo
 *   3. Sin match             → estado FALLBACK: "Consultar SKU con mostrador"
 *
 * Flujo de build (ejecutado UNA SOLA VEZ al cargar el módulo):
 *   • Importa los 3 catálogos de filtros (nissan / vw / chevrolet)
 *   • Construye un Map<string, FiltroRecord> indexado por clave canónica
 *   • computeKitAfinacion(bujia) consulta el Map y aplica fallback si necesario
 *
 * Para AÑADIR un filtro real: solo edita el archivo de datos correspondiente
 * (nissan_filtros.js, vw_filtros.js o chevrolet_filtros.js).
 * NO es necesario tocar este archivo.
 * ─────────────────────────────────────────────────────────────
 */

import NISSAN_FILTROS    from '../data/nissanFiltros.js';
import VW_FILTROS        from '../data/vw_filtros.js';
import VW_FILTROS_REAL   from '../data/vwFiltros.js';
import CHEVROLET_FILTROS from '../data/chevrolet_filtros.js';
import CHEVROLET_FILTROS_REAL from '../data/chevroletFiltros.js';
import FORD_FILTROS_REAL   from '../data/fordFiltros.js';
import HONDA_FILTROS_REAL  from '../data/hondaFiltros.js';
import TOYOTA_FILTROS_REAL from '../data/toyotaFiltros.js';
import MAZDA_FILTROS_REAL  from '../data/mazdaFiltros.js';

/* ─── Tipos / JSDoc ──────────────────────────────────────────────────────── */

/**
 * @typedef {Object} FiltroEntry
 * @property {string|null} marca   Marca comercial (FRAM, GONHER, INTERFIL, etc.)
 * @property {string|null} sku     Código real de catálogo, o null si aún no hay
 */

/**
 * @typedef {Object} FiltroRecord
 * @property {string}       modelo          Modelo del vehículo (UPPERCASE)
 * @property {string|null}  motor           Código de motor (UPPERCASE), null = genérico
 * @property {FiltroEntry}  filtro_aceite
 * @property {FiltroEntry}  filtro_aire
 * @property {FiltroEntry}  filtro_gasolina
 * @property {FiltroEntry}  filtro_cabina
 */

/**
 * @typedef {Object} FiltroResuelto
 * @property {string}      tipo    Tipo de filtro (ej. 'Intercambiable / Cartucho')
 * @property {string|null} marca   Marca comercial o null
 * @property {string|null} sku     SKU real o null (null → mostrar fallback en UI)
 * @property {boolean}     hasData true si el registro existe en el catálogo
 */

/**
 * @typedef {Object} KitAfinacion
 * @property {FiltroResuelto} filtro_aceite
 * @property {FiltroResuelto} filtro_aire
 * @property {FiltroResuelto} filtro_gasolina
 * @property {FiltroResuelto} filtro_cabina
 */

/* ─── Tipos de filtro (estáticos) ───────────────────────────────────────── */

const TIPO_FILTRO = {
  filtro_aceite:   'Intercambiable / Cartucho',
  filtro_aire:     'Panel / Cilíndrico',
  filtro_gasolina: 'Línea',
  filtro_cabina:   'Polen',
};

/** Claves de los 4 filtros — usada para iterar de forma segura */
export const FILTRO_KEYS = /** @type {const} */ ([
  'filtro_aceite',
  'filtro_aire',
  'filtro_gasolina',
  'filtro_cabina',
]);

/* ─── Construcción del índice relacional ────────────────────────────────── */

/**
 * Genera la clave canónica de búsqueda.
 * Siempre en UPPERCASE para evitar colisiones por capitalización.
 *
 * @param {string}      modelo
 * @param {string|null} motor
 * @returns {string}
 */
function makeKey(modelo, motor) {
  const m = (modelo ?? '').toUpperCase().trim();
  const e = (motor  ?? '').toUpperCase().trim();
  return e ? `${m}::${e}` : `${m}::*`;
}

/**
 * Construye el Map relacional a partir de los 3 catálogos de datos.
 * Ejecutado ONCE al importar el módulo.
 *
 * @returns {Map<string, FiltroRecord>}
 */
function buildFiltrosIndex() {
  const index = new Map();

  const allRecords = [
    ...VW_FILTROS,
    ...CHEVROLET_FILTROS,
  ];

  for (const record of allRecords) {
    // Clave específica (con motor)
    const specificKey = makeKey(record.modelo, record.motor);
    index.set(specificKey, record);

    // Si el motor es null, también registramos clave genérica del modelo
    if (!record.motor) {
      const genericKey = makeKey(record.modelo, null);
      if (!index.has(genericKey)) {
        index.set(genericKey, record);
      }
    }
  }

  return index;
}

/** Índice relacional — construido UNA VEZ al cargar el módulo */
const FILTROS_INDEX = buildFiltrosIndex();

/* ─── Lookup y resolución con fallback ──────────────────────────────────── */

/**
 * Busca el registro de filtros para un vehículo dado.
 * Prioridad: modelo+motor → modelo+* → null
 *
 * @param {string}      modelo
 * @param {string|null} motor
 * @returns {FiltroRecord|null}
 */
function lookupFiltroRecord(modelo, motor) {
  // Intento 1: match exacto modelo + motor
  const specificKey = makeKey(modelo, motor);
  if (FILTROS_INDEX.has(specificKey)) {
    return FILTROS_INDEX.get(specificKey);
  }

  // Intento 2: match genérico del modelo (motor=null en el catálogo)
  const genericKey = makeKey(modelo, null);
  if (FILTROS_INDEX.has(genericKey)) {
    return FILTROS_INDEX.get(genericKey);
  }

  // Sin match
  return null;
}

/**
 * Convierte un FiltroEntry (crudo del catálogo) en un FiltroResuelto
 * listo para consumir en la UI.
 *
 * @param {FiltroEntry|null} entry
 * @param {string}           tipoKey  — clave del tipo de filtro
 * @param {boolean}          hasData  — si el registro existe en catálogo
 * @returns {FiltroResuelto}
 */
function resolveFiltro(entry, tipoKey, hasData) {
  return {
    tipo:    TIPO_FILTRO[tipoKey],
    marca:   entry?.marca  ?? null,
    sku:     entry?.sku    ?? null,
    hasData,
  };
}

/**
 * Búsqueda relacional específica para NISSAN (aproximación por modelo, motor en L y años).
 * @param {Object} bujia 
 * @returns {Object|null}
 */
function lookupFiltroNissan(bujia) {
  const matches = NISSAN_FILTROS.filter(r => {
    // 1. Modelo (case insensitive)
    if ((r.modelo || '').toUpperCase() !== (bujia.modelo || '').toUpperCase()) {
      return false;
    }

    // 2. Motor (Ej. '1.6L')
    const motorBujia = bujia.litros ? `${bujia.litros}L` : null;
    const motorRecord = (r.motor || '').toUpperCase();
    if (motorBujia && motorRecord && motorRecord !== motorBujia) {
      return false;
    }

    // 3. Rango de Años (solapamiento)
    if (r.anio) {
      const parts = r.anio.split('-');
      if (parts.length === 2) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          if (bujia.anio_fin < start || bujia.anio_inicio > end) {
            return false;
          }
        }
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Normaliza nombres de modelos VW de NGK a Interfil VW.
 */
function normalizeVwModelo(modelo, litros) {
  const m = (modelo || '').trim().toUpperCase();
  if (m === 'CLASICO' || m === 'JETTA CLASICO' || m === 'CLASICO JETTA') {
    return 'JETTA CLÁSICO';
  }
  if (m === 'ATLANTIC' && parseFloat(litros) === 1.8) {
    return 'ATLANTIC GLS';
  }
  return m;
}

/**
 * Búsqueda relacional específica para VOLKSWAGEN.
 */
function lookupFiltroVW(bujia) {
  const modeloNorm = normalizeVwModelo(bujia.modelo, bujia.litros);

  const matches = VW_FILTROS_REAL.filter(r => {
    // 1. Modelo normalizado (case insensitive)
    if ((r.modelo || '').toUpperCase() !== modeloNorm) {
      return false;
    }

    // 2. Match de litros (${bujia.litros}L)
    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+(\.\d+)?)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) {
        return false;
      }
    }

    // 3. Rango de Años (solapamiento)
    if (r.anio) {
      const parts = r.anio.split('-');
      const start = parseInt(parts[0], 10);
      const end = parts.length === 2 ? parseInt(parts[1], 10) : start;
      if (!isNaN(start) && !isNaN(end)) {
        if (bujia.anio_fin < start || bujia.anio_inicio > end) {
          return false;
        }
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Normaliza nombres de modelos Chevrolet de NGK a Interfil Chevrolet.
 */
function normalizeChevroletModelo(modelo) {
  const m = (modelo || '').trim().toUpperCase();
  if (m.startsWith('AVALANCHE')) {
    return 'AVALANCHE';
  }
  if (m.startsWith('SILVERADO') && !m.includes('3500')) {
    return 'SILVERADO 1500';
  }
  if (m.startsWith('SILVERADO') && m.includes('3500')) {
    return 'SILVERADO 3500';
  }
  if (m.startsWith('SUBURBAN')) {
    return 'SUBURBAN';
  }
  return m;
}

/**
 * Búsqueda relacional específica para CHEVROLET.
 */
function lookupFiltroChevrolet(bujia) {
  const modeloNorm = normalizeChevroletModelo(bujia.modelo);

  const matches = CHEVROLET_FILTROS_REAL.filter(r => {
    // 1. Modelo normalizado (case insensitive)
    if ((r.modelo || '').toUpperCase() !== modeloNorm) {
      return false;
    }

    // 2. Match de litros (${bujia.litros}L)
    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+(\.\d+)?)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) {
        return false;
      }
    }

    // 3. Rango de Años (solapamiento)
    if (r.anio) {
      const parts = r.anio.split('-');
      const start = parseInt(parts[0], 10);
      const end = parts.length === 2 ? parseInt(parts[1], 10) : start;
      if (!isNaN(start) && !isNaN(end)) {
        if (bujia.anio_fin < start || bujia.anio_inicio > end) {
          return false;
        }
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Normaliza nombres de modelos Ford de NGK a Interfil Ford.
 */
function normalizeFordModelo(modelo) {
  const m = (modelo || '').trim().toUpperCase();
  if (m === 'FIESTA IKON') {
    return 'IKON';
  }
  if (m === 'FUSION HYBRID') {
    return 'FUSION HIBRIDO';
  }
  if (m === 'C-MAX' || m === 'C-MAX HYBRID') {
    return 'C-MAX HIBRIDO';
  }
  if (m === 'ESCAPE HYBRID') {
    return 'ESCAPE';
  }
  if (m === 'F-150 HYBRID') {
    return 'F-150';
  }
  return m;
}

/**
 * Búsqueda relacional específica para FORD.
 */
function lookupFiltroFord(bujia) {
  const modeloNorm = normalizeFordModelo(bujia.modelo);

  const matches = FORD_FILTROS_REAL.filter(r => {
    // 1. Modelo normalizado (case insensitive)
    if ((r.modelo || '').toUpperCase() !== modeloNorm) {
      return false;
    }

    // 2. Match de litros (${bujia.litros}L)
    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+(\.\d+)?)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) {
        return false;
      }
    }

    // 3. Rango de Años (solapamiento)
    if (r.anio) {
      const parts = r.anio.split('-');
      const start = parseInt(parts[0], 10);
      const end = parts.length === 2 ? parseInt(parts[1], 10) : start;
      if (!isNaN(start) && !isNaN(end)) {
        if (bujia.anio_fin < start || bujia.anio_inicio > end) {
          return false;
        }
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Normaliza nombres de modelos Honda de NGK a Interfil Honda.
 */
function normalizeHondaModelo(modelo) {
  const m = (modelo || '').trim().toUpperCase();
  if (m === 'ACCORD CROSSTOUR') {
    return 'CROSSTOUR';
  }
  if (m === 'CIVIC HYBRID') {
    return 'CIVIC HIBRIDO';
  }
  if (m === 'ACCORD HYBRID') {
    return 'ACCORD HIBRIDO';
  }
  return m;
}

/**
 * Búsqueda relacional específica para HONDA.
 */
function lookupFiltroHonda(bujia) {
  const modeloNorm = normalizeHondaModelo(bujia.modelo);

  const matches = HONDA_FILTROS_REAL.filter(r => {
    // 1. Modelo normalizado (case insensitive)
    if ((r.modelo || '').toUpperCase() !== modeloNorm) {
      return false;
    }

    // 2. Match de litros (${bujia.litros}L)
    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+(\.\d+)?)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) {
        return false;
      }
    }

    // 3. Rango de Años (solapamiento)
    if (r.anio) {
      const parts = r.anio.split('-');
      const start = parseInt(parts[0], 10);
      const end = parts.length === 2 ? parseInt(parts[1], 10) : start;
      if (!isNaN(start) && !isNaN(end)) {
        if (bujia.anio_fin < start || bujia.anio_inicio > end) {
          return false;
        }
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Normaliza nombres de modelos Toyota de NGK a Interfil Toyota.
 */
function normalizeToyotaModelo(modelo) {
  const m = (modelo || '').trim().toUpperCase();
  if (m === 'CAMRY HYBRID') {
    return 'CAMRY HÍBRIDO';
  }
  return m;
}

/**
 * Búsqueda relacional específica para TOYOTA.
 */
function lookupFiltroToyota(bujia) {
  const modeloNorm = normalizeToyotaModelo(bujia.modelo);

  const matches = TOYOTA_FILTROS_REAL.filter(r => {
    // 1. Modelo normalizado (case insensitive)
    if ((r.modelo || '').toUpperCase() !== modeloNorm) {
      return false;
    }

    // 2. Match de litros — Interfil Toyota escribe "2.4 L" (con espacio)
    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) {
        return false;
      }
    }

    // 3. Rango de Años (solapamiento)
    if (r.anio) {
      const parts = r.anio.split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts.length === 2 ? parseInt(parts[1], 10) : start;
      if (!isNaN(start) && !isNaN(end)) {
        if (bujia.anio_fin < start || bujia.anio_inicio > end) {
          return false;
        }
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Normaliza el nombre de modelo del catálogo NGK al formato que usa Interfil Mazda.
 *
 * Mappings detectados:
 *   "2"         → "MAZDA 2"
 *   "3"         → "MAZDA 3"
 *   "5"         → "MAZDA 5"
 *   "6"         → "MAZDA 6"
 *   "CX-3"      → "CX3"
 *   "CX-5"      → "CX5"
 *   "CX-7"      → "CX7"
 *   "CX-9"      → "CX9"
 *   "CX-30"     → "CX3"  (aprox)
 *   "CX-50"     → "CX5"  (aprox)
 *   "B2300"     → "B-2300"
 *   "B2500"     → "B-2500"
 *   "B3000"     → "B-3000"
 *   "B4000"     → "B-4000"
 *   "Tribute"   → "TRIBUTE"
 *   "MX-5 Miata" → "MX-5 MIATA"
 */
function normalizeMazdaModelo(modelo) {
  const m = (modelo || '').trim();
  // Dígito solo → "MAZDA N"
  if (/^\d$/.test(m)) return `MAZDA ${m}`;
  // CX-N o CX-NN → CXN (extrae solo los dos primeros dígitos para CX-30/50)
  const cxFull = m.match(/^CX-(\d+)$/i);
  if (cxFull) {
    const num = cxFull[1].length > 1 ? cxFull[1][0] : cxFull[1];
    return `CX${num}`;
  }
  // BN (sin guión) → B-N
  const bMatch = m.match(/^B(\d{4})$/i);
  if (bMatch) return `B-${bMatch[1]}`;
  // Todo lo demás: uppercase directo (captura Tribute, MX-5 Miata, 323, 626, etc.)
  return m.toUpperCase();
}

/**
 * Búsqueda relacional específica para MAZDA.
 * Aplica normalizeMazdaModelo() para resolver el mismatch entre el catálogo
 * NGK (bujías) y el catálogo Interfil (filtros).
 *
 * Interfil usa "1.6 L" con espacio; algunos registros tienen motor compuesto
 * "1.6 L / 1.8 L" — el regex extrae el primer valor.
 *
 * @param {Object} bujia
 * @returns {Object|null}
 */
function lookupFiltroMazda(bujia) {
  const modeloNorm = normalizeMazdaModelo(bujia.modelo);

  const matches = MAZDA_FILTROS_REAL.filter(r => {
    // 1. Modelo normalizado (case insensitive)
    if ((r.modelo || '').toUpperCase() !== modeloNorm) return false;

    // 2. Match de litros — extrae el primer número antes de " L"
    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) return false;
    }

    // 3. Rango de Años (solapamiento matemático)
    if (r.anio) {
      const parts = r.anio.split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts.length === 2 ? parseInt(parts[1], 10) : start;
      if (!isNaN(start) && !isNaN(end)) {
        if (bujia.anio_fin < start || bujia.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/* ─── API pública ────────────────────────────────────────────────────────── */

/**
 * Calcula el kit_afinacion completo para un registro del catálogo.
 * Busca en el índice relacional y aplica fallback si no hay datos.
 *
 * @param {Object} bujia  Registro del catálogo (de catalog.js)
 * @returns {KitAfinacion}
 */
export function computeKitAfinacion(bujia) {
  const isNissan    = bujia.marca && bujia.marca.toUpperCase() === 'NISSAN';
  const isVW        = bujia.marca && bujia.marca.toUpperCase() === 'VOLKSWAGEN';
  const isChevrolet = bujia.marca && bujia.marca.toUpperCase() === 'CHEVROLET';
  const isFord      = bujia.marca && bujia.marca.toUpperCase() === 'FORD';
  const isHonda     = bujia.marca && bujia.marca.toUpperCase() === 'HONDA';
  const isToyota    = bujia.marca && bujia.marca.toUpperCase() === 'TOYOTA';
  const isMazda     = bujia.marca && bujia.marca.toUpperCase() === 'MAZDA';

  const record = isNissan
    ? lookupFiltroNissan(bujia)
    : isVW
      ? lookupFiltroVW(bujia)
      : isChevrolet
        ? lookupFiltroChevrolet(bujia)
        : isFord
          ? lookupFiltroFord(bujia)
          : isHonda
            ? lookupFiltroHonda(bujia)
            : isToyota
              ? lookupFiltroToyota(bujia)
              : isMazda
                ? lookupFiltroMazda(bujia)
                : lookupFiltroRecord(bujia.modelo, bujia.motor);
  const hasData = record !== null;

  // Lógica de aceite — prioridad cartucho sobre metálico roscable para todas las marcas relacionales
  let aceiteEntry = record?.filtro_aceite;
  if ((isNissan || isVW || isChevrolet || isFord || isHonda || isToyota || isMazda) && record?.filtro_aceite_cartucho?.sku) {
    aceiteEntry = record.filtro_aceite_cartucho;
  }

  // Lógica de gasolina sellado (In-Tank) para todas las marcas relacionales
  let gasolinaEntry = record?.filtro_gasolina;
  if ((isNissan || isVW || isChevrolet || isFord || isHonda || isToyota || isMazda) && record && !record.filtro_gasolina?.sku) {
    gasolinaEntry = { marca: null, sku: 'SELLADO' };
  }

  return {
    filtro_aceite:   resolveFiltro(aceiteEntry,           'filtro_aceite',   hasData),
    filtro_aire:     resolveFiltro(record?.filtro_aire,   'filtro_aire',     hasData),
    filtro_gasolina: resolveFiltro(gasolinaEntry,         'filtro_gasolina', hasData),
    filtro_cabina:   resolveFiltro(record?.filtro_cabina, 'filtro_cabina',   isVW && !record?.filtro_cabina?.sku ? false : hasData),
  };
}

/**
 * Alias de compatibilidad — catalog.js lo importa como computeKitData.
 * @deprecated Usar computeKitAfinacion directamente.
 */
export function computeKitData(bujia) {
  return computeKitAfinacion(bujia);
}

/**
 * Comprueba si un FiltroResuelto tiene SKU real asignado.
 * Uso en UI: if (filtroTieneSkuReal(filtro)) { mostrar SKU } else { mostrar fallback }
 *
 * @param {FiltroResuelto} filtro
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
