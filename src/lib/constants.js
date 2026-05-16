/**
 * lib/constants.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all brand-specific configuration.
 * Change WHATSAPP_NUMBER here and it propagates everywhere.
 * ─────────────────────────────────────────────────────────────
 */

/** WhatsApp number for +AFINACIÓN (52 = MX country code, no spaces/dashes) */
export const WHATSAPP_NUMBER = '523312345678';

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
