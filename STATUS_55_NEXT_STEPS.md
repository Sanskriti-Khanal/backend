# Status 55 - Next Steps (BASE_URL is Set ✅)

## ✅ Good News: BASE_URL is Set Correctly

Your `BASE_URL` is set to `https://api.merosathi.co` in Vercel. That's correct!

---

## Next: Check These

### 1. Verify NABIL_MERCHANT_ID

In Vercel → Settings → Environment Variables → Production:

- **Variable:** `NABIL_MERCHANT_ID`
- **Should be:** `600000001068090` (production merchant ID)
- **Should NOT be:** `NABIL106809` (test merchant ID)

**If it's set to the test merchant ID, that's likely the issue!**

---

### 2. Check Vercel Logs After New Deployment

After the latest deployment (with the new logging), check Vercel function logs. You should see:

```
🔍 Configuration Check:
  BASE_URL from env: https://api.merosathi.co
  Using apiBaseUrl: https://api.merosathi.co

📤 Nabil Bank CreateOrder Request:
  Merchant ID: 600000001068090  ← Check this!
  Amount (NPR): 1
  Amount (Paisa): 100
  Currency: 524
  Description: Test Payment NPR 1
  Approve URL: https://api.merosathi.co/api/v1/payments/nabil/approve?...
  Cancel URL: https://api.merosathi.co/api/v1/payments/nabil/cancel?...
  Decline URL: https://api.merosathi.co/api/v1/payments/nabil/decline?...
```

**Key things to check:**
- ✅ Merchant ID should be `600000001068090` (NOT `NABIL106809`)
- ✅ All callback URLs should use `https://api.merosathi.co`
- ✅ Amount in Paisa should be `100` (for NPR 1.00)
- ✅ Currency should be `524` (NPR)

---

### 3. Check Full Error Response

If Status 55 still occurs, check the logs for:

```
❌ Nabil Bank CreateOrder Error:
  Status: 55
  Full Response: {...}
  Request XML: {...}
```

The "Full Response" will show what Nabil Bank is actually returning, which might give more specific error details.

---

## Most Likely Remaining Issues

### Issue 1: Wrong Merchant ID

**If logs show:** `Merchant ID: NABIL106809`
**Fix:** Set `NABIL_MERCHANT_ID` = `600000001068090` in Vercel (Production)

### Issue 2: Callback URL Format

Even though BASE_URL is correct, check if the callback URLs in logs look correct:
- Should be: `https://api.merosathi.co/api/v1/payments/nabil/approve?transactionId=...`
- Should NOT have: `localhost`, `127.0.0.1`, or `http://`

### Issue 3: Amount/Currency Validation

Check if:
- Amount in Paisa is exactly `100` (for NPR 1.00)
- Currency code is exactly `524` (NPR)

---

## Action Items

1. ✅ **BASE_URL is set** - Good!
2. ⏳ **Check NABIL_MERCHANT_ID** - Should be `600000001068090`
3. ⏳ **Check Vercel logs** - After new deployment, see what's being sent
4. ⏳ **Share logs** - If Status 55 persists, share the log output

---

## Quick Test

1. Make sure `NABIL_MERCHANT_ID` = `600000001068090` in Vercel (Production)
2. Wait for deployment to complete
3. Visit: `https://api.merosathi.co/nabil/checkout`
4. Click "Pay"
5. Check Vercel logs immediately after
6. Look for the `📤 Nabil Bank CreateOrder Request:` section

---

**The detailed logs will show exactly what's being sent to Nabil Bank, which will help identify the issue!**
