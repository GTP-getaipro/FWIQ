# 🔐 OAuth Token Flow Architecture

## Overview
Deep technical dive into how OAuth tokens flow through the FloworxV2 → Supabase → N8N → Microsoft stack.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   OAUTH TOKEN FLOW ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌────────┐ │
│  │ Frontend │ ───► │ Backend  │ ───► │ Supabase │ ◄──► │  N8N   │ │
│  │ (React)  │ ◄─── │ (Express)│ ◄─── │   (DB)   │      │(Creds) │ │
│  └──────────┘      └──────────┘      └──────────┘      └────────┘ │
│       │                  │                  │              │       │
│       │                  │                  │              │       │
│       ▼                  ▼                  ▼              ▼       │
│  User clicks      Exchanges code    Stores metadata   Stores      │
│  "Connect"        for tokens        (user_id, status) actual      │
│                                                        tokens      │
│       │                  │                  │              │       │
│       └──────────────────┴──────────────────┴──────────────┘       │
│                              │                                     │
│                              ▼                                     │
│                      Microsoft Graph API                           │
│                   (Uses tokens from N8N)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Token Lifecycle

### Phase 1: Initial OAuth Authorization

**User Action:** Clicks "Connect Outlook"

**Frontend (`SupabaseAuthContext.jsx`):**
```javascript
// 1. Build OAuth URL
const state = JSON.stringify({
  provider: 'outlook',
  userId: user.id,
  businessName,
  timestamp: Date.now()
});

const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?`
  + `client_id=${OUTLOOK_CLIENT_ID}`
  + `&redirect_uri=${REDIRECT_URI}`
  + `&response_type=code`
  + `&scope=${encodeURIComponent([
      'openid',
      'profile',
      'email',
      'offline_access',  // ← CRITICAL for refresh token
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/MailboxSettings.ReadWrite'
    ].join(' '))}`
  + `&state=${encodeURIComponent(state)}`
  + `&response_mode=query`
  + `&prompt=consent`        // Force fresh consent
  + `&access_type=offline`;  // Request offline access

// 2. Redirect user
window.location.href = oauthUrl;
```

**Microsoft:**
- User sees consent screen
- Grants permissions
- Redirects to: `http://localhost:5173/oauth-callback-n8n?code=AUTH_CODE&state=...`

---

### Phase 2: Token Exchange

**Frontend Callback Handler:**
```javascript
// Extract code and state from URL
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = JSON.parse(urlParams.get('state'));

// Call backend to exchange code for tokens
const response = await fetch('http://localhost:3001/api/oauth/exchange-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code,
    provider: state.provider,
    userId: state.userId,
    redirectUri: REDIRECT_URI
  })
});
```

**Backend (`backend/src/routes/oauth.js`):**
```javascript
// Exchange authorization code for tokens
const tokenResponse = await fetch(
  'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OUTLOOK_CLIENT_ID,
      client_secret: OUTLOOK_CLIENT_SECRET,
      code: authorizationCode,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  }
);

const tokens = await tokenResponse.json();
// tokens = {
//   access_token: "EwB...",
//   refresh_token: "M.C511...",  ← MUST BE PRESENT
//   expires_in: 3599,
//   token_type: "Bearer"
// }
```

**❌ COMMON FAILURE POINT:**
If `refresh_token` is missing here, **everything downstream breaks**.

**Why it might be missing:**
- `offline_access` not in original scope
- User denied "Maintain access" permission
- Token endpoint called with wrong parameters
- Microsoft returned error (check `tokenResponse.error`)

---

### Phase 3: Token Storage (Critical Design Decision)

**🎯 DESIGN CHOICE: Where to store tokens?**

#### ❌ Anti-Pattern: Store in Supabase Only
```javascript
// BAD - Tokens in Supabase, N8N doesn't know about them
await supabase.from('integrations').insert({
  user_id,
  provider: 'outlook',
  access_token: tokens.access_token,      // ← Wrong layer
  refresh_token: tokens.refresh_token,    // ← Wrong layer
  n8n_credential_id: null
});
```

**Problems:**
- N8N can't auto-refresh
- Tokens become stale
- No single source of truth

