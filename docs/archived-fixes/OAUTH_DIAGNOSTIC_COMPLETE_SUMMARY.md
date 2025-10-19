# OAuth Token Refresh - Complete Diagnostic Summary

**Date:** October 8, 2024  
**Status:** ✅ Analysis Complete - Action Required

---

## 🔍 What We Found

### Your Current State

**3 integrations in database:**
- ✅ 1 Outlook (active, **HAS** n8n_credential_id: `5VP4LhkcLI5W6EAn`)
- ❌ 2 Gmail (1 active, 1 inactive, **MISSING** n8n_credential_id)

### Critical Issues

| Issue | Severity | Impact | Affected Users |
|-------|----------|--------|----------------|
| **OAuth flow incomplete** | 🔴 CRITICAL | 2/3 integrations missing n8n credentials | 2 users |
| **Tokens stored in wrong place** | 🔴 CRITICAL | Will cause desync and re-auth loops | All future users |
| **No refresh token verification** | 🟡 HIGH | Can't confirm auto-refresh will work | 1 user (Outlook) |

---

## 📊 Diagnostic Results

```
📊 Total Integrations: 3
✅ OK: 0
⚠️  Warnings: 0
❌ Critical: 3

🔍 Common Issues:
   [2x] Missing n8n_credential_id in Supabase
   [1x] n8n credential error: Request failed with status code 405

Affected Users:
   • fedf818f-986f-4b30-bfa1-7fc339c7bb60 (Outlook + Gmail)
   • 867894f7-bc68-4f27-8f93-b8f14d55304b (Gmail)
```

**Reports Generated:**
- `oauth-token-diagnostic-1759899727960.json` - First diagnostic run
- `oauth-token-diagnostic-1759899757857.json` - Second diagnostic run with n8n
- `view-integrations.cjs` - Quick integration viewer

---

## 🎯 Root Cause Analysis

### The Problem

Your OAuth flow in `src/contexts/SupabaseAuthContext.jsx` (lines 204-282) is:

```javascript
// ❌ BROKEN FLOW
const integrationData = {
  access_token: accessToken,      // ❌ Storing in Supabase
  refresh_token: refreshToken,    // ❌ Storing in Supabase
  // Missing: n8n_credential_id
};

await supabase.from("integrations").upsert(integrationData);
// ❌ Never creates n8n credential!
```

**Why this breaks:**
1. Tokens saved to Supabase but NOT to n8n
2. When user logs back in, app checks Supabase
3. No n8n credential exists → workflows fail
4. Or n8n credential exists but Supabase token is stale → re-auth required

### The Outlook Mystery

Why does Outlook have an n8n_credential_id but Gmail doesn't?

**Possible explanations:**
1. You manually created the Outlook credential in n8n
2. You have different OAuth handling for Outlook vs Gmail
3. Earlier version of code created n8n credentials (now removed)
4. The n8n credential was created by a workflow, not the frontend

**We can't verify the Outlook credential because:**
- n8n API returned 405 (Method Not Allowed)
- This suggests authentication or endpoint issue
- But the credential ID exists in Supabase, which is good

---

## 🔧 What Needs to Be Fixed

### 1. **Update OAuth Flow Code** ⏰ 30 minutes

**File:** `src/contexts/SupabaseAuthContext.jsx`  
**Lines:** 204-282  
**Change:** Replace with code from `OAUTH_FIX_CODE.md`

**Key changes:**
```javascript
// ✅ FIXED FLOW
// 1. Create n8n credential FIRST
const credential = await createN8nCredential(accessToken, refreshToken);

// 2. Save only credential reference to Supabase
const integrationData = {
  n8n_credential_id: credential.id,  // ✅ Only the ID
  // ❌ NO tokens stored here
};

await supabase.from("integrations").upsert(integrationData);
```

### 2. **Add Environment Variables** ⏰ 2 minutes

Add to `.env`:
```bash
VITE_N8N_API_URL=https://n8n.srv995290.hstgr.cloud/api/v1
VITE_N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. **Update Database Schema** ⏰ 5 minutes

```sql
-- Remove token columns
ALTER TABLE integrations 
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token;

