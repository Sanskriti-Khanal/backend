/**
 * Enhanced Kundali Controller
 * 
 * Handles HTTP requests for comprehensive kundali calculations
 */

const BirthDetails = require('../models/BirthDetails');
const EnhancedKundaliService = require('../services/EnhancedKundaliService');
const KundaliService = require('../services/KundaliService');
const LocationService = require('../services/LocationService');
const GrahaSthitiAnalysisService = require('../services/GrahaSthitiAnalysisService');
const CategorizedRecommendationService = require('../services/CategorizedRecommendationService');

class EnhancedKundaliController {
  constructor() {
    this.service = new EnhancedKundaliService();
    this.kundaliService = new KundaliService();
    this.locationService = new LocationService();
  }

  /**
   * Resolve latitude/longitude from city/country if not in payload
   */
  _resolveLocation(payload) {
    if (!payload.location) return payload;
    if (payload.location.latitude != null && payload.location.longitude != null) {
      return payload;
    }
    try {
      this.locationService.init();
      const { cityName, countryName, timezone } = payload.location;
      const { city } = this.locationService.getLocationData(cityName, countryName, timezone || '');
      if (city && city.latitude != null && city.longitude != null) {
        const lat = (city.latitudeDir === 'S' ? -1 : 1) * (typeof city.latitude === 'number' ? city.latitude : parseFloat(city.latitude));
        const lon = (city.longitudeDir === 'W' ? -1 : 1) * (typeof city.longitude === 'number' ? city.longitude : parseFloat(city.longitude));
        payload = { ...payload, location: { ...payload.location, latitude: lat, longitude: lon } };
      }
    } catch (e) {
      // ignore
    }
    return payload;
  }

  /**
   * POST /enhanced-kundali
   * Calculate complete kundali
   */
  async calculateCompleteKundali(req, res) {
    try {
      let payload = req.body || {};
      payload = this._resolveLocation(payload);
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      // Get isBalanced from request body (defaults to true if not provided)
      const isBalanced = payload.isBalanced !== undefined ? payload.isBalanced : true;
      const chartData = await this.service.calculateCompleteKundali(birthDetails, isBalanced);
      return res.json(chartData);
    } catch (error) {
      console.error("Error in calculateCompleteKundali:", error);
      return res.status(500).json({
        error: "Failed to calculate kundali.",
        details: error.message
      });
    }
  }

  /**
   * POST /enhanced-kundali/divisional/:chartType
   * Get specific divisional chart
   */
  async getDivisionalChart(req, res) {
    try {
      const chartType = req.params.chartType;
      const payload = req.body || {};
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      const chartData = await this.service.calculateCompleteKundali(birthDetails);
      const divisionalChart = chartData.divisionalCharts[chartType];

      if (!divisionalChart) {
        return res.status(404).json({
          error: `Divisional chart '${chartType}' not found.`
        });
      }

      return res.json({
        chartType: chartType,
        chart: divisionalChart
      });
    } catch (error) {
      console.error("Error in getDivisionalChart:", error);
      return res.status(500).json({
        error: "Failed to get divisional chart.",
        details: error.message
      });
    }
  }

  /**
   * POST /enhanced-kundali/dasha/:dashaType
   * Get specific dasha system
   */
  async getDasha(req, res) {
    try {
      const dashaType = req.params.dashaType;
      const payload = req.body || {};
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      // Get isBalanced from request body (defaults to true if not provided)
      const isBalanced = payload.isBalanced !== undefined ? payload.isBalanced : true;
      const chartData = await this.service.calculateCompleteKundali(birthDetails, isBalanced);
      const dashaData = chartData.dashas[dashaType];

      if (!dashaData) {
        return res.status(404).json({
          error: `Dasha system '${dashaType}' not found.`
        });
      }

      return res.json({
        dashaType: dashaType,
        dasha: dashaData
      });
    } catch (error) {
      console.error("Error in getDasha:", error);
      return res.status(500).json({
        error: "Failed to get dasha.",
        details: error.message
      });
    }
  }

