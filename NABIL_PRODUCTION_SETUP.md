# Nabil Bank EPG - Production Setup Guide

## Overview

This guide walks you through migrating from **TEST** to **PRODUCTION** environment for Nabil Bank EPG integration.

## What Needs to Change

Based on the requirements from Nabil Bank, you need to update:

1. ✅ **API URL** - From test to production endpoint
2. ✅ **CRT and Keys** - Use production certificate received from bank
3. ✅ **Merchant ID** - Use production merchant ID
4. ✅ **Decrypt Keys** - Use LIVE decrypt key (shared separately)

---

## Step 1: Save Production Certificate

### 1.1 Receive Certificate from Bank

You should receive a production certificate file (`.crt`) via email from Nabil Bank.

### 1.2 Save Certificate Files

Save the production certificate and ensure you have the corresponding private key:

```bash
# Navigate to certificate directory
cd backend/src/cert

# Save the production certificate (received from bank)
# Name it: api.merosathi.co.production.crt

# Ensure you have the production private key
# Name it: api.merosathi.co.production.key
# (This should be the key you generated when creating the CSR)
```

**Important:** The private key (`api.merosathi.co.production.key`) should be the same one you used when generating the CSR. If you don't have it, you'll need to regenerate the CSR and key pair.

---

## Step 2: Get Production Configuration Values

Contact Nabil Bank or check the email/documentation they provided for:

### 2.1 Production API URL
- **Test URL:** `https://api.compassplus.com:11611/Exec`
- **Production URL:** `???` (Ask Nabil Bank - usually different port or domain)

### 2.2 Production Merchant ID
- **Test Merchant ID:** `NABIL106809`
- **Production Merchant ID:** `???` (Provided by Nabil Bank)

### 2.3 Production Decrypt Key
- **Test Decrypt Key:** `0123456789abcdef` (hex format)
- **Production Decrypt Key:** `???` (Shared separately by Nabil Bank - hex format)

### 2.4 Production Payment Page URL
- **Test Payment URL:** `https://api.compassplus.com:11612/flex`
- **Production Payment URL:** `???` (Usually same domain, different port)

---

## Step 3: Encode Certificates for Vercel

Since Vercel uses environment variables (not files), you need to base64 encode your certificates:

### 3.1 Encode Production Certificate

```bash
cd backend

# Encode production certificate
base64 -i src/cert/api.merosathi.co.production.crt | tr -d '\n' > production_cert_base64.txt

# Encode production private key
base64 -i src/cert/api.merosathi.co.production.key | tr -d '\n' > production_key_base64.txt

# View the encoded values (copy these for Vercel)
cat production_cert_base64.txt
cat production_key_base64.txt
```

**Or use the provided script:**

```bash
cd backend
./scripts/encode-certificates.sh production
```

---

## Step 4: Update Vercel Environment Variables

### 4.1 Go to Vercel Dashboard

1. Navigate to your project: https://vercel.com/dashboard
2. Go to **Settings** → **Environment Variables**
3. Make sure you're updating **Production** environment (not Preview/Development)

### 4.2 Add/Update Production Variables

Add or update these environment variables for **Production** environment:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NABIL_API_URL` | `https://api.compassplus.com:XXXXX/Exec` | Production API endpoint (get from bank) |
| `NABIL_MERCHANT_ID` | `NABILXXXXXX` | Production merchant ID (get from bank) |
| `NABIL_DECRYPT_KEY` | `XXXXXXXXXXXXXXXX` | Production decrypt key in hex format (get from bank) |
| `NABIL_CERT_BASE64` | `LS0tLS1CRUdJTi...` | Base64 encoded production certificate |
| `NABIL_KEY_BASE64` | `LS0tLS1CRUdJTi...` | Base64 encoded production private key |

**Important Notes:**
- ✅ Set these for **Production** environment only
- ✅ Do NOT set them for Preview/Development (keep using test values)
- ✅ Copy the entire base64 string (no line breaks)
- ✅ The decrypt key should be in **hex format** (e.g., `0123456789abcdef`)

### 4.3 Verify Environment Variables

After adding, verify they're set correctly:
- Check that all 5 variables are present
- Ensure they're set for "Production" environment
- Double-check the values (especially decrypt key format)

---

## Step 5: Test Production Configuration

