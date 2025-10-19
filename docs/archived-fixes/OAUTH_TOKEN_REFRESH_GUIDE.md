# OAuth Token Refresh Fix Guide

**Last Updated:** 2024-10-08

## 📋 Overview

This guide addresses the critical issue where users are forced to re-authorize their Microsoft Outlook connection every time they log back into Floworx, instead of maintaining a persistent "silent reauthorization" flow using refresh tokens.

---

## 🔍 The Problem

### Symptoms
- Users log out and log back in → prompted to authorize Outlook again
- Workflows fail with `"Unable to sign without access token"` or `"401 Unauthorized"`
- Token refresh not happening automatically
- Inconsistent behavior across different users

### Root Causes Identified

| Issue | Impact | Severity |
|-------|--------|----------|
| **Missing `offline_access` scope** | No refresh token issued by Microsoft | 🔴 Critical |
| **Tokens stored in Supabase instead of n8n** | Token desync between systems | 🟡 High |
| **n8n credentials missing `refreshToken`** | Auto-refresh fails silently | 🔴 Critical |
| **Token refresh disabled in n8n config** | Manual refresh required | 🟠 Medium |
| **Refresh tokens expired (90 days inactive)** | Requires re-authorization | 🟢 Low |

---

## 🏗️ Current Architecture (What's Happening)

```
┌─────────────┐         ┌──────────────┐         ┌───────────┐         ┌────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│ Supabase  │◀───────▶│    n8n     │
│  (React)    │         │ (Node/Exp)   │         │  (Tokens) │         │ (Workflows)│
└─────────────┘         └──────────────┘         └───────────┘         └────────────┘
       │                        │                       │                      │
       │                        │                       │                      │
       │                        └───────────────────────┴──────────────────────┘
       │                                      Problem: Token duplication
       │                                      and desynchronization
       │
       └────────────────────▶ Microsoft OAuth
                             (grants tokens)
```

### The Issue
1. Backend exchanges OAuth code for tokens
2. Tokens saved in **both** Supabase AND n8n
3. When tokens refresh in n8n, Supabase copy becomes stale
4. When user logs back in, app checks Supabase → sees stale token → forces re-auth

---

## ✅ Target Architecture (What We Want)

```
┌─────────────┐         ┌──────────────┐         ┌───────────┐         ┌────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│ Supabase  │         │    n8n     │
│  (React)    │         │ (Node/Exp)   │         │ (Metadata)│         │ (Tokens)   │
└─────────────┘         └──────────────┘         └───────────┘         └────────────┘
       │                        │                       │                      │
       │                        │                       │                      │
       │                        └───────────────────────┴──────────────────────┘
       │                                 ✓ n8n is single source of truth
       │                                 ✓ Supabase stores only credential_id
       │
       └────────────────────▶ Microsoft OAuth
                             (with offline_access scope)
```

### The Solution
1. **Supabase stores:** `user_id`, `provider`, `n8n_credential_id`, `status`
2. **n8n stores:** `accessToken`, `refreshToken`, `expiresIn`
3. **Backend verifies:** Check n8n credential on login → no re-auth needed
4. **n8n auto-refreshes:** Tokens automatically when expired

---

## 🛠️ Implementation Steps

### Step 1: Run Diagnostic

First, identify which users/integrations are affected:

```bash
# Check current state
node diagnose-oauth-token-refresh.js
```

This will generate a report showing:
- ✅ Healthy integrations
- ⚠️ Integrations with warnings
- 🚨 Critical issues requiring re-authorization

**Example Output:**
```
📊 Total Integrations: 15
✅ OK: 5
⚠️  Warnings: 3
❌ Critical: 7

🔍 Common Issues:
   [7x] Missing refresh token in n8n credential
   [3x] Token desync: Supabase and n8n have different access tokens
```

---

### Step 2: Apply Automated Fixes

Run the fix script (dry-run first):

```bash
# Preview changes
node fix-oauth-token-flow.js --dry-run

# Apply fixes
node fix-oauth-token-flow.js
```

This script will:
1. ✅ Remove `access_token` and `refresh_token` columns from Supabase
2. ✅ Mark integrations without refresh tokens as `reauth_required`
3. ✅ Clean up orphaned credentials
4. ✅ Generate SQL migration file

---

### Step 3: Update OAuth Flow

#### Backend: Token Exchange Endpoint

