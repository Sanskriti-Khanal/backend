/**
 * MilanController
 *
 * Handles HTTP requests/responses for kundali milan endpoints.
 * When MILAN_USE_EXTERNAL_API=freeastrologyapi and FREE_ASTROLOGY_API_KEY are set,
 * uses Free Astrology API for Ashtakoot Milan; otherwise uses built-in MilanService.
 */

const MilanRequest = require('../models/MilanRequest');
const MilanService = require('../services/MilanService');
const MilanExternalService = require('../services/MilanExternalService');

function useExternalMilan() {
  const useExternal = process.env.MILAN_USE_EXTERNAL_API === 'freeastrologyapi';
  const apiKey = process.env.FREE_ASTROLOGY_API_KEY;
  return useExternal && apiKey;
}

class MilanController {
  constructor() {
    this.milanService = new MilanService();
    this.milanExternalService = new MilanExternalService();
  }

  /**
   * POST /kundali-milan
   * Calculate kundali milan (compatibility)
   */
  async calculateMilan(req, res) {
    try {
      const payload = req.body || {};
      const milanRequest = new MilanRequest(payload);

      // Validate request
      const validation = milanRequest.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      let milanData;
      if (useExternalMilan()) {
        milanData = await this.milanExternalService.calculateMilan(
          milanRequest.boy,
          milanRequest.girl,
          process.env.FREE_ASTROLOGY_API_KEY
        );
      } else {
        milanData = await this.milanService.calculateMilan(
          milanRequest.boy,
          milanRequest.girl
        );
      }

      return res.json(milanData);
    } catch (error) {
      console.error("Error in calculateMilan:", error);
      
      // Handle specific error types
      if (error.message.includes("not found")) {
        return res.status(404).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: "Failed to calculate kundali milan.",
        details: error.message
      });
    }
  }
}

module.exports = MilanController;










