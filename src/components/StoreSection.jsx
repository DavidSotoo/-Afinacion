import React from 'react';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';

// 🔧 Cambia estas constantes con la dirección y número reales de tu tío
const STORE_NAME   = '+AFINACIÓN — Refaccionaria';
const STORE_ADDR   = 'Av. Circunvalación Oblatos 1982, San Martin, 44710 Guadalajara, Jal.';
const MAPS_URL     = 'https://maps.app.goo.gl/UrW26uqTYLK94erv9';
const WHATSAPP_NUM = '523312345678'; // ← número real
const WA_MSG       = encodeURIComponent('¡Hola! Quiero pasar a recoger mi pedido de bujías NGK. ¿Cuál es su horario disponible hoy?');
const WA_URL       = `https://wa.me/${WHATSAPP_NUM}?text=${WA_MSG}`;

const SCHEDULE = [
  { days: 'Lunes – Viernes', hours: '10:00 am – 7:00 pm' },
  { days: 'Sábado',          hours: '10:00 am – 3:00 pm' },
  { days: 'Domingo',         hours: 'Cerrado' },
];

export default function StoreSection() {
  return (
    <section className="store-section" aria-labelledby="store-heading">
      <div className="store-inner">

        {/* Left — info */}
        <div className="store-info">
          <p className="store-eyebrow">
            <MapPin size={12} aria-hidden="true" /> Recoger en Tienda
          </p>
          <h2 className="store-title" id="store-heading">{STORE_NAME}</h2>
          <p className="store-address">{STORE_ADDR}</p>

          <div className="store-schedule" aria-label="Horarios de atención">
            <p className="schedule-heading">
              <Clock size={13} aria-hidden="true" /> Horario de atención
            </p>
            <ul className="schedule-list">
              {SCHEDULE.map(({ days, hours }) => (
                <li key={days} className={`schedule-item${hours === 'Cerrado' ? ' closed' : ''}`}>
                  <span className="schedule-days">{days}</span>
                  <span className="schedule-hours">{hours}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="store-actions">
            <a
              className="btn-maps"
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir ubicación en Google Maps"
            >
              <Navigation size={15} />
              Cómo llegar
            </a>
            <a
              className="btn-wa-store"
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Agendar recogida por WhatsApp"
            >
              <Phone size={15} />
              Agendar recogida
            </a>
          </div>
        </div>

        {/* Right — map embed placeholder */}
        <div className="store-map-wrap" aria-label="Vista del mapa">
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="store-map-link"
            aria-label="Ver en Google Maps"
          >
            <div className="store-map-placeholder">
              <MapPin size={40} className="map-pin-icon" />
              <p className="map-placeholder-text">Ver en Google Maps</p>
              <p className="map-placeholder-sub">San Martin, Guadalajara · Jal.</p>
            </div>
          </a>
        </div>

      </div>
    </section>
  );
}
