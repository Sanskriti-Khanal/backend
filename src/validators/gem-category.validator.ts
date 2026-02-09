import { z } from 'zod';

export const createGemCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    slug: z.string().min(1, 'Slug is required').trim().toLowerCase(),
    description: z.string().optional(),
    detailedDescription: z.string().optional(),
    spiritualSignificance: z.string().optional(),
    associatedPlanet: z.string().optional(),
    associatedDeity: z.string().optional(),
    image: z.string().optional().or(z.literal('')),
    gemType: z.string().optional(),
    categoryType: z.enum(['precious', 'semi-precious', 'other'], {
      required_error: 'Category type is required',
      invalid_type_error: 'Category type must be either "precious", "semi-precious", or "other"',
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

export const updateGemCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).trim().optional(),
    slug: z.string().min(1).trim().toLowerCase().optional(),
    description: z.string().optional(),
    detailedDescription: z.string().optional(),
    spiritualSignificance: z.string().optional(),
    associatedPlanet: z.string().optional(),
    associatedDeity: z.string().optional(),
    image: z.string().optional().or(z.literal('')),
    gemType: z.string().optional(),
    categoryType: z.enum(['precious', 'semi-precious', 'other']).optional(),
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

export const gemCategoryIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
});

export const gemCategorySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});

export const gemCategoryTypeSchema = z.object({
  params: z.object({
    type: z.enum(['precious', 'semi-precious', 'other'], {
      errorMap: () => ({ message: 'Type must be either "precious", "semi-precious", or "other"' }),
    }),
  }),
});









