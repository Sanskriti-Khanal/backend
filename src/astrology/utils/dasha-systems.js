/**
 * Dasha Systems Utility
 *
 * Implements major dasha systems used in Vedic astrology.
 * Uses 360-day year (30 days per month) for date <-> decimal year so period
 * boundaries are consistent. Remaining slight mismatches vs reference can be due to:
 * - Ayanamsa / sidereal longitude difference (Moon position → nakshatra → first period length)
 * - Birth time timezone (server local vs user timezone when building birth Date)
 * - Reference using Gregorian calendar vs our Vedic-style 30-day month display
 */

const ephemeris = require('./ephemeris');
const nakshatra = require('./nakshatra');

// Vimshottari Dasha periods (in years) - Total 120 years
// Must match original Java implementation (o000O000 / o00000O0)
// Order: Su → Mo → Ma → Ra → Ju → Sa → Me → Ke → Ve
const VIMSHOTTARI_PERIODS = {
  sun: 6.0,
  moon: 10.0,
  mars: 7.0,
  rahu: 18.0,
  jupiter: 16.0,
  saturn: 19.0,
  mercury: 17.0,
  ketu: 7.0,
  venus: 20.0
};

const VIMSHOTTARI_ORDER = [
  'sun',
  'moon',
  'mars',
  'rahu',
  'jupiter',
  'saturn',
  'mercury',
  'ketu',
  'venus'
];

// Tribhagi Dasha periods (in years) - Total 80 years
// Must match original Java implementation (o000 / o00000O0)
// Order: Su → Mo → Ma → Ra → Ju → Sa → Me → Ke → Ve
const TRIBHAGI_PERIODS = {
  sun: 4.0,
  moon: 6.666666666666667,
  mars: 4.666666666666667,
  rahu: 12.0,
  jupiter: 10.666666666666666,
  saturn: 12.666666666666666,
  mercury: 11.333333333333334,
  ketu: 4.666666666666667,
  venus: 13.333333333333334
};

const TRIBHAGI_ORDER = [
  'sun',
  'moon',
  'mars',
  'rahu',
  'jupiter',
  'saturn',
  'mercury',
  'ketu',
  'venus'
];

// Yogini Dasha periods (in years) - Total 36 years
// Must match original Java implementation (o000O0o - f9703OooOooo array)
// CRITICAL: The array order in Java is: Ra → Mo → Su → Ju → Ma → Me → Sa → Ve
// This matches: o0000Var (Rahu), o0000Var2 (Moon), o0000Var3 (Sun), etc.
const YOGINI_PERIODS = {
  rahu: 8.0,
  moon: 1.0,
  sun: 2.0,
  jupiter: 3.0,
  mars: 4.0,
  mercury: 5.0,
  saturn: 6.0,
  venus: 7.0
};

// Order matches Java f9703OooOooo array: Rahu, Moon, Sun, Jupiter, Mars, Mercury, Saturn, Venus
// One cycle = 8 yoginis, 36 years. Java app shows ~26 periods (120-year span).
const YOGINI_ORDER = [
  'rahu',   // Index 0 - संकटा
  'moon',   // Index 1 - मंगला
  'sun',    // Index 2 - पिङला
  'jupiter', // Index 3 - धन्य
  'mars',   // Index 4 - भ्रामरी
  'mercury', // Index 5 - भद्रिका
  'saturn', // Index 6 - उल्का
  'venus'   // Index 7 - सिद्धा
];

// Yogini Dasha Nepali names mapping (matches Java o0000 constructor)
// Matches: new o0000("Moon", "मंगला", "", "", 1.0d)
const YOGINI_NEPALI_NAMES = {
  'moon': 'मंगला',
  'sun': 'पिङला',
  'jupiter': 'धन्य',
  'mars': 'भ्रामरी',
  'mercury': 'भद्रिका',
  'saturn': 'उल्का',
  'venus': 'सिद्धा',
  'rahu': 'संकटा'
};

// Vimshottari/Tribhagi Dasha Nepali names mapping (matches Java o00000OO/o0000Ooo constructor)
const DASHA_NEPALI_NAMES = {
  'sun': 'सूर्य',
  'moon': 'चन्द्र',
  'mars': 'मंगल',
  'mercury': 'बुध',
  'jupiter': 'गुरु',
  'venus': 'शुक्र',
  'saturn': 'शनि',
  'rahu': 'राहु',
  'ketu': 'केतु'
};

// Nakshatra lords for Vimshottari/Tribhagi (27 nakshatras)
// Each group of 9 nakshatras follows the same pattern
const NAKSHATRA_LORDS = [
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', // 0-8 (Ashwini to Ashlesha)
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury', // 9-17 (Magha to Jyeshtha)
  'ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'  // 18-26 (Mula to Revati)
];

/**
 * Convert decimal years to year-month-day for Vimshottari Dasha
 * CRITICAL: Uses 360-day year (30 days per month) for dasha calculations
 * This matches traditional Vedic astrology practice
 * @param {number} decimalYears - Decimal years (e.g., 1990.5 = 1990-06-15)
 * @returns {Object} {year, month, day}
 */
