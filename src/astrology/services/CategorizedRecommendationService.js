/**
 * Categorized Recommendation Service
 * Analyzes birth chart → recommends gems/rudraksha by category.
 * Uses recommendation_rules DB, planet analysis (debilitation, bad houses, enemy signs),
 * category mapping, and yoga detection (Raj, Dhana, Chandra-Mangal, Budha-Aditya).
 * Output: { category, analysis, gems, rudraksha } per category; yogasDetected; special rudraksha.
 */

const GrahaSthitiAnalysisService = require('./GrahaSthitiAnalysisService');
const YogaCalculator = require('./YogaCalculator');
const RecommendationRuleService = require('./RecommendationRuleService');
const RuleEvaluationService = require('./RuleEvaluationService');
const chartAnalysis = require('../utils/chart-analysis');
const mongoose = require('mongoose');

// Load models - check if models are available (MongoDB connection required)
let GemCategoryModel, RudrakshaCategoryModel;
try {
  // Try to load from dist (compiled) or src
  try {
    GemCategoryModel = require('../../models/GemCategory.model').GemCategoryModel;
    RudrakshaCategoryModel = require('../../models/RudrakshaCategory.model').RudrakshaCategoryModel;
  } catch (e) {
    // If not found, try dist path
    GemCategoryModel = require('../../../dist/models/GemCategory.model').GemCategoryModel;
    RudrakshaCategoryModel = require('../../../dist/models/RudrakshaCategory.model').RudrakshaCategoryModel;
  }
} catch (e) {
  console.warn('GemCategoryModel or RudrakshaCategoryModel not available. Recommendations will use rule data only.');
}

const CATEGORIES = ['study', 'career', 'wealth', 'health', 'relationship', 'spiritual'];

// Yogas we report by name (only if present)
const NAMED_YOGAS = ['Raj Yoga', 'Dhana Yoga', 'Dhana Yoga (Venus)', 'Chandra-Mangal Yoga', 'Budha-Aditya Yoga'];

// Special rudraksha to include in output
const SPECIAL_RUDRAKSHA = [
  { name: 'Gaurishankar', description: 'Two naturally joined beads; unity and harmony.', benefits: ['Relationship harmony', 'Spiritual growth'] },
  { name: 'Trijuti', description: 'Three naturally joined beads; trinity of mind-body-soul.', benefits: ['Balance', 'Focus', 'Wisdom'] },
  { name: 'Ganesh', description: 'Resembles Ganesh trunk; removes obstacles.', benefits: ['Obstacle removal', 'Success', 'New beginnings'] },
  { name: 'Garbha Gauri', description: 'Rare bead with cavity; fertility and motherhood.', benefits: ['Fertility', 'Motherhood', 'Nurturing'] }
];

/**
 * Normalize kundali planets to array with name, sign, house, dignity for rule evaluation
 */
function normalizePlanets(planetsArray) {
  if (!Array.isArray(planetsArray)) return [];
  return planetsArray
    .filter(p => p && (p.id || p.name))
    .map(p => {
      const name = p.name || (p.id && p.id.charAt(0).toUpperCase() + (p.id || '').slice(1));
      const sign = p.sign != null ? Number(p.sign) : null;
      const house = p.house != null ? Number(p.house) : null;
      const dignity = chartAnalysis.getPlanetDignity(p);
      return {
        id: (p.id || '').toLowerCase(),
        name,
        sign,
        house,
        dignity,
        relation: p.relation,
        isRetrograde: !!p.retrograde,
        isCombust: !!p.isCombust
      };
    });
}

/**
 * Build houses object (1-12) with lord from ascendant sign
 */
function buildHouses(ascendantSign) {
  const sign = Math.min(12, Math.max(1, Number(ascendantSign)));
  const SIGN_LORDS = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun',
    6: 'Mercury', 7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn',
    11: 'Saturn', 12: 'Jupiter'
  };
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const houseSign = ((sign + h - 2) % 12) + 1;
    houses[h] = { number: h, sign: houseSign, lord: SIGN_LORDS[houseSign] };
  }
  return houses;
}