#### ✅ Recommended Pattern: N8N as Token Authority
```javascript
// 1. Create N8N credential (tokens stored here)
const n8nCredential = await fetch(`${N8N_API_URL}/api/v1/credentials`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${N8N_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: `Outlook - ${userEmail}`,
    type: 'microsoftOutlookOAuth2Api',
    data: {
      clientId: OUTLOOK_CLIENT_ID,
      clientSecret: OUTLOOK_CLIENT_SECRET,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,  // ← Stored in N8N
      expiresIn: tokens.expires_in,
      tokenType: 'Bearer'
    }
  })
});

const credentialId = (await n8nCredential.json()).id;

// 2. Store ONLY metadata in Supabase
await supabase.from('integrations').upsert({
  user_id,
  provider: 'outlook',
  n8n_credential_id: credentialId,  // ← Link to N8N
  status: 'active',
  // NO raw tokens here
  metadata: {
    email: userEmail,
    created_via: 'oauth_flow'
  }
});
```

**Benefits:**
- ✅ N8N handles token refresh automatically
- ✅ Single source of truth
- ✅ No token desync issues
- ✅ Works seamlessly on re-login

---

### Phase 4: User Re-Login (Silent Reauthorization)

**User Action:** Logs out, then logs back in

**Frontend Dashboard Load:**
```javascript
// 1. Get user integrations from Supabase
const { data: integrations } = await supabase
  .from('integrations')
  .select('provider, status, n8n_credential_id')
  .eq('user_id', user.id)
  .eq('status', 'active');

// 2. For each integration, verify N8N credential exists
for (const integration of integrations) {
  const credentialValid = await verifyN8NCredential(integration.n8n_credential_id);
  
  if (!credentialValid) {
    // Mark as requiring reconnection
    await markForReconnection(integration.id);
    showReconnectPrompt(integration.provider);
  }
}

// 3. If all valid, continue normally
// No OAuth prompt shown ✅
```

**Backend Verification:**
```javascript
async function verifyN8NCredential(credentialId) {
  try {
    const response = await fetch(
      `${N8N_API_URL}/api/v1/credentials/${credentialId}`,
      {
        headers: { 'Authorization': `Bearer ${N8N_API_KEY}` }
      }
    );

    if (!response.ok) return false;

    const credential = await response.json();
    
    // CRITICAL: Verify refresh token exists
    if (!credential.data?.refreshToken) {
      console.warn(`Credential ${credentialId} missing refresh token`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error verifying credential ${credentialId}:`, error);
    return false;
  }
}
```

---

### Phase 5: Automatic Token Refresh (N8N Handles)

**When Workflow Executes:**

N8N internal logic (automatic):
```javascript
// Before each Microsoft Graph API call
if (isTokenExpired(credential.data.expiresIn)) {
  const newTokens = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        client_id: credential.data.clientId,
        client_secret: credential.data.clientSecret,
        refresh_token: credential.data.refreshToken,  // ← From stored credential
        grant_type: 'refresh_token'
      })
    }
  );

  // Auto-update credential in N8N database
  credential.data.accessToken = newTokens.access_token;
  credential.data.expiresIn = newTokens.expires_in;
  
  // Microsoft MAY issue new refresh token (rotation)
  if (newTokens.refresh_token) {
    credential.data.refreshToken = newTokens.refresh_token;
  }

  await saveCredential(credential);
}

// Proceed with API call using fresh token
```

**✅ Result:** User experiences zero interruption

---

## 🚨 Failure Modes & Solutions

### Failure Mode 1: "Unable to sign without access token"

**Symptom:** N8N workflow fails with this error

**Root Cause:** N8N credential missing refresh token

**Diagnostic:**
```bash
npm run ops:diagnose
```

**Fix:**
```bash
npm run ops:auto-fix      # Automated fix
# OR
npm run ops:fix-tokens    # Manual fix with guidance
```

---

### Failure Mode 2: User asked to reconnect on every login

**Symptom:** OAuth prompt shows even though integration exists

**Root Cause:** Frontend not checking `integrations` table properly

**Diagnostic:**
```sql
-- Check integration status
SELECT user_id, provider, status, n8n_credential_id 
FROM integrations 
WHERE user_id = '<USER_ID>';
```

**Fix:**
```javascript
// Frontend should check status before prompting
const { data: integration } = await supabase
  .from('integrations')
  .select('status, n8n_credential_id')
  .eq('user_id', user.id)
  .eq('provider', 'outlook')
  .single();

