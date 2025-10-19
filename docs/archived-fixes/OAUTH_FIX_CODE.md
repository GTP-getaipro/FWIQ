# OAuth Flow Fix - Code Changes Required

## File: `src/contexts/SupabaseAuthContext.jsx`

### ❌ CURRENT CODE (Lines 204-282) - BROKEN

```javascript
const integrationData = {
  user_id: user.id,
  provider: provider,
  access_token: accessToken,      // ❌ Storing in Supabase
  refresh_token: refreshToken,    // ❌ Storing in Supabase
  scopes: currentSession.user.user_metadata?.scopes?.split(' ') || getProviderScopes(provider),
  status: 'active',
};

// ❌ Saving directly to Supabase without n8n
const { data: insertData, error } = await supabase.from("integrations").upsert(
  integrationData,
  { onConflict: "user_id, provider" }
).select();
```

**Problems:**
1. Tokens saved to Supabase (will become stale)
2. No n8n credential created
3. No n8n_credential_id stored
4. Users will fail on re-login

---

### ✅ FIXED CODE - Solution

Replace the entire section (lines 204-282) with this:

```javascript
// ✅ STEP 1: Create credential in n8n FIRST
try {
  const n8nApiUrl = import.meta.env.VITE_N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud/api/v1';
  const n8nApiKey = import.meta.env.VITE_N8N_API_KEY || 'YOUR_N8N_API_KEY';

  // Determine credential type based on provider
  const credentialType = provider === 'gmail' 
    ? 'googleOAuth2Api' 
    : 'microsoftOutlookOAuth2Api';

  const credentialName = `${provider === 'gmail' ? 'Gmail' : 'Outlook'} - ${user.email}`;

  console.log('🔄 Creating n8n credential...', {
    type: credentialType,
    name: credentialName,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken
  });

  // ✅ Create credential in n8n
  const credentialResponse = await fetch(`${n8nApiUrl}/credentials`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': n8nApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: credentialName,
      type: credentialType,
      data: {
        // ✅ Store tokens in n8n
        oauthTokenData: {
          accessToken: accessToken,
          refreshToken: refreshToken,  // ✅ Critical for auto-refresh!
          expiresIn: 3600, // Default 1 hour
        }
      }
    })
  });

  if (!credentialResponse.ok) {
    const errorText = await credentialResponse.text();
    throw new Error(`n8n credential creation failed: ${errorText}`);
  }

  const credential = await credentialResponse.json();
  const n8nCredentialId = credential.data?.id || credential.id;

  console.log('✅ n8n credential created:', n8nCredentialId);

  // ✅ STEP 2: Save only credential reference to Supabase
  const integrationData = {
    user_id: user.id,
    provider: provider,
    n8n_credential_id: n8nCredentialId,  // ✅ Only store reference
    scopes: currentSession.user.user_metadata?.scopes?.split(' ') || getProviderScopes(provider),
    status: 'active',
    // ❌ NO access_token or refresh_token stored here!
  };

  console.log('📦 Integration data (without tokens):', integrationData);
  console.log('🔄 Saving integration reference to Supabase...');

  const { data: insertData, error } = await supabase.from("integrations").upsert(
    integrationData,
    { onConflict: "user_id, provider" }
  ).select();

  if (error) {
    console.error('❌ Integration storage failed:', error);
    
    // Try to clean up n8n credential if Supabase fails
    try {
      await fetch(`${n8nApiUrl}/credentials/${n8nCredentialId}`, {
        method: 'DELETE',
        headers: { 'X-N8N-API-KEY': n8nApiKey }
      });
      console.log('🧹 Cleaned up n8n credential after Supabase failure');
    } catch (cleanupError) {
      console.error('⚠️ Failed to cleanup n8n credential:', cleanupError);
    }

    // Show user-friendly error messages
    if (error.code === '23514') {
      toast({
        variant: "destructive",
        title: "Database Constraint Error",
        description: "The database constraint is preventing the integration from being saved. Please contact support.",
      });
    } else if (error.code === '42501' || error.code === 'PGRST301') {
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: "Database security policy is blocking the save. Please contact support.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Integration Failed",
        description: `Database error: ${error.message}`,
      });
    }
  } else {
    console.log('✅ Integration stored successfully!');
    console.log('📋 Stored data:', insertData);
    console.log('🔑 n8n credential ID:', n8nCredentialId);
    
    toast({
      title: "Integration Successful",
      description: `Successfully connected your ${provider} account. Tokens stored securely.`,
    });
  }

} catch (n8nError) {
  console.error('❌ n8n credential creation failed:', n8nError);
  toast({
    variant: "destructive",
    title: "Integration Setup Failed",
    description: `Failed to create secure credential: ${n8nError.message}. Please try again.`,
  });
}
```

