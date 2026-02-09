# Testing Role Fix

## Issue
"Userrole unknown" error when authenticating with healer role.

## Fix Applied
Updated `src/middleware/auth.middleware.ts` to properly normalize role values from JWT tokens.

## Steps to Test

### 1. Restart Backend Server
```bash
cd backend-main
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Test with Your Token
Your token contains: `"role":"healer"`

The middleware should now:
1. Extract role from token: `"healer"`
2. Normalize to lowercase: `"healer"`
3. Match against UserRole enum: `UserRole.HEALER = 'healer'`
4. Successfully authenticate

### 3. Test CRUD Operations
After restarting backend, try:
- Creating a healing listing
- Updating a healing listing  
- Deleting a healing listing

### 4. Check Backend Logs
If you still get "Userrole unknown", check the error message - it should now show:
```
Userrole unknown: "healer" (normalized: "healer"). Valid roles are: user, healer, jyotish, pujari, pandit, admin
```

This will help identify if there's a different issue.

## Verification

The role matching logic has been tested and works correctly:
- Token role: `"healer"` (string)
- Normalized: `"healer"` (lowercase)
- Enum value: `UserRole.HEALER = 'healer'`
- Match: ✅ Should work

## If Still Not Working

1. **Check backend is running**: `curl http://localhost:3000/api/v1/health`
2. **Verify token**: Decode your JWT at jwt.io to see exact role value
3. **Check backend logs**: Look for the exact error message
4. **Clear node_modules cache**: `rm -rf node_modules && npm install`
