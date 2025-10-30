# 🔍 Coolify Bad Gateway Diagnostics

## Your Setup:
- **Frontend**: `app.floworx-iq.com` (port 80)
- **Backend**: `api.floworx-iq.com` (port 3001)

## 🚨 Bad Gateway = One Service Can't Reach the Other

---

## ✅ Step 1: Check Both Services Are Running

### In Coolify Dashboard:
1. Go to your project
2. Check **both services** status:
   - `app` (frontend) → Should show "Running" (green)
   - `api` (backend) → Should show "Running" (green)

### If Backend Shows "Crashed" or "Stopped":
**Look at backend logs** for errors like:
- Port already in use
- Missing environment variable
- Database connection failed
- Module not found

---

## ✅ Step 2: Test Backend Directly

### Open browser to:
```
https://api.floworx-iq.com/health
```

**Expected Response:**
```json
{"status":"healthy","timestamp":"2025-10-27..."}
```

**If you get:**
- ❌ **502 Bad Gateway** → Backend container crashed or not running
- ❌ **404 Not Found** → Backend running but `/health` endpoint missing
- ❌ **Connection Refused** → DNS not pointing to Coolify IP
- ❌ **SSL Error** → Certificate issue for api.floworx-iq.com

---

## ✅ Step 3: Check DNS

### Run in terminal:
```bash
nslookup api.floworx-iq.com
# Should return: 72.61.1.235 (your Coolify IP)

nslookup app.floworx-iq.com
# Should return: 72.61.1.235 (same IP)
```

**If DNS points elsewhere:**
- Update your DNS A records to point to `72.61.1.235`
- Wait 5-10 minutes for DNS propagation

---

## ✅ Step 4: Check Coolify Domain Configuration

### For BOTH services in Coolify:
1. Click on service → Settings → Domains
2. Verify:
   - **Frontend**: Domain = `app.floworx-iq.com`
   - **Backend**: Domain = `api.floworx-iq.com`
3. Check **SSL certificate** status (should show green checkmark)

**If SSL failing:**
- Click "Generate SSL Certificate" for both domains
- Wait for Let's Encrypt to issue certificates

---

## ✅ Step 5: Check Backend Environment Variables

### In Coolify → Backend Service → Environment Variables:

Required variables:
```bash
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=<your-n8n-api-key>
OPENAI_API_KEY=<your-openai-key>
JWT_SECRET=<your-jwt-secret>
FRONTEND_URL=https://app.floworx-iq.com
```

**If any are missing** → Backend will crash on startup

---

## ✅ Step 6: Check Backend Logs

### In Coolify → Backend Service → Logs:

Look for:
```
✅ GOOD: "Server listening on port 3001"
✅ GOOD: "Connected to database"

❌ BAD: "Error: Cannot find module"
❌ BAD: "EADDRINUSE: Port 3001 already in use"
❌ BAD: "Supabase connection failed"
❌ BAD: "Missing required environment variable"
```

---

## 🎯 Common Fixes:

### **Fix 1: Backend Crashed**
**Solution:** Check backend logs, fix the error, redeploy

### **Fix 2: Missing Environment Variables**
**Solution:** Add all required env vars in Coolify → Redeploy

### **Fix 3: Port Conflict**
**Solution:** Make sure PORT=3001 in backend env vars

### **Fix 4: DNS Not Propagated**
**Solution:** Wait 5-10 minutes after DNS update

### **Fix 5: SSL Certificate Failed**
**Solution:** 
- Coolify → Service → Settings → Domains
- Click "Generate SSL Certificate"
- Wait for completion

---

## 📊 Quick Health Check URLs:

Test these in your browser:
1. https://app.floworx-iq.com → Should load dashboard
2. https://api.floworx-iq.com/health → Should return JSON
3. https://n8n.srv995290.hstgr.cloud → N8N login page

**Tell me which ones work and which fail!**

