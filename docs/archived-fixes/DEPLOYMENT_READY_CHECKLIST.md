# 🚀 N8N Workflow Deployment - Ready Checklist

## ✅ Template Configuration

### Credential Strategy:
- **Supabase**: ✅ **Hardcoded** `mQziputTJekSuLa6` (shared across all users)
- **OpenAI**: ✅ **Dynamic** `<<<CLIENT_OPENAI_CRED_ID>>>` (rotated per user for scaling)
- **Gmail/Outlook**: ✅ **Dynamic** `<<<CLIENT_GMAIL_CRED_ID>>>` (unique per user)

### Why Dynamic OpenAI Credentials?
Your Edge Function implements **key rotation** to scale beyond API limits:
```javascript
// Edge Function rotates between multiple OpenAI keys
const envKeys = [
  Deno.env.get('OPENAI_KEY_1'),  // Current: NxYVsH1eQ1mfzoW6
  Deno.env.get('OPENAI_KEY_2'),  // Add when scaling
  Deno.env.get('OPENAI_KEY_3'),  // Add when scaling
  Deno.env.get('OPENAI_KEY_4'),  // Add when scaling
  Deno.env.get('OPENAI_KEY_5')   // Add when scaling
];
```

Each user gets assigned to a different OpenAI credential in N8N, balancing load across keys.

---

## 📋 Pre-Deployment Checklist

### 1. ✅ Template Files Created
- [x] `templates/gmail-workflow-template.json` - Production-ready Gmail workflow
- [ ] `templates/outlook-workflow-template.json` - *(Create when needed)*

### 2. ✅ N8N Credentials Verified
Check your N8N instance has these credentials:

```bash
# Supabase (shared)
ID: mQziputTJekSuLa6
Name: supabase-metrics
Type: supabaseApi

# OpenAI Key 1 (first key in rotation)
ID: NxYVsH1eQ1mfzoW6
Name: OpenAI Key 1
Type: openAiApi
```

### 3. ⏳ Edge Function Environment Variables
Verify in Supabase Dashboard → Edge Functions → Secrets:

```bash
# Required
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GMAIL_CLIENT_ID=your-gmail-oauth-client-id
GMAIL_CLIENT_SECRET=your-gmail-oauth-client-secret

# OpenAI Key Rotation (current)
OPENAI_KEY_1=sk-proj-...  # Maps to NxYVsH1eQ1mfzoW6

# OpenAI Keys for Future Scaling (add as needed)
# OPENAI_KEY_2=sk-proj-...
# OPENAI_KEY_3=sk-proj-...
# OPENAI_KEY_4=sk-proj-...
# OPENAI_KEY_5=sk-proj-...
```

### 4. ⏳ Frontend Integration
Create template loader:

**File: `src/lib/n8nTemplateLoader.js`**
```javascript
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

**Update your onboarding/OAuth success handler:**
```javascript
import { loadN8NTemplate } from '@/lib/n8nTemplateLoader';

