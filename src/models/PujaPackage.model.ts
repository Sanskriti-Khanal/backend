import mongoose, { Schema, Document } from 'mongoose';

export interface IPujaPackage extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  targetedIssue?: string;
  pujaIncluded?: string;
  itemsNeeded?: string;
  onlinePrice?: number;
  offlinePrice?: number;
  timeSlots?: string[];
  listings: mongoose.Types.ObjectId[]; // Array of puja listing IDs
  duration: number; // Total duration in minutes
  images: string[];
  pujari: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pujaPackageSchema = new Schema<IPujaPackage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    targetedIssue: { type: String, trim: true },
    pujaIncluded: { type: String, trim: true },
    itemsNeeded: { type: String, trim: true },
    onlinePrice: { type: Number, min: 0 },
    offlinePrice: { type: Number, min: 0 },
    timeSlots: [{ type: String, trim: true }],
    listings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PujaListing',
      },
    ],
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

pujaPackageSchema.index({ name: 'text', description: 'text' });
pujaPackageSchema.index({ pujari: 1 });
pujaPackageSchema.index({ isActive: 1 });

export const PujaPackageModel = mongoose.model<IPujaPackage>(
  'PujaPackage',
  pujaPackageSchema
);












