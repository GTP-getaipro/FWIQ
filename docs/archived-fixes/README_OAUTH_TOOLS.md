# OAuth Token Refresh Diagnostic & Fix Tools

A comprehensive toolkit to diagnose and fix OAuth token refresh issues in your Floworx → Supabase → n8n → Microsoft Outlook integration stack.

## 📦 What's Included

| File | Purpose | When to Use |
|------|---------|-------------|
| **diagnose-oauth-token-refresh.js** | 🔍 Comprehensive diagnostic | Identify which users/integrations have issues |
| **fix-oauth-token-flow.js** | 🔧 Automated fix script | Apply fixes to database and mark users for re-auth |
| **verify-oauth-flow.js** | ✅ Verification script | Confirm everything is correctly configured |
| **verify-oauth-flow.ps1** | 🪟 PowerShell wrapper | Windows-friendly verification |
| **OAUTH_TOKEN_REFRESH_GUIDE.md** | 📚 Complete guide | Deep technical explanation and troubleshooting |
| **OAUTH_QUICK_START.md** | ⚡ Quick reference | Get up and running in 5 minutes |

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure dependencies are installed
npm install

# Set required environment variables in .env:
# - VITE_SUPABASE_URL or SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - N8N_API_URL or VITE_N8N_API_URL
# - N8N_API_KEY
```

### Step-by-Step Workflow

#### 1️⃣ **Diagnose** (Identify the Problem)

```bash
# Run diagnostic to see what's broken
node diagnose-oauth-token-refresh.js
```

**Output:**
- 📊 Summary statistics (OK/Warnings/Critical)
- 🚨 List of users who will fail on re-login
- ⚠️ Common issues across integrations
- 📄 JSON report: `oauth-token-diagnostic-{timestamp}.json`

**Example:**
```
📊 Total Integrations: 15
✅ OK: 5
⚠️  Warnings: 3
❌ Critical: 7

🔍 Common Issues:
   [7x] Missing refresh token in n8n credential
   [3x] Token desync: Supabase and n8n have different access tokens

🚨 CRITICAL ISSUES (Users Will Fail on Re-Login)
User: 123e4567-e89b-12d3-a456-426614174000
Issues:
  • Missing refresh token in n8n credential
Recommendation: User must re-authorize with offline_access scope
```

---

#### 2️⃣ **Fix** (Apply Automated Fixes)

```bash
# Preview changes (dry run - no changes made)
node fix-oauth-token-flow.js --dry-run

# Apply fixes
node fix-oauth-token-flow.js
```

**What it does:**
1. ✅ Removes `access_token` and `refresh_token` columns from Supabase `integrations` table
2. ✅ Marks integrations without refresh tokens as `reauth_required`
3. ✅ Identifies and marks orphaned credentials as `disconnected`
4. ✅ Generates SQL migration file for permanent schema changes
5. ✅ Creates JSON report: `oauth-fix-results-{timestamp}.json`

**Output:**
```
Summary:
  - Tokens removed: 12
  - Marked for reauth: 7
  - Orphaned credentials cleaned: 2

Next steps:
  1. Review the generated SQL migration file
  2. Apply the migration to remove token columns permanently
  3. Update your OAuth flow to ensure offline_access scope
  4. Notify affected users to re-authorize their connections
```

---

#### 3️⃣ **Verify** (Confirm Everything Works)

```bash
# Unix/Linux/macOS
node verify-oauth-flow.js

# Windows (PowerShell)
.\verify-oauth-flow.ps1
```

**What it checks:**
- ✅ Supabase schema (token columns removed, required columns present)
- ✅ n8n API connectivity and configuration
- ✅ Integration integrity (valid credential IDs)
- ✅ OAuth scope configuration
- ✅ Environment variables

**Output:**
```
✅ Supabase Connection - Successfully connected
✅ Token Column Removal - No token columns in integrations table
✅ Required Columns - All required columns present
✅ n8n API Connection - Successfully connected
✅ Microsoft Outlook Credentials - Found 15 Outlook credentials
✅ Refresh Token Check - Sample credential has refresh token

Passed: 12
Warnings: 2
Failed: 0

