/**
 * Graha Sthiti Analysis Service
 *
 * Reads planetary positions (sign, house, nakshatra) from Kundali result (Graha Sthiti)
 * and returns:
 * - Detected yogas with brief explanations
 * - Life areas (houses 1-12) with influencing planets
 * - Gemstone and Rudraksha recommendations per life area based on planetary influence
 * - Weak/afflicted planets prioritized in recommendations
 *
 * No hardcoded charts — all data from the provided Kundali result.
 */

const YogaCalculator = require('./YogaCalculator');

// Life area names by house (1-12)
const LIFE_AREAS = {
  1: 'Self, personality, health',
  2: 'Wealth, family, speech',
  3: 'Courage, siblings, short journeys',
  4: 'Home, comfort, mother',
  5: 'Education, creativity, children',
  6: 'Health, daily work, enemies',
  7: 'Marriage, partnerships, business partnerships',
  8: 'Longevity, hidden matters, transformations',
  9: 'Luck, higher learning, spiritual pursuits, mentors',
  10: 'Career, reputation, authority',
  11: 'Gains, income, social networks',
  12: 'Expenses, foreign lands, liberation, spirituality'
};

// Sign number (1-12) → lord planet name (for house lord)
const SIGN_LORDS = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun',
  6: 'Mercury', 7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn',
  11: 'Saturn', 12: 'Jupiter'
};

// Planet id → display name
const PLANET_DISPLAY_NAMES = {
  sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury',
  jupiter: 'Jupiter', venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu'
};

// Vedic gemstone associations (primary and alternatives)
const PLANET_GEMS = {
  sun: ['Ruby (Manikya)', 'Red Coral', 'Sunstone'],
  moon: ['Pearl (Moti)', 'Moonstone', 'White Coral'],
  mars: ['Red Coral (Moonga)', 'Carnelian', 'Red Jasper'],
  mercury: ['Emerald (Panna)', 'Green Jade', 'Peridot'],
  jupiter: ['Yellow Sapphire (Pukhraj)', 'Yellow Topaz', 'Citrine'],
  venus: ['Diamond (Heera)', 'White Sapphire', 'Opal'],
  saturn: ['Blue Sapphire (Neelam)', 'Amethyst', 'Blue Topaz'],
  rahu: ['Hessonite (Gomed)', 'Smoky Quartz', 'Garnet'],
  ketu: ["Cat's Eye (Lehsunia)", 'Amber', 'Sphalerite']
};

// Rudraksha mukhi (faces) by planet
const PLANET_RUDRAKSHA = {
  sun: ['1 Mukhi Rudraksha'],
  moon: ['2 Mukhi Rudraksha'],
  mars: ['3 Mukhi Rudraksha'],
  mercury: ['4 Mukhi Rudraksha'],
  jupiter: ['5 Mukhi Rudraksha'],
  venus: ['6 Mukhi Rudraksha'],
  saturn: ['7 Mukhi Rudraksha'],
  rahu: ['8 Mukhi Rudraksha'],
  ketu: ['9 Mukhi Rudraksha']
};

/**
 * Check if a planet is weak or afflicted (prioritize for remedies).
 */
function isPlanetWeak(planet) {
  if (!planet) return false;
  const relation = (planet.relation || '').toLowerCase();
  const house = planet.house != null ? Number(planet.house) : null;
  const dusthana = [6, 8, 12];
  if (relation === 'debilitated') return true;
  if (house != null && dusthana.includes(house)) return true;
  if (planet.retrograde) return true;
  return false;
}

/**
 * Build houses object (1-12) with sign and lord from ascendant sign.
 */
function buildHousesFromAscendant(ascendantSign) {
  const sign = Math.min(12, Math.max(1, Number(ascendantSign)));
  const houses = {};
  for (let h = 1; h <= 12; h++) {
    const houseSign = ((sign + h - 2) % 12) + 1;
    houses[h] = { number: h, sign: houseSign, lord: SIGN_LORDS[houseSign] };
  }
  return houses;
}

/**
 * Convert planets array (from Kundali Graha Sthiti) to object keyed by id for YogaCalculator.
 */
function planetsArrayToMap(planets) {
  if (!Array.isArray(planets)) return {};
  const map = {};
  for (const p of planets) {
    const id = (p.id || '').toLowerCase();
    if (id && ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'].includes(id)) {
      map[id] = {
        id,
        name: p.name || PLANET_DISPLAY_NAMES[id],
        sign: p.sign,
        house: p.house,
        longitude: p.longitude,
        nakshatra: p.nakshatra,
        relation: p.relation,
        retrograde: p.retrograde
      };
    }
  }
  return map;
}

/**
 * Get list of planets influencing a house: planets in that house + house lord.
 */
