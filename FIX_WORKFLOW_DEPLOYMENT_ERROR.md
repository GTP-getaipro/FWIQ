# 🔧 Fix Workflow Deployment Error

## 🔴 Error

```
Could not find the 'config' column of 'workflows' in the schema cache
Failed to store workflow in database
```

## 🔍 Root Cause

The `workflows` table has a **stale schema cache** in Supabase, or there's a mismatch between:
- Column names (`client_id` vs `user_id`)
- Schema cache not refreshed after migrations

## ✅ Solution

Run this SQL migration in Supabase to fix it:

### **Quick Fix (Run in SQL Editor):**

Go to: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql/new

**Copy and run this:**

```sql
-- Fix workflows table schema and refresh cache

-- Add user_id column if using client_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'client_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.workflows ADD COLUMN user_id UUID;
        UPDATE public.workflows SET user_id = client_id WHERE user_id IS NULL;
        ALTER TABLE public.workflows ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE public.workflows 
            ADD CONSTRAINT workflows_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure config column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'config'
    ) THEN
        ALTER TABLE public.workflows ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Ensure is_functional column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'is_functional'
    ) THEN
        ALTER TABLE public.workflows ADD COLUMN is_functional BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_status ON public.workflows(user_id, status);

-- Update RLS policy
DROP POLICY IF EXISTS workflows_tenant_isolation ON public.workflows;
CREATE POLICY workflows_tenant_isolation
ON public.workflows
USING (COALESCE(user_id, client_id) = auth.uid())
WITH CHECK (COALESCE(user_id, client_id) = auth.uid());

-- Grant permissions
GRANT ALL ON public.workflows TO postgres, authenticated, anon, service_role;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

---

## 🧪 Test After Running Migration

1. Go back to: https://app.floworx-iq.com/onboarding/deploy
2. Click "Deploy Workflow" again
3. Should complete successfully now! ✅

---

## 📋 What This Fixes

✅ Adds `user_id` column (copies from `client_id`)
✅ Ensures `config` column exists (JSONB type)
✅ Ensures `is_functional` column exists
✅ Updates RLS policies to work with both column names
✅ Refreshes Supabase schema cache
✅ Adds proper indexes for performance

---

## 🔍 Verify It Worked

Run this query after the migration:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflows' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

Should show:
- `id` - uuid
- `client_id` - uuid
- `user_id` - uuid ✅
- `name` - text
- `status` - text
- `n8n_workflow_id` - text
- `version` - integer
- `config` - jsonb ✅
- `is_functional` - boolean ✅
- `created_at` - timestamp
- `updated_at` - timestamp

---

## 🆘 If Still Not Working

### **Option 1: Manual Schema Cache Refresh**

```sql
-- Force Supabase to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

### **Option 2: Restart Supabase PostgREST**

In Supabase Dashboard:
1. Go to Settings → API
2. Click "Restart Services"
3. Wait 30 seconds
4. Try deployment again

### **Option 3: Check Table Structure**

```sql
\d workflows
```

Should show the `config` column.

---

## ✅ Expected Result

After running the migration:
- ✅ Workflow deploys to N8N successfully
- ✅ Workflow record saves to database
- ✅ No "column not found" errors
- ✅ Deployment completes and redirects to dashboard

---

**Run that SQL migration now to fix the workflow deployment!** 🚀

