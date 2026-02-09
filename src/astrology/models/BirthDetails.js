/**
 * BirthDetails Model
 * 
 * Represents birth information for kundali calculation
 */

class BirthDetails {
  constructor(data) {
    this.name = data.name || null;
    this.gender = data.gender || null;
    this.dateAd = data.date_ad || null;
    this.time = data.time || null;
    this.location = data.location || null;
  }

  /**
   * Validate birth details
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.name) {
      errors.push("'name' is required");
    }

    if (!this.dateAd) {
      errors.push("'date_ad' is required");
    } else {
      const { year, month, day } = this.dateAd;
      if (!year || !month || !day) {
        errors.push("'date_ad.year', 'date_ad.month', and 'date_ad.day' are required");
      }
    }

    if (!this.time) {
      errors.push("'time' is required");
    } else {
      const { hour, minute } = this.time;
      if (hour === undefined || minute === undefined) {
        errors.push("'time.hour' and 'time.minute' are required");
      }
    }

    if (!this.location) {
      errors.push("'location' is required");
    } else {
      const { cityName, countryName, timezone } = this.location;
      if (!cityName || !countryName || !timezone) {
        errors.push("'location.cityName', 'location.countryName', and 'location.timezone' are required");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get normalized birth details for calculation
   * @returns {Object} Normalized birth details
   */
  getNormalized() {
    return {
      name: this.name,
      gender: this.gender,
      year: this.dateAd.year,
      month: this.dateAd.month,
      day: this.dateAd.day,
      hour: this.time.hour,
      minute: this.time.minute,
      cityName: this.location.cityName,
      countryName: this.location.countryName,
      timezone: this.location.timezone,
      latitude: this.location.latitude,
      longitude: this.location.longitude
    };
  }
}

module.exports = BirthDetails;










