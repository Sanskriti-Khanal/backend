import { z } from 'zod';
import { UserRole } from '@types';
import { OrderStatus } from '@models/Order.model';

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    fullName: z.string().min(2),
    role: z.nativeEnum(UserRole),
    isPhoneVerified: z.boolean().optional(),
    dob: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
    specialtyTitle: z.string().optional(),
    bio: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9]{10}$/).optional(),
    username: z.string().min(3).optional(),
    fullName: z.string().min(2).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isPhoneVerified: z.boolean().optional(),
    dob: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
    specialtyTitle: z.string().optional(),
    bio: z.string().optional(),
    isOnline: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const healingListingIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID'),
  }),
});

export const healingPackageIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid package ID'),
  }),
});

export const pujaListingIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID'),
  }),
});

export const pujaPackageIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid package ID'),
  }),
});

export const bookingIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
});

export const roleQuerySchema = z.object({
  query: z.object({
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});












