import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from backend root so PORT etc. are correct even when cwd differs
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // also load from cwd for overrides

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 5050))
    .pipe(z.number().int().positive()),
  MONGODB_URI: z.string().url(),
  // RS256: private key for signing, public key for verification (more secure than HS256)
  JWT_PRIVATE_KEY: z.string().min(100).refine((s) => s.includes('BEGIN'), { message: 'JWT_PRIVATE_KEY must be a PEM string (starts with -----BEGIN)' }),
  JWT_PUBLIC_KEY: z.string().min(100).refine((s) => s.includes('BEGIN'), { message: 'JWT_PUBLIC_KEY must be a PEM string (starts with -----BEGIN)' }),
  /** Short-lived access JWT (used for all logins). */
  JWT_ACCESS_EXPIRE: z.string().default('15m'),
  /** Refresh token lifetime when “Remember me” is checked (persistent login). */
  JWT_REFRESH_EXPIRE_REMEMBER: z.string().default('60d'),
  /** Refresh token lifetime when “Remember me” is unchecked (short session). */
  JWT_REFRESH_EXPIRE_SESSION: z.string().default('1d'),
  /** @deprecated Use JWT_REFRESH_EXPIRE_REMEMBER / JWT_REFRESH_EXPIRE_SESSION. */
  JWT_REFRESH_EXPIRE: z.string().default('60d'),
  /** @deprecated Access is always JWT_ACCESS_EXPIRE; kept for older deployments. */
  JWT_SESSION_EXPIRE: z.string().default('24h'),
  /** One-time token after phone OTP verify, used to set/reset password without a second provider check. */
  JWT_PASSWORD_SET_EXPIRE: z.string().default('15m'),
  /** HttpOnly cookie name for refresh token. */
  REFRESH_COOKIE_NAME: z.string().default('refresh_token'),
  /** @deprecated Legacy single expiry; defaults align with session-style token. */
  JWT_EXPIRE: z.string().default('24h'),
  /** @deprecated Legacy remember-me expiry; use JWT_ACCESS + JWT_REFRESH instead. */
  JWT_EXPIRE_REMEMBER: z.string().default('30d'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_API_KEY: z.string().optional(),
  TWILIO_API_SECRET: z.string().optional(),
  TWILIO_API_KEY_SID: z.string().optional(),
  TWILIO_API_KEY_SECRET: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  /** Alternative to Twilio: MSG91 (India/Nepal). Set MSG91_AUTH_KEY + MSG91_SENDER to use. */
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER: z.string().max(6).optional(),
  /** In development, if set (e.g. "1234"), this OTP is accepted for any user so you don't need to copy from terminal. */
  DEV_OTP_BYPASS: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Nabil Bank Payment Gateway
  NABIL_APPROVE_URL: z.string().url().optional(),
  NABIL_CANCEL_URL: z.string().url().optional(),
  NABIL_DECLINE_URL: z.string().url().optional(),
  BASE_URL: z.string().url().default('http://localhost:5000'),
  // Nabil Bank SSL Certificates (base64 encoded, for Vercel/serverless)
  NABIL_CERT_BASE64: z.string().optional(),
  NABIL_KEY_BASE64: z.string().optional(),
  // Nabil Bank Production Configuration
  NABIL_API_URL: z.string().url().optional(), // Production API URL (defaults to test if not set)
  NABIL_MERCHANT_ID: z.string().optional(), // Production Merchant ID (defaults to test if not set)
  NABIL_DECRYPT_KEY: z.string().optional(), // Production Decrypt Key (hex format, defaults to test if not set)
  // Cloudinary (optional, required only if using image uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Push Notifications
  FCM_SERVER_KEY: z.string().optional(),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_REST_API_KEY: z.string().optional(),
  PUSH_NOTIFICATION_PROVIDER: z.enum(['fcm', 'onesignal', 'both']).default('fcm'),
  // Nabil Bank Secret Key for webhook verification
  NABIL_SECRET_KEY: z.string().optional(),
  // Khalti Payment Gateway
  KHALTI_API_URL: z.string().url().optional(), // Defaults to https://dev.khalti.com/api/v2
  KHALTI_SECRET_KEY: z.string().optional(),
  KHALTI_PUBLIC_KEY: z.string().optional(),
  /** Must match the website URL registered in Khalti merchant settings. If unset, API BASE_URL is used (often api.*), which Khalti may reject—set to your public site e.g. https://merosathi.co */
  KHALTI_WEBSITE_URL: z.string().url().optional(),
  // Sentry Error Tracking
  SENTRY_DSN: z.string().url().optional(),
  /** Vedika astrology API (Ask MeroSathi); optional — route returns 503 if unset */
  VEDIKA_API_KEY: z.string().min(1).optional(),
  // Jitsi JWT token generation
  JITSI_DOMAIN: z.string().min(1).optional(),
  JITSI_APP_ID: z.string().min(1).optional(),
  JITSI_APP_SECRET: z.string().min(1).optional(),
  JITSI_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  /** Shared secret for POST /api/v1/cron/* (Vercel / external schedulers). */
  CRON_SECRET: z.string().min(1).optional(),
  /** When true, daily job also sends FCM to users without astrology profile (soft nudge). */
  DAILY_RASHIFAL_REMIND_INCOMPLETE: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true' || v === 'yes'),
  /** If "1", start in-process node-cron for daily Rashifal (non-serverless only). */
  ENABLE_INTERNAL_DAILY_RASHIFAL_CRON: z
    .string()
    .optional()
    .transform((v) => v === '1' || v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  // Debug: Log available environment variables in serverless (without sensitive values)
  const isServerless = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    console.log('🔍 Environment check (serverless):');
    console.log('  VERCEL:', process.env.VERCEL);
    console.log('  VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
    console.log('  JWT_PRIVATE_KEY:', process.env.JWT_PRIVATE_KEY ? `✅ Set (${process.env.JWT_PRIVATE_KEY.length} chars)` : '❌ Missing');
    console.log('  JWT_PUBLIC_KEY:', process.env.JWT_PUBLIC_KEY ? `✅ Set (${process.env.JWT_PUBLIC_KEY.length} chars)` : '❌ Missing');
    console.log('  Available env vars:', Object.keys(process.env).filter(k => k.startsWith('JWT') || k.startsWith('MONGODB') || k.startsWith('NODE')).join(', '));
  }
  
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      const message = err.message;
      const actualValue = process.env[path];
      console.error(`  - ${path}: ${message}`);
      console.error(`    Current value: ${actualValue ? `"${actualValue.substring(0, 20)}..." (${actualValue.length} chars)` : 'undefined'}`);
      
      // Provide helpful hints for common issues
      if (path === 'MONGODB_URI') {
        console.error('    💡 Make sure MONGODB_URI is set in Vercel Environment Variables for Production environment');
      }
      if (path === 'JWT_PRIVATE_KEY' || path === 'JWT_PUBLIC_KEY') {
        console.error('    💡 For RS256 JWT, set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY (PEM format). See ENV_SETUP.md for key generation.');
        console.error('    💡 Check that they are set for "Production" environment in Vercel.');
      }
    });
    
    // In serverless environments, throw an error instead of exiting
    // This allows the error to be caught and handled gracefully
    const isServerless = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isServerless) {
      console.error('⚠️  Function cannot start without required environment variables.');
      console.error('   Please configure them in your Vercel project settings.');
      console.error('   Make sure variables are set for "Production" environment!');
      // Throw instead of exit so it can be caught by api/index.js
      throw new Error(
        `Missing required environment variables: ${error.errors.map(e => e.path.join('.')).join(', ')}. ` +
        `Please configure them in Vercel project settings for Production environment.`
      );
    }
    // In non-serverless environments, exit as before
    process.exit(1);
  }
  throw error;
}

export default env;

