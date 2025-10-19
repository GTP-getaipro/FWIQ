# 🎯 **TARGETED FIX: Activate User Integrations**

## ✅ **Problem Identified:**

The user **DOES have integrations** in the database, but they're both `inactive`:
- **Outlook:** `inactive`, `HAS_ACCESS_TOKEN`, `NO_REFRESH_TOKEN`
- **Gmail:** `inactive`, `HAS_ACCESS_TOKEN`, `HAS_REFRESH_TOKEN`

The frontend queries for `status=eq.active`, so it finds no results → 406 error.

## 🔧 **IMMEDIATE FIX (Apply This SQL)**

```sql
-- TARGETED FIX: Activate User Integrations
-- This will activate integrations that have valid access tokens

-- Step 1: Check current status
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

-- Step 2: Activate integrations that have access tokens
-- For integrations with refresh tokens, activate them
UPDATE public.integrations
SET 
  status = 'active',
  updated_at = NOW()
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
  AND access_token IS NOT NULL
  AND refresh_token IS NOT NULL;

-- Step 3: For integrations without refresh tokens, we need to handle them differently
-- Let's check if we can get a new refresh token or if we should keep them inactive
-- For now, let's activate the one with refresh token and leave the other inactive

-- Step 4: Verify the fix
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

-- Step 5: Show summary
SELECT 
  provider,
  status,
  COUNT(*) as count
FROM public.integrations
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
GROUP BY provider, status
ORDER BY provider, status;
```

## 📋 **Steps to Apply:**

### Step 1: Apply Database Fix (2 minutes)
1. **Go to:** https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql
2. **Copy the SQL above** (everything between the ```sql markers)
3. **Paste and click "Run"**
4. **Should see:** Gmail integration activated, Outlook remains inactive

### Step 2: Test the System
1. **Refresh your browser page**
2. **Navigate to email integration step**
3. **Should now find the Gmail integration**
4. **For Outlook, you'll need to reconnect** (since it has no refresh token)

## 🎉 **Expected Results:**

After applying the database fix:
- ✅ **Gmail integration will be active** (has both access & refresh tokens)
- ✅ **Outlook integration will remain inactive** (missing refresh token)
- ✅ **No more 406 Not Acceptable errors**
- ✅ **Voice analysis will work** with Gmail integration
- ✅ **User can reconnect Outlook** if needed

## 🔄 **Next Steps:**

1. **Apply the database fix** (SQL above)
2. **Test with Gmail integration** (should work immediately)
3. **For Outlook:** User will need to reconnect via OAuth
4. **System should function normally** with at least one active integration

## 🚨 **Why This Happened:**

The integrations were set to `inactive` status, likely due to:
1. **Missing refresh tokens** (Outlook)
2. **Previous database cleanup** operations
3. **OAuth flow issues** during initial setup

**The SQL fix above will activate the Gmail integration immediately, allowing the system to function while the user can reconnect Outlook separately.**

**Apply the database fix now and your system should work with the Gmail integration!** 🚀
