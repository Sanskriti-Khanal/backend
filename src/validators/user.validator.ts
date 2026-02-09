import { z } from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum(['user', 'healer', 'jyotish', 'pujari', 'pandit']).optional(),
    dob: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const sendOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
    otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be 4 digits'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits').optional(),
    dob: z.string().optional(),
    birthTime: z.string().optional(),
    birthPlace: z.string().optional(),
    specialtyTitle: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    callPrice: z.number().min(0).optional(),
    chatPrice: z.number().min(0).optional(),
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
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
    otp: z.string().regex(/^[0-9]{4}$/, 'OTP must be 4 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});








