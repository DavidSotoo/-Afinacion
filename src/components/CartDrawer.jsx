import React, { useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Trash2,
  ShoppingCart,
  ShoppingBag,
  Package,
  MessageCircle,
  Zap,
  Filter,
  Droplet,
  Wind,
  Fuel,
  AirVent,
} from 'lucide-react';
import { useCart }                        from '../context/CartContext';
import { WHATSAPP_NUMBER, NGK_LINE_LABELS } from '../lib/constants';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const SKU_FIELD = {
  iridium: 'bujia_iridium_ix',
  platino: 'bujia_g_power',
  vpower:  'bujia_v_power',
  stock:   'bujia_stock',
};

const getSkuData = (bujia, tipoLinea) => bujia[SKU_FIELD[tipoLinea]] ?? null;

/* ─── WhatsApp message builder ────────────────────────────────────────────── */

/**
 * Build the consolidated, professional WhatsApp message for the full cart.
 * Kit items use the exact format requested by the client:
 *
 *   🔧 *Pedido de Kit de Afinación - +AFINACIÓN*
 *   🚗 *Vehículo:* [Marca] [Modelo] [Año] [Motor]
 *   -----------------------------------------
 *   1️⃣ Bujías NGK: [Tipo] (SKU: [Código])
 *   2️⃣ Filtro de Aceite: (Solicitado para este motor)
 *   ...
 */
function buildConsolidatedMessage(items) {
  const kits   = items.filter(i => i.type === 'kit');
  const piezas = items.filter(i => i.type === 'pieza');
  const lines  = [];

  // ── Kits ──────────────────────────────────────────────────────────────────
  if (kits.length > 0) {
    kits.forEach((item) => {
      const { bujia, tipoLinea, kit_afinacion, excludedParts = [] } = item;
      const label      = NGK_LINE_LABELS[tipoLinea] || tipoLinea;
      const skuData    = getSkuData(bujia, tipoLinea);
      const anios      = `${bujia.anio_inicio}–${bujia.anio_fin}`;
      const motor      = `${bujia.litros}L ${bujia.cilindros_config}${bujia.motor ? ` (${bujia.motor})` : ''}`;
      const isExcluded = (key) => excludedParts.includes(key);

      lines.push(
        `🔧 *Pedido de Kit de Afinación - +AFINACIÓN*`,
        ``,
        `🚗 *Vehículo:* ${bujia.marca} ${bujia.modelo} ${anios} ${motor}`,
        `-----------------------------------------`,
        isExcluded('bujias') ? `~1️⃣ *Bujías NGK:* (❌ Removido por el cliente)~` : `1️⃣ *Bujías NGK:* ${label} (SKU: ${skuData?.tipo ?? 'N/D'})`,
        isExcluded('filtro_aceite') ? `~2️⃣ *Filtro de Aceite:* (❌ Removido por el cliente)~` : `2️⃣ *Filtro de Aceite:* (Solicitado para este motor)`,
        isExcluded('filtro_aire') ? `~3️⃣ *Filtro de Aire:* (❌ Removido por el cliente)~` : `3️⃣ *Filtro de Aire:* (Solicitado para este motor)`,
        isExcluded('filtro_gasolina') ? `~4️⃣ *Filtro de Gasolina:* (❌ Removido por el cliente)~` : `4️⃣ *Filtro de Gasolina:* (Solicitado para este motor)`,
        isExcluded('filtro_cabina') ? `~5️⃣ *Filtro de Cabina:* (❌ Removido por el cliente)~` : `5️⃣ *Filtro de Cabina:* (Solicitado para este motor)`,
        ``,
      );
    });
  }

  // ── Piezas individuales ────────────────────────────────────────────────────
  if (piezas.length > 0) {
    lines.push(`*── BUJÍAS INDIVIDUALES ──*`, ``);
    piezas.forEach((item, idx) => {
      const { bujia, tipoLinea } = item;
      const label   = NGK_LINE_LABELS[tipoLinea] || tipoLinea;
      const skuData = getSkuData(bujia, tipoLinea);
      lines.push(
        `*${idx + 1}. ${bujia.marca} ${bujia.modelo}*`,
        `   📅 ${bujia.anio_inicio}–${bujia.anio_fin} · ${bujia.litros}L ${bujia.cilindros_config}`,
        `   ✨ ${label} — ${skuData?.tipo ?? 'N/D'} | Código: ${skuData?.codigo ?? 'N/D'}`,
        `   📐 Calibración: ${bujia.calibracion_mm}mm`,
        ``,
      );
    });
  }

  lines.push(`Por favor, confirmen disponibilidad y precio. ¡Gracias!`);
  return lines.join('\n');
}

