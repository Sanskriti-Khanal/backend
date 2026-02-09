/**
 * Divisional Charts (Varga Charts) Utility
 * 
 * Implements all major divisional charts used in Vedic astrology
 * Based on Jagannatha Hora calculation methods
 */

const ephemeris = require('./ephemeris');
const navamsa = require('./navamsa');

/**
 * Java-compatible division index selection (matches smali `OooOoo0`)
 *
 * Java logic uses strict lower bound and inclusive upper bound:
 *   (i * size) < degreeInSign <= ((i + 1) * size)
 *
 * Notes:
 * - `degreeInSign` is expected to be within [0, 30)
 * - We add a tiny epsilon if degree is exactly 0 to avoid the Java fall-through
 *   edge case that would return `division` (out of range) due to floating rounding.
 */
function getJavaDivisionIndex0(division, degreeInSign) {
  const size = 30 / division;
  let deg = degreeInSign;

  // Normalize/guard against floating-point edge cases
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

  // Safety clamp (should not trigger with normalized inputs)
  if (i < 0) i = 0;
  if (i >= division) i = division - 1;
  return i;
}

/**
 * Calculate divisional chart sign from longitude
 * 
 * @param {number} siderealLongitude - Sidereal longitude in degrees
 * @param {number} division - Division number (9 for Navamsa, 10 for Dashamsa, etc.)
 * @param {string} chartType - Chart type identifier
 * @returns {Object} Divisional chart data
 */
function calculateDivisionalChart(siderealLongitude, division, chartType = 'standard') {
  // Normalize longitude to 0-360
  let lon = siderealLongitude;
  while (lon < 0) lon += 360;
  while (lon >= 360) lon -= 360;
  
  const sign = ephemeris.getSign(lon);
  const degreeInSign = ephemeris.getDegreeInSign(lon);
  
  // Division size in degrees
  const divisionSize = 30 / division;

  // Java-compatible division index (0-based)
  const divisionIndex0 = getJavaDivisionIndex0(division, degreeInSign);
  const divisionNum = divisionIndex0 + 1; // 1-based division (1..division) for helpers that use it
  
  // Calculate divisional sign based on chart type
  let divisionalSign;
  
  if (chartType === 'navamsa' || division === 9) {
    // Navamsa (D-9): sign + OooOoo0(9, degree) + OooOooO(sign)
    // OooOoo0 returns 0-based division (0-8), OooOooO returns offset (0, 8, or 4)
    divisionalSign = calculateNavamsaSign(sign, divisionIndex0);
  } else if (chartType === 'hora' || division === 2) {
    // Hora (D-2) - special rules based on odd/even signs
    divisionalSign = calculateHoraSign(sign, divisionNum);
  } else if (chartType === 'drekkana' || division === 3) {
    // Drekkana (D-3): sign + OooOoO0(3, degree)
    // OooOoO0 returns offset (0, 4, or 8) based on division
    divisionalSign = calculateDrekkanaSign(sign, divisionNum);
  } else if (chartType === 'chaturthamsa' || division === 4) {
    // Chaturthamsa (D-4) - special rules: division 1→same sign, 2→4th sign, 3→7th sign, 4→10th sign
    divisionalSign = calculateChaturthamsaSign(sign, divisionNum);
  } else if (chartType === 'saptamsa' || division === 7) {
    // Saptamsa (D-7) - special rules based on odd/even signs
    divisionalSign = calculateSaptamsaSign(sign, divisionNum);
  } else if (chartType === 'dashamsa' || division === 10) {
    // Dashamsa (D-10): sign + OooOoo0(10, degree) + OooOooo(sign)
    // OooOoo0 returns 0-based division (0-9), OooOooo returns offset (8 for even, 0 for odd)
    divisionalSign = calculateDashamsaSign(sign, divisionIndex0);
  } else if (chartType === 'shodasamsa' || division === 16) {
    // Shodasamsa (D-16): OooOo0(16, degree, sign) - returns offset directly, NO sign addition
    divisionalSign = calculateShodasamsaSign(sign, divisionIndex0);
  } else if (chartType === 'dwadasamsa' || division === 12) {
    // Dwadasamsa (D-12): sign + OooOoo0(12, degree)
    // OooOoo0 returns 0-based division (0-11)
    divisionalSign = calculateDwadasamsaSign(sign, divisionIndex0);
  } else if (chartType === 'vimsamsa' || division === 20) {
    // Vimsamsa (D-20): OooOo0O(20, degree, sign) - returns offset directly, NO sign addition
    divisionalSign = calculateVimsamsaSign(sign, divisionIndex0);
  } else if (chartType === 'chaturvimsamsa' || division === 24) {
    // Chaturvimsamsa (D-24): OooOo0o(24, degree, sign) - returns offset directly, NO sign addition
    divisionalSign = calculateChaturvimsamsaSign(sign, divisionIndex0);
  } else {
    // Standard divisional chart calculation
    divisionalSign = calculateStandardDivisionalSign(sign, divisionNum, division);
  }
  
  // Calculate degree within divisional sign
  // Position within the current division (0 to divisionSize)
  // Use divisionIndex0 (0-based) for accurate calculation
  const positionInDivision = degreeInSign - (divisionIndex0 * divisionSize);
  // Ensure positionInDivision is non-negative and within divisionSize
  const clampedPosition = Math.max(0, Math.min(positionInDivision, divisionSize));
  // Scale to 0-30 degrees for the divisional sign
  // If divisionSize = 30/division, then clampedPosition * division maps [0, divisionSize] -> [0, 30]
  const divisionalDegree = clampedPosition * division;
  
  return {
    sign: divisionalSign,
    division: divisionNum,
    degree: divisionalDegree,
    originalSign: sign,
    originalDegree: degreeInSign
  };
}

