# 🔧 N8N Credential Troubleshooting Guide

## Overview
Comprehensive guide for diagnosing and fixing N8N credential issues, especially OAuth-related problems.

---

## 🔍 Common Credential Issues

### 1. "Unable to sign without access token"

**Symptoms:**
- Workflow fails to activate
- Error in execution logs
- Credential appears valid in UI

**Root Cause:**
- Credential missing `refresh_token`
- Only has `access_token` which expires

**Fix:**
1. Reauthorize credential in N8N
2. Ensure `offline_access` scope is included
3. Force fresh consent (clear browser cache)
4. Verify refresh token appears in credential data

**Related:** [`OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md`](../fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md)

---

### 2. "Invalid Authentication Token" (401)

**Symptoms:**
- API calls return 401
- Token appears to be present
- Workflow execution fails

**Root Causes:**
- Access token expired
- Refresh token invalid/expired
- User revoked app permissions
- Azure app credentials changed

**Fix:**
```bash
# Check token expiration
curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials/CRED_ID \
  -H "Authorization: Bearer $N8N_API_KEY" | jq '.data.expiresIn'

# If expired, reauthorize credential
# If refresh token missing, see Issue #1
```

---

### 3. "Forbidden" (403) Errors

**Symptoms:**
- API calls return 403
- Token is valid
- Permissions appear correct

**Root Causes:**
- Missing required API permissions
- Tenant admin consent not granted
- User doesn't have mailbox access
- API permission not enabled in Azure

**Fix:**
1. **Check Azure Permissions:**
   - Go to Azure Portal > App Registrations
   - Verify all permissions granted
   - Ensure tenant admin consent given

2. **Verify User Access:**
   - User must have mailbox access
   - Check Exchange Online license
   - Verify user is not blocked

---

### 4. Credential Not Found in Workflow

**Symptoms:**
- Workflow won't save
- "Credential not found" error
- Nodes show red credential warning

**Root Cause:**
- Credential was deleted
- Credential ID mismatch
- Wrong credential type for node

**Fix:**
```bash
# 1. List all credentials
curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials \
  -H "Authorization: Bearer $N8N_API_KEY"

# 2. Check credential type matches node
# Outlook nodes need: microsoftOutlookOAuth2Api
# Gmail nodes need: googleOAuth2Api

# 3. Update workflow with correct credential ID
```

---

## 🛠️ Diagnostic Commands

### Check Credential Status
```bash
# Get credential details
curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials/mcTEl2a1e0FpodCS \
  -H "Authorization: Bearer $N8N_API_KEY" \
  | jq '.'

# Check for refresh token
curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials/mcTEl2a1e0FpodCS \
  -H "Authorization: Bearer $N8N_API_KEY" \
  | jq '.data | has("refreshToken")'
```

### List All Credentials
```bash
curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials \
  -H "Authorization: Bearer $N8N_API_KEY" \
  | jq '.data[] | {id, name, type}'
```

### Test Credential
```bash
# Test if credential can access Microsoft Graph
ACCESS_TOKEN=$(curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials/mcTEl2a1e0FpodCS \
  -H "Authorization: Bearer $N8N_API_KEY" \
  | jq -r '.data.accessToken')

curl https://graph.microsoft.com/v1.0/me/mailFolders \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 🔄 Credential Lifecycle

### 1. Initial Creation
```javascript
// Via N8N UI or API
{
  "name": "Outlook OAuth2",
  "type": "microsoftOutlookOAuth2Api",
  "data": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET"
  }
}
```

### 2. OAuth Authorization
- User clicks "Connect"
- Redirects to Microsoft login
- User consents to permissions
- Tokens stored in credential

### 3. Token Storage
```javascript
{
  "data": {
    "accessToken": "EwB...",      // Expires in 1 hour
    "refreshToken": "M.C511...",  // Long-lived (no expiry)
    "expiresIn": 3599,
    "tokenType": "Bearer"
  }
}
```

### 4. Token Refresh (Automatic)
- N8N detects expired access token
- Uses refresh token to get new access token
- Updates credential automatically
- Workflow continues without interruption

---

## 🎯 Required OAuth Scopes

### For Outlook Integration

**Minimum Required:**
```
openid
profile
email
offline_access          ← CRITICAL for refresh tokens
Mail.ReadWrite
Mail.Send
MailboxSettings.ReadWrite
```

**Optional (Recommended):**
```
Calendars.ReadWrite
Contacts.ReadWrite
User.Read
```

### Scope Verification
Check that consent screen shows:
- ✅ "Maintain access to data you have given it access to" (`offline_access`)
- ✅ "Read and write access to your mail" (`Mail.ReadWrite`)
- ✅ "Send mail as you" (`Mail.Send`)
- ✅ "Read and write mailbox settings" (`MailboxSettings.ReadWrite`)

---

## 🧪 Testing Credentials

### Test Script
```javascript
// tests/integration/n8nCredentials.test.js
import { describe, it, expect } from 'vitest';

