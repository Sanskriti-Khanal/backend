import mongoose, { Schema, Document } from 'mongoose';

export interface IHealingListing extends Document {
  title: string;
  description: string;
  // Base price (for legacy/payment fallback)
  price: number;
  // Session-specific prices
  onlinePrice?: number;
  offlinePrice?: number;
  duration: number; // in minutes
  images: string[];
  category: string;
  healer: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const healingListingSchema = new Schema<IHealingListing>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Base price remains required for now (used by payment service),
    // online/offline prices are optional overrides for specific session types.
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    onlinePrice: {
      type: Number,
      min: 0,
    },
    offlinePrice: {
      type: Number,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
    },
    healer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

healingListingSchema.index({ title: 'text', description: 'text' });
healingListingSchema.index({ healer: 1 });
healingListingSchema.index({ category: 1 });
healingListingSchema.index({ isActive: 1 });

export const HealingListingModel = mongoose.model<IHealingListing>(
  'HealingListing',
  healingListingSchema
);









