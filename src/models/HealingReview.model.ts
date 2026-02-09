import mongoose, { Schema, Document } from 'mongoose';

export interface IHealingReview extends Document {
  listing: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const healingReviewSchema = new Schema<IHealingReview>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'HealingListing',
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

// One review per user per listing
healingReviewSchema.index({ listing: 1, user: 1 }, { unique: true });
healingReviewSchema.index({ listing: 1 });
healingReviewSchema.index({ user: 1 });

export const HealingReviewModel = mongoose.model<IHealingReview>(
  'HealingReview',
  healingReviewSchema
);












