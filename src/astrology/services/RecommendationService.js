/**
 * Recommendation Service
 * 
 * Provides gemstone, rudraksha, and remedy recommendations based on chart analysis
 * Uses database-driven rule engine with fallback to hardcoded logic
 */

const RuleEvaluationService = require('./RuleEvaluationService');

class RecommendationService {
  constructor() {
    this.ruleEvaluationService = new RuleEvaluationService();
  }

  /**
   * Get recommendations based on chart analysis and category
   * Uses rule engine from database, falls back to hardcoded logic if no rules found
   */
  async getRecommendations(planets, doshas, yogas, category, dasha, nakshatraName) {
    const recommendations = [];

    try {
      // Try to get recommendations from database rules
      if (dasha) {
        const ruleBasedRecommendations = await this.getRuleBasedRecommendations(
          planets,
          doshas,
          yogas,
          category,
          dasha,
          nakshatraName
        );
        
        if (ruleBasedRecommendations.length > 0) {
          return ruleBasedRecommendations;
        }
      }
    } catch (error) {
      console.error('Error fetching rule-based recommendations:', error);
      // Fall through to hardcoded logic
    }

    // Fallback to hardcoded logic
    return this.getHardcodedRecommendations(planets, doshas, yogas, category);
  }

  /**
   * Get recommendations from database rules
   */
  async getRuleBasedRecommendations(planets, doshas, yogas, category, dasha, nakshatraName) {
    const recommendations = [];

    // Evaluate rules
    const matchedRules = await this.ruleEvaluationService.evaluateRules(
      category,
      planets,
      doshas,
      yogas,
      dasha,
      nakshatraName
    );

    // Process each matched rule's recommendations
    for (const rule of matchedRules) {
      const ruleRecommendations = rule.recommendations;

      // Process Rudraksha recommendations
      if (ruleRecommendations.rudraksha) {
        for (const rudrakshaRec of ruleRecommendations.rudraksha) {
          recommendations.push({
            type: 'rudraksha',
            name: `${rudrakshaRec.mukhiCount} Mukhi Rudraksha`,
            reason: rudrakshaRec.reason,
            benefits: rudrakshaRec.benefits || [],
            category,
            instructions: rudrakshaRec.instructions,
          });
        }
      }

      // Process Gemstone recommendations
      if (ruleRecommendations.gemstones) {
        for (const gemstoneRec of ruleRecommendations.gemstones) {
          recommendations.push({
            type: 'gemstone',
            name: gemstoneRec.name,
            reason: gemstoneRec.reason,
            benefits: gemstoneRec.benefits || [],
            category,
            instructions: gemstoneRec.instructions,
          });
        }
      }

      // Process Combination recommendations
      if (ruleRecommendations.combinations) {
        for (const comboRec of ruleRecommendations.combinations) {
          const comboItems = comboRec.items.map(item => {
            if (item.type === 'rudraksha') {
              return `${item.mukhiCount} Mukhi Rudraksha`;
            } else {
              return item.name || '';
            }
          }).filter(Boolean).join(' + ');

          recommendations.push({
            type: 'rudraksha', // Default type for combinations
            name: comboItems,
            reason: comboRec.reason,
            benefits: comboRec.benefits || [],
            category,
            instructions: comboRec.instructions,
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Fallback: Get recommendations using hardcoded logic
   */
  getHardcodedRecommendations(planets, doshas, yogas, category) {
    const recommendations = [];

    // Analyze chart for category-specific issues
    const issues = this.analyzeCategoryIssues(planets, doshas, yogas, category);

    // Generate recommendations based on issues
    for (const issue of issues) {
      if (issue.type === 'weak_planet' && issue.planet) {
        recommendations.push(...this.getPlanetStrengtheningRecommendations(issue.planet, category));
      }
      if (issue.type === 'afflicted_planet' && issue.planet) {
        recommendations.push(...this.getPlanetRemedyRecommendations(issue.planet, category));
      }
      if (issue.type === 'dosha' && issue.doshaName) {
        recommendations.push(...this.getDoshaRemedyRecommendations(issue.doshaName, category));
      }
    }

    // Category-specific recommendations
    recommendations.push(...this.getCategorySpecificRecommendations(planets, category));

    return recommendations;
  }

  /**
   * Analyze category-specific issues
   */
  analyzeCategoryIssues(planets, doshas, yogas, category) {
    const issues = [];

    // Find weak planets (debilitated, combust, in enemy sign)
    planets.forEach(planet => {
      const dignity = this.getPlanetDignity(planet);
      if (
        dignity === 'debilitated' ||
        planet.isCombust ||
        dignity === 'enemy_sign'
      ) {
        issues.push({ type: 'weak_planet', planet: planet.name });
      }
    });

    // Find afflicted planets (in malefic houses, retrograde in bad position)
    planets.forEach(planet => {
      const maleficHouses = [6, 8, 12];
      if (maleficHouses.includes(planet.house) && planet.isRetrograde) {
        issues.push({ type: 'afflicted_planet', planet: planet.name });
      }
    });

    // Check for doshas
    doshas.forEach(dosha => {
      if (dosha.severity === 'high' || dosha.severity === 'medium') {
        issues.push({ type: 'dosha', doshaName: dosha.name });
      }
    });

    return issues;
  }

  /**
   * Get planet dignity from planet object
   */
  getPlanetDignity(planet) {
    if (planet.dignity) return planet.dignity;
    if (planet.relation) return planet.relation.toLowerCase();
    if (planet.dignityStatus) return planet.dignityStatus.toLowerCase();
    return 'neutral_sign';
  }

  /**
   * Get planet strengthening recommendations
   */
  getPlanetStrengtheningRecommendations(planetName, category) {
    const recommendations = [];

    const planetGemstones = {
      Sun: { gemstone: 'Ruby', rudraksha: '12 Mukhi' },
      Moon: { gemstone: 'Pearl', rudraksha: '2 Mukhi' },
      Mars: { gemstone: 'Red Coral', rudraksha: '3 Mukhi' },
      Mercury: { gemstone: 'Emerald', rudraksha: '4 Mukhi' },
      Jupiter: { gemstone: 'Yellow Sapphire', rudraksha: '5 Mukhi' },
      Venus: { gemstone: 'Diamond', rudraksha: '6 Mukhi' },
      Saturn: { gemstone: 'Blue Sapphire', rudraksha: '7 Mukhi' },
      Rahu: { gemstone: 'Hessonite', rudraksha: '8 Mukhi' },
      Ketu: { gemstone: 'Cat\'s Eye', rudraksha: '9 Mukhi' },
    };

    const planet = planetGemstones[planetName];
    if (planet) {
      recommendations.push({
        type: 'gemstone',
        name: planet.gemstone,
        reason: `${planetName} is weak or afflicted. ${planet.gemstone} strengthens ${planetName}.`,
        benefits: this.getPlanetBenefits(planetName, category),
        category,
        planet: planetName,
        instructions: `Wear ${planet.gemstone} in ${this.getFingerForPlanet(planetName)} finger on ${this.getDayForPlanet(planetName)}.`,
      });

      recommendations.push({
        type: 'rudraksha',
        name: `${planet.rudraksha} Rudraksha`,
        reason: `${planetName} needs strengthening. ${planet.rudraksha} Rudraksha is ruled by ${planetName}.`,
        benefits: this.getRudrakshaBenefits(planet.rudraksha, category),
        category,
        planet: planetName,
        instructions: `Wear ${planet.rudraksha} Rudraksha and chant ${planetName} mantras.`,
      });
    }

    return recommendations;
  }

  /**
   * Get planet remedy recommendations
   */
  getPlanetRemedyRecommendations(planetName, category) {
    return [{
      type: 'remedy',
      name: `${planetName} Remedies`,
      reason: `${planetName} is afflicted and needs remedies.`,
      benefits: [`Reduces ${planetName} afflictions`, 'Brings balance'],
      category,
      planet: planetName,
      instructions: this.getPlanetRemedyInstructions(planetName),
    }];
  }

  /**
   * Get dosha remedy recommendations
   */
  getDoshaRemedyRecommendations(doshaName, category) {
    const recommendations = [];

    if (doshaName === 'Mangal Dosha') {
      recommendations.push({
        type: 'gemstone',
        name: 'Red Coral',
        reason: 'Mangal Dosha requires Mars strengthening',
        benefits: ['Reduces Mangal Dosha effects', 'Improves relationships'],
        category,
        planet: 'Mars',
        instructions: 'Wear Red Coral in ring finger on Tuesday.',
      });
    }

    if (doshaName === 'Kaal Sarp Dosha') {
      recommendations.push({
        type: 'gemstone',
        name: 'Hessonite (Gomed)',
        reason: 'Kaal Sarp Dosha requires Rahu remedies',
        benefits: ['Reduces Kaal Sarp Dosha effects', 'Removes obstacles'],
        category,
        planet: 'Rahu',
        instructions: 'Wear Hessonite in middle finger on Saturday.',
      });
    }

    return recommendations;
  }

  /**
   * Get category-specific recommendations
   */
  getCategorySpecificRecommendations(planets, category) {
    const recommendations = [];

    switch (category) {
      case 'wealth':
        const jupiter = planets.find(p => p.name === 'Jupiter');
        const venus = planets.find(p => p.name === 'Venus');
        if (jupiter && (this.getPlanetDignity(jupiter) === 'debilitated' || [6, 8, 12].includes(jupiter.house))) {
          recommendations.push({
            type: 'gemstone',
            name: 'Yellow Sapphire',
            reason: 'Jupiter rules wealth and needs strengthening',
            benefits: ['Financial growth', 'Wealth accumulation', 'Prosperity'],
            category: 'wealth',
            planet: 'Jupiter',
          });
        }
        if (venus && (this.getPlanetDignity(venus) === 'debilitated' || [6, 8, 12].includes(venus.house))) {
          recommendations.push({
            type: 'gemstone',
            name: 'Diamond',
            reason: 'Venus rules luxury and material comforts',
            benefits: ['Material comforts', 'Luxury', 'Financial stability'],
            category: 'wealth',
            planet: 'Venus',
          });
        }
        break;

      case 'career':
        const sunCareer = planets.find(p => p.name === 'Sun');
        const mercury = planets.find(p => p.name === 'Mercury');
        if (sunCareer && (this.getPlanetDignity(sunCareer) === 'debilitated' || [6, 8, 12].includes(sunCareer.house))) {
          recommendations.push({
            type: 'gemstone',
            name: 'Ruby',
            reason: 'Sun rules authority and career',
            benefits: ['Career growth', 'Authority', 'Recognition'],
            category: 'career',
            planet: 'Sun',
          });
        }
        if (mercury && (this.getPlanetDignity(mercury) === 'debilitated' || [6, 8, 12].includes(mercury.house))) {
          recommendations.push({
            type: 'gemstone',
            name: 'Emerald',
            reason: 'Mercury rules communication and business',
            benefits: ['Business success', 'Communication', 'Intelligence'],
            category: 'career',
            planet: 'Mercury',
          });
        }
        break;

      case 'spiritual':
        const jupiterSp = planets.find(p => p.name === 'Jupiter');
        const ketu = planets.find(p => p.name === 'Ketu');
        if (jupiterSp && (this.getPlanetDignity(jupiterSp) === 'debilitated' || [6, 8, 12].includes(jupiterSp.house))) {
          recommendations.push({
            type: 'rudraksha',
            name: '5 Mukhi Rudraksha',
            reason: 'Jupiter rules spirituality and wisdom',
            benefits: ['Spiritual growth', 'Wisdom', 'Knowledge'],
            category: 'spiritual',
            planet: 'Jupiter',
          });
        }
        if (ketu) {
          recommendations.push({
            type: 'rudraksha',
            name: '9 Mukhi Rudraksha',
            reason: 'Ketu rules spirituality and enlightenment',
            benefits: ['Spiritual enlightenment', 'Detachment', 'Moksha'],
            category: 'spiritual',
            planet: 'Ketu',
          });
        }
        break;
    }

    return recommendations;
  }

  /**
   * Get planet benefits for category
   */
  getPlanetBenefits(planetName, category) {
    const benefits = {
      Sun: {
        overall: ['Vitality', 'Confidence', 'Leadership'],
        wealth: ['Career success', 'Authority'],
        health: ['Vitality', 'Energy'],
        mental_wellbeing: ['Confidence', 'Self-esteem'],
        relationship: ['Respect', 'Authority'],
        career: ['Career growth', 'Recognition'],
        spiritual: ['Spiritual authority'],
      },
      Moon: {
        overall: ['Emotional stability', 'Peace', 'Popularity'],
        wealth: ['Emotional wealth'],
        health: ['Mental peace', 'Better sleep'],
        mental_wellbeing: ['Emotional stability', 'Peace'],
        relationship: ['Harmony', 'Understanding'],
        career: ['Popularity', 'Public support'],
        spiritual: ['Intuition', 'Devotion'],
      },
    };

    return benefits[planetName]?.[category] || ['General benefits'];
  }

  /**
   * Get rudraksha benefits
   */
  getRudrakshaBenefits(rudraksha, category) {
    const rudrakshaMeanings = {
      '2 Mukhi': ['Unity', 'Harmony', 'Relationships'],
      '3 Mukhi': ['Courage', 'Energy', 'Confidence'],
      '4 Mukhi': ['Intelligence', 'Communication', 'Knowledge'],
      '5 Mukhi': ['Spirituality', 'Wisdom', 'Peace'],
      '6 Mukhi': ['Love', 'Relationships', 'Harmony'],
      '7 Mukhi': ['Wealth', 'Prosperity', 'Success'],
      '8 Mukhi': ['Removes obstacles', 'Protection'],
      '9 Mukhi': ['Spiritual growth', 'Enlightenment'],
      '12 Mukhi': ['Authority', 'Leadership', 'Power'],
    };

    return rudrakshaMeanings[rudraksha] || ['General benefits'];
  }

  /**
   * Get finger for planet
   */
  getFingerForPlanet(planetName) {
    const fingerMap = {
      Sun: 'ring',
      Moon: 'little',
      Mars: 'ring',
      Mercury: 'little',
      Jupiter: 'index',
      Venus: 'middle',
      Saturn: 'middle',
      Rahu: 'middle',
      Ketu: 'little',
    };
    return fingerMap[planetName] || 'ring';
  }

  /**
   * Get day for planet
   */
  getDayForPlanet(planetName) {
    const dayMap = {
      Sun: 'Sunday',
      Moon: 'Monday',
      Mars: 'Tuesday',
      Mercury: 'Wednesday',
      Jupiter: 'Thursday',
      Venus: 'Friday',
      Saturn: 'Saturday',
      Rahu: 'Saturday',
      Ketu: 'Tuesday',
    };
    return dayMap[planetName] || 'any day';
  }

  /**
   * Get planet remedy instructions
   */
  getPlanetRemedyInstructions(planetName) {
    return `Perform ${planetName} remedies: Chant ${planetName} mantras, donate items related to ${planetName}, and perform puja on ${this.getDayForPlanet(planetName)}.`;
  }
}

module.exports = RecommendationService;
