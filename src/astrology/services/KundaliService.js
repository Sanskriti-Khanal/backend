/**
 * KundaliService
 * 
 * Business logic layer for kundali calculations
 * Orchestrates chart calculation using UniverseLite
 */

const UniverseLite = require('./UniverseLite');
const LocationService = require('./LocationService');

class KundaliService {
  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Calculate kundali chart
   * @param {Object} birthDetails - Birth details object
   * @param {boolean} isBalanced - Balanced/unbalanced mode for dasha calculation (default: true)
   * @returns {Promise<Object>} Chart data
   * @throws {Error} If calculation fails
   */
  async calculateChart(birthDetails, isBalanced = true) {
    // Initialize location service
    this.locationService.init();

    // Get normalized birth details
    const normalized = birthDetails.getNormalized();

    // Get location data
    const { city, country } = this.locationService.getLocationData(
      normalized.cityName,
      normalized.countryName,
      normalized.timezone
    );

    // Create UniverseLite instance
    const universe = new UniverseLite();
    
    // Set gender if provided
    if (normalized.gender) {
      universe.setGender(normalized.gender);
    }
    
    // Set location properties
    universe.setTimezone(country.timezone);
    universe.setLocCountry(country.name || normalized.countryName);
    if (city.cityId) {
      universe.setCityID(city.cityId.toString());
    }

    // Calculate chart
    await universe.calculate(
      normalized.year,
      normalized.month,
      normalized.day,
      normalized.hour,
      normalized.minute,
      city.latitude,
      city.latitudeDir,
      city.longitude,
      city.longitudeDir,
      parseFloat(country.gmt),
      city.cityName,
      country.name,
      normalized.name,
      country.timezone,
      isBalanced
    );

    // Get chart data
    const chartData = universe.getChartData();

    // Derive summary information
    const ascendantSign = chartData.ascendant.sign;
    const moon = chartData.planets.find(p => p.id === "moon" || p.name === "Moon");
    const moonSign = moon ? moon.sign : null;

    return {
      charts: {
        lagna: chartData.lagna,
        chandra: chartData.chandra,
        surya: chartData.surya,
        budha: chartData.budha,
        shukra: chartData.shukra,
        mangal: chartData.mangal,
        guru: chartData.guru,
        shani: chartData.shani,
        rahu: chartData.rahu,
        ketu: chartData.ketu,
        hora: chartData.hora,
        drekkana: chartData.drekkana,
        chaturthamsa: chartData.chaturthamsa,
        saptamsa: chartData.saptamsa,
        dashamsa: chartData.dashamsa,
        dwadasamsa: chartData.dwadasamsa,
        shodasamsa: chartData.shodasamsa,
        vimsamsa: chartData.vimsamsa,
        chaturvimsamsa: chartData.chaturvimsamsa,
        navamsa: chartData.navamsa
      },
      planets: chartData.planets,
      ascendant: chartData.ascendant,
      birthDetails: chartData.birthDetails,
      summary: {
        ascendant_sign: ascendantSign,
        moon_sign: moonSign,
        ayanamsa: universe.ayanamsa
      },
      dasha: chartData.dasha,
    };
  }

  /**
   * Calculate kundali chart using pre-resolved location (for Milan only).
   * Used when location is resolved from MJ1.db so results match myapp_java.
   * @param {Object} birthDetails - Birth details object
   * @param {Object} resolvedLocation - { city, country } from MJ1 or ThauHaru
   * @param {boolean} isBalanced - Balanced/unbalanced mode for dasha (default: true)
   * @returns {Promise<Object>} Chart data (same shape as calculateChart)
   */
  async calculateChartWithResolvedLocation(birthDetails, resolvedLocation, isBalanced = true) {
    const normalized = birthDetails.getNormalized();
    const { city, country } = resolvedLocation;

    const universe = new UniverseLite();
    if (normalized.gender) {
      universe.setGender(normalized.gender);
    }
    universe.setTimezone(country.timezone);
    universe.setLocCountry(country.name || normalized.countryName);
    if (city.cityId) {
      universe.setCityID(city.cityId.toString());
    }

    await universe.calculate(
      normalized.year,
      normalized.month,
      normalized.day,
      normalized.hour,
      normalized.minute,
      city.latitude,
      city.latitudeDir,
      city.longitude,
      city.longitudeDir,
      parseFloat(country.gmt),
      city.cityName,
      country.name,
      normalized.name,
      country.timezone,
      isBalanced
    );

    const chartData = universe.getChartData();
    const ascendantSign = chartData.ascendant.sign;
    const moon = chartData.planets.find(p => p.id === "moon" || p.name === "Moon");
    const moonSign = moon ? moon.sign : null;

    return {
      charts: {
        lagna: chartData.lagna,
        chandra: chartData.chandra,
        surya: chartData.surya,
        budha: chartData.budha,
        shukra: chartData.shukra,
        mangal: chartData.mangal,
        guru: chartData.guru,
        shani: chartData.shani,
        rahu: chartData.rahu,
        ketu: chartData.ketu,
        hora: chartData.hora,
        drekkana: chartData.drekkana,
        chaturthamsa: chartData.chaturthamsa,
        saptamsa: chartData.saptamsa,
        dashamsa: chartData.dashamsa,
        dwadasamsa: chartData.dwadasamsa,
        shodasamsa: chartData.shodasamsa,
        vimsamsa: chartData.vimsamsa,
        chaturvimsamsa: chartData.chaturvimsamsa,
        navamsa: chartData.navamsa
      },
      planets: chartData.planets,
      ascendant: chartData.ascendant,
      birthDetails: chartData.birthDetails,
      summary: {
        ascendant_sign: ascendantSign,
        moon_sign: moonSign,
        ayanamsa: universe.ayanamsa
      },
      dasha: chartData.dasha,
    };
  }
}

module.exports = KundaliService;

