# Backend Deployment Diagnostic Guide

## 🚨 Current Issue
Backend is returning 404 for `/api/templates/gmail` even after rebuild.

## 🔍 Root Cause Analysis

The backend is likely **crashing during startup** because:
1. Environment variables aren't set correctly in Coolify
2. The Supabase client initialization fails at line 4 of `backend/src/middleware/auth.js`
3. Server crashes BEFORE routes are registered

## ✅ Step-by-Step Diagnostic Process

### Step 1: Check Coolify Build Logs

In Coolify, go to your backend service and check the **build logs**:

Look for:
```
✅ npm install
✅ Build completed successfully  
✅ Starting container...
```

If build fails, you'll see error messages here.

### Step 2: Check Coolify Runtime Logs

After build completes, check the **runtime logs** (container output):

**🔴 BAD (Crashing on Startup):**
```
[error]: Missing required Supabase environment variables
[error]: Failed to initialize Supabase client
Error: SUPABASE_URL and SERVICE_ROLE_KEY are required
```

**✅ GOOD (Successful Startup):**
```
Server starting...
Supabase client initialized successfully
Server listening on port 3001
Route /api/templates registered
```

### Step 3: Verify Environment Variables in Coolify

Go to your backend service → **Environment Variables** tab

**Required Variables (EXACT NAMES):**
```
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SERVICE_ROLE_KEY=<your-service-role-key>
ANON_KEY=<your-anon-key>
FRONTEND_URL=https://app.floworx-iq.com
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=<your-n8n-api-key>
GMAIL_CLIENT_ID=<your-gmail-client-id>
GMAIL_CLIENT_SECRET=<your-gmail-client-secret>
GMAIL_REDIRECT_URI=https://app.floworx-iq.com/oauth-callback
OUTLOOK_CLIENT_ID=<your-outlook-client-id>
OUTLOOK_CLIENT_SECRET=<your-outlook-client-secret>
OUTLOOK_REDIRECT_URI=https://app.floworx-iq.com/oauth-callback
JWT_SECRET=<your-jwt-secret>
OPENAI_API_KEY=<your-openai-key>
```

**⚠️ CRITICAL:** 
- Variable names must be **EXACT** (case-sensitive)
- No extra spaces
- No quotes around values (unless Coolify UI requires them)

### Step 4: Check Git Commit in Coolify

Verify Coolify is building from the **latest commit**:

**Latest commit should be:**
```
3c4b453 - Add Coolify rebuild checklist for backend deployment verification
```

Or newer. If it's building from an old commit, the template routes won't exist!

### Step 5: Force Clean Rebuild

If environment variables are correct but it's still failing:

1. In Coolify, go to backend service
2. Click **"Force Rebuild"** or **"Redeploy"**
3. **Enable "Clean Build"** if available (clears cache)
4. Wait for build to complete
5. Check runtime logs immediately after deployment

## 🧪 Quick Test Commands

### Test 1: Health Endpoint (Should Always Work)
```powershell
curl https://api.floworx-iq.com/api/health
```
**Expected:** `OK` (200 status)

### Test 2: Template Endpoint (Currently Failing)
```powershell
curl https://api.floworx-iq.com/api/templates/gmail
```
**Currently:** `404 Not Found`  
**Expected After Fix:** JSON template with ~35 nodes

### Test 3: Check Backend Response Headers
```powershell
curl -I https://api.floworx-iq.com/api/templates/gmail
```
**Look for:** `X-Powered-By: Express` (confirms backend is responding)

## 🔧 Possible Solutions

### Solution 1: Environment Variables Not Set
**Problem:** Coolify doesn't have the variables configured  
**Fix:** Add all required variables in Coolify UI

### Solution 2: Old Docker Image Cached
**Problem:** Coolify is using cached image  
**Fix:** Force clean rebuild with cache cleared

### Solution 3: Wrong Git Branch/Commit
**Problem:** Coolify is building from old commit  
**Fix:** Check Coolify source configuration, ensure it's pulling from `master` branch

### Solution 4: Domain Routing Issue
**Problem:** `api.floworx-iq.com` not pointing to backend service  
**Fix:** Check Coolify domain configuration for backend service

## 📋 Checklist for Resolution

- [ ] Build logs show successful build
- [ ] Runtime logs show "Server listening on port 3001"
- [ ] Runtime logs show "Supabase client initialized"
- [ ] No errors about missing environment variables
- [ ] Environment variables configured in Coolify
- [ ] Latest Git commit (`3c4b453` or newer)
- [ ] Clean rebuild completed
- [ ] Health endpoint returns 200 OK
- [ ] Template endpoint returns JSON (not 404)

## 🎯 Next Steps Based on Logs

### If you see "Missing required Supabase environment variables":
→ Environment variables are NOT configured correctly in Coolify  
→ Add them exactly as shown in Step 3 above

### If you see "Build failed" or "npm install failed":
→ Build issue, not environment variables  
→ Check build logs for specific error  
→ May need to fix `package.json` or dependencies

### If you see "404 Not Found" for ALL routes (including /api/health):
→ Domain routing issue  
→ `api.floworx-iq.com` not pointing to backend service  
→ Check Coolify domain configuration

### If /api/health works but /api/templates returns 404:
→ Backend is running but routes aren't registered  
→ Check if building from old Git commit  
→ Force rebuild from latest commit

---

## 📞 What to Check Right Now

1. **Go to Coolify**
2. **Open Backend Service**
3. **Click on "Logs" tab**
4. **Look at the LATEST logs** (refresh if needed)
5. **Copy the last 50-100 lines** and send them to me

This will tell us EXACTLY why the backend isn't working!

