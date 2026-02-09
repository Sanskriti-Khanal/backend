/**
 * Chart Analysis Utility
 * Planet dignity (debilitation, bad houses, enemy signs) and category mapping
 * for justified gem/rudraksha recommendations.
 */

const planetRelations = require('./planetRelations');

// Debilitation sign (1-12) per planet: Sun/Libra=7, Moon/Scorpio=8, Mars/Cancer=4, etc.
const DEBILITATION_SIGNS = {
  sun: 7, moon: 8, mars: 4, mercury: 12, jupiter: 10, venus: 6, saturn: 1
};

// Bad houses (dusthana) = weak
const BAD_HOUSES = [6, 8, 12];

// Enemy signs (1-12) per planet — classical; debilitation already implies weakness
const ENEMY_SIGNS = {
  sun: [2, 7],      // Taurus, Libra
  moon: [8, 10],     // Scorpio, Capricorn
  mars: [3, 6],      // Gemini, Virgo
  mercury: [5, 6],   // Leo, Virgo
  jupiter: [3, 10],  // Gemini, Capricorn
  venus: [1, 7],    // Aries, Libra
  saturn: [1, 7]    // Aries, Libra
};

// Category → houses and planets that govern that life area
const CATEGORY_MAPPING = {
  study:    { houses: [4, 5, 9],  planets: ['Mercury', 'Jupiter'] },
  career:   { houses: [6, 10, 2], planets: ['Sun', 'Saturn', 'Mercury'] },
  wealth:   { houses: [2, 5, 11], planets: ['Jupiter', 'Venus'] },
  health:   { houses: [1, 6, 8],  planets: ['Sun', 'Moon', 'Mars'] },
  relationship: { houses: [5, 7, 4], planets: ['Venus', 'Mars'] },
  spiritual:   { houses: [9, 12],  planets: ['Jupiter', 'Ketu'] }
};

/**
 * Get dignity string for rule matching: debilitated | enemy_sign | exalted | neutral
 */
function getPlanetDignity(planet) {
  if (!planet) return 'neutral';
  const id = (planet.id || (planet.name && planet.name.toLowerCase().replace(/\s/g, '')) || '').toLowerCase();
  const sign = planet.sign != null ? Number(planet.sign) : null;
  const relation = (planet.relation || planet.dignity || '').toString().trim();

  if (relation.toLowerCase() === 'exalted') return 'exalted';
  if (relation.toLowerCase() === 'debilitated') return 'debilitated';
  if (relation.toLowerCase() === 'enemy') return 'enemy_sign';

  if (sign == null || !DEBILITATION_SIGNS[id]) return 'neutral';
  if (DEBILITATION_SIGNS[id] === sign) return 'debilitated';
  const enemyList = ENEMY_SIGNS[id];
  if (enemyList && enemyList.includes(sign)) return 'enemy_sign';
  const rel = planetRelations.calculatePlanetRelation(id, sign);
  if (rel === 'Exalted') return 'exalted';
  if (rel === 'Debilitated') return 'debilitated';
  return 'neutral';
}

/**
 * Check if planet is in a bad (dusthana) house
 */
function isInBadHouse(planet) {
  const house = planet.house != null ? Number(planet.house) : null;
  return house != null && BAD_HOUSES.includes(house);
}

/**
 * Analyze a single planet for a category: is it relevant and weak?
 * @returns { { relevant, weak, reason } }
 */
function analyzePlanetForCategory(planet, category) {
  const mapping = CATEGORY_MAPPING[category];
  if (!mapping) return { relevant: false, weak: false, reason: '' };

  const name = planet.name || (planet.id && planet.id.replace(/^./, c => c.toUpperCase()));
  const isRelevantPlanet = mapping.planets.some(p => p.toLowerCase() === (name || '').toLowerCase());
  const house = planet.house != null ? Number(planet.house) : null;
  const isRelevantHouse = house != null && mapping.houses.includes(house);

  if (!isRelevantPlanet && !isRelevantHouse) return { relevant: false, weak: false, reason: '' };

  const dignity = getPlanetDignity(planet);
  const inBadHouse = isInBadHouse(planet);
  const weak = dignity === 'debilitated' || dignity === 'enemy_sign' || inBadHouse;

  let reason = '';
  if (dignity === 'debilitated') reason = `${name} is debilitated`;
  else if (dignity === 'enemy_sign') reason = `${name} is in enemy sign`;
  else if (inBadHouse) reason = `${name} in house ${house} (weak house)`;
  if (reason) reason += ' → needs strengthening';

  return { relevant: true, weak, reason };
}

/**
 * Build analysis text for a category from chart data
 */
function buildCategoryAnalysis(planets, doshas, yogasForCategory, category) {
  const mapping = CATEGORY_MAPPING[category];
  if (!mapping) {
    const categoryNames = {
      study: 'Study and education',
      career: 'Career and profession',
      wealth: 'Wealth and finances',
      health: 'Health and wellbeing',
      relationship: 'Relationships and partnerships',
      spiritual: 'Spiritual growth'
    };
    return `Recommendations for ${categoryNames[category] || category} based on planetary influences.`;
  }

  const points = [];
  const relevantPlanets = [];
  
  for (const planet of planets) {
    const a = analyzePlanetForCategory(planet, category);
    if (a.relevant) {
      relevantPlanets.push(planet.name || planet.id);
      if (a.weak && a.reason) points.push(a.reason);
    }
  }
  
  if (doshas && doshas.length > 0) {
    const names = doshas.map(d => d.name || d.type).filter(Boolean).join(', ');
    if (names) points.push(`${names} present → remedies suggested`);
  }
  
  if (points.length > 0) {
    return points.join('. ');
  }
  
  // Always provide positive analysis
  const planetNames = relevantPlanets.length > 0 
    ? relevantPlanets.join(', ')
    : mapping.planets.join(', ');
  return `This area is influenced by ${planetNames}. Wearing recommended gems and rudraksha supports and strengthens these planetary energies.`;
}

module.exports = {
  DEBILITATION_SIGNS,
  BAD_HOUSES,
  CATEGORY_MAPPING,
  getPlanetDignity,
  isInBadHouse,
  analyzePlanetForCategory,
  buildCategoryAnalysis
};
