const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const antiscaping = require('../middleware/antiscaping');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const Vehiculo = require('../models/Vehiculo');
const PrecioFiltro = require('../models/PrecioFiltro');
const PrecioBujia = require('../models/PrecioBujia');
const Balata = require('../models/Balata');
const { getFullModelSearchKeys } = require('../models/modelNormalizer');

const escapeRegExp = (string) => string ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
const YEAR_HORIZON = 2035;

const TIPO_FILTRO = {
  filtro_aceite:   'Intercambiable / Cartucho',
  filtro_aire:     'Panel / Cilíndrico',
  filtro_gasolina: 'Línea',
  filtro_cabina:   'Polen',
};

let priceCache = {
  preciosMap: null,
  bujiasMap: null,
  balatasList: null,
  lastUpdated: 0
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function invalidatePriceCache() {
  priceCache.preciosMap = null;
  priceCache.bujiasMap = null;
  priceCache.balatasList = null;
  priceCache.lastUpdated = 0;
}

// Cargar la base de datos de filtros de VW de Interfil en el servidor
let vwFiltrosData = [];
try {
  const jsonPath = path.join(__dirname, '../src/data/vw_filtros_interfil_2020_2021.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    vwFiltrosData = parsed.registros || [];
  }
} catch (err) {
  console.error('Error loading VW filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Chevrolet de Interfil en el servidor
let chevroletFiltrosData = [];
try {
  const jsonPath = path.join(__dirname, '../src/data/interfil_chevrolet.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    chevroletFiltrosData = parsed.CHEVROLET || [];
  }
} catch (err) {
  console.error('Error loading Chevrolet filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Ford de Interfil en el servidor
let fordFiltrosData = [];
try {
  const jsonPath = path.join(__dirname, '../src/data/ford_interfil_catalogo.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    fordFiltrosData = parsed || [];
  }
} catch (err) {
  console.error('Error loading Ford filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Honda de Interfil en el servidor
let hondaFiltrosData = [];
try {
  const jsonPath = path.join(__dirname, '../src/data/honda_interfil_catalogo.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    hondaFiltrosData = parsed || [];
  }
} catch (err) {
  console.error('Error loading Honda filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Toyota de Interfil en el servidor
let toyotaFiltrosData = [];
try {
  const jsonPath = path.join(__dirname, '../src/data/toyota_interfil.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    toyotaFiltrosData = parsed || [];
  }
} catch (err) {
  console.error('Error loading Toyota filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Mazda de Interfil en el servidor
let mazdaFiltrosData = [];
try {
  const jsonPath = path.join(__dirname, '../src/data/mazda_interfil.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw);
    mazdaFiltrosData = parsed || [];
  }
} catch (err) {
  console.error('Error loading Mazda filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Nissan JOE en el servidor
let nissanJoeFiltrosData = [];
try {
  nissanJoeFiltrosData = require('../src/data/nissanAireJoe');
} catch (err) {
  console.error('Error loading Nissan JOE filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Nissan UNIFIL en el servidor
let nissanUnifilData = [];
try {
  nissanUnifilData = require('../src/data/nissanUnifil');
} catch (err) {
  console.error('Error loading Nissan Unifil filters on backend:', err.message);
}

// Cargar la base de datos de filtros de VW UNIFIL en el servidor
let volkswagenUnifilData = [];
try {
  volkswagenUnifilData = require('../src/data/volkswagenUnifil');
} catch (err) {
  console.error('Error loading VW Unifil filters on backend:', err.message);
}


// Cargar la base de datos de filtros de VW JOE en el servidor
let vwJoeFiltrosData = [];
try {
  vwJoeFiltrosData = require('../src/data/volkswagenAireJoe');
} catch (err) {
  console.error('Error loading VW JOE filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Chevrolet JOE en el servidor
let chevroletJoeFiltrosData = [];
try {
  chevroletJoeFiltrosData = require('../src/data/chevroletAireJoe');
} catch (err) {
  console.error('Error loading Chevrolet JOE filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Ford JOE en el servidor
let fordJoeFiltrosData = [];
try {
  fordJoeFiltrosData = require('../src/data/fordAireJoe');
} catch (err) {
  console.error('Error loading Ford JOE filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Honda JOE en el servidor
let hondaJoeFiltrosData = [];
try {
  hondaJoeFiltrosData = require('../src/data/hondaAireJoe');
} catch (err) {
  console.error('Error loading Honda JOE filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Toyota JOE en el servidor
let toyotaJoeFiltrosData = [];
try {
  toyotaJoeFiltrosData = require('../src/data/toyotaAireJoe');
} catch (err) {
  console.error('Error loading Toyota JOE filters on backend:', err.message);
}

// Cargar la base de datos de filtros de Mazda JOE en el servidor
let mazdaJoeFiltrosData = [];
try {
  mazdaJoeFiltrosData = require('../src/data/mazdaAireJoe');
} catch (err) {
  console.error('Error loading Mazda JOE filters on backend:', err.message);
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
 * Búsqueda difusa de filtros de VW (CommonJS)
 */
function lookupFiltroVW(bujia) {
  const modeloNorm = normalizeVwModelo(bujia.modelo, bujia.litros);

  const matches = vwFiltrosData.filter(r => {
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
  if (m.startsWith('SILVERADO') && m.includes('2500')) {
    return 'SILVERADO 2500';
  }
  if (m.startsWith('SILVERADO') && m.includes('3500')) {
    return 'SILVERADO 3500';
  }
  if (m.startsWith('SILVERADO')) {
    return 'SILVERADO 1500';
  }
  if (m.startsWith('SUBURBAN')) {
    return 'SUBURBAN';
  }
  return m;
}

/**
 * Búsqueda difusa de filtros de Chevrolet (CommonJS)
 */
function lookupFiltroChevrolet(bujia) {
  const modeloNorm = normalizeChevroletModelo(bujia.modelo);

  const matches = chevroletFiltrosData.filter(r => {
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
 * Búsqueda difusa de filtros de Ford (CommonJS)
 */
function lookupFiltroFord(bujia) {
  const modeloNorm = normalizeFordModelo(bujia.modelo);

  const matches = fordFiltrosData.filter(r => {
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
 * Búsqueda difusa de filtros de Honda (CommonJS)
 */
function lookupFiltroHonda(bujia) {
  const modeloNorm = normalizeHondaModelo(bujia.modelo);

  const matches = hondaFiltrosData.filter(r => {
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

function resolveFiltro(entry, tipo, hasData) {
  return {
    tipo,
    marca: entry?.marca || null,
    sku: entry?.sku || null,
    hasData
  };
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
 * Búsqueda difusa de filtros de Toyota (CommonJS)
 * Nota: Interfil Toyota usa formato "2.4 L" (con espacio antes de L).
 */
function lookupFiltroToyota(bujia) {
  const modeloNorm = normalizeToyotaModelo(bujia.modelo);

  const matches = toyotaFiltrosData.filter(r => {
    if ((r.modelo || '').toUpperCase() !== modeloNorm) return false;

    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) return false;
    }

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

/**
 * Normaliza el modelo NGK al formato Interfil Mazda.
 * "2" → "MAZDA 2", "CX-5" → "CX5", "B2300" → "B-2300", etc.
 */
function normalizeMazdaModelo(modelo) {
  const m = (modelo || '').trim();
  if (/^\d$/.test(m)) return `MAZDA ${m}`;
  const cxFull = m.match(/^CX-(\d+)$/i);
  if (cxFull) {
    const num = cxFull[1];
    return `CX${num}`;
  }
  const bMatch = m.match(/^B(\d{4})$/i);
  if (bMatch) return `B-${bMatch[1]}`;
  return m.toUpperCase();
}

/**
 * Búsqueda difusa de filtros de Mazda (CommonJS).
 * Usa normalizeMazdaModelo() para resolver el mismatch NGK vs Interfil.
 * Interfil usa "1.6 L"; algunos registros tienen "1.6 L / 1.8 L".
 */
function lookupFiltroMazda(bujia) {
  const modeloNorm = normalizeMazdaModelo(bujia.modelo);

  const matches = mazdaFiltrosData.filter(r => {
    if ((r.modelo || '').toUpperCase() !== modeloNorm) return false;

    const litBujia = parseFloat(bujia.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      const litRecord = match ? parseFloat(match[1]) : null;
      if (litRecord !== null && litRecord !== litBujia) return false;
    }

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


/**
 * Enriquecer el kit de Volkswagen en el Backend
 */
function enrichVwKit(vehiculo) {
  if (vehiculo.marca && vehiculo.marca.toLowerCase() === 'volkswagen') {
    const record = lookupFiltroVW(vehiculo);
    if (record) {
      const hasData = true;
      let aceiteEntry = record.filtro_aceite;
      if (record.filtro_aceite_cartucho?.sku) {
        aceiteEntry = record.filtro_aceite_cartucho;
      }
      
      let gasolinaEntry = record.filtro_gasolina;
      if (!record.filtro_gasolina?.sku) {
        gasolinaEntry = { marca: null, sku: 'SELLADO' };
      }

      const hasCabina = !!record.filtro_cabina?.sku;

      vehiculo.kit_afinacion = {
        filtro_aceite: resolveFiltro(aceiteEntry, 'Intercambiable / Cartucho', hasData),
        filtro_aire: resolveFiltro(record.filtro_aire, 'Panel / Cilíndrico', hasData),
        filtro_gasolina: resolveFiltro(gasolinaEntry, 'Línea', hasData),
        filtro_cabina: resolveFiltro(record.filtro_cabina, 'Polen', hasCabina)
      };
    }
  }
  return vehiculo;
}

/**
 * Enriquecer el kit de Chevrolet en el Backend
 */
function enrichChevroletKit(vehiculo) {
  if (vehiculo.marca && vehiculo.marca.toLowerCase() === 'chevrolet') {
    const record = lookupFiltroChevrolet(vehiculo);
    if (record) {
      const hasData = true;
      let aceiteEntry = record.filtro_aceite;
      if (record.filtro_aceite_cartucho?.sku) {
        aceiteEntry = record.filtro_aceite_cartucho;
      }
      
      let gasolinaEntry = record.filtro_gasolina;
      if (!record.filtro_gasolina?.sku) {
        gasolinaEntry = { marca: null, sku: 'SELLADO' };
      }

      const hasCabina = !!record.filtro_cabina?.sku;

      vehiculo.kit_afinacion = {
        filtro_aceite: resolveFiltro(aceiteEntry, 'Intercambiable / Cartucho', hasData),
        filtro_aire: resolveFiltro(record.filtro_aire, 'Panel / Cilíndrico', hasData),
        filtro_gasolina: resolveFiltro(gasolinaEntry, 'Línea', hasData),
        filtro_cabina: resolveFiltro(record.filtro_cabina, 'Polen', hasCabina)
      };
    }
  }
  return vehiculo;
}

/**
 * Enriquecer el kit de Ford en el Backend
 */
function enrichFordKit(vehiculo) {
  if (vehiculo.marca && vehiculo.marca.toLowerCase() === 'ford') {
    const record = lookupFiltroFord(vehiculo);
    if (record) {
      const hasData = true;
      let aceiteEntry = record.filtro_aceite;
      if (record.filtro_aceite_cartucho?.sku) {
        aceiteEntry = record.filtro_aceite_cartucho;
      }
      
      let gasolinaEntry = record.filtro_gasolina;
      if (!record.filtro_gasolina?.sku) {
        gasolinaEntry = { marca: null, sku: 'SELLADO' };
      }

      const hasCabina = !!record.filtro_cabina?.sku;

      vehiculo.kit_afinacion = {
        filtro_aceite: resolveFiltro(aceiteEntry, 'Intercambiable / Cartucho', hasData),
        filtro_aire: resolveFiltro(record.filtro_aire, 'Panel / Cilíndrico', hasData),
        filtro_gasolina: resolveFiltro(gasolinaEntry, 'Línea', hasData),
        filtro_cabina: resolveFiltro(record.filtro_cabina, 'Polen', hasCabina)
      };
    }
  }
  return vehiculo;
}

/**
 * Enriquecer el kit de Honda en el Backend
 */
function enrichHondaKit(vehiculo) {
  if (vehiculo.marca && vehiculo.marca.toLowerCase() === 'honda') {
    const record = lookupFiltroHonda(vehiculo);
    if (record) {
      const hasData = true;
      let aceiteEntry = record.filtro_aceite;
      if (record.filtro_aceite_cartucho?.sku) {
        aceiteEntry = record.filtro_aceite_cartucho;
      }
      
      let gasolinaEntry = record.filtro_gasolina;
      if (!record.filtro_gasolina?.sku) {
        gasolinaEntry = { marca: null, sku: 'SELLADO' };
      }

      const hasCabina = !!record.filtro_cabina?.sku;

      vehiculo.kit_afinacion = {
        filtro_aceite: resolveFiltro(aceiteEntry, 'Intercambiable / Cartucho', hasData),
        filtro_aire: resolveFiltro(record.filtro_aire, 'Panel / Cilíndrico', hasData),
        filtro_gasolina: resolveFiltro(gasolinaEntry, 'Línea', hasData),
        filtro_cabina: resolveFiltro(record.filtro_cabina, 'Polen', hasCabina)
      };
    }
  }
  return vehiculo;
}

/**
 * Enriquecer el kit de Toyota en el Backend
 */
function enrichToyotaKit(vehiculo) {
  if (vehiculo.marca && vehiculo.marca.toLowerCase() === 'toyota') {
    const record = lookupFiltroToyota(vehiculo);
    if (record) {
      const hasData = true;
      let aceiteEntry = record.filtro_aceite;
      if (record.filtro_aceite_cartucho?.sku) {
        aceiteEntry = record.filtro_aceite_cartucho;
      }
      let gasolinaEntry = record.filtro_gasolina;
      if (!record.filtro_gasolina?.sku) {
        gasolinaEntry = { marca: null, sku: 'SELLADO' };
      }
      const hasCabina = !!record.filtro_cabina?.sku;
      vehiculo.kit_afinacion = {
        filtro_aceite:   resolveFiltro(aceiteEntry,          'Intercambiable / Cartucho', hasData),
        filtro_aire:     resolveFiltro(record.filtro_aire,   'Panel / Cilíndrico',        hasData),
        filtro_gasolina: resolveFiltro(gasolinaEntry,        'Línea',                    hasData),
        filtro_cabina:   resolveFiltro(record.filtro_cabina, 'Polen',                     hasCabina)
      };
    }
  }
  return vehiculo;
}

/**
 * Enriquecer el kit de Mazda en el Backend
 */
function enrichMazdaKit(vehiculo) {
  if (vehiculo.marca && vehiculo.marca.toLowerCase() === 'mazda') {
    const record = lookupFiltroMazda(vehiculo);
    if (record) {
      const hasData = true;
      let aceiteEntry = record.filtro_aceite;
      if (record.filtro_aceite_cartucho?.sku) {
        aceiteEntry = record.filtro_aceite_cartucho;
      }
      let gasolinaEntry = record.filtro_gasolina;
      if (!record.filtro_gasolina?.sku) {
        gasolinaEntry = { marca: null, sku: 'SELLADO' };
      }
      const hasCabina = !!record.filtro_cabina?.sku;
      vehiculo.kit_afinacion = {
        filtro_aceite:   resolveFiltro(aceiteEntry,          'Intercambiable / Cartucho', hasData),
        filtro_aire:     resolveFiltro(record.filtro_aire,   'Panel / Cilíndrico',        hasData),
        filtro_gasolina: resolveFiltro(gasolinaEntry,        'Línea',                    hasData),
        filtro_cabina:   resolveFiltro(record.filtro_cabina, 'Polen',                     hasCabina)
      };
    }
  }
  return vehiculo;
}

/**
 * Sincronizar filtros de Volkswagen existentes en la base de datos
 */
async function syncVwFiltersInDatabase() {
  try {
    const vws = await Vehiculo.find({ marca: /volkswagen/i });
    let updatedCount = 0;
    for (const vw of vws) {
      const original = JSON.stringify(vw.kit_afinacion);
      const enrichedObj = enrichVwKit(vw.toObject());
      if (JSON.stringify(enrichedObj.kit_afinacion) !== original) {
        vw.kit_afinacion = enrichedObj.kit_afinacion;
        await vw.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Volkswagen con SKUs reales en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing VW database filters:', err.message);
  }
}

/**
 * Sincronizar filtros de Chevrolet existentes en la base de datos
 */
async function syncChevroletFiltersInDatabase() {
  try {
    const chevrolets = await Vehiculo.find({ marca: /chevrolet/i });
    let updatedCount = 0;
    for (const chev of chevrolets) {
      const original = JSON.stringify(chev.kit_afinacion);
      const enrichedObj = enrichChevroletKit(chev.toObject());
      if (JSON.stringify(enrichedObj.kit_afinacion) !== original) {
        chev.kit_afinacion = enrichedObj.kit_afinacion;
        await chev.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Chevrolet con SKUs reales en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Chevrolet database filters:', err.message);
  }
}

/**
 * Sincronizar filtros de Ford existentes en la base de datos
 */
async function syncFordFiltersInDatabase() {
  try {
    const fords = await Vehiculo.find({ marca: /ford/i });
    let updatedCount = 0;
    for (const ford of fords) {
      const original = JSON.stringify(ford.kit_afinacion);
      const enrichedObj = enrichFordKit(ford.toObject());
      if (JSON.stringify(enrichedObj.kit_afinacion) !== original) {
        ford.kit_afinacion = enrichedObj.kit_afinacion;
        await ford.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Ford con SKUs reales en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Ford database filters:', err.message);
  }
}

/**
 * Sincronizar filtros de Honda existentes en la base de datos
 */
async function syncHondaFiltersInDatabase() {
  try {
    const hondas = await Vehiculo.find({ marca: /honda/i });
    let updatedCount = 0;
    for (const honda of hondas) {
      const original = JSON.stringify(honda.kit_afinacion);
      const enrichedObj = enrichHondaKit(honda.toObject());
      if (JSON.stringify(enrichedObj.kit_afinacion) !== original) {
        honda.kit_afinacion = enrichedObj.kit_afinacion;
        await honda.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Honda con SKUs reales en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Honda database filters:', err.message);
  }
}

/**
 * Sincronizar filtros de Toyota existentes en la base de datos
 */
async function syncToyotaFiltersInDatabase() {
  try {
    const toyotas = await Vehiculo.find({ marca: /toyota/i });
    let updatedCount = 0;
    for (const toyota of toyotas) {
      const original    = JSON.stringify(toyota.kit_afinacion);
      const enrichedObj = enrichToyotaKit(toyota.toObject());
      if (JSON.stringify(enrichedObj.kit_afinacion) !== original) {
        toyota.kit_afinacion = enrichedObj.kit_afinacion;
        await toyota.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Toyota con SKUs reales en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Toyota database filters:', err.message);
  }
}

/**
 * Sincronizar filtros de Mazda existentes en la base de datos
 */
async function syncMazdaFiltersInDatabase() {
  try {
    const mazdas = await Vehiculo.find({ marca: /mazda/i });
    let updatedCount = 0;
    for (const mazda of mazdas) {
      const original    = JSON.stringify(mazda.kit_afinacion);
      const enrichedObj = enrichMazdaKit(mazda.toObject());
      if (JSON.stringify(enrichedObj.kit_afinacion) !== original) {
        mazda.kit_afinacion = enrichedObj.kit_afinacion;
        await mazda.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Mazda con SKUs reales en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Mazda database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de Nissan (JOE)
 */
function lookupNissanAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = nissanJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;
      
      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Búsqueda difusa de filtros de Unifil para Nissan
 */
function lookupNissanUnifil(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = nissanUnifilData.filter(r => {
    const modeloUnifil = (r.modelo || '').toUpperCase();
    if (!modeloUnifil.includes(modeloBujia) && !modeloBujia.includes(modeloUnifil)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;
      
      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de Unifil para Nissan en la base de datos
 */
async function syncNissanUnifil() {
  try {
    const nissans = await Vehiculo.find({ marca: /nissan/i });
    let updatedCount = 0;
    const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];

    for (const nissan of nissans) {
      const record = lookupNissanUnifil(nissan);
      if (record && record.filtros) {
        const unifilObj = {
          filtro_aire: record.filtros.filtro_aire || null,
          filtro_aceite: record.filtros.filtro_aceite || null,
          filtro_gasolina: record.filtros.filtro_gasolina || null,
          filtro_cabina: record.filtros.filtro_cabina || null
        };

        const newKit = {};
        for (const key of keys) {
          const currentFiltro = nissan.kit_afinacion?.[key];
          let interfilSku = null;
          if (currentFiltro) {
            if (currentFiltro.marca && currentFiltro.marca.toUpperCase() === 'INTERFIL') {
              interfilSku = currentFiltro.sku;
            } else if (currentFiltro.alternos && Array.isArray(currentFiltro.alternos)) {
              const found = currentFiltro.alternos.find(a => a.marca && a.marca.toUpperCase() === 'INTERFIL');
              if (found) interfilSku = found.sku;
            }
          }

          const joeSku = nissan.referencias_alternas?.[`${key}_joe`] || null;
          const unifilSku = record.filtros[key] || null;

          let winnerMarca = null;
          let winnerSku = null;
          const alternos = [];

          if (unifilSku) {
            winnerMarca = 'UNIFIL';
            winnerSku = unifilSku;
            if (interfilSku) {
              alternos.push({ marca: 'INTERFIL', sku: interfilSku });
            }
            if (joeSku) {
              alternos.push({ marca: 'JOE', sku: joeSku });
            }
          } else if (interfilSku) {
            winnerMarca = 'INTERFIL';
            winnerSku = interfilSku;
            if (joeSku) {
              alternos.push({ marca: 'JOE', sku: joeSku });
            }
          } else if (joeSku) {
            winnerMarca = 'JOE';
            winnerSku = joeSku;
          }

          if (key === 'filtro_gasolina' && !winnerSku) {
            winnerSku = 'SELLADO';
            winnerMarca = null;
          }

          newKit[key] = {
            tipo: TIPO_FILTRO[key],
            marca: winnerMarca,
            sku: winnerSku,
            hasData: !!winnerSku,
            alternos: alternos
          };
        }

        let modified = false;

        if (JSON.stringify(nissan.filtros_unifil) !== JSON.stringify(unifilObj)) {
          nissan.filtros_unifil = unifilObj;
          nissan.markModified('filtros_unifil');
          modified = true;
        }

        if (JSON.stringify(nissan.kit_afinacion) !== JSON.stringify(newKit)) {
          nissan.kit_afinacion = newKit;
          nissan.markModified('kit_afinacion');
          modified = true;
        }

        if (modified) {
          await nissan.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Nissan con filtros UNIFIL en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Nissan UNIFIL database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de Unifil para Volkswagen
 */
function lookupVolkswagenUnifil(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  let modeloNorm = modeloBujia;
  if (modeloBujia === 'JETTA CLASICO' || modeloBujia === 'CLASICO JETTA' || modeloBujia === 'CLASICO') {
    modeloNorm = 'CLASICO';
  }

  const matches = volkswagenUnifilData.filter(r => {
    const modeloUnifil = (r.modelo || '').toUpperCase();
    if (modeloUnifil !== modeloNorm && !modeloUnifil.includes(modeloNorm) && !modeloNorm.includes(modeloUnifil)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;
      
      if (r.anio.includes(',')) {
        const years = r.anio.split(',').map(y => parseInt(y.trim(), 10));
        let overlaps = false;
        for (let y = vehiculo.anio_inicio; y <= vehiculo.anio_fin; y++) {
          if (years.includes(y)) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) return false;
      } else if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de Unifil para Volkswagen en la base de datos
 */
async function syncVolkswagenUnifil() {
  try {
    const vws = await Vehiculo.find({ marca: /volkswagen/i });
    let updatedCount = 0;
    const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];

    for (const vw of vws) {
      const record = lookupVolkswagenUnifil(vw);
      if (record && record.filtros) {
        const unifilObj = {
          filtro_aire: record.filtros.filtro_aire || null,
          filtro_aceite: record.filtros.filtro_aceite || null,
          filtro_gasolina: record.filtros.filtro_gasolina || null,
          filtro_cabina: record.filtros.filtro_cabina || null
        };

        const newKit = {};
        for (const key of keys) {
          const currentFiltro = vw.kit_afinacion?.[key];
          let interfilSku = null;
          if (currentFiltro) {
            if (currentFiltro.marca && currentFiltro.marca.toUpperCase() === 'INTERFIL') {
              interfilSku = currentFiltro.sku;
            } else if (currentFiltro.alternos && Array.isArray(currentFiltro.alternos)) {
              const found = currentFiltro.alternos.find(a => a.marca && a.marca.toUpperCase() === 'INTERFIL');
              if (found) interfilSku = found.sku;
            }
          }

          const joeSku = vw.referencias_alternas?.[`${key}_joe`] || null;
          const unifilSku = record.filtros[key] || null;

          let winnerMarca = null;
          let winnerSku = null;
          const alternos = [];

          if (unifilSku) {
            winnerMarca = 'UNIFIL';
            winnerSku = unifilSku;
            if (interfilSku) {
              alternos.push({ marca: 'INTERFIL', sku: interfilSku });
            }
            if (joeSku) {
              alternos.push({ marca: 'JOE', sku: joeSku });
            }
          } else if (interfilSku) {
            winnerMarca = 'INTERFIL';
            winnerSku = interfilSku;
            if (joeSku) {
              alternos.push({ marca: 'JOE', sku: joeSku });
            }
          } else if (joeSku) {
            winnerMarca = 'JOE';
            winnerSku = joeSku;
          }

          if (key === 'filtro_gasolina' && !winnerSku) {
            winnerSku = 'SELLADO';
            winnerMarca = null;
          }

          newKit[key] = {
            tipo: TIPO_FILTRO[key],
            marca: winnerMarca,
            sku: winnerSku,
            hasData: !!winnerSku,
            alternos: alternos
          };
        }

        let modified = false;

        if (JSON.stringify(vw.filtros_unifil) !== JSON.stringify(unifilObj)) {
          vw.filtros_unifil = unifilObj;
          vw.markModified('filtros_unifil');
          modified = true;
        }

        if (JSON.stringify(vw.kit_afinacion) !== JSON.stringify(newKit)) {
          vw.kit_afinacion = newKit;
          vw.markModified('kit_afinacion');
          modified = true;
        }

        if (modified) {
          await vw.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Volkswagen con filtros UNIFIL en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing VW UNIFIL database filters:', err.message);
  }
}

/**
 * Sincronizar filtros de aire JOE para Nissan en la base de datos
 */
async function syncNissanAireJoe() {
  try {
    const nissans = await Vehiculo.find({ marca: /nissan/i });
    let updatedCount = 0;
    for (const nissan of nissans) {
      const record = lookupNissanAireJoe(nissan);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = nissan.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          nissan.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          nissan.markModified('referencias_alternas');
          await nissan.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Nissan con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Nissan JOE database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de VW (JOE)
 */
function lookupVWAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = vwJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;
      
      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de aire JOE para VW en la base de datos
 */
async function syncVWAireJoe() {
  try {
    const vws = await Vehiculo.find({ marca: /volkswagen/i });
    let updatedCount = 0;
    for (const vw of vws) {
      const record = lookupVWAireJoe(vw);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = vw.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          vw.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          vw.markModified('referencias_alternas');
          await vw.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Volkswagen con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing VW JOE database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de Chevrolet (JOE)
 */
function lookupChevroletAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = chevroletJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;
      
      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de aire JOE para Chevrolet en la base de datos
 */
async function syncChevroletAireJoe() {
  try {
    const chevrolets = await Vehiculo.find({ marca: /chevrolet/i });
    let updatedCount = 0;
    for (const chev of chevrolets) {
      const record = lookupChevroletAireJoe(chev);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = chev.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          chev.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          chev.markModified('referencias_alternas');
          await chev.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Chevrolet con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Chevrolet JOE database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de Ford (JOE)
 */
function lookupFordAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = fordJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;

      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end   = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de aire JOE para Ford en la base de datos
 */
async function syncFordAireJoe() {
  try {
    const fords = await Vehiculo.find({ marca: /ford/i });
    let updatedCount = 0;
    for (const ford of fords) {
      const record = lookupFordAireJoe(ford);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = ford.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          ford.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          ford.markModified('referencias_alternas');
          await ford.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Ford con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Ford JOE database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de Honda (JOE)
 */
function lookupHondaAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = hondaJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;

      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end   = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de aire JOE para Honda en la base de datos
 */
async function syncHondaAireJoe() {
  try {
    const hondas = await Vehiculo.find({ marca: /honda/i });
    let updatedCount = 0;
    for (const honda of hondas) {
      const record = lookupHondaAireJoe(honda);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = honda.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          honda.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          honda.markModified('referencias_alternas');
          await honda.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Honda con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Honda JOE database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de Toyota (JOE)
 */
function lookupToyotaAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = toyotaJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;

      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end   = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de aire JOE para Toyota en la base de datos
 */
async function syncToyotaAireJoe() {
  try {
    const toyotas = await Vehiculo.find({ marca: /toyota/i });
    let updatedCount = 0;
    for (const toyota of toyotas) {
      const record = lookupToyotaAireJoe(toyota);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = toyota.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          toyota.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          toyota.markModified('referencias_alternas');
          await toyota.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Toyota con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Toyota JOE database filters:', err.message);
  }
}

/**
 * Búsqueda difusa de filtros de aire de Mazda (JOE)
 */
function lookupMazdaAireJoe(vehiculo) {
  const modeloBujia = (vehiculo.modelo || '').trim().toUpperCase();
  const matches = mazdaJoeFiltrosData.filter(r => {
    const modeloJoe = (r.modelo || '').toUpperCase();
    if (!modeloJoe.includes(modeloBujia) && !modeloBujia.includes(modeloJoe)) {
      return false;
    }

    const litBujia = parseFloat(vehiculo.litros);
    if (!isNaN(litBujia)) {
      const match = (r.motor || '').match(/(\d+\.?\d*)\s*L/i);
      if (match) {
        const litRecord = parseFloat(match[1]);
        if (litRecord !== litBujia) return false;
      }
    }

    if (r.anio && r.anio.toUpperCase() !== 'ALL') {
      let start = null;
      let end = null;

      if (r.anio.includes('-')) {
        const parts = r.anio.split('-');
        start = parseInt(parts[0], 10);
        end   = parseInt(parts[1], 10);
      } else if (r.anio.includes('>')) {
        start = parseInt(r.anio.replace('>', ''), 10);
        end = YEAR_HORIZON;
      } else {
        start = parseInt(r.anio, 10);
        end = start;
      }

      if (start !== null && !isNaN(start)) {
        if (!end || isNaN(end)) end = start;
        if (vehiculo.anio_fin < start || vehiculo.anio_inicio > end) return false;
      }
    }
    return true;
  });

  return matches.length > 0 ? matches[0] : null;
}

/**
 * Sincronizar filtros de aire JOE para Mazda en la base de datos
 */
async function syncMazdaAireJoe() {
  try {
    const mazdas = await Vehiculo.find({ marca: /mazda/i });
    let updatedCount = 0;
    for (const mazda of mazdas) {
      const record = lookupMazdaAireJoe(mazda);
      if (record && record.filtro_aire && record.filtro_aire.sku) {
        const currentRef = mazda.referencias_alternas || {};
        if (currentRef.filtro_aire_joe !== record.filtro_aire.sku) {
          mazda.referencias_alternas = {
            ...currentRef,
            filtro_aire_joe: record.filtro_aire.sku
          };
          mazda.markModified('referencias_alternas');
          await mazda.save();
          updatedCount++;
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`⚡ Sincronizados de inmediato ${updatedCount} vehículos Mazda con referencias alternas JOE en MongoDB Atlas.`);
    }
  } catch (err) {
    console.error('Error synchronizing Mazda JOE database filters:', err.message);
  }
}



/**
 * Helper to dynamically enrich vehicles' kit_afinacion with costs from PrecioFiltro.
 * Calculates costs for UNIFIL items and provides a fallback for other brands.
 */
async function enrichVehiculosWithPrices(vehiculos) {
  try {
    const now = Date.now();
    if (!priceCache.preciosMap || !priceCache.bujiasMap || !priceCache.balatasList || (now - priceCache.lastUpdated > CACHE_TTL)) {
      const [preciosList, bujiasList, balatasList] = await Promise.all([
        PrecioFiltro.find({}),
        PrecioBujia.find({}),
        Balata.find({})
      ]);

      const preciosMap = new Map();
      preciosList.forEach(p => {
        if (p.clave) {
          const brand = (p.marca || 'UNIFIL').trim().toUpperCase();
          const clave = p.clave.trim().toUpperCase();
          preciosMap.set(`${brand}_${clave}`, p.precio);
          if (brand === 'UNIFIL') {
            preciosMap.set(clave, p.precio); // fallback
          }
        }
      });

      const bujiasMap = new Map();
      bujiasList.forEach(b => {
        if (b.sku) {
          bujiasMap.set(b.sku.trim().toUpperCase(), b.precio_cliente);
        }
      });

      priceCache = {
        preciosMap,
        bujiasMap,
        balatasList,
        lastUpdated: now
      };
    }

    const { preciosMap, bujiasMap, balatasList } = priceCache;
    const DEFAULT_COST = 80;

    return vehiculos.map(v => {
      const vObj = v.toObject();
      
      const vehicleModelUpper = (vObj.modelo || '').trim().toUpperCase();
      const vehicleBrandUpper = (vObj.marca || '').trim().toUpperCase();

      // Build all candidate search keys including aliases (BUG 1 fix)
      const candidateKeys = getFullModelSearchKeys(vehicleBrandUpper, vehicleModelUpper);

      const matchingBalatas = balatasList.filter(b => {
        return b.vehiculos_compatibles.some(vc => {
          const vcModelUpper = (vc.modelo || '').toUpperCase().trim();
          const isModelMatch = candidateKeys.includes(vcModelUpper);
          if (!isModelMatch) return false;

          const yearOverlap = !(vObj.anio_fin < vc.anio_inicio || vObj.anio_inicio > vc.anio_fin);
          return yearOverlap;
        });
      });

      // Flag vehicles whose model is known but all year ranges are exhausted (BUG 2)
      const nameOnlyMatches = balatasList.filter(b =>
        b.vehiculos_compatibles.some(vc =>
          candidateKeys.includes((vc.modelo || '').toUpperCase().trim())
        )
      );
      const hasNameMatch = nameOnlyMatches.length > 0;
      const hasYearMatch = matchingBalatas.length > 0;

      vObj.balatas = matchingBalatas.map(b => ({
        sku_dynamic: b.sku_dynamic,
        sku_equivalente_wagner: b.sku_equivalente_wagner,
        fmsi: b.fmsi,
        posicion: b.posicion
      }));

      // Metadata: helps UI decide messaging ("en catálogo pero años sin datos" vs "sin datos")
      vObj.balatas_meta = {
        tiene_nombre_en_catalogo: hasNameMatch,
        tiene_cobertura_en_anio: hasYearMatch,
      };
      
      // Parse cylinders/spark plugs count
      const matchCyl = (vObj.cilindros_config || '').match(/\d+/);
      const numCilindros = matchCyl ? parseInt(matchCyl[0], 10) : 4;

      const getBujiaPrice = (sku) => {
        if (!sku) return 0;
        const skuUpper = sku.trim().toUpperCase();
        if (bujiasMap.has(skuUpper)) {
          return bujiasMap.get(skuUpper);
        }
        return 50; // default unit price: $50
      };

      if (vObj.kit_afinacion) {
        let costoTotal = 0;
        const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
        
        keys.forEach(key => {
          const filtro = vObj.kit_afinacion[key];
          if (filtro && filtro.sku) {
            const skuUpper = (filtro.sku || '').trim().toUpperCase();
            if (skuUpper === 'SELLADO') {
              filtro.costo = 0;
            } else {
              let costo = DEFAULT_COST;
              const nameUpper = (filtro.marca || 'UNIFIL').trim().toUpperCase();
              const lookupKey = `${nameUpper}_${skuUpper}`;
              
              if (preciosMap.has(lookupKey)) {
                costo = preciosMap.get(lookupKey);
              } else if (preciosMap.has(skuUpper)) {
                costo = preciosMap.get(skuUpper);
              }
              filtro.costo = costo;
              costoTotal += costo;
            }
          } else if (filtro) {
            filtro.costo = 0;
          }
        });
        vObj.kit_afinacion.costo_total = parseFloat(costoTotal.toFixed(2));

        // Add dynamic spark plug prices to the kit_afinacion structure
        const iridiumPriceUnit = getBujiaPrice(vObj.bujia_iridium_ix?.tipo);
        const platinoPriceUnit = getBujiaPrice(vObj.bujia_g_power?.tipo);
        const vpowerPriceUnit = getBujiaPrice(vObj.bujia_v_power?.tipo);
        const stockPriceUnit = getBujiaPrice(vObj.bujia_stock?.tipo);

        vObj.kit_afinacion.bujias = {
          iridium: {
            sku: vObj.bujia_iridium_ix?.tipo || null,
            precio_unitario: iridiumPriceUnit,
            precio_total: parseFloat((iridiumPriceUnit * numCilindros).toFixed(2))
          },
          platino: {
            sku: vObj.bujia_g_power?.tipo || null,
            precio_unitario: platinoPriceUnit,
            precio_total: parseFloat((platinoPriceUnit * numCilindros).toFixed(2))
          },
          vpower: {
            sku: vObj.bujia_v_power?.tipo || null,
            precio_unitario: vpowerPriceUnit,
            precio_total: parseFloat((vpowerPriceUnit * numCilindros).toFixed(2))
          },
          stock: {
            sku: vObj.bujia_stock?.tipo || null,
            precio_unitario: stockPriceUnit,
            precio_total: parseFloat((stockPriceUnit * numCilindros).toFixed(2))
          }
        };
      }
      return vObj;
    });
  } catch (err) {
    console.error('Error enriching vehicles with prices:', err.message);
    return vehiculos.map(v => {
      const vObj = v.toObject();
      
      const matchCyl = (vObj.cilindros_config || '').match(/\d+/);
      const numCilindros = matchCyl ? parseInt(matchCyl[0], 10) : 4;
      const fallbackUnit = 50;
      const fallbackTotal = fallbackUnit * numCilindros;

      if (vObj.kit_afinacion) {
        let costoTotal = 0;
        const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
        keys.forEach(key => {
          const filtro = vObj.kit_afinacion[key];
          if (filtro && filtro.sku && filtro.sku !== 'SELLADO') {
            filtro.costo = 80;
            costoTotal += 80;
          } else if (filtro) {
            filtro.costo = 0;
          }
        });
        vObj.kit_afinacion.costo_total = costoTotal;
        // Fallback spark plug pricing structures
        vObj.kit_afinacion.bujias = {
          iridium: { sku: vObj.bujia_iridium_ix?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal },
          platino: { sku: vObj.bujia_g_power?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal },
          vpower: { sku: vObj.bujia_v_power?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal },
          stock: { sku: vObj.bujia_stock?.tipo || null, precio_unitario: fallbackUnit, precio_total: fallbackTotal }
        };
      }
      return vObj;
    });
  }
}

// Rate limiter specifically for catalog stats (BUG API-04)
const statsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: { error: 'Demasiadas solicitudes a las estadísticas. Por favor intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/vehiculos/stats — Declarado arriba de rutas dinámicas (BUG LOGIC-02)
router.get('/stats', statsLimiter, async (req, res) => {
  try {
    const total = await Vehiculo.countDocuments();
    const brandsCount = (await Vehiculo.distinct('marca')).length;
    res.json({ total, brands: brandsCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos/brands
router.get('/brands', antiscaping, async (req, res) => {
  try {
    const brands = await Vehiculo.distinct('marca');
    res.json(brands.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos/models-autocomplete
router.get('/models-autocomplete', antiscaping, async (req, res) => {
  try {
    const list = await Vehiculo.aggregate([
      { $group: { _id: { marca: '$marca', modelo: '$modelo' } } },
      { $project: { _id: 0, text: { $concat: ['$_id.marca', ' ', '$_id.modelo'] } } }
    ]);
    const result = list.map(item => item.text).sort();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/vehiculos/brand/:marca
router.get('/brand/:marca', antiscaping, async (req, res) => {
  try {
    const { marca } = req.params;
    const vehiculos = await Vehiculo.find({ marca: { $regex: new RegExp(`^${escapeRegExp(marca)}$`, 'i') } });
    const enriched = await enrichVehiculosWithPrices(vehiculos);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos
router.get('/', antiscaping, async (req, res) => {
  try {
    const { marca, modelo, filterBrand, anio } = req.query;
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    
    const filter = {};
    
    if (marca) {
      if (page) {
        filter.marca = { $regex: new RegExp(escapeRegExp(marca), 'i') };
      } else {
        filter.marca = { $regex: new RegExp(`^${escapeRegExp(marca)}$`, 'i') };
      }
    }
    
    if (filterBrand && filterBrand !== 'all') {
      filter.marca = { $regex: new RegExp(`^${escapeRegExp(filterBrand)}$`, 'i') };
    }
    
    if (modelo) {
      if (page) {
        filter.modelo = { $regex: new RegExp(escapeRegExp(modelo), 'i') };
      } else {
        filter.modelo = { $regex: new RegExp(`^${escapeRegExp(modelo)}$`, 'i') };
      }
    }
    
    if (anio) {
      const a = parseInt(anio, 10);
      filter.anio_inicio = { $lte: a };
      filter.anio_fin = { $gte: a };
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      const totalCount = await Vehiculo.countDocuments(filter);
      const vehiculos = await Vehiculo.find(filter)
        .sort({ modelo: 1, anio_inicio: 1 })
        .skip(skip)
        .limit(limit);

      const enriched = await enrichVehiculosWithPrices(vehiculos);
      
      res.json({
        ok: true,
        vehiculos: enriched,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      });
    } else {
      const vehiculos = await Vehiculo.find(filter).sort({ modelo: 1, anio_inicio: 1 });
      const enriched = await enrichVehiculosWithPrices(vehiculos);
      res.json(enriched);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehiculos/seed
router.post('/seed', auth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Operación de seed deshabilitada en el entorno de producción.' });
  }

  try {
    const records = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Body must be a non-empty array of records' });
    }
    
    await Vehiculo.deleteMany({});
    
    // Enriquecer en el backend
    const enriched = records.map(r => {
      if (r.marca && r.marca.toLowerCase() === 'volkswagen') {
        return enrichVwKit(r);
      }
      if (r.marca && r.marca.toLowerCase() === 'chevrolet') {
        return enrichChevroletKit(r);
      }
      if (r.marca && r.marca.toLowerCase() === 'ford') {
        return enrichFordKit(r);
      }
      if (r.marca && r.marca.toLowerCase() === 'honda') {
        return enrichHondaKit(r);
      }
      if (r.marca && r.marca.toLowerCase() === 'toyota') {
        return enrichToyotaKit(r);
      }
      if (r.marca && r.marca.toLowerCase() === 'mazda') {
        return enrichMazdaKit(r);
      }
      return r;
    });

    const result = await Vehiculo.insertMany(enriched);
    res.json({ message: `Seeded ${result.length} vehicles successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/vehiculos/:id  — PROTEGIDO (JWT requerido)
 * Permite al administrador actualizar manualmente el kit_afinacion
 * y las referencias_alternas de un vehículo específico.
 *
 * Body puede contener:
 *   - kit_afinacion: { filtro_aceite, filtro_aire, filtro_gasolina, filtro_cabina }
 *   - referencias_alternas: { filtro_aceite_alterno, filtro_aire_alterno, ... }
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      marca, modelo, anio_inicio, anio_fin, motor, litros, cilindros_config, aspiracion,
      bujia_stock, bujia_iridium_ix, bujia_g_power, bujia_v_power, calibracion_mm,
      kit_afinacion, referencias_alternas
    } = req.body;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Se requiere al menos un campo a actualizar.'
      });
    }

    // Find the vehicle first to ensure it exists
    const vehiculo = await Vehiculo.findById(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }

    // Update standard fields
    if (marca !== undefined) vehiculo.marca = marca;
    if (modelo !== undefined) vehiculo.modelo = modelo;
    if (anio_inicio !== undefined) vehiculo.anio_inicio = Number(anio_inicio);
    if (anio_fin !== undefined) vehiculo.anio_fin = Number(anio_fin);
    if (motor !== undefined) vehiculo.motor = motor;
    if (litros !== undefined) vehiculo.litros = litros === '' || litros === null ? null : Number(litros);
    if (cilindros_config !== undefined) vehiculo.cilindros_config = cilindros_config;
    if (aspiracion !== undefined) vehiculo.aspiracion = aspiracion;
    if (calibracion_mm !== undefined) vehiculo.calibracion_mm = calibracion_mm === '' || calibracion_mm === null ? null : Number(calibracion_mm);

    // Spark plugs
    if (bujia_stock !== undefined) vehiculo.bujia_stock = bujia_stock;
    if (bujia_iridium_ix !== undefined) vehiculo.bujia_iridium_ix = bujia_iridium_ix;
    if (bujia_g_power !== undefined) vehiculo.bujia_g_power = bujia_g_power;
    if (bujia_v_power !== undefined) vehiculo.bujia_v_power = bujia_v_power;

    // Merge kit_afinacion field-by-field to preserve existing structure
    if (kit_afinacion) {
      const FILTRO_KEYS = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
      const currentKit = vehiculo.kit_afinacion || {};

      for (const key of FILTRO_KEYS) {
        if (kit_afinacion[key] !== undefined) {
          const incoming = kit_afinacion[key];
          const current  = currentKit[key] || {};

          if (incoming.alternos !== undefined && !Array.isArray(incoming.alternos)) {
            return res.status(400).json({ error: 'El campo alternos debe ser un arreglo.' });
          }

          // Build updated filtro preserving tipo field from original
          currentKit[key] = {
            tipo:    current.tipo    || incoming.tipo    || null,
            marca:   incoming.marca  !== undefined ? (incoming.marca  || null) : (current.marca  || null),
            sku:     incoming.sku    !== undefined ? (incoming.sku    || null) : (current.sku    || null),
            hasData: !!(incoming.sku || current.sku),
            alternos: incoming.alternos !== undefined ? incoming.alternos : (current.alternos || []),
          };
        }
      }

      vehiculo.kit_afinacion = currentKit;
      vehiculo.markModified('kit_afinacion');
    }

    // Merge referencias_alternas if provided
    if (referencias_alternas) {
      const whitelist = ['filtro_aire_joe', 'filtro_aceite_joe', 'filtro_gasolina_joe', 'filtro_cabina_joe'];
      const filteredAlternas = {};
      for (const key of whitelist) {
        if (referencias_alternas[key] !== undefined) {
          filteredAlternas[key] = referencias_alternas[key];
        }
      }
      vehiculo.referencias_alternas = {
        ...(vehiculo.referencias_alternas || {}),
        ...filteredAlternas,
      };
      vehiculo.markModified('referencias_alternas');
    }

    await vehiculo.save();

    // Enrich the updated vehicle to return the full calculated fields
    const enrichedList = await enrichVehiculosWithPrices([vehiculo]);
    const enrichedVehiculo = enrichedList[0];

    return res.json({
      ok: true,
      message: 'Vehículo actualizado correctamente.',
      vehiculo: enrichedVehiculo,
    });
  } catch (err) {
    console.error('Error updating vehiculo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehiculos — PROTEGIDO (JWT requerido)
// Crear un nuevo vehículo
router.post('/', auth, async (req, res) => {
  try {
    const {
      marca, modelo, anio_inicio, anio_fin, motor, litros, cilindros_config, aspiracion,
      bujia_stock, bujia_iridium_ix, bujia_g_power, bujia_v_power, calibracion_mm,
      kit_afinacion, referencias_alternas
    } = req.body;

    if (!marca || !modelo || anio_inicio === undefined || anio_fin === undefined) {
      return res.status(400).json({ error: 'Marca, modelo, anio_inicio y anio_fin son obligatorios.' });
    }

    const defaultFiltro = () => ({ tipo: null, marca: null, sku: null, hasData: false, alternos: [] });
    const finalKit = kit_afinacion || {
      filtro_aceite: defaultFiltro(),
      filtro_aire: defaultFiltro(),
      filtro_gasolina: defaultFiltro(),
      filtro_cabina: defaultFiltro()
    };

    const nuevoVehiculo = new Vehiculo({
      marca: marca.trim(),
      modelo: modelo.trim(),
      anio_inicio: Number(anio_inicio),
      anio_fin: Number(anio_fin),
      motor: motor ? motor.trim() : '',
      litros: litros === '' || litros === null || litros === undefined ? null : Number(litros),
      cilindros_config: cilindros_config ? cilindros_config.trim() : '',
      aspiracion: aspiracion ? aspiracion.trim() : '',
      calibracion_mm: calibracion_mm === '' || calibracion_mm === null || calibracion_mm === undefined ? null : Number(calibracion_mm),
      bujia_stock: bujia_stock || { tipo: '', codigo: '' },
      bujia_iridium_ix: bujia_iridium_ix || { tipo: '', codigo: '' },
      bujia_g_power: bujia_g_power || { tipo: '', codigo: '' },
      bujia_v_power: bujia_v_power || { tipo: '', codigo: '' },
      referencias_alternas: referencias_alternas || {},
      kit_afinacion: finalKit
    });

    await nuevoVehiculo.save();
    
    // Enrich before returning
    const enrichedList = await enrichVehiculosWithPrices([nuevoVehiculo]);
    const enrichedVehiculo = enrichedList[0];

    res.status(201).json({
      ok: true,
      message: 'Vehículo creado correctamente.',
      vehiculo: enrichedVehiculo
    });
  } catch (err) {
    console.error('Error creating vehiculo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vehiculos/:id — PROTEGIDO (JWT requerido)
// Eliminar un vehículo
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const vehiculo = await Vehiculo.findByIdAndDelete(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado.' });
    }
    res.json({ ok: true, message: 'Vehículo eliminado correctamente.' });
  } catch (err) {
    console.error('Error deleting vehiculo:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.syncVwFiltersInDatabase        = syncVwFiltersInDatabase;
router.syncChevroletFiltersInDatabase = syncChevroletFiltersInDatabase;
router.syncFordFiltersInDatabase      = syncFordFiltersInDatabase;
router.syncHondaFiltersInDatabase     = syncHondaFiltersInDatabase;
router.syncToyotaFiltersInDatabase    = syncToyotaFiltersInDatabase;
router.syncMazdaFiltersInDatabase     = syncMazdaFiltersInDatabase;
router.syncNissanAireJoe              = syncNissanAireJoe;
router.syncNissanUnifil             = syncNissanUnifil;
router.syncVolkswagenUnifil         = syncVolkswagenUnifil;
router.syncVWAireJoe                  = syncVWAireJoe;
router.syncChevroletAireJoe           = syncChevroletAireJoe;
router.syncFordAireJoe                = syncFordAireJoe;
router.syncHondaAireJoe               = syncHondaAireJoe;
router.syncToyotaAireJoe              = syncToyotaAireJoe;
router.syncMazdaAireJoe               = syncMazdaAireJoe;
router.invalidatePriceCache           = invalidatePriceCache;
module.exports = router;
