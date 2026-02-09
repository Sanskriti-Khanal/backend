# Quick Local Test Setup

## ✅ Test Certificates Found

You have test certificates:
- `src/cert/merosathi.co.crt`
- `src/cert/merosathi.key`

---

## Quick Start

### 1. Make sure .env doesn't have production Nabil variables

**Check your `.env` file** - make sure these are **NOT set** (or commented out):
```env
# DO NOT set these for local testing:
# NABIL_API_URL=
# NABIL_MERCHANT_ID=
# NABIL_DECRYPT_KEY=
# NABIL_CERT_BASE64=
# NABIL_KEY_BASE64=
```

**The code will automatically use test defaults if these are not set:**
- Test API URL: `https://api.compassplus.com:11611/Exec`
- Test Merchant ID: `NABIL106809`
- Test Decrypt Key: `0123456789abcdef`

---

### 2. Start the server

```bash
cd backend
npm run dev
```

**Look for this in the output:**
```
🔧 Nabil Service Configuration:
  API URL: https://api.compassplus.com:11611/Exec
  Merchant ID: NABIL106809
  Decrypt Key: 01234567...
  Environment: TEST  ← Should say TEST, not PRODUCTION
```

---

### 3. Test the checkout

1. Open: `http://localhost:5000/nabil/checkout`
2. Click "Pay"
3. Check terminal logs

**Expected logs:**
```
📤 Nabil Bank CreateOrder Request:
  Merchant ID: NABIL106809  ← Test merchant ID
  Amount (NPR): 1
  Amount (Paisa): 100
  Currency: 524
  Approve URL: http://localhost:5000/api/v1/payments/nabil/approve?...
```

---

## What to Check

### ✅ Success Indicators:
- Server starts without errors
- Logs show `Environment: TEST`
- Logs show `Merchant ID: NABIL106809` (test)
- SSL certificates load: `✅ Loaded SSL certificates from files`
- API call is made (even if Status 55, at least we get a response)

### ❌ If you see:
- `Environment: PRODUCTION` → Remove production env vars from `.env`
- `Merchant ID: 600000001068090` → Remove `NABIL_MERCHANT_ID` from `.env`
- `SSL certificate not found` → Check test certificates exist

---

## Test Results

### If local test works (gets response, even if Status 55):
- ✅ Code is working correctly
- ✅ SSL certificates are correct
- ✅ API connection works
- ⏳ Production issue likely needs Nabil Bank activation

### If local test fails:
- Check test certificates
- Verify test merchant ID is active
- Check network connectivity

---

## Quick Commands

```bash
# Start server
cd backend
npm run dev

# In another terminal, test the endpoint
curl http://localhost:5000/nabil/checkout

# Or open in browser
open http://localhost:5000/nabil/checkout
```

---

**Ready to test!** Start the server and let me know what you see in the logs.
