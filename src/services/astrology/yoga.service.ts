import type { Yoga, PlanetPosition } from '../../types/astrology.types';

/**
 * Yoga Service
 * Detects various Yogas (planetary combinations) in a chart
 */
export class YogaService {
  /**
   * Detect all yogas in a chart
   */
  detectYogas(planets: PlanetPosition[]): Yoga[] {
    const yogas: Yoga[] = [];

    // Convert planets array to map for easier access
    const planetMap = new Map<string, PlanetPosition>();
    planets.forEach((p) => {
      planetMap.set(p.name.toLowerCase(), p);
    });

    // Detect various yogas
    yogas.push(...this.detectRajYoga(planetMap));
    yogas.push(...this.detectDhanYoga(planetMap));
    yogas.push(...this.detectChandraMangalYoga(planetMap));
    yogas.push(...this.detectGajakesariYoga(planetMap));
    yogas.push(...this.detectBudhaAdityaYoga(planetMap));
    yogas.push(...this.detectKemadrumaYoga(planetMap));
    yogas.push(...this.detectVasumatiYoga(planetMap));
    yogas.push(...this.detectMalavyaYoga(planetMap));
    yogas.push(...this.detectShubhaKartariYoga(planetMap));
    yogas.push(...this.detectPapaKartariYoga(planetMap));

    return yogas;
  }

  /**
   * Raj Yoga: Benefic planets in Kendra (1,4,7,10) or Trikona (1,5,9)
   */
  private detectRajYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const kendraHouses = [1, 4, 7, 10];
    const trikonaHouses = [1, 5, 9];
    const beneficPlanets = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

    const kendraPlanets: string[] = [];
    const trikonaPlanets: string[] = [];

    planetMap.forEach((planet, name) => {
      if (beneficPlanets.includes(planet.name)) {
        if (kendraHouses.includes(planet.house)) {
          kendraPlanets.push(planet.name);
        }
        if (trikonaHouses.includes(planet.house)) {
          trikonaPlanets.push(planet.name);
        }
      }
    });

    if (kendraPlanets.length > 0 || trikonaPlanets.length > 0) {
      yogas.push({
        name: 'Raj Yoga',
        type: 'benefic',
        meaning:
          'Royal combination indicating success, prosperity, and high status',
        description:
          'Benefic planets in Kendra (angular houses) or Trikona (trine houses) create Raj Yoga, bringing authority, wealth, and recognition.',
        planets: [...kendraPlanets, ...trikonaPlanets],
        houses: [...kendraHouses, ...trikonaHouses],
        significance:
          'High position in society, wealth, authority, and success in career.',
      });
    }

