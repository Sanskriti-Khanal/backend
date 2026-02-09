/**
 * Location Model
 * 
 * Represents location data from database
 */

class Location {
  constructor(data) {
    this.cityId = data.cityID || data.cityId || null;
    this.cityName = data.cityName || data.Cityname || null;
    this.country = data.country || data.Country || null;
    this.latitude = data.latitude || null;
    this.latitudeDir = data.latitudeDir || data.LatDir || null;
    this.longitude = data.longitude || null;
    this.longitudeDir = data.longitudeDir || data.LonDir || null;
    this.state = data.state || data.State || null;
  }
}

class Country {
  constructor(data) {
    this.countryId = data.countryID || data.countryId || null;
    this.name = data.name || data.Names || null;
    this.gmt = data.gmt || data.Gmt || null;
    this.timezone = data.timezone || data.Timezone || null;
    this.timezoneDes = data.timezoneDes || data.TimezoneDes || null;
  }
}

module.exports = { Location, Country };










