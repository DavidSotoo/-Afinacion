import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchX, LayoutGrid, Package } from 'lucide-react';
import ProductCard from './ProductCard';
import KitCard     from './KitCard';

const LINE_CONFIG = {
  iridium: { field: 'bujia_iridium_ix' },
  platino: { field: 'bujia_g_power'    },
  vpower:  { field: 'bujia_v_power'    },
  stock:   { field: 'bujia_stock'      },
};

const FILTER_CHIPS = [
  { key: 'all',     label: 'Todas'      },
  { key: 'iridium', label: 'Iridium IX' },
  { key: 'platino', label: 'G-Power'    },
  { key: 'vpower',  label: 'V-Power'    },
  { key: 'stock',   label: 'Stock'      },
];

/**
 * ResultsGrid — filterable card grid with Kit / Pieza view toggle.
 *
 * View modes:
 *  'kits'   → one KitCard per bujia record (full tune-up dashboard)
 *  'piezas' → one ProductCard per NGK line (original behavior)
 */
export default function ResultsGrid({ results, activeFilter, onFilterChange, hasSearched, isLoading }) {
  const [viewMode, setViewMode] = useState('kits');

  /** Expand records into individual line cards (pieza mode).
   *  useMemo MUST be called before any conditional return. */
  const pieceCards = useMemo(() => {
    const cards = [];
    results.forEach(bujia => {
      const show = (key) => activeFilter === 'all' || activeFilter === key;
      Object.entries(LINE_CONFIG).forEach(([key, { field }]) => {
        if (show(key) && bujia[field]?.tipo)
          cards.push({ bujia, tipoLinea: key });
      });
    });
    return cards;
  }, [results, activeFilter]);

  if (isLoading) {
    return (
      <section id="results-container" className="results-section">
        <div className="results-header">
          <h2 className="results-title">Resultados</h2>
          <p className="results-count">Consultando base de datos...</p>
        </div>
        
        {/* Subtle green loading spinner and skeletons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem 1rem' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(98, 168, 29, 0.1)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          
          <div className="cards-grid" style={{ width: '100%', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="kit-card skeleton-card" style={{
                opacity: 0.6,
                border: '1px solid rgba(98, 168, 29, 0.1)',
                animation: 'pulse-glow 1.5s infinite ease-in-out',
                background: 'rgba(10, 10, 10, 0.7)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: '350px'
              }}>
                <div style={{ height: '3px', background: 'var(--primary)', opacity: 0.3, margin: '-1.5rem -1.5rem 0.5rem' }} />
                <div style={{ height: '20px', width: '40%', background: 'var(--bg-3)', borderRadius: '4px' }} />
                <div style={{ height: '32px', width: '80%', background: 'var(--bg-3)', borderRadius: '4px' }} />
                <div style={{ height: '14px', width: '60%', background: 'var(--bg-3)', borderRadius: '4px' }} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ height: '80px', flex: 1, background: 'var(--bg-3)', borderRadius: '4px' }} />
                  <div style={{ height: '80px', flex: 1, background: 'var(--bg-3)', borderRadius: '4px' }} />
                </div>
                <div style={{ height: '40px', width: '100%', background: 'var(--bg-3)', borderRadius: '4px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0% { opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </section>
    );
  }

  // Guard: nothing to render until user has searched
  if (!hasSearched) return null;

  const displayCount = viewMode === 'kits' ? results.length : pieceCards.length;

  return (
    <section
      id="results-container"
      className="results-section"
      aria-labelledby="results-heading"
    >
      {/* ── Header row ── */}
      <div className="results-header">
        <h2 className="results-title" id="results-heading">Resultados</h2>
        <p className="results-count" aria-live="polite" aria-atomic="true">
          {results.length === 0
            ? 'Sin resultados'
            : viewMode === 'kits'
              ? `${displayCount} kit${displayCount !== 1 ? 's' : ''} encontrado${displayCount !== 1 ? 's' : ''}`
              : `${displayCount} opción${displayCount !== 1 ? 'es' : ''} encontrada${displayCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {results.length > 0 && (
        <div className="results-controls">
          {/* View toggle — Kit vs Piezas */}
          <div className="view-toggle" role="group" aria-label="Modo de vista">
            <button
              className={`view-toggle-btn${viewMode === 'kits' ? ' active' : ''}`}
              onClick={() => setViewMode('kits')}
              aria-pressed={viewMode === 'kits'}
            >
              <Package size={14} aria-hidden="true" />
              Kit Completo
            </button>
            <button
              className={`view-toggle-btn${viewMode === 'piezas' ? ' active' : ''}`}
              onClick={() => setViewMode('piezas')}
              aria-pressed={viewMode === 'piezas'}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              Piezas
            </button>
          </div>

          {/* NGK line chips — only relevant in pieza mode */}
          {viewMode === 'piezas' && (
            <div className="results-filters" role="group" aria-label="Filtrar por línea NGK">
              {FILTER_CHIPS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-chip${activeFilter === key ? ' active' : ''}`}
                  onClick={() => onFilterChange(key)}
                  aria-pressed={activeFilter === key}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Grid or empty state ── */}
      <AnimatePresence mode="wait">
        {results.length === 0 ? (
          <motion.div 
            key="empty"
            className="empty-state" role="status"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <SearchX size={48} className="empty-icon" aria-hidden="true" />
            <p className="empty-title">Sin resultados</p>
            <p className="empty-sub">
              No encontramos bujías para esta combinación. Intenta con otro modelo o año.
            </p>
          </motion.div>
        ) : viewMode === 'kits' ? (
          /* ── Kit view ── */
          <motion.div 
            key="kits"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`cards-grid cards-grid--kit${results.length === 1 ? ' cards-grid--single' : ''}`}
          >
            <AnimatePresence mode="popLayout">
              {results.map(bujia => (
                <KitCard key={bujia.id} bujia={bujia} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ── Pieza view ── */
          <motion.div 
            key="piezas"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cards-grid"
          >
            <AnimatePresence mode="popLayout">
              {pieceCards.map(card => (
                <ProductCard
                  key={`${card.bujia.id}-${card.tipoLinea}`}
                  bujia={card.bujia}
                  tipoLinea={card.tipoLinea}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