---

## Required Environment Variables

Add to your `.env` file:

```bash
# n8n API for OAuth credential storage
VITE_N8N_API_URL=https://n8n.srv995290.hstgr.cloud/api/v1
VITE_N8N_API_KEY=your_n8n_api_key_here
```

---

## Database Schema Change

Remove token columns from `integrations` table:

```sql
-- Migration: Remove token storage from integrations
BEGIN;

-- Backup existing tokens (optional)
CREATE TABLE IF NOT EXISTS integrations_token_backup AS 
SELECT id, user_id, provider, access_token, refresh_token, created_at
FROM integrations
WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL;

-- Remove token columns
ALTER TABLE integrations 
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token;

-- Ensure n8n_credential_id column exists
ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS n8n_credential_id TEXT;

COMMIT;
```

---

## Testing the Fix

### Test 1: New Gmail Connection
1. User connects Gmail
2. Check console logs:
   ```
   ✅ n8n credential created: ABC123...
   ✅ Integration stored successfully!
   ```
3. Verify in Supabase:
   ```sql
   SELECT user_id, provider, n8n_credential_id, status 
   FROM integrations 
   WHERE provider = 'gmail';
   ```
4. Should show `n8n_credential_id` populated

### Test 2: User Logs Out & Back In
1. User logs out
2. User logs back in
3. Dashboard loads
4. **NO OAuth prompt** ✅
5. Workflows execute successfully ✅

### Test 3: Token Refresh
1. Wait 1+ hour (or manually expire token in n8n)
2. Trigger workflow that uses Gmail/Outlook
3. n8n auto-refreshes token
4. Workflow completes successfully ✅

---

## What This Fix Does

### Before (Broken):
```
User connects → Tokens → Supabase ❌
                    ↓
               (never saved to n8n)
                    ↓
            Re-login requires re-auth
```

### After (Fixed):
```
User connects → Tokens → n8n credential (ID: ABC123)
                            ↓
                    Supabase stores only: n8n_credential_id="ABC123"
                            ↓
                    Re-login checks n8n → tokens valid → no re-auth needed ✅
```

---

## Key Improvements

1. ✅ **Tokens stored ONLY in n8n** (single source of truth)
2. ✅ **Supabase stores only credential reference** (no desync possible)
3. ✅ **n8n auto-refreshes tokens** (no manual intervention needed)
4. ✅ **Users never re-auth** (unless truly disconnected)
5. ✅ **Proper error handling** (cleans up on failure)

---

## Next Steps

1. **Apply this code change** to `src/contexts/SupabaseAuthContext.jsx`
2. **Run database migration** to remove token columns
3. **Add environment variables** for n8n API
4. **Mark existing broken integrations** for re-auth:
   ```bash
   node fix-oauth-token-flow.cjs
   ```
5. **Test with a user account** (connect, logout, login)
6. **Monitor for errors** in browser console and n8n logs

---

## Troubleshooting

### Error: "n8n credential creation failed: 405"
- Check n8n API key is correct
- Verify n8n URL includes `/api/v1`
- Ensure n8n API is accessible

### Error: "Failed to create secure credential"
- Check browser console for detailed error
- Verify n8n is running and accessible
- Check n8n API key has correct permissions

### Tokens still in Supabase
- Run the database migration SQL
- Or use: `node fix-oauth-token-flow.cjs`

---

**Ready to apply? Make these changes and your OAuth token refresh will work perfectly!** 🚀


