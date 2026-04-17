import mongoose, { Schema, Document } from 'mongoose';

export type SavedAstrologyKind = 'kundali' | 'milan';

export interface ISavedAstrology extends Document {
  user: mongoose.Types.ObjectId;
  kind: SavedAstrologyKind;
  title?: string;
  requestPayload: Record<string, unknown>;
  resultSnapshot: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const savedAstrologySchema = new Schema<ISavedAstrology>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['kundali', 'milan'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    requestPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    resultSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

savedAstrologySchema.index({ user: 1, kind: 1, createdAt: -1 });

export const SavedAstrologyModel = mongoose.model<ISavedAstrology>(
  'SavedAstrology',
  savedAstrologySchema
);
