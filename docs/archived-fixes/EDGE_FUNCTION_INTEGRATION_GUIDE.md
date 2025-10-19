# 🚀 Edge Function Integration Guide
## Supabase Edge Function + Frontend Integration Complete

### ✅ **Completed Tasks**

#### 1. **Edge Function Updated** ✅
**File**: `supabase/functions/deploy-n8n/index.ts`

**New Features**:
- ✅ Comprehensive `generateDynamicAISystemMessage` function
  - Fetches complete business profile from database
  - Includes team members, suppliers, services
  - Phone provider integration rules
  - CRM alert handling
  - Dynamic category structures with tertiary banking subcategories
  
- ✅ Voice Training Integration
  - Fetches learned communication styles from `communication_styles` table
  - Injects empathy, formality, and directness levels
  - Adds signature phrases from voice learning
  - Personalizes AI replies based on analyzed edits
  
- ✅ Enhanced Credential Management
  - Gmail/Outlook OAuth2 credential creation
  - OpenAI key rotation (5 keys with round-robin)
  - Supabase metrics credential handling
  - Credential mapping storage in `n8n_credential_mappings`

- ✅ Workflow Deployment Logic
  - Creates/updates workflows in N8N
  - Auto-activates workflows
  - Proper versioning system
  - Archives old versions

#### 2. **Frontend Integration Updated** ✅
**File**: `src/lib/workflowDeployer.js`

**New Deployment Flow**:
```javascript
1. Try Edge Function first (Recommended)
   └─ https://[SUPABASE_URL]/functions/v1/deploy-n8n
   
2. Fallback to Backend API (if Edge Function fails)
   └─ http://localhost:3001/api/workflows/deploy
```

**Key Changes**:
- Dual deployment method support
- Automatic fallback mechanism
- Deployment method tracking (`deploymentMethod` field)
- Enhanced error reporting

---

### 📋 **Remaining Tasks**

#### **Task 1: Configure Edge Function Secrets** 🔐
**Status**: ⏳ Pending

**Required Secrets** (via Supabase CLI or Dashboard):
```bash
# Core N8N Configuration
supabase secrets set N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
supabase secrets set N8N_API_KEY=eyJhbGciOiJIUzI1NiIs... (your full JWT)

# OpenAI Key Rotation (for multi-tenant load balancing)
supabase secrets set OPENAI_KEY_1=sk-proj-...
supabase secrets set OPENAI_KEY_2=sk-proj-...
supabase secrets set OPENAI_KEY_3=sk-proj-...
supabase secrets set OPENAI_KEY_4=sk-proj-...
supabase secrets set OPENAI_KEY_5=sk-proj-...

# Gmail OAuth Credentials
supabase secrets set GMAIL_CLIENT_ID=896fec20-bae5-4459-8c04-45c33ee7304a
supabase secrets set GMAIL_CLIENT_SECRET=<your-gmail-client-secret>

# Outlook OAuth Credentials (if supporting Outlook)
supabase secrets set OUTLOOK_CLIENT_ID=<your-outlook-client-id>
supabase secrets set OUTLOOK_CLIENT_SECRET=<your-outlook-client-secret>

# Supabase Configuration (usually auto-configured)
# supabase secrets set SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
# supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Commands**:
```powershell
# View current secrets
supabase secrets list

# Set a secret
supabase secrets set SECRET_NAME=secret_value

# Unset a secret (if needed)
supabase secrets unset SECRET_NAME
```

---

#### **Task 2: Deploy Edge Function** 🚀
**Status**: ⏳ Pending

**Deployment Command**:
```powershell
# Navigate to project root
cd C:\FWIQv2

# Deploy the edge function
supabase functions deploy deploy-n8n

# Verify deployment
supabase functions list
```

**Expected Output**:
```
deploy-n8n (v1)
├── URL: https://oinxzvqszingwstrbdro.supabase.co/functions/v1/deploy-n8n
├── Status: Active
└── Updated: <timestamp>
```

**Testing the Deployment**:
```powershell
# Test with a simple health check
curl -X POST `
  https://oinxzvqszingwstrbdro.supabase.co/functions/v1/deploy-n8n `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" `
  -d '{"userId":"test-user-id","checkOnly":true}'
