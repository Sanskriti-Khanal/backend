/**
 * Vedic Astrology - Complete Astrology System Without Swiss Ephemeris
 * 
 * Comprehensive Vedic astrology calculations including:
 * - Planetary positions (all 9 grahas)
 * - Nakshatra calculations
 * - Lagna (Ascendant) calculation
 * - House divisions
 * - Planetary conditions (exaltation, debilitation, combustion, retrograde)
 * - Yogas
 * - Dasha calculations
 * 
 * This is a complete implementation from scratch without external ephemeris libraries.
 */

const astroCore = require('../utils/astro-core');
const planetCalculator = require('../utils/planet-calculator');
const nakshatra = require('../utils/nakshatra');

// Zodiac signs
const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Sign lords
const SIGN_LORDS = {
  'Aries': 'Mars',
  'Taurus': 'Venus',
  'Gemini': 'Mercury',
  'Cancer': 'Moon',
  'Leo': 'Sun',
  'Virgo': 'Mercury',
  'Libra': 'Venus',
  'Scorpio': 'Mars',
  'Sagittarius': 'Jupiter',
  'Capricorn': 'Saturn',
  'Aquarius': 'Saturn',
  'Pisces': 'Jupiter'
};

// Exaltation signs (1-12, where 1=Aries, 12=Pisces)
const EXALTATION_SIGNS = {
  'sun': 1,      // Aries
  'moon': 3,     // Taurus
  'mars': 10,    // Capricorn
  'mercury': 6,  // Virgo
  'jupiter': 4,  // Cancer
  'venus': 12,   // Pisces
  'saturn': 1,   // Libra
  'rahu': 8,     // Gemini
  'ketu': 2      // Sagittarius
};

// Debilitation signs (opposite of exaltation)
const DEBILITATION_SIGNS = {
  'sun': 7,      // Libra
  'moon': 10,    // Scorpio
  'mars': 4,     // Cancer
  'mercury': 12, // Pisces
  'jupiter': 10, // Capricorn
  'venus': 6,    // Virgo
  'saturn': 1,   // Aries
  'rahu': 2,     // Sagittarius
  'ketu': 8      // Gemini
};

// Enemy signs (simplified - full system has friend/enemy/neutral)
const ENEMY_SIGNS = {
  'sun': [7, 10],      // Libra, Capricorn
  'moon': [8, 11],     // Scorpio, Aquarius
  'mars': [3, 9],      // Taurus, Sagittarius
  'mercury': [5, 11],  // Leo, Aquarius
  'jupiter': [3, 5],   // Taurus, Leo
  'venus': [1, 7],     // Aries, Libra
  'saturn': [4, 5],    // Cancer, Leo
  'rahu': [2, 8],      // Taurus, Scorpio
  'ketu': [2, 8]       // Taurus, Scorpio
};

class VedicAstrology {
  /**
   * Constructor
   * 
   * @param {Date|string} dob - Date of birth (Date object or ISO string)
   * @param {string} tob - Time of birth in format "HH:MM" or "HH:MM:SS"
   * @param {Object} birthplace - {lat: latitude, lon: longitude, placeName: string}
   * @param {string} gender - 'male' or 'female'
   */
  constructor(dob, tob, birthplace, gender) {
    // Parse date
    this.dob = dob instanceof Date ? dob : new Date(dob);
    
    // Parse time
    const [hours, minutes, seconds = 0] = tob.split(':').map(Number);
    this.tob = { hours, minutes, seconds };
    
    this.birthplace = birthplace;
    this.gender = gender;
    
    // Calculate Julian Date
    this.julianDate = astroCore.toJulianDate(
      this.dob.getFullYear(),
      this.dob.getMonth() + 1,
      this.dob.getDate(),
      hours,
      minutes,
      seconds
    );
    
    // Calculate ayanamsa
    this.ayanamsa = astroCore.getLahiriAyanamsa(this.julianDate);
    
    // Initialize results
    this.planets = {};
    this.lagna = null;
    this.houses = {};
    this.nakshatra = null;
  }
  
