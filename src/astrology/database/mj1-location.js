/**
 * MJ1 Location lookup (for Kundali Milan only)
 *
 * Same role as ThauHaru for location: city, country, GMT.
 * Used only by MilanService so Milan results match myapp_java (which uses MJ1.db).
 * Other features (kundali, gochar, barshafal, etc.) keep using ThauHaru.
 *
 * MJ1 schema (Countries/Cities) matches DatabaseData in myapp_java.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'MJ1.db');

let db = null;

function init() {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
  }
  return db;
}

/**
 * Get country by name and timezone (case-insensitive)
 * Matches: DatabaseData.getCountryByNameTimezone()
 */
function getCountryByNameTimezone(countryName, timezone) {
  const database = init();
  const stmt = database.prepare(`
    SELECT * FROM Countries
    WHERE LOWER(TRIM(Names)) = LOWER(TRIM(?)) AND LOWER(TRIM(Timezone)) = LOWER(TRIM(?))
  `);
  const result = stmt.get((countryName || '').trim(), (timezone || '').trim());
  if (result) {
    return {
      countryID: result.CountryID,
      name: result.Names,
      gmt: result.Gmt,
      timezone: result.Timezone,
      timezoneDes: result.TimezoneDes
    };
  }
  return null;
}

/**
 * Get city by name and country (case-insensitive)
 * Matches: DatabaseData.getCityByName(cityName, countryName)
 */
function getCityByName(cityName, countryName) {
  const database = init();
  const stmt = database.prepare(`
    SELECT * FROM Cities
    WHERE LOWER(TRIM(Cityname)) = LOWER(TRIM(?)) AND LOWER(TRIM(Country)) = LOWER(TRIM(?))
  `);
  const result = stmt.get((cityName || '').trim(), (countryName || '').trim());
  if (result) {
    return {
      cityID: result.CityID,
      cityName: result.Cityname,
      country: result.Country,
      latitude: parseFloat(result.LatDegree) + (parseFloat(result.LatMinute) / 60.0),
      latitudeDir: result.LatDir,
      longitude: parseFloat(result.LonDegree) + (parseFloat(result.LonMinute) / 60.0),
      longitudeDir: result.LonDir,
      state: result.State
    };
  }
  return null;
}

/**
 * Get GMT offset by country name and timezone
 */
function getGMT(countryName, timezone) {
  const country = getCountryByNameTimezone(countryName, timezone);
  return country ? country.gmt : null;
}

module.exports = {
  init,
  getCountryByNameTimezone,
  getCityByName,
  getGMT
};
