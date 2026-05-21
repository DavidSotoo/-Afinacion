/**
 * lib/catalog.worker.js
 * ─────────────────────────────────────────────────────────────
 * Web Worker dedicado a descargar, parsear y enriquecer el catálogo.
 * Evita que el hilo principal se congele (jank) al procesar miles de objetos.
 * ─────────────────────────────────────────────────────────────
 */
import { computeKitAfinacion } from './kitDefaults';

// Mapeo de marcas a sus respectivos archivos JSON en /data/
const BRAND_FILES = {
  'Nissan': ['/data/nissan_bujias_ngk_2025.json'],
  'Volkswagen': ['/data/volkswagen_bujias_ngk_2025.json'],
  'Chevrolet': [
    '/data/chevrolet_bujias_ngk_2025_bloque_AC.json',
    '/data/chevrolet_bujias_ngk_2025_bloque_DM.json',
    '/data/chevrolet_bujias_ngk_2025_bloque_NZ.json'
  ],
  'Ford': ['/data/ford_bujias_651.json'],
  'Honda': ['/data/honda_bujias_924.json'],
  'Toyota': ['/data/toyota_bujias_ngk_2025.json'],
  'Mazda': ['/data/mazda_bujias_ngk_2025.json']
};

const memoryCache = new Map();

/**
 * Normaliza los registros enriqueciéndolos con el kit de afinación.
 */
function enrichData(records, marcaIdPrefix, fallbackMarca) {
  return records.map((r, i) => {
    const finalMarca = r.marca || fallbackMarca;
    return {
      ...r,
      id: `${marcaIdPrefix}-${r.id ?? i}`,
      marca: finalMarca,
      kit_afinacion: computeKitAfinacion({ ...r, marca: finalMarca }),
    };
  });
}

/**
 * Función interna para cargar una marca
 */
async function loadBrandDataInternal(marca) {
  if (!BRAND_FILES[marca]) return [];
  if (memoryCache.has(marca)) return memoryCache.get(marca);

  const urls = BRAND_FILES[marca];
  let allRecords = [];
  
  for (const url of urls) {
    try {
      // Al correr en un worker, fetch debe usar URLs absolutas relativas al origin
      // Vite resuelve el worker en la misma raíz, por lo que '/data/...' funciona si está servido desde el root.
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      
      const records = Array.isArray(data) ? data : (data.registros || []);
      const prefix = marca.toLowerCase().substring(0, 4);
      allRecords = allRecords.concat(enrichData(records, prefix, marca));
    } catch (e) {
      console.error(`[Worker] Fallo cargando ${url}:`, e);
    }
  }
  
  memoryCache.set(marca, allRecords);
  return allRecords;
}

// ── Recepción de mensajes desde el Main Thread ──
self.onmessage = async (e) => {
  const { type, payload, id } = e.data;
  
  try {
    if (type === 'LOAD_BRAND') {
      const records = await loadBrandDataInternal(payload.marca);
      self.postMessage({ id, success: true, data: records });
      
    } else if (type === 'LOAD_FULL_CATALOG') {
      const promises = Object.keys(BRAND_FILES).map(b => loadBrandDataInternal(b));
      const results = await Promise.all(promises);
      let all = [];
      results.forEach(r => { all = all.concat(r); });
      self.postMessage({ id, success: true, data: all });
      
    } else {
      throw new Error(`Comando desconocido: ${type}`);
    }
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message });
  }
};
