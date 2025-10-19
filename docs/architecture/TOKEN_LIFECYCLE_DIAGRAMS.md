# 🔄 OAuth Token Lifecycle - Visual Diagrams

## Overview
Visual diagrams showing the complete OAuth token lifecycle across all system components.

---

## 📊 Diagram 1: Initial OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INITIAL OAUTH AUTHORIZATION                      │
└─────────────────────────────────────────────────────────────────────┘

User                Frontend              Microsoft           Backend              N8N                Supabase
 │                     │                      │                  │                   │                    │
 │  Click "Connect"    │                      │                  │                   │                    │
 ├────────────────────►│                      │                  │                   │                    │
 │                     │  Build OAuth URL     │                  │                   │                    │
 │                     │  (with offline_access)                  │                   │                    │
 │                     ├─────────────────────►│                  │                   │                    │
 │                     │                      │  Show Consent    │                   │                    │
 │  Grant Permission   │◄─────────────────────┤                  │                   │                    │
 ├────────────────────►│                      │                  │                   │                    │
 │                     │                      │  Return code     │                   │                    │
 │                     │◄─────────────────────┤                  │                   │                    │
 │                     │                      │                  │                   │                    │
 │                     │  POST /api/oauth/exchange-token        │                   │                    │
 │                     ├──────────────────────────────────────►│                   │                    │
 │                     │                      │                  │                   │                    │
 │                     │                      │  POST token      │                   │                    │
 │                     │                      │  endpoint        │                   │                    │
 │                     │                      │◄─────────────────┤                   │                    │
 │                     │                      │                  │                   │                    │
 │                     │                      │  Return tokens   │                   │                    │
 │                     │                      │  {access_token,  │                   │                    │
 │                     │                      │   refresh_token} │                   │                    │
 │                     │                      ├─────────────────►│                   │                    │
 │                     │                      │                  │                   │                    │
 │                     │                      │                  │  POST /credentials                     │
 │                     │                      │                  ├──────────────────►│                    │
 │                     │                      │                  │                   │                    │
 │                     │                      │                  │  Store tokens     │                    │
 │                     │                      │                  │  {accessToken,    │                    │
 │                     │                      │                  │   refreshToken}   │                    │
 │                     │                      │                  │◄──────────────────┤                    │
 │                     │                      │                  │                   │                    │
 │                     │                      │                  │  credential_id    │                    │
 │                     │                      │                  ├───────────────────────────────────────►│
 │                     │                      │                  │                   │                    │
 │                     │                      │                  │  INSERT integration                    │
 │                     │                      │                  │  {user_id,                             │
 │                     │                      │                  │   provider,                            │
 │                     │                      │                  │   n8n_credential_id,                   │
 │                     │                      │                  │   status: 'active'}                    │
 │                     │                      │                  │◄───────────────────────────────────────┤
 │                     │                      │                  │                   │                    │
 │  Success Toast      │◄─────────────────────────────────────│                   │                    │
 │◄────────────────────┤                      │                  │                   │                    │
 │                     │                      │                  │                   │                    │

Result: 
  ✅ N8N has both access_token AND refresh_token
  ✅ Supabase has n8n_credential_id link
  ✅ User can re-login without OAuth prompt
```

---

## 📊 Diagram 2: User Re-Login (Silent Reauth)

```
┌─────────────────────────────────────────────────────────────────────┐
│              USER RE-LOGIN (SILENT REAUTHORIZATION)                 │
└─────────────────────────────────────────────────────────────────────┘

