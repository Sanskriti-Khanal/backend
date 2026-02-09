import { z } from 'zod';

export const registerDeviceSchema = z.object({
  body: z.object({
    deviceToken: z.string().min(1, 'Device token is required'),
    platform: z.enum(['ios', 'android', 'web']),
    provider: z.enum(['fcm', 'onesignal']),
  }),
});

export const unregisterDeviceSchema = z.object({
  body: z.object({
    deviceToken: z.string().min(1, 'Device token is required'),
  }),
});












