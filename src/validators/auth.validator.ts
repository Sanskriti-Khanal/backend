import { z } from 'zod';
import { UserRole } from '@types';

/** Mobile clients often send 10-digit local (Nepal) or full digits; backend normalizes to E.164. */
const phoneInputSchema = z
  .string()
  .trim()
  .min(1, 'Phone is required')
  .max(32, 'Phone number is too long');

export const sendRegistrationOtpSchema = z.object({
  body: z.object({
    phone: phoneInputSchema,
  }),
});

export const verifyRegistrationSchema = z.object({
  body: z.object({
    phone: phoneInputSchema,
    code: z.string().trim().min(4).max(10),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    username: z.string().trim().min(3).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z
      .nativeEnum(UserRole)
      .refine((r) => r !== UserRole.ADMIN, { message: 'Invalid role' })
      .optional(),
  }),
});

export const sendPasswordResetOtpSchema = z.object({
  body: z.object({
    phone: phoneInputSchema,
  }),
});

const resetByOtp = z.object({
  phone: phoneInputSchema,
  code: z.string().trim().min(4).max(10),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
const resetBySetToken = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  passwordSetToken: z.string().min(32, 'Invalid password-set token'),
});
export const resetPasswordWithOtpSchema = z.object({
  body: z.union([resetBySetToken, resetByOtp]),
});

