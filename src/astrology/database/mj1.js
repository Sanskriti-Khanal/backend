/**
 * MJ1 Database Service
 * 
 * Provides prediction data lookup from MJ1.db
 * Matches the original app's DatabaseData queries for varsafal and muntha predictions
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path (from dist/astrology/database or src/astrology/database)
const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'MJ1.db');
const ASTROLOGY_PREDICTION_DB_CANDIDATE_PATHS = [
  path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'astrology_predictions.db'),
  path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'astrology-predictions.db')
];

let db = null;
let astrologyPredictionDb = null;

/**
 * Initialize database connection
 */
function init() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}

/**
 * Initialize astrology prediction database connection
 */
function initAstrologyPredictionDb() {
  if (!astrologyPredictionDb) {
    const existingPath = ASTROLOGY_PREDICTION_DB_CANDIDATE_PATHS.find((p) => fs.existsSync(p));
    const dbPath = existingPath || ASTROLOGY_PREDICTION_DB_CANDIDATE_PATHS[0];
    astrologyPredictionDb = new Database(dbPath, { readonly: true });
  }
  return astrologyPredictionDb;
}

function _pickPredictionByGender(row, gender) {
  if (!row) return '';
  const male = row.PredictionMale ?? row.predictionmale ?? row.prediction_male ?? row.prediction ?? row.Prediction ?? '';
  const female = row.PredictionFemale ?? row.predictionfemale ?? row.prediction_female ?? row.prediction ?? row.Prediction ?? '';
  if (gender === 'महिला' || gender === 'महीला') {
    return female || male || '';
  }
  return male || '';
}

/**
 * House predictions from MJ1.db housepredictionnew (same source as legacy Java app).
 * Prefer this so edits to MJ1.db are reflected in jaatak bibaran.
 */
function getHousePredictionFromMj1HouseNew(houseID, planetID, gender = 'पुरुष') {
  const database = init();
  const h = parseInt(houseID, 10);
  const p = parseInt(planetID, 10);
  if (isNaN(h) || isNaN(p)) return '';

  try {
    const stmt = database.prepare(`
      SELECT PredictionMale, PredictionFemale FROM housepredictionnew
      WHERE HouseID = ? AND PlanetID = ?
    `);
    const row = stmt.get(h, p);
    if (row) {
      return _pickPredictionByGender(row, gender);
    }
  } catch (_) {
    /* table missing or schema drift — fall through */
  }
  return '';
}

/**
 * Read house prediction from astrology-prediction.db
 * Supports multiple possible column naming styles.
 */
function getHousePredictionFromAstrologyPredictionDb(houseID, planetID, gender = 'पुरुष') {
  const database = initAstrologyPredictionDb();
  const h = parseInt(houseID, 10);
  const p = parseInt(planetID, 10);
  if (isNaN(h) || isNaN(p)) return '';

  const queryAttempts = [
    {
      sql: `
        SELECT * FROM house_prediction
        WHERE house_id = ? AND planet_id = ?
      `,
      args: [h, p]
    },
    {
      sql: `
        SELECT * FROM house_prediction
        WHERE HouseID = ? AND PlanetID = ?
      `,
      args: [h, p]
    },
    {
      sql: `
        SELECT * FROM jatakbibaran
        WHERE HouseID = ? AND PlanetID = ?
      `,
      args: [h, p]
    }
  ];

  for (const attempt of queryAttempts) {
    try {
      const row = database.prepare(attempt.sql).get(...attempt.args);
      if (row) {
        return _pickPredictionByGender(row, gender);
      }
    } catch (_) {
      // Try next schema variation
    }
  }
  return '';
}

/**
 * True when birth gender should use स्त्री wording (वर्षफल / मुन्था templates).
 */
function isFemaleGender(gender) {
  if (gender == null || gender === '') return false;
  const g = String(gender).trim().toLowerCase();
  return (
    g === 'female' ||
    g === 'f' ||
    g === 'woman' ||
    g === 'महिला' ||
    g === 'महीला'
  );
}

