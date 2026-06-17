/**
 * src/lib/config.js
 * ─────────────────────────────────────────────────────────────
 * Base configuration for API communication.
 * Resolves the server backend URL from env vars or falls back to localhost.
 * ─────────────────────────────────────────────────────────────
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