    return yogas;
  }

  /**
   * Dhan Yoga: 2nd, 5th, 9th, 11th house lords in favorable positions
   */
  private detectDhanYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const wealthHouses = [2, 5, 9, 11];
    const beneficPlanets = ['Jupiter', 'Venus', 'Mercury'];

    const wealthPlanets: string[] = [];

    planetMap.forEach((planet, name) => {
      if (beneficPlanets.includes(planet.name)) {
        if (wealthHouses.includes(planet.house)) {
          wealthPlanets.push(planet.name);
        }
      }
    });

    if (wealthPlanets.length >= 2) {
      yogas.push({
        name: 'Dhan Yoga',
        type: 'benefic',
        meaning: 'Wealth and prosperity combination',
        description:
          'Benefic planets in wealth houses (2nd, 5th, 9th, 11th) create Dhan Yoga, bringing financial prosperity and material abundance.',
        planets: wealthPlanets,
        houses: wealthHouses,
        significance:
          'Financial success, accumulation of wealth, and material comforts.',
      });
    }

    return yogas;
  }

  /**
   * Chandra-Mangal Yoga: Moon and Mars conjunction
   */
  private detectChandraMangalYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const moon = planetMap.get('moon');
    const mars = planetMap.get('mars');

    if (moon && mars) {
      // Check if in same sign or adjacent signs (conjunction)
      const signDiff = Math.abs(moon.sign - mars.sign);
      if (signDiff === 0 || signDiff === 1 || signDiff === 11) {
        yogas.push({
          name: 'Chandra-Mangal Yoga',
          type: 'benefic',
          meaning: 'Moon-Mars combination bringing courage and success',
          description:
            'Moon and Mars in conjunction create Chandra-Mangal Yoga, bringing courage, determination, and success through action.',
          planets: ['Moon', 'Mars'],
          significance:
            'Courage, leadership, success in competitive fields, and material achievements.',
        });
      }
    }

    return yogas;
  }

  /**
   * Gajakesari Yoga: Jupiter and Moon in favorable positions
   */
  private detectGajakesariYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const jupiter = planetMap.get('jupiter');
    const moon = planetMap.get('moon');

    if (jupiter && moon) {
      // Jupiter in Kendra (1,4,7,10) from Moon
      const moonHouse = moon.house;
      const jupiterHouse = jupiter.house;
      const kendraFromMoon = [1, 4, 7, 10].map((h) => ((moonHouse + h - 1) % 12) + 1);

      if (kendraFromMoon.includes(jupiterHouse)) {
        yogas.push({
          name: 'Gajakesari Yoga',
          type: 'benefic',
          meaning: 'Jupiter-Moon combination bringing wisdom and prosperity',
          description:
            'Jupiter in Kendra from Moon creates Gajakesari Yoga, bringing wisdom, knowledge, wealth, and high status.',
          planets: ['Jupiter', 'Moon'],
          significance:
            'Wisdom, knowledge, wealth, respect, and success in education and spirituality.',
        });
      }
    }

    return yogas;
  }

  /**
   * Budha-Aditya Yoga: Mercury and Sun conjunction
   */
  private detectBudhaAdityaYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const mercury = planetMap.get('mercury');
    const sun = planetMap.get('sun');

    if (mercury && sun) {
      // Mercury is always close to Sun (within 28 degrees)
      const signDiff = Math.abs(mercury.sign - sun.sign);
      if (signDiff === 0 || signDiff === 1) {
        yogas.push({
          name: 'Budha-Aditya Yoga',
          type: 'benefic',
          meaning: 'Mercury-Sun combination bringing intelligence and communication',
          description:
            'Mercury and Sun in conjunction create Budha-Aditya Yoga, bringing intelligence, communication skills, and success in business.',
          planets: ['Mercury', 'Sun'],
          significance:
            'Intelligence, communication, business success, and administrative abilities.',
        });
      }
    }

    return yogas;
  }

  /**
   * Kemadruma Yoga: Moon without planets on either side
   */
  private detectKemadrumaYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const moon = planetMap.get('moon');

    if (moon) {
      const moonSign = moon.sign;
      let hasPlanetBefore = false;
      let hasPlanetAfter = false;

      planetMap.forEach((planet, name) => {
        if (name !== 'moon') {
          const planetSign = planet.sign;
          const signBefore = (moonSign - 1 + 12) % 12;
          const signAfter = (moonSign + 1) % 12;

          if (planetSign === signBefore) hasPlanetBefore = true;
          if (planetSign === signAfter) hasPlanetAfter = true;
        }
      });

      if (!hasPlanetBefore && !hasPlanetAfter) {
        yogas.push({
          name: 'Kemadruma Yoga',
          type: 'malefic',
          meaning: 'Moon isolated, causing emotional instability',
          description:
            'Moon without planets on either side creates Kemadruma Yoga, causing emotional instability, financial difficulties, and lack of support.',
          planets: ['Moon'],
          significance:
            'Emotional challenges, financial instability, and lack of support from others.',
        });
      }
    }

    return yogas;
  }

  /**
   * Vasumati Yoga: Benefic planets in 11th house
   */
  private detectVasumatiYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const beneficPlanets = ['Jupiter', 'Venus', 'Mercury'];
    const eleventhHousePlanets: string[] = [];

    planetMap.forEach((planet, name) => {
      if (beneficPlanets.includes(planet.name) && planet.house === 11) {
        eleventhHousePlanets.push(planet.name);
      }
    });

    if (eleventhHousePlanets.length > 0) {
      yogas.push({
        name: 'Vasumati Yoga',
        type: 'benefic',
        meaning: 'Wealth through benefic planets in 11th house',
        description:
          'Benefic planets in 11th house create Vasumati Yoga, bringing gains, income, and fulfillment of desires.',
        planets: eleventhHousePlanets,
        houses: [11],
        significance: 'Wealth, gains, income, and fulfillment of desires.',
      });
    }

    return yogas;
  }

  /**
   * Malavya Yoga: Benefic planets in specific houses
   */
  private detectMalavyaYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const beneficPlanets = ['Jupiter', 'Venus'];
    const favorableHouses = [2, 5, 9, 10, 11];
    const favorablePlanets: string[] = [];

    planetMap.forEach((planet, name) => {
      if (beneficPlanets.includes(planet.name)) {
        if (favorableHouses.includes(planet.house)) {
          favorablePlanets.push(planet.name);
        }
      }
    });

    if (favorablePlanets.length >= 2) {
      yogas.push({
        name: 'Malavya Yoga',
        type: 'benefic',
        meaning: 'Royal status through benefic placements',
        description:
          'Benefic planets in favorable houses create Malavya Yoga, bringing royal status, wealth, and high position.',
        planets: favorablePlanets,
        houses: favorableHouses,
        significance:
          'Royal status, wealth, high position, and material prosperity.',
      });
    }

    return yogas;
  }

  /**
   * Shubha Kartari Yoga: Benefic planets on both sides of Moon
   */
  private detectShubhaKartariYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const moon = planetMap.get('moon');

    if (moon) {
      const moonSign = moon.sign;
      const beneficPlanets = ['Jupiter', 'Venus', 'Mercury'];
      let hasBeneficBefore = false;
      let hasBeneficAfter = false;

      planetMap.forEach((planet, name) => {
        if (beneficPlanets.includes(planet.name)) {
          const planetSign = planet.sign;
          const signBefore = (moonSign - 1 + 12) % 12;
          const signAfter = (moonSign + 1) % 12;

          if (planetSign === signBefore) hasBeneficBefore = true;
          if (planetSign === signAfter) hasBeneficAfter = true;
        }
      });

      if (hasBeneficBefore && hasBeneficAfter) {
        yogas.push({
          name: 'Shubha Kartari Yoga',
          type: 'benefic',
          meaning: 'Benefic planets protecting Moon',
          description:
            'Benefic planets on both sides of Moon create Shubha Kartari Yoga, bringing protection, support, and favorable outcomes.',
          planets: ['Moon'],
          significance:
            'Protection, support, favorable outcomes, and emotional stability.',
        });
      }
    }

    return yogas;
  }

  /**
   * Papa Kartari Yoga: Malefic planets on both sides of Moon
   */
  private detectPapaKartariYoga(
    planetMap: Map<string, PlanetPosition>
  ): Yoga[] {
    const yogas: Yoga[] = [];
    const moon = planetMap.get('moon');

    if (moon) {
      const moonSign = moon.sign;
      const maleficPlanets = ['Saturn', 'Mars', 'Rahu', 'Ketu'];
      let hasMaleficBefore = false;
      let hasMaleficAfter = false;

      planetMap.forEach((planet, name) => {
        if (maleficPlanets.includes(planet.name)) {
          const planetSign = planet.sign;
          const signBefore = (moonSign - 1 + 12) % 12;
          const signAfter = (moonSign + 1) % 12;

          if (planetSign === signBefore) hasMaleficBefore = true;
          if (planetSign === signAfter) hasMaleficAfter = true;
        }
      });

      if (hasMaleficBefore && hasMaleficAfter) {
        yogas.push({
          name: 'Papa Kartari Yoga',
          type: 'malefic',
          meaning: 'Malefic planets afflicting Moon',
          description:
            'Malefic planets on both sides of Moon create Papa Kartari Yoga, causing emotional challenges, obstacles, and difficulties.',
          planets: ['Moon'],
          significance:
            'Emotional challenges, obstacles, difficulties, and mental stress.',
        });
      }
    }

    return yogas;
  }
}



