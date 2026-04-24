import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPasswordSetIntent extends Document {
  jti: string;
  userId: Types.ObjectId;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordSetIntentSchema = new Schema<IPasswordSetIntent>(
  {
    jti: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    used: { type: Boolean, required: true, default: false },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

passwordSetIntentSchema.index({ userId: 1, used: 1, expiresAt: 1 });

export const PasswordSetIntentModel = mongoose.model<IPasswordSetIntent>(
  'PasswordSetIntent',
  passwordSetIntentSchema
);