User            Frontend          Supabase           N8N            Microsoft Graph
 │                 │                  │                │                   │
 │  Login          │                  │                │                   │
 ├────────────────►│                  │                │                   │
 │                 │  Check Session   │                │                   │
 │                 ├─────────────────►│                │                   │
 │                 │◄─────────────────┤                │                   │
 │                 │  Session OK      │                │                   │
 │                 │                  │                │                   │
 │  Load Dashboard │                  │                │                   │
 ├────────────────►│                  │                │                   │
 │                 │                  │                │                   │
 │                 │  GET integrations│                │                   │
 │                 ├─────────────────►│                │                   │
 │                 │◄─────────────────┤                │                   │
 │                 │  status='active' │                │                   │
 │                 │  n8n_cred_id=XXX │                │                   │
 │                 │                  │                │                   │
 │                 │  Verify credential exists         │                   │
 │                 ├────────────────────────────────►│                   │
 │                 │◄────────────────────────────────┤                   │
 │                 │  Credential valid                │                   │
 │                 │  (has refreshToken)              │                   │
 │                 │                  │                │                   │
 │  Show Dashboard │                  │                │                   │
 │  (No OAuth!)    │                  │                │                   │
 │◄────────────────┤                  │                │                   │
 │                 │                  │                │                   │
 │  Trigger Email  │                  │                │                   │
 │  Workflow       │                  │                │                   │
 ├────────────────►│                  │                │                   │
 │                 │                  │                │                   │
 │                 │  Execute workflow with credential │                   │
 │                 ├────────────────────────────────►│                   │
 │                 │                  │                │                   │
 │                 │                  │                │  Check if expired │
 │                 │                  │                │  If yes: refresh  │
 │                 │                  │                │  using refreshToken│
 │                 │                  │                ├──────────────────►│
 │                 │                  │                │◄──────────────────┤
 │                 │                  │                │  New access_token │
 │                 │                  │                │                   │
 │                 │                  │                │  Use fresh token  │
 │                 │                  │                ├──────────────────►│
 │                 │                  │                │◄──────────────────┤
 │                 │                  │                │  API Response     │
 │                 │◄────────────────────────────────┤                   │
 │                 │  Workflow Success                │                   │
 │                 │                  │                │                   │
 │  Email Result   │                  │                │                   │
 │◄────────────────┤                  │                │                   │
 │                 │                  │                │                   │

Result:
  ✅ No OAuth prompt shown
  ✅ Token auto-refreshed if needed
  ✅ Seamless user experience
```

---

## 📊 Diagram 3: Token Refresh (Automatic)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTOMATIC TOKEN REFRESH                          │
└─────────────────────────────────────────────────────────────────────┘

Workflow Execution      N8N Credential Store      Microsoft Token Endpoint
       │                         │                           │
       │  1. Check if token      │                           │
       │     is expired          │                           │
       ├────────────────────────►│                           │
       │                         │                           │
       │  2. Token expired       │                           │
       │     (expiresIn < now)   │                           │
       │◄────────────────────────┤                           │
       │                         │                           │
       │  3. Need refresh        │                           │
       │                         │  4. POST refresh_token    │
       │                         │     grant_type=refresh... │
       │                         ├──────────────────────────►│
       │                         │                           │
       │                         │  5. Validate refresh      │
       │                         │     token                 │
       │                         │                           │
       │                         │◄──────────────────────────┤
       │                         │  6. Return new tokens     │
       │                         │     {access_token,        │
       │                         │      refresh_token (new), │
       │                         │      expires_in}          │
       │                         │                           │
       │  7. Update credential   │                           │
       │     data with new tokens│                           │
       │◄────────────────────────┤                           │
       │                         │                           │
       │  8. Continue workflow   │                           │
       │     with fresh token    │                           │
       ▼                         │                           │
  Graph API Call                 │                           │
  (Success)                      │                           │

Timeline: ~500ms total
User Experience: No interruption, seamless
```

---

## 📊 Diagram 4: Failure Scenario (Missing Refresh Token)

```
┌─────────────────────────────────────────────────────────────────────┐
│              FAILURE: MISSING REFRESH TOKEN                         │
└─────────────────────────────────────────────────────────────────────┘

Workflow Execution      N8N Credential           Result
       │                      │                      │
       │  Check token         │                      │
       ├─────────────────────►│                      │
       │                      │                      │
       │  Token expired       │                      │
       │◄─────────────────────┤                      │
       │                      │                      │
       │  Attempt refresh     │                      │
       ├─────────────────────►│                      │
       │                      │                      │
       │  ❌ refreshToken     │                      │
       │     is NULL          │                      │
       │◄─────────────────────┤                      │
       │                      │                      │
       │  Cannot refresh      │                      │
       │                      │                      │
       ▼                      │                      ▼
  Workflow FAILS              │              "Unable to sign
  Error logged                │               without access token"
       │                      │                      │
       │                      │                      │
       └──────────────────────┴──────────────────────┘
                             ↓
                    User sees error OR
                    Integration marked inactive

FIX: Reauthorize credential with offline_access scope
```