/**
 * Replace तपाईं / तपाइ address with पुरुष or स्त्री for barshafal copy (longer substring first).
 * Gender अन्य / other leaves तपाईं unchanged.
 */
function applyBarshafalPersonLabel(text, gender) {
  if (!text) return text;
  if (gender != null && gender !== '') {
    const g = String(gender).trim();
    if (g === 'अन्य' || g.toLowerCase() === 'other') {
      return text;
    }
  }
  const label = isFemaleGender(gender) ? 'स्त्री' : 'पुरुष';
  return text.split('तपाईं').join(label).split('तपाइ').join(label);
}

/**
 * Get Muntha Lagna prediction
 * Matches: DatabaseData.getMunthaLagnaPrediction()
 * 
 * @param {string|number} ascID - Ascendant ID (1-12) - Muntha house
 * @param {string|null} [genderRaw] - Request gender; तपाईं→पुरुष/स्त्री when set
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getMunthaLagnaPrediction(ascID, genderRaw = null) {
  const database = initAstrologyPredictionDb();
  const parsedAscId = parseInt(ascID, 10);
  if (isNaN(parsedAscId)) return '';
  
  const queryAttempts = [
    {
      sql: `
        SELECT Prediction FROM muntha
        WHERE AscID = ?
      `,
      args: [parsedAscId]
    },
    {
      sql: `
        SELECT Prediction FROM muntha
        WHERE munthaID_2 = ?
      `,
      args: [parsedAscId]
    },
    {
      sql: `
        SELECT Prediction FROM muntha
        WHERE munthaID = ?
      `,
      args: [parsedAscId]
    }
  ];

  for (const attempt of queryAttempts) {
    try {
      const row = database.prepare(attempt.sql).get(...attempt.args);
      if (row && row.Prediction) {
        return applyBarshafalPersonLabel(row.Prediction, genderRaw);
      }
    } catch (_) {
      // Try next schema variation
    }
  }

  // Fallback to MJ1.db
  try {
    const legacyDb = init();
    const stmt = legacyDb.prepare(`
      SELECT Prediction FROM muntha
      WHERE AscID = ?
    `);
    const result = stmt.get(parsedAscId);
    if (result && result.Prediction) {
      return applyBarshafalPersonLabel(result.Prediction, genderRaw);
    }
  } catch (_) {
    // Return empty below
  }
  
  return '';
}

/**
 * Get Muntha Dasa prediction by Dasa
 * Matches: DatabaseData.getMunthaDasaPredictionBYDasa()
 * 
 * @param {string|number} ascID - Ascendant ID (1-12) - Muntha house
 * @param {string|number} houseID - House ID (1-12) - House where planet is located
 * @param {string|number} planetID - Planet ID (1-9)
 * @param {string|null} [genderRaw] - Request gender; तपाईं→पुरुष/स्त्री when set
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getMunthaDasaPredictionBYDasa(ascID, houseID, planetID, genderRaw = null) {
  const database = initAstrologyPredictionDb();
  const parsedAscId = parseInt(ascID, 10);
  const parsedHouseId = parseInt(houseID, 10);
  const parsedPlanetId = parseInt(planetID, 10);

  if (isNaN(parsedAscId) || isNaN(parsedHouseId) || isNaN(parsedPlanetId)) return '';
  
  const queryAttempts = [
    {
      sql: `
        SELECT Prediction FROM barsafal
        WHERE AscID = ? AND HouseID = ? AND PlanetID = ?
      `,
      args: [parsedAscId, parsedHouseId, parsedPlanetId]
    },
    {
      sql: `
        SELECT Prediction FROM varsafal
        WHERE AscID = ? AND HouseID = ? AND PlanetID = ?
      `,
      args: [parsedAscId, parsedHouseId, parsedPlanetId]
    }
  ];

  for (const attempt of queryAttempts) {
    try {
      const row = database.prepare(attempt.sql).get(...attempt.args);
      if (row && row.Prediction) {
        return applyBarshafalPersonLabel(row.Prediction, genderRaw);
      }
    } catch (_) {
      // Try next schema variation
    }
  }

  // Fallback to MJ1.db
  try {
    const legacyDb = init();
    const stmt = legacyDb.prepare(`
      SELECT Prediction FROM varsafal
      WHERE AscID = ? AND HouseID = ? AND PlanetID = ?
    `);
    const result = stmt.get(parsedAscId, parsedHouseId, parsedPlanetId);
    if (result && result.Prediction) {
      return applyBarshafalPersonLabel(result.Prediction, genderRaw);
    }
  } catch (_) {
    // Return empty below
  }
  
  return '';
}

/**
 * Planet ID mapping (1-9 to planet names)
 */
