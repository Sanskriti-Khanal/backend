# Nabil Bank SSL Certificate Error Fix

## Error: `ERR_SSL_TLSV1_ALERT_UNKNOWN_CA`

This error means Nabil Bank's server doesn't recognize the Certificate Authority (CA) that signed your client certificate.

**Your Certificate Details:**
- **Issuer:** Compass Plus Ltd (Processing Center Customers CA)
- **Subject:** api.merosathi.co
- **Valid:** Jan 12, 2026 - Jan 12, 2028

---

## Possible Causes

1. **Missing Certificate Chain:** The certificate might need intermediate/CA certificates
2. **Server Configuration:** Nabil Bank's server might not be configured to trust the CA
3. **Certificate Format:** The certificate might need to be in a different format

---

## Solution 1: Check if Intermediate Certificates Are Needed

Nabil Bank might have provided intermediate certificates that need to be included. Check:

1. **Email from Nabil Bank:** Look for any additional certificate files (`.crt`, `.pem`, `.cer`)
2. **Certificate Chain:** The certificate might need to include the full chain

If you have intermediate certificates, they need to be concatenated with your certificate:

```bash
# Format: Your cert + Intermediate certs
cat api.merosathi.co.production.crt intermediate.crt ca.crt > certificate-chain.crt
```

Then encode the chain:
```bash
base64 -i certificate-chain.crt | tr -d '\n'
```

---

## Solution 2: Contact Nabil Bank

**Contact Nabil Bank Support** with:

1. **Error Message:**
   ```
   ERR_SSL_TLSV1_ALERT_UNKNOWN_CA
   ```

2. **Your Certificate Details:**
   - Issuer: Compass Plus Ltd (Processing Center Customers CA)
   - Subject: api.merosathi.co
   - Merchant ID: 600000001068090

3. **Questions to Ask:**
   - Do we need to include intermediate/CA certificates?
   - Is the certificate format correct?
   - Is the server configured to accept certificates from Compass Plus Ltd?
   - Do you have a certificate chain file we should use?
   - Are there any additional SSL configuration requirements?

---

## Solution 3: Verify Certificate Format

Check if the certificate is in the correct format:

```bash
cd backend
openssl x509 -in src/cert/api.merosathi.co.production.crt -text -noout
```

**Expected Format:**
- Should start with `-----BEGIN CERTIFICATE-----`
- Should end with `-----END CERTIFICATE-----`
- Should be in PEM format (base64 encoded)

---

## Solution 4: Check Certificate in Vercel

Verify the certificate is correctly encoded in Vercel:

1. **Check Vercel Logs:**
   - Look for: `✅ Loaded SSL certificates from environment variables`
   - Check: `Cert length: XXXX chars`

2. **Verify Base64 Encoding:**
   - The certificate should be base64 encoded
   - No line breaks in the environment variable
   - Full certificate content included

---

## Solution 5: Test Certificate Locally (Optional)

To test if the certificate works:

```bash
# Test certificate validity
openssl x509 -in src/cert/api.merosathi.co.production.crt -noout -dates

# Test certificate and key match
openssl x509 -noout -modulus -in src/cert/api.merosathi.co.production.crt | openssl md5
openssl rsa -noout -modulus -in src/cert/api.merosathi.co.production.key | openssl md5
# These should match
```

---

## Immediate Action Required

**Contact Nabil Bank Support** (Swikar Shrestha or Transaction Banking team) with:

**Subject:** SSL Certificate Error - ERR_SSL_TLSV1_ALERT_UNKNOWN_CA

**Message:**
```
Dear Team,

We are experiencing an SSL certificate error when connecting to the production API:

Error: ERR_SSL_TLSV1_ALERT_UNKNOWN_CA
API URL: https://adapter.nabilbank.com/Exec
Merchant ID: 600000001068090

Our certificate details:
- Issuer: Compass Plus Ltd (Processing Center Customers CA)
- Subject: api.merosathi.co
- Valid: Jan 12, 2026 - Jan 12, 2028

Questions:
1. Do we need to include intermediate/CA certificates in the certificate chain?
2. Is the server configured to accept certificates from Compass Plus Ltd?
3. Are there any additional SSL configuration requirements?
4. Do you have a certificate chain file we should use?

Please advise on how to resolve this issue.

Thank you.
```

---

## Temporary Workaround (NOT RECOMMENDED FOR PRODUCTION)

If you need to test immediately, you can temporarily disable server certificate verification (NOT SECURE):

```typescript
this.httpsAgent = new https.Agent({
  cert,
  key,
  rejectUnauthorized: false, // ⚠️ NOT SECURE - Only for testing
});
```

**⚠️ WARNING:** This is NOT secure and should only be used for testing. Do NOT use in production.

---

## Next Steps

1. ✅ Check Vercel logs to confirm certificate is loading
2. ✅ Contact Nabil Bank about the SSL certificate error
3. ✅ Ask if intermediate certificates are needed
4. ✅ Verify certificate format is correct
5. ⏳ Wait for Nabil Bank's response

---

**Last Updated:** January 13, 2026
