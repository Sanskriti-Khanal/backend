import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDevice extends Document {
  user: mongoose.Types.ObjectId;
  deviceToken: string; // FCM token or OneSignal player ID
  platform: 'ios' | 'android' | 'web';
  provider: 'fcm' | 'onesignal';
  isActive: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userDeviceSchema = new Schema<IUserDevice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceToken: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['fcm', 'onesignal'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One user can have multiple devices, but same token should be unique
userDeviceSchema.index({ user: 1, deviceToken: 1 }, { unique: true });
userDeviceSchema.index({ user: 1, isActive: 1 });
userDeviceSchema.index({ deviceToken: 1 });

export const UserDeviceModel = mongoose.model<IUserDevice>(
  'UserDevice',
  userDeviceSchema
);












