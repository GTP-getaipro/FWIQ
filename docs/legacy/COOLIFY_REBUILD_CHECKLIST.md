# Coolify Backend Rebuild Checklist

## 🚨 Current Issue
Backend service is running **OLD CODE** that doesn't include:
- `/api/templates` route (returns 404)
- `/api/analytics` route (returns 404)
- Updated `voiceLearningRoutes` registration

## ✅ Environment Variables (Already Configured)
These should already be set in Coolify:
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `ANON_KEY`
- `FRONTEND_URL`
- `N8N_BASE_URL`
- `N8N_API_KEY`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REDIRECT_URI`
- `OUTLOOK_CLIENT_ID`
- `OUTLOOK_CLIENT_SECRET`
- `OUTLOOK_REDIRECT_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`

## 🔧 Required Action: Force Rebuild in Coolify

### Steps:
1. **Go to Coolify Dashboard**
   - Navigate to: Services → Backend (`FWIQBack`)

2. **Trigger Rebuild**
   - Click "Redeploy" or "Force Rebuild" button
   - Ensure it's pulling from the latest Git commit: `bb42c90`

3. **Monitor Build Progress**
   - Watch the build logs
   - Build should take 3-5 minutes

4. **Watch for Success Indicators in Logs:**
   ```
   ✅ Building Docker image...
   ✅ npm install completed
   ✅ Starting server...
   ✅ Supabase client initialized
   ✅ Server listening on port 3001
   ```

5. **Watch for Failure Indicators:**
   ```
   ❌ Missing required Supabase environment variables
   ❌ Failed to initialize Supabase client
   ❌ SUPABASE_URL and SERVICE_ROLE_KEY are required
   ```

## 🧪 Verification Tests

### After rebuild completes, run these tests:

#### Test 1: Health Endpoint (Should Work)
```powershell
curl https://api.floworx-iq.com/api/health
```
**Expected:** `200 OK` with body: `"OK"`

#### Test 2: Template Endpoint (Currently 404, Should Return JSON)
```powershell
curl https://api.floworx-iq.com/api/templates/gmail
```
**Expected:** `200 OK` with JSON template object containing:
- `name`: "<<<BUSINESS_NAME>>> Gmail AI Email Processing Workflow..."
- `nodes`: Array of workflow nodes (should have ~35 nodes)
- `meta`: Template metadata

**Currently Getting:** `404 Not Found` - This proves old code is running!

#### Test 3: Analytics Endpoint (Currently 404)
```powershell
curl https://api.floworx-iq.com/api/analytics/dashboard/test -H "Authorization: Bearer test"
```
**Expected:** `401 Unauthorized` (auth error is OK, proves route exists)
**Currently Getting:** `404 Not Found` - Proves route doesn't exist yet!

## 📊 Current Git Commits (Latest First)
```
bb42c90 - Trigger Coolify rebuild - backend environment variables configured
99009be - Fix template loading path resolution and add better error handling
911e06e - Add missing voiceLearningRoutes import to server.js
fa40904 - Fix server.js - restore voiceLearningRoutes registration
2919fc6 - Fix template loading by serving templates via backend API
```

## 🎯 Success Criteria

After successful rebuild, you should see:

1. ✅ **Template endpoint returns JSON** (not 404)
   ```json
   {
     "name": "<<<BUSINESS_NAME>>> Gmail AI Email Processing Workflow...",
     "meta": { "templateVersion": "2.0", "provider": "gmail" },
     "nodes": [ ... array of 35+ nodes ... ]
   }
   ```

2. ✅ **Analytics endpoint returns auth error** (not 404)
   ```json
   {
     "error": "Authorization header missing",
     "code": "AUTH_HEADER_MISSING"
   }
   ```

3. ✅ **Frontend workflow deployment succeeds**
   - No more "Fallback Workflow" errors
   - Workflows deploy with proper trigger nodes
   - Activation succeeds

## 🔍 Troubleshooting

### If still getting 404 after rebuild:

1. **Check Coolify Build Logs:**
   - Verify build pulled latest commit (`bb42c90`)
   - Check for build errors

2. **Check Coolify Runtime Logs:**
   - Look for Supabase initialization errors
   - Verify all routes are registered

3. **Check Domain Routing:**
   - Ensure `api.floworx-iq.com` points to correct service
   - Verify HTTPS is properly configured

### If getting Supabase errors:

1. **Verify environment variables are set correctly**
2. **Check variable names** (must be exact):
   - `SERVICE_ROLE_KEY` (NOT `SUPABASE_SERVICE_ROLE_KEY`)
   - `ANON_KEY` (NOT `SUPABASE_ANON_KEY`)

---

## 📞 Next Steps After Rebuild

Once backend rebuild is complete and verified:
1. Test workflow deployment from frontend
2. Verify Edge Functions are working
3. Fix any remaining N8N CORS issues

