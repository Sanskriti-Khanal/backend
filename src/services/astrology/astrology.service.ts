import type { AstrologyAnalysisRequest, AstrologyAnalysisResponse } from '../../types/astrology.types';
import { ChartService } from './chart.service';
import { NakshatraService } from './nakshatra.service';
import { DashaService } from './dasha.service';
import { YogaService } from './yoga.service';
import { DoshaService } from './dosha.service';
import { RecommendationService } from './recommendation.service';

/**
 * Main Astrology Service
 * Orchestrates all astrology calculations and analysis
 */
export class AstrologyService {
  private chartService: ChartService;
  private nakshatraService: NakshatraService;
  private dashaService: DashaService;
  private yogaService: YogaService;
  private doshaService: DoshaService;
  private recommendationService: RecommendationService;

  constructor() {
    this.chartService = new ChartService();
    this.nakshatraService = new NakshatraService();
    this.dashaService = new DashaService();
    this.yogaService = new YogaService();
    this.doshaService = new DoshaService();
    this.recommendationService = new RecommendationService();
  }

  /**
   * Perform complete astrology analysis
   */
  async analyzeChart(
    request: AstrologyAnalysisRequest
  ): Promise<AstrologyAnalysisResponse> {
    // 1. Calculate chart
    const chart = await this.chartService.calculateChart(request.birthDetails);

    // 2. Get Moon's nakshatra for Dasha calculation
    const moon = chart.planets.find((p) => p.name === 'Moon');
    if (!moon) {
      throw new Error('Moon position not found in chart');
    }

    // 3. Get nakshatra details
    const nakshatraDetails = this.nakshatraService.getNakshatraByIndex(
      moon.nakshatra
    );
    if (!nakshatraDetails) {
      throw new Error('Invalid nakshatra index');
    }

    // 4. Calculate Dasha
    const birthDate = new Date(
      `${request.birthDetails.date}T${request.birthDetails.time}`
    );
    const dasha = this.dashaService.calculateVimshottariDasha(
      moon.nakshatra,
      birthDate
    );

    // 5. Detect Yogas
    const yogas = this.yogaService.detectYogas(chart.planets);

    // 6. Analyze Doshas
    const doshas = this.doshaService.analyzeDoshas(chart.planets);

    // 7. Get recommendations
    const recommendations = await this.recommendationService.getRecommendations(
      chart.planets,
      doshas,
      yogas,
      request.category,
      dasha,
      nakshatraDetails.name
    );

    // 8. Organize planets by dignity
    const exaltedPlanets = chart.planets.filter(
      (p) => p.dignity === 'exalted'
    );
    const debilitatedPlanets = chart.planets.filter(
      (p) => p.dignity === 'debilitated'
    );
    const combustPlanets = chart.planets.filter((p) => p.isCombust);
    const retrogradePlanets = chart.planets.filter((p) => p.isRetrograde);

    // 9. Create planet meanings
    const planetMeanings = this.getPlanetMeanings(chart.planets);

    return {
      nakshatra: nakshatraDetails,
      planets: {
        all: chart.planets,
        exalted: exaltedPlanets,
        debilitated: debilitatedPlanets,
        combust: combustPlanets,
        retrograde: retrogradePlanets,
        meanings: planetMeanings,
      },
      dasha,
      yogas,
      doshas,
      recommendations,
      chart: {
        ascendant: chart.ascendant,
        ascendantSign: chart.ascendantSign,
        houses: chart.houses,
      },
    };
  }

  /**
   * Get planet meanings based on position
   */
  private getPlanetMeanings(
    planets: Array<{ name: string; house: number; dignity: string; signName: string }>
  ): Record<string, string> {
    const meanings: Record<string, string> = {};

    planets.forEach((planet) => {
      let meaning = `${planet.name} in ${planet.signName} sign, ${planet.house}th house. `;

      if (planet.dignity === 'exalted') {
        meaning += 'Exalted position brings strength and positive results. ';
      } else if (planet.dignity === 'debilitated') {
        meaning += 'Debilitated position indicates weakness and challenges. ';
      } else if (planet.dignity === 'own_sign') {
        meaning += 'Own sign placement brings natural strength. ';
      }

      // House-specific meanings
      if (planet.house === 1) {
        meaning += 'In 1st house (Ascendant), affects personality and self. ';
      } else if (planet.house === 4) {
        meaning += 'In 4th house, affects home, mother, and property. ';
      } else if (planet.house === 7) {
        meaning += 'In 7th house, affects marriage and partnerships. ';
      } else if (planet.house === 10) {
        meaning += 'In 10th house, affects career and reputation. ';
      } else if (planet.house === 6) {
        meaning += 'In 6th house, may cause health issues or enemies. ';
      } else if (planet.house === 8) {
        meaning += 'In 8th house, may cause obstacles and transformations. ';
      } else if (planet.house === 12) {
        meaning += 'In 12th house, affects losses, spirituality, and foreign lands. ';
      }

      meanings[planet.name] = meaning;
    });

    return meanings;
  }
}