  /**
   * POST /enhanced-kundali/jaatak-details
   * Get जातक विवरण (Jaatak Details) - native details with house-wise predictions.
   * Uses Kundali (UniverseLite) chart so ग्रह स्थिति and घर अनुसार ग्रह विवरण use the same houses.
   */
  async getJaatakDetails(req, res) {
    try {
      let payload = req.body || {};
      payload = this._resolveLocation(payload);
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid request.',
          details: validation.errors
        });
      }

      const isBalanced = payload.isBalanced !== undefined ? payload.isBalanced : true;
      let kundaliChart = null;
      try {
        kundaliChart = await this.kundaliService.calculateChart(birthDetails, isBalanced);
      } catch (e) {
        // Fall back to enhanced-kundali-only if Kundali service fails
      }
      const jaatakDetails = await this.service.getJaatakDetails(birthDetails, kundaliChart);
      return res.json(jaatakDetails);
    } catch (error) {
      console.error('Error in getJaatakDetails:', error);
      return res.status(500).json({
        error: 'Failed to get जातक विवरण (Jaatak details).',
        details: error.message
      });
    }
  }

  /**
   * POST /enhanced-kundali/graha-sthiti-analysis
   * Get Graha Sthiti analysis: yogas, life areas, gemstone and Rudraksha recommendations.
   * Fetches planetary positions (sign, house, nakshatra) from Kundali result — no hardcoded data.
   */
  async getGrahaSthitiAnalysis(req, res) {
    try {
      let payload = req.body || {};
      payload = this._resolveLocation(payload);
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid request.',
          details: validation.errors
        });
      }

      const isBalanced = payload.isBalanced !== undefined ? payload.isBalanced : true;
      let kundaliChart = null;
      try {
        kundaliChart = await this.kundaliService.calculateChart(birthDetails, isBalanced);
      } catch (e) {
        return res.status(500).json({
          error: 'Failed to calculate Kundali chart. Graha Sthiti analysis requires chart data.',
          details: e && e.message ? e.message : 'Unknown error'
        });
      }

      const grahaSthitiResult = GrahaSthitiAnalysisService.analyzeGrahaSthiti({
        planets: kundaliChart.planets || [],
        ascendant: kundaliChart.ascendant || {}
      });

      return res.json(grahaSthitiResult);
    } catch (error) {
      console.error('Error in getGrahaSthitiAnalysis:', error);
      return res.status(500).json({
        error: 'Failed to get Graha Sthiti analysis.',
        details: error.message
      });
    }
  }

  /**
   * POST /enhanced-kundali/categorized-recommendations
   * Analyze chart → recommend gems/rudraksha by category.
   * Returns: yogasDetected, yogasSummary, categories (analysis, gems, rudraksha), specialRudraksha.
   */
  async getCategorizedRecommendations(req, res) {
    try {
      let payload = req.body || {};
      payload = this._resolveLocation(payload);
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid request.',
          details: validation.errors
        });
      }

      const isBalanced = payload.isBalanced !== undefined ? payload.isBalanced : true;
      let kundaliChart = null;
      try {
        kundaliChart = await this.kundaliService.calculateChart(birthDetails, isBalanced);
      } catch (e) {
        return res.status(500).json({
          error: 'Failed to calculate Kundali chart.',
          details: e && e.message ? e.message : 'Unknown error'
        });
      }

      const planets = kundaliChart.planets || [];
      const ascendant = kundaliChart.ascendant || {};
      const moon = planets.find(p => (p.id || '').toLowerCase() === 'moon' || (p.name || '').toLowerCase() === 'moon');
      const nakshatraName = moon && moon.nakshatra ? moon.nakshatra : undefined;

      let dashaForRules = null;
      const dashaData = kundaliChart.dasha;
      if (dashaData && dashaData.vimshottari && dashaData.vimshottari.current) {
        const cur = dashaData.vimshottari.current;
        dashaForRules = {
          mahadasha: cur.dasha ? { lord: cur.dasha.lord } : null,
          antardasha: cur.bhukti && cur.bhukti.lord ? { lord: cur.bhukti.lord } : null
        };
      }

      const result = await CategorizedRecommendationService.getCategorizedRecommendations(
        { planets, ascendant, ascendantSign: ascendant.sign },
        dashaForRules,
        nakshatraName
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in getCategorizedRecommendations:', error);
      return res.status(500).json({
        error: 'Failed to get categorized recommendations.',
        details: error.message
      });
    }
  }

  /**
   * POST /enhanced-kundali/predictions
   * Get predictions
   */
  async getPredictions(req, res) {
    try {
      const payload = req.body || {};
      const birthDetails = new BirthDetails(payload);

      const validation = birthDetails.validate();
      if (!validation.valid) {
        return res.status(400).json({
          error: "Invalid request.",
          details: validation.errors
        });
      }

      const chartData = await this.service.calculateCompleteKundali(birthDetails);
      
      // Basic predictions (can be enhanced)
      const predictions = {
        general: this.generateGeneralPredictions(chartData),
        career: this.generateCareerPredictions(chartData),
        relationships: this.generateRelationshipPredictions(chartData),
        health: this.generateHealthPredictions(chartData),
        finance: this.generateFinancePredictions(chartData)
      };

      return res.json({
        predictions: predictions,
        chartSummary: chartData.summary
      });
    } catch (error) {
      console.error("Error in getPredictions:", error);
      return res.status(500).json({
        error: "Failed to get predictions.",
        details: error.message
      });
    }
  }

  // Basic prediction generators (can be enhanced with more sophisticated logic)
  generateGeneralPredictions(chartData) {
    return [
      `Ascendant in ${chartData.summary.ascendantSign} indicates strong personality traits.`,
      `Moon in ${chartData.summary.moonSign} shows emotional nature.`,
      `Current Dasha: ${chartData.summary.currentDasha} period is active.`
    ];
  }

  generateCareerPredictions(chartData) {
    const dashamsa = chartData.divisionalCharts.dashamsa;
    return [
      `Dashamsa (D-10) chart shows career potential.`,
      `10th house analysis indicates professional direction.`
    ];
  }

  generateRelationshipPredictions(chartData) {
    const navamsa = chartData.divisionalCharts.navamsa;
    return [
      `Navamsa (D-9) chart indicates relationship patterns.`,
      `7th house analysis shows partnership dynamics.`
    ];
  }

  generateHealthPredictions(chartData) {
    return [
      `6th house analysis indicates health matters.`,
      `Planetary positions show vitality indicators.`
    ];
  }

  generateFinancePredictions(chartData) {
    return [
      `2nd house analysis indicates wealth potential.`,
      `11th house shows gains and income sources.`
    ];
  }
}

module.exports = EnhancedKundaliController;


