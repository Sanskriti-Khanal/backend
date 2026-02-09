import mongoose, { Schema, Document } from 'mongoose';

export interface IGemCategory extends Document {
  name: string;
  slug: string; // URL-friendly identifier (e.g., "ruby", "sapphire", "emerald")
  description?: string; // Short description
  detailedDescription?: string; // Long, detailed description
  image?: string;
  gemType?: string; // Type of gem (e.g., "precious", "semi-precious")
  categoryType: 'precious' | 'semi-precious' | 'other'; // Category classification
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

const gemCategorySchema = new Schema<IGemCategory>(
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
    gemType: {
      type: String,
      trim: true,
    },
    categoryType: {
      type: String,
      enum: ['precious', 'semi-precious', 'other'],
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
gemCategorySchema.index({ slug: 1 }, { unique: true });
gemCategorySchema.index({ categoryType: 1 });
gemCategorySchema.index({ isActive: 1 });
gemCategorySchema.index({ displayOrder: 1 });

export const GemCategoryModel = mongoose.model<IGemCategory>(
  'GemCategory',
  gemCategorySchema
);









