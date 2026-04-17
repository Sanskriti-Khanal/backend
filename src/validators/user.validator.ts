import { z } from 'zod';
import { UserRole } from '@types';

// Phone: 10–15 digits with country code (worldwide: Nepal 977…, USA 1…, UAE 971…, India 91…)
const phoneSchema = z.string().regex(/^[0-9]{10,15}$/, 'Phone must be 10–15 digits (with country code)');

export const registerUserSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z
      .nativeEnum(UserRole)
      .refine((r) => r !== UserRole.ADMIN, { message: 'Invalid role' })
      .optional(),
    dob: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const sendOTPSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be 4 digits').or(z.string().min(1).max(10)), // allow trimmed / dev bypass
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: phoneSchema.optional(),
    dob: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
    specialtyTitle: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    callPrice: z.number().min(0).optional(),
    chatPrice: z.number().min(0).optional(),
    onlinePrice: z.number().min(0).optional(),
    offlinePrice: z.number().min(0).optional(),
    experienceYears: z.number().int().min(0).optional(),
    availabilityStatus: z.enum(['active', 'not_active', 'busy']).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const updateJyotishStatusSchema = z.object({
  body: z
    .object({
      isOnline: z.boolean().optional(),
      availabilityStatus: z.enum(['active', 'not_active', 'busy']).optional(),
    })
    .refine((b) => b.isOnline !== undefined || b.availabilityStatus !== undefined, {
      message: 'Either isOnline or availabilityStatus must be provided',
    }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be 4 digits').or(z.string().min(1).max(10)),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});








