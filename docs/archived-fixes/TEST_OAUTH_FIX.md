# Testing OAuth Token Refresh Fix

**Date:** October 8, 2024  
**Status:** Ready to test

---

## 🧪 Pre-Test Checklist

Before testing, ensure:

- [ ] Database migration run (`fix-oauth-database-schema.sql`)
- [ ] Backend restarted (to load new code)
- [ ] Frontend refreshed (hard refresh: Ctrl+Shift+R)
- [ ] Browser console open (to see logs)

---

## Test 1: Fresh Outlook Connection (First Time)

### Steps

1. **Start fresh**: If you have an existing Outlook connection, disconnect it first
   ```sql
   DELETE FROM integrations WHERE provider = 'outlook';
   ```

2. **Connect Outlook**:
   - Navigate to onboarding Step 2 or Dashboard
   - Click "Connect Outlook"
   - Microsoft consent screen should appear

3. **Grant consent**:
   - **Important**: You'll see additional permissions because of `offline_access`
   - Click "Accept" to grant all permissions

4. **Check browser console logs** - Should see:

   ```
   🔄 Starting token exchange for provider: outlook
   ✅ Token exchange successful: {
     hasAccessToken: true,
     hasRefreshToken: true,      // ✅ THIS MUST BE TRUE!
     expiresIn: 3599,
     scope: "offline_access Mail.ReadWrite..."
   }
   
   Creating n8n credential for Outlook...
   ✅ n8n credential created: { credentialId: "ABC123..." }
   
   💾 Attempting to save integration to database...
      n8n Credential ID: ABC123...      // ✅ This is the key!
   
   ✅ Database save successful!
   ```

5. **Check backend logs** - Should see:

   ```
   Microsoft token exchange successful: {
     hasAccessToken: true,
     hasRefreshToken: true,        // ✅ CRITICAL!
     tokenType: 'Bearer',
     expiresIn: 3599,
     scope: 'offline_access Mail.Read...'
   }
   
   Creating n8n credential for Outlook...
   ✅ n8n credential created successfully { credentialId: 'ABC123...', hasRefreshToken: true }
   
   OAuth token exchange completed successfully { cacheKey: 'outlook_...', hasRefreshToken: true, n8nCredentialId: 'ABC123...' }
   ```

6. **Verify in Supabase**:
   ```sql
   SELECT 
     user_id, 
     provider, 
     status, 
     n8n_credential_id,
     created_at 
   FROM integrations 
   WHERE provider = 'outlook';
   ```

   **Expected:**
   - `status`: `active`
   - `n8n_credential_id`: `ABC123...` (populated!)
   - Should NOT have `access_token` or `refresh_token` columns

7. **Verify in n8n**:
   ```bash
   curl -X GET "https://n8n.srv995290.hstgr.cloud/api/v1/credentials/ABC123" \
     -H "X-N8N-API-KEY: your_key"
   ```

   **Expected response:**
   ```json
   {
     "data": {
       "id": "ABC123...",
       "type": "microsoftOutlookOAuth2Api",
       "data": {
         "oauthTokenData": {
           "access_token": "...",
           "refresh_token": "...",     // ✅ Must be present!
           "expires_in": 3599
         }
       }
     }
   }
   ```

### ✅ Success Criteria

- [x] `hasRefreshToken: true` in logs
- [x] `n8n_credential_id` populated in Supabase
- [x] n8n credential exists with `refreshToken`
- [x] No errors in console or backend logs

---

## Test 2: Silent Re-Login (The Real Test!)

### Steps

1. **Log out**:
   - Click logout in your app
   - Wait for redirect to login page

2. **Log back in**:
   - Enter credentials
   - Click login

3. **Dashboard loads**:
   - Dashboard should load normally
   - **NO OAuth consent prompt should appear** ✅

4. **Check console logs** - Should see:

   ```
   🔐 Auth state change: { event: 'SIGNED_IN', hasSession: true }
   
   // NO OAuth-related logs here!
   // Dashboard just loads normally
   ```

5. **Verify workflows**:
   - Try to activate a workflow
   - Should succeed without auth errors

### ✅ Success Criteria

- [x] NO OAuth prompt on re-login
- [x] Dashboard loads immediately
- [x] Workflows can be activated
- [x] No 401 or auth errors

---

## Test 3: Token Auto-Refresh

### Setup

This test verifies that n8n automatically refreshes the token when it expires.

### Option A: Wait for Natural Expiration

1. Connect Outlook (Test 1)
2. Wait 1 hour (token expires)
3. Trigger a workflow that uses Outlook
4. Should complete successfully (n8n refreshes automatically)

### Option B: Force Expiration (Faster)

1. Connect Outlook (Test 1)
2. In n8n, manually edit the credential:
   ```json
   {
     "oauthTokenData": {
       "access_token": "...",
       "refresh_token": "...",
       "expires_in": -1  // ✅ Set to negative to force expiration
     }
   }
   ```
