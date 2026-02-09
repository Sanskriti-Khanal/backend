import { NotificationRepository } from '@repositories/notification.repository';
import { NotificationPreferenceRepository } from '@repositories/notification-preference.repository';
import { UserRepository } from '@repositories/user.repository';
import { PushNotificationService } from './push-notification.service';
import {
  INotification,
  NotificationType,
  NotificationStatus,
} from '@models/Notification.model';
import { IDailyForecast } from '@models/DailyForecast.model';
import { INotificationPreference } from '@models/NotificationPreference.model';
import { NotFoundError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';

// Helper function to get zodiac sign from date of birth
function getZodiacSign(dob: Date): string {
  const month = dob.getMonth() + 1;
  const day = dob.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private preferenceRepository: NotificationPreferenceRepository;
  private userRepository: UserRepository;
  private pushNotificationService: PushNotificationService;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.preferenceRepository = new NotificationPreferenceRepository();
    this.userRepository = new UserRepository();
    this.pushNotificationService = new PushNotificationService();
  }

  // Create daily forecast
  async createDailyForecast(
    data: Partial<IDailyForecast>
  ): Promise<IDailyForecast> {
    // Check if forecast already exists for this date
    const existing = await this.notificationRepository.findForecastByDate(
      data.date!
    );
    if (existing) {
      throw new BadRequestError('Forecast already exists for this date');
    }

    return this.notificationRepository.createForecast(data);
  }

  // Get today's forecast for a user
  async getTodayForecast(userId: string): Promise<IDailyForecast | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.dob) {
      return null; // User doesn't have DOB, can't determine zodiac
    }

    const zodiacSign = getZodiacSign(user.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.notificationRepository.findForecastByDateAndZodiac(
      today,
      zodiacSign
    );
  }

  // Get forecast by date and zodiac
  async getForecastByDate(
    date: Date,
    zodiacSign?: string
  ): Promise<IDailyForecast | null> {
    if (zodiacSign) {
      return this.notificationRepository.findForecastByDateAndZodiac(
        date,
        zodiacSign
      );
    }
    return this.notificationRepository.findForecastByDate(date);
  }

  // Check if user has opted in for notification type
  private async shouldSendNotification(
    userId: string,
    notificationType: NotificationType
  ): Promise<boolean> {
    const preference = await this.preferenceRepository.findPreferenceByUser(userId);
    
    // If no preference exists, default to true (opt-in by default)
    if (!preference) {
      return true;
    }

    // Check if push notifications are enabled
    if (!preference.pushEnabled) {
      return false;
    }

    // Check quiet hours
    if (preference.quietHoursStart && preference.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Check if current time is within quiet hours
      if (this.isWithinQuietHours(currentTime, preference.quietHoursStart, preference.quietHoursEnd)) {
        return false;
      }
    }

    // Check specific notification type preference
    switch (notificationType) {
      case NotificationType.DAILY_FORECAST:
        return preference.preferences.dailyForecast;
      case NotificationType.BOOKING_REMINDER:
        return preference.preferences.bookingReminder;
      case NotificationType.PAYMENT_SUCCESS:
        return preference.preferences.paymentSuccess;
      case NotificationType.ORDER_UPDATE:
        return preference.preferences.orderUpdate;
      case NotificationType.MESSAGE:
        return preference.preferences.message;
      case NotificationType.SYSTEM:
        return preference.preferences.system;
      default:
        return true;
    }
  }

  // Helper to check if time is within quiet hours
  private isWithinQuietHours(
    currentTime: string,
    startTime: string,
    endTime: string
  ): boolean {
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const current = currentHour * 60 + currentMin;
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    // Handle quiet hours that span midnight
    if (start > end) {
      return current >= start || current <= end;
    }
    return current >= start && current <= end;
  }

  // Send daily forecast notifications to all users
  async sendDailyForecasts(): Promise<{ sent: number; failed: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active users with DOB
    const users = await this.userRepository.findAll();
    const usersWithDob = users.filter(
      (u) => u.dob && u.isActive && u.role === UserRole.USER
    );

    let sent = 0;
    let failed = 0;
    const notifications: Partial<INotification>[] = [];

    for (const user of usersWithDob) {
      try {
        // Check if user has opted in for daily forecasts
        const shouldSend = await this.shouldSendNotification(
          user._id.toString(),
          NotificationType.DAILY_FORECAST
        );

        if (!shouldSend) {
          continue; // Skip users who have opted out
        }

        const zodiacSign = getZodiacSign(user.dob!);
        const forecast = await this.notificationRepository.findForecastByDateAndZodiac(
          today,
          zodiacSign
        );

        if (forecast) {
          const title = `Daily Forecast for ${zodiacSign}`;
          const message = `Today's Forecast:\n\nGeneral: ${forecast.forecast.general}\n\nLove: ${forecast.forecast.love}\n\nCareer: ${forecast.forecast.career}\n\nHealth: ${forecast.forecast.health}\n\nFinance: ${forecast.forecast.finance}${
            forecast.luckyNumber ? `\n\nLucky Number: ${forecast.luckyNumber}` : ''
          }${forecast.luckyColor ? `\nLucky Color: ${forecast.luckyColor}` : ''}`;

          notifications.push({
            user: user._id,
            type: NotificationType.DAILY_FORECAST,
            title,
            message,
            status: NotificationStatus.PENDING,
            metadata: {
              forecastId: forecast._id,
              zodiacSign,
              date: today,
            },
          });
        }
      } catch (error) {
        console.error(`Failed to create notification for user ${user._id}:`, error);
        failed++;
      }
    }

    // Bulk insert notifications
    if (notifications.length > 0) {
      const createdNotifications = await this.notificationRepository.createBulkNotifications(notifications);
      sent = createdNotifications.length;

      // Send push notifications
      for (const notification of createdNotifications) {
        try {
          const pushResult = await this.pushNotificationService.sendNotification(notification);
          
          if (pushResult.sent > 0) {
            await this.notificationRepository.updateNotificationStatus(
              notification._id.toString(),
              NotificationStatus.SENT
            );
          } else {
            await this.notificationRepository.updateNotificationStatus(
              notification._id.toString(),
              NotificationStatus.FAILED
            );
          }
        } catch (error) {
          console.error(`Failed to send push notification ${notification._id}:`, error);
          await this.notificationRepository.updateNotificationStatus(
            notification._id.toString(),
            NotificationStatus.FAILED
          );
        }
      }
    }

    return { sent, failed };
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    filters?: { status?: NotificationStatus; type?: NotificationType }
  ): Promise<INotification[]> {
    return this.notificationRepository.findNotificationsByUser(userId, filters);
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await this.notificationRepository.findNotificationById(
      notificationId
    );
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to read this notification');
    }

    const updated = await this.notificationRepository.markAsRead(notificationId);
    if (!updated) {
      throw new NotFoundError('Notification not found');
    }

    return updated;
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  // Create notification
  async createNotification(
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      metadata?: Record<string, any>;
    }
  ): Promise<INotification> {
    // Check if user has opted in for this notification type
    const shouldSend = await this.shouldSendNotification(userId, data.type);
    
    const notification = await this.notificationRepository.createNotification({
      user: userId as any,
      ...data,
      status: shouldSend ? NotificationStatus.PENDING : NotificationStatus.FAILED,
    });

    // Send push notification if user has opted in
    if (shouldSend) {
      try {
        const pushResult = await this.pushNotificationService.sendNotification(notification);
        if (pushResult.sent > 0) {
          await this.notificationRepository.updateNotificationStatus(
            notification._id.toString(),
            NotificationStatus.SENT
          );
        }
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }

    return notification;
  }

  // Send notification (mark as sent)
  async sendNotification(notificationId: string): Promise<INotification> {
    const notification = await this.notificationRepository.findNotificationById(
      notificationId
    );
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Send push notification
    const pushResult = await this.pushNotificationService.sendNotification(notification);
    
    // Update status based on push result
    const status = pushResult.sent > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED;
    const updated = await this.notificationRepository.updateNotificationStatus(
      notificationId,
      status
    );

    if (!updated) {
      throw new NotFoundError('Notification not found');
    }

    return updated;
  }

  // Register device for push notifications
  async registerDevice(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
    provider: 'fcm' | 'onesignal'
  ) {
    return this.pushNotificationService.registerDevice(userId, deviceToken, platform, provider);
  }

  // Unregister device
  async unregisterDevice(deviceToken: string): Promise<void> {
    return this.pushNotificationService.unregisterDevice(deviceToken);
  }

  // Preference management
  async getPreferences(userId: string): Promise<INotificationPreference> {
    return this.preferenceRepository.findOrCreatePreference(userId);
  }

  async updatePreferences(
    userId: string,
    data: Partial<INotificationPreference>
  ): Promise<INotificationPreference> {
    const updated = await this.preferenceRepository.updatePreference(userId, data);
    if (!updated) {
      throw new NotFoundError('Preference not found');
    }
    return updated;
  }

  async updatePreferenceField(
    userId: string,
    field: string,
    value: boolean | string
  ): Promise<INotificationPreference> {
    const updated = await this.preferenceRepository.updatePreferenceField(
      userId,
      field,
      value
    );
    if (!updated) {
      throw new NotFoundError('Preference not found');
    }
    return updated;
  }
}

