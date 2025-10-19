# N8N Programmatic Credential Creation Guide

## 🎯 Correct n8n API Format

Based on your existing `n8nCredentialManager.js` and n8n REST API documentation:

### ✅ Correct Endpoint
```
POST /rest/credentials
```
**NOT** `/api/v1/credentials` ❌

### ✅ Correct Credential Types
- **Gmail**: `gmailOAuth2Api`
- **Outlook**: `microsoftOutlookOAuth2Api`

---

## 📋 Implementation

### 1. **n8nCredentialCreator** (`src/lib/n8nCredentialCreator.js`)

Uses the **correct n8n REST API format**:

```javascript
// Correct Gmail credential payload
{
  name: "Business Name Gmail",
  type: "gmailOAuth2Api",  // Correct type!
  data: {
    access_token: "ya29.a0...",
    refresh_token: "1//0g...",
    token_type: "Bearer",
    clientId: process.env.VITE_GMAIL_CLIENT_ID,
    clientSecret: process.env.VITE_GMAIL_CLIENT_SECRET
  },
  nodesAccess: [
    { nodeType: "n8n-nodes-base.gmail" },
    { nodeType: "n8n-nodes-base.gmailTrigger" }
  ]
}

// Correct Outlook credential payload
{
  name: "Business Name Outlook",
  type: "microsoftOutlookOAuth2Api",  // Correct type!
  data: {
    access_token: "EwB...",
    refresh_token: "M.C511...",
    token_type: "Bearer",
    clientId: process.env.VITE_OUTLOOK_CLIENT_ID,
    clientSecret: process.env.VITE_OUTLOOK_CLIENT_SECRET
  },
  nodesAccess: [
    { nodeType: "n8n-nodes-base.microsoftOutlook" },
    { nodeType: "n8n-nodes-base.microsoftOutlookTrigger" }
  ]
}
```

### 2. **API Call via CORS Proxy**

```javascript
const createResult = await n8nCorsProxy.proxyRequest('/rest/credentials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: credentialPayload
});
```

### 3. **Store Mapping in Database**

Instead of creating a new table, we use the existing `integrations` table:

```sql
-- Add columns to integrations table
ALTER TABLE integrations
  ADD COLUMN n8n_credential_id TEXT,
  ADD COLUMN n8n_credential_name TEXT;
```

```javascript
// Update integration with n8n credential ID
await supabase
  .from('integrations')
  .update({
    n8n_credential_id: createResult.id,
    n8n_credential_name: createResult.name
  })
  .eq('user_id', userId)
  .eq('provider', provider);
```

---

## 🔧 Setup Instructions

### Step 1: Run Database Migration

```sql
-- In Supabase SQL Editor:
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS n8n_credential_id TEXT,
  ADD COLUMN IF NOT EXISTS n8n_credential_name TEXT;

CREATE INDEX IF NOT EXISTS idx_integrations_n8n_credential_id 
  ON public.integrations(n8n_credential_id);
```

Or run: `migrations/add-n8n-credential-columns.sql`

### Step 2: Verify Environment Variables

Your `.env` already has these (confirmed!):
```env
VITE_GMAIL_CLIENT_ID=your-gmail-client-id-here
VITE_GMAIL_CLIENT_SECRET=GOCSPX-your-gmail-client-secret-here
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id-here
VITE_OUTLOOK_CLIENT_SECRET=your-outlook-client-secret-here
```

### Step 3: Restart Vite Dev Server

```powershell
# Stop current server (Ctrl+C)
npm run dev
```

This loads the environment variables into `import.meta.env`.

### Step 4: Test Deployment

Deploy a workflow and watch for:
```
🔐 Step 1: Creating n8n OAuth credentials...
🔐 Creating n8n OAuth2 credential for outlook...
📤 Sending credential creation request to n8n (endpoint: /rest/credentials)...
✅ n8n credential created: cred_abc123 (Business Outlook)
✅ n8n credentials ready: { outlook: 'cred_abc123' }
✅ Workflow deployed to N8N: xyz789
```