function decimalYearsToDate(decimalYears) {
  let year = Math.floor(decimalYears);
  let remainder = decimalYears - year;
  
  let monthDecimal = remainder * 12.0;
  let month = Math.floor(monthDecimal);
  remainder = monthDecimal - month;
  
  // Use 30 days per month (360-day year system)
  let dayDecimal = remainder * 30.0;
  let day = Math.floor(dayDecimal);
  
  // Handle edge cases
  if (day === 0) {
    day = 30;
    month--;
  }
  
  // Handle month overflow
  if (month > 12) {
    month -= 12;
    year++;
  }
  
  // Handle month underflow
  if (month === 0) {
    month = 12;
    year--;
  }
  
  return {
    year: Math.abs(year),
    month: Math.abs(month),
    day: Math.abs(day)
  };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Format a decimal-year timestamp into Java-style dasha date string.
 * Java uses a 30-day month conversion and prints `YYYY-MM-DD` directly.
 */
function decimalYearsToVedicDateString(decimalYears, use365 = false) {
  const { year, month, day } = use365 ? decimalYearsToDate365(decimalYears) : decimalYearsToDate(decimalYears);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Convert decimal-years to a JS Date (Gregorian) for compatibility.
 * Note: JS Date will clamp invalid dates (e.g., Feb 30) so this is NOT used
 * for display. Display should use `decimalYearsToVedicDateString`.
 * @param {number} decimalYears
 * @param {boolean} use365 - If true, use 365-day year conversion (for Yogini to match Java)
 */
function decimalYearsToJsDate(decimalYears, use365 = false) {
  const { year, month, day } = use365 ? decimalYearsToDate365(decimalYears) : decimalYearsToDate(decimalYears);
  let resultDate = new Date(year, month - 1, day);
  if (resultDate.getDate() !== day) {
    const lastDay = new Date(year, month, 0).getDate();
    resultDate = new Date(year, month - 1, Math.min(day, lastDay));
  }
  return resultDate;
}

/**
 * Convert date to decimal years for Dasha calculations
 * Uses 360-day year (30 days per month) so round-trip with decimalYearsToDate is consistent.
 * Formula: year + month/12.0 + day/360.0 (1 year = 12 × 30 days)
 * @param {Date} date - Date object
 * @param {boolean} use360 - If false, use 365-day year (for Yogini to match some Java implementations)
 * @returns {number} Decimal years
 */
function dateToDecimalYears(date, use360 = true) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  return year + (month / 12.0) + (day / (use360 ? 360.0 : 365.0));
}

/**
 * Convert decimal years to date using 365-day year (for Yogini Dasha to match Java app dates).
 * Inverse of dateToDecimalYears with use360=false: year + month/12 + day/365.
 */
function decimalYearsToDate365(decimalYears) {
  const year = Math.floor(decimalYears);
  let rem = decimalYears - year;
  if (rem < 0) rem = 0;
  if (rem >= 1) rem = 0.9999999;
  let month = Math.floor(rem * 12) + 1;
  if (month > 12) month = 12;
  const remMonth = rem * 12 - (month - 1);
  let day = Math.floor(remMonth * 30) + 1;
  if (day > 30) day = 30;
  if (day < 1) day = 1;
  return { year, month, day };
}

/**
 * Add years to a date using decimal year arithmetic for Dasha calculations
 * CRITICAL: Matches Java implementation: d + i + (i2 / 12.0d) + (i3 / 365.0d)
 * Formula: d + year + (month/12.0) + (day/365.0)
 * This matches the Java implementation exactly
 * @param {Date} date - Start date
 * @param {number} years - Years to add (can be fractional)
 * @returns {Date} New date
 */
function addYearsDecimal(date, years) {
  const startDecimal = dateToDecimalYears(date);
  const endDecimal = startDecimal + years;
  return decimalYearsToJsDate(endDecimal);
}

/**
 * Calculate Vimshottari Dasha (120 years)
 * Uses decimal year arithmetic to match Java implementation exactly
 * Matches Java: o000O000.OooO0o() and o000O000.OooO0OO()
 * 
 * @param {number} moonLongitude - Moon's sidereal longitude
 * @param {Date} birthDate - Birth date
 * @param {number} years - Number of years to calculate
 * @param {boolean} isBalanced - If false, uses full dasha period instead of remaining time (matches Java f9642OooO0O0)
 * @returns {Array} Dasha periods
 */
function calculateVimshottariDasha(moonLongitude, birthDate, years = 120, isBalanced = true) {
  // Get nakshatra from moon longitude
  const nakshatraData = nakshatra.calculateNakshatra(moonLongitude);
  const nakshatraIndex = nakshatraData.index; // 0-26
  
  // Get dasha lord for this nakshatra
  const dashaLord = NAKSHATRA_LORDS[nakshatraIndex];
  
  // Calculate remaining time in current nakshatra
  const nakshatraTotal = 13.333333333333334; // 13°20' total = 800 minutes = 13.333... degrees
  const degreeInNakshatra = nakshatraData.position; // position within nakshatra (0-13.3333) from start
  const remainingNakshatra = nakshatraTotal - degreeInNakshatra;
  
  // Calculate remaining time in current dasha
  // Formula: remaining_dasha = (remaining_degrees / total_nakshatra_degrees) * full_dasha_period
  // This matches Java: ((13.3333333333d - position) * dasha_period) / 13.3333333333d
  const dashaPeriod = VIMSHOTTARI_PERIODS[dashaLord];
  let remainingDasha = (remainingNakshatra / nakshatraTotal) * dashaPeriod;
  
  // If unbalanced mode, use full dasha period instead of remaining time
  // Matches Java: if (!this.f9642OooO0O0) { dOooO0OO = this.f9645OooO0o[0].OooO0Oo(); }
  if (!isBalanced) {
    remainingDasha = dashaPeriod;
  }
  
  // Start from current dasha lord
  const lordIndex = VIMSHOTTARI_ORDER.indexOf(dashaLord);
  
  const dashas = [];
  let currentDecimal = dateToDecimalYears(new Date(birthDate));
  let currentLordIndex = lordIndex;
  let remainingTime = remainingDasha;
  let totalYears = 0;
  
  while (totalYears < years) {
    const currentLord = VIMSHOTTARI_ORDER[currentLordIndex];
    // Use remaining time only for the first dasha (birth dasha)
    const period = currentLordIndex === lordIndex ? remainingTime : VIMSHOTTARI_PERIODS[currentLord];
    
    const endDecimal = currentDecimal + period;
    
    dashas.push({
      lord: currentLord,
      nepaliName: getDashaNepaliName(currentLord), // Add Nepali name (matches Java o00000OO.OooO0o())
      startDate: decimalYearsToJsDate(currentDecimal),
      endDate: decimalYearsToJsDate(endDecimal),
      startDateVedic: decimalYearsToVedicDateString(currentDecimal),
      endDateVedic: decimalYearsToVedicDateString(endDecimal),
      startDecimal: currentDecimal,
      endDecimal: endDecimal,
      period: period,
      isCurrent: dashas.length === 0
    });
    
    currentDecimal = endDecimal;
    totalYears += period;
    currentLordIndex = (currentLordIndex + 1) % VIMSHOTTARI_ORDER.length;
    // After first dasha, remainingTime is no longer used, but we keep it for consistency
    if (currentLordIndex !== lordIndex) {
      remainingTime = VIMSHOTTARI_PERIODS[VIMSHOTTARI_ORDER[currentLordIndex]];
    }
  }
  
  return dashas;
}

/**
 * Calculate Tribhagi Dasha (80 years)
 * Uses decimal year arithmetic to match Java implementation exactly
 * Matches Java: o000.OooO0o() and o000.OooO0OO()
 * 
 * @param {number} moonLongitude - Moon's sidereal longitude
 * @param {Date} birthDate - Birth date
 * @param {number} years - Number of years to calculate
 * @param {boolean} isBalanced - If false, uses full dasha period instead of remaining time (matches Java f9432OooO0O0)
 * @returns {Array} Dasha periods
 */
function calculateTribhagiDasha(moonLongitude, birthDate, years = 80, isBalanced = true) {
  // Get nakshatra from moon longitude
  const nakshatraData = nakshatra.calculateNakshatra(moonLongitude);
  const nakshatraIndex = nakshatraData.index; // 0-26
  
  // Get dasha lord for this nakshatra (same mapping as Vimshottari)
  const dashaLord = NAKSHATRA_LORDS[nakshatraIndex];
  
  // Calculate remaining time in current nakshatra
  const nakshatraTotal = 13.333333333333334; // 13°20' total = 800 minutes
  const degreeInNakshatra = nakshatraData.position; // position within nakshatra (0-13.3333)
  const remainingNakshatra = nakshatraTotal - degreeInNakshatra;
  
  // Calculate remaining time in current dasha
  const dashaPeriod = TRIBHAGI_PERIODS[dashaLord];
  let remainingDasha = (remainingNakshatra / nakshatraTotal) * dashaPeriod;
  
  // If unbalanced mode, use full dasha period instead of remaining time
  // Matches Java: if (!this.f9432OooO0O0) { dOooO0OO = this.f9435OooO0o[0].OooO0Oo(); }
  if (!isBalanced) {
    remainingDasha = dashaPeriod;
  }
  
  // Start from current dasha lord
  const lordIndex = TRIBHAGI_ORDER.indexOf(dashaLord);
  
  const dashas = [];
  let currentDecimal = dateToDecimalYears(new Date(birthDate));
  let currentLordIndex = lordIndex;
  let remainingTime = remainingDasha;
  let totalYears = 0;
  
  while (totalYears < years) {
    const currentLord = TRIBHAGI_ORDER[currentLordIndex];
    // Use remaining time only for the first dasha (birth dasha)
    const period = currentLordIndex === lordIndex ? remainingTime : TRIBHAGI_PERIODS[currentLord];
    
    const endDecimal = currentDecimal + period;
    
    dashas.push({
      lord: currentLord,
      nepaliName: getDashaNepaliName(currentLord), // Add Nepali name (matches Java o0000Ooo.OooO0o())
      startDate: decimalYearsToJsDate(currentDecimal),
      endDate: decimalYearsToJsDate(endDecimal),
      startDateVedic: decimalYearsToVedicDateString(currentDecimal),
      endDateVedic: decimalYearsToVedicDateString(endDecimal),
      startDecimal: currentDecimal,
      endDecimal: endDecimal,
      period: period,
      isCurrent: dashas.length === 0
    });
    
    currentDecimal = endDecimal;
    totalYears += period;
    currentLordIndex = (currentLordIndex + 1) % TRIBHAGI_ORDER.length;
    // After first dasha, remainingTime is no longer used, but we keep it for consistency
    if (currentLordIndex !== lordIndex) {
      remainingTime = TRIBHAGI_PERIODS[TRIBHAGI_ORDER[currentLordIndex]];
    }
  }
  
  return dashas;
}

/**
 * Calculate Yogini Dasha (36 years)
 * Based on Moon's nakshatra, but uses different order and periods.
 * Uses 365-day year for date <-> decimal conversion so period boundaries match Java app.
 * Matches Java: o000O0o.OooO0Oo() and o000O0o.OooO0OO()
 *
 * @param {number} moonLongitude - Moon's sidereal longitude
 * @param {Date} birthDate - Birth date
 * @param {number} years - Number of years to calculate
 * @param {boolean} isBalanced - If false, uses full dasha period instead of remaining time (matches Java f9675OooO0O0)
 * @returns {Array} Dasha periods
 */
function calculateYoginiDasha(moonLongitude, birthDate, years = 36, isBalanced = true) {
  const use365 = true; // Yogini only: 365-day year so dates match Java app

  const nakshatraData = nakshatra.calculateNakshatra(moonLongitude);
  const nakshatraIndex = nakshatraData.index; // 0-26

  // Yogini Dasha uses formula: (nakshatraIndex + 3) % 8
  const yoginiStartIndex = (nakshatraIndex + 3) % 8;
  const dashaLord = YOGINI_ORDER[yoginiStartIndex];

  const nakshatraTotal = 13.333333333333334; // 13°20' total
  const degreeInNakshatra = nakshatraData.position;
  const remainingNakshatra = nakshatraTotal - degreeInNakshatra;
  const dashaPeriod = YOGINI_PERIODS[dashaLord];
  let remainingDasha = (remainingNakshatra / nakshatraTotal) * dashaPeriod;

  if (!isBalanced) {
    remainingDasha = dashaPeriod;
  }

  const lordIndex = yoginiStartIndex;
  const dashas = [];
  let currentDecimal = dateToDecimalYears(new Date(birthDate), !use365);
  let currentLordIndex = lordIndex;
  let remainingTime = remainingDasha;
  let totalYears = 0;

  while (totalYears < years) {
    const currentLord = YOGINI_ORDER[currentLordIndex];
    const period = currentLordIndex === lordIndex ? remainingTime : YOGINI_PERIODS[currentLord];
    const endDecimal = currentDecimal + period;

    dashas.push({
      lord: currentLord,
      nepaliName: getYoginiNepaliName(currentLord),
      startDate: decimalYearsToJsDate(currentDecimal, use365),
      endDate: decimalYearsToJsDate(endDecimal, use365),
      startDateVedic: decimalYearsToVedicDateString(currentDecimal, use365),
      endDateVedic: decimalYearsToVedicDateString(endDecimal, use365),
      startDecimal: currentDecimal,
      endDecimal: endDecimal,
      period: period,
      isCurrent: dashas.length === 0
    });

    currentDecimal = endDecimal;
    totalYears += period;
    currentLordIndex = (currentLordIndex + 1) % YOGINI_ORDER.length;
    if (currentLordIndex !== lordIndex) {
      remainingTime = YOGINI_PERIODS[YOGINI_ORDER[currentLordIndex]];
    }
  }

  return dashas;
}

/**
 * Get Nepali name for Yogini dasha lord
 * Matches Java: o0000.OooO0o() returns Nepali name
 * 
 * @param {string} lord - Planet ID (e.g., 'moon', 'sun')
 * @returns {string} Nepali name
 */
function getYoginiNepaliName(lord) {
  return YOGINI_NEPALI_NAMES[lord.toLowerCase()] || lord;
}

/**
 * Get Nepali name for Vimshottari/Tribhagi dasha lord
 * Matches Java: o00000OO.OooO0o() / o0000Ooo.OooO0o() returns Nepali name
 * 
 * @param {string} lord - Planet ID (e.g., 'sun', 'moon')
 * @returns {string} Nepali name
 */
function getDashaNepaliName(lord) {
  return DASHA_NEPALI_NAMES[lord.toLowerCase()] || lord;
}

function toDecimal(input) {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (input instanceof Date) return dateToDecimalYears(input);
  return NaN;
}

function buildPeriodObject({ lord, nepaliName, startDecimal, periodYears }) {
  const endDecimal = startDecimal + periodYears;
  return {
    lord,
    nepaliName,
    startDecimal,
    endDecimal,
    startDate: decimalYearsToJsDate(startDecimal),
    endDate: decimalYearsToJsDate(endDecimal),
    startDateVedic: decimalYearsToVedicDateString(startDecimal),
    endDateVedic: decimalYearsToVedicDateString(endDecimal),
    period: periodYears
  };
}

/**
 * Calculate Bhukti (sub-period) within a Vimshottari Dasha
 * Uses decimal year arithmetic
 * Bhukti order starts from the dasha lord itself
 */
function calculateBhukti(dashaLord, dashaStart, dashaPeriod, target) {
  const startDecimal = toDecimal(dashaStart);
  const targetDecimal = toDecimal(target);
  let elapsed = targetDecimal - startDecimal;
  
  // If target date is before dasha start, return first bhukti
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  // If target date is after dasha end, return last bhukti
  if (elapsed >= dashaPeriod) {
    elapsed = dashaPeriod - 0.0001; // Use a small epsilon to avoid boundary issues
  }
  
  // Find starting position of dasha lord in the order
  const dashaLordIndex = VIMSHOTTARI_ORDER.indexOf(dashaLord);
  if (dashaLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  // Start from the dasha lord's position in the order
  for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
    const lordIndex = (dashaLordIndex + i) % VIMSHOTTARI_ORDER.length;
    const lord = VIMSHOTTARI_ORDER[lordIndex];
    const bhuktiPeriod = (VIMSHOTTARI_PERIODS[lord] / 120) * dashaPeriod;
    
    if (elapsed < cumulative + bhuktiPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getDashaNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: bhuktiPeriod
      });
    }
    
    cumulative += bhuktiPeriod;
  }
  
  // Fallback: return last bhukti
  const lastLordIndex = (dashaLordIndex + VIMSHOTTARI_ORDER.length - 1) % VIMSHOTTARI_ORDER.length;
  const lastLord = VIMSHOTTARI_ORDER[lastLordIndex];
  const lastBhuktiPeriod = (VIMSHOTTARI_PERIODS[lastLord] / 120) * dashaPeriod;
  const lastCumulative = dashaPeriod - lastBhuktiPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getDashaNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastBhuktiPeriod
  });
}

