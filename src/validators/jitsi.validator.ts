import { z } from 'zod';

export const createJitsiTokenSchema = z.object({
  body: z.object({
    room: z
      .string()
      .min(1, 'Room is required')
      .max(120, 'Room name is too long')
      .regex(/^[A-Za-z0-9_-]+$/, 'Room may only contain letters, numbers, "_" and "-"'),
    displayName: z.string().min(1).max(120).optional(),
    moderator: z.boolean().optional(),
  }),
});
