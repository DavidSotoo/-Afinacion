import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Zap,
  Filter,
  Droplet,
  Wind,
  Fuel,
  AirVent,
  ChevronDown,
  CheckCircle,
  MessageCircle,
  X,
} from 'lucide-react';
import { useCart }             from '../context/CartContext';
import { WHATSAPP_NUMBER, MOTOR_OIL_BRANDS, MOTOR_OIL_VISCOSITIES } from '../lib/constants';
import { filtroTieneSkuReal, recomendarAceiteDefault, calculateOilPrice, formatOilName }  from '../lib/kitHelpers';

/* ─── Static config ───────────────────────────────────────────────────────── */

/** Maps tipoLinea key → display config */
const LINE_CONFIG = {
  iridium: { label: 'Iridium IX',      field: 'bujia_iridium_ix', badge: 'iridium' },
  platino: { label: 'G-Power Platino', field: 'bujia_g_power',    badge: 'platino' },
  vpower:  { label: 'V-Power',         field: 'bujia_v_power',    badge: 'vpower'  },
  stock:   { label: 'Stock / OEM',     field: 'bujia_stock',      badge: 'stock'   },
};
const ALL_LINES = ['iridium', 'platino', 'vpower', 'stock'];

/** The 4 filtros that complete the kit */
const FILTRO_CONFIG = [
  {
    key:   'filtro_aceite',
    label: 'Filtro de Aceite',
    Icon:  Droplet,
    color: 'amber',
  },
  {
    key:   'filtro_aire',
    label: 'Filtro de Aire',
    Icon:  Wind,
    color: 'sky',
  },
  {
    key:   'filtro_gasolina',
    label: 'Filtro de Gasolina',
    Icon:  Fuel,
    color: 'purple',
  },
  {
    key:   'filtro_cabina',
    label: 'Filtro de Cabina',
    Icon:  AirVent,
    color: 'teal',
  },
];

/* ─── KitCard ──────────────────────────────────────────────────────────────── */

/**
 * KitCard — Full 5-piece tune-up kit dashboard card.
 *
 * Secciones:
 *  1. Header   — vehiculo + in-cart badge
 *  2. Bujías   — NGK line selector with SKU chip
 *  3. Filtros  — 4-piece grid (Aceite, Aire, Gasolina, Cabina)
 *  4. Footer   — "Cotizar Bujías" (individual) + "Agregar Kit (5 Piezas)" (neon CTA)
 */
