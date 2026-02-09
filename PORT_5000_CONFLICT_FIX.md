# Fix Port 5000 Conflict

## Issue: Port 5000 is Already in Use

Port 5000 is currently being used by another process (likely macOS Control Center).

---

## Solution 1: Use a Different Port (Recommended)

### Update .env file:

```env
PORT=3000
```

Or any other available port (3001, 5001, 8000, etc.)

### Then access:
```
http://localhost:3000/nabil/checkout
```

---

## Solution 2: Stop the Process Using Port 5000

**Find the process:**
```bash
lsof -i :5000
```

**Kill the process (if safe to do so):**
```bash
# Find PID from lsof output, then:
kill -9 <PID>
```

**⚠️ Warning:** Only kill processes you recognize. The Control Center process might be important for macOS.

---

## Solution 3: Change Port in Code (Temporary)

If you can't change .env, you can hardcode a different port:

```typescript
// In src/app.ts, temporarily change:
app.listen(3000, () => {
  console.log(`🚀 Server running on port 3000`);
});
```

---

## Quick Fix: Use Port 3000

**1. Update .env:**
```env
PORT=3000
BASE_URL=http://localhost:3000
```

**2. Restart server:**
```bash
npm run dev
```

**3. Access:**
```
http://localhost:3000/nabil/checkout
```

---

## Verify Port is Available

**Check if port 3000 is free:**
```bash
lsof -i :3000
```

**If it's free:** Use port 3000

**If it's also in use:** Try 3001, 5001, 8000, etc.

---

**Recommended:** Use port 3000 for local development (it's the standard Node.js port).