---

## 🚀 Deployment Flow

```
User → Deploy Button
       ↓
   workflowDeployer.deployWorkflow()
       ↓
   Step 1: Create/Reuse n8n Credentials
       ├─ Check if credential exists in integrations table
       ├─ If exists → Reuse credential ID
       └─ If not → POST /rest/credentials to n8n
                   └─ Save credential ID to integrations table
       ↓
   Step 2: Validate deployment readiness
       ↓
   Step 3: Deploy workflow via backend API
       ├─ POST /api/workflows/deploy
       └─ Backend uses n8n_credential_id from integrations
       ↓
   Step 4: Activate workflow
       ↓
   ✅ Fully functional workflow!
```

---

## 🔍 Key Differences from Previous Attempt

| Aspect | ❌ Previous (Wrong) | ✅ Current (Correct) |
|--------|---------------------|----------------------|
| Endpoint | `/api/v1/credentials` | `/rest/credentials` |
| Gmail Type | `gmailOAuth2` | `gmailOAuth2Api` |
| Outlook Type | `microsoftOAuth2Api` | `microsoftOutlookOAuth2Api` |
| Storage | New `n8n_credentials` table | Add columns to `integrations` |
| Credential Reuse | Create new every time | Check existing first |

---

## 🧪 Testing

### Manual Test in Browser Console

```javascript
import { n8nCredentialCreator } from '/src/lib/n8nCredentialCreator.js';

const result = await n8nCredentialCreator.createCredentialsForUser(
  'fedf818f-986f-4b30-bfa1-7fc339c7bb60',
  'Hot Tub Business'
);

console.log('Credentials:', result);
```

### Verify in n8n

1. Go to: `https://n8n.srv995290.hstgr.cloud/credentials`
2. Look for credentials named: `{BusinessName} Gmail` or `{BusinessName} Outlook`
3. Should show "Connected" with green checkmark

### Verify in Supabase

```sql
SELECT 
  provider, 
  n8n_credential_id, 
  n8n_credential_name,
  status
FROM integrations 
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';
```

---

## 🐛 Troubleshooting

### Error: "OAuth client credentials not configured"

**Check in browser console:**
```javascript
console.log(import.meta.env.VITE_GMAIL_CLIENT_ID);
console.log(import.meta.env.VITE_OUTLOOK_CLIENT_ID);
```

If `undefined`, restart Vite dev server.

### Error: 404 from n8n-proxy

**Check endpoint in code:**
```javascript
// ✅ Correct:
await n8nCorsProxy.proxyRequest('/rest/credentials', {...});

// ❌ Wrong:
await n8nCorsProxy.proxyRequest('/api/v1/credentials', {...});
```

### Error: "Failed to create credential"

**Check n8n response:**
```javascript
// In n8nCredentialCreator.js, add logging:
console.log('n8n response:', createResult);
```

Common issues:
- Wrong credential type name
- Missing `nodesAccess` array
- Invalid OAuth tokens

---

## 📚 Reference Files

- `src/lib/n8nCredentialCreator.js` - Credential creation logic
- `src/lib/n8nCredentialManager.js` - Original reference implementation
- `src/lib/workflowDeployer.js` - Integrated deployment flow
- `migrations/add-n8n-credential-columns.sql` - Database schema

---

## ✅ Success Indicators

When working correctly:

```
🔐 Step 1: Creating n8n OAuth credentials...
✅ outlook credential: cred_ZYpQqWY1lVWDd9aM (created new)
✅ Processed 1 n8n credentials
✅ n8n credentials ready: { outlook: 'cred_ZYpQqWY1lVWDd9aM' }
🔍 Step 2: Running pre-deployment validation...
✅ Pre-deployment validation passed
🚀 Step 3: Deploying workflow to N8N...
✅ Backend n8n deployment successful: EfLQpviPzoQ0w2Fk
✅ Workflow deployed to N8N: EfLQpviPzoQ0w2Fk
✅ Workflow is fully active and functional
```

And in n8n, the workflow shows as **Active** with no credential warnings!

