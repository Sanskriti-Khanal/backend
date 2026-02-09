# Vercel Domain Configuration Guide

This guide will help you configure your custom domain `merosathi.co` for your Vercel backend deployment.

## Step 1: Add Domain in Vercel Dashboard

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your backend project
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter `merosathi.co` (or `api.merosathi.co` if you want a subdomain)
6. Click **Add**

## Step 2: Configure DNS Records

Vercel will provide you with DNS records to add. You have two options:

### Option A: Root Domain (merosathi.co)
- Add an **A Record** pointing to Vercel's IP addresses (provided by Vercel)
- Or add a **CNAME Record** pointing to `cname.vercel-dns.com`

### Option B: Subdomain (api.merosathi.co) - Recommended
- Add a **CNAME Record**:
  - Name: `api`
  - Value: `cname.vercel-dns.com`
  - TTL: Auto or 3600

**Note:** If you want to use the root domain `merosathi.co` for the backend, you'll need to configure it at your DNS provider. If you have a frontend on the root domain, consider using `api.merosathi.co` for the backend.

## Step 3: Update Environment Variables

After adding the domain, update your Vercel environment variables:

1. Go to **Settings** → **Environment Variables**
2. Update the following variables for **Production** environment:

### Required Updates:

```bash
# Update CORS_ORIGIN to include your domain
CORS_ORIGIN=https://merosathi.co,https://www.merosathi.co,https://api.merosathi.co

# Update BASE_URL to your production domain
BASE_URL=https://merosathi.co
# OR if using subdomain:
BASE_URL=https://api.merosathi.co
```

### If using payment callbacks, also update:

```bash
# Nabil Bank Payment Gateway URLs
NABIL_APPROVE_URL=https://merosathi.co/api/v1/payments/nabil/callback/approve
NABIL_CANCEL_URL=https://merosathi.co/api/v1/payments/nabil/callback/cancel
NABIL_DECLINE_URL=https://merosathi.co/api/v1/payments/nabil/callback/decline
```

## Step 4: Verify Domain Configuration

1. Wait for DNS propagation (can take up to 48 hours, usually much faster)
2. Check domain status in Vercel dashboard - it should show "Valid Configuration"
3. Test your API:
   ```bash
   curl https://merosathi.co/health
   # Should return: {"success":true,"message":"Server is running"}
   ```

## Step 5: SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. Once your domain is configured and DNS is propagated, SSL will be automatically enabled.

## Troubleshooting

### Domain not resolving?
- Check DNS propagation: https://dnschecker.org
- Verify DNS records are correct at your domain registrar
- Wait up to 48 hours for full propagation

### CORS errors?
- Verify `CORS_ORIGIN` environment variable includes your frontend domain
- Check that the domain format is correct (with `https://` protocol)
- Ensure credentials are enabled if needed

### SSL not working?
- Wait a few minutes after DNS propagation
- Check Vercel dashboard for SSL certificate status
- Ensure your domain is properly configured in Vercel

## Additional Notes

- The backend supports multiple CORS origins (comma-separated)
- Make sure to set environment variables for **Production** environment, not just Preview
- After updating environment variables, redeploy your project for changes to take effect




