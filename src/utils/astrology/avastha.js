/**
 * Avastha Utility
 * 
 * Calculates planet state (Avastha) in Vedic astrology:
 * - वक्री (Vakri) - Retrograde
 * - अश्त (Ashta) - Combust (too close to Sun)
 * - Empty string for normal state
 */

/**
 * Calculate Avastha (planet state)
 * 
 * @param {string} planetId - Planet ID ('sun', 'moon', 'mars', etc.)
 * @param {boolean} retrograde - Whether planet is retrograde
 * @param {number} planetLongitude - Planet's sidereal longitude
 * @param {number} sunLongitude - Sun's sidereal longitude
 * @returns {string} Avastha: 'वक्री' (retrograde), 'अश्त' (combust), or '' (empty)
 */
function calculateAvastha(planetId, retrograde, planetLongitude, sunLongitude) {
  // Sun and Moon don't have avastha
  if (planetId === 'sun' || planetId === 'moon') {
    return '';
  }
  
  // Rahu and Ketu are always retrograde (वक्री)
  if (planetId === 'rahu' || planetId === 'ketu') {
    return 'वक्री';
  }
  
  let avastha = '';
  
  // Check retrograde
  if (retrograde) {
    avastha = 'वक्री';
  }
  
  // Check combust (planets too close to Sun)
  // Based on original Java code: OooO0o() method
  // Thresholds vary by planet and whether it's retrograde or direct
  // Calculate angular distance between planet and Sun
  let angularDistance = Math.abs(planetLongitude - sunLongitude);
  
  // Handle wrap-around (360°)
  if (angularDistance > 180) {
    angularDistance = 360 - angularDistance;
  }
  
  // Check combust based on original app logic
  // Original code checks: if (!this.f9710OooO0o.equals("D")) means retrograde
  // Thresholds from original Java:
  // - Moon: 12° (if direct)
  // - Mercury: 12° (if retrograde) or 14° (if direct)
  // - Venus: 8° (if retrograde) or 10° (if direct)
  // - Mars: 17° (always)
  // - Jupiter: 11° (always)
  // - Saturn: 15° (if direct)
  let isCombust = false;
  
  if (planetId === 'moon') {
    // Moon: 12° if direct (not retrograde)
    if (!retrograde && angularDistance <= 12.0) {
      isCombust = true;
    }
  } else if (planetId === 'mercury') {
    // Mercury: 12° if retrograde, 14° if direct
    const threshold = retrograde ? 12.0 : 14.0;
    if (angularDistance <= threshold) {
      isCombust = true;
    }
  } else if (planetId === 'venus') {
    // Venus: 8° if retrograde, 10° if direct
    const threshold = retrograde ? 8.0 : 10.0;
    if (angularDistance <= threshold) {
      isCombust = true;
    }
  } else if (planetId === 'mars') {
    // Mars: 17° always
    if (angularDistance <= 17.0) {
      isCombust = true;
    }
  } else if (planetId === 'jupiter') {
    // Jupiter: 11° always
    if (angularDistance <= 11.0) {
      isCombust = true;
    }
  } else if (planetId === 'saturn') {
    // Saturn: 15° if direct (not retrograde)
    if (!retrograde && angularDistance <= 15.0) {
      isCombust = true;
    }
  }
  
  if (isCombust) {
    // If already retrograde, show both वक्री and अश्त
    if (retrograde) {
      avastha = 'वक्री अश्त';
    } else {
      avastha = 'अश्त';
    }
  }
  
  return avastha;
}

module.exports = {
  calculateAvastha
};

