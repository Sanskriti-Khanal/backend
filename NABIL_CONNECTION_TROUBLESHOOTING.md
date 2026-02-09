# Nabil Bank API Connection Troubleshooting

## Error: "No response from server"

This error means the request was sent to Nabil Bank but no response was received.

---

## Step 1: Check Vercel Logs

After the new deployment, check Vercel function logs. You should see detailed error information:

1. Go to **Vercel Dashboard** → Your Project → **Functions** → Click on a function
2. Check **Logs** tab
3. Look for:
   - `🔧 Nabil Service Configuration:` - Shows API URL, Merchant ID, Environment
   - `🔍 Loading SSL certificates...` - Shows if certificates are loaded
   - `❌ Nabil Bank API Error Details:` - Shows detailed error information

---

## Step 2: Verify Environment Variables

Check that all 5 environment variables are set in **Vercel → Settings → Environment Variables → Production**:

| Variable | Expected Value | How to Check |
|----------|---------------|--------------|
| `NABIL_API_URL` | `https://adapter.nabilbank.com/Exec` | Should see in logs: `API URL: https://adapter.nabilbank.com/Exec` |
| `NABIL_MERCHANT_ID` | `600000001068090` | Should see in logs: `Merchant ID: 600000001068090` |
| `NABIL_DECRYPT_KEY` | `5D30E8E794F2780D` | Should see in logs: `Decrypt Key: 5D30E8E7...` |
| `NABIL_CERT_BASE64` | (long base64 string) | Should see in logs: `Cert from env: ✅ Set` |
| `NABIL_KEY_BASE64` | (long base64 string) | Should see in logs: `Key from env: ✅ Set` |

**Important:** All must be set for **Production** environment!

---

## Step 3: Common Issues and Solutions

### Issue 1: Environment Variables Not Set

**Symptoms:**
- Logs show: `Environment: TEST` (should be `PRODUCTION`)
- Logs show: `API URL: https://api.compassplus.com:11611/Exec` (test URL)

**Solution:**
- Go to Vercel → Settings → Environment Variables
- Make sure all 5 variables are set for **Production** environment
- Redeploy

---

### Issue 2: SSL Certificates Not Loading

**Symptoms:**
- Logs show: `Cert from env: ❌ Not set` or `Key from env: ❌ Not set`
- Error: `SSL certificate not found`

**Solution:**
1. Re-encode certificates:
   ```bash
   cd backend
   ./scripts/encode-certificates.sh production
   ```
2. Copy the base64 values
3. Update in Vercel:
   - `NABIL_CERT_BASE64` = (full base64 string, no line breaks)
   - `NABIL_KEY_BASE64` = (full base64 string, no line breaks)
4. Redeploy

---

### Issue 3: Wrong API URL

**Symptoms:**
- Logs show wrong API URL
- Error code: `ENOTFOUND` (DNS lookup failed)

**Solution:**
- Verify `NABIL_API_URL` is set to: `https://adapter.nabilbank.com/Exec`
- Check Vercel environment variables
- Redeploy

---

### Issue 4: Network Connectivity Issues

**Symptoms:**
- Error code: `ECONNREFUSED` (connection refused)
- Error code: `ETIMEDOUT` (request timed out)
- Error code: `ENOTFOUND` (DNS lookup failed)

**Possible Causes:**
1. **IP Whitelisting:** Nabil Bank might require Vercel IPs to be whitelisted
2. **Firewall:** Nabil Bank firewall might be blocking Vercel
3. **Network Issues:** Temporary network problems

**Solution:**
1. **Contact Nabil Bank** to:
   - Verify if IP whitelisting is required
   - Get list of Vercel IP addresses to whitelist
   - Check if there are any firewall rules blocking requests

2. **Alternative:** If IP whitelisting is not possible, consider:
   - Deploying backend on a VPS with static IP
   - Using a proxy service

---

### Issue 5: SSL Certificate Issues

**Symptoms:**
- Error code: `CERT_HAS_EXPIRED`
- Error code: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- Error: `SSL certificate not found`

**Solution:**
1. Verify certificate is valid:
   ```bash
   openssl x509 -in src/cert/api.merosathi.co.production.crt -noout -dates
   ```
2. Re-encode and update in Vercel
3. Make sure certificate matches the private key

---

## Step 4: Check Error Codes in Logs

After deployment, check Vercel logs for specific error codes:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ECONNREFUSED` | Connection refused | Check API URL, IP whitelisting |
| `ETIMEDOUT` | Request timed out | Check network connectivity |
| `ENOTFOUND` | DNS lookup failed | Check API URL is correct |
| `CERT_HAS_EXPIRED` | Certificate expired | Renew certificate |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | SSL certificate issue | Check certificate configuration |

---

## Step 5: Verify Configuration in Logs

After deployment, you should see in Vercel logs:

```
🔧 Nabil Service Configuration:
  API URL: https://adapter.nabilbank.com/Exec
  Merchant ID: 600000001068090
  Decrypt Key: 5D30E8E7...
  Environment: PRODUCTION

🔍 Loading SSL certificates...
  Cert from env: ✅ Set (XXXX chars)
  Key from env: ✅ Set (XXXX chars)
✅ Loaded SSL certificates from environment variables
```

If you see `Environment: TEST` or certificates not loading, environment variables are not set correctly.

---

## Step 6: Test from Local Machine (Optional)

To verify the API URL works, test from your local machine:

```bash
# Test if the API endpoint is reachable
curl -v https://adapter.nabilbank.com/Exec

# If you get SSL errors, that's expected (need client certificate)
# But if you get "connection refused" or timeout, there's a network issue
```

**Note:** This won't work without SSL certificates, but it helps verify network connectivity.

---

## Step 7: Contact Nabil Bank

If all environment variables are correct and you still get "No response from server":

1. **Contact Nabil Bank Support** with:
   - Your Merchant ID: `600000001068090`
   - Error message: "No response from server"
   - Error code from logs (if any)
   - Ask about:
     - IP whitelisting requirements
     - Firewall rules
     - Network connectivity from Vercel
     - Production API endpoint verification

2. **Provide Vercel Information:**
   - Vercel uses dynamic IPs
   - Ask if they can whitelist Vercel IP ranges
   - Or if they need a static IP (might need VPS deployment)

---

## Quick Checklist

- [ ] All 5 environment variables set in Vercel (Production)
- [ ] Logs show `Environment: PRODUCTION`
- [ ] Logs show correct API URL: `https://adapter.nabilbank.com/Exec`
- [ ] Logs show certificates loading: `✅ Set`
- [ ] Check error code in logs
- [ ] Contact Nabil Bank if network/whitelisting issue

---

**Last Updated:** January 13, 2026