async function onOAuthSuccess(user, provider) {
  try {
    // Load production template
    const template = await loadN8NTemplate(provider);
    
    // Deploy to N8N via Edge Function
    const response = await supabase.functions.invoke('deploy-n8n', {
      body: {
        userId: user.id,
        emailProvider: provider, // 'gmail' or 'outlook'
        workflowData: template   // ← Production template!
      }
    });
    
    if (response.error) throw response.error;
    
    console.log('✅ Workflow deployed:', response.data);
    toast.success('Email automation activated!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    toast.error(error.message);
  }
}
```

### 5. ⏳ Database Tables
Verify these tables exist in Supabase:

```sql
-- Workflow tracking
workflows (
  id, user_id, n8n_workflow_id, version, status,
  workflow_json, is_functional, issues, last_checked
)

-- Credential mappings
n8n_credential_mappings (
  user_id, gmail_credential_id, outlook_credential_id,
  openai_credential_id, created_at, updated_at
)

-- OpenAI key rotation tracking
openai_keys (
  id, key_ref, status, assigned_clients,
  last_assigned_at, created_at
)

-- Performance metrics
performance_metrics (
  id, client_id, metric_date, metric_name,
  metric_value, dimensions, created_at
)

-- AI learning data
ai_draft_learning (
  id, user_id, thread_id, email_id,
  original_email, ai_draft, classification,
  confidence_score, model_used, created_at
)

-- Error logging
workflow_errors (
  id, user_id, business_name, error_type,
  email_from, email_subject, email_date,
  thread_id, message_id, error_message, created_at
)
```

---

## 🧪 Testing Steps

### Test 1: Check N8N Connection
```javascript
const response = await supabase.functions.invoke('deploy-n8n', {
  body: { userId: 'test-user-id', checkOnly: true }
});

console.log('N8N available:', response.data.available);
// Expected: { success: true, available: true }
```

### Test 2: Deploy Test Workflow
```javascript
const template = await loadN8NTemplate('gmail');

const response = await supabase.functions.invoke('deploy-n8n', {
  body: {
    userId: 'your-test-user-id',
    emailProvider: 'gmail',
    workflowData: template
  }
});

console.log('Deployment result:', response.data);
// Expected: { success: true, workflowId: "123", version: 1 }
```

### Test 3: Verify in N8N Dashboard
1. Open N8N: `https://your-n8n-instance.com`
2. Find workflow: `your-business-name-xxxxx-workflow`
3. Check workflow is **Active** (toggle on)
4. Click "Execute Workflow" to test manually
5. Check execution history for errors

### Test 4: Test Live Email Processing
1. Send test email to connected Gmail account
2. Wait 2 minutes (workflow polls every 2 min)
3. Check N8N execution history
4. Verify Gmail labels were applied
5. Check if AI draft was created (for eligible emails)

---

## 🔄 Scaling: Adding More OpenAI Keys

When you hit rate limits with 100+ users:

### Step 1: Add New OpenAI Key to N8N
1. Go to N8N → Credentials
2. Create new credential:
   - Name: `OpenAI Key 2`
   - Type: `openAiApi`
   - API Key: `sk-proj-...` (new key)
3. Copy the credential ID (e.g., `abc123xyz456`)

### Step 2: Add to Edge Function Environment
```bash
# In Supabase Dashboard → Edge Functions → Secrets
OPENAI_KEY_2=sk-proj-your-new-key-here
```

### Step 3: Update Key Rotation Table (Optional)
```sql
INSERT INTO openai_keys (key_ref, status, assigned_clients)
VALUES ('OpenAI Key 2', 'active', 0);
```

The Edge Function will **automatically**:
1. Detect the new `OPENAI_KEY_2` environment variable
2. Create an N8N credential for it
3. Start assigning new users to it
4. Balance load across all available keys

---

## 🚨 Common Issues & Solutions

### Issue: "Credential not found"
**Solution**: Check credential IDs in N8N match what's in the template

### Issue: "Workflow not triggering"
**Solution**: 
- Verify Gmail OAuth token is valid
- Check N8N cron schedule (should run every 2 min)
- Look for errors in N8N execution history

### Issue: "OpenAI rate limit exceeded"
**Solution**: Add more OpenAI keys following the scaling steps above

### Issue: "Labels not applied to emails"
**Solution**:
1. Check `email_labels` in profiles table
2. Verify Gmail labels exist
3. Check label ID format matches (should be `Label_XXX`)

---

## ✅ Deployment Ready When:

- [x] Template files created with correct credential strategy
- [ ] Edge Function environment variables configured
- [ ] Frontend integration code added
- [ ] Database tables verified
- [ ] N8N credentials confirmed
- [ ] Test deployment successful
- [ ] Live email test successful

---

## 🎯 Next Actions:

1. **Configure Edge Function secrets** in Supabase Dashboard
2. **Add frontend integration code** to load and deploy templates
3. **Run test deployment** with a test user
4. **Monitor first live emails** in N8N execution history
5. **Scale**: Add more OpenAI keys when approaching 100 users

---

**Template Version**: 2.0  
**Last Updated**: 2025-10-12  
**Status**: ✅ Ready for Deployment (pending frontend integration)


