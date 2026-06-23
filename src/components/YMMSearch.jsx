import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { API_BASE } from '../lib/config';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutos en ms

function getCachedItem(key) {
  const itemStr = sessionStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    if (Date.now() - item.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch (e) {
    return null;
  }
}

function setCachedItem(key, data) {
  try {
    const item = { data, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.warn('Failed to set sessionStorage cache:', e);
  }
}

export default function YMMSearch({ onSearch, onReset }) {
  const [marcas, setMarcas] = useState([]);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [modelos, setModelos] = useState([]);
  const [selectedModelo, setSelectedModelo] = useState('');
  const [anios, setAnios] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');
  const [selectedLinea, setSelectedLinea] = useState('');
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [brandRecords, setBrandRecords] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [errorBrands, setErrorBrands] = useState(false);

  // Fetch unique brands on mount
  useEffect(() => {
    const cachedBrands = getCachedItem('ymm_brands');
    if (cachedBrands && cachedBrands.length > 0) {
      setMarcas(cachedBrands);
      return;
    }

    setLoadingBrands(true);
    setErrorBrands(false);
    fetch(`${API_BASE}/api/vehiculos/brands`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load brands');
        return res.json();
      })
      .then(data => {
        setMarcas(data);
        setCachedItem('ymm_brands', data);
        setLoadingBrands(false);
      })
      .catch(err => {
        console.error("Error loading brands:", err);
        setErrorBrands(true);
        setLoadingBrands(false);
      });
  }, []);

  // Filter models by selected brand — also clears stale results (BUG FE-H6)
  useEffect(() => {
    setModelos([]);
    setSelectedModelo('');
    setAnios([]);
    setSelectedAnio('');
    setBrandRecords([]);

    if (!selectedMarca) return;
    onReset();

    let active = true;
    
    // Check session storage cache first (BUG FE-M8)
    const cacheKey = `ymm_brand_${selectedMarca}`;
    const cachedBrandData = getCachedItem(cacheKey);
    if (cachedBrandData) {
      const mappedRecords = cachedBrandData.map(r => ({ ...r, id: r._id || r.id }));
      setBrandRecords(mappedRecords);
      const uniqueModels = [...new Set(mappedRecords.map(item => item.modelo))].sort();
      setModelos(uniqueModels);
      return;
    }

    setLoadingBrand(true);
    
    // Encode parameter (BUG FE-L8)
    fetch(`${API_BASE}/api/vehiculos/brand/${encodeURIComponent(selectedMarca)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load models');
        return res.json();
      })
      .then(records => {
        if (!active) return;
        setCachedItem(cacheKey, records);
        // Map _id to id for backwards compatibility
        const mappedRecords = records.map(r => ({ ...r, id: r._id || r.id }));
        setBrandRecords(mappedRecords);
        const uniqueModels = [...new Set(mappedRecords.map(item => item.modelo))].sort();
        setModelos(uniqueModels);
        setLoadingBrand(false);
      })
      .catch(err => {
        console.error("Error loading brand models:", err);
        if (active) setLoadingBrand(false);
      });

    return () => { active = false; };
  }, [selectedMarca, onReset]);

  // Update years when a model is selected (BUG FE-M9)
  useEffect(() => {
    if (!selectedModelo) {
      setAnios([]);
      setSelectedAnio('');
      return;
    }
    const matches = brandRecords.filter(item => item.modelo === selectedModelo);
    const yearsSet = new Set();
    matches.forEach(match => {
      const start = parseInt(match.anio_inicio, 10);
      const end = parseInt(match.anio_fin, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let y = start; y <= end; y++) {
          yearsSet.add(y);
        }
      }
    });
    const yearsArray = [...yearsSet].sort((a, b) => b - a);
    setAnios(yearsArray);
    setSelectedAnio('');
  }, [selectedModelo, brandRecords]);

  const handleSearch = () => {
    onSearch({
      marca: selectedMarca,
      modelo: selectedModelo,
      anio: selectedAnio ? parseInt(selectedAnio) : null,
      linea: selectedLinea,
    }, brandRecords);

    // Smooth scroll to results after React renders
    setTimeout(() => {
      const el = document.getElementById('results-container')
        ?? document.querySelector('.results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleReset = () => {
    setSelectedMarca('');
    setSelectedModelo('');
    setSelectedAnio('');
    setSelectedLinea('');
    onReset();
  };

  // Placeholder text for disabled selects
  const modeloPlaceholder = !selectedMarca
    ? '← Selecciona una marca'
    : loadingBrand
    ? 'Cargando modelos...'
    : modelos.length === 0
    ? 'Sin modelos'
    : '— Seleccionar —';

  const anioPlaceholder = !selectedModelo
    ? '← Selecciona un modelo'
    : '— Seleccionar —';

  return (
    <section className="ymm-section" aria-labelledby="ymm-heading">
      <p className="ymm-label" id="ymm-heading">// Buscar por Vehículo</p>

      <div className="ymm-card" role="search">
        <div className="ymm-grid ymm-grid--kit">

          {/* MARCA */}
          <div className="form-group">
            <label className="form-label" htmlFor="sel-marca">Marca</label>
            <select
              className="form-select"
              id="sel-marca"
              value={selectedMarca}
              onChange={(e) => setSelectedMarca(e.target.value)}
              disabled={loadingBrands}
            >
              <option value="">
                {loadingBrands 
                  ? 'Cargando marcas (iniciando servidor)...' 
                  : errorBrands 
                  ? 'Error al cargar marcas. Recarga la página.' 
                  : '— Seleccionar —'}
              </option>
              {marcas.map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* MODELO */}
          <div className="form-group">
            <label className="form-label" htmlFor="sel-modelo">Modelo</label>
            <select
              className={`form-select${!selectedMarca ? ' select-hint' : ''}`}
              id="sel-modelo"
              disabled={!selectedMarca}
              value={selectedModelo}
              onChange={(e) => setSelectedModelo(e.target.value)}
              title={!selectedMarca ? 'Selecciona primero una marca' : undefined}
            >
              <option value="">{modeloPlaceholder}</option>
              {modelos.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* AÑO */}
          <div className="form-group">
            <label className="form-label" htmlFor="sel-anio">Año</label>
            <select
              className={`form-select${!selectedModelo ? ' select-hint' : ''}`}
              id="sel-anio"
              disabled={!selectedModelo}
              value={selectedAnio}
              onChange={(e) => setSelectedAnio(e.target.value)}
              title={!selectedModelo ? 'Selecciona primero un modelo' : undefined}
            >
              <option value="">{anioPlaceholder}</option>
              {anios.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>


          {/* BUSCAR */}
          <div className="form-group btn-search-wrap">
            <label className="form-label" style={{ visibility: 'hidden' }} aria-hidden="true">Buscar</label>
            <button
              className="btn-search"
              id="btn-buscar"
              onClick={handleSearch}
              disabled={!selectedMarca || !selectedModelo}
              title={!selectedMarca || !selectedModelo ? 'Selecciona marca y modelo para buscar' : undefined}
              aria-label="Buscar vehículos"
            >
              <Search size={16} />
              BUSCAR
            </button>
          </div>

        </div>

        <button className="ymm-reset" onClick={handleReset} aria-label="Limpiar filtros">
          <RefreshCw size={12} /> Limpiar filtros
        </button>
      </div>
    </section>
  );
}