if (integration?.status === 'active' && integration?.n8n_credential_id) {
  // Don't show OAuth prompt ✅
} else {
  // Show OAuth prompt
}
```

---

### Failure Mode 3: Token refresh fails after 90 days

**Symptom:** 401 errors with "invalid_grant"

**Root Cause:** Microsoft refresh token expired (90 days inactivity)

**Detection:**
```javascript
if (error.response?.data?.error === 'invalid_grant') {
  // Refresh token expired or revoked
  await markIntegrationExpired(userId, provider);
  showReconnectUI();
}
```

**Fix:**
- User must complete fresh OAuth flow
- No automated fix possible
- Graceful degradation with clear UI

---

### Failure Mode 4: Tokens stored in wrong place

**Symptom:** Token desync between Supabase and N8N

**Root Cause:** Storing tokens in both places

**Diagnostic:**
```bash
npm run ops:diagnose  # Shows desync warnings
```

**Fix:**
- Migrate to N8N-only token storage
- Supabase stores only `n8n_credential_id`
- Update backend token exchange logic

---

## 🎯 Best Practices

### 1. Token Storage Strategy

**DO:**
- ✅ Store tokens in N8N credentials
- ✅ Store `n8n_credential_id` in Supabase
- ✅ Let N8N handle refresh automatically
- ✅ Use Supabase for metadata only

**DON'T:**
- ❌ Store tokens in multiple places
- ❌ Store tokens in frontend localStorage
- ❌ Manually refresh tokens if N8N can do it
- ❌ Cache tokens without expiry checks

---

### 2. Scope Management

**Always Include:**
```javascript
const REQUIRED_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',  // ← CRITICAL - Enables refresh tokens
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/MailboxSettings.ReadWrite'
];
```

**Verify in Consent Screen:**
- "Maintain access to data you have given it access to" = `offline_access`

---

### 3. Token Validation

**Before Storing:**
```javascript
function validateTokenResponse(tokens) {
  const errors = [];

  if (!tokens.access_token) {
    errors.push('Missing access_token');
  }

  if (!tokens.refresh_token) {
    errors.push('Missing refresh_token - CRITICAL');
  }

  if (!tokens.expires_in) {
    errors.push('Missing expires_in');
  }

  if (tokens.error) {
    errors.push(`OAuth error: ${tokens.error} - ${tokens.error_description}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Usage
const tokens = await exchangeCodeForTokens(code);
const validation = validateTokenResponse(tokens);

if (!validation.valid) {
  throw new Error(`Invalid token response: ${validation.errors.join(', ')}`);
}
```

---

### 4. Error Handling

**Token Refresh Errors:**
```javascript
try {
  await executeWorkflow();
} catch (error) {
  if (error.status === 401) {
    if (error.code === 'InvalidAuthenticationToken') {
      // Token expired, N8N should auto-refresh
      // If this fails, refresh token is invalid
      await handleInvalidRefreshToken(userId, provider);
    }
  } else if (error.status === 403) {
    // Permission issue
    await handlePermissionDenied(userId, provider);
  }
}

async function handleInvalidRefreshToken(userId, provider) {
  // Mark integration as requiring reauth
  await supabase
    .from('integrations')
    .update({
      status: 'reconnect_required',
      metadata: {
        error: 'Refresh token invalid',
        requires_reauth: true,
        timestamp: new Date().toISOString()
      }
    })
    .eq('user_id', userId)
    .eq('provider', provider);

  // Show user-friendly message
  showToast({
    title: 'Reconnect Required',
    description: `Please reconnect your ${provider} account`,
    action: () => initiateOAuth(provider)
  });
}
```

---

## 🧪 Testing Token Flow

### Test 1: Initial Authorization
```javascript
// tests/integration/oauthTokenFlow.test.js
it('should store refresh token in N8N credential', async () => {
  const mockTokens = {
    access_token: 'test-access',
    refresh_token: 'test-refresh',
    expires_in: 3600
  };

  const credentialId = await createN8NCredential(mockTokens);
  
  const credential = await getN8NCredential(credentialId);
  
  expect(credential.data.refreshToken).toBe('test-refresh');
  expect(credential.data.accessToken).toBe('test-access');
});
```

### Test 2: Token Refresh
```javascript
it('should automatically refresh expired token', async () => {
  // Create credential with expired token
  const credential = await createExpiredCredential();
  
  // Trigger workflow execution
  await executeWorkflow(workflowId);
  
  // Verify token was refreshed
  const updatedCredential = await getN8NCredential(credential.id);
  expect(updatedCredential.data.accessToken).not.toBe(credential.data.accessToken);
});
```

### Test 3: Re-Login
```javascript
it('should not require OAuth on re-login', async () => {
  const user = await login('test@example.com', 'password');
  
  const { data: integration } = await supabase
    .from('integrations')
    .select('status, n8n_credential_id')
    .eq('user_id', user.id)
    .eq('provider', 'outlook')
    .single();

  expect(integration.status).toBe('active');
  expect(integration.n8n_credential_id).toBeTruthy();
  
  // Should NOT show OAuth prompt
  const requiresOAuth = checkIfOAuthRequired(integration);
  expect(requiresOAuth).toBe(false);
});
```

---

## 📊 Data Flow Diagram

```
INITIAL OAUTH:
─────────────
Frontend → Microsoft → Backend → N8N → Supabase
  ↓          ↓           ↓        ↓       ↓
Click     Consent    Exchange  Store   Store
         & Approve   Code     Tokens   Link

RE-LOGIN:
─────────
Frontend → Supabase → N8N → Microsoft Graph
  ↓          ↓         ↓         ↓
Login    Check      Get      Use Token
         Status   Credential  (auto-refresh)

TOKEN REFRESH:
──────────────
N8N → Microsoft → N8N
 ↓       ↓         ↓
Check   Refresh  Update
Expiry  Token   Credential
```

---

## 🔍 Diagnostic Commands

### Check Supabase Integration
```sql
SELECT 
  user_id,
  provider,
  status,
  n8n_credential_id,
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token,
  access_token_expires_at,
  created_at,
  updated_at
FROM integrations
WHERE provider IN ('outlook', 'gmail')
ORDER BY created_at DESC;
```

### Check N8N Credential
```bash
curl ${N8N_API_URL}/api/v1/credentials/${CREDENTIAL_ID} \
  -H "Authorization: Bearer ${N8N_API_KEY}" \
  | jq '{
      id, 
      name, 
      type, 
      hasAccessToken: (.data.accessToken != null),
      hasRefreshToken: (.data.refreshToken != null)
    }'
```

### Run Complete Diagnostic
```bash
npm run ops:diagnose           # Detailed analysis
npm run ops:auto-fix           # Attempt auto-fix
npm run ops:full-diagnostic    # Both combined
```

---

## 🎓 Implementation Checklist

### Initial Setup
- [ ] Azure app has `offline_access` permission
- [ ] OAuth URL includes `offline_access` in scope
- [ ] OAuth URL includes `prompt=consent`
- [ ] Token exchange validated for refresh token
- [ ] Tokens stored in N8N, not Supabase
- [ ] Supabase stores `n8n_credential_id` only

### On User Login
- [ ] Check Supabase `integrations.status`
- [ ] Verify `n8n_credential_id` exists
- [ ] Optionally verify N8N credential exists
- [ ] Show OAuth only if invalid/missing

### Token Refresh
- [ ] N8N configured with `N8N_REFRESH_TOKENS_ENABLED=true`
- [ ] Credentials have refresh token
- [ ] Error handling for invalid_grant
- [ ] Graceful reconnection UI

### Monitoring
- [ ] Daily health checks
- [ ] Weekly credential validation
- [ ] Alert on missing refresh tokens
- [ ] Track token refresh failures

---

## 📚 Related Documentation

- [Outlook OAuth Fix](../fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md)
- [OAuth Credential Management](../guides/OAUTH_CREDENTIAL_MANAGEMENT.md)
- [N8N Troubleshooting](../systems/N8N_CREDENTIAL_TROUBLESHOOTING.md)
- [DevOps Runbook](../operations/DEVOPS_RUNBOOK.md)

---

## 🎯 Success Criteria

After proper implementation:

✅ `refresh_token` present in N8N credential  
✅ No tokens stored in Supabase `integrations` table  
✅ `n8n_credential_id` linked correctly  
✅ Users don't see OAuth on re-login  
✅ Tokens auto-refresh seamlessly  
✅ Workflows execute without "Unable to sign" errors  
✅ Diagnostic shows 0 critical issues  

---

**Quick Diagnostic:** `npm run ops:diagnose`  
**Auto-Fix:** `npm run ops:auto-fix`  
**Full Check:** `npm run ops:full-diagnostic`  

---

**Last Updated:** October 7, 2025  
**Status:** Production Guide

