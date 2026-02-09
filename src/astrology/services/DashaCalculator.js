/**
 * Dasha Calculator - Vimshottari Dasha System
 * 
 * Calculates Vimshottari Dasha periods based on Moon's nakshatra.
 * Vimshottari Dasha is a 120-year cycle divided among 9 planets.
 * 
 * Based on traditional Vedic astrology calculations.
 */

const astroCore = require('../utils/astro-core');

// Vimshottari Dasha periods (in years) - Total 120 years
const VIMSHOTTARI_PERIODS = {
  'Ketu': 7,
  'Venus': 20,
  'Sun': 6,
  'Moon': 10,
  'Mars': 7,
  'Rahu': 18,
  'Jupiter': 16,
  'Saturn': 19,
  'Mercury': 17
};

// Dasha sequence (order of planets)
const DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

// Nakshatra to starting dasha mapping
// Each nakshatra starts with a specific planet's dasha
const NAKSHATRA_DASHA_START = {
  'Ashwini': 'Ketu',
  'Bharani': 'Venus',
  'Krittika': 'Sun',
  'Rohini': 'Moon',
  'Mrigashirsha': 'Mars',
  'Ardra': 'Rahu',
  'Punarvasu': 'Jupiter',
  'Pushya': 'Saturn',
  'Ashlesha': 'Mercury',
  'Magha': 'Ketu',
  'Purva Phalguni': 'Venus',
  'Uttara Phalguni': 'Sun',
  'Hasta': 'Moon',
  'Chitra': 'Mars',
  'Swati': 'Rahu',
  'Vishakha': 'Jupiter',
  'Anuradha': 'Saturn',
  'Jyeshtha': 'Mercury',
  'Mula': 'Ketu',
  'Purva Ashadha': 'Venus',
  'Uttara Ashadha': 'Sun',
  'Shravana': 'Moon',
  'Dhanishta': 'Mars',
  'Shatabhisha': 'Rahu',
  'Purva Bhadrapada': 'Jupiter',
  'Uttara Bhadrapada': 'Saturn',
  'Revati': 'Mercury'
};

