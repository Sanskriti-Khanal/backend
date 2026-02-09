/**
 * Astro Core - Core Mathematical Components
 * 
 * Provides fundamental astronomical calculations without external libraries:
 * - Julian Date Calculations
 * - Sidereal Time Calculation
 * - Coordinate Transformations
 * - Ayanamsa (Lahiri) Calculation
 * 
 * Based on algorithms from:
 * - Jean Meeus "Astronomical Algorithms"
 * - Surya Siddhanta (traditional Indian astronomy)
 */

/**
 * Calculate Julian Day from Gregorian date
 * 
 * Algorithm from Jean Meeus "Astronomical Algorithms" Chapter 7
 * 
 * @param {number} year - Year (e.g., 1990)
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @param {number} second - Second (0-59), optional, defaults to 0
 * @returns {number} Julian Day (UT)
 */
function toJulianDate(year, month, day, hour, minute, second = 0) {
  // Convert to decimal day
  const decimalDay = day + (hour / 24.0) + (minute / 1440.0) + (second / 86400.0);
  
  // Handle January and February as months 13 and 14 of previous year
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  // Calculate Julian Day using Meeus formula
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  const jd = Math.floor(365.25 * (y + 4716)) +
             Math.floor(30.6001 * (m + 1)) +
             decimalDay +
             b -
             1524.5;
  
  return jd;
}

/**
 * Calculate Julian Day from Date object
 * 
 * @param {Date} date - JavaScript Date object
 * @returns {number} Julian Day (UT)
 */
