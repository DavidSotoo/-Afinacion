import React, { useState, useCallback, useEffect } from 'react';
import Header      from './components/Header';
import YMMSearch   from './components/YMMSearch';
import ResultsGrid from './components/ResultsGrid';
import StoreSection from './components/StoreSection';
import CartDrawer  from './components/CartDrawer';
import { STORE_PUBLIC_EMAIL } from './lib/constants';
import { API_BASE } from './lib/config';

/**
 * App — root component.
 *
 * Responsibilities:
 *  • Own the "search result" state (filteredResults, activeFilter, hasSearched)
 *  • Pass catalog data down to YMMSearch (read-only reference to module constant)
 *  • Delegate all cart state to CartContext (no prop drilling)
 *
 * Heavy lifting (catalog build + stats) lives in lib/catalog.js
 * and runs exactly ONCE at module-load time — not on every render.
 */
function App() {
  const [filteredResults, setFilteredResults] = useState([]);
  const [activeFilter,    setActiveFilter]    = useState('all');
  const [hasSearched,     setHasSearched]     = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [searchError,     setSearchError]     = useState(null);

  // Smooth scroll to store section if #tienda is in the URL hash
  useEffect(() => {
    if (window.location.hash === '#tienda') {
      setTimeout(() => {
        const storeSec = document.querySelector('.store-section');
        if (storeSec) {
          storeSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      // Clean up hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  /** Run catalog filter and update results state by fetching from backend API. */
  const handleSearch = useCallback((params) => {
    setIsLoadingResults(true);
    setHasSearched(true);
    setSearchError(null);

    const queryParams = new URLSearchParams();
    if (params.marca) queryParams.append('marca', params.marca);
    if (params.modelo) queryParams.append('modelo', params.modelo);
    if (params.anio) queryParams.append('anio', params.anio);

    fetch(`${API_BASE}/api/vehiculos?${queryParams.toString()}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 429) {
            return res.json().then(errData => {
              throw new Error(errData.error || 'Actividad inusual detectada.');
            });
          }
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        // Map _id to id to ensure compatibility with existing component code
        const mappedData = data.map(r => ({ ...r, id: r._id || r.id }));
        setFilteredResults(mappedData);
        setActiveFilter(params.linea || 'all');
        setIsLoadingResults(false);
        setSearchError(null);
      })
      .catch(err => {
        console.error("Error fetching filtered catalog:", err);
        setSearchError(err.message);
        setFilteredResults([]);
        setIsLoadingResults(false);
      });
  }, []);

  /** Clear results and reset UI to initial state. */
  const handleReset = useCallback(() => {
    setFilteredResults([]);
    setActiveFilter('all');
    setHasSearched(false);
    setIsLoadingResults(false);
    setSearchError(null);
  }, []);

  /** Switch the active NGK line filter chip without re-fetching. */
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  /** Scroll smoothly to store section. */
  const handleScrollToStore = useCallback((e) => {
    e.preventDefault();
    const storeSec = document.querySelector('.store-section');
    if (storeSec) {
      storeSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="page" style={{ paddingTop: 0 }}>
        {/* Cabecera Hero con Buscador */}
        <section className="hero-section">
          <div className="hero-grid-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">
              SISTEMA DE KITS DE AFINACIÓN EXACTOS
            </h1>
            <p className="hero-subtitle">
              Encuentra el kit de afinación exacto para tu vehículo en segundos con compatibilidad técnica 100% garantizada.
            </p>
            <YMMSearch
              onSearch={handleSearch}
              onReset={handleReset}
            />
            <div className="hero-features">
              <span className="hero-feature-pill">✓ NGK Oficial</span>
              <span className="hero-feature-pill">✓ Filtros Premium</span>
              <span className="hero-feature-pill">✓ Aceite Recomendado</span>
              <span className="hero-feature-pill">✓ Envío Seguro</span>
            </div>
          </div>
        </section>

        <ResultsGrid
          results={filteredResults}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          hasSearched={hasSearched}
          isLoading={isLoadingResults}
          error={searchError}
        />
      </main>

      <StoreSection />

      <footer className="site-footer" aria-label="Pie de página">
        <div className="footer-columns">
          {/* Columna 1: Brand & Trust */}
          <div className="footer-col">
            <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" className="footer-logo-img" />
            <p className="footer-about">
              Especialistas en kits de afinación automotriz exactos por marca, modelo y año. Tu auto en manos de expertos.
            </p>
            <div className="footer-payments">
              <span className="payment-badge">VISA</span>
              <span className="payment-badge">MC</span>
              <span className="payment-badge">MERCADOPAGO</span>
              <span className="payment-badge">SSL SECURE</span>
            </div>
          </div>
          
          {/* Columna 2: Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Enlaces Útiles</h4>
            <ul className="footer-links">
              <li><a href="/">Inicio</a></li>
              <li><a href="/catalogo">Catálogo de Kits</a></li>
              <li><a href="#contacto" onClick={handleScrollToStore}>Ubicación y Horarios</a></li>
            </ul>
          </div>
          
          {/* Columna 3: Contact & Warranty */}
          <div className="footer-col">
            <h4 className="footer-col-title">Contacto & Garantía</h4>
            <p className="footer-contact-info">
              Jalisco, México<br/>
              <a href={`mailto:${STORE_PUBLIC_EMAIL}`} className="footer-email-link">{STORE_PUBLIC_EMAIL}</a>
            </p>
            <div className="warranty-badge">
              🛡️ GARANTÍA DE AJUSTE EXACTO 100%
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} +AFINACIÓN · KITS EXACTOS PARA TU AUTO BY RAIO</p>
        </div>
      </footer>
    </>
  );
}

export default App;
