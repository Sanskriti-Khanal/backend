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
  JWT_EXPIRE: z.string().default('7d'),
  /** When rememberMe is true, token expires after this (e.g. 30d = 1 month). */
  JWT_EXPIRE_REMEMBER: z.string().default('30d'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
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
  // Sentry Error Tracking
  SENTRY_DSN: z.string().url().optional(),
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

