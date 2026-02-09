/**
 * Navamsa Utility
 * 
 * Calculates Navamsa (9th divisional chart) positions from sidereal longitude.
 * 
 * Navamsa divides each sign (30°) into 9 equal parts of 3°20' (3.333... degrees) each.
 * Each part corresponds to a sign based on a specific pattern.
 */

const ephemeris = require('./ephemeris');

// Navamsa division size in degrees (3°20' = 3.333... degrees)
const NAVAMSA_DIVISION_SIZE = 3.3333333333333335; // 3°20' = 200/60 degrees

/**
 * Java-compatible division index selection (matches smali `OooOoo0`)
 * Uses: (i * size) < degreeInSign <= ((i + 1) * size)
 */
function getJavaDivisionIndex0(division, degreeInSign) {
  const size = 30 / division;
  let deg = degreeInSign;
  if (!Number.isFinite(deg)) deg = 0;
  if (deg < 0) deg = 0;
  if (deg > 30) deg = 30;
  if (deg === 0) deg = 1e-12;

  let i = 0;
  for (; i < division; i++) {
    const lower = i * size;
    const upper = (i + 1) * size;
    if (deg > lower && deg <= upper) break;
  }
  if (i < 0) i = 0;
  if (i >= division) i = division - 1;
  return i;
}

/**
 * Calculate Navamsa sign from sidereal longitude
 * 
 * Navamsa pattern based on sign nature:
 * - Movable signs (Chara): Aries(1), Cancer(4), Libra(7), Capricorn(10)
 *   → Navamsa divisions 1-9 start from the sign itself
 * - Fixed signs (Sthira): Taurus(2), Leo(5), Scorpio(8), Aquarius(11)
 *   → Navamsa divisions 1-9 start from sign 7 (Libra)
 * - Dual signs (Dvisvabhava): Gemini(3), Virgo(6), Sagittarius(9), Pisces(12)
 *   → Navamsa divisions 1-9 start from sign 5 (Leo)
 * 
 * @param {number} siderealLongitude - Sidereal longitude in degrees (0-360)
 * @returns {Object} Navamsa data
 */
function calculateNavamsa(siderealLongitude) {
  // Normalize longitude to 0-360
  let lon = siderealLongitude;
  while (lon < 0) lon += 360;
  while (lon >= 360) lon -= 360;
  
  // Get the sign (1-12) and degree within sign (0-30)
  const sign = ephemeris.getSign(lon);
  const degreeInSign = ephemeris.getDegreeInSign(lon);
  
  // Java-compatible division selection (smali OooOoo0)
  const navamsaIndex0 = getJavaDivisionIndex0(9, degreeInSign); // 0..8
  const navamsaDivision = navamsaIndex0 + 1; // 1..9
  
  // Determine sign nature: Movable, Fixed, or Dual
  // Movable (Chara): 1, 4, 7, 10
  // Fixed (Sthira): 2, 5, 8, 11
  // Dual (Dvisvabhava): 3, 6, 9, 12
  const isMovable = (sign === 1 || sign === 4 || sign === 7 || sign === 10);
  const isFixed = (sign === 2 || sign === 5 || sign === 8 || sign === 11);
  const isDual = (sign === 3 || sign === 6 || sign === 9 || sign === 12);
  
  // Calculate navamsa sign based on pattern from the sign itself:
  // Use 0-based indices internally: 0 = Aries, ..., 11 = Pisces
  const signIndex0 = sign - 1;
  let baseIndex0;
  if (isMovable) {
    // Movable signs: start from the sign itself
    baseIndex0 = signIndex0;
  } else if (isFixed) {
    // Fixed signs: start from the 9th sign from it → (sign + 8)
    baseIndex0 = (signIndex0 + 8) % 12;
  } else if (isDual) {
    // Dual signs: start from the 5th sign from it → (sign + 4)
    baseIndex0 = (signIndex0 + 4) % 12;
  } else {
    baseIndex0 = signIndex0;
  }
  
  // Division 1 → offset 0, Division 2 → offset 1, ..., Division 9 → offset 8
  const navamsaSignIndex0 = (baseIndex0 + (navamsaDivision - 1)) % 12;
  let navamsaSign = navamsaSignIndex0 + 1;
  
  // Ensure navamsa sign is 1-12
  if (navamsaSign < 1) navamsaSign = 1;
  if (navamsaSign > 12) navamsaSign = 12;
  
  // Calculate degree within navamsa sign
  // Position within the navamsa division (0 to NAVAMSA_DIVISION_SIZE)
  const positionInDivision = degreeInSign - (navamsaIndex0 * NAVAMSA_DIVISION_SIZE);
  const clampedPosition = Math.max(0, Math.min(positionInDivision, NAVAMSA_DIVISION_SIZE));
  // Scale to 0-30 degrees within navamsa sign
  const navamsaDegree = clampedPosition * 9;
  
  return {
    sign: navamsaSign,
    division: navamsaDivision,
    degree: navamsaDegree,
    originalSign: sign,
    originalDegree: degreeInSign
  };
}

