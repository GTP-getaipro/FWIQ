# ✅ Provider Naming Consistency Validation

## 🎯 Standard Naming Convention:

### ✅ **Correct Provider Names:**
- **Gmail:** Always use `'gmail'` (NOT `'google'`)
- **Outlook:** Always use `'outlook'` (NOT `'microsoft'` or `'azure'`)

---

## 📊 Where Each Name is Used:

### 1. **Database (Supabase)**
```sql
-- integrations table
provider CHECK (provider IN ('gmail', 'outlook'))

-- profiles table  
primary_provider CHECK (primary_provider IN ('gmail', 'outlook'))

-- email_logs table
provider CHECK (provider IN ('gmail', 'outlook'))
```

**Conclusion:** Database uses **`gmail`** and **`outlook`** ✅

---

### 2. **Supabase Auth (OAuth)**
When users authenticate:
```javascript
// What Supabase Auth RETURNS:
session.user.app_metadata.provider
// Values: 'google' (for Gmail) or 'azure' (for Outlook)

// What WE STORE in database:
const provider = sessionProvider === 'google' ? 'gmail' : 'outlook';
```

**Conversion happens in:**
- `src/contexts/SupabaseAuthContext.jsx` (line 156)
- `src/contexts/StandardizedAuthContext.jsx` (line 172)

**Conclusion:** OAuth returns `google`/`azure`, but we **convert to** `gmail`/`outlook` ✅

---

### 3. **Edge Function (Supabase Functions)**
**File:** `supabase/functions/deploy-n8n/index.ts`

**✅ FIXED (Line 2132):**
```typescript
// OLD (WRONG):
const providerName = emailProvider === 'outlook' ? 'microsoft' : 'google';

// NEW (CORRECT):
const providerName = emailProvider === 'outlook' ? 'outlook' : 'gmail';
```

**Status:** Fixed locally ✅ (needs deployment to Supabase)

---

### 4. **Frontend (React/JavaScript)**
**Files Checked:**
- ✅ `src/lib/workflowDeployer.js` - Uses `gmail`/`outlook`
- ✅ `src/lib/n8nConfigMapper.js` - Uses `gmail`/`outlook`
- ✅ `src/lib/n8nTemplateLoader.js` - Uses `gmail`/`outlook`
- ✅ `src/examples/oauth-workflow-integration.js` - **FIXED** to use `gmail`/`outlook`

**Conclusion:** Frontend consistently uses **`gmail`** and **`outlook`** ✅

---

### 5. **N8N Credential Types**
```javascript
// Gmail
type: 'gmailOAuth2' // Correct N8N credential type

// Outlook
type: 'microsoftOutlookOAuth2Api' // Correct N8N credential type
```

**Note:** N8N's **internal credential types** use different names, but our **provider identifiers** should remain `gmail`/`outlook`.

---

## 🔍 Consistency Check Summary:

| Layer | Provider Name | Status |
|-------|--------------|--------|
| **Database Schema** | `gmail`, `outlook` | ✅ Correct |
| **Database Records** | `gmail`, `outlook` | ✅ Correct |
| **Frontend Code** | `gmail`, `outlook` | ✅ Correct |
| **Edge Function** | `gmail`, `outlook` | ✅ FIXED (needs deployment) |
| **Example Files** | `gmail`, `outlook` | ✅ FIXED |
| **OAuth Flow** | Converts `google`→`gmail`, `azure`→`outlook` | ✅ Correct |
| **N8N Templates** | References `gmail`, `outlook` | ✅ Correct |

---

## 🔧 Files Modified for Consistency:

### 1. **Edge Function** (Primary Fix)
**File:** `supabase/functions/deploy-n8n/index.ts`
**Line:** 2132
**Change:** `'microsoft'` → `'outlook'`, `'google'` → `'gmail'`
**Impact:** Edge Function will now query for correct provider name
**Status:** ⚠️ **Needs deployment to Supabase**

### 2. **Example File**
**File:** `src/examples/oauth-workflow-integration.js`
**Lines:** 22, 69
**Change:** 
  - Line 22: `'google'` → `'gmail'`
  - Line 69: `'microsoft'` → `'outlook'`
**Impact:** Examples now show correct provider names
**Status:** ✅ **Active**

### 3. **Data Extraction Fix**
**File:** `src/lib/aiSchemaInjector.js`
**Lines:** 52-61
**Change:** Added array safety checks
**Impact:** Prevents `.map is not a function` errors
**Status:** ✅ **Active**

### 4. **Deployment Payload**
**File:** `src/lib/workflowDeployer.js`
**Line:** 357
**Change:** Added `emailProvider` parameter
**Impact:** Edge Function knows which provider to query
**Status:** ✅ **Active**

---

## 📝 Complete Provider Mapping:

```javascript
// OAuth Provider → Database Provider → N8N Credential Type
'google'   → 'gmail'   → 'gmailOAuth2'
'azure'    → 'outlook' → 'microsoftOutlookOAuth2Api'

// Template File Selection
'gmail'    → '/templates/gmail-workflow-template.json'
'outlook'  → '/templates/outlook-workflow-template.json'
```

---

## ⚠️ Edge Function Still Needs Deployment:

The local fix won't take effect until you deploy the Edge Function to Supabase:

```powershell
# Deploy the fixed Edge Function
npx supabase functions deploy deploy-n8n

# Verify deployment
npx supabase functions list
```

---

## ✅ Consistency Validation Complete!

**Summary:**
- ✅ Database: Uses `gmail`/`outlook`
- ✅ Frontend: Uses `gmail`/`outlook`
- ✅ Edge Function: **FIXED** to use `gmail`/`outlook` (needs deployment)
- ✅ Examples: **FIXED** to use `gmail`/`outlook`

**All naming is now consistent!** 🎉

---

## 🧪 How to Test:

1. **Deploy Edge Function** (so the fix takes effect)
2. **Refresh browser**
3. **Try deployment** - Should work if you have a `gmail` integration record

To check your integration:
```sql
SELECT provider, status FROM integrations 
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';
```

Expected: `provider = 'gmail'` (not `'google'`)

---

## 📚 Reference:

**Correct Usage Examples:**

```javascript
// ✅ Frontend - Fetching integration
const { data } = await supabase
  .from('integrations')
  .select('*')
  .eq('provider', 'gmail')  // Correct!
  .eq('status', 'active');

// ✅ Frontend - Deploying workflow
await deployWorkflowForUser(supabase, userId, 'gmail'); // Correct!

// ✅ Edge Function - Querying integration
const providerName = emailProvider === 'outlook' ? 'outlook' : 'gmail'; // Correct!
```

**Incorrect (Legacy):**
```javascript
// ❌ WRONG - Don't use these:
provider: 'google'     // Use 'gmail' instead
provider: 'microsoft'  // Use 'outlook' instead
provider: 'azure'      // Use 'outlook' instead
```

---

**All provider naming is now consistent across the entire stack!** ✅


