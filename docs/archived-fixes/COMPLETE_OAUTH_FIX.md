# Complete OAuth Token Refresh Fix

**Status:** Ready to implement  
**Impact:** Fixes `hasRefreshToken: false` issue and enables silent re-login

---

## 🎯 What This Fixes

1. ✅ **Microsoft OAuth now includes `offline_access`** → refresh_token issued
2. ✅ **Tokens stored in n8n (single source of truth)** → no desync
3. ✅ **Supabase stores only `n8n_credential_id`** → clean architecture
4. ✅ **Re-login checks n8n credential** → no OAuth prompt
5. ✅ **Auto-refresh works** → workflows never fail with 401

---

## 📋 Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `src/lib/customOAuthService.js` | Add `offline_access`, create n8n credential | 148-154, 407-414 |
| `backend/src/routes/oauth.js` | Add n8n credential creation after token exchange | 144-171 |
| `src/contexts/SupabaseAuthContext.jsx` | Remove direct token storage | 204-211 |
| Database | Remove token columns, add RLS policies | SQL |

---

## 🔧 Changes Required

### 1️⃣ Fix: Add `offline_access` to Microsoft Scopes

**File:** `src/lib/customOAuthService.js`

**Line 407-414:** Replace with:

```javascript
} else if (provider === 'outlook') {
  return [
    'offline_access',  // ✅ CRITICAL: Required for refresh token!
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/MailboxSettings.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'https://graph.microsoft.com/openid',
    'https://graph.microsoft.com/profile',
    'https://graph.microsoft.com/email'
  ];
}
```

**Line 380-394:** Replace `buildMicrosoftOAuthUrl` with:

```javascript
buildMicrosoftOAuthUrl(clientId, scopes, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: this.redirectUri,
    response_type: 'code',
    response_mode: 'query',
    scope: scopes.join(' '),  // Now includes offline_access!
    state: state,
    prompt: 'consent',  // ✅ Force consent to get refresh token
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}
```

---

### 2️⃣ Fix: Create n8n Credential After Token Exchange

**File:** `backend/src/routes/oauth.js`

**Line 1-4:** Add at top:

```javascript
const express = require('express');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const axios = require('axios');  // ✅ Add this
```

**Line 144-171:** Replace the success section with:

```javascript
const tokenData = await response.json();

logger.info('Microsoft token exchange successful:', {
  hasAccessToken: !!tokenData.access_token,
  hasRefreshToken: !!tokenData.refresh_token,
  tokenType: tokenData.token_type,
  expiresIn: tokenData.expires_in,
  scope: tokenData.scope
});

// ✅ STEP 1: Create n8n credential (source of truth for tokens)
try {
  const n8nApiUrl = process.env.N8N_API_URL || process.env.VITE_N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud/api/v1';
  const n8nApiKey = process.env.N8N_API_KEY;

  if (!n8nApiKey) {
    throw new Error('N8N_API_KEY not configured');
  }

  logger.info('Creating n8n credential for Outlook');

  const n8nCredentialResponse = await axios.post(
    `${n8nApiUrl}/credentials`,
    {
      name: `Outlook OAuth - ${new Date().toISOString()}`,
      type: 'microsoftOutlookOAuth2Api',
      data: {
        clientId: clientId,
        clientSecret: clientSecret,
        oauthTokenData: {
          token_type: tokenData.token_type || 'Bearer',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,  // ✅ Critical!
          expires_in: tokenData.expires_in || 3599,
          scope: tokenData.scope
        }
      }
    },
    {
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      }
    }
  );

  const n8nCredentialId = n8nCredentialResponse.data?.data?.id || n8nCredentialResponse.data?.id;
  
  logger.info('✅ n8n credential created:', { credentialId: n8nCredentialId });

  // ✅ STEP 2: Cache result with n8n_credential_id
  const successData = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in,
    scope: tokenData.scope,
    n8n_credential_id: n8nCredentialId  // ✅ Return this to frontend
  };

  requestCache.set(cacheKey, {
    status: 'completed',
    data: successData,
    timestamp: now
  });

  logger.info('OAuth token exchange completed successfully', {
    cacheKey,
    hasRefreshToken: !!tokenData.refresh_token,
    n8nCredentialId
  });

  // Return the token data + n8n credential ID
  res.json(successData);

} catch (n8nError) {
  logger.error('Failed to create n8n credential:', n8nError);
  
  // Still return tokens but warn that n8n credential creation failed
  const fallbackData = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in,
    scope: tokenData.scope,
    n8n_credential_error: n8nError.message
  };
  
  requestCache.set(cacheKey, {
    status: 'completed',
    data: fallbackData,
    timestamp: now
  });
  
  res.json(fallbackData);
}
```

