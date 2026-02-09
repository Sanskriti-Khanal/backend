import { Router } from 'express';
import { NotificationController } from '@controllers/notification.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createForecastSchema,
  getForecastSchema,
  notificationIdSchema,
  createNotificationSchema,
  notificationFiltersSchema,
} from '@validators/notification.validator';
import {
  registerDeviceSchema,
  unregisterDeviceSchema,
} from '@validators/device.validator';
import {
  updatePreferencesSchema,
  updatePreferenceFieldSchema,
} from '@validators/preference.validator';

const router = Router();
const notificationController = new NotificationController();

// Public forecast endpoint (can be made public or protected)
router.get(
  '/forecasts',
  validate(getForecastSchema),
  notificationController.getForecast
);

// Protected routes - require authentication
router.use(authenticate);

// User forecast
router.get('/forecasts/today', notificationController.getTodayForecast);

// User notifications
router.get(
  '/notifications',
  validate(notificationFiltersSchema),
  notificationController.getUserNotifications
);
router.get('/notifications/unread', notificationController.getUnreadCount);
router.put(
  '/notifications/:id/read',
  validate(notificationIdSchema),
  notificationController.markAsRead
);
router.put('/notifications/read-all', notificationController.markAllAsRead);

// Device management
router.post(
  '/devices/register',
  validate(registerDeviceSchema),
  notificationController.registerDevice
);
router.post(
  '/devices/unregister',
  validate(unregisterDeviceSchema),
  notificationController.unregisterDevice
);

// Preference management
router.get('/preferences', notificationController.getPreferences);
router.put(
  '/preferences',
  validate(updatePreferencesSchema),
  notificationController.updatePreferences
);
router.put(
  '/preferences/:field',
  validate(updatePreferenceFieldSchema),
  notificationController.updatePreferenceField
);

// Admin/System routes
router.post(
  '/forecasts',
  authorize(UserRole.ADMIN),
  validate(createForecastSchema),
  notificationController.createForecast
);
router.post(
  '/notifications',
  authorize(UserRole.ADMIN),
  validate(createNotificationSchema),
  notificationController.createNotification
);
router.post(
  '/forecasts/send-daily',
  authorize(UserRole.ADMIN),
  notificationController.sendDailyForecasts
);

export default router;

