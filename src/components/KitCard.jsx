import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recomendarAceiteDefault, calculateOilPrice } from '../lib/kitHelpers';

export default function KitCard({ bujia }) {
  const kit = bujia.kit_afinacion;
  const noBujias = !bujia.bujia_stock?.tipo && !bujia.bujia_iridium_ix?.tipo;
  const recomendacionAceite = useMemo(() => recomendarAceiteDefault(bujia), [bujia]);

  // Calculate confirmed count of components
  const confirmedCount = useMemo(() => {
    let count = 0;
    if (!noBujias) count += 1;
    if (kit?.filtro_aceite) count += 1;
    if (kit?.filtro_aire) count += 1;
    if (kit?.filtro_cabina) count += 1;
    if (kit?.filtro_gasolina) count += 1;
    if (recomendacionAceite) count += 1;
    return count;
  }, [noBujias, kit, recomendacionAceite]);

  // Calculate default total cost (stock plugs + oil + filters)
  const totalCost = useMemo(() => {
    if (!kit) return 0;
    const filtersCost = kit.costo_total ?? 340;
    
    let plugsCost = 0;
    if (!noBujias) {
      // Use stock bujías as default or first available line
      const defaultBujia = kit.bujias?.stock || kit.bujias?.vpower || kit.bujias?.platino || kit.bujias?.iridium;
      plugsCost = defaultBujia?.precio_total ?? 200;
    }

    // Default recommended oil cost
    let oilCost = 0;
    if (recomendacionAceite) {
      oilCost = calculateOilPrice(bujia.anio_inicio, recomendacionAceite.tecnologia, recomendacionAceite.capacidad_litros);
    } else {
      oilCost = calculateOilPrice(bujia.anio_inicio, 'Sintético', 4);
    }

    return filtersCost + plugsCost + oilCost;
  }, [kit, noBujias, bujia, recomendacionAceite]);

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
      className="kit-card kit-card-simplified"
      role="article"
      aria-label={`Kit de afinación: ${vehicleLabel}`}
    >
      <div className="kit-card-top-bar" aria-hidden="true" />
      
      <div className="kit-card-content-simplified">
        {/* Header: Vehicle and engine specs */}
        <div className="kit-card-header-simplified">
          <Link to={`/producto/${bujia.id}`} className="kit-card-title-link">
            <h3 className="kit-card-title">{vehicleLabel}</h3>
          </Link>
          <p className="kit-card-meta">
            {bujia.anio_inicio}–{bujia.anio_fin} · {motorLabel}
            {bujia.aspiracion === 'T'  ? ' · 🌀 TURBO'  : ''}
            {bujia.aspiracion === 'SC' ? ' · ⬡ S/C'    : ''}
          </p>
        </div>

        {/* Technical Summary Line */}
        <div className="kit-card-specs-simplified">
          <span className="specs-count">{confirmedCount} piezas incluidas</span>
          <span className={`specs-status-badge ${confirmedCount === 6 ? 'full' : 'partial'}`}>
            {confirmedCount === 6 ? 'Kit completo disponible' : `${confirmedCount} de 6 piezas confirmadas`}
          </span>
        </div>

        {/* Pricing & CTA */}
        <div className="kit-card-footer-simplified">
          <div className="price-display-simplified">
            <span className="price-desc">Precio Estimado Kit:</span>
            <div className="price-amount">
              <span className="currency">MXN</span>
              <span className="amount">
                ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <Link to={`/producto/${bujia.id}`} className="btn-view-product-cta">
            Ver Ficha Técnica →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
