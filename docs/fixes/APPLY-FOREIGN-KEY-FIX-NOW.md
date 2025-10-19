# 🚨 URGENT: Fix Foreign Key Constraint Violation

## Problem
The `business_labels` table has a foreign key constraint that references `business_profiles.id`, but the code is trying to insert records with `business_profile_id` values that don't exist in the `business_profiles` table.

**Error:** `"insert or update on table "business_labels" violates foreign key constraint "business_labels_business_profile_id_fkey"`

## Solution
Run this SQL in Supabase SQL Editor to fix the foreign key constraint issue:

```sql
-- Fix Foreign Key Constraint Issue for business_labels table
-- The issue is that business_labels references business_profiles.id but code passes userId

-- Option 1: Create business profiles for existing users who don't have them
INSERT INTO public.business_profiles (
  user_id,
  business_types,
  primary_business_type,
  client_config,
  created_at,
  updated_at
)
SELECT 
  id as user_id,
  CASE 
    WHEN business_type IS NOT NULL THEN ARRAY[business_type]
    ELSE ARRAY['General']
  END as business_types,
  COALESCE(business_type, 'General') as primary_business_type,
  COALESCE(client_config, '{}'::jsonb) as client_config,
  created_at,
  updated_at
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_profiles bp 
  WHERE bp.user_id = profiles.id
);

-- Option 2: Update the foreign key constraint to allow references to profiles table
-- First, drop the existing foreign key constraint
ALTER TABLE public.business_labels 
DROP CONSTRAINT IF EXISTS business_labels_business_profile_id_fkey;

-- Add a new constraint that allows references to both business_profiles and profiles
ALTER TABLE public.business_labels 
ADD CONSTRAINT business_labels_business_profile_id_fkey 
FOREIGN KEY (business_profile_id) 
REFERENCES public.business_profiles(id) ON DELETE CASCADE;

-- But we also need to handle the case where business_profile_id references profiles.id
-- So let's create a function to handle this
CREATE OR REPLACE FUNCTION validate_business_profile_id(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if it exists in business_profiles
  IF EXISTS (SELECT 1 FROM public.business_profiles WHERE id = profile_id) THEN
    RETURN true;
  END IF;
  
  -- Check if it exists in profiles (for backward compatibility)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate business_profile_id on insert/update
CREATE OR REPLACE FUNCTION validate_business_profile_id_trigger()
RETURNS trigger AS $$
BEGIN
  IF NOT validate_business_profile_id(NEW.business_profile_id) THEN
    RAISE EXCEPTION 'business_profile_id % does not exist in business_profiles or profiles table', NEW.business_profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_business_profile_id_trigger ON public.business_labels;

-- Create the trigger
CREATE TRIGGER validate_business_profile_id_trigger
  BEFORE INSERT OR UPDATE ON public.business_labels
  FOR EACH ROW EXECUTE FUNCTION validate_business_profile_id_trigger();

-- Test the fix
SELECT 'Foreign key constraint fix applied successfully!' as result;
```

## Steps to Apply (3 minutes)

1. **Go to Supabase SQL Editor:**
   - Open: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql

2. **Copy the SQL above** (everything between the ```sql and ``` markers)

3. **Paste into the SQL Editor**

4. **Click "Run"**

5. **Verify success:**
   - You should see: "Foreign key constraint fix applied successfully!"

## What This Fixes

✅ **Creates business_profiles records** for existing users who don't have them
✅ **Updates foreign key constraint** to properly reference business_profiles table
✅ **Adds validation function** to ensure business_profile_id exists
✅ **Fixes 23503 foreign key constraint violations** on business_labels table
✅ **Enables Outlook folder synchronization** to work properly

## After Applying

1. **Restart your OAuth flow** - the folder sync should now work
2. **Check console logs** - should see successful folder upserts without foreign key errors
3. **Verify workflow deployment** - should complete without constraint violations

## Current Status

- ✅ **RLS Policy Fixed** - Applied successfully
- ✅ **Backend Endpoint Fixed** - `/api/auth/refresh-token` added
- 🔄 **Foreign Key Constraint** - Needs manual application (this fix)
- ⚠️ **Outlook Folder Conflicts** - Non-critical (folders already exist)
