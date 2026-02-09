import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '@services/notification.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Forecast methods
  createForecast = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const forecast = await this.notificationService.createDailyForecast({
        ...req.body,
        date: new Date(req.body.date),
      });
      sendSuccess(res, forecast, 'Forecast created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getTodayForecast = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const forecast = await this.notificationService.getTodayForecast(
        req.user!.id
      );
      sendSuccess(res, forecast);
    } catch (error) {
      next(error);
    }
  };

  getForecast = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const date = req.query.date
        ? new Date(req.query.date as string)
        : new Date();
      const zodiacSign = req.query.zodiacSign as string | undefined;

      const forecast = await this.notificationService.getForecastByDate(
        date,
        zodiacSign
      );
      sendSuccess(res, forecast);
    } catch (error) {
      next(error);
    }
  };

  // Notification methods
  getUserNotifications = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters: any = {};
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.type) {
        filters.type = req.query.type;
      }

      const notifications = await this.notificationService.getUserNotifications(
        req.user!.id,
        filters
      );
      sendSuccess(res, notifications);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const count = await this.notificationService.getUnreadCount(req.user!.id);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notification = await this.notificationService.markAsRead(
        req.params.id,
        req.user!.id
      );
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.notificationService.markAllAsRead(req.user!.id);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  };

  createNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notification = await this.notificationService.createNotification(
        req.body.userId,
        req.body
      );
      sendSuccess(res, notification, 'Notification created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  // Admin/System method to send daily forecasts
  sendDailyForecasts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.notificationService.sendDailyForecasts();
      sendSuccess(res, result, 'Daily forecasts sent');
    } catch (error) {
      next(error);
    }
  };

  // Device management
  registerDevice = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const device = await this.notificationService.registerDevice(
        req.user!.id,
        req.body.deviceToken,
        req.body.platform,
        req.body.provider
      );
      sendSuccess(res, device, 'Device registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  unregisterDevice = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.notificationService.unregisterDevice(req.body.deviceToken);
      sendSuccess(res, null, 'Device unregistered successfully');
    } catch (error) {
      next(error);
    }
  };

  // Preference methods
  getPreferences = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const preferences = await this.notificationService.getPreferences(req.user!.id);
      sendSuccess(res, preferences);
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const preferences = await this.notificationService.updatePreferences(
        req.user!.id,
        req.body
      );
      sendSuccess(res, preferences, 'Preferences updated successfully');
    } catch (error) {
      next(error);
    }
  };

  updatePreferenceField = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const preferences = await this.notificationService.updatePreferenceField(
        req.user!.id,
        req.params.field,
        req.body.value
      );
      sendSuccess(res, preferences, 'Preference updated successfully');
    } catch (error) {
      next(error);
    }
  };
}