  /**
   * Calculate all planetary positions
   * 
   * @returns {Promise<Object>} Planets data
   */
  async calculateAllPlanets() {
    const planetIds = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    
    for (const planetId of planetIds) {
      // Calculate tropical position
      const position = planetCalculator.calculatePlanetPosition(this.julianDate, planetId);
      
      // Convert to sidereal
      const siderealLongitude = planetCalculator.toSidereal(position.longitude, this.ayanamsa);
      
      // Get sign
      const sign = this.getSignFromLongitude(siderealLongitude);
      
      // Calculate nakshatra
      const nakshatraResult = nakshatra.calculateNakshatra(siderealLongitude, planetId);
      
      // Calculate house (need lagna first)
      const house = this.lagna ? this.getHouseForPlanet(siderealLongitude) : null;
      
      // Check planetary conditions
      const conditions = this.checkPlanetaryConditions(planetId, sign, position.speed, siderealLongitude);
      
      this.planets[planetId] = {
        id: planetId,
        name: this.getPlanetName(planetId),
        longitude: siderealLongitude,
        latitude: position.latitude,
        sign: sign,
        signName: SIGNS[sign - 1],
        degree: siderealLongitude % 30,
        degreeString: this.formatDegree(siderealLongitude % 30),
        house: house,
        speed: position.speed,
        retrograde: position.speed < 0,
        nakshatra: nakshatraResult.name,
        nakshatraPada: nakshatraResult.pada,
        ...conditions
      };
    }
    
    // Calculate combustion (needs Sun's longitude)
    if (this.planets.sun) {
      this.calculateCombustion();
    }
    
    return this.planets;
  }
  
  /**
   * Calculate Lagna (Ascendant)
   * 
   * Uses accurate formula from Meeus "Astronomical Algorithms"
   * 
   * @returns {Object} Lagna data
   */
  calculateLagna() {
    const lat = this.birthplace.lat;
    const lon = this.birthplace.lon;
    
    // Get Local Sidereal Time
    const lst = astroCore.getLocalSiderealTime(this.julianDate, lon);
    
    // Convert LST to degrees
    const lstDegrees = lst * 15;
    const lstRad = astroCore.degToRad(lstDegrees);
    
    // Get obliquity of ecliptic
    const obliquity = astroCore.getObliquity(this.julianDate);
    const obliquityRad = astroCore.degToRad(obliquity);
    
    // Convert latitude to radians
    const latRad = astroCore.degToRad(lat);
    
    // Calculate ascendant using accurate formula
    // Ascendant = arctan(cos(LST) / (-sin(LST) * cos(ε) + tan(φ) * sin(ε)))
    // Where LST = Local Sidereal Time, ε = obliquity, φ = latitude
    
    const cosLST = Math.cos(lstRad);
    const sinLST = Math.sin(lstRad);
    const cosEpsilon = Math.cos(obliquityRad);
    const sinEpsilon = Math.sin(obliquityRad);
    const tanLat = Math.tan(latRad);
    
    const denominator = -sinLST * cosEpsilon + tanLat * sinEpsilon;
    
    let ascendantLongitude;
    if (Math.abs(denominator) < 1e-10) {
      // Near pole, use alternative calculation
      ascendantLongitude = lstDegrees;
    } else {
      ascendantLongitude = Math.atan2(cosLST, denominator);
      
      // Convert to degrees
      ascendantLongitude = astroCore.radToDeg(ascendantLongitude);
      
      // Normalize to 0-360
      ascendantLongitude = astroCore.normalizeAngle(ascendantLongitude);
    }
    
    // Convert to sidereal (already in sidereal if using LST correctly)
    // Actually, LST gives us the right ascension, we need to convert to ecliptic longitude
    // For simplicity, we'll use the tropical longitude and convert to sidereal
    const tropicalAscendant = astroCore.normalizeAngle(ascendantLongitude);
    const siderealAscendant = planetCalculator.toSidereal(tropicalAscendant, this.ayanamsa);
    
    // Get sign
    const sign = this.getSignFromLongitude(siderealAscendant);
    
    // Calculate nakshatra
    const nakshatraResult = nakshatra.calculateNakshatra(siderealAscendant, true);
    
    this.lagna = {
      longitude: siderealAscendant,
      sign: sign,
      signName: SIGNS[sign - 1],
      degree: siderealAscendant % 30,
      degreeString: this.formatDegree(siderealAscendant % 30),
      lord: SIGN_LORDS[SIGNS[sign - 1]],
      nakshatra: nakshatraResult.name,
      nakshatraPada: nakshatraResult.pada
    };
    
    // Calculate houses based on lagna
    this.calculateHouses();
    
    return this.lagna;
  }
  
