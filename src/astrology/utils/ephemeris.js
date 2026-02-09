/**
 * Ephemeris Utility - Swiss Ephemeris Wrapper
 * 
 * Provides clean wrapper functions around Swiss Ephemeris for:
 * - Julian Day calculations
 * - Ayanamsa (Lahiri)
 * - Planet positions (tropical → sidereal conversion)
 * - Ascendant calculation
 * - House calculations
 */

const swisseph = require('swisseph');

// Planet ID mappings (Swiss Ephemeris constants)
const PLANET_IDS = {
  sun: swisseph.SE_SUN,           // 0
  moon: swisseph.SE_MOON,         // 1
  mercury: swisseph.SE_MERCURY,    // 2
  venus: swisseph.SE_VENUS,        // 3
  mars: swisseph.SE_MARS,          // 4
  jupiter: swisseph.SE_JUPITER,   // 5
  saturn: swisseph.SE_SATURN,     // 6
  rahu: swisseph.SE_MEAN_NODE,    // 10 (Mean North Node) - Original app uses Mean Node
  ketu: swisseph.SE_MEAN_NODE     // Calculated as Rahu + 180°
};

// Calculation flags
const CALC_FLAGS = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

/**
 * Calculate Julian Day (UT) from date/time
 * 
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {number} Julian Day (UT)
 */
function calculateJulianDay(year, month, day, hour, minute) {
  const decimalHour = hour + (minute / 60.0);
  return swisseph.swe_julday(year, month, day, decimalHour, swisseph.SE_GREG_CAL);
}

/**
 * Get Lahiri Ayanamsa for a given Julian Day
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {number} Ayanamsa in degrees
 */
function getAyanamsa(jdUt) {
  // Use Lahiri ayanamsa (SE_SIDM_LAHIRI = 1)
  // swe_get_ayanamsa_ut uses Lahiri by default, but let's be explicit
  return swisseph.swe_get_ayanamsa_ut(jdUt);
}

/**
 * Convert tropical longitude to sidereal (subtract ayanamsa)
 * 
 * @param {number} tropicalLongitude - Tropical longitude in degrees
 * @param {number} ayanamsa - Ayanamsa in degrees
 * @returns {number} Sidereal longitude in degrees (0-360)
 */
function toSidereal(tropicalLongitude, ayanamsa) {
  let sidereal = tropicalLongitude - ayanamsa;
  // Normalize to 0-360
  while (sidereal < 0) sidereal += 360;
  while (sidereal >= 360) sidereal -= 360;
  return sidereal;
}

/**
 * Calculate sign (1-12) from sidereal longitude
 * 
 * @param {number} siderealLongitude - Sidereal longitude in degrees
 * @returns {number} Sign number (1=Aries, 2=Taurus, ..., 12=Pisces)
 */
function getSign(siderealLongitude) {
  // Normalize to 0-360
  let lon = siderealLongitude;
  while (lon < 0) lon += 360;
  while (lon >= 360) lon -= 360;
  
  // Handle edge case: if exactly at 360° (or normalized to 0°), it's Pisces (sign 12)
  // But actually, 0° should be Aries (sign 1), and 360° should wrap to 0° = Aries
  // Java uses: sign = floor(longitude / 30) + 1, but ensures 1-12 range
  // If longitude is exactly 360°, it should be treated as 0° = Aries (sign 1)
  if (lon === 360) {
    lon = 0;
  }
  
  // Calculate sign (1-12) based on longitude range
  // Sign 1 (Aries) = 0-30°, Sign 2 (Taurus) = 30-60°, ..., Sign 12 (Pisces) = 330-360°
  // Use floor division to get sign number
  let sign = Math.floor(lon / 30) + 1;
  
  // Ensure sign is in valid range (1-12)
  // This handles edge cases where calculation might give 0 or 13
  if (sign < 1) sign = 1;
  if (sign > 12) sign = 12;
  
  return sign;
}

/**
 * Calculate degrees within sign from sidereal longitude
 * 
 * @param {number} siderealLongitude - Sidereal longitude in degrees
 * @returns {number} Degrees within sign (0-30)
 */
function getDegreeInSign(siderealLongitude) {
  // Normalize to 0-360
  let lon = siderealLongitude;
  while (lon < 0) lon += 360;
  while (lon >= 360) lon -= 360;
  
  // Calculate degree within sign
  // If we're in next sign due to boundary adjustment, recalculate
  const sign = getSign(lon);
  const signStart = (sign - 1) * 30;
  let degree = lon - signStart;
  
  // Normalize degree to 0-30
  if (degree < 0) degree += 30;
  if (degree >= 30) degree -= 30;
  
  return degree;
}