class DashaCalculator {
  /**
   * Calculate current dasha periods
   * 
   * @param {Date} birthDate - Date of birth
   * @param {string} nakshatraName - Moon's nakshatra name
   * @param {number} nakshatraPada - Moon's nakshatra pada (1-4)
   * @param {number} moonLongitude - Moon's sidereal longitude
   * @param {Date} currentDate - Current date (optional, defaults to now)
   * @returns {Object} Dasha information
   */
  calculateDasha(birthDate, nakshatraName, nakshatraPada, moonLongitude, currentDate = new Date()) {
    // Get starting dasha planet for this nakshatra
    const startingDasha = NAKSHATRA_DASHA_START[nakshatraName];
    if (!startingDasha) {
      throw new Error(`Unknown nakshatra: ${nakshatraName}`);
    }
    
    // Calculate elapsed time in nakshatra
    // Each nakshatra = 13°20' = 13.333... degrees
    // Each pada = 3°20' = 3.333... degrees
    const nakshatraSpan = 13.333333333333334;
    const padaSpan = nakshatraSpan / 4;
    
    // Calculate position within nakshatra
    const nakshatraIndex = this.getNakshatraIndex(nakshatraName);
    const nakshatraStartLongitude = nakshatraIndex * nakshatraSpan;
    const positionInNakshatra = moonLongitude - nakshatraStartLongitude;
    
    // Normalize position
    let normalizedPosition = positionInNakshatra;
    if (normalizedPosition < 0) normalizedPosition += nakshatraSpan;
    if (normalizedPosition >= nakshatraSpan) normalizedPosition -= nakshatraSpan;
    
    // Calculate elapsed fraction of starting dasha
    const elapsedInNakshatra = normalizedPosition / nakshatraSpan;
    const startingDashaPeriod = VIMSHOTTARI_PERIODS[startingDasha];
    const elapsedInStartingDasha = elapsedInNakshatra * startingDashaPeriod;
    
    // Calculate birth Julian Day
    const birthJD = astroCore.dateToJulianDate(birthDate);
    
    // Calculate current Julian Day
    const currentJD = astroCore.dateToJulianDate(currentDate);
    
    // Calculate elapsed years since birth
    const elapsedYears = (currentJD - birthJD) / 365.25;
    
    // Calculate total elapsed dasha time
    let totalElapsedDasha = elapsedInStartingDasha + elapsedYears;
    
    // Find current mahadasha
    let currentMahadasha = startingDasha;
    let mahadashaStartTime = -elapsedInStartingDasha;
    let mahadashaIndex = DASHA_SEQUENCE.indexOf(startingDasha);
    
    // Traverse through dashas to find current one
    while (totalElapsedDasha > 0) {
      const currentPeriod = VIMSHOTTARI_PERIODS[currentMahadasha];
      
      if (totalElapsedDasha <= currentPeriod) {
        // Current mahadasha found
        break;
      }
      
      // Move to next dasha
      totalElapsedDasha -= currentPeriod;
      mahadashaStartTime += currentPeriod;
      mahadashaIndex = (mahadashaIndex + 1) % DASHA_SEQUENCE.length;
      currentMahadasha = DASHA_SEQUENCE[mahadashaIndex];
    }
    
    // Calculate antardasha (sub-period)
    const mahadashaPeriod = VIMSHOTTARI_PERIODS[currentMahadasha];
    const elapsedInMahadasha = totalElapsedDasha;
    const antardashaFraction = elapsedInMahadasha / mahadashaPeriod;
    
    // Antardasha periods are proportional to mahadasha period
    // Each antardasha = (mahadasha period / 120) * antardasha planet period
    let antardashaElapsed = antardashaFraction * mahadashaPeriod;
    let currentAntardasha = currentMahadasha;
    let antardashaIndex = mahadashaIndex;
    
    while (antardashaElapsed > 0) {
      const antardashaPlanet = DASHA_SEQUENCE[antardashaIndex];
      const antardashaPeriod = (mahadashaPeriod / 120) * VIMSHOTTARI_PERIODS[antardashaPlanet];
      
      if (antardashaElapsed <= antardashaPeriod) {
        break;
      }
      
      antardashaElapsed -= antardashaPeriod;
      antardashaIndex = (antardashaIndex + 1) % DASHA_SEQUENCE.length;
      currentAntardasha = DASHA_SEQUENCE[antardashaIndex];
    }
    
    // Calculate pratyantardasha (sub-sub-period)
    const currentAntardashaPeriod = (mahadashaPeriod / 120) * VIMSHOTTARI_PERIODS[currentAntardasha];
    const pratyantardashaFraction = antardashaElapsed / currentAntardashaPeriod;
    let pratyantardashaElapsed = pratyantardashaFraction * currentAntardashaPeriod;
    let currentPratyantardasha = currentAntardasha;
    let pratyantardashaIndex = antardashaIndex;
    
    while (pratyantardashaElapsed > 0) {
      const pratyantardashaPlanet = DASHA_SEQUENCE[pratyantardashaIndex];
      const pratyantardashaPeriod = (currentAntardashaPeriod / 120) * VIMSHOTTARI_PERIODS[pratyantardashaPlanet];
      
      if (pratyantardashaElapsed <= pratyantardashaPeriod) {
        break;
      }
      
      pratyantardashaElapsed -= pratyantardashaPeriod;
      pratyantardashaIndex = (pratyantardashaIndex + 1) % DASHA_SEQUENCE.length;
      currentPratyantardasha = DASHA_SEQUENCE[pratyantardashaIndex];
    }
    
    // Calculate start and end dates
    const mahadashaStartDate = new Date(birthDate);
    mahadashaStartDate.setFullYear(mahadashaStartDate.getFullYear() + mahadashaStartTime);
    
    const mahadashaEndDate = new Date(mahadashaStartDate);
    mahadashaEndDate.setFullYear(mahadashaEndDate.getFullYear() + mahadashaPeriod);
    
    const antardashaStartDate = new Date(mahadashaStartDate);
    antardashaStartDate.setFullYear(antardashaStartDate.getFullYear() + (mahadashaStartTime + elapsedInMahadasha - antardashaElapsed));
    
    const antardashaEndDate = new Date(antardashaStartDate);
    const currentAntardashaPeriodFull = (mahadashaPeriod / 120) * VIMSHOTTARI_PERIODS[currentAntardasha];
    antardashaEndDate.setFullYear(antardashaEndDate.getFullYear() + currentAntardashaPeriodFull);
    
    return {
      mahadasha: {
        planet: currentMahadasha,
        startDate: mahadashaStartDate,
        endDate: mahadashaEndDate,
        period: mahadashaPeriod,
        elapsed: elapsedInMahadasha,
        remaining: mahadashaPeriod - elapsedInMahadasha
      },
      antardasha: {
        planet: currentAntardasha,
        startDate: antardashaStartDate,
        endDate: antardashaEndDate,
        period: currentAntardashaPeriodFull,
        elapsed: antardashaElapsed,
        remaining: currentAntardashaPeriodFull - antardashaElapsed
      },
      pratyantardasha: {
        planet: currentPratyantardasha,
        period: (currentAntardashaPeriodFull / 120) * VIMSHOTTARI_PERIODS[currentPratyantardasha],
        elapsed: pratyantardashaElapsed
      }
    };
  }
  
  /**
   * Get nakshatra index (0-26)
   */
  getNakshatraIndex(nakshatraName) {
    const nakshatras = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu',
      'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
      'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
      'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];
    
    return nakshatras.indexOf(nakshatraName);
  }
}

module.exports = DashaCalculator;
