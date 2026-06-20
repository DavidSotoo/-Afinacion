import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Search, Plus, Pencil, Trash2, X, Save, Loader2, CheckCircle2,
  AlertTriangle, ChevronLeft, ChevronRight, Percent, TrendingUp
} from 'lucide-react';

const PAGE_SIZE = 25;
const MARCAS_FILTROS_SUGERIDAS = ['UNIFIL', 'INTERFIL', 'JOE', 'FRAM', 'GONHER', 'PURFLUX'];

// ─── Componente Principal ───────────────────────────────────────────────────
export default function PanelCatalogos() {
  const [activeSubTab, setActiveSubTab] = useState('filtros'); // 'filtros' | 'balatas' | 'bujias'
  const [bulkAdjustType, setBulkAdjustType] = useState(null); // 'filtro' | 'bujia' | null
  
  // States para Filtros
  const [filtros, setFiltros] = useState([]);
  const [filtrosSearch, setFiltrosSearch] = useState('');
  const [filtrosPage, setFiltrosPage] = useState(1);
  
  // States para Bujías
  const [bujias, setBujias] = useState([]);
  const [bujiasSearch, setBujiasSearch] = useState('');
  const [bujiasPage, setBujiasPage] = useState(1);

  // States para Balatas
  const [balatas, setBalatas] = useState([]);
  const [balatasSearch, setBalatasSearch] = useState('');
  const [balatasPage, setBalatasPage] = useState(1);
  const [sugerenciasModelos, setSugerenciasModelos] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'filtro' | 'bujia' | 'balata'
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);

  // ─── Fetch de Datos ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [filtrosRes, bujiasRes, balatasRes, autocompleteRes] = await Promise.all([
        api.get('/filtros'),
        api.get('/bujias'),
        api.get('/balatas'),
        api.get('/vehiculos/models-autocomplete')
      ]);
      setFiltros(filtrosRes.data || []);
      setBujias(bujiasRes.data || []);
      setBalatas(balatasRes.data || []);
      setSugerenciasModelos(autocompleteRes.data || []);
      setError('');
    } catch (err) {
      console.error('Error loading catalogs:', err);
      setError('Error al cargar la base de datos de catálogos. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (active) {
        fetchData();
      }
    };
    load();
    return () => { active = false; };
  }, [fetchData]);

  // Mostrar Notificación Toast
  const showToastMsg = (msg) => {
    setToast(msg);
  };

  // ─── Handlers de Eliminación ────────────────────────────────────────────────
  const handleDeleteFiltro = async (id, clave, marca) => {
    const brandName = marca || 'UNIFIL';
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el filtro "${clave}" de la marca "${brandName}"?`)) return;
    try {
      await api.delete(`/filtros/${id}`);
      setFiltros(prev => prev.filter(f => f._id !== id));
      showToastMsg(`Filtro "${clave}" (${brandName}) eliminado correctamente.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar el filtro.');
    }
  };

  const handleDeleteBujia = async (id, sku) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la bujía con SKU "${sku}"?`)) return;
    try {
      await api.delete(`/bujias/${id}`);
      setBujias(prev => prev.filter(b => b._id !== id));
      showToastMsg(`Bujía "${sku}" eliminada correctamente.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar la bujía.');
    }
  };

  const handleDeleteBalata = async (id, sku_dynamic) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la balata con SKU Dynamic "${sku_dynamic}"?`)) return;
    try {
      await api.delete(`/balatas/${id}`);
      setBalatas(prev => prev.filter(b => b._id !== id));
      showToastMsg(`Balata "${sku_dynamic}" eliminada correctamente.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar la balata.');
    }
  };

  // ─── Filtrado y Paginación Local ───────────────────────────────────────────
  // Filtros (Buscando por clave, marca o descripción)
  const filteredFiltros = filtros.filter(f => 
    (f.clave || '').toLowerCase().includes(filtrosSearch.toLowerCase()) ||
    (f.marca || 'UNIFIL').toLowerCase().includes(filtrosSearch.toLowerCase()) ||
    (f.descripcion || '').toLowerCase().includes(filtrosSearch.toLowerCase())
  );
  const totalFiltrosPages = Math.max(1, Math.ceil(filteredFiltros.length / PAGE_SIZE));
  const currentFiltrosPage = Math.min(filtrosPage, totalFiltrosPages);
  const paginatedFiltros = filteredFiltros.slice((currentFiltrosPage - 1) * PAGE_SIZE, currentFiltrosPage * PAGE_SIZE);

  // Bujías
  const filteredBujias = bujias.filter(b => 
    (b.sku || '').toLowerCase().includes(bujiasSearch.toLowerCase()) ||
    (b.descripcion || '').toLowerCase().includes(bujiasSearch.toLowerCase())
  );
  const totalBujiasPages = Math.max(1, Math.ceil(filteredBujias.length / PAGE_SIZE));
  const currentBujiasPage = Math.min(bujiasPage, totalBujiasPages);
  const paginatedBujias = filteredBujias.slice((currentBujiasPage - 1) * PAGE_SIZE, currentBujiasPage * PAGE_SIZE);

  // Balatas
  const filteredBalatas = balatas.filter(b => 
    (b.sku_dynamic || '').toLowerCase().includes(balatasSearch.toLowerCase()) ||
    (b.sku_equivalente_wagner || '').toLowerCase().includes(balatasSearch.toLowerCase()) ||
    (b.fmsi || '').toLowerCase().includes(balatasSearch.toLowerCase()) ||
    (b.marca || '').toLowerCase().includes(balatasSearch.toLowerCase())
  );
  const totalBalatasPages = Math.max(1, Math.ceil(filteredBalatas.length / PAGE_SIZE));
  const currentBalatasPage = Math.min(balatasPage, totalBalatasPages);
  const paginatedBalatas = filteredBalatas.slice((currentBalatasPage - 1) * PAGE_SIZE, currentBalatasPage * PAGE_SIZE);

  const handleOpenCreate = (type) => {
    setModalType(type);
    setModalMode('create');
    setEditingItem(null);
  };

  const handleOpenEdit = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setEditingItem(item);
  };

  const handleModalSaveSuccess = (type, savedItem) => {
    if (type === 'filtro') {
      if (modalMode === 'create') {
        setFiltros(prev => [...prev, savedItem].sort((a,b) => {
          const mMatch = (a.marca || 'UNIFIL').localeCompare(b.marca || 'UNIFIL');
          if (mMatch !== 0) return mMatch;
          return a.clave.localeCompare(b.clave);
        }));
      } else {
        setFiltros(prev => prev.map(f => f._id === savedItem._id ? savedItem : f));
      }
      showToastMsg(`Filtro guardado en Atlas correctamente.`);
    } else if (type === 'bujia') {
      if (modalMode === 'create') {
        setBujias(prev => [...prev, savedItem].sort((a,b) => a.sku.localeCompare(b.sku)));
      } else {
        setBujias(prev => prev.map(b => b._id === savedItem._id ? savedItem : b));
      }
      showToastMsg(`Bujía guardada en Atlas correctamente.`);
    } else if (type === 'balata') {
      if (modalMode === 'create') {
        setBalatas(prev => [...prev, savedItem].sort((a,b) => a.sku_dynamic.localeCompare(b.sku_dynamic)));
      } else {
        setBalatas(prev => prev.map(b => b._id === savedItem._id ? savedItem : b));
      }
      showToastMsg(`Balata guardada en Atlas correctamente.`);
    }
    setModalType(null);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Administración de Catálogos</h1>
          <p className="text-slate-400 mt-1">Gestione precios, referencias y compatibilidades de productos.</p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          Recargar Catálogos
        </button>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navegación Secundaria (Sub-tabs) */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveSubTab('filtros')}
          className={`pb-4 transition-all cursor-pointer relative ${
            activeSubTab === 'filtros' ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Filtros
          {activeSubTab === 'filtros' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('balatas')}
          className={`pb-4 transition-all cursor-pointer relative ${
            activeSubTab === 'balatas' ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Balatas (Brake Pads)
          {activeSubTab === 'balatas' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('bujias')}
          className={`pb-4 transition-all cursor-pointer relative ${
            activeSubTab === 'bujias' ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Bujías (Spark Plugs)
          {activeSubTab === 'bujias' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ─── VISTA: FILTROS ───────────────────────────────────────────────────── */}
      {activeSubTab === 'filtros' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtrosSearch}
                onChange={e => { setFiltrosSearch(e.target.value); setFiltrosPage(1); }}
                placeholder="Buscar por clave, marca o descripción..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAdjustType('filtro')}
                title="Ajustar todos los precios de una marca mediante un porcentaje"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Percent className="w-4 h-4 text-violet-400" />
                Ajustar Precios
              </button>
              <button
                onClick={() => handleOpenCreate('filtro')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar Filtro
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-3.5 px-6">Marca</th>
                    <th className="py-3.5 px-6">Clave / SKU</th>
                    <th className="py-3.5 px-6">Descripción</th>
                    <th className="py-3.5 px-6">Precio Cliente</th>
                    <th className="py-3.5 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {paginatedFiltros.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-500 text-sm">
                        No se encontraron filtros en el catálogo.
                      </td>
                    </tr>
                  ) : (
                    paginatedFiltros.map(f => (
                      <tr key={f._id} className="hover:bg-slate-950/20 transition-colors group">
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-violet-950/60 border border-violet-850 text-violet-400 uppercase">
                            {f.marca || 'UNIFIL'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-200">{f.clave}</td>
                        <td className="py-3.5 px-6 text-slate-300">{f.descripcion || '—'}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-white">${f.precio.toFixed(2)}</td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit('filtro', f)}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFiltro(f._id, f.clave, f.marca)}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalFiltrosPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-400 pt-2">
              <span className="font-mono text-xs">
                Página {currentFiltrosPage} de {totalFiltrosPages} · {filteredFiltros.length} registros
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFiltrosPage(p => Math.max(1, p - 1))}
                  disabled={currentFiltrosPage === 1}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFiltrosPage(p => Math.min(totalFiltrosPages, p + 1))}
                  disabled={currentFiltrosPage === totalFiltrosPages}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── VISTA: BALATAS ─────────────────────────────────────────────────── */}
      {activeSubTab === 'balatas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={balatasSearch}
                onChange={e => { setBalatasSearch(e.target.value); setBalatasPage(1); }}
                placeholder="Buscar por SKU, FMSI, marca..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => handleOpenCreate('balata')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar Balata
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-3.5 px-6">SKU Dynamic</th>
                    <th className="py-3.5 px-4">Marca / Eq. Wagner</th>
                    <th className="py-3.5 px-4">Posición / FMSI</th>
                    <th className="py-3.5 px-6">Compatibilidades</th>
                    <th className="py-3.5 px-4">Precio Cliente</th>
                    <th className="py-3.5 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {paginatedBalatas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-500 text-sm">
                        No se encontraron balatas en el catálogo.
                      </td>
                    </tr>
                  ) : (
                    paginatedBalatas.map(b => (
                      <tr key={b._id} className="hover:bg-slate-950/20 transition-colors group align-top">
                        <td className="py-4 px-6 font-mono font-bold text-violet-400">{b.sku_dynamic}</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white">{b.marca}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">Eq: {b.sku_equivalente_wagner}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.posicion === 'Delantero' ? 'bg-amber-950/60 border border-amber-800/40 text-amber-400' : 'bg-blue-950/60 border border-blue-800/40 text-blue-400'
                          }`}>
                            {b.posicion}
                          </span>
                          <div className="text-xs text-slate-500 font-mono mt-1">FMSI: {b.fmsi}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {b.vehiculos_compatibles?.slice(0, 4).map((c, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800/80 text-slate-400">
                                {c.modelo} ({c.anio_inicio}-{c.anio_fin})
                                {c.especificaciones && <span className="text-slate-500"> · {c.especificaciones}</span>}
                              </span>
                            ))}
                            {b.vehiculos_compatibles?.length > 4 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-950/40 border border-violet-800/20 text-violet-400 font-bold">
                                +{b.vehiculos_compatibles.length - 4} más
                              </span>
                            )}
                            {(!b.vehiculos_compatibles || b.vehiculos_compatibles.length === 0) && (
                              <span className="text-xs text-slate-600 italic">Sin compatibilidades</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-white">
                          ${(b.precio || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit('balata', b)}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBalata(b._id, b.sku_dynamic)}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalBalatasPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-400 pt-2">
              <span className="font-mono text-xs">
                Página {currentBalatasPage} de {totalBalatasPages} · {filteredBalatas.length} registros
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBalatasPage(p => Math.max(1, p - 1))}
                  disabled={currentBalatasPage === 1}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setBalatasPage(p => Math.min(totalBalatasPages, p + 1))}
                  disabled={currentBalatasPage === totalBalatasPages}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── VISTA: BUJÍAS ───────────────────────────────────────────────────── */}
      {activeSubTab === 'bujias' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bujiasSearch}
                onChange={e => { setBujiasSearch(e.target.value); setBujiasPage(1); }}
                placeholder="Buscar por SKU o descripción..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAdjustType('bujia')}
                title="Ajustar todos los precios de bujías mediante un porcentaje"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Percent className="w-4 h-4 text-violet-400" />
                Ajustar Precios
              </button>
              <button
                onClick={() => handleOpenCreate('bujia')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar Bujía
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-3.5 px-6">SKU (NGK u otra)</th>
                    <th className="py-3.5 px-6">Descripción</th>
                    <th className="py-3.5 px-6">Precio Cliente</th>
                    <th className="py-3.5 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {paginatedBujias.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-10 text-slate-500 text-sm">
                        No se encontraron bujías en el catálogo.
                      </td>
                    </tr>
                  ) : (
                    paginatedBujias.map(b => (
                      <tr key={b._id} className="hover:bg-slate-950/20 transition-colors group">
                        <td className="py-3.5 px-6 font-mono font-bold text-violet-400">{b.sku}</td>
                        <td className="py-3.5 px-6 text-slate-300">{b.descripcion || '—'}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-white">${b.precio_cliente.toFixed(2)}</td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEdit('bujia', b)}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-slate-400 hover:text-violet-400 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBujia(b._id, b.sku)}
                              className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalBujiasPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-400 pt-2">
              <span className="font-mono text-xs">
                Página {currentBujiasPage} de {totalBujiasPages} · {filteredBujias.length} registros
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBujiasPage(p => Math.max(1, p - 1))}
                  disabled={currentBujiasPage === 1}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setBujiasPage(p => Math.min(totalBujiasPages, p + 1))}
                  disabled={currentBujiasPage === totalBujiasPages}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast de Éxito */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-900/90 border border-emerald-500/30 text-emerald-300 text-sm px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ─── MODAL CRUD: FILTROS Y BUJÍAS ────────────────────────────────────── */}
      {(modalType === 'filtro' || modalType === 'bujia') && (
        <ModalFiltroBujia
          key={editingItem?._id || 'new'}
          type={modalType}
          mode={modalMode}
          item={editingItem}
          onClose={() => setModalType(null)}
          onSuccess={(saved) => handleModalSaveSuccess(modalType, saved)}
        />
      )}

      {/* ─── MODAL CRUD: BALATAS ─────────────────────────────────────────────── */}
      {modalType === 'balata' && (
        <ModalBalata
          key={editingItem?._id || 'new'}
          mode={modalMode}
          item={editingItem}
          sugerenciasModelos={sugerenciasModelos}
          onClose={() => setModalType(null)}
          onSuccess={(saved) => handleModalSaveSuccess('balata', saved)}
        />
      )}

      {/* ─── MODAL AJUSTE MASIVO ──────────────────────────────────────────────── */}
      {bulkAdjustType && (
        <ModalAjusteMasivo
          type={bulkAdjustType}
          onClose={() => setBulkAdjustType(null)}
          onSuccess={(msg) => {
            setBulkAdjustType(null);
            fetchData();
            showToastMsg(msg);
          }}
        />
      )}
    </div>
  );
}

