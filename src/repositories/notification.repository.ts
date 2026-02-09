import {
  NotificationModel,
  INotification,
  NotificationStatus,
  NotificationType,
} from '@models/Notification.model';
import {
  DailyForecastModel,
  IDailyForecast,
} from '@models/DailyForecast.model';

export class NotificationRepository {
  // Notification methods
  async createNotification(
    notificationData: Partial<INotification>
  ): Promise<INotification> {
    return NotificationModel.create(notificationData);
  }

  async createBulkNotifications(
    notifications: Partial<INotification>[]
  ): Promise<INotification[]> {
    const created = await NotificationModel.insertMany(notifications);
    return created as INotification[];
  }

  async findNotificationById(id: string): Promise<INotification | null> {
    return NotificationModel.findById(id).populate('user', 'fullName username');
  }

  async findNotificationsByUser(
    userId: string,
    filters?: { status?: NotificationStatus; type?: NotificationType }
  ): Promise<INotification[]> {
    const query: any = { user: userId };
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    return NotificationModel.find(query)
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationModel.countDocuments({
      user: userId,
      status: { $in: [NotificationStatus.PENDING, NotificationStatus.SENT] },
    });
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return NotificationModel.findByIdAndUpdate(
      notificationId,
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      {
        user: userId,
        status: { $in: [NotificationStatus.PENDING, NotificationStatus.SENT] },
      },
      {
        status: NotificationStatus.READ,
        readAt: new Date(),
      }
    );
  }

  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ): Promise<INotification | null> {
    const updateData: any = { status };
    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    }
    return NotificationModel.findByIdAndUpdate(notificationId, updateData, {
      new: true,
    });
  }

  async findPendingNotifications(): Promise<INotification[]> {
    return NotificationModel.find({ status: NotificationStatus.PENDING })
      .populate('user', 'fullName username phone')
      .sort({ createdAt: 1 });
  }

  // Daily Forecast methods
  async createForecast(
    forecastData: Partial<IDailyForecast>
  ): Promise<IDailyForecast> {
    return DailyForecastModel.create(forecastData);
  }

  async findForecastByDate(date: Date): Promise<IDailyForecast | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return DailyForecastModel.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async findForecastByDateAndZodiac(
    date: Date,
    zodiacSign: string
  ): Promise<IDailyForecast | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return DailyForecastModel.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      zodiacSign,
    });
  }

  async updateForecast(
    id: string,
    data: Partial<IDailyForecast>
  ): Promise<IDailyForecast | null> {
    return DailyForecastModel.findByIdAndUpdate(id, data, { new: true });
  }

  async findForecastsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<IDailyForecast[]> {
    return DailyForecastModel.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });
  }
}