-- Ensure n8n_credential_id exists
ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS n8n_credential_id TEXT;
```

### 4. **Mark Broken Integrations** ⏰ 5 minutes

```bash
# Preview changes
node fix-oauth-token-flow.cjs --dry-run

# Apply fixes
node fix-oauth-token-flow.cjs
```

This will:
- Update 2 Gmail integrations to `status='reauth_required'`
- Prompt users to reconnect on next login

### 5. **Notify Affected Users** ⏰ 10 minutes

**2 users need to reconnect:**

1. **User:** `fedf818f-986f-4b30-bfa1-7fc339c7bb60`
   - Provider: Gmail
   - Status: Currently inactive

2. **User:** `867894f7-bc68-4f27-8f93-b8f14d55304b`
   - Provider: Gmail
   - Status: Currently active (but will fail)

**Notification message:**
```
Subject: Action Required: Reconnect Your Gmail Account

Hi,

We've upgraded our email integration system for better reliability. 
Please reconnect your Gmail account to continue using Floworx:

1. Log into Floworx
2. Go to Settings → Integrations
3. Click "Reconnect Gmail"

This is a one-time update. After reconnecting, you won't need 
to re-authorize again.

Thanks!
```

---

## 📋 Step-by-Step Implementation

### Phase 1: Preparation (10 minutes)

1. **Backup your database**
   ```bash
   # Or use Supabase dashboard to create backup
   ```

2. **Review the fix code**
   - Read `OAUTH_FIX_CODE.md`
   - Understand the changes
   - Test locally first

3. **Set up monitoring**
   - Browser console open
   - n8n logs accessible
   - Supabase logs visible

### Phase 2: Code Changes (30 minutes)

1. **Update SupabaseAuthContext.jsx**
   ```bash
   # Open file
   code src/contexts/SupabaseAuthContext.jsx
   
   # Replace lines 204-282 with code from OAUTH_FIX_CODE.md
   ```

2. **Add environment variables**
   ```bash
   # Edit .env
   echo "VITE_N8N_API_URL=https://n8n.srv995290.hstgr.cloud/api/v1" >> .env
   echo "VITE_N8N_API_KEY=your_key_here" >> .env
   ```

3. **Test locally**
   ```bash
   npm run dev
   
   # Try connecting a test Gmail account
   # Check browser console for:
   # ✅ n8n credential created
   # ✅ Integration stored successfully
   ```

### Phase 3: Database Migration (5 minutes)

1. **Remove token columns**
   ```sql
   -- Run in Supabase SQL Editor
   BEGIN;
   
   -- Backup
   CREATE TABLE integrations_token_backup AS 
   SELECT * FROM integrations;
   
   -- Remove columns
   ALTER TABLE integrations 
     DROP COLUMN IF EXISTS access_token,
     DROP COLUMN IF EXISTS refresh_token;
   
   COMMIT;
   ```

2. **Verify schema**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'integrations';
   
   -- Should NOT see access_token or refresh_token
   ```

### Phase 4: Mark Broken Integrations (5 minutes)

1. **Run fix script**
   ```bash
   node fix-oauth-token-flow.cjs --dry-run  # Preview
   node fix-oauth-token-flow.cjs            # Apply
   ```

2. **Verify status updates**
   ```bash
   node view-integrations.cjs
   
   # Gmail integrations should show status: 'reauth_required'
   ```

### Phase 5: Deploy & Test (20 minutes)

1. **Deploy to production**
   ```bash
   # Your deployment process here
   git add .
   git commit -m "fix: OAuth token flow - store credentials in n8n"
   git push
   ```

2. **Test with affected users**
   - Contact 2 affected users
   - Ask them to reconnect Gmail
   - Verify successful connection
   - Test logout/login cycle

3. **Monitor for issues**
   - Check for errors in browser console
   - Monitor n8n logs for credential creation
   - Watch Supabase for new integrations

### Phase 6: Verification (10 minutes)

