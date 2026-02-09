/**
 * MilanService
 *
 * Full Ashtakoot (8 Koota) Kundali Milan - ported from myapp_java (OooO0O0, OooO0OO).
 * Uses same matrices and nakshatra metadata as Java app. No DB used for milan logic.
 * Location for Milan chart: MJ1.db first (match myapp_java), fallback ThauHaru (LocationService).
 * Other features (kundali, gochar, barshafal, etc.) unchanged – they use ThauHaru only.
 */

const KundaliService = require('./KundaliService');
const BirthDetails = require('../models/BirthDetails');
const nakshatra = require('../utils/nakshatra');
const ashtakoot = require('../utils/ashtakoot-data');
const mj1Location = require('../database/mj1-location');
const LocationService = require('./LocationService');
const thauharu = require('../database/thauharu');

const NAKSHATRA_SPAN = 13.333333333333334; // 13°20' for nakshatra index from longitude

const KOOTA_NAMES = {
  varna: { en: 'Varna', ne: 'वर्ण' },
  vashya: { en: 'Vashya', ne: 'वश्य' },
  tara: { en: 'Tara', ne: 'तारा' },
  yoni: { en: 'Yoni', ne: 'योनी' },
  grahaMaitri: { en: 'Graha Maitri', ne: 'ग्रह मैत्री' },
  gana: { en: 'Gana', ne: 'गण' },
  bhakoot: { en: 'Bhakoot', ne: 'भकूट' },
  nadi: { en: 'Nadi', ne: 'नाडी' },
};

// बर/बधु display in Nepali (Devanagari) – match myapp_java exactly
const VARNA_NE = { 1: 'विप्र', 2: 'क्षत्री', 3: 'वैश्य', 4: 'शूद्र' };
const VASHYA_NE = { 1: 'चतुष्पद', 2: 'द्विपद', 3: 'मनुष्य', 4: 'जलचर', 5: 'कीट', 6: 'वनचर' };
const GANA_NE = { 1: 'देव', 2: 'राक्षस', 3: 'नर' };
const NADI_NE = { 1: 'आद्य', 2: 'मध्य', 3: 'अन्त्य' };
const TARA_NE = { 1: 'जन्म', 2: 'सम्पत', 3: 'विपत', 4: 'क्षेम', 5: 'प्रतयरी', 6: 'सधक', 7: 'वध', 8: 'मित्र', 9: 'अतिमित्र' };
const YONI_NE = { 1: 'अश्व', 2: 'गज', 3: 'अज', 4: 'सर्प', 5: 'श्वान', 6: 'मार्जार', 7: 'मूषक', 8: 'गौ', 9: 'महिष', 10: 'व्याघ्र', 11: 'मृग', 12: 'वानर', 13: 'नकूल', 14: 'सिंह' };
const GRAHA_MAITRI_NE = { 1: 'सूर्य', 2: 'चन्द्र', 3: 'मंगल', 4: 'बुध', 5: 'गुरु', 6: 'शुक्र', 7: 'शनि' };
const RASHI_NE = { 1: 'मेष', 2: 'बृष', 3: 'मिथुन', 4: 'कर्कट', 5: 'सिंह', 6: 'कन्या', 7: 'तुला', 8: 'बृश्चिक', 9: 'धनु', 10: 'मकर', 11: 'कुम्भ', 12: 'मीन' };

class MilanService {
  constructor() {
    this.kundaliService = new KundaliService();
    this.locationService = new LocationService();
  }

  /**
   * Resolve location from MJ1.db (for Milan only; matches myapp_java).
   * Returns { city, country } or null if not found.
   */
  _resolveLocationMJ1(cityName, countryName, timezone) {
    mj1Location.init();
    const country = mj1Location.getCountryByNameTimezone(countryName, timezone);
    const city = mj1Location.getCityByName(cityName, countryName);
    if (country && city) return { city, country };
    return null;
  }

  /**
   * Build resolved location from request lat/lon + ThauHaru country (when city lookup fails).
   */
  _resolveLocationFromLatLon(normalized) {
    const lat = normalized.latitude;
    const lon = normalized.longitude;
    if (lat == null || lon == null || typeof lat !== 'number' || typeof lon !== 'number') return null;
    thauharu.init();
    const country = thauharu.getCountryByNameTimezone(normalized.countryName, normalized.timezone);
    if (!country) return null;
    const latAbs = Math.abs(lat);
    const lonAbs = Math.abs(lon);
    const city = {
      cityID: null,
      cityName: normalized.cityName || '',
      country: normalized.countryName || country.name,
      latitude: latAbs,
      latitudeDir: lat >= 0 ? 'N' : 'S',
      longitude: lonAbs,
      longitudeDir: lon >= 0 ? 'E' : 'W',
      state: null
    };
    return { city, country };
  }

