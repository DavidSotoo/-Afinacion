import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Calendar, Trash2, CheckCircle2, XCircle, AlertCircle, MapPin, Phone, User, Copy, Check, ExternalLink, Map, Route, ChevronDown, ChevronUp, CheckSquare, Square, Navigation } from 'lucide-react';

export default function PanelEnvios() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // ── Route Planner States ──
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [startAddress, setStartAddress] = useState('Av. Circunvalación Oblatos 1982, San Martín, Tlaquepaque, Jal., Mexico');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [planningStatusMsg, setPlanningStatusMsg] = useState('');
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [planningError, setPlanningError] = useState('');

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function geocodeAddress(addressString) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AfinacionRoutePlanner/1.0 (DavidSotoo)'
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (err) {
      console.error("Geocoding failed for address:", addressString, err);
      return null;
    }
  }

  // Filter quotes that contain shipping address details
  const envios = cotizaciones.filter(q => q.direccionEnvio && q.direccionEnvio.nombreRecibe);
  const pendingEnvios = envios.filter(q => q.estatus === 'Pendiente' || q.estatus === 'Pagado / Listo para surtir');

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await api.get('/cotizaciones');
      const data = res.data || [];
      setCotizaciones(data);
      const ids = data
        .filter(q => q.direccionEnvio && q.direccionEnvio.nombreRecibe)
        .filter(q => q.estatus === 'Pendiente' || q.estatus === 'Pagado / Listo para surtir')
        .map(q => q._id);
      setSelectedOrderIds(ids);
      setError('');
    } catch (err) {
      console.error("Error loading quotes:", err);
      setError('Error al conectar con la base de datos para obtener cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function calculateOptimalRoute() {
    if (selectedOrderIds.length === 0) {
      setPlanningError('Selecciona al menos un pedido para trazar la ruta.');
      return;
    }
    setIsCalculating(true);
    setPlanningError('');
    setOptimizedRoute(null);

    try {
      setPlanningStatusMsg('Geocodificando punto de partida...');
      let startCoords = await geocodeAddress(startAddress);
      if (!startCoords) {
        startCoords = { lat: 20.6865, lon: -103.3102 }; // Oblatos fallback
      }

      await delay(1100);

      const ordersToGeocode = pendingEnvios.filter(q => selectedOrderIds.includes(q._id));
      const geocodedOrders = [];

      for (let i = 0; i < ordersToGeocode.length; i++) {
        const q = ordersToGeocode[i];
        const dir = q.direccionEnvio;
        const fullAddr = `${dir.calleNumero}, ${dir.colonia}, ${dir.municipio}, ${dir.estado}, Mexico`;
        
        setPlanningStatusMsg(`Geocodificando pedido ${i + 1} de ${ordersToGeocode.length}: ${q.folio}...`);
        
        let coords = await geocodeAddress(fullAddr);
        if (!coords) {
          await delay(1100);
          const broaderAddr = `${dir.colonia}, ${dir.municipio}, ${dir.estado}, Mexico`;
          coords = await geocodeAddress(broaderAddr);
        }

        geocodedOrders.push({
          order: q,
          address: fullAddr,
          coords: coords || null
        });

        if (i < ordersToGeocode.length - 1) {
          await delay(1100);
        }
      }

      const successOrders = geocodedOrders.filter(o => o.coords !== null);
      const failedOrders = geocodedOrders.filter(o => o.coords === null);

      const sortedStops = [];
      let currentPos = startCoords;
      const unvisited = [...successOrders];

      while (unvisited.length > 0) {
        let nearestIdx = -1;
        let minDistance = Infinity;

        for (let j = 0; j < unvisited.length; j++) {
          const p = unvisited[j];
          const dist = Math.sqrt(
            Math.pow(p.coords.lat - currentPos.lat, 2) +
            Math.pow(p.coords.lon - currentPos.lon, 2)
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = j;
          }
        }

        const nextStop = unvisited.splice(nearestIdx, 1)[0];
        sortedStops.push(nextStop);
        currentPos = nextStop.coords;
      }

      const finalRoute = [...sortedStops, ...failedOrders];

      let mapsUrl = '';
      if (finalRoute.length > 0) {
        const originStr = startAddress;
        if (finalRoute.length === 1) {
          mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(finalRoute[0].address)}`;
        } else {
          const destStr = finalRoute[finalRoute.length - 1].address;
          const waypointsStr = finalRoute
            .slice(0, -1)
            .map(stop => stop.address)
            .join('|');

          mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&waypoints=${encodeURIComponent(waypointsStr)}`;
        }
      }

      setOptimizedRoute({
        stops: finalRoute,
        mapsUrl,
        failedCount: failedOrders.length
      });

    } catch (err) {
      console.error("Optimal route calculation error:", err);
      setPlanningError('Ocurrió un error al calcular la ruta óptima.');
    } finally {
      setIsCalculating(false);
      setPlanningStatusMsg('');
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(true);
    try {
      await api.put(`/cotizaciones/${id}/status`, { estatus: newStatus });
      setCotizaciones(prev => prev.map(q => q._id === id ? { ...q, estatus: newStatus } : q));
    } catch (err) {
      console.error("Error updating status:", err);
      alert('No se pudo actualizar el estatus.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido permanentemente?')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/cotizaciones/${id}`);
      setCotizaciones(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      console.error("Error deleting quote:", err);
      alert('No se pudo eliminar el pedido.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyAddress = (q) => {
    const dir = q.direccionEnvio;
    if (!dir) return;
    const text = `FOLIO: ${q.folio}\nRECIBA: ${dir.nombreRecibe}\nTELÉFONO: ${dir.telefono}\nDIRECCIÓN: ${dir.calleNumero}\nCOLONIA: ${dir.colonia}\nMUNICIPIO: ${dir.municipio}, C.P. ${dir.codigoPostal}\nESTADO: ${dir.estado}\nREFERENCIAS: ${dir.referencias || 'Ninguna'}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(q._id);
    setTimeout(() => setCopiedId(null), 2000);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Pedidos a Domicilio</h1>
        <p className="text-slate-400 mt-1">Gestión de pedidos con entrega a domicilio local (ZMG) o foránea.</p>
      </div>

      {/* ── Route Planner Section ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setIsPlannerOpen(!isPlannerOpen)}
          className="w-full flex items-center justify-between p-5 text-left text-white hover:bg-slate-950/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Map className="text-violet-400 w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Optimizar Ruta de Reparto (ZMG)</h3>
              <p className="text-xs text-slate-400">Calcula la ruta más rápida para entregar pedidos pendientes.</p>
            </div>
          </div>
          {isPlannerOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {isPlannerOpen && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/20 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Configuration */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Punto de Partida (Origen)
                  </label>
                  <input
                    type="text"
                    value={startAddress}
                    onChange={(e) => setStartAddress(e.target.value)}
                    placeholder="Dirección de partida..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <button
                    onClick={calculateOptimalRoute}
                    disabled={isCalculating || selectedOrderIds.length === 0}
                    className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Optimizando...</span>
                      </>
                    ) : (
                      <>
                        <Route className="w-4 h-4" />
                        <span>Calcular Ruta Óptima</span>
                      </>
                    )}
                  </button>
                </div>

                {isCalculating && (
                  <p className="text-xs text-violet-400 animate-pulse font-mono">{planningStatusMsg}</p>
                )}

                {planningError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                    {planningError}
                  </div>
                )}
              </div>

              {/* Middle Column: Order Selection */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Seleccionar Pedidos a Incluir ({selectedOrderIds.length} seleccionados)
                </label>

                {pendingEnvios.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-4">No hay envíos pendientes con estatus "Pendiente" o "Listo para surtir".</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/40 p-2 space-y-1.5 custom-scrollbar">
                    {pendingEnvios.map((q) => {
                      const isSelected = selectedOrderIds.includes(q._id);
                      return (
                        <div
                          key={q._id}
                          onClick={() => {
                            setSelectedOrderIds(prev =>
                              isSelected ? prev.filter(id => id !== q._id) : [...prev, q._id]
                            );
                          }}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected ? 'bg-violet-500/5 border-violet-500/20 text-white' : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-violet-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div className="text-xs flex-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-mono font-bold text-violet-400">{q.folio}</span>
                              <span className="text-slate-500">{q.direccionEnvio.nombreRecibe}</span>
                            </div>
                            <p className="text-slate-400 line-clamp-1">{q.direccionEnvio.calleNumero}, Col. {q.direccionEnvio.colonia}, {q.direccionEnvio.municipio}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Results output */}
            {optimizedRoute && (
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="text-emerald-400 w-4 h-4" /> Ruta de Entrega Calculada con Éxito
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Ruta optimizada para {optimizedRoute.stops.length} entregas comenzando desde el mostrador.</p>
                  </div>
                  <a
                    href={optimizedRoute.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Abrir en Google Maps Navegación</span>
                  </a>
                </div>

                {optimizedRoute.failedCount > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-xs text-amber-400">
                    ⚠️ Nota: {optimizedRoute.failedCount} dirección(es) no pudieron geocodificarse con exactitud en el mapa de OSM y se colocaron al final del itinerario para trazado manual.
                  </div>
                )}

                {/* Timeline stops */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 relative">
                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                      Origen
                    </span>
                    <h5 className="font-semibold text-xs text-white mb-1 mt-1">Sucursal</h5>
                    <p className="text-xs text-slate-400 line-clamp-2">{startAddress.replace(', Mexico', '')}</p>
                  </div>

                  {optimizedRoute.stops.map((stop, idx) => (
                    <div key={stop.order._id} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 relative">
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Parada {idx + 1}
                      </span>
                      <div className="flex justify-between items-center mb-1 mt-1">
                        <h5 className="font-semibold text-xs text-white">{stop.order.direccionEnvio.nombreRecibe}</h5>
                        <span className="font-mono text-[10px] font-bold text-violet-400">{stop.order.folio}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{stop.address.replace(', Mexico', '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {envios.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          No hay pedidos a domicilio registrados actualmente en el sistema.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {envios.map((q) => {
            const dir = q.direccionEnvio || {};
            const addressParts = [
              dir.calleNumero,
              dir.colonia,
              dir.municipio,
              dir.estado,
              dir.codigoPostal ? `C.P. ${dir.codigoPostal}` : '',
              'Mexico'
            ].filter(Boolean);
            const addressQuery = addressParts.join(', ');
            const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;

            return (
              <div
                key={q._id}
                className={`bg-slate-900 border rounded-2xl p-6 transition-all shadow-sm ${
                  q.estatus === 'Pendiente' ? 'border-amber-500/30' : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-violet-400">{q.folio}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(q.estatus)}`}>
                      {q.estatus}
                    </span>
                    <span className="bg-violet-600/15 text-violet-400 text-[10px] px-2 py-0.5 rounded border border-violet-500/20 font-bold uppercase tracking-wide">
                      {q.metodoPago === 'tarjeta' ? 'PAGADO (Mercado Pago)' : 'PAGO CONTRA ENTREGA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(q.fecha)}</span>
                  </div>
                </div>

                {/* Grid content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-sm text-slate-300">
                  
                  {/* 1. Address card */}
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-3 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="text-violet-400 w-4 h-4" /> Datos de Envío
                    </span>
                    <button
                      onClick={() => handleCopyAddress(q)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      {copiedId === q._id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Guía</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Nombre que Recibe</span>
                      <span className="text-white font-semibold text-sm flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {q.direccionEnvio.nombreRecibe}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Teléfono</span>
                      <span className="text-white font-semibold text-sm flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {q.direccionEnvio.telefono}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-slate-500 block mb-0.5">Calle y Número</span>
                      <span className="text-white font-semibold">{q.direccionEnvio.calleNumero}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Colonia</span>
                      <span className="text-white font-semibold">{q.direccionEnvio.colonia}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">C.P.</span>
                      <span className="text-white font-semibold font-mono">{q.direccionEnvio.codigoPostal}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Municipio</span>
                      <span className="text-white font-semibold">{q.direccionEnvio.municipio}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Estado</span>
                      <span className="text-white font-semibold">{q.direccionEnvio.estado}</span>
                    </div>

                    {q.direccionEnvio.referencias && (
                      <div className="md:col-span-2 bg-slate-900 border border-slate-800/50 p-2.5 rounded-lg">
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wide mb-1">Referencias de Entrega</span>
                        <p className="text-slate-300 text-xs italic">"{q.direccionEnvio.referencias}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Google Maps Embed Card */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-3 lg:col-span-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="text-violet-400 w-4 h-4" /> Ubicación Maps
                    </span>
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                      <span>Ver en Maps</span>
                    </a>
                  </div>
                  <div className="w-full h-[180px] rounded-lg overflow-hidden border border-slate-800/80 relative mt-2">
                    <iframe
                      title={`Mapa de ${dir.nombreRecibe}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={embedUrl}
                    />
                  </div>
                </div>

                {/* 3. Items & Actions */}
                <div className="flex flex-col justify-between gap-4">
                  {/* Items summary */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Artículos del Pedido</h4>
                    <div className="font-bold text-white text-base">
                      {q.vehiculo?.marca} {q.vehiculo?.modelo}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      Motor: {q.vehiculo?.litros}L {q.vehiculo?.cilindros || q.vehiculo?.cilindros_config}
                    </div>

                    {q.piezas && Array.isArray(q.piezas) && (
                      <div className="mt-3 space-y-1 bg-slate-950/30 border border-slate-800/80 rounded-xl p-2.5 text-xs">
                        {q.piezas.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center gap-2">
                            <span className={p.excluida ? "text-slate-500 line-through" : "text-slate-400"}>
                              {p.nombre}
                            </span>
                            <span className={`font-mono text-[10px] ${p.excluida ? "text-slate-600 line-through" : "text-violet-300 font-semibold"}`}>
                              {p.excluida ? "Removido" : p.sku}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="w-full pt-2 border-t border-slate-800/50">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Acciones
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(q._id, 'Atendida')}
                        disabled={actionLoading || q.estatus === 'Atendida'}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Marcar como Entregado / Atendido"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(q._id, 'Cancelada')}
                        disabled={actionLoading || q.estatus === 'Cancelada'}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Cancelar Pedido"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(q._id, 'Pendiente')}
                        disabled={actionLoading || q.estatus === 'Pendiente'}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Marcar como Pendiente"
                      >
                        <AlertCircle className="w-5 h-5" />
                      </button>
                      <div className="w-px bg-slate-800 mx-1" />
                      <button
                        onClick={() => handleDelete(q._id)}
                        disabled={actionLoading}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/5 text-slate-500 hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
