/**
 * Complete Yoga Calculator with all major Vedic Yogas
 * Only shows yoga if user actually has it based on exact house positions
 */
class YogaCalculator {
  
  /**
   * Main function to calculate all yogas
   * @param {Array} planetsArray - Array of planet objects [{name, sign, house, nakshatra}]
   * @returns {Array} - Array of yoga objects found
   */
  calculateYogas(planetsArray) {
    const planets = this.arrayToObject(planetsArray);
    const yogas = [];
    
    // 1. Raj Yogas (Wealth & Power)
    yogas.push(...this.calculateRajYogas(planets));
    
    // 2. Dhana Yogas (Wealth)
    yogas.push(...this.calculateDhanaYogas(planets));
    
    // 3. Panch Mahapurush Yogas (5 Great Person Yogas)
    yogas.push(...this.calculatePanchMahapurushYogas(planets));
    
    // 4. Planetary Combination Yogas
    yogas.push(...this.calculatePlanetaryYogas(planets));
    
    // 5. Bhadra Yoga (Fortune)
    yogas.push(...this.calculateBhadraYoga(planets));
    
    // 6. Dosha Yogas
    yogas.push(...this.calculateDoshaYogas(planets));
    
    // 7. Special Yogas
    yogas.push(...this.calculateSpecialYogas(planets));
    
    // 8. Nakshatra Yogas
    yogas.push(...this.calculateNakshatraYogas(planetsArray));
    
    return yogas.filter(y => y !== null);
  }
  
