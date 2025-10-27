# 🔧 Voice Analysis & Provisioning Error Fix

## Problem
```
POST https://oinxzvqszingwstrbdro.supabase.co/rest/v1/communication_styles?on_conflict=user_id 400 (Bad Request)
```

This error occurs when:
- User selects business type "Hot tub & Spa"
- Automatic folder provisioning is triggered
- Voice analysis initialization tries to insert into `communication_styles` table
- Database rejects the request (400 Bad Request)

## Root Cause

The `communication_styles` table requires **3 sequential migrations** that may not have been applied to your production database:

1. ✅ `20241220_create_communication_styles_table.sql` - Base table
2. ✅ `20241221_enhance_communication_styles_table.sql` - Status tracking
3. ❌ `20250122_enhance_communication_styles_for_voice_training.sql` - Voice training columns

## Verification

### Step 1: Check if migrations were applied

Run this in your Supabase SQL Editor:

```sql
-- Check current schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'communication_styles'
ORDER BY ordinal_position;
```

**Expected columns** (after all 3 migrations):
- `id` (uuid)
- `user_id` (uuid)
- `style_profile` (jsonb)
- `learning_count` (integer)
- `last_updated` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `analysis_status` (character varying)
- `analysis_started_at` (timestamp with time zone)
- `analysis_completed_at` (timestamp with time zone)
- `email_sample_count` (integer)
- `skip_reason` (text)
- `data_quality_score` (integer)
- `vocabulary_patterns` (jsonb) ⚠️ **Required for voice training**
- `tone_analysis` (jsonb) ⚠️ **Required for voice training**
- `signature_phrases` (text[]) ⚠️ **Required for voice training**
- `response_templates` (jsonb) ⚠️ **Required for voice training**
- `sample_size` (integer) ⚠️ **Required for voice training**
- `updated_at` (timestamp with time zone) ⚠️ **Required for voice training**

### Step 2: Apply missing migration

If the last 6 columns are missing, run the migration:

```bash
# From your project root
supabase db push
```

Or manually apply the migration file in Supabase SQL Editor:
```
supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql
```

## Quick Fix (Frontend Fallback)

If you can't immediately run migrations, add error handling to gracefully skip voice analysis:

**File**: `src/pages/onboarding/Step3BusinessType.jsx`

**Change** (line 332-340):

```javascript
// Store analysis start status
try {
  await supabase
    .from('communication_styles')
    .upsert({
      user_id: userId,
      analysis_status: 'in_progress',
      analysis_started_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }, { onConflict: 'user_id' });
} catch (statusError) {
  console.warn('⚠️ Could not update voice analysis status (migration may be pending):', statusError.message);
  // Continue without blocking - voice analysis can happen later
}
```

## Permanent Fix Steps

### Option 1: Run Migration via Supabase CLI (Recommended)

```bash
# 1. Verify Supabase CLI is connected
supabase status

# 2. Push all pending migrations
supabase db push

# 3. Verify the migration
supabase db diff
```

### Option 2: Run Migration via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy contents of: `supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql`
3. Click "Run"
4. Verify success message: `✅ Migration completed: communication_styles table enhanced for AI Voice Training`

### Option 3: Manual SQL Execution

```sql
-- Run this directly in Supabase SQL Editor

-- Add new columns for AI Voice Training
ALTER TABLE communication_styles 
ADD COLUMN IF NOT EXISTS vocabulary_patterns JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tone_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS signature_phrases TEXT[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS response_templates JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS sample_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communication_styles_vocabulary 
  ON communication_styles USING GIN (vocabulary_patterns);

CREATE INDEX IF NOT EXISTS idx_communication_styles_tone 
  ON communication_styles USING GIN (tone_analysis);

CREATE INDEX IF NOT EXISTS idx_communication_styles_templates 
  ON communication_styles USING GIN (response_templates);

CREATE INDEX IF NOT EXISTS idx_communication_styles_sample_size 
  ON communication_styles(sample_size DESC);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communication_styles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_styles_updated_at ON communication_styles;
CREATE TRIGGER trg_communication_styles_updated_at
  BEFORE UPDATE ON communication_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_styles_updated_at();
```

## Verification After Fix

Run this query to confirm the fix:

```sql
-- Should show 18 columns total
SELECT COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'communication_styles';

-- Should return: total_columns = 18
```

## Testing

After applying the fix:

1. **Clear browser cache** (the bundled JS has the old code)
2. **Refresh the page**
3. Try the onboarding flow again:
   - Select business type: "Hot tub & Spa"
   - Click "Save & Continue"
   - Monitor console logs for voice analysis success

## Prevention

To prevent this issue in the future:

### 1. Add Migration Checker to Frontend

**File**: `src/lib/schemaChecker.js` (NEW)

```javascript
import { supabase } from '@/lib/supabaseClient';

export async function checkCommunicationStylesSchema() {
  try {
    const { data, error } = await supabase
      .from('communication_styles')
      .select('vocabulary_patterns, tone_analysis, updated_at')
      .limit(0);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ MIGRATION REQUIRED: communication_styles table is missing columns');
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Schema check failed:', err);
    return false;
  }
}
```

### 2. Add Schema Check to Voice Analysis

**File**: `src/pages/onboarding/Step3BusinessType.jsx`

```javascript
import { checkCommunicationStylesSchema } from '@/lib/schemaChecker';

const triggerVoiceAnalysis = async (userId, businessType) => {
  try {
    // Check if schema is ready
    const schemaReady = await checkCommunicationStylesSchema();
    if (!schemaReady) {
      console.warn('⚠️ Skipping voice analysis - database schema not ready');
      return;
    }
    
    // ... rest of voice analysis code
  } catch (error) {
    console.error('Voice analysis error:', error);
  }
};
```

## Related Files

- ✅ Migration: `supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql`
- ✅ Verification: `supabase/migrations/verify_communication_styles_schema.sql`
- ✅ Frontend: `src/pages/onboarding/Step3BusinessType.jsx` (lines 322-440)
- ✅ Analyzer: `src/lib/emailVoiceAnalyzer.js`
- ✅ Style Analyzer: `src/lib/styleAnalyzer.js`

## Status Checklist

- [ ] Verify current schema (missing columns?)
- [ ] Apply missing migration
- [ ] Test voice analysis
- [ ] Verify automatic folder provisioning works
- [ ] Add schema checker (prevention)
- [ ] Deploy to production

---

**Last Updated**: 2025-10-27  
**Issue**: Voice analysis provisioning 400 error  
**Business Type**: Hot tub & Spa

