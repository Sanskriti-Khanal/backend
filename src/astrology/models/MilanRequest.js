/**
 * MilanRequest Model
 * 
 * Represents kundali milan (compatibility) request
 */

const BirthDetails = require('./BirthDetails');

class MilanRequest {
  constructor(data) {
    this.boy = data.boy ? new BirthDetails(data.boy) : null;
    this.girl = data.girl ? new BirthDetails(data.girl) : null;
  }

  /**
   * Validate milan request
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.boy) {
      errors.push("'boy' object is required");
    } else {
      const boyValidation = this.boy.validate();
      if (!boyValidation.valid) {
        errors.push(...boyValidation.errors.map(e => `boy.${e}`));
      }
    }

    if (!this.girl) {
      errors.push("'girl' object is required");
    } else {
      const girlValidation = this.girl.validate();
      if (!girlValidation.valid) {
        errors.push(...girlValidation.errors.map(e => `girl.${e}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = MilanRequest;










