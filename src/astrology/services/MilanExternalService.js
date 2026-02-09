/**
 * MilanExternalService
 *
 * Optional: Use a third-party Ashtakoot Milan API instead of built-in calculation.
 * When MILAN_USE_EXTERNAL_API=freeastrologyapi and FREE_ASTROLOGY_API_KEY are set,
 * this service is used. Request/response are mapped to match our existing Milan format
 * so the Flutter app needs no changes.
 *
 * Free Astrology API: https://freeastrologyapi.com/api-reference/ashtakoot-score
 * POST https://json.freeastrologyapi.com/match-making/ashtakoot-score
 * Header: x-api-key
 */

const axios = require('axios');
const MilanService = require('./MilanService');
const LocationService = require('./LocationService');

const FREE_ASTROLOGY_API_URL = 'https://json.freeastrologyapi.com/match-making/ashtakoot-score';

// Map IANA timezone (or string) to numeric offset for Free API. Default 5.5 for all.
const TZ_OFFSET = {
  'Asia/Kathmandu': 5.5,
  'Asia/Kolkata': 5.5,
  'Asia/Calcutta': 5.5,
  'IST': 5.5,
  'Asia/Dhaka': 5.5,
  'Asia/Karachi': 5.5,
  'Asia/Colombo': 5.5,
  'Asia/Dubai': 5.5,
  'Asia/Singapore': 5.5,
  'Asia/Tokyo': 5.5,
  'America/New_York': 5.5,
  'America/Los_Angeles': 5.5,
  'Europe/London': 5.5,
  'UTC': 5.5,
};

const KOOTA_ORDER = [
  'varna_kootam',
  'vasya_kootam',
  'tara_kootam',
  'yoni_kootam',
  'graha_maitri_kootam',
  'gana_kootam',
  'rasi_kootam',
  'nadi_kootam',
];

const KOOTA_NAMES = {
  varna_kootam: { en: 'Varna', ne: 'वर्ण' },
  vasya_kootam: { en: 'Vashya', ne: 'वश्य' },
  tara_kootam: { en: 'Tara', ne: 'तारा' },
  yoni_kootam: { en: 'Yoni', ne: 'योनी' },
  graha_maitri_kootam: { en: 'Graha Maitri', ne: 'ग्रह मैत्री' },
  gana_kootam: { en: 'Gana', ne: 'गण' },
  rasi_kootam: { en: 'Bhakoot', ne: 'भकूट' },
  nadi_kootam: { en: 'Nadi', ne: 'नाडी' },
};

function timezoneToOffset(tz) {
  // Always use 5.5 for all timezones
  return 5.5;
}

/**
 * Build person payload for external API. Use countryGmt when available so offset
 * matches built-in Milan (same DB source); otherwise fallback to timezoneToOffset.
 */
function toExternalPerson(normalized, countryGmt) {
  // Always use 5.5 for timezone regardless of country GMT
  const tz = 5.5;
  const lat = normalized.latitude != null && typeof normalized.latitude === 'number'
    ? normalized.latitude
    : 0;
  const lon = normalized.longitude != null && typeof normalized.longitude === 'number'
    ? normalized.longitude
    : 0;
  return {
    year: normalized.year,
    month: normalized.month,
    date: normalized.day,
    hours: normalized.hour ?? 0,
    minutes: normalized.minute ?? 0,
    seconds: 0,
    latitude: lat,
    longitude: lon,
    timezone: tz,
  };
}

class MilanExternalService {
  constructor() {
    this.milanService = new MilanService();
    this.locationService = new LocationService();
  }

  /**
   * Resolve location: lat/lon from city, and country (for GMT). Uses same DB as built-in Milan
   * so external API gets same timezone offset and birth moment for accurate Ashtakoot.
   * @param {Object} normalized - getNormalized() result
   * @returns {{ normalized: Object, country: Object|null }} normalized with lat/lon if resolved; country with .gmt when found
   */
  _resolveLocation(normalized) {
    let out = normalized;
    let country = null;
    try {
      this.locationService.init();
      const { city, country: c } = this.locationService.getLocationData(
        normalized.cityName,
        normalized.countryName,
        normalized.timezone
      );
      country = c || null;
      if (city && city.latitude != null && city.longitude != null) {
        const latSign = (city.latitudeDir === 'S') ? -1 : 1;
        const lonSign = (city.longitudeDir === 'W') ? -1 : 1;
        out = {
          ...normalized,
          latitude: latSign * (typeof city.latitude === 'number' ? city.latitude : parseFloat(city.latitude)),
          longitude: lonSign * (typeof city.longitude === 'number' ? city.longitude : parseFloat(city.longitude)),
        };
      }
    } catch (_) {
      // ignore
    }
    return { normalized: out, country };
  }

