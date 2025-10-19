# 🔧 Outlook OAuth Refresh Token Fix

## Problem

**Error:** "Unable to sign without access token" in N8N workflow
**Root Cause:** N8N credential missing `refresh_token` even though Azure permissions are correctly configured

---

## ✅ Azure API Permissions Verified

Your Azure App Registration has **all required permissions**:

| Permission | Purpose | Status |
|------------|---------|--------|
| `Mail.ReadWrite` | Read/write access to mailbox | ✅ Granted |
| `Mail.Send` | Send mail as user | ✅ Granted |
| `MailboxSettings.ReadWrite` | Manage mail folders | ✅ Granted |
| `offline_access` | Enables refresh tokens (CRITICAL) | ✅ Granted |
| `openid`, `profile`, `email` | User identity and OAuth profile | ✅ Granted |
| `Calendars.ReadWrite` | (Optional) Event sync | ✅ Granted |

✅ **Verdict:** Azure configuration is **perfect** - all required scopes including `offline_access` are granted.

---

## 🔍 Why Refresh Token Is Missing

The N8N credential (`mcTEl2a1e0FpodCS`) likely has **only an `access_token`** and not a `refresh_token`.

**This happens when:**
1. OAuth flow completed **before** `offline_access` was added
2. Redirect URI used during authorization didn't request fresh consent
3. User clicked "Accept" too quickly before all scopes loaded
4. Cached consent was used instead of prompting for new permissions

---

## 🔧 Solution: Force Fresh OAuth Authorization

### Step 1: Reauthorize N8N Credential

1. **Navigate to N8N:**
   ```
   https://n8n.srv995290.hstgr.cloud/credentials
   ```

2. **Open Outlook Credential:**
   - Find credential ID: `mcTEl2a1e0FpodCS`
   - Click to edit

3. **Reconnect/Reauthorize:**
   - Click **"Reconnect"** or **"Connect my account"** button
   - You should see Microsoft login screen

4. **Verify Consent Screen:**
   - Should show ALL permissions:
     - ✅ Read and write access to your mail
     - ✅ Send mail as you
     - ✅ Read and write mailbox settings
     - ✅ **Maintain access to data you have given it access to** (offline_access)
   - Click **"Accept"**

5. **Verify Credential Data:**
   After successful authorization, the credential should have:
   ```json
   {
     "data": {
       "accessToken": "<token>",
       "refreshToken": "<token>",  ← MUST BE PRESENT
       "expiresIn": 3599,
       "tokenType": "Bearer"
     }
   }
   ```

6. **Save Credential**

---

### Step 2: Verify Refresh Token Presence

**Option A: Via N8N UI**
- Open credential editor
- Check that both tokens are populated
- Look for "Refresh Token" field with value

**Option B: Via N8N API**
```bash
curl https://n8n.srv995290.hstgr.cloud/api/v1/credentials/mcTEl2a1e0FpodCS \
  -H "Authorization: Bearer $N8N_API_KEY"
```

**Expected Response:**
```json
{
  "id": "mcTEl2a1e0FpodCS",
  "name": "Outlook OAuth2 API",
  "type": "microsoftOutlookOAuth2Api",
  "data": {
    "accessToken": "EwB...",
    "refreshToken": "M.C511...",  ← CRITICAL
    "expiresIn": 3599
  }
}
```

✅ If `refreshToken` is present → **Success!**

---

### Step 3: Reactivate Workflow

Once credential has refresh token:

```bash
curl -X POST https://n8n.srv995290.hstgr.cloud/api/v1/workflows/slA6heIYjTr9tz1R/activate \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "id": "slA6heIYjTr9tz1R",
  "name": "FloWorx Auto Profile Workflow",
  "active": true,
  "workflowActivated": true
}
```

---

## 🛠️ Alternative: Recreate Credential Programmatically

If manual reauthorization doesn't work, recreate the credential:

### Option 1: Delete and Recreate in N8N UI

1. **Delete Old Credential:**
   - Go to N8N > Credentials
   - Delete credential `mcTEl2a1e0FpodCS`

2. **Create New Credential:**
   - Click **"New Credential"**
   - Select **"Microsoft Outlook OAuth2 API"**
   - Fill in:
     - **Client ID:** `896fec20-bae5-4459-8c04-45c33ee7304a`
     - **Client Secret:** `<your-secret>`
   - Click **"Connect"**
   - Complete OAuth flow
   - **Save**

