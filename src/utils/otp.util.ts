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

/** Trim and normalize OTP for comparison (avoids whitespace/copy-paste issues). */
export const normalizeOTP = (otp: string): string => (otp || '').trim();












