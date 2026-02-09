/**
 * GocharController
 * 
 * Handles HTTP requests/responses for gochar (transit) endpoints
 * Presentation layer - delegates to service layer
 */

const BirthDetails = require('../models/BirthDetails');
const GocharService = require('../services/GocharService');

class GocharController {
  constructor() {
    this.gocharService = new GocharService();
  }

  /**
   * POST /gochar
   * Calculate gochar (transit) positions for a given date/time
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
   *   // Transit date/time (optional, defaults to current time)
   *   transit_date_ad: { year, month, day },
   *   transit_time: { hour, minute },
   *   transit_location: { cityName, countryName, timezone } // optional, defaults to birth location
   * }
   */
  async calculateGochar(req, res) {
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

      // Extract transit date/time (optional)
      const transitDate = {};
      
      if (payload.transit_date_ad) {
        transitDate.year = payload.transit_date_ad.year;
        transitDate.month = payload.transit_date_ad.month;
        transitDate.day = payload.transit_date_ad.day;
      }
      
      if (payload.transit_time) {
        transitDate.hour = payload.transit_time.hour;
        transitDate.minute = payload.transit_time.minute;
      }
      
      if (payload.transit_location) {
        transitDate.cityName = payload.transit_location.cityName;
        transitDate.countryName = payload.transit_location.countryName;
        transitDate.timezone = payload.transit_location.timezone;
      }

      // Kundali type for gochar: lagna | chandra | surya | budha | shukra | mangal | guru | shani | ketu | rahu (matches Java app spinner)
      if (payload.kundali_type != null) {
        transitDate.kundaliType = payload.kundali_type;
      } else if (payload.kundaliType != null) {
        transitDate.kundaliType = payload.kundaliType;
      }

      // Calculate gochar
      const gocharData = await this.gocharService.calculateGochar(birthDetails, transitDate);

      return res.json(gocharData);
    } catch (error) {
      console.error("Error in calculateGochar:", error);
      
      // Handle specific error types
      if (error.message.includes("not found")) {
        return res.status(404).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: "Failed to calculate gochar.",
        details: error.message
      });
    }
  }
}

module.exports = GocharController;


