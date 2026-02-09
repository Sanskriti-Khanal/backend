/**
 * BarshafalController
 * 
 * Handles HTTP requests/responses for barshafal (annual predictions) endpoints
 * Presentation layer - delegates to service layer
 */

const BirthDetails = require('../models/BirthDetails');
const BarshafalService = require('../services/BarshafalService');

class BarshafalController {
  constructor() {
    this.barshafalService = new BarshafalService();
  }

  /**
   * POST /barshafal
   * Calculate barshafal (annual predictions) for a given BS year
   * 
   * Request body:
   * {
   *   // Birth details (required)
   *   name: string,
   *   gender: string,
   *   date_ad: { year, month, day },
   *   time: { hour, minute },
   *   location: { cityName, countryName, timezone },
   *   
   *   // BS year (required)
   *   bs_year: number (e.g., 2081)
   * }
   */
  async calculateBarshafal(req, res) {
    try {
      const payload = req.body || {};
      
      // Validate birth details
      const birthDetails = new BirthDetails(payload);
      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      // Validate BS year
      const bsYear = payload.bs_year;
      if (!bsYear || typeof bsYear !== 'number' || bsYear < 1970 || bsYear > 2250) {
        return res.status(400).json({
          error: "Invalid BS year. Must be between 1970 and 2250."
        });
      }

      // Calculate barshafal
      const barshafalData = await this.barshafalService.calculateBarshafal(birthDetails, bsYear);

      return res.json(barshafalData);
    } catch (error) {
      console.error("Error in calculateBarshafal:", error);
      
      // Handle specific error types
      if (error.message.includes("not found")) {
        return res.status(404).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: "Failed to calculate barshafal.",
        details: error.message
      });
    }
  }
}

module.exports = BarshafalController;