/**
 * Calculate house number (1-12) from planet sign and ascendant sign
 * 
 * @param {number} planetSign - Planet's sign (1-12)
 * @param {number} ascendantSign - Ascendant sign (1-12)
 * @returns {number} House number (1-12)
 */
function getHouse(planetSign, ascendantSign) {
  // House calculation: Based on the difference between planet sign and ascendant sign
  // House 1 = Ascendant sign
  // House 2 = Next sign after ascendant
  // etc.
  // Formula: House = ((planetSign - ascendantSign + 12) % 12) + 1
  // This ensures positive result and correct wrapping
  
  // Normalize signs to 1-12
  let pSign = planetSign;
  let aSign = ascendantSign;
  while (pSign < 1) pSign += 12;
  while (pSign > 12) pSign -= 12;
  while (aSign < 1) aSign += 12;
  while (aSign > 12) aSign -= 12;
  
  // Calculate house
  let house = ((pSign - aSign + 12) % 12) + 1;
  
  // Ensure house is 1-12
  if (house < 1) house = 1;
  if (house > 12) house = 12;
  
  return house;
}

/**
 * Calculate planet position
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @param {string} planetId - Planet ID ('sun', 'moon', 'mars', etc.)
 * @param {number} ayanamsa - Ayanamsa in degrees
 * @param {number} ascendantSign - Ascendant sign (1-12) for house calculation
 * @returns {Promise<Object>} Planet position data
 */
