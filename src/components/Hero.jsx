import React from 'react';
import { Wrench, Zap, Car, Package } from 'lucide-react';

export default function Hero({ totalRecords, uniqueModels, brands }) {
  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        <div>
          <p className="hero-eyebrow">
            <Wrench size={12} aria-hidden="true" />
            Kit de Afinación Completo — 5 Piezas
          </p>
          <h1 className="hero-title" id="hero-heading">
            Encuentra el Kit<br />
            <em>Exacto para tu Auto</em>
          </h1>
          <p className="hero-sub">
            Bujías NGK + 4 filtros en un solo pedido.
            Selecciona tu vehículo y obtén el kit de afinación completo con
            SKUs exactos para tu motor.
          </p>

          {/* Feature pills */}
          <div className="hero-pills" aria-label="Características del kit">
            <span className="hero-pill">
              <Zap size={11} aria-hidden="true" /> Bujías NGK
            </span>
            <span className="hero-pill">
              <Package size={11} aria-hidden="true" /> 4 Filtros incluidos
            </span>
            <span className="hero-pill">
              <Car size={11} aria-hidden="true" /> Por motor
            </span>
          </div>
        </div>

        <div className="hero-stats" aria-label="Estadísticas del catálogo">
          <div className="stat-item">
            <div className="stat-num" id="stat-total">{totalRecords}<span>+</span></div>
            <div className="stat-label">Aplicaciones totales</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" id="stat-brands">{brands}</div>
            <div className="stat-label">Marcas disponibles</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">5</div>
            <div className="stat-label">Piezas por kit</div>
          </div>
          <div className="stat-item">
            <div className="stat-num" id="stat-models">{uniqueModels}</div>
            <div className="stat-label">Modelos cubiertos</div>
          </div>
        </div>
      </section>

      <div className="divider" role="separator" />
    </>
  );
}