const PLANET_IDS = {
  1: 'sun',
  2: 'moon',
  3: 'mars',
  4: 'rahu',
  5: 'jupiter',
  6: 'saturn',
  7: 'mercury',
  8: 'ketu',
  9: 'venus'
};

/**
 * Get planet ID from planet name
 * 
 * @param {string} planetId - Planet ID (e.g., 'sun', 'moon')
 * @returns {number} Planet ID (1-9) or null
 */
function getPlanetID(planetId) {
  const mapping = {
    sun: 1,
    moon: 2,
    mars: 3,
    rahu: 4,
    jupiter: 5,
    saturn: 6,
    mercury: 7,
    ketu: 8,
    venus: 9
  };
  
  return mapping[planetId] || null;
}

/**
 * Get House prediction by Planet and House
 * Matches: DatabaseData.getHousePredictionBYPlanetNew()
 * 
 * @param {string|number} houseID - House ID (1-12)
 * @param {string|number} planetID - Planet ID (1-9)
 * @param {string} gender - Gender ('पुरुष' for male, 'महिला' for female, default: 'पुरुष')
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getHousePrediction(houseID, planetID, gender = 'पुरुष') {
  const h = parseInt(houseID, 10);
  const p = parseInt(planetID, 10);
  if (isNaN(h) || isNaN(p)) {
    return 'डाटा भेटिएन , माफ गर्नु होला। हाम्रो टिम लाई खबर गर्नु होला ।';
  }

  // 1) MJ1.db housepredictionnew (authoritative copy edited with muntha/varsafal)
  try {
    const fromMj1 = getHousePredictionFromMj1HouseNew(h, p, gender);
    if (fromMj1) return fromMj1;
  } catch (_) {
    /* fall through */
  }

  // 2) astrology-predictions.db (legacy duplicate)
  try {
    const prediction = getHousePredictionFromAstrologyPredictionDb(h, p, gender);
    if (prediction) return prediction;
  } catch (_) {
    return 'डाटा भेटिएन , माफ गर्नु होला। हाम्रो टिम लाई खबर गर्नु होला ।';
  }

  return 'डाटा भेटिएन , माफ गर्नु होला। हाम्रो टिम लाई खबर गर्नु होला ।';
}

/**
 * Get House prediction from old table (fallback)
 * Matches: DatabaseData.getHousePredictionBYPlanet()
 * 
 * @param {string|number} houseID - House ID (1-12)
 * @param {string|number} planetID - Planet ID (1-9)
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getHousePredictionOld(houseID, planetID) {
  const database = init();
  
  const stmt = database.prepare(`
    SELECT * FROM Houseprediction 
    WHERE HouseID = ? AND PlanetID = ?
  `);
  
  const result = stmt.get(parseInt(houseID), parseInt(planetID));
  
  if (result && result.Prediction) {
    return result.Prediction;
  }
  return '';
}

/**
 * Get Lagna-based Subha/Asubha prediction by Ascendant
 * Matches: DatabaseData.getSubhaAsubhaPredictionBYAsc()
 * 
 * @param {string|number} ascID - Ascendant sign (1-12)
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getSubhaAsubhaPredictionByAsc(ascID) {
  const database = init();
  
  const stmt = database.prepare(`
    SELECT content FROM subhaashubha 
    WHERE ascID = ?
  `);
  
  const result = stmt.get(parseInt(ascID));
  
  if (result && result.content) {
    return result.content;
  }
  return '';
}

/**
 * Get daily rasifal prediction from MJ1.db dailyrasifal.
 * Lookup dimensions:
 * - MoonTravelSign (current transit moon sign, 1-12)
 * - NativeMoonSign (birth moon sign, 1-12)
 * - Tithi bucket (current tithi id, 1-30)
 *
 * Uses half-open [start, end) bucket matching to avoid duplicate boundary matches.
 * Includes final bucket edge where tithiId=30 and TithiEndID=30.
 */
