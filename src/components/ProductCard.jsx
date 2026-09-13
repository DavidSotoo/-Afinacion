import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const data = config ? bujia[config.field] : null;
  // Hooks must run on every render (Rules of Hooks) — the invalid-config/no-data
  // cases bail out via `isValid` below and render nothing, but only *after* hooks.
  const isValid = Boolean(config && data?.tipo);

  // ── Derived values (memoized) ─────────────────────────────────────────────
  const inCart = useMemo(
    () => isValid && items.some(i => i.id === `pieza-${bujia.id}-${tipoLinea}`),
    [isValid, items, bujia.id, tipoLinea],
  );

  const whatsappUrl = useMemo(() => {
    if (!isValid) return '';
    const label = config.label;
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
  }, [isValid, bujia, config, data]);

  if (!isValid) return null;

  const { label, badge } = config;

  const aspiracionLabel =
    bujia.aspiracion === 'T'  ? '⬡ TURBO' :
    bujia.aspiracion === 'SC' ? '⬡ SUPERCHARGED' : 'N/A';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -4 }}
      className="product-card"
      role="article"
      aria-label={`${bujia.marca} ${bujia.modelo} — ${label}`}
    >
      <div className={`card-type-bar ${badge}`} role="presentation" />

      <div className={`card-badge ${badge}`} aria-label={`Tipo de bujía: ${label}`}>
        <span className="dot" aria-hidden="true" />
        ⚡ BUJÍA NGK {label.toUpperCase()}
      </div>

      <Link to={`/producto/${bujia.id}`} className="card-model-link">
        <h3 className="card-model">{bujia.marca} {bujia.modelo}</h3>
      </Link>
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
        <span className="sku-label" style={{ fontSize: '0.65rem' }}>Número de Parte (SKU):</span>
        <span className="sku-value">{data.tipo}</span>
      </div>

      {/* Kit de Afinación — availability */}
      <div className="kit-section" aria-label="Kit de afinación completo">
        <p className="kit-title">⚙️ Kit de Afinación</p>
        <div className="kit-items">
          <div className="kit-item kit-coming-soon">
            <Droplet size={12} className="kit-icon" aria-hidden="true" />
            <span className="kit-label">Aceite recomendado</span>
            <span className="kit-tag" style={{ color: bujia.kit_afinacion ? 'var(--primary)' : undefined }}>
              {bujia.kit_afinacion ? 'En Vista Kit' : 'Próximamente'}
            </span>
          </div>
          <div className="kit-item kit-coming-soon">
            <Wind size={12} className="kit-icon" aria-hidden="true" />
            <span className="kit-label">Filtros</span>
            <span className="kit-tag" style={{ color: bujia.kit_afinacion ? 'var(--primary)' : undefined }}>
              {bujia.kit_afinacion ? 'En Vista Kit' : 'Próximamente'}
            </span>
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
          COTIZAR BUJÍA
        </a>

        {/* UX-01: min 44×44px touch target per WCAG 2.5.5.
              touch-manipulation removes the 300ms tap delay on iOS. */}
        <button
          className={`btn-cart${inCart ? ' btn-cart--added' : ''}`}
          onClick={() => addItem(bujia, tipoLinea)}
          aria-label={inCart ? `${bujia.marca} ${bujia.modelo} ya en carrito` : `Agregar ${bujia.marca} ${bujia.modelo} al carrito`}
          aria-pressed={inCart}
          style={{ minHeight: '44px', minWidth: '44px', touchAction: 'manipulation' }}
        >
          <ShoppingCart size={14} aria-hidden="true" />
          {inCart ? '✓' : '+'}
        </button>
      </div>
    </motion.article>
  );
}
