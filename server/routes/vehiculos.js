const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Vehiculo = require('../models/Vehiculo');

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
    const num = cxFull[1].length > 1 ? cxFull[1][0] : cxFull[1];
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

// GET /api/vehiculos/brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Vehiculo.distinct('marca');
    res.json(brands.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos/brand/:marca
router.get('/brand/:marca', async (req, res) => {
  try {
    const { marca } = req.params;
    const vehiculos = await Vehiculo.find({ marca: { $regex: new RegExp(`^${marca}$`, 'i') } });
    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos
router.get('/', async (req, res) => {
  try {
    const { marca, modelo, anio } = req.query;
    const filter = {};
    
    if (marca) filter.marca = { $regex: new RegExp(`^${marca}$`, 'i') };
    if (modelo) filter.modelo = { $regex: new RegExp(`^${modelo}$`, 'i') };
    if (anio) {
      const a = parseInt(anio, 10);
      filter.anio_inicio = { $lte: a };
      filter.anio_fin = { $gte: a };
    }

    const vehiculos = await Vehiculo.find(filter).sort({ modelo: 1, anio_inicio: 1 });
    res.json(vehiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await Vehiculo.countDocuments();
    const brandsCount = (await Vehiculo.distinct('marca')).length;
    res.json({ total, brands: brandsCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehiculos/seed
router.post('/seed', async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Body must be an array of records' });
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

router.syncVwFiltersInDatabase        = syncVwFiltersInDatabase;
router.syncChevroletFiltersInDatabase = syncChevroletFiltersInDatabase;
router.syncFordFiltersInDatabase      = syncFordFiltersInDatabase;
router.syncHondaFiltersInDatabase     = syncHondaFiltersInDatabase;
router.syncToyotaFiltersInDatabase    = syncToyotaFiltersInDatabase;
router.syncMazdaFiltersInDatabase     = syncMazdaFiltersInDatabase;
module.exports = router;
