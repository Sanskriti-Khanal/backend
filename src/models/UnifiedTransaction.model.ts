import mongoose, { Schema, Document } from 'mongoose';

export type UnifiedTransactionType = 'booking' | 'product' | 'service' | 'vastu';
export type UnifiedTransactionLifecycleStatus = 'pending' | 'success' | 'failed';

export interface IUnifiedTransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: UnifiedTransactionType;
  /** Domain id: healing session booking id, order id, etc. */
  referenceId: string;
  amount: number;
  currency: string;
  status: UnifiedTransactionLifecycleStatus;
  paymentStatus: UnifiedTransactionLifecycleStatus;
  paymentGateway?: 'khalti' | 'nabil';
  /** Gateway reference after initiation (e.g. Khalti pidx) */
  gatewayTransactionRef?: string;
  paymentId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const unifiedTransactionSchema = new Schema<IUnifiedTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking', 'product', 'service', 'vastu'],
      required: true,
      index: true,
    },
    referenceId: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NPR', uppercase: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentGateway: {
      type: String,
      enum: ['khalti', 'nabil'],
    },
    gatewayTransactionRef: { type: String, trim: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

unifiedTransactionSchema.index({ user: 1, createdAt: -1 });

export const UnifiedTransactionModel = mongoose.model<IUnifiedTransaction>(
  'UnifiedTransaction',
  unifiedTransactionSchema
);
