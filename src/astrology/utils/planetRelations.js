/**
 * Planet Relations Utility
 * 
 * Calculates planet relations (Friendly, Enemy, Exalted, Debilitated, Neutral)
 * based on sign positions in Vedic astrology
 */

// Exaltation signs: [Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn]
const EXALTATION_SIGNS = [1, 2, 10, 6, 4, 12, 7]; // Aries, Taurus, Capricorn, Virgo, Cancer, Pisces, Libra

// Debilitation signs (opposite of exaltation)
const DEBILITATION_SIGNS = [7, 8, 4, 12, 10, 6, 1]; // Libra, Scorpio, Cancer, Pisces, Capricorn, Virgo, Aries

// Planet indices: [Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu]
const PLANET_INDICES = {
  sun: 0,
  moon: 1,
  mars: 2,
  mercury: 3,
  jupiter: 4,
  venus: 5,
  saturn: 6,
  rahu: 7,
  ketu: 8
};

/**
 * Calculate planet relation based on sign
 * 
 * @param {string} planetId - Planet ID ('sun', 'moon', etc.)
 * @param {number} sign - Sign number (1-12)
 * @returns {string} Relation: 'Exalted', 'Debilitated', 'Friendly', 'Enemy', 'Neutral', or '-'
 */
function calculatePlanetRelation(planetId, sign) {
  const planetIndex = PLANET_INDICES[planetId];
  
  // Rahu and Ketu don't have exaltation/debilitation
  if (planetId === 'rahu' || planetId === 'ketu') {
    return '-';
  }
  
  if (planetIndex === undefined) {
    return '-';
  }
  
  // Check exaltation
  if (EXALTATION_SIGNS[planetIndex] === sign) {
    return 'Exalted';
  }
  
  // Check debilitation
  if (DEBILITATION_SIGNS[planetIndex] === sign) {
    return 'Debilitated';
  }
  
  // For now, return 'Neutral' for other cases
  // Can be extended with friendly/enemy logic based on sign lordships
  return 'Neutral';
}

module.exports = {
  calculatePlanetRelation
};