  /**
   * Get chart for one person: MJ1 first, then ThauHaru, then request lat/lon if present.
   */
  async _getChartForMilan(birthDetails) {
    const normalized = birthDetails.getNormalized();
    let resolved = null;

    try {
      resolved = this._resolveLocationMJ1(
        normalized.cityName,
        normalized.countryName,
        normalized.timezone
      );
    } catch (_) {
      // MJ1 missing or no Cities/Countries table
    }

    if (!resolved) {
      try {
        this.locationService.init();
        resolved = this.locationService.getLocationData(
          normalized.cityName,
          normalized.countryName,
          normalized.timezone
        );
        // Using ThauHaru instead of MJ1 – GMT/lat-lon may differ from myapp_java, so Ashtakoot can differ
        console.warn(
          'Milan: city/country not in MJ1, using ThauHaru. For same result as myapp_java use same MJ1.db and same city/country.',
          { city: normalized.cityName, country: normalized.countryName }
        );
      } catch (_) {
        // ThauHaru city/country not found – try request lat/lon
        resolved = this._resolveLocationFromLatLon(normalized);
      }
    }

    if (resolved) {
      return this.kundaliService.calculateChartWithResolvedLocation(birthDetails, resolved);
    }
    return this.kundaliService.calculateChart(birthDetails);
  }

  /**
   * Get charts for boy and girl only (for use when Milan points come from external API).
   * @param {BirthDetails} boyDetails
   * @param {BirthDetails} girlDetails
   * @returns {Promise<{ boyChart: Object, girlChart: Object }>}
   */
  async getChartsForCouple(boyDetails, girlDetails) {
    const [boyChart, girlChart] = await Promise.all([
      this._getChartForMilan(boyDetails),
      this._getChartForMilan(girlDetails)
    ]);
    return { boyChart, girlChart };
  }

