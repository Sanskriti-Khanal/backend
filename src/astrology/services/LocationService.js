/**
 * LocationService
 * 
 * Business logic layer for location operations
 * Handles location-related business rules and validation
 */

const LocationRepository = require('../repositories/LocationRepository');

class LocationService {
  constructor() {
    this.repository = new LocationRepository();
  }

  /**
   * Initialize database connection
   */
  init() {
    this.repository.init();
  }

  /**
   * Get country by name and timezone
   * @param {string} countryName - Country name
   * @param {string} timezone - Timezone string
   * @returns {Object} Country data
   * @throws {Error} If country not found
   */
  getCountryByNameTimezone(countryName, timezone) {
    const country = this.repository.getCountryByNameTimezone(countryName, timezone);
    if (!country) {
      throw new Error(`Country/timezone not found: ${countryName}, ${timezone}`);
    }
    return country;
  }

  /**
   * Get city by name and country
   * @param {string} cityName - City name
   * @param {string} countryName - Country name
   * @returns {Object} City data
   * @throws {Error} If city not found
   */
  getCityByName(cityName, countryName) {
    const city = this.repository.getCityByName(cityName, countryName);
    if (!city) {
      throw new Error(`City not found: ${cityName}, ${countryName}`);
    }
    return city;
  }

  /**
   * Get location data (city and country) for birth details
   * @param {string} cityName - City name
   * @param {string} countryName - Country name
   * @param {string} timezone - Timezone string
   * @returns {Object} { city, country }
   * @throws {Error} If city or country not found
   */
  getLocationData(cityName, countryName, timezone) {
    const city = this.getCityByName(cityName, countryName);
    const country = this.getCountryByNameTimezone(countryName, timezone);
    return { city, country };
  }

  /**
   * Search cities
   * @param {string} query - Search term
   * @param {string} countryName - Optional country filter
   * @param {number} limit - Max results
   * @returns {Object[]} Array of city objects
   */
  searchCities(query = "", countryName = null, limit = 50) {
    return this.repository.searchCities(query, countryName, limit);
  }

  /**
   * Get all countries
   * @param {number} limit - Max results
   * @returns {Object[]} Array of country objects
   */
  getAllCountries(limit = 10000) {
    const countries = this.repository.getAllCountries();
    return countries.slice(0, limit);
  }

  /**
   * Search countries
   * @param {string} query - Search term
   * @param {number} limit - Max results
   * @returns {Object[]} Array of country objects
   */
  searchCountries(query = "", limit = 50) {
    return this.repository.searchCountries(query, limit);
  }
}

module.exports = LocationService;










