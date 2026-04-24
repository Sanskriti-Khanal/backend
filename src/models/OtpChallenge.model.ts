import mongoose, { Schema, Document } from 'mongoose';

export type OtpPurpose = 'registration' | 'password_reset';

export interface IOtpChallenge extends Document {
  phoneE164: string;
  purpose: OtpPurpose;
  resendCount: number;
  resendWindowStartedAt: Date;
  failedVerifyCount: number;
  invalidated: boolean;
  lastSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpChallengeSchema = new Schema<IOtpChallenge>(
  {
    phoneE164: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset'],
      required: true,
      index: true,
    },
    resendCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resendWindowStartedAt: {
      type: Date,
      required: true,
    },
    failedVerifyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    invalidated: {
      type: Boolean,
      default: false,
    },
    lastSentAt: Date,
  },
  { timestamps: true }
);

otpChallengeSchema.index({ phoneE164: 1, purpose: 1 }, { unique: true });

export const OtpChallengeModel = mongoose.model<IOtpChallenge>('OtpChallenge', otpChallengeSchema);

