import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Trash2,
  ShoppingCart,
  ShoppingBag,
  Package,
  Zap,
  Filter,
  Droplet,
  Wind,
  Fuel,
  AirVent,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { NGK_LINE_LABELS } from '../lib/constants';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const SKU_FIELD = {
  iridium: 'bujia_iridium_ix',
  platino: 'bujia_g_power',
  vpower:  'bujia_v_power',
  stock:   'bujia_stock',
};

const getSkuData = (bujia, tipoLinea) => bujia[SKU_FIELD[tipoLinea]] ?? null;

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

  const kitPrice = React.useMemo(() => {
    let price = 0;
    const kit = bujia.kit_afinacion || {};
    const keys = ['filtro_aceite', 'filtro_aire', 'filtro_gasolina', 'filtro_cabina'];
    
    keys.forEach(k => {
      if (!isExcluded(k)) {
        price += (kit[k]?.costo !== undefined ? kit[k].costo : 85);
      }
    });

    if (!isExcluded('bujias')) {
      const bujiasPriceObj = bujia.kit_afinacion?.bujias?.[tipoLinea];
      const bujiasPrice = (bujiasPriceObj && bujiasPriceObj.precio_total !== undefined)
        ? bujiasPriceObj.precio_total
        : 200;
      price += bujiasPrice;
    }

    if (item.aceite_motor && !isExcluded('aceite_motor')) {
      price += 400;
    }

    return price;
  }, [bujia, excludedParts, item.aceite_motor]);

  return (
    <li className="drawer-item drawer-item--kit" role="listitem">
      {/* Kit banner */}
      <div className="drawer-kit-banner" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShoppingBag size={11} aria-hidden="true" />
          <span>Kit de Afinación Completo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="drawer-kit-pieces-badge" style={{ margin: 0 }}>
            {item.aceite_motor ? 6 - excludedParts.length : 5 - excludedParts.length} Piezas
          </span>
          <span className="drawer-kit-price-badge" style={{
            background: 'var(--primary-glow-sm, rgba(98, 168, 29, 0.15))',
            color: 'var(--primary)',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            padding: '1px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(98, 168, 29, 0.2)'
          }}>
            ${kitPrice.toLocaleString('es-MX')}
          </span>
        </div>
      </div>

      <div className="drawer-item-body">
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
            {filtros.map(({ key, label: fLabel, num, Icon }) => {
              const f = kit_afinacion?.[key];
              let tagText = 'Solicitado';
              if (isExcluded(key)) {
                tagText = 'Removido';
              } else if (f?.sku === 'SELLADO') {
                tagText = 'Sellado';
              } else if (f?.sku) {
                tagText = f.sku;
              }

              return (
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
                  <span className={`drawer-kit-check-tag${!isExcluded(key) && f?.sku && f.sku !== 'SELLADO' ? ' drawer-kit-check-tag--sku' : ''}`}>
                    {tagText}
                  </span>
                </li>
              );
            })}

            {/* 6️⃣ Aceite de Motor */}
            {item.aceite_motor && (
              <li className={`drawer-kit-check-row${isExcluded('aceite_motor') ? ' drawer-kit-check-row--excluded' : ''}`}>
                <button 
                  className="drawer-kit-part-toggle" 
                  onClick={() => onTogglePart(item.id, 'aceite_motor')}
                  aria-label={isExcluded('aceite_motor') ? "Añadir aceite de motor al kit" : "Remover aceite de motor del kit"}
                >
                  {isExcluded('aceite_motor') ? <X size={12} /> : <Check size={12} />}
                </button>
                <span className="drawer-kit-check-num">6️⃣</span>
                <Droplet size={11} aria-hidden="true" className="drawer-kit-check-icon" style={{ color: 'var(--primary)' }} />
                <span className="drawer-kit-check-label">Aceite de Motor ({item.aceite_motor.marca})</span>
                <span className={`drawer-kit-check-tag${!isExcluded('aceite_motor') ? ' drawer-kit-check-tag--sku' : ''}`}>
                  {isExcluded('aceite_motor') ? 'Removido' : `${item.aceite_motor.viscosidad} · ${item.aceite_motor.tecnologia}`}
                </span>
              </li>
            )}
          </ul>
        </div>
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

/* ─── FiltroDrawerItem ────────────────────────────────────────────────────── */

function FiltroDrawerItem({ item, onRemove }) {
  const { bujia, filterKey } = item;
  const f = bujia.kit_afinacion?.[filterKey];
  const labelTxt = filterKey === 'filtro_aceite' ? 'Aceite' : filterKey === 'filtro_aire' ? 'Aire' : filterKey === 'filtro_gasolina' ? 'Gasolina' : 'Cabina';
  const Icon = filterKey === 'filtro_aceite' ? Droplet : filterKey === 'filtro_aire' ? Wind : filterKey === 'filtro_gasolina' ? Fuel : AirVent;

  return (
    <li className="drawer-item" role="listitem">
      <div className={`drawer-item-bar stock`} aria-hidden="true" />
      <div className="drawer-item-content">
        <div className="drawer-item-top">
          <span className="drawer-item-vehicle">{bujia.marca} {bujia.modelo}</span>
          <button
            className="drawer-item-remove"
            onClick={onRemove}
            aria-label={`Eliminar filtro de ${labelTxt} para ${bujia.marca} ${bujia.modelo}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="drawer-item-meta">
          {bujia.anio_inicio}–{bujia.anio_fin} · {bujia.litros}L {bujia.cilindros_config}
          {bujia.motor ? ` · ${bujia.motor}` : ''}
        </p>
        <div className="drawer-item-row" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="drawer-item-badge stock" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon size={10} /> Filtro de {labelTxt}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="drawer-item-sku">{f?.sku && f.sku !== 'SELLADO' ? f.sku : 'Cotizar'}</span>
            {f?.sku !== 'SELLADO' && (
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                ${(f && f.costo !== undefined) ? f.costo : 85}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ─── CartDrawer ──────────────────────────────────────────────────────────── */

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    items, totalItems, subtotal,
    removeItem, removeKit, toggleKitPart, clearCart,
    isOpen, closeCart,
  } = useCart();

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

  const handleProceedToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const kitCount      = useMemo(() => items.filter(i => i.type === 'kit').length,   [items]);
  const piezaCount    = useMemo(() => items.filter(i => i.type === 'pieza').length, [items]);
  const filtrosCount  = useMemo(() => items.filter(i => i.type === 'filtro').length, [items]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="drawer-backdrop drawer-backdrop--open"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="cart-drawer cart-drawer--open"
            role="dialog"
            aria-label="Resumen de pedido"
            aria-modal="true"
            aria-hidden={false}
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
                        <Zap size={12} aria-hidden="true" />
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

                  {/* Individual filters */}
                  {filtrosCount > 0 && (
                    <>
                      <li className="drawer-group-header" role="presentation" aria-hidden="true">
                        <Filter size={12} aria-hidden="true" />
                        Filtros Individuales ({filtrosCount})
                      </li>
                      {items
                        .filter(i => i.type === 'filtro')
                        .map(item => (
                          <FiltroDrawerItem
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
                {/* ── Order Summary ── */}
                <div className="drawer-order-summary" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
                  <div className="drawer-summary-row" style={{ marginBottom: '1rem' }}>
                    <span className="drawer-summary-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal estimado</span>
                    <span className="drawer-summary-value" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      ${subtotal.toLocaleString('es-MX')}
                    </span>
                  </div>
                  <p className="drawer-summary-disclaimer">
                    * Envío y método de pago se seleccionarán en el checkout.
                  </p>
                </div>

                <button
                  className="w-full bg-[#62A81D] hover:bg-[#4e8717] text-white font-bold py-3.5 px-6 uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] select-none"
                  onClick={handleProceedToCheckout}
                  aria-label="Proceder al checkout para completar datos"
                  style={{ border: 'none', clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' }}
                >
                  Continuar con el Pago
                  <ChevronRight size={16} />
                </button>

                <button className="drawer-clear" onClick={clearCart}>
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