  /**
   * Calculate full Ashtakoot Kundali Milan (8 kootas, 36 points max)
   * @param {BirthDetails} boyDetails - Boy's birth details
   * @param {BirthDetails} girlDetails - Girl's birth details
   * @returns {Promise<Object>} Milan compatibility data (same structure as myapp_java)
   */
  async calculateMilan(boyDetails, girlDetails) {
    const [boyChart, girlChart] = await Promise.all([
      this._getChartForMilan(boyDetails),
      this._getChartForMilan(girlDetails)
    ]);

    const boyMoon = boyChart.planets.find(p => p.id === 'moon' || p.name === 'Moon');
    const girlMoon = girlChart.planets.find(p => p.id === 'moon' || p.name === 'Moon');

    // Moon sign 1-12 (match Java; coerce so matrix lookups never get 0 or 13)
    const boyMoonSign = boyMoon && boyMoon.sign != null ? Math.min(12, Math.max(1, Math.floor(Number(boyMoon.sign)))) : null;
    const girlMoonSign = girlMoon && girlMoon.sign != null ? Math.min(12, Math.max(1, Math.floor(Number(girlMoon.sign)))) : null;

    // Nakshatra index 0-26: always derive from moon sidereal longitude (match Java / myapp_java)
    // so results match regardless of nakshatra name string; rawLongitude is same source as Java.
    const boyLon = boyMoon && (typeof boyMoon.rawLongitude === 'number' ? boyMoon.rawLongitude : typeof boyMoon.longitude === 'number' ? boyMoon.longitude : null);
    const girlLon = girlMoon && (typeof girlMoon.rawLongitude === 'number' ? girlMoon.rawLongitude : typeof girlMoon.longitude === 'number' ? girlMoon.longitude : null);
    let boyNakIndex = -1;
    let girlNakIndex = -1;
    if (boyLon != null) {
      const lon = ((boyLon % 360) + 360) % 360;
      boyNakIndex = Math.min(26, Math.max(0, Math.floor(lon / NAKSHATRA_SPAN)));
    } else if (boyMoon && boyMoon.nakshatra != null) {
      boyNakIndex = nakshatra.getNakshatraIndex(boyMoon.nakshatra);
    }
    if (girlLon != null) {
      const lon = ((girlLon % 360) + 360) % 360;
      girlNakIndex = Math.min(26, Math.max(0, Math.floor(lon / NAKSHATRA_SPAN)));
    } else if (girlMoon && girlMoon.nakshatra != null) {
      girlNakIndex = nakshatra.getNakshatraIndex(girlMoon.nakshatra);
    }

    if (boyNakIndex < 0 || girlNakIndex < 0 || !boyMoonSign || !girlMoonSign) {
      return this._fallbackMilan(boyChart, girlChart, boyMoonSign, girlMoonSign);
    }

    const boyNak1 = boyNakIndex + 1;
    const girlNak1 = girlNakIndex + 1;
    const boyData = ashtakoot.getNakshatraMilan(boyNakIndex);
    const girlData = ashtakoot.getNakshatraMilan(girlNakIndex);

    const kootas = [];
    let totalObtained = 0;

    // 1. Varna (1 pt max). From Moon sign (rasi) per Saravali: Brahmin=Water, Kshatriya=Fire, Vaishya=Air, Shudra=Earth. [girl-1][boy-1]
    const boyVarna = ashtakoot.signToVarna(boyMoonSign);
    const girlVarna = ashtakoot.signToVarna(girlMoonSign);
    const varnaPoints = ashtakoot.safeMatrixGet(
      ashtakoot.VARNA_MATRIX,
      girlVarna - 1,
      boyVarna - 1,
      0
    );
    kootas.push(this._kootaRow('varna', varnaPoints, ashtakoot.MAX_POINTS.varna, boyVarna, girlVarna));
    totalObtained += varnaPoints;

    // 2. Vashya (2 pt max). Java: OooO0OO(boyVashya, girlVashya) -> [boy-1][girl-1]
    const vb = Math.min(6, Math.max(1, boyData.vashya));
    const vg = Math.min(6, Math.max(1, girlData.vashya));
    const vashyaPoints = ashtakoot.safeMatrixGet(ashtakoot.VASHYA_MATRIX, vb - 1, vg - 1, 0);
    kootas.push(this._kootaRow('vashya', vashyaPoints, ashtakoot.MAX_POINTS.vashya, vb, vg));
    totalObtained += vashyaPoints;

    // 3. Tara (3 pt max). 9 tara groups from 27 nakshatras
    const boyTara = ashtakoot.getTaraGroup(boyNak1);
    const girlTara = ashtakoot.getTaraGroup(girlNak1);
    const taraPoints = ashtakoot.safeMatrixGet(ashtakoot.TARA_MATRIX, girlTara - 1, boyTara - 1, 0);
    kootas.push(this._kootaRow('tara', taraPoints, ashtakoot.MAX_POINTS.tara, boyTara, girlTara));
    totalObtained += taraPoints;

    // 4. Yoni (4 pt max). Standard: row = bride, col = groom -> [girl-1][boy-1]
    const yb = Math.min(14, Math.max(1, boyData.yoni));
    const yg = Math.min(14, Math.max(1, girlData.yoni));
    const yoniPoints = ashtakoot.safeMatrixGet(ashtakoot.YONI_MATRIX_14, yg - 1, yb - 1, 0);
    kootas.push(this._kootaRow('yoni', yoniPoints, ashtakoot.MAX_POINTS.yoni, yb, yg));
    totalObtained += yoniPoints;

    // 5. Graha Maitri (5 pt max). Moon sign -> ruler 1-7, 7x7 matrix
    const boyRuler = ashtakoot.signToRuler(boyMoonSign);
    const girlRuler = ashtakoot.signToRuler(girlMoonSign);
    const grahaPoints = ashtakoot.safeMatrixGet(ashtakoot.GRAHA_MAITRI_MATRIX, girlRuler - 1, boyRuler - 1, 0);
    kootas.push(this._kootaRow('grahaMaitri', grahaPoints, ashtakoot.MAX_POINTS.grahaMaitri, boyMoonSign, girlMoonSign));
    totalObtained += grahaPoints;

    // 6. Gana (6 pt max). 3x3; 0 = severe (Rakshasa vs Deva)
    const ganaPoints = ashtakoot.safeMatrixGet(ashtakoot.GANA_MATRIX, girlData.gana - 1, boyData.gana - 1, 0);
    kootas.push(this._kootaRow('gana', ganaPoints, ashtakoot.MAX_POINTS.gana, boyData.gana, girlData.gana));
    totalObtained += ganaPoints;

    // 7. Bhakoot (7 pt max). Moon sign 1-12, 12x12
    const bhakootPoints = ashtakoot.safeMatrixGet(ashtakoot.BHAKOOT_MATRIX, girlMoonSign - 1, boyMoonSign - 1, 0);
    kootas.push(this._kootaRow('bhakoot', bhakootPoints, ashtakoot.MAX_POINTS.bhakoot, boyMoonSign, girlMoonSign));
    totalObtained += bhakootPoints;

    // 8. Nadi (8 pt max). 3x3; same nadi = 0 (inauspicious)
    const nadiPoints = ashtakoot.safeMatrixGet(ashtakoot.NADI_MATRIX, girlData.nadi - 1, boyData.nadi - 1, 0);
    kootas.push(this._kootaRow('nadi', nadiPoints, ashtakoot.MAX_POINTS.nadi, boyData.nadi, girlData.nadi));
    totalObtained += nadiPoints;

    // Total = (sum of obtained points) / 36. Each koot has fixed max (1,2,3,4,5,6,7,8).
    // Independent scoring per koot; do not use cumulative/progressive max.
    const totalFromKootas = kootas.reduce((sum, k) => sum + (k.points_obtained || 0), 0);
    const totalPoints = Math.round(totalFromKootas * 10) / 10;
    const status = totalPoints >= 24 ? 'good' : totalPoints >= 18 ? 'average' : 'weak';

    // Optional: log computed inputs for comparing with real app (set MILAN_DEBUG=1)
    if (process.env.MILAN_DEBUG === '1') {
      console.log('Milan debug:', {
        boy: { moonSign: boyMoonSign, nakshatraIndex: boyNakIndex, varna: boyVarna, vashya: vb, tara: boyTara, yoni: yb, gana: boyData.gana, nadi: boyData.nadi },
        girl: { moonSign: girlMoonSign, nakshatraIndex: girlNakIndex, varna: girlVarna, vashya: vg, tara: girlTara, yoni: yg, gana: girlData.gana, nadi: girlData.nadi },
      });
    }

    return {
      total_points_obtained: totalPoints,
      total_points_max: ashtakoot.MAX_POINTS.total,
      kootas,
      boy_charts: {
        lagna: boyChart.charts.lagna,
        navamsa: boyChart.charts.navamsa || { houses: [] },
        moon: boyChart.charts.chandra || { houses: [] },
      },
      girl_charts: {
        lagna: girlChart.charts.lagna,
        navamsa: girlChart.charts.navamsa || { houses: [] },
        moon: girlChart.charts.chandra || { houses: [] },
      },
      texts: {
        overall_summary_html: `<p>Ashtakoot Milan: ${totalPoints} / ${ashtakoot.MAX_POINTS.total} (${status})</p>`,
        detailed_report_html: '<p>वर्ण, वश्य, तारा, योनी, ग्रह मैत्री, गण, भकूट र नाडी मिलान (myapp_java जस्तै)।</p>',
      },
      raw_engine_data: {
        boyMoonSign,
        girlMoonSign,
        boyNakshatraIndex: boyNakIndex,
        girlNakshatraIndex: girlNakIndex,
      },
    };
  }

