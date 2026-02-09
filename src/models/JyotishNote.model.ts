import mongoose, { Schema, Document } from 'mongoose';

export interface IJyotishNote extends Document {
  user: mongoose.Types.ObjectId; // User about whom the note is
  jyotish: mongoose.Types.ObjectId; // Jyotish who created the note
  booking?: mongoose.Types.ObjectId; // Optional: related booking
  note: string;
  isPrivate: boolean; // Private notes can only be read by other Jyotish who have booked this user
  createdAt: Date;
  updatedAt: Date;
}

const jyotishNoteSchema = new Schema<IJyotishNote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jyotish: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'JyotishBooking',
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding notes by user
jyotishNoteSchema.index({ user: 1, createdAt: -1 });
// Index for finding notes by jyotish
jyotishNoteSchema.index({ jyotish: 1 });
// Index for finding notes for a specific user-jyotish combination
jyotishNoteSchema.index({ user: 1, jyotish: 1 });

export const JyotishNoteModel = mongoose.model<IJyotishNote>(
  'JyotishNote',
  jyotishNoteSchema
);












