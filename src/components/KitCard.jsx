import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useCart }             from '../context/CartContext';
import { WHATSAPP_NUMBER }     from '../lib/constants';
import { filtroTieneSkuReal }  from '../lib/kitDefaults';

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
  const { addKit, addItem, items } = useCart();

  // ── Local UI state ────────────────────────────────────────────────────────
  const defaultLine = ALL_LINES.find(l => bujia[LINE_CONFIG[l].field]?.tipo) ?? 'stock';
  const [selectedLine,  setSelectedLine]  = useState(defaultLine);
  const [lineDropOpen,  setLineDropOpen]  = useState(false);
  const [justAdded,     setJustAdded]     = useState(false);

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

  const kitInCart   = useMemo(() => items.some(i => i.id === kitCartId),   [items, kitCartId]);
  const piezaInCart = useMemo(() => items.some(i => i.id === piezaCartId), [items, piezaCartId]);

  // WhatsApp — bujías individuales only
  const whatsappBujiasUrl = useMemo(() => {
    if (!bujiaData?.tipo) return '#';
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

  if (!kit || !bujiaData?.tipo) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddKit = () => {
    addKit(bujia, selectedLine);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  const handleAddBujia = () => addItem(bujia, selectedLine);

  const vehicleLabel = `${bujia.marca} ${bujia.modelo}`;
  const motorLabel   = `${bujia.litros}L ${bujia.cilindros_config}${bujia.motor ? ` (${bujia.motor})` : ''}`;

  return (
    <article
      className={`kit-card${kitInCart ? ' kit-card--in-cart' : ''}`}
      role="article"
      aria-label={`Kit de afinación: ${vehicleLabel}`}
    >
      {/* ── Top neon bar ───────────────────────────────────────────── */}
      <div className="kit-card-top-bar" aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="kit-card-header">
        <div className="kit-card-title-wrap">
          <span className="kit-pieces-pill" aria-label="5 piezas">5 Piezas</span>
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

      {/* ── Content grid ────────────────────────────────────────────── */}
      <div className="kit-sections">

        {/* ▸ BLOQUE 1 — Bujías NGK ──────────────────────────────── */}
        <section className="kit-section-block kit-section-block--spark" aria-label="Bujías NGK">
          <header className="kit-section-label">
            <Zap size={13} aria-hidden="true" className="kit-section-icon kit-section-icon--spark" />
            <span>Bujías NGK</span>
            <span className="kit-section-number">①</span>
          </header>

          <div className="kit-spark-row">
            <span className="kit-sku-chip kit-sku-chip--main">{bujiaData.tipo}</span>
            <span className="kit-cal-badge">{bujia.calibracion_mm}mm</span>
            {bujiaData.codigo && (
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
        </section>

        {/* ▸ BLOQUE 2 — Filtros (4 piezas) ─────────────────────── */}
        <section className="kit-section-block kit-section-block--filters" aria-label="Filtros del kit">
          <header className="kit-section-label">
            <Filter size={13} aria-hidden="true" className="kit-section-icon kit-section-icon--filter" />
            <span>Filtros del Kit</span>
            <span className="kit-section-numbers">② ③ ④ ⑤</span>
          </header>

          <div className="kit-filter-grid">
            {FILTRO_CONFIG.map(({ key, label, Icon, color }, idx) => {
              const filtro   = kit[key];
              const tienesku = filtroTieneSkuReal(filtro);
              return (
                <div
                  key={key}
                  className={`kit-filter-card kit-filter-card--${color}${tienesku ? ' kit-filter-card--confirmed' : ''}`}
                  aria-label={`${label}: ${filtro?.tipo}`}
                >
                  <div className="kit-filter-card-header">
                    <Icon size={12} aria-hidden="true" className="kit-filter-icon" />
                    <span className="kit-filter-name">{label}</span>
                    <span className="kit-filter-number">{['②','③','④','⑤'][idx]}</span>
                  </div>
                  <span className="kit-filter-tipo">{filtro?.tipo}</span>

                  {tienesku ? (
                    /* ── SKU REAL ASIGNADO ── */
                    <div className="kit-filter-sku-real">
                      {filtro.marca && (
                        <span className="kit-filter-marca">{filtro.marca}</span>
                      )}
                      <span className="kit-filter-sku-code">{filtro.sku}</span>
                    </div>
                  ) : (
                    /* ── FALLBACK: sin SKU aún ── */
                    <span
                      className={`kit-filter-sku-tag${filtro?.hasData ? ' kit-filter-sku-tag--pending' : ' kit-filter-sku-tag--unknown'}`}
                      aria-label="SKU pendiente de asignación"
                    >
                      {filtro?.hasData
                        ? '📋 Consultar SKU con mostrador'
                        : '✦ Asignado automáticamente por motor'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>{/* end kit-sections */}

      {/* ── Footer / CTAs ───────────────────────────────────────────── */}
      <div className="kit-card-footer">

        {/* Individual bujías — cotizar via WhatsApp */}
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
          <button
            className={`btn-cart-pieza${piezaInCart ? ' btn-cart-pieza--added' : ''}`}
            onClick={handleAddBujia}
            disabled={piezaInCart}
            aria-label={piezaInCart ? 'Bujías ya en carrito' : `Agregar bujías ${lineConfig.label} al carrito`}
            aria-pressed={piezaInCart}
          >
            {piezaInCart ? '✓ En carrito' : '+ Solo Bujías'}
          </button>
        </div>

        {/* PRIMARY — Agregar Kit Completo 5 Piezas */}
        <button
          className={`btn-add-kit-full${kitInCart || justAdded ? ' btn-add-kit-full--done' : ''}`}
          onClick={handleAddKit}
          disabled={kitInCart}
          aria-label={kitInCart ? 'Kit completo ya en carrito' : 'Agregar Kit de Afinación Completo (5 Piezas) al carrito'}
        >
          <ShoppingBag size={17} aria-hidden="true" />
          {justAdded
            ? '¡Kit Agregado! ✓'
            : kitInCart
            ? 'Kit en Carrito ✓'
            : 'Agregar Kit de Afinación Completo (5 Piezas)'}
        </button>

      </div>
    </article>
  );
}
