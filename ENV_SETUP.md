# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

## Required Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/spiritual_services

# JWT Configuration (REQUIRED) - RS256 (asymmetric) for better security
# Generate key pair (see "Generate JWT RS256 keys" below), then set:
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Optional Variables (for full functionality)

```env
# OTP Configuration (Twilio) - For phone verification
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Payment Gateway - Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Payment Gateway - Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Push Notifications - Firebase Cloud Messaging (FCM)
FCM_PROJECT_ID=your-fcm-project-id
FCM_PRIVATE_KEY=your-fcm-private-key
FCM_CLIENT_EMAIL=your-fcm-client-email

# Push Notifications - OneSignal
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key

# Push Notification Provider (fcm, onesignal, or both)
PUSH_NOTIFICATION_PROVIDER=fcm

# Cloudinary (for image uploads) - Optional but recommended
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Quick Start (Minimum Required)

For basic testing, you only need:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/spiritual_services
JWT_PRIVATE_KEY="<paste private PEM; use \\n for newlines in .env>"
JWT_PUBLIC_KEY="<paste public PEM; use \\n for newlines in .env>"
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

## Running with Admin Dashboard (Next.js)

The admin dashboard runs on **http://localhost:3000**. To avoid port conflict, run the backend on a **different port** (e.g. 5050):

In **backend-main/.env** set:

```env
PORT=5050
CORS_ORIGIN=http://localhost:3000
```

In **admin-dashboard/.env.local** set:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050/api
```

Then:

1. Start the backend: `cd backend-main && npm run dev` (should log "Server running on port 5050").
2. Start the admin: `cd admin-dashboard && npm run dev`.
3. Open http://localhost:3000 and log in with an admin user.

To check the API is reachable: open **http://localhost:5050/api/v1/health** in the browser; you should see a JSON health response.

---

## Notes

1. **JWT (RS256)**: Use `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` (PEM format). RS256 is more secure than HS256: only the server holds the private key; the public key can be shared for verification. Generate a key pair (see below).
2. **MONGODB_URI**: Make sure MongoDB is running locally or use a cloud MongoDB instance.
3. **OTP**: Without Twilio credentials, OTP will be logged to console (for development).
4. **Push Notifications**: Without FCM/OneSignal credentials, push notifications won't work but the app will still run.
5. **Payment Gateways**: Without payment gateway credentials, payment endpoints will fail but other features work.

## Generate JWT RS256 keys

The app uses **RS256** (RSA) instead of HS256 for JWTs. Generate a key pair:

```bash
# Create private key (2048-bit)
openssl genrsa -out private.pem 2048

# Derive public key
openssl rsa -in private.pem -pubout -out public.pem
```

- **JWT_PRIVATE_KEY**: Paste the full contents of `private.pem`. In `.env` or Vercel, use `\n` for newlines (e.g. `"-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"`).
- **JWT_PUBLIC_KEY**: Paste the full contents of `public.pem` the same way.

Do not commit `private.pem` or `public.pem`; add them to `.gitignore` if stored as files.