### 5.1 Deploy to Production

```bash
# Commit your changes
git add .
git commit -m "Configure Nabil Bank production settings"

# Push to trigger Vercel deployment
git push origin main
```

### 5.2 Verify Configuration in Logs

After deployment, check Vercel logs for:

```
🔧 Nabil Service Configuration:
  API URL: https://api.compassplus.com:XXXXX/Exec
  Merchant ID: NABILXXXXXX
  Decrypt Key: 01234567...
  Environment: PRODUCTION
```

If you see `Environment: PRODUCTION`, the configuration is correct.

### 5.3 Test Payment Flow

1. Visit: `https://api.merosathi.co/nabil/checkout`
2. Click "Pay" button
3. Verify redirect to production payment page
4. Complete a test transaction
5. Check database logs for all 5 transaction logs

---

## Step 6: Keep Test Environment Separate

### 6.1 Local Development

For local development, you can still use test values by:

**Option A: Don't set production env vars locally**
- The code will automatically use test values as fallbacks

**Option B: Use `.env` file for local test values**
```env
# .env (local development - TEST values)
NABIL_API_URL=https://api.compassplus.com:11611/Exec
NABIL_MERCHANT_ID=NABIL106809
NABIL_DECRYPT_KEY=0123456789abcdef
```

### 6.2 Preview/Development Environments

- Keep Preview/Development environments using test values
- Only set production variables for **Production** environment in Vercel

---

## Troubleshooting

### Issue: "SSL certificate not found"

**Solution:**
- Ensure `NABIL_CERT_BASE64` and `NABIL_KEY_BASE64` are set in Vercel
- Verify the base64 strings are complete (no line breaks)
- Check that they're set for Production environment

### Issue: "Decryption failed"

**Solution:**
- Verify `NABIL_DECRYPT_KEY` is in hex format
- Ensure it matches the LIVE decrypt key from Nabil Bank
- Check for any extra spaces or characters

### Issue: "API Error: Connection refused"

**Solution:**
- Verify `NABIL_API_URL` is correct (production endpoint)
- Check if production API uses a different port
- Contact Nabil Bank to confirm production endpoint URL

### Issue: "Invalid Merchant ID"

**Solution:**
- Verify `NABIL_MERCHANT_ID` matches production merchant ID from bank
- Check for typos or extra spaces
- Ensure it's set for Production environment

---

## Summary Checklist

Before going live, verify:

- [ ] Production certificate saved as `api.merosathi.co.production.crt`
- [ ] Production private key saved as `api.merosathi.co.production.key`
- [ ] Certificates base64 encoded
- [ ] `NABIL_API_URL` set in Vercel (Production environment)
- [ ] `NABIL_MERCHANT_ID` set in Vercel (Production environment)
- [ ] `NABIL_DECRYPT_KEY` set in Vercel (Production environment)
- [ ] `NABIL_CERT_BASE64` set in Vercel (Production environment)
- [ ] `NABIL_KEY_BASE64` set in Vercel (Production environment)
- [ ] Tested payment flow in production
- [ ] Verified all 5 transaction logs are stored
- [ ] Confirmed payment redirects to production payment page

---

## Support

If you encounter issues:

1. Check Vercel logs for error messages
2. Verify all environment variables are set correctly
3. Contact Nabil Bank support for:
   - Production API URL
   - Production Merchant ID
   - Production Decrypt Key
   - Production Payment Page URL

---

## Code Changes Summary

The following changes were made to support production:

1. **`backend/src/config/env.ts`**
   - Added `NABIL_API_URL` (optional, defaults to test)
   - Added `NABIL_MERCHANT_ID` (optional, defaults to test)
   - Added `NABIL_DECRYPT_KEY` (optional, defaults to test)

2. **`backend/src/services/nabil.service.ts`**
   - Updated to use environment variables with test fallbacks
   - Updated certificate paths to prioritize production certificates
   - Added logging to show which environment is active

3. **Certificate Loading**
   - Checks environment variables first (`NABIL_CERT_BASE64`, `NABIL_KEY_BASE64`)
   - Falls back to production certificate files (`api.merosathi.co.production.*`)
   - Falls back to test certificate files (`merosathi.co.*`)

---

**Last Updated:** January 2026
**Status:** Ready for Production Configuration