/**
 * Calculate Antara (sub-sub-period) within a Vimshottari Bhukti
 * Uses decimal year arithmetic
 * Antara order starts from the bhukti lord itself
 */
function calculateAntara(bhuktiLord, bhuktiStart, bhuktiPeriod, target) {
  const startDecimal = toDecimal(bhuktiStart);
  const targetDecimal = toDecimal(target);
  let elapsed = targetDecimal - startDecimal;
  
  // If target date is before bhukti start, return first antara
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  // If target date is after bhukti end, return last antara
  if (elapsed >= bhuktiPeriod) {
    elapsed = bhuktiPeriod - 0.0001; // Use a small epsilon to avoid boundary issues
  }
  
  // Find starting position of bhukti lord in the order
  const bhuktiLordIndex = VIMSHOTTARI_ORDER.indexOf(bhuktiLord);
  if (bhuktiLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  // Start from the bhukti lord's position in the order
  for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
    const lordIndex = (bhuktiLordIndex + i) % VIMSHOTTARI_ORDER.length;
    const lord = VIMSHOTTARI_ORDER[lordIndex];
    const antaraPeriod = (VIMSHOTTARI_PERIODS[lord] / 120) * bhuktiPeriod;
    
    if (elapsed < cumulative + antaraPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getDashaNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: antaraPeriod
      });
    }
    
    cumulative += antaraPeriod;
  }
  
  // Fallback: return last antara
  const lastLordIndex = (bhuktiLordIndex + VIMSHOTTARI_ORDER.length - 1) % VIMSHOTTARI_ORDER.length;
  const lastLord = VIMSHOTTARI_ORDER[lastLordIndex];
  const lastAntaraPeriod = (VIMSHOTTARI_PERIODS[lastLord] / 120) * bhuktiPeriod;
  const lastCumulative = bhuktiPeriod - lastAntaraPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getDashaNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastAntaraPeriod
  });
}

