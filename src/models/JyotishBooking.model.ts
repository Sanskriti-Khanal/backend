import mongoose, { Schema, Document } from 'mongoose';

export enum BookingType {
  CALL = 'call',
  CHAT = 'chat',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface IJyotishBooking extends Document {
  user: mongoose.Types.ObjectId;
  jyotish: mongoose.Types.ObjectId;
  type: BookingType;
  status: BookingStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration: number; // in minutes
  freeMinutesUsed: number; // Free minutes used (1 min free)
  totalAmount: number;
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jyotishBookingSchema = new Schema<IJyotishBooking>(
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
    type: {
      type: String,
      enum: Object.values(BookingType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    scheduledAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    freeMinutesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

jyotishBookingSchema.index({ user: 1 });
jyotishBookingSchema.index({ jyotish: 1 });
jyotishBookingSchema.index({ status: 1 });
jyotishBookingSchema.index({ scheduledAt: 1 });

export const JyotishBookingModel = mongoose.model<IJyotishBooking>(
  'JyotishBooking',
  jyotishBookingSchema
);












