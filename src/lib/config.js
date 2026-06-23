/**
 * src/lib/config.js
 * ─────────────────────────────────────────────────────────────
 * Base configuration for API communication.
 * Resolves the server backend URL from env vars or falls back to localhost.
 * ─────────────────────────────────────────────────────────────
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, if we're visiting from a non-localhost address (e.g. mobile phone testing on local network)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
