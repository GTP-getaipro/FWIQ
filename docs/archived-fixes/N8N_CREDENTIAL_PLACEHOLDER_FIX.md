# N8N Credential Placeholder Fix

## Problem

When deploying workflows to n8n, the system was failing with this error:

```
❌ Error: Credential with ID "gmail-cred-placeholder" does not exist for type "gmailOAuth2"
```

The workflow was being deployed successfully, but when n8n tried to activate it, it rejected the workflow because it contained placeholder credential IDs instead of real n8n credential IDs.

## Root Cause

The frontend `workflowDeployer.js` was:
1. Fetching incomplete data that included placeholder credential IDs
2. Pre-injecting this data into the workflow template
3. Sending the pre-injected workflow to the Edge Function

The Edge Function has two code paths:
```typescript
if (workflowData) {
  // Use the pre-injected workflow from frontend (if provided)
  workflowJson = workflowData;  // ❌ This path was being used with placeholders
} else {
  // Load and inject template with real credentials
  workflowJson = await injectOnboardingData(clientData, workflowTemplate);  // ✅ This is the correct path
}
```

## Solution

**Stop sending pre-injected workflow data from the frontend and let the Edge Function handle everything.**

### Changes Made

#### 1. Added Real Credential Fetching (`src/lib/workflowDeployer.js`)

Added Step 1.5 to fetch real n8n credentials from the database:

```javascript
// Step 1.5: Fetch real n8n credentials from integrations table (CRITICAL FIX)
console.log('🔑 Step 1.5: Fetching real n8n credentials from database...');
const { data: integrations, error: integrationsError } = await supabase
  .from('integrations')
  .select('provider, n8n_credential_id, status')
  .eq('user_id', userId)
  .eq('status', 'active');

// Validate that we have at least one integration with a real n8n credential
const hasValidCredential = integrations?.some(i => 
  i.n8n_credential_id && !i.n8n_credential_id.includes('placeholder')
);

if (!hasValidCredential) {
  throw new Error('No valid email credentials found. Please reconnect your email account.');
}
```

#### 2. Removed Frontend Template Injection

Changed deployment to NOT pre-inject the workflow:

```javascript
// Step 4: Prepare deployment payload for Edge Function
// DO NOT pre-inject the workflow - let the Edge Function handle all credential creation and injection
console.log('🔧 Step 4: Preparing deployment payload for Edge Function...');
console.log('⚠️ Skipping frontend template injection - Edge Function will handle credentials');

// Prepare deployment payload WITHOUT pre-injected workflow
const deploymentPayload = {
  userId: userId,
  emailProvider: provider,
  // DO NOT send workflowData - let Edge Function load template and inject credentials
  deployToN8n: true,
  checkOnly: false
};
```

#### 3. Edge Function Handles Everything

Now the Edge Function:
1. Fetches the user's integration data (including refresh tokens)
2. Creates or retrieves n8n credentials using the refresh tokens
3. Loads the appropriate workflow template
4. Injects real credential IDs into the template
5. Deploys and activates the workflow

## How the Fix Works

### Before (Broken Flow):
```
Frontend → Fetch incomplete data with placeholders → Pre-inject workflow → Send to Edge Function → Edge Function uses pre-injected workflow → n8n rejects placeholder credentials ❌
```

### After (Fixed Flow):
```
Frontend → Send minimal data (userId, provider) → Edge Function → Fetch refresh tokens → Create n8n credentials → Load template → Inject real credentials → Deploy → Activate ✅
```

## Edge Function Credential Creation

The Edge Function (`supabase/functions/deploy-n8n/index.ts`) now handles:

1. **Gmail Credential Creation**:
```typescript
const credBody = {
  name: `${businessSlug}-${clientShort}-gmail`,
  type: 'googleOAuth2Api',
  data: {
    clientId: GMAIL_CLIENT_ID,
    clientSecret: GMAIL_CLIENT_SECRET,
    refreshToken: refreshToken  // Real refresh token from database
  }
};
const created = await n8nRequest('/credentials', { method: 'POST', body: JSON.stringify(credBody) });
gmailId = created.id;  // Real n8n credential ID
```

2. **OpenAI Credential Creation**:
```typescript
const { key, ref } = getNextKey();  // Rotate OpenAI keys
const created = await n8nRequest('/credentials', {
  method: 'POST',
  body: JSON.stringify({
    name: openaiCredName,
    type: 'openAiApi',
    data: { apiKey: key }
  })
});
```

3. **Credential Injection into Workflow**:
```typescript
workflowJson.nodes.forEach(node => {
  if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
    node.credentials.openAiApi = {
      id: openaiId,  // Real ID
      name: 'OpenAI Shared'
    };
  }
  
  if (node.type === 'n8n-nodes-base.gmailTrigger') {
    node.credentials.gmailOAuth2 = {
      id: gmailId,  // Real ID from credential creation
      name: `${businessName} Gmail`
    };
  }
});
```

## Testing

To test the fix:

1. Complete OAuth flow to connect Gmail/Outlook
2. Verify credentials are stored in `integrations` table with `n8n_credential_id`
3. Complete onboarding wizard
4. Deploy workflow from Step 4
5. Verify in console logs:
   - ✅ Real credential IDs are fetched from database
   - ✅ No placeholder credentials in deployment
   - ✅ Edge Function creates/retrieves n8n credentials
   - ✅ Workflow activates successfully without errors

## Key Benefits

1. **Centralized Credential Management**: All credential creation happens in one place (Edge Function)
2. **Automatic Credential Reuse**: Edge Function checks if credentials exist before creating new ones
3. **Security**: Refresh tokens never leave the database except to go directly to n8n
4. **Reliability**: No more placeholder credential errors
5. **Maintainability**: Single source of truth for credential injection logic

## Files Modified

- `src/lib/workflowDeployer.js` - Removed frontend injection, added credential validation
- No changes needed to Edge Function (it already had the correct logic)

## Related Issues

- Fixes: "Credential with ID 'gmail-cred-placeholder' does not exist"
- Fixes: Workflow deployment succeeding but activation failing
- Fixes: Edge Function 500 errors during deployment

## Next Steps

The user should test the complete flow:
1. OAuth connection
2. Onboarding wizard completion  
3. Workflow deployment
4. Verify workflow is active in n8n dashboard

