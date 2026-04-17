/**
 * BarshafalService (Annual Prediction Service)
 * 
 * Calculates annual predictions (वर्षफल) for a given BS (Bikram Sambat) year
 * Uses the same accurate ephemeris calculations as birth chart (100% accuracy)
 * 
 * Key Features:
 * - Calculates planetary positions at BS year start (Baisakh 1st)
 * - Uses Lahiri Ayanamsa (same as birth chart)
 * - Applies same calibration offset (0.88°) for consistency
 * - Compares year start positions with birth chart positions
 * - Calculates houses based on birth ascendant
 */

const ephemeris = require('../utils/ephemeris');
const nakshatra = require('../utils/nakshatra');
const avastha = require('../utils/avastha');
const bsConverter = require('../utils/bs-converter');
const LocationService = require('./LocationService');
const mj1Db = require('../database/mj1');
const dashaSystems = require('../utils/dasha-systems');

class BarshafalService {
  constructor() {
    this.locationService = new LocationService();
  }

  /**
   * Calculate barshafal (annual predictions) for a given BS year
   * 
   * @param {Object} birthDetails - Birth details object
   * @param {number} bsYear - BS year (e.g., 2081)
   * @returns {Promise<Object>} Barshafal data with year start positions and predictions
   */
  async calculateBarshafal(birthDetails, bsYear) {
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

    // Get birth Sun's longitude for solar return calculation
    let birthSun = birthChartData.planets.find(p => p.id === 'sun');
    // Fallback: try finding by name if id is not available
    if (!birthSun) {
      birthSun = birthChartData.planets.find(p => 
        p.name && (p.name.toLowerCase() === 'sun' || p.name === 'Sun')
      );
    }
    if (!birthSun || birthSun.longitude === null || birthSun.longitude === undefined) {
      throw new Error('Cannot calculate barshafal: Birth Sun position not found');
    }
    const birthSunLongitude = birthSun.longitude;

    // Get BS year start date (Baisakh 1st) in AD - use as starting point
    const yearStartDate = bsConverter.getBSYearStartDate(bsYear);
    
    // Calculate solar return: find exact moment when Sun returns to birth longitude
    // Start from approximate year start date (Baisakh 1st at birth time)
    const birthGmt = parseFloat(birthLocation.country.gmt);
    const birthLocalTimeDecimal = normalizedBirth.hour + normalizedBirth.minute / 60.0;
    let startUtcTimeDecimal = birthLocalTimeDecimal - birthGmt;
    
    // Handle day rollover for start date
    let startUtcDay = yearStartDate.day;
    let startUtcMonth = yearStartDate.month;
    let startUtcYear = yearStartDate.year;
    
    if (startUtcTimeDecimal < 0) {
      startUtcTimeDecimal += 24;
      startUtcDay--;
      if (startUtcDay < 1) {
        startUtcMonth--;
        if (startUtcMonth < 1) {
          startUtcMonth = 12;
          startUtcYear--;
        }
        const daysInMonth = new Date(startUtcYear, startUtcMonth, 0).getDate();
        startUtcDay = daysInMonth;
      }
    }

    // Start with approximate date/time
    let currentJdUt = ephemeris.calculateJulianDay(
      startUtcYear,
      startUtcMonth,
      startUtcDay,
      Math.floor(startUtcTimeDecimal),
      Math.round((startUtcTimeDecimal % 1) * 60)
    );

    // Calculate solar return: find when Sun returns to birth longitude
    // Use iterative approach to find exact moment
    const MAX_ITERATIONS = 20;
    const TOLERANCE = 0.01; // 0.01 degrees tolerance
    
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const currentAyanamsa = ephemeris.getAyanamsa(currentJdUt);
      const currentSunPos = await ephemeris.calculatePlanet(
        currentJdUt,
        'sun',
        currentAyanamsa,
        1 // Dummy ascendant sign, not used for longitude
      );
      
      // Calculate difference in longitude (handle 360° wrap)
      let diff = currentSunPos.longitude - birthSunLongitude;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      // If within tolerance, we found the solar return
      if (Math.abs(diff) < TOLERANCE) {
        break;
      }
      
      // Adjust time based on Sun's speed (degrees per day)
      // Sun moves approximately 0.9856 degrees per day (360/365.25)
      // But use actual speed from ephemeris for accuracy
      const sunSpeed = currentSunPos.speed || 0.9856; // degrees per day
      const daysToAdjust = -diff / sunSpeed; // Negative because we want to go back if Sun is ahead
      
      // Adjust Julian Day
      currentJdUt += daysToAdjust;
    }

