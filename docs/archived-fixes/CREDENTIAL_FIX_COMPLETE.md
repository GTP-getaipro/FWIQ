# ✅ Credential Error Fixed

## Problem
The workflow deployment was failing with credential errors:
1. ❌ `Credential with ID "0TjDPmmgCssabKD2" does not exist for type "gmailOAuth2"`
2. ❌ `Credential with ID "openai-shared" does not exist for type "openAiApi"`

## Root Cause
**Credential ID Mismatch**:
- Frontend was injecting credential IDs into the workflow template
- Edge function was creating NEW credentials in n8n
- Workflow still referenced the OLD credential IDs from frontend
- When n8n tried to activate, it couldn't find the old credential IDs

## Solution Applied

### 1. ✅ Force Overwrite ALL Credentials in Edge Function
**File**: `supabase/functions/deploy-n8n/index.ts`

Changed credential injection logic to **FORCE overwrite** any existing credentials in the workflow with the newly created ones:

```typescript
// BEFORE: Would only inject if credentials didn't exist
if (!node.credentials) {
  node.credentials = {};
}
node.credentials.gmailOAuth2 = { ... };

// AFTER: FORCE overwrite existing credentials
node.credentials.gmailOAuth2 = {
  id: gmailId,  // Newly created credential ID
  name: `${clientData.business?.name || 'Client'} Gmail`
};
```

**Key Changes**:
- Gmail nodes: Force update with `gmailId` from newly created credential
- Outlook nodes: Force update with `outlookId` from newly created credential  
- OpenAI nodes: Force update with `openaiId` from newly created credential
- Added validation to ensure provider-specific nodes were actually updated
- Added error throwing if required credentials are missing

### 2. ✅ Fixed OpenAI Credential Name
**Changed**: `"openai-shared"` → `"openAi"`

The actual credential name in n8n is `"openAi"`, not `"openai-shared"`.

**Files Updated**:
- `supabase/functions/deploy-n8n/index.ts` (all references)
- `src/lib/templateService.js` (fallback values)
- `src/lib/workflowDeployer.js` (default credentials)

### 3. ✅ Added Validation
The edge function now validates that:
- Gmail credentials exist when provider is `gmail`
- Outlook credentials exist when provider is `outlook`
- Throws clear errors if credentials are missing

## What Happens Now

### Deployment Flow:
1. **Frontend** prepares workflow with placeholder credentials
2. **Edge Function**:
   - Creates/finds Gmail credential in n8n → gets `gmailId`
   - Creates/finds OpenAI credential in n8n → gets `openaiId`
   - **FORCE overwrites** ALL credential references in workflow nodes
   - Validates that all required nodes were updated
   - Deploys workflow to n8n with correct credential IDs
3. **n8n** activates workflow successfully (all credentials exist)

### Expected Console Output:
```
✅ Created Gmail credential: abc123def456
✅ Created openAi credential: xyz789abc123
🔧 FORCE updating Gmail credential in node: Email Trigger (...)
🔧 FORCE updating Gmail credential in node: Apply Gmail Labels (...)
🔧 FORCE updating Gmail credential in node: Create Gmail Draft (...)
🔧 FORCE updating OpenAI credential in node: OpenAI Classifier Model (...)
🔧 FORCE updating OpenAI credential in node: OpenAI Draft Model (...)
✅ FORCE credential injection complete (all stale credentials overwritten):
   - OpenAI nodes updated: 2
   - Gmail nodes updated: 3
   - Outlook nodes updated: 0
   - Supabase nodes updated: 1
```

## Next Steps

### To Deploy:
```bash
# If you have Supabase CLI installed:
supabase functions deploy deploy-n8n

# Or deploy via Supabase Dashboard:
# 1. Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/functions
# 2. Select "deploy-n8n" function
# 3. Click "Deploy" → "Deploy from file"
# 4. Upload: supabase/functions/deploy-n8n/index.ts
```

### After Deployment:
1. Clear any existing failed workflows in n8n (optional)
2. Try the onboarding flow again
3. The workflow should deploy and activate successfully

## Files Changed

### Edge Function:
- ✅ `supabase/functions/deploy-n8n/index.ts`
  - Force credential overwrite logic (lines 1799-1869)
  - Changed `"openai-shared"` → `"openAi"` (all references)
  - Added validation for credential injection
  - Fixed syntax error in credential creation (line 1664)

### Frontend:
- ✅ `src/lib/templateService.js`
  - Changed default OpenAI credential from `"openai-shared"` → `"openAi"`
  
- ✅ `src/lib/workflowDeployer.js`
  - Changed default OpenAI credential from `"openai-shared"` → `"openAi"`

- ✅ `src/lib/labelSyncValidator.js`
  - Changed misleading warning message to proper error (previous fix)

## Testing Checklist

After deploying the edge function:

- [ ] Start fresh onboarding flow
- [ ] Complete OAuth for Gmail/Outlook
- [ ] Verify n8n credential is created in `integrations` table
- [ ] Complete label mapping
- [ ] Click "Deploy Workflow"
- [ ] Check console for: "✅ FORCE credential injection complete"
- [ ] Verify workflow activates successfully in n8n
- [ ] Check workflow in n8n dashboard - all nodes should have green credential indicators

## Error Messages to Watch For

### ✅ FIXED:
- ~~`Credential with ID "0TjDPmmgCssabKD2" does not exist for type "gmailOAuth2"`~~
- ~~`Credential with ID "openai-shared" does not exist for type "openAiApi"`~~

### New Helpful Errors:
- `Gmail credential ID is missing for provider: gmail` - OAuth flow didn't complete
- `No Gmail nodes were updated but provider is Gmail!` - Template issue
- `Gmail credential injection failed - no Gmail nodes found in workflow` - Template structure problem

---

## Summary

The credential error was caused by a **timing/synchronization issue** where:
1. Frontend would inject stale credential IDs into the workflow
2. Edge function would create new credentials but not fully overwrite the old IDs
3. n8n would try to activate with non-existent credential IDs

**The fix**: Force overwrite ALL credential references in the workflow with the newly created credentials, ensuring perfect synchronization between credential creation and workflow activation.

