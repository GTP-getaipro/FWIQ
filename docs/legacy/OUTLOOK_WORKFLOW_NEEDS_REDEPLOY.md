# ⚠️ Outlook Workflow Needs Redeploy - Using Old Template

**User:** the-hot-tub-man  
**Issue:** Deployed workflow has old template (before our fixes)  
**Solution:** Redeploy workflow to get latest template

---

## 🚨 Issues in Current Deployed Workflow

### 1. **Missing `runOnceForEachItem` in Generate Label Mappings**

**Current (deployed):**
```json
{
  "parameters": {
    "jsCode": "..."
  },
  "type": "n8n-nodes-base.code"
  // ❌ Missing "mode": "runOnceForEachItem"
}
```

**Fixed Template:**
```json
{
  "parameters": {
    "mode": "runOnceForEachItem",  // ✅ Has this
    "jsCode": "..."
  }
}
```

**Impact:** Node may process all items at once instead of one at a time

---

### 2. **Wrong SUPPORT Categories in AI Classifier**

**Current (deployed):**
```
Support subcategories: [AppointmentScheduling, General, WaterCare, Winterization, PartsAndChemicals, SpaRepair]
```

**Fixed Template:**
```
Support subcategories: [AppointmentScheduling, General, TechnicalSupport, PartsAndChemicals]
```

**Impact:** AI classifier generates categories that don't match actual folders!

---

### 3. **Wrong Item Reference in "Can AI Reply?"**

**Current (deployed):**
```javascript
"leftValue": "={{ $('Parse AI Classification').item.json.parsed_output.ai_can_reply }}"
```

**Fixed Template:**
```javascript
"leftValue": "={{ $json.parsed_output.ai_can_reply }}"
```

**Impact:** Item pairing errors in N8N execution

---

### 4. **Wrong Item Reference in "Conversation Memory"**

**Current (deployed):**
```javascript
"sessionKey": "={{ $('Prepare Email Data').item.json.threadId }}"
```

**Fixed Template:**
```javascript
"sessionKey": "={{ $('Prepare Email Data').first().json.threadId }}"
```

**Impact:** Thread memory may not work correctly

---

### 5. **Simplified Metrics Calculation**

**Current (deployed):**
```javascript
const avgMinutesPerEmail = 4.5;  // ❌ Fixed value
```

**Fixed Template:**
```javascript
const aiCanReply = $json.ai_can_reply || false;
const avgMinutesPerEmail = aiCanReply ? 11 : 3;  // ✅ Dynamic
```

**Impact:** Inaccurate time savings (always uses 4.5 min instead of 3 or 11)

---

## ✅ Latest Template Has All Fixes

**File:** `src/lib/templates/outlook-template.json`

Confirmed fixes in latest template:
- ✅ `runOnceForEachItem` mode
- ✅ Correct SUPPORT categories
- ✅ Correct item references (`.first()` and `$json`)
- ✅ Dynamic metrics calculation
- ✅ `user_id` column (not `client_id`)

---

## 🚀 How to Fix

### Option 1: Redeploy via Dashboard (Recommended)
1. Login to FloWorx dashboard
2. Go to Settings or Workflow section
3. Click "Redeploy Workflow"
4. System will use latest template automatically

### Option 2: Manual Redeploy via Edge Function
Run this in browser console (while logged in):

```javascript
async function redeployWorkflow() {
  const userId = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';
  
  const response = await fetch(
    'https://oinxzvqszingwstrbdro.supabase.co/functions/v1/deploy-n8n',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
      },
      body: JSON.stringify({ userId })
    }
  );
  
  const result = await response.json();
  console.log('Redeploy result:', result);
}

redeployWorkflow();
```

### Option 3: Delete Old Workflow, Deploy Fresh
1. Go to N8N: `https://n8n.srv995290.hstgr.cloud`
2. Delete the old workflow
3. Redeploy from dashboard
4. Fresh workflow will have all fixes

---

## 📊 Expected Results After Redeploy

### Workflow Will Have:
1. ✅ Correct SUPPORT categories (TechnicalSupport, not SpaRepair)
2. ✅ Proper item pairing (no errors)
3. ✅ Accurate metrics (3 min for labeling, 11 min for drafting)
4. ✅ Correct execution modes
5. ✅ Voice memory working correctly

### Folders Will Match Classifier:
```
SUPPORT/
  → Appointment Scheduling  ✅
  → General                 ✅
  → Technical Support       ✅  (was: SpaRepair)
  → Parts And Chemicals     ✅
```

---

## 🎯 Bottom Line

**Your folders are perfect** - but the workflow is using an old template.

**Action:** Redeploy workflow to sync template with folder structure.

**Time:** 2 minutes

**After redeploy:**
- ✅ Classifier matches folders 100%
- ✅ No item pairing errors
- ✅ Accurate metrics tracking
- ✅ Voice training working