/**
 * Calculate Bhukti (sub-period) within a Tribhagi Dasha
 * Uses decimal year arithmetic
 * Bhukti order starts from the dasha lord itself
 */
function calculateTribhagiBhukti(dashaLord, dashaStart, dashaPeriod, target) {
  const startDecimal = toDecimal(dashaStart);
  const targetDecimal = toDecimal(target);
  let elapsed = targetDecimal - startDecimal;
  
  // If target date is before dasha start, return first bhukti
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  // If target date is after dasha end, return last bhukti
  if (elapsed >= dashaPeriod) {
    elapsed = dashaPeriod - 0.0001; // Use a small epsilon to avoid boundary issues
  }
  
  // Find starting position of dasha lord in the order
  const dashaLordIndex = TRIBHAGI_ORDER.indexOf(dashaLord);
  if (dashaLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  // Start from the dasha lord's position in the order
  for (let i = 0; i < TRIBHAGI_ORDER.length; i++) {
    const lordIndex = (dashaLordIndex + i) % TRIBHAGI_ORDER.length;
    const lord = TRIBHAGI_ORDER[lordIndex];
    const bhuktiPeriod = (TRIBHAGI_PERIODS[lord] / 80) * dashaPeriod;
    
    if (elapsed < cumulative + bhuktiPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getDashaNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: bhuktiPeriod
      });
    }
    
    cumulative += bhuktiPeriod;
  }
  
  // Fallback: return last bhukti
  const lastLordIndex = (dashaLordIndex + TRIBHAGI_ORDER.length - 1) % TRIBHAGI_ORDER.length;
  const lastLord = TRIBHAGI_ORDER[lastLordIndex];
  const lastBhuktiPeriod = (TRIBHAGI_PERIODS[lastLord] / 80) * dashaPeriod;
  const lastCumulative = dashaPeriod - lastBhuktiPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getDashaNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastBhuktiPeriod
  });
}

