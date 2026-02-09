# Nabil Bank Production Configuration Values

## ✅ Completed

- [x] Production Certificate: `api.merosathi.co.production.crt` (needs to be saved)
- [x] Production Private Key: `api.merosathi.co.production.key` ✅ (exists)
- [x] LIVE Decrypt Key: `5D30E8E794F2780D` ✅

## ⚠️ Still Needed from Nabil Bank

You still need to get these values from Nabil Bank:

1. **Production API URL**
   - Test: `https://api.compassplus.com:11611/Exec`
   - Production: `???` (Ask Nabil Bank)

2. **Production Merchant ID**
   - Test: `NABIL106809`
   - Production: `???` (Ask Nabil Bank)

3. **Production Payment Page URL**
   - Test: `https://api.compassplus.com:11612/flex`
   - Production: `???` (Usually same domain, different port)

---

## Next Steps

### Step 1: Save Production Certificate

1. Check your email for the production certificate from Nabil Bank
2. Save it as: `backend/src/cert/api.merosathi.co.production.crt`
3. Verify it exists:
   ```bash
   ls -la backend/src/cert/api.merosathi.co.production.crt
   ```

### Step 2: Encode Certificates for Vercel

Once the certificate file is saved, run:

```bash
cd backend
./scripts/encode-certificates.sh production
```

This will output base64-encoded values for:
- `NABIL_CERT_BASE64`
- `NABIL_KEY_BASE64`

### Step 3: Update Vercel Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables → Production** and add:

| Variable Name | Value | Status |
|--------------|-------|--------|
| `NABIL_API_URL` | `???` (from bank) | ⏳ Need from bank |
| `NABIL_MERCHANT_ID` | `???` (from bank) | ⏳ Need from bank |
| `NABIL_DECRYPT_KEY` | `5D30E8E794F2780D` | ✅ Ready |
| `NABIL_CERT_BASE64` | `???` (from script) | ⏳ Need certificate file first |
| `NABIL_KEY_BASE64` | `???` (from script) | ⏳ Need certificate file first |

**Important:** Set these for **Production** environment only!

---

## Current Status

- ✅ Production private key exists
- ✅ LIVE decrypt key received: `5D30E8E794F2780D`
- ⏳ Production certificate file needs to be saved
- ⏳ Production API URL needed from bank
- ⏳ Production Merchant ID needed from bank

---

## Quick Reference

**LIVE Decrypt Key:** `5D30E8E794F2780D`

**Certificate Files:**
- Certificate: `backend/src/cert/api.merosathi.co.production.crt` (needs to be saved)
- Private Key: `backend/src/cert/api.merosathi.co.production.key` ✅

**Environment Variables to Set in Vercel (Production):**
```
NABIL_API_URL=https://api.compassplus.com:XXXXX/Exec
NABIL_MERCHANT_ID=NABILXXXXXX
NABIL_DECRYPT_KEY=5D30E8E794F2780D
NABIL_CERT_BASE64=<base64-encoded-certificate>
NABIL_KEY_BASE64=<base64-encoded-key>
```

---

**Last Updated:** January 13, 2026