/* ─── KitDrawerItem ───────────────────────────────────────────────────────── */

function KitDrawerItem({ item, onRemove, onTogglePart }) {
  const { bujia, tipoLinea, kit_afinacion, excludedParts = [] } = item;
  const label   = NGK_LINE_LABELS[tipoLinea] || tipoLinea;
  const skuData = getSkuData(bujia, tipoLinea);

  const isExcluded = (key) => excludedParts.includes(key);

  const filtros = [
    { key: 'filtro_aceite',   label: 'Aceite',   num: '2️⃣', Icon: Droplet },
    { key: 'filtro_aire',     label: 'Aire',     num: '3️⃣', Icon: Wind   },
    { key: 'filtro_gasolina', label: 'Gasolina', num: '4️⃣', Icon: Fuel   },
    { key: 'filtro_cabina',   label: 'Cabina',   num: '5️⃣', Icon: AirVent},
  ];

  return (
    <li className="drawer-item drawer-item--kit" role="listitem">
      {/* Kit banner */}
      <div className="drawer-kit-banner">
        <ShoppingBag size={11} aria-hidden="true" />
        <span>Kit de Afinación Completo</span>
        <span className="drawer-kit-pieces-badge">5 Piezas</span>
      </div>

      <div className={`drawer-item-bar ${tipoLinea}`} aria-hidden="true" />

      <div className="drawer-item-content">
        {/* Vehicle header + remove */}
        <div className="drawer-item-top">
          <span className="drawer-item-vehicle">
            {bujia.marca} {bujia.modelo}
          </span>
          <button
            className="drawer-item-remove"
            onClick={onRemove}
            aria-label={`Eliminar kit ${bujia.marca} ${bujia.modelo}`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        <p className="drawer-item-meta">
          {bujia.anio_inicio}–{bujia.anio_fin} · {bujia.litros}L {bujia.cilindros_config}
          {bujia.motor ? ` · ${bujia.motor}` : ''}
        </p>

        {/* 5-piece checklist */}
        <ul className="drawer-kit-checklist" aria-label="Componentes del kit">
          {/* 1️⃣ Bujías */}
          <li className={`drawer-kit-check-row${isExcluded('bujias') ? ' drawer-kit-check-row--excluded' : ''}`}>
            <button 
              className="drawer-kit-part-toggle" 
              onClick={() => onTogglePart(item.id, 'bujias')}
              aria-label={isExcluded('bujias') ? "Añadir bujías al kit" : "Remover bujías del kit"}
            >
              {isExcluded('bujias') ? <X size={12} /> : <Check size={12} />}
            </button>
            <span className="drawer-kit-check-num">1️⃣</span>
            <Zap size={11} aria-hidden="true" className="drawer-kit-check-icon drawer-kit-check-icon--spark" />
            <span className="drawer-kit-check-label">Bujías NGK</span>
            <span className={`drawer-item-badge ${tipoLinea}`}>{label}</span>
            {skuData?.tipo && (
              <span className="drawer-kit-check-sku">{skuData.tipo}</span>
            )}
          </li>

          {/* 2️⃣ – 5️⃣ Filtros */}
          {filtros.map(({ key, label: fLabel, num, Icon }) => (
            <li key={key} className={`drawer-kit-check-row${isExcluded(key) ? ' drawer-kit-check-row--excluded' : ''}`}>
              <button 
                className="drawer-kit-part-toggle" 
                onClick={() => onTogglePart(item.id, key)}
                aria-label={isExcluded(key) ? `Añadir filtro de ${fLabel} al kit` : `Remover filtro de ${fLabel} del kit`}
              >
                {isExcluded(key) ? <X size={12} /> : <Check size={12} />}
              </button>
              <span className="drawer-kit-check-num">{num}</span>
              <Icon size={11} aria-hidden="true" className="drawer-kit-check-icon" />
              <span className="drawer-kit-check-label">Filtro de {fLabel}</span>
              <span className="drawer-kit-check-tag">
                {isExcluded(key) ? 'Removido' : 'Solicitado'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/* ─── PiezaDrawerItem ─────────────────────────────────────────────────────── */

function PiezaDrawerItem({ item, onRemove }) {
  const { bujia, tipoLinea } = item;
  const label   = NGK_LINE_LABELS[tipoLinea] || tipoLinea;
  const skuData = getSkuData(bujia, tipoLinea);

  return (
    <li className="drawer-item" role="listitem">
      <div className={`drawer-item-bar ${tipoLinea}`} aria-hidden="true" />
      <div className="drawer-item-content">
        <div className="drawer-item-top">
          <span className="drawer-item-vehicle">{bujia.marca} {bujia.modelo}</span>
          <button
            className="drawer-item-remove"
            onClick={onRemove}
            aria-label={`Eliminar ${bujia.marca} ${bujia.modelo}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="drawer-item-meta">
          {bujia.anio_inicio}–{bujia.anio_fin} · {bujia.litros}L {bujia.cilindros_config}
          {bujia.motor ? ` · ${bujia.motor}` : ''}
        </p>
        <div className="drawer-item-row">
          <span className={`drawer-item-badge ${tipoLinea}`}>{label}</span>
          <span className="drawer-item-sku">{skuData?.tipo ?? 'N/D'}</span>
        </div>
        <p className="drawer-item-cal">
          <span className="drawer-cal-label">Calibración:</span>
          <span className="drawer-cal-value">{bujia.calibracion_mm}mm ({bujia.calibracion_pulgadas}")</span>
        </p>
      </div>
    </li>
  );
}

/* ─── CartDrawer ──────────────────────────────────────────────────────────── */

export default function CartDrawer() {
  const { items, totalItems, removeItem, removeKit, toggleKitPart, clearCart, isOpen, closeCart } = useCart();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeCart(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeCart]);

  const whatsappUrl = useMemo(() =>
    isOpen && items.length > 0
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildConsolidatedMessage(items))}`
      : '#',
    [isOpen, items],
  );

  const kitCount   = useMemo(() => items.filter(i => i.type === 'kit').length,   [items]);
  const piezaCount = useMemo(() => items.filter(i => i.type === 'pieza').length, [items]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop${isOpen ? ' drawer-backdrop--open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`cart-drawer${isOpen ? ' cart-drawer--open' : ''}`}
        role="dialog"
        aria-label="Resumen de pedido"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* ── Header ── */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <ShoppingCart size={18} className="drawer-title-icon" aria-hidden="true" />
            <h2 className="drawer-title">Resumen de Pedido</h2>
            {totalItems > 0 && (
              <span className="drawer-count" aria-label={`${totalItems} ítems`}>{totalItems}</span>
            )}
          </div>
          <button className="drawer-close" onClick={closeCart} aria-label="Cerrar carrito">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <Package size={52} className="drawer-empty-icon" aria-hidden="true" />
              <p className="drawer-empty-title">Tu carrito está vacío</p>
              <p className="drawer-empty-sub">¡Arma tu Kit de Afinación completo!</p>
              <button className="drawer-close-cta" onClick={closeCart}>Explorar catálogo</button>
            </div>
          ) : (
            <ul className="drawer-items" aria-label="Productos en el carrito">

              {/* Kits first */}
              {kitCount > 0 && (
                <>
                  <li className="drawer-group-header" role="presentation" aria-hidden="true">
                    <ShoppingBag size={12} aria-hidden="true" />
                    Kits de Afinación ({kitCount})
                  </li>
                  {items
                    .filter(i => i.type === 'kit')
                    .map(item => (
                      <KitDrawerItem
                        key={item.id}
                        item={item}
                        onRemove={() => removeKit(item.id)}
                        onTogglePart={toggleKitPart}
                      />
                    ))}
                </>
              )}

              {/* Individual pieces */}
              {piezaCount > 0 && (
                <>
                  <li className="drawer-group-header" role="presentation" aria-hidden="true">
                    <Filter size={12} aria-hidden="true" />
                    Bujías Individuales ({piezaCount})
                  </li>
                  {items
                    .filter(i => i.type === 'pieza')
                    .map(item => (
                      <PiezaDrawerItem
                        key={item.id}
                        item={item}
                        onRemove={() => removeItem(item.id)}
                      />
                    ))}
                </>
              )}

            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-summary">
              <span className="drawer-summary-label">Total de ítems</span>
              <span className="drawer-summary-value">{totalItems}</span>
            </div>

            <a
              className="drawer-confirm-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Confirmar pedido completo por WhatsApp"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Confirmar Pedido por WhatsApp
            </a>

            <button className="drawer-clear" onClick={clearCart}>
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