/**
 * Calculate Antara (sub-sub-period) within a Tribhagi Bhukti
 * Uses decimal year arithmetic
 * Antara order starts from the bhukti lord itself
 */
function calculateTribhagiAntara(bhuktiLord, bhuktiStartDate, bhuktiPeriod, targetDate) {
  const startDecimal = toDecimal(bhuktiStartDate);
  const targetDecimal = toDecimal(targetDate);
  let elapsed = targetDecimal - startDecimal;
  
  // If target date is before bhukti start, return first antara
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  // If target date is after bhukti end, return last antara
  if (elapsed >= bhuktiPeriod) {
    elapsed = bhuktiPeriod - 0.0001; // Use a small epsilon to avoid boundary issues
  }
  
  // Find starting position of bhukti lord in the order
  const bhuktiLordIndex = TRIBHAGI_ORDER.indexOf(bhuktiLord);
  if (bhuktiLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  // Start from the bhukti lord's position in the order
  for (let i = 0; i < TRIBHAGI_ORDER.length; i++) {
    const lordIndex = (bhuktiLordIndex + i) % TRIBHAGI_ORDER.length;
    const lord = TRIBHAGI_ORDER[lordIndex];
    const antaraPeriod = (TRIBHAGI_PERIODS[lord] / 80) * bhuktiPeriod;
    
    if (elapsed < cumulative + antaraPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getDashaNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: antaraPeriod
      });
    }
    
    cumulative += antaraPeriod;
  }
  
  // Fallback: return last antara
  const lastLordIndex = (bhuktiLordIndex + TRIBHAGI_ORDER.length - 1) % TRIBHAGI_ORDER.length;
  const lastLord = TRIBHAGI_ORDER[lastLordIndex];
  const lastAntaraPeriod = (TRIBHAGI_PERIODS[lastLord] / 80) * bhuktiPeriod;
  const lastCumulative = bhuktiPeriod - lastAntaraPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getDashaNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastAntaraPeriod
  });
}

/**
 * Calculate Bhukti (sub-period) within a Yogini Dasha
 * Uses decimal year arithmetic
 * Bhukti order starts from the dasha lord itself
 */
function calculateYoginiBhukti(dashaLord, dashaStartDate, dashaPeriod, targetDate) {
  const startDecimal = toDecimal(dashaStartDate);
  const targetDecimal = toDecimal(targetDate);
  let elapsed = targetDecimal - startDecimal;
  
  // If target date is before dasha start, return first bhukti
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  // If target date is after dasha end, return last bhukti
  if (elapsed >= dashaPeriod) {
    elapsed = dashaPeriod - 0.0001; // Use a small epsilon to avoid boundary issues
  }
  
  // Find starting position of dasha lord in the order
  const dashaLordIndex = YOGINI_ORDER.indexOf(dashaLord);
  if (dashaLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  // Start from the dasha lord's position in the order
  for (let i = 0; i < YOGINI_ORDER.length; i++) {
    const lordIndex = (dashaLordIndex + i) % YOGINI_ORDER.length;
    const lord = YOGINI_ORDER[lordIndex];
    const bhuktiPeriod = (YOGINI_PERIODS[lord] / 36) * dashaPeriod;
    
    if (elapsed < cumulative + bhuktiPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getYoginiNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: bhuktiPeriod
      });
    }
    
    cumulative += bhuktiPeriod;
  }
  
  // Fallback: return last bhukti
  const lastLordIndex = (dashaLordIndex + YOGINI_ORDER.length - 1) % YOGINI_ORDER.length;
  const lastLord = YOGINI_ORDER[lastLordIndex];
  const lastBhuktiPeriod = (YOGINI_PERIODS[lastLord] / 36) * dashaPeriod;
  const lastCumulative = dashaPeriod - lastBhuktiPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getYoginiNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastBhuktiPeriod
  });
}

