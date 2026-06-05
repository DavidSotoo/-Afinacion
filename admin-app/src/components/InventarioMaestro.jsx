import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Search, RotateCcw, Filter, AlertTriangle, Pencil, CheckCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import ModalEditarKit from './ModalEditarKit';

// ─── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

// ─── Helper: render a single filter sku cell ─────────────────────────────────
function FilterCell({ filtro }) {
  if (!filtro) return <span className="text-slate-700 text-xs">—</span>;

  if (filtro.sku === 'SELLADO') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Sellado
      </span>
    );
  }

  if (filtro.sku) {
    return (
      <div className="flex flex-col gap-0.5">
        {/* Winner */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-white bg-violet-950/60 border border-violet-800/50 px-1 rounded uppercase">
            {filtro.marca || '?'}
          </span>
          <span className="font-mono text-[11px] text-violet-300">{filtro.sku}</span>
        </div>
        {/* Alternos */}
        {filtro.alternos?.map((alt, i) => (
          <span key={i} className="text-[9px] text-slate-500 font-mono">
            Alt·{alt.marca}: {alt.sku}
          </span>
        ))}
      </div>
    );
  }

  return <span className="text-amber-600/70 text-[10px] font-mono">Verificando…</span>;
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-900/90 border border-emerald-500/30 text-emerald-300 text-sm px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-sm">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventarioMaestro() {
  const [vehiculos,    setVehiculos]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [searchMarca,  setSearchMarca]  = useState('');
  const [searchModelo, setSearchModelo] = useState('');
  const [filterBrand,  setFilterBrand]  = useState('all');
  const [brands,       setBrands]       = useState([]);
  const [page,         setPage]         = useState(1);

  // Modal & toast state
  const [editVehiculo, setEditVehiculo] = useState(null);
  const [toast,        setToast]        = useState('');

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiclesRes, brandsRes] = await Promise.all([
        api.get('/vehiculos'),
        api.get('/vehiculos/brands'),
      ]);
      setVehiculos(vehiclesRes.data || []);
      setBrands(brandsRes.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Error al cargar la base de datos de vehículos. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSearchMarca('');
    setSearchModelo('');
    setFilterBrand('all');
    setPage(1);
  };

  const filteredVehiculos = vehiculos.filter(v => {
    const matchMarca  = (v.marca  || '').toLowerCase().includes(searchMarca.toLowerCase());
    const matchModelo = (v.modelo || '').toLowerCase().includes(searchModelo.toLowerCase());
    const matchBrand  = filterBrand === 'all' || (v.marca || '').toLowerCase() === filterBrand.toLowerCase();
    return matchMarca && matchModelo && matchBrand;
  });

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredVehiculos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filteredVehiculos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = () => setPage(1);

  // ── Modal callbacks ────────────────────────────────────────────────────────
  const handleOpenEdit = (v) => setEditVehiculo(v);

  const handleSaved = useCallback((updatedVehiculo) => {
    // Merge the updated record back into state without full refetch
    setVehiculos(prev =>
      prev.map(v => (v._id === updatedVehiculo._id ? updatedVehiculo : v))
    );
    setEditVehiculo(null);
    setToast(`✅ ${updatedVehiculo.marca} ${updatedVehiculo.modelo} actualizado en Atlas.`);
  }, []);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Inventario Maestro</h1>
          <p className="text-slate-400 mt-1">Catálogo de vehículos con sus kits de filtros en cascada.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
            {filteredVehiculos.length} / {vehiculos.length} registros
          </span>
          <button
            onClick={fetchData}
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Recargar
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Search & Filter bar ──────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchMarca}
              onChange={e => { setSearchMarca(e.target.value); handleFilterChange(); }}
              placeholder="Buscar marca…"
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchModelo}
              onChange={e => { setSearchModelo(e.target.value); handleFilterChange(); }}
              placeholder="Buscar modelo…"
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={filterBrand}
              onChange={e => { setFilterBrand(e.target.value); handleFilterChange(); }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todas las Marcas</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Vehículo</th>
                <th className="py-3.5 px-3">Motor</th>
                <th className="py-3.5 px-3">Bujía NGK</th>
                <th className="py-3.5 px-3">F. Aceite</th>
                <th className="py-3.5 px-3">F. Aire</th>
                <th className="py-3.5 px-3">F. Gasolina</th>
                <th className="py-3.5 px-3">F. Cabina</th>
                <th className="py-3.5 px-3">Costo Kit</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-500 text-sm">
                    No se encontraron vehículos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                paginated.map(v => {
                  const oemBujias = !v.bujia_iridium_ix?.tipo && !v.bujia_g_power?.tipo
                    && !v.bujia_v_power?.tipo && !v.bujia_stock?.tipo;

                  return (
                    <tr key={v._id} className="hover:bg-slate-950/30 transition-colors group">
                      {/* Vehículo */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-sm">
                          {v.marca} {v.modelo}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {v.anio_inicio}–{v.anio_fin}
                        </div>
                      </td>

                      {/* Motor */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>{v.litros}L {v.cilindros_config}</div>
                        {v.motor && (
                          <div className="text-slate-500 text-[10px]">{v.motor}</div>
                        )}
                      </td>

                      {/* Bujía */}
                      <td className="py-3 px-3">
                        {oemBujias ? (
                          <span className="text-[11px] text-slate-600">OEM / Agencia</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {v.bujia_iridium_ix?.tipo && (
                              <div className="text-[11px]">
                                <span className="text-[9px] text-violet-400 font-bold">Iri</span>{' '}
                                <span className="font-mono">{v.bujia_iridium_ix.tipo}</span>
                              </div>
                            )}
                            {v.bujia_g_power?.tipo && (
                              <div className="text-[11px]">
                                <span className="text-[9px] text-sky-400 font-bold">Pla</span>{' '}
                                <span className="font-mono">{v.bujia_g_power.tipo}</span>
                              </div>
                            )}
                            {v.bujia_stock?.tipo && (
                              <div className="text-[11px]">
                                <span className="text-[9px] text-slate-400 font-bold">Std</span>{' '}
                                <span className="font-mono">{v.bujia_stock.tipo}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Filtros en cascada */}
                      <td className="py-3 px-3"><FilterCell filtro={v.kit_afinacion?.filtro_aceite} /></td>
                      <td className="py-3 px-3"><FilterCell filtro={v.kit_afinacion?.filtro_aire} /></td>
                      <td className="py-3 px-3"><FilterCell filtro={v.kit_afinacion?.filtro_gasolina} /></td>
                      <td className="py-3 px-3"><FilterCell filtro={v.kit_afinacion?.filtro_cabina} /></td>
                      
                      {/* Costo Kit */}
                      <td className="py-3 px-3">
                        {v.kit_afinacion?.costo_total ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-violet-950/40 text-violet-400 border border-violet-800/30 font-mono">
                            ${v.kit_afinacion.costo_total}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          title="Editar filtros de este vehículo"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-700 hover:border-violet-500/60 hover:text-violet-400 text-slate-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span className="font-mono text-xs">
            Página {currentPage} de {totalPages} · {filteredVehiculos.length} registros
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page number chips */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    p === currentPage
                      ? 'bg-violet-600 text-white border border-violet-500'
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editVehiculo && (
        <ModalEditarKit
          vehiculo={editVehiculo}
          onClose={() => setEditVehiculo(null)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
