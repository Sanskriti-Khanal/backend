# Vercel Certificate Setup for Nabil Bank EPG

The Nabil Bank EPG integration requires SSL client certificates for authentication. In Vercel's serverless environment, you have two options:

## Option 1: Environment Variables (Recommended for Vercel)

This is the recommended approach for Vercel deployments.

### Step 1: Encode Certificates to Base64

Run the helper script:

```bash
cd backend
./scripts/encode-certificates.sh
```

Or manually encode:

```bash
# On macOS/Linux
base64 -i src/cert/merosathi.co.crt | tr -d '\n'
base64 -i src/cert/merosathi.key | tr -d '\n'
```

### Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables for **Production** environment:

   - **Variable Name:** `NABIL_CERT_BASE64`
     - **Value:** (paste the base64-encoded certificate from Step 1)
   
   - **Variable Name:** `NABIL_KEY_BASE64`
     - **Value:** (paste the base64-encoded key from Step 1)

5. **Important:** Make sure to select **Production** environment (not Preview or Development)
6. Click **Save**
7. **Redeploy** your application

### Step 3: Verify

After redeploying, test the checkout flow:
1. Visit `https://api.merosathi.co/nabil/checkout`
2. Click "Pay NPR 1.00"
3. You should be redirected to `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`

## Option 2: Include Files in Build

If you prefer to use file-based certificates, ensure they're included in the Vercel build:

1. The `vercel.json` has been updated to include `src/cert/**` in the build
2. Make sure certificate files are committed to git (they should be in `backend/src/cert/`)
3. Redeploy

**Note:** Option 1 (environment variables) is more secure and recommended for production.

## Troubleshooting

### Error: "SSL certificate not found"

- **Check 1:** Verify environment variables are set in Vercel Dashboard
- **Check 2:** Make sure variables are set for **Production** environment
- **Check 3:** Verify the base64 encoding is correct (no line breaks)
- **Check 4:** Redeploy after adding environment variables

### Error: "Invalid certificate format"

- Make sure you're encoding the entire certificate file (including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`)
- Verify the base64 string doesn't have line breaks or spaces

### Still not working?

1. Check Vercel function logs for detailed error messages
2. Verify certificate files exist locally: `ls -la backend/src/cert/`
3. Test locally first to ensure certificates work: `npm run dev`