/**
 * Calculate Antara (sub-sub-period) within a Yogini Bhukti
 * Uses decimal year arithmetic
 * Antara order starts from the bhukti lord itself
 */
function calculateYoginiAntara(bhuktiLord, bhuktiStartDate, bhuktiPeriod, targetDate) {
  const startDecimal = toDecimal(bhuktiStartDate);
  const targetDecimal = toDecimal(targetDate);
  let elapsed = targetDecimal - startDecimal;
  
  // If target date is before bhukti start, return first antara
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  // If target date is after bhukti end, return last antara
  if (elapsed >= bhuktiPeriod) {
    elapsed = bhuktiPeriod - 0.0001; // Use a small epsilon to avoid boundary issues
  }
  
  // Find starting position of bhukti lord in the order
  const bhuktiLordIndex = YOGINI_ORDER.indexOf(bhuktiLord);
  if (bhuktiLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  // Start from the bhukti lord's position in the order
  for (let i = 0; i < YOGINI_ORDER.length; i++) {
    const lordIndex = (bhuktiLordIndex + i) % YOGINI_ORDER.length;
    const lord = YOGINI_ORDER[lordIndex];
    const antaraPeriod = (YOGINI_PERIODS[lord] / 36) * bhuktiPeriod;
    
    if (elapsed < cumulative + antaraPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getYoginiNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: antaraPeriod
      });
    }
    
    cumulative += antaraPeriod;
  }
  
  // Fallback: return last antara
  const lastLordIndex = (bhuktiLordIndex + YOGINI_ORDER.length - 1) % YOGINI_ORDER.length;
  const lastLord = YOGINI_ORDER[lastLordIndex];
  const lastAntaraPeriod = (YOGINI_PERIODS[lastLord] / 36) * bhuktiPeriod;
  const lastCumulative = bhuktiPeriod - lastAntaraPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getYoginiNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastAntaraPeriod
  });
}

/**
 * Calculate Sukshma (sub-sub-sub-period) within a Vimshottari Antara
 * Uses decimal year arithmetic
 * Sukshma order starts from the antara lord itself
 */
function calculateSukshma(antaraLord, antaraStartDate, antaraPeriod, targetDate) {
  const startDecimal = toDecimal(antaraStartDate);
  const targetDecimal = toDecimal(targetDate);
  let elapsed = targetDecimal - startDecimal;
  
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  if (elapsed >= antaraPeriod) {
    elapsed = antaraPeriod - 0.0001;
  }
  
  const antaraLordIndex = VIMSHOTTARI_ORDER.indexOf(antaraLord);
  if (antaraLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  for (let i = 0; i < VIMSHOTTARI_ORDER.length; i++) {
    const lordIndex = (antaraLordIndex + i) % VIMSHOTTARI_ORDER.length;
    const lord = VIMSHOTTARI_ORDER[lordIndex];
    const sukshmaPeriod = (VIMSHOTTARI_PERIODS[lord] / 120) * antaraPeriod;
    
    if (elapsed < cumulative + sukshmaPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getDashaNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: sukshmaPeriod
      });
    }
    
    cumulative += sukshmaPeriod;
  }
  
  const lastLordIndex = (antaraLordIndex + VIMSHOTTARI_ORDER.length - 1) % VIMSHOTTARI_ORDER.length;
  const lastLord = VIMSHOTTARI_ORDER[lastLordIndex];
  const lastSukshmaPeriod = (VIMSHOTTARI_PERIODS[lastLord] / 120) * antaraPeriod;
  const lastCumulative = antaraPeriod - lastSukshmaPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getDashaNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastSukshmaPeriod
  });
}

/**
 * Calculate Sukshma (sub-sub-sub-period) within a Tribhagi Antara
 */
function calculateTribhagiSukshma(antaraLord, antaraStartDate, antaraPeriod, targetDate) {
  const startDecimal = toDecimal(antaraStartDate);
  const targetDecimal = toDecimal(targetDate);
  let elapsed = targetDecimal - startDecimal;
  
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  if (elapsed >= antaraPeriod) {
    elapsed = antaraPeriod - 0.0001;
  }
  
  const antaraLordIndex = TRIBHAGI_ORDER.indexOf(antaraLord);
  if (antaraLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  for (let i = 0; i < TRIBHAGI_ORDER.length; i++) {
    const lordIndex = (antaraLordIndex + i) % TRIBHAGI_ORDER.length;
    const lord = TRIBHAGI_ORDER[lordIndex];
    const sukshmaPeriod = (TRIBHAGI_PERIODS[lord] / 80) * antaraPeriod;
    
    if (elapsed < cumulative + sukshmaPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getDashaNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: sukshmaPeriod
      });
    }
    
    cumulative += sukshmaPeriod;
  }
  
  const lastLordIndex = (antaraLordIndex + TRIBHAGI_ORDER.length - 1) % TRIBHAGI_ORDER.length;
  const lastLord = TRIBHAGI_ORDER[lastLordIndex];
  const lastSukshmaPeriod = (TRIBHAGI_PERIODS[lastLord] / 80) * antaraPeriod;
  const lastCumulative = antaraPeriod - lastSukshmaPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getDashaNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastSukshmaPeriod
  });
}

/**
 * Calculate Sukshma (sub-sub-sub-period) within a Yogini Antara
 */
