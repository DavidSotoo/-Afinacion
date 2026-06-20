import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InventarioMaestro from './components/InventarioMaestro';
import PanelCatalogos from './components/PanelCatalogos';
import PanelCotizaciones from './components/PanelCotizaciones';
import PanelEnvios from './components/PanelEnvios';
import { 
  LayoutDashboard, 
  Table, 
  ClipboardList, 
  LogOut, 
  Truck, 
  Database,
  X,
  Server,
  Calendar,
  Activity,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function App() {
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(() => localStorage.getItem('api_base_url') || 'http://localhost:5000/api');
  const [currentDate] = useState(() => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('es-MX', options);
  });

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('api_base_url', apiUrlInput);
    setShowSettingsModal(false);
    window.location.reload();
  };

  const activeViewDetails = () => {
    switch (activeTab) {
      case 'inventario':
        return { title: 'Inventario Maestro', subtitle: 'Control global de vehículos, precios e importación' };
      case 'catalogos':
        return { title: 'Gestión de Catálogos', subtitle: 'Administración de refacciones, aceites y kits de afinación' };
      case 'cotizaciones':
        return { title: 'Cotizaciones de Clientes', subtitle: 'Solicitudes entrantes, estatus y respuestas' };
      case 'envios':
        return { title: 'Envíos & Entregas', subtitle: 'Seguimiento de pedidos de refacciones' };
      default:
        return { title: 'Panel de Control', subtitle: 'Métricas clave y estado de la plataforma' };
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'inventario':
        return <InventarioMaestro />;
      case 'catalogos':
        return <PanelCatalogos />;
      case 'cotizaciones':
        return <PanelCotizaciones />;
      case 'envios':
        return <PanelEnvios />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventario', label: 'Inventario Maestro', icon: Table },
    { id: 'catalogos', label: 'Catálogos', icon: Database },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: ClipboardList },
    { id: 'envios', label: 'Envíos', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex font-sans overflow-hidden relative w-full">
      
      {/* Dynamic ambient background glow orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-[150px] pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <aside 
        className={`relative z-10 glass-panel border-r border-slate-800/80 flex flex-col transition-all duration-300 shadow-xl shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2.5 animate-fadeIn">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
                +A
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider text-white leading-none">+AFINACIÓN</span>
                <span className="text-[9px] text-violet-400 font-semibold font-mono tracking-widest leading-none mt-1">ADMINISTRADOR</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white mx-auto">
              +A
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/15 border border-violet-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-800 border border-transparent'
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom utility section */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {/* Server Config Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all border border-transparent cursor-pointer"
            title={isSidebarCollapsed ? "Configurar API" : undefined}
          >
            <Server className="w-5 h-5 shrink-0 text-slate-400" />
            {!isSidebarCollapsed && <span className="truncate text-left flex-grow">Ajustes de Servidor</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all border border-transparent cursor-pointer"
            title={isSidebarCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-500/70" />
            {!isSidebarCollapsed && <span className="truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0 z-10 h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/60 glass-panel flex items-center justify-between px-8 shrink-0 select-none">
          {/* Section Info */}
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {activeViewDetails().title}
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              {activeViewDetails().subtitle}
            </p>
          </div>

          {/* User Info & Date */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 border-r border-slate-800/80 pr-6">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{currentDate}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-white">Administrador</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-grow overflow-y-auto px-8 py-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Settings Modal (Server Config) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl overflow-hidden border border-slate-800/85">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/30">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-violet-500" />
                <h3 className="font-bold text-white">Configuración del Servidor</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Especifica la dirección base del servidor API (Express/Mongoose). Cambiar esto permite cambiar de base de datos local a la nube de producción.
              </p>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  URL de la API del Servidor
                </label>
                <input
                  type="url"
                  required
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="http://localhost:5000/api"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white font-mono transition-all outline-none"
                />
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 flex gap-3 text-amber-400">
                <Activity className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Atención:</strong> Al guardar la configuración se reiniciará la aplicación para restablecer la conexión.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-violet-600/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Guardar y Reiniciar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
