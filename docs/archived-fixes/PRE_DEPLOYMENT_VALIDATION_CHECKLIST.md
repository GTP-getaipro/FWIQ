# Pre-Deployment Validation Checklist

## Critical Validations Before Deployment

This checklist ensures your workflow is ready for deployment to n8n. **All CRITICAL items must pass** before deployment.

---

## 🔴 CRITICAL - Must Pass

### 1. **N8N Health Check** ✅
**Status**: Automated in `workflowDeployer.js`
- [ ] N8N API is accessible
- [ ] Authentication is working
- [ ] Credentials API is available
- [ ] Workflows API is available

**How to check**:
```javascript
const healthCheck = await n8nHealthChecker.runHealthCheck();
console.log('Health status:', healthCheck.overall);
```

### 2. **OAuth Credentials** ✅
**Status**: Fixed in Edge Function
- [ ] Gmail/Outlook refresh token exists
- [ ] Access token is valid or can be refreshed
- [ ] Credentials use correct OAuth2 format:
  - `oauthTokenData` wrapper
  - `sendAdditionalBodyProperties: false`
  - No `refreshToken` directly in `data` object
  - All required scopes included

**How to check**:
```sql
SELECT provider, status, refresh_token IS NOT NULL as has_refresh_token
FROM integrations 
WHERE user_id = 'YOUR_USER_ID' AND status = 'active';
```

### 3. **Business Profile Completeness** ✅
**Status**: Validated in `onboardingValidation.js`
- [ ] Business name exists
- [ ] Business type(s) selected
- [ ] Email domain configured
- [ ] Service area defined
- [ ] At least one manager configured
- [ ] At least one supplier configured

**How to check**:
```javascript
const validation = await onboardingValidation.validateCompleteDataset();
console.log('Profile completeness:', validation.dataQuality);
```

### 4. **Label/Folder Structure** ✅
**Status**: Validated in `labelSyncValidator.js`
- [ ] Label map exists with 100+ labels
- [ ] All required top-level folders present
- [ ] Manager folders created
- [ ] Supplier folders created
- [ ] Banking sub-categories exist
- [ ] Folder IDs are valid (Gmail labels or Outlook folder IDs)

**How to check**:
```javascript
const labelMap = await getFolderIdsForN8n(userId);
const validation = await validateFolderIdsForN8n(userId, labelMap);
console.log('Label validation:', validation);
```

### 5. **Template Selection** ✅
**Status**: Fixed - Each business type has unique template
- [ ] Correct template loaded for business type:
  - Hot tub & Spa → `hot_tub_template.json`
  - Pools → `pools_template.json`
  - Pools & Spas → `pools_spas_generic_template.json`
  - HVAC → `hvac_template.json`
  - Electrician → `electrician_template.json`
  - etc.

**How to check**:
```javascript
const templateConfig = await enhancedTemplateManager.getSingleBusinessTemplate(businessType);
console.log('Template:', templateConfig.templateFile);
```

### 6. **Workflow Payload Format** ✅
**Status**: Fixed - No `active` field
- [ ] Workflow JSON does NOT include `active: true` or `active: false`
- [ ] All credential IDs are present
- [ ] All placeholders are replaced
- [ ] Nodes array is not empty
- [ ] Connections object is valid

**How to check**:
```javascript
// This is automatically handled by Edge Function
// It strips the 'active' field before sending to n8n
const { active, ...workflowPayload } = workflowJson;
```

---

## 🟡 IMPORTANT - Should Pass

### 7. **Voice Training Data** (Optional but Recommended)
- [ ] Voice profile exists in `communication_styles` table
- [ ] Learning count > 0
- [ ] Signature phrases captured
- [ ] Few-shot examples available

**How to check**:
```sql
SELECT learning_count, style_profile->'signaturePhrases' as phrases
FROM communication_styles 
WHERE user_id = 'YOUR_USER_ID';
```

### 8. **Database Readiness**
- [ ] All required tables exist:
  - `profiles`
  - `integrations`
  - `workflows`
  - `business_labels`
  - `communication_styles`
  - `n8n_credential_mappings`
- [ ] RLS policies are active
- [ ] Service role access works

**How to check**:
```javascript
const dbCheck = await n8nPreDeploymentValidator.validateDatabaseReadiness();
console.log('Database status:', dbCheck);
```

### 9. **API Connections**
- [ ] Supabase connection works
- [ ] OpenAI API key is valid
- [ ] N8N CORS proxy is functional

**How to check**:
```javascript
const apiCheck = await n8nPreDeploymentValidator.validateApiConnections();
console.log('API status:', apiCheck);
```

