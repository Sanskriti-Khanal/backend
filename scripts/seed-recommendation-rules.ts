/**
 * Seed Script for Recommendation Rules
 * 
 * Populates the database with initial recommendation rules
 * Run with: npx ts-node scripts/seed-recommendation-rules.ts
 */

import mongoose from 'mongoose';
import { RecommendationRuleModel } from '../src/models/RecommendationRule.model';
import type { RuleCondition, RuleRecommendation } from '../src/types/astrology.types';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/merosathi';

async function seedRules() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing rules (optional - comment out if you want to keep existing)
    // await RecommendationRuleModel.deleteMany({});
    // console.log('Cleared existing rules');

    const rules = [
      // ===== CAREER RULES =====
      {
        ruleType: 'planet_based' as const,
        category: 'career' as const,
        conditions: {
          planets: [
            {
              name: 'Jupiter',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Yellow Sapphire',
              priority: 85,
              reason: 'Jupiter rules career and needs strengthening',
              benefits: ['Career growth', 'Authority', 'Recognition', 'Financial success'],
              instructions: 'Wear Yellow Sapphire in index finger on Thursday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 5,
              priority: 80,
              reason: '5 Mukhi Rudraksha is ruled by Jupiter and strengthens career',
              benefits: ['Career success', 'Wisdom', 'Authority'],
              instructions: 'Wear 5 Mukhi Rudraksha and chant Jupiter mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 90,
        isActive: true,
        description: 'Jupiter debilitated/afflicted - Career strengthening needed',
      },
      {
        ruleType: 'planet_based' as const,
        category: 'career' as const,
        conditions: {
          planets: [
            {
              name: 'Sun',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Ruby',
              priority: 85,
              reason: 'Sun rules authority and career - needs strengthening',
              benefits: ['Career growth', 'Authority', 'Leadership', 'Recognition'],
              instructions: 'Wear Ruby in ring finger on Sunday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 12,
              priority: 80,
              reason: '12 Mukhi Rudraksha is ruled by Sun',
              benefits: ['Authority', 'Leadership', 'Power'],
              instructions: 'Wear 12 Mukhi Rudraksha and chant Sun mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 88,
        isActive: true,
        description: 'Sun debilitated/afflicted - Authority and career strengthening',
      },
      {
        ruleType: 'planet_based' as const,
        category: 'career' as const,
        conditions: {
          planets: [
            {
              name: 'Mercury',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Emerald',
              priority: 85,
              reason: 'Mercury rules communication and business',
              benefits: ['Business success', 'Communication', 'Intelligence', 'Writing'],
              instructions: 'Wear Emerald in little finger on Wednesday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 4,
              priority: 80,
              reason: '4 Mukhi Rudraksha is ruled by Mercury',
              benefits: ['Intelligence', 'Communication', 'Knowledge'],
              instructions: 'Wear 4 Mukhi Rudraksha and chant Mercury mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 85,
        isActive: true,
        description: 'Mercury debilitated/afflicted - Business and communication strengthening',
      },

      // ===== WEALTH RULES =====
      {
        ruleType: 'planet_based' as const,
        category: 'wealth' as const,
        conditions: {
          planets: [
            {
              name: 'Jupiter',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Yellow Sapphire',
              priority: 90,
              reason: 'Jupiter is the primary planet for wealth and prosperity',
              benefits: ['Financial growth', 'Wealth accumulation', 'Prosperity', 'Abundance'],
              instructions: 'Wear Yellow Sapphire in index finger on Thursday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 5,
              priority: 85,
              reason: '5 Mukhi Rudraksha attracts wealth through Jupiter',
              benefits: ['Wealth', 'Prosperity', 'Financial stability'],
              instructions: 'Wear 5 Mukhi Rudraksha and perform Jupiter remedies.',
            },
          ],
        } as RuleRecommendation,
        priority: 92,
        isActive: true,
        description: 'Jupiter weak - Wealth strengthening needed',
      },
      {
        ruleType: 'planet_based' as const,
        category: 'wealth' as const,
        conditions: {
          planets: [
            {
              name: 'Venus',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Diamond',
              priority: 88,
              reason: 'Venus rules luxury and material comforts',
              benefits: ['Material comforts', 'Luxury', 'Financial stability', 'Comforts'],
              instructions: 'Wear Diamond in middle finger on Friday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 6,
              priority: 83,
              reason: '6 Mukhi Rudraksha is ruled by Venus',
              benefits: ['Love', 'Relationships', 'Harmony', 'Material comforts'],
              instructions: 'Wear 6 Mukhi Rudraksha and chant Venus mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 90,
        isActive: true,
        description: 'Venus weak - Material comforts and wealth strengthening',
      },

      // ===== HEALTH RULES =====
      {
        ruleType: 'planet_based' as const,
        category: 'health' as const,
        conditions: {
          planets: [
            {
              name: 'Sun',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Ruby',
              priority: 90,
              reason: 'Sun rules vitality and overall health',
              benefits: ['Improved vitality', 'Better health', 'Energy', 'Strength'],
              instructions: 'Wear Ruby in ring finger on Sunday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 12,
              priority: 85,
              reason: '12 Mukhi Rudraksha strengthens Sun for health',
              benefits: ['Vitality', 'Energy', 'Health'],
              instructions: 'Wear 12 Mukhi Rudraksha and perform Sun remedies.',
            },
          ],
        } as RuleRecommendation,
        priority: 92,
        isActive: true,
        description: 'Sun weak - Health and vitality strengthening',
      },
      {
        ruleType: 'planet_based' as const,
        category: 'health' as const,
        conditions: {
          planets: [
            {
              name: 'Moon',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Pearl',
              priority: 88,
              reason: 'Moon rules mind and emotional health',
              benefits: ['Mental peace', 'Emotional stability', 'Better sleep', 'Calmness'],
              instructions: 'Wear Pearl in little finger on Monday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 2,
              priority: 83,
              reason: '2 Mukhi Rudraksha is ruled by Moon',
              benefits: ['Emotional stability', 'Peace', 'Mental health'],
              instructions: 'Wear 2 Mukhi Rudraksha and chant Moon mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 90,
        isActive: true,
        description: 'Moon weak - Mental and emotional health strengthening',
      },

      // ===== RELATIONSHIP RULES =====
      {
        ruleType: 'dosha_based' as const,
        category: 'relationship' as const,
        conditions: {
          doshas: [
            {
              name: 'Mangal Dosha',
              severity: ['high', 'medium'],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Red Coral',
              priority: 90,
              reason: 'Mangal Dosha requires Mars strengthening',
              benefits: ['Reduces Mangal Dosha effects', 'Improves relationships', 'Marriage harmony'],
              instructions: 'Wear Red Coral in ring finger on Tuesday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 3,
              priority: 85,
              reason: '3 Mukhi Rudraksha is ruled by Mars and helps reduce Mangal Dosha',
              benefits: ['Courage', 'Energy', 'Relationship harmony'],
              instructions: 'Wear 3 Mukhi Rudraksha and perform Mangal Dosha remedies.',
            },
          ],
        } as RuleRecommendation,
        priority: 95,
        isActive: true,
        description: 'Mangal Dosha - Relationship strengthening needed',
      },
      {
        ruleType: 'planet_based' as const,
        category: 'relationship' as const,
        conditions: {
          planets: [
            {
              name: 'Venus',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Diamond',
              priority: 88,
              reason: 'Venus rules love and relationships',
              benefits: ['Better relationships', 'Love and harmony', 'Marriage', 'Partnership'],
              instructions: 'Wear Diamond in middle finger on Friday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 6,
              priority: 83,
              reason: '6 Mukhi Rudraksha strengthens Venus for relationships',
              benefits: ['Love', 'Relationships', 'Harmony'],
              instructions: 'Wear 6 Mukhi Rudraksha and chant Venus mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 90,
        isActive: true,
        description: 'Venus weak - Relationship strengthening',
      },

      // ===== SPIRITUAL RULES =====
      {
        ruleType: 'planet_based' as const,
        category: 'spiritual' as const,
        conditions: {
          planets: [
            {
              name: 'Jupiter',
              dignity: ['debilitated', 'enemy_sign'],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          rudraksha: [
            {
              mukhiCount: 5,
              priority: 90,
              reason: 'Jupiter rules spirituality and wisdom',
              benefits: ['Spiritual growth', 'Wisdom', 'Knowledge', 'Devotion'],
              instructions: 'Wear 5 Mukhi Rudraksha and perform Jupiter puja.',
            },
          ],
        } as RuleRecommendation,
        priority: 92,
        isActive: true,
        description: 'Jupiter weak - Spiritual growth strengthening',
      },
      {
        ruleType: 'planet_based' as const,
        category: 'spiritual' as const,
        conditions: {
          planets: [
            {
              name: 'Ketu',
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          rudraksha: [
            {
              mukhiCount: 9,
              priority: 88,
              reason: 'Ketu rules spirituality and enlightenment',
              benefits: ['Spiritual enlightenment', 'Detachment', 'Moksha', 'Meditation'],
              instructions: 'Wear 9 Mukhi Rudraksha and chant Ketu mantras.',
            },
          ],
        } as RuleRecommendation,
        priority: 90,
        isActive: true,
        description: 'Ketu present - Spiritual enlightenment support',
      },

      // ===== MENTAL WELLBEING RULES =====
      {
        ruleType: 'planet_based' as const,
        category: 'mental_wellbeing' as const,
        conditions: {
          planets: [
            {
              name: 'Moon',
              dignity: ['debilitated', 'enemy_sign'],
              house: [6, 8, 12],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Pearl',
              priority: 90,
              reason: 'Moon rules mind and emotions',
              benefits: ['Mental peace', 'Emotional stability', 'Reduced stress', 'Calmness'],
              instructions: 'Wear Pearl in little finger on Monday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 2,
              priority: 85,
              reason: '2 Mukhi Rudraksha calms the mind',
              benefits: ['Emotional stability', 'Peace', 'Mental clarity'],
              instructions: 'Wear 2 Mukhi Rudraksha and practice meditation.',
            },
          ],
        } as RuleRecommendation,
        priority: 92,
        isActive: true,
        description: 'Moon weak - Mental wellbeing strengthening',
      },

      // ===== OVERALL RULES =====
      {
        ruleType: 'planet_based' as const,
        category: 'overall' as const,
        conditions: {
          planets: [
            {
              name: 'Sun',
              dignity: ['debilitated'],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Ruby',
              priority: 85,
              reason: 'Sun debilitated - Overall vitality needs strengthening',
              benefits: ['Vitality', 'Confidence', 'Leadership', 'Overall wellbeing'],
              instructions: 'Wear Ruby in ring finger on Sunday.',
            },
          ],
        } as RuleRecommendation,
        priority: 80,
        isActive: true,
        description: 'Sun debilitated - Overall strengthening',
      },
      {
        ruleType: 'dosha_based' as const,
        category: 'overall' as const,
        conditions: {
          doshas: [
            {
              name: 'Kaal Sarp Dosha',
              severity: ['high', 'medium'],
            },
          ],
          logic: 'AND',
        } as RuleCondition,
        recommendations: {
          gemstones: [
            {
              name: 'Hessonite',
              priority: 90,
              reason: 'Kaal Sarp Dosha requires Rahu remedies',
              benefits: ['Reduces Kaal Sarp Dosha effects', 'Removes obstacles', 'Protection'],
              instructions: 'Wear Hessonite in middle finger on Saturday.',
            },
          ],
          rudraksha: [
            {
              mukhiCount: 8,
              priority: 85,
              reason: '8 Mukhi Rudraksha removes obstacles',
              benefits: ['Removes obstacles', 'Protection', 'Success'],
              instructions: 'Wear 8 Mukhi Rudraksha and perform Kaal Sarp Dosha puja.',
            },
          ],
        } as RuleRecommendation,
        priority: 95,
        isActive: true,
        description: 'Kaal Sarp Dosha - Overall obstacle removal',
      },
    ];

    // Insert rules
    for (const rule of rules) {
      const existingRule = await RecommendationRuleModel.findOne({
        ruleType: rule.ruleType,
        category: rule.category,
        description: rule.description,
      });

      if (!existingRule) {
        await RecommendationRuleModel.create(rule);
        console.log(`✓ Created rule: ${rule.description}`);
      } else {
        console.log(`- Skipped existing rule: ${rule.description}`);
      }
    }

    console.log(`\n✅ Seeded ${rules.length} recommendation rules`);
    console.log('Rules are now active in the database');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding rules:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run seed
seedRules();