**Current (Broken):**
```javascript
// ❌ Problem: Missing offline_access, storing tokens in wrong place
const tokenRes = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
  grant_type: 'authorization_code',
  code,
  scope: 'Mail.ReadWrite Mail.Send', // Missing offline_access!
});

await supabase.from('integrations').insert({
  user_id,
  provider: 'outlook',
  access_token: tokenRes.data.access_token, // ❌ Storing in Supabase
  refresh_token: tokenRes.data.refresh_token, // ❌ Storing in Supabase
});
```

**Fixed:**
```javascript
// ✅ Solution: Include offline_access, store only in n8n
const tokenRes = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
  grant_type: 'authorization_code',
  code,
  scope: 'openid profile email offline_access Mail.ReadWrite Mail.Send MailboxSettings.ReadWrite',
  // ✅ offline_access ensures refresh_token is issued
});

// ✅ Store tokens in n8n
const credential = await n8nClient.post('/credentials', {
  name: `Outlook - ${userEmail}`,
  type: 'microsoftOutlookOAuth2Api',
  data: {
    accessToken: tokenRes.data.access_token,
    refreshToken: tokenRes.data.refresh_token, // ✅ Critical!
    expiresIn: tokenRes.data.expires_in,
  },
});

// ✅ Store only reference in Supabase
await supabase.from('integrations').insert({
  user_id,
  provider: 'outlook',
  n8n_credential_id: credential.data.id, // ✅ Only store ID
  status: 'active',
  // ✅ No token columns
});
```

---

#### Frontend: Login Check

**Current (Broken):**
```javascript
// ❌ Checking Supabase token directly
const { data } = await supabase
  .from('integrations')
  .select('access_token')
  .eq('user_id', userId)
  .single();

if (!data?.access_token) {
  redirectToOAuth(); // ❌ False positive if token only in n8n
}
```

**Fixed:**
```javascript
// ✅ Check integration status instead
const { data } = await supabase
  .from('integrations')
  .select('status, n8n_credential_id')
  .eq('user_id', userId)
  .eq('provider', 'outlook')
  .single();

if (!data || data.status !== 'active') {
  redirectToOAuth(); // ✅ Only prompt if truly disconnected
} else {
  // ✅ Verify n8n credential exists (optional backend call)
  const isValid = await backendAPI.verifyIntegration(data.n8n_credential_id);
  if (!isValid) {
    redirectToOAuth();
  }
}
```

---

### Step 4: Update Database Schema

Apply the generated migration:

```bash
# Apply migration (removes token columns)
psql $DATABASE_URL -f remove-integration-tokens-[timestamp].sql
```

Or manually:

```sql
-- Remove token storage from integrations
BEGIN;

-- Backup (optional)
CREATE TABLE integrations_token_backup AS 
SELECT id, user_id, access_token, refresh_token 
FROM integrations
WHERE access_token IS NOT NULL;

-- Remove columns
ALTER TABLE integrations 
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token;

-- Update status for users needing reauth
UPDATE integrations
SET status = 'reauth_required'
WHERE status = 'active'
  AND n8n_credential_id IS NULL;

COMMIT;
```

---

### Step 5: Configure n8n

Ensure token refresh is enabled in your n8n deployment:

**.env or docker-compose.yml:**
```bash
N8N_REFRESH_TOKENS_ENABLED=true
```

Restart n8n:
```bash
docker-compose restart n8n
# or
pm2 restart n8n
```

---

### Step 6: Force Re-Authorization for Affected Users

For users marked as `reauth_required`:

**Backend API Endpoint:**
```javascript
app.get('/api/integrations/status', async (req, res) => {
  const { data } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', req.user.id);
  
  const needsReauth = data.filter(i => 
    i.status === 'reauth_required' || 
    i.status === 'disconnected'
  );
  
  res.json({ 
    integrations: data,
    needsReauth: needsReauth.map(i => i.provider),
  });
});
```

**Frontend Dashboard:**
```javascript
useEffect(() => {
  const checkIntegrations = async () => {
    const { needsReauth } = await api.get('/api/integrations/status');
    
    if (needsReauth.includes('outlook')) {
      setShowReconnectBanner(true);
    }
  };
  
  checkIntegrations();
}, []);

// Show banner
{showReconnectBanner && (
  <Banner type="warning">
    Your Outlook connection needs to be reauthorized.
    <Button onClick={() => window.location.href = getOAuthURL()}>
      Reconnect Outlook
    </Button>
  </Banner>
)}
```

---