---

### 3️⃣ Fix: Store Only n8n_credential_id in Supabase

**File:** `src/lib/customOAuthService.js`

**Line 144-154:** Replace with:

```javascript
// ✅ Save only n8n_credential_id to Supabase (NOT raw tokens!)
const integrationData = {
  user_id: user.id,
  provider: provider,
  status: 'active',
  n8n_credential_id: tokenData.n8n_credential_id,  // ✅ Only store reference
  scope: tokenData.scope || this.getOAuthScopes(provider).join(' '),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
  // ❌ NO access_token or refresh_token here!
};
```

---

### 4️⃣ Fix: Remove Token Storage from SupabaseAuthContext

**File:** `src/contexts/SupabaseAuthContext.jsx`

**Line 204-211:** Replace with:

```javascript
const integrationData = {
  user_id: user.id,
  provider: provider,
  n8n_credential_id: accessToken ? 'NEEDS_MIGRATION' : null,  // Temporary marker
  scopes: currentSession.user.user_metadata?.scopes?.split(' ') || getProviderScopes(provider),
  status: 'active',
  // ❌ NO access_token or refresh_token stored here anymore
};
```

**Note:** This code path is for Supabase Auth's built-in OAuth (Gmail), not the custom flow. For Outlook, the customOAuthService handles everything correctly now.

---

### 5️⃣ Database: Remove Token Columns & Add RLS

**Run this SQL in Supabase SQL Editor:**

```sql
-- ================================
-- PART 1: Remove token columns
-- ================================
BEGIN;

-- Backup existing tokens (optional)
CREATE TABLE IF NOT EXISTS integrations_token_backup AS 
SELECT id, user_id, provider, access_token, refresh_token, created_at
FROM integrations
WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL;

-- Remove token columns
ALTER TABLE integrations 
  DROP COLUMN IF EXISTS access_token CASCADE,
  DROP COLUMN IF EXISTS refresh_token CASCADE;

-- Ensure n8n_credential_id column exists
ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS n8n_credential_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_n8n_credential_id 
ON integrations(n8n_credential_id);

COMMIT;

-- ================================
-- PART 2: Fix RLS policies
-- ================================
BEGIN;

-- Integrations table
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own integrations" ON integrations;
CREATE POLICY "Users can view their own integrations"
ON integrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own integrations" ON integrations;
CREATE POLICY "Users can insert their own integrations"
ON integrations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own integrations" ON integrations;
CREATE POLICY "Users can update their own integrations"
ON integrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own integrations" ON integrations;
CREATE POLICY "Users can delete their own integrations"
ON integrations FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Extracted business profiles table
ALTER TABLE extracted_business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profiles" ON extracted_business_profiles;
CREATE POLICY "Users can view their own profiles"
ON extracted_business_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profiles" ON extracted_business_profiles;
CREATE POLICY "Users can insert their own profiles"
ON extracted_business_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profiles" ON extracted_business_profiles;
CREATE POLICY "Users can update their own profiles"
ON extracted_business_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMIT;

-- ================================
-- PART 3: Verify changes
-- ================================
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'integrations'
ORDER BY ordinal_position;

-- Should NOT show access_token or refresh_token
-- Should show n8n_credential_id
```

---

### 6️⃣ Environment Variables

**Add to `.env`:**