---

## 📊 Diagram 5: Token Desynchronization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TOKEN DESYNCHRONIZATION                          │
└─────────────────────────────────────────────────────────────────────┘

Scenario: Tokens stored in BOTH Supabase and N8N

Supabase                    N8N                   Microsoft
   │                         │                        │
   │  access_token_v1        │  accessToken_v1        │
   │  refresh_token_v1       │  refreshToken_v1       │
   │                         │                        │
   │                         │  Token expires         │
   │                         ├───────────────────────►│
   │                         │                        │
   │                         │◄───────────────────────┤
   │                         │  New tokens            │
   │  STILL HAS v1! ❌       │  accessToken_v2 ✅     │
   │  (Not updated)          │  refreshToken_v2 ✅    │
   │                         │                        │
   │  Next workflow uses     │                        │
   │  OLD token from         │                        │
   │  Supabase ❌            │                        │
   │                         │                        │
   ▼                         │                        ▼
  FAILS                      │                   401 Unauthorized

SOLUTION: Store tokens ONLY in N8N, reference by ID in Supabase
```

---

## 📊 Diagram 6: Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│              RECOMMENDED: N8N AS SINGLE SOURCE OF TRUTH             │
└─────────────────────────────────────────────────────────────────────┘

╔═══════════════╗         ╔═══════════════╗         ╔═══════════════╗
║   Supabase    ║         ║     N8N       ║         ║  Microsoft    ║
║ (Metadata DB) ║         ║(Token Store)  ║         ║    Graph      ║
╚═══════════════╝         ╚═══════════════╝         ╚═══════════════╝
       │                          │                          │
       │  Stores:                 │  Stores:                 │
       │  • user_id               │  • access_token          │
       │  • provider              │  • refresh_token         │
       │  • n8n_credential_id     │  • expires_in            │
       │  • status                │  • client_id             │
       │                          │  • client_secret         │
       │  NO TOKENS! ✅           │                          │
       │                          │  AUTHORITATIVE ✅        │
       │                          │                          │
       │                          │  Auto-refreshes ✅       │
       │                          │                          │
       └──────────────────────────┼──────────────────────────┘
                                  │
                        Single Source of Truth
                        for OAuth Tokens

BENEFITS:
  ✅ No token desynchronization
  ✅ Automatic refresh handling
  ✅ Clear separation of concerns
  ✅ Easier to debug
  ✅ Production-proven pattern
```

---

## 📊 Diagram 7: Decision Tree - Show OAuth?

```
                    User Logs In
                         │
                         ▼
              ┌──────────────────────┐
              │ Check Supabase       │
              │ integrations table   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Integration exists?  │
              └──┬────────────────┬──┘
                 │ NO             │ YES
                 ▼                ▼
         ┌─────────────┐   ┌─────────────────┐
         │ Show OAuth  │   │ status='active'?│
         │ Prompt      │   └──┬──────────┬───┘
         └─────────────┘      │ NO       │ YES
                              ▼          ▼
                      ┌────────────┐  ┌────────────────────┐
                      │ Show OAuth │  │ n8n_credential_id  │
                      │ Prompt     │  │ exists?            │
                      └────────────┘  └──┬─────────────┬───┘
                                         │ NO          │ YES
                                         ▼             ▼
                                  ┌────────────┐  ┌──────────────┐
                                  │ Show OAuth │  │ Verify N8N   │
                                  │ Prompt     │  │ credential   │
                                  └────────────┘  └──┬───────┬───┘
                                                     │ FAIL  │ PASS
                                                     ▼       ▼
                                              ┌────────────┐  ┌─────────────┐
                                              │ Show OAuth │  │ Continue    │
                                              │ Prompt     │  │ to Dashboard│
                                              └────────────┘  │ NO OAUTH! ✅│
                                                              └─────────────┘

KEY DECISION POINTS:
  1. Does integration exist?
  2. Is status 'active'?
  3. Is n8n_credential_id present?
  4. Does N8N credential exist?
  5. Does credential have refreshToken?

IF ALL YES → No OAuth prompt needed ✅
```

---

