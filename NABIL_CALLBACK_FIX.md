# Nabil Callback GET Request Fix

## Problem
When users are redirected from Nabil Bank payment gateway to callback URLs (approve/cancel/decline), they get an "Internal server error" when visiting the URL in a browser.

**Example redirect URL:**
```
https://api.merosathi.co/api/v1/payments/nabil/cancel?OrderID=@encrypted@1@E22EED5B69A21A5C9195CC496D5804DD&SessionID=@encrypted@1@569C11D68235854F6CC4D85BB5861AA2
```

## Root Cause
The callback endpoints only handled POST requests (for bank XML callbacks), but browser redirects use GET requests. When users were redirected after payment, the GET request wasn't handled, causing an error.

## Solution
Added GET request handlers for all three callback endpoints:
- `/api/v1/payments/nabil/approve` (GET)
- `/api/v1/payments/nabil/cancel` (GET)
- `/api/v1/payments/nabil/decline` (GET)

### Changes Made

1. **Updated Routes** (`backend/src/routes/payment.routes.ts`):
   - Changed from `router.post()` to `router.all()` to handle both GET and POST requests

2. **Updated Controllers** (`backend/src/controllers/payment.controller.ts`):
   - Added GET request handlers that:
     - Extract OrderID and SessionID from query parameters
     - Show a user-friendly HTML page
     - Redirect users to the frontend after 2-3 seconds
     - Handle errors gracefully (always return HTML, never throw errors)

3. **Error Handling**:
   - All GET handlers have try-catch blocks
   - Even if errors occur, a user-friendly HTML page is returned
   - Logs are added for debugging

## Features

### GET Request Handling
- Shows user-friendly HTML pages with appropriate messages:
  - **Approve**: Green "✓ Payment Successful" message
  - **Cancel**: Orange "⚠ Payment Cancelled" message
  - **Decline**: Red "✗ Payment Declined" message

### Redirect Behavior
- Automatically redirects to frontend after 2-3 seconds
- Redirect URL format: `${FRONTEND_URL}/payment/{status}?orderID=...&sessionID=...`
- Includes fallback link if JavaScript redirect fails

### Query Parameter Support
- Handles encrypted OrderID/SessionID format: `@encrypted@1@...`
- Properly URL-encodes parameters
- Works with HTML-encoded characters (`&lt`, etc.)

## Environment Variable

Add this to your Vercel environment variables (optional):
```
FRONTEND_URL=https://merosathi.co
```

If not set, defaults to `https://merosathi.co`.

## Deployment

**IMPORTANT:** These changes need to be deployed to Vercel for them to take effect on the live server.

1. Commit the changes:
   ```bash
   git add .
   git commit -m "Fix: Add GET request handlers for Nabil payment callbacks"
   git push
   ```

2. Vercel will automatically deploy, or trigger a manual deployment

3. After deployment, test the endpoints:
   ```bash
   # Test cancel endpoint
   curl "https://api.merosathi.co/api/v1/payments/nabil/cancel?OrderID=TEST123&SessionID=TEST456"
   
   # Should return HTML page, not JSON error
   ```

## Testing

### Test GET Request (Browser Redirect)
```bash
curl "https://api.merosathi.co/api/v1/payments/nabil/cancel?OrderID=@encrypted@1@TEST&SessionID=@encrypted@1@TEST"
```

**Expected Response:**
- HTTP 200
- Content-Type: text/html
- HTML page with "Payment Cancelled" message
- Auto-redirect to frontend

### Test POST Request (Bank Callback)
```bash
curl -X POST "https://api.merosathi.co/api/v1/payments/nabil/cancel" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "xmlmsg=<?xml version=\"1.0\"?><Message><OrderID>TEST</OrderID><SessionId>TEST</SessionId><OrderStatus>CANCELED</OrderStatus></Message>"
```

**Expected Response:**
- HTTP 200
- Response: "OK"
- Data saved to database

## Frontend Redirect URLs

The GET handlers redirect to these frontend URLs:
- **Approve**: `${FRONTEND_URL}/payment/success?orderID=...&sessionID=...`
- **Cancel**: `${FRONTEND_URL}/payment/cancelled?orderID=...&sessionID=...`
- **Decline**: `${FRONTEND_URL}/payment/failed?orderID=...&sessionID=...`

Make sure your frontend has these routes set up to handle the redirects.

## Notes

- POST requests (bank XML callbacks) continue to work as before
- GET requests (browser redirects) now show user-friendly pages
- All errors are caught and handled gracefully
- No authentication required for callback endpoints (as expected)
- Query parameters are properly URL-encoded




