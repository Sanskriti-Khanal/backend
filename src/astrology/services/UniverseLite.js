/**
 * UniverseLite - Clean re-implementation of Universe class
 * 
 * This class matches the original Universe.java interface but uses
 * Swiss Ephemeris for accurate calculations.
 * 
 * Original Universe methods mapped:
 * - OooO00o() → calculate()
 * - OooO0o0() → getAscendantSign()
 * - OooO0Oo() → getAscendant()
 * - OooOoo0() → getSun()
 * - OooOo0() → getMoon()
 * - etc.
 */

const ephemeris = require('../utils/ephemeris');
const nakshatra = require('../utils/nakshatra');
const navamsa = require('../utils/navamsa');
const divisionalCharts = require('../utils/divisional-charts');
const planetRelations = require('../utils/planetRelations');
const avastha = require('../utils/avastha');
const dashaSystems = require('../utils/dasha-systems');

class UniverseLite {
  constructor() {
    // Birth details
    this.birthYear = null;
    this.birthMonth = null;
    this.birthDay = null;
    this.birthHour = null;
    this.birthMinute = null;
    this.latitude = null;
    this.latitudeDir = null; // "N" or "S"
    this.longitude = null;
    this.longitudeDir = null; // "E" or "W"
    this.gmt = null;
    this.place = null;
    this.country = null;
    this.name = null;
    this.gender = null;
    this.timezone = null;
    this.locCountry = null;
    this.cityID = null;

    // Calculated data
    this.ascendantSign = null; // 1-12
    this.ascendantDegree = null; // degrees within sign
    this.ascendantLongitude = null; // absolute sidereal longitude
    this.julianDay = null;
    this.ayanamsa = null;

    // Planets array: [Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu]
    this.planets = [
      { id: 'sun', name: 'Sun', nepaliName: 'सूर्य', shortName: 'सू', color: '#f90313' },
      { id: 'moon', name: 'Moon', nepaliName: 'चन्द्र', shortName: 'च', color: '#019eff' },
      { id: 'mars', name: 'Mars', nepaliName: 'मंगल', shortName: 'मं', color: '#d1090c' },
      { id: 'mercury', name: 'Mercury', nepaliName: 'बुध', shortName: 'बु', color: '#31be02' },
      { id: 'jupiter', name: 'Jupiter', nepaliName: 'गुरु', shortName: 'गु', color: '#f58803' },
      { id: 'venus', name: 'Venus', nepaliName: 'शुक्र', shortName: 'शु', color: '#eb02ef' },
      { id: 'saturn', name: 'Saturn', nepaliName: 'शनि', shortName: 'श', color: '#001efd' },
      { id: 'rahu', name: 'Rahu', nepaliName: 'राहु', shortName: 'रा', color: '#6904c1' },
      { id: 'ketu', name: 'Ketu', nepaliName: 'केतु', shortName: 'के', color: '#6904c1' }
    ];

    // Ascendant planet object (for compatibility with original API)
    this.ascendant = {
      id: 'asc',
      name: 'Asc',
      nepaliName: 'लग्न',
      shortName: 'ल',
      color: '#f90313',
      sign: null,
      house: 1,
      degree: null,
      longitude: null,
      degreeString: null, // "DDD°MM'SS.SSSS"
      nakshatra: null,
      nakshatraPada: null,
      relation: '-',
      retrograde: false
    };

    // Navamsa data
    this.navamsaAscendantSign = null; // 1-12
    this.navamsaChart = null; // Full Navamsa chart data

    // Hora data
    this.horaChart = null; // Full Hora chart data

    // Drekkana data
    this.drekkanaChart = null; // Full Drekkana chart data

    // Chaturthamsa data
    this.chaturthamsaChart = null; // Full Chaturthamsa chart data

    // Saptamsa data
    this.saptamsaChart = null; // Full Saptamsa chart data

    // Dashamsa data
    this.dashamsaChart = null; // Full Dashamsa chart data

    // Dwadasamsa data (D-12 Parents chart)
    this.dwadasamsaChart = null;

    // Shodasamsa data (D-16 Vehicles chart)
    this.shodasamsaChart = null; // Full Shodasamsa chart data

    // Vimsamsa data (D-20 Spiritual chart)
    this.vimsamsaChart = null;

    // Chaturvimsamsa data (D-24 Education chart)
    this.chaturvimsamsaChart = null;

    // Dasha data
    this.vimshottariDashas = null;
    this.currentDashaPeriods = null;
    this.tribhagiDashas = null;
    this.currentTribhagiDashaPeriods = null;
    this.yoginiDashas = null;
    this.currentYoginiDashaPeriods = null;

  }