## 📊 Diagram 8: Token Expiry Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TOKEN EXPIRY TIMELINE                          │
└─────────────────────────────────────────────────────────────────────┘

Time:    0min          30min          55min          60min         65min
         │             │              │              │             │
         │             │              │              │             │
OAuth    │             │              │              │             │
Complete ▼             │              │              │             │
      ┌─────┐          │              │              │             │
      │Token│          │              │              │             │
      │Valid│          │              │              │             │
      └─────┘          │              │              │             │
         │             ▼              │              │             │
         │        Still Valid         │              │             │
         │             │              ▼              │             │
         │             │        ⚠️ Expiring Soon     │             │
         │             │        (< 5 min left)       │             │
         │             │              │              ▼             │
         │             │              │         ❌ EXPIRED         │
         │             │              │              │             ▼
         │             │              │              │        🔄 Auto
         │             │              │              │        Refresh
         │             │              │              │             │
         │             │              │              │             ▼
         │             │              │              │        ✅ New Token
         │             │              │              │        (Next 60min)
         │             │              │              │

Access Token:    ████████████████████████████████████████▓▓▓▓▓▓
                 │←────── Valid ──────→│←Expiring→│X│←Refresh→│

Refresh Token:   ███████████████████████████████████████████████████...
                 │←────────────────── Valid (90 days) ──────────────→│

KEY:
  ████ Token valid and usable
  ▓▓▓▓ Token expiring soon (< 5 min)
  XXXX Token expired
  .... Long-lived (90 days no activity)
```

---

## 📊 Diagram 9: Diagnostic & Fix Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   DIAGNOSTIC & AUTO-FIX FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

                  npm run ops:diagnose
                          │
                          ▼
          ┌───────────────────────────────┐
          │ Query Supabase integrations   │
          └───────────────┬───────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │ For each integration:         │
          │ 1. Check Supabase tokens      │
          │ 2. Check N8N credential       │
          │ 3. Verify refresh token       │
          └───────────────┬───────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │  Healthy   │      │  Issues    │
         │  (report)  │      │  Found     │
         └────────────┘      └─────┬──────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Categorize by severity:       │
                   │ • CRITICAL (no refresh token) │
                   │ • WARNING (desync, inactive)  │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                      npm run ops:auto-fix
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
       ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
       │ Deactivate   │   │ Clean        │  │ Mark for     │
       │ broken       │   │ orphaned     │  │ reauth       │
       │ integrations │   │ references   │  │              │
       └──────────────┘   └──────────────┘  └──────────────┘
                │                  │                  │
                └──────────────────┴──────────────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ Generate report     │
                        │ Show actions needed │
                        └─────────────────────┘
                                   │
                                   ▼
                        Manual reauthorization
                        in N8N (if needed)
```

---

## 🎯 Key Takeaways

### Token Storage Strategy
```
✅ CORRECT:
  Supabase:  {user_id, provider, n8n_credential_id, status}
  N8N:       {accessToken, refreshToken, expiresIn}
  
❌ WRONG:
  Supabase:  {user_id, provider, access_token, refresh_token}
  N8N:       {accessToken} ← Missing refreshToken!
```

### Critical Requirements
1. **offline_access** scope MUST be in OAuth URL
2. **refresh_token** MUST be stored in N8N credential
3. **n8n_credential_id** MUST be linked in Supabase
4. **N8N refresh** MUST be enabled in config

### Diagnostic Commands
```bash
npm run ops:diagnose        # Identify issues
npm run ops:auto-fix        # Attempt automated fix
npm run ops:full-diagnostic # Complete diagnosis + fix
```

---

## 📚 Related Documentation

- [OAuth Token Flow Architecture](./OAUTH_TOKEN_FLOW_ARCHITECTURE.md)
- [OAuth Credential Management](../guides/OAUTH_CREDENTIAL_MANAGEMENT.md)
- [Outlook OAuth Fix](../fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md)
- [N8N Troubleshooting](../systems/N8N_CREDENTIAL_TROUBLESHOOTING.md)

---

**Visual diagrams make complex flows easier to understand!**

**Use these diagrams when:**
- Debugging OAuth issues
- Onboarding new developers
- Planning architecture changes
- Explaining system behavior

---

**Last Updated:** October 7, 2025  
**Maintained By:** FloworxV2 Architecture Team

