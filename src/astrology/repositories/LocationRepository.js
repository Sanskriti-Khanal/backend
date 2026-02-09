/**
 * LocationRepository
 * 
 * Data Access Layer for location-related database operations
 * Abstracts database access from business logic
 */

const thauharu = require('../database/thauharu');
const { Location, Country } = require('../models/Location');

class LocationRepository {
  /**
   * Initialize database connection
   */
  init() {
    thauharu.init();
  }

  /**
   * Get country by name and timezone
   * @param {string} countryName - Country name
   * @param {string} timezone - Timezone string
   * @returns {Country|null} Country object or null
   */
  getCountryByNameTimezone(countryName, timezone) {
    const data = thauharu.getCountryByNameTimezone(countryName, timezone);
    return data ? new Country(data) : null;
  }

  /**
   * Get city by name and country
   * @param {string} cityName - City name
   * @param {string} countryName - Country name
   * @returns {Location|null} Location object or null
   */
  getCityByName(cityName, countryName) {
    const data = thauharu.getCityByName(cityName, countryName);
    return data ? new Location(data) : null;
  }

  /**
   * Get city by city ID
   * @param {string} cityId - City ID
   * @returns {Location|null} Location object or null
   */
  getCityByCityId(cityId) {
    const data = thauharu.getCityByCityID(cityId);
    return data ? new Location(data) : null;
  }

  /**
   * Get GMT offset by country name and timezone
   * @param {string} countryName - Country name
   * @param {string} timezone - Timezone string
   * @returns {string|null} GMT offset as string or null
   */
  getGMT(countryName, timezone) {
    return thauharu.getGMT(countryName, timezone);
  }

  /**
   * Search cities by name
   * @param {string} cityName - City name (partial)
   * @param {string} countryName - Optional country name filter
   * @param {number} limit - Max results
   * @returns {Location[]} Array of Location objects
   */
  searchCities(cityName = "", countryName = null, limit = 50) {
    const results = thauharu.searchCities(cityName, countryName, limit);
    return results.map(data => new Location(data));
  }

  /**
   * Get all countries
   * @returns {Country[]} Array of Country objects
   */
  getAllCountries() {
    const results = thauharu.getAllCountries();
    return results.map(data => new Country(data));
  }

  /**
   * Search countries by name
   * @param {string} query - Search term
   * @param {number} limit - Max results
   * @returns {Country[]} Array of Country objects
   */
  searchCountries(query = "", limit = 50) {
    const results = thauharu.searchCountries(query, limit);
    return results.map(data => new Country(data));
  }

  /**
   * Close database connection
   */
  close() {
    thauharu.close();
  }
}

module.exports = LocationRepository;