1. **Run verification script**
   ```bash
   node verify-oauth-flow.cjs
   
   # Should show:
   # ✅ All checks passed
   # ✅ Token columns removed
   # ✅ n8n credentials have refresh tokens
   ```

2. **Check integration health**
   ```bash
   node diagnose-oauth-token-refresh.cjs
   
   # After fixes, should show:
   # ✅ OK: 3 (or 1 until users reconnect)
   # ❌ Critical: 0 (or 2 pending user reconnection)
   ```

---

## ✅ Success Criteria

After completing all steps, you should see:

### Immediate (Same Day)
- [ ] Code changes deployed
- [ ] Database schema updated (no token columns)
- [ ] Broken integrations marked for reauth
- [ ] Test user can connect Gmail successfully
- [ ] Test user can logout/login without re-auth

### Short Term (1 Week)
- [ ] All affected users reconnected
- [ ] No OAuth-related errors in logs
- [ ] Diagnostic shows 0 critical issues
- [ ] Token refresh happening automatically

### Long Term (1 Month)
- [ ] 99%+ uptime for OAuth integrations
- [ ] Zero re-auth prompts for returning users
- [ ] No token desync issues
- [ ] Workflows running seamlessly

---

## 📈 Expected Improvements

### Before Fix
```
📊 Integration Health
✅ OK: 0% (0/3)
❌ Critical: 100% (3/3)

User Experience:
- Users need to re-auth on every login
- Workflows fail with auth errors
- Support tickets for "keeps logging out"
```

### After Fix
```
📊 Integration Health
✅ OK: 100% (3/3)
❌ Critical: 0% (0/3)

User Experience:
- Users stay logged in ✅
- Workflows run seamlessly ✅
- Zero OAuth-related tickets ✅
```

---

## 🚨 Rollback Plan

If something goes wrong:

### Immediate Rollback (Code)
```bash
git revert HEAD
git push
```

### Database Rollback
```sql
-- Restore token columns
ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Restore data from backup
UPDATE integrations i
SET 
  access_token = b.access_token,
  refresh_token = b.refresh_token
FROM integrations_token_backup b
WHERE i.id = b.id;
```

### Reset Integration Status
```sql
UPDATE integrations 
SET status = 'active'
WHERE status = 'reauth_required';
```

---

## 📞 Support Resources

### Documentation
- `OAUTH_TOKEN_REFRESH_GUIDE.md` - Complete technical guide
- `OAUTH_QUICK_START.md` - Quick reference
- `OAUTH_FIX_CODE.md` - Exact code changes needed
- `README_OAUTH_TOOLS.md` - Tool documentation

### Tools Created
- `diagnose-oauth-token-refresh.cjs` - Diagnostic tool
- `fix-oauth-token-flow.cjs` - Automated fix script
- `verify-oauth-flow.cjs` - Verification tool
- `view-integrations.cjs` - Quick data viewer

### Troubleshooting
If you encounter issues:
1. Check browser console for errors
2. Review n8n logs for credential creation failures
3. Run diagnostic script for detailed analysis
4. Refer to `OAUTH_TOKEN_REFRESH_GUIDE.md` troubleshooting section

---

## 🎯 Next Actions

**Right now:**
1. Read `OAUTH_FIX_CODE.md` carefully
2. Test the code changes locally
3. Back up your database

**This week:**
1. Deploy the fixes to production
2. Mark broken integrations for reauth
3. Notify affected users
4. Monitor for any issues

**This month:**
1. Run weekly diagnostic checks
2. Verify all users successfully reconnected
3. Monitor OAuth health metrics
4. Document any edge cases found

---

## 💡 Key Takeaways

1. **n8n is the single source of truth** for OAuth tokens
2. **Supabase stores only metadata** (user_id, provider, credential_id)
3. **offline_access scope is critical** for refresh tokens
4. **Monitor regularly** to catch issues early
5. **Test thoroughly** before deploying to production

---

**You now have a complete understanding of the problem and a clear path to fix it.** 🚀

Start with Phase 1 (Preparation) and work through each phase systematically. The tools and documentation are all ready to support you through the process.

Good luck! 🎉


