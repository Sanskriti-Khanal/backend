/**
 * Planet Calculator - Calculate Planetary Positions Without Swiss Ephemeris
 * 
 * Implements simplified VSOP87-like algorithms for calculating positions of:
 * - Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu (Mean Node), Ketu
 * 
 * Note: This is a simplified implementation. For production accuracy,
 * consider using full VSOP87 or NASA JPL ephemeris data.
 * 
 * Based on algorithms from:
 * - VSOP87 (Variations Séculaires des Orbites Planétaires)
 * - Meeus "Astronomical Algorithms"
 * - Surya Siddhanta (for traditional calculations)
 */

const astroCore = require('./astro-core');

/**
 * Calculate Sun's position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateSun(jdUt) {
  // T = Julian centuries since J2000.0
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean anomaly of Sun
  const M = 357.5291092 + 35999.0502909 * T - 0.0001537 * T * T;
  const MRad = astroCore.degToRad(M);
  
  // Mean longitude of Sun
  const L0 = 280.4664567 + 36000.76982779 * T + 0.0003032028 * T * T;
  
  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(MRad) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * MRad) +
            0.000289 * Math.sin(3 * MRad);
  
  // True longitude
  const longitude = L0 + C;
  
  // Daily motion (degrees per day)
  const speed = 0.98564736 + 0.00000536 * T;
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: 0, // Sun's latitude is always 0 (by definition)
    speed: speed
  };
}

/**
 * Calculate Moon's position
 * 
 * Moon calculation is complex. This is a simplified version.
 * For production accuracy, use full ELP-2000 or similar.
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateMoon(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude of Moon
  const L = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  
  // Mean anomaly of Moon
  const M = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const MRad = astroCore.degToRad(M);
  
  // Mean elongation
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const DRad = astroCore.degToRad(D);
  
  // Mean anomaly of Sun
  const MSun = 357.5291092 + 35999.0502909 * T;
  const MSunRad = astroCore.degToRad(MSun);
  
  // Major periodic terms (simplified - full calculation has 100+ terms)
  const correction = 
    6.288774 * Math.sin(MRad) +
    1.274027 * Math.sin(2 * DRad - MRad) +
    0.658314 * Math.sin(2 * DRad) +
    0.213618 * Math.sin(2 * MRad) -
    0.185116 * Math.sin(MSunRad) -
    0.114332 * Math.sin(2 * DRad - 2 * MRad) +
    0.058793 * Math.sin(2 * DRad - MSunRad - MRad);
  
  const longitude = L + correction;
  
  // Latitude calculation (simplified)
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
  const FRad = astroCore.degToRad(F);
  
  const latitude = 5.128189 * Math.sin(FRad + MRad) +
                   0.280606 * Math.sin(MRad + 2 * DRad) +
                   0.277693 * Math.sin(MRad - 2 * DRad) +
                   0.173238 * Math.sin(2 * FRad - MRad);
  
  // Daily motion (degrees per day) - approximate
  const speed = 13.176358; // Moon moves ~13° per day
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Mercury's position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateMercury(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude
  const L = 252.250906 + 149472.6746358 * T - 0.00000536 * T * T;
  
  // Mean anomaly
  const M = 174.7948 + 4092.325 * T + 0.000001 * T * T;
  const MRad = astroCore.degToRad(M);
  
  // Mean elongation from Sun
  const D = L - calculateSun(jdUt).longitude;
  const DRad = astroCore.degToRad(D);
  
  // Major periodic terms (simplified)
  const correction = 
    23.4400 * Math.sin(MRad) +
    2.9818 * Math.sin(2 * MRad) +
    0.5255 * Math.sin(3 * MRad) +
    0.1058 * Math.sin(4 * MRad) +
    0.0241 * Math.sin(5 * MRad) +
    0.0055 * Math.sin(6 * MRad);
  
  const longitude = L + correction;
  
  // Latitude (simplified)
  const latitude = 7.004986 - 0.0059516 * T + 0.00000081 * T * T;
  
  // Daily motion
  const speed = 4.092339; // degrees per day
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Venus's position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateVenus(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude
  const L = 181.979801 + 58517.815676 * T + 0.00000165 * T * T;
  
  // Mean anomaly
  const M = 50.4161 + 1602.961 * T;
  const MRad = astroCore.degToRad(M);
  
  // Major periodic terms (simplified)
  const correction = 
    0.7758 * Math.sin(MRad) +
    0.0033 * Math.sin(2 * MRad) +
    0.0002 * Math.sin(3 * MRad);
  
  const longitude = L + correction;
  
  // Latitude
  const latitude = 3.394662 - 0.0008568 * T - 0.00003244 * T * T;
  
  // Daily motion
  const speed = 1.602130; // degrees per day
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Mars's position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateMars(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude
  const L = 355.433 + 19140.299 * T + 0.00000297 * T * T;
  
  // Mean anomaly
  const M = 19.3730 + 0.5240 * T;
  const MRad = astroCore.degToRad(M);
  
  // Major periodic terms (simplified)
  const correction = 
    10.691 * Math.sin(MRad) +
    0.623 * Math.sin(2 * MRad) +
    0.050 * Math.sin(3 * MRad) +
    0.005 * Math.sin(4 * MRad);
  
  const longitude = L + correction;
  
  // Latitude
  const latitude = 1.849726 - 0.000601 * T - 0.00001276 * T * T;
  
  // Daily motion
  const speed = 0.524020; // degrees per day
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Jupiter's position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateJupiter(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude
  const L = 34.351519 + 3034.9057 * T - 0.00008501 * T * T;
  
  // Mean anomaly
  const M = 20.0202 + 0.0830 * T;
  const MRad = astroCore.degToRad(M);
  
  // Major periodic terms (simplified)
  const correction = 
    5.555 * Math.sin(MRad) +
    0.168 * Math.sin(2 * MRad) +
    0.007 * Math.sin(3 * MRad);
  
  const longitude = L + correction;
  
  // Latitude
  const latitude = 1.303267 - 0.001987 * T;
  
  // Daily motion
  const speed = 0.083081; // degrees per day
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Saturn's position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateSaturn(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude
  const L = 50.077444 + 1222.1138 * T - 0.00001998 * T * T;
  
  // Mean anomaly
  const M = 317.0207 + 0.0334 * T;
  const MRad = astroCore.degToRad(M);
  
  // Major periodic terms (simplified)
  const correction = 
    5.129 * Math.sin(MRad) +
    0.280 * Math.sin(2 * MRad) +
    0.016 * Math.sin(3 * MRad);
  
  const longitude = L + correction;
  
  // Latitude
  const latitude = 2.488879 - 0.003736 * T;
  
  // Daily motion
  const speed = 0.033444; // degrees per day
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Rahu's position (Mean North Node)
 * 
 * Rahu is the ascending node of Moon's orbit.
 * This is a simplified calculation.
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateRahu(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Mean longitude of ascending node (simplified)
  // For production, use more accurate formula
  const L = 125.0445222 - 1934.1362608 * T + 0.0020708 * T * T;
  
  // Periodic terms (simplified)
  const correction = 
    -1.4979 * Math.sin(astroCore.degToRad(2 * L)) +
    -0.15 * Math.sin(astroCore.degToRad(4 * L));
  
  const longitude = L + correction;
  
  // Rahu/Ketu are always on ecliptic (latitude = 0)
  const latitude = 0;
  
  // Daily motion (retrograde, so negative)
  const speed = -0.0529539; // degrees per day (retrograde)
  
  return {
    longitude: astroCore.normalizeAngle(longitude),
    latitude: latitude,
    speed: speed
  };
}

/**
 * Calculate Ketu's position (Mean South Node)
 * 
 * Ketu = Rahu + 180°
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculateKetu(jdUt) {
  const rahu = calculateRahu(jdUt);
  
  return {
    longitude: astroCore.normalizeAngle(rahu.longitude + 180),
    latitude: 0,
    speed: rahu.speed // Same speed as Rahu (retrograde)
  };
}

/**
 * Calculate planet position for any planet
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @param {string} planetId - Planet ID ('sun', 'moon', 'mars', etc.)
 * @returns {Object} {longitude, latitude, speed}
 */
