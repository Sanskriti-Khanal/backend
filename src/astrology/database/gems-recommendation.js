/**
 * Gems Recommendation Database Service
 *
 * Reads lagna + house-combination gem recommendations from gems-recommendation.db.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'data',
  'astrology',
  'gems-recommendation.db'
);

let db = null;

function init() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}

function getAllGemstonePredictions() {
  const database = init();
  const stmt = database.prepare(`
    SELECT
      id,
      lagna,
      planets_in_1st,
      planets_in_5th,
      planets_in_9th,
      overall_prediction_male,
      overall_prediction_female,
      health_prediction_male,
      health_prediction_female,
      education_prediction_male,
      education_prediction_female,
      love_prediction_male,
      love_prediction_female,
      luck_prediction_male,
      luck_prediction_female,
      overall_gemstone,
      health_gemstone,
      education_gemstone,
      love_gemstone,
      luck_gemstone
    FROM gemstone_predictions
  `);
  return stmt.all();
}

function getPlanetIdByName({ planetName }) {
  const n = String(planetName || '').trim().toLowerCase();
  const map = {
    sun: 1,
    moon: 2,
    mars: 3,
    mercury: 4,
    jupiter: 5,
    venus: 6,
    saturn: 7,
    rahu: 8,
    ketu: 9,
  };
  return map[n] || null;
}

module.exports = {
  init,
  getAllGemstonePredictions,
  getPlanetIdByName,
};

