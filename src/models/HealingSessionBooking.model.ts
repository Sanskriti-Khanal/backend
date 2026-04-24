import mongoose, { Schema, Document } from 'mongoose';

export type HealingSessionBookingStatus = 'pending' | 'confirmed' | 'failed' | 'expired';
export type HealingSessionPaymentStatus = 'pending' | 'success' | 'failed';

export interface IHealingSessionBooking extends Document {
  user: mongoose.Types.ObjectId;
  /** Healing listing id or healing package id */
  sessionId: mongoose.Types.ObjectId;
  listingType: 'service' | 'package';
  scheduledDate: string;
  timeSlot: string;
  sessionMode: 'online' | 'offline';
  sessionTitle: string;
  status: HealingSessionBookingStatus;
  paymentStatus: HealingSessionPaymentStatus;
  transactionId?: string;
  orderId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  amountNpr: number;
  createdAt: Date;
  updatedAt: Date;
}

const healingSessionBookingSchema = new Schema<IHealingSessionBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, required: true, index: true },
    listingType: { type: String, enum: ['service', 'package'], required: true },
    scheduledDate: { type: String, required: true, trim: true },
    timeSlot: { type: String, required: true, trim: true, default: '10:00' },
    sessionMode: { type: String, enum: ['online', 'offline'], required: true },
    sessionTitle: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'expired'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    transactionId: { type: String, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    amountNpr: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

healingSessionBookingSchema.index(
  { sessionId: 1, scheduledDate: 1, timeSlot: 1, status: 1, createdAt: 1 },
  { name: 'healing_session_slot_status' }
);

export const HealingSessionBookingModel = mongoose.model<IHealingSessionBooking>(
  'HealingSessionBooking',
  healingSessionBookingSchema
);
