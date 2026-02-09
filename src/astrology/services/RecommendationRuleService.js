/**
 * Recommendation Rule Service
 * 
 * Business logic for recommendation rules
 */

const recommendationRulesDb = require('../database/recommendation-rules');

class RecommendationRuleService {
  /**
   * Get active rules for a category
   */
  getRulesByCategory(category) {
    return recommendationRulesDb.getRulesByCategory(category);
  }

  /**
   * Create a new rule
   */
  createRule(ruleData) {
    // Validate rule data
    this.validateRule(ruleData);
    
    return recommendationRulesDb.createRule(ruleData);
  }

  /**
   * Update a rule
   */
  updateRule(id, ruleData) {
    return recommendationRulesDb.updateRule(id, ruleData);
  }

  /**
   * Delete a rule (soft delete)
   */
  deleteRule(id) {
    return recommendationRulesDb.deleteRule(id);
  }

  /**
   * Get all rules
   */
  getAllRules() {
    return recommendationRulesDb.getAllRules();
  }

  /**
   * Validate rule data
   */
  validateRule(ruleData) {
    const validRuleTypes = ['planet_based', 'dosha_based', 'yoga_based', 'house_based', 'combination', 'nakshatra_based', 'mahadasha_based'];
    const validCategories = ['overall', 'wealth', 'health', 'mental_wellbeing', 'relationship', 'career', 'spiritual', 'study'];

    if (!validRuleTypes.includes(ruleData.ruleType)) {
      throw new Error(`Invalid ruleType. Must be one of: ${validRuleTypes.join(', ')}`);
    }

    if (!validCategories.includes(ruleData.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    if (!ruleData.conditions || typeof ruleData.conditions !== 'object') {
      throw new Error('conditions must be an object');
    }

    if (!ruleData.recommendations || typeof ruleData.recommendations !== 'object') {
      throw new Error('recommendations must be an object');
    }

    if (ruleData.priority !== undefined && (ruleData.priority < 1 || ruleData.priority > 100)) {
      throw new Error('priority must be between 1 and 100');
    }
  }
}

module.exports = RecommendationRuleService;