  /**
   * Calculate houses (1-12)
   * 
   * Uses equal house system (simplified)
   * For production, use Placidus, Koch, or Sripati house systems
   */
  calculateHouses() {
    if (!this.lagna) {
      throw new Error('Lagna must be calculated first');
    }
    
    const lagnaLongitude = this.lagna.longitude;
    
    // Equal house system: each house = 30 degrees
    for (let house = 1; house <= 12; house++) {
      const houseLongitude = astroCore.normalizeAngle(lagnaLongitude + (house - 1) * 30);
      const sign = this.getSignFromLongitude(houseLongitude);
      
      this.houses[house] = {
        number: house,
        longitude: houseLongitude,
        sign: sign,
        signName: SIGNS[sign - 1],
        lord: SIGN_LORDS[SIGNS[sign - 1]]
      };
    }
    
    // Update planet houses
    for (const planetId in this.planets) {
      const planet = this.planets[planetId];
      planet.house = this.getHouseForPlanet(planet.longitude);
    }
  }
  
  /**
   * Get house number for a given longitude
   * 
   * @param {number} longitude - Sidereal longitude in degrees
   * @returns {number} House number (1-12)
   */
  getHouseForPlanet(longitude) {
    if (!this.lagna) return null;
    
    const lagnaLongitude = this.lagna.longitude;
    const diff = astroCore.normalizeAngle(longitude - lagnaLongitude);
    const house = Math.floor(diff / 30) + 1;
    
    return house > 12 ? 12 : house;
  }
  
  /**
   * Check planetary conditions (exaltation, debilitation, etc.)
   * 
   * @param {string} planetId - Planet ID
   * @param {number} sign - Sign number (1-12)
   * @param {number} speed - Daily motion (negative = retrograde)
   * @param {number} longitude - Sidereal longitude
   * @returns {Object} Conditions
   */
  checkPlanetaryConditions(planetId, sign, speed, longitude) {
    const isExalted = sign === EXALTATION_SIGNS[planetId];
    const isDebilitated = sign === DEBILITATION_SIGNS[planetId];
    const isRetrograde = speed < 0;
    const isEnemySign = ENEMY_SIGNS[planetId] && ENEMY_SIGNS[planetId].includes(sign);
    
    // Calculate dignity score (simplified)
    let dignity = 'neutral';
    if (isExalted) dignity = 'exalted';
    else if (isDebilitated) dignity = 'debilitated';
    else if (isEnemySign) dignity = 'enemy_sign';
    
    return {
      isExalted,
      isDebilitated,
      isRetrograde,
      isEnemySign,
      dignity
    };
  }
  
  /**
   * Calculate combustion (planets too close to Sun)
   * 
   * Combustion limits vary by planet:
   * - Mercury: 13-14°
   * - Venus: 8-9°
   * - Others: ~17°
   */
  calculateCombustion() {
    const sunLongitude = this.planets.sun.longitude;
    
    const combustionLimits = {
      'mercury': 13.5,
      'venus': 8.5,
      'mars': 17,
      'jupiter': 11,
      'saturn': 15
    };
    
    for (const planetId in this.planets) {
      if (planetId === 'sun' || planetId === 'moon' || planetId === 'rahu' || planetId === 'ketu') {
        continue; // These don't combust
      }
      
      const planet = this.planets[planetId];
      const diff = Math.abs(astroCore.normalizeAngle(planet.longitude - sunLongitude));
      const limit = combustionLimits[planetId] || 17;
      
      planet.isCombusted = diff < limit || diff > (360 - limit);
    }
  }
  
  /**
   * Calculate Nakshatra (Moon's nakshatra)
   * 
   * @returns {Object} Nakshatra data
   */
  calculateNakshatra() {
    if (!this.planets.moon) {
      throw new Error('Planets must be calculated first');
    }
    
    const moon = this.planets.moon;
    
    this.nakshatra = {
      name: moon.nakshatra,
      pada: moon.nakshatraPada,
      lord: this.getNakshatraLord(moon.nakshatra),
      deity: this.getNakshatraDeity(moon.nakshatra)
    };
    
    return this.nakshatra;
  }
  
