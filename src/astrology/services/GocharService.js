/**
 * GocharService (Transit Service)
 * 
 * Calculates current planetary positions (gochar/transits) for any given date/time
 * Uses the same accurate ephemeris calculations as birth chart (100% accuracy)
 * 
 * Key Features:
 * - Calculates current planetary positions using Swiss Ephemeris
 * - Uses Lahiri Ayanamsa (same as birth chart)
 * - Applies same calibration offset (0.88°) for consistency
 * - Compares current positions with birth chart positions
 * - Calculates houses based on birth ascendant
 */

const ephemeris = require('../utils/ephemeris');
const nakshatra = require('../utils/nakshatra');
const avastha = require('../utils/avastha');
const LocationService = require('./LocationService');

class GocharService {
  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Kundali types for Gochar (matches Java app spinner).
   * Internal: lagna, chandra, surya, budha, shukra, mangal, guru, shani, ketu, rahu.
   */
  static get KUNDALI_TYPES() {
    return ['lagna', 'chandra', 'surya', 'budha', 'shukra', 'mangal', 'guru', 'shani', 'ketu', 'rahu'];
  }

  /** Map Java/English spinner value to our internal kundali type (matches setGocharType in Java). */
  _normalizeKundaliType(value) {
    if (!value || typeof value !== 'string') return 'lagna';
    const v = value.trim().toLowerCase();
    const map = {
      lagna: 'lagna', ascendant: 'lagna',
      moon: 'chandra', chandra: 'chandra',
      sun: 'surya', surya: 'surya',
      mercury: 'budha', budha: 'budha',
      venus: 'shukra', shukra: 'shukra',
      mars: 'mangal', mangal: 'mangal',
      jupiter: 'guru', guru: 'guru',
      saturn: 'shani', shani: 'shani',
      ketu: 'ketu', rahu: 'rahu'
    };
    return map[v] || (this.constructor.KUNDALI_TYPES.includes(v) ? v : 'lagna');
  }

  /** Map kundali type (Sanskrit) to planet id used in chart data (English). */
  static get KUNDALI_TYPE_TO_PLANET_ID() {
    return {
      chandra: 'moon',
      surya: 'sun',
      budha: 'mercury',
      shukra: 'venus',
      mangal: 'mars',
      guru: 'jupiter',
      shani: 'saturn',
      ketu: 'ketu',
      rahu: 'rahu'
    };
  }

  /**
   * Get reference sign (1-12) for house 1 for the given kundali type from transit chart.
   * Matches Java: Lagna = ascendant; Moon = Moon sign; Sun = Sun sign; etc.
   */
  _getReferenceSignForKundaliType(kundaliType, transitAscendant, transitPlanets) {
    const norm = (s) => (s >= 1 && s <= 12 ? s : ((s % 12) + 12) % 12 || 12);
    if (kundaliType === 'lagna' || !kundaliType) {
      return norm(transitAscendant.sign);
    }
    const planetId = this.constructor.KUNDALI_TYPE_TO_PLANET_ID[kundaliType] || kundaliType;
    const planet = transitPlanets.find(p => p && p.id === planetId);
    const sign = (planet && planet.sign != null) ? planet.sign : transitAscendant.sign;
    return norm(sign);
  }

