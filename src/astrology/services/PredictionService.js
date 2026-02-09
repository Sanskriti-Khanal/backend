/**
 * Prediction Service
 * 
 * Generates astrological predictions and interpretations:
 * - Lagna (Ascendant) predictions
 * - Nakshatra predictions with ruling planet
 * - Planetary predictions
 * - Dosha predictions
 * - Yoga predictions
 * - Gemstone and Rudraksha recommendations
 */

const RecommendationService = require('./RecommendationService');
const nakshatra = require('../utils/nakshatra');

class PredictionService {
  constructor() {
    this.recommendationService = new RecommendationService();
  }

  /**
   * Get complete predictions for a chart
   */
  async getCompletePredictions(chartData, planets, doshas, yogas, dasha, nakshatraName) {
    const predictions = {
      lagna: this.getLagnaPrediction(chartData),
      nakshatra: this.getNakshatraPrediction(planets, nakshatraName),
      planets: this.getPlanetaryPredictions(planets),
      doshas: this.getDoshaPredictions(doshas),
      yogas: this.getYogaPredictions(yogas),
      mahadashas: this.getMahadashaPrediction(dasha),
      recommendations: {
        overall: await this.getRecommendationsForCategory(planets, doshas, yogas, 'overall', dasha, nakshatraName),
        career: await this.getRecommendationsForCategory(planets, doshas, yogas, 'career', dasha, nakshatraName),
        wealth: await this.getRecommendationsForCategory(planets, doshas, yogas, 'wealth', dasha, nakshatraName),
        health: await this.getRecommendationsForCategory(planets, doshas, yogas, 'health', dasha, nakshatraName),
        relationship: await this.getRecommendationsForCategory(planets, doshas, yogas, 'relationship', dasha, nakshatraName),
        spiritual: await this.getRecommendationsForCategory(planets, doshas, yogas, 'spiritual', dasha, nakshatraName),
        mental_wellbeing: await this.getRecommendationsForCategory(planets, doshas, yogas, 'mental_wellbeing', dasha, nakshatraName),
      }
    };

    return predictions;
  }

  /**
   * Get Lagna (Ascendant) prediction
   */
  getLagnaPrediction(chartData) {
    const ascendant = chartData.ascendant || chartData.lagna?.ascendant;
    if (!ascendant) return null;

    const signNumber = ascendant.sign || ascendant.signNumber;
    const signName = this.getSignName(signNumber);
    const signNameNepali = this.getSignNameNepali(signNumber);

    const interpretations = {
      1: {
        personality: "Aries natives are natural leaders, energetic, and pioneering. You have a strong sense of self and are driven to achieve your goals.",
        worldView: "The world sees you as confident, assertive, and someone who takes initiative. You're known for your courage and directness.",
        traits: ["Leadership", "Courage", "Independence", "Competitiveness"]
      },
      2: {
        personality: "Taurus natives are stable, practical, and value security. You have a strong connection to material comforts and appreciate beauty.",
        worldView: "Others see you as reliable, patient, and grounded. You're known for your persistence and love of comfort.",
        traits: ["Stability", "Patience", "Practicality", "Determination"]
      },
      3: {
        personality: "Gemini natives are curious, communicative, and adaptable. You have a quick mind and love learning and sharing information.",
        worldView: "People see you as intelligent, witty, and versatile. You're known for your communication skills and adaptability.",
        traits: ["Intelligence", "Communication", "Versatility", "Curiosity"]
      },
      4: {
        personality: "Cancer natives are emotional, nurturing, and deeply connected to home and family. You value security and emotional bonds.",
        worldView: "Others perceive you as caring, protective, and intuitive. You're known for your emotional depth and nurturing nature.",
        traits: ["Nurturing", "Intuition", "Emotional depth", "Protectiveness"]
      },
      5: {
        personality: "Leo natives are confident, creative, and love being in the spotlight. You have a natural charisma and leadership quality.",
        worldView: "The world sees you as bold, generous, and magnetic. You're known for your confidence and creative expression.",
        traits: ["Confidence", "Creativity", "Generosity", "Leadership"]
      },
      6: {
        personality: "Virgo natives are analytical, detail-oriented, and service-minded. You have a strong sense of duty and perfectionism.",
        worldView: "Others see you as practical, organized, and helpful. You're known for your attention to detail and analytical mind.",
        traits: ["Analytical", "Perfectionism", "Service", "Organization"]
      },
      7: {
        personality: "Libra natives are diplomatic, relationship-oriented, and value harmony. You have a natural sense of balance and aesthetics.",
        worldView: "People see you as charming, fair-minded, and sociable. You're known for your diplomacy and love of beauty.",
        traits: ["Diplomacy", "Harmony", "Partnership", "Aesthetics"]
      },
      8: {
        personality: "Scorpio natives are intense, transformative, and deeply perceptive. You have strong willpower and emotional depth.",
        worldView: "Others perceive you as mysterious, powerful, and magnetic. You're known for your intensity and ability to transform.",
        traits: ["Intensity", "Transformation", "Perception", "Willpower"]
      },
      9: {
        personality: "Sagittarius natives are optimistic, philosophical, and love adventure. You seek truth and meaning in life.",
        worldView: "The world sees you as adventurous, wise, and enthusiastic. You're known for your optimism and love of learning.",
        traits: ["Optimism", "Adventure", "Philosophy", "Enthusiasm"]
      },
      10: {
        personality: "Capricorn natives are ambitious, disciplined, and goal-oriented. You value structure and long-term achievement.",
        worldView: "Others see you as responsible, ambitious, and reliable. You're known for your discipline and determination.",
        traits: ["Ambition", "Discipline", "Responsibility", "Determination"]
      },
      11: {
        personality: "Aquarius natives are innovative, independent, and humanitarian. You value freedom and progressive thinking.",
        worldView: "People see you as unique, forward-thinking, and friendly. You're known for your innovation and humanitarian values.",
        traits: ["Innovation", "Independence", "Humanitarianism", "Originality"]
      },
      12: {
        personality: "Pisces natives are intuitive, compassionate, and spiritually inclined. You have a deep connection to the unseen realms.",
        worldView: "Others perceive you as dreamy, empathetic, and artistic. You're known for your compassion and spiritual nature.",
        traits: ["Intuition", "Compassion", "Spirituality", "Creativity"]
      }
    };

    const interpretation = interpretations[signNumber] || interpretations[9];

    return {
      sign: signNumber,
      signName: signName,
      signNameNepali: signNameNepali,
      degree: ascendant.degree || 0,
      prediction: `Your Lagna (Ascendant) is **${signName} (${signNameNepali})**. ${interpretation.personality} ${interpretation.worldView}`,
      traits: interpretation.traits
    };
  }

