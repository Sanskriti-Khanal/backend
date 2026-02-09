import mongoose, { Schema, Document } from 'mongoose';

export interface IRudrakshaCategory extends Document {
  name: string;
  slug: string; // URL-friendly identifier (e.g., "0-mukhi", "gaurishankar")
  description?: string; // Short description
  detailedDescription?: string; // Long, detailed description
  image?: string;
  mukhiCount?: number; // For mukhi categories (0-26), null for special categories
  categoryType: 'mukhi' | 'special'; // mukhi or special (Gaurishankar, Trijuti, etc.)
  isActive: boolean;
  displayOrder: number; // For sorting
  benefits?: string[]; // Array of benefits
  spiritualSignificance?: string; // Spiritual meaning and significance
  associatedPlanet?: string; // Associated planet (e.g., "Sun", "Moon", "Jupiter")
  associatedDeity?: string; // Associated deity
  priceRange?: {
    min?: number;
    max?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const rudrakshaCategorySchema = new Schema<IRudrakshaCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    detailedDescription: {
      type: String,
      trim: true,
    },
    spiritualSignificance: {
      type: String,
      trim: true,
    },
    associatedPlanet: {
      type: String,
      trim: true,
    },
    associatedDeity: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    mukhiCount: {
      type: Number,
      min: 0,
      max: 26,
      validate: {
        validator: function (this: IRudrakshaCategory, value: number | undefined) {
          // If categoryType is 'mukhi', mukhiCount must be defined
          if (this.categoryType === 'mukhi' && value === undefined) {
            return false;
          }
          // If categoryType is 'special', mukhiCount should be undefined
          if (this.categoryType === 'special' && value !== undefined) {
            return false;
          }
          return true;
        },
        message: 'mukhiCount is required for mukhi categories and must be undefined for special categories',
      },
    },
    categoryType: {
      type: String,
      enum: ['mukhi', 'special'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    priceRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rudrakshaCategorySchema.index({ slug: 1 }, { unique: true });
rudrakshaCategorySchema.index({ categoryType: 1 });
rudrakshaCategorySchema.index({ mukhiCount: 1 });
rudrakshaCategorySchema.index({ isActive: 1 });
rudrakshaCategorySchema.index({ displayOrder: 1 });

export const RudrakshaCategoryModel = mongoose.model<IRudrakshaCategory>(
  'RudrakshaCategory',
  rudrakshaCategorySchema
);

