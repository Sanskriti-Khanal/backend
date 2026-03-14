/**
 * MJ1 Database Service
 * 
 * Provides prediction data lookup from MJ1.db
 * Matches the original app's DatabaseData queries for varsafal and muntha predictions
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path (from dist/astrology/database or src/astrology/database)
const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'MJ1.db');

let db = null;

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
 * Get Muntha Lagna prediction
 * Matches: DatabaseData.getMunthaLagnaPrediction()
 * 
 * @param {string|number} ascID - Ascendant ID (1-12) - Muntha house
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getMunthaLagnaPrediction(ascID) {
  const database = init();
  
  const stmt = database.prepare(`
    SELECT Prediction FROM muntha 
    WHERE AscID = ?
  `);
  
  const result = stmt.get(parseInt(ascID));
  
  if (result && result.Prediction) {
    return result.Prediction;
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
 * @returns {string} Prediction text in Nepali (HTML formatted)
 */
function getMunthaDasaPredictionBYDasa(ascID, houseID, planetID) {
  const database = init();
  
  const stmt = database.prepare(`
    SELECT Prediction FROM varsafal 
    WHERE AscID = ? AND HouseID = ? AND PlanetID = ?
  `);
  
  const result = stmt.get(parseInt(ascID), parseInt(houseID), parseInt(planetID));
  
  if (result && result.Prediction) {
    return result.Prediction;
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
  4: 'mercury',
  5: 'jupiter',
  6: 'venus',
  7: 'saturn',
  8: 'rahu',
  9: 'ketu'
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
    mercury: 4,
    jupiter: 5,
    venus: 6,
    saturn: 7,
    rahu: 8,
    ketu: 9
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
  const database = init();
  const h = parseInt(houseID, 10);
  const p = parseInt(planetID, 10);
  if (isNaN(h) || isNaN(p)) {
    return 'डाटा भेटिएन , माफ गर्नु होला। हाम्रो टिम लाई खबर गर्नु होला ।';
  }

  const stmt = database.prepare(`
    SELECT * FROM housepredictionnew 
    WHERE HouseID = ? AND PlanetID = ?
  `);
  const result = stmt.get(h, p);

  if (result) {
    // Support both PascalCase and lowercase column names (SQLite may return as stored)
    const male = result.PredictionMale ?? result.predictionmale ?? '';
    const female = result.PredictionFemale ?? result.predictionfemale ?? '';
    if (gender === 'महिला' || gender === 'महीला') {
      return female || male || '';
    }
    return male || '';
  }

  // Fallback to old table when new table has no row (avoids "डाटा भेटिएन" when old has data)
  const oldResult = getHousePredictionOld(houseID, planetID);
  if (oldResult) return oldResult;

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
 * Close database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
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
  getPlanetID,
  PLANET_IDS
};
