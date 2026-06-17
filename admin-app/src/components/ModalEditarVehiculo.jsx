import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

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

// Extract filter kit state from a vehicle
function buildKitFormState(vehiculo) {
  if (!vehiculo) {
    const emptyState = {};
    for (const { key } of FILTRO_CONFIG) {
      emptyState[key] = { marca: '', sku: '', alterno_marca: '', alterno_sku: '' };
    }
    return emptyState;
  }
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
function buildKitPayload(kitState, originalKit) {
  const kit = originalKit || {};
  const result = {};

  for (const { key } of FILTRO_CONFIG) {
    const f = kitState[key];
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

// FiltroField sub-component
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

// Main Tabbed Modal
export default function ModalEditarVehiculo({ vehiculo, onClose, onSaved }) {
  const isEdit = !!vehiculo;

  // Active Tab
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'kit'

  // Specifications Form State (Initialized directly from props)
  const [marca, setMarca] = useState(vehiculo?.marca || '');
  const [modelo, setModelo] = useState(vehiculo?.modelo || '');
  const [anioInicio, setAnioInicio] = useState(vehiculo?.anio_inicio ? String(vehiculo.anio_inicio) : '');
  const [anioFin, setAnioFin] = useState(vehiculo?.anio_fin ? String(vehiculo.anio_fin) : '');
  const [motor, setMotor] = useState(vehiculo?.motor || '');
  const [litros, setLitros] = useState(vehiculo?.litros !== null && vehiculo?.litros !== undefined ? String(vehiculo.litros) : '');
  const [cilindrosConfig, setCilindrosConfig] = useState(vehiculo?.cilindros_config || 'L4');
  const [aspiracion, setAspiracion] = useState(vehiculo?.aspiracion || 'Aspiración Natural');
  const [calibracionMm, setCalibracionMm] = useState(vehiculo?.calibracion_mm !== null && vehiculo?.calibracion_mm !== undefined ? String(vehiculo.calibracion_mm) : '');

  // Spark Plugs State
  const [bujiaStockType, setBujiaStockType] = useState(vehiculo?.bujia_stock?.tipo || '');
  const [bujiaStockCode, setBujiaStockCode] = useState(vehiculo?.bujia_stock?.codigo || '');
  const [bujiaIriType, setBujiaIriType] = useState(vehiculo?.bujia_iridium_ix?.tipo || '');
  const [bujiaIriCode, setBujiaIriCode] = useState(vehiculo?.bujia_iridium_ix?.codigo || '');
  const [bujiaGPowerType, setBujiaGPowerType] = useState(vehiculo?.bujia_g_power?.tipo || '');
  const [bujiaGPowerCode, setBujiaGPowerCode] = useState(vehiculo?.bujia_g_power?.codigo || '');
  const [bujiaVPowerType, setBujiaVPowerType] = useState(vehiculo?.bujia_v_power?.tipo || '');
  const [bujiaVPowerCode, setBujiaVPowerCode] = useState(vehiculo?.bujia_v_power?.codigo || '');

  // Kit Form State
  const [kitFormState, setKitFormState] = useState(() => buildKitFormState(vehiculo));

  // Saving states
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const backdropRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleKitChange = (filtroKey, field, value) => {
    setKitFormState(prev => ({
      ...prev,
      [filtroKey]: { ...prev[filtroKey], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!marca.trim() || !modelo.trim() || !anioInicio.trim() || !anioFin.trim()) {
      setErrorMsg('Los campos Marca, Modelo, Año Inicio y Año Fin son obligatorios.');
      setActiveTab('specs');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const kit_payload = buildKitPayload(kitFormState, vehiculo?.kit_afinacion);

      const payload = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio_inicio: Number(anioInicio),
        anio_fin: Number(anioFin),
        motor: motor.trim(),
        litros: litros.trim() === '' ? null : Number(litros),
        cilindros_config: cilindrosConfig.trim(),
        aspiracion: aspiracion.trim(),
        calibracion_mm: calibracionMm.trim() === '' ? null : Number(calibracionMm),
        bujia_stock: { tipo: bujiaStockType.trim(), codigo: bujiaStockCode.trim() },
        bujia_iridium_ix: { tipo: bujiaIriType.trim(), codigo: bujiaIriCode.trim() },
        bujia_g_power: { tipo: bujiaGPowerType.trim(), codigo: bujiaGPowerCode.trim() },
        bujia_v_power: { tipo: bujiaVPowerType.trim(), codigo: bujiaVPowerCode.trim() },
        kit_afinacion: kit_payload
      };

      let res;
      if (isEdit) {
        const id = vehiculo._id || vehiculo.id;
        res = await api.put(`/vehiculos/${id}`, payload);
      } else {
        res = await api.post('/vehiculos', payload);
      }

      if (res.data?.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSaved(res.data.vehiculo);
        }, 1200);
      } else {
        setErrorMsg('El servidor respondió sin confirmar el guardado.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error de conexión con el servidor.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

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
        {/* Border superior gradiente */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-violet-700" />

        {/* Header */}
        <div className="p-6 pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                {isEdit ? 'Editar Vehículo y Filtros' : 'Nuevo Vehículo'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isEdit ? (
                  <>
                    <span className="font-semibold text-violet-400">{vehiculo.marca} {vehiculo.modelo}</span>
                    {` · ${vehiculo.anio_inicio}–${vehiculo.anio_fin}`}
                  </>
                ) : (
                  'Complete las especificaciones y configure su kit de afinación inicial.'
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-4 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex gap-4 mt-4 text-xs font-semibold uppercase tracking-wider border-t border-slate-850 pt-2 shrink-0">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2 transition-all cursor-pointer border-b-2 px-1 ${
                activeTab === 'specs' ? 'text-violet-400 border-violet-500' : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              1. Especificaciones
            </button>
            <button
              onClick={() => setActiveTab('kit')}
              className={`pb-2 transition-all cursor-pointer border-b-2 px-1 ${
                activeTab === 'kit' ? 'text-violet-400 border-violet-500' : 'text-slate-500 hover:text-slate-300 border-transparent'
              }`}
            >
              2. Kit de Afinación
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex-grow overflow-y-auto">
          {/* TAB 1: ESPECIFICACIONES */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              {/* Marca, Modelo y Años */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Chevrolet"
                    value={marca}
                    onChange={e => setMarca(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Aveo"
                    value={modelo}
                    onChange={e => setModelo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Año Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 2018"
                    value={anioInicio}
                    onChange={e => setAnioInicio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Año Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 2024"
                    value={anioFin}
                    onChange={e => setAnioFin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Motor (Código)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ECOTEC"
                    value={motor}
                    onChange={e => setMotor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Litros (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 1.6"
                    value={litros}
                    onChange={e => setLitros(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Cilindros, Aspiración y Calibración */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-850 pt-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Cilindros (Conf.)
                  </label>
                  <select
                    value={cilindrosConfig}
                    onChange={e => setCilindrosConfig(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
                  >
                    <option value="L3">L3 (3 cil. en Línea)</option>
                    <option value="L4">L4 (4 cil. en Línea)</option>
                    <option value="V6">V6 (6 cil. en V)</option>
                    <option value="V8">V8 (8 cil. en V)</option>
                    <option value="L5">L5 (5 cil. en Línea)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Aspiración
                  </label>
                  <select
                    value={aspiracion}
                    onChange={e => setAspiracion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none appearance-none cursor-pointer"
                  >
                    <option value="Aspiración Natural">Aspiración Natural</option>
                    <option value="Turbocharged">Turbocharged (Turbocargado)</option>
                    <option value="Supercharged">Supercharged (Supercargado)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Calibración Bujías (mm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1.1"
                    value={calibracionMm}
                    onChange={e => setCalibracionMm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Catálogo de Bujías Compatibles */}
              <div className="border-t border-slate-850 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Códigos de Bujías NGK</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Stock */}
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Bujía Estándar (Stock)</span>
                    <input
                      type="text"
                      placeholder="Tipo (Ej: BKR6E-11)"
                      value={bujiaStockType}
                      onChange={e => setBujiaStockType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Código Stock (Ej: 2756)"
                      value={bujiaStockCode}
                      onChange={e => setBujiaStockCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>

                  {/* Iridium */}
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-violet-400 block">Iridium IX</span>
                    <input
                      type="text"
                      placeholder="Tipo (Ej: BKR6EIX-11)"
                      value={bujiaIriType}
                      onChange={e => setBujiaIriType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Código Stock (Ej: 3764)"
                      value={bujiaIriCode}
                      onChange={e => setBujiaIriCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>

                  {/* Platino (G-Power) */}
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-sky-400 block">Platino (G-Power)</span>
                    <input
                      type="text"
                      placeholder="Tipo (Ej: BKR6EGP)"
                      value={bujiaGPowerType}
                      onChange={e => setBujiaGPowerType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Código Stock (Ej: 7092)"
                      value={bujiaGPowerCode}
                      onChange={e => setBujiaGPowerCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>

                  {/* V-Power */}
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-amber-500 block">V-Power</span>
                    <input
                      type="text"
                      placeholder="Tipo (Ej: BKR6E-V)"
                      value={bujiaVPowerType}
                      onChange={e => setBujiaVPowerType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Código Stock (Ej: 4322)"
                      value={bujiaVPowerCode}
                      onChange={e => setBujiaVPowerCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KIT DE FILTROS */}
          {activeTab === 'kit' && (
            <div className="space-y-4">
              <div className="bg-slate-950/20 border border-slate-850 rounded-xl p-3 text-xs text-slate-400">
                Configure las marcas y códigos de filtros principales y sus respectivos alternos sugeridos. Si un filtro no existe para este vehículo, ponga <span className="font-mono text-white bg-slate-950 border px-1 rounded">SELLADO</span> en el SKU Principal.
              </div>
              {FILTRO_CONFIG.map(({ key, label, color }) => (
                <FiltroField
                  key={key}
                  label={label}
                  color={color}
                  fieldKey={key}
                  values={kitFormState[key]}
                  onChange={handleKitChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-3 space-y-3 shrink-0 border-t border-slate-800 bg-slate-900/50">
          {/* Alerta de Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alerta de Éxito */}
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Vehículo guardado correctamente en MongoDB Atlas!</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              {activeTab === 'specs' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('kit')}
                  className="px-4 py-2 rounded-xl text-xs text-violet-400 hover:text-violet-300 bg-slate-950 border border-slate-855 cursor-pointer"
                >
                  Continuar al Kit →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-855 cursor-pointer"
                >
                  ← Volver a Specs
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={saving || success}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || success}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white transition-all shadow-lg shadow-violet-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isEdit ? 'Guardar Cambios' : 'Crear Vehículo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
