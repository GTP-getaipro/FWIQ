# N8N Deployment Checklist

**User:** fedf818f-986f-4b30-bfa1-7fc339c7bb60  
**Date:** 2025-10-07  
**Status:** ✅ READY FOR DEPLOYMENT

---

## Pre-Flight Checklist

### ✅ Environment Configuration

- [x] N8N Base URL configured: `https://n8n.srv995290.hstgr.cloud`
- [x] N8N API Key configured and validated (JWT token)
- [x] Outlook OAuth client ID configured
- [x] Outlook OAuth client secret configured
- [x] Vite proxy configured for `/n8n-api/*`
- [x] Supabase Edge Function `n8n-proxy` deployed

### ✅ API Endpoints Fixed

- [x] All `/rest/credentials` → `/api/v1/credentials`
- [x] All `/rest/workflows` → `/api/v1/workflows`
- [x] All `/healthz` → `/api/v1/workflows?limit=1`
- [x] Credential schema includes required fields
- [x] Workflow updates exclude read-only fields

### ✅ User Integration Status

- [x] Outlook integration: **ACTIVE** ✅
  - ID: `63f80aac-bc97-4612-b353-6cf32812d92e`
  - Access Token: Valid (starts with "EwBIBMl6BAA...")
  - Status: `active`
  - N8N Credential: `XgBpdf4ihlkYEcGq` (created)

- [ ] Gmail integration: **INACTIVE** ⚠️
  - ID: `0824a0a8-a2a7-40de-96bc-ac9be2d23639`
  - Status: `inactive`
  - Note: Not needed since Outlook is active

### ✅ N8N Workflow Status

- [x] Workflow ID: `1uxaD37C3k2vaDTw`
- [x] Workflow Name: "FloWorx - Client Business - 2025-10-07"
- [x] Status: **ACTIVE** ✅
- [x] Credentials: Outlook credential `XgBpdf4ihlkYEcGq` linked
- [x] Nodes: Converted from Gmail to Outlook
- [x] Ready for execution

### ✅ Sanity Tests Passed

- [x] **Test 1 - Connectivity**: GET `/api/v1/workflows?limit=1` → 200 OK ✅
- [x] **Test 2 - Credential Creation**: POST `/api/v1/credentials` → 200 OK ✅
- [x] **Test 3 - Credential Schema**: GET `/api/v1/credentials/schema/gmailOAuth2` → 200 OK ✅
- [x] **Test 4 - Workflow Activation**: POST `/api/v1/workflows/{id}/activate` → 200 OK ✅

---

## Deployment Steps

### Step 1: Clear Browser Cache ⚠️ REQUIRED

**Windows/Linux:**
```
Ctrl + Shift + R (Hard Refresh)
```

**Mac:**
```
Cmd + Shift + R (Hard Refresh)
```

**Or open in Incognito/Private mode**

### Step 2: Test Outlook OAuth Flow

1. Go to onboarding Step 2 (Email Integration)
2. Click "Connect Outlook"
3. Complete OAuth authorization
4. Verify integration shows as "Connected" ✅

### Step 3: Deploy Workflow

1. Complete onboarding steps 1-3
2. Go to Step 4 (Label Mapping)
3. Click "Deploy Workflow"
4. Watch console logs for:
   ```
   🏥 N8N health check passed: healthy
   🔐 Credentials created successfully
   🚀 Workflow deployed to N8N
   ✅ Workflow activated successfully
   ```

### Step 4: Verify Deployment

1. **In Browser Console:**
   ```javascript
   // Should show no errors
   // Health check should pass
   // Deployment should complete
   ```

2. **In N8N UI:**
   - Navigate to: `https://n8n.srv995290.hstgr.cloud`
   - Check Workflows → should see active workflow
   - Check Credentials → should see Outlook credential
   - Check Executions → may see test executions

3. **In Supabase:**
   - Check `integrations` table → `n8n_credential_id` populated
   - Check `workflows` table → workflow record exists
   - Check `email_logs` table → (will populate when emails processed)

---

## Troubleshooting Guide

### Issue: "N8N health check failed"

**Check:**
```bash
node test-n8n-api-endpoints.js
```

**If connectivity fails:**
- Verify N8N server is running
- Check firewall/network settings
- Verify URL is correct

### Issue: "Credential creation failed"

**Check:**
```bash
node check-user-integrations.js <your-user-id>
```

**If no active integrations:**
- Complete OAuth flow again
- Check integration status in Supabase

