import { z } from 'zod';

/**
 * Zod schema for astrology analysis request
 */
export const astrologyAnalyzeSchema = z.object({
  body: z.object({
    birthDetails: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
      latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
      longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
      timezone: z.string().optional().default('Asia/Kathmandu'),
      place: z.string().optional(),
    }),
    category: z
      .enum([
        'overall',
        'wealth',
        'health',
        'mental_wellbeing',
        'relationship',
        'career',
        'spiritual',
      ])
      .optional()
      .default('overall'),
  }),
});



