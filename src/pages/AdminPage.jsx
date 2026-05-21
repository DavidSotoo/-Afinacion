import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Lock, ChevronLeft, ChevronRight, Download, Database } from 'lucide-react';
import { loadFullCatalog } from '../lib/catalog';
import { ADMIN_PIN, ADMIN_PAGE_SIZE, STORE_ADMIN_EMAIL } from '../lib/constants';
import { filtroTieneSkuReal, FILTRO_KEYS } from '../lib/kitDefaults';

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
  const [fullCatalog, setFullCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Prices: id → price string (local state only, no DB)
  const [prices, setPrices] = useState({});

  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'cotizaciones'
  const [cotizaciones, setCotizaciones] = useState([]);
  const [isFetchingCotizaciones, setIsFetchingCotizaciones] = useState(false);

  const fetchCotizaciones = async () => {
    setIsFetchingCotizaciones(true);
    try {
      const res = await fetch('http://localhost:5000/api/cotizaciones');
      if (res.ok) {
        const data = await res.json();
        setCotizaciones(data);
      }
    } catch (err) {
      console.error('Error fetching cotizaciones:', err);
    } finally {
      setIsFetchingCotizaciones(false);
    }
  };

  useEffect(() => {
    if (authed && activeTab === 'cotizaciones') {
      fetchCotizaciones();
    }
  }, [authed, activeTab]);

  const handleUpdateEstatus = async (id, nuevoEstatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cotizaciones/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus: nuevoEstatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setCotizaciones(prev => prev.map(c => c._id === id ? updated : c));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteCotizacion = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta cotización del historial?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cotizaciones/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCotizaciones(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error('Error deleting cotizacion:', err);
    }
  };

  useEffect(() => {
    if (authed && fullCatalog.length === 0) {
      setIsLoading(true);
      loadFullCatalog().then(data => {
        setFullCatalog(data);
        setIsLoading(false);
      });
    }
  }, [authed]);

  const brands = useMemo(() =>
    [...new Set(fullCatalog.map(r => r.marca).filter(Boolean))].sort(),
  [fullCatalog]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return fullCatalog.filter(r => {
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
  }, [query, brand, fullCatalog]);

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

  // ── MONGODB SEEDING ──
  const handleSeedDatabase = async () => {
    if (!window.confirm(`Esto borrará la base de datos MongoDB actual y subirá los ${fullCatalog.length} registros en memoria. ¿Continuar?`)) return;
    setIsSeeding(true);
    try {
      const res = await fetch('http://localhost:5000/api/vehiculos/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullCatalog)
      });
      const data = await res.json();
      alert(data.message || 'Error: ' + data.error);
    } catch (err) {
      alert('Error de conexión con el servidor (¿Está encendido el Backend?): ' + err.message);
    }
    setIsSeeding(false);
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span className="admin-stats-badge">{fullCatalog.length} productos</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', maxWidth: '280px', textAlign: 'right' }}>
              Para asuntos de facturación, proveedores y finanzas, utilice la cuenta protegida: <a href={`mailto:${STORE_ADMIN_EMAIL}`} style={{ color: 'var(--primary)' }}>{STORE_ADMIN_EMAIL}</a>
            </span>
          </div>
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

        {/* Tabs de navegación */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`admin-tab-btn ${activeTab === 'catalogo' ? 'admin-tab-btn--active' : ''}`}
            style={{
              background: 'none', border: 'none', color: activeTab === 'catalogo' ? 'var(--primary)' : 'var(--text-3)',
              fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
              cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'catalogo' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s', outline: 'none'
            }}
          >
            📋 Catálogo de Productos
          </button>
          <button
            onClick={() => setActiveTab('cotizaciones')}
            className={`admin-tab-btn ${activeTab === 'cotizaciones' ? 'admin-tab-btn--active' : ''}`}
            style={{
              background: 'none', border: 'none', color: activeTab === 'cotizaciones' ? 'var(--primary)' : 'var(--text-3)',
              fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
              cursor: 'pointer', padding: '0.5rem 1rem', borderBottom: activeTab === 'cotizaciones' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s', outline: 'none'
            }}
          >
            ⚡ Cotizaciones Recientes
            {cotizaciones.filter(c => c.estatus === 'Pendiente').length > 0 && (
              <span style={{ marginLeft: '6px', background: '#ef4444', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', verticalAlign: 'middle' }}>
                {cotizaciones.filter(c => c.estatus === 'Pendiente').length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'cotizaciones' ? (
          <div className="admin-cotizaciones-section">
            {isFetchingCotizaciones ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
                Cargando historial de cotizaciones...
              </div>
            ) : cotizaciones.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '4px', background: 'var(--bg-2)' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.5rem' }}>No hay cotizaciones registradas</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Las cotizaciones que hagan los clientes en la web aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {cotizaciones.map((cot) => {
                  const fechaStr = new Date(cot.fecha).toLocaleString('es-MX', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <div
                      key={cot._id}
                      style={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '1.25rem',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}
                    >
                      {/* Cabecera de la cotización */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <span style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            marginRight: '1rem'
                          }}>
                            #{cot.folio}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                            {fechaStr}
                          </span>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: '0.35rem 0 0 0' }}>
                            {cot.vehiculo.marca} {cot.vehiculo.modelo} {cot.vehiculo.anios}
                          </h4>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-2)', margin: '0.2rem 0 0 0', fontFamily: 'var(--mono)' }}>
                            Motor: {cot.vehiculo.motor || '—'} · Cilindrada: {cot.vehiculo.litros}L · Cilindros: {cot.vehiculo.cilindros}
                          </p>
                        </div>

                        {/* Controles de estatus y eliminación */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            value={cot.estatus}
                            onChange={(e) => handleUpdateEstatus(cot._id, e.target.value)}
                            style={{
                              background: cot.estatus === 'Atendida' ? 'var(--primary-glow-sm)' : cot.estatus === 'Cancelada' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: cot.estatus === 'Atendida' ? 'var(--primary)' : cot.estatus === 'Cancelada' ? '#ef4444' : '#f59e0b',
                              border: `1px solid ${cot.estatus === 'Atendida' ? 'var(--border-primary)' : cot.estatus === 'Cancelada' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                              padding: '0.3rem 0.5rem',
                              borderRadius: '4px',
                              fontFamily: 'var(--mono)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="Pendiente" style={{ background: 'var(--bg-1)', color: '#f59e0b' }}>🟡 Pendiente</option>
                            <option value="Atendida" style={{ background: 'var(--bg-1)', color: 'var(--primary)' }}>🟢 Atendida</option>
                            <option value="Cancelada" style={{ background: 'var(--bg-1)', color: '#ef4444' }}>🔴 Cancelada</option>
                          </select>

                          <button
                            onClick={() => handleDeleteCotizacion(cot._id)}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              color: 'var(--text-3)',
                              padding: '0.3rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            title="Eliminar del historial"
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Lista de refacciones pedidas */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        {/* Bujías */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-1)', borderRadius: '4px', borderLeft: '3px solid var(--primary)' }}>
                          <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>1️⃣ Bujías</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cot.piezas.find(p => p.nombre === 'Bujías NGK')?.excluida ? 'var(--text-3)' : 'var(--text)', textDecoration: cot.piezas.find(p => p.nombre === 'Bujías NGK')?.excluida ? 'line-through' : 'none' }}>
                            {cot.tipoBujia}
                          </span>
                          {cot.bujiaSku && !cot.piezas.find(p => p.nombre === 'Bujías NGK')?.excluida && (
                            <span style={{ display: 'block', fontSize: '0.64rem', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>SKU: {cot.bujiaSku}</span>
                          )}
                        </div>

                        {/* Filtros */}
                        {cot.piezas.filter(p => p.nombre !== 'Bujías NGK').map((part, pIdx) => (
                          <div
                            key={part.nombre}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'var(--bg-1)',
                              borderRadius: '4px',
                              borderLeft: `3px solid ${part.excluida ? 'var(--text-3)' : '#38bdf8'}`,
                              opacity: part.excluida ? 0.6 : 1
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                              {['2️⃣','3️⃣','4️⃣','5️⃣'][pIdx] || '📋'} {part.nombre}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: part.excluida ? 'var(--text-3)' : 'var(--text)',
                              textDecoration: part.excluida ? 'line-through' : 'none'
                            }}>
                              {part.excluida ? 'Removido' : part.sku || 'Solicitado'}
                            </span>
                          </div>
                        ))}

                        {/* Aceite */}
                        {cot.aceite && cot.aceite.marca && (
                          <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-1)', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                            <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>6️⃣ Aceite de Motor</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                              {cot.aceite.marca} {cot.aceite.viscosidad}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.64rem', fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>
                              {cot.aceite.tecnologia} ({cot.aceite.presentacion})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
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
            {isLoading ? 'Cargando registros...' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
          </span>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="admin-export-btn"
              style={{ background: 'var(--primary)', color: '#000', borderColor: 'var(--primary)' }}
              onClick={handleSeedDatabase}
              title="Migrar catálogo estático a MongoDB"
              disabled={isLoading || isSeeding || fullCatalog.length === 0}
            >
              <Database size={14} /> {isSeeding ? 'Migrando...' : 'Migrar a MongoDB'}
            </button>

            <button
              className="admin-export-btn"
              onClick={handleExportCSV}
              title="Descargar catálogo filtrado a Excel (CSV)"
              disabled={isLoading || filtered.length === 0}
            >
              <Download size={14} /> Exportar
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
            Cargando la base de datos completa...
          </div>
        ) : (
        <>
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
                          {f?.sku === 'SELLADO' ? (
                            <span className="admin-filtro-pending" style={{ opacity: 0.6 }}>
                              Sellado (In-Tank)
                            </span>
                          ) : tienesku ? (
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
        </>
        )}
        </>
        )}

      </main>
    </div>
  );
}