  /**
   * Main calculation method - matches Universe.OooO00o()
   * 
   * @param {number} year - Birth year
   * @param {number} month - Birth month (1-12)
   * @param {number} day - Birth day
   * @param {number} hour - Birth hour (0-23)
   * @param {number} minute - Birth minute (0-59)
   * @param {number} lat - Latitude
   * @param {string} latDir - Latitude direction ("N" or "S")
   * @param {number} lon - Longitude
   * @param {string} lonDir - Longitude direction ("E" or "W")
   * @param {number} gmt - GMT offset (e.g., 5.75 for Nepal)
   * @param {string} place - Place name
   * @param {string} country - Country name
   * @param {string} name - Person's name
   * @param {string} timezone - Timezone string (e.g., "Asia/Kathmandu")
   */
  async calculate(year, month, day, hour, minute, lat, latDir, lon, lonDir, gmt, place, country, name, timezone, isBalanced = true) {
    // Store birth details
    this.birthYear = year;
    this.birthMonth = month;
    this.birthDay = day;
    this.birthHour = hour;
    this.birthMinute = minute;
    this.latitude = latDir === 'S' ? -lat : lat;
    this.latitudeDir = latDir;
    this.longitude = lonDir === 'W' ? -lon : lon;
    this.longitudeDir = lonDir;
    this.gmt = gmt;
    this.place = place;
    this.country = country;
    this.name = name;
    this.timezone = timezone;

    // Calculate Julian Day (UT)
    // Convert local time to decimal hours, subtract GMT offset, then convert back
    const localTimeDecimal = hour + minute / 60.0;
    let utcTimeDecimal = localTimeDecimal - gmt;
    
    // Handle day rollover
    let utcDay = day;
    let utcMonth = month;
    let utcYear = year;
    
    if (utcTimeDecimal < 0) {
      utcTimeDecimal += 24;
      utcDay--;
      if (utcDay < 1) {
        utcMonth--;
        if (utcMonth < 1) {
          utcMonth = 12;
          utcYear--;
        }
        utcDay = new Date(utcYear, utcMonth, 0).getDate();
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
    
    const utcHour = Math.floor(utcTimeDecimal);
    const utcMinute = Math.round((utcTimeDecimal - utcHour) * 60);
    this.julianDay = ephemeris.calculateJulianDay(utcYear, utcMonth, utcDay, utcHour, utcMinute);

    // Get Ayanamsa (Lahiri)
    this.ayanamsa = ephemeris.getAyanamsa(this.julianDay);

    // Calculate Ascendant
    const ascResult = ephemeris.calculateAscendant(this.julianDay, this.latitude, this.longitude, this.ayanamsa);
    if (!ascResult || isNaN(ascResult.sign)) {
      throw new Error('Failed to calculate ascendant');
    }
    this.ascendantSign = ascResult.sign;
    this.ascendantDegree = ascResult.degree;
    this.ascendantLongitude = ascResult.longitude;
    this.ascendant.sign = ascResult.sign;
    this.ascendant.degree = ascResult.degree;
    this.ascendant.longitude = ascResult.longitude;
    // Preserve raw sidereal longitude for downstream calculations (e.g., divisional charts)
    this.ascendant.rawLongitude = ascResult.rawLongitude;
    this.ascendant.degreeString = this.formatDegree(ascResult.degree);
    
    // Calculate nakshatra for ascendant (pass isLagna=true for different pada calculation)
    const ascNakshatraResult = nakshatra.calculateNakshatra(ascResult.longitude, true);
    this.ascendant.nakshatra = ascNakshatraResult.name;
    this.ascendant.nakshatraPada = ascNakshatraResult.pada;
    this.ascendant.avastha = ''; // Ascendant doesn't have avastha

    // Calculate all planets - first get Sun's longitude for combust calculation
    let sunLongitude = null;
    for (let i = 0; i < this.planets.length; i++) {
      const planet = this.planets[i];
      const planetResult = await ephemeris.calculatePlanet(
        this.julianDay,
        planet.id,
        this.ayanamsa,
        this.ascendantSign
      );
      
      planet.sign = planetResult.sign;
      planet.house = planetResult.house;
      planet.degree = planetResult.degree;
      planet.longitude = planetResult.longitude; // Display longitude (calibrated)
      planet.rawLongitude = planetResult.tropicalLongitude; // Raw sidereal longitude for calculations
      planet.degreeString = this.formatDegree(planetResult.degree);
      planet.retrograde = planetResult.retrograde;
      planet.speed = planetResult.speed;
      
      // Store Sun's longitude for combust calculation
      if (planet.id === 'sun') {
        sunLongitude = planetResult.longitude;
      }
      
      // Calculate nakshatra using RAW sidereal longitude (not calibrated) for accurate calculations
      // This matches Java: nakshatra is calculated from raw sidereal longitude
      const rawSiderealLongitude = planetResult.tropicalLongitude || planetResult.longitude;
      const nakshatraResult = nakshatra.calculateNakshatra(rawSiderealLongitude, planet.id);
      planet.nakshatra = nakshatraResult.name;
      planet.nakshatraPada = nakshatraResult.pada;
      
      // Calculate relation
      planet.relation = planetRelations.calculatePlanetRelation(planet.id, planetResult.sign);
    }
    
    // Calculate avastha for all planets (need Sun's longitude)
    if (sunLongitude !== null) {
      for (let i = 0; i < this.planets.length; i++) {
        const planet = this.planets[i];
        planet.avastha = avastha.calculateAvastha(
          planet.id,
          planet.retrograde,
          planet.longitude,
          sunLongitude
        );
      }
    }

    // Calculate Navamsa chart
    const navamsaChart = navamsa.calculateNavamsaChart(this.planets, this.ascendant);
    this.navamsaAscendantSign = navamsaChart.ascendantSign;
    this.navamsaChart = navamsaChart;
    
    // Add Navamsa data to planets and ascendant
    this.ascendant.navamsa = navamsaChart.ascendant.navamsa;
    for (let i = 0; i < this.planets.length; i++) {
      this.planets[i].navamsa = navamsaChart.planets[i].navamsa;
    }

    // Calculate Hora chart (D-2)
    const horaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 2, 'hora');
    this.horaChart = horaChart;

    // Calculate Drekkana chart (D-3)
    const drekkanaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 3, 'drekkana');
    this.drekkanaChart = drekkanaChart;

    // Calculate Chaturthamsa chart (D-4)
    const chaturthamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 4, 'chaturthamsa');
    this.chaturthamsaChart = chaturthamsaChart;

