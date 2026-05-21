/**
 * lib/constants.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all brand-specific configuration.
 * Change WHATSAPP_NUMBER here and it propagates everywhere.
 * ─────────────────────────────────────────────────────────────
 */

/** WhatsApp number for +AFINACIÓN (52 = MX country code, no spaces/dashes) */
export const WHATSAPP_NUMBER = '523329245277';

/** Fixed phone number for visual display and direct calls */
export const STORE_FIXED_PHONE = '3347499638';

/** Public email for customer support */
export const STORE_PUBLIC_EMAIL = 'contacto@masafinaciones.com';

/** Private/Admin email for billing, providers, and finance */
export const STORE_ADMIN_EMAIL = 'administracion@masafinaciones.com';

/** Admin PIN — change before going to production */
export const ADMIN_PIN = '1234';

/** NGK spark plug lines — label map used by ProductCard, CartDrawer, AdminPage */
export const NGK_LINE_LABELS = {
  iridium: 'Iridium IX',
  platino: 'G-Power Platino',
  vpower:  'V-Power',
  stock:   'Stock / OEM',
};

/** Pagination page size for the admin table */
export const ADMIN_PAGE_SIZE = 20;

/** Store info — update with real address before launch */
export const STORE_INFO = {
  name:        '+AFINACIÓN — Refaccionaria',
  address:     'Av. Circunvalación Oblatos 1982, San Martin, 44710 Guadalajara, Jal.',
  mapsQuery:   'Av. Circunvalación Oblatos 1982, Guadalajara, Jal.',
  schedule: [
    { days: 'Lunes – Viernes', hours: '10:00 am – 7:00 pm' },
    { days: 'Sábado',          hours: '10:00 am – 3:00 pm' },
    { days: 'Domingo',         hours: 'Cerrado' },
  ],
};

/** Motor Oil Configuration Constants for tune-up kits */
export const MOTOR_OIL_BRANDS = [
  { id: 'mobil',        label: 'Mobil Super' },
  { id: 'castrol',      label: 'Castrol GTX' },
  { id: 'quaker_state', label: 'Quaker State' },
  { id: 'roshfrans',    label: 'Roshfrans' }
];

export const MOTOR_OIL_VISCOSITIES = ['0W-20', '5W-30', '5W-20', '10W-30', '15W-40', '20W-50'];

export const MOTOR_OIL_TECHNOLOGIES = [
  { id: 'sintetico',     label: 'Sintético' },
  { id: 'semisintetico', label: 'Semisintético' },
  { id: 'mineral',       label: 'Mineral' }
];