✨ All checks passed! Your OAuth flow is correctly configured.
```

---

## 🧰 Detailed Tool Documentation

### diagnose-oauth-token-refresh.js

**Purpose:** Identifies OAuth token issues across your entire user base.

**Usage:**
```bash
node diagnose-oauth-token-refresh.js
```

**Checks performed:**
- ✅ Supabase integration records
- ✅ n8n credential existence
- ✅ Presence of `accessToken` and `refreshToken`
- ✅ Token expiration status
- ✅ Token synchronization between Supabase and n8n
- ✅ n8n configuration (API accessibility)

**Output files:**
- `oauth-token-diagnostic-{timestamp}.json` - Full diagnostic report

**Exit codes:**
- `0` - No critical issues (may have warnings)
- `1` - Critical issues found (users will fail on re-login)

**Report structure:**
```json
{
  "timestamp": "2024-10-08T10:30:00.000Z",
  "summary": {
    "total": 15,
    "ok": 5,
    "warnings": 3,
    "critical": 7,
    "byProvider": { "outlook": 15 },
    "commonIssues": {
      "Missing refresh token in n8n credential": 7
    }
  },
  "results": [
    {
      "user_id": "...",
      "provider": "outlook",
      "status": "active",
      "severity": "CRITICAL",
      "issues": ["Missing refresh token in n8n credential"],
      "recommendation": "User must re-authorize with offline_access scope"
    }
  ],
  "recommendations": [...]
}
```

---

### fix-oauth-token-flow.js

**Purpose:** Automatically fixes common OAuth token issues.

**Usage:**
```bash
# Dry run (preview changes)
node fix-oauth-token-flow.js --dry-run

# Apply changes
node fix-oauth-token-flow.js
```

**Operations:**

1. **Remove tokens from Supabase**
   - Finds integrations with `access_token` or `refresh_token` columns
   - Sets both to `NULL`
   - Updates `updated_at` timestamp

2. **Mark integrations for re-authorization**
   - Checks n8n credentials for `refreshToken`
   - Marks those without as `status='reauth_required'`

3. **Clean up orphaned credentials**
   - Verifies each `n8n_credential_id` exists in n8n
   - Marks integrations with non-existent credentials as `status='disconnected'`

4. **Generate SQL migration**
   - Creates migration file to permanently remove token columns
   - Includes backup table creation

**Output files:**
- `oauth-fix-results-{timestamp}.json` - Fix operation results
- `remove-integration-tokens-{timestamp}.sql` - Database migration

**Safety features:**
- ✅ Dry-run mode (no changes applied)
- ✅ Confirmation prompt before applying
- ✅ Creates backup of token data before deletion
- ✅ Detailed logging of all operations

---

### verify-oauth-flow.js

**Purpose:** Verifies OAuth token refresh flow is correctly configured.

**Usage:**
```bash
node verify-oauth-flow.js
# Or on Windows:
.\verify-oauth-flow.ps1
```

**Verification checks:**

| Check | Pass Criteria | Fail Impact |
|-------|---------------|-------------|
| **Supabase Connection** | Successfully connects to database | Cannot verify schema |
| **Token Column Removal** | No `access_token` or `refresh_token` columns | Token desync possible |
| **Required Columns** | Has `user_id`, `provider`, `n8n_credential_id`, `status` | Integration tracking broken |
| **n8n API Connection** | Successfully connects to n8n | Cannot verify credentials |
| **Refresh Token Check** | Sample credential has `refreshToken` | Auto-refresh will fail |
| **Orphaned Credentials** | All credential IDs valid in n8n | Users see errors |
| **Environment Variables** | OAuth vars present | OAuth flow will fail |

**Output files:**
- `oauth-verification-{timestamp}.json` - Verification results

**Exit codes:**
- `0` - All checks passed or warnings only
- `1` - Critical failures detected

---

## 🔧 Configuration

### Required Environment Variables

Create a `.env` file with:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n
N8N_API_URL=https://your-n8n-instance.com/api/v1
N8N_API_KEY=your-n8n-api-key

# Microsoft OAuth (for verification)
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/oauth-callback-n8n
```

### Dependencies

The scripts require the following npm packages (already in your package.json):

```json
{
  "@supabase/supabase-js": "^2.x",
  "axios": "^1.x",
  "dotenv": "^16.x"
}
```

---

## 📋 Common Scenarios

### Scenario 1: New Installation

**Goal:** Verify OAuth is set up correctly from the start.

```bash
# 1. Verify configuration
node verify-oauth-flow.js

# 2. After first user connects, run diagnostic
node diagnose-oauth-token-refresh.js

# 3. If issues found, apply fixes
node fix-oauth-token-flow.js
```