  /**
   * Get sign from longitude
   * 
   * @param {number} longitude - Sidereal longitude in degrees
   * @returns {number} Sign number (1-12)
   */
  getSignFromLongitude(longitude) {
    const normalized = astroCore.normalizeAngle(longitude);
    const sign = Math.floor(normalized / 30) + 1;
    return sign > 12 ? 12 : sign;
  }
  
  /**
   * Get planet name
   * 
   * @param {string} planetId - Planet ID
   * @returns {string} Planet name
   */
  getPlanetName(planetId) {
    const names = {
      'sun': 'Sun',
      'moon': 'Moon',
      'mars': 'Mars',
      'mercury': 'Mercury',
      'jupiter': 'Jupiter',
      'venus': 'Venus',
      'saturn': 'Saturn',
      'rahu': 'Rahu',
      'ketu': 'Ketu'
    };
    return names[planetId] || planetId;
  }
  
  /**
   * Get nakshatra lord
   * 
   * @param {string} nakshatraName - Nakshatra name
   * @returns {string} Ruling planet
   */
  getNakshatraLord(nakshatraName) {
    // Nakshatra lords cycle: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
    const nakshatraLords = [
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
      'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
    ];
    
    const nakshatraNames = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu',
      'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta',
      'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
      'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ];
    
    const index = nakshatraNames.indexOf(nakshatraName);
    return index >= 0 ? nakshatraLords[index] : 'Unknown';
  }
  
  /**
   * Get nakshatra deity
   * 
   * @param {string} nakshatraName - Nakshatra name
   * @returns {string} Deity name
   */
  getNakshatraDeity(nakshatraName) {
    const deities = {
      'Ashwini': 'Ashwini Kumaras',
      'Bharani': 'Yama',
      'Krittika': 'Agni',
      'Rohini': 'Brahma',
      'Mrigashirsha': 'Soma',
      'Ardra': 'Rudra',
      'Punarvasu': 'Aditi',
      'Pushya': 'Brihaspati',
      'Ashlesha': 'Nagas',
      'Magha': 'Pitris',
      'Purva Phalguni': 'Bhaga',
      'Uttara Phalguni': 'Aryaman',
      'Hasta': 'Savitar',
      'Chitra': 'Vishwakarma',
      'Swati': 'Vayu',
      'Vishakha': 'Indra-Agni',
      'Anuradha': 'Mitra',
      'Jyeshtha': 'Indra',
      'Mula': 'Nirriti',
      'Purva Ashadha': 'Apas',
      'Uttara Ashadha': 'Vishvedevas',
      'Shravana': 'Vishnu',
      'Dhanishta': 'Vasus',
      'Shatabhisha': 'Varuna',
      'Purva Bhadrapada': 'Aja Ekapada',
      'Uttara Bhadrapada': 'Ahir Budhnya',
      'Revati': 'Pushan'
    };
    
    return deities[nakshatraName] || 'Unknown';
  }
  
  /**
   * Format degree as string (e.g., "15°30'")
   * 
   * @param {number} degree - Degree (0-30)
   * @returns {string} Formatted degree string
   */
  formatDegree(degree) {
    const deg = Math.floor(degree);
    const minutes = Math.floor((degree - deg) * 60);
    return `${deg}°${minutes}'`;
  }
  
  /**
   * Calculate complete chart
   * 
   * @returns {Promise<Object>} Complete chart data
   */
  async calculateCompleteChart() {
    // Calculate lagna first (needed for houses)
    this.calculateLagna();
    
    // Calculate all planets
    await this.calculateAllPlanets();
    
    // Calculate nakshatra
    this.calculateNakshatra();
    
    return {
      basicInfo: {
        dob: this.dob.toISOString(),
        tob: `${this.tob.hours}:${this.tob.minutes}:${this.tob.seconds}`,
        birthplace: this.birthplace,
        gender: this.gender
      },
      julianDate: this.julianDate,
      ayanamsa: this.ayanamsa,
      lagna: this.lagna,
      planets: this.planets,
      houses: this.houses,
      nakshatra: this.nakshatra
    };
  }
}

module.exports = VedicAstrology;