  /**
   * Calculate gochar (transit) positions for a given date/time
   *
   * @param {Object} birthDetails - Birth details object
   * @param {Object} transitDate - Transit date/time object
   *   - year, month, day, hour, minute (optional, defaults to current time)
   *   - cityName, countryName, timezone (optional, defaults to birth location)
   *   - kundaliType (optional): 'lagna' | 'chandra' | 'surya' | 'budha' | 'shukra' | 'mangal' | 'guru' | 'shani' | 'ketu' | 'rahu'. Default 'lagna'.
   * @returns {Promise<Object>} Gochar data with current positions and comparisons
   */
  async calculateGochar(birthDetails, transitDate = {}) {
    // Initialize location service
    this.locationService.init();

    // Get normalized birth details
    const normalizedBirth = birthDetails.getNormalized();

    // Get birth location data
    const birthLocation = this.locationService.getLocationData(
      normalizedBirth.cityName,
      normalizedBirth.countryName,
      normalizedBirth.timezone
    );

    // Determine transit location (use birth location if not specified)
    const transitCityName = transitDate.cityName || normalizedBirth.cityName;
    const transitCountryName = transitDate.countryName || normalizedBirth.countryName;
    const transitTimezone = transitDate.timezone || normalizedBirth.timezone;

    const transitLocation = this.locationService.getLocationData(
      transitCityName,
      transitCountryName,
      transitTimezone
    );

    // Calculate birth chart first (to get birth positions for comparison)
    const UniverseLite = require('./UniverseLite');
    const birthUniverse = new UniverseLite();
    
    if (normalizedBirth.gender) {
      birthUniverse.setGender(normalizedBirth.gender);
    }
    
    birthUniverse.setTimezone(birthLocation.country.timezone);
    birthUniverse.setLocCountry(birthLocation.country.name || normalizedBirth.countryName);
    if (birthLocation.city.cityId) {
      birthUniverse.setCityID(birthLocation.city.cityId.toString());
    }

    // Calculate birth chart
    await birthUniverse.calculate(
      normalizedBirth.year,
      normalizedBirth.month,
      normalizedBirth.day,
      normalizedBirth.hour,
      normalizedBirth.minute,
      birthLocation.city.latitude,
      birthLocation.city.latitudeDir,
      birthLocation.city.longitude,
      birthLocation.city.longitudeDir,
      parseFloat(birthLocation.country.gmt),
      birthLocation.city.cityName,
      birthLocation.country.name,
      normalizedBirth.name,
      birthLocation.country.timezone
    );

    const birthChartData = birthUniverse.getChartData();
    const birthAscendantSign = birthChartData.ascendant.sign;

    // Get transit location GMT offset (needed for time conversion)
    const transitGmt = parseFloat(transitLocation.country.gmt);

    // Determine transit date/time (use current time if not specified)
    // If transit date/time is provided, use it as local time for the transit location
    // Otherwise, get current local time for the transit location
    let transitYear, transitMonth, transitDay, transitHour, transitMinute;
    
    if (transitDate.year && transitDate.month && transitDate.day) {
      // Use provided transit date/time as local time
      transitYear = transitDate.year;
      transitMonth = transitDate.month;
      transitDay = transitDate.day;
      transitHour = transitDate.hour !== undefined ? transitDate.hour : 12; // Default to noon if not specified
      transitMinute = transitDate.minute !== undefined ? transitDate.minute : 0;
    } else {
      // Use current time in transit location's timezone
      const now = new Date();
      // Get current UTC time
      const utcNow = new Date(now.toISOString());
      // Convert UTC to local time for transit location
      const localTimeMs = utcNow.getTime() + (transitGmt * 60 * 60 * 1000);
      const localDate = new Date(localTimeMs);
      transitYear = localDate.getUTCFullYear();
      transitMonth = localDate.getUTCMonth() + 1;
      transitDay = localDate.getUTCDate();
      transitHour = localDate.getUTCHours();
      transitMinute = localDate.getUTCMinutes();
    }

    // Calculate transit Julian Day (UT)
    // Convert local time to UTC using transit location GMT offset
    const localTimeDecimal = transitHour + transitMinute / 60.0;
    let utcTimeDecimal = localTimeDecimal - transitGmt;
    
    // Handle day rollover
    let utcDay = transitDay;
    let utcMonth = transitMonth;
    let utcYear = transitYear;
    
    if (utcTimeDecimal < 0) {
      utcTimeDecimal += 24;
      utcDay--;
      if (utcDay < 1) {
        utcMonth--;
        if (utcMonth < 1) {
          utcMonth = 12;
          utcYear--;
        }
        // Get days in previous month
        const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
        utcDay = daysInMonth;
      }
    } else if (utcTimeDecimal >= 24) {
      utcTimeDecimal -= 24;
      utcDay++;
      const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
      if (utcDay > daysInMonth) {
        utcDay = 1;
        utcMonth++;
        if (utcMonth > 12) {
          utcMonth = 1;
          utcYear++;
        }
      }
    }

    const transitJdUt = ephemeris.calculateJulianDay(
      utcYear,
      utcMonth,
      utcDay,
      Math.floor(utcTimeDecimal),
      Math.round((utcTimeDecimal % 1) * 60)
    );

    // Get transit ayanamsa (Lahiri)
    const transitAyanamsa = ephemeris.getAyanamsa(transitJdUt);

    // Calculate transit ascendant (for transit chart)
    const transitAscendant = ephemeris.calculateAscendant(
      transitJdUt,
      transitLocation.city.latitudeDir === 'S' ? -transitLocation.city.latitude : transitLocation.city.latitude,
      transitLocation.city.longitudeDir === 'W' ? -transitLocation.city.longitude : transitLocation.city.longitude,
      transitAyanamsa
    );

    // Calculate all planets for transit
    const planetIds = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    const transitPlanets = [];
    
    // Store Sun's longitude for avastha calculation
    let transitSunLongitude = null;

    for (const planetId of planetIds) {
      // Calculate transit position
      const transitPosition = await ephemeris.calculatePlanet(
        transitJdUt,
        planetId,
        transitAyanamsa,
        birthAscendantSign // Use birth ascendant for house calculation
      );

      // Store Sun's longitude for avastha calculation
      if (planetId === 'sun') {
        transitSunLongitude = transitPosition.longitude;
      }

      // Get birth position for comparison
      const birthPlanet = birthChartData.planets.find(p => p.id === planetId);
      
      // Calculate nakshatra for transit position (pass planetId for special handling)
      const nakshatraResult = nakshatra.calculateNakshatra(transitPosition.longitude, planetId);

      // Transit house will be recomputed below based on selected kundali type (lagna/chandra/surya/etc.)
      const transitHouse = ephemeris.getHouse(transitPosition.sign, birthAscendantSign);

      // Calculate degree string (e.g., "15°30'")
      const degreeString = this.formatDegree(transitPosition.degree);

      // Compare with birth position
      const birthSign = birthPlanet ? birthPlanet.sign : null;
      const birthHouse = birthPlanet ? birthPlanet.house : null;
      const signChanged = birthSign !== null && transitPosition.sign !== birthSign;
      const houseChanged = birthHouse !== null && transitHouse !== birthHouse;

      transitPlanets.push({
        id: planetId,
        name: this.getPlanetName(planetId),
        nepaliName: this.getPlanetNepaliName(planetId),
        shortName: this.getPlanetShortName(planetId),
        // Transit position
        sign: transitPosition.sign,
        house: transitHouse,
        degree: transitPosition.degree,
        degreeString: degreeString,
        longitude: transitPosition.longitude,
        nakshatra: nakshatraResult.name,
        nakshatraPada: nakshatraResult.pada,
        retrograde: transitPosition.retrograde,
        speed: transitPosition.speed,
        // Birth position (for comparison)
        birthSign: birthSign,
        birthHouse: birthHouse,
        birthDegree: birthPlanet ? birthPlanet.degree : null,
        birthLongitude: birthPlanet ? birthPlanet.longitude : null,
        // Changes
        signChanged: signChanged,
        houseChanged: houseChanged,
        // Additional info
        color: this.getPlanetColor(planetId),
        // Avastha will be calculated after we have Sun's longitude
        avastha: null // Will be set below
      });
    }
    
    // Calculate avastha for all planets (need Sun's longitude)
    if (transitSunLongitude !== null) {
      for (let i = 0; i < transitPlanets.length; i++) {
        const planet = transitPlanets[i];
        planet.avastha = avastha.calculateAvastha(
          planet.id,
          planet.retrograde,
          planet.longitude,
          transitSunLongitude
        );
      }
    }

    // Kundali type: normalize Java/English names (Lagna, Moon, Sun...) to internal (lagna, chandra, surya...)
    const rawType = transitDate.kundaliType || transitDate.kundali_type || 'lagna';
    const kundaliType = this._normalizeKundaliType(rawType);
    const referenceSign = this._getReferenceSignForKundaliType(kundaliType, { sign: transitAscendant.sign }, transitPlanets);

    // Recompute each planet's house based on reference sign (house 1 = referenceSign)
    transitPlanets.forEach(p => {
      p.house = ((p.sign - referenceSign + 12) % 12) + 1;
      if (p.house < 1) p.house = 1;
      if (p.house > 12) p.house = 12;
    });

    // Calculate transit ascendant (for transit chart display)
    const transitAscendantData = {
      sign: transitAscendant.sign,
      house: 1,
      degree: transitAscendant.degree,
      degreeString: this.formatDegree(transitAscendant.degree),
      longitude: transitAscendant.longitude,
      nakshatra: nakshatra.calculateNakshatra(transitAscendant.longitude, true).name,
      nakshatraPada: nakshatra.calculateNakshatra(transitAscendant.longitude, true).pada
    };

    // Build transit houses: house 1 = referenceSign, house 2 = next sign, etc.
    const transitHouses = [];
    for (let i = 1; i <= 12; i++) {
      const houseSign = ((referenceSign + i - 2) % 12) + 1;
      const planetsInHouse = transitPlanets
        .filter(p => p.house === i)
        .map(p => p.shortName);
      transitHouses.push({
        number: i,
        planets: planetsInHouse,
        sign: houseSign
      });
    }

    const kundaliTypeNames = {
      lagna: 'लग्न (Ascendant)',
      chandra: 'चन्द्र (Moon)',
      surya: 'सूर्य (Sun)',
      budha: 'बुध (Mercury)',
      shukra: 'शुक्र (Venus)',
      mangal: 'मंगल (Mars)',
      guru: 'गुरु (Jupiter)',
      shani: 'शनि (Saturn)',
      ketu: 'केतु (Ketu)',
      rahu: 'राहु (Rahu)'
    };

    return {
      kundaliType,
      kundaliTypeName: kundaliTypeNames[kundaliType] || kundaliType,
      transitDate: {
        year: transitYear,
        month: transitMonth,
        day: transitDay,
        hour: transitHour,
        minute: transitMinute,
        timezone: transitLocation.country.timezone,
        location: {
          city: transitLocation.city.cityName,
          country: transitLocation.country.name,
          latitude: transitLocation.city.latitude,
          longitude: transitLocation.city.longitude
        }
      },
      birthChart: {
        ascendant: {
          sign: birthChartData.ascendant.sign,
          degree: birthChartData.ascendant.degree,
          degreeString: birthChartData.ascendant.degreeString,
          longitude: birthChartData.ascendant.longitude
        },
        planets: birthChartData.planets.map(p => ({
          id: p.id,
          name: p.name,
          sign: p.sign,
          house: p.house,
          degree: p.degree,
          degreeString: p.degreeString,
          longitude: p.longitude
        }))
      },
      transitChart: {
        ascendant: transitAscendantData,
        planets: transitPlanets,
        houses: transitHouses
      },
      ayanamsa: transitAyanamsa,
      julianDay: transitJdUt
    };
  }

