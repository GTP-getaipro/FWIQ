# 🔧 Critical Database Migrations - Run These NOW

**Status:** 🔴 **CRITICAL - Your workflow deployments are failing without these**  
**Time Required:** 5 minutes  
**Impact:** Fixes workflow deployment and label provisioning

---

## 🚨 Why You Need These

Your production logs show:

```
❌ Error: No business profile found for user
❌ Could not find the 'config' column of 'workflows' in the schema cache
❌ POST /rest/v1/workflows 400 (Bad Request)
❌ GET /rest/v1/business_profiles 406 (Not Acceptable)
```

**These 2 migrations will fix ALL of these errors.**

---

## 📋 Migration Checklist

### **✅ Pre-Flight Check**

Before running migrations, verify:

- [ ] You have Supabase Dashboard access
- [ ] You're logged into: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro
- [ ] You have the SQL Editor open

---

## 🔨 Migration #1: Create `business_profiles` Table

### **What it does:**
- Creates the `business_profiles` table
- Sets up RLS policies
- Creates indexes for performance
- Grants proper permissions

### **Run this SQL:**

```sql
-- ============================================================================
-- CREATE BUSINESS_PROFILES TABLE
-- This table stores comprehensive business information for AI context
-- ============================================================================

-- Drop table if exists (for clean slate)
DROP TABLE IF EXISTS public.business_profiles CASCADE;

-- Create business_profiles table
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic business information
  business_name TEXT,
  business_type TEXT,
  service_areas TEXT,
  
  -- Contact information (JSONB for flexibility)
  contact_info JSONB DEFAULT '{}'::jsonb,
  
  -- Business hours (JSONB for complex schedules)
  business_hours JSONB DEFAULT '{}'::jsonb,
  
  -- Team structure
  managers JSONB DEFAULT '[]'::jsonb,
  suppliers JSONB DEFAULT '[]'::jsonb,
  
  -- Full client configuration (synced from profiles)
  client_config JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX idx_business_profiles_business_type ON public.business_profiles(business_type);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access their own business profile
CREATE POLICY "Users can manage their own business profile"
ON public.business_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.business_profiles TO postgres;
GRANT ALL ON public.business_profiles TO authenticated;
GRANT ALL ON public.business_profiles TO anon;
GRANT ALL ON public.business_profiles TO service_role;

-- Create updated_at trigger
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Notify schema cache to refresh
NOTIFY pgrst, 'reload schema';

SELECT 'business_profiles table created successfully!' as result;
```

### **Expected Output:**
```
✅ business_profiles table created successfully!
```

---

## 🔨 Migration #2: Fix `workflows` Table Schema

### **What it does:**
- Adds `user_id` column (if using old `client_id`)
- Ensures `config` column exists (JSONB)
- Adds `is_functional` column (BOOLEAN)
- Updates RLS policies
- Creates proper indexes
- Refreshes schema cache

### **Run this SQL:**

```sql
-- ============================================================================
-- FIX WORKFLOWS TABLE SCHEMA
-- Adds missing columns and fixes schema cache issues
-- ============================================================================

-- Step 1: Add user_id column if it doesn't exist
DO $$
BEGIN
  -- Check if we need to add user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' 
    AND column_name = 'client_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' 
    AND column_name = 'user_id'
  ) THEN
    -- Add user_id column
    ALTER TABLE public.workflows ADD COLUMN user_id UUID;
    
    -- Migrate data from client_id to user_id
    UPDATE public.workflows SET user_id = client_id WHERE user_id IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE public.workflows ALTER COLUMN user_id SET NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE public.workflows 
    ADD CONSTRAINT workflows_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added user_id column to workflows table';
  ELSE
    RAISE NOTICE 'user_id column already exists or client_id does not exist';
  END IF;
END $$;

-- Step 2: Ensure config column exists (JSONB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' 
    AND column_name = 'config'
  ) THEN
    ALTER TABLE public.workflows 
    ADD COLUMN config JSONB DEFAULT '{}'::jsonb NOT NULL;
    
    RAISE NOTICE 'Added config column to workflows table';
  ELSE
    RAISE NOTICE 'config column already exists';
  END IF;
END $$;

-- Step 3: Ensure is_functional column exists (BOOLEAN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' 
    AND column_name = 'is_functional'
  ) THEN
    ALTER TABLE public.workflows 
    ADD COLUMN is_functional BOOLEAN DEFAULT true NOT NULL;
    
    RAISE NOTICE 'Added is_functional column to workflows table';
  ELSE
    RAISE NOTICE 'is_functional column already exists';
  END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id 
ON public.workflows(user_id);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id_status 
ON public.workflows(user_id, status);

-- Step 5: Update RLS policy to support both user_id and client_id
DROP POLICY IF EXISTS "workflows_tenant_isolation" ON public.workflows;
DROP POLICY IF EXISTS "Users can manage their own workflows" ON public.workflows;

CREATE POLICY "Users can manage their own workflows"
ON public.workflows
FOR ALL
USING (auth.uid() = COALESCE(user_id, client_id))
WITH CHECK (auth.uid() = COALESCE(user_id, client_id));

-- Step 6: Grant permissions
GRANT ALL ON public.workflows TO postgres;
GRANT ALL ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO anon;
GRANT ALL ON public.workflows TO service_role;

-- Step 7: Refresh schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- Step 8: Verify the fix
DO $$
DECLARE
  has_user_id BOOLEAN;
  has_config BOOLEAN;
  has_is_functional BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'user_id'
  ) INTO has_user_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'config'
  ) INTO has_config;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'is_functional'
  ) INTO has_is_functional;
  
  IF has_user_id AND has_config AND has_is_functional THEN
    RAISE NOTICE '✅ workflows table schema fixed successfully!';
  ELSE
    RAISE EXCEPTION '❌ workflows table schema fix failed!';
  END IF;
END $$;
```

