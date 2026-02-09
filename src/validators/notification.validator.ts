import { z } from 'zod';
import { NotificationType } from '@models/Notification.model';

export const createForecastSchema = z.object({
  body: z.object({
    date: z.string().datetime(),
    zodiacSign: z.string().min(1),
    forecast: z.object({
      general: z.string().min(10),
      love: z.string().min(10),
      career: z.string().min(10),
      health: z.string().min(10),
      finance: z.string().min(10),
    }),
    luckyNumber: z.number().int().min(1).max(100).optional(),
    luckyColor: z.string().optional(),
  }),
});

export const getForecastSchema = z.object({
  query: z.object({
    date: z.string().datetime().optional(),
    zodiacSign: z.string().optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID'),
  }),
});

export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    type: z.nativeEnum(NotificationType),
    title: z.string().min(1),
    message: z.string().min(1),
    metadata: z.record(z.any()).optional(),
  }),
});

export const notificationFiltersSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    type: z.nativeEnum(NotificationType).optional(),
  }),
});