  /**
   * Get Nakshatra prediction with ruling planet
   */
  getNakshatraPrediction(planets, nakshatraName) {
    const moon = planets.find(p => p.name === 'Moon' || p.id === 'moon');
    if (!moon) return null;

    // Get nakshatra details
    const moonNakshatra =
      moon && typeof moon.longitude === 'number'
        ? nakshatra.calculateNakshatra(moon.longitude, 'moon')
        : null;
    const nakshatraInfo = moonNakshatra || (nakshatraName ? this.getNakshatraByName(nakshatraName) : null);
    
    if (!nakshatraInfo) return null;

    const rulingPlanet = nakshatraInfo.rulingPlanet || this.getRulingPlanetForNakshatra(nakshatraInfo.name);
    const planetMeanings = this.getPlanetMeanings(rulingPlanet);

    return {
      name: nakshatraInfo.name,
      rulingPlanet: rulingPlanet,
      pada: moon.nakshatraPada || nakshatraInfo.pada || 1,
      prediction: `Your Nakshatra is **${nakshatraInfo.name}** & Ruling planet is **${rulingPlanet}**. ${planetMeanings.description}`,
      planetTraits: planetMeanings.traits,
      nakshatraMeaning: nakshatraInfo.meaning || `Nakshatra ${nakshatraInfo.name} brings its unique qualities to your personality.`
    };
  }

  /**
   * Get planetary predictions
   */
  getPlanetaryPredictions(planets) {
    const predictions = [];

    planets.forEach(planet => {
      const dignity = planet.relation || planet.dignity || 'Neutral';
      const house = planet.house;
      const signName = this.getSignName(planet.sign);

      let status = '';
      if (dignity === 'Exalted') {
        status = 'Exalted - This planet is at its strongest, bringing positive results.';
      } else if (dignity === 'Debilitated') {
        status = 'Debilitated - This planet needs strengthening through remedies.';
      } else if (dignity === 'Own Sign') {
        status = 'In Own Sign - Natural strength and positive results.';
      }

      const houseMeaning = this.getHouseMeaning(house);

      predictions.push({
        planet: planet.name,
        sign: signName,
        house: house,
        dignity: dignity,
        prediction: `${planet.name} in ${signName} sign, ${house}th house. ${status} ${houseMeaning}`,
        isCombust: planet.isCombust || false,
        isRetrograde: planet.isRetrograde || false
      });
    });

    return predictions;
  }

