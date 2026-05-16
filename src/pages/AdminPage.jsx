import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Lock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { CATALOG }                        from '../lib/catalog';
import { ADMIN_PIN, ADMIN_PAGE_SIZE }      from '../lib/constants';
import { filtroTieneSkuReal, FILTRO_KEYS } from '../lib/kitDefaults';

const FULL_CATALOG = CATALOG;

// ── AdminPage ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate   = useNavigate();
  const [authed,   setAuthed]   = useState(false);
  const [pin,      setPin]      = useState('');
  const [pinError, setPinError] = useState('');

  const PAGE_SIZE = ADMIN_PAGE_SIZE;

  const [query,    setQuery]    = useState('');
  const [brand,    setBrand]    = useState('');
  const [page,     setPage]     = useState(1);

  // Prices: id → price string (local state only, no DB)
  const [prices, setPrices] = useState({});

  const brands = useMemo(() =>
    [...new Set(FULL_CATALOG.map(r => r.marca).filter(Boolean))].sort(),
  []);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return FULL_CATALOG.filter(r => {
      const matchBrand = !brand || r.marca === brand;
      const matchQ     = !q
        || r.modelo?.toLowerCase().includes(q)
        || r.motor?.toLowerCase().includes(q)
        || r.marca?.toLowerCase().includes(q)
        || String(r.anio_inicio).includes(q)
        // ─ Búsqueda por SKU de filtros ─
        || FILTRO_KEYS.some(k => {
          const sku = r.kit_afinacion?.[k]?.sku;
          return sku && sku.toLowerCase().includes(q);
        });
      return matchBrand && matchQ;
    });
  }, [query, brand]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [query, brand]);

  // ── CSV EXPORT ──
  const handleExportCSV = () => {
    // Definimos las cabeceras
    const headers = [
      'Marca', 'Modelo', 'Anio_Inicio', 'Anio_Fin', 'Motor', 'Litros', 'Cilindros',
      'Bujia_Stock', 'Bujia_Iridium', 'Calibracion_mm',
      'Filtro_Aceite', 'Filtro_Aire', 'Filtro_Gasolina', 'Filtro_Cabina'
    ];

    // Procesamos cada fila usando la misma lógica visual de la tabla
    const rows = filtered.map(r => {
      // Helper para extraer SKU o estado del filtro
      const getFilterText = (fKey) => {
        const f = r.kit_afinacion?.[fKey];
        if (filtroTieneSkuReal(f)) return `${f.marca ? f.marca + ' ' : ''}${f.sku}`;
        if (f?.hasData) return 'CONSULTAR';
        return '—';
      };

      return [
        r.marca || '',
        r.modelo || '',
        r.anio_inicio || '',
        r.anio_fin || '',
        r.motor || '',
        r.litros || '',
        r.cilindros_config || '',
        r.bujia_stock?.tipo || '',
        r.bujia_iridium_ix?.tipo || '',
        r.calibracion_mm || '',
        getFilterText('filtro_aceite'),
        getFilterText('filtro_aire'),
        getFilterText('filtro_gasolina'),
        getFilterText('filtro_cabina')
      ];
    });

    // Unimos todo en formato CSV (usamos comillas para evitar problemas con comas en texto)
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // BOM para que Excel detecte UTF-8 correctamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `afinacion_catalogo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── LOGIN ──
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthed(true);
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    }
  };

  if (!authed) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-login-logo">
            <img src="/logo.jpeg" alt="A+" style={{ height: '32px' }} />
            <span>Panel Administración</span>
          </div>
          <p className="admin-login-sub">+AFINACIÓN — Acceso restringido</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <label className="form-label" htmlFor="admin-pin">PIN de acceso</label>
            <input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="••••"
              className="form-input admin-pin-input"
              value={pin}
              onChange={e => setPin(e.target.value)}
              autoFocus
            />
            {pinError && <p className="admin-pin-error">{pinError}</p>}
            <button type="submit" className="btn-search admin-login-btn">
              Entrar
            </button>
          </form>
          <button
            className="admin-back-link"
            onClick={() => navigate('/')}
          >
            ← Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="admin-wrap">

      {/* Top bar */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/logo.jpeg" alt="A+" style={{ height: '24px' }} />
            Admin
          </span>
          <span className="admin-subtitle">Panel de Control — +AFINACIÓN</span>
        </div>
        <div className="admin-header-right">
          <span className="admin-stats-badge">{FULL_CATALOG.length} productos</span>
          <button
            className="admin-logout"
            onClick={() => { setAuthed(false); navigate('/'); }}
            aria-label="Cerrar sesión y volver al catálogo"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="admin-main">

        {/* Filters row */}
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <Search size={14} className="admin-search-icon" />
            <input
              type="text"
              className="form-input admin-search"
              placeholder="Buscar por marca, modelo, motor o año…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Buscar producto"
            />
          </div>
          <select
            className="form-select admin-brand-sel"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            aria-label="Filtrar por marca"
          >
            <option value="">Todas las marcas</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <span className="admin-count">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>

          <button
            className="admin-export-btn"
            onClick={handleExportCSV}
            title="Descargar catálogo filtrado a Excel (CSV)"
          >
            <Download size={14} /> Exportar
          </button>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table" aria-label="Catálogo de productos">
            <thead>
              <tr>
                <th>#</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Años</th>
                <th>Motor</th>
                <th>Litros</th>
                <th>Bujía Stock (SKU)</th>
                <th>Bujía Iridium</th>
                <th>Calibración</th>
                <th title="Filtro de Aceite">Filt. Aceite</th>
                <th title="Filtro de Aire">Filt. Aire</th>
                <th title="Filtro de Gasolina">Filt. Gas.</th>
                <th title="Filtro de Cabina">Filt. Cabina</th>
                <th>Precio (MXN)</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => {
                const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                return (
                  <tr key={r.id} className="admin-row">
                    <td className="admin-td-num">{rowNum}</td>
                    <td>
                      <span className={`admin-brand-tag brand-${r.marca?.toLowerCase()}`}>
                        {r.marca}
                      </span>
                    </td>
                    <td className="admin-td-model">{r.modelo}</td>
                    <td className="admin-td-years">{r.anio_inicio}–{r.anio_fin}</td>
                    <td className="admin-td-mono">{r.motor || '—'}</td>
                    <td className="admin-td-mono">{r.litros}L</td>
                    <td className="admin-td-sku">
                      {r.bujia_stock?.tipo
                        ? <span className="sku-pill">{r.bujia_stock.tipo}</span>
                        : <span className="sku-none">—</span>}
                    </td>
                    <td className="admin-td-sku">
                      {r.bujia_iridium_ix?.tipo
                        ? <span className="sku-pill sku-iridium">{r.bujia_iridium_ix.tipo}</span>
                        : <span className="sku-none">—</span>}
                    </td>
                    <td className="admin-td-mono">{r.calibracion_mm}mm</td>

                    {/* ── Filtros del Kit ── */}
                    {FILTRO_KEYS.map(fKey => {
                      const f        = r.kit_afinacion?.[fKey];
                      const tienesku = filtroTieneSkuReal(f);
                      return (
                        <td key={fKey} className="admin-td-sku">
                          {tienesku ? (
                            <span className="sku-pill admin-filtro-pill">
                              {f.marca && <span className="admin-filtro-marca">{f.marca} </span>}
                              {f.sku}
                            </span>
                          ) : f?.hasData ? (
                            <span className="admin-filtro-pending" title="Registro existe, falta SKU">
                              Consultar
                            </span>
                          ) : (
                            <span className="sku-none">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="admin-td-price">
                      <div className="price-wrap">
                        <span className="price-currency">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          placeholder="0.00"
                          className="price-input"
                          value={prices[r.id] ?? ''}
                          onChange={e => setPrices(prev => ({ ...prev, [r.id]: e.target.value }))}
                          aria-label={`Precio de ${r.marca} ${r.modelo}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination" aria-label="Paginación">
            <button
              className="admin-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="admin-page-info">
              Página {page} de {totalPages}
            </span>
            <button
              className="admin-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
