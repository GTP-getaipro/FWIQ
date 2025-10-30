# 🔍 Test Backend Connection

## Run These Tests:

### Test 1: Open in Browser
```
https://api.floworx-iq.com/health
```
**Expected:** `{"status":"healthy",...}`

---

### Test 2: Check Browser Console
1. Open `https://app.floworx-iq.com/dashboard`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for errors like:
   - `CORS policy blocked`
   - `Failed to fetch`
   - `502 Bad Gateway`
   - `net::ERR_*`

---

### Test 3: Check Network Tab
1. Open `https://app.floworx-iq.com/dashboard`
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Refresh page
5. Look for **red/failed requests** to:
   - `https://api.floworx-iq.com/api/health`
   - `https://api.floworx-iq.com/api/n8n-proxy/*`

**Click on the failed request → Response tab → What error message?**

---

## 🎯 What to Report Back:

1. **Browser test result**: What does `https://api.floworx-iq.com/health` show?
2. **Console error**: Exact error message from console
3. **Network tab**: Which URL failed? What status code (502, 404, etc.)?
4. **Backend logs in Coolify**: Last 10-20 lines

This will tell us exactly what's failing!