describe('N8N Credentials', () => {
  it('should have refresh token', async () => {
    const response = await fetch(`${N8N_API_URL}/api/v1/credentials/${CRED_ID}`, {
      headers: { 'Authorization': `Bearer ${N8N_API_KEY}` }
    });
    
    const credential = await response.json();
    
    expect(credential.data.accessToken).toBeDefined();
    expect(credential.data.refreshToken).toBeDefined();
    expect(credential.data.refreshToken).not.toBe('');
  });

  it('should be able to access Microsoft Graph', async () => {
    const credential = await getCredential(CRED_ID);
    
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${credential.data.accessToken}` }
    });
    
    expect(graphResponse.ok).toBe(true);
  });
});
```

---

## 📋 Troubleshooting Checklist

### Before Reauthorization
- [ ] Azure app has `offline_access` permission
- [ ] Tenant admin consent granted
- [ ] User has mailbox access
- [ ] Client ID and secret are correct
- [ ] Redirect URI matches Azure configuration

### During Reauthorization
- [ ] Clear browser cache/cookies
- [ ] Use incognito/private window
- [ ] See full consent screen (not cached)
- [ ] All permissions listed
- [ ] "Maintain access" permission shown
- [ ] Click "Accept" after reading

### After Reauthorization
- [ ] Both tokens present in credential
- [ ] Access token works for API calls
- [ ] Refresh token is long string (not empty)
- [ ] Workflow activates successfully
- [ ] Test execution completes
- [ ] No "unable to sign" errors

---

## 🔐 Security Best Practices

### Credential Storage
- ✅ Store credentials in N8N's encrypted storage
- ✅ Never commit credentials to git
- ✅ Use environment variables for client secrets
- ✅ Rotate credentials periodically

### Token Management
- ✅ Let N8N handle token refresh automatically
- ✅ Don't store tokens in browser localStorage
- ✅ Use short-lived access tokens
- ✅ Protect refresh tokens like passwords

### Azure Configuration
- ✅ Use separate app registrations per environment
- ✅ Limit redirect URIs to known domains
- ✅ Enable only required API permissions
- ✅ Monitor app usage via Azure logs

---

## 🚨 Emergency Recovery

If credential is completely broken:

### 1. Export Workflow (Backup)
```bash
curl https://n8n.srv995290.hstgr.cloud/api/v1/workflows/slA6heIYjTr9tz1R \
  -H "Authorization: Bearer $N8N_API_KEY" \
  > workflow_backup.json
```

### 2. Delete Credential
```bash
curl -X DELETE https://n8n.srv995290.hstgr.cloud/api/v1/credentials/mcTEl2a1e0FpodCS \
  -H "Authorization: Bearer $N8N_API_KEY"
```

### 3. Create Fresh Credential
- Follow steps in [Option 1](#option-1-delete-and-recreate-in-n8n-ui)

### 4. Restore Workflow
- Import workflow from backup
- Update credential references
- Test and activate

---

## 📊 Credential Health Monitoring

### Daily Checks (Automated)
```javascript
// Check all credentials have refresh tokens
const credentials = await n8nAPI.getCredentials();
const outlookCreds = credentials.filter(c => c.type === 'microsoftOutlookOAuth2Api');

outlookCreds.forEach(cred => {
  if (!cred.data.refreshToken) {
    console.error(`❌ Credential ${cred.id} missing refresh token`);
    // Send alert to admin
  }
});
```

### Weekly Checks (Manual)
- Review credential usage in N8N
- Check for expired or unused credentials
- Verify all workflows have valid credentials
- Test critical workflows

---

## 🎓 Best Practices

### When Creating New Credentials
1. **Always include `offline_access` scope**
2. **Test immediately after creation**
3. **Verify refresh token presence**
4. **Document credential purpose**
5. **Set up monitoring**

### When Updating Existing Credentials
1. **Export workflows using credential first** (backup)
2. **Test in development before production**
3. **Have rollback plan**
4. **Notify team of changes**

### Credential Naming
Use descriptive names:
- ✅ Good: "Outlook OAuth2 - Production"
- ✅ Good: "Gmail API - User Flow"
- ❌ Bad: "Credential 1"
- ❌ Bad: "Test"

---

## 📞 Support

### If Issues Persist
1. Check [Troubleshooting Guide](../guides/TROUBLESHOOTING_GUIDE.md)
2. Review [OAuth Debug Guide](../guides/OAUTH_DEBUG_GUIDE.md)
3. Check N8N execution logs
4. Verify Azure app configuration
5. Test with fresh browser session

---

**Quick Fix Summary:**  
**Problem:** Missing refresh token  
**Solution:** Reauthorize credential with `offline_access` scope  
**Time:** 5 minutes  
**Impact:** Resolves all token-related workflow failures  

---

**Last Updated:** October 7, 2025  
**Status:** Production Guide

