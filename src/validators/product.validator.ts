import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    type: z.string().optional(),
    rulingDeity: z.string().optional(),
    beejMantra: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    originalPrice: z.number().positive().optional(),
    startingPrice: z.number().positive().optional(),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
    category: z.string().min(1, 'Category is required'),
    stock: z.number().int().min(0, 'Stock must be non-negative'),
    availability: z.enum(['InStock', 'OutOfStock', 'PreOrder']).optional(),
    sku: z.string().min(1, 'SKU is required'),
    isActive: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    type: z.string().optional(),
    rulingDeity: z.string().optional(),
    beejMantra: z.string().optional(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    startingPrice: z.number().positive().optional(),
    images: z.array(z.string().url()).optional(),
    category: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    availability: z.enum(['InStock', 'OutOfStock', 'PreOrder']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const searchProductSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
  }),
});

export const categorySchema = z.object({
  params: z.object({
    category: z.string().min(1, 'Category is required'),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    comment: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
  params: z.object({
    reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID'),
  }),
});

export const reviewIdSchema = z.object({
  params: z.object({
    reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID'),
  }),
});












