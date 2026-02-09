/**
 * Enhanced Kundali Service
 * 
 * Comprehensive service with all Jagannatha Hora features:
 * - All divisional charts
 * - All dasha systems
 * - Predictions
 * - 100% accurate calculations using Swiss Ephemeris
 */

const ephemeris = require('../utils/ephemeris');
const navamsa = require('../utils/navamsa');
const divisionalCharts = require('../utils/divisional-charts');
const dashaSystems = require('../utils/dasha-systems');
const nakshatra = require('../utils/nakshatra');
const mj1Db = require('../database/mj1');

class EnhancedKundaliService {
  /**
   * Calculate complete kundali with all features
   * 
   * @param {Object} birthDetails - Birth details
   * @returns {Promise<Object>} Complete kundali data
   */
  async calculateCompleteKundali(birthDetails, isBalanced = true) {
    const normalized = birthDetails.getNormalized();
    
    // Calculate Julian Day
    const jdUt = ephemeris.calculateJulianDay(
      normalized.year,
      normalized.month,
      normalized.day,
      normalized.hour,
      normalized.minute
    );
    
    // Get ayanamsa (Lahiri)
    const ayanamsa = ephemeris.getAyanamsa(jdUt);
    
    // Calculate ascendant
    const ascendant = ephemeris.calculateAscendant(
      jdUt,
      normalized.latitude,
      normalized.longitude,
      ayanamsa
    );
    
    // Calculate all planets
    const planetIds = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
    const planets = await Promise.all(
      planetIds.map(planetId => 
        ephemeris.calculatePlanet(jdUt, planetId, ayanamsa, ascendant.sign)
      )
    );
    
    // Add planet names
    const planetNames = {
      sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury',
      jupiter: 'Jupiter', venus: 'Venus', saturn: 'Saturn',
      rahu: 'Rahu', ketu: 'Ketu'
    };
    
    const planetsWithNames = planets.map((planet, index) => ({
      ...planet,
      id: planetIds[index],
      name: planetNames[planetIds[index]]
    }));
    
    // Calculate houses
    const houses = await ephemeris.calculateHouses(
      jdUt,
      normalized.latitude,
      normalized.longitude,
      ayanamsa
    );
    
    // Calculate Navamsa (D-9)
    const navamsaChart = navamsa.calculateNavamsaChart(planetsWithNames, ascendant);
    
    // Calculate all divisional charts
    const allDivisionalCharts = divisionalCharts.calculateAllDivisionalCharts(
      planetsWithNames,
      ascendant
    );
    
    // Get Moon for dasha calculations
    const moon = planetsWithNames.find(p => p.id === 'moon');
    
    // Use full birth datetime (with time) for accurate dasha start
    const birthDateTime = new Date(
      normalized.year,
      normalized.month - 1,
      normalized.day,
      normalized.hour || 0,
      normalized.minute || 0
    );
    
    // Calculate Vimshottari Dasha (विम्शोत्तरी दशा)
    const vimshottariDashas = dashaSystems.calculateVimshottariDasha(
      moon.longitude,
      birthDateTime,
      120,
      isBalanced
    );
    
    // Get current dasha periods
    const currentDate = new Date();
    const currentDashaPeriods = dashaSystems.getCurrentDashaPeriods(
      vimshottariDashas,
      currentDate
    );
    
    // Calculate Tribhagi Dasha (त्रिकाल दशा)
    const tribhagiDashas = dashaSystems.calculateTribhagiDasha(
      moon.longitude,
      birthDateTime,
      80,
      isBalanced
    );
    const currentTribhagiPeriods = dashaSystems.getCurrentTribhagiDashaPeriods(
      tribhagiDashas,
      currentDate
    );
    
    // Calculate Yogini Dasha (योगिनी दशा) — span 120 years to match Java app (~26 periods, 3+ cycles of 8)
    const yoginiDashas = dashaSystems.calculateYoginiDasha(
      moon.longitude,
      birthDateTime,
      120,
      isBalanced
    );
    const currentYoginiPeriods = dashaSystems.getCurrentYoginiDashaPeriods(
      yoginiDashas,
      currentDate
    );
    
    // Get nakshatra information
    const moonNakshatra = nakshatra.getNakshatra(moon.longitude);
    
    // Organize planets by house for Lagna chart
    const planetsByHouse = {};
    planetsWithNames.forEach(planet => {
      if (!planetsByHouse[planet.house]) {
        planetsByHouse[planet.house] = [];
      }
      planetsByHouse[planet.house].push(planet.name);
    });
    
    // Get house signs
    const houseSigns = houses.houses.map(h => {
      const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      return signNames[h.sign - 1];
    });
    
    return {
      // Basic chart data
      lagna: {
        ascendant: {
          sign: ascendant.sign,
          signName: this.getSignName(ascendant.sign),
          degree: ascendant.degree,
          longitude: ascendant.longitude
        },
        houses: houseSigns,
        planets: planetsWithNames,
        planetsByHouse: planetsByHouse,
        houses: houses.houses
      },
      
      // Divisional charts
      divisionalCharts: {
        navamsa: allDivisionalCharts.navamsa,
        dashamsa: allDivisionalCharts.dashamsa,
        dwadasamsa: allDivisionalCharts.dwadasamsa,
        hora: allDivisionalCharts.hora,
        drekkana: allDivisionalCharts.drekkana,
        chaturthamsa: allDivisionalCharts.chaturthamsa,
        saptamsa: allDivisionalCharts.saptamsa,
        shodasamsa: allDivisionalCharts.shodasamsa,
        vimsamsa: allDivisionalCharts.vimsamsa,
        chaturvimsamsa: allDivisionalCharts.chaturvimsamsa,
        saptavimsamsa: allDivisionalCharts.saptavimsamsa,
        trimsamsa: allDivisionalCharts.trimsamsa,
        khavedamsa: allDivisionalCharts.khavedamsa,
        akshavedamsa: allDivisionalCharts.akshavedamsa,
        shastiamsa: allDivisionalCharts.shastiamsa
      },
      
      // Dasha systems (विम्शोत्तरी, त्रिकाल, योगिनी)
      dashas: {
        vimshottari: {
          all: vimshottariDashas,
          current: currentDashaPeriods
        },
        tribhagi: {
          all: tribhagiDashas,
          current: currentTribhagiPeriods
        },
        yogini: {
          all: yoginiDashas,
          current: currentYoginiPeriods
        }
      },
      
      // Nakshatra information
      nakshatra: {
        moon: moonNakshatra,
        all: planetsWithNames.map(planet => ({
          planet: planet.name,
          nakshatra: nakshatra.getNakshatra(planet.longitude)
        }))
      },
      
      // Birth details
      birthDetails: {
        date: `${normalized.year}-${String(normalized.month).padStart(2, '0')}-${String(normalized.day).padStart(2, '0')}`,
        time: `${String(normalized.hour).padStart(2, '0')}:${String(normalized.minute).padStart(2, '0')}`,
        location: {
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          city: normalized.cityName,
          country: normalized.countryName
        }
      },
      
      // Calculation metadata
      metadata: {
        ayanamsa: ayanamsa,
        ayanamsaSystem: 'Lahiri',
        julianDay: jdUt,
        houseSystem: 'Placidus'
      },
      
      // Summary
      summary: {
        ascendantSign: this.getSignName(ascendant.sign),
        moonSign: this.getSignName(moon.sign),
        moonNakshatra: moonNakshatra.name,
        currentDasha: currentDashaPeriods.dasha?.lord,
        currentBhukti: currentDashaPeriods.bhukti?.lord
      }
    };
  }
  
