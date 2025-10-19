# 🚨 URGENT: Fix RLS Policy for business_labels Table

## Problem
The `business_labels` table has Row-Level Security policies that are failing because of type mismatch between:
- `business_labels.business_profile_id` (bigint)
- `extracted_business_profiles.id` (uuid)

## Solution
Run the SQL from `working-rls-policy.sql` in your Supabase SQL Editor.

## Steps to Fix (5 minutes)

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor:**
   - Open: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql

2. **Copy the entire contents of `working-rls-policy.sql`**

3. **Paste into the SQL Editor**

4. **Click "Run"**

5. **Verify success:**
   - You should see: "RLS policies for business_labels created successfully with type casting!"

### Option 2: Command Line (if you have psql)

```bash
# Make sure you have SUPABASE_DB_URL in your environment
psql $SUPABASE_DB_URL < working-rls-policy.sql
```

## What This Fixes

After applying this fix, you'll be able to:
- ✅ Sync Outlook folders to `business_labels` table
- ✅ Create email labels/folders
- ✅ Complete the onboarding flow
- ✅ Deploy N8N workflows

## Verification

After running the SQL, try connecting Outlook again:
1. Go to Email Integration step
2. Click "Connect Outlook"
3. Complete OAuth
4. Folders should sync without RLS errors

## Current Error
```
'new row violates row-level security policy for table "business_labels"'
```

This will be resolved once the RLS policies are updated with proper type casting.

