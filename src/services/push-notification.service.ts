import admin from 'firebase-admin';
import { Client } from 'onesignal-node';
import env from '@config/env';
import { UserDeviceModel, IUserDevice } from '@models/UserDevice.model';
import { INotification } from '@models/Notification.model';

export class PushNotificationService {
  private fcmInitialized: boolean = false;
  private oneSignalClient: Client | null = null;
  private static oneSignalMissingLogged = false;
  private static oneSignalInitLogged = false;

  constructor() {
    this.initializeFCM();
    this.initializeOneSignal();
  }

  private initializeFCM(): void {
    if (env.FCM_PROJECT_ID && env.FCM_PRIVATE_KEY && env.FCM_CLIENT_EMAIL) {
      try {
        // Many services instantiate PushNotificationService; initialize Admin SDK only once.
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: env.FCM_PROJECT_ID,
              privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
              clientEmail: env.FCM_CLIENT_EMAIL,
            }),
          });
          console.log('✅ FCM initialized successfully');
        }
        this.fcmInitialized = true;
      } catch (error) {
        console.error('❌ FCM initialization failed:', error);
      }
    } else {
      console.warn('⚠️ FCM credentials not provided');
    }
  }

  private initializeOneSignal(): void {
    if (env.ONESIGNAL_APP_ID && env.ONESIGNAL_REST_API_KEY) {
      try {
        this.oneSignalClient = new Client(env.ONESIGNAL_REST_API_KEY, env.ONESIGNAL_APP_ID);
        if (!PushNotificationService.oneSignalInitLogged) {
          console.log('✅ OneSignal initialized successfully');
          PushNotificationService.oneSignalInitLogged = true;
        }
      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    } else {
      if (!PushNotificationService.oneSignalMissingLogged) {
        console.warn('⚠️ OneSignal credentials not provided');
        PushNotificationService.oneSignalMissingLogged = true;
      }
    }
  }

  // Register user device
  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    provider: 'fcm' | 'onesignal'
  ): Promise<IUserDevice> {
    // Check if device already exists
    const existing = await UserDeviceModel.findOne({
      user: userId,
      deviceToken,
    });

    if (existing) {
      // Update existing device
      existing.isActive = true;
      existing.lastActiveAt = new Date();
      existing.platform = platform;
      existing.provider = provider;
      return existing.save();
    }

    // Create new device
    return UserDeviceModel.create({
      user: userId as any,
      deviceToken,
      platform,
      provider,
      isActive: true,
      lastActiveAt: new Date(),
    });
  }

  // Unregister device
  async unregisterDevice(deviceToken: string): Promise<void> {
    await UserDeviceModel.findOneAndUpdate(
      { deviceToken },
      { isActive: false }
    );
  }

  // Send push notification via FCM
  private async sendFCMNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    if (!this.fcmInitialized) {
      console.warn('FCM not initialized, skipping notification');
      return false;
    }

    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data
          ? Object.entries(data).reduce(
              (acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
              },
              {} as Record<string, string>
            )
          : undefined,
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log('FCM notification sent:', response);
      return true;
    } catch (error: any) {
      console.error('FCM notification failed:', error);
      // If token is invalid, mark device as inactive
      if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
        await this.unregisterDevice(deviceToken);
      }
      return false;
    }
  }

  // Send push notification via OneSignal
  private async sendOneSignalNotification(
    playerId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    if (!this.oneSignalClient) {
      console.warn('OneSignal not initialized, skipping notification');
      return false;
    }

    try {
      const notification = {
        contents: {
          en: body,
        },
        headings: {
          en: title,
        },
        include_player_ids: [playerId],
        data: data || {},
      };

      const response = await this.oneSignalClient.createNotification(notification);
      console.log('OneSignal notification sent:', response);
      return true;
    } catch (error) {
      console.error('OneSignal notification failed:', error);
      return false;
    }
  }

  // Send notification to a single user
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ sent: number; failed: number }> {
    const devices = await UserDeviceModel.find({
      user: userId,
      isActive: true,
    });

    let sent = 0;
    let failed = 0;

    for (const device of devices) {
      let success = false;

      if (device.provider === 'fcm') {
        success = await this.sendFCMNotification(device.deviceToken, title, body, data);
      } else if (device.provider === 'onesignal') {
        success = await this.sendOneSignalNotification(device.deviceToken, title, body, data);
      }

      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  // Send notification to multiple users
  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, title, body, data);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { sent: totalSent, failed: totalFailed };
  }

  // Send notification to all active devices of a user
  async sendNotification(
    notification: INotification
  ): Promise<{ sent: number; failed: number }> {
    const result = await this.sendToUser(
      notification.user.toString(),
      notification.title,
      notification.message,
      {
        notificationId: notification._id.toString(),
        type: notification.type,
        ...notification.metadata,
      }
    );

    return result;
  }

  // Send bulk notifications
  async sendBulkNotifications(
    notifications: INotification[]
  ): Promise<{ sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const notification of notifications) {
      const result = await this.sendNotification(notification);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { sent: totalSent, failed: totalFailed };
  }
}