function dateToJulianDate(date) {
  return toJulianDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1, // JavaScript months are 0-indexed
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

/**
 * Convert Julian Day to Gregorian date
 * 
 * @param {number} jd - Julian Day
 * @returns {Object} {year, month, day, hour, minute, second}
 */
function julianDateToDate(jd) {
  jd += 0.5;
  const Z = Math.floor(jd);
  const F = jd - Z;
  
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  const hours = (day - Math.floor(day)) * 24;
  const hour = Math.floor(hours);
  const minutes = (hours - hour) * 60;
  const minute = Math.floor(minutes);
  const seconds = (minutes - minute) * 60;
  const second = Math.floor(seconds);
  
  return {
    year: Math.floor(year),
    month: Math.floor(month),
    day: Math.floor(day),
    hour,
    minute,
    second
  };
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST)
 * 
 * Algorithm from Jean Meeus "Astronomical Algorithms" Chapter 12
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {number} GMST in hours (0-24)
 */
function getGMST(jdUt) {
  // Calculate T (Julian centuries since J2000.0)
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Calculate GMST in hours using Meeus formula
  const theta0 = 280.46061837 + 
                 360.98564736629 * (jdUt - 2451545.0) +
                 T * T * (0.000387933 - T / 38710000.0);
  
  // Normalize to 0-360 degrees, then convert to hours
  let theta0Degrees = theta0 % 360;
  if (theta0Degrees < 0) theta0Degrees += 360;
  
  return theta0Degrees / 15.0; // Convert degrees to hours
}

/**
 * Calculate Local Sidereal Time (LST)
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @param {number} longitude - Longitude in degrees (positive = East, negative = West)
 * @returns {number} LST in hours (0-24)
 */
function getLocalSiderealTime(jdUt, longitude) {
  const gmst = getGMST(jdUt);
  const lst = gmst + (longitude / 15.0); // Convert longitude to hours
  
  // Normalize to 0-24 hours
  let normalizedLst = lst % 24;
  if (normalizedLst < 0) normalizedLst += 24;
  
  return normalizedLst;
}

/**
 * Calculate Lahiri Ayanamsa
 * 
 * Based on Lahiri Ayanamsa formula
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {number} Ayanamsa in degrees
 */
function getLahiriAyanamsa(jdUt) {
  // T = Julian centuries since J2000.0
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Lahiri Ayanamsa formula
  // This is a simplified version - for production, use more precise formula
  const ayanamsa = 6.92416 + 
                    (T * 50.2564) + 
                    (T * T * 0.000222) +
                    (T * T * T * 0.0000003);
  
  return ayanamsa;
}

/**
 * Convert ecliptic coordinates to equatorial coordinates
 * 
 * @param {number} lambda - Ecliptic longitude in degrees
 * @param {number} beta - Ecliptic latitude in degrees
 * @param {number} epsilon - Obliquity of ecliptic in degrees (default ~23.4397°)
 * @returns {Object} {ra: rightAscension in degrees, dec: declination in degrees}
 */
function eclipticToEquatorial(lambda, beta, epsilon = 23.4392911) {
  const lambdaRad = (lambda * Math.PI) / 180;
  const betaRad = (beta * Math.PI) / 180;
  const epsilonRad = (epsilon * Math.PI) / 180;
  
  // Convert to radians
  const sinBeta = Math.sin(betaRad);
  const cosBeta = Math.cos(betaRad);
  const sinEpsilon = Math.sin(epsilonRad);
  const cosEpsilon = Math.cos(epsilonRad);
  const sinLambda = Math.sin(lambdaRad);
  const cosLambda = Math.cos(lambdaRad);
  
  // Calculate declination
  const sinDec = sinBeta * cosEpsilon + cosBeta * sinEpsilon * sinLambda;
  const dec = Math.asin(sinDec);
  
  // Calculate right ascension
  const y = sinLambda * cosEpsilon - Math.tan(betaRad) * sinEpsilon;
  const x = cosLambda;
  const ra = Math.atan2(y, x);
  
  // Convert to degrees
  return {
    ra: (ra * 180) / Math.PI,
    dec: (dec * 180) / Math.PI
  };
}

/**
 * Convert equatorial coordinates to horizontal coordinates
 * 
 * @param {number} ra - Right ascension in degrees
 * @param {number} dec - Declination in degrees
 * @param {number} latitude - Observer's latitude in degrees
 * @param {number} lst - Local sidereal time in hours
 * @returns {Object} {altitude: altitude in degrees, azimuth: azimuth in degrees}
 */
function equatorialToHorizontal(ra, dec, latitude, lst) {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  
  // Calculate hour angle
  const ha = (lst * 15 - ra) * Math.PI / 180; // Convert LST to degrees, then to radians
  
  // Calculate altitude
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + 
                 Math.cos(latRad) * Math.cos(decRad) * Math.cos(ha);
  const altitude = Math.asin(sinAlt);
  
  // Calculate azimuth
  const y = -Math.sin(ha) * Math.cos(decRad);
  const x = Math.cos(latRad) * Math.sin(decRad) - 
            Math.sin(latRad) * Math.cos(decRad) * Math.cos(ha);
  const azimuth = Math.atan2(y, x);
  
  // Convert to degrees and normalize
  let altDeg = (altitude * 180) / Math.PI;
  let azDeg = (azimuth * 180) / Math.PI;
  
  // Normalize azimuth to 0-360
  if (azDeg < 0) azDeg += 360;
  
  return {
    altitude: altDeg,
    azimuth: azDeg
  };
}

/**
 * Calculate obliquity of ecliptic
 * 
 * @param {number} jdUt - Julian Day (UT)
 * @returns {number} Obliquity in degrees
 */
function getObliquity(jdUt) {
  const T = (jdUt - 2451545.0) / 36525.0;
  
  // Formula from Meeus
  const U = T / 100.0;
  const epsilon = 23.4392911111 -
                   (4680.93 * U) / 3600.0 -
                   (1.55 * U * U) / 3600.0 +
                   (1999.25 * U * U * U) / 3600.0 -
                   (51.38 * U * U * U * U) / 3600.0 -
                   (249.67 * U * U * U * U * U) / 3600.0 -
                   (39.05 * U * U * U * U * U * U) / 3600.0 +
                   (7.12 * U * U * U * U * U * U * U) / 3600.0 +
                   (27.87 * U * U * U * U * U * U * U * U) / 3600.0 +
                   (5.79 * U * U * U * U * U * U * U * U * U) / 3600.0 +
                   (2.45 * U * U * U * U * U * U * U * U * U * U) / 3600.0;
  
  return epsilon;
}

/**
 * Normalize angle to 0-360 degrees
 * 
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle (0-360)
 */
function normalizeAngle(angle) {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Convert degrees to radians
 * 
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * 
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
function radToDeg(radians) {
  return (radians * 180) / Math.PI;
}

module.exports = {
  toJulianDate,
  dateToJulianDate,
  julianDateToDate,
  getGMST,
  getLocalSiderealTime,
  getLahiriAyanamsa,
  eclipticToEquatorial,
  equatorialToHorizontal,
  getObliquity,
  normalizeAngle,
  degToRad,
  radToDeg
};
