import { z } from 'zod';

// Listing validators
export const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    purpose: z.string().optional(),
    itemsIncluded: z.string().optional(),
    timeSlots: z.array(z.string()).optional(),
    price: z.number().positive('Price must be positive'),
    onlinePrice: z.number().positive('Online price must be positive').optional(),
    offlinePrice: z.number().positive('Offline price must be positive').optional(),
    duration: z.number().int().positive('Duration must be positive'),
    images: z.array(z.string()).optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateListingSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    purpose: z.string().optional(),
    itemsIncluded: z.string().optional(),
    timeSlots: z.array(z.string()).optional(),
    price: z.number().positive().optional(),
    onlinePrice: z.number().positive().optional(),
    offlinePrice: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
    images: z.array(z.string()).optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listingIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID'),
  }),
});

export const searchListingSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
  }),
});

export const categoryListingSchema = z.object({
  params: z.object({
    category: z.string().min(1, 'Category is required'),
  }),
});

// Package validators
export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    originalPrice: z.number().positive().optional(),
    targetedIssue: z.string().optional(),
    pujaIncluded: z.string().optional(),
    itemsNeeded: z.string().optional(),
    onlinePrice: z.number().positive().optional(),
    offlinePrice: z.number().positive().optional(),
    timeSlots: z.array(z.string()).optional(),
    listings: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    duration: z.number().int().positive('Duration must be positive'),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePackageSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    targetedIssue: z.string().optional(),
    pujaIncluded: z.string().optional(),
    itemsNeeded: z.string().optional(),
    onlinePrice: z.number().positive().optional(),
    offlinePrice: z.number().positive().optional(),
    timeSlots: z.array(z.string()).optional(),
    listings: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    duration: z.number().int().positive().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const packageIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid package ID'),
  }),
});

// Review validators
export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    comment: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID'),
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










