# Workflow Deployment Credential Issue - Investigation & Fix

## 🔴 Critical Issue Identified

**Error**: `Credential with ID "bzvbE61DZ2hxM0fq" does not exist for type "gmailOAuth2"`

## 📊 Problem Analysis

### Current Deployment Flow
1. Frontend calls `deployToN8n()` in `workflowDeployer.js`
2. **Attempts Edge Function first** → Returns 500 error
3. **Falls back to Backend API** (`/api/workflows/deploy`)
4. Backend API successfully creates workflow in n8n
5. **Workflow activation FAILS** because credentials don't exist

### Root Cause

The backend API route at `backend/src/routes/workflows.js:264-405` is a **simple CORS proxy** that:
- Takes `workflowData` from the frontend
- Posts it directly to n8n's `/api/v1/workflows` endpoint
- **DOES NOT create or manage credentials**
- Assumes credentials already exist in n8n

Meanwhile, the `workflowData` from the frontend contains hardcoded/placeholder credential IDs like `bzvbE61DZ2hxM0fq` that don't actually exist in n8n.

### Why Edge Function Also Fails

The Edge Function (`supabase/functions/deploy-n8n/index.ts`) DOES create credentials properly (lines 1502-1607), but it's returning a 500 error. Possible reasons:
1. Missing environment variables (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, N8N_API_KEY)
2. n8n API connection failure
3. Database permission issues
4. Refresh token not found in integrations table

## 🔧 Fix Strategy

### Option 1: Fix Backend API Route (Recommended for Quick Fix)

Update `backend/src/routes/workflows.js` to call the Edge Function instead of being a simple proxy:

```javascript
router.post('/deploy', asyncHandler(async (req, res) => {
  const { userId, emailProvider } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId',
      code: 'MISSING_USER_ID'
    });
  }

  try {
    // Call the Edge Function which handles credential creation properly
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/deploy-n8n`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        userId,
        emailProvider: emailProvider || 'gmail'
      })
    });

    if (!edgeResponse.ok) {
      const errorText = await edgeResponse.text();
      throw new Error(`Edge Function failed: ${edgeResponse.status} - ${errorText}`);
    }

    const result = await edgeResponse.json();
    
    res.json({
      success: true,
      workflowId: result.workflowId,
      version: result.version,
      deploymentMethod: 'edge-function-via-backend'
    });

  } catch (error) {
    logger.error('Failed to deploy workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed'
    });
  }
}));
```

### Option 2: Fix Edge Function (Comprehensive Solution)

1. **Check Edge Function Environment Variables**
   ```bash
   npx supabase secrets list
   ```

   Required secrets:
   - `N8N_BASE_URL`
   - `N8N_API_KEY`
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Add Error Handling and Logging**

   Update `supabase/functions/deploy-n8n/index.ts` around line 1942:

   ```typescript
   } catch (err) {
     console.error('❌ Edge Function execution failed:', err);
     console.error('Error details:', {
       message: err.message,
       stack: err.stack,
       userId: requestBody?.userId,
       provider: requestBody?.emailProvider
     });
     
     return new Response(JSON.stringify({
       success: false,
       error: err.message,
       details: process.env.SUPABASE_ENV === 'production' ? undefined : {
         stack: err.stack,
         name: err.name
       }
     }), {
       status: 500,
       headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*'
       }
     });
   }
   ```

3. **Validate Credentials Before Deployment**

   Add validation before line 1767:

   ```typescript
   // Validate refresh token exists
   if (!refreshToken) {
     throw new Error(`No active ${provider} integration found for user. Please reconnect your email account.`);
   }
   
   // Validate environment credentials
   if (provider === 'gmail' && (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET)) {
     throw new Error('Gmail OAuth credentials not configured in Edge Function');
   }
   ```

### Option 3: Frontend Fallback Improvement

Update `src/lib/workflowDeployer.js` line 432 to provide better error context:

```javascript
} catch (edgeError) {
  console.warn('⚠️ Edge Function deployment failed:', {
    error: edgeError.message,
    userId,
    provider,
    suggestion: 'Check Edge Function logs and environment variables'
  });
  
  // Don't fall back to backend API if it doesn't support credentials
  throw new Error(`Edge Function deployment failed: ${edgeError.message}. Backend fallback does not support credential creation.`);
}
```

## 🎯 Immediate Action Items

### 1. Check Edge Function Secrets
```bash
npx supabase secrets list
```

Ensure these are set:
- `N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud`
- `N8N_API_KEY=<your-key>`
- `GMAIL_CLIENT_ID=<your-client-id>`
- `GMAIL_CLIENT_SECRET=<your-client-secret>`

### 2. Test Edge Function Directly

Create a test file `test-edge-function.js`:

```javascript
const userId = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';
const supabaseUrl = 'https://oinxzvqszingwstrbdro.supabase.co';
const authToken = '<your-anon-key>';

fetch(`${supabaseUrl}/functions/v1/deploy-n8n`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    userId,
    emailProvider: 'gmail'
  })
})
.then(res => res.text())
.then(text => {
  console.log('Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('Parsed:', json);
  } catch (e) {
    console.error('Not JSON:', text);
  }
})
.catch(err => console.error('Error:', err));
```

### 3. Check Database for Existing Credentials

```sql
-- Check if n8n credentials exist for the user
SELECT 
  i.user_id,
  i.provider,
  i.n8n_credential_id,
  i.status,
  i.created_at
FROM integrations i
WHERE i.user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
  AND i.status = 'active';

-- Check credential mappings
SELECT *
FROM n8n_credential_mappings
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';
```

## 🚀 Quick Fix (Choose One)

### A. Use Edge Function Only (Remove Backend Fallback)

In `src/lib/workflowDeployer.js`, remove the backend API fallback at line 434-462 and fix the Edge Function issues.

### B. Make Backend API Call Edge Function

Implement Option 1 above to make the backend route call the Edge Function.

### C. Manual Credential Creation

If all else fails, manually create credentials in n8n and update the database:

```sql
-- Update the integrations table with the actual n8n credential ID
UPDATE integrations
SET n8n_credential_id = '<actual-n8n-credential-id-from-n8n-ui>'
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
  AND provider = 'gmail';
```

## 📝 Testing Checklist

- [ ] Edge Function secrets are properly configured
- [ ] Database has active integration with refresh_token
- [ ] Edge Function can connect to n8n API
- [ ] Edge Function can create credentials in n8n
- [ ] Workflow deployment creates credentials first
- [ ] Workflow activation uses the correct credential IDs
- [ ] Database records are updated with n8n credential IDs

## 🔍 Debug Commands

```bash
# Check Supabase Edge Function status
npx supabase functions list

# View Edge Function configuration
npx supabase secrets list

# Test n8n API connection
curl -X GET "https://n8n.srv995290.hstgr.cloud/api/v1/workflows" \
  -H "X-N8N-API-KEY: <your-api-key>"

# Check if credentials exist in n8n
curl -X GET "https://n8n.srv995290.hstgr.cloud/api/v1/credentials" \
  -H "X-N8N-API-KEY: <your-api-key>"
```

## 📌 Conclusion

The core issue is that **credentials are not being created in n8n** when using the backend API fallback. The Edge Function is designed to create credentials properly, but it's returning a 500 error. Fix the Edge Function first, then remove or update the backend fallback to also handle credential creation.