```bash
# n8n API (for credential storage)
N8N_API_URL=https://n8n.srv995290.hstgr.cloud/api/v1
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNjNjN2VlNi1iZDQzLTRlNTEtOGZiZi00N2I2MThjNzAzODQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5NTQ0NDM0fQ.SmZJH9hUnbyWLajFv3GOTzgxZ69oEo5dQPx8ifYsKys

# Make sure these are still set
VITE_OUTLOOK_CLIENT_ID=896fec20-bae5-4459-8c04-45c33ee7304a
VITE_OUTLOOK_CLIENT_SECRET=your_secret_here
```

---

## ✅ Testing the Fix

### Test 1: Fresh Outlook Connection

```bash
# 1. User clicks "Connect Outlook"
# 2. OAuth flow completes
# 3. Check console logs:

# Should see:
✅ Token exchange successful: {
  hasAccessToken: true,
  hasRefreshToken: true,  // ✅ Now true!
  scope: "offline_access Mail.ReadWrite..."
}

✅ n8n credential created: { credentialId: "ABC123..." }

# 4. Check Supabase integrations table:
SELECT user_id, provider, n8n_credential_id, status 
FROM integrations 
WHERE provider = 'outlook';

# Should show:
# n8n_credential_id: "ABC123..."
# NO access_token or refresh_token columns
```

### Test 2: Re-Login (Silent)

```bash
# 1. User logs out
# 2. User logs back in
# 3. Dashboard loads

# Expected: NO OAuth prompt
# Workflows activate successfully
```

### Test 3: Verify n8n Credential

```bash
curl -X GET "https://n8n.srv995290.hstgr.cloud/api/v1/credentials/ABC123" \
  -H "X-N8N-API-KEY: your_key"

# Should return:
{
  "data": {
    "id": "ABC123",
    "type": "microsoftOutlookOAuth2Api",
    "data": {
      "oauthTokenData": {
        "access_token": "...",
        "refresh_token": "...",  // ✅ Present!
        "expires_in": 3599
      }
    }
  }
}
```

---

## 🚀 Deployment Steps

1. **Backup database**
   ```bash
   # Use Supabase dashboard to create backup
   ```

2. **Apply code changes**
   ```bash
   # Update the 3 files as shown above
   ```

3. **Run database migration**
   ```sql
   -- Run the SQL from section 5️⃣
   ```

4. **Add environment variables**
   ```bash
   # Add to .env as shown in section 6️⃣
   ```

5. **Restart backend**
   ```bash
   # If using PM2:
   pm2 restart backend

   # Or just restart your development server
   ```

6. **Test with a user**
   - Connect Outlook
   - Verify refresh token in logs
   - Log out and back in
   - Confirm no OAuth prompt

---

## 📊 Expected Results

### Before Fix
```
📊 OAuth Diagnostic Results:
❌ hasRefreshToken: false
❌ Users re-auth on every login
❌ Workflows fail: "Unable to sign without access token"
```

### After Fix
```
📊 OAuth Diagnostic Results:
✅ hasRefreshToken: true
✅ n8n_credential_id: "ABC123..."
✅ Silent re-login working
✅ Workflows activate successfully
✅ Auto-refresh working
```

---

## 🔄 Migration Plan for Existing Users

For the 1 Outlook user with existing `n8n_credential_id`:

```javascript
// Their integration already has n8n_credential_id
// Just need to verify the credential has refresh_token

// If not, mark for re-auth:
UPDATE integrations 
SET status = 'reauth_required'
WHERE provider = 'outlook' 
  AND n8n_credential_id IS NOT NULL
  -- Run diagnostic to check if refresh_token exists in n8n
```

For the 2 Gmail users without `n8n_credential_id`:

```sql
UPDATE integrations 
SET status = 'reauth_required'
WHERE provider = 'gmail' 
  AND n8n_credential_id IS NULL;
```

---

## 💡 Key Changes Summary

| Component | Before (Broken) | After (Fixed) |
|-----------|----------------|---------------|
| **Microsoft Scopes** | Missing `offline_access` | Includes `offline_access` |
| **Token Storage** | Supabase only | n8n (with Supabase reference) |
| **Refresh Token** | Not issued | Issued and stored in n8n |
| **Re-login** | OAuth prompt every time | Silent (no prompt) |
| **Workflows** | Fail with 401 | Auto-refresh, always work |

---

**Ready to apply? Start with section 1 and work through each fix in order.** 🚀


