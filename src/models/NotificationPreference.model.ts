import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from './Notification.model';

export interface INotificationPreference extends Document {
  user: mongoose.Types.ObjectId;
  preferences: {
    dailyForecast: boolean;
    bookingReminder: boolean;
    paymentSuccess: boolean;
    orderUpdate: boolean;
    message: boolean;
    system: boolean;
  };
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart?: string; // HH:mm format (e.g., "22:00")
  quietHoursEnd?: string; // HH:mm format (e.g., "08:00")
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferences: {
      dailyForecast: {
        type: Boolean,
        default: true,
      },
      bookingReminder: {
        type: Boolean,
        default: true,
      },
      paymentSuccess: {
        type: Boolean,
        default: true,
      },
      orderUpdate: {
        type: Boolean,
        default: true,
      },
      message: {
        type: Boolean,
        default: true,
      },
      system: {
        type: Boolean,
        default: true,
      },
    },
    pushEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: false,
    },
    smsEnabled: {
      type: Boolean,
      default: false,
    },
    quietHoursStart: {
      type: String,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
    quietHoursEnd: {
      type: String,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
  },
  {
    timestamps: true,
  }
);

notificationPreferenceSchema.index({ user: 1 });

export const NotificationPreferenceModel = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);












