import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceAccess extends Document {
  user: mongoose.Types.ObjectId;
  serviceProvider: mongoose.Types.ObjectId;
  serviceType: 'chat' | 'call';
  orderId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceAccessSchema = new Schema<IServiceAccess>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceType: {
      type: String,
      enum: ['chat', 'call'],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceAccessSchema.index({ user: 1, serviceProvider: 1, serviceType: 1 }, { unique: true });
serviceAccessSchema.index({ user: 1 });
serviceAccessSchema.index({ serviceProvider: 1 });
serviceAccessSchema.index({ paymentId: 1 });

export const ServiceAccessModel = mongoose.model<IServiceAccess>('ServiceAccess', serviceAccessSchema);
