import mongoose, { Schema, Document } from 'mongoose';

export interface IHealingPackage extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  listings: mongoose.Types.ObjectId[]; // Array of healing listing IDs
  duration: number; // Total duration in minutes
  images: string[];
  healer: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const healingPackageSchema = new Schema<IHealingPackage>(
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
    listings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'HealingListing',
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

healingPackageSchema.index({ name: 'text', description: 'text' });
healingPackageSchema.index({ healer: 1 });
healingPackageSchema.index({ isActive: 1 });

export const HealingPackageModel = mongoose.model<IHealingPackage>(
  'HealingPackage',
  healingPackageSchema
);












