# Workflow Deployment Investigation Summary

## 🔍 Issue Identified

**Error**: `Credential with ID "bzvbE61DZ2hxM0fq" does not exist for type "gmailOAuth2"`

**Location**: Workflow activation fails when trying to use Gmail credentials

## 📊 What's Happening

### Current Deployment Flow:
1. ✅ Frontend calls deployment
2. ❌ Edge Function fails with 500 error
3. ⚠️ Falls back to Backend API at `/api/workflows/deploy`
4. ✅ Backend API creates workflow in n8n (ID: `sokzM6WvZW3mVvW8`)
5. ❌ **Workflow activation FAILS** - credentials don't exist

### The Root Problem:

The backend API route (`backend/src/routes/workflows.js:264-405`) is a **simple CORS proxy** that:
- Takes pre-built workflow data from the frontend
- Posts it directly to n8n
- **Does NOT create or manage credentials**
- Assumes credentials already exist

Meanwhile, the workflow contains credential ID `bzvbE61DZ2hxM0fq` which **doesn't actually exist in n8n**.

## 🔧 Why This Happens

### The Edge Function (Correct Approach)
The Edge Function (`supabase/functions/deploy-n8n/index.ts`) is designed to:
1. Fetch OAuth tokens from the `integrations` table
2. Create credentials in n8n using those tokens
3. Get the credential IDs from n8n
4. Inject those IDs into the workflow template
5. Deploy and activate the workflow

### The Backend Route (Current Problem)
The backend route simply:
1. Takes whatever workflow data it receives
2. Posts it to n8n
3. Tries to activate it
4. Fails because credentials don't exist

## 🎯 Solution

You need to either:

### Option A: Fix the Backend Route (Recommended)
Update `backend/src/routes/workflows.js` to call the Edge Function instead of being a proxy:

```javascript
router.post('/deploy', asyncHandler(async (req, res) => {
  // Call Edge Function which handles credentials properly
  const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/deploy-n8n`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId, emailProvider })
  });
  
  // Return Edge Function result
  const result = await edgeResponse.json();
  res.json(result);
}));
```

See `backend-workflow-route-fix.js` for the complete implementation.

### Option B: Fix the Edge Function
The Edge Function is returning a 500 error. To fix it:

1. **Check environment variables**:
   ```bash
   npx supabase secrets list
   ```
   
   Required secrets:
   - `N8N_BASE_URL`
   - `N8N_API_KEY`
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`

2. **Check database for OAuth tokens**:
   ```sql
   SELECT provider, status, 
          CASE WHEN refresh_token IS NOT NULL THEN 'Has token' ELSE 'NO TOKEN' END
   FROM integrations
   WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';
   ```

3. **View Edge Function logs**:
   The Edge Function logs will show why it's failing with a 500 error.

## 🚀 Quick Fix Steps

### Step 1: Test n8n Credentials
```bash
node test-n8n-credentials.js
```

This will show:
- What credentials exist in n8n
- Whether the problematic ID `bzvbE61DZ2hxM0fq` exists
- What credential IDs are referenced in the deployed workflow

### Step 2: Check Database
```bash
psql [your-db-url] -f check-credentials.sql
```

This will show:
- What OAuth tokens are stored
- What n8n credential IDs are recorded
- Whether the user has active integrations

### Step 3: Apply the Fix

Choose one:

**A. Quick Fix - Update Backend Route**
```bash
# Replace the /deploy endpoint in backend/src/routes/workflows.js
# with the code from backend-workflow-route-fix.js
```

**B. Comprehensive Fix - Fix Edge Function**
1. Set missing environment variables
2. Add error handling (see `WORKFLOW_DEPLOYMENT_CREDENTIAL_FIX.md`)
3. Deploy updated Edge Function
4. Test deployment again

## 📝 Files Created

1. **WORKFLOW_DEPLOYMENT_CREDENTIAL_FIX.md**
   - Comprehensive analysis and fix strategies
   - Multiple solution options
   - Debug commands and testing checklist

2. **test-n8n-credentials.js**
   - Script to test n8n API
   - Shows what credentials exist
   - Verifies the problematic credential ID

3. **check-credentials.sql**
   - SQL queries to check database state
   - Shows integration status
   - Reveals credential mapping issues

4. **backend-workflow-route-fix.js**
   - Complete fixed backend route
   - Calls Edge Function properly
   - Includes direct deployment option for debugging

## ⚠️ Important Notes

1. **The workflow was created successfully** (ID: `sokzM6WvZW3mVvW8`)
   - It exists in n8n
   - It's just not activated due to missing credentials

2. **The Edge Function knows how to create credentials**
   - It's the correct approach
   - It's currently failing with 500 error
   - Need to diagnose why

3. **The backend route should NOT be a simple proxy**
   - It needs to either call the Edge Function
   - Or implement the same credential creation logic

## 🎯 Recommended Action

**Immediate**:
1. Run `node test-n8n-credentials.js` to see what's in n8n
2. Check Edge Function environment variables
3. Fix why Edge Function is returning 500

**Short-term**:
1. Update backend route to call Edge Function
2. Remove the direct n8n posting logic
3. Ensure all deployments go through proper credential creation

**Testing**:
1. Clear the failed workflow from n8n
2. Try deployment again
3. Verify credentials are created first
4. Confirm workflow activates successfully

## 📞 Next Steps

Would you like me to:
1. **Fix the backend route** to call the Edge Function?
2. **Investigate the Edge Function 500 error** more deeply?
3. **Create a manual credential creation script** as a temporary workaround?
4. **Add comprehensive error handling** throughout the deployment flow?

Let me know which approach you'd like to take!

