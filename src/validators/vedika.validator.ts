import { z } from 'zod';

export const vedikaQuerySchema = z.object({
  body: z.object({
    question: z.string().min(1).max(2000),
    birthDetails: z.object({
      datetime: z.string().min(16, 'datetime must include date and time'),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      timezone: z.string().min(1).max(64),
    }),
  }),
});