  /**
   * Get Dosha predictions
   */
  getDoshaPredictions(doshas) {
    return doshas.map(dosha => ({
      name: dosha.name,
      severity: dosha.severity,
      prediction: `${dosha.name} (${dosha.severity} severity): ${dosha.description || dosha.meaning}`,
      remedies: dosha.remedies || []
    }));
  }

  /**
   * Get Yoga predictions
   */
  getYogaPredictions(yogas) {
    return yogas.map(yoga => ({
      name: yoga.name,
      type: yoga.type,
      prediction: `${yoga.name} (${yoga.type}): ${yoga.meaning || yoga.description}`,
      significance: yoga.significance || '',
      planets: yoga.planets || []
    }));
  }

  /**
   * Get Mahadasha prediction
   */
  getMahadashaPrediction(dasha) {
    if (!dasha || !dasha.mahadasha || !dasha.mahadasha.lord) return null;

    const mahadasha = dasha.mahadasha;
    const antardasha = dasha.antardasha;
    
    // Capitalize planet name
    const mahadashaLord = mahadasha.lord.charAt(0).toUpperCase() + mahadasha.lord.slice(1);

    const dashaMeanings = {
      Sun: "Sun Mahadasha brings focus on self, authority, and leadership. It's a period of recognition and confidence.",
      Moon: "Moon Mahadasha emphasizes emotions, relationships, and public life. It's a period of emotional growth.",
      Mars: "Mars Mahadasha brings energy, action, and courage. It's a period of achievements through effort.",
      Mercury: "Mercury Mahadasha emphasizes communication, business, and learning. It's a period of intellectual growth.",
      Jupiter: "Jupiter Mahadasha brings wisdom, expansion, and prosperity. It's a period of growth and blessings.",
      Venus: "Venus Mahadasha emphasizes love, luxury, and relationships. It's a period of material and emotional comforts.",
      Saturn: "Saturn Mahadasha brings discipline, hard work, and lessons. It's a period of karmic resolution.",
      Rahu: "Rahu Mahadasha brings desires, ambitions, and unexpected changes. It's a period of material pursuits.",
      Ketu: "Ketu Mahadasha emphasizes spirituality, detachment, and inner growth. It's a period of spiritual evolution.",
    };

    return {
      mahadasha: {
        lord: mahadashaLord,
        prediction: dashaMeanings[mahadashaLord] || `Current Mahadasha of ${mahadashaLord} influences your life path.`,
        duration: mahadasha.period ? `${mahadasha.period.toFixed(2)} years` : (mahadasha.duration || 'N/A')
      },
      antardasha: antardasha && antardasha.lord ? {
        lord: antardasha.lord.charAt(0).toUpperCase() + antardasha.lord.slice(1),
        prediction: `Current Antardasha of ${antardasha.lord.charAt(0).toUpperCase() + antardasha.lord.slice(1)} within ${mahadashaLord} Mahadasha.`,
        duration: antardasha.period ? `${antardasha.period.toFixed(2)} years` : (antardasha.duration || 'N/A')
      } : null
    };
  }

  /**
   * Get recommendations for a specific category
   */
  async getRecommendationsForCategory(planets, doshas, yogas, category, dasha, nakshatraName) {
    try {
      const recommendations = await this.recommendationService.getRecommendations(
        planets,
        doshas,
        yogas,
        category,
        dasha,
        nakshatraName
      );

      return {
        category: category,
        items: recommendations.map(rec => ({
          type: rec.type,
          name: rec.name,
          reason: rec.reason,
          benefits: rec.benefits || [],
          instructions: rec.instructions || ''
        })),
        summary: recommendations.length > 0 
          ? `Based on your chart analysis, ${recommendations.length} recommendation(s) for ${category}.`
          : `No specific recommendations for ${category} at this time.`
      };
    } catch (error) {
      console.error(`Error getting recommendations for ${category}:`, error);
      return {
        category: category,
        items: [],
        summary: `Unable to generate recommendations for ${category}.`
      };
    }
  }

  // Helper methods
  getSignName(signNumber) {
    const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                       'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signNames[signNumber - 1] || 'Unknown';
  }

