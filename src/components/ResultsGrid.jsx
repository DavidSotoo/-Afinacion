import React, { useMemo, useState } from 'react';
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
export default function ResultsGrid({ results, activeFilter, onFilterChange, hasSearched }) {
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
      {results.length === 0 ? (
        <div className="empty-state" role="status">
          <SearchX size={48} className="empty-icon" aria-hidden="true" />
          <p className="empty-title">Sin resultados</p>
          <p className="empty-sub">
            No encontramos bujías para esta combinación. Intenta con otro modelo o año.
          </p>
        </div>
      ) : viewMode === 'kits' ? (
        /* ── Kit view ── */
        <div className={`cards-grid cards-grid--kit${results.length === 1 ? ' cards-grid--single' : ''}`}>
          {results.map(bujia => (
            <KitCard key={bujia.id} bujia={bujia} />
          ))}
        </div>
      ) : (
        /* ── Pieza view ── */
        <div className="cards-grid">
          {pieceCards.map(card => (
            <ProductCard
              key={`${card.bujia.id}-${card.tipoLinea}`}
              bujia={card.bujia}
              tipoLinea={card.tipoLinea}
            />
          ))}
        </div>
      )}
    </section>
  );
}
