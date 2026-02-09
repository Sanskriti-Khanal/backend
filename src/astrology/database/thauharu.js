/**
 * ThauHaru Database Service
 * 
 * Provides location and timezone lookup from ThauHaru.db
 * Matches the original app's DatabaseData queries
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path (from dist/astrology/database or src/astrology/database)
const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'ThauHaru.db');

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
 * Get country by name and timezone (case-insensitive so app lowercase matches DB)
 * Matches: DatabaseData.getCountryByNameTimezone()
 * 
 * @param {string} countryName - Country name
 * @param {string} timezone - Timezone string
 * @returns {Object|null} Country data or null
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
 * Get city by name and country
 * Matches: DatabaseData.getCityByName()
 * 
 * @param {string} cityName - City name
 * @param {string} countryName - Country name
 * @returns {Object|null} City data or null
 */
function getCityByName(cityName, countryName) {
  const database = init();
  // Case-insensitive match so "biratnagar"/"nepal" from app finds "Biratnagar"/"Nepal" in DB
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
 * Get city by city ID
 * Matches: DatabaseData.getCityByCityID()
 * 
 * @param {string} cityID - City ID
 * @returns {Object|null} City data or null
 */
function getCityByCityID(cityID) {
  const database = init();
  
  const stmt = database.prepare(`
    SELECT * FROM Cities 
    WHERE CityID = ?
  `);
  
  const result = stmt.get(cityID);
  
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
 * Matches: DatabaseData.getGMT()
 * 
 * @param {string} countryName - Country name
 * @param {string} timezone - Timezone string
 * @returns {string|null} GMT offset as string (e.g., "5.75") or null
 */
function getGMT(countryName, timezone) {
  const country = getCountryByNameTimezone(countryName, timezone);
  return country ? country.gmt : null;
}

/**
 * Get country ID by name and timezone
 * 
 * @param {string} countryName - Country name
 * @param {string} timezone - Timezone string
 * @returns {string|null} Country ID or null
 */
function getCountryID(countryName, timezone) {
  const country = getCountryByNameTimezone(countryName, timezone);
  return country ? country.countryID.toString() : null;
}

/**
 * Search cities by name (partial match)
 * 
 * @param {string} cityName - City name (partial)
 * @param {string} countryName - Optional country name filter
 * @returns {Array} Array of matching cities
 */
function searchCities(cityName = "", countryName = null, limit = 50) {
  const database = init();
  
  let query = `
    SELECT * FROM Cities 
    WHERE Cityname LIKE ?
  `;
  const params = [`%${cityName}%`];
  
  if (countryName) {
    query += ` AND Country = ?`;
    params.push(countryName);
  }
  
  query += ` ORDER BY Cityname LIMIT ?`;
  params.push(limit);
  
  const stmt = database.prepare(query);
  const results = stmt.all(...params);
  
  return results.map(result => ({
    cityID: result.CityID,
    cityName: result.Cityname,
    country: result.Country,
    latitude: parseFloat(result.LatDegree) + (parseFloat(result.LatMinute) / 60.0),
    latitudeDir: result.LatDir,
    longitude: parseFloat(result.LonDegree) + (parseFloat(result.LonMinute) / 60.0),
    longitudeDir: result.LonDir,
    state: result.State
  }));
}

/**
 * Get all countries
 * 
 * @returns {Array} Array of all countries
 */
function getAllCountries() {
  const database = init();
  
  const stmt = database.prepare(`
    SELECT DISTINCT Names, Timezone, Gmt, TimezoneDes 
    FROM Countries 
    ORDER BY Names
  `);
  
  return stmt.all().map(result => ({
    name: result.Names,
    timezone: result.Timezone,
    gmt: result.Gmt,
    timezoneDes: result.TimezoneDes
  }));
}

/**
 * Search countries by name (partial match)
 *
 * @param {string} query - Search term
 * @param {number} limit - Max rows to return
 * @returns {Array} Array of matching countries
 */
function searchCountries(query = "", limit = 50) {
  const database = init();

  const stmt = database.prepare(`
    SELECT DISTINCT Names, Timezone, Gmt, TimezoneDes
    FROM Countries
    WHERE Names LIKE ?
       OR Timezone LIKE ?
    ORDER BY Names
    LIMIT ?
  `);

  const pattern = `%${query}%`;

  return stmt.all(pattern, pattern, limit).map(result => ({
    name: result.Names,
    timezone: result.Timezone,
    gmt: result.Gmt,
    timezoneDes: result.TimezoneDes
  }));
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
  getCountryByNameTimezone,
  getCityByName,
  getCityByCityID,
  getGMT,
  getCountryID,
  searchCities,
  searchCountries,
  getAllCountries
};


