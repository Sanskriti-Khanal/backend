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
import { IUser } from '@models/User.model';
import env from '@config/env';

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

function resolveDobForZodiac(user: IUser): Date | null {
  const ad = user.astroDetails;
  if (ad?.dateOfBirth) {
    const d = new Date(ad.dateOfBirth);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (user.dob) {
    const d = new Date(user.dob);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

const RASHI_SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function signNameFromNumber(sign: number): string | null {
  if (!Number.isFinite(sign)) return null;
  const i = Math.trunc(sign);
  if (i < 1 || i > 12) return null;
  return RASHI_SIGN_NAMES[i - 1] ?? null;
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

  private resolveTimeOfBirth(user: IUser): string | null {
    const fromAstro = user.astroDetails?.timeOfBirth?.trim();
    if (fromAstro) return fromAstro;
    const fromLegacy = user.birthTime?.trim();
    if (fromLegacy) return fromLegacy;
    return null;
  }

  private resolvePlaceOfBirth(user: IUser): string | null {
    const fromAstro = user.astroDetails?.placeOfBirth?.trim();
    if (fromAstro) return fromAstro;
    const fromLegacy = user.birthPlace?.trim();
    if (fromLegacy) return fromLegacy;
    return null;
  }

  private parseBirthTime(timeValue: string): { hour: number; minute: number } {
    const parts = timeValue.split(':');
    const hour = Number.parseInt(parts[0] ?? '12', 10);
    const minute = Number.parseInt((parts[1] ?? '0').replace(/[^0-9]/g, ''), 10);
    return {
      hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 12,
      minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
    };
  }

  private async resolveDailyrasifalContext(
    user: IUser,
    dob: Date
  ): Promise<
    | {
        zodiacSign: string;
        nativeMoonSign: number;
        moonTravelSign: number;
        tithiId: number;
        date: Date;
      }
    | null
  > {
    const timeOfBirth = this.resolveTimeOfBirth(user);
    const placeOfBirth = this.resolvePlaceOfBirth(user);
    if (!timeOfBirth || !placeOfBirth) {
      return null;
    }

    const BirthDetails = require('../astrology/models/BirthDetails');
    const GocharService = require('../astrology/services/GocharService');
    const LocationService = require('../astrology/services/LocationService');

    const locationService = new LocationService();
    locationService.init();

    const placeParts = placeOfBirth
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean);
    const cityQuery = placeParts[0] ?? placeOfBirth;
    const countryHint = placeParts.length > 1 ? placeParts[placeParts.length - 1] : null;

    let cities = locationService.searchCities(cityQuery, countryHint, 1) as Array<{
      cityName: string;
      country: string;
    }>;
    if (cities.length === 0 && countryHint) {
      cities = locationService.searchCities(cityQuery, null, 1);
    }
    if (cities.length === 0) {
      cities = locationService.searchCities(placeOfBirth, null, 1);
    }
    if (cities.length === 0) {
      return null;
    }

    const city = cities[0];
    const countryName = countryHint || city.country;
    const countries = locationService.searchCountries(countryName, 25) as Array<{
      name?: string;
      timezone?: string;
    }>;
    const exactCountry =
      countries.find(
        (c) =>
          (c.name ?? '').trim().toLowerCase() === countryName.trim().toLowerCase()
      ) ??
      countries.find(
        (c) =>
          (c.name ?? '').trim().toLowerCase() === city.country.trim().toLowerCase()
      ) ??
      countries[0];
    const timezone = exactCountry?.timezone;
    if (!timezone) {
      return null;
    }

    const { hour, minute } = this.parseBirthTime(timeOfBirth);
    const birthDetails = new BirthDetails({
      name: user.fullName || user.username || 'User',
      gender: user.astroDetails?.gender || 'male',
      date_ad: {
        year: dob.getUTCFullYear(),
        month: dob.getUTCMonth() + 1,
        day: dob.getUTCDate(),
      },
      time: { hour, minute },
      location: {
        cityName: city.cityName,
        countryName: city.country,
        timezone,
      },
    });

    const validation = birthDetails.validate();
    if (!validation.valid) {
      return null;
    }

    const gocharData = await new GocharService().calculateGochar(birthDetails);
    const moonTravelSign = Number(gocharData?.dailyrasifalContext?.moonTravelSign);
    const tithiId = Number(gocharData?.dailyrasifalContext?.tithiId);
    const nativeMoonSign = Number(
      (gocharData?.birthChart?.planets ?? []).find((p: any) => p.id === 'moon')?.sign
    );
    const signName = signNameFromNumber(nativeMoonSign);
    if (
      !signName ||
      !Number.isFinite(moonTravelSign) ||
      !Number.isFinite(tithiId)
    ) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      zodiacSign: signName,
      nativeMoonSign,
      moonTravelSign,
      tithiId,
      date: today,
    };
  }

  /**
   * Fallback when Mongo `DailyForecast` is missing:
   * compute current moon/tithi context and read text from astrology_predictions.db.
   */
  private async buildForecastFromAstrologyDb(
    user: IUser,
    dob: Date,
    context?: {
      zodiacSign: string;
      nativeMoonSign: number;
      moonTravelSign: number;
      tithiId: number;
      date: Date;
    }
  ): Promise<IDailyForecast | null> {
    try {
      const mj1Db = require('../astrology/database/mj1');
      const resolved = context ?? (await this.resolveDailyrasifalContext(user, dob));
      if (!resolved) {
        return null;
      }

      const prediction = String(
        mj1Db.getDailyRasifalPrediction(
          resolved.moonTravelSign,
          resolved.nativeMoonSign,
          resolved.tithiId
        ) ?? ''
      ).trim();
      if (!prediction) {
        return null;
      }

      const fallback: Partial<IDailyForecast> = {
        date: resolved.date,
        zodiacSign: resolved.zodiacSign,
        forecast: {
          general: prediction,
          love: prediction,
          career: prediction,
          health: prediction,
          finance: prediction,
        },
      };
      return fallback as IDailyForecast;
    } catch (error) {
      console.warn('Daily forecast fallback from astrology DB failed:', error);
      return null;
    }
  }

  // Create daily forecast
  async createDailyForecast(
    data: Partial<IDailyForecast>
  ): Promise<IDailyForecast> {
    if (!data.date || !data.zodiacSign) {
      throw new BadRequestError('date and zodiacSign are required');
    }

    // Check if forecast already exists for this date and zodiac sign
    const existing = await this.notificationRepository.findForecastByDateAndZodiac(
      data.date,
      data.zodiacSign
    );
    if (existing) {
      throw new BadRequestError(
        'Forecast already exists for this date and zodiac sign'
      );
    }

    return this.notificationRepository.createForecast(data);
  }

  // Get today's forecast for a user
  async getTodayForecast(userId: string): Promise<IDailyForecast | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const dob = resolveDobForZodiac(user);
    if (!dob) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moonContext = await this.resolveDailyrasifalContext(user, dob);
    if (moonContext?.zodiacSign) {
      const moonForecast =
        await this.notificationRepository.findForecastByDateAndZodiac(
          today,
          moonContext.zodiacSign
        );
      if (moonForecast) {
        return moonForecast;
      }
    } else {
      // Fallback to legacy western-sign lookup only when moon-sign context is unavailable.
      const zodiacSign = getZodiacSign(dob);
      const legacyForecast =
        await this.notificationRepository.findForecastByDateAndZodiac(
          today,
          zodiacSign
        );
      if (legacyForecast) {
        return legacyForecast;
      }
    }

    return this.buildForecastFromAstrologyDb(user, dob, moonContext ?? undefined);
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
  async sendDailyForecasts(): Promise<{
    sent: number;
    failed: number;
    remindersSent: number;
    remindersFailed: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eligibleUsers = await this.userRepository.findUsersEligibleForDailyRashifal();

    let sent = 0;
    let failed = 0;
    const notifications: Partial<INotification>[] = [];

    for (const user of eligibleUsers) {
      try {
        const shouldSend = await this.shouldSendNotification(
          user._id.toString(),
          NotificationType.DAILY_FORECAST
        );

        if (!shouldSend) {
          continue;
        }

        const dob = resolveDobForZodiac(user);
        if (!dob) {
          continue;
        }

        const zodiacSign = getZodiacSign(dob);
        const forecast = await this.notificationRepository.findForecastByDateAndZodiac(
          today,
          zodiacSign
        );

        if (forecast) {
          const fullMessage = `Today's Forecast:\n\nGeneral: ${forecast.forecast.general}\n\nLove: ${forecast.forecast.love}\n\nCareer: ${forecast.forecast.career}\n\nHealth: ${forecast.forecast.health}\n\nFinance: ${forecast.forecast.finance}${
            forecast.luckyNumber ? `\n\nLucky Number: ${forecast.luckyNumber}` : ''
          }${forecast.luckyColor ? `\nLucky Color: ${forecast.luckyColor}` : ''}`;

          const generalOneLine = forecast.forecast.general.replace(/\s+/g, ' ').trim();
          const previewMax = 220;
          const generalPreview =
            generalOneLine.length <= previewMax
              ? generalOneLine
              : `${generalOneLine.slice(0, previewMax - 3)}...`;
          const message = `${zodiacSign}: ${generalPreview}`;

          notifications.push({
            user: user._id,
            type: NotificationType.DAILY_FORECAST,
            title: 'Your Daily Rashifal is Ready',
            message,
            status: NotificationStatus.PENDING,
            metadata: {
              forecastId: forecast._id,
              zodiacSign,
              date: today,
              fullMessage,
            },
          });
        }
      } catch (error) {
        console.error(`Failed to create notification for user ${user._id}:`, error);
        failed++;
      }
    }

    if (notifications.length > 0) {
      const createdNotifications = await this.notificationRepository.createBulkNotifications(notifications);
      sent = createdNotifications.length;

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

    const reminder = await this.sendIncompleteProfileReminderPushes();

    return {
      sent,
      failed,
      remindersSent: reminder.sent,
      remindersFailed: reminder.failed,
    };
  }

  /**
   * Optional gentle FCM reminder for users without astrology profile (no in-app row).
   * Enable with DAILY_RASHIFAL_REMIND_INCOMPLETE=true
   */
  private async sendIncompleteProfileReminderPushes(): Promise<{ sent: number; failed: number }> {
    if (!env.DAILY_RASHIFAL_REMIND_INCOMPLETE) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const users = await this.userRepository.findUsersNeedingAstroProfileReminder();

    for (const user of users) {
      try {
        const allow = await this.shouldSendNotification(
          user._id.toString(),
          NotificationType.SYSTEM
        );
        if (!allow) continue;

        const r = await this.pushNotificationService.sendToUser(
          user._id.toString(),
          'Unlock personalized Rashifal',
          'Complete your profile to receive personalized daily Rashifal.',
          { type: 'astro_profile_reminder' }
        );
        sent += r.sent;
        failed += r.failed;
      } catch (e) {
        console.error(`Profile reminder failed for ${user._id}:`, e);
        failed++;
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
      /**
       * When true, the record is created for the in-app inbox only (unread until opened).
       * FCM / push is not invoked. Defaults to false for backward compatibility.
       */
      inAppOnly?: boolean;
    }
  ): Promise<INotification> {
    const { inAppOnly, ...payload } = data;
    // Check if user has opted in for this notification type
    const shouldSend = await this.shouldSendNotification(userId, data.type);

    const notification = await this.notificationRepository.createNotification({
      user: userId as any,
      ...payload,
      status: shouldSend ? NotificationStatus.PENDING : NotificationStatus.FAILED,
    });

    // Push only when not restricted to in-app delivery
    if (shouldSend && !inAppOnly) {
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

