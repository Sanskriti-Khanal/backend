import mongoose, { Schema, Document } from 'mongoose';
import type { RuleType, RecommendationCategory, RuleCondition, RuleRecommendation } from '../types/astrology.types';

export interface IRecommendationRule extends Document {
  ruleType: RuleType;
  category: RecommendationCategory;
  conditions: RuleCondition;
  recommendations: RuleRecommendation;
  priority: number; // 1-100, higher = more important
  isActive: boolean;
  description?: string; // Human-readable description of the rule
  createdAt: Date;
  updatedAt: Date;
}

const recommendationRuleSchema = new Schema<IRecommendationRule>(
  {
    ruleType: {
      type: String,
      enum: ['planet_based', 'dosha_based', 'yoga_based', 'house_based', 'combination', 'nakshatra_based', 'mahadasha_based'],
      required: true,
    },
    category: {
      type: String,
      enum: ['overall', 'wealth', 'health', 'mental_wellbeing', 'relationship', 'career', 'spiritual', 'study'],
      required: true,
    },
    conditions: {
      type: Schema.Types.Mixed, // JSON/JSONB structure
      required: true,
    },
    recommendations: {
      type: Schema.Types.Mixed, // JSON/JSONB structure
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
recommendationRuleSchema.index({ category: 1, isActive: 1, priority: -1 });
recommendationRuleSchema.index({ ruleType: 1, isActive: 1 });
recommendationRuleSchema.index({ isActive: 1, priority: -1 });

export const RecommendationRuleModel = mongoose.model<IRecommendationRule>(
  'RecommendationRule',
  recommendationRuleSchema
);