  _formatKootaDisplay(key, boyVal, girlVal) {
    const b = boyVal != null ? Number(boyVal) : null;
    const g = girlVal != null ? Number(girlVal) : null;
    let boyStr = '-';
    let girlStr = '-';
    if (key === 'varna') {
      boyStr = b != null && VARNA_NE[b] ? VARNA_NE[b] : (b != null ? String(boyVal) : '-');
      girlStr = g != null && VARNA_NE[g] ? VARNA_NE[g] : (g != null ? String(girlVal) : '-');
    } else if (key === 'vashya') {
      boyStr = b != null && VASHYA_NE[b] ? VASHYA_NE[b] : (b != null ? String(boyVal) : '-');
      girlStr = g != null && VASHYA_NE[g] ? VASHYA_NE[g] : (g != null ? String(girlVal) : '-');
    } else if (key === 'tara') {
      boyStr = b != null && TARA_NE[b] ? TARA_NE[b] : (b != null ? String(boyVal) : '-');
      girlStr = g != null && TARA_NE[g] ? TARA_NE[g] : (g != null ? String(girlVal) : '-');
    } else if (key === 'yoni') {
      boyStr = b != null && YONI_NE[b] ? YONI_NE[b] : (b != null ? String(boyVal) : '-');
      girlStr = g != null && YONI_NE[g] ? YONI_NE[g] : (g != null ? String(girlVal) : '-');
    } else if (key === 'gana') {
      boyStr = b != null && GANA_NE[b] ? GANA_NE[b] : (b != null ? String(boyVal) : '-');
      girlStr = g != null && GANA_NE[g] ? GANA_NE[g] : (g != null ? String(girlVal) : '-');
    } else if (key === 'nadi') {
      boyStr = b != null && NADI_NE[b] ? NADI_NE[b] : (b != null ? String(boyVal) : '-');
      girlStr = g != null && NADI_NE[g] ? NADI_NE[g] : (g != null ? String(girlVal) : '-');
    } else if (key === 'grahaMaitri') {
      if (b >= 1 && b <= 12) { const r = ashtakoot.signToRuler(b); boyStr = GRAHA_MAITRI_NE[r] || String(b); }
      if (g >= 1 && g <= 12) { const r = ashtakoot.signToRuler(g); girlStr = GRAHA_MAITRI_NE[r] || String(g); }
    } else if (key === 'bhakoot') {
      if (b >= 1 && b <= 12) boyStr = RASHI_NE[b];
      if (g >= 1 && g <= 12) girlStr = RASHI_NE[g];
    }
    return { boy_value: boyStr, girl_value: girlStr };
  }