// ─── SUB-COMPONENTE: MODAL PARA AJUSTE DE PRECIOS EN BLOQUE ──────────────────
function ModalAjusteMasivo({ type, onClose, onSuccess }) {
  const [marca, setMarca] = useState('UNIFIL');
  const [porcentaje, setPorcentaje] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isFiltro = type === 'filtro';

  const handleApply = async (e) => {
    e.preventDefault();
    if (!porcentaje.trim() || isNaN(porcentaje)) {
      setErrorMsg('Por favor ingresa un porcentaje numérico válido.');
      return;
    }
    if (confirmText.toUpperCase() !== 'AJUSTAR') {
      setErrorMsg('Debes escribir "AJUSTAR" para confirmar la operación.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        porcentaje: Number(porcentaje)
      };
      if (isFiltro) {
        payload.marca = marca;
      }

      const url = isFiltro ? '/filtros/bulk-adjust' : '/bujias/bulk-adjust';
      const res = await api.post(url, payload);

      if (res.data?.ok) {
        const count = res.data.modifiedCount;
        onSuccess(
          isFiltro
            ? `Se actualizaron los precios de ${count} filtros de la marca ${marca}.`
            : `Se actualizaron los precios de ${count} bujías en el catálogo.`
        );
      } else {
        setErrorMsg('Error al procesar el ajuste masivo.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-white">
              Ajuste de Precios en Bloque
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleApply} className="p-5 space-y-4">
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-xs text-amber-400 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              ¡ATENCIÓN: OPERACIÓN PERMANENTE!
            </div>
            <p className="text-slate-400">
              Esta acción modificará los precios de todos los productos seleccionados directamente en MongoDB Atlas.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isFiltro && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Marca de Filtros a Ajustar
              </label>
              <select
                value={marca}
                onChange={e => setMarca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none cursor-pointer appearance-none"
              >
                {MARCAS_FILTROS_SUGERIDAS.map(m => m && <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Porcentaje de Ajuste (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={porcentaje}
                onChange={e => setPorcentaje(e.target.value)}
                placeholder="Ej: 5 para +5%, -3 para -3%"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none font-mono pr-8"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Usa números positivos para incrementar y negativos para decrementar costos.
            </p>
          </div>

          <div className="border-t border-slate-800/60 pt-3 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Escribe <span className="font-mono text-amber-400">"AJUSTAR"</span> para confirmar
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Confirmación"
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none uppercase font-semibold"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || confirmText.toUpperCase() !== 'AJUSTAR'}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Aplicar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTE: MODAL PARA FILTROS / BUJÍAS ─────────────────────────────
function ModalFiltroBujia({ type, mode, item, onClose, onSuccess }) {
  const [keyOrSku, setKeyOrSku] = useState(item ? (type === 'filtro' ? item.clave : item.sku) : '');
  const [descripcion, setDescripcion] = useState(item?.descripcion || '');
  const [precio, setPrecio] = useState(item ? String(type === 'filtro' ? item.precio : item.precio_cliente) : '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Brand States for filters
  const [marca, setMarca] = useState(() => {
    if (type !== 'filtro') return '';
    const initialMarcaIsCustom = item && !MARCAS_FILTROS_SUGERIDAS.includes(item.marca || 'UNIFIL');
    return initialMarcaIsCustom ? 'OTRA' : (item?.marca || 'UNIFIL');
  });
  const [customMarca, setCustomMarca] = useState(() => {
    if (type !== 'filtro') return '';
    const initialMarcaIsCustom = item && !MARCAS_FILTROS_SUGERIDAS.includes(item.marca || 'UNIFIL');
    return initialMarcaIsCustom ? (item?.marca || '') : '';
  });
  const [showCustomMarca, setShowCustomMarca] = useState(() => {
    if (type !== 'filtro') return false;
    return item ? !MARCAS_FILTROS_SUGERIDAS.includes(item.marca || 'UNIFIL') : false;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!keyOrSku.trim() || !precio.trim()) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        descripcion: descripcion.trim(),
      };

      if (type === 'filtro') {
        payload.clave = keyOrSku.trim().toUpperCase();
        payload.precio = Number(precio);
        const finalMarca = marca === 'OTRA' ? customMarca.trim().toUpperCase() : marca;
        if (!finalMarca) {
          setErrorMsg('La marca del filtro es obligatoria.');
          setSaving(false);
          return;
        }
        payload.marca = finalMarca;
      } else {
        payload.sku = keyOrSku.trim().toUpperCase();
        payload.precio_cliente = Number(precio);
      }

      let res;
      if (mode === 'create') {
        res = await api.post(type === 'filtro' ? '/filtros' : '/bujias', payload);
      } else {
        res = await api.put(type === 'filtro' ? `/filtros/${item._id}` : `/bujias/${item._id}`, payload);
      }

      if (res.data?.ok) {
        onSuccess(type === 'filtro' ? res.data.filtro : res.data.bujia);
      } else {
        setErrorMsg('Error al guardar el registro.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-violet-700" />
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {mode === 'create' ? 'Agregar' : 'Editar'} {type === 'filtro' ? 'Filtro' : 'Bujía'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {type === 'filtro' && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Marca de Filtro <span className="text-red-500">*</span>
                </label>
                <select
                  value={marca}
                  onChange={e => {
                    const val = e.target.value;
                    setMarca(val);
                    setShowCustomMarca(val === 'OTRA');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none cursor-pointer appearance-none"
                >
                  {MARCAS_FILTROS_SUGERIDAS.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="OTRA">Otra marca...</option>
                </select>
              </div>

              {showCustomMarca && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Especifique la Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={customMarca}
                    onChange={e => setCustomMarca(e.target.value)}
                    placeholder="Ej: SAKURA"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none uppercase"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {type === 'filtro' ? 'Clave de Filtro' : 'SKU Bujía'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={keyOrSku}
              onChange={e => setKeyOrSku(e.target.value)}
              placeholder={type === 'filtro' ? 'Ej: FO-6607' : 'Ej: BKR5EYA-11'}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder={type === 'filtro' ? 'Filtro de Aceite Jetta/Golf' : 'Bujía Estándar para Aveo'}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Precio {type === 'filtro' ? 'Costo de Filtro' : 'Cliente (Final NGK)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3.5 py-2 text-sm text-slate-200 outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTE: MODAL PARA BALATAS ──────────────────────────────────────
function ModalBalata({ mode, item, sugerenciasModelos = [], onClose, onSuccess }) {
  const [marca, setMarca] = useState(item?.marca || 'Dynamic');
  const [skuDynamic, setSkuDynamic] = useState(item?.sku_dynamic || '');
  const [skuWagner, setSkuWagner] = useState(item?.sku_equivalente_wagner || '');
  const [fmsi, setFmsi] = useState(item?.fmsi || '');
  const [posicion, setPosicion] = useState(item?.posicion || 'Delantero');
  const [precio, setPrecio] = useState(item?.precio ? String(item.precio) : '');
  const [compatibles, setCompatibles] = useState(item?.vehiculos_compatibles || []);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Manejar adición de fila de compatibilidad
  const handleAddCompatibleRow = () => {
    setCompatibles(prev => [...prev, { modelo: '', anio_inicio: '', anio_fin: '', especificaciones: '' }]);
  };

  // Manejar remoción de fila de compatibilidad
  const handleRemoveCompatibleRow = (index) => {
    setCompatibles(prev => prev.filter((_, i) => i !== index));
  };

  // Cambiar datos dentro de fila de compatibilidad
  const handleCompatibleRowChange = (index, field, value) => {
    setCompatibles(prev => prev.map((c, i) => {
      if (i === index) {
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!skuDynamic.trim() || !skuWagner.trim() || !fmsi.trim()) {
      setErrorMsg('Por favor completa los campos SKU y FMSI.');
      return;
    }

    // Validar filas compatibles
    for (const c of compatibles) {
      if (!c.modelo.trim() || !c.anio_inicio || !c.anio_fin) {
        setErrorMsg('Todas las compatibilidades deben incluir Modelo, Año Inicio y Año Fin.');
        return;
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        marca: marca.trim(),
        sku_dynamic: skuDynamic.trim().toUpperCase(),
        sku_equivalente_wagner: skuWagner.trim().toUpperCase(),
        fmsi: fmsi.trim(),
        posicion,
        precio: precio.trim() ? Number(precio) : 0,
        vehiculos_compatibles: compatibles.map(c => ({
          modelo: c.modelo.trim(),
          anio_inicio: Number(c.anio_inicio),
          anio_fin: Number(c.anio_fin),
          especificaciones: c.especificaciones?.trim() || ''
        }))
      };

      let res;
      if (mode === 'create') {
        res = await api.post('/balatas', payload);
      } else {
        res = await api.put(`/balatas/${item._id}`, payload);
      }

      if (res.data?.ok) {
        onSuccess(res.data.balata);
      } else {
        setErrorMsg('Error al guardar la balata.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-violet-700" />
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h3 className="text-lg font-bold text-white">
            {mode === 'create' ? 'Agregar' : 'Editar'} Balata (Pastilla)
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fila 1: Datos Base */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Marca
              </label>
              <input
                type="text"
                value={marca}
                onChange={e => setMarca(e.target.value)}
                placeholder="Ej: Dynamic"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none font-sans"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                SKU Dynamic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={skuDynamic}
                onChange={e => setSkuDynamic(e.target.value)}
                placeholder="Ej: D-1234"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                SKU Eq. Wagner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={skuWagner}
                onChange={e => setSkuWagner(e.target.value)}
                placeholder="Ej: W-1234"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          {/* Fila 2: Posición, FMSI y Precio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Posición <span className="text-red-500">*</span>
              </label>
              <select
                value={posicion}
                onChange={e => setPosicion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
              >
                <option value="Delantero">Delantero</option>
                <option value="Trasero">Trasero</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Código FMSI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fmsi}
                onChange={e => setFmsi(e.target.value)}
                placeholder="Ej: 7890-D1234"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Precio Cliente
              </label>
              <input
                type="number"
                step="0.01"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          {/* Sección: Vehículos Compatibles */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Vehículos Compatibles</h4>
              <button
                type="button"
                onClick={handleAddCompatibleRow}
                className="flex items-center gap-1 text-[10px] uppercase font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Vehículo
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {compatibles.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
                  Aún no has añadido compatibilidades para esta balata. Usa el botón "Añadir Vehículo".
                </div>
              ) : (
                compatibles.map((c, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-855 items-center">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        required
                        placeholder="Modelo (Ej: CHEVROLET AVEO)"
                        value={c.modelo}
                        list="modelos-sugeridos"
                        onChange={e => handleCompatibleRowChange(index, 'modelo', e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        required
                        placeholder="Año Inic."
                        value={c.anio_inicio}
                        onChange={e => handleCompatibleRowChange(index, 'anio_inicio', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-855 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        required
                        placeholder="Año Fin"
                        value={c.anio_fin}
                        onChange={e => handleCompatibleRowChange(index, 'anio_fin', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-855 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Especificaciones (Ej: 2WD)"
                        value={c.especificaciones}
                        onChange={e => handleCompatibleRowChange(index, 'especificaciones', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCompatibleRow(index)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer"
                        title="Eliminar Compatibilidad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Guardando Balata...' : 'Guardar Balata'}</span>
          </button>
        </div>

        <datalist id="modelos-sugeridos">
          {sugerenciasModelos.map(m => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
