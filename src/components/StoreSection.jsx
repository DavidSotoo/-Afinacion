import React from 'react';
import { MapPin, Clock, Phone, Navigation, Mail } from 'lucide-react';
import { WHATSAPP_NUMBER, STORE_FIXED_PHONE, STORE_PUBLIC_EMAIL } from '../lib/constants';

// 🔧 Cambia estas constantes con la dirección y número reales de tu tío
const STORE_NAME   = '+AFINACIÓN — Refaccionaria';
const STORE_ADDR   = 'Av. Circunvalación Oblatos 1982, San Martín, 44710 Guadalajara, Jal.';
const MAPS_URL     = 'https://www.google.com/maps/search/?api=1&query=Av+Circunvalacion+Oblatos+1982+Guadalajara';
const WA_MSG       = encodeURIComponent('¡Hola! Quiero pasar a recoger mi pedido de bujías NGK. ¿Cuál es su horario disponible hoy?');
const WA_URL       = `https://wa.me/${WHATSAPP_NUMBER}?text=${WA_MSG}`;

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
          <div className="store-contact-info" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} />
              <a href={`tel:${STORE_FIXED_PHONE}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                33 4749 9638
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} />
              <a href={`mailto:${STORE_PUBLIC_EMAIL}`} style={{ color: 'inherit', textDecoration: 'none' }}>{STORE_PUBLIC_EMAIL}</a>
            </div>
          </div>

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

        {/* Right — live interactive map embed */}
        <div className="store-map-wrap" aria-label="Vista del mapa" style={{ borderRadius: '8px' }}>
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(STORE_ADDR)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '280px', filter: 'invert(90%) hue-rotate(180deg) contrast(1.2) brightness(0.95)' }}
            allowFullScreen=""
            loading="lazy"
            title="Ubicación de la sucursal en Google Maps"
          />
        </div>

      </div>
    </section>
  );
}