---

### Scenario 2: Users Complaining About Re-Auth

**Goal:** Identify and fix broken integrations.

```bash
# 1. Diagnose to identify affected users
node diagnose-oauth-token-refresh.js

# 2. Review the report (oauth-token-diagnostic-*.json)
cat oauth-token-diagnostic-*.json

# 3. Apply fixes
node fix-oauth-token-flow.js

# 4. Notify affected users (those marked reauth_required)
```

---

### Scenario 3: After Code Update

**Goal:** Ensure new OAuth flow is working correctly.

```bash
# 1. Verify new configuration
node verify-oauth-flow.js

# 2. Test with a new user connection
# (manually connect Outlook)

# 3. Re-run diagnostic to confirm
node diagnose-oauth-token-refresh.js

# 4. Should see all green (or migrate old users)
node fix-oauth-token-flow.js
```

---

### Scenario 4: Production Health Check

**Goal:** Regular monitoring of OAuth token health.

```bash
# Weekly/monthly check
node diagnose-oauth-token-refresh.js

# Review summary
# If critical issues > 0, investigate
# If common issues pattern emerges, fix root cause
```

---

## 🚨 Troubleshooting

### Problem: "Missing Supabase configuration"

**Solution:**
```bash
# Check .env file exists and has required vars
cat .env | grep SUPABASE

# Or set directly:
export VITE_SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

---

### Problem: "n8n API check failed"

**Causes:**
1. Wrong API URL (check trailing slashes)
2. Invalid API key
3. n8n instance not accessible

**Solution:**
```bash
# Test manually
curl -X GET "https://your-n8n.com/api/v1/credentials" \
  -H "X-N8N-API-KEY: your-key"

# Should return JSON, not 401/403
```

---

### Problem: "All integrations marked as critical"

**Likely cause:** Missing `offline_access` scope in OAuth flow.

**Solution:**
1. Update backend OAuth URL to include `offline_access`
2. Force all users to re-authorize
3. Re-run diagnostic to confirm

---

### Problem: Scripts hang or timeout

**Possible causes:**
- Large number of integrations
- Slow n8n API responses
- Network issues

**Solution:**
```bash
# Add timeout to API calls (modify scripts if needed)
# Or run diagnostic on subset of users
# Or increase Node.js timeout:
NODE_OPTIONS=--max-http-header-size=80000 node diagnose-oauth-token-refresh.js
```

---

## 📊 Interpreting Results

### Severity Levels

| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| **OK** ✅ | Integration healthy | None |
| **WARNING** ⚠️ | Potential issue, may work | Monitor; fix if problems occur |
| **CRITICAL** ❌ | Will fail on next login | Immediate action required |

### Common Issues & Fixes

| Issue | Root Cause | Fix |
|-------|------------|-----|
| Missing refresh token | OAuth flow doesn't request `offline_access` | Update backend code; force re-auth |
| Token desync | Storing tokens in both Supabase and n8n | Remove from Supabase; use n8n only |
| Orphaned credential | n8n credential deleted but Supabase still references it | Run fix script; user re-auths |
| Missing credential ID | Integration created without n8n credential | User re-auths |

---

## 🎯 Success Metrics

After applying fixes, you should see:

- ✅ **0 critical issues** in diagnostic
- ✅ **No 401/403 errors** in workflow logs
- ✅ **0 re-auth prompts** on user re-login
- ✅ **Automatic token refresh** working (check n8n logs)

---

## 📚 Additional Resources

- **Complete Technical Guide:** [OAUTH_TOKEN_REFRESH_GUIDE.md](./OAUTH_TOKEN_REFRESH_GUIDE.md)
- **Quick Reference:** [OAUTH_QUICK_START.md](./OAUTH_QUICK_START.md)
- **Microsoft OAuth Docs:** https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
- **n8n Credentials Docs:** https://docs.n8n.io/credentials/

---

## 🤝 Support

If you encounter issues not covered by these tools:

1. Review the generated JSON reports for detailed diagnostics
2. Check the comprehensive guide for deeper technical explanations
3. Verify your OAuth flow code against the examples in the guide

---

**Last Updated:** October 8, 2024  
**Version:** 1.0.0  
**Compatibility:** Node.js 16+, Supabase, n8n


