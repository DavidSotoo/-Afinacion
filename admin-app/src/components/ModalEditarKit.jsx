import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import api from '../services/api';

// ─── Helper ─────────────────────────────────────────────────────────────────
const MARCAS_SUGERIDAS = ['UNIFIL', 'INTERFIL', 'JOE', 'Interfil', 'FRAM', 'GONHER', 'PURFLUX', ''];

const FILTRO_CONFIG = [
  { key: 'filtro_aceite',   label: 'Filtro de Aceite',    color: 'amber' },
  { key: 'filtro_aire',     label: 'Filtro de Aire',       color: 'sky'   },
  { key: 'filtro_gasolina', label: 'Filtro de Gasolina',   color: 'purple'},
  { key: 'filtro_cabina',   label: 'Filtro de Cabina',     color: 'teal'  },
];

const COLOR_CLASSES = {
  amber:  'border-amber-500/30  bg-amber-500/5  text-amber-400',
  sky:    'border-sky-500/30    bg-sky-500/5    text-sky-400',
  purple: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
  teal:   'border-teal-500/30   bg-teal-500/5   text-teal-400',
};

// Extract a clean editable state from a vehicle's kit_afinacion
function buildFormState(vehiculo) {
  const kit = vehiculo.kit_afinacion || {};
  const result = {};

  for (const { key } of FILTRO_CONFIG) {
    const f = kit[key] || {};
    const alts = Array.isArray(f.alternos) ? f.alternos : [];
    result[key] = {
      marca:        f.marca  || '',
      sku:          f.sku === 'SELLADO' ? 'SELLADO' : (f.sku || ''),
      alterno_marca: alts[0]?.marca || '',
      alterno_sku:   alts[0]?.sku   || '',
    };
  }
  return result;
}

// Build the kit_afinacion payload from form state
function buildPayload(formState, vehiculo) {
  const kit = vehiculo.kit_afinacion || {};
  const result = {};

  for (const { key } of FILTRO_CONFIG) {
    const f    = formState[key];
    const orig = kit[key] || {};

    const alternos = [];
    if (f.alterno_sku?.trim()) {
      alternos.push({ marca: f.alterno_marca?.trim() || '', sku: f.alterno_sku.trim() });
    }

    result[key] = {
      tipo:    orig.tipo || null,
      marca:   f.marca?.trim() || null,
      sku:     f.sku?.trim()   || null,
      hasData: !!(f.sku?.trim()),
      alternos,
    };
  }
  return result;
}

// ─── FiltroField sub-component ───────────────────────────────────────────────
function FiltroField({ label, color, fieldKey, values, onChange }) {
  const colorCls = COLOR_CLASSES[color] || COLOR_CLASSES.amber;
  const isSellado = values.sku === 'SELLADO';

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${colorCls}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider">{label}</h4>

      {/* Principal SKU */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Marca Principal
          </label>
          <select
            value={values.marca}
            onChange={e => onChange(fieldKey, 'marca', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none transition-all appearance-none cursor-pointer"
          >
            {MARCAS_SUGERIDAS.map(m => (
              <option key={m} value={m}>{m || '— Sin marca —'}</option>
            ))}
            {values.marca && !MARCAS_SUGERIDAS.includes(values.marca) && (
              <option value={values.marca}>{values.marca}</option>
            )}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            SKU Principal
          </label>
          <input
            type="text"
            value={values.sku}
            onChange={e => onChange(fieldKey, 'sku', e.target.value)}
            placeholder="Ej: FO-6607 ó SELLADO"
            className="w-full bg-slate-950 border border-slate-700 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none transition-all font-mono"
          />
        </div>
      </div>

      {/* Alterno */}
      {!isSellado && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/50">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Alterno — Marca
            </label>
            <select
              value={values.alterno_marca}
              onChange={e => onChange(fieldKey, 'alterno_marca', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none transition-all appearance-none cursor-pointer"
            >
              {MARCAS_SUGERIDAS.map(m => (
                <option key={m} value={m}>{m || '— Sin alterno —'}</option>
              ))}
              {values.alterno_marca && !MARCAS_SUGERIDAS.includes(values.alterno_marca) && (
                <option value={values.alterno_marca}>{values.alterno_marca}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Alterno — SKU
            </label>
            <input
              type="text"
              value={values.alterno_sku}
              onChange={e => onChange(fieldKey, 'alterno_sku', e.target.value)}
              placeholder="Ej: OF-6607"
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-violet-500 rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none transition-all font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function ModalEditarKit({ vehiculo, onClose, onSaved }) {
  const [formState,  setFormState]  = useState(() => buildFormState(vehiculo));
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');
  const backdropRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChange = (filtroKey, field, value) => {
    setFormState(prev => ({
      ...prev,
      [filtroKey]: { ...prev[filtroKey], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const kit_afinacion = buildPayload(formState, vehiculo);
      const id = vehiculo._id || vehiculo.id;

      const res = await api.put(`/vehiculos/${id}`, { kit_afinacion });

      if (res.data?.ok) {
        setSuccess(true);
        // After 1.2s, close modal and notify parent to refresh
        setTimeout(() => {
          onSaved(res.data.vehiculo);
        }, 1200);
      } else {
        setErrorMsg('El servidor respondió sin confirmar el guardado.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error de conexión con el backend.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  // Close when clicking the backdrop (not the modal card itself)
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">

        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-violet-700" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Editar Kit de Filtros
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              <span className="font-semibold text-violet-400">{vehiculo.marca} {vehiculo.modelo}</span>
              {' '}· {vehiculo.litros}L {vehiculo.cilindros_config}
              {vehiculo.motor && ` (${vehiculo.motor})`}
              {' '}· {vehiculo.anio_inicio}–{vehiculo.anio_fin}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-4 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — 4 filter fields */}
        <div className="p-6 space-y-4 flex-1">
          {FILTRO_CONFIG.map(({ key, label, color }) => (
            <FiltroField
              key={key}
              label={label}
              color={color}
              fieldKey={key}
              values={formState[key]}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 space-y-3">
          {/* Error message */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Cambios guardados correctamente en MongoDB Atlas!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving || success}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || success}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white transition-all shadow-lg shadow-violet-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
