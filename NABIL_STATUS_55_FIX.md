# Nabil Bank Status 55 Error - Troubleshooting Guide

## Error: "Order creation failed (Status: 55)"

Status 55 from Nabil Bank typically means **invalid order data**. The API connection is working, but the order data being sent is incorrect.

---

## Common Causes of Status 55

### 1. Invalid Merchant ID

**Check:**
- Vercel environment variable: `NABIL_MERCHANT_ID` = `600000001068090`
- Should NOT be the test merchant ID: `NABIL106809`

**Verify in Logs:**
Look for: `Merchant ID: 600000001068090` (should be production merchant ID)

---

### 2. Invalid Callback URLs

**Check:**
- Callback URLs must be **HTTPS** (not HTTP) for production
- URLs must be publicly accessible
- Format: `https://api.merosathi.co/api/v1/payments/nabil/approve?...`

**Verify in Logs:**
Look for:
```
Approve URL: https://api.merosathi.co/api/v1/payments/nabil/approve?...
Cancel URL: https://api.merosathi.co/api/v1/payments/nabil/cancel?...
Decline URL: https://api.merosathi.co/api/v1/payments/nabil/decline?...
```

**Common Issues:**
- Using `http://` instead of `https://`
- Using `localhost` or local IP
- URLs not publicly accessible
- Missing query parameters

---

### 3. Invalid Amount Format

**Check:**
- Amount should be in **paisa** (not NPR) in the XML
- 1 NPR = 100 paisa
- For NPR 1.00, amount should be `100` in XML

**Verify in Logs:**
Look for:
```
Amount (NPR): 1
Amount (Paisa): 100
```

---

### 4. Invalid Currency Code

**Check:**
- Currency code for NPR should be `524`
- Must match Nabil Bank's currency code list

**Verify in Logs:**
Look for: `Currency: 524`

---

### 5. Invalid Description

**Check:**
- Description should not be empty
- Description should not contain special XML characters
- Description length might be limited

**Verify in Logs:**
Look for: `Description: Test Payment NPR 1`

---

## How to Debug

### Step 1: Check Vercel Logs

After the new deployment, check Vercel function logs. You should see:

```
📤 Nabil Bank CreateOrder Request:
  Merchant ID: 600000001068090
  Amount (NPR): 1
  Amount (Paisa): 100
  Currency: 524
  Description: Test Payment NPR 1
  Approve URL: https://api.merosathi.co/api/v1/payments/nabil/approve?...
  Cancel URL: https://api.merosathi.co/api/v1/payments/nabil/cancel?...
  Decline URL: https://api.merosathi.co/api/v1/payments/nabil/decline?...
```

**Verify:**
- ✅ Merchant ID is `600000001068090` (production)
- ✅ All URLs use `https://` (not `http://`)
- ✅ URLs are `api.merosathi.co` (not localhost)
- ✅ Amount in paisa is `100` (for NPR 1.00)
- ✅ Currency is `524` (NPR)

---

### Step 2: Check Full Error Response

The logs will also show:

```
❌ Nabil Bank CreateOrder Error:
  Status: 55
  Full Response: {...}
  Request XML: {...}
```

**Check the Full Response** for additional error details from Nabil Bank.

---

## Quick Fixes

### Fix 1: Verify Environment Variables

Go to **Vercel → Settings → Environment Variables → Production**:

| Variable | Value |
|----------|-------|
| `NABIL_MERCHANT_ID` | `600000001068090` |
| `BASE_URL` | `https://api.merosathi.co` |

**Important:** Make sure `BASE_URL` is set to your production domain with `https://`

---

### Fix 2: Verify Callback URLs

The callback URLs are built from `BASE_URL`. Make sure:

1. `BASE_URL` is set in Vercel (Production environment)
2. `BASE_URL` uses `https://` (not `http://`)
3. `BASE_URL` is your production domain: `https://api.merosathi.co`

---

### Fix 3: Check XML Format

The XML request should match exactly:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>600000001068090</Merchant>
<Amount>100</Amount>
<Currency>524</Currency>
<Description>Test Payment NPR 1</Description>
<ApproveURL>https://api.merosathi.co/api/v1/payments/nabil/approve?transactionId=...</ApproveURL>
<CancelURL>https://api.merosathi.co/api/v1/payments/nabil/cancel?transactionId=...</CancelURL>
<DeclineURL>https://api.merosathi.co/api/v1/payments/nabil/decline?transactionId=...</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>
```

**Verify:**
- Merchant ID is `600000001068090` (not `NABIL106809`)
- Amount is `100` (paisa, not NPR)
- Currency is `524`
- All URLs use `https://`

---

## Contact Nabil Bank

If all the above checks pass and you still get Status 55, contact Nabil Bank with:

**Subject:** Status 55 Error - Invalid Order Data

**Details:**
- Merchant ID: `600000001068090`
- API URL: `https://adapter.nabilbank.com/Exec`
- Error: Status 55
- Request XML: (from logs)
- Full Response: (from logs)

**Ask:**
- What does Status 55 mean specifically?
- What validation is failing?
- Are there any additional requirements for production orders?

---

## Checklist

- [ ] `NABIL_MERCHANT_ID` = `600000001068090` in Vercel (Production)
- [ ] `BASE_URL` = `https://api.merosathi.co` in Vercel (Production)
- [ ] Logs show correct Merchant ID: `600000001068090`
- [ ] Logs show callback URLs use `https://`
- [ ] Logs show Amount in Paisa: `100`
- [ ] Logs show Currency: `524`
- [ ] Checked full error response in logs
- [ ] Contacted Nabil Bank if issue persists

---

**Last Updated:** January 13, 2026
