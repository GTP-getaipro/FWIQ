# Pre-Deployment Validation - Quick Reference

## ⚡ Quick Commands

### **Run Complete Validation**
```javascript
import { validateAndReport } from '@/lib/completePreDeploymentValidator';

const { isReady, report } = await validateAndReport(userId, 'gmail');
console.log(report);

if (!isReady) {
  console.error('❌ Not ready for deployment');
  process.exit(1);
}
```

### **Check Individual Components**
```javascript
// 1. Check N8N
const health = await n8nHealthChecker.runHealthCheck();

// 2. Check credentials
const { data } = await supabase
  .from('integrations')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'active');

// 3. Check labels
const labelMap = await getFolderIdsForN8n(userId);
console.log('Label count:', Object.keys(labelMap).length);

// 4. Check template
const template = await enhancedTemplateManager.getSingleBusinessTemplate(businessType);
console.log('Template:', template.templateFile);
```

---

## 📊 Validation Flowchart

```
START DEPLOYMENT
       │
       ▼
┌─────────────────┐
│ Run Validation  │ ◄── Use: validateAndReport(userId, provider)
└─────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              12 VALIDATION CHECKS                       │
│                                                         │
│  CRITICAL (Must Pass):                                  │
│    ✅ 1. N8N Health                                     │
│    ✅ 2. OAuth Credentials                              │
│    ✅ 3. Business Profile                               │
│    ✅ 4. Label Structure (100+ labels)                  │
│    ✅ 5. Template Selection                             │
│    ✅ 6. Workflow Format                                │
│                                                         │
│  IMPORTANT (Should Pass):                               │
│    ⚠️ 7. Voice Training                                 │
│    ✅ 8. Database Readiness                             │
│    ✅ 9. API Connections                                │
│                                                         │
│  OPTIONAL (Nice to Have):                               │
│    ℹ️ 10. Environment Variables                         │
│    ℹ️ 11. Provider Support                              │
│    ℹ️ 12. Performance Setup                             │
└─────────────────────────────────────────────────────────┘
       │
       ▼
  All Critical
    Passed?
       │
   ┌───┴───┐
   │       │
  YES     NO
   │       │
   ▼       ▼
┌─────┐  ┌──────────┐
│     │  │  BLOCK   │
│ OK  │  │  DEPLOY  │
│     │  │          │
└─────┘  └──────────┘
   │          │
   ▼          ▼
DEPLOY    FIX ISSUES
```

---

## 🔴 CRITICAL Checks (MUST PASS)

### 1. **N8N Health** 
```javascript
✅ Pass Criteria: health.overall === 'healthy'
❌ Fail Criteria: Cannot connect to N8N
🔧 Fix: Check N8N server, API key, network
```

### 2. **OAuth Credentials**
```javascript
✅ Pass Criteria: 
   - integration.status === 'active'
   - integration.refresh_token exists
   - integration.provider matches
❌ Fail Criteria: Missing refresh token
🔧 Fix: Re-authenticate in Step 1
```

### 3. **Business Profile**
```javascript
✅ Pass Criteria:
   - business.name exists
   - business_types.length > 0
   - managers.length > 0
   - suppliers.length > 0
   - emailDomain exists
❌ Fail Criteria: Any field missing
🔧 Fix: Complete onboarding Steps 2-4
```

### 4. **Label Structure**
```javascript
✅ Pass Criteria:
   - labelCount >= 80 (ideally 100+)
   - All required folders exist
   - Folder IDs are valid
❌ Fail Criteria: < 80 labels or invalid IDs
🔧 Fix: Run label provisioning in Step 3
```

### 5. **Template Selection**
```javascript
✅ Pass Criteria:
   - Correct template for business type
   - Hot tub & Spa → hot_tub_template.json
   - Pools → pools_template.json
   - etc.
❌ Fail Criteria: Wrong template selected
🔧 Fix: Already fixed in code
```

### 6. **Workflow Format**
```javascript
✅ Pass Criteria:
   - No 'active' field in payload
   - Credentials use OAuth2 format
   - Separate activation call
❌ Fail Criteria: Invalid format
🔧 Fix: Already fixed in code
```

---

## 🟡 IMPORTANT Checks (SHOULD PASS)

### 7. **Voice Training**
```javascript
✅ Pass: learning_count > 0
⚠️ Warn: No voice profile
🔧 Optional but improves AI quality
```

### 8. **Database Readiness**
```javascript
✅ Pass: All tables exist and accessible
⚠️ Warn: RLS policy issues
🔧 Check database schema and permissions
```

### 9. **API Connections**
```javascript
✅ Pass: Supabase, OpenAI, N8N all reachable
⚠️ Warn: One or more APIs slow/degraded
🔧 Check API keys and network
```

---

## 🟢 OPTIONAL Checks (INFORMATIONAL)

### 10. **Environment Variables**
```javascript
ℹ️ Info: Lists configured vs missing env vars
🔧 Set in .env file if needed
```

### 11. **Provider Support**
```javascript
ℹ️ Info: Gmail/Outlook fully supported
🔧 Other providers may have limited features
```

### 12. **Performance Setup**
```javascript
ℹ️ Info: Metrics table exists
🔧 Optional for deployment
```

---

## 🚨 Common Failures & Quick Fixes

| Error | Quick Fix | Command |
|-------|-----------|---------|
| N8N unreachable | Check server | `curl https://n8n.srv995290.hstgr.cloud/api/v1/workflows?limit=1` |
| No refresh token | Re-auth | Go to Step 1, reconnect email |
| Missing profile | Complete onboarding | Finish Steps 2-4 |
| Low label count | Run provisioning | Step 3 → Save Team Setup |
| Wrong template | Already fixed | Deploy will use correct template |
| Active field error | Already fixed | Edge Function strips it |

---

## 📋 Pre-Flight Checklist

**Before Clicking "Deploy":**

- [ ] `validateAndReport()` returns `isReady: true`
- [ ] All 6 critical checks passed
- [ ] Label count >= 100
- [ ] OAuth credentials active
- [ ] Business profile complete
- [ ] N8N health check green

**If any fail:**
1. Read error message
2. Apply quick fix
3. Re-run validation
4. Deploy when `isReady: true`

---

## 🎯 One-Line Validation

```javascript
// Quick boolean check
const ready = await isReadyForDeployment(userId, 'gmail');
if (!ready) throw new Error('Not ready - run validateAndReport() for details');
```

---

## 📖 Full Documentation

- **Checklist**: `PRE_DEPLOYMENT_VALIDATION_CHECKLIST.md`
- **Complete Guide**: `DEPLOYMENT_VALIDATION_COMPLETE.md`
- **Fix Summary**: `N8N_DEPLOYMENT_FIXES_COMPLETE.md`
- **Implementation**: `src/lib/completePreDeploymentValidator.js`

---

## ✅ Validation Status: **COMPLETE**

All validation systems are in place and all deployment errors have been fixed!

**You are ready to deploy!** 🚀

