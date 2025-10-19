# 🚀 Deployment Steps - Edge Function & Backend

## ✅ Current Status

**Code Changes Complete:**
- ✅ Frontend: Clean JSON payload, no `active` field
- ✅ Backend: Strips `active` field from incoming data
- ✅ Edge Function: Strips `active` field + credential injection fixed
- ✅ Application servers restarted

**What Needs Deployment:**
- ⏳ Edge Function (still running old version on Supabase)
- ✅ Backend API (restarted with latest code)
- ✅ Frontend (running on http://localhost:5173)

---

## 📋 Deployment Checklist

### Step 1: Deploy Edge Function to Supabase

The Edge Function (`supabase/functions/deploy-n8n/index.ts`) contains all the fixes but needs to be deployed.

#### Option A: Via Supabase Dashboard (Recommended - No CLI needed)

1. **Go to:** https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/functions
2. **Click:** `deploy-n8n` function
3. **Click:** "Deploy new version" or "Edit"
4. **Copy & Paste:** The contents of `supabase/functions/deploy-n8n/index.ts`
5. **Click:** "Deploy"

#### Option B: Via Supabase CLI (Requires login)

```bash
# Login to Supabase
npx supabase login

# Deploy the function
npx supabase functions deploy deploy-n8n --project-ref oinxzvqszingwstrbdro

# Verify deployment
npx supabase functions list
```

#### Option C: Use Access Token (If you have it)

```powershell
# Set environment variable
$env:SUPABASE_ACCESS_TOKEN="your-access-token-here"

# Deploy
npx supabase functions deploy deploy-n8n --project-ref oinxzvqszingwstrbdro
```

---

### Step 2: Verify Edge Function Deployment

After deploying, check the logs to confirm the new version is running:

```bash
npx supabase functions logs deploy-n8n --tail
```

Or in the Supabase Dashboard:
- Go to: Functions → deploy-n8n → Logs
- Look for recent deployment timestamp

---

### Step 3: Test the Deployment

#### Test via Frontend (Recommended)

1. **Open:** http://localhost:5173
2. **Complete:** Onboarding wizard steps
3. **Click:** "Deploy Automation" button
4. **Watch console** for:
   ```
   🔧 Step 4: Preparing deployment payload for Edge Function...
   🚀 Step 5: Deploying workflow to n8n...
   🔹 Attempting deployment via Supabase Edge Function...
   ✅ Edge Function deployment successful: [workflow-id]
   ```

#### Test via cURL (Direct Edge Function test)

```bash
# Get your auth token from browser console:
# localStorage.getItem('sb-oinxzvqszingwstrbdro-auth-token')

curl -X POST https://oinxzvqszingwstrbdro.supabase.co/functions/v1/deploy-n8n \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN_HERE" \
  -d '{
    "userId": "fedf818f-986f-4b30-bfa1-7fc339c7bb60",
    "emailProvider": "gmail",
    "deployToN8n": true,
    "checkOnly": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "workflowId": "123",
  "version": 1
}
```

---

### Step 4: Verify Backend API

The backend is already running with the latest code on port 3001.

**Test it:**
```powershell
# Check if backend is responding
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "uptime": 123
}
```

---

## 🐛 Troubleshooting

### Issue 1: Edge Function returns 500 with JSON parse error

**Cause:** Old version of Edge Function still deployed
**Solution:** Deploy Edge Function using Step 1 above

### Issue 2: "active is read-only" error

**Cause:** Old version of Edge Function or backend still deployed
**Solution:** 
1. Deploy Edge Function (Step 1)
2. Restart backend (already done ✅)

### Issue 3: "Missing credentials" in n8n workflow

**Cause:** Old Edge Function without credential injection fix
**Solution:** Deploy Edge Function (Step 1)

### Issue 4: Cannot deploy via CLI - "Access token not provided"

**Solution:** Use Option A (Dashboard) instead of CLI

---

## 🔍 Verification Checklist

After deployment, verify these in n8n UI (https://n8n.srv995290.hstgr.cloud):

- [ ] Workflow exists with correct name
- [ ] **Gmail Trigger node** has credentials selected
- [ ] **Gmail action nodes** have credentials selected
- [ ] **OpenAI nodes** have credentials selected
- [ ] **Workflow is active** (toggle is ON)
- [ ] No red "Missing credentials" warnings

---

## 📊 What Each Fix Does

### Frontend Fix (`src/lib/workflowDeployer.js`)

**Lines 391-397:** Clean minimal payload
```javascript
const deploymentPayload = {
  userId: userId,
  emailProvider: provider,
  deployToN8n: true,
  checkOnly: false
};
// ✅ No undefined values, no circular refs, clean JSON
```

**Line 895:** No `active` field in workflow
```javascript
const workflowPayload = {
  name: workflowData.name,
  nodes: workflowData.nodes,
  connections: workflowData.connections,
  // NOTE: 'active' field is read-only
  settings: { ... }
};
```

### Backend Fix (`backend/src/routes/workflows.js`)

**Lines 286-327:** Strip `active` and clean payload
```javascript
const { active: _, ...cleanWorkflowData } = workflowData || {};
const workflowPayload = {
  name: cleanWorkflowData.name,
  nodes: cleanWorkflowData.nodes,
  connections: cleanWorkflowData.connections,
  settings: cleanWorkflowData.settings
  // NOTE: 'active' field removed
};
```

### Edge Function Fix (`supabase/functions/deploy-n8n/index.ts`)

**Lines 1856-1863:** Strip `active` with safety check
```typescript
const { active, ...workflowPayload } = workflowJson;

if ('active' in workflowPayload) {
  delete workflowPayload.active;
}
```

**Lines 1799-1826:** Always inject credentials
```typescript
// Gmail nodes
if (node.type === 'gmailTrigger' || node.type === 'gmail') {
  if (!node.credentials) node.credentials = {};
  node.credentials.gmailOAuth2 = { id: gmailId, name: 'Gmail' };
}

// Outlook nodes
if (node.type === 'microsoftOutlookTrigger' || node.type === 'microsoftOutlook') {
  if (!node.credentials) node.credentials = {};
  node.credentials.microsoftOutlookOAuth2Api = { id: outlookId, name: 'Outlook' };
}
```

---

## 🎯 Expected Behavior After Deployment

### Successful Deployment Flow:

1. **User clicks "Deploy Automation"**
2. **Frontend sends clean payload** to Edge Function
3. **Edge Function receives request**
   - Validates user credentials exist
   - Loads workflow template (Gmail or Outlook)
   - Injects credentials into ALL nodes
   - Strips `active` field
   - Creates workflow in n8n (without `active`)
   - Activates workflow separately via `/activate` endpoint
4. **n8n accepts workflow** ✅
5. **n8n activates workflow** ✅
6. **Frontend shows success** ✅

### Console Output (Success):

```
🔧 Step 4: Preparing deployment payload for Edge Function...
📋 Deployment details: {userId: 'xxx', businessName: 'Business', provider: 'gmail'}
🚀 Step 5: Deploying workflow to n8n...
🔹 Attempting deployment via Supabase Edge Function...
✅ Edge Function deployment successful: 123
✅ Workflow deployed to N8N: 123
✅ Workflow is fully active and functional
```

### n8n Workflow (Success):

- ✅ Workflow name: `business-client-workflow`
- ✅ Workflow status: **Active** (green toggle)
- ✅ All nodes have credentials configured
- ✅ No errors or warnings
- ✅ Ready to process emails

---

## 📝 Files Modified

| File | Status | Changes |
|------|--------|---------|
| `supabase/functions/deploy-n8n/index.ts` | ⏳ Needs Deploy | Strip `active`, inject credentials |
| `src/lib/workflowDeployer.js` | ✅ Deployed | Clean payload, no `active` |
| `backend/src/routes/workflows.js` | ✅ Deployed | Strip `active` from incoming data |
| Frontend (Vite) | ✅ Running | http://localhost:5173 |
| Backend (Express) | ✅ Running | http://localhost:3001 |

---

## 🚦 Next Steps

1. **Deploy Edge Function** (Step 1 above - use Dashboard method)
2. **Test deployment** via frontend
3. **Verify in n8n** that workflow has all credentials
4. **Celebrate!** 🎉

---

## 💡 Quick Test Command

Once Edge Function is deployed, test it immediately:

```javascript
// In browser console on http://localhost:5173
fetch('https://oinxzvqszingwstrbdro.supabase.co/functions/v1/deploy-n8n', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sb-oinxzvqszingwstrbdro-auth-token').split('"')[3]}`
  },
  body: JSON.stringify({
    userId: 'fedf818f-986f-4b30-bfa1-7fc339c7bb60',
    emailProvider: 'gmail'
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected:**
```json
{
  "success": true,
  "workflowId": "123",
  "version": 1
}
```

---

## ✅ Success Criteria

- [ ] Edge Function deployed to Supabase
- [ ] Test deployment returns `{"success": true}`
- [ ] n8n workflow created with all credentials
- [ ] No "active is read-only" errors
- [ ] No "Missing credentials" warnings
- [ ] Workflow is active and functional in n8n

---

**All code fixes are complete. Only the Edge Function deployment is needed!** 🚀