```

---

#### **Task 3: Verify Database Schema** 🗄️
**Status**: ⏳ Pending

**Required Tables/Columns**:

##### **Table: `communication_styles`**
```sql
CREATE TABLE IF NOT EXISTS communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  style_profile JSONB NOT NULL,
  learning_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Sample style_profile structure:
{
  "voice": {
    "empathyLevel": 0.7,
    "formalityLevel": 0.8,
    "directnessLevel": 0.8,
    "confidence": 0.5,
    "vocabulary": ["word1", "word2"],
    "signOff": "Best regards,\nThe Team"
  },
  "signaturePhrases": [
    {
      "phrase": "I'd be happy to help",
      "confidence": 0.9,
      "context": "support"
    }
  ]
}
```

##### **Table: `n8n_credential_mappings`**
```sql
CREATE TABLE IF NOT EXISTS n8n_credential_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_credential_id TEXT,
  outlook_credential_id TEXT,
  openai_credential_id TEXT,
  openai_key_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

##### **Table: `workflows` (updated columns)**
```sql
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS is_functional BOOLEAN DEFAULT false;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS issues JSONB DEFAULT '[]';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE;
```

**Verification Script**:
```sql
-- Check if required tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('communication_styles', 'n8n_credential_mappings', 'workflows')
ORDER BY table_name;

-- Check communication_styles table
SELECT COUNT(*) as total_profiles FROM communication_styles;

-- Check n8n_credential_mappings table
SELECT COUNT(*) as total_mappings FROM n8n_credential_mappings;

-- Check workflows columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflows'
  AND column_name IN ('is_functional', 'issues', 'last_checked');
```

---

#### **Task 4: End-to-End Testing** 🧪
**Status**: ⏳ Pending

**Test Scenario**:
1. **Complete Onboarding Flow**:
   - Create new user account
   - Complete business type selection (e.g., "Hot tub & Spa")
   - Connect Outlook/Gmail via OAuth
   - Add team members (managers, suppliers)
   - Complete voice training (optional)
   - Deploy workflow

2. **Verify Edge Function is Called**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Filter by "deploy"
   - Complete onboarding
   - Look for request to `functions/v1/deploy-n8n`

3. **Verify Workflow in N8N**:
   - Login to N8N: https://n8n.srv995290.hstgr.cloud
   - Check for newly created workflow
   - Verify it's active (green toggle)
   - Check workflow nodes contain correct credentials

4. **Verify Database Records**:
   ```sql
   -- Check workflow was saved
   SELECT 
     w.id,
     w.n8n_workflow_id,
     w.version,
     w.status,
     w.is_functional,
     w.created_at
   FROM workflows w
   WHERE w.user_id = 'YOUR_USER_ID'
   ORDER BY w.created_at DESC
   LIMIT 1;
   
   -- Check credential mapping
   SELECT 
     ncm.gmail_credential_id,
     ncm.outlook_credential_id,
     ncm.openai_credential_id
   FROM n8n_credential_mappings ncm
   WHERE ncm.user_id = 'YOUR_USER_ID';
   ```

5. **Test Fallback Mechanism**:
   - Temporarily disable Edge Function (via Supabase dashboard)
   - Complete onboarding flow again
   - Verify backend API is called instead
   - Check console logs for fallback message

**Expected Console Logs**:
```
🔹 Attempting deployment via Supabase Edge Function...
✅ Edge Function deployment successful: JKp1676vS7cSdKOF
```

**Or (if Edge Function unavailable)**:
```
🔹 Attempting deployment via Supabase Edge Function...
⚠️ Edge Function deployment failed, falling back to backend API: ...
🔹 Attempting deployment via Backend API...
✅ Backend API deployment successful: JKp1676vS7cSdKOF
```

---

### 🔍 **Key Differences: Edge Function vs Backend API**

| Feature | Edge Function | Backend API |
|---------|--------------|-------------|
| **Location** | Supabase Cloud (Deno) | Your VPS (Node.js) |
| **Scaling** | Auto-scales | Manual scaling |
| **Cold Start** | ~50-200ms | None (always hot) |
| **Dependencies** | Deno std library | Full Node.js ecosystem |
| **Voice Training** | ✅ Integrated | ⚠️ Partial |
| **OpenAI Key Rotation** | ✅ Built-in (5 keys) | ❌ Not implemented |
| **Credential Management** | ✅ Full N8N integration | ✅ Basic |
| **Cost** | Pay-per-invocation | Fixed VPS cost |

---

### 🎯 **Recommended Deployment Strategy**

