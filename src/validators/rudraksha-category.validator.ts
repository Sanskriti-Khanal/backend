import { z } from 'zod';

export const createRudrakshaCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    slug: z.string().min(1, 'Slug is required').trim().toLowerCase(),
    description: z.string().optional(),
    detailedDescription: z.string().optional(),
    spiritualSignificance: z.string().optional(),
    associatedPlanet: z.string().optional(),
    associatedDeity: z.string().optional(),
    image: z.string().optional().or(z.literal('')),
    mukhiCount: z.number().int().min(0).max(26).optional(),
    categoryType: z.enum(['mukhi', 'special'], {
      required_error: 'Category type is required',
      invalid_type_error: 'Category type must be either "mukhi" or "special"',
    }),
    isActive: z.boolean().default(true),
    displayOrder: z.number().int().default(0),
    benefits: z.array(z.string()).optional(),
    priceRange: z
      .object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional(),
      })
      .optional(),
  }),
});

export const updateRudrakshaCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    slug: z.string().min(1).trim().toLowerCase().optional(),
    description: z.string().optional(),
    detailedDescription: z.string().optional(),
    spiritualSignificance: z.string().optional(),
    associatedPlanet: z.string().optional(),
    associatedDeity: z.string().optional(),
    image: z.string().optional().or(z.literal('')),
    mukhiCount: z.number().int().min(0).max(26).optional(),
    categoryType: z.enum(['mukhi', 'special']).optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
    benefits: z.array(z.string()).optional(),
    priceRange: z
      .object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional(),
      })
      .optional(),
  }),
});

export const rudrakshaCategoryIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
});

export const rudrakshaCategorySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});

export const rudrakshaCategoryTypeSchema = z.object({
  params: z.object({
    type: z.enum(['mukhi', 'special'], {
      errorMap: () => ({ message: 'Type must be either "mukhi" or "special"' }),
    }),
  }),
});

export const mukhiCountSchema = z.object({
  params: z.object({
    mukhiCount: z
      .string()
      .regex(/^\d+$/, 'Mukhi count must be a number')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 0 && val <= 26, {
        message: 'Mukhi count must be between 0 and 26',
      }),
  }),
});

