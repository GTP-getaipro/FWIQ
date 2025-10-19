# 🔧 Fix N8N Credentials Issue

## 🚨 **Problem Identified:**

1. **Missing OpenAI Credential**: The workflow is looking for `openai-shared` but it doesn't exist
2. **Duplicate Credentials**: Multiple `supabase-metrics` and Outlook OAuth credentials being created
3. **Workflow Not Activated**: Deployed but not active

## 🎯 **Root Cause:**

The edge function is trying to create the `openai-shared` credential but failing because:
- N8N_API_KEY might not be properly set in Supabase Edge Function secrets
- The credential creation is falling back to using the string `'openai-shared'` instead of the actual credential ID

## 🔧 **Quick Fix Steps:**

### **Step 1: Check N8N API Key in Supabase**

1. Go to Supabase Dashboard → Edge Functions → deploy-n8n → Settings → Secrets
2. Verify `N8N_API_KEY` is set correctly
3. If missing, add it from your n8n instance

### **Step 2: Create OpenAI Credential Manually (Temporary Fix)**

1. Go to n8n dashboard: https://n8n.srv995290.hstgr.cloud
2. Click **Credentials** → **Add Credential**
3. Select **OpenAI**
4. Name: `openai-shared`
5. API Key: Use one of your OpenAI keys
6. Save

### **Step 3: Clean Up Duplicate Credentials**

1. In n8n dashboard, go to **Credentials**
2. Delete duplicate `supabase-metrics` entries (keep only the newest one)
3. Delete old Outlook OAuth credentials (keep only the newest one)

### **Step 4: Activate Workflow**

1. Go to **Workflows** in n8n
2. Find your deployed workflow
3. Click the **Activate** toggle
4. Verify it's now **Active**

### **Step 5: Test Workflow**

1. Send a test email to your connected inbox
2. Check if workflow executes without errors
3. Verify AI draft is created

## 🚀 **Permanent Fix (Update Edge Function):**

The edge function should handle credential creation better. Here's what needs to be improved:

1. **Better Error Handling**: Don't fallback to string IDs
2. **Credential Validation**: Verify credentials exist before using them
3. **Duplicate Prevention**: Check for existing credentials before creating new ones

## 📋 **Current Status:**

- ✅ Edge function deployed
- ✅ Database column added
- ❌ OpenAI credential missing
- ❌ Duplicate credentials
- ❌ Workflow not activated
- ❌ Workflow has errors

## 🎯 **Next Steps:**

1. **Manual credential creation** (5 min) - Quick fix
2. **Clean up duplicates** (2 min)
3. **Activate workflow** (1 min)
4. **Test email processing** (5 min)

**Total time to fix: ~13 minutes**

---

## 🔍 **Verification Commands:**

After fixing, verify with these checks:

```sql
-- Check credential mappings
SELECT user_id, gmail_credential_id, outlook_credential_id, openai_credential_id
FROM n8n_credential_mappings
WHERE user_id = 'YOUR_USER_ID';

-- Check workflows
SELECT user_id, n8n_workflow_id, version, status, active
FROM workflows
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

**The system will work perfectly once these credential issues are resolved!** 🚀

