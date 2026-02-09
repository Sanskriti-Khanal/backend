# Fix 403 Error - Local Testing

## Issue: HTTP ERROR 403 - Access to localhost was denied

This could be caused by several things. Let's troubleshoot:

---

## Step 1: Check if Server is Running

**Check terminal output:**
```bash
cd backend
npm run dev
```

**You should see:**
```
✅ MongoDB connected
🚀 Server running on port 5000
```

**If you don't see this:**
- Server might not be running
- Check for errors in terminal
- Make sure port 5000 is not in use

---

## Step 2: Check Browser URL

**Correct URL:**
```
http://localhost:5000/nabil/checkout
```

**Common mistakes:**
- ❌ `https://localhost:5000` (should be `http://`)
- ❌ `localhost:5000` (missing `http://`)
- ❌ `http://localhost:3000` (wrong port)

---

## Step 3: Check Rate Limiting

The rate limiter might be blocking if `trust proxy` isn't working. Let's verify:

**Check terminal logs when you try to access:**
- Do you see: `✅ ROOT CHECKOUT PAGE ROUTE HIT (GET)`?
- Or do you see rate limit errors?

**If rate limited:**
- Wait 15 minutes, or
- Clear rate limit (see below)

---

## Step 4: Test with curl (Bypass Browser Issues)

Test directly with curl to see if it's a browser issue:

```bash
curl http://localhost:5000/nabil/checkout
```

**Expected:** HTML content of checkout page

**If this works:** It's a browser issue, not server issue

---

## Step 5: Check Server Logs

When you try to access `http://localhost:5000/nabil/checkout`, check terminal for:

**Good signs:**
```
✅ ROOT CHECKOUT PAGE ROUTE HIT (GET) - Public route, no auth required
```

**Bad signs:**
- No logs at all → Server not running or route not hit
- Rate limit errors → Rate limiter blocking
- 403 errors → Check middleware

---

## Step 6: Verify Route is Accessible

Test the root route first:

```bash
curl http://localhost:5000/
```

**Expected response:**
```json
{
  "message": "MeroSathi API",
  "status": "ok"
}
```

**If this works:** Server is running, test checkout route

**If this fails:** Server might not be running correctly

---

## Step 7: Check for CORS Issues

If accessing from a different origin, CORS might block it.

**For local testing:**
- Use `http://localhost:5000` directly (not from another domain)
- Or check `.env` has: `CORS_ORIGIN=http://localhost:3000`

---

## Step 8: Clear Rate Limit (If Needed)

If you're rate limited, you can:

1. **Wait 15 minutes** (rate limit window)
2. **Restart server** (clears rate limit in memory)
3. **Temporarily disable rate limiting** for testing:

```typescript
// In app.ts, temporarily comment out:
// app.use('/api/v1', apiLimiter);
```

---

## Step 9: Check Browser Console

Open browser developer tools (F12) and check:
- **Console tab:** Any JavaScript errors?
- **Network tab:** What status code is returned?
- **Response:** What does the server actually return?

---

## Quick Test Commands

```bash
# 1. Start server
cd backend
npm run dev

# 2. In another terminal, test root
curl http://localhost:5000/

# 3. Test checkout page
curl http://localhost:5000/nabil/checkout

# 4. Check if server is listening
lsof -i :5000
```

---

## Most Common Causes

1. **Server not running** → Start with `npm run dev`
2. **Wrong URL** → Use `http://localhost:5000/nabil/checkout`
3. **Rate limited** → Wait or restart server
4. **Browser security** → Try different browser or incognito mode
5. **Port conflict** → Check if port 5000 is in use

---

## Next Steps

1. **Check if server is running** (see terminal)
2. **Test with curl** (bypasses browser issues)
3. **Check server logs** (see what's happening)
4. **Share the output** so we can diagnose further

---

**Try these steps and let me know what you see!**