#### **Phase 1: Testing** (Current)
- Deploy Edge Function with secrets
- Test with development/staging users
- Monitor Edge Function logs in Supabase
- Keep backend API as fallback

#### **Phase 2: Gradual Rollout**
- Enable Edge Function for 10% of users
- Monitor performance and error rates
- Compare costs vs backend API
- Adjust OpenAI key rotation if needed

#### **Phase 3: Full Production**
- Route all users to Edge Function
- Keep backend API for emergency fallback only
- Set up monitoring and alerts
- Document any edge cases

---

### 📊 **Monitoring & Debugging**

#### **Supabase Edge Function Logs**:
```powershell
# View real-time logs
supabase functions logs deploy-n8n --tail

# View recent logs
supabase functions logs deploy-n8n --limit 100
```

#### **Check Edge Function Invocations**:
```sql
-- Query edge function stats (if available in your Supabase plan)
SELECT 
  date_trunc('hour', timestamp) as hour,
  COUNT(*) as invocations,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(*) FILTER (WHERE status_code = 200) as successful,
  COUNT(*) FILTER (WHERE status_code >= 400) as errors
FROM edge_function_logs
WHERE function_name = 'deploy-n8n'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

#### **Frontend Debugging**:
```javascript
// In browser console during workflow deployment
localStorage.setItem('DEBUG_WORKFLOW_DEPLOYMENT', 'true');

// This will enable verbose logging in workflowDeployer.js
```

---

### 🚨 **Troubleshooting**

#### **Issue 1: Edge Function Returns 401 Unauthorized**
**Cause**: Missing or invalid `N8N_API_KEY`

**Solution**:
```powershell
# Verify secret is set
supabase secrets list | grep N8N_API_KEY

# If missing, set it
supabase secrets set N8N_API_KEY=<your-full-jwt-token>

# Redeploy edge function
supabase functions deploy deploy-n8n
```

#### **Issue 2: Edge Function Returns 500 Internal Server Error**
**Cause**: Missing required database tables or columns

**Solution**:
```sql
-- Run schema verification script (see Task 3)
-- Create missing tables/columns

-- Then test again
```

#### **Issue 3: Frontend Always Uses Backend API**
**Cause**: `VITE_SUPABASE_URL` not configured

**Solution**:
```env
# In .env file
VITE_SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
```

Then restart Vite dev server:
```powershell
# Kill existing process
# Restart
npm run dev
```

#### **Issue 4: OpenAI Key Rotation Not Working**
**Cause**: Missing `OPENAI_KEY_1` through `OPENAI_KEY_5` secrets

**Solution**:
```powershell
# Set all 5 keys
supabase secrets set OPENAI_KEY_1=sk-proj-...
supabase secrets set OPENAI_KEY_2=sk-proj-...
supabase secrets set OPENAI_KEY_3=sk-proj-...
supabase secrets set OPENAI_KEY_4=sk-proj-...
supabase secrets set OPENAI_KEY_5=sk-proj-...

# Redeploy
supabase functions deploy deploy-n8n
```

---

### 📚 **Additional Resources**

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Deploy Documentation](https://docs.deno.com/deploy/manual)
- [N8N API Documentation](https://docs.n8n.io/api/)
- [OpenAI API Key Best Practices](https://platform.openai.com/docs/api-reference/authentication)

---

### ✅ **Next Steps Checklist**

- [ ] **Configure Edge Function secrets** (Task 1)
- [ ] **Deploy Edge Function to Supabase** (Task 2)
- [ ] **Verify database schema** (Task 3)
- [ ] **Run end-to-end test** (Task 4)
- [ ] **Monitor Edge Function logs** for first few deployments
- [ ] **Document any issues** encountered
- [ ] **Update `.env.example`** with new required variables

---

### 🎉 **Integration Summary**

**What's Working**:
- ✅ Edge Function has comprehensive voice training integration
- ✅ Frontend automatically tries Edge Function first
- ✅ Automatic fallback to backend API
- ✅ Enhanced credential management
- ✅ OpenAI key rotation support

**What Needs Configuration**:
- ⏳ Edge Function secrets (N8N_API_KEY, OpenAI keys, etc.)
- ⏳ Edge Function deployment to Supabase
- ⏳ Database schema verification
- ⏳ End-to-end testing

**Estimated Time to Complete**: 30-45 minutes

---

**Last Updated**: 2025-10-12  
**Version**: 1.0  
**Status**: Integration Complete, Pending Deployment & Testing