  // ========== 1. RAJ YOGAS ==========
  calculateRajYogas(planets) {
    const yogas = [];
    const benefics = ['jupiter', 'venus', 'mercury', 'moon'];
    
    // Raj Yoga: Benefic in Kendra(1,4,7,10) or Trikona(1,5,9)
    const rajYogaPlanets = benefics.filter(b => {
      const p = planets[b];
      return p && [1,4,7,10,5,9].includes(p.house);
    });
    
    if (rajYogaPlanets.length > 0) {
      yogas.push({
        name: 'Raj Yoga',
        type: 'raj_yoga',
        description: `${rajYogaPlanets.map(p => this.capitalize(p)).join(', ')} in favorable house for success and power`,
        strength: 'high'
      });
    }
    
    // Adhi Yoga: All benefics in 6,7,8 houses from Moon
    if (planets.moon) {
      const moonHouse = planets.moon.house;
      const housesFromMoon = [6,7,8].map(h => (h + moonHouse - 1) % 12 + 1);
      const beneficsInTheseHouses = benefics.filter(b => {
        const p = planets[b];
        return p && housesFromMoon.includes(p.house);
      });
      
      if (beneficsInTheseHouses.length >= 3) {
        yogas.push({
          name: 'Adhi Yoga',
          type: 'raj_yoga',
          description: 'Multiple benefics in 6th, 7th, 8th from Moon - indicates wealth',
          strength: 'high'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== 2. DHANA YOGAS ==========
  calculateDhanaYogas(planets) {
    const yogas = [];
    
    // Jupiter in 2nd, 5th, 9th, 11th houses
    if (planets.jupiter) {
      if ([2,5,9,11].includes(planets.jupiter.house)) {
        yogas.push({
          name: 'Dhana Yoga',
          type: 'wealth_yoga',
          description: `Jupiter in ${this.ordinal(planets.jupiter.house)} house brings wealth and prosperity`,
          strength: 'medium'
        });
      }
    }
    
    // Venus in 2nd, 5th, 11th houses
    if (planets.venus) {
      if ([2,5,11].includes(planets.venus.house)) {
        yogas.push({
          name: 'Lakshmi Yoga',
          type: 'wealth_yoga',
          description: `Venus in ${this.ordinal(planets.venus.house)} house brings luxury and material comforts`,
          strength: 'medium'
        });
      }
    }
    
    // Sun in 10th or 11th house
    if (planets.sun) {
      if ([10,11].includes(planets.sun.house)) {
        yogas.push({
          name: 'Surya Dhana Yoga',
          type: 'wealth_yoga',
          description: `Sun in ${this.ordinal(planets.sun.house)} house brings wealth through authority`,
          strength: 'medium'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== 3. PANCH MAHAPURUSH YOGAS ==========
  calculatePanchMahapurushYogas(planets) {
    const yogas = [];
    
    // 1. Ruchaka Yoga: Mars in own sign (Aries, Scorpio) or exalted (Capricorn)
    if (planets.mars) {
      const marsSign = planets.mars.sign.toLowerCase();
      if (['aries', 'scorpio', 'capricorn'].includes(marsSign)) {
        yogas.push({
          name: 'Ruchaka Yoga',
          type: 'mahapurush_yoga',
          description: 'Mars in own or exalted sign - gives courage and leadership',
          strength: 'high'
        });
      }
    }
    
    // 2. Bhadra Yoga: Mercury in own sign (Gemini, Virgo) or exalted (Virgo)
    if (planets.mercury) {
      const mercurySign = planets.mercury.sign.toLowerCase();
      if (['gemini', 'virgo'].includes(mercurySign)) {
        yogas.push({
          name: 'Bhadra Yoga',
          type: 'mahapurush_yoga',
          description: 'Mercury in own sign - gives intelligence and communication skills',
          strength: 'high'
        });
      }
    }
    
    // 3. Hamsa Yoga: Jupiter in own sign (Sagittarius, Pisces) or exalted (Cancer)
    if (planets.jupiter) {
      const jupiterSign = planets.jupiter.sign.toLowerCase();
      if (['sagittarius', 'pisces', 'cancer'].includes(jupiterSign)) {
        yogas.push({
          name: 'Hamsa Yoga',
          type: 'mahapurush_yoga',
          description: 'Jupiter in own or exalted sign - gives wisdom and spirituality',
          strength: 'high'
        });
      }
    }
    
    // 4. Malavya Yoga: Venus in own sign (Taurus, Libra) or exalted (Pisces)
    if (planets.venus) {
      const venusSign = planets.venus.sign.toLowerCase();
      if (['taurus', 'libra', 'pisces'].includes(venusSign)) {
        yogas.push({
          name: 'Malavya Yoga',
          type: 'mahapurush_yoga',
          description: 'Venus in own or exalted sign - gives artistic talents and luxury',
          strength: 'high'
        });
      }
    }
    
    // 5. Sasa Yoga: Saturn in own sign (Capricorn, Aquarius) or exalted (Libra)
    if (planets.saturn) {
      const saturnSign = planets.saturn.sign.toLowerCase();
      if (['capricorn', 'aquarius', 'libra'].includes(saturnSign)) {
        yogas.push({
          name: 'Sasa Yoga',
          type: 'mahapurush_yoga',
          description: 'Saturn in own or exalted sign - gives discipline and longevity',
          strength: 'high'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== 4. PLANETARY COMBINATION YOGAS ==========
  calculatePlanetaryYogas(planets) {
    const yogas = [];
    
    // Chandra-Mangal Yoga: Moon and Mars in same house
    if (planets.moon && planets.mars && 
        planets.moon.house === planets.mars.house) {
      yogas.push({
        name: 'Chandra-Mangal Yoga',
        type: 'planetary_yoga',
        description: 'Moon and Mars together - gives courage and energy',
        strength: 'medium'
      });
    }
    
    // Budha-Aditya Yoga: Mercury and Sun in same house
    if (planets.mercury && planets.sun && 
        planets.mercury.house === planets.sun.house) {
      yogas.push({
        name: 'Budha-Aditya Yoga',
        type: 'planetary_yoga',
        description: 'Mercury and Sun together - gives intelligence and fame',
        strength: 'medium'
      });
    }
    
    // Gajakesari Yoga: Jupiter in Kendra(1,4,7,10) from Moon
    if (planets.jupiter && planets.moon) {
      const moonHouse = planets.moon.house;
      const kendraFromMoon = [1,4,7,10].map(h => 
        (h + moonHouse - 1) % 12 + 1
      );
      
      if (kendraFromMoon.includes(planets.jupiter.house)) {
        yogas.push({
          name: 'Gajakesari Yoga',
          type: 'planetary_yoga',
          description: 'Jupiter in Kendra from Moon - gives wisdom and respect',
          strength: 'high'
        });
      }
    }
    
    // Sunapha, Anapha, Duradhara Yogas (planets in 2nd, 12th, 5th from Moon)
    if (planets.moon) {
      const moonHouse = planets.moon.house;
      const secondFromMoon = (moonHouse % 12) + 1;
      const twelfthFromMoon = (moonHouse + 11) % 12 + 1;
      const fifthFromMoon = (moonHouse + 4) % 12 + 1;
      
      const planetsInSecond = this.getPlanetsInHouse(planets, secondFromMoon);
      const planetsInTwelfth = this.getPlanetsInHouse(planets, twelfthFromMoon);
      const planetsInFifth = this.getPlanetsInHouse(planets, fifthFromMoon);
      
      if (planetsInSecond.length > 0) {
        yogas.push({
          name: 'Sunapha Yoga',
          type: 'moon_based',
          description: `Planet(s) in 2nd from Moon: ${planetsInSecond.join(', ')} - gives prosperity`,
          strength: 'medium'
        });
      }
      
      if (planetsInTwelfth.length > 0) {
        yogas.push({
          name: 'Anapha Yoga',
          type: 'moon_based',
          description: `Planet(s) in 12th from Moon: ${planetsInTwelfth.join(', ')} - gives spiritual growth`,
          strength: 'medium'
        });
      }
      
      if (planetsInFifth.length > 0) {
        yogas.push({
          name: 'Duradhara Yoga',
          type: 'moon_based',
          description: `Planet(s) in 5th from Moon: ${planetsInFifth.join(', ')} - gives happiness`,
          strength: 'medium'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== 5. BHADRA YOGA ==========
  calculateBhadraYoga(planets) {
    const yogas = [];
    
    // Bhadra Yoga: Mercury in own sign (Gemini, Virgo) in Kendra(1,4,7,10) or Trikona(1,5,9)
    if (planets.mercury) {
      const mercurySign = planets.mercury.sign.toLowerCase();
      if (['gemini', 'virgo'].includes(mercurySign)) {
        if ([1,4,7,10,5,9].includes(planets.mercury.house)) {
          yogas.push({
            name: 'Bhadra Mahapurush Yoga',
            type: 'mahapurush_yoga',
            description: 'Mercury in own sign in favorable house - gives excellent intelligence',
            strength: 'very high'
          });
        }
      }
    }
    
    return yogas;
  }
  
  // ========== 6. DOSHA YOGAS ==========
  calculateDoshaYogas(planets) {
    const yogas = [];
    
    // Mangal Dosha: Mars in 1,4,7,8,12 houses
    if (planets.mars && [1,4,7,8,12].includes(planets.mars.house)) {
      const severity = planets.mars.house === 1 ? 'high' : 
                       planets.mars.house === 7 ? 'high' : 'medium';
      yogas.push({
        name: 'Mangal Dosha',
        type: 'dosha_yoga',
        description: `Mars in ${this.ordinal(planets.mars.house)} house affects relationships`,
        severity: severity
      });
    }
    
    // Kaal Sarp Dosha: All planets between Rahu and Ketu
    if (planets.rahu && planets.ketu) {
      const rahuHouse = planets.rahu.house;
      const ketuHouse = planets.ketu.house;
      
      let planetsBetween = 0;
      for (const planetName in planets) {
        if (planetName === 'rahu' || planetName === 'ketu') continue;
        const planet = planets[planetName];
        if (this.isBetweenHouses(planet.house, rahuHouse, ketuHouse)) {
          planetsBetween++;
        }
      }
      
      if (planetsBetween >= 7) { // All 7 planets
        yogas.push({
          name: 'Kaal Sarp Dosha',
          type: 'dosha_yoga',
          description: 'All planets between Rahu and Ketu - indicates obstacles',
          severity: 'high'
        });
      } else if (planetsBetween >= 5) {
        yogas.push({
          name: 'Partial Kaal Sarp Dosha',
          type: 'dosha_yoga',
          description: 'Most planets between Rahu and Ketu',
          severity: 'medium'
        });
      }
    }
    
    // Pitru Dosha: Sun and Saturn together or in 6/8/12 relation
    if (planets.sun && planets.saturn) {
      if (planets.sun.house === planets.saturn.house) {
        yogas.push({
          name: 'Pitru Dosha',
          type: 'dosha_yoga',
          description: 'Sun and Saturn together - ancestral issues',
          severity: 'medium'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== 7. SPECIAL YOGAS ==========
  calculateSpecialYogas(planets) {
    const yogas = [];
    
    // Kemadruma Yoga: Moon alone (no planets in 2nd and 12th houses)
    if (planets.moon) {
      const moonHouse = planets.moon.house;
      const secondHouse = (moonHouse % 12) + 1;
      const twelfthHouse = (moonHouse + 11) % 12 + 1;
      
      let hasPlanetBeside = false;
      for (const planetName in planets) {
        if (planetName === 'moon') continue;
        const planet = planets[planetName];
        if (planet.house === secondHouse || planet.house === twelfthHouse) {
          hasPlanetBeside = true;
          break;
        }
      }
      
      if (!hasPlanetBeside) {
        yogas.push({
          name: 'Kemadruma Yoga',
          type: 'special_yoga',
          description: 'Moon without planets on either side - may feel lonely',
          severity: 'medium'
        });
      }
    }
    
    // Vasumati Yoga: Benefics in 11th house
    const beneficsIn11th = ['jupiter', 'venus', 'mercury', 'moon'].filter(b => {
      const p = planets[b];
      return p && p.house === 11;
    });
    
    if (beneficsIn11th.length >= 2) {
      yogas.push({
        name: 'Vasumati Yoga',
        type: 'special_yoga',
        description: 'Multiple benefics in 11th house - great wealth',
        strength: 'high'
      });
    }
    
    // Shubha Kartari: Moon flanked by benefics
    // Papa Kartari: Moon flanked by malefics
    if (planets.moon) {
      const moonHouse = planets.moon.house;
      const leftHouse = (moonHouse + 11) % 12 + 1;
      const rightHouse = (moonHouse % 12) + 1;
      
      const leftPlanets = this.getPlanetsInHouse(planets, leftHouse);
      const rightPlanets = this.getPlanetsInHouse(planets, rightHouse);
      
      const benefics = ['jupiter', 'venus', 'mercury', 'moon'];
      const malefics = ['saturn', 'mars', 'sun', 'rahu', 'ketu'];
      
      const leftBenefics = leftPlanets.filter(p => benefics.includes(p.toLowerCase()));
      const leftMalefics = leftPlanets.filter(p => malefics.includes(p.toLowerCase()));
      const rightBenefics = rightPlanets.filter(p => benefics.includes(p.toLowerCase()));
      const rightMalefics = rightPlanets.filter(p => malefics.includes(p.toLowerCase()));
      
      if ((leftBenefics.length > 0 && rightBenefics.length > 0) ||
          (leftBenefics.length > 0 && rightPlanets.length === 0) ||
          (rightBenefics.length > 0 && leftPlanets.length === 0)) {
        yogas.push({
          name: 'Shubha Kartari Yoga',
          type: 'special_yoga',
          description: 'Moon flanked by benefics - good support',
          strength: 'medium'
        });
      }
      
      if ((leftMalefics.length > 0 && rightMalefics.length > 0) ||
          (leftMalefics.length > 0 && rightPlanets.length === 0) ||
          (rightMalefics.length > 0 && leftPlanets.length === 0)) {
        yogas.push({
          name: 'Papa Kartari Yoga',
          type: 'special_yoga',
          description: 'Moon flanked by malefics - obstacles',
          severity: 'medium'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== 8. NAKSHATRA YOGAS ==========
  calculateNakshatraYogas(planetsArray) {
    const yogas = [];
    const nakshatras = {};
    
    // Count planets in each nakshatra
    planetsArray.forEach(p => {
      if (p.nakshatra) {
        nakshatras[p.nakshatra] = (nakshatras[p.nakshatra] || 0) + 1;
      }
    });
    
    // Vesi Yoga: Planets in successive nakshatras
    // Vasi Yoga: Planets in alternate nakshatras
    // Obhayachari Yoga: Planets in 7th nakshatra
    
    // Simple: Multiple planets in same nakshatra
    for (const [nakshatra, count] of Object.entries(nakshatras)) {
      if (count >= 3) {
        yogas.push({
          name: 'Nakshatra Yoga',
          type: 'nakshatra_yoga',
          description: `${count} planets in ${nakshatra} nakshatra`,
          strength: 'medium'
        });
      }
    }
    
    return yogas;
  }
  
  // ========== HELPER FUNCTIONS ==========
  
  arrayToObject(planetsArray) {
    const obj = {};
    planetsArray.forEach(p => {
      obj[p.name.toLowerCase()] = p;
    });
    return obj;
  }
  
  getPlanetsInHouse(planets, houseNumber) {
    const planetsInHouse = [];
    for (const planetName in planets) {
      if (planets[planetName].house === houseNumber) {
        planetsInHouse.push(this.capitalize(planetName));
      }
    }
    return planetsInHouse;
  }
  
  isBetweenHouses(house, startHouse, endHouse) {
    // Simplified check for zodiac order
    if (startHouse < endHouse) {
      return house >= startHouse && house <= endHouse;
    } else {
      return house >= startHouse || house <= endHouse;
    }
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YogaCalculator;
}