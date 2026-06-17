/**
 * modelNormalizer.js
 * ──────────────────
 * Normalizes vehicle model names so that slight variants
 * (e.g. "Silverado 2500 HD" → "Silverado 2500") can match
 * the names used in the balatas collection (sourced from Wagner catalog).
 *
 * Strategy: maintain an explicit alias map per brand.
 * The normalizer is applied to the VEHICLE model name before comparison.
 * The balata vc.modelo is already in the canonical form.
 */

/** @type {Record<string, Record<string, string>>} brand → { alias → canonical } */
const MODEL_ALIASES = {
  CHEVROLET: {
    // Aveo variants
    'AVEO5':                    'AVEO',
    'AVEO 5':                   'AVEO',
    // Silverado suffix "HD" / "Classic" collapse to base
    'SILVERADO 1500 HD':        'SILVERADO 1500',
    'SILVERADO 1500 CLASSIC':   'SILVERADO 1500',
    'SILVERADO 2500 HD':        'SILVERADO 2500',
    'SILVERADO 3500 HD':        'SILVERADO 3500',
    // Suburban / C & K truck aliases
    'SUBURBAN':                 'SUBURBAN 1500',   // generic "Suburban" → 1500
    'C1500 SUBURBAN':           'SUBURBAN 1500',
    'C2500 SUBURBAN':           'SUBURBAN 2500',
    'K1500 SUBURBAN':           'SUBURBAN 1500',
    'K2500 SUBURBAN':           'SUBURBAN 2500',
    // K-series (4WD) map to C-series (catalog uses C)
    'K1500':                    'C1500',
    'K2500':                    'C2500',
    'K3500':                    'C3500',
    // Avalanche variants
    'AVALANCHE 2500':           'AVALANCHE 1500',
    // Express variants (catalog uses Express 1500/2500/3500)
    'EXPRESS CARGO':            'EXPRESS 1500',    // most common body
    'EXPRESS PASAJEROS':        'EXPRESS 1500',
    // Sonic trim
    'SONIC RS':                 'SONIC',
    // Impala trim
    'IMPALA LIMITED':           'IMPALA',
  },
  NISSAN: {
    // Nismo trims collapse to base
    '370Z NISMO':               '370Z',
    'SENTRA NISMO':             'SENTRA',
    // Kicks e-Power is same base platform
    'KICKS E-POWER':            'KICKS',
    // X-Trail e-Power
    'X-TRAIL E-POWER':          'X-TRAIL',
    // Z (2023) is the same as 370Z successor — no catalog entry
    // 200SX covered in older pages — no alias available yet
  },
  VOLKSWAGEN: {
    // GLI variants → base model
    'JETTA GLI':                'JETTA',
    'BORA GLI':                 'BORA',
    'CLASICO GLI':              'CLASICO',
    // Golf sub-models
    'GOLF GTI':                 'GTI',             // catalog lists GTI separately
    'GOLF R':                   'GOLF',
    'GOLF SPORTWAGEN':          'GOLF',
    // Polo GTI → Polo
    'POLO GTI':                 'POLO',
    // Touareg Hybrid → Touareg
    'TOUAREG HYBRID':           'TOUAREG',
    // Passat CC → CC (catalog uses "CC" directly)
    'PASSAT CC':                'CC',
    // Up! — different from "Up" but same entry
    'UP!':                      'UP',
  },
  HONDA: {
    // Accord variants
    'ACCORD CROSSTOUR':         'ACCORD',
    // CR-V / CRV spelling
    'CRV':                      'CR-V',
    // Fit = Jazz in some markets
    'JAZZ':                     'FIT',
  },
  TOYOTA: {
    // Toyota Truck prefix — catalog uses "Toyota Truck" for SUVs/pickups
    // Model names stored as plain in vehiculos
    'RAV4 HYBRID':              'RAV4',
    'YARIS R':                  'YARIS',
    'YARIS HB':                 'YARIS',
    'COROLLA HYBRID':           'COROLLA',
    'CAMRY HYBRID':             'CAMRY',
    'HIGHLANDER HYBRID':        'HIGHLANDER',
    '4RUNNER':                  '4RUNNER',
    'FJ CRUISER':               'FJ CRUISER',
  },
  MAZDA: {
    // Numeric model names in vehiculos DB ('3', '6', '5') map to
    // catalog names ('MAZDA 3', 'MAZDA 6', 'MAZDA 5') which the
    // ingestion stores as 'MAZDA 3' etc.
    // The matching uses getFullModelSearchKeys which builds "MAZDA 3"
    // from brand=MAZDA + model=3, so these already match.
    // Additional variants:
    'MAZDA3':                   'MAZDA 3',
    'MAZDA6':                   'MAZDA 6',
    'MAZDA5':                   'MAZDA 5',
    'CX5':                      'CX-5',
    'CX3':                      'CX-3',
    'CX7':                      'CX-7',
    'CX9':                      'CX-9',
  },
  DODGE: {
    'GRAND CARAVAN':            'CARAVAN',
    'H100 VAN':                 'H100',
    'RAM 1500':                 'RAM',
  },
  MITSUBISHI: {
    'ECLIPSE CROSS':            'ECLIPSE',
    'OUTLANDER SPORT':          'OUTLANDER',
    'MONTERO SPORT':            'MONTERO',
  },
};

/**
 * Normalize a vehicle model name for matching against the balatas catalog.
 *
 * @param {string} brand  – e.g. "CHEVROLET"
 * @param {string} model  – e.g. "Silverado 2500 HD"
 * @returns {string[]}   – List of candidate names to check (upper-cased).
 *                         Always includes the original normalized + aliases.
 */
function getCandidateModels(brand, model) {
  const brandUpper = (brand || '').toUpperCase().trim();
  const modelUpper = (model || '').toUpperCase().trim();

  const candidates = new Set([modelUpper]);

  const aliases = MODEL_ALIASES[brandUpper] || {};
  if (aliases[modelUpper]) {
    candidates.add(aliases[modelUpper]);
  }

  // Secondary strip: remove common trailing descriptors
  // e.g. "SILVERADO 3500 HD" → already handled above,
  // but as a generic fallback strip " HD", " CLASSIC", " NISMO", " GLI"
  const genericStrip = modelUpper
    .replace(/\s+(HD|CLASSIC|NISMO|RS|GLI|R|LIMITED|HYBRID|CARGO|PASAJEROS|E-POWER)$/, '')
    .trim();
  if (genericStrip && genericStrip !== modelUpper) {
    candidates.add(genericStrip);
  }

  return Array.from(candidates);
}

/**
 * Build all full model search keys for a vehicle (brand + model combinations).
 *
 * @param {string} brand
 * @param {string} model
 * @returns {string[]}  e.g. ["CHEVROLET SILVERADO 2500 HD", "CHEVROLET SILVERADO 2500"]
 */
function getFullModelSearchKeys(brand, model) {
  const brandUpper = (brand || '').toUpperCase().trim();
  const candidates = getCandidateModels(brand, model);
  // Return both "BRAND MODEL" and bare "MODEL" forms
  const keys = new Set();
  candidates.forEach(c => {
    keys.add(`${brandUpper} ${c}`);
    keys.add(c);
  });
  return Array.from(keys);
}

module.exports = { getCandidateModels, getFullModelSearchKeys };
