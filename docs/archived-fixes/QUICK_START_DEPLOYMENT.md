# 🚀 Quick Start: Deploy N8N Workflows

## ✅ You're Ready!

Everything is set up. Now you just need to integrate into your app.

---

## 📝 3 Steps to Go Live

### Step 1: Copy Template to Public Folder (30 seconds)

The template needs to be accessible via HTTP:

```bash
# Option A: If using Next.js
cp templates/gmail-workflow-template.json public/templates/

# Option B: If using Vite/React
cp templates/gmail-workflow-template.json public/templates/

# Option C: If using custom setup
# Make sure templates/ is served as static files
```

### Step 2: Find Your OAuth Success Handler (2 minutes)

Look for where you handle successful Gmail/Outlook OAuth. It might be in:
- `src/pages/auth/callback.jsx`
- `src/lib/oauthHandler.js`
- `src/components/OAuth.jsx`
- Wherever you store the `refresh_token`

### Step 3: Add Workflow Deployment (3 lines of code!)

```javascript
import { deployWorkflowForUser } from '@/lib/n8nTemplateLoader';

// In your OAuth success handler:
async function onOAuthSuccess(user, tokens) {
  // ... your existing code to save tokens ...
  
  // Add these 3 lines:
  const result = await deployWorkflowForUser(supabase, user.id, 'gmail');
  console.log('✅ Workflow deployed:', result.workflowId);
  toast.success('Email automation activated!');
}
```

---

## 🎯 Complete Integration Example

Here's a complete example showing where to add the deployment:

```javascript
// src/lib/oauthHandler.js (or wherever your OAuth logic lives)

import { supabase } from './supabaseClient';
import { deployWorkflowForUser } from './n8nTemplateLoader';

export async function handleGoogleOAuthCallback(code) {
  try {
    // 1. Exchange code for tokens (your existing logic)
    const tokens = await exchangeCodeForTokens(code);
    
    // 2. Get user info
    const user = supabase.auth.user();
    if (!user) throw new Error('User not authenticated');
    
    // 3. Save tokens to database (your existing logic)
    await supabase.from('integrations').upsert({
      user_id: user.id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      status: 'active'
    });
    
    // 4. 🆕 Deploy N8N workflow with production template
    console.log('🚀 Deploying N8N workflow...');
    const workflowResult = await deployWorkflowForUser(
      supabase, 
      user.id, 
      'gmail'
    );
    
    console.log('✅ Workflow deployed successfully!', {
      workflowId: workflowResult.workflowId,
      version: workflowResult.version
    });
    
    // 5. Show success message
    return {
      success: true,
      message: 'Gmail connected and automation activated!',
      workflowId: workflowResult.workflowId
    };
    
  } catch (error) {
    console.error('OAuth or deployment failed:', error);
    throw error;
  }
}
```

---

## 🧪 Testing Your Integration

### Test 1: Check Template Loading

Open browser console:
```javascript
import { loadN8NTemplate } from './lib/n8nTemplateLoader';

const template = await loadN8NTemplate('gmail');
console.log('Template loaded:', template.nodes.length, 'nodes');
// Expected: "Template loaded: 21 nodes"
```

### Test 2: Test Deployment (Use a Test User!)

```javascript
import { deployWorkflowForUser } from './lib/n8nTemplateLoader';
import { supabase } from './lib/supabaseClient';

// Get your test user ID
const user = supabase.auth.user();

// Deploy workflow
const result = await deployWorkflowForUser(supabase, user.id, 'gmail');
console.log('Result:', result);

// Expected output:
// {
//   success: true,
//   workflowId: "123",
//   version: 1,
//   provider: "gmail"
// }
```

### Test 3: Verify in N8N

1. Open your N8N instance
2. Look for a new workflow named like: `your-business-name-xxxxx-workflow`
3. Click on it to open
4. Check that it's **Active** (toggle should be on/green)
5. Click "Execute Workflow" to test manually

### Test 4: Test Live Email

1. Send a test email to the connected Gmail account
2. Wait 2-3 minutes (workflow polls every 2 minutes)
3. Go to N8N → Executions
4. Look for a recent execution
5. Check if it succeeded and applied labels

---

## 🎨 UI Enhancement (Optional)

Add a nice status indicator to your onboarding:

```jsx
function OnboardingSteps() {
  const [currentStep, setCurrentStep] = useState('oauth');
  const [workflowId, setWorkflowId] = useState(null);

  const handleOAuthSuccess = async (tokens) => {
    // Save tokens...
    
    // Deploy workflow
    setCurrentStep('deploying');
    try {
      const result = await deployWorkflowForUser(supabase, user.id, 'gmail');
      setWorkflowId(result.workflowId);
      setCurrentStep('complete');
    } catch (error) {
      setCurrentStep('error');
    }
  };

  return (
    <div>
      <Step 
        status={currentStep === 'oauth' ? 'active' : 'complete'}
        title="Connect Gmail"
      />
      
      <Step 
        status={
          currentStep === 'deploying' ? 'active' :
          currentStep === 'complete' ? 'complete' : 'pending'
        }
        title="Activate Automation"
      />
      
      {currentStep === 'complete' && (
        <SuccessMessage>
          🎉 Email automation is now active!
          <br />
          Workflow ID: {workflowId}
        </SuccessMessage>
      )}
    </div>
  );
}
```

---

## 🔧 Environment Variables (Verify These)

Make sure these are set in Supabase → Edge Functions → Secrets:

```bash
# N8N Configuration
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# Supabase (should already be set)
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gmail OAuth (should already be set)
GMAIL_CLIENT_ID=your-gmail-oauth-client-id
GMAIL_CLIENT_SECRET=your-gmail-oauth-client-secret

# OpenAI Key Rotation
OPENAI_KEY_1=sk-proj-...  # Your current key

# Future keys (add when scaling):
# OPENAI_KEY_2=sk-proj-...
# OPENAI_KEY_3=sk-proj-...
```

---

## 🚨 Troubleshooting

### "Failed to load template"
**Solution**: Make sure `templates/gmail-workflow-template.json` is in your public folder

### "N8N service not available"
**Solution**: 
1. Check `N8N_BASE_URL` environment variable
2. Verify `N8N_API_KEY` is correct
3. Test N8N API manually: `curl https://your-n8n.com/api/v1/workflows -H "X-N8N-API-KEY: your-key"`

### "Credential not found"
**Solution**: 
1. Verify OpenAI credential exists in N8N with ID `NxYVsH1eQ1mfzoW6`
2. Verify Supabase credential exists with ID `mQziputTJekSuLa6`

### "Workflow deploys but doesn't trigger"
**Solution**:
1. Check Gmail OAuth tokens are valid
2. Verify workflow is Active in N8N
3. Check N8N execution history for errors

---

## 📊 Monitoring

After deployment, monitor these:

1. **N8N Dashboard**
   - Workflow executions
   - Success/failure rate
   - Execution time

2. **Supabase Database**
   ```sql
   -- Check workflows table
   SELECT * FROM workflows WHERE status = 'active';
   
   -- Check credential mappings
   SELECT * FROM n8n_credential_mappings;
   
   -- Check performance metrics
   SELECT * FROM performance_metrics ORDER BY created_at DESC LIMIT 10;
   ```

3. **Browser Console**
   - Template loading logs
   - Deployment success/errors
   - Network requests to Edge Function

---

## ✅ Success Criteria

You'll know it's working when:

- [ ] Template loads without errors
- [ ] Deployment returns `{ success: true, workflowId: "..." }`
- [ ] Workflow appears in N8N dashboard
- [ ] Workflow status is "Active" in N8N
- [ ] Test email triggers the workflow
- [ ] Labels are applied to Gmail emails
- [ ] (If eligible) AI draft is created

---

## 🎯 Next Steps After First Deployment

1. **Monitor first few emails** - Check execution history in N8N
2. **Adjust AI prompts** - Fine-tune classification rules if needed
3. **Add more email providers** - Create Outlook template when ready
4. **Scale OpenAI keys** - Add `OPENAI_KEY_2` when approaching limits
5. **Enable features** - Turn on AI reply generation for specific categories

---

## 📞 Need Help?

Check these resources:
1. `DEPLOYMENT_READY_CHECKLIST.md` - Complete deployment guide
2. `N8N_WORKFLOW_TEMPLATE_INTEGRATION_GUIDE.md` - Architecture details
3. `src/examples/oauth-workflow-integration.js` - More examples
4. N8N execution logs - First place to check for errors
5. Supabase Edge Function logs - For deployment issues

---

**🚀 You're ready to deploy! Start with Step 1 above.**


