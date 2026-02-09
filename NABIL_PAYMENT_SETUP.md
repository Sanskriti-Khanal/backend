# Nabil Bank Payment Integration Setup

## Problem Fixed

The PHP file (`testnow_new.php`) was using a hardcoded base URL `https://merosathi.co` instead of reading from environment variables. This has been fixed.

## Solution

### 1. PHP File Updated (`backend/src/cert/testnow_new.php`)

The PHP file now reads `BASE_URL` from environment variables:

```php
$baseUrl = getenv('BASE_URL') ?: $_ENV['BASE_URL'] ?? "https://backend-git-main-mero-sas-projects.vercel.app";
```

**How to set BASE_URL:**

#### Option A: Set in PHP Environment
If running PHP directly, set the environment variable:
```bash
export BASE_URL=https://backend-git-main-mero-sas-projects.vercel.app
php testnow_new.php
```

#### Option B: Set in .env file (if using dotenv)
Create a `.env` file in the same directory as the PHP file:
```
BASE_URL=https://backend-git-main-mero-sas-projects.vercel.app
```

Then load it in PHP:
```php
// Add at the top of testnow_new.php
if (file_exists('.env')) {
    $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue; // Skip comments
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}
```

#### Option C: Set in Server Configuration
If using Apache, add to `.htaccess`:
```apache
SetEnv BASE_URL "https://backend-git-main-mero-sas-projects.vercel.app"
```

If using Nginx, add to server block:
```nginx
fastcgi_param BASE_URL "https://backend-git-main-mero-sas-projects.vercel.app";
```

### 2. Backend TypeScript (Already Correct)

The backend already correctly uses environment variables:

```typescript
// backend/src/controllers/payment.controller.ts
const baseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
const approveURL = env.NABIL_APPROVE_URL || `${baseUrl}/api/v1/payments/nabil/approve`;
const cancelURL = env.NABIL_CANCEL_URL || `${baseUrl}/api/v1/payments/nabil/cancel`;
const declineURL = env.NABIL_DECLINE_URL || `${baseUrl}/api/v1/payments/nabil/decline`;
```

**Set in backend `.env` file:**
```
BASE_URL=https://backend-git-main-mero-sas-projects.vercel.app
```

## Callback Flow

### 1. Order Creation
When you create an order (via PHP or backend API), the bank receives callback URLs:
- Approve: `{BASE_URL}/api/v1/payments/nabil/approve`
- Cancel: `{BASE_URL}/api/v1/payments/nabil/cancel`
- Decline: `{BASE_URL}/api/v1/payments/nabil/decline`

### 2. User Payment Flow
1. User completes payment on bank's page: `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`
2. Bank processes payment
3. Bank POSTs callback to your backend with XML payload
4. Backend stores data in database
5. Backend returns `200 OK` to bank

### 3. Data Storage

All callbacks are stored in the `NabilCallback` collection with:
- Order ID, Session ID
- Amount, Currency
- Status (APPROVED/CANCELED/DECLINED)
- Transaction details
- Raw XML for reference
- Timestamp

The backend also updates related `Payment` records if found.

## Verification

### 1. Check PHP Output
When you run `testnow_new.php`, you should see HTML comments showing the URLs:
```html
<!-- DEBUG: Callback URLs being sent to bank -->
<!-- Approve URL: https://backend-git-main-mero-sas-projects.vercel.app/api/v1/payments/nabil/approve -->
<!-- Cancel URL: https://backend-git-main-mero-sas-projects.vercel.app/api/v1/payments/nabil/cancel -->
<!-- Decline URL: https://backend-git-main-mero-sas-projects.vercel.app/api/v1/payments/nabil/decline -->
```

### 2. Check Backend Logs
When a callback is received, check backend logs for:
```
========================================
NABIL [APPROVE/CANCEL/DECLINE] CALLBACK RECEIVED
========================================
Parsed Data: {...}
Callback Transaction ID: ...
========================================
```

### 3. Check Database
Query the `NabilCallback` collection to verify data is stored:
```javascript
// MongoDB query
db.nabilcallbacks.find().sort({ receivedAt: -1 }).limit(5)
```

## Routes

All callback routes are public (no authentication required):
- `POST /api/v1/payments/nabil/approve`
- `POST /api/v1/payments/nabil/cancel`
- `POST /api/v1/payments/nabil/decline`

## Important Notes

1. **BASE_URL must be publicly accessible** - The bank's servers need to POST to these URLs
2. **No localhost** - Use your Vercel deployment URL or ngrok for testing
3. **HTTPS required** - Bank requires HTTPS URLs
4. **Always returns 200 OK** - Even if database fails, bank receives success response

## Troubleshooting

### Issue: Still redirecting to merosathi.co
**Solution:** 
1. Check that `BASE_URL` environment variable is set correctly
2. Restart PHP/web server after setting environment variable
3. Check PHP error logs for the base URL being used

### Issue: Callbacks not storing in database
**Solution:**
1. Check MongoDB connection
2. Check backend logs for errors
3. Verify callback routes are accessible (test with curl)

### Issue: Bank not receiving 200 OK
**Solution:**
1. Check that routes are public (no authentication)
2. Verify server is running and accessible
3. Check server logs for errors