3. **Update Workflow:**
   - Edit workflow `slA6heIYjTr9tz1R`
   - Update all nodes to use new credential
   - Save workflow

### Option 2: Recreate via API

```bash
# 1. Create new credential
CREDENTIAL_RESPONSE=$(curl -X POST https://n8n.srv995290.hstgr.cloud/api/v1/credentials \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Outlook OAuth2 - Refreshed",
    "type": "microsoftOutlookOAuth2Api",
    "data": {
      "clientId": "896fec20-bae5-4459-8c04-45c33ee7304a",
      "clientSecret": "YOUR_CLIENT_SECRET"
    }
  }')

# 2. Extract new credential ID
NEW_CRED_ID=$(echo $CREDENTIAL_RESPONSE | jq -r '.id')

# 3. Complete OAuth via browser
echo "Visit: https://n8n.srv995290.hstgr.cloud/rest/oauth2-credential/callback?cid=$NEW_CRED_ID"

# 4. Update workflow to use new credential
# (Manual step in N8N UI or via workflow update API)
```

---

## 🔍 Verification Checklist

After reauthorization:

- [ ] Credential shows both `accessToken` AND `refreshToken`
- [ ] Credential type is `microsoftOutlookOAuth2Api`
- [ ] Scopes include `offline_access`, `Mail.ReadWrite`, `Mail.Send`
- [ ] Workflow can be activated without errors
- [ ] Test webhook responds with 200 OK
- [ ] Email trigger works when test email received

---

## 🚨 Common Issues

### Issue 1: Consent Screen Doesn't Show All Permissions
**Solution:** Add `&prompt=consent` to OAuth URL to force fresh consent

### Issue 2: Refresh Token Still Missing After Reauth
**Solution:** 
1. Clear browser cookies for login.microsoftonline.com
2. Use incognito/private window
3. Ensure `offline_access` is in scope list
4. Check that consent wasn't auto-granted from cache

### Issue 3: "Invalid Grant" Error
**Solution:**
- Refresh token expired or invalid
- Complete fresh OAuth flow
- Ensure user hasn't changed password
- Check tenant permissions

---

## 📝 Environment Variables Required

```bash
# Azure App Registration
VITE_OUTLOOK_CLIENT_ID=896fec20-bae5-4459-8c04-45c33ee7304a
VITE_OUTLOOK_CLIENT_SECRET=<your-secret>

# N8N Configuration
N8N_API_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=<your-n8n-api-key>

# OAuth Scopes (for reference)
OUTLOOK_SCOPES="openid profile email offline_access Mail.ReadWrite Mail.Send MailboxSettings.ReadWrite"
```

---

## 🎯 Success Criteria

After applying this fix:

✅ N8N credential has both access and refresh tokens  
✅ Workflow activates without errors  
✅ Email trigger responds to new emails  
✅ Webhook endpoints return 200 OK  
✅ No "unable to sign" errors in execution logs  
✅ Token automatically refreshes when expired  

---

## 🔗 Related Documentation

- [OAuth Debug Guide](../guides/OAUTH_DEBUG_GUIDE.md)
- [Email Integration Flow](../guides/EMAIL_VOICE_ANALYSIS_FLOW.md)
- [N8N Workflow Implementation](../guides/N8N_WORKFLOW_IMPLEMENTATION_GUIDE.md)

---

## 📞 Testing After Fix

### Test 1: Manual Webhook Test
```bash
curl -X POST https://n8n.srv995290.hstgr.cloud/webhook/auto-profile-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "fedf818f-986f-4b30-bfa1-7fc339c7bb60",
    "businessType": "pools_spas"
  }'
```

**Expected:** `200 OK` with workflow execution

### Test 2: Send Test Email
1. Send email to connected Outlook account
2. Check N8N executions
3. Verify workflow triggered
4. Check email was processed

### Test 3: Verify Token Refresh
1. Wait for access token to expire (~1 hour)
2. Trigger workflow
3. Check that N8N auto-refreshes token
4. No "unable to sign" errors

---

**Status:** Ready to apply fix  
**Difficulty:** Low (5 minutes)  
**Impact:** High (unblocks all Outlook workflows)

---

**Last Updated:** October 7, 2025