  /**
   * Get house number (1-12) from planet longitude using Placidus house cusps.
   * Use this for prediction lookup so we match DB expectations (Placidus-based house).
   */
  getHouseFromCusps(planetLongitude, housesArray) {
    if (!housesArray || housesArray.length < 12) return null;
    const sorted = housesArray.slice().sort((a, b) => (a.number || a) - (b.number || b));
    let lon = Number(planetLongitude);
    while (lon < 0) lon += 360;
    while (lon >= 360) lon -= 360;
    for (let i = 0; i < 12; i++) {
      const cuspStart = sorted[i].longitude;
      const cuspEnd = sorted[(i + 1) % 12].longitude;
      const inHouse = cuspEnd > cuspStart
        ? (lon >= cuspStart && lon < cuspEnd)
        : (lon >= cuspStart || lon < cuspEnd);
      if (inHouse) return sorted[i].number;
    }
    return sorted[0].number;
  }

  /**
   * Get sign name from number
   */
  getSignName(signNumber) {
    const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                       'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signNames[signNumber - 1] || 'Unknown';
  }

  /**
   * Get जातक विवरण (Jaatak Details) - native details with house-wise predictions
   * Matches Java JaatakDetails fragment: name, DOB, age, TOB, place, panchanga, planet table, house predictions, शुभ/अशुभ
   * When kundaliChart (UniverseLite) is provided, uses its planets/houses so ग्रह स्थिति and घर अनुसार ग्रह विवरण match.
   *
   * @param {Object} birthDetails - Birth details (name, gender, date_ad, time, location with lat/lon)
   * @param {Object|null} kundaliChart - Optional chart from KundaliService (same as /kundali) so houses match
   * @returns {Promise<Object>} Jaatak details
   */
  async getJaatakDetails(birthDetails, kundaliChart = null) {
    const normalized = birthDetails.getNormalized();
    const g = (normalized.gender && String(normalized.gender).trim()) || '';
    const genderNepali = (g === 'महिला' || g === 'महीला' || g.toLowerCase() === 'female')
      ? 'महिला'
      : 'पुरुष';

    const planetIdToNepali = {
      sun: 'सूर्य', moon: 'चन्द्र', mars: 'मंगल', mercury: 'बुध',
      jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु'
    };
    const getPlanetDisplayName = (p) => planetIdToNepali[p.id] || p.name;

    let planets;
    let ascendantSign;
    let dob;
    let tob;
    let panchangaNakshatra = '';
    let panchangaPada = null;

    if (kundaliChart && kundaliChart.planets && kundaliChart.planets.length > 0 && kundaliChart.ascendant) {
      // Use Kundali (UniverseLite) chart so ग्रह स्थिति and घर अनुसार ग्रह विवरण use the same houses
      planets = kundaliChart.planets;
      ascendantSign = kundaliChart.ascendant.sign;
      const bd = kundaliChart.birthDetails || {};
      dob = [bd.year, bd.month, bd.day].filter(v => v != null).join('-') || normalized.year + '-' + normalized.month + '-' + normalized.day;
      tob = (bd.hour != null && bd.minute != null) ? `${String(bd.hour).padStart(2, '0')}:${String(bd.minute).padStart(2, '0')}` : (normalized.hour + ':' + normalized.minute);
      const moonPlanet = planets.find(p => p.id === 'moon' || p.name === 'Moon');
      if (moonPlanet) {
        panchangaNakshatra = moonPlanet.nakshatra || '';
        panchangaPada = moonPlanet.nakshatraPada;
      }
    } else {
      const chartData = await this.calculateCompleteKundali(birthDetails, true);
      planets = chartData.lagna.planets;
      ascendantSign = chartData.lagna.ascendant.sign;
      dob = chartData.birthDetails.date;
      tob = chartData.birthDetails.time;
      panchangaNakshatra = chartData.nakshatra.moon?.name || '';
      panchangaPada = chartData.nakshatra.moon?.pada;
    }

    // House-wise predictions: use house from the SAME chart as ग्रह स्थिति (Kundali when provided)
    const houseWisePredictions = [];
    for (const planet of planets) {
      const planetId = mj1Db.getPlanetID(planet.id);
      if (!planetId) continue;
      const houseForLookup = planet.house;
      if (!houseForLookup) continue;
      const prediction = mj1Db.getHousePrediction(houseForLookup, planetId, genderNepali);
      houseWisePredictions.push({
        planet: getPlanetDisplayName(planet),
        planetId: planet.id,
        house: houseForLookup,
        sign: this.getSignName(planet.sign),
        nakshatra: planet.nakshatra || '',
        prediction: prediction || ''
      });
    }

    let subhaAsubha = '';
    try {
      subhaAsubha = mj1Db.getSubhaAsubhaPredictionByAsc(ascendantSign) || '';
    } catch (_) {
      subhaAsubha = '';
    }

    return {
      name: normalized.name || '',
      gender: normalized.gender || '',
      dob,
      tob,
      place: normalized.cityName && normalized.countryName
        ? `${normalized.cityName}, ${normalized.countryName}`
        : '',
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      timezone: normalized.timezone || '',
      panchanga: {
        nakshatra: panchangaNakshatra,
        nakshatraPada: panchangaPada,
        thithi: '',
        yoga: '',
        karana: ''
      },
      ascendantSign,
      ascendantSignName: this.getSignName(ascendantSign),
      planets: planets.map(p => ({
        name: getPlanetDisplayName(p),
        sign: this.getSignName(p.sign),
        house: p.house,
        degree: p.degree,
        nakshatra: p.nakshatra || ''
      })),
      houseWisePredictions,
      subhaAsubha,
      chart: kundaliChart ? { lagna: { planets, ascendant: { sign: ascendantSign } } } : undefined
    };
  }
}

module.exports = EnhancedKundaliService;


