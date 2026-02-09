/**
 * KundaliController
 * 
 * Handles HTTP requests/responses for kundali endpoints
 * Presentation layer - delegates to service layer
 */

const BirthDetails = require('../models/BirthDetails');
const KundaliService = require('../services/KundaliService');

class KundaliController {
  constructor() {
    this.kundaliService = new KundaliService();
  }

  /**
   * POST /kundali
   * Calculate kundali chart
   */
  async calculateKundali(req, res) {
    try {
      const payload = req.body || {};
      const birthDetails = new BirthDetails(payload);

      // Validate request
      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      // Get isBalanced from request body (defaults to true if not provided)
      const isBalanced = payload.isBalanced !== undefined ? payload.isBalanced : true;
      
      // Calculate chart
      const chartData = await this.kundaliService.calculateChart(birthDetails, isBalanced);

      return res.json(chartData);
    } catch (error) {
      console.error("Error in calculateKundali:", error);
      
      // Handle specific error types
      if (error.message.includes("not found")) {
        return res.status(404).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: "Failed to calculate kundali.",
        details: error.message
      });
    }
  }
}

module.exports = KundaliController;










