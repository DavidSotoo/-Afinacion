import React, { useMemo } from 'react';
import { ShoppingCart, Droplet, Wind } from 'lucide-react';
import { useCart }         from '../context/CartContext';
import { WHATSAPP_NUMBER } from '../lib/constants';

/** Maps tipoLinea key → display label and which bujia field to read */
const LINE_CONFIG = {
  iridium: { label: 'Iridium IX',       field: 'bujia_iridium_ix', badge: 'iridium' },
  platino: { label: 'G-Power Platino',  field: 'bujia_g_power',    badge: 'platino' },
  vpower:  { label: 'V-Power',          field: 'bujia_v_power',    badge: 'vpower'  },
  stock:   { label: 'Stock / OEM',      field: 'bujia_stock',      badge: 'stock'   },
};

export default function ProductCard({ bujia, tipoLinea }) {
  const { addItem, items } = useCart();

  const config = LINE_CONFIG[tipoLinea];
  if (!config) return null;

  const { label, field, badge } = config;
  const data = bujia[field];
  if (!data?.tipo) return null;

  // ── Derived values (memoized) ─────────────────────────────────────────────
  const inCart = useMemo(
    () => items.some(i => i.id === `pieza-${bujia.id}-${tipoLinea}`),
    [items, bujia.id, tipoLinea],
  );

  const whatsappUrl = useMemo(() => {
    const msg = [
      `🔧 *Cotización +AFINACIÓN*`,
      ``,
      `🚗 *Vehículo:* ${bujia.marca} ${bujia.modelo}`,
      `📅 *Años:* ${bujia.anio_inicio} – ${bujia.anio_fin}`,
      `⚙️ *Motor:* ${bujia.litros}L ${bujia.cilindros_config}${bujia.motor ? ` (${bujia.motor})` : ''}`,
      ``,
      `✨ *Bujía NGK — ${label}*`,
      `📦 *SKU/Tipo:* ${data.tipo}`,
      `🔢 *Código NGK:* ${data.codigo ?? 'N/D'}`,
      `📐 *Calibración:* ${bujia.calibracion_mm}mm`,
      ``,
      `Por favor, confirmen disponibilidad y precio. ¡Gracias!`,
    ].join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [bujia, label, data]);

  const aspiracionLabel =
    bujia.aspiracion === 'T'  ? '⬡ TURBO' :
    bujia.aspiracion === 'SC' ? '⬡ SUPERCHARGED' : 'N/A';

  return (
    <article
      className="product-card"
      role="article"
      aria-label={`${bujia.marca} ${bujia.modelo} — ${label}`}
    >
      <div className={`card-type-bar ${badge}`} role="presentation" />

      <div className={`card-badge ${badge}`} aria-label={`Tipo de bujía: ${label}`}>
        <span className="dot" aria-hidden="true" />
        {label}
      </div>

      <h3 className="card-model">{bujia.marca} {bujia.modelo}</h3>
      <p className="card-engine">
        {bujia.cilindros_config} {bujia.litros}L — {bujia.motor || '—'} · {bujia.origen}
      </p>

      {/* Technical specs */}
      <dl className="card-specs">
        <div className="spec-item">
          <dt className="spec-label">Aspiración</dt>
          <dd className="spec-value">{aspiracionLabel}</dd>
        </div>
        <div className="spec-item">
          <dt className="spec-label">Años</dt>
          <dd className="spec-value">{bujia.anio_inicio} – {bujia.anio_fin}</dd>
        </div>
        <div className="spec-item">
          <dt className="spec-label">Calibración</dt>
          <dd className="spec-value">{bujia.calibracion_mm}mm ({bujia.calibracion_pulgadas}")</dd>
        </div>
        <div className="spec-item">
          <dt className="spec-label">Código NGK</dt>
          <dd className="spec-value">{data.codigo ?? 'N/D'}</dd>
        </div>
      </dl>

      <div className="card-sku">
        <span className="sku-label">SKU / Tipo:</span>
        <span className="sku-value">{data.tipo}</span>
      </div>

      {/* Kit de Afinación — coming soon placeholders */}
      <div className="kit-section" aria-label="Kit de afinación completo — próximamente">
        <p className="kit-title">⚙️ Kit de Afinación</p>
        <div className="kit-items">
          <div className="kit-item kit-coming-soon">
            <Droplet size={12} className="kit-icon" aria-hidden="true" />
            <span className="kit-label">Aceite recomendado</span>
            <span className="kit-tag">Próximamente</span>
          </div>
          <div className="kit-item kit-coming-soon">
            <Wind size={12} className="kit-icon" aria-hidden="true" />
            <span className="kit-label">Filtros</span>
            <span className="kit-tag">Próximamente</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-footer">
        <a
          className="btn-cotizar"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Cotizar por WhatsApp: ${bujia.marca} ${bujia.modelo} — ${label}`}
        >
          Cotizar
        </a>

        <button
          className={`btn-cart${inCart ? ' btn-cart--added' : ''}`}
          onClick={() => addItem(bujia, tipoLinea)}
          aria-label={inCart ? `${bujia.marca} ${bujia.modelo} ya en carrito` : `Agregar ${bujia.marca} ${bujia.modelo} al carrito`}
          aria-pressed={inCart}
        >
          <ShoppingCart size={14} aria-hidden="true" />
          {inCart ? '✓' : '+'}
        </button>
      </div>
    </article>
  );
}
