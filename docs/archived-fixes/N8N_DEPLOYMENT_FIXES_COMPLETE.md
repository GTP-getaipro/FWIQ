# N8N Deployment Fixes - Complete Summary

## Issues Fixed

### 1. **Credential Creation Error** ✅
**Problem**: Edge Function was sending Gmail/Outlook credentials with `refreshToken` property directly in the `data` object, causing n8n to reject with:
```
request.body.data is not allowed to have the additional property "refreshToken"
```

**Solution**: Updated credential creation in Edge Function to use proper OAuth2 format:
- Wrapped tokens in `oauthTokenData` object
- Added required `sendAdditionalBodyProperties: false` and `additionalBodyProperties: ''`
- Included proper token structure with `access_token`, `refresh_token`, `token_type`, `expires_in`, and `scope`

**Files Modified**:
- `supabase/functions/deploy-n8n/index.ts` (Lines 1497-1522 for Gmail, 1544-1569 for Outlook)

### 2. **Workflow Creation Error** ✅
**Problem**: Both Edge Function and Backend API were sending `active: true` in workflow creation payload, causing n8n to reject with:
```
request/body/active is read-only
```

**Solution**: Removed `active` field from workflow creation payloads. N8n workflows must be created first, then activated via separate API call.

**Files Modified**:
- `supabase/functions/deploy-n8n/index.ts` (Line 1828-1850)
- `backend/src/routes/workflows.js` (Line 285-323)
- `backend/src/server.js` (Line 701)

### 3. **Template Separation Issue** ✅
**Problem**: Hot tub & Spa business was incorrectly mapped to use `pools_spas_generic_template.json`, but it should have its own dedicated template separate from Pools.

**Solution**: Updated template mappings in multiple files to use separate templates:
- **Hot tub & Spa** → `hot_tub_template.json` / `hot_tub_base_template.json`
- **Pools** → `pools_template.json`
- **Pools & Spas** → `pools_spas_generic_template.json`
- **Sauna & Icebath** → `sauna_icebath_template.json`

**Files Modified**:
- `src/lib/enhancedTemplateManager.js` (Lines 107-126, 229-244)
- `src/lib/enhancedWorkflowDeployer.js` (Lines 222-238)

## Deployment Flow

### Current Workflow:
1. **Frontend** → Prepares workflow data and calls deployment endpoint
2. **Edge Function** (`deploy-n8n`) OR **Backend API** (`/api/workflows/deploy`)
   - Creates OAuth2 credentials (Gmail/Outlook) with proper format
   - Removes `active` field from workflow payload
   - Creates workflow in n8n
   - Activates workflow via separate API call
3. **Database** → Stores workflow record with status

### Credential Format (Correct):
```json
{
  "name": "business-gmail",
  "type": "googleOAuth2Api",
  "data": {
    "clientId": "...",
    "clientSecret": "...",
    "sendAdditionalBodyProperties": false,
    "additionalBodyProperties": "",
    "oauthTokenData": {
      "access_token": "...",
      "refresh_token": "...",
      "token_type": "Bearer",
      "expires_in": 3599,
      "scope": "..."
    }
  }
}
```

### Workflow Format (Correct):
```json
{
  "name": "Business Workflow",
  "nodes": [...],
  "connections": {...},
  "settings": {...}
  // NO "active" field
}
```

## Testing Checklist

- [ ] Test Gmail credential creation
- [ ] Test Outlook credential creation  
- [ ] Test workflow deployment for Hot tub & Spa business
- [ ] Test workflow deployment for Pools business
- [ ] Test workflow deployment for Pools & Spas business
- [ ] Verify workflows are activated after creation
- [ ] Verify correct templates are loaded for each business type

## Next Steps

1. **Test the deployment** - Try deploying a workflow for Hot tub & Spa business
2. **Verify credentials** - Check that n8n credentials are created successfully
3. **Monitor workflow** - Ensure workflow activates and starts processing emails
4. **Template verification** - Confirm Hot tub & Spa uses its own template, not the Pools template

## Related Files

### Edge Function:
- `supabase/functions/deploy-n8n/index.ts`

### Backend API:
- `backend/src/routes/workflows.js`
- `backend/src/server.js`

### Template Management:
- `src/lib/enhancedTemplateManager.js`
- `src/lib/enhancedWorkflowDeployer.js`

### Templates:
- `public/templates/gmail-workflow-template.json`
- `src/lib/n8n-templates/hot_tub_base_template.json`
- `src/lib/n8n-templates/pools_template.json`
- `src/lib/n8n-templates/pools_spas_generic_template.json`

## Summary

All deployment errors have been fixed:
✅ Credential creation now uses correct OAuth2 format
✅ Workflow creation no longer includes read-only `active` field
✅ Hot tub & Spa business now uses its own dedicated template
✅ Pools and Sauna & Icebath also have separate templates

The deployment should now work end-to-end without errors!