/**
 * Calculate Navamsa (D-9) sign
 * Java: sign + OooOoo0(9, degree) + OooOooO(sign)
 * - OooOoo0 returns 0-based division (0-8)
 * - OooOooO returns offset: Movable=0, Fixed=8, Dual=4
 * - Final: (sign + divisionIndex0 + offset) % 12
 */
function calculateNavamsaSign(sign, divisionIndex0) {
  // divisionIndex0 is 0-based (0-8)
  // sign is 1-based (1-12)
  
  // OooOooO returns offset based on sign nature
  let offset;
  if (sign === 1 || sign === 4 || sign === 7 || sign === 10) {
    // Movable: offset = 0
    offset = 0;
  } else if (sign === 2 || sign === 5 || sign === 8 || sign === 11) {
    // Fixed: offset = 8
    offset = 8;
  } else {
    // Dual: offset = 4
    offset = 4;
  }
  
  // Java: sign + divisionIndex0 + offset, then % 12
  // sign is 1-based (1-12), so we add directly
  // Java pattern: result = (sign + divisionIndex0 + offset) % 12, then if result == 0, result = 12
  const result = (sign + divisionIndex0 + offset) % 12;
  let finalSign = result;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Calculate Hora (D-2) sign
 * Wealth chart - divides each sign into 2 parts (15 degrees each)
 * Rules:
 * - Odd signs (1,3,5,7,9,11): Division 1 → Leo (5), Division 2 → Cancer (4)
 * - Even signs (2,4,6,8,10,12): Division 1 → Cancer (4), Division 2 → Leo (5)
 */
function calculateHoraSign(sign, division) {
  const isEven = sign % 2 === 0;
  
  if (isEven) {
    // Even signs: division 1 → Cancer (4), division 2 → Leo (5)
    return division === 1 ? 4 : 5;
  } else {
    // Odd signs: division 1 → Leo (5), division 2 → Cancer (4)
    return division === 1 ? 5 : 4;
  }
}

/**
 * Calculate Drekkana (D-3) sign
 * Siblings chart - divides each sign into 3 parts (10 degrees each)
 * Rules:
 * - Division 1 (0-10°): Same sign (offset 0)
 * - Division 2 (10-20°): 5th sign from sign (offset 4)
 * - Division 3 (20-30°): 9th sign from sign (offset 8)
 */
function calculateDrekkanaSign(sign, division) {
  // sign is 1-based (1-12)
  let offset;
  
  if (division === 1) {
    offset = 0; // Same sign
  } else if (division === 2) {
    offset = 4; // 5th sign from sign
  } else if (division === 3) {
    offset = 8; // 9th sign from sign
  } else {
    offset = 0; // Default to same sign
  }
  
  // Java: sign + offset, then % 12, then if result == 0, result = 12
  // sign is 1-based (1-12), so we add directly
  const result = (sign + offset) % 12;
  let finalSign = result;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Calculate Chaturthamsa (D-4) sign
 * Property and fortune chart - divides each sign into 4 parts (7.5 degrees each)
 * Rules:
 * - Division 1 (0-7.5°): Same sign (offset 0)
 * - Division 2 (7.5-15°): 4th sign from sign (offset 3)
 * - Division 3 (15-22.5°): 7th sign from sign (offset 6)
 * - Division 4 (22.5-30°): 10th sign from sign (offset 9)
 */
function calculateChaturthamsaSign(sign, division) {
  const signIndex0 = sign - 1;
  let offset;
  
  if (division === 1) {
    offset = 0; // Same sign
  } else if (division === 2) {
    offset = 3; // 4th sign from sign
  } else if (division === 3) {
    offset = 6; // 7th sign from sign
  } else if (division === 4) {
    offset = 9; // 10th sign from sign
  } else {
    offset = 0; // Default to same sign
  }
  
  const chaturthamsaIndex0 = (signIndex0 + offset) % 12;
  return chaturthamsaIndex0 + 1;
}

/**
 * Calculate Saptamsa (D-7) sign
 * Children chart - divides each sign into 7 parts (~4.29 degrees each)
 * Rules:
 * - Odd signs: division 1→offset 0, division 2→offset 1, ..., division 7→offset 6
 * - Even signs: division 1→offset 6, division 2→offset 7, ..., division 7→offset 12 (mod 12)
 */
function calculateSaptamsaSign(sign, division) {
  const signIndex0 = sign - 1;
  const isEven = sign % 2 === 0;
  const divisionIndex0 = division - 1; // Convert to 0-based (0-6)
  
  let offset;
  if (isEven) {
    // Even signs: offset = divisionIndex0 + 6
    offset = divisionIndex0 + 6;
  } else {
    // Odd signs: offset = divisionIndex0
    offset = divisionIndex0;
  }
  
  const saptamsaIndex0 = (signIndex0 + offset) % 12;
  return saptamsaIndex0 + 1;
}

/**
 * Calculate Dashamsa (D-10) sign
 * Java: sign + OooOoo0(10, degree) + OooOooo(sign)
 * - OooOoo0 returns 0-based division (0-9)
 * - OooOooo returns offset: even signs=8, odd signs=0
 * - Final: (sign + divisionIndex0 + offset) % 12
 */
function calculateDashamsaSign(sign, divisionIndex0) {
  // divisionIndex0 is 0-based (0-9)
  // sign is 1-based (1-12)
  
  // OooOooo returns 8 for even signs, 0 for odd signs
  const offset = (sign % 2 === 0) ? 8 : 0;
  
  // Java: sign + divisionIndex0 + offset, then % 12
  // sign is 1-based (1-12), so we add directly
  // Java pattern: result = (sign + divisionIndex0 + offset) % 12, then if result == 0, result = 12
  const result = (sign + divisionIndex0 + offset) % 12;
  let finalSign = result;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Calculate Shodasamsa (D-16) sign
 * Vehicles and happiness chart - divides each sign into 16 parts (~1.875 degrees each)
 * Java: OooOo0 returns offset directly, then mod 12 is applied
 * - Movable signs (1,4,7,10): offset = i3 + 1 (where i3 is 0-based division: 0-15)
 * - Fixed signs (2,5,8,11): offset = i3 + 5
 * - Dual signs (3,6,9,12): offset = i3 + 9
 * Then: result % 12 (no addition of original sign)
 */
function calculateShodasamsaSign(sign, divisionIndex0) {
  // divisionIndex0 is 0-based (0-15) - matches Java OooOo0's i3 value

  // Java: ((i3 + X) + 1) - 1 = i3 + X
  let offset;
  if (sign === 1 || sign === 4 || sign === 7 || sign === 10) {
    // Movable: i3 + 1
    offset = divisionIndex0 + 1;
  } else if (sign === 2 || sign === 5 || sign === 8 || sign === 11) {
    // Fixed: i3 + 5
    offset = divisionIndex0 + 5;
  } else {
    // Dual: i3 + 9
    offset = divisionIndex0 + 9;
  }

  // Java: result % 12, then if 0 → 12
  let finalSign = offset % 12;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Calculate Dwadasamsa (D-12) sign
 * Java: sign + OooOoo0(12, degree)
 * - OooOoo0 returns 0-based division (0-11)
 * - Final: (sign + divisionIndex0) % 12
 */
function calculateDwadasamsaSign(sign, divisionIndex0) {
  // divisionIndex0 is 0-based (0-11)
  // sign is 1-based (1-12)
  
  // Java: sign + divisionIndex0, then % 12
  // sign is 1-based (1-12), so we add directly
  // Java pattern: result = (sign + divisionIndex0) % 12, then if result == 0, result = 12
  const result = (sign + divisionIndex0) % 12;
  let finalSign = result;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Calculate Vimsamsa (D-20) sign
 * Spiritual chart - divides each sign into 20 parts (1.5 degrees each)
 * Java: OooOo0O returns offset directly, then mod 12 is applied
 * - Movable signs (1,4,7,10): offset = i3 + 1 (where i3 is 0-based division: 0-19)
 * - Fixed signs (2,5,8,11): offset = i3 + 9
 * - Dual signs (3,6,9,12): offset = i3 + 5
 * Then: result % 12 (no addition of original sign)
 */
function calculateVimsamsaSign(sign, divisionIndex0) {
  // divisionIndex0 is 0-based (0-19) - matches Java OooOo0O's i3 value

  let offset;
  if (sign === 1 || sign === 4 || sign === 7 || sign === 10) {
    // Movable: i3 + 1
    offset = divisionIndex0 + 1;
  } else if (sign === 2 || sign === 5 || sign === 8 || sign === 11) {
    // Fixed: i3 + 9
    offset = divisionIndex0 + 9;
  } else {
    // Dual: i3 + 5
    offset = divisionIndex0 + 5;
  }

  // Java: result % 12, then if 0 → 12
  let finalSign = offset % 12;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Calculate Chaturvimsamsa (D-24) sign
 * Education chart - divides each sign into 24 parts (1.25 degrees each)
 * Java: OooOo0o returns offset directly, then mod 12 is applied
 * - Even signs (2,4,6,8,10,12): offset = i3 + 4 (where i3 is 0-based division: 0-23)
 * - Odd signs (1,3,5,7,9,11): offset = i3 + 5
 * - Java: return ((i2 % 2 == 0 ? i3 + 4 : i3 + 5) + 1) - 1;
 * - This simplifies to: i3 + 4 for even signs, i3 + 5 for odd signs
 * Then: result % 12 (no addition of original sign)
 */
function calculateChaturvimsamsaSign(sign, divisionIndex0) {
  // divisionIndex0 is 0-based (0-23) - matches Java OooOo0o's i3 value

  // Java: return ((i2 % 2 == 0 ? i3 + 4 : i3 + 5) + 1) - 1;
  // This simplifies to: i3 + 4 for even signs, i3 + 5 for odd signs
  const result = (sign % 2 === 0) ? divisionIndex0 + 4 : divisionIndex0 + 5;

  // Java caller does: result % 12, then if 0 → 12
  let finalSign = result % 12;
  if (finalSign === 0) finalSign = 12;
  return finalSign;
}

/**
 * Standard divisional chart calculation
 */
function calculateStandardDivisionalSign(sign, division, totalDivisions) {
  const signIndex0 = sign - 1;
  // Standard: Start from sign itself
  const divisionalIndex0 = (signIndex0 + (division - 1)) % 12;
  return divisionalIndex0 + 1;
}

/**
 * Calculate all major divisional charts
 * 
 * @param {Array} planets - Array of planet objects with longitude
 * @param {Object} ascendant - Ascendant object with longitude
 * @returns {Object} All divisional charts
 */
function calculateAllDivisionalCharts(planets, ascendant) {
  const charts = {};
  
  // D-1: Rasi (Main chart) - already calculated
  // D-2: Hora (Wealth)
  charts.hora = calculateDivisionalChartForAll(planets, ascendant, 2, 'hora');
  
  // D-3: Drekkana (Siblings)
  charts.drekkana = calculateDivisionalChartForAll(planets, ascendant, 3, 'drekkana');
  
  // D-4: Chaturthamsa (Property)
  charts.chaturthamsa = calculateDivisionalChartForAll(planets, ascendant, 4, 'chaturthamsa');
  
  // D-7: Saptamsa (Children)
  charts.saptamsa = calculateDivisionalChartForAll(planets, ascendant, 7, 'saptamsa');
  
  // D-9: Navamsa (Marriage, Relationships) - already have, but include for completeness
  charts.navamsa = calculateDivisionalChartForAll(planets, ascendant, 9, 'navamsa');
  
  // D-10: Dashamsa (Career)
  charts.dashamsa = calculateDivisionalChartForAll(planets, ascendant, 10, 'dashamsa');
  
  // D-12: Dwadasamsa (Parents)
  charts.dwadasamsa = calculateDivisionalChartForAll(planets, ascendant, 12, 'dwadasamsa');
  
  // D-16: Shodasamsa (Vehicles, Happiness)
  charts.shodasamsa = calculateDivisionalChartForAll(planets, ascendant, 16, 'shodasamsa');
  
  // D-20: Vimsamsa (Spiritual)
  charts.vimsamsa = calculateDivisionalChartForAll(planets, ascendant, 20, 'vimsamsa');
  
  // D-24: Chaturvimsamsa (Education)
  charts.chaturvimsamsa = calculateDivisionalChartForAll(planets, ascendant, 24, 'chaturvimsamsa');
  
  // D-27: Saptavimsamsa (Strength)
  charts.saptavimsamsa = calculateDivisionalChartForAll(planets, ascendant, 27, 'saptavimsamsa');
  
  // D-30: Trimsamsa (Evils)
  charts.trimsamsa = calculateDivisionalChartForAll(planets, ascendant, 30, 'trimsamsa');
  
  // D-40: Khavedamsa (Maternal)
  charts.khavedamsa = calculateDivisionalChartForAll(planets, ascendant, 40, 'khavedamsa');
  
  // D-45: Akshavedamsa (Paternal)
  charts.akshavedamsa = calculateDivisionalChartForAll(planets, ascendant, 45, 'akshavedamsa');
  
  // D-60: Shastiamsa (Past life, most detailed)
  charts.shastiamsa = calculateDivisionalChartForAll(planets, ascendant, 60, 'shastiamsa');
  
  return charts;
}

/**
 * Calculate divisional chart for all planets
 */
function calculateDivisionalChartForAll(planets, ascendant, division, chartType) {
  // Use RAW sidereal longitude if available (matches original Java app calculations)
  const ascLon = (ascendant && typeof ascendant.rawLongitude === 'number')
    ? ascendant.rawLongitude
    : ascendant.longitude;
  const ascDivisional = calculateDivisionalChart(ascLon, division, chartType);
  
  const divisionalPlanets = planets.map(planet => {
    const pLon = (planet && typeof planet.rawLongitude === 'number')
      ? planet.rawLongitude
      : planet.longitude;
    const divisional = calculateDivisionalChart(pLon, division, chartType);
    
    // Navamsa (D-9) uses special house calculation that shifts houses by -1
    // Other divisional charts use standard house calculation
    let house;
    if (chartType === 'navamsa' || division === 9) {
      house = navamsa.getNavamsaHouse(divisional.sign, ascDivisional.sign);
    } else {
      house = ephemeris.getHouse(divisional.sign, ascDivisional.sign);
    }
    
    return {
      ...planet,
      divisional: {
        sign: divisional.sign,
        degree: divisional.degree,
        house: house,
        division: divisional.division
      }
    };
  });
  
  return {
    ascendant: {
      ...ascendant,
      divisional: {
        sign: ascDivisional.sign,
        degree: ascDivisional.degree,
        house: 1,
        division: ascDivisional.division
      }
    },
    planets: divisionalPlanets,
    ascendantSign: ascDivisional.sign
  };
}

module.exports = {
  calculateDivisionalChart,
  calculateAllDivisionalCharts,
  calculateDivisionalChartForAll,
  calculateNavamsaSign,
  calculateHoraSign,
  calculateDrekkanaSign,
  calculateChaturthamsaSign,
  calculateSaptamsaSign,
  calculateDashamsaSign,
  calculateShodasamsaSign,
  calculateDwadasamsaSign,
  calculateVimsamsaSign
};


