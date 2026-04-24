import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  /** Same value across rotations for one “session family” (reuse detection). */
  familyId: Types.ObjectId;
  rememberMe: boolean;
  tokenVersionAtIssue: number;
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    familyId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rememberMe: {
      type: Boolean,
      required: true,
      default: false,
    },
    tokenVersionAtIssue: {
      type: Number,
      required: true,
      default: 0,
    },
    deviceInfo: {
      type: String,
      maxlength: 512,
    },
  },
  { timestamps: true }
);

/** TTL index: MongoDB removes expired documents automatically */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
