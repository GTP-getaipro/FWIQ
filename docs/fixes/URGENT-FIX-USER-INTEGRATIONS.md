# 🚨 URGENT: Fix User Integrations & Authentication Issues

## Problem Analysis:
1. **406 Not Acceptable Error** - RLS policy blocking access to integrations
2. **No Active Integrations Found** - User has no integrations in database
3. **Authentication Context Issue** - RLS policy requires `auth.uid() = user_id`

## 🔧 **IMMEDIATE FIX (Apply This SQL)**

```sql
-- COMPREHENSIVE FIX FOR USER INTEGRATIONS ISSUE
-- This addresses the 406 Not Acceptable error and missing integrations

-- Step 1: Check current status for the specific user
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

-- Step 2: Check if there are any integrations for this user (regardless of status)
SELECT 
  COUNT(*) as total_integrations,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_integrations,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_integrations,
  COUNT(CASE WHEN refresh_token IS NOT NULL THEN 1 END) as with_refresh_token,
  COUNT(CASE WHEN refresh_token IS NULL THEN 1 END) as without_refresh_token
FROM public.integrations
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';

-- Step 3: If no integrations exist, create placeholder integrations
-- This will allow the user to reconnect their email accounts
INSERT INTO public.integrations (
  user_id,
  provider,
  status,
  access_token,
  refresh_token,
  scopes,
  created_at,
  updated_at
)
SELECT 
  'fedf818f-986f-4b30-bfa1-7fc339c7bb60' as user_id,
  provider,
  'inactive' as status,
  NULL as access_token,
  NULL as refresh_token,
  CASE 
    WHEN provider = 'gmail' THEN ARRAY['https://www.googleapis.com/auth/gmail.labels', 'https://www.googleapis.com/auth/gmail.readonly']
    WHEN provider = 'outlook' THEN ARRAY['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.ReadWrite']
  END as scopes,
  NOW() as created_at,
  NOW() as updated_at
FROM (VALUES ('gmail'), ('outlook')) AS providers(provider)
WHERE NOT EXISTS (
  SELECT 1 FROM public.integrations 
  WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60' 
  AND provider = providers.provider
);

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
```

## 🔧 **Frontend Fix (Already Applied)**

I've enhanced the OAuth session handling to:
- ✅ **Validate refresh tokens** before storing integrations
- ✅ **Log detailed token analysis** for debugging
- ✅ **Show user-friendly errors** when refresh tokens are missing
- ✅ **Prevent incomplete integrations** from being stored

## 📋 **Steps to Apply:**

### Step 1: Apply Database Fix (2 minutes)
1. **Go to:** https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql
2. **Copy the SQL above** (everything between the ```sql markers)
3. **Paste and click "Run"**
4. **Should see:** Summary showing integrations for the user

### Step 2: Test the OAuth Flow
1. **Refresh your browser page** (to get updated OAuth validation)
2. **Navigate to email integration step**
3. **Click "Connect Outlook"**
4. **Complete the OAuth authorization**
5. **Should work without 406 errors!**

## 🎉 **Expected Results:**

After applying the database fix:
- ✅ **No more 406 Not Acceptable errors**
- ✅ **User will have placeholder integrations**
- ✅ **OAuth flow will complete successfully**
- ✅ **Proper validation of OAuth sessions**
- ✅ **Graceful handling of missing refresh tokens**

## 🚨 **Root Cause:**

The user `fedf818f-986f-4b30-bfa1-7fc339c7bb60` has **no integrations** in the database, which causes:
1. **406 Error** - RLS policy blocks access when no data exists
2. **"No active email integration found"** - Frontend can't find any integrations
3. **Voice analysis failure** - No email integration to analyze

**The SQL fix above will create placeholder integrations for both Gmail and Outlook, allowing the user to reconnect their accounts.**

## 🔄 **Next Steps:**

1. **Apply the database fix** (SQL above)
2. **Test the OAuth flow** 
3. **User should be able to connect Outlook successfully**
4. **Voice analysis should work** after OAuth completion

**Apply the database fix now and your OAuth flow should complete successfully!** 🚀
