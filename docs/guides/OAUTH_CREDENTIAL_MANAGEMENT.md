# 🔐 OAuth Credential Management Guide

## Overview
Complete guide for managing OAuth credentials across FloworxV2, N8N, and Azure App Registrations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   OAuth Flow Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User clicks          Azure AD          N8N receives        │
│  "Connect" ──────► authorizes  ──────► tokens & stores      │
│     │                  │                     │               │
│     │                  │                     ▼               │
│     │                  │              {accessToken,          │
│     │                  │               refreshToken}         │
│     │                  │                     │               │
│     │                  │                     ▼               │
│     │                  │              Workflow uses          │
│     └──────────────────┴──────────► Microsoft Graph API     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 OAuth Credential Lifecycle

### Phase 1: Initial Setup

**Azure App Registration:**
1. Create app in Azure Portal
2. Add API permissions:
   - `offline_access` ✨ CRITICAL
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `MailboxSettings.ReadWrite`
3. Grant admin consent
4. Generate client secret
5. Configure redirect URIs

**Environment Variables:**
```bash
VITE_OUTLOOK_CLIENT_ID=896fec20-bae5-4459-8c04-45c33ee7304a
VITE_OUTLOOK_CLIENT_SECRET=<your-secret>
```

---

### Phase 2: User Authorization

**Frontend OAuth Initiation:**
```javascript
// src/contexts/SupabaseAuthContext.jsx
const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?`
  + `client_id=${OUTLOOK_CLIENT_ID}`
  + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
  + `&response_type=code`
  + `&scope=${encodeURIComponent(SCOPES)}`  // Must include offline_access
  + `&state=${encodeURIComponent(stateData)}`
  + `&response_mode=query`
  + `&prompt=consent`      // Force fresh consent
  + `&access_type=offline`; // Request refresh token
```

**Required Scopes:**
```javascript
const SCOPES = [
  'openid',
  'profile', 
  'email',
  'offline_access',           // ← CRITICAL for refresh token
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/MailboxSettings.ReadWrite'
].join(' ');
```

---

### Phase 3: Token Exchange

**Backend Token Exchange:**
```javascript
// backend/src/routes/oauth.js
const tokenResponse = await fetch(TOKEN_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    client_secret: OUTLOOK_CLIENT_SECRET,
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: SCOPES  // Include offline_access
  })
});

const tokens = await tokenResponse.json();

// tokens should contain:
// - access_token
// - refresh_token  ← Must be present
// - expires_in
// - token_type
```

---

### Phase 4: N8N Credential Creation

**Programmatic Creation:**
```javascript
const credential = await n8nAPI.createCredential({
  name: `Outlook OAuth - ${userEmail}`,
  type: 'microsoftOutlookOAuth2Api',
  data: {
    clientId: OUTLOOK_CLIENT_ID,
    clientSecret: OUTLOOK_CLIENT_SECRET,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,  // ← CRITICAL
    expiresIn: tokens.expires_in,
    tokenType: tokens.token_type
  }
});
```

**Manual Creation (N8N UI):**
1. Go to N8N > Credentials > New
2. Select "Microsoft Outlook OAuth2 API"
3. Enter Client ID and Secret
4. Click "Connect my account"
5. Complete Microsoft OAuth
6. **Verify refresh token appears**
7. Save credential

---

### Phase 5: Token Refresh (Automatic)

**How N8N Handles Refresh:**
```javascript
// N8N internal logic (automatic)
if (accessTokenExpired()) {
  const newTokens = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,  // From stored credential
      grant_type: 'refresh_token'
    })
  });
  
  // N8N updates credential automatically
  credential.data.accessToken = newTokens.access_token;
  credential.data.expiresIn = newTokens.expires_in;
  // refresh_token may be rotated (new one provided)
}
```

---

## 🔍 Credential Validation

### Required Fields Checklist

For `microsoftOutlookOAuth2Api`:
- [ ] `clientId` - Azure app client ID
- [ ] `clientSecret` - Azure app secret
- [ ] `accessToken` - Current access token
- [ ] `refreshToken` - **MUST BE PRESENT**
- [ ] `expiresIn` - Token lifetime (typically 3599)
- [ ] `tokenType` - Typically "Bearer"

### Validation Script
```javascript
// tests/integration/n8nCredentials.test.js
const validateOutlookCredential = (credential) => {
  const errors = [];
  
  if (!credential.data.clientId) errors.push('Missing clientId');
  if (!credential.data.clientSecret) errors.push('Missing clientSecret');
  if (!credential.data.accessToken) errors.push('Missing accessToken');
  if (!credential.data.refreshToken) errors.push('Missing refreshToken');
  
  if (credential.data.refreshToken === '') {
    errors.push('Refresh token is empty string');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true };
};
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Missing `offline_access` Scope
```javascript
// BAD - No offline_access
const scopes = 'Mail.ReadWrite Mail.Send';

// GOOD - Includes offline_access
const scopes = 'offline_access Mail.ReadWrite Mail.Send';
```

