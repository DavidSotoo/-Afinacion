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
      .then(async res => {
        if (!res.ok) {
          if (res.status === 429) {
            const errData = await res.json();
            throw new Error(errData.error || 'Actividad inusual detectada.');
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

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="page" style={{ paddingTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '2rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
            Catálogo de Kits
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Selecciona tu vehículo para encontrar el kit exacto.</p>
        </div>
        <YMMSearch
          onSearch={handleSearch}
          onReset={handleReset}
        />
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
        <span className="footer-logo">
          <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" style={{ height: '24px' }} />
        </span>
        <span className="footer-copy">
          KITS EXACTOS PARA TU AUTO BY RAIO
          <br />
          <a href={`mailto:${STORE_PUBLIC_EMAIL}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9em', marginTop: '4px', display: 'inline-block' }}>
            {STORE_PUBLIC_EMAIL}
          </a>
        </span>
        <span className="footer-right">
          <span className="footer-tag">MX · Jalisco</span>
        </span>
      </footer>
    </>
  );
}

export default App;