3. Trigger a workflow that uses Outlook
4. Check n8n logs - should see token refresh
5. Workflow should complete successfully

### ✅ Success Criteria

- [x] Workflow completes despite expired token
- [x] n8n logs show token refresh
- [x] New `access_token` issued
- [x] No manual re-authorization needed

---

## Test 4: Diagnostic Verification

Run the diagnostic script to confirm everything is healthy:

```bash
node diagnose-oauth-token-refresh.cjs
```

### Expected Output

```
📊 Total Integrations: 1 (after Test 1)
✅ OK: 1
⚠️  Warnings: 0
❌ Critical: 0

Integration Details:
  User: your-user-id
  Provider: outlook
  Status: active
  Has n8n credential: ✅ true
  Has access token: ✅ true
  Has refresh token: ✅ true    // ✅ KEY!
  Token expired: false
  Severity: OK

✅ All integrations healthy!
```

---

## 🚨 Troubleshooting

### Problem: `hasRefreshToken: false` Still Showing

**Cause:** Outlook was connected before the fix was applied.

**Solution:**
1. Disconnect Outlook:
   ```sql
   DELETE FROM integrations WHERE provider = 'outlook';
   ```
2. In Microsoft Azure, revoke the app consent
3. Connect Outlook again (fresh consent)
4. Should now get `refreshToken`

---

### Problem: n8n Credential Creation Fails

**Symptoms:**
```
Failed to create n8n credential: Request failed with status code 401
```

**Cause:** N8N_API_KEY not set or incorrect.

**Solution:**
1. Check `.env` has `N8N_API_KEY`
2. Verify the key is correct:
   ```bash
   curl -X GET "https://n8n.srv995290.hstgr.cloud/api/v1/credentials" \
     -H "X-N8N-API-KEY: $N8N_API_KEY"
   ```
3. If 401, regenerate the API key in n8n settings

---

### Problem: Still See OAuth Prompt on Re-Login

**Cause:** Integration status not `active` or `n8n_credential_id` is null.

**Diagnosis:**
```sql
SELECT * FROM integrations WHERE provider = 'outlook';
```

**Solution:**
1. If `n8n_credential_id` is null, reconnect Outlook
2. If status is not `active`, update:
   ```sql
   UPDATE integrations 
   SET status = 'active' 
   WHERE provider = 'outlook' 
     AND n8n_credential_id IS NOT NULL;
   ```

---

### Problem: 403 Error on Supabase Insert

**Symptoms:**
```
❌ Integration storage failed: PGRST301
```

**Cause:** RLS policies not applied correctly.

**Solution:**
Run the database migration again:
```sql
-- Re-run PART 2 of fix-oauth-database-schema.sql
```

---

## 📊 Test Results Template

Copy this and fill it out as you test:

```
## Test Results - [Date/Time]

### Test 1: Fresh Connection
- [ ] hasRefreshToken: true in logs
- [ ] n8n_credential_id populated
- [ ] n8n credential verified
- [ ] No errors

Logs: [paste relevant logs here]
Issues: [any problems encountered]

### Test 2: Silent Re-Login
- [ ] No OAuth prompt
- [ ] Dashboard loaded immediately
- [ ] Workflows activated successfully

Logs: [paste relevant logs here]
Issues: [any problems encountered]

### Test 3: Token Auto-Refresh
- [ ] Token refreshed automatically
- [ ] Workflow succeeded
- [ ] No manual re-auth

Logs: [paste relevant logs here]
Issues: [any problems encountered]

### Test 4: Diagnostic
- [ ] 0 critical issues
- [ ] hasRefreshToken: true

Output: [paste diagnostic output]

### Overall Status
✅ All tests passed
❌ Some tests failed (details above)
```

---

## 🎯 Success Criteria Summary

After all tests pass, you should have:

✅ **Microsoft OAuth includes `offline_access` scope**  
✅ **Tokens stored in n8n (with refresh token)**  
✅ **Supabase stores only `n8n_credential_id`**  
✅ **Re-login is silent (no OAuth prompt)**  
✅ **Workflows activate successfully**  
✅ **Token auto-refresh working**  
✅ **Diagnostic shows 0 critical issues**  

---

## 📞 If All Tests Pass

Congratulations! 🎉 Your OAuth token refresh flow is now working correctly:

- Users will NOT be prompted to re-authorize on every login
- Tokens will auto-refresh automatically
- Workflows will never fail with "Unable to sign without access token"
- The architecture is clean and maintainable

**Next:** Apply the same fix to Gmail (if needed) or mark the task complete!

---

## 📞 If Tests Fail

1. Review the troubleshooting section above
2. Check `COMPLETE_OAUTH_FIX.md` for detailed implementation
3. Verify all code changes were applied correctly
4. Check environment variables are set
5. Review backend and frontend logs for specific errors

**Need help?** All diagnostic tools are in place:
- `diagnose-oauth-token-refresh.cjs`
- `verify-oauth-flow.cjs`
- `view-integrations.cjs`

Run these to get detailed insights into what's wrong.