async function calculatePlanet(jdUt, planetId, ayanamsa, ascendantSign) {
  return new Promise((resolve, reject) => {
    try {
      let sePlanetId = PLANET_IDS[planetId];
      
      // Special handling for Ketu (South Node = Rahu + 180°)
      let isKetu = false;
      if (planetId === 'ketu') {
        sePlanetId = PLANET_IDS.rahu;
        isKetu = true;
      }
      
      if (sePlanetId === undefined) {
        return reject(new Error(`Unknown planet ID: ${planetId}`));
      }

      // IMPORTANT: Java app uses SEFLG_SIDEREAL flag to get sidereal directly
      // Set sidereal mode first (Lahiri) - matches Java: this.f5320Oooo0.Oooo00O(o00o0o.OooOOO());
      swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
      
      // Calculate planet position with SEFLG_SIDEREAL flag to get sidereal directly
      // This matches Java implementation which uses sidereal mode
      const siderealResult = swisseph.swe_calc_ut(jdUt, sePlanetId, swisseph.SEFLG_SIDEREAL);
      
      if (siderealResult.error) {
        return reject(new Error(`Ephemeris calculation error: ${siderealResult.error}`));
      }

      // Get sidereal longitude directly (no conversion needed)
      let siderealLongitude = siderealResult.longitude;
      
      // For Ketu, add 180° to Rahu's sidereal position
      // This matches the original app's behavior
      if (isKetu) {
        siderealLongitude = (siderealLongitude + 180) % 360;
      }
      
      // Normalize to 0-360
      while (siderealLongitude < 0) siderealLongitude += 360;
      while (siderealLongitude >= 360) siderealLongitude -= 360;
      
      // Store original for reference
      const originalSiderealLongitude = siderealLongitude;
      
      // CRITICAL: Calculate sign from RAW sidereal longitude (matches Java exactly)
      // Java: int i10 = ((int) (d9 / 30.0d)) + 1; where d9 is raw sidereal longitude
      // The sign MUST be calculated from raw sidereal value for downstream calculations
      const sign = getSign(siderealLongitude);
      const degree = getDegreeInSign(siderealLongitude);
      
      // Calculate house using the raw sign
      const house = getHouse(sign, ascendantSign);
      
      // For display, apply calibration offset ONLY for display purposes (not for calculations)
      const CALIBRATION_OFFSET = 0.88;
      let siderealLongitudeDisplay = (siderealLongitude + CALIBRATION_OFFSET) % 360;
      if (siderealLongitudeDisplay < 0) siderealLongitudeDisplay += 360;
      
      // Check if retrograde (speed < 0)
      // Swiss Ephemeris returns speed in longitudeSpeed property
      const speed = siderealResult.longitudeSpeed || 0;
      const retrograde = speed < 0;
      
      resolve({
        sign,
        house,
        degree,
        longitude: siderealLongitudeDisplay, // For display (with calibration)
        tropicalLongitude: originalSiderealLongitude, // Store original sidereal for reference
        retrograde,
        speed
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculate Ascendant
 * 
 * Uses swe_houses_ex2 to get accurate ascendant calculation
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {number} ayanamsa - Ayanamsa in degrees
 * @returns {Object} Ascendant data
 */
function calculateAscendant(jdUt, latitude, longitude, ayanamsa) {
  try {
    // IMPORTANT: Java app uses SEFLG_SIDEREAL (65536) flag to get sidereal directly
    // This matches Java: this.f5320Oooo0.Oooo0(o00o0o.OooOOO(), 65536, d5, d6, 80, new double[13], dArr);
    // First, set the sidereal mode (Lahiri) - matches Java: this.f5320Oooo0.Oooo00O(o00o0o.OooOOO());
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    // Use swe_houses_ex2 with SEFLG_SIDEREAL flag to get sidereal ascendant directly
    // This matches Java implementation exactly
    const houseResult = swisseph.swe_houses_ex2(
      jdUt,
      swisseph.SEFLG_SIDEREAL, // Flag 65536 = SEFLG_SIDEREAL (matches Java)
      latitude,
      longitude,
      'P', // Placidus house system
      new Array(13),
      new Array(10)
    );
    
    if (!houseResult || houseResult.ascendant === undefined || isNaN(houseResult.ascendant)) {
      throw new Error('Failed to calculate ascendant from houses');
    }
    
    // Get sidereal ascendant longitude directly (no conversion needed)
    let ascLongitudeSidereal = houseResult.ascendant;
    
    // Normalize to 0-360
    while (ascLongitudeSidereal < 0) ascLongitudeSidereal += 360;
    while (ascLongitudeSidereal >= 360) ascLongitudeSidereal -= 360;
    
    // CRITICAL: Calculate sign from RAW sidereal longitude (matches Java exactly)
    // Java: int i6 = ((int) (d7 / 30.0d)) + 1; where d7 is raw sidereal ascendant
    // The sign MUST be calculated from raw sidereal value for downstream calculations
    const sign = getSign(ascLongitudeSidereal);
    const degree = getDegreeInSign(ascLongitudeSidereal);
    
    // Apply calibration offset ONLY for display purposes (not for calculations)
    let ascLongitudeSiderealDisplay = (ascLongitudeSidereal + 0.88) % 360;
    if (ascLongitudeSiderealDisplay < 0) ascLongitudeSiderealDisplay += 360;
    
    return {
      sign, // RAW sidereal sign (for downstream calculations)
      degree, // RAW sidereal degree (for calculations)
      longitude: ascLongitudeSiderealDisplay, // Calibrated longitude (for display only)
      rawLongitude: ascLongitudeSidereal, // Store raw sidereal longitude for reference
      tropicalLongitude: houseResult.ascendant // Store original for reference
    };
  } catch (error) {
    throw new Error(`Ascendant calculation error: ${error.message}`);
  }
}

/**
 * Calculate house cusps (Placidus system)
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {number} ayanamsa - Ayanamsa in degrees
 * @returns {Promise<Object>} House cusps data
 */
async function calculateHouses(jdUt, latitude, longitude, ayanamsa) {
  return new Promise((resolve, reject) => {
    try {
      const cusps = new Array(13);
      const ascmc = new Array(10);
      
      const houseError = swisseph.swe_houses(
        jdUt,
        latitude,
        longitude,
        'P', // Placidus house system
        cusps,
        ascmc
      );
      
      if (houseError < 0) {
        return reject(new Error(`House calculation error: ${houseError}`));
      }
      
      // Convert house cusps to sidereal and calculate signs
      // Apply same calibration offset as planets and ascendant (0.88°)
      const CALIBRATION_OFFSET = 0.88;
      const houses = [];
      for (let i = 1; i <= 12; i++) {
        if (cusps[i] !== undefined && !isNaN(cusps[i])) {
          let houseLongitudeSidereal = toSidereal(cusps[i], ayanamsa);
          // Apply calibration offset for consistency with planets
          houseLongitudeSidereal = (houseLongitudeSidereal + CALIBRATION_OFFSET) % 360;
          if (houseLongitudeSidereal < 0) houseLongitudeSidereal += 360;
          const sign = getSign(houseLongitudeSidereal);
          houses.push({
            number: i,
            sign,
            longitude: houseLongitudeSidereal,
            degree: getDegreeInSign(houseLongitudeSidereal)
          });
        }
      }
      
      resolve({
        houses,
        ascendant: ascmc[0] ? toSidereal(ascmc[0], ayanamsa) : null,
        mc: ascmc[1] ? toSidereal(ascmc[1], ayanamsa) : null
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  calculateJulianDay,
  getAyanamsa,
  toSidereal,
  getSign,
  getDegreeInSign,
  getHouse,
  calculatePlanet,
  calculateAscendant,
  calculateHouses,
  PLANET_IDS
};

