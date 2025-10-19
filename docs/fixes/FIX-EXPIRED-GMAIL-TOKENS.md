# 🚨 URGENT: Fix Expired Gmail Access Token Issue

## ✅ **Problem Identified:**

The Gmail integration is **active** but has **expired/invalid tokens**:
- **Gmail API calls:** `401 Unauthorized` - "Request had invalid authentication credentials"
- **Token refresh:** `401 Unauthorized` - "Invalid refresh token"
- **System tries to use expired tokens** → All Gmail operations fail

## 🔧 **IMMEDIATE FIX (Apply This SQL)**

```sql
-- URGENT: Fix Expired Gmail Access Token
-- The Gmail integration is active but has expired/invalid tokens

-- Step 1: Check current token status
SELECT 
  id,
  user_id,
  provider,
  status,
  CASE 
    WHEN access_token IS NOT NULL THEN 'HAS_ACCESS_TOKEN'
    ELSE 'NO_ACCESS_TOKEN'
  END as access_token_status,
  CASE 
    WHEN refresh_token IS NOT NULL THEN 'HAS_REFRESH_TOKEN'
    ELSE 'NO_REFRESH_TOKEN'
  END as refresh_token_status,
  LENGTH(access_token) as access_token_length,
  LENGTH(refresh_token) as refresh_token_length,
  created_at,
  updated_at
FROM public.integrations
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
ORDER BY created_at DESC;

-- Step 2: Set Gmail integration to inactive since tokens are expired
-- This will prevent the system from trying to use invalid tokens
UPDATE public.integrations
SET 
  status = 'inactive',
  updated_at = NOW()
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
  AND provider = 'gmail'
  AND status = 'active';

-- Step 3: Verify the fix
SELECT 
  id,
  user_id,
  provider,
  status,
  CASE 
    WHEN access_token IS NOT NULL THEN 'HAS_ACCESS_TOKEN'
    ELSE 'NO_ACCESS_TOKEN'
  END as access_token_status,
  CASE 
    WHEN refresh_token IS NOT NULL THEN 'HAS_REFRESH_TOKEN'
    ELSE 'NO_REFRESH_TOKEN'
  END as refresh_token_status,
  created_at,
  updated_at
FROM public.integrations
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
ORDER BY created_at DESC;

-- Step 4: Show summary
SELECT 
  provider,
  status,
  COUNT(*) as count
FROM public.integrations
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
GROUP BY provider, status
ORDER BY provider, status;
```

## 🔧 **Frontend Enhancement (Already Applied)**

I've enhanced the system to:
- ✅ **Handle expired tokens gracefully**
- ✅ **Skip operations when tokens are invalid**
- ✅ **Show user-friendly error messages**
- ✅ **Prevent system crashes** from expired tokens

## 📋 **Steps to Apply:**

### Step 1: Apply Database Fix (2 minutes)
1. **Go to:** https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql
2. **Copy the SQL above** (everything between the ```sql markers)
3. **Paste and click "Run"**
4. **Should see:** Gmail integration set to inactive

### Step 2: Test the System
1. **Refresh your browser page**
2. **Navigate to email integration step**
3. **Should show:** "No active email integration found"
4. **User can reconnect Gmail** with fresh tokens

## 🎉 **Expected Results:**

After applying the database fix:
- ✅ **No more 401 Unauthorized errors**
- ✅ **No more Gmail API failures**
- ✅ **System will show "reconnect email" message**
- ✅ **User can reconnect Gmail** with fresh OAuth flow
- ✅ **Clean error handling** instead of system crashes

## 🔄 **Next Steps:**

1. **Apply the database fix** (SQL above)
2. **User should reconnect Gmail** via OAuth
3. **Fresh tokens will be generated**
4. **System will work normally** with valid tokens

## 🚨 **Why This Happened:**

The Gmail integration had:
1. **Expired access tokens** (Google tokens expire after 1 hour)
2. **Invalid refresh tokens** (refresh tokens can expire or be revoked)
3. **System tried to use expired tokens** → 401 errors
4. **No graceful handling** of expired tokens

**The SQL fix will set the Gmail integration to inactive, preventing the system from trying to use expired tokens. The user can then reconnect Gmail to get fresh tokens.**

## 🎯 **Root Cause Summary:**

- ✅ **Database issue:** Gmail integration marked as active with expired tokens
- ✅ **API issue:** Gmail API rejecting expired access tokens
- ✅ **Refresh issue:** Refresh tokens also expired/invalid
- ✅ **System issue:** No graceful handling of expired tokens

**Apply the database fix now and the user can reconnect Gmail with fresh tokens!** 🚀
