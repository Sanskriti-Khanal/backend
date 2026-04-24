import { BadRequestError } from '@errors/AppError';

// Generate 4-digit OTP (matches forgot-password UI design)
export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// OTP expiry time (10 minutes)
export const getOTPExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
};

export const isOTPExpired = (expiry: Date): boolean => {
  return new Date() > expiry;
};

/** Normalize phone to 10 digits (digits only, last 10). Kept for backward compat; prefer normalizePhoneToE164. */
export const normalizePhoneTo10 = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

/**
 * Normalize phone to canonical E.164 digits (with country code) for worldwide support.
 * - 10 digits → assume Nepal → 977 + digits
 * - 11+ digits → assume already has country code (e.g. 1xxxxxxxxxx US, 91xxxxxxxxxx IN, 971xxxxxxxxx UAE) → use as-is
 */
export const normalizePhoneToE164 = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `977${digits}`; // Nepal default
  if (digits.length >= 11) return digits;
  return digits;
};

/**
 * Accepts +E.164, digits with country code, or 10-digit Nepal local — returns +digits for Twilio.
 */
export const toE164Plus = (phone: string): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) {
    throw new BadRequestError('Phone number is too short (include country code or 10 digits for Nepal)');
  }
  const normalized = normalizePhoneToE164(digits);
  if (normalized.length < 11) {
    throw new BadRequestError('Invalid phone number');
  }
  return `+${normalized}`;
};

/**
 * Nepal mobiles are stored in Mongo either as full E.164 digits (`977` + 10 digits = 13 chars)
 * or as 10-digit local (`98…`). After normalizing input to 13-digit form, a failed `findOne({ phone })`
 * should retry with the last 10 digits — not length `12` (977+9), which never matches real NP mobiles.
 */
export const nepalPhoneLocalKeyIfApplicable = (normalizedDigits: string): string | null => {
  if (!normalizedDigits.startsWith('977')) return null;
  if (normalizedDigits.length === 13) return normalizedDigits.slice(-10);
  return null;
};

/** Trim and normalize OTP for comparison (avoids whitespace/copy-paste issues). */
export const normalizeOTP = (otp: string): string => (otp || '').trim();