  /**
   * Call Free Astrology API and map response to our Milan format.
   * Resolves lat/lon from city/country if not provided.
   * @param {BirthDetails} boyDetails
   * @param {BirthDetails} girlDetails
   * @param {string} apiKey
   * @returns {Promise<Object>} Same shape as MilanService.calculateMilan
   */
  async calculateMilan(boyDetails, girlDetails, apiKey) {
    let boyNorm = boyDetails.getNormalized();
    let girlNorm = girlDetails.getNormalized();
    const boyRes = this._resolveLocation(boyNorm);
    const girlRes = this._resolveLocation(girlNorm);
    boyNorm = boyRes.normalized;
    girlNorm = girlRes.normalized;
    // Use country GMT (same as built-in Milan) so external API gets correct birth moment
    const male = toExternalPerson(boyNorm, boyRes.country && boyRes.country.gmt != null ? boyRes.country.gmt : null);
    const female = toExternalPerson(girlNorm, girlRes.country && girlRes.country.gmt != null ? girlRes.country.gmt : null);

    if (male.latitude === 0 && male.longitude === 0) {
      throw new Error('Boy birth location must include latitude/longitude or a city that can be resolved for external Milan API.');
    }
    if (female.latitude === 0 && female.longitude === 0) {
      throw new Error('Girl birth location must include latitude/longitude or a city that can be resolved for external Milan API.');
    }

    // Payload format matches Free Astrology API: male and female objects
    const payload = {
      male,
      female,
      config: {
        observation_point: 'topocentric',
        language: 'en',
        ayanamsha: 'lahiri',
      },
    };

    const response = await axios.post(FREE_ASTROLOGY_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      timeout: 15000,
    });

    const data = response.data;
    const output = data && data.output ? data.output : data;
    if (!output || typeof output.total_score !== 'number') {
      throw new Error('External Milan API returned unexpected response.');
    }

    const kootas = this._mapKootas(output);
    const totalPoints = Number(output.total_score);
    const totalMax = output.out_of ?? 36;
    const status = totalPoints >= 24 ? 'good' : totalPoints >= 18 ? 'average' : 'weak';

    // Get charts from our own service so UI still shows Lagna/Navamsa/Moon charts
    let boyCharts = { lagna: { houses: [] }, navamsa: { houses: [] }, moon: { houses: [] } };
    let girlCharts = { lagna: { houses: [] }, navamsa: { houses: [] }, moon: { houses: [] } };
    try {
      const charts = await this.milanService.getChartsForCouple(boyDetails, girlDetails);
      if (charts.boyChart && charts.boyChart.charts) {
        boyCharts = {
          lagna: charts.boyChart.charts.lagna || boyCharts.lagna,
          navamsa: charts.boyChart.charts.navamsa || boyCharts.navamsa,
          moon: charts.boyChart.charts.chandra || charts.boyChart.charts.moon || boyCharts.moon,
        };
      }
      if (charts.girlChart && charts.girlChart.charts) {
        girlCharts = {
          lagna: charts.girlChart.charts.lagna || girlCharts.lagna,
          navamsa: charts.girlChart.charts.navamsa || girlCharts.navamsa,
          moon: charts.girlChart.charts.chandra || charts.girlChart.charts.moon || girlCharts.moon,
        };
      }
    } catch (e) {
      console.warn('MilanExternalService: could not attach charts:', e.message);
    }

    return {
      total_points_obtained: Math.round(totalPoints * 10) / 10,
      total_points_max: totalMax,
      kootas,
      boy_charts: boyCharts,
      girl_charts: girlCharts,
      texts: {
        overall_summary_html: `<p>Ashtakoot Milan (external API): ${totalPoints} / ${totalMax} (${status})</p>`,
        detailed_report_html: '<p>वर्ण, वश्य, तारा, योनी, ग्रह मैत्री, गण, भकूट र नाडी मिलान (Free Astrology API).</p>',
      },
      raw_engine_data: { source: 'freeastrologyapi' },
    };
  }

  _mapKootas(output) {
    const rows = [];
    for (const key of KOOTA_ORDER) {
      const k = output[key];
      if (!k) continue;
      const outOf = k.out_of ?? 0;
      const score = typeof k.score === 'number' ? k.score : 0;
      const meta = KOOTA_NAMES[key] || { en: key, ne: key };
      const boyValue = this._kootaDisplayValue(k, 'groom', key);
      const girlValue = this._kootaDisplayValue(k, 'bride', key);
      const status = score >= outOf * 0.5 ? 'good' : score > 0 ? 'average' : 'weak';
      rows.push({
        name: meta.en,
        name_ne: meta.ne,
        max_points: outOf,
        points_obtained: Math.round(score * 10) / 10,
        status,
        explanation: `${meta.en}: ${score} / ${outOf}`,
        boy_value: boyValue,
        girl_value: girlValue,
      });
    }
    return rows;
  }

  _kootaDisplayValue(k, role, key) {
    const side = k[role];
    if (!side) return '-';
    if (key === 'varna_kootam' && side.varnam_name) return side.varnam_name;
    if (key === 'vasya_kootam') return role === 'groom' ? (side.groom_kootam_name || '-') : (side.bride_kootam_name || '-');
    if (key === 'tara_kootam' && side.star_name) return side.star_name;
    if (key === 'yoni_kootam' && side.yoni) return side.yoni;
    if (key === 'graha_maitri_kootam' && side.moon_sign_lord_name) return side.moon_sign_lord_name;
    if (key === 'gana_kootam') return role === 'groom' ? (side.groom_nadi_name || '-') : (side.bride_nadi_name || '-');
    if (key === 'rasi_kootam' && side.moon_sign_name) return side.moon_sign_name;
    if (key === 'nadi_kootam' && side.nadi_name) return side.nadi_name;
    return '-';
  }
}

module.exports = MilanExternalService;
