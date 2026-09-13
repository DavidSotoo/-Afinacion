import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Search, RotateCcw, Filter, AlertTriangle, Pencil, CheckCircle2,
  ChevronLeft, ChevronRight, Plus, Trash2, Link2, X, Save, Loader2, Eye
} from 'lucide-react';
import ModalEditarVehiculo from './ModalEditarVehiculo';

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
  
  // Search inputs (immediate typing state)
  const [inputMarca,   setInputMarca]   = useState('');
  const [inputModelo,  setInputModelo]  = useState('');
  
  // Debounced search queries used for API calls
  const [searchMarca,  setSearchMarca]  = useState('');
  const [searchModelo, setSearchModelo] = useState('');
  
  const [filterBrand,  setFilterBrand]  = useState('all');
  const [brands,       setBrands]       = useState([]);
  
  // Pagination State
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  // Modal & toast state
  const [editVehiculo, setEditVehiculo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [toast,        setToast]        = useState('');

  // ── Debouncing Search Inputs ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchMarca(inputMarca);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputMarca]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchModelo(inputModelo);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputModelo]);

  // ── Load Unique Brands once on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsRes = await api.get('/vehiculos/brands');
        setBrands(brandsRes.data || []);
      } catch (err) {
        console.error('Error loading brand filter list:', err);
      }
    };
    fetchBrands();
  }, []);

  // ── Fetch paginated and filtered data from backend ────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehiculos', {
        params: {
          marca: searchMarca,
          modelo: searchModelo,
          filterBrand,
          page,
          limit: PAGE_SIZE
        }
      });
      setVehiculos(res.data.vehiculos || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
      setError('');
    } catch (err) {
      console.error('Error loading inventory:', err);
      setError('Error al cargar la base de datos de vehículos. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [searchMarca, searchModelo, filterBrand, page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setInputMarca('');
    setInputModelo('');
    setSearchMarca('');
    setSearchModelo('');
    setFilterBrand('all');
    setPage(1);
  };

  const handleFilterChange = () => setPage(1);

  // ── Modal callbacks ────────────────────────────────────────────────────────
  const handleOpenEdit = (v) => setEditVehiculo(v);

  const handleSaved = useCallback((savedVehiculo) => {
    fetchData(); // Reload current page
    setEditVehiculo(null);
    setShowCreateModal(false);
    setToast(`✅ ${savedVehiculo.marca} ${savedVehiculo.modelo} guardado en Atlas.`);
    
    setBrands(current => {
      if (!current.includes(savedVehiculo.marca)) {
        return [...current, savedVehiculo.marca].sort();
      }
      return current;
    });
  }, [fetchData]);

  const handleDeleteVehiculo = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el vehículo "${name}"?`)) return;
    try {
      await api.delete(`/vehiculos/${id}`);
      setToast(`🗑️ Vehículo "${name}" eliminado de Atlas.`);
      fetchData(); // Reload current page
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      setError('Error al eliminar el vehículo.');
    }
  };

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
            {totalCount} registros
          </span>
          <button
            onClick={fetchData}
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Recargar
          </button>
          <button
            onClick={() => setShowLinkModal(true)}
            title="Vincular un filtro/bujía a todos los vehículos que coincidan con marca, modelo y años"
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-400" />
            Vincular Filtro a Vehículos
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Vehículo
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
              value={inputMarca}
              onChange={e => setInputMarca(e.target.value)}
              placeholder="Buscar marca…"
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputModelo}
              onChange={e => setInputModelo(e.target.value)}
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
              {vehiculos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-500 text-sm">
                    No se encontraron vehículos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                vehiculos.map(v => {
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
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            title="Editar datos y filtros de este vehículo"
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-700 hover:border-violet-500/60 hover:text-violet-400 text-slate-400 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteVehiculo(v._id, `${v.marca} ${v.modelo}`)}
                             title="Eliminar este vehículo"
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-red-500/60 hover:text-red-400 text-slate-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
            Página {page} de {totalPages} · {totalCount} registros
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page number chips */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    p === page
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
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Edit & Create Modals ────────────────────────────────────────────── */}
      {editVehiculo && (
        <ModalEditarVehiculo
          vehiculo={editVehiculo}
          onClose={() => setEditVehiculo(null)}
          onSaved={handleSaved}
        />
      )}

      {showCreateModal && (
        <ModalEditarVehiculo
          onClose={() => setShowCreateModal(false)}
          onSaved={handleSaved}
        />
      )}

      {showLinkModal && (
        <ModalVincularFiltro
          brands={brands}
          onClose={() => setShowLinkModal(false)}
          onSuccess={(msg) => {
            setShowLinkModal(false);
            fetchData();
            setToast(`✅ ${msg}`);
          }}
        />
      )}

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}

// ─── SUB-COMPONENTE: VINCULAR UN FILTRO A MÚLTIPLES VEHÍCULOS ────────────────
const FILTRO_KEY_OPTIONS = [
  { value: 'filtro_aceite',   label: 'Filtro de Aceite' },
  { value: 'filtro_aire',     label: 'Filtro de Aire' },
  { value: 'filtro_gasolina', label: 'Filtro de Gasolina' },
  { value: 'filtro_cabina',   label: 'Filtro de Cabina' },
];
const MARCAS_FILTRO_SUGERIDAS = ['UNIFIL', 'INTERFIL', 'JOE', 'FRAM', 'GONHER', 'PURFLUX'];

function ModalVincularFiltro({ brands, onClose, onSuccess }) {
  const [marca, setMarca] = useState(brands[0] || '');
  const [modelo, setModelo] = useState('');
  const [anioInicio, setAnioInicio] = useState('');
  const [anioFin, setAnioFin] = useState('');
  const [filtroKey, setFiltroKey] = useState('filtro_aceite');
  const [filtroMarca, setFiltroMarca] = useState('UNIFIL');
  const [filtroSku, setFiltroSku] = useState('');

  const [preview, setPreview] = useState(null); // { matchedCount, sample } | null
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cualquier cambio en los criterios invalida la vista previa ya calculada
  const invalidatePreview = (setter) => (value) => {
    setPreview(null);
    setter(value);
  };

  const buildPayload = (dryRun) => ({
    marca,
    modelo: modelo.trim() || undefined,
    anioInicio: anioInicio || undefined,
    anioFin: anioFin || undefined,
    filtroKey,
    filtroMarca,
    filtroSku: filtroSku.trim(),
    dryRun,
  });

  const handlePreview = async () => {
    if (!marca || !filtroSku.trim()) {
      setErrorMsg('La marca del vehículo y el SKU del filtro son obligatorios.');
      return;
    }
    setChecking(true);
    setErrorMsg('');
    setPreview(null);
    try {
      const res = await api.post('/vehiculos/bulk-assign-filtro', buildPayload(true));
      setPreview(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al calcular la vista previa.');
    } finally {
      setChecking(false);
    }
  };

  const handleApply = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await api.post('/vehiculos/bulk-assign-filtro', buildPayload(false));
      if (res.data?.ok) {
        onSuccess(res.data.message);
      } else {
        setErrorMsg('Error al aplicar la vinculación.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al aplicar la vinculación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-white">Vincular Filtro a Vehículos</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Asigna una marca + SKU de filtro a <strong className="text-white">todos</strong> los vehículos que coincidan
            con los criterios de abajo, sin editarlos uno por uno. Modelo y años son opcionales.
          </p>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Marca del Vehículo <span className="text-red-500">*</span>
              </label>
              <select
                value={marca}
                onChange={e => invalidatePreview(setMarca)(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer appearance-none"
              >
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Modelo (opcional — deja vacío para toda la marca)
              </label>
              <input
                type="text"
                value={modelo}
                onChange={e => invalidatePreview(setModelo)(e.target.value)}
                placeholder="Ej: Corolla"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Año Desde (opcional)
              </label>
              <input
                type="number"
                value={anioInicio}
                onChange={e => invalidatePreview(setAnioInicio)(e.target.value)}
                placeholder="Ej: 2015"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Año Hasta (opcional)
              </label>
              <input
                type="number"
                value={anioFin}
                onChange={e => invalidatePreview(setAnioFin)(e.target.value)}
                placeholder="Ej: 2019"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-850 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tipo de Filtro <span className="text-red-500">*</span>
              </label>
              <select
                value={filtroKey}
                onChange={e => invalidatePreview(setFiltroKey)(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer appearance-none"
              >
                {FILTRO_KEY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Marca del Filtro
              </label>
              <select
                value={filtroMarca}
                onChange={e => invalidatePreview(setFiltroMarca)(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer appearance-none"
              >
                {MARCAS_FILTRO_SUGERIDAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={filtroSku}
                onChange={e => invalidatePreview(setFiltroSku)(e.target.value)}
                placeholder="Ej: FO-6607"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePreview}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{checking ? 'Buscando coincidencias...' : 'Ver Cuántos Vehículos Coinciden'}</span>
          </button>

          {preview && (
            <div className={`rounded-xl p-4 border text-xs space-y-2 ${
              preview.matchedCount > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <p className={`font-bold ${preview.matchedCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {preview.matchedCount} vehículo(s) coinciden con estos criterios.
              </p>
              {preview.sample?.length > 0 && (
                <ul className="text-slate-400 space-y-0.5">
                  {preview.sample.map(v => (
                    <li key={v._id}>• {v.marca} {v.modelo} ({v.anio_inicio}–{v.anio_fin})</li>
                  ))}
                  {preview.matchedCount > preview.sample.length && (
                    <li className="text-slate-600">... y {preview.matchedCount - preview.sample.length} más</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={saving || !preview || preview.matchedCount === 0}
            title={!preview ? 'Primero calcula la vista previa' : undefined}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Aplicando...' : preview ? `Vincular a ${preview.matchedCount} Vehículo(s)` : 'Vincular'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
