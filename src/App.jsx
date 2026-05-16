import React, { useState, useCallback } from 'react';
import Header      from './components/Header';
import Hero        from './components/Hero';
import YMMSearch   from './components/YMMSearch';
import ResultsGrid from './components/ResultsGrid';
import StoreSection from './components/StoreSection';
import CartDrawer  from './components/CartDrawer';
import { CATALOG, CATALOG_STATS, filterCatalog } from './lib/catalog';

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

  /** Run catalog filter and update results state. */
  const handleSearch = useCallback(({ marca, modelo, anio, linea }) => {
    const results = filterCatalog({ marca, modelo, anio });
    setFilteredResults(results);
    setActiveFilter(linea || 'all');
    setHasSearched(true);
  }, []); // filterCatalog is a pure module-level function — no deps needed

  /** Clear results and reset UI to initial state. */
  const handleReset = useCallback(() => {
    setFilteredResults([]);
    setActiveFilter('all');
    setHasSearched(false);
  }, []);

  /** Switch the active NGK line filter chip without re-fetching. */
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="page">
        <Hero
          totalRecords={CATALOG_STATS.total}
          uniqueModels={CATALOG_STATS.models}
          brands={CATALOG_STATS.brands}
        />
        <YMMSearch
          catalog={CATALOG}
          onSearch={handleSearch}
          onReset={handleReset}
        />
        <ResultsGrid
          results={filteredResults}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          hasSearched={hasSearched}
        />
      </main>

      <StoreSection />

      <footer className="site-footer" aria-label="Pie de página">
        <span className="footer-logo">
          <img src="/logo.jpeg" alt="A+ MÁS AFINACIÓN" style={{ height: '24px' }} />
        </span>
        <span className="footer-copy">KITS EXACTOS PARA TU AUTO BY RAIO</span>
        <span className="footer-right">
          <span className="footer-tag">MX · Jalisco</span>
          <a
            href="/admin"
            className="admin-link"
            aria-label="Acceso administración"
            title="Panel de administración"
          >
            ⚙
          </a>
        </span>
      </footer>
    </>
  );
}

export default App;
