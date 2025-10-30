# 🚀 **RUN SUPABASE MIGRATIONS - Quick Guide**

## ⚠️ **You Need to Run These Migrations in Supabase**

The voice analysis is failing with a 400 error because the `communication_styles` table doesn't exist yet in your database.

---

## 📋 **Option 1: Run via Supabase Dashboard (Easiest)**

### **Step 1: Go to Supabase SQL Editor**
1. Open https://supabase.com/dashboard
2. Select your project: `oinxzvqszingwstrbdro`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### **Step 2: Run First Migration**
Copy and paste this SQL:

```sql
-- Migration: Create communication_styles table
-- Base table for Voice Learning System
-- Date: 2024-12-20

-- Create communication_styles table
CREATE TABLE IF NOT EXISTS communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  style_profile JSONB,
  learning_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communication_styles_user_id ON communication_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_styles_updated ON communication_styles(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE communication_styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own communication styles" ON communication_styles;
CREATE POLICY "Users can view their own communication styles" ON communication_styles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own communication styles" ON communication_styles;
CREATE POLICY "Users can insert their own communication styles" ON communication_styles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own communication styles" ON communication_styles;
CREATE POLICY "Users can update their own communication styles" ON communication_styles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own communication styles" ON communication_styles;
CREATE POLICY "Users can delete their own communication styles" ON communication_styles
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE communication_styles IS 'Voice Learning System - Stores user communication styles learned from historical emails';
```

Click **RUN** ✅

### **Step 3: Run Second Migration**
Copy and paste this SQL:

```sql
-- Migration: Enhance communication_styles table for Voice Learning System 2.0
-- Adds status tracking, metadata, and quality metrics

-- Add new columns to communication_styles table
ALTER TABLE communication_styles 
ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sample_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skip_reason TEXT,
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_communication_styles_status ON communication_styles(analysis_status);
CREATE INDEX IF NOT EXISTS idx_communication_styles_user_status ON communication_styles(user_id, analysis_status);

-- Add comment to explain the table
COMMENT ON TABLE communication_styles IS 'Voice Learning System 2.0 - Stores user communication styles learned from historical emails';

-- Add comments to new columns
COMMENT ON COLUMN communication_styles.analysis_status IS 'Current status: pending, in_progress, completed, skipped, failed';
COMMENT ON COLUMN communication_styles.analysis_started_at IS 'Timestamp when voice analysis started';
COMMENT ON COLUMN communication_styles.analysis_completed_at IS 'Timestamp when voice analysis completed';
COMMENT ON COLUMN communication_styles.email_sample_count IS 'Number of emails analyzed for this profile';
COMMENT ON COLUMN communication_styles.skip_reason IS 'Reason why analysis was skipped or failed';
COMMENT ON COLUMN communication_styles.data_quality_score IS 'Quality score 0-100 based on email count, confidence, examples, and phrases';

-- Update existing rows to have 'completed' status if they have a style_profile
UPDATE communication_styles 
SET analysis_status = 'completed',
    analysis_completed_at = last_updated
WHERE style_profile IS NOT NULL 
  AND analysis_status IS NULL;

-- Update existing rows without style_profile to 'pending'
UPDATE communication_styles 
SET analysis_status = 'pending'
WHERE style_profile IS NULL 
  AND analysis_status IS NULL;

-- Add helpful view for monitoring voice learning status
CREATE OR REPLACE VIEW voice_learning_status AS
SELECT 
  cs.user_id,
  p.email as user_email,
  cs.analysis_status,
  cs.email_sample_count,
  cs.data_quality_score,
  cs.learning_count,
  cs.analysis_started_at,
  cs.analysis_completed_at,
  cs.last_updated,
  cs.skip_reason,
  CASE 
    WHEN cs.style_profile IS NOT NULL THEN 'Has Profile'
    ELSE 'No Profile'
  END as profile_status,
  EXTRACT(EPOCH FROM (cs.analysis_completed_at - cs.analysis_started_at)) as analysis_duration_seconds
FROM communication_styles cs
LEFT JOIN auth.users u ON cs.user_id = u.id
LEFT JOIN profiles p ON cs.user_id = p.id
ORDER BY cs.last_updated DESC;

-- Grant access to the view
GRANT SELECT ON voice_learning_status TO authenticated;
```

Click **RUN** ✅

---

## 📋 **Option 2: Run via Supabase CLI (Advanced)**

If you have Supabase CLI installed:

```bash
cd C:\FloWorx-Production
supabase db push
```

This will automatically run all pending migrations.

---

## ✅ **After Running Migrations:**

1. **Refresh your dashboard** - The 400 error will disappear
2. **Voice analysis will work** - Status tracking will be enabled
3. **Better monitoring** - Can see analysis status in real-time

---

## 📊 **Current Status:**

| Component | Status | Action Needed |
|-----------|--------|---------------|
| **Migration Files** | ✅ Created | Run in Supabase |
| **Code Changes** | ✅ Pushed | None |
| **Folder Health Widget** | ✅ Integrated | None |
| **System Functionality** | ✅ Working | Run migrations to eliminate error |

---

## 🎯 **Impact of Running Migrations:**

**Before:**
- ⚠️ 400 Bad Request error in console
- ⚠️ Voice analysis uses fallback to `profiles` table
- ⚠️ No status tracking for analysis

**After:**
- ✅ No more 400 errors
- ✅ Voice analysis status tracked properly
- ✅ Can see analysis progress (pending, in_progress, completed)
- ✅ Better monitoring and debugging

**The system works now, but running migrations will eliminate the error and enable better tracking! 🎯✨**

