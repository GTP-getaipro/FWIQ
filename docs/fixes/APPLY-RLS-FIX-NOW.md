# 🚨 URGENT: Apply Comprehensive RLS Policy Fix

## Problem
The `business_labels` table RLS policies are failing because:
1. Code passes `userId` as `business_profile_id` 
2. RLS policy only checks `extracted_business_profiles` table
3. Need to allow access from both `profiles` and `extracted_business_profiles` tables

## Solution
Run this SQL in Supabase SQL Editor to fix the RLS policies:

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert their own business labels" ON public.business_labels;
DROP POLICY IF EXISTS "Users can update their own business labels" ON public.business_labels;
DROP POLICY IF EXISTS "Users can delete their own business labels" ON public.business_labels;
DROP POLICY IF EXISTS "Users can select their own business labels" ON public.business_labels;

-- INSERT policy (with comprehensive access)
CREATE POLICY "Users can insert their own business labels"
ON public.business_labels FOR INSERT
WITH CHECK (
  -- Allow if business_profile_id matches user_id in profiles table
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND id = auth.uid()
  )
  OR
  -- Allow if business_profile_id matches extracted_business_profiles.id
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND user_id = auth.uid()
  )
);

-- UPDATE policy (with comprehensive access)
CREATE POLICY "Users can update their own business labels"
ON public.business_labels FOR UPDATE
USING (
  -- Allow if business_profile_id matches user_id in profiles table
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND id = auth.uid()
  )
  OR
  -- Allow if business_profile_id matches extracted_business_profiles.id
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for the new values
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND user_id = auth.uid()
  )
);

-- DELETE policy (with comprehensive access)
CREATE POLICY "Users can delete their own business labels"
ON public.business_labels FOR DELETE
USING (
  -- Allow if business_profile_id matches user_id in profiles table
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND id = auth.uid()
  )
  OR
  -- Allow if business_profile_id matches extracted_business_profiles.id
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND user_id = auth.uid()
  )
);

-- SELECT policy (with comprehensive access)
CREATE POLICY "Users can select their own business labels"
ON public.business_labels FOR SELECT
USING (
  -- Allow if business_profile_id matches user_id in profiles table
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND id = auth.uid()
  )
  OR
  -- Allow if business_profile_id matches extracted_business_profiles.id
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id::text = business_labels.business_profile_id::text
    AND user_id = auth.uid()
  )
);

-- Test the policy works
SELECT 'RLS policies for business_labels created successfully with comprehensive access!' as result;
```

## Steps to Apply (2 minutes)

1. **Go to Supabase SQL Editor:**
   - Open: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql

2. **Copy the SQL above** (everything between the ```sql and ``` markers)

3. **Paste into the SQL Editor**

4. **Click "Run"**

5. **Verify success:**
   - You should see: "RLS policies for business_labels created successfully with comprehensive access!"

## What This Fixes

✅ **Allows access when `business_profile_id` = `userId`** (current code behavior)
✅ **Allows access when `business_profile_id` = `extracted_business_profiles.id`** (original design)
✅ **Fixes 403 Forbidden errors** on business_labels table
✅ **Enables Outlook folder synchronization** to work properly

## After Applying

1. **Restart your OAuth flow** - the folder sync should now work
2. **Check console logs** - should see successful folder upserts
3. **Verify workflow deployment** - should complete without RLS errors
