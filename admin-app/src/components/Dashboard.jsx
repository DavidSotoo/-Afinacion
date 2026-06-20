import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Car, 
  FileText, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Activity, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    attendedQuotes: 0,
    paidQuotes: 0,
    cancelledQuotes: 0,
  });
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchStatsAndQuotes() {
    try {
      setError('');
      const [vehiclesRes, quotesRes] = await Promise.all([
        api.get('/vehiculos/stats'),
        api.get('/cotizaciones')
      ]);
      
      const quotes = quotesRes.data || [];
      const pending = quotes.filter(q => q.estatus === 'Pendiente').length;
      const attended = quotes.filter(q => q.estatus === 'Atendida').length;
      const paid = quotes.filter(q => q.estatus === 'Pagado / Listo para surtir').length;
      const cancelled = quotes.filter(q => q.estatus === 'Cancelada').length;

      setStats({
        totalVehicles: vehiclesRes.data?.total || 0,
        totalQuotes: quotes.length,
        pendingQuotes: pending,
        attendedQuotes: attended,
        paidQuotes: paid,
        cancelledQuotes: cancelled,
      });

      // Sort by date descending and take top 5
      const sorted = [...quotes]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
      setRecentQuotes(sorted);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError('Error de conexión. Verifica la dirección del servidor API.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (active) {
        fetchStatsAndQuotes();
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStatsAndQuotes();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Radial Progress Calculations (Percentage of attended + paid quotes over total)
  const resolvedQuotes = stats.attendedQuotes + stats.paidQuotes;
  const ratio = stats.totalQuotes > 0 ? Math.round((resolvedQuotes / stats.totalQuotes) * 100) : 0;
  
  // Circumference for r=36 is 2 * pi * r = 226.19
  const circumference = 226.19;
  const strokeDashoffset = circumference - (ratio / 100) * circumference;

  const currentApiUrl = localStorage.getItem('api_base_url') || 'http://localhost:5000/api';

  return (
    <div className="space-y-8 animate-fadeIn select-none">
      
      {/* Welcome Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            Consola de Control
          </h1>
          <p className="text-slate-400 mt-0.5 text-xs">Resumen general del estado operativo de +AFINACIÓN.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-xs text-red-400 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card: Vehicles */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehículos en Catálogo</p>
            <h3 className="text-3xl font-extrabold text-white mt-1 font-mono">{stats.totalVehicles}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/25 flex items-center justify-center text-violet-500 z-10">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Pending Quotes */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cotizaciones Pendientes</p>
            <h3 className="text-3xl font-extrabold text-white mt-1 font-mono">{stats.pendingQuotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/25 flex items-center justify-center text-amber-500 z-10">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Card: Attended Quotes */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atendidas & Listas</p>
            <h3 className="text-3xl font-extrabold text-white mt-1 font-mono">{stats.attendedQuotes + stats.paidQuotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 z-10">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Total Quotes */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Solicitudes</p>
            <h3 className="text-3xl font-extrabold text-white mt-1 font-mono">{stats.totalQuotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-600/10 border border-sky-500/25 flex items-center justify-center text-sky-500 z-10">
            <FileText className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Overview Analytics Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Attended Ratio Ring */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col justify-between h-[390px]">
          <div>
            <h2 className="text-base font-bold text-white mb-0.5">Efectividad de Atención</h2>
            <p className="text-[11px] text-slate-400">Porcentaje de solicitudes resueltas de manera exitosa.</p>
          </div>

          <div className="flex items-center justify-center my-4 relative">
            <svg className="w-36 h-36 transform -rotate-90">
              {/* Outer Shadow Track */}
              <circle
                cx="72"
                cy="72"
                r="36"
                className="text-slate-900"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="72"
                cy="72"
                r="36"
                className="text-violet-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white font-mono leading-none">{ratio}%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Resueltas</span>
            </div>
          </div>

          {/* Legend Table */}
          <div className="grid grid-cols-4 gap-1 text-center border-t border-slate-800/60 pt-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pendientes</span>
              <span className="text-xs font-bold text-amber-400 font-mono mt-0.5">{stats.pendingQuotes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Atendidas</span>
              <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{stats.attendedQuotes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pagadas</span>
              <span className="text-xs font-bold text-violet-400 font-mono mt-0.5">{stats.paidQuotes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Canceladas</span>
              <span className="text-xs font-bold text-red-400 font-mono mt-0.5">{stats.cancelledQuotes}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col justify-between h-[390px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 shrink-0">
            <div>
              <h2 className="text-base font-bold text-white">Actividad Reciente</h2>
              <p className="text-[11px] text-slate-400">Últimas solicitudes de cotización recibidas.</p>
            </div>
            {setActiveTab && (
              <button 
                onClick={() => setActiveTab('cotizaciones')}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-grow space-y-2.5 overflow-y-auto pr-1">
            {recentQuotes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                No hay solicitudes recientes registradas.
              </div>
            ) : (
              recentQuotes.map((q) => (
                <div 
                  key={q._id} 
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-slate-800/80 hover:bg-slate-900/35 transition-all text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-mono font-bold text-[10px] text-slate-500">
                      COT
                    </div>
                    <div>
                      <div className="font-bold text-white font-mono group-hover:text-violet-400 transition-colors">
                        {q.folio}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {q.vehiculo?.marca} {q.vehiculo?.modelo} {q.vehiculo?.anios ? `(${q.vehiculo.anios})` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="hidden sm:block text-[10px] text-slate-500 font-mono">
                      {formatDate(q.fecha)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadgeClass(q.estatus)}`}>
                      {q.estatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Section: Quick Links & Database Connection Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Quick Links */}
        <div className="md:col-span-6 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-350">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-4">
            {setActiveTab && (
              <>
                <button
                  onClick={() => setActiveTab('inventario')}
                  className="p-4 text-left rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/25 transition-all text-xs font-bold text-slate-300 hover:text-white flex flex-col justify-between h-20 shadow-sm cursor-pointer"
                >
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Inventario</span>
                  <span className="flex items-center gap-1">Gestionar Maestro <ArrowRight className="w-3 h-3" /></span>
                </button>
                <button
                  onClick={() => setActiveTab('catalogos')}
                  className="p-4 text-left rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/25 transition-all text-xs font-bold text-slate-300 hover:text-white flex flex-col justify-between h-20 shadow-sm cursor-pointer"
                >
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Catálogos</span>
                  <span className="flex items-center gap-1">Editar Refacciones <ArrowRight className="w-3 h-3" /></span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Console Connectivity Terminal */}
        <div className="md:col-span-6 space-y-2.5">
          <h3 className="text-sm font-bold text-slate-350">Estado de Conectividad</h3>
          <div className="glass-panel rounded-2xl p-4 border border-slate-850 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-mono font-bold text-slate-300">Servicio de Datos</span>
            </div>
            
            <div className="bg-slate-950/60 border border-slate-850/80 rounded-xl p-3 space-y-1.5 font-mono text-[10px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">BD Nube (Atlas):</span>
                <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Conectado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">API del Servidor:</span>
                <span className="text-white truncate max-w-[220px]" title={currentApiUrl}>
                  {currentApiUrl}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