function calculateYoginiSukshma(antaraLord, antaraStartDate, antaraPeriod, targetDate) {
  const startDecimal = toDecimal(antaraStartDate);
  const targetDecimal = toDecimal(targetDate);
  let elapsed = targetDecimal - startDecimal;
  
  if (elapsed < 0) {
    elapsed = 0;
  }
  
  if (elapsed >= antaraPeriod) {
    elapsed = antaraPeriod - 0.0001;
  }
  
  const antaraLordIndex = YOGINI_ORDER.indexOf(antaraLord);
  if (antaraLordIndex === -1) {
    return null;
  }
  
  let cumulative = 0;
  for (let i = 0; i < YOGINI_ORDER.length; i++) {
    const lordIndex = (antaraLordIndex + i) % YOGINI_ORDER.length;
    const lord = YOGINI_ORDER[lordIndex];
    const sukshmaPeriod = (YOGINI_PERIODS[lord] / 36) * antaraPeriod;
    
    if (elapsed < cumulative + sukshmaPeriod) {
      return buildPeriodObject({
        lord,
        nepaliName: getYoginiNepaliName(lord),
        startDecimal: startDecimal + cumulative,
        periodYears: sukshmaPeriod
      });
    }
    
    cumulative += sukshmaPeriod;
  }
  
  const lastLordIndex = (antaraLordIndex + YOGINI_ORDER.length - 1) % YOGINI_ORDER.length;
  const lastLord = YOGINI_ORDER[lastLordIndex];
  const lastSukshmaPeriod = (YOGINI_PERIODS[lastLord] / 36) * antaraPeriod;
  const lastCumulative = antaraPeriod - lastSukshmaPeriod;
  
  return buildPeriodObject({
    lord: lastLord,
    nepaliName: getYoginiNepaliName(lastLord),
    startDecimal: startDecimal + lastCumulative,
    periodYears: lastSukshmaPeriod
  });
}

/**
 * Calculate all Bhukti periods for a given Dasha
 */
function calculateAllBhuktis(dashaLord, dashaStartDate, dashaPeriod, dashaType = 'vimshottari') {
  const order = dashaType === 'yogini' ? YOGINI_ORDER : (dashaType === 'tribhagi' ? TRIBHAGI_ORDER : VIMSHOTTARI_ORDER);
  const periods = dashaType === 'yogini' ? YOGINI_PERIODS : (dashaType === 'tribhagi' ? TRIBHAGI_PERIODS : VIMSHOTTARI_PERIODS);
  const totalYears = dashaType === 'yogini' ? 36.0 : (dashaType === 'tribhagi' ? 80.0 : 120.0);
  const getName = dashaType === 'yogini' ? getYoginiNepaliName : getDashaNepaliName;
  
  const dashaLordIndex = order.indexOf(dashaLord);
  if (dashaLordIndex === -1) {
    return [];
  }
  
  const bhuktis = [];
  let cumulative = 0.0;
  for (let i = 0; i < order.length; i++) {
    const lordIndex = (dashaLordIndex + i) % order.length;
    const lord = order[lordIndex];
    const bhuktiPeriod = (periods[lord] / totalYears) * dashaPeriod;
    const bhuktiStart = addYearsDecimal(dashaStartDate, cumulative);
    const bhuktiEnd = addYearsDecimal(bhuktiStart, bhuktiPeriod);
    
    bhuktis.push({
      lord: lord,
      nepaliName: getName(lord),
      startDate: bhuktiStart,
      endDate: bhuktiEnd,
      period: bhuktiPeriod
    });
    
    cumulative += bhuktiPeriod;
  }
  
  return bhuktis;
}

/**
 * Calculate all Antara periods for a given Bhukti
 */
function calculateAllAntaras(bhuktiLord, bhuktiStartDate, bhuktiPeriod, dashaType = 'vimshottari') {
  const order = dashaType === 'yogini' ? YOGINI_ORDER : (dashaType === 'tribhagi' ? TRIBHAGI_ORDER : VIMSHOTTARI_ORDER);
  const periods = dashaType === 'yogini' ? YOGINI_PERIODS : (dashaType === 'tribhagi' ? TRIBHAGI_PERIODS : VIMSHOTTARI_PERIODS);
  const totalYears = dashaType === 'yogini' ? 36.0 : (dashaType === 'tribhagi' ? 80.0 : 120.0);
  const getName = dashaType === 'yogini' ? getYoginiNepaliName : getDashaNepaliName;
  
  const bhuktiLordIndex = order.indexOf(bhuktiLord);
  if (bhuktiLordIndex === -1) {
    return [];
  }
  
  const antaras = [];
  let cumulative = 0.0;
  for (let i = 0; i < order.length; i++) {
    const lordIndex = (bhuktiLordIndex + i) % order.length;
    const lord = order[lordIndex];
    const antaraPeriod = (periods[lord] / totalYears) * bhuktiPeriod;
    const antaraStart = addYearsDecimal(bhuktiStartDate, cumulative);
    const antaraEnd = addYearsDecimal(antaraStart, antaraPeriod);
    
    antaras.push({
      lord: lord,
      nepaliName: getName(lord),
      startDate: antaraStart,
      endDate: antaraEnd,
      period: antaraPeriod
    });
    
    cumulative += antaraPeriod;
  }
  
  return antaras;
}

/**
 * Calculate all Sukshma periods for a given Antara
 */
