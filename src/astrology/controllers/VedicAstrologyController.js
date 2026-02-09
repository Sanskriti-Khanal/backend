/**
 * Vedic Astrology Controller
 * 
 * API endpoints for complete Vedic astrology calculations without Swiss Ephemeris
 */

const VedicAstrology = require('../services/VedicAstrology');
const YogaCalculator = require('../services/YogaCalculator');
const DashaCalculator = require('../services/DashaCalculator');
const RecommendationService = require('../services/RecommendationService');

class VedicAstrologyController {
  /**
   * Calculate complete astrology chart
   * 
   * POST /api/vedic-astro/chart
   * 
   * Body: {
   *   dob: "1990-01-01" (ISO date string),
   *   tob: "10:30" or "10:30:00",
   *   birthplace: {lat: 28.6139, lon: 77.2090, placeName: "Delhi"},
   *   gender: "male" or "female"
   * }
   */
  async calculateChart(req, res) {
    try {
      const { dob, tob, birthplace, gender } = req.body;
      
      // Validate input
      if (!dob || !tob || !birthplace || !gender) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: dob, tob, birthplace, gender'
        });
      }
      
      if (!birthplace.lat || !birthplace.lon) {
        return res.status(400).json({
          success: false,
          error: 'Birthplace must have lat and lon'
        });
      }
      
      // Create VedicAstrology instance
      const astrology = new VedicAstrology(dob, tob, birthplace, gender);
      
      // Calculate complete chart
      const chartData = await astrology.calculateCompleteChart();
      
      // Calculate yogas
      const yogaCalculator = new YogaCalculator();
      const yogas = yogaCalculator.calculateYogas(
        chartData.planets,
        chartData.houses,
        chartData.lagna
      );
      
      // Calculate dasha
      const dashaCalculator = new DashaCalculator();
      const moon = chartData.planets.moon;
      const dasha = dashaCalculator.calculateDasha(
        new Date(dob),
        moon.nakshatra,
        moon.nakshatraPada,
        moon.longitude
      );
      
      // Calculate planetary strengths
      const planetaryStrengths = this.calculatePlanetaryStrengths(chartData.planets);
      
      // Calculate aspects (simplified)
      const aspects = this.calculateAspects(chartData.planets);
      
      // Prepare response
      const response = {
        success: true,
        report: {
          basicInfo: chartData.basicInfo,
          nakshatra: chartData.nakshatra,
          lagna: chartData.lagna,
          planets: chartData.planets,
          houses: chartData.houses,
          yogas: yogas,
          dashas: dasha,
          aspects: aspects,
          strengths: planetaryStrengths
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error calculating chart:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get recommendations for a chart
   * 
   * POST /api/vedic-astro/recommendations
   * 
   * Body: {
   *   dob, tob, birthplace, gender (same as chart),
   *   category: "overall" | "wealth" | "health" | "career" | "relationship" | "spiritual" | "mental_wellbeing" | "study"
   * }
   */
  async getRecommendations(req, res) {
    try {
      const { dob, tob, birthplace, gender, category = 'overall' } = req.body;
      
      // Calculate chart first
      const astrology = new VedicAstrology(dob, tob, birthplace, gender);
      const chartData = await astrology.calculateCompleteChart();
      
      // Calculate yogas and doshas
      const yogaCalculator = new YogaCalculator();
      const yogas = yogaCalculator.calculateYogas(
        chartData.planets,
        chartData.houses,
        chartData.lagna
      );
      
      // Extract doshas from yogas
      const doshas = yogas.filter(y => y.type === 'dosha_yoga');
      
      // Calculate dasha
      const dashaCalculator = new DashaCalculator();
      const moon = chartData.planets.moon;
      const dasha = dashaCalculator.calculateDasha(
        new Date(dob),
        moon.nakshatra,
        moon.nakshatraPada,
        moon.longitude
      );
      
      // Get recommendations
      const recommendationService = new RecommendationService();
      const recommendations = await recommendationService.getRecommendations(
        chartData.planets,
        doshas,
        yogas,
        category,
        dasha,
        moon.nakshatra
      );
      
      // Organize recommendations by type
      const organizedRecommendations = {
        overall: recommendations.filter(r => r.category === 'overall' || !r.category),
        rudraksha: recommendations.filter(r => r.type === 'rudraksha'),
        gemstones: recommendations.filter(r => r.type === 'gemstone'),
        remedies: this.calculateRemedies(chartData.planets, chartData.nakshatra, dasha),
        categories: {
          wealth: recommendations.filter(r => r.category === 'wealth'),
          health: recommendations.filter(r => r.category === 'health'),
          career: recommendations.filter(r => r.category === 'career'),
          relationship: recommendations.filter(r => r.category === 'relationship'),
          spiritual: recommendations.filter(r => r.category === 'spiritual'),
          mental_wellbeing: recommendations.filter(r => r.category === 'mental_wellbeing'),
          study: recommendations.filter(r => r.category === 'study')
        }
      };
      
      res.json({
        success: true,
        recommendations: organizedRecommendations,
        chartSummary: {
          lagna: chartData.lagna.signName,
          nakshatra: chartData.nakshatra.name,
          mahadasha: dasha.mahadasha.planet,
          antardasha: dasha.antardasha.planet
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get predictions for specific area
   * 
   * POST /api/vedic-astro/predictions/:area
   * 
   * Areas: health, wealth, career, relationship, spiritual, education
   */
  async getPredictions(req, res) {
    try {
      const { area } = req.params;
      const { dob, tob, birthplace, gender } = req.body;
      
      // Calculate chart
      const astrology = new VedicAstrology(dob, tob, birthplace, gender);
      const chartData = await astrology.calculateCompleteChart();
      
      // Calculate yogas
      const yogaCalculator = new YogaCalculator();
      const yogas = yogaCalculator.calculateYogas(
        chartData.planets,
        chartData.houses,
        chartData.lagna
      );
      
      // Calculate dasha
      const dashaCalculator = new DashaCalculator();
      const moon = chartData.planets.moon;
      const dasha = dashaCalculator.calculateDasha(
        new Date(dob),
        moon.nakshatra,
        moon.nakshatraPada,
        moon.longitude
      );
      
      // Get predictions for area
      const predictions = this.getPredictionsForArea(
        area,
        chartData,
        yogas,
        dasha
      );
      
      res.json({
        success: true,
        area: area,
        predictions: predictions,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error getting predictions:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Calculate planetary strengths
   */
  calculatePlanetaryStrengths(planets) {
    const strengths = {};
    
    for (const planetId in planets) {
      const planet = planets[planetId];
      let strength = 50; // Base strength
      
      // Exaltation adds strength
      if (planet.isExalted) strength += 30;
      else if (planet.isDebilitated) strength -= 30;
      
      // House position affects strength
      if ([1, 4, 7, 10].includes(planet.house)) strength += 10; // Kendras
      if ([6, 8, 12].includes(planet.house)) strength -= 15; // Dusthanas
      
      // Retrograde affects strength
      if (planet.isRetrograde) strength -= 5;
      
      // Combustion reduces strength
      if (planet.isCombusted) strength -= 20;
      
      strengths[planetId] = Math.max(0, Math.min(100, strength));
    }
    
    return strengths;
  }
  
  /**
   * Calculate aspects (simplified)
   */
  calculateAspects(planets) {
    const aspects = [];
    // Jupiter aspects 5th, 7th, 9th houses
    // Saturn aspects 3rd, 7th, 10th houses
    // Mars aspects 4th, 7th, 8th houses
    // etc.
    return aspects;
  }
  
  /**
   * Calculate remedies (mantras, yantras, etc.)
   */
  calculateRemedies(planets, nakshatra, dasha) {
    const remedies = {
      mantra: [],
      yantra: [],
      pooja: [],
      charity: [],
      color: [],
      fasting: []
    };
    
    // Mantras based on weak planets
    for (const planetId in planets) {
      const planet = planets[planetId];
      if (planet.isDebilitated || planet.isCombusted || [6, 8, 12].includes(planet.house)) {
        const mantras = {
          'sun': 'Om Suryaya Namaha',
          'moon': 'Om Chandraya Namaha',
          'mars': 'Om Mangalaya Namaha',
          'mercury': 'Om Budhaya Namaha',
          'jupiter': 'Om Gurave Namaha',
          'venus': 'Om Shukraya Namaha',
          'saturn': 'Om Shanaishcharaya Namaha',
          'rahu': 'Om Rahave Namaha',
          'ketu': 'Om Ketave Namaha'
        };
        
        remedies.mantra.push({
          planet: planet.name,
          mantra: mantras[planetId],
          count: '108 times daily'
        });
      }
    }
    
    // Fasting days
    const fastingDays = {
      'sun': 'Sunday',
      'moon': 'Monday',
      'mars': 'Tuesday',
      'mercury': 'Wednesday',
      'jupiter': 'Thursday',
      'venus': 'Friday',
      'saturn': 'Saturday'
    };
    
    for (const planetId in planets) {
      const planet = planets[planetId];
      if (planet.isDebilitated || planet.isCombusted) {
        if (fastingDays[planetId]) {
          remedies.fasting.push({
            planet: planet.name,
            day: fastingDays[planetId]
          });
        }
      }
    }
    
    return remedies;
  }
  
  /**
   * Get predictions for specific area
   */
  getPredictionsForArea(area, chartData, yogas, dasha) {
    const predictions = [];
    
    // Area-specific logic
    switch (area) {
      case 'career':
        // Analyze 10th house, 10th lord, Sun, Jupiter
        const house10 = chartData.houses[10];
        const sun = chartData.planets.sun;
        const jupiter = chartData.planets.jupiter;
        
        if (sun && sun.house === 10) {
          predictions.push('Strong career prospects indicated by Sun in 10th house');
        }
        if (jupiter && jupiter.house === 10) {
          predictions.push('Jupiter in 10th house indicates career growth and recognition');
        }
        
        // Check for career yogas
        const careerYogas = yogas.filter(y => y.category === 'career_power' || y.category === 'power');
        careerYogas.forEach(yoga => {
          predictions.push(yoga.description);
        });
        
        break;
        
      case 'wealth':
        // Analyze 2nd, 5th, 9th, 11th houses
        const house2 = chartData.houses[2];
        const house11 = chartData.houses[11];
        const venus = chartData.planets.venus;
        
        if (venus && (venus.house === 2 || venus.house === 11)) {
          predictions.push('Venus in wealth houses indicates material prosperity');
        }
        
        const wealthYogas = yogas.filter(y => y.category === 'wealth');
        wealthYogas.forEach(yoga => {
          predictions.push(yoga.description);
        });
        
        break;
        
      case 'health':
        // Analyze 1st, 6th, 8th houses, Sun, Moon
        const sunHealth = chartData.planets.sun;
        const moonHealth = chartData.planets.moon;
        
        if (sunHealth && sunHealth.isDebilitated) {
          predictions.push('Weak Sun may indicate health issues - strengthen with remedies');
        }
        if (moonHealth && moonHealth.isDebilitated) {
          predictions.push('Weak Moon may indicate mental health concerns');
        }
        
        break;
        
      case 'relationship':
        // Analyze 7th house, Venus, Mars
        const venusRel = chartData.planets.venus;
        const marsRel = chartData.planets.mars;
        
        const mangalDosha = yogas.find(y => y.name === 'Mangal Dosha');
        if (mangalDosha) {
          predictions.push('Mangal Dosha present - may affect relationships, remedies recommended');
        }
        
        if (venusRel && venusRel.isDebilitated) {
          predictions.push('Weak Venus may affect relationships - strengthen with remedies');
        }
        
        break;
        
      default:
        predictions.push('General predictions based on chart analysis');
    }
    
    // Add dasha-based predictions
    predictions.push(`Current Mahadasha: ${dasha.mahadasha.planet} - ${this.getDashaPrediction(dasha.mahadasha.planet, area)}`);
    
    return predictions;
  }
  
  /**
   * Get dasha prediction
   */
  getDashaPrediction(planet, area) {
    const predictions = {
      'Sun': {
        career: 'Good period for career advancement and leadership',
        wealth: 'Moderate financial gains',
        health: 'Focus on vitality and energy'
      },
      'Moon': {
        career: 'Emotional intelligence helps in career',
        wealth: 'Steady financial growth',
        health: 'Focus on mental and emotional wellbeing'
      },
      'Mars': {
        career: 'Active period, good for competitive fields',
        wealth: 'Earned through hard work',
        health: 'Maintain physical fitness'
      },
      'Mercury': {
        career: 'Good for communication and business',
        wealth: 'Financial gains through intelligence',
        health: 'Focus on mental clarity'
      },
      'Jupiter': {
        career: 'Excellent period for growth and recognition',
        wealth: 'Financial prosperity and abundance',
        health: 'Good overall health'
      },
      'Venus': {
        career: 'Good for creative and artistic fields',
        wealth: 'Material comforts and luxury',
        health: 'Focus on relationships and harmony'
      },
      'Saturn': {
        career: 'Hard work and discipline required',
        wealth: 'Delayed but steady gains',
        health: 'Focus on long-term health'
      },
      'Rahu': {
        career: 'Unexpected opportunities',
        wealth: 'Sudden gains possible',
        health: 'Be cautious of health issues'
      },
      'Ketu': {
        career: 'Spiritual growth and detachment',
        wealth: 'Focus on spiritual wealth',
        health: 'Focus on spiritual healing'
      }
    };
    
    return predictions[planet]?.[area] || 'General dasha period';
  }
}

module.exports = new VedicAstrologyController();