function getDailyRasifalPrediction(moonTravelSign, nativeMoonSign, tithiId) {
  const database = initAstrologyPredictionDb();
  const mts = parseInt(moonTravelSign, 10);
  const nms = parseInt(nativeMoonSign, 10);
  const tid = parseInt(tithiId, 10);

  if (
    Number.isNaN(mts) ||
    Number.isNaN(nms) ||
    Number.isNaN(tid) ||
    mts < 1 ||
    mts > 12 ||
    nms < 1 ||
    nms > 12 ||
    tid < 1 ||
    tid > 30
  ) {
    return '';
  }

  const queryAttempts = [
    {
      sql: `
        SELECT COALESCE(NULLIF(Prediction, ''), NULLIF(TithiEndID, '')) AS Prediction
        FROM dainikrashifal
        WHERE MoonTravelSign = ?
          AND NativeMoonSign = ?
          AND (
            (? >= TithiStartID AND ? < TithiEndID)
            OR (TithiEndID = 30 AND ? = 30)
          )
        ORDER BY TithiStartID DESC
        LIMIT 1
      `,
      args: [mts, nms, tid, tid, tid]
    },
    {
      // Some data exports only carry a single tithi marker
      sql: `
        SELECT COALESCE(NULLIF(Prediction, ''), NULLIF(TithiEndID, '')) AS Prediction
        FROM dainikrashifal
        WHERE MoonTravelSign = ?
          AND NativeMoonSign = ?
          AND TithiStartID = ?
        LIMIT 1
      `,
      args: [mts, nms, tid]
    },
    {
      sql: `
        SELECT Prediction
        FROM dailyrasifal
        WHERE MoonTravelSign = ?
          AND NativeMoonSign = ?
          AND (
            (? >= TithiStartID AND ? < TithiEndID)
            OR (TithiEndID = 30 AND ? = 30)
          )
        ORDER BY TithiStartID DESC
        LIMIT 1
      `,
      args: [mts, nms, tid, tid, tid]
    }
  ];

  for (const attempt of queryAttempts) {
    try {
      const row = database.prepare(attempt.sql).get(...attempt.args);
      if (row && row.Prediction) return row.Prediction;
    } catch (_) {
      // Try next schema variation
    }
  }

  // Fallback to MJ1.db
  try {
    const legacyDb = init();
    const stmt = legacyDb.prepare(`
      SELECT Prediction
      FROM dailyrasifal
      WHERE MoonTravelSign = ?
        AND NativeMoonSign = ?
        AND (
          (? >= TithiStartID AND ? < TithiEndID)
          OR (TithiEndID = 30 AND ? = 30)
        )
      ORDER BY TithiStartID DESC
      LIMIT 1
    `);
    const row = stmt.get(mts, nms, tid, tid, tid);
    return row && row.Prediction ? row.Prediction : '';
  } catch (_) {
    return '';
  }
}

/**
 * Close database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
  }
  if (astrologyPredictionDb) {
    astrologyPredictionDb.close();
    astrologyPredictionDb = null;
  }
}

module.exports = {
  init,
  close,
  getMunthaLagnaPrediction,
  getMunthaDasaPredictionBYDasa,
  getHousePrediction,
  getHousePredictionOld,
  getSubhaAsubhaPredictionByAsc,
  getDailyRasifalPrediction,
  getPlanetID,
  PLANET_IDS
};
