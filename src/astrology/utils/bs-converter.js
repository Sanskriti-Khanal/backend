/**
 * BS (Bikram Sambat) to AD Date Converter
 * 
 * Converts BS dates to AD dates and vice versa
 * BS year typically starts around mid-April (Baisakh 1st)
 */

/**
 * Convert BS year to AD year
 * BS year = AD year + 56 or 57 (depending on date)
 * BS 2080 ≈ AD 2023-2024
 * 
 * @param {number} bsYear - BS year
 * @returns {number} AD year (approximate)
 */
function bsYearToAdYear(bsYear) {
  // BS year is approximately AD year + 56-57
  // For year start (Baisakh 1st), use AD year = BS year - 56
  return bsYear - 56;
}

/**
 * Get the AD date for BS year start (Baisakh 1st)
 * BS year typically starts around mid-April
 * 
 * @param {number} bsYear - BS year
 * @returns {Object} {year, month, day} in AD calendar
 */
function getBSYearStartDate(bsYear) {
  const adYear = bsYearToAdYear(bsYear);
  
  // BS year starts on Baisakh 1st, which is typically around April 13-15
  // For simplicity, we'll use April 14 as the standard start date
  // This can be adjusted based on actual BS calendar calculations if needed
  return {
    year: adYear,
    month: 4, // April
    day: 14   // Approximate start date (Baisakh 1st)
  };
}

/**
 * Convert BS date to AD date
 * 
 * @param {number} bsYear - BS year
 * @param {number} bsMonth - BS month (1-12)
 * @param {number} bsDay - BS day
 * @returns {Object} {year, month, day} in AD calendar
 */
function bsToAd(bsYear, bsMonth, bsDay) {
  // This is a simplified conversion
  // For accurate conversion, would need a full BS calendar library
  const adYear = bsYearToAdYear(bsYear);
  
  // BS months: Baisakh (1), Jestha (2), Ashadh (3), Shrawan (4), Bhadra (5), 
  // Ashwin (6), Kartik (7), Mangsir (8), Poush (9), Magh (10), Falgun (11), Chaitra (12)
  
  // Approximate month mapping (BS month 1 = April, BS month 12 = March)
  let adMonth = bsMonth + 3; // Baisakh (1) = April (4)
  let adYearFinal = adYear;
  
  if (adMonth > 12) {
    adMonth -= 12;
    adYearFinal += 1;
  }
  
  return {
    year: adYearFinal,
    month: adMonth,
    day: bsDay
  };
}

module.exports = {
  bsYearToAdYear,
  getBSYearStartDate,
  bsToAd
};