### 10. **Environment Variables**
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `N8N_BASE_URL` is set
- [ ] `N8N_API_KEY` is set
- [ ] `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` are set (if using Gmail)
- [ ] `OUTLOOK_CLIENT_ID` and `OUTLOOK_CLIENT_SECRET` are set (if using Outlook)
- [ ] `OPENAI_KEY_1` through `OPENAI_KEY_5` are set

**How to check**:
```javascript
const envCheck = await n8nPreDeploymentValidator.validateEnvironmentVariables();
console.log('Environment status:', envCheck);
```

---

## 🟢 OPTIONAL - Nice to Have

### 11. **Email Provider Support**
- [ ] Provider-specific template exists
- [ ] Provider-specific nodes configured
- [ ] Test emails sent successfully

### 12. **Performance Metrics**
- [ ] Performance metrics table exists
- [ ] Metrics collection is enabled
- [ ] Dashboard access configured

### 13. **Error Handling**
- [ ] Error workflow configured
- [ ] Retry logic enabled
- [ ] Logging enabled

---

## Automated Validation Flow

### Run Complete Validation:
```javascript
// 1. Run N8N health check
const healthCheck = await n8nHealthChecker.runHealthCheck();

// 2. Run pre-deployment validation
const preDeployment = await n8nPreDeploymentValidator.validatePreDeployment(userId, 'temp-workflow-id');

// 3. Run onboarding validation
const onboarding = new OnboardingValidationSystem(userId);
const onboardingCheck = await onboarding.validateCompleteDataset();

// 4. Validate label structure
const labelValidation = await validateFolderIdsForN8n(userId);

// 5. Check if ready
const isReady = 
  healthCheck.overall === 'healthy' &&
  preDeployment.isReadyForDeployment &&
  onboardingCheck.overallStatus === 'ready' &&
  labelValidation.isValid;

console.log('✅ Ready for deployment:', isReady);
```

---

## Common Issues & Fixes

### ❌ Issue: "refreshToken not allowed"
**Fix**: Credential format is wrong. Update to use `oauthTokenData` wrapper (already fixed in Edge Function)

### ❌ Issue: "active is read-only"
**Fix**: Remove `active` field from workflow payload (already fixed in Edge Function and Backend API)

### ❌ Issue: "Wrong template for Hot tub & Spa"
**Fix**: Template mapping updated - Hot tub & Spa now uses `hot_tub_template.json`

### ❌ Issue: "Missing label map"
**Fix**: Run label provisioning in Step 3 (Team Setup) before deployment

### ❌ Issue: "Invalid folder IDs"
**Fix**: Sync labels/folders with email provider before deployment

---

## Pre-Deployment Commands

### Check Database Status:
```powershell
# Check user profile
psql -h hostname -U username -d database -c "SELECT id, business_types, email_labels IS NOT NULL FROM profiles WHERE id = 'YOUR_USER_ID';"

# Check integrations
psql -h hostname -U username -d database -c "SELECT provider, status, n8n_credential_id FROM integrations WHERE user_id = 'YOUR_USER_ID';"

# Check label count
psql -h hostname -U username -d database -c "SELECT COUNT(*) FROM business_labels WHERE profile_id = 'YOUR_PROFILE_ID';"
```

### Test N8N Connection:
```bash
curl -X GET "https://n8n.srv995290.hstgr.cloud/api/v1/workflows?limit=1" \
  -H "X-N8N-API-KEY: YOUR_API_KEY"
```

### Validate Template Loading:
```javascript
import { enhancedTemplateManager } from '@/lib/enhancedTemplateManager';
const template = await enhancedTemplateManager.getSingleBusinessTemplate('Hot tub & Spa');
console.log('Template file:', template.templateFile); // Should be: hot_tub_template.json
```

---

## Deployment Status Codes

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `ready` | All validations passed | ✅ Deploy now |
| `has_issues` | Minor issues found | ⚠️ Review and fix |
| `critical_issues` | Major problems | ❌ Fix before deployment |
| `error` | Validation failed | 🔧 Debug validation system |

---

## Quick Deployment Checklist

**Before clicking "Deploy":**

1. ✅ N8N health check passes
2. ✅ OAuth credentials exist and are valid
3. ✅ Business profile is complete (name, type, managers, suppliers)
4. ✅ Label map has 100+ labels
5. ✅ Correct template selected for business type
6. ✅ Workflow payload is valid (no `active` field)
7. ✅ Environment variables are set
8. ✅ Database tables exist and are accessible

**If all items are checked, you're ready to deploy!** 🚀

