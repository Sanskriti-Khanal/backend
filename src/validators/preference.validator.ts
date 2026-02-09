import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    preferences: z
      .object({
        dailyForecast: z.boolean().optional(),
        bookingReminder: z.boolean().optional(),
        paymentSuccess: z.boolean().optional(),
        orderUpdate: z.boolean().optional(),
        message: z.boolean().optional(),
        system: z.boolean().optional(),
      })
      .optional(),
    pushEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    quietHoursStart: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    quietHoursEnd: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
});

export const updatePreferenceFieldSchema = z.object({
  body: z.object({
    value: z.union([z.boolean(), z.string()]),
  }),
  params: z.object({
    field: z.string().min(1),
  }),
});