**If integration exists but fails:**
- Verify OAuth client ID/secret
- Check access token is valid
- Run: `node get-credential-schemas.js`

### Issue: "Workflow activation failed"

**Fix automatically:**
```bash
node fix-workflow-credentials.js <workflow-id> <user-id>
```

**Manual check:**
1. Open N8N UI
2. Open the workflow
3. Check each node has valid credentials
4. Click "Activate" button

### Issue: Still seeing old errors

**Solution:**
- Hard refresh browser: `Ctrl+Shift+R`
- Clear all browser data for localhost
- Restart Vite dev server
- Try incognito/private browsing

---

## Success Indicators

You'll know everything is working when you see:

### ✅ Browser Console
```
✅ OAuth completion detected, processing...
✅ Integration saved successfully
✅ N8N health check passed: healthy
✅ Credentials created successfully  
✅ Workflow deployed to N8N: <workflow-id>
✅ Workflow activated successfully
🎉 Deployment completed!
```

### ✅ N8N UI
- Workflow shows green "Active" badge
- Credential appears in credentials list
- No error messages in workflow editor

### ✅ Supabase Database
```sql
-- Check integrations table
SELECT provider, status, n8n_credential_id, n8n_credential_name
FROM integrations
WHERE user_id = '<your-user-id>'
AND status = 'active';

-- Should show:
-- provider: outlook
-- status: active  
-- n8n_credential_id: <credential-id>
-- n8n_credential_name: FloWorx Outlook - <user-id-prefix>
```

---

## Rollback Plan

If issues occur, rollback is simple:

### Option 1: Deactivate Workflow
```bash
# In N8N UI: Click workflow → Click "Deactivate"
# Or via API:
curl -X POST https://n8n.srv995290.hstgr.cloud/api/v1/workflows/<id>/deactivate \
  -H "X-N8N-API-KEY: <api-key>"
```

### Option 2: Delete Workflow
```bash
# In N8N UI: Click workflow → Click "Delete"
# Or via API:
curl -X DELETE https://n8n.srv995290.hstgr.cloud/api/v1/workflows/<id> \
  -H "X-N8N-API-KEY: <api-key>"
```

### Option 3: Revert Code Changes
```bash
git checkout main
# Or specific files:
git checkout main src/lib/n8n*.js
```

---

## Production Deployment

### Before Going Live

1. **Test End-to-End Flow:**
   - Complete onboarding
   - Deploy workflow
   - Send test email
   - Verify automation triggers

2. **Monitor Initial Executions:**
   - Check N8N execution logs
   - Monitor Supabase `email_logs` table
   - Watch for errors in browser console

3. **Set Up Monitoring:**
   - Configure alerts for workflow failures
   - Set up health check monitoring
   - Enable N8N execution logging

### Production Environment Variables

Update for production:
```env
# Production N8N
VITE_N8N_BASE_URL=https://n8n.yourdomain.com
VITE_N8N_API_KEY=<production-api-key>

# Production OAuth
VITE_OUTLOOK_CLIENT_ID=<production-client-id>
VITE_OUTLOOK_CLIENT_SECRET=<production-client-secret>
```

---

## Monitoring & Maintenance

### Daily Checks

- [ ] N8N workflow execution count
- [ ] Error rate in executions
- [ ] Credential token expiration

### Weekly Checks

- [ ] Run sanity tests: `node test-n8n-api-endpoints.js`
- [ ] Review N8N audit: POST `/api/v1/audit`
- [ ] Check integration health: `node check-user-integrations.js`

### Monthly Checks

- [ ] Update N8N instance
- [ ] Rotate API keys if needed
- [ ] Review and optimize workflows

---

## Emergency Contacts

### N8N Issues
- **N8N Documentation**: https://docs.n8n.io
- **N8N Community**: https://community.n8n.io
- **N8N GitHub**: https://github.com/n8n-io/n8n

### Internal Tools
- **Health Checker**: `src/lib/n8nHealthChecker.js`
- **Debugger**: `src/lib/n8nDebugger.js`
- **API Wrapper**: `src/lib/n8nApiWrapper.js`

---

## Sign-Off

**Developer:** AI Assistant  
**Reviewer:** [Your Name]  
**Date:** 2025-10-07  
**Status:** ✅ **VERIFIED AND READY FOR DEPLOYMENT**

**All systems go! 🚀**

---

**Last Updated:** 2025-10-07  
**Next Review:** After first production deployment

