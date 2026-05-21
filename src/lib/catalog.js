/**
 * lib/catalog.js
 * ─────────────────────────────────────────────────────────────
 * Módulo de catálogo que actúa como cliente RPC de un Web Worker.
 * ─────────────────────────────────────────────────────────────
 */
import CatalogWorker from './catalog.worker?worker';

export const SUPPORTED_BRANDS = ['Chevrolet', 'Ford', 'Honda', 'Mazda', 'Nissan', 'Toyota', 'Volkswagen'];

export const CATALOG_STATS = {
  total:  1277,
  models: 155,
  brands: 7,
};

// ── Interfaz RPC con el Web Worker ──
const worker = new CatalogWorker();
let messageIdCounter = 0;
const pendingRequests = new Map();

worker.onmessage = (e) => {
  const { id, success, data, error } = e.data;
  if (pendingRequests.has(id)) {
    const { resolve, reject } = pendingRequests.get(id);
    pendingRequests.delete(id);
    if (success) resolve(data);
    else reject(new Error(error));
  }
};

function runInWorker(type, payload = {}) {
  return new Promise((resolve, reject) => {
    const id = ++messageIdCounter;
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ type, payload, id });
  });
}

/**
 * Carga de forma asíncrona la base de datos de una marca delegando al Worker.
 */
export async function loadBrandData(marca) {
  return runInWorker('LOAD_BRAND', { marca });
}

/**
 * Carga TODAS las marcas en paralelo usando el Worker.
 */
export async function loadFullCatalog() {
  return runInWorker('LOAD_FULL_CATALOG');
}

/**
 * Filtra los registros dados por marca, modelo y año.
 * Operación tan ligera que se queda en el hilo principal.
 */
export function filterCatalog(records, { marca, modelo, anio }) {
  let results = records || [];
  if (marca)  results = results.filter(r => r.marca === marca);
  if (modelo) results = results.filter(r => r.modelo === modelo);
  if (anio)   results = results.filter(r => anio >= r.anio_inicio && anio <= r.anio_fin);
  return results;
}
