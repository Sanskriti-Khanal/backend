# Production checklist – Mero Sathi

## What is already done in code

- **OTP**: SMS via **Twilio** (worldwide: USA, UAE, Nepal, India, etc.) or **MSG91** (India/Nepal). For India/Nepal numbers, MSG91 is used if set; for all other countries, Twilio is used. Set **Twilio** for USA/UAE/global; set **MSG91** for India/Nepal (optional, often cheaper). In production, Twilio is required for non-IN/NP if you want worldwide signup.
- **Rate limits**: After **3 wrong login attempts** (or too many OTP/API requests), the same message is shown everywhere: *"Too many attempts. Please try again after some time."* (15‑minute window per IP).
- **Dev bypass**: `DEV_OTP_BYPASS` works only when `NODE_ENV=development`; production never accepts it.
- **Phone**: Backend normalizes phone to 10 digits (Nepal); E.164 used for SMS.

---

## What you need to do manually

### 1. SMS / OTP – choose one provider

**Option A – MSG91 (India/Nepal, often cheaper)**  
1. Sign up at [msg91.com](https://msg91.com).  
2. Get your **Auth Key** (dashboard).  
3. Create a **Sender ID** (≤6 chars, e.g. `MEROSA`).  
4. In production env set:  
   - `MSG91_AUTH_KEY` = your auth key  
   - `MSG91_SENDER` = your sender ID (optional; defaults to `MEROSA`)

**Option B – Twilio (global)**  
1. Sign up at [twilio.com](https://www.twilio.com).  
2. Get **Account SID**, **Auth Token**, and a **phone number** (E.164, e.g. `+14155231234`).  
3. In production env set:  
   - `TWILIO_ACCOUNT_SID`  
   - `TWILIO_AUTH_TOKEN`  
   - `TWILIO_PHONE_NUMBER`

**Other options** (integrate yourself if needed): Sparrow SMS (Nepal), Plivo, Exotel, Fast2SMS, 2Factor.  
Backend uses MSG91 if `MSG91_AUTH_KEY` is set, else Twilio if its vars are set. Do not commit these keys; use your host’s env vars only.

---

### 2. Backend env (production)

Set these for your production backend (e.g. Vercel → Project → Settings → Environment Variables):

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | Production MongoDB connection string |
| `JWT_PRIVATE_KEY` | Yes | PEM string (RS256 private key) |
| `JWT_PUBLIC_KEY` | Yes | PEM string (RS256 public key) |
| **SMS (pick one)** | | |
| `MSG91_AUTH_KEY` | If using MSG91 | From MSG91 dashboard |
| `MSG91_SENDER` | Optional | Sender ID ≤6 chars (default `MEROSA`) |
| `TWILIO_ACCOUNT_SID` | If using Twilio | From Twilio console |
| `TWILIO_AUTH_TOKEN` | If using Twilio | From Twilio console |
| `TWILIO_PHONE_NUMBER` | If using Twilio | E.164, e.g. `+14155231234` |
| `CORS_ORIGIN` | Recommended | Your frontend/admin URL, e.g. `https://merosathi.co` |
| `DEV_OTP_BYPASS` | No | Leave **unset** in production |

Optional (if you use them): payment (NABIL_*, RAZORPAY_*, etc.), Cloudinary, FCM/OneSignal, Sentry.

---

### 3. App (Flutter) – production build

- Use production API base URL (e.g. `https://merosathi.co/api`) in `.env.production` / release build.
- Ensure release builds use `ENV=production` and production `.env` so they hit the live API.

---

### 4. After setting env

- Redeploy the backend so it picks up the new variables.
- Test: trigger “Send OTP” from the app with a real number; you should receive an SMS and be able to verify.

If something is missing (e.g. Twilio not set in production), the API will return a clear error message instead of sending OTP.
