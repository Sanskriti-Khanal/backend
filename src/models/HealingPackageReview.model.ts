import mongoose, { Schema, Document } from 'mongoose';

export interface IHealingPackageReview extends Document {
  package: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const healingPackageReviewSchema = new Schema<IHealingPackageReview>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'HealingPackage',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per package
healingPackageReviewSchema.index({ package: 1, user: 1 }, { unique: true });
healingPackageReviewSchema.index({ package: 1 });
healingPackageReviewSchema.index({ user: 1 });

export const HealingPackageReviewModel = mongoose.model<IHealingPackageReview>(
  'HealingPackageReview',
  healingPackageReviewSchema
);
