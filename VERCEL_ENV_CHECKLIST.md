# Vercel Environment Variables - Status 55 Fix Checklist

## ⚠️ Critical: Check These Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables → Production**

### Required Variables for Status 55 Fix:

| Variable | Required Value | Current Status |
|----------|---------------|----------------|
| `BASE_URL` | `https://api.merosathi.co` | ⏳ **CHECK THIS** |
| `NABIL_MERCHANT_ID` | `600000001068090` | ⏳ **CHECK THIS** |
| `NABIL_API_URL` | `https://adapter.nabilbank.com/Exec` | ✅ Should be set |
| `NABIL_DECRYPT_KEY` | `5D30E8E794F2780D` | ✅ Should be set |
| `NABIL_CERT_BASE64` | (base64 certificate) | ✅ Should be set |
| `NABIL_KEY_BASE64` | (base64 key) | ✅ Should be set |

---

## Most Common Issue: BASE_URL Not Set

**Problem:** If `BASE_URL` is not set in Vercel, callback URLs will be:
- `http://localhost:5000/api/v1/payments/nabil/approve?...` ❌

**Solution:** Set `BASE_URL` = `https://api.merosathi.co` in Vercel (Production)

**After setting, callback URLs will be:**
- `https://api.merosathi.co/api/v1/payments/nabil/approve?...` ✅

---

## Step-by-Step Fix

### Step 1: Check BASE_URL

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Filter by **Production** environment
3. Look for `BASE_URL`
4. **If missing or wrong:**
   - Click **Add New**
   - Key: `BASE_URL`
   - Value: `https://api.merosathi.co`
   - Environment: **Production**
   - Click **Save**

### Step 2: Check NABIL_MERCHANT_ID

1. Look for `NABIL_MERCHANT_ID`
2. **Should be:** `600000001068090` (production merchant ID)
3. **Should NOT be:** `NABIL106809` (test merchant ID)
4. **If wrong:**
   - Edit the variable
   - Change to: `600000001068090`
   - Save

### Step 3: Redeploy

After updating environment variables:
1. Go to **Deployments**
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger deployment

### Step 4: Check Logs

After deployment, check Vercel function logs. You should see:

```
🔍 Configuration Check:
  BASE_URL from env: https://api.merosathi.co
  Using apiBaseUrl: https://api.merosathi.co

📤 Nabil Bank CreateOrder Request:
  Merchant ID: 600000001068090
  Approve URL: https://api.merosathi.co/api/v1/payments/nabil/approve?...
  Cancel URL: https://api.merosathi.co/api/v1/payments/nabil/cancel?...
  Decline URL: https://api.merosathi.co/api/v1/payments/nabil/decline?...
```

**If you see warnings:**
- `⚠️ WARNING: BASE_URL does not use HTTPS!` → Set BASE_URL to `https://api.merosathi.co`
- `⚠️ WARNING: BASE_URL is using localhost!` → Set BASE_URL to `https://api.merosathi.co`

---

## Quick Verification

After setting environment variables, test the checkout:

1. Visit: `https://api.merosathi.co/nabil/checkout`
2. Click "Pay"
3. Check Vercel logs for the configuration check
4. If Status 55 persists, check the full error response in logs

---

## All Environment Variables Summary

For reference, here are ALL the environment variables you should have set in Vercel (Production):

```
BASE_URL=https://api.merosathi.co
NABIL_API_URL=https://adapter.nabilbank.com/Exec
NABIL_MERCHANT_ID=600000001068090
NABIL_DECRYPT_KEY=5D30E8E794F2780D
NABIL_CERT_BASE64=<base64-encoded-certificate>
NABIL_KEY_BASE64=<base64-encoded-key>
MONGODB_URI=<your-mongodb-uri>
JWT_PRIVATE_KEY=<PEM-private-key-for-RS256>
JWT_PUBLIC_KEY=<PEM-public-key-for-RS256>
```
(See ENV_SETUP.md for generating RS256 key pair.)

---

**Last Updated:** January 13, 2026
