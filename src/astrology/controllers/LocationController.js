/**
 * LocationController
 * 
 * Handles HTTP requests/responses for location endpoints
 * Presentation layer - delegates to service layer
 */

const LocationService = require('../services/LocationService');

class LocationController {
  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * GET /locations/countries
   * Get list of countries
   */
  async getCountries(req, res) {
    try {
      this.locationService.init();
      
      const query = (req.query.q || "").trim();
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 10000)
        : 10000;

      const countries = query
        ? this.locationService.searchCountries(query, limit)
        : this.locationService.getAllCountries(limit);

      return res.json({ countries });
    } catch (error) {
      console.error("Error in getCountries:", error);
      return res.status(500).json({
        error: "Failed to fetch countries.",
        details: error.message
      });
    }
  }

  /**
   * GET /locations/cities
   * Get list of cities
   */
  async getCities(req, res) {
    try {
      this.locationService.init();
      
      const query = (req.query.q || "").trim();
      const country = (req.query.country || "").trim() || null;
      const limitParam = parseInt(req.query.limit, 10);
      const limit = Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 10000)
        : 10000;

      const cities = this.locationService.searchCities(query, country, limit);
      
      return res.json({ cities });
    } catch (error) {
      console.error("Error in getCities:", error);
      return res.status(500).json({
        error: "Failed to fetch cities.",
        details: error.message
      });
    }
  }
}

module.exports = LocationController;










