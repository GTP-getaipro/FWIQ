# OAuth Token Refresh - Quick Start

**Problem:** Users forced to re-authorize Outlook every login instead of automatic token refresh.

## 🚀 Quick Fix (5 Minutes)

### Step 1: Diagnose
```bash
node diagnose-oauth-token-refresh.js
```

**What it checks:**
- ✅ Which users have working refresh tokens
- ❌ Which users need re-authorization
- ⚠️ Token desync between Supabase and n8n

### Step 2: Preview Fix
```bash
node fix-oauth-token-flow.js --dry-run
```

### Step 3: Apply Fix
```bash
node fix-oauth-token-flow.js
```

**What it does:**
1. Removes raw tokens from Supabase (keeps only `n8n_credential_id`)
2. Marks broken integrations for re-auth
3. Cleans up orphaned credentials
4. Generates SQL migration

### Step 4: Verify
```bash
node verify-oauth-flow.js
```

## 🔧 Root Cause

Your OAuth flow has **two critical issues**:

### Issue 1: Missing `offline_access` Scope
```javascript
// ❌ WRONG
scope: 'Mail.ReadWrite Mail.Send'

// ✅ CORRECT
scope: 'offline_access Mail.ReadWrite Mail.Send MailboxSettings.ReadWrite'
```

Without `offline_access`, Microsoft doesn't issue a `refresh_token` → user must re-auth when token expires (~1 hour).

### Issue 2: Storing Tokens in Wrong Place
```javascript
// ❌ WRONG: Storing in Supabase
await supabase.from('integrations').insert({
  user_id,
  access_token: token.access_token,
  refresh_token: token.refresh_token, // Bad!
});

// ✅ CORRECT: Storing only in n8n
await n8nClient.post('/credentials', {
  type: 'microsoftOutlookOAuth2Api',
  data: {
    accessToken: token.access_token,
    refreshToken: token.refresh_token, // Good!
  }
});

await supabase.from('integrations').insert({
  user_id,
  n8n_credential_id: credential.id, // Only store reference
  status: 'active',
});
```

When tokens stored in both places, they get out of sync → n8n refreshes → Supabase has stale token → app breaks.

## 📝 Backend Code Fix

**File:** `backend/routes/oauth.js` (or similar)

**Find this:**
```javascript
const tokenRes = await axios.post(
  'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  {
    grant_type: 'authorization_code',
    code,
    // ... other params
  }
);
```

**Add `offline_access` to your OAuth URL:**
```javascript
const authURL = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `scope=offline_access%20Mail.ReadWrite%20Mail.Send%20MailboxSettings.ReadWrite`;
  //      ^^^^^^^^^^^^^^ ADD THIS!
```

**Update token storage:**
```javascript
// Store in n8n
const credential = await n8nClient.post('/credentials', {
  name: `Outlook - ${userEmail}`,
  type: 'microsoftOutlookOAuth2Api',
  data: {
    accessToken: tokenRes.data.access_token,
    refreshToken: tokenRes.data.refresh_token,
    expiresIn: tokenRes.data.expires_in,
  },
});

// Store reference in Supabase
await supabase.from('integrations').insert({
  user_id,
  provider: 'outlook',
  n8n_credential_id: credential.data.id,
  status: 'active',
  // DO NOT store access_token or refresh_token here
});
```

## 🧪 Test Your Fix

### Test 1: New User Connection
1. Connect Outlook
2. Check n8n credential has `refreshToken`:
   ```bash
   curl https://your-n8n.com/api/v1/credentials/{id} \
     -H "X-N8N-API-KEY: $N8N_API_KEY"
   ```
3. Should see: `"refreshToken": "..."`

### Test 2: Existing User Re-Login
1. Log out
2. Log back in
3. Should NOT see OAuth prompt
4. Workflows should work immediately

### Test 3: Token Refresh
1. Wait 1+ hours (or manually expire token in n8n)
2. Trigger Outlook workflow
3. Should auto-refresh and succeed

## 📊 Expected Results

**Before Fix:**
```
📊 Total Integrations: 15
✅ OK: 2
⚠️  Warnings: 5
❌ Critical: 8

Common Issues:
   [8x] Missing refresh token in n8n credential
   [5x] Token desync: Supabase and n8n different
```

**After Fix:**
```
📊 Total Integrations: 15
✅ OK: 15
⚠️  Warnings: 0
❌ Critical: 0

✨ All integrations healthy!
```

## 🚨 If Users Still Need Re-Auth

Some users may need to reconnect once (if their tokens are completely broken):

**Frontend:**
```javascript
const { data } = await supabase
  .from('integrations')
  .select('status')
  .eq('user_id', userId)
  .eq('provider', 'outlook')
  .single();

if (data?.status === 'reauth_required') {
  // Show reconnect banner
  <Banner>
    Your Outlook connection needs to be refreshed.
    <Button onClick={reconnectOutlook}>Reconnect</Button>
  </Banner>
}
```

## 🎯 Success Criteria

- [ ] Users log out/in without OAuth prompt
- [ ] Workflows run without auth errors
- [ ] Token refresh happens automatically
- [ ] No 401 errors in logs
- [ ] Diagnostic script shows 0 critical issues

## 📚 More Details

- **Full Guide:** `OAUTH_TOKEN_REFRESH_GUIDE.md`
- **Diagnostic Output:** `oauth-token-diagnostic-*.json`
- **Fix Results:** `oauth-fix-results-*.json`

## 💡 Key Principle

> **n8n is the single source of truth for OAuth tokens.**
> 
> Supabase should only know:
> - Which user has which integration
> - Which n8n credential to use
> - Integration status
>
> Supabase should NOT store raw tokens.

---

**Need help?** Run the diagnostic and check the generated reports for detailed recommendations.