export default function KitCard({ bujia }) {
  const { addKit, addItem, addFiltro, items } = useCart();

  // ── Local UI state ────────────────────────────────────────────────────────
  const defaultLine = ALL_LINES.find(l => bujia[LINE_CONFIG[l].field]?.tipo) ?? 'stock';
  const [selectedLine,  setSelectedLine]  = useState(defaultLine);
  const [lineDropOpen,  setLineDropOpen]  = useState(false);
  const [justAdded,     setJustAdded]     = useState(false);
  const [viewMode,      setViewMode]      = useState('list');
  const [activeComponent, setActiveComponent] = useState(null);
  const [hoveredNode,   setHoveredNode]   = useState(null);
  const [tooltipPos,    setTooltipPos]    = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 15,
    });
  };

  // ── Motor Oil state ───────────────────────────────────────────────────────
  const recomendacionAceite = useMemo(() => recomendarAceiteDefault(bujia), [bujia]);
  const [aceiteSelected, setAceiteSelected] = useState(recomendacionAceite);

  useEffect(() => {
    setAceiteSelected(recomendacionAceite);
  }, [recomendacionAceite]);

  const anioVehiculo = parseInt(bujia.anio_inicio, 10) || 2015;

  const handleTechChange = (newTech) => {
    setAceiteSelected(prev => {
      let newVisc = prev.viscosidad;
      if (newTech === 'Sintético') {
        newVisc = '5W-30';
      } else if (newTech === 'Semisintético') {
        if (!['5W-30', '10W-30', '10W-40'].includes(prev.viscosidad)) {
          newVisc = '5W-30';
        }
      } else {
        if (!['20W-50', '25W-50'].includes(prev.viscosidad)) {
          newVisc = '20W-50';
        }
      }
      return { ...prev, tecnologia: newTech, viscosidad: newVisc };
    });
  };

  const handleViscosityChange = (newVisc) => {
    setAceiteSelected(prev => {
      let newTec = prev.tecnologia;
      if (anioVehiculo <= 2009) {
        newTec = 'Mineral';
      } else {
        if (newVisc === '5W-30') {
          if (newTec !== 'Sintético' && newTec !== 'Semisintético') {
            newTec = 'Semisintético';
          }
        } else if (['10W-30', '10W-40'].includes(newVisc)) {
          newTec = 'Semisintético';
        }
      }
      return { ...prev, viscosidad: newVisc, tecnologia: newTec };
    });
  };

  // ── Derived values (memoized) ─────────────────────────────────────────────
  const availableLines = useMemo(
    () => ALL_LINES.filter(l => bujia[LINE_CONFIG[l].field]?.tipo),
    [bujia],
  );

  const lineConfig  = LINE_CONFIG[selectedLine] ?? LINE_CONFIG['stock'];
  const bujiaData   = bujia[lineConfig.field];
  const kit         = bujia.kit_afinacion;

  const kitCartId   = useMemo(() => `kit-${bujia.id}-${selectedLine}`, [bujia.id, selectedLine]);
  const piezaCartId = useMemo(() => `pieza-${bujia.id}-${selectedLine}`, [bujia.id, selectedLine]);

  const kitItemInCart = useMemo(() => items.find(i => i.id === kitCartId), [items, kitCartId]);
  const kitInCart   = !!kitItemInCart;
  const piezaInCart = useMemo(() => items.some(i => i.id === piezaCartId), [items, piezaCartId]);

  const noBujias = availableLines.length === 0;
  
  const totalCost = useMemo(() => {
    if (!kit) return 0;
    const filtersCost = kit.costo_total || 340;
    
    let plugsCost = 0;
    if (!noBujias) {
      const bujiasPriceObj = kit.bujias?.[selectedLine];
      plugsCost = (bujiasPriceObj && bujiasPriceObj.precio_total !== undefined)
        ? bujiasPriceObj.precio_total
        : 200;
    }
    
    const oilCost = aceiteSelected ? calculateOilPrice(bujia.anio_inicio, aceiteSelected.tecnologia, aceiteSelected.litros) : 0;
    return filtersCost + plugsCost + oilCost;
  }, [kit, noBujias, selectedLine, aceiteSelected, bujia.anio_inicio]);

  // WhatsApp — bujías individuales only
  const whatsappBujiasUrl = useMemo(() => {
    if (noBujias || !bujiaData?.tipo) return '#';
    const msg = [
      `🔧 *Cotización de Bujías +AFINACIÓN*`,
      ``,
      `🚗 *Vehículo:* ${bujia.marca} ${bujia.modelo}`,
      `📅 *Años:* ${bujia.anio_inicio}–${bujia.anio_fin}`,
      `⚙️ *Motor:* ${bujia.litros}L ${bujia.cilindros_config}${bujia.motor ? ` (${bujia.motor})` : ''}${bujia.aspiracion === 'T' ? ' 🌀 TURBO' : ''}`,
      ``,
      `✨ *Bujías NGK — ${lineConfig.label}*`,
      `   SKU / Tipo:    ${bujiaData.tipo}`,
      `   Código NGK:    ${bujiaData.codigo ?? 'N/D'}`,
      `   Calibración:   ${bujia.calibracion_mm}mm`,
      ``,
      `Por favor, confirmen disponibilidad y precio. ¡Gracias!`,
    ].join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [bujia, lineConfig, bujiaData]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddKit = () => {
    addKit(bujia, selectedLine, [], aceiteSelected);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  const handleAddBujia = () => addItem(bujia, selectedLine);

  const NODES = [
    {
      id: 'bujias',
      label: 'Bujías NGK',
      cx: 200,
      cy: 85,
      color: '#facc15',
      glowColor: 'rgba(250, 204, 21, 0.4)',
      icon: Zap,
      sku: bujiaData?.tipo || 'N/D',
      status: noBujias ? 'No requiere' : 'Confirmada',
    },
    {
      id: 'filtro_aceite',
      label: 'Filtro de Aceite',
      cx: 165,
      cy: 100,
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      icon: Droplet,
      sku: kit?.filtro_aceite?.sku || 'En verificación',
      status: filtroTieneSkuReal(kit?.filtro_aceite) ? 'Confirmado' : 'Cotizar',
    },
    {
      id: 'filtro_aire',
      label: 'Filtro de Aire',
      cx: 235,
      cy: 75,
      color: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      icon: Wind,
      sku: kit?.filtro_aire?.sku || 'En verificación',
      status: filtroTieneSkuReal(kit?.filtro_aire) ? 'Confirmado' : 'Cotizar',
    },
    {
      id: 'filtro_cabina',
      label: 'Filtro de Cabina',
      cx: 200,
      cy: 140,
      color: '#2dd4bf',
      glowColor: 'rgba(45, 212, 191, 0.4)',
      icon: AirVent,
      sku: kit?.filtro_cabina?.sku || 'En verificación',
      status: filtroTieneSkuReal(kit?.filtro_cabina) ? 'Confirmado' : 'Cotizar',
    },
    {
      id: 'filtro_gasolina',
      label: 'Filtro de Gasolina',
      cx: 200,
      cy: 225,
      color: '#a78bfa',
      glowColor: 'rgba(167, 139, 250, 0.4)',
      icon: Fuel,
      sku: kit?.filtro_gasolina?.sku || 'En verificación',
      status: filtroTieneSkuReal(kit?.filtro_gasolina) ? 'Confirmado' : 'Cotizar',
    },
    {
      id: 'aceite',
      label: 'Aceite de Motor',
      cx: 175,
      cy: 75,
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      icon: Droplet,
      sku: aceiteSelected ? formatOilName(aceiteSelected.tecnologia, aceiteSelected.viscosidad) : 'Sin aceite',
      status: aceiteSelected ? 'Seleccionado' : 'No incluido',
    }
  ];

  const vehicleLabel = `${bujia.marca} ${bujia.modelo}`;
  const motorLabel   = `${bujia.litros}L ${bujia.cilindros_config}${bujia.motor ? ` (${bujia.motor})` : ''}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -4 }}
      className={`kit-card${kitInCart ? ' kit-card--in-cart' : ''}`}
      role="article"
      aria-label={`Kit de afinación: ${vehicleLabel}`}
    >
      {/* ── Top neon bar ───────────────────────────────────────────── */}
      <div className="kit-card-top-bar" aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="kit-card-header">
        <div className="kit-card-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="kit-pieces-pill" aria-label="5 piezas">{aceiteSelected ? '6 Piezas' : '5 Piezas'}</span>
            {totalCost > 0 && (
              <span className="kit-price-pill" style={{
                background: 'rgba(98, 168, 29, 0.1)',
                border: '1px solid rgba(98, 168, 29, 0.25)',
                color: 'var(--primary)',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '999px',
              }}>
                Est. ${totalCost.toLocaleString('es-MX')}
              </span>
            )}
          </div>
          <h3 className="kit-card-title">{vehicleLabel}</h3>
          <p className="kit-card-meta">
            {bujia.anio_inicio}–{bujia.anio_fin} · {motorLabel}
            {bujia.aspiracion === 'T'  ? ' · 🌀 TURBO'  : ''}
            {bujia.aspiracion === 'SC' ? ' · ⬡ S/C'    : ''}
          </p>
        </div>
        {kitInCart && (
          <span className="kit-in-cart-badge" aria-label="Kit ya en carrito">
            <CheckCircle size={13} aria-hidden="true" /> En carrito
          </span>
        )}
      </div>

      {/* ── Visual/List View Header ── */}
      <div className="blueprint-view-header">
        <div className="blueprint-view-title">
          <span className="blueprint-view-pulse" />
          <span>Afinador Interactivo</span>
        </div>
        <div className="blueprint-toggle-btn-group">
          <button
            onClick={() => { setViewMode('list'); setActiveComponent(null); }}
            className={`blueprint-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
            type="button"
          >
            📋 Lista
          </button>
          <button
            onClick={() => { setViewMode('visual'); setActiveComponent(null); }}
            className={`blueprint-toggle-btn${viewMode === 'visual' ? ' active' : ''}`}
            type="button"
          >
            🛠️ Visual
          </button>
        </div>
      </div>

      {/* ── Content grid ────────────────────────────────────────────── */}
      <div className="kit-sections" style={{ position: 'relative' }}>
        {viewMode === 'visual' ? (
          <div
            className="blueprint-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <svg
              viewBox="0 0 400 320"
              className="blueprint-svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Chassis outline */}
              {/* Wheels */}
              <rect x="95" y="60" width="22" height="40" rx="3" fill="#1e293b" stroke="rgba(255,255,255,0.05)" />
              <rect x="283" y="60" width="22" height="40" rx="3" fill="#1e293b" stroke="rgba(255,255,255,0.05)" />
              <rect x="95" y="220" width="22" height="45" rx="3" fill="#1e293b" stroke="rgba(255,255,255,0.05)" />
              <rect x="283" y="220" width="22" height="45" rx="3" fill="#1e293b" stroke="rgba(255,255,255,0.05)" />

              {/* Main Body */}
              <path
                d="M 160 40 L 240 40 C 260 40 275 50 275 70 L 270 110 C 280 120 285 130 285 145 L 285 210 L 280 230 L 275 240 C 275 260 260 270 240 270 L 160 270 C 140 270 125 260 125 240 L 120 230 L 115 210 L 115 145 C 115 130 120 120 130 110 L 125 70 C 125 50 140 40 160 40 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="2"
              />

              {/* Windshield */}
              <path
                d="M 135 125 C 145 105, 255 105, 265 125 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1.5"
              />

              {/* Engine Block */}
              <rect x="145" y="55" width="110" height="55" rx="6" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.5" />

              {/* Nodes */}
              {NODES.map((node) => {
                const isHovered = hoveredNode?.id === node.id;
                const isActive = activeComponent?.id === node.id;
                return (
                  <g
                    key={node.id}
                    className="blueprint-node"
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setActiveComponent(node)}
                  >
                    {/* Pulsating Ring */}
                    <motion.circle
                      cx={node.cx}
                      cy={node.cy}
                      r={isHovered || isActive ? 14 : 10}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="1.5"
                      animate={{
                        scale: isHovered || isActive ? [1, 1.15, 1] : [1, 1.3, 1],
                        opacity: isHovered || isActive ? [0.6, 0.8, 0.6] : [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: isHovered || isActive ? 1.2 : 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    {/* Core node */}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={6}
                      fill={node.color}
                      style={{ filter: `drop-shadow(0 0 5px ${node.color})` }}
                    />
                    {/* Hover hotspot */}
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={18}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredNode && (
              <div
                className="blueprint-tooltip"
                style={{
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                }}
              >
                <span className="blueprint-tooltip-title">{hoveredNode.label}</span>
                <span className="blueprint-tooltip-name">{hoveredNode.sku === 'SELLADO' ? 'Filtro Sellado (In-Tank)' : hoveredNode.sku}</span>
                <span className="blueprint-tooltip-status">{hoveredNode.status}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ▸ BLOQUE 1 — Bujías NGK ──────────────────────────────── */}
        <section className="kit-section-block kit-section-block--spark" aria-label="Bujías NGK">
          <header className="kit-section-label">
            <Zap size={13} aria-hidden="true" className="kit-section-icon kit-section-icon--spark" />
            <span>Bujías NGK</span>
            <span className="kit-section-number">①</span>
          </header>

          {noBujias ? (
            <div className="kit-alert-oem" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', borderLeft: '3px solid var(--text-3)', marginBottom: '0.5rem' }}>
              <span className="kit-alert-text" style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: '1.4', display: 'block' }}>
                Bujías exclusivas de equipo original (Agencia) · Filtros disponibles para cotizar
              </span>
            </div>
          ) : (
            <>
              <div className="kit-spark-row">
                <span className="kit-sku-chip kit-sku-chip--main">{bujiaData?.tipo}</span>
                <span className="kit-cal-badge">{bujia.calibracion_mm}mm</span>
                {bujiaData?.codigo && (
                  <span className="kit-code-badge">#{bujiaData.codigo}</span>
                )}
              </div>

              {/* NGK line selector */}
              {availableLines.length > 1 && (
                <div className="kit-selector-wrap">
                  <button
                className={`kit-selector-btn card-badge ${lineConfig.badge}`}
                onClick={() => setLineDropOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={lineDropOpen}
                aria-label="Seleccionar línea NGK"
              >
                <span className="dot" aria-hidden="true" />
                <span>{lineConfig.label}</span>
                <ChevronDown
                  size={12}
                  aria-hidden="true"
                  className={`kit-chevron${lineDropOpen ? ' rotated' : ''}`}
                />
              </button>
              {lineDropOpen && (
                <ul
                  className="kit-dropdown"
                  role="listbox"
                  aria-label="Línea de bujía NGK"
                >
                  {availableLines.map(l => (
                    <li
                      key={l}
                      role="option"
                      aria-selected={selectedLine === l}
                      className={`kit-drop-item${selectedLine === l ? ' selected' : ''}`}
                      onClick={() => { setSelectedLine(l); setLineDropOpen(false); }}
                    >
                      <span className={`dot dot--${LINE_CONFIG[l].badge}`} aria-hidden="true" />
                      {LINE_CONFIG[l].label}
                    </li>
                  ))}
                </ul>
              )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ▸ BLOQUE 2 — Filtros (4 piezas) ─────────────────────── */}
        <section className="kit-section-block kit-section-block--filters" aria-label="Filtros del kit">
          <header className="kit-section-label">
            <Filter size={13} aria-hidden="true" className="kit-section-icon kit-section-icon--filter" />
            <span>Filtros del Kit</span>
            <span className="kit-section-numbers">② ③ ④ ⑤</span>
          </header>

          {!kit ? (
            <div className="kit-alert-oem" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', borderLeft: '3px solid var(--text-3)', marginTop: '0.5rem' }}>
              <span className="kit-alert-text" style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: '1.4', display: 'block' }}>
                Filtros en verificación para este modelo.
              </span>
            </div>
          ) : (
            <div className="kit-filter-grid">
              {FILTRO_CONFIG.map(({ key, label, Icon, color }, idx) => {
                const filtro   = kit[key];
                const tienesku = filtroTieneSkuReal(filtro);
                const isFiltroInCart = items.some(i => i.id === `filtro-${bujia.id}-${key}`);
                return (
                  <div
                    key={key}
                    className={`kit-filter-card kit-filter-card--${color}${tienesku ? ' kit-filter-card--confirmed' : ''}`}
                    aria-label={`${label}: ${filtro?.tipo}`}
                  >
                    <div className="kit-filter-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                        <Icon size={12} aria-hidden="true" className="kit-filter-icon" />
                        <span className="kit-filter-name">{label}</span>
                        {filtro?.sku !== 'SELLADO' && filtro?.costo !== undefined && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #71717a)', marginLeft: 'auto', marginRight: '4px', fontWeight: 'bold' }}>
                            ${filtro.costo}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="kit-filter-number">{['②','③','④','⑤'][idx]}</span>
                        <button
                          className="kit-filter-add-btn"
                          onClick={() => addFiltro(bujia, key)}
                          disabled={isFiltroInCart}
                          title="Agregar pieza suelta"
                          style={{
                            background: isFiltroInCart ? 'var(--bg-3)' : 'var(--bg-2)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            color: isFiltroInCart ? 'var(--primary)' : 'var(--text-2)',
                            cursor: isFiltroInCart ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px 4px',
                          }}
                        >
                          <ShoppingBag size={10} />
                          <span style={{ fontSize: '0.6rem', marginLeft: '2px' }}>{isFiltroInCart ? '✓' : '+'}</span>
                        </button>
                      </div>
                    </div>
                    <span className="kit-filter-tipo">{filtro?.tipo}</span>

                  {filtro?.sku === 'SELLADO' ? (
                    /* ── FILTRO SELLADO (IN-TANK) ── */
                    <span
                      className="kit-filter-sku-tag kit-filter-sku-tag--pending"
                      style={{ color: 'var(--primary)', borderColor: 'var(--border-primary)', background: 'var(--primary-glow-sm)' }}
                    >
                      Filtro sellado (In-Tank) · No requiere cambio periódico
                    </span>
                  ) : tienesku ? (
                    /* ── SKU REAL ASIGNADO ── */
                    <div className="kit-filter-sku-real">
                      <div className="kit-filter-sku-winner">
                        {filtro.marca && (
                          <span className={`kit-filter-marca kit-filter-marca--${(filtro.marca || '').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') || 'default'}`}>
                            {filtro.marca}
                          </span>
                        )}
                        <span className="kit-filter-sku-code">{filtro.sku}</span>
                      </div>
                      {filtro.alternos && filtro.alternos.length > 0 && (
                        <div className="kit-filter-alternos">
                          {filtro.alternos.map((alt, i) => (
                             <div key={i} className={`kit-filter-alterno-chip alterno-${(alt.marca || '').toLowerCase()}`} title={`Alternativa compatible de ${alt.marca}`}>
                               <span className="alterno-marca">Alt. {alt.marca}</span>
                               <span className="alterno-sku">{alt.sku}</span>
                             </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── FALLBACK: sin SKU aún ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        className={`kit-filter-sku-tag${filtro?.hasData ? ' kit-filter-sku-tag--pending' : ' kit-filter-sku-tag--unknown'}`}
                        aria-label="SKU pendiente de asignación"
                      >
                        {filtro?.hasData
                          ? '📋 Consultar SKU con mostrador'
                          : 'Código en verificación · Cotizar por WhatsApp'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </section>

        {/* ▸ BLOQUE 3 — Aceite de Motor (6ta pieza) ─────────────────────── */}
        {kit && (
        <section className="kit-section-block kit-section-block--oil" aria-label="Aceite de motor recomendado">
          <header className="kit-section-label">
            <Droplet size={13} aria-hidden="true" className="kit-section-icon kit-section-icon--oil" style={{ color: 'var(--primary)' }} />
            <span>⑥ Aceite de Motor</span>
            <span className="kit-section-numbers">Recomendado</span>
          </header>

          <div className="kit-oil-card">
            <div className="kit-oil-fields-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1.2fr' }}>
              {/* Tipo */}
              <div className="oil-field-group">
                <label className="oil-field-label">Tipo</label>
                <select
                  className="oil-field-select"
                  value={aceiteSelected?.tecnologia || ''}
                  onChange={(e) => handleTechChange(e.target.value)}
                  disabled={anioVehiculo <= 2009}
                >
                  {anioVehiculo >= 2010 ? (
                    <>
                      <option value="Semisintético">Semi-Sintético</option>
                      <option value="Sintético">Sintético</option>
                    </>
                  ) : (
                    <option value="Mineral">Multigrado</option>
                  )}
                </select>
              </div>

              {/* Marca */}
              <div className="oil-field-group">
                <label className="oil-field-label">Marca</label>
                <select
                  className="oil-field-select"
                  value={aceiteSelected?.marca || ''}
                  onChange={(e) => setAceiteSelected(prev => ({ ...prev, marca: e.target.value }))}
                >
                  {MOTOR_OIL_BRANDS.map(brand => (
                    <option key={brand.id} value={brand.label}>{brand.label}</option>
                  ))}
                </select>
              </div>

              {/* Viscosidad */}
              <div className="oil-field-group">
                <label className="oil-field-label">Viscosidad</label>
                <select
                  className="oil-field-select"
                  value={aceiteSelected?.viscosidad || ''}
                  onChange={(e) => handleViscosityChange(e.target.value)}
                >
                  {anioVehiculo >= 2010 ? (
                    aceiteSelected?.tecnologia === 'Sintético' ? (
                      <option value="5W-30">5W-30</option>
                    ) : (
                      <>
                        <option value="5W-30">5W-30</option>
                        <option value="10W-30">10W-30</option>
                        <option value="10W-40">10W-40</option>
                      </>
                    )
                  ) : (
                    <>
                      <option value="20W-50">20W-50</option>
                      <option value="25W-50">25W-50</option>
                    </>
                  )}
                </select>
              </div>

              {/* Litros */}
              <div className="oil-field-group">
                <label className="oil-field-label">Cantidad</label>
                <select
                  className="oil-field-select"
                  value={aceiteSelected?.litros || 4}
                  onChange={(e) => {
                    const l = parseInt(e.target.value, 10);
                    let pres = 'Garrafa (4 Litros)';
                    if (l === 5) pres = 'Garrafa (5 Litros)';
                    else if (l > 5) pres = `Garrafa (4L) + ${l - 4} Botella(s) (1L)`;
                    setAceiteSelected(prev => ({ ...prev, litros: l, presentacion: pres }));
                  }}
                >
                  <option value={4}>4 Litros</option>
                  <option value={5}>5 Litros</option>
                  <option value={6}>6 Litros</option>
                  <option value={7}>7 Litros</option>
                  <option value={8}>8 Litros</option>
                </select>
              </div>
            </div>

            <div className="kit-oil-summary-row">
              <span className="oil-summary-tech-badge">
                Tecnología: {aceiteSelected?.tecnologia === 'Mineral' ? 'Multigrado' : aceiteSelected?.tecnologia === 'Semisintético' ? 'Semi-Sintético' : aceiteSelected?.tecnologia}
              </span>
              <span className="oil-summary-pres">
                {aceiteSelected?.presentacion}
              </span>
            </div>
          </div>
        </section>
        )}
          </>
        )}

        {/* ── Visual Blueprint Component Customizer Drawer ── */}
        <AnimatePresence>
          {activeComponent && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="blueprint-drawer"
            >
              <div className="blueprint-drawer-header">
                <span className="blueprint-drawer-title">
                  {React.createElement(activeComponent.icon, { size: 16, className: "text-violet-400" })}
                  {activeComponent.label}
                </span>
                <button
                  className="blueprint-drawer-close"
                  onClick={() => setActiveComponent(null)}
                  type="button"
                  aria-label="Cerrar"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="blueprint-drawer-body">
                {/* Bujías NGK Controls */}
                {activeComponent.id === 'bujias' && (
                  <>
                    {noBujias ? (
                      <div className="kit-alert-oem" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', borderLeft: '3px solid var(--text-3)' }}>
                        <span className="kit-alert-text" style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: '1.4', display: 'block' }}>
                          Bujías exclusivas de equipo original (Agencia).
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="blueprint-drawer-sku-box">
                          <span className="blueprint-drawer-label">SKU / Tipo de Bujía</span>
                          <span className="blueprint-drawer-value" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className="kit-sku-chip">{bujiaData?.tipo}</span>
                            {bujia.calibracion_mm && <span className="kit-cal-badge">{bujia.calibracion_mm}mm</span>}
                            {bujiaData?.codigo && <span className="kit-code-badge">#{bujiaData.codigo}</span>}
                          </span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '0.5rem', fontSize: '0.65rem' }}>
                            <span className="text-slate-500 font-mono">DISPONIBILIDAD:</span>
                            <span className="text-emerald-400 font-bold font-mono">EN EXISTENCIA (10+ pzas)</span>
                          </div>
                        </div>

                        {availableLines.length > 1 && (
                          <div className="oil-field-group">
                            <label className="oil-field-label">Línea NGK</label>
                            <select
                              className="oil-field-select"
                              value={selectedLine}
                              onChange={(e) => setSelectedLine(e.target.value)}
                            >
                              {availableLines.map(l => (
                                <option key={l} value={l}>{LINE_CONFIG[l].label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="blueprint-drawer-btn-row">
                          <button
                            className={`blueprint-drawer-primary-btn${piezaInCart ? ' blueprint-drawer-primary-btn--added' : ''}`}
                            onClick={handleAddBujia}
                            disabled={piezaInCart}
                            type="button"
                          >
                            {piezaInCart ? '✓ Bujías en Carrito' : '+ Agregar Solo Bujías'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Aceite de Motor Controls */}
                {activeComponent.id === 'aceite' && (
                  <>
                    <div className="blueprint-drawer-sku-box">
                      <span className="blueprint-drawer-label">Aceite Seleccionado</span>
                      <span className="blueprint-drawer-value">
                        {aceiteSelected ? formatOilName(aceiteSelected.tecnologia, aceiteSelected.viscosidad) : 'Sin aceite'}
                      </span>
                      <span className="oil-summary-tech-badge" style={{ marginTop: '0.25rem', width: 'fit-content' }}>
                        {aceiteSelected?.tecnologia === 'Mineral' ? 'Multigrado' : aceiteSelected?.tecnologia === 'Semisintético' ? 'Semi-Sintético' : aceiteSelected?.tecnologia}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '0.5rem', fontSize: '0.65rem' }}>
                        <span className="text-slate-500 font-mono">DISPONIBILIDAD:</span>
                        <span className="text-emerald-400 font-bold font-mono">EN EXISTENCIA (DISPONIBLE)</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="oil-field-group">
                        <label className="oil-field-label">Tipo</label>
                        <select
                          className="oil-field-select"
                          value={aceiteSelected?.tecnologia || ''}
                          onChange={(e) => handleTechChange(e.target.value)}
                          disabled={anioVehiculo <= 2009}
                        >
                          {anioVehiculo >= 2010 ? (
                            <>
                              <option value="Semisintético">Semi-Sintético</option>
                              <option value="Sintético">Sintético</option>
                            </>
                          ) : (
                            <option value="Mineral">Multigrado</option>
                          )}
                        </select>
                      </div>

                      <div className="oil-field-group">
                        <label className="oil-field-label">Marca</label>
                        <select
                          className="oil-field-select"
                          value={aceiteSelected?.marca || ''}
                          onChange={(e) => setAceiteSelected(prev => ({ ...prev, marca: e.target.value }))}
                        >
                          {MOTOR_OIL_BRANDS.map(brand => (
                            <option key={brand.id} value={brand.label}>{brand.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="oil-field-group">
                        <label className="oil-field-label">Viscosidad</label>
                        <select
                          className="oil-field-select"
                          value={aceiteSelected?.viscosidad || ''}
                          onChange={(e) => handleViscosityChange(e.target.value)}
                        >
                          {anioVehiculo >= 2010 ? (
                            aceiteSelected?.tecnologia === 'Sintético' ? (
                              <option value="5W-30">5W-30</option>
                            ) : (
                              <>
                                <option value="5W-30">5W-30</option>
                                <option value="10W-30">10W-30</option>
                                <option value="10W-40">10W-40</option>
                              </>
                            )
                          ) : (
                            <>
                              <option value="20W-50">20W-50</option>
                              <option value="25W-50">25W-50</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="oil-field-group">
                        <label className="oil-field-label">Cantidad</label>
                        <select
                          className="oil-field-select"
                          value={aceiteSelected?.litros || 4}
                          onChange={(e) => {
                            const l = parseInt(e.target.value, 10);
                            let pres = 'Garrafa (4 Litros)';
                            if (l === 5) pres = 'Garrafa (5 Litros)';
                            else if (l > 5) pres = `Garrafa (4L) + ${l - 4} Botella(s) (1L)`;
                            setAceiteSelected(prev => ({ ...prev, litros: l, presentacion: pres }));
                          }}
                        >
                          <option value={4}>4 Litros</option>
                          <option value={5}>5 Litros</option>
                          <option value={6}>6 Litros</option>
                          <option value={7}>7 Litros</option>
                          <option value={8}>8 Litros</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Filtros de Aceite/Aire/Gasolina/Cabina Controls */}
                {activeComponent.id.startsWith('filtro_') && (() => {
                  const filterKey = activeComponent.id;
                  const filtro = kit?.[filterKey];
                  const tienesku = filtroTieneSkuReal(filtro);
                  const isFiltroInCart = items.some(i => i.id === `filtro-${bujia.id}-${filterKey}`);

                  return (
                    <>
                      <div className="blueprint-drawer-sku-box">
                        <span className="blueprint-drawer-label">SKU / Estado del Filtro</span>
                        {filtro?.sku === 'SELLADO' ? (
                          <span className="blueprint-drawer-value" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                            Filtro sellado (In-Tank)
                          </span>
                        ) : tienesku ? (
                          <span className="blueprint-drawer-value">
                            {filtro.marca && (
                              <span className={`kit-filter-marca kit-filter-marca--${filtro.marca.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}`}>
                                {filtro.marca}
                              </span>
                            )}
                            <span>{filtro.sku}</span>
                          </span>
                        ) : (
                          <span className="blueprint-drawer-value" style={{ fontSize: '0.72rem', color: '#fbbf24' }}>
                            {filtro?.hasData ? '📋 Consultar SKU en mostrador' : 'Código en verificación'}
                          </span>
                        )}
                        {filtro?.costo !== undefined && filtro?.sku !== 'SELLADO' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>
                            Costo: <strong>${filtro.costo} MXN</strong>
                          </span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '0.5rem', fontSize: '0.65rem' }}>
                          <span className="text-slate-500 font-mono">DISPONIBILIDAD:</span>
                          {filtro?.sku === 'SELLADO' ? (
                            <span className="text-violet-400 font-bold font-mono">NO REQUIERE CAMBIO</span>
                          ) : tienesku ? (
                            <span className="text-emerald-400 font-bold font-mono">EN EXISTENCIA (8 pzas)</span>
                          ) : (
                            <span className="text-amber-500 font-bold font-mono">BAJO PEDIDO</span>
                          )}
                        </div>
                      </div>

                      {filtro?.alternos && filtro.alternos.length > 0 && (
                        <div className="oil-field-group">
                          <label className="oil-field-label">Alternativos compatibles</label>
                          <div className="blueprint-drawer-alternos">
                            {filtro.alternos.map((alt, idx) => (
                              <div key={idx} className="blueprint-drawer-alt-chip">
                                <strong>{alt.marca}:</strong> {alt.sku}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {filtro?.sku !== 'SELLADO' && (
                        <div className="blueprint-drawer-btn-row">
                          <button
                            className={`blueprint-drawer-primary-btn${isFiltroInCart ? ' blueprint-drawer-primary-btn--added' : ''}`}
                            onClick={() => addFiltro(bujia, filterKey)}
                            disabled={isFiltroInCart}
                            type="button"
                          >
                            {isFiltroInCart ? '✓ Ya en Carrito' : '+ Agregar Solo Filtro'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <button
                className="blueprint-drawer-secondary-btn"
                style={{ width: '100%', marginTop: '0.6rem' }}
                onClick={() => setActiveComponent(null)}
                type="button"
              >
                Volver al Plano
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end kit-sections */}

      {/* ── Footer / CTAs ───────────────────────────────────────────── */}
      <div className="kit-card-footer">

        {/* Individual bujías — cotizar via WhatsApp */}
        {!noBujias && (
          <div className="kit-footer-row kit-footer-row--secondary">
            <a
              className="btn-cotizar-bujias"
              href={whatsappBujiasUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Cotizar bujías ${lineConfig.label} por WhatsApp`}
            >
              <MessageCircle size={13} aria-hidden="true" />
              Cotizar Bujías
            </a>
            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
              <button
                className={`btn-cart-pieza${piezaInCart ? ' btn-cart-pieza--added' : ''}`}
                style={{ marginLeft: 0 }}
                onClick={handleAddBujia}
                disabled={piezaInCart}
                aria-label={piezaInCart ? 'Bujías ya en carrito' : `Agregar bujías ${lineConfig.label} al carrito`}
                aria-pressed={piezaInCart}
              >
                {piezaInCart ? '✓ Bujías' : '+ Agregar Solo Bujías'}
              </button>
              {kit && (
                <button
                  className={`btn-cart-pieza${kitInCart ? ' btn-cart-pieza--added' : ''}`}
                  style={{ marginLeft: 0 }}
                  onClick={() => !kitInCart && addKit(bujia, selectedLine, ['bujias'])}
                  disabled={kitInCart}
                  aria-label={kitInCart ? 'Filtros ya en carrito' : 'Agregar solo filtros al carrito'}
                  aria-pressed={kitInCart}
                >
                  <Filter size={13} /> {kitInCart ? 'Agregados' : '+ Solo Filtros'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* PRIMARY — Agregar Kit Completo 6 Piezas */}
        {kit && (
          <button
            className={`btn-add-kit-full${kitInCart || justAdded ? ' btn-add-kit-full--done' : ''}`}
            onClick={handleAddKit}
            disabled={kitInCart}
            aria-label={kitInCart ? 'Kit completo ya en carrito' : 'Agregar Kit de Afinación Completo (6 Piezas) al carrito'}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            {justAdded
              ? '¡Kit Agregado! ✓'
              : kitInCart
              ? 'Kit en Carrito ✓'
              : 'Agregar Kit de Afinación Completo (6 Piezas)'}
          </button>
        )}

      </div>
    </motion.article>
  );
}