  _kootaRow(key, pointsObtained, maxPoints, boyVal, girlVal) {
    const name = KOOTA_NAMES[key] ? KOOTA_NAMES[key].en : key;
    const status = pointsObtained >= maxPoints * 0.5 ? 'good' : pointsObtained > 0 ? 'average' : 'weak';
    const { boy_value: boyStr, girl_value: girlStr } = this._formatKootaDisplay(key, boyVal, girlVal);
    return {
      name,
      name_ne: KOOTA_NAMES[key] ? KOOTA_NAMES[key].ne : key,
      max_points: maxPoints,
      points_obtained: typeof pointsObtained === 'number' ? Math.round(pointsObtained * 10) / 10 : 0,
      status,
      explanation: `${name}: ${pointsObtained} / ${maxPoints}`,
      boy_value: boyStr,
      girl_value: girlStr,
    };
  }

  _fallbackMilan(boyChart, girlChart, boyMoonSign, girlMoonSign) {
    const score = this._calculateMoonSignCompatibility(boyMoonSign, girlMoonSign);
    return {
      total_points_obtained: score.points,
      total_points_max: 36,
      kootas: [
        {
          name: 'Moon Sign Distance',
          name_ne: 'चन्द्र राशि',
          max_points: 36,
          points_obtained: score.points,
          status: score.status,
          explanation: 'Approximate (nakshatra not available). Enter full birth details for full Ashtakoot.',
          boy_value: boyMoonSign != null && RASHI_NE[boyMoonSign] ? RASHI_NE[boyMoonSign] : (boyMoonSign != null ? String(boyMoonSign) : '-'),
          girl_value: girlMoonSign != null && RASHI_NE[girlMoonSign] ? RASHI_NE[girlMoonSign] : (girlMoonSign != null ? String(girlMoonSign) : '-'),
        },
      ],
      boy_charts: {
        lagna: boyChart.charts.lagna,
        navamsa: boyChart.charts.navamsa || { houses: [] },
        moon: boyChart.charts.chandra || { houses: [] },
      },
      girl_charts: {
        lagna: girlChart.charts.lagna,
        navamsa: girlChart.charts.navamsa || { houses: [] },
        moon: girlChart.charts.chandra || { houses: [] },
      },
      texts: {
        overall_summary_html: `<p>Approximate Milan: ${score.points.toFixed(1)} / 36</p>`,
        detailed_report_html: '<p>कृपया दुवै जन्म विवरण (मिति, समय, ठाउँ) दिनुहोस् र पुन: प्रयास गर्नुहोस्।</p>',
      },
      raw_engine_data: { boyMoonSign, girlMoonSign },
    };
  }

  _calculateMoonSignCompatibility(boyMoonSign, girlMoonSign) {
    if (!boyMoonSign || !girlMoonSign) return { points: 0, status: 'weak' };
    const diff = (Math.abs(boyMoonSign - girlMoonSign) % 12) || 0;
    let score = 36 - diff * 2;
    if (score < 0) score = 0;
    const status = score >= 24 ? 'good' : score >= 18 ? 'average' : 'weak';
    return { points: Number(score.toFixed(1)), status };
  }
}

module.exports = MilanService;