## 🧪 Testing the Fix

### Test Case 1: Fresh OAuth Connection

```bash
# 1. User initiates Outlook connection
# 2. Verify refresh token stored in n8n:
curl -X GET "https://your-n8n.com/api/v1/credentials/{id}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY"

# Expected response should include:
{
  "data": {
    "refreshToken": "...", // ✅ Must be present
    "accessToken": "..."
  }
}

# 3. Verify Supabase only has reference:
SELECT user_id, provider, n8n_credential_id, status 
FROM integrations 
WHERE user_id = 'test-user-id';

# Expected: No access_token or refresh_token columns
```

### Test Case 2: Silent Re-Login

```bash
# 1. User logs out
# 2. User logs back in
# 3. Dashboard loads without OAuth prompt
# 4. Workflows execute successfully
```

### Test Case 3: Token Refresh

```bash
# 1. Manually expire access token in n8n
# 2. Trigger workflow that uses Outlook
# 3. Verify n8n auto-refreshes token
# 4. Workflow completes successfully
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Re-authorization Rate**: % of logins requiring OAuth prompt
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'reauth_required') * 100.0 / COUNT(*) as reauth_rate
   FROM integrations;
   ```

2. **Token Refresh Success Rate**: Check n8n logs
   ```bash
   docker logs n8n | grep "Token refresh"
   ```

3. **Workflow Failure Rate**: Monitor for auth errors
   ```sql
   SELECT COUNT(*) 
   FROM workflow_executions 
   WHERE status = 'error' 
     AND error_message LIKE '%401%'
     AND created_at > NOW() - INTERVAL '24 hours';
   ```

---

## 🚨 Troubleshooting

### Issue: Users still prompted to re-auth after fix

**Diagnosis:**
```bash
# Check if n8n credential has refresh token
node diagnose-oauth-token-refresh.js

# Check specific user
SELECT * FROM integrations WHERE user_id = 'problematic-user-id';
```

**Solutions:**
1. Verify `offline_access` in OAuth scope
2. Check n8n credential data structure
3. Ensure user hasn't changed password (invalidates tokens)

---

### Issue: Token refresh failing in n8n

**Diagnosis:**
```bash
# Check n8n logs
docker logs n8n --tail 100 | grep -i "refresh"

# Verify n8n config
docker exec n8n env | grep REFRESH
```

**Solutions:**
1. Enable `N8N_REFRESH_TOKENS_ENABLED=true`
2. Verify Microsoft app credentials are correct
3. Check if refresh token has expired (>90 days inactive)

---

### Issue: Token desync between Supabase and n8n

**Diagnosis:**
```bash
# Run diagnostic to find desynced tokens
node diagnose-oauth-token-refresh.js
```

**Solution:**
```bash
# Remove tokens from Supabase
node fix-oauth-token-flow.js
```

---

## 📝 Checklist

Before deploying:

- [ ] Run diagnostic script on production data
- [ ] Backup current integrations table
- [ ] Update OAuth flow to include `offline_access`
- [ ] Remove token storage from Supabase schema
- [ ] Configure n8n with `N8N_REFRESH_TOKENS_ENABLED=true`
- [ ] Deploy updated backend code
- [ ] Deploy updated frontend code
- [ ] Force re-auth for affected users
- [ ] Monitor re-authorization rates
- [ ] Test with multiple user accounts

After deploying:

- [ ] Verify no 401 errors in workflow logs
- [ ] Confirm users can log out/in without re-auth
- [ ] Check token refresh is happening automatically
- [ ] Monitor for any new issues

---

## 🔗 Related Files

- `diagnose-oauth-token-refresh.js` - Diagnostic tool
- `fix-oauth-token-flow.js` - Automated fix script
- `backend/routes/oauth.js` - OAuth flow implementation
- `src/components/IntegrationStatus.jsx` - Frontend integration UI

---

## 📚 References

- [Microsoft OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [n8n Credentials Documentation](https://docs.n8n.io/credentials/)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)

---

## 💡 Key Takeaways

1. ✅ **n8n is the single source of truth** for OAuth tokens
2. ✅ **Supabase stores only metadata** (user_id, provider, credential_id)
3. ✅ **offline_access scope is mandatory** for refresh tokens
4. ✅ **Monitor token refresh** to catch issues early
5. ✅ **Gracefully handle expired tokens** with user-friendly prompts

---

*For questions or issues, refer to the diagnostic script output or check the generated JSON reports.*


