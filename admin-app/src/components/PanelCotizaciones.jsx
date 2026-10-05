import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Calendar, Trash2, CheckCircle2, XCircle, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const ESTATUS_TABS = [
  { value: '', label: 'Todas', key: 'total' },
  { value: 'Pendiente', label: 'Pendientes', key: 'pendientes' },
  { value: 'Atendida', label: 'Atendidas', key: 'atendidas' },
  { value: 'Pagado / Listo para surtir', label: 'Pagadas', key: 'pagadas' },
  { value: 'Cancelada', label: 'Canceladas', key: 'canceladas' },
];

const PAGE_SIZE = 20;

const buildWhatsappUrl = (q) => {
  const digits = (q.datosCliente?.telefono || '').replace(/\D/g, '');
  const nombre = q.datosCliente?.nombre?.split(' ')[0] || '';
  const vehiculo = `${q.vehiculo?.marca || ''} ${q.vehiculo?.modelo || ''}`.trim();
  const total = Number(q.totalFinal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const texto = `Hola${nombre ? ' ' + nombre : ''}, le escribimos de +AFINACIÓN sobre su cotización ${q.folio} (${vehiculo}). Total: $${total} MXN. ¿Le confirmamos su pedido?`;
  return `https://wa.me/52${digits}?text=${encodeURIComponent(texto)}`;
};

export default function PanelCotizaciones() {
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [stats, setStats] = useState(null);
  const [estatus, setEstatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchQuotes = useCallback(async () => {
    try {
      const params = { page, limit: PAGE_SIZE };
      if (estatus) params.estatus = estatus;
      if (debouncedSearch) params.q = debouncedSearch;
      const [listRes, statsRes] = await Promise.all([
        api.get('/cotizaciones/buscar', { params }),
        api.get('/cotizaciones/stats'),
      ]);
      setData(listRes.data);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      console.error("Error loading quotes:", err);
      setError('Error al conectar con la base de datos para obtener cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, [page, estatus, debouncedSearch]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        await fetchQuotes();
      }
    };
    load();
    return () => { active = false; };
  }, [fetchQuotes]);

  const cotizaciones = data.items;

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(true);
    try {
      await api.put(`/cotizaciones/${id}/status`, { estatus: newStatus });
      await fetchQuotes();
    } catch (err) {
      console.error("Error updating quote status:", err);
      setToast('No se pudo actualizar el estatus de la cotización.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cotización de la base de datos de manera permanente?')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/cotizaciones/${id}`);
      setToast('Cotización eliminada.');
      await fetchQuotes();
    } catch (err) {
      console.error("Error deleting quote:", err);
      setToast('No se pudo eliminar la cotización.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pagado / Listo para surtir':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Atendida':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cancelada':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const header = (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Solicitudes de Cotización</h1>
        <p className="text-slate-400 mt-1">Gestión de cotizaciones solicitadas por clientes a través de la web pública.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {ESTATUS_TABS.map(tab => (
            <button
              key={tab.value || 'todas'}
              onClick={() => { setEstatus(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                estatus === tab.value
                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {stats && <span className="ml-1.5 font-mono text-slate-500">{stats[tab.key] ?? 0}</span>}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar folio, cliente, teléfono o vehículo…"
            className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none"
          />
        </div>
      </div>
    </div>
  );

  const pagination = data.totalPages > 1 && (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span>Página {data.page ?? page} de {data.totalPages} · {data.total} cotizaciones</span>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
          disabled={page >= data.totalPages || loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white disabled:opacity-30 cursor-pointer"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {header}

      {toast && (
        <div className="bg-slate-900 border border-violet-500/30 rounded-xl px-4 py-3 text-sm text-violet-200">
          {toast}
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          {debouncedSearch || estatus ? 'No hay cotizaciones que coincidan con el filtro.' : 'No hay cotizaciones registradas actualmente en el sistema.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {cotizaciones.map((q) => (
            <div
              key={q._id}
              className={`bg-slate-900 border rounded-2xl p-6 transition-all shadow-sm ${
                q.estatus === 'Pendiente' ? 'border-amber-500/30' : 'border-slate-800'
              }`}
            >
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-violet-400">{q.folio}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(q.estatus)}`}>
                    {q.estatus}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(q.fecha)}</span>
                </div>
              </div>

              {/* Body Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
                {/* Vehicle Column */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Vehículo</h4>
                  <div className="font-bold text-white text-base">
                    {q.vehiculo?.marca} {q.vehiculo?.modelo}
                  </div>
                  <div className="text-slate-400 mt-1">
                    Motor: {q.vehiculo?.litros}L {q.vehiculo?.cilindros || q.vehiculo?.cilindros_config}
                  </div>
                  {q.vehiculo?.motor && (
                    <div className="text-xs font-mono text-slate-500 mt-0.5">({q.vehiculo.motor})</div>
                  )}
                  {q.servicioTaller && q.servicioTaller !== 'ninguno' && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-xs border border-violet-500/20 font-semibold uppercase tracking-wider">
                      <span>🛠️ Servicio: {q.servicioTaller === 'basico' ? 'Básico' : q.servicioTaller === 'medio' ? 'Medio' : 'Completo'}</span>
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Detalles del Kit</h4>
                  <div className="space-y-1.5">
                    {q.tipoBujia && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        <span>Bujías: <span className="font-semibold text-white">{q.tipoBujia}</span> ({q.bujiaSku || 'OEM'})</span>
                      </div>
                    )}
                    {q.piezas && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span>Piezas en kit: <span className="font-semibold text-white">{Array.isArray(q.piezas) ? q.piezas.length : 0} pzas</span></span>
                      </div>
                    )}
                    {q.aceite && q.aceite.marca && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Aceite: <span className="font-semibold text-white">{q.aceite.marca} {q.aceite.viscosidad}</span> ({q.aceite.litros}L)</span>
                      </div>
                    )}
                    {q.metodoPago && (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Pago: <span className="font-semibold text-white capitalize">{q.metodoPago === 'tarjeta' ? 'Tarjeta (Línea)' : q.metodoPago}</span>
                          {q.detallesPago?.tarjetaEnmascarada && ` (${q.detallesPago.marca ? q.detallesPago.marca.toUpperCase() + ' ' : ''}${q.detallesPago.tarjetaEnmascarada})`}
                          {q.detallesPago?.pagoCon !== undefined && q.detallesPago?.cambio !== undefined && ` (Paga con: $${q.detallesPago.pagoCon} · Cambio: $${q.detallesPago.cambio})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* List of items in the kit */}
                  {q.piezas && Array.isArray(q.piezas) && q.piezas.length > 0 && (
                    <div className="mt-3 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1 text-xs">
                      {q.piezas.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <span className={p.excluida ? "text-slate-500 line-through" : "text-slate-400"}>
                            {p.nombre}
                          </span>
                          <span className={`font-mono text-[10px] ${p.excluida ? "text-slate-600 line-through" : "text-violet-300 font-semibold"}`}>
                            {p.excluida ? "Removido" : (p.sku || 'Cotizar')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Column */}
                <div className="flex flex-col justify-between items-start md:items-end gap-4">
                  {q.datosCliente?.nombre && (
                    <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs text-left">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Cliente</h4>
                      <div className="font-bold text-white text-sm">{q.datosCliente.nombre}</div>
                      {q.datosCliente.telefono && (
                        <a
                          href={buildWhatsappUrl(q)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block font-mono text-emerald-400 hover:underline"
                        >
                          {q.datosCliente.telefono}
                        </a>
                      )}
                      {q.datosCliente.email && (
                        <a href={`mailto:${q.datosCliente.email}`} className="block text-sky-400 hover:underline break-all">
                          {q.datosCliente.email}
                        </a>
                      )}
                      {q.datosCliente.notas && (
                        <div className="text-slate-400 italic">“{q.datosCliente.notas}”</div>
                      )}
                      {q.totalFinal > 0 && (
                        <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex justify-between font-bold text-white">
                          <span>Total</span>
                          <span>${Number(q.totalFinal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="w-full sm:w-auto">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 md:text-right">
                      Cambiar Estatus
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(q._id, 'Atendida')}
                        disabled={actionLoading || q.estatus === 'Atendida'}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Marcar como Atendida"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(q._id, 'Cancelada')}
                        disabled={actionLoading || q.estatus === 'Cancelada'}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Marcar como Cancelada"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(q._id, 'Pendiente')}
                        disabled={actionLoading || q.estatus === 'Pendiente'}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Marcar como Pendiente"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </button>
                      <div className="w-px bg-slate-800 mx-1" />
                      <button
                        onClick={() => handleDelete(q._id)}
                        disabled={actionLoading}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/5 text-slate-500 hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {pagination}
        </div>
      )}
    </div>
  );
}
