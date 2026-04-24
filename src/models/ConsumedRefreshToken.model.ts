import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Hashes of refresh tokens already exchanged (rotation).
 * If the same hash appears again, treat as reuse → revoke all sessions for the user.
 */
export interface IConsumedRefreshToken extends Document {
  tokenHash: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const consumedRefreshTokenSchema = new Schema<IConsumedRefreshToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

consumedRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ConsumedRefreshTokenModel = mongoose.model<IConsumedRefreshToken>(
  'ConsumedRefreshToken',
  consumedRefreshTokenSchema
);
