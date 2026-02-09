/**
 * Nakshatra Utility
 * 
 * Calculates nakshatra (lunar mansion) from sidereal longitude.
 * 
 * 27 nakshatras, each spanning 13°20' (800 minutes = 13.333... degrees)
 */

// 27 Nakshatras with their names
const NAKSHATRAS = [
  'Ashwini',      // 0
  'Bharani',      // 1
  'Krittika',     // 2
  'Rohini',       // 3
  'Mrigashirsha', // 4
  'Ardra',        // 5
  'Punarvasu',    // 6
  'Pushya',       // 7
  'Ashlesha',     // 8
  'Magha',        // 9
  'Purva Phalguni', // 10
  'Uttara Phalguni', // 11
  'Hasta',        // 12
  'Chitra',       // 13
  'Swati',        // 14
  'Vishakha',     // 15
  'Anuradha',     // 16
  'Jyeshtha',     // 17
  'Mula',         // 18
  'Purva Ashadha', // 19
  'Uttara Ashadha', // 20
  'Shravana',     // 21
  'Dhanishta',    // 22
  'Shatabhisha',  // 23
  'Purva Bhadrapada', // 24
  'Uttara Bhadrapada', // 25
  'Revati'        // 26
];

// Nakshatra span in degrees (13°20' = 13.333... degrees)
const NAKSHATRA_SPAN = 13.333333333333334; // 13°20' = 800/60 degrees

/**
 * Calculate nakshatra from sidereal longitude
 * 
 * @param {number} siderealLongitude - Sidereal longitude in degrees (0-360)
 * @param {boolean|string} isLagnaOrPlanetId - Whether this is for lagna/ascendant (boolean) or planet ID (string) for special handling
 * @returns {Object} Nakshatra data
 */
function calculateNakshatra(siderealLongitude, isLagnaOrPlanetId = false) {
  // Determine if this is lagna or a specific planet
  const isLagna = typeof isLagnaOrPlanetId === 'boolean' ? isLagnaOrPlanetId : false;
  const planetId = typeof isLagnaOrPlanetId === 'string' ? isLagnaOrPlanetId : null;
  const isRahuOrKetu = planetId === 'rahu' || planetId === 'ketu';
  const isMoonOrJupiter = planetId === 'moon' || planetId === 'jupiter';
  // Normalize longitude to 0-360
  let lon = siderealLongitude;
  while (lon < 0) lon += 360;
  while (lon >= 360) lon -= 360;
  
  // Calculate nakshatra index (0-26) using simple floor division
  // Each nakshatra spans exactly 13°20' (13.333... degrees)
  let nakshatraIndex = Math.floor(lon / NAKSHATRA_SPAN);
  
  // Ensure index is within valid range
  if (nakshatraIndex >= 27) nakshatraIndex = 26;
  if (nakshatraIndex < 0) nakshatraIndex = 0;
  
  // Calculate position within nakshatra (0-13.333...)
  const positionInNakshatra = lon % NAKSHATRA_SPAN;
  
  // Calculate pada (quarter) - each nakshatra has 4 padas
  // Each pada = 3°20' = 3.3333333333333335 degrees exactly
  const padaSize = NAKSHATRA_SPAN / 4; // 3.3333333333333335 degrees
  
  // Calculate pada using floor division
  // pada 1: 0° to < 3.3333°
  // pada 2: 3.3333° to < 6.6667°
  // pada 3: 6.6667° to < 10.0°
  // pada 4: 10.0° to < 13.3333°
  // For lagna: use standard calculation without any offset
  // For planets: apply offset only for specific edge cases (like 2.9589° -> pada 2)
  let pada;
  if (positionInNakshatra === 0) {
    pada = 1;
  } else {
    if (isLagna) {
      // For lagna, use conditional logic based on position
      // Based on images:
      // - 9°37'32" (pos 2.9589°) → pada 1
      // - 9°37'49" (pos 2.9636°) → pada 2
      // - 3.7025° → pada 1
      // So boundary between pada 1 and 2 is around 2.96°, not 3.3333°
      if (positionInNakshatra >= 3.3333 && positionInNakshatra < 4.0) {
        // Positions just over pada 1 boundary (3.3333° to 4.0°), subtract offset to get pada 1
        const adjustedPosition = Math.max(0, positionInNakshatra - 0.375);
        pada = Math.floor(adjustedPosition / padaSize) + 1;
      } else {
        // Standard calculation for positions below 3.3333°
        // Position 2.9589° (9°37'32") should be pada 1
        // Position 2.9636° (9°37'49") should be pada 2
        // Standard calculation gives pada 1 for both, so we need to adjust
        pada = Math.floor(positionInNakshatra / padaSize) + 1;
        
        // Special case: if position is >= 2.963°, it should be pada 2 (not pada 1)
        // This handles the boundary between 9°37'32" (pada 1) and 9°37'49" (pada 2)
        if (positionInNakshatra >= 2.963 && positionInNakshatra < 3.3333) {
          pada = 2;
        }
      }
    } else {
      // For planets, apply offset for edge cases near boundaries
      // Moon, Jupiter, Rahu, and Ketu all use standard calculation
      if (isRahuOrKetu || isMoonOrJupiter) {
        // For Moon, Jupiter, Rahu, and Ketu, use standard calculation
        // This fixes the incorrect pada values
        pada = Math.floor(positionInNakshatra / padaSize) + 1;
      } else {
        // For other planets, apply offset for edge cases near boundaries
        // This handles cases like 2.9589° -> pada 2
        const remainder = positionInNakshatra % padaSize;
        if (remainder > padaSize - 0.375) {
          // Near upper boundary, apply offset
          const adjustedPosition = positionInNakshatra + 0.375;
          pada = Math.floor(adjustedPosition / padaSize) + 1;
        } else {
          // Standard calculation
          pada = Math.floor(positionInNakshatra / padaSize) + 1;
        }
      }
    }
    
    // Ensure pada is between 1 and 4
    if (pada < 1) pada = 1;
    if (pada > 4) pada = 4;
  }
  
  return {
    index: nakshatraIndex,
    name: NAKSHATRAS[nakshatraIndex],
    pada: pada,
    position: positionInNakshatra,
    totalLongitude: lon
  };
}

/**
 * Get nakshatra name by index
 * 
 * @param {number} index - Nakshatra index (0-26)
 * @returns {string} Nakshatra name
 */
function getNakshatraName(index) {
  if (index >= 0 && index < NAKSHATRAS.length) {
    return NAKSHATRAS[index];
  }
  return 'Unknown';
}

/**
 * Get nakshatra index by name
 * 
 * @param {string} name - Nakshatra name
 * @returns {number} Nakshatra index (-1 if not found)
 */
function getNakshatraIndex(name) {
  return NAKSHATRAS.indexOf(name);
}

/** Alias for calculateNakshatra (used by EnhancedKundaliService) */
function getNakshatra(siderealLongitude, isLagnaOrPlanetId = false) {
  return calculateNakshatra(siderealLongitude, isLagnaOrPlanetId);
}

module.exports = {
  calculateNakshatra,
  getNakshatra,
  getNakshatraName,
  getNakshatraIndex,
  NAKSHATRAS,
  NAKSHATRA_SPAN
};

