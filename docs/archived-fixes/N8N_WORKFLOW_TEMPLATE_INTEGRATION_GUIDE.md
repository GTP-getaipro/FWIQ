# N8N Workflow Template Integration Guide

## Overview
This guide explains how to integrate the production-ready N8N workflow templates with your existing Deno Edge Function (`supabase/functions/deploy-n8n/index.ts`).

## Current N8N Credential IDs
- **Supabase**: `mQziputTJekSuLa6`
- **OpenAI**: `NxYVsH1eQ1mfzoW6`

## Template Files
- **Gmail**: `templates/gmail-workflow-template.json`
- **Outlook**: *(To be created - similar to Gmail with Outlook-specific nodes)*

## Integration Options

### ✅ Option 1: Frontend Sends Pre-Loaded Template (Recommended)
The cleanest approach - your frontend loads the template and sends it to the Edge Function.

#### Implementation:

**1. Create a Template Loader in Your Frontend:**

```javascript
// src/lib/n8nTemplateLoader.js

export async function loadN8NTemplate(provider = 'gmail') {
  const templatePath = provider === 'outlook' 
    ? '/templates/outlook-workflow-template.json'
    : '/templates/gmail-workflow-template.json';
  
  const response = await fetch(templatePath);
  if (!response.ok) {
    throw new Error(`Failed to load ${provider} template`);
  }
  
  return await response.json();
}
```

**2. Update Your Workflow Deployment Function:**

```javascript
// src/lib/n8nDeployment.js (or wherever you call the Edge Function)

import { loadN8NTemplate } from './n8nTemplateLoader';

export async function deployWorkflowForUser(userId, emailProvider = 'gmail') {
  // Load the appropriate template
  const workflowTemplate = await loadN8NTemplate(emailProvider);
  
  // Call the Edge Function with the pre-loaded template
  const response = await fetch('/functions/v1/deploy-n8n', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`
    },
    body: JSON.stringify({
      userId: userId,
      emailProvider: emailProvider, // 'gmail' or 'outlook'
      workflowData: workflowTemplate // Send the pre-loaded template
    })
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Workflow deployment failed: ${result.error}`);
  }
  
  return result;
}
```

**3. Call From Your Onboarding Flow:**

```javascript
// During user onboarding or OAuth completion

import { deployWorkflowForUser } from '@/lib/n8nDeployment';

// After successful Gmail/Outlook OAuth
async function onOAuthSuccess(user, provider) {
  try {
    console.log(`✅ OAuth successful for ${provider}, deploying N8N workflow...`);
    
    const result = await deployWorkflowForUser(user.id, provider);
    
    console.log(`✅ Workflow deployed successfully:`, result);
    console.log(`   - Workflow ID: ${result.workflowId}`);
    console.log(`   - Version: ${result.version}`);
    
    // Show success message to user
    toast.success(`Email automation activated for ${provider}!`);
    
  } catch (error) {
    console.error(`❌ Workflow deployment failed:`, error);
    toast.error(`Failed to activate automation: ${error.message}`);
  }
}
```

---

### Option 2: Store Templates in Supabase Storage
Store templates in Supabase Storage and load them from the Edge Function.

#### Implementation:

**1. Upload Templates to Supabase Storage:**

```bash
# Upload via Supabase CLI or Dashboard
supabase storage cp templates/gmail-workflow-template.json supabase://n8n-templates/gmail-v2.json
supabase storage cp templates/outlook-workflow-template.json supabase://n8n-templates/outlook-v2.json
```

**2. Modify Edge Function to Load from Storage:**

```typescript
// In supabase/functions/deploy-n8n/index.ts

async function loadWorkflowTemplate(businessType: string, emailProvider = 'gmail') {
  const templateName = emailProvider === 'outlook' 
    ? 'outlook-v2.json' 
    : 'gmail-v2.json';
  
  // Download from Supabase Storage
  const { data, error } = await supabaseAdmin
    .storage
    .from('n8n-templates')
    .download(templateName);
  
  if (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    // Fallback to embedded template
    return getEmbeddedTemplate(emailProvider);
  }
  
  const text = await data.text();
  return JSON.parse(text);
}
```

---

### Option 3: Embed Template in Edge Function
Replace the `loadWorkflowTemplate()` function in the Edge Function with the full production template.

⚠️ **Note**: You mentioned not changing the function, but this would be the most self-contained approach.

---

## Template Placeholders

The templates use placeholder tokens that get replaced by the Edge Function's `injectOnboardingData()` function:

### Business Information
- `<<<BUSINESS_NAME>>>` - Client's business name
- `<<<EMAIL_DOMAIN>>>` - Client's email domain (e.g., "thehottubman.ca")
- `<<<CONFIG_VERSION>>>` - Workflow version number
- `<<<USER_ID>>>` - Client's Supabase user ID