  /**
   * Format degree as string (e.g., "15°30'")
   */
  formatDegree(degree) {
    const deg = Math.floor(degree);
    const min = Math.floor((degree - deg) * 60);
    return `${deg}°${min}'`;
  }

  /**
   * Get planet name in English
   */
  getPlanetName(planetId) {
    const names = {
      sun: 'Sun',
      moon: 'Moon',
      mars: 'Mars',
      mercury: 'Mercury',
      jupiter: 'Jupiter',
      venus: 'Venus',
      saturn: 'Saturn',
      rahu: 'Rahu',
      ketu: 'Ketu'
    };
    return names[planetId] || planetId;
  }

  /**
   * Get planet name in Nepali
   */
  getPlanetNepaliName(planetId) {
    const names = {
      sun: 'सूर्य',
      moon: 'चन्द्र',
      mars: 'मङ्गल',
      mercury: 'बुध',
      jupiter: 'गुरु',
      venus: 'शुक्र',
      saturn: 'शनि',
      rahu: 'राहु',
      ketu: 'केतु'
    };
    return names[planetId] || planetId;
  }

  /**
   * Get planet short name (for chart display)
   */
  getPlanetShortName(planetId) {
    const names = {
      sun: 'सू',
      moon: 'च',
      mars: 'मं',
      mercury: 'बु',
      jupiter: 'गु',
      venus: 'श',
      saturn: 'श',
      rahu: 'रा',
      ketu: 'के'
    };
    return names[planetId] || planetId;
  }

  /**
   * Get planet color (for chart display)
   */
  getPlanetColor(planetId) {
    const colors = {
      sun: '#FF6B00',
      moon: '#C0C0C0',
      mars: '#FF0000',
      mercury: '#8B8B8B',
      jupiter: '#FFD700',
      venus: '#FFC0CB',
      saturn: '#808080',
      rahu: '#000000',
      ketu: '#800080'
    };
    return colors[planetId] || '#000000';
  }
}

module.exports = GocharService;