  getSignNameNepali(signNumber) {
    const signNamesNepali = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
                             'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'];
    return signNamesNepali[signNumber - 1] || '';
  }

  getNakshatraByName(name) {
    // This would ideally come from nakshatra utility
    // For now, return basic structure
    return {
      name: name,
      rulingPlanet: this.getRulingPlanetForNakshatra(name),
      meaning: `Nakshatra ${name} influences your personality and destiny.`
    };
  }

  getRulingPlanetForNakshatra(nakshatraName) {
    // Simplified mapping - in production, use proper nakshatra database
    const nakshatraPlanets = {
      'Ashwini': 'Ketu', 'Bharani': 'Venus', 'Krittika': 'Sun',
      'Rohini': 'Moon', 'Mrigashira': 'Mars', 'Ardra': 'Rahu',
      'Punarvasu': 'Jupiter', 'Pushya': 'Saturn', 'Ashlesha': 'Mercury',
      'Magha': 'Ketu', 'Purva Phalguni': 'Venus', 'Uttara Phalguni': 'Sun',
      'Hasta': 'Moon', 'Chitra': 'Mars', 'Swati': 'Rahu',
      'Vishakha': 'Jupiter', 'Anuradha': 'Saturn', 'Jyeshta': 'Mercury',
      'Mula': 'Ketu', 'Purva Ashadha': 'Venus', 'Uttara Ashadha': 'Sun',
      'Shravana': 'Moon', 'Dhanishta': 'Mars', 'Shatabhisha': 'Rahu',
      'Purva Bhadrapada': 'Jupiter', 'Uttara Bhadrapada': 'Saturn', 'Revati': 'Mercury'
    };
    return nakshatraPlanets[nakshatraName] || 'Moon';
  }

  getPlanetMeanings(planetName) {
    const meanings = {
      'Sun': {
        description: 'Sun represents the soul, self, authority, and leadership. It signifies vitality, confidence, and recognition.',
        traits: ['Authority', 'Leadership', 'Vitality', 'Confidence']
      },
      'Moon': {
        description: 'Moon represents the mind, emotions, and public life. It signifies intuition, nurturing, and emotional well-being.',
        traits: ['Emotions', 'Intuition', 'Nurturing', 'Popularity']
      },
      'Mars': {
        description: 'Mars represents energy, action, and courage. It signifies determination, ambition, and the ability to overcome obstacles.',
        traits: ['Energy', 'Courage', 'Determination', 'Action']
      },
      'Mercury': {
        description: 'Mercury represents communication, intelligence, and business. It signifies learning, adaptability, and analytical thinking.',
        traits: ['Intelligence', 'Communication', 'Learning', 'Business']
      },
      'Jupiter': {
        description: 'Jupiter represents wisdom, expansion, and prosperity. It signifies knowledge, spirituality, and good fortune.',
        traits: ['Wisdom', 'Prosperity', 'Spirituality', 'Growth']
      },
      'Venus': {
        description: 'Venus represents love, beauty, and material comforts. It signifies relationships, luxury, and artistic expression.',
        traits: ['Love', 'Beauty', 'Relationships', 'Luxury']
      },
      'Saturn': {
        description: 'Saturn represents discipline, responsibility, structure, and limitations. It signifies hard work, perseverance, and long-term goals.',
        traits: ['Discipline', 'Responsibility', 'Structure', 'Perseverance']
      },
      'Rahu': {
        description: 'Rahu represents desires, ambitions, and material pursuits. It signifies innovation, unconventional thinking, and worldly achievements.',
        traits: ['Ambition', 'Desires', 'Innovation', 'Material pursuits']
      },
      'Ketu': {
        description: 'Ketu represents spirituality, detachment, and inner wisdom. It signifies enlightenment, letting go, and spiritual evolution.',
        traits: ['Spirituality', 'Detachment', 'Enlightenment', 'Inner wisdom']
      }
    };

    return meanings[planetName] || {
      description: `${planetName} influences your personality and life path.`,
      traits: []
    };
  }

  getHouseMeaning(house) {
    const meanings = {
      1: 'Affects personality, self, and physical appearance.',
      2: 'Affects wealth, family, and speech.',
      3: 'Affects siblings, courage, and communication.',
      4: 'Affects home, mother, and property.',
      5: 'Affects children, education, and creativity.',
      6: 'Affects health, enemies, and service.',
      7: 'Affects marriage, partnerships, and relationships.',
      8: 'Affects longevity, transformations, and obstacles.',
      9: 'Affects fortune, father, and spirituality.',
      10: 'Affects career, reputation, and authority.',
      11: 'Affects gains, friends, and aspirations.',
      12: 'Affects losses, spirituality, and foreign lands.'
    };
    return meanings[house] || '';
  }
}

module.exports = PredictionService;