function getPlanetsInfluencingHouse(houseNumber, planetsArray, houses) {
  const influencing = [];
  const lordName = (houses[houseNumber] && houses[houseNumber].lord) || null;
  const lordId = lordName ? Object.keys(PLANET_DISPLAY_NAMES).find(k => PLANET_DISPLAY_NAMES[k] === lordName) : null;

  for (const p of planetsArray) {
    const h = p.house != null ? Number(p.house) : null;
    if (h === houseNumber) influencing.push({ id: (p.id || '').toLowerCase(), name: p.name || PLANET_DISPLAY_NAMES[(p.id || '').toLowerCase()], isLord: false });
  }
  if (lordId && !influencing.some(x => x.id === lordId)) {
    influencing.push({ id: lordId, name: lordName, isLord: true });
  }
  return influencing;
}

/**
 * Analyze Graha Sthiti (planetary positions) from Kundali result and return yogas + life-area recommendations in JSON.
 *
 * @param {Object} kundaliResult - Must contain:
 *   - planets: Array of { id, name?, sign, house, degree?, nakshatra?, relation?, avastha?, retrograde? }
 *   - ascendant: { sign } (or ascendantSign at top level)
 * @returns {Object} { yogas: [...], lifeAreas: [...] } in the specified JSON format
 */
function analyzeGrahaSthiti(kundaliResult) {
  const planetsArray = kundaliResult.planets || [];
  const ascendant = kundaliResult.ascendant || {};
  const ascendantSign = ascendant.sign != null ? ascendant.sign : kundaliResult.ascendantSign;

  if (!Array.isArray(planetsArray) || planetsArray.length === 0) {
    return { yogas: [], lifeAreas: [] };
  }

  const houses = buildHousesFromAscendant(ascendantSign);
  const planetsMap = planetsArrayToMap(planetsArray);
  const lagna = { lord: houses[1] && houses[1].lord };

  // Detect yogas using YogaCalculator (expects planets object and houses with lord)
  const yogaCalculator = new YogaCalculator();
  let rawYogas = [];
  try {
    rawYogas = yogaCalculator.calculateYogas(planetsMap, houses, lagna);
  } catch (e) {
    rawYogas = [];
  }

  const yogas = (rawYogas || []).map(y => ({
    name: y.name || 'Yoga',
    description: y.description || ''
  }));

  const lifeAreas = [];

  for (let houseNum = 1; houseNum <= 12; houseNum++) {
    const areaName = LIFE_AREAS[houseNum];
    const influencing = getPlanetsInfluencingHouse(houseNum, planetsArray, houses);
    const planetIds = influencing.map(x => x.id).filter(Boolean);
    const planetNames = influencing.map(x => x.name || PLANET_DISPLAY_NAMES[x.id]).filter(Boolean);

    // Collect gems and Rudraksha: prioritize weak/afflicted planets first, then others
    const withStrength = influencing.map(infl => {
      const p = planetsArray.find(pl => (pl.id || '').toLowerCase() === infl.id);
      return { ...infl, weak: p ? isPlanetWeak(p) : false };
    }).sort((a, b) => (b.weak ? 1 : 0) - (a.weak ? 1 : 0));

    const gemsSet = new Set();
    const rudrakshaSet = new Set();
    for (const { id } of withStrength) {
      if (PLANET_GEMS[id]) PLANET_GEMS[id].slice(0, 2).forEach(g => gemsSet.add(g));
      if (PLANET_RUDRAKSHA[id]) PLANET_RUDRAKSHA[id].forEach(r => rudrakshaSet.add(r));
    }
    const recommendedGems = Array.from(gemsSet).slice(0, 3);
    const recommendedRudraksha = Array.from(rudrakshaSet).slice(0, 3);

    const weakCount = withStrength.filter(x => x.weak).length;
    const description = weakCount > 0
      ? `House ${houseNum} (${areaName}) is influenced by ${planetNames.join(', ')}. Some planets are weak or afflicted; these gems and Rudraksha help strengthen them and support this life area.`
      : `House ${houseNum} (${areaName}) is influenced by ${planetNames.join(', ')}. Wearing the suggested gems and Rudraksha supports this area of life.`;

    lifeAreas.push({
      area: areaName,
      house: houseNum,
      planets: planetNames.length ? planetNames : ['None in this house'],
      recommendedGems: recommendedGems.length ? recommendedGems : ['Consult an astrologer for this house'],
      recommendedRudraksha: recommendedRudraksha.length ? recommendedRudraksha : ['Consult an astrologer for this house'],
      description
    });
  }

  return { yogas, lifeAreas };
}

module.exports = {
  analyzeGrahaSthiti,
  LIFE_AREAS,
  buildHousesFromAscendant,
  planetsArrayToMap,
  getPlanetsInfluencingHouse,
  isPlanetWeak
};