function calculateAllSukshmas(antaraLord, antaraStartDate, antaraPeriod, dashaType = 'vimshottari') {
  const order = dashaType === 'yogini' ? YOGINI_ORDER : (dashaType === 'tribhagi' ? TRIBHAGI_ORDER : VIMSHOTTARI_ORDER);
  const periods = dashaType === 'yogini' ? YOGINI_PERIODS : (dashaType === 'tribhagi' ? TRIBHAGI_PERIODS : VIMSHOTTARI_PERIODS);
  const totalYears = dashaType === 'yogini' ? 36.0 : (dashaType === 'tribhagi' ? 80.0 : 120.0);
  const getName = dashaType === 'yogini' ? getYoginiNepaliName : getDashaNepaliName;
  
  const antaraLordIndex = order.indexOf(antaraLord);
  if (antaraLordIndex === -1) {
    return [];
  }
  
  const sukshmas = [];
  let cumulative = 0.0;
  for (let i = 0; i < order.length; i++) {
    const lordIndex = (antaraLordIndex + i) % order.length;
    const lord = order[lordIndex];
    const sukshmaPeriod = (periods[lord] / totalYears) * antaraPeriod;
    const sukshmaStart = addYearsDecimal(antaraStartDate, cumulative);
    const sukshmaEnd = addYearsDecimal(sukshmaStart, sukshmaPeriod);
    
    sukshmas.push({
      lord: lord,
      nepaliName: getName(lord),
      startDate: sukshmaStart,
      endDate: sukshmaEnd,
      period: sukshmaPeriod
    });
    
    cumulative += sukshmaPeriod;
  }
  
  return sukshmas;
}

/**
 * Get current Vimshottari Dasha, Bhukti, and Antara for a given date
 */
function getCurrentDashaPeriods(vimshottariDashas, targetDate) {
  const targetDecimal = toDecimal(targetDate);
  const currentDasha = vimshottariDashas.find(d =>
    typeof d.startDecimal === 'number' &&
    typeof d.endDecimal === 'number' &&
    targetDecimal >= d.startDecimal &&
    targetDecimal < d.endDecimal
  ) || vimshottariDashas.find(d =>
    targetDate >= d.startDate && targetDate < d.endDate
  ) || vimshottariDashas.find(d =>
    targetDate >= d.startDate && targetDate <= d.endDate
  ) || vimshottariDashas[0];
  
  const currentBhukti = calculateBhukti(
    currentDasha.lord,
    currentDasha.startDecimal ?? currentDasha.startDate,
    currentDasha.period,
    targetDecimal
  );
  
  const currentAntara = currentBhukti ? calculateAntara(
    currentBhukti.lord,
    currentBhukti.startDecimal ?? currentBhukti.startDate,
    currentBhukti.period,
    targetDecimal
  ) : null;
  
  return {
    dasha: currentDasha,
    bhukti: currentBhukti,
    antara: currentAntara
  };
}

/**
 * Get current Tribhagi Dasha, Bhukti, and Antara for a given date
 */
function getCurrentTribhagiDashaPeriods(tribhagiDashas, targetDate) {
  const targetDecimal = toDecimal(targetDate);
  const currentDasha = tribhagiDashas.find(d =>
    typeof d.startDecimal === 'number' &&
    typeof d.endDecimal === 'number' &&
    targetDecimal >= d.startDecimal &&
    targetDecimal < d.endDecimal
  ) || tribhagiDashas.find(d => 
    targetDate >= d.startDate && targetDate < d.endDate
  ) || tribhagiDashas.find(d => 
    targetDate >= d.startDate && targetDate <= d.endDate
  ) || tribhagiDashas[0];
  
  const currentBhukti = calculateTribhagiBhukti(
    currentDasha.lord,
    currentDasha.startDecimal ?? currentDasha.startDate,
    currentDasha.period,
    targetDecimal
  );
  
  const currentAntara = currentBhukti ? calculateTribhagiAntara(
    currentBhukti.lord,
    currentBhukti.startDecimal ?? currentBhukti.startDate,
    currentBhukti.period,
    targetDecimal
  ) : null;
  
  return {
    dasha: currentDasha,
    bhukti: currentBhukti,
    antara: currentAntara
  };
}

/**
 * Get current Yogini Dasha, Bhukti, and Antara for a given date
 */
function getCurrentYoginiDashaPeriods(yoginiDashas, targetDate) {
  const targetDecimal = toDecimal(targetDate);
  const currentDasha = yoginiDashas.find(d =>
    typeof d.startDecimal === 'number' &&
    typeof d.endDecimal === 'number' &&
    targetDecimal >= d.startDecimal &&
    targetDecimal < d.endDecimal
  ) || yoginiDashas.find(d => 
    targetDate >= d.startDate && targetDate < d.endDate
  ) || yoginiDashas.find(d => 
    targetDate >= d.startDate && targetDate <= d.endDate
  ) || yoginiDashas[0];
  
  const currentBhukti = calculateYoginiBhukti(
    currentDasha.lord,
    currentDasha.startDecimal ?? currentDasha.startDate,
    currentDasha.period,
    targetDecimal
  );
  
  const currentAntara = currentBhukti ? calculateYoginiAntara(
    currentBhukti.lord,
    currentBhukti.startDecimal ?? currentBhukti.startDate,
    currentBhukti.period,
    targetDecimal
  ) : null;
  
  return {
    dasha: currentDasha,
    bhukti: currentBhukti,
    antara: currentAntara
  };
}

module.exports = {
  calculateVimshottariDasha,
  calculateTribhagiDasha,
  calculateYoginiDasha,
  calculateBhukti,
  calculateAntara,
  calculateTribhagiBhukti,
  calculateTribhagiAntara,
  calculateYoginiBhukti,
  calculateYoginiAntara,
  calculateSukshma,
  calculateTribhagiSukshma,
  calculateYoginiSukshma,
  calculateAllBhuktis,
  calculateAllAntaras,
  calculateAllSukshmas,
  getCurrentDashaPeriods,
  getCurrentTribhagiDashaPeriods,
  getCurrentYoginiDashaPeriods,
  getYoginiNepaliName,
  getDashaNepaliName,
  dateToDecimalYears,
  decimalYearsToDate,
  addYearsDecimal,
  VIMSHOTTARI_PERIODS,
  VIMSHOTTARI_ORDER,
  TRIBHAGI_PERIODS,
  TRIBHAGI_ORDER,
  YOGINI_PERIODS,
  YOGINI_ORDER,
  YOGINI_NEPALI_NAMES,
  DASHA_NEPALI_NAMES
};
