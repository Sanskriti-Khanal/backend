import mongoose, { Schema, Document } from 'mongoose';

export interface IPujaReview extends Document {
  listing: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pujaReviewSchema = new Schema<IPujaReview>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'PujaListing',
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
pujaReviewSchema.index({ listing: 1, user: 1 }, { unique: true });
pujaReviewSchema.index({ listing: 1 });
pujaReviewSchema.index({ user: 1 });

export const PujaReviewModel = mongoose.model<IPujaReview>(
  'PujaReview',
  pujaReviewSchema
);