/**
 * Planets array → object keyed by id for YogaCalculator
 */
function planetsToMap(planetsArray) {
  if (!Array.isArray(planetsArray)) return {};
  const map = {};
  const ids = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  for (const p of planetsArray) {
    const id = (p.id || '').toLowerCase();
    if (ids.includes(id)) {
      map[id] = {
        id,
        name: p.name || id,
        sign: p.sign,
        house: p.house,
        longitude: p.longitude
      };
    }
  }
  return map;
}

/**
 * Get yogas that we name explicitly (Raj, Dhana, Chandra-Mangal, Budha-Aditya). Only if present.
 */
function getNamedYogas(rawYogas) {
  if (!Array.isArray(rawYogas)) return [];
  return rawYogas.filter(y => y && NAMED_YOGAS.includes(y.name));
}

/**
 * Get categorized recommendations for a kundali result.
 * @param {Object} kundaliResult - { planets, ascendant: { sign } } or { planets, ascendantSign }
 * @param {Object} [dasha] - optional current dasha for rule matching
 * @param {string} [nakshatraName] - optional Moon nakshatra name
 * @returns {Object} { yogasDetected, yogasSummary, categories, specialRudraksha }
 */
async function getCategorizedRecommendations(kundaliResult, dasha, nakshatraName) {
  const planetsArray = kundaliResult.planets || [];
  const ascendant = kundaliResult.ascendant || {};
  const ascendantSign = ascendant.sign != null ? ascendant.sign : kundaliResult.ascendantSign;

  const normalizedPlanets = normalizePlanets(planetsArray);
  const houses = buildHouses(ascendantSign);
  const planetsMap = planetsToMap(planetsArray);
  const lagna = { lord: houses[1] && houses[1].lord };

  // Yogas
  let rawYogas = [];
  try {
    const yogaCalculator = new YogaCalculator();
    rawYogas = yogaCalculator.calculateYogas(planetsMap, houses, lagna) || [];
  } catch (e) {
    rawYogas = [];
  }
  const namedYogas = getNamedYogas(rawYogas);
  const yogasSummary = namedYogas.length > 0
    ? namedYogas.map(y => ({ name: y.name, description: y.description || '' }))
    : [{ name: 'No major yoga', description: 'No major yoga (Raj, Dhana, Chandra-Mangal, Budha-Aditya) present in your chart.' }];

  const doshas = (rawYogas || []).filter(y => y.type === 'dosha_yoga').map(y => ({
    name: y.name,
    type: y.type,
    severity: y.strength === 'high' ? 'high' : y.strength === 'medium' ? 'medium' : 'low'
  }));

  const ruleService = new RecommendationRuleService();
  const ruleEvaluation = new RuleEvaluationService();

  const categories = [];
  for (const category of CATEGORIES) {
    const analysis = chartAnalysis.buildCategoryAnalysis(normalizedPlanets, doshas, namedYogas, category);

    let matchedRules = [];
    try {
      const rules = ruleService.getRulesByCategory(category);
      for (const rule of rules) {
        const isMatch = ruleEvaluation.evaluateRuleConditions(
          rule.conditions,
          normalizedPlanets,
          doshas,
          rawYogas,
          dasha,
          nakshatraName
        );
        if (isMatch) matchedRules.push(rule);
      }
      matchedRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } catch (e) {
      // no rules or DB error
    }

    const gems = [];
    const rudraksha = [];
    for (const rule of matchedRules) {
      const rec = rule.recommendations || {};
      
      // Process gemstones - fetch from GemCategoryModel if available
      if (rec.gemstones) {
        for (const g of rec.gemstones) {
          let gemData = {
            name: g.name,
            reason: g.reason || '',
            benefits: g.benefits || [],
            instructions: g.instructions || '',
            image: null, // Initialize image field
            categoryId: null,
            slug: null
          };
          
          // Try to fetch from MongoDB if model available
          if (GemCategoryModel && mongoose.connection.readyState === 1) {
            try {
              const gemCategory = await GemCategoryModel.findOne({
                name: { $regex: new RegExp(g.name, 'i') },
                isActive: true,
              });
              if (gemCategory) {
                gemData = {
                  name: gemCategory.name,
                  reason: g.reason || '',
                  benefits: g.benefits && g.benefits.length > 0 ? g.benefits : (gemCategory.benefits || []),
                  instructions: g.instructions || '',
                  description: gemCategory.description || '',
                  detailedDescription: gemCategory.detailedDescription || '',
                  associatedPlanet: gemCategory.associatedPlanet || '',
                  associatedDeity: gemCategory.associatedDeity || '',
                  image: gemCategory.image || null, // Use null instead of empty string
                  categoryId: gemCategory._id ? gemCategory._id.toString() : null,
                  slug: gemCategory.slug || '',
                  categoryType: gemCategory.categoryType || '',
                  gemType: gemCategory.gemType || '',
                  spiritualSignificance: gemCategory.spiritualSignificance || '',
                  priceRange: gemCategory.priceRange || null
                };
                console.log(`Fetched gem category: ${gemCategory.name}, image: ${gemCategory.image || 'none'}`);
              } else {
                console.warn(`Gem category not found for: ${g.name}`);
              }
            } catch (e) {
              console.error('Error fetching gem category:', e);
              // Use rule data if DB fetch fails
            }
          }
          
          gems.push(gemData);
        }
      }
      
      // Process rudraksha - fetch from RudrakshaCategoryModel if available
      if (rec.rudraksha) {
        for (const r of rec.rudraksha) {
          let rudrakshaData = {
            name: `${r.mukhiCount} Mukhi Rudraksha`,
            mukhiCount: r.mukhiCount,
            reason: r.reason || '',
            benefits: r.benefits || [],
            instructions: r.instructions || '',
            image: null, // Initialize image field
            categoryId: null,
            slug: null
          };
          
          // Try to fetch from MongoDB if model available
          if (RudrakshaCategoryModel && mongoose.connection.readyState === 1) {
            try {
              let rudrakshaCategory = await RudrakshaCategoryModel.findOne({
                mukhiCount: r.mukhiCount,
                isActive: true,
              });
              
              // If not found by mukhiCount, try to find by name pattern
              if (!rudrakshaCategory && r.mukhiCount) {
                const namePattern = `${r.mukhiCount} mukhi`;
                rudrakshaCategory = await RudrakshaCategoryModel.findOne({
                  slug: { $regex: new RegExp(namePattern, 'i') },
                  isActive: true,
                });
              }
              
              if (rudrakshaCategory) {
                rudrakshaData = {
                  name: rudrakshaCategory.name,
                  mukhiCount: rudrakshaCategory.mukhiCount || r.mukhiCount,
                  reason: r.reason || '',
                  benefits: r.benefits && r.benefits.length > 0 ? r.benefits : (rudrakshaCategory.benefits || []),
                  instructions: r.instructions || '',
                  description: rudrakshaCategory.description || '',
                  detailedDescription: rudrakshaCategory.detailedDescription || '',
                  associatedPlanet: rudrakshaCategory.associatedPlanet || '',
                  associatedDeity: rudrakshaCategory.associatedDeity || '',
                  image: rudrakshaCategory.image || null,
                  categoryId: rudrakshaCategory._id ? rudrakshaCategory._id.toString() : null,
                  slug: rudrakshaCategory.slug || '',
                  categoryType: rudrakshaCategory.categoryType || 'mukhi',
                  spiritualSignificance: rudrakshaCategory.spiritualSignificance || '',
                  priceRange: rudrakshaCategory.priceRange || null
                };
                console.log(`Fetched rudraksha category: ${rudrakshaCategory.name}, image: ${rudrakshaCategory.image || 'none'}`);
              } else {
                console.warn(`Rudraksha category not found for mukhiCount: ${r.mukhiCount}`);
              }
            } catch (e) {
              console.error('Error fetching rudraksha category:', e);
              // Use rule data if DB fetch fails
            }
          }
          
          rudraksha.push(rudrakshaData);
        }
      }
    }

    // Fallback: If no gems/rudraksha from rules, provide general recommendations based on category planets
    if (gems.length === 0 && rudraksha.length === 0) {
      const mapping = chartAnalysis.CATEGORY_MAPPING[category];
      if (mapping && mapping.planets) {
        const planetGemMap = {
          'Sun': { gem: 'Ruby', rudraksha: 12, day: 'Sunday', finger: 'ring' },
          'Moon': { gem: 'Pearl', rudraksha: 2, day: 'Monday', finger: 'little' },
          'Mars': { gem: 'Red Coral', rudraksha: 3, day: 'Tuesday', finger: 'ring' },
          'Mercury': { gem: 'Emerald', rudraksha: 4, day: 'Wednesday', finger: 'little' },
          'Jupiter': { gem: 'Yellow Sapphire', rudraksha: 5, day: 'Thursday', finger: 'index' },
          'Venus': { gem: 'Diamond', rudraksha: 6, day: 'Friday', finger: 'middle' },
          'Saturn': { gem: 'Blue Sapphire', rudraksha: 7, day: 'Saturday', finger: 'middle' },
          'Ketu': { gem: "Cat's Eye", rudraksha: 9, day: 'Tuesday', finger: 'middle' }
        };

        for (const planetName of mapping.planets) {
          const planetData = planetGemMap[planetName];
          if (planetData) {
            // Add gem
            let gemData = {
              name: planetData.gem,
              reason: `${planetName} influences this area. ${planetData.gem} strengthens ${planetName}'s positive effects.`,
              benefits: [`Supports ${category}`, `Strengthens ${planetName}`, 'Enhances positive energies'],
              instructions: `Wear ${planetData.gem} in ${planetData.finger} finger on ${planetData.day}.`,
              image: null, // Initialize image field
              categoryId: null,
              slug: null
            };
            
            // Try to fetch from DB
            if (GemCategoryModel && mongoose.connection.readyState === 1) {
              try {
                const gemCategory = await GemCategoryModel.findOne({
                  name: { $regex: new RegExp(planetData.gem, 'i') },
                  isActive: true,
                });
                if (gemCategory) {
                  gemData = {
                    name: gemCategory.name,
                    reason: gemData.reason,
                    benefits: gemCategory.benefits || gemData.benefits,
                    instructions: gemData.instructions,
                    description: gemCategory.description || '',
                    detailedDescription: gemCategory.detailedDescription || '',
                    associatedPlanet: gemCategory.associatedPlanet || planetName,
                    associatedDeity: gemCategory.associatedDeity || '',
                    image: gemCategory.image || null, // Use null instead of empty string
                    categoryId: gemCategory._id ? gemCategory._id.toString() : null,
                    slug: gemCategory.slug || '',
                    categoryType: gemCategory.categoryType || '',
                    gemType: gemCategory.gemType || '',
                    spiritualSignificance: gemCategory.spiritualSignificance || '',
                    priceRange: gemCategory.priceRange || null
                  };
                  console.log(`Fetched fallback gem: ${gemCategory.name}, image: ${gemCategory.image || 'none'}`);
                } else {
                  console.warn(`Fallback gem category not found for: ${planetData.gem}`);
                }
              } catch (e) {
                console.error('Error fetching gem category for fallback:', e);
              }
            }
            gems.push(gemData);

            // Add rudraksha
            let rudrakshaData = {
              name: `${planetData.rudraksha} Mukhi Rudraksha`,
              mukhiCount: planetData.rudraksha,
              reason: `${planetName} influences this area. ${planetData.rudraksha} Mukhi Rudraksha is ruled by ${planetName}.`,
              benefits: [`Supports ${category}`, `Strengthens ${planetName}`, 'Spiritual protection'],
              instructions: `Wear ${planetData.rudraksha} Mukhi Rudraksha and chant ${planetName} mantras.`,
              image: null, // Initialize image field
              categoryId: null,
              slug: null
            };
            
            // Try to fetch from DB
            if (RudrakshaCategoryModel && mongoose.connection.readyState === 1) {
              try {
                let rudrakshaCategory = await RudrakshaCategoryModel.findOne({
                  mukhiCount: planetData.rudraksha,
                  isActive: true,
                });
                
                // If not found, try by slug pattern
                if (!rudrakshaCategory) {
                  const namePattern = `${planetData.rudraksha} mukhi`;
                  rudrakshaCategory = await RudrakshaCategoryModel.findOne({
                    slug: { $regex: new RegExp(namePattern, 'i') },
                    isActive: true,
                  });
                }
                
                if (rudrakshaCategory) {
                  rudrakshaData = {
                    name: rudrakshaCategory.name,
                    mukhiCount: rudrakshaCategory.mukhiCount || planetData.rudraksha,
                    reason: rudrakshaData.reason,
                    benefits: rudrakshaCategory.benefits || rudrakshaData.benefits,
                    instructions: rudrakshaData.instructions,
                    description: rudrakshaCategory.description || '',
                    detailedDescription: rudrakshaCategory.detailedDescription || '',
                    associatedPlanet: rudrakshaCategory.associatedPlanet || planetName,
                    associatedDeity: rudrakshaCategory.associatedDeity || '',
                    image: rudrakshaCategory.image || null, // Use null instead of empty string
                    categoryId: rudrakshaCategory._id ? rudrakshaCategory._id.toString() : null,
                    slug: rudrakshaCategory.slug || '',
                    categoryType: rudrakshaCategory.categoryType || 'mukhi',
                    spiritualSignificance: rudrakshaCategory.spiritualSignificance || '',
                    priceRange: rudrakshaCategory.priceRange || null
                  };
                  console.log(`Fetched fallback rudraksha: ${rudrakshaCategory.name}, image: ${rudrakshaCategory.image || 'none'}`);
                } else {
                  console.warn(`Fallback rudraksha category not found for mukhiCount: ${planetData.rudraksha}`);
                }
              } catch (e) {
                console.error('Error fetching rudraksha category for fallback:', e);
              }
            }
            rudraksha.push(rudrakshaData);
          }
        }
      }
    }

    categories.push({
      category,
      analysis,
      gems: dedupeByKey(gems, 'name'),
      rudraksha: dedupeByKey(rudraksha, 'name')
    });
  }

  // Fetch special rudraksha from DB if available
  let specialRudrakshaList = SPECIAL_RUDRAKSHA;
  if (RudrakshaCategoryModel && mongoose.connection.readyState === 1) {
    try {
      const specialRudrakshaFromDb = await RudrakshaCategoryModel.find({
        categoryType: 'special',
        isActive: true,
      }).sort({ displayOrder: 1 });
      
      if (specialRudrakshaFromDb && specialRudrakshaFromDb.length > 0) {
        specialRudrakshaList = specialRudrakshaFromDb.map(cat => ({
          name: cat.name,
          description: cat.description || '',
          detailedDescription: cat.detailedDescription || '',
          benefits: cat.benefits || [],
          associatedPlanet: cat.associatedPlanet || '',
          associatedDeity: cat.associatedDeity || '',
          image: cat.image || '',
          categoryId: cat._id ? cat._id.toString() : null,
          slug: cat.slug || '',
          categoryType: cat.categoryType || 'special',
          spiritualSignificance: cat.spiritualSignificance || '',
          priceRange: cat.priceRange || null
        }));
      }
    } catch (e) {
      // Use hardcoded list if DB fetch fails
    }
  }

  return {
    categories,
    specialRudraksha: specialRudrakshaList
  };
}

function dedupeByKey(arr, key) {
  const seen = new Set();
  return arr.filter(x => {
    const k = x[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

module.exports = {
  getCategorizedRecommendations,
  CATEGORIES,
  SPECIAL_RUDRAKSHA,
  normalizePlanets,
  buildHouses,
  getNamedYogas
};
