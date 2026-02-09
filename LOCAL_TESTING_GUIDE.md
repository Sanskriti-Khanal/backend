# Local Testing Guide - Nabil Bank Integration

## Overview

Test the Nabil Bank integration locally using **test credentials** before using production.

---

## Step 1: Check Test Certificates

Verify you have test certificates:

```bash
cd backend
ls -la src/cert/
```

**You should have:**
- `merosathi.co.crt` (test certificate)
- `merosathi.key` (test private key)

**If missing:** You'll need to get test certificates from Nabil Bank or use the ones you used during initial testing.

---

## Step 2: Configure Local Environment

### Option A: Use .env File (Recommended)

Create or update `backend/.env` with test values:

```env
# Database
MONGODB_URI=your_mongodb_uri
JWT_PRIVATE_KEY=<PEM-private-key>
JWT_PUBLIC_KEY=<PEM-public-key>

# Server
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# CORS
CORS_ORIGIN=http://localhost:3000

# Nabil Bank - TEST Configuration
# DO NOT set these - code will use test defaults
# NABIL_API_URL=https://api.compassplus.com:11611/Exec (test - default)
# NABIL_MERCHANT_ID=NABIL106809 (test - default)
# NABIL_DECRYPT_KEY=0123456789abcdef (test - default)

# Nabil Bank - Production (DO NOT SET for local testing)
# NABIL_API_URL=
# NABIL_MERCHANT_ID=
# NABIL_DECRYPT_KEY=
# NABIL_CERT_BASE64=
# NABIL_KEY_BASE64=
```

**Important:** 
- **DO NOT** set production environment variables (`NABIL_API_URL`, `NABIL_MERCHANT_ID`, etc.) in `.env`
- The code will automatically use **test defaults** if these are not set
- Test API URL: `https://api.compassplus.com:11611/Exec`
- Test Merchant ID: `NABIL106809`
- Test Decrypt Key: `0123456789abcdef`

---

## Step 3: Verify Test Certificates

Check if test certificates exist:

```bash
cd backend
ls -la src/cert/merosathi.co.crt src/cert/merosathi.key
```

**If certificates exist:**
- ✅ You're ready to test

**If certificates are missing:**
- Contact Nabil Bank for test certificates
- Or use the certificates you had during initial testing

---

## Step 4: Start Local Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🔧 Nabil Service Configuration:
  API URL: https://api.compassplus.com:11611/Exec
  Merchant ID: NABIL106809
  Decrypt Key: 01234567...
  Environment: TEST
✅ MongoDB connected
🚀 Server running on port 5000
```

**Key indicators:**
- ✅ `Environment: TEST` (not PRODUCTION)
- ✅ `Merchant ID: NABIL106809` (test merchant ID)
- ✅ `API URL: https://api.compassplus.com:11611/Exec` (test URL)

---

## Step 5: Test Checkout Page

1. **Open browser:** `http://localhost:5000/nabil/checkout`
2. **Click "Pay" button**
3. **Check terminal logs** for:
   ```
   🔍 Configuration Check:
     BASE_URL from env: http://localhost:5000
     Using apiBaseUrl: http://localhost:5000
   
   📤 Nabil Bank CreateOrder Request:
     Merchant ID: NABIL106809
     Amount (NPR): 1
     Amount (Paisa): 100
     Currency: 524
     Approve URL: http://localhost:5000/api/v1/payments/nabil/approve?...
   ```

**Note:** Callback URLs will use `http://localhost:5000` for local testing, which is fine for testing the API connection.

---

## Step 6: What to Test

### Test 1: API Connection
- ✅ Server starts without errors
- ✅ SSL certificates load correctly
- ✅ Can make API call to Nabil Bank

### Test 2: CreateOrder Request
- ✅ Request is sent correctly
- ✅ Response is received (even if Status 55, at least we get a response)
- ✅ Logs show correct test merchant ID

### Test 3: Error Handling
- ✅ Errors are logged clearly
- ✅ Status codes are displayed
- ✅ Full responses are shown

---

## Expected Results

### Success Case:
- Order created successfully
- Status: `00`
- Redirected to Nabil Bank payment page

### Test Case (Status 55):
- If you get Status 55 with **test credentials**, it might indicate:
  - Test merchant ID needs activation
  - Test environment issue
  - But at least we know the code is working correctly

---

## Troubleshooting

### Issue: "SSL certificate not found"
**Solution:**
- Check test certificates exist: `src/cert/merosathi.co.crt` and `src/cert/merosathi.key`
- Verify file paths are correct

### Issue: "Environment: PRODUCTION" in logs
**Solution:**
- Remove production environment variables from `.env`
- The code should use test defaults

### Issue: "Merchant ID: 600000001068090" (production)
**Solution:**
- Make sure `NABIL_MERCHANT_ID` is NOT set in `.env`
- Code will use test default: `NABIL106809`

### Issue: Can't connect to test API
**Solution:**
- Check internet connection
- Verify test API URL: `https://api.compassplus.com:11611/Exec`
- Check if test environment is accessible

---

## Comparison: Local vs Production

| Aspect | Local (Test) | Production |
|--------|-------------|------------|
| API URL | `https://api.compassplus.com:11611/Exec` | `https://adapter.nabilbank.com/Exec` |
| Merchant ID | `NABIL106809` | `600000001068090` |
| Decrypt Key | `0123456789abcdef` | `5D30E8E794F2780D` |
| Certificates | `merosathi.co.crt/key` | `api.merosathi.co.production.crt/key` |
| BASE_URL | `http://localhost:5000` | `https://api.merosathi.co` |
| Environment | TEST | PRODUCTION |

---

## Next Steps After Local Testing

1. **If local test works:**
   - Code is correct
   - Issue is likely production-specific (merchant activation, URL whitelisting, etc.)
   - Contact Nabil Bank with production details

2. **If local test also fails:**
   - Check test certificates
   - Verify test merchant ID is active
   - Check test API connectivity

---

**Last Updated:** January 13, 2026