### Credentials
- `<<<CLIENT_GMAIL_CRED_ID>>>` - Gmail OAuth2 credential ID
- `<<<CLIENT_OUTLOOK_CRED_ID>>>` - Outlook OAuth2 credential ID (for Outlook templates)
- `<<<CLIENT_OPENAI_CRED_ID>>>` - OpenAI API credential ID (default: `NxYVsH1eQ1mfzoW6`)
- `<<<CLIENT_SUPABASE_CRED_ID>>>` - Supabase API credential ID (default: `mQziputTJekSuLa6`)

### AI Configuration
- `<<<AI_SYSTEM_MESSAGE>>>` - Complete AI classification system message (generated dynamically)
- `<<<BEHAVIOR_REPLY_PROMPT>>>` - AI reply behavior prompt with voice training

### Email Labels/Categories
- `<<<LABEL_MAPPINGS>>>` - JSON object mapping categories to label IDs
- `<<<LABEL_URGENT_ID>>>` - Gmail label ID for URGENT
- `<<<LABEL_SALES_ID>>>` - Gmail label ID for SALES
- `<<<LABEL_SUPPORT_ID>>>` - Gmail label ID for SUPPORT
- *(And many more dynamic label IDs)*

### Timestamps
- `<<<CURRENT_TIMESTAMP>>>` - ISO timestamp for workflow creation

---

## How The Edge Function Works

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Frontend calls Edge Function with userId                    │
│     - Optionally includes workflowData (pre-loaded template)    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Edge Function fetches client data from Supabase:            │
│     - Business profile (client_config)                          │
│     - Email labels                                               │
│     - Managers & suppliers                                       │
│     - Voice profile (communication_styles)                       │
│     - OAuth tokens (integrations table)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Edge Function ensures N8N credentials exist:                 │
│     - Gmail/Outlook OAuth2 (creates if missing)                  │
│     - OpenAI API (uses shared: NxYVsH1eQ1mfzoW6)                │
│     - Supabase API (uses shared: mQziputTJekSuLa6)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. If workflowData provided:                                    │
│     ✅ Use pre-loaded template (Option 1)                        │
│                                                                  │
│  4. If workflowData NOT provided:                               │
│     ⚠️  Falls back to loadWorkflowTemplate() (current simple)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Edge Function calls injectOnboardingData():                  │
│     - Replaces all <<<PLACEHOLDERS>>> with actual data          │
│     - Generates dynamic AI system message                        │
│     - Builds voice-trained behavior prompt                       │
│     - Maps email labels to Gmail/Outlook IDs                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Edge Function iterates through workflow nodes:               │
│     - Injects credential IDs into each node                      │
│     - Updates node names with business name                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Edge Function deploys to N8N:                                │
│     - Creates new workflow OR updates existing                   │
│     - Activates workflow                                         │
│     - Saves workflow record to Supabase workflows table          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Returns success response with:                               │
│     - workflowId (N8N workflow ID)                               │
│     - version (workflow version number)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Your Integration

### 1. Test Workflow Deployment

```javascript
// Test from browser console or integration test

const testDeployment = async () => {
  const userId = 'your-test-user-id';
  
  const response = await fetch('/functions/v1/deploy-n8n', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourSupabaseToken}`
    },
    body: JSON.stringify({
      userId: userId
    })
  });
  
  const result = await response.json();
  console.log('Deployment result:', result);
};

testDeployment();
```

### 2. Verify in N8N Dashboard

1. Open your N8N instance: `https://your-n8n-url.com`
2. Check for a workflow named: `your-business-name-xxxxx-workflow`
3. Verify the workflow is **active** (toggle should be on)
4. Click "Execute Workflow" to test manually

### 3. Test Email Processing

1. Send a test email to the connected Gmail/Outlook account
2. Wait for the N8N workflow to trigger (runs every 2 minutes)
3. Check N8N execution history
4. Verify labels were applied correctly in Gmail/Outlook
5. Check if AI draft was created (if `ai_can_reply` was true)

---

## Troubleshooting

### Issue: Workflow deploys but doesn't trigger
**Solution**: Check N8N cron schedule and Gmail/Outlook polling settings

### Issue: Credentials not working
**Solution**: 
1. Verify credential IDs in N8N dashboard
2. Check OAuth tokens haven't expired
3. Re-run OAuth flow if needed

### Issue: AI classification not working
**Solution**:
1. Verify OpenAI credential ID (`NxYVsH1eQ1mfzoW6`)
2. Check OpenAI API key balance
3. Review N8N execution logs for errors

### Issue: Labels not applied
**Solution**:
1. Check `email_labels` in profiles table
2. Verify Gmail labels exist
3. Check label ID format (should be `Label_XXX`)

---

## Next Steps

1. ✅ **Option 1 (Recommended)**: Implement frontend template loading
2. 📝 Create Outlook template variant
3. 🧪 Test with real client data
4. 📊 Monitor N8N execution logs
5. 🔄 Set up template versioning for updates

---

## Support

For questions or issues:
- Check N8N execution logs
- Review Supabase Edge Function logs
- Verify all credentials are active in N8N

---

**Template Version**: 2.0  
**Last Updated**: 2025-10-12  
**Compatible with**: N8N v1.x, Supabase Edge Functions, Deno 1.x