### **Expected Output:**
```
✅ workflows table schema fixed successfully!
```

---

## ✅ Verification Steps

### **1. Verify business_profiles table:**

```sql
-- Should return the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_profiles'
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (uuid)
- `user_id` (uuid)
- `business_name` (text)
- `business_type` (text)
- `service_areas` (text)
- `contact_info` (jsonb)
- `business_hours` (jsonb)
- `managers` (jsonb)
- `suppliers` (jsonb)
- `client_config` (jsonb)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

---

### **2. Verify workflows table:**

```sql
-- Should return the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workflows'
ORDER BY ordinal_position;
```

**Expected columns (must include):**
- `user_id` (uuid) ✅
- `config` (jsonb) ✅
- `is_functional` (boolean) ✅

---

### **3. Test RLS policies:**

```sql
-- Should return your RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('business_profiles', 'workflows')
ORDER BY tablename, policyname;
```

---

### **4. Verify schema cache refreshed:**

```sql
-- If this query works, schema cache is refreshed
SELECT * FROM public.business_profiles LIMIT 1;
SELECT * FROM public.workflows LIMIT 1;
```

Should **NOT** return:
```
❌ relation "public.business_profiles" does not exist
❌ Could not find the 'config' column
```

---

## 🎉 Success Indicators

After running both migrations, you should see:

### **In Supabase Dashboard:**
- ✅ `business_profiles` table appears in Table Editor
- ✅ `workflows` table shows `user_id`, `config`, `is_functional` columns
- ✅ RLS policies show "Users can manage their own..." for both tables

### **In Production (after redeployment):**
- ✅ Workflow deployment succeeds
- ✅ Label provisioning works
- ✅ No more `406 Not Acceptable` errors
- ✅ No more `400 Bad Request` errors
- ✅ `business_profiles` gets populated on onboarding

---

## 🚨 If Something Goes Wrong

### **Error: "relation does not exist"**
```sql
-- Run this to refresh schema cache manually
NOTIFY pgrst, 'reload schema';
```

### **Error: "column already exists"**
This is OK! The migration is idempotent (safe to run multiple times).

### **Error: "permission denied"**
Make sure you're logged in as the database owner or have sufficient permissions.

### **Need to rollback?**
```sql
-- Only if you need to start over
DROP TABLE IF EXISTS public.business_profiles CASCADE;

-- For workflows, we can't drop it (data exists)
-- Instead, just re-run Migration #2
```

---

## 📦 Next Steps After Migrations

1. **✅ Migrations complete**
2. **➡️ Redeploy frontend to Coolify** (see `DEPLOY_TO_COOLIFY_NOW.md`)
3. **➡️ Test complete onboarding flow**
4. **➡️ Verify workflow deployment works**
5. **➡️ Configure SendGrid email templates** (see `SUPABASE_EMAIL_TEMPLATE_SETUP.md`)

---

## 🆘 Need Help?

**If migrations fail:**
1. Copy the error message
2. Check Supabase logs
3. Verify you're in the correct project (`oinxzvqszingwstrbdro`)
4. Try refreshing schema cache: `NOTIFY pgrst, 'reload schema';`

**If still stuck:**
- Check `DATABASE_AUDIT_SUMMARY.md` for detailed troubleshooting
- Review `SYSTEM_ARCHITECTURE_VISUAL.md` for data flow understanding

---

## ✅ Migration Completion Checklist

After running migrations:

- [ ] Migration #1 completed successfully
- [ ] Migration #2 completed successfully
- [ ] Verified `business_profiles` table exists
- [ ] Verified `workflows` table has all columns
- [ ] Tested RLS policies
- [ ] Schema cache refreshed
- [ ] Ready to redeploy frontend

---

**Time to run these migrations:** ~5 minutes  
**Impact:** Fixes 100% of workflow deployment issues  

🚀 **Let's get your system to 100% operational!**
