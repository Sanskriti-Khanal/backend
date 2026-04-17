import { z } from 'zod';
import { UserRole } from '@types';
import { OrderSessionStatus, OrderStatus } from '@models/Order.model';

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
    avatarUrl: z.string().min(1).optional(),
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
    avatarUrl: z.union([z.string().min(1), z.literal('')]).optional(),
    isOnline: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

const optionalObjectId = () =>
  z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined;
    return v;
  }, z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id').optional());

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    type: z.string().optional(),
    rulingDeity: z.string().optional(),
    beejMantra: z.string().optional(),
    price: z.number().min(0),
    originalPrice: z.number().min(0).optional(),
    startingPrice: z.number().min(0).optional(),
    images: z.array(z.string().min(1)).optional().default([]),
    category: z.string().min(1),
    rudrakshaCategory: optionalObjectId(),
    gemCategory: optionalObjectId(),
    productType: z.enum(['BEADS', 'MALA']).optional(),
    stock: z.number().min(0).optional().default(0),
    availability: z.enum(['InStock', 'OutOfStock', 'PreOrder']).optional().default('InStock'),
    sku: z.string().min(1),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    type: z.string().optional(),
    rulingDeity: z.string().optional(),
    beejMantra: z.string().optional(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    startingPrice: z.number().min(0).optional(),
    images: z.array(z.string().min(1)).optional(),
    category: z.string().min(1).optional(),
    rudrakshaCategory: optionalObjectId(),
    gemCategory: optionalObjectId(),
    productType: z.enum(['BEADS', 'MALA']).optional(),
    stock: z.number().min(0).optional(),
    availability: z.enum(['InStock', 'OutOfStock', 'PreOrder']).optional(),
    sku: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
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

export const updateOrderSessionStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
    sessionNumber: z.coerce.number().int().min(1, 'Session number must be >= 1'),
  }),
  body: z.object({
    status: z.nativeEnum(OrderSessionStatus),
  }),
});

/** Admin list of saved kundali / milan payloads */
export const astrologySavedListQuerySchema = z.object({
  query: z.object({
    kind: z.enum(['kundali', 'milan']),
    limit: z.coerce.number().min(1).max(500).optional(),
  }),
});

export const astrologyRashifalLimitQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(500).optional(),
  }),
});