### ❌ Mistake 2: Not Forcing Fresh Consent
```javascript
// BAD - May use cached consent
window.location.href = oauthUrl;

// GOOD - Forces fresh consent
window.location.href = oauthUrl + '&prompt=consent';
```

### ❌ Mistake 3: Not Verifying Refresh Token
```javascript
// BAD - Assumes tokens are complete
await createCredential(tokens);

// GOOD - Validates before creating
if (!tokens.refresh_token) {
  throw new Error('Refresh token missing - OAuth flow incomplete');
}
await createCredential(tokens);
```

### ❌ Mistake 4: Wrong Token Endpoint
```javascript
// BAD - Using v1 endpoint
const endpoint = 'https://login.microsoftonline.com/common/oauth2/token';

// GOOD - Using v2 endpoint
const endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
```

---

## 🔄 Token Rotation Strategy

### Refresh Token Rotation
Microsoft may issue new refresh token on each refresh:

```javascript
// Handle refresh token rotation
const refreshResponse = await refreshAccessToken(currentRefreshToken);

// Store both new tokens
credential.accessToken = refreshResponse.access_token;
credential.refreshToken = refreshResponse.refresh_token || currentRefreshToken;
```

### Access Token Caching
```javascript
// Cache access token until 5 minutes before expiry
const shouldRefresh = (expiresAt) => {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() > (expiresAt - fiveMinutes);
};
```

---

## 📊 Credential Monitoring

### Health Check Script
```javascript
// scripts/check-credentials.js
async function checkCredentialHealth() {
  const credentials = await n8nAPI.getCredentials();
  const issues = [];

  for (const cred of credentials) {
    if (cred.type === 'microsoftOutlookOAuth2Api') {
      if (!cred.data.refreshToken) {
        issues.push({
          id: cred.id,
          name: cred.name,
          issue: 'Missing refresh token',
          severity: 'HIGH'
        });
      }

      // Check token expiry
      const expiresAt = cred.data.expiresIn ? 
        Date.now() + (cred.data.expiresIn * 1000) : null;
      
      if (expiresAt && expiresAt < Date.now()) {
        issues.push({
          id: cred.id,
          name: cred.name,
          issue: 'Access token expired',
          severity: 'MEDIUM'
        });
      }
    }
  }

  return issues;
}
```

---

## 📚 Related Documentation

- [Outlook OAuth Refresh Token Fix](../fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md)
- [OAuth Debug Guide](./OAUTH_DEBUG_GUIDE.md)
- [N8N Workflow Implementation](./N8N_WORKFLOW_IMPLEMENTATION_GUIDE.md)
- [Email Voice Analysis Flow](./EMAIL_VOICE_ANALYSIS_FLOW.md)

---

## 🎯 Success Indicators

After proper credential setup:

✅ Workflow activates without errors  
✅ Both access and refresh tokens present  
✅ Token automatically refreshes  
✅ No "unable to sign" errors  
✅ Email triggers work consistently  
✅ API calls succeed reliably  

---

**Quick Fix:** Reauthorize credential with `offline_access` scope  
**Prevention:** Always verify refresh token after OAuth  
**Monitoring:** Check credential health regularly  

---

**Last Updated:** October 7, 2025  
**Maintained By:** FloworxV2 Team