function calculatePlanetPosition(jdUt, planetId) {
  switch (planetId.toLowerCase()) {
    case 'sun':
      return calculateSun(jdUt);
    case 'moon':
      return calculateMoon(jdUt);
    case 'mercury':
      return calculateMercury(jdUt);
    case 'venus':
      return calculateVenus(jdUt);
    case 'mars':
      return calculateMars(jdUt);
    case 'jupiter':
      return calculateJupiter(jdUt);
    case 'saturn':
      return calculateSaturn(jdUt);
    case 'rahu':
      return calculateRahu(jdUt);
    case 'ketu':
      return calculateKetu(jdUt);
    default:
      throw new Error(`Unknown planet: ${planetId}`);
  }
}

/**
 * Convert tropical longitude to sidereal (subtract ayanamsa)
 * 
 * @param {number} tropicalLongitude - Tropical longitude in degrees
 * @param {number} ayanamsa - Ayanamsa in degrees
 * @returns {number} Sidereal longitude in degrees
 */
function toSidereal(tropicalLongitude, ayanamsa) {
  return astroCore.normalizeAngle(tropicalLongitude - ayanamsa);
}

module.exports = {
  calculateSun,
  calculateMoon,
  calculateMercury,
  calculateVenus,
  calculateMars,
  calculateJupiter,
  calculateSaturn,
  calculateRahu,
  calculateKetu,
  calculatePlanetPosition,
  toSidereal
};
