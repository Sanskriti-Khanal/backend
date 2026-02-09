import mongoose, { Schema, Document } from 'mongoose';

export interface IPujaListing extends Document {
  title: string;
  description: string;
  // Purpose (can use description) – kept for clarity
  purpose?: string;
  itemsIncluded?: string;
  timeSlots?: string[];
  // Base price (for legacy/payment fallback)
  price: number;
  // Session-specific prices
  onlinePrice?: number;
  offlinePrice?: number;
  duration: number; // in minutes
  images: string[];
  category?: string;
  pujari: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pujaListingSchema = new Schema<IPujaListing>(
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
    purpose: { type: String, trim: true },
    itemsIncluded: { type: String, trim: true },
    timeSlots: [{ type: String, trim: true }],
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
      trim: true,
    },
    pujari: {
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

pujaListingSchema.index({ title: 'text', description: 'text' });
pujaListingSchema.index({ pujari: 1 });
pujaListingSchema.index({ category: 1 });
pujaListingSchema.index({ isActive: 1 });

export const PujaListingModel = mongoose.model<IPujaListing>(
  'PujaListing',
  pujaListingSchema
);










