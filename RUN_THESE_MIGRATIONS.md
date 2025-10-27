# 🔧 Fix Production Signup Issues - Run These Migrations

## 🔴 Problem

Users are getting **401 errors** when signing up because:
1. Frontend can't create profiles in `profiles` table (RLS blocking)
2. Frontend can't store onboarding data (RLS blocking)
3. Analytics API expects auth headers (minor issue)

## ✅ Solution

Run these SQL migrations in Supabase to fix the issues.

---

## 🚀 **How to Run Migrations**

### **Option 1: Supabase Dashboard (Easiest)**

1. Go to: https://supabase.com/dashboard
2. Select project: **oinxzvqszingwstrbdro** (FloWorx)
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste each migration below
6. Click **Run** for each one

---

### **Migration 1: Auto-Create User Profiles**

Copy and run this in SQL Editor:

```sql
-- Migration: Auto-create user profile on signup
-- This fixes the 401 error when trying to create profiles from the frontend
-- The trigger runs with elevated permissions, bypassing RLS policies

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (
    id,
    email,
    onboarding_step,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'email_integration',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Update RLS policies for profiles table
-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

### **Migration 2: Fix Onboarding Data RLS**

Copy and run this in SQL Editor:

```sql
-- Migration: Fix RLS policies for onboarding_data table
-- This fixes the 401 error when storing registration/onboarding data

-- Ensure onboarding_data table has RLS enabled
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can insert own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can update own onboarding data" ON public.onboarding_data;

-- Allow users to read their own onboarding data
CREATE POLICY "Users can view own onboarding data"
  ON public.onboarding_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own onboarding data
CREATE POLICY "Users can insert own onboarding data"
  ON public.onboarding_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own onboarding data
CREATE POLICY "Users can update own onboarding data"
  ON public.onboarding_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own onboarding data
DROP POLICY IF EXISTS "Users can delete own onboarding data" ON public.onboarding_data;
CREATE POLICY "Users can delete own onboarding data"
  ON public.onboarding_data
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

### **Option 2: Using Supabase CLI**

If you have Supabase CLI installed:

```bash
# Navigate to project
cd c:\FloWorx-Production

# Run migrations
supabase db push --project-ref oinxzvqszingwstrbdro
```

---

## ✅ **After Running Migrations**

### **Test Signup Flow:**

1. Go to: https://app.floworx-iq.com/register
2. Register a new test user
3. Check console - should NOT see 401 errors
4. Check email for verification link
5. Profile should be created automatically

### **Expected Console Output (No Errors):**

```
✅ User profile created successfully during signup
✅ Registration data stored
```

---

## 🔍 **Verify Migrations Worked**

### **Check in Supabase:**

1. Go to: **Database** → **Tables** → **profiles**
2. You should see new profiles being created automatically
3. Check **onboarding_data** table - should have data

### **Check Trigger Exists:**

Run this in SQL Editor:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return 1 row showing the trigger exists.

---

## 🐛 **Optional: Fix Analytics API Errors**

The analytics API 401 errors are not critical, but if you want to fix them:

### **Option A: Make Analytics Optional (Quick Fix)**

The analytics should fail gracefully and not block signup. The errors in console are warnings only.

### **Option B: Configure Analytics API**

Add analytics API authentication in your backend if you're using it.

---

## 📋 **Summary**

**What These Migrations Do:**

1. **Profile Trigger:**
   - Auto-creates user profile when they sign up
   - Runs with elevated permissions (bypasses RLS)
   - Sets initial `onboarding_step` to `'email_integration'`

2. **Onboarding RLS:**
   - Allows users to insert their own onboarding data
   - Allows users to read/update their own data
   - Prevents users from accessing others' data

**Why This Fixes the Issues:**

- ❌ **Before:** Frontend tried to create profile → RLS blocked → 401 error
- ✅ **After:** Database trigger creates profile automatically → No RLS issues

---

## 🆘 **Troubleshooting**

### **If migration fails:**

**Error: "relation does not exist"**
- The table might not exist. Check if `profiles` and `onboarding_data` tables exist.

**Error: "permission denied"**
- Make sure you're running as database admin/owner
- Or use service role key

### **Still getting 401 errors after migration:**

1. Clear browser cache
2. Register a completely new user (new email)
3. Check Supabase logs: **Logs** → **Database**
4. Verify trigger ran: Check **Database** → **Functions** → `handle_new_user`

---

## ✅ **Quick Check Commands**

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check recent profiles created
SELECT id, email, onboarding_step, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'onboarding_data');
```

---

## 🚀 **Ready to Fix!**

1. ✅ Go to Supabase Dashboard
2. ✅ Open SQL Editor
3. ✅ Run Migration 1 (Profile Trigger)
4. ✅ Run Migration 2 (Onboarding RLS)
5. ✅ Test signup with new user
6. ✅ Verify no more 401 errors!

---

**After running these migrations, your signup flow will work perfectly!** 🎉

