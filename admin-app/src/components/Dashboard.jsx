import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Car, FileText, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    attendedQuotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      try {
        const [vehiclesRes, quotesRes] = await Promise.all([
          api.get('/vehiculos/stats'),
          api.get('/cotizaciones')
        ]);
        
        const quotes = quotesRes.data || [];
        const pending = quotes.filter(q => q.estatus === 'Pendiente').length;
        const attended = quotes.filter(q => q.estatus === 'Atendida').length;

        setStats({
          totalVehicles: vehiclesRes.data?.total || 0,
          totalQuotes: quotes.length,
          pendingQuotes: pending,
          attendedQuotes: attended,
        });
        setError('');
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError('Error al conectar con la base de datos local para obtener estadísticas.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Consola de Control</h1>
        <p className="text-slate-400 mt-1">Resumen general y métricas operativas del establecimiento.</p>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card: Vehicles */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehículos en Catálogo</p>
            <h3 className="text-3xl font-bold text-white mt-2">{stats.totalVehicles}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Pending Quotes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cotizaciones Pendientes</p>
            <h3 className="text-3xl font-bold text-white mt-2">{stats.pendingQuotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Card: Attended Quotes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cotizaciones Atendidas</p>
            <h3 className="text-3xl font-bold text-white mt-2">{stats.attendedQuotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Total Quotes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Solicitudes</p>
            <h3 className="text-3xl font-bold text-white mt-2">{stats.totalQuotes}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
            <FileText className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Database connection information */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-2">Conectividad</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Conectado a MongoDB Atlas (Nube)</span>
          </div>
          <div>
            <span>Dirección API: http://localhost:5000/api</span>
          </div>
        </div>
      </div>
    </div>
  );
}
