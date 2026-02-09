import {
  BirthDetails,
  PlanetPosition,
  PlanetaryDignity,
} from '../../types/astrology.types';
import { NakshatraService } from './nakshatra.service';

/**
 * Chart Service
 * Calculates planetary positions and chart data
 * 
 * NOTE: This is a placeholder structure. For production, you should:
 * 1. Use Swiss Ephemeris library (swisseph npm package)
 * 2. Or call an external astrology API
 * 3. Or use Python PyJHora via child_process
 */
export class ChartService {
  private nakshatraService: NakshatraService;

  constructor() {
    this.nakshatraService = new NakshatraService();
  }

  /**
   * Calculate complete Vedic chart
   * 
   * TODO: Integrate with Swiss Ephemeris or external service
   * For now, this provides the structure - actual calculations need Swiss Ephemeris
   */
  async calculateChart(
    birthDetails: BirthDetails
  ): Promise<{
    planets: PlanetPosition[];
    ascendant: number;
    ascendantSign: string;
    houses: number[];
  }> {
    // TODO: Replace with actual Swiss Ephemeris calculation
    // For now, returning structure that shows what's needed
    
    // This would normally call Swiss Ephemeris to get:
    // - Planetary longitudes (sidereal with Lahiri ayanamsa)
    // - House cusps
    // - Ascendant
    
    // Placeholder - replace with actual calculation
    const planets = await this.calculatePlanetaryPositions(birthDetails);
    const { ascendant, houses } = await this.calculateHouses(birthDetails);

    return {
      planets,
      ascendant,
      ascendantSign: this.getSignName(Math.floor(ascendant / 30)),
      houses,
    };
  }

  /**
   * Calculate planetary positions
   * TODO: Integrate with Swiss Ephemeris
   */
  private async calculatePlanetaryPositions(
    birthDetails: BirthDetails
  ): Promise<PlanetPosition[]> {
    // TODO: Call Swiss Ephemeris library here
    // For now, returning empty array as placeholder
    
    // Example structure of what Swiss Ephemeris would return:
    const planetNames = [
      'Sun',
      'Moon',
      'Mars',
      'Mercury',
      'Jupiter',
      'Venus',
      'Saturn',
      'Rahu',
      'Ketu',
    ];

    // Placeholder - replace with actual Swiss Ephemeris call
    // const swisseph = require('swisseph');
    // const positions = swisseph.calculate(birthDetails);

    return [];
  }

  /**
   * Calculate house cusps and ascendant
   * TODO: Integrate with Swiss Ephemeris house calculation
   */
  private async calculateHouses(
    birthDetails: BirthDetails
  ): Promise<{ ascendant: number; houses: number[] }> {
    // TODO: Call Swiss Ephemeris house calculation
    // For now, returning placeholder
    
    return {
      ascendant: 0,
      houses: Array(12).fill(0), // 12 house cusps
    };
  }

  /**
   * Calculate planetary dignity
   */
  calculateDignity(
    planetName: string,
    sign: number,
    longitude: number
  ): PlanetaryDignity {
    const exaltationSigns: Record<string, number> = {
      Sun: 0, // Aries
      Moon: 1, // Taurus
      Mercury: 5, // Virgo
      Venus: 11, // Pisces
      Mars: 9, // Capricorn
      Jupiter: 3, // Cancer
      Saturn: 6, // Libra
      Rahu: 2, // Gemini
      Ketu: 8, // Sagittarius
    };

    const debilitationSigns: Record<string, number> = {
      Sun: 6, // Libra
      Moon: 7, // Scorpio
      Mercury: 11, // Pisces
      Venus: 5, // Virgo
      Mars: 3, // Cancer
      Jupiter: 9, // Capricorn
      Saturn: 0, // Aries
      Rahu: 8, // Sagittarius
      Ketu: 2, // Gemini
    };

    const ownSigns: Record<string, number[]> = {
      Sun: [4], // Leo
      Moon: [3], // Cancer
      Mercury: [2, 5], // Gemini, Virgo
      Venus: [1, 6], // Taurus, Libra
      Mars: [0, 7], // Aries, Scorpio
      Jupiter: [8, 11], // Sagittarius, Pisces
      Saturn: [9, 10], // Capricorn, Aquarius
    };

    if (exaltationSigns[planetName] === sign) {
      return PlanetaryDignity.EXALTED;
    }

    if (debilitationSigns[planetName] === sign) {
      return PlanetaryDignity.DEBILITATED;
    }

    if (ownSigns[planetName]?.includes(sign)) {
      return PlanetaryDignity.OWN_SIGN;
    }

    return PlanetaryDignity.NEUTRAL_SIGN;
  }

  /**
   * Check if planet is combust (too close to Sun)
   */
  isCombust(planetName: string, planetLongitude: number, sunLongitude: number): boolean {
    if (planetName === 'Sun') return false;

    const combustOrbs: Record<string, number> = {
      Mercury: 8, // degrees
      Venus: 10,
      Mars: 17,
      Jupiter: 11,
      Saturn: 15,
    };

    const orb = combustOrbs[planetName] || 0;
    if (orb === 0) return false;

    const diff = Math.abs(planetLongitude - sunLongitude);
    const normalizedDiff = Math.min(diff, 360 - diff);

    return normalizedDiff <= orb;
  }

  /**
   * Get sign name from index (0-11)
   */
  private getSignName(signIndex: number): string {
    const signs = [
      'Aries',
      'Taurus',
      'Gemini',
      'Cancer',
      'Leo',
      'Virgo',
      'Libra',
      'Scorpio',
      'Sagittarius',
      'Capricorn',
      'Aquarius',
      'Pisces',
    ];
    return signs[signIndex % 12];
  }

  /**
   * Calculate house from longitude
   */
  calculateHouse(longitude: number, houseCusps: number[]): number {
    for (let i = 0; i < 12; i++) {
      const currentCusp = houseCusps[i];
      const nextCusp = houseCusps[(i + 1) % 12];

      if (nextCusp > currentCusp) {
        if (longitude >= currentCusp && longitude < nextCusp) {
          return i + 1;
        }
      } else {
        // House crosses 0° Aries
        if (longitude >= currentCusp || longitude < nextCusp) {
          return i + 1;
        }
      }
    }
    return 1; // Default to first house
  }
}