    const yearStartJdUt = currentJdUt;

    // Convert Julian Day back to date for result
    const swisseph = require('swisseph');
    const revjul = swisseph.swe_revjul(yearStartJdUt, swisseph.SE_GREG_CAL);
    const solarReturnDate = {
      year: revjul.year,
      month: revjul.month,
      day: revjul.day,
      hour: Math.floor(revjul.hour),
      minute: Math.round((revjul.hour % 1) * 60)
    };

    // Get year start ayanamsa (Lahiri)
    const yearStartAyanamsa = ephemeris.getAyanamsa(yearStartJdUt);

    // Calculate year start ascendant (for barshafal kundali)
    const yearStartAscendant = ephemeris.calculateAscendant(
      yearStartJdUt,
      birthLocation.city.latitudeDir === 'S' ? -birthLocation.city.latitude : birthLocation.city.latitude,
      birthLocation.city.longitudeDir === 'W' ? -birthLocation.city.longitude : birthLocation.city.longitude,
      yearStartAyanamsa
    );
    const yearStartAscendantSign = yearStartAscendant.sign;

    // Calculate all planets for year start
    const planetIds = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    const yearStartPlanets = [];
    
    // Store Sun's longitude for avastha calculation
    let yearStartSunLongitude = null;

    for (const planetId of planetIds) {
      // Calculate year start position
      const yearStartPosition = await ephemeris.calculatePlanet(
        yearStartJdUt,
        planetId,
        yearStartAyanamsa,
        yearStartAscendantSign // Use YEAR START ascendant for house calculation (barshafal kundali)
      );

      // Store Sun's longitude for avastha calculation
      if (planetId === 'sun') {
        yearStartSunLongitude = yearStartPosition.longitude;
      }

      // Get birth position for comparison
      const birthPlanet = birthChartData.planets.find(p => p.id === planetId);
      
      // Calculate nakshatra for year start position
      const nakshatraResult = nakshatra.calculateNakshatra(yearStartPosition.longitude, planetId);

      // Calculate year start house based on YEAR START ascendant (for barshafal kundali)
      const yearStartHouse = ephemeris.getHouse(yearStartPosition.sign, yearStartAscendantSign);

      // Calculate degree string
      const degreeString = this.formatDegree(yearStartPosition.degree);

      // Compare with birth position
      const birthSign = birthPlanet ? birthPlanet.sign : null;
      const birthHouse = birthPlanet ? birthPlanet.house : null;
      const signChanged = birthSign !== null && yearStartPosition.sign !== birthSign;
      const houseChanged = birthHouse !== null && yearStartHouse !== birthHouse;

      yearStartPlanets.push({
        id: planetId,
        name: this.getPlanetName(planetId),
        nepaliName: this.getPlanetNepaliName(planetId),
        shortName: this.getPlanetShortName(planetId),
        // Year start position
        sign: yearStartPosition.sign,
        house: yearStartHouse,
        degree: yearStartPosition.degree,
        degreeString: degreeString,
        longitude: yearStartPosition.longitude,
        nakshatra: nakshatraResult.name,
        nakshatraPada: nakshatraResult.pada,
        retrograde: yearStartPosition.retrograde,
        speed: yearStartPosition.speed,
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
        avastha: null
      });
    }
    
    // Calculate avastha for all planets (need Sun's longitude)
    if (yearStartSunLongitude !== null) {
      for (let i = 0; i < yearStartPlanets.length; i++) {
        const planet = yearStartPlanets[i];
        planet.avastha = avastha.calculateAvastha(
          planet.id,
          planet.retrograde,
          planet.longitude,
          yearStartSunLongitude
        );
      }
    }

