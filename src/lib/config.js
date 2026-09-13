/**
 * src/lib/config.js
 * ─────────────────────────────────────────────────────────────
 * Base configuration for API communication.
 * Resolves the server backend URL from env vars or falls back to localhost.
 * ─────────────────────────────────────────────────────────────
 */

// Production backend (Render). Hardcoded as a safety net: VITE_API_URL lives in
// a gitignored .env file, so a build run without it previously fell through to
// `${hostname}:5000` — which resolved to the public domain itself on port 5000
// (nothing listening there) and silently broke the live site's catalog search.
const PROD_HOSTNAME = 'masafinacion.com';
const PROD_API_BASE = 'https://afinacion-backend.onrender.com';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === PROD_HOSTNAME || hostname.endsWith(`.${PROD_HOSTNAME}`)) {
      return PROD_API_BASE;
    }
    // Otherwise, if we're visiting from a non-localhost address (e.g. mobile phone testing on local network)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
  }
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
