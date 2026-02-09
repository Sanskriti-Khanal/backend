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