/**
 * Calculate Navamsa house from Navamsa sign and Navamsa ascendant sign
 * 
 * @param {number} navamsaSign - Navamsa sign (1-12)
 * @param {number} navamsaAscendantSign - Navamsa ascendant sign (1-12)
 * @returns {number} Navamsa house number (1-12)
 */
function getNavamsaHouse(navamsaSign, navamsaAscendantSign) {
  // Navamsa house calculation - planets are shifted one house ahead
  // Standard formula gives house N, but should be house N-1 (or house 12 if N=1)
  // Formula: ((planetSign - ascSign + 12) % 12) then subtract 1, wrapping around
  // Normalize signs to 1-12
  let pSign = navamsaSign;
  let aSign = navamsaAscendantSign;
  while (pSign < 1) pSign += 12;
  while (pSign > 12) pSign -= 12;
  while (aSign < 1) aSign += 12;
  while (aSign > 12) aSign -= 12;
  
  // Calculate house using standard formula, then subtract 1 to fix the shift
  let house = ((pSign - aSign + 12) % 12) + 1;
  house = house - 1;
  if (house < 1) house = 12; // Wrap around
  
  // Ensure house is 1-12
  if (house < 1) house = 1;
  if (house > 12) house = 12;
  
  return house;
}

/**
 * Calculate Navamsa positions for all planets and ascendant
 * 
 * @param {Array} planets - Array of planet objects with longitude property
 * @param {Object} ascendant - Ascendant object with longitude property
 * @returns {Object} Navamsa chart data
 */
function calculateNavamsaChart(planets, ascendant) {
  // Calculate Navamsa ascendant
  const ascLon = (ascendant && typeof ascendant.rawLongitude === 'number')
    ? ascendant.rawLongitude
    : ascendant.longitude;
  const navamsaAsc = calculateNavamsa(ascLon);
  
  // Calculate Navamsa positions for all planets
  const navamsaPlanets = planets.map(planet => {
    const pLon = (planet && typeof planet.rawLongitude === 'number')
      ? planet.rawLongitude
      : planet.longitude;
    const navamsa = calculateNavamsa(pLon);
    return {
      ...planet,
      navamsa: {
        sign: navamsa.sign,
        degree: navamsa.degree,
        house: getNavamsaHouse(navamsa.sign, navamsaAsc.sign),
        division: navamsa.division,
        originalSign: navamsa.originalSign,
        originalDegree: navamsa.originalDegree
      }
    };
  });
  
  // Calculate Navamsa ascendant object
  const navamsaAscendant = {
    ...ascendant,
    navamsa: {
      sign: navamsaAsc.sign,
      degree: navamsaAsc.degree,
      house: 1,
      division: navamsaAsc.division,
      originalSign: navamsaAsc.originalSign,
      originalDegree: navamsaAsc.originalDegree
    }
  };
  
  return {
    ascendant: navamsaAscendant,
    planets: navamsaPlanets,
    ascendantSign: navamsaAsc.sign
  };
}

module.exports = {
  calculateNavamsa,
  getNavamsaHouse,
  calculateNavamsaChart,
  NAVAMSA_DIVISION_SIZE
};

