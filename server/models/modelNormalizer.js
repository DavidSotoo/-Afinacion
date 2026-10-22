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
 *
 * Only alias two names when they are the SAME vehicle with the same brakes.
 * Never alias a performance trim (RS, R, GLI, GTI, Nismo, ...) to its base
 * model, or a model to a different vehicle sharing part of its name
 * (Corolla vs Corolla Cross, Outlander Sport vs Outlander): an alias makes
 * the store sell the other vehicle's brake pads, which is worse than showing
 * no pad at all.
 */

/** @type {Record<string, Record<string, string | string[]>>} brand → { alias → canonical } */
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
    // Express variants (catalog uses Express 1500/2500/3500)
    'EXPRESS CARGO':            'EXPRESS 1500',    // most common body
    'EXPRESS PASAJEROS':        'EXPRESS 1500',
    // Impala trim
    'IMPALA LIMITED':           'IMPALA',
    // Lumina APV is the minivan the catalog calls "Lumina Van" (the Lumina
    // sedan is a different vehicle and is deliberately NOT aliased)
    'LUMINA APV':               'LUMINA VAN',
    'CHEVY':                    ['CHEVY MONZA', 'CHEVY PICKUP'],
  },
  NISSAN: {
    // Kicks e-Power is same base platform
    'KICKS E-POWER':            'KICKS',
    // X-Trail e-Power
    'X-TRAIL E-POWER':          'X-TRAIL',
    // Frontier
    'FRONTIER':                 'NP300 FRONTIER',
  },
  VOLKSWAGEN: {
    // Golf sub-models
    'GOLF GTI':                 'GTI',             // catalog lists GTI separately
    'GOLF SPORTWAGEN':          'GOLF',
    // Touareg Hybrid → Touareg
    'TOUAREG HYBRID':           'TOUAREG',
    // Passat CC → CC (catalog uses "CC" directly)
    'PASSAT CC':                'CC',
    // Up! — different from "Up" but same entry
    'UP!':                      'UP',
    // Beetle
    'BEETLE':                   'BEETLE CABRIO',
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
    'MX-5 MIATA':               'MX-5',
  },
  FORD: {
    'E-150 ECONOLINE':          'ECONOLINE',
    'ECONOLINE VAN':            'ECONOLINE',
    'ECONOLINE WAGON':          'ECONOLINE',
  },
  DODGE: {
    'GRAND CARAVAN':            'CARAVAN',
    'H100 VAN':                 'H100',
    'RAM 1500':                 'RAM',
  },
  MITSUBISHI: {},
};

/**
 * Normalize a vehicle model name for matching against the balatas catalog.
 *
 * @param {string} brand  – e.g. "CHEVROLET"
 * @param {string} model  – e.g. "Silverado 2500 HD"
 * @returns {string[]}   – List of candidate names to check (upper-cased).
 *                         Always includes the original normalized + aliases.
 */
// The balatas catalog stores names without accents ("SEAT LEON"), while
// vehicles may carry them ("León").
function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getCandidateModels(brand, model) {
  const brandUpper = stripAccents((brand || '').toUpperCase().trim());
  const modelUpper = stripAccents((model || '').toUpperCase().trim());

  const candidates = new Set([modelUpper]);

  const aliases = MODEL_ALIASES[brandUpper] || {};
  const match = aliases[modelUpper];
  if (match) {
    if (Array.isArray(match)) {
      match.forEach(a => candidates.add(a));
    } else {
      candidates.add(match);
    }
  }

  // Secondary strip: remove common trailing descriptors that don't change
  // the brake hardware. Performance suffixes (RS, R, GLI, GTI, NISMO, ST, ...)
  // are intentionally absent — see the note at the top of this file.
  const genericStrip = modelUpper
    .replace(/\s+(HD|CLASSIC|LIMITED|HYBRID|CARGO|PASAJEROS|E-POWER)$/, '')
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
  const brandUpper = stripAccents((brand || '').toUpperCase().trim());
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