    // Calculate Saptamsa chart (D-7)
    const saptamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 7, 'saptamsa');
    this.saptamsaChart = saptamsaChart;

    // Calculate Dashamsa chart (D-10)
    const dashamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 10, 'dashamsa');
    this.dashamsaChart = dashamsaChart;

    // Calculate Dwadasamsa chart (D-12)
    const dwadasamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 12, 'dwadasamsa');
    this.dwadasamsaChart = dwadasamsaChart;

    // Calculate Shodasamsa chart (D-16)
    const shodasamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 16, 'shodasamsa');
    this.shodasamsaChart = shodasamsaChart;

    // Calculate Vimsamsa chart (D-20)
    const vimsamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 20, 'vimsamsa');
    this.vimsamsaChart = vimsamsaChart;

    // Calculate Chaturvimsamsa chart (D-24)
    const chaturvimsamsaChart = divisionalCharts.calculateDivisionalChartForAll(this.planets, this.ascendant, 24, 'chaturvimsamsa');
    this.chaturvimsamsaChart = chaturvimsamsaChart;

    // Calculate Vimshottari Dasha
    const moon = this.planets.find(p => p.id === 'moon' || p.name === 'Moon');
    if (moon && moon.longitude !== null) {
      const birthDate = new Date(this.birthYear, this.birthMonth - 1, this.birthDay, this.birthHour, this.birthMinute);
      
      // CRITICAL: Use RAW sidereal longitude for dasha calculations (not calibrated display value)
      // This matches Java: dasha is calculated from raw sidereal longitude
      // The calibrated offset (+0.88) is only for display, not for calculations
      const moonRawLongitude = moon.rawLongitude || moon.longitude;
      
      // Use balanced mode parameter (defaults to true/balanced if not provided)
      
      // Vimshottari Dasha (120 years)
      this.vimshottariDashas = dashaSystems.calculateVimshottariDasha(
        moonRawLongitude,
        birthDate,
        120, // Calculate for 120 years
        isBalanced
      );
      
      // Get current Vimshottari dasha periods (Dasha, Bhukti, Antara)
      const currentDate = new Date();
      this.currentDashaPeriods = dashaSystems.getCurrentDashaPeriods(
        this.vimshottariDashas,
        currentDate
      );
      
      // Tribhagi Dasha (80 years)
      this.tribhagiDashas = dashaSystems.calculateTribhagiDasha(
        moonRawLongitude,
        birthDate,
        80, // Calculate for 80 years
        isBalanced
      );
      
      // Get current Tribhagi dasha periods (Dasha, Bhukti, Antara)
      this.currentTribhagiDashaPeriods = dashaSystems.getCurrentTribhagiDashaPeriods(
        this.tribhagiDashas,
        currentDate
      );

      // Yogini Dasha — 120 years to match Java app (~26 major periods)
      this.yoginiDashas = dashaSystems.calculateYoginiDasha(
        moonRawLongitude,
        birthDate,
        120, // Calculate for 120 years (~26 periods)
        isBalanced
      );

      // Get current Yogini dasha periods (Dasha, Bhukti, Antara)
      this.currentYoginiDashaPeriods = dashaSystems.getCurrentYoginiDashaPeriods(
        this.yoginiDashas,
        currentDate
      );
    }

  }

  /**
   * Format degree as "DDD°MM'SS.SSSS" - matches Universe.Oooo0o0()
   */
  formatDegree(degrees) {
    // Use the degree value directly without epsilon to avoid precision issues
    const d = Math.abs(degrees); // Ensure positive value
    const deg = Math.floor(d);
    const min = (d - deg) * 60;
    const minInt = Math.floor(min);
    const sec = (min - minInt) * 60;
    // Round seconds to integer for cleaner display
    const secInt = Math.round(sec);
    return `${deg.toString().padStart(3, ' ')}°${minInt.toString().padStart(2, '0')}'${secInt.toString().padStart(2, '0')}"`;
  }

  /**
   * Format degree as "DD°MM'" - matches Universe.OooO0OO()
   */
  formatDegreeShort(degrees) {
    // Use the degree value directly without epsilon to avoid precision issues
    const d = Math.abs(degrees); // Ensure positive value
    const deg = Math.floor(d);
    const min = Math.floor((d - deg) * 60);
    return `${deg}°${min}'`;
  }

  // ========== Getter Methods (matching original Universe API) ==========

  /**
   * Get gender - matches Universe.OooO()
   */
  getGender() {
    return this.gender;
  }

  /**
   * Set gender - matches Universe.Oooo0()
   */
  setGender(gender) {
    this.gender = gender;
  }

  /**
   * Get ascendant sign (1-12) - matches Universe.OooO0o0()
   */
  getAscendantSign() {
    return this.ascendantSign;
  }

  /**
   * Get ascendant planet object - matches Universe.OooO0Oo()
   */
  getAscendant() {
    return this.ascendant;
  }

  /**
   * Get birth day - matches Universe.OooO0o()
   */
  getBirthDay() {
    return this.birthDay;
  }

  /**
   * Get birth month - matches Universe.OooO0oO()
   */
  getBirthMonth() {
    return this.birthMonth;
  }

  /**
   * Get birth year - matches Universe.OooO0oo()
   */
  getBirthYear() {
    return this.birthYear;
  }

  /**
   * Get birth hour - matches Universe.OooOO0()
   */
  getBirthHour() {
    return this.birthHour;
  }

  /**
   * Get birth minute - matches Universe.OooOOoo()
   */
  getBirthMinute() {
    return this.birthMinute;
  }

  /**
   * Get latitude direction - matches Universe.OooOOO()
   */
  getLatitudeDir() {
    return this.latitudeDir;
  }

  /**
   * Get latitude - matches Universe.OooOOO0()
   */
  getLatitude() {
    return this.latitude;
  }

  /**
   * Get longitude - matches Universe.OooOOOO()
   */
  getLongitude() {
    return this.longitude;
  }

  /**
   * Get longitude direction - matches Universe.OooOOOo()
   */
  getLongitudeDir() {
    return this.longitudeDir;
  }

  /**
   * Get place name - matches Universe.OooOo()
   */
  getPlace() {
    return this.place;
  }

  /**
   * Get country - matches Universe.getCountry()
   */
  getCountry() {
    return this.country;
  }

  /**
   * Get name - matches Universe.OooOo0O()
   */
  getName() {
    return this.name;
  }

  /**
   * Get timezone - matches Universe.OooOooO()
   */
  getTimezone() {
    return this.timezone;
  }

  /**
   * Set timezone - matches Universe.Oooo0OO()
   */
  setTimezone(timezone) {
    this.timezone = timezone;
  }

  /**
   * Get locCountry - matches Universe.getLocCountry()
   */
  getLocCountry() {
    return this.locCountry;
  }

  /**
   * Set locCountry - matches Universe.Oooo0O0()
   */
  setLocCountry(locCountry) {
    this.locCountry = locCountry;
  }

  /**
   * Get cityID - matches Universe.getCityID()
   */
  getCityID() {
    return this.cityID;
  }

  /**
   * Set cityID - matches Universe.Oooo00o()
   */
  setCityID(cityID) {
    this.cityID = cityID;
  }

  // ========== Planet Getter Methods ==========

  /**
   * Get Sun - matches Universe.OooOoo0()
   */
  getSun() {
    return this.planets[0];
  }

  /**
   * Get Moon - matches Universe.OooOo0()
   */
  getMoon() {
    return this.planets[1];
  }

  /**
   * Get Mars - matches Universe.OooOOo0()
   */
  getMars() {
    return this.planets[2];
  }

  /**
   * Get Mercury - matches Universe.OooOOo()
   */
  getMercury() {
    return this.planets[3];
  }

  /**
   * Get Jupiter - matches Universe.OooOO0O()
   */
  getJupiter() {
    return this.planets[4];
  }

  /**
   * Get Venus - matches Universe.Oooo000()
   */
  getVenus() {
    return this.planets[5];
  }

  /**
   * Get Saturn - matches Universe.OooOoOO()
   */
  getSaturn() {
    return this.planets[6];
  }

  /**
   * Get Rahu - matches Universe.OooOoO()
   */
  getRahu() {
    return this.planets[7];
  }

  /**
   * Get Ketu - matches Universe.OooOO0o()
   */
  getKetu() {
    return this.planets[8];
  }

  /**
   * Get all planets array - matches Universe.OooOOO array
   */
  getAllPlanets() {
    return this.planets;
  }

  // ========== Navamsa Getter Methods ==========

  /**
   * Get Navamsa ascendant sign (1-12)
   */
  getNavamsaAscendantSign() {
    return this.navamsaAscendantSign;
  }

  /**
   * Get Navamsa chart data
   */
  getNavamsaChart() {
    return this.navamsaChart;
  }

  // ========== Derived Chart Helpers ==========

  /**
   * Build Lagna houses array (12 houses with planets in each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildLagnaHouses() {
    if (!this.ascendantSign) {
      return [];
    }

    const houses = [];

    // Initialize 12 houses starting from ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((this.ascendantSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    // Whole-sign chart: house from (planet rashi vs lagna rashi), not cached planet.house
    this.planets.forEach(planet => {
      if (!planet.sign || planet.sign < 1 || planet.sign > 12) return;
      const house = ephemeris.getHouse(planet.sign, this.ascendantSign);
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Chandra Kundali (Moon chart) houses array (12 houses with planets in each)
   * In Chandra Kundali, Moon's sign becomes the ascendant (house 1)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildChandraKundaliHouses() {
    const moon = this.getMoon();
    if (!moon || !moon.sign) {
      return [];
    }

    const moonSign = moon.sign;
    const houses = [];

    // Initialize 12 houses starting from Moon's sign (Moon sign = House 1)
    for (let i = 1; i <= 12; i++) {
      const sign = ((moonSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.planets.forEach(planet => {
      if (!planet.sign || planet.sign < 1 || planet.sign > 12) return;
      const house = ephemeris.getHouse(planet.sign, moonSign);
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Moon itself is always in house 1 (as the ascendant of Chandra Kundali)
    // Remove Moon if it was already added, then add it at the beginning
    const moonLabel = moon.shortName || moon.id || moon.name;
    houses[0].planets = houses[0].planets.filter(p => p !== moonLabel);
    houses[0].planets.unshift(moonLabel);

    if (this.ascendant && this.ascendant.sign) {
      const ascHouse = ephemeris.getHouse(this.ascendant.sign, moonSign);
      const ascHouseIndex = ascHouse - 1;
      const ascLabel = this.ascendant.shortName || this.ascendant.id || this.ascendant.name;
      // Only add if not already in that house (to avoid duplicates)
      if (!houses[ascHouseIndex].planets.includes(ascLabel)) {
        houses[ascHouseIndex].planets.push(ascLabel);
      }
    }

    return houses;
  }

  /**
   * Build planet-based Kundali houses (generic method)
   * Uses the specified planet's sign as the ascendant (house 1)
   * 
   * @param {string} planetId - Planet ID ('sun', 'moon', 'mars', etc.)
   * @param {string} kundaliName - Name of the Kundali (for logging)
   * @returns {Array} Houses array with planets
   */
  buildPlanetKundaliHouses(planetId, kundaliName = 'Planet') {
    const planet = this.planets.find(p => 
      p.id === planetId || 
      p.name?.toLowerCase() === planetId.toLowerCase() ||
      (planetId === 'sun' && (p.id === 'sun' || p.name === 'Sun')) ||
      (planetId === 'moon' && (p.id === 'moon' || p.name === 'Moon')) ||
      (planetId === 'mars' && (p.id === 'mars' || p.name === 'Mars')) ||
      (planetId === 'mercury' && (p.id === 'mercury' || p.name === 'Mercury')) ||
      (planetId === 'jupiter' && (p.id === 'jupiter' || p.name === 'Jupiter')) ||
      (planetId === 'venus' && (p.id === 'venus' || p.name === 'Venus')) ||
      (planetId === 'saturn' && (p.id === 'saturn' || p.name === 'Saturn')) ||
      (planetId === 'rahu' && (p.id === 'rahu' || p.name === 'Rahu')) ||
      (planetId === 'ketu' && (p.id === 'ketu' || p.name === 'Ketu'))
    );

    if (!planet || !planet.sign) {
      return [];
    }

    const planetSign = planet.sign;
    const houses = [];

    // Initialize 12 houses starting from planet's sign (planet sign = House 1)
    for (let i = 1; i <= 12; i++) {
      const sign = ((planetSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.planets.forEach(p => {
      if (!p.sign || p.sign < 1 || p.sign > 12) return;
      const house = ephemeris.getHouse(p.sign, planetSign);
      const houseIndex = house - 1;
      const label = p.shortName || p.id || p.name;
      houses[houseIndex].planets.push(label);
    });

    // The reference planet itself is always in house 1 (as the ascendant)
    // Remove planet if it was already added, then add it at the beginning
    const planetLabel = planet.shortName || planet.id || planet.name;
    houses[0].planets = houses[0].planets.filter(p => p !== planetLabel);
    houses[0].planets.unshift(planetLabel);

    if (this.ascendant && this.ascendant.sign) {
      const ascHouse = ephemeris.getHouse(this.ascendant.sign, planetSign);
      const ascHouseIndex = ascHouse - 1;
      const ascLabel = this.ascendant.shortName || this.ascendant.id || this.ascendant.name;
      // Only add if not already in that house (to avoid duplicates)
      if (!houses[ascHouseIndex].planets.includes(ascLabel)) {
        houses[ascHouseIndex].planets.push(ascLabel);
      }
    }

    return houses;
  }

  /**
   * Build Surya Kundali (Sun chart) houses array
   * In Surya Kundali, Sun's sign becomes the ascendant (house 1)
   */
  buildSuryaKundaliHouses() {
    return this.buildPlanetKundaliHouses('sun', 'Surya');
  }

  /**
   * Build Budha Kundali (Mercury chart) houses array
   * In Budha Kundali, Mercury's sign becomes the ascendant (house 1)
   */
  buildBudhaKundaliHouses() {
    return this.buildPlanetKundaliHouses('mercury', 'Budha');
  }

  /**
   * Build Shukra Kundali (Venus chart) houses array
   * In Shukra Kundali, Venus's sign becomes the ascendant (house 1)
   */
  buildShukraKundaliHouses() {
    return this.buildPlanetKundaliHouses('venus', 'Shukra');
  }

  /**
   * Build Mangal Kundali (Mars chart) houses array
   * In Mangal Kundali, Mars's sign becomes the ascendant (house 1)
   */
  buildMangalKundaliHouses() {
    return this.buildPlanetKundaliHouses('mars', 'Mangal');
  }

  /**
   * Build Guru Kundali (Jupiter chart) houses array
   * In Guru Kundali, Jupiter's sign becomes the ascendant (house 1)
   */
  buildGuruKundaliHouses() {
    return this.buildPlanetKundaliHouses('jupiter', 'Guru');
  }

  /**
   * Build Shani Kundali (Saturn chart) houses array
   * In Shani Kundali, Saturn's sign becomes the ascendant (house 1)
   */
  buildShaniKundaliHouses() {
    return this.buildPlanetKundaliHouses('saturn', 'Shani');
  }

  /**
   * Build Rahu Kundali houses array
   * In Rahu Kundali, Rahu's sign becomes the ascendant (house 1)
   */
  buildRahuKundaliHouses() {
    return this.buildPlanetKundaliHouses('rahu', 'Rahu');
  }

  /**
   * Build Ketu Kundali houses array
   * In Ketu Kundali, Ketu's sign becomes the ascendant (house 1)
   */
  buildKetuKundaliHouses() {
    return this.buildPlanetKundaliHouses('ketu', 'Ketu');
  }

  /**
   * Build Hora Kundali (D-2 Wealth chart) houses array (12 houses with planets in each)
   * Hora divides each sign into 2 parts (15 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildHoraKundaliHouses() {
    if (!this.horaChart) {
      return [];
    }

    const horaAscSign = this.horaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Hora ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((horaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.horaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, horaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Drekkana Kundali (D-3 Siblings chart) houses array (12 houses with planets in each)
   * Drekkana divides each sign into 3 parts (10 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildDrekkanaKundaliHouses() {
    if (!this.drekkanaChart) {
      return [];
    }

    const drekkanaAscSign = this.drekkanaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Drekkana ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((drekkanaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.drekkanaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, drekkanaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Chaturthamsa Kundali (D-4 Property chart) houses array (12 houses with planets in each)
   * Chaturthamsa divides each sign into 4 parts (7.5 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildChaturthamsaKundaliHouses() {
    if (!this.chaturthamsaChart) {
      return [];
    }

    const chaturthamsaAscSign = this.chaturthamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Chaturthamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((chaturthamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.chaturthamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, chaturthamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Saptamsa Kundali (D-7 Children chart) houses array (12 houses with planets in each)
   * Saptamsa divides each sign into 7 parts (~4.29 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildSaptamsaKundaliHouses() {
    if (!this.saptamsaChart) {
      return [];
    }

    const saptamsaAscSign = this.saptamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Saptamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((saptamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.saptamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, saptamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Dashamsa Kundali (D-10 Career chart) houses array (12 houses with planets in each)
   * Dashamsa divides each sign into 10 parts (3 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildDashamsaKundaliHouses() {
    if (!this.dashamsaChart) {
      return [];
    }

    const dashamsaAscSign = this.dashamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Dashamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((dashamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.dashamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, dashamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Dwadasamsa Kundali (D-12 Parents chart) houses array (12 houses with planets in each)
   * Each division of a sign is 2°30', and signs in D-12 start from the same sign.
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildDwadasamsaKundaliHouses() {
    if (!this.dwadasamsaChart) {
      return [];
    }

    const dwadasamsaAscSign = this.dwadasamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Dwadasamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((dwadasamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.dwadasamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, dwadasamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Shodasamsa Kundali (D-16 Vehicles chart) houses array (12 houses with planets in each)
   * Shodasamsa divides each sign into 16 parts (~1.875 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildShodasamsaKundaliHouses() {
    if (!this.shodasamsaChart) {
      return [];
    }

    const shodasamsaAscSign = this.shodasamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Shodasamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((shodasamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.shodasamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, shodasamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Vimsamsa Kundali (D-20 Spiritual chart) houses array (12 houses with planets in each)
   * Uses standard divisional mapping (no special movable/fixed/dual rules beyond D-20 sign calc).
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildVimsamsaKundaliHouses() {
    if (!this.vimsamsaChart) {
      return [];
    }

    const vimsamsaAscSign = this.vimsamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Vimsamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((vimsamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.vimsamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, vimsamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Build Chaturvimsamsa Kundali (D-24 Education chart) houses array (12 houses with planets in each)
   * Chaturvimsamsa divides each sign into 24 parts (1.25 degrees each)
   * Each house has:
   * - number: 1-12
   * - sign: sign number (1-12) for that house
   * - planets: array of planet ids in that house
   */
  buildChaturvimsamsaKundaliHouses() {
    if (!this.chaturvimsamsaChart) {
      return [];
    }

    const chaturvimsamsaAscSign = this.chaturvimsamsaChart.ascendantSign;
    const houses = [];

    // Initialize 12 houses starting from Chaturvimsamsa ascendant sign
    for (let i = 1; i <= 12; i++) {
      const sign = ((chaturvimsamsaAscSign + i - 2) % 12) + 1;
      houses.push({
        number: i,
        sign,
        planets: []
      });
    }

    this.chaturvimsamsaChart.planets.forEach(planet => {
      const divSign = planet.divisional && planet.divisional.sign;
      if (!divSign || divSign < 1 || divSign > 12) return;
      const house = ephemeris.getHouse(divSign, chaturvimsamsaAscSign);
      if (planet.divisional) planet.divisional.house = house;
      const houseIndex = house - 1;
      const label = planet.shortName || planet.id || planet.name;
      houses[houseIndex].planets.push(label);
    });

    // Ascendant itself is always in house 1
    houses[0].planets.unshift(this.ascendant.shortName || this.ascendant.id || this.ascendant.name);

    return houses;
  }

  /**
   * Get formatted birth date string - matches Universe.Oooo00O()
   */
  getBirthDateString() {
    return `${this.birthYear}-${this.birthMonth}-${this.birthDay}`;
  }

  /**
   * Get latitude string with direction - matches Universe.getLattitudeOfBirth()
   */
  getLatitudeOfBirth() {
    return `${this.latitude.toFixed(2)}(${this.latitudeDir})`;
  }

  /**
   * Get longitude string with direction - matches Universe.getLongitudeOfBirth()
   */
  getLongitudeOfBirth() {
    return `${this.longitude.toFixed(2)}(${this.longitudeDir})`;
  }

  /**
   * Convert to string - matches Universe.toString()
   */
  toString() {
    return `UniverseLite{ascSign=${this.ascendantSign}, birthyear=${this.birthYear}, birthmonth=${this.birthMonth}, birthday=${this.birthDay}, Hour=${this.birthHour}, Minute=${this.birthMinute}, LattitudeOfBirth='${this.latitude}'${this.latitudeDir}, LongitudeOfBirth='${this.longitude}'${this.longitudeDir}, LatDir='${this.latitudeDir}', LonDir='${this.longitudeDir}', Lat=${this.latitude}, Lon=${this.longitude}, place='${this.place}', country='${this.country}', name='${this.name}', gender='${this.gender}', timezoneString='${this.timezone}'}`;
  }

  /**
   * Get chart data for API response
   * Returns structured data matching the expected API format
   */
  getChartData() {
    const _now = new Date();
    const _nowDecimal = dashaSystems?.dateToDecimalYears
      ? dashaSystems.dateToDecimalYears(_now)
      : null;

    return {
      ascendant: {
        sign: this.ascendantSign,
        degree: this.ascendantDegree,
        longitude: this.ascendantLongitude,
        degreeString: this.ascendant.degreeString,
        nakshatra: this.ascendant.nakshatra,
        nakshatraPada: this.ascendant.nakshatraPada,
        relation: this.ascendant.relation || '-',
        avastha: this.ascendant.avastha || '',
        navamsa: this.ascendant.navamsa ? {
          sign: this.ascendant.navamsa.sign,
          degree: this.ascendant.navamsa.degree,
          house: this.ascendant.navamsa.house
        } : null
      },
      lagna: {
        houses: this.buildLagnaHouses(),
        ascendantSign: this.ascendantSign
      },
      chandra: {
        houses: this.buildChandraKundaliHouses(),
        ascendantSign: this.getMoon() ? this.getMoon().sign : null
      },
      surya: {
        houses: this.buildSuryaKundaliHouses(),
        ascendantSign: this.getSun() ? this.getSun().sign : null
      },
      budha: {
        houses: this.buildBudhaKundaliHouses(),
        ascendantSign: this.getMercury() ? this.getMercury().sign : null
      },
      shukra: {
        houses: this.buildShukraKundaliHouses(),
        ascendantSign: this.getVenus() ? this.getVenus().sign : null
      },
      mangal: {
        houses: this.buildMangalKundaliHouses(),
        ascendantSign: this.getMars() ? this.getMars().sign : null
      },
      guru: {
        houses: this.buildGuruKundaliHouses(),
        ascendantSign: this.getJupiter() ? this.getJupiter().sign : null
      },
      shani: {
        houses: this.buildShaniKundaliHouses(),
        ascendantSign: this.getSaturn() ? this.getSaturn().sign : null
      },
      rahu: {
        houses: this.buildRahuKundaliHouses(),
        ascendantSign: this.getRahu() ? this.getRahu().sign : null
      },
      ketu: {
        houses: this.buildKetuKundaliHouses(),
        ascendantSign: this.getKetu() ? this.getKetu().sign : null
      },
      hora: {
        houses: this.buildHoraKundaliHouses(),
        ascendantSign: this.horaChart ? this.horaChart.ascendantSign : null
      },
      drekkana: {
        houses: this.buildDrekkanaKundaliHouses(),
        ascendantSign: this.drekkanaChart ? this.drekkanaChart.ascendantSign : null
      },
      chaturthamsa: {
        houses: this.buildChaturthamsaKundaliHouses(),
        ascendantSign: this.chaturthamsaChart ? this.chaturthamsaChart.ascendantSign : null
      },
      saptamsa: {
        houses: this.buildSaptamsaKundaliHouses(),
        ascendantSign: this.saptamsaChart ? this.saptamsaChart.ascendantSign : null
      },
      dashamsa: {
        houses: this.buildDashamsaKundaliHouses(),
        ascendantSign: this.dashamsaChart ? this.dashamsaChart.ascendantSign : null
      },
      dwadasamsa: {
        houses: this.buildDwadasamsaKundaliHouses(),
        ascendantSign: this.dwadasamsaChart ? this.dwadasamsaChart.ascendantSign : null
      },
      shodasamsa: {
        houses: this.buildShodasamsaKundaliHouses(),
        ascendantSign: this.shodasamsaChart ? this.shodasamsaChart.ascendantSign : null
      },
      vimsamsa: {
        houses: this.buildVimsamsaKundaliHouses(),
        ascendantSign: this.vimsamsaChart ? this.vimsamsaChart.ascendantSign : null
      },
      chaturvimsamsa: {
        houses: this.buildChaturvimsamsaKundaliHouses(),
        ascendantSign: this.chaturvimsamsaChart ? this.chaturvimsamsaChart.ascendantSign : null
      },
      // Build Navamsa houses before planets map so planet.navamsa.house is synced for the response
      navamsa: this.navamsaChart ? {
        ascendantSign: this.navamsaAscendantSign,
        houses: this.buildNavamsaHouses()
      } : null,
      planets: this.planets.map(p => ({
        id: p.id,
        name: p.name,
        nepaliName: p.nepaliName,
        shortName: p.shortName,
        color: p.color,
        sign: p.sign,
        house: p.house,
        degree: p.degree,
        longitude: p.longitude,
        rawLongitude: p.rawLongitude,
        degreeString: p.degreeString,
        nakshatra: p.nakshatra,
        nakshatraPada: p.nakshatraPada,
        relation: p.relation || '-',
        avastha: p.avastha || '',
        retrograde: p.retrograde,
        navamsa: p.navamsa ? {
          sign: p.navamsa.sign,
          degree: p.navamsa.degree,
          house: p.navamsa.house
        } : null
      })),
      birthDetails: {
        year: this.birthYear,
        month: this.birthMonth,
        day: this.birthDay,
        hour: this.birthHour,
        minute: this.birthMinute,
        latitude: this.latitude,
        latitudeDir: this.latitudeDir,
        longitude: this.longitude,
        longitudeDir: this.longitudeDir,
        place: this.place,
        country: this.country,
        name: this.name,
        gender: this.gender,
        timezone: this.timezone
      },
      dasha: {
        vimshottari: this.currentDashaPeriods ? {
          current: {
            dasha: {
              lord: this.currentDashaPeriods.dasha.lord,
              nepaliName: this.currentDashaPeriods.dasha.nepaliName,
              startDate: this.currentDashaPeriods.dasha.startDate.toISOString(),
              startDateVedic: this.currentDashaPeriods.dasha.startDateVedic || null,
              endDate: this.currentDashaPeriods.dasha.endDate.toISOString(),
              endDateVedic: this.currentDashaPeriods.dasha.endDateVedic || null,
              period: this.currentDashaPeriods.dasha.period
            },
            bhukti: this.currentDashaPeriods.bhukti ? {
              lord: this.currentDashaPeriods.bhukti.lord,
              nepaliName: this.currentDashaPeriods.bhukti.nepaliName,
              startDate: this.currentDashaPeriods.bhukti.startDate.toISOString(),
              startDateVedic: this.currentDashaPeriods.bhukti.startDateVedic || null,
              endDate: this.currentDashaPeriods.bhukti.endDate.toISOString(),
              endDateVedic: this.currentDashaPeriods.bhukti.endDateVedic || null,
              period: this.currentDashaPeriods.bhukti.period
            } : null,
            antara: this.currentDashaPeriods.antara ? {
              lord: this.currentDashaPeriods.antara.lord,
              nepaliName: this.currentDashaPeriods.antara.nepaliName,
              startDate: this.currentDashaPeriods.antara.startDate.toISOString(),
              startDateVedic: this.currentDashaPeriods.antara.startDateVedic || null,
              endDate: this.currentDashaPeriods.antara.endDate.toISOString(),
              endDateVedic: this.currentDashaPeriods.antara.endDateVedic || null,
              period: this.currentDashaPeriods.antara.period
            } : null
          },
          periods: this.vimshottariDashas ? this.vimshottariDashas.map(d => ({
            lord: d.lord,
            nepaliName: d.nepaliName,
            startDate: d.startDate.toISOString(),
            startDateVedic: d.startDateVedic || null,
            endDate: d.endDate.toISOString(),
            endDateVedic: d.endDateVedic || null,
            period: d.period,
            isCurrent: (typeof _nowDecimal === 'number' && typeof d.startDecimal === 'number' && typeof d.endDecimal === 'number')
              ? (_nowDecimal >= d.startDecimal && _nowDecimal < d.endDecimal)
              : (d.isCurrent || false)
          })) : []
        } : null,
        tribhagi: this.currentTribhagiDashaPeriods ? {
          current: {
            dasha: {
              lord: this.currentTribhagiDashaPeriods.dasha.lord,
              nepaliName: this.currentTribhagiDashaPeriods.dasha.nepaliName,
              startDate: this.currentTribhagiDashaPeriods.dasha.startDate.toISOString(),
              startDateVedic: this.currentTribhagiDashaPeriods.dasha.startDateVedic || null,
              endDate: this.currentTribhagiDashaPeriods.dasha.endDate.toISOString(),
              endDateVedic: this.currentTribhagiDashaPeriods.dasha.endDateVedic || null,
              period: this.currentTribhagiDashaPeriods.dasha.period
            },
            bhukti: this.currentTribhagiDashaPeriods.bhukti ? {
              lord: this.currentTribhagiDashaPeriods.bhukti.lord,
              nepaliName: this.currentTribhagiDashaPeriods.bhukti.nepaliName,
              startDate: this.currentTribhagiDashaPeriods.bhukti.startDate.toISOString(),
              startDateVedic: this.currentTribhagiDashaPeriods.bhukti.startDateVedic || null,
              endDate: this.currentTribhagiDashaPeriods.bhukti.endDate.toISOString(),
              endDateVedic: this.currentTribhagiDashaPeriods.bhukti.endDateVedic || null,
              period: this.currentTribhagiDashaPeriods.bhukti.period
            } : null,
            antara: this.currentTribhagiDashaPeriods.antara ? {
              lord: this.currentTribhagiDashaPeriods.antara.lord,
              nepaliName: this.currentTribhagiDashaPeriods.antara.nepaliName,
              startDate: this.currentTribhagiDashaPeriods.antara.startDate.toISOString(),
              startDateVedic: this.currentTribhagiDashaPeriods.antara.startDateVedic || null,
              endDate: this.currentTribhagiDashaPeriods.antara.endDate.toISOString(),
              endDateVedic: this.currentTribhagiDashaPeriods.antara.endDateVedic || null,
              period: this.currentTribhagiDashaPeriods.antara.period
            } : null
          },
          periods: this.tribhagiDashas ? this.tribhagiDashas.map(d => ({
            lord: d.lord,
            nepaliName: d.nepaliName,
            startDate: d.startDate.toISOString(),
            startDateVedic: d.startDateVedic || null,
            endDate: d.endDate.toISOString(),
            endDateVedic: d.endDateVedic || null,
            period: d.period,
            isCurrent: (typeof _nowDecimal === 'number' && typeof d.startDecimal === 'number' && typeof d.endDecimal === 'number')
              ? (_nowDecimal >= d.startDecimal && _nowDecimal < d.endDecimal)
              : (d.isCurrent || false)
          })) : []
        } : null,
        yogini: this.currentYoginiDashaPeriods ? {
          current: {
            dasha: {
              lord: this.currentYoginiDashaPeriods.dasha.lord,
              nepaliName: this.currentYoginiDashaPeriods.dasha.nepaliName,
              startDate: this.currentYoginiDashaPeriods.dasha.startDate.toISOString(),
              startDateVedic: this.currentYoginiDashaPeriods.dasha.startDateVedic || null,
              endDate: this.currentYoginiDashaPeriods.dasha.endDate.toISOString(),
              endDateVedic: this.currentYoginiDashaPeriods.dasha.endDateVedic || null,
              period: this.currentYoginiDashaPeriods.dasha.period
            },
            bhukti: this.currentYoginiDashaPeriods.bhukti ? {
              lord: this.currentYoginiDashaPeriods.bhukti.lord,
              nepaliName: this.currentYoginiDashaPeriods.bhukti.nepaliName,
              startDate: this.currentYoginiDashaPeriods.bhukti.startDate.toISOString(),
              startDateVedic: this.currentYoginiDashaPeriods.bhukti.startDateVedic || null,
              endDate: this.currentYoginiDashaPeriods.bhukti.endDate.toISOString(),
              endDateVedic: this.currentYoginiDashaPeriods.bhukti.endDateVedic || null,
              period: this.currentYoginiDashaPeriods.bhukti.period
            } : null,
            antara: this.currentYoginiDashaPeriods.antara ? {
              lord: this.currentYoginiDashaPeriods.antara.lord,
              nepaliName: this.currentYoginiDashaPeriods.antara.nepaliName,
              startDate: this.currentYoginiDashaPeriods.antara.startDate.toISOString(),
              startDateVedic: this.currentYoginiDashaPeriods.antara.startDateVedic || null,
              endDate: this.currentYoginiDashaPeriods.antara.endDate.toISOString(),
              endDateVedic: this.currentYoginiDashaPeriods.antara.endDateVedic || null,
              period: this.currentYoginiDashaPeriods.antara.period
            } : null
          },
          periods: this.yoginiDashas ? this.yoginiDashas.map(d => ({
            lord: d.lord,
            nepaliName: d.nepaliName,
            startDate: d.startDate.toISOString(),
            startDateVedic: d.startDateVedic || null,
            endDate: d.endDate.toISOString(),
            endDateVedic: d.endDateVedic || null,
            period: d.period,
            isCurrent: (typeof _nowDecimal === 'number' && typeof d.startDecimal === 'number' && typeof d.endDecimal === 'number')
              ? (_nowDecimal >= d.startDecimal && _nowDecimal < d.endDecimal)
              : (d.isCurrent || false)
          })) : []
        } : null
      }
    };
  }

  /**
   * Build Navamsa houses array (12 houses with planets in each)
   */
  buildNavamsaHouses() {
    if (!this.navamsaChart) {
      return [];
    }

    const houses = [];
    const navamsaAscSign = this.navamsaAscendantSign;

    // Initialize 12 houses (North Indian: position 1 = top = ascendant, like myapp_java CutsomNamashKundliView)
    // House i gets sign: (asc + i - 1) mod 12, 1-12
    for (let i = 1; i <= 12; i++) {
      const sign = ((navamsaAscSign + i - 2 + 12) % 12) + 1;
      houses.push({
        number: i,
        sign: sign,
        planets: []
      });
    }

    this.planets.forEach(planet => {
      const ns = planet.navamsa && planet.navamsa.sign;
      if (!ns || ns < 1 || ns > 12) return;
      const house = ephemeris.getHouse(ns, navamsaAscSign);
      if (planet.navamsa) planet.navamsa.house = house;
      const houseIndex = house - 1;
      if (houses[houseIndex]) {
        const label = planet.shortName || planet.id || planet.name;
        houses[houseIndex].planets.push(label);
      }
    });

    // Ascendant is always house 1 in Navamsa (same as Lagna chart)
    const ascLabel = this.ascendant.shortName || this.ascendant.id || this.ascendant.name;
    houses[0].planets = houses[0].planets.filter(p => p !== ascLabel);
    houses[0].planets.unshift(ascLabel);

    return houses;
  }

}

module.exports = UniverseLite;

