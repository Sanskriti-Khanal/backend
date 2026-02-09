# How to Check Vercel Logs for Status 55 Error

## Step-by-Step Guide

### Step 1: Access Function Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Functions** tab (or go to **Deployments** → Latest deployment)
3. Find the function: `/api/v1/payments/nabil/checkout`
4. Click on it to view logs

### Step 2: Look for These Log Messages

After clicking "Pay" on the checkout page, you should see these logs in order:

#### 1. Configuration Check
```
🔍 Configuration Check:
  BASE_URL from env: https://api.merosathi.co
  Using apiBaseUrl: https://api.merosathi.co
```

#### 2. CreateOrder Request Details
```
📤 Nabil Bank CreateOrder Request:
  Merchant ID: 600000001068090
  Amount (NPR): 1
  Amount (Paisa): 100
  Currency: 524
  Description: Test Payment NPR 1
  Approve URL: https://api.merosathi.co/api/v1/payments/nabil/approve?transactionId=...
  Cancel URL: https://api.merosathi.co/api/v1/payments/nabil/cancel?transactionId=...
  Decline URL: https://api.merosathi.co/api/v1/payments/nabil/decline?transactionId=...
```

#### 3. Error Details (if Status 55)
```
❌ Nabil Bank CreateOrder Error:
  Status: 55
  Full Response: {...}
  Request XML: {...}
```

### Step 3: What to Look For

**Check these values in the logs:**

1. **Merchant ID:**
   - ✅ Should be: `600000001068090`
   - ❌ Should NOT be: `NABIL106809`

2. **Callback URLs:**
   - ✅ Should start with: `https://api.merosathi.co`
   - ❌ Should NOT contain: `localhost`, `127.0.0.1`, or `http://`

3. **Amount:**
   - ✅ Amount (Paisa) should be: `100` (for NPR 1.00)

4. **Currency:**
   - ✅ Should be: `524` (NPR)

### Step 4: If Logs Are Truncated

If you see truncated logs in Vercel:

1. **Click on the specific log entry** to expand it
2. **Scroll down** to see the full error message
3. **Look for the "Full Response"** section - this shows what Nabil Bank returned
4. **Copy the full error** and share it

### Step 5: Alternative: Check Real-time Logs

1. Go to **Vercel Dashboard** → Your Project → **Logs** tab
2. Filter by: `nabil` or `checkout`
3. Watch in real-time as you click "Pay"
4. You'll see all logs as they happen

---

## What to Share

If Status 55 persists, share these from the logs:

1. **Merchant ID** from `📤 Nabil Bank CreateOrder Request:`
2. **Callback URLs** (Approve, Cancel, Decline)
3. **Full Response** from `❌ Nabil Bank CreateOrder Error:`
4. **Request XML** (if shown)

This will help identify the exact issue!

---

## Quick Checklist

- [ ] Can see `🔍 Configuration Check:` in logs
- [ ] Can see `📤 Nabil Bank CreateOrder Request:` in logs
- [ ] Merchant ID is `600000001068090`
- [ ] Callback URLs use `https://api.merosathi.co`
- [ ] If error occurs, can see `❌ Nabil Bank CreateOrder Error:` with full details
