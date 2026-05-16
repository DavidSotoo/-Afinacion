import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';

export default function YMMSearch({ catalog, onSearch, onReset }) {
  const [marcas, setMarcas] = useState([]);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [modelos, setModelos] = useState([]);
  const [selectedModelo, setSelectedModelo] = useState('');
  const [anios, setAnios] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState('');
  const [selectedLinea, setSelectedLinea] = useState('');
  const resultsRef = React.useRef(null);

  // Extract unique brands from catalog
  useEffect(() => {
    const uniqueBrands = [...new Set(catalog.map(item => item.marca).filter(Boolean))].sort();
    setMarcas(uniqueBrands);
  }, [catalog]);

  // Filter models by selected brand — also clears stale results
  useEffect(() => {
    setModelos([]);
    setSelectedModelo('');
    setAnios([]);
    setSelectedAnio('');
    onReset();

    if (!selectedMarca) return;

    const filteredByBrand = catalog.filter(item => item.marca === selectedMarca);
    const uniqueModels = [...new Set(filteredByBrand.map(item => item.modelo))].sort();
    setModelos(uniqueModels);
  }, [selectedMarca, catalog]);

  // Update years when a model is selected
  useEffect(() => {
    if (!selectedModelo) {
      setAnios([]);
      setSelectedAnio('');
      return;
    }
    const matches = catalog.filter(
      item => item.marca === selectedMarca && item.modelo === selectedModelo
    );
    const yearsSet = new Set();
    matches.forEach(match => {
      for (let y = match.anio_inicio; y <= match.anio_fin; y++) {
        yearsSet.add(y);
      }
    });
    const yearsArray = [...yearsSet].sort((a, b) => b - a);
    setAnios(yearsArray);
    setSelectedAnio('');
  }, [selectedModelo, selectedMarca, catalog]);

  const handleSearch = () => {
    onSearch({
      marca: selectedMarca,
      modelo: selectedModelo,
      anio: selectedAnio ? parseInt(selectedAnio) : null,
      linea: selectedLinea,
    });

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
    : modelos.length === 0
    ? 'Cargando modelos...'
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
            >
              <option value="">— Seleccionar —</option>
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
              disabled={!selectedMarca}
              title={!selectedMarca ? 'Selecciona una marca para buscar' : undefined}
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