    // Build year start houses with sign numbers (based on year start ascendant)
    const yearStartHousesResult = await ephemeris.calculateHouses(
      yearStartJdUt,
      birthLocation.city.latitudeDir === 'S' ? -birthLocation.city.latitude : birthLocation.city.latitude,
      birthLocation.city.longitudeDir === 'W' ? -birthLocation.city.longitude : birthLocation.city.longitude,
      yearStartAyanamsa
    );
    
    // Ensure all houses have sign numbers - if missing, calculate from ascendant
    const yearStartHouses = yearStartHousesResult.houses.map(h => {
      // If sign is missing, calculate it from house number and ascendant sign
      let sign = h.sign;
      if (!sign || sign < 1 || sign > 12) {
        // House 1 = ascendant sign, House 2 = next sign, etc.
        sign = ((yearStartAscendantSign + h.number - 2) % 12) + 1;
        if (sign === 0) sign = 12;
      }
      return {
        number: h.number,
        sign: sign,
        planets: yearStartPlanets.filter(p => p.house === h.number).map(p => p.shortName)
      };
    });

    const result = {
      bsYear: bsYear,
      yearStartDate: {
        bs: {
          year: bsYear,
          month: 1, // Baisakh
          day: 1
        },
        ad: {
          year: solarReturnDate.year,
          month: solarReturnDate.month,
          day: solarReturnDate.day,
          hour: solarReturnDate.hour,
          minute: solarReturnDate.minute
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
      yearStartChart: {
        ascendant: {
          sign: yearStartAscendant.sign,
          house: 1,
          degree: yearStartAscendant.degree,
          degreeString: this.formatDegree(yearStartAscendant.degree),
          longitude: yearStartAscendant.longitude,
          nakshatra: nakshatra.calculateNakshatra(yearStartAscendant.longitude, true).name,
          nakshatraPada: nakshatra.calculateNakshatra(yearStartAscendant.longitude, true).pada
        },
        planets: yearStartPlanets,
        houses: yearStartHouses
      },
      ayanamsa: yearStartAyanamsa,
      julianDay: yearStartJdUt
    };

    // Generate predictions
    const predictions = await this.generatePredictions(
      birthDetails,
      bsYear,
      birthChartData,
      yearStartPlanets,
      yearStartHouses,
      yearStartAscendantSign,
      solarReturnDate
    );

    return {
      ...result,
      predictions: predictions
    };
  }

  /**
   * Generate barshafal predictions
   * 
   * @param {Object} birthDetails - Birth details
   * @param {number} bsYear - BS year
   * @param {Object} birthChartData - Birth chart data
   * @param {Array} yearStartPlanets - Year start planetary positions
   * @param {Array} yearStartHouses - Year start houses
   * @param {number} yearStartAscendantSign - Year start chart ascendant sign (1-12)
   * @param {Object} solarReturnDate - Solar return date (actual year start date)
   * @returns {Promise<Object>} Predictions object
   */
  async generatePredictions(birthDetails, bsYear, birthChartData, yearStartPlanets, yearStartHouses, yearStartAscendantSign, solarReturnDate) {
    // Initialize MJ1 database
    mj1Db.init();

    // Calculate age at solar return (actual year start)
    const normalizedBirth = birthDetails.getNormalized();
    const birthYear = normalizedBirth.year;
    const birthMonth = normalizedBirth.month;
    const birthDay = normalizedBirth.day;
    
    // Calculate age (in years) at the solar return date
    // This is the actual year start, not Baisakh 1st
    let age = solarReturnDate.year - birthYear;
    if (solarReturnDate.month < birthMonth || (solarReturnDate.month === birthMonth && solarReturnDate.day < birthDay)) {
      age--; // Haven't reached birthday yet
    }
    
    // Calculate Muntha house
    // Java: o00oO0o.OooO0oo() returns house sign from year-start chart
    // Formula: (age + 1) % 12, if 0 then 12
    // Then get house sign from year-start chart's houses array at that index
    // Java code: new o000OO0O(this.f10065OooO0Oo).f10105OooOOO[((this.f10066OooO0o + 1) % 12 != 0 ? r0 : 12) - 1].OooO0O0()
    let munthaHouseIndex = (age + 1) % 12;
    if (munthaHouseIndex === 0) {
      munthaHouseIndex = 12;
    }
    
    // Get the actual house sign from year-start chart's houses array
    // Java: f10105OooOOO is the houses array, indexed 0-11 (houses 1-12)
    // OooO0O0() returns the house sign (1-12)
    const munthaHouseSign = yearStartHouses[munthaHouseIndex - 1]?.sign || munthaHouseIndex;
    
    // Muntha AscID is the house number (1-12) for database lookup
    // Java: String.valueOf(o000oo0o2.OooO0O0(o00oo0o.OooO0oo()))
    // o000O0Oo.OooO0O0() converts house sign to house number based on year-start ascendant
    // But for database lookup, we use the house index directly (1-12)
    const munthaAscID = munthaHouseIndex;

    const genderRaw = normalizedBirth.gender;

    // Get Muntha Lagna prediction (तपाईं → पुरुष / स्त्री by gender)
    const munthaLagnaPrediction = mj1Db.getMunthaLagnaPrediction(munthaAscID, genderRaw);

    // Calculate annual dasha periods for date ranges
    // Use Vimshottari dasha but with annual periods (1 year = 1 dasha period)
    const moon = birthChartData.planets.find(p => p.id === 'moon');
    if (!moon) {
      return {
        muntha: {
          house: munthaHouseSign,
          houseNumber: munthaHouseIndex,
          prediction: munthaLagnaPrediction
        },
        planetaryPredictions: []
      };
    }

    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const yearStartAdDate = new Date(solarReturnDate.year, solarReturnDate.month - 1, solarReturnDate.day, solarReturnDate.hour || 0, solarReturnDate.minute || 0);
    
    // Calculate annual dasha periods (each planet gets 1 year in rotation)
    // For annual predictions, we use a simplified annual dasha system
    // Starting from year start, each planet rules for approximately 1 year
    const annualDashaPeriods = this.calculateAnnualDashaPeriods(
      moon.longitude,
      yearStartAdDate,
      bsYear
    );

    // Generate planetary predictions for ALL planets
    // Each planet should have a prediction with date range
    const planetaryPredictions = [];
    
    for (const planet of yearStartPlanets) {
      const planetID = mj1Db.getPlanetID(planet.id);
      if (!planetID) continue;

      const houseID = planet.house;
      
      // Get prediction from varsafal table
      // IMPORTANT: Use year start chart's ascendant sign (not Muntha house) as AscID
      // This matches the Java implementation: varsafalLagna.OooO0Oo().OooOo0O()
      const prediction = mj1Db.getMunthaDasaPredictionBYDasa(
        yearStartAscendantSign,
        houseID,
        planetID,
        genderRaw
      );
      
      // Find date range for this planet's dasha period
      const dashaPeriod = annualDashaPeriods.find(p => p.planetId === planet.id);
      
      let dateRange = null;
      if (dashaPeriod) {
        dateRange = {
          start: this.formatBSDate(dashaPeriod.startDate, bsYear),
          end: this.formatBSDate(dashaPeriod.endDate, bsYear)
        };
      }

      // Include prediction even if empty (so all planets are shown)
      planetaryPredictions.push({
        planetId: planet.id,
        planetName: planet.nepaliName,
        house: houseID,
        prediction: prediction || '', // Empty string if no prediction found
        dateRange: dateRange
      });
    }

    return {
      muntha: {
        house: munthaHouseSign,
        houseNumber: munthaHouseIndex,
        prediction: munthaLagnaPrediction
      },
      planetaryPredictions: planetaryPredictions
    };
  }

  /**
   * Calculate annual dasha periods for the BS year
   * Uses Vimshottari dasha scaled to 1 year (annual mudda dasha)
   * 
   * @param {number} moonLongitude - Moon's sidereal longitude
   * @param {Date} yearStartDate - Year start date (AD)
   * @param {number} bsYear - BS year
   * @returns {Array} Array of dasha periods with date ranges
   */
  calculateAnnualDashaPeriods(moonLongitude, yearStartDate, bsYear) {
    // Vimshottari periods (in years)
    const VIMSHOTTARI_PERIODS = {
      ketu: 7,
      venus: 20,
      sun: 6,
      moon: 10,
      mars: 7,
      rahu: 18,
      jupiter: 16,
      saturn: 19,
      mercury: 17
    };
    
    const VIMSHOTTARI_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
    const TOTAL_VIMSHOTTARI = 120; // Total years in Vimshottari cycle
    
    // Get current dasha at year start
    const vimshottariDashas = dashaSystems.calculateVimshottariDasha(moonLongitude, yearStartDate, 120);
    const currentDasha = dashaSystems.getCurrentDashaPeriods(vimshottariDashas, yearStartDate);
    
    if (!currentDasha || !currentDasha.dasha) {
      return [];
    }

    const periods = [];
    const dashaLord = currentDasha.dasha.lord;
    const dashaLordIndex = VIMSHOTTARI_ORDER.indexOf(dashaLord);
    
    if (dashaLordIndex === -1) {
      return [];
    }

    // Calculate date ranges for each planet's annual period
    // Scale Vimshottari periods to 1 year total
    let currentDate = new Date(yearStartDate);
    const yearEndDate = new Date(yearStartDate);
    yearEndDate.setFullYear(yearEndDate.getFullYear() + 1);
    const totalDaysInYear = (yearEndDate - currentDate) / (24 * 60 * 60 * 1000);

    // Calculate how much of the current dasha period remains (in days)
    const dashaEndDate = new Date(currentDasha.dasha.endDate);
    const remainingInDashaDays = Math.max(0, (dashaEndDate - currentDate) / (24 * 60 * 60 * 1000));
    
    let currentLordIndex = dashaLordIndex;
    let cumulativeDays = 0;
    
    // Start from current dasha lord
    while (currentDate < yearEndDate && cumulativeDays < totalDaysInYear) {
      const currentLord = VIMSHOTTARI_ORDER[currentLordIndex];
      const periodStart = new Date(currentDate);
      
      // Calculate period duration: scale Vimshottari period to 1 year
      const vimshottariPeriod = VIMSHOTTARI_PERIODS[currentLord];
      const annualPeriodDays = (vimshottariPeriod / TOTAL_VIMSHOTTARI) * totalDaysInYear;
      
      // For the first period (current dasha), use remaining days if less than full period
      let periodDays = annualPeriodDays;
      if (currentLord === dashaLord && remainingInDashaDays < annualPeriodDays) {
        periodDays = remainingInDashaDays;
      }
      
      // Don't exceed year end
      const remainingDays = totalDaysInYear - cumulativeDays;
      if (periodDays > remainingDays) {
        periodDays = remainingDays;
      }
      
      const periodEnd = new Date(periodStart);
      periodEnd.setTime(periodEnd.getTime() + periodDays * 24 * 60 * 60 * 1000);
      
      // Don't exceed year end
      if (periodEnd > yearEndDate) {
        periodEnd.setTime(yearEndDate.getTime());
      }
      
      periods.push({
        planetId: currentLord,
        startDate: periodStart,
        endDate: periodEnd
      });
      
      currentDate = new Date(periodEnd);
      currentLordIndex = (currentLordIndex + 1) % VIMSHOTTARI_ORDER.length;
      cumulativeDays += periodDays;
    }

    return periods;
  }

  /**
   * Format date as BS date string
   * 
   * @param {Date} date - AD date
   * @param {number} bsYear - BS year (for reference)
   * @returns {string} BS date string (e.g., "२०८१-१२-२")
   */
  formatBSDate(date, bsYear) {
    // Approximate conversion: BS year = AD year + 56-57
    const bsYearApprox = date.getFullYear() + 56;
    let bsMonth = date.getMonth() + 1 - 3; // April (4) = Baisakh (1)
    if (bsMonth <= 0) {
      bsMonth += 12;
    }
    const bsDay = date.getDate();
    
    return `${this.toNepaliNumerals(bsYearApprox)}-${this.toNepaliNumerals(bsMonth)}-${this.toNepaliNumerals(bsDay)}`;
  }

  /**
   * Convert number to Nepali (Devanagari) numerals
   * 
   * @param {number} num - Number to convert
   * @returns {string} Nepali numeral string
   */
  toNepaliNumerals(num) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[parseInt(digit)]).join('');
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

module.exports = BarshafalService;

