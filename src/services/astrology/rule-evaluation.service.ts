import type {
  RuleCondition,
  PlanetPosition,
  Dosha,
  Yoga,
  CurrentDasha,
  PlanetaryDignity,
} from '../../types/astrology.types';
import { RecommendationRuleModel } from '../../models/RecommendationRule.model';
import type { IRecommendationRule } from '../../models/RecommendationRule.model';

/**
 * Rule Evaluation Service
 * Evaluates recommendation rules against chart data
 */
export class RuleEvaluationService {
  /**
   * Evaluate all active rules for a category
   */
  async evaluateRules(
    category: string,
    planets: PlanetPosition[],
    doshas: Dosha[],
    yogas: Yoga[],
    dasha: CurrentDasha,
    nakshatraName?: string
  ): Promise<IRecommendationRule[]> {
    // Fetch active rules for the category
    const rules = await RecommendationRuleModel.find({
      category: category as any,
      isActive: true,
    }).sort({ priority: -1 });

    // Evaluate each rule
    const matchedRules: IRecommendationRule[] = [];

    for (const rule of rules) {
      const isMatch = this.evaluateRuleConditions(
        rule.conditions as RuleCondition,
        planets,
        doshas,
        yogas,
        dasha,
        nakshatraName
      );

      if (isMatch) {
        matchedRules.push(rule);
      }
    }

    return matchedRules;
  }

  /**
   * Evaluate a single rule's conditions against chart data
   */
  private evaluateRuleConditions(
    conditions: RuleCondition,
    planets: PlanetPosition[],
    doshas: Dosha[],
    yogas: Yoga[],
    dasha: CurrentDasha,
    nakshatraName?: string
  ): boolean {
    const logic = conditions.logic || 'AND';
    const results: boolean[] = [];

    // Evaluate planet conditions
    if (conditions.planets && conditions.planets.length > 0) {
      const planetResults = conditions.planets.map((condition) =>
        this.evaluatePlanetCondition(condition, planets)
      );
      results.push(logic === 'AND' ? planetResults.every(Boolean) : planetResults.some(Boolean));
    }

    // Evaluate dosha conditions
    if (conditions.doshas && conditions.doshas.length > 0) {
      const doshaResults = conditions.doshas.map((condition) =>
        this.evaluateDoshaCondition(condition, doshas)
      );
      results.push(logic === 'AND' ? doshaResults.every(Boolean) : doshaResults.some(Boolean));
    }

    // Evaluate yoga conditions
    if (conditions.yogas && conditions.yogas.length > 0) {
      const yogaResults = conditions.yogas.map((condition) =>
        this.evaluateYogaCondition(condition, yogas)
      );
      results.push(logic === 'AND' ? yogaResults.every(Boolean) : yogaResults.some(Boolean));
    }

    // Evaluate house conditions
    if (conditions.houses && conditions.houses.length > 0) {
      results.push(this.evaluateHouseCondition(conditions.houses, planets));
    }

    // Evaluate nakshatra conditions
    if (conditions.nakshatras && conditions.nakshatras.length > 0 && nakshatraName) {
      results.push(conditions.nakshatras.includes(nakshatraName));
    }

    // Evaluate mahadasha conditions
    if (conditions.mahadasha && conditions.mahadasha.length > 0) {
      const currentMahadasha = dasha.mahadasha.lord.toLowerCase();
      results.push(
        conditions.mahadasha.some((planet) => planet.toLowerCase() === currentMahadasha)
      );
    }

    // Final evaluation: if logic is AND, all must be true; if OR, at least one must be true
    if (results.length === 0) return false;
    return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  /**
   * Evaluate planet condition
   */
  private evaluatePlanetCondition(
    condition: NonNullable<RuleCondition['planets']>[number],
    planets: PlanetPosition[]
  ): boolean {
    const planet = planets.find(
      (p) => p.name.toLowerCase() === condition.name.toLowerCase()
    );

    if (!planet) return false;

    let matches = true;

    // Check dignity
    if (condition.dignity && condition.dignity.length > 0) {
      matches = matches && condition.dignity.includes(planet.dignity);
    }

    // Check house
    if (condition.house && condition.house.length > 0) {
      matches = matches && condition.house.includes(planet.house);
    }

    // Check combust
    if (condition.isCombust !== undefined) {
      matches = matches && planet.isCombust === condition.isCombust;
    }

    // Check retrograde
    if (condition.isRetrograde !== undefined) {
      matches = matches && planet.isRetrograde === condition.isRetrograde;
    }

    // Check sign
    if (condition.sign && condition.sign.length > 0) {
      matches = matches && condition.sign.includes(planet.sign);
    }

    return matches;
  }

  /**
   * Evaluate dosha condition
   */
  private evaluateDoshaCondition(
    condition: NonNullable<RuleCondition['doshas']>[number],
    doshas: Dosha[]
  ): boolean {
    const dosha = doshas.find(
      (d) => d.name.toLowerCase() === condition.name.toLowerCase()
    );

    if (!dosha) return false;

    // Check severity if specified
    if (condition.severity && condition.severity.length > 0) {
      return condition.severity.includes(dosha.severity);
    }

    return true; // Dosha exists
  }

  /**
   * Evaluate yoga condition
   */
  private evaluateYogaCondition(
    condition: NonNullable<RuleCondition['yogas']>[number],
    yogas: Yoga[]
  ): boolean {
    const yoga = yogas.find((y) => y.name.toLowerCase() === condition.name.toLowerCase());

    if (!yoga) return false;

    // Check type if specified
    if (condition.type && condition.type.length > 0) {
      return condition.type.includes(yoga.type);
    }

    return true; // Yoga exists
  }

  /**
   * Evaluate house condition (check if any planet is in specified houses)
   */
  private evaluateHouseCondition(houses: number[], planets: PlanetPosition[]): boolean {
    return planets.some((planet) => houses.includes(planet.house));
  }
}
