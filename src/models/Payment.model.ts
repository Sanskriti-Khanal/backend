import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  NABIL = 'nabil',
  KHALTI = 'khalti',
  CASH = 'cash',
}

export enum PaymentType {
  PRODUCT = 'product',
  HEALING = 'healing',
  PUJA = 'puja',
  JYOTISH_BOOKING = 'jyotish_booking',
  JYOTISH_SERVICE = 'jyotish_service',
  PACKAGE = 'package',
}

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId; // For product/healing/puja orders
  bookingId?: mongoose.Types.ObjectId; // For jyotish bookings
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySessionId?: string; // For Nabil Bank SessionID
  idempotencyKey?: string; // For preventing duplicate payments
  receipt?: string;
  notes?: string;
  refundAmount?: number;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      refPath: 'orderModel',
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'JyotishBooking',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    gatewayTransactionId: {
      type: String,
    },
    gatewayOrderId: {
      type: String,
    },
    gatewayPaymentId: {
      type: String,
    },
    gatewaySessionId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
    },
    receipt: {
      type: String,
    },
    notes: {
      type: String,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentSchema.index({ paymentType: 1, status: 1 });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
paymentSchema.index(
  { orderId: 1, gatewayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      orderId: { $exists: true, $type: 'objectId' },
      gatewayPaymentId: { $type: 'string', $gt: '' },
    },
  }
);

export const PaymentModel = mongoose.model<IPayment>('Payment', paymentSchema);

