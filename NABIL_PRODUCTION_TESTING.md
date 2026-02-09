# Nabil Bank Production - Testing Guide

## Prerequisites

✅ All 5 environment variables set in Vercel (Production environment):
- `NABIL_MERCHANT_ID`
- `NABIL_DECRYPT_KEY`
- `NABIL_API_URL`
- `NABIL_CERT_BASE64`
- `NABIL_KEY_BASE64`

✅ Code deployed to Vercel

---

## Step 1: Verify Environment Variables

### Check Vercel Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** → Click on any function log
4. Look for this output:

```
🔧 Nabil Service Configuration:
  API URL: https://adapter.nabilbank.com/Exec
  Merchant ID: 600000001068090
  Decrypt Key: 5D30E8E7...
  Environment: PRODUCTION
```

✅ If you see `Environment: PRODUCTION`, configuration is correct!

---

## Step 2: Test Checkout Page

### 2.1 Open Checkout Page

Visit: `https://api.merosathi.co/nabil/checkout`

**Expected:**
- ✅ Page loads without errors
- ✅ Shows "Pay" button
- ✅ No console errors in browser

### 2.2 Click "Pay" Button

**Expected:**
- ✅ Redirects to Nabil Bank payment page
- ✅ URL should be: `https://adapter.nabilbank.com/...` (or similar production URL)
- ✅ Shows Nabil Bank payment form

---

## Step 3: Test Payment Flow

### 3.1 Create Test Order

1. Click "Pay" on checkout page
2. You should be redirected to Nabil Bank's payment page
3. **DO NOT complete the payment yet**

### 3.2 Check Database Logs

Check your MongoDB `transactionlogs` collection for:

```javascript
// Should see these logs immediately after clicking "Pay":
{
  transactionId: "TXN_...",
  logType: "CREATE_ORDER_REQUEST",
  // ... request XML
}

{
  transactionId: "TXN_...", // Same transactionId
  logType: "CREATE_ORDER_RESPONSE",
  // ... response with OrderID, SessionID
}
```

✅ If you see both logs, CreateOrder is working!

---

## Step 4: Test Payment Callbacks

### 4.1 Test APPROVE Flow

1. On Nabil Bank payment page, use **test card** (ask bank for test card details)
2. Complete payment successfully
3. You should be redirected back to: `https://api.merosathi.co/api/v1/payments/nabil/approve?...`

**Check Database Logs:**
```javascript
// Should see all 5 logs:
{
  logType: "CREATE_ORDER_REQUEST"
}
{
  logType: "CREATE_ORDER_RESPONSE"
}
{
  logType: "PAYMENT_XML"  // From approve callback
}
{
  logType: "GET_ORDER_STATUS_REQUEST"
}
{
  logType: "GET_ORDER_STATUS_RESPONSE"  // Should show OrderStatus: APPROVED
}
```

### 4.2 Test DECLINE Flow

1. Use a card that will be declined (or ask bank for test decline card)
2. Complete payment attempt
3. Should redirect to: `https://api.merosathi.co/api/v1/payments/nabil/decline?...`

**Check Database:**
- Should see all 5 logs
- `GET_ORDER_STATUS_RESPONSE` should show `OrderStatus: DECLINED`

### 4.3 Test CANCEL Flow

1. On payment page, click "Cancel" or close the page
2. Should redirect to: `https://api.merosathi.co/api/v1/payments/nabil/cancel?...`

**Check Database:**
- Should see all 5 logs
- `GET_ORDER_STATUS_RESPONSE` should show `OrderStatus: CANCELED`

---

## Step 5: Verify Logs in Database

### 5.1 Check Transaction Logs Collection

Query MongoDB:

```javascript
// Find recent transaction
db.transactionlogs.find({
  createdAt: { $gte: new Date(Date.now() - 3600000) } // Last hour
}).sort({ createdAt: -1 })

// Should see 5 logs per transaction:
// 1. CREATE_ORDER_REQUEST
// 2. CREATE_ORDER_RESPONSE
// 3. PAYMENT_XML
// 4. GET_ORDER_STATUS_REQUEST
// 5. GET_ORDER_STATUS_RESPONSE
```

### 5.2 Verify Log Content

Each log should have:
- ✅ `transactionId` (same for all 5 logs in one transaction)
- ✅ `logType` (one of the 5 types above)
- ✅ `logData` (XML or JSON content)
- ✅ `createdAt` timestamp

---

## Step 6: Check Vercel Function Logs

### 6.1 View Real-time Logs

1. Go to **Vercel Dashboard** → Your Project → **Functions**
2. Click on a function (e.g., `/api/v1/payments/nabil/checkout`)
3. View **Logs** tab

**Look for:**
- ✅ No SSL certificate errors
- ✅ No "connection refused" errors
- ✅ Successful API calls to `https://adapter.nabilbank.com/Exec`
- ✅ Decryption working (no decryption errors)

### 6.2 Common Errors to Watch For

❌ **"SSL certificate not found"**
- Solution: Check `NABIL_CERT_BASE64` and `NABIL_KEY_BASE64` are set correctly

❌ **"No response from server"**
- Solution: Check `NABIL_API_URL` is correct: `https://adapter.nabilbank.com/Exec`

❌ **"Decryption failed"**
- Solution: Check `NABIL_DECRYPT_KEY` is correct: `5D30E8E794F2780D`

❌ **"Invalid Merchant ID"**
- Solution: Check `NABIL_MERCHANT_ID` is correct: `600000001068090`

---

## Step 7: Test with Real Amount (Optional)

Once basic flow works:

1. Test with a small real amount (e.g., NPR 10)
2. Use a real card
3. Verify:
   - Payment processes correctly
   - All 5 logs are stored
   - Payment status updates in your database

---

## Quick Test Checklist

- [ ] Environment variables set in Vercel (Production)
- [ ] Code deployed to Vercel
- [ ] Checkout page loads: `https://api.merosathi.co/nabil/checkout`
- [ ] "Pay" button redirects to Nabil Bank
- [ ] `CREATE_ORDER_REQUEST` log appears in database
- [ ] `CREATE_ORDER_RESPONSE` log appears in database
- [ ] Payment callback redirects back to your site
- [ ] `PAYMENT_XML` log appears in database
- [ ] `GET_ORDER_STATUS_REQUEST` log appears in database
- [ ] `GET_ORDER_STATUS_RESPONSE` log appears in database
- [ ] Order status is correct (APPROVED/DECLINED/CANCELED)

---

## Test Card Information

**Ask Nabil Bank for:**
- Test card number for APPROVE
- Test card number for DECLINE
- Test card CVV and expiry

Or use real cards with small amounts for testing.

---

## Troubleshooting

### Issue: Checkout page doesn't load
- Check Vercel deployment is successful
- Check domain is correctly configured
- Check browser console for errors

### Issue: Not redirected to bank
- Check `CREATE_ORDER_RESPONSE` log - verify `url` field exists
- Check Vercel logs for API errors
- Verify `NABIL_API_URL` is correct

### Issue: Missing logs in database
- Check MongoDB connection
- Check `transactionId` is consistent across logs
- Check Vercel logs for database errors

### Issue: GetOrderStatus fails
- Check `NABIL_DECRYPT_KEY` is correct
- Verify decryption is working (check logs)
- Check `NABIL_API_URL` is correct

---

## Support

If you encounter issues:

1. **Check Vercel Logs** - Most errors will show here
2. **Check Database Logs** - Verify all 5 logs are being created
3. **Contact Nabil Bank** - For test card details or API issues

---

**Last Updated:** January 13, 2026
