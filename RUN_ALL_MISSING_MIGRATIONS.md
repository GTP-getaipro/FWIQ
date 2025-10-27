# Run All Missing Migrations

## Critical Migrations to Run in Supabase SQL Editor

Run these in order:

---

## Migration 1: Standardize user_id

**File:** `supabase/migrations/20241027_standardize_user_id.sql`

**What it does:**
- Converts all client_id to user_id across 6 tables
- Updates foreign keys and indexes
- Updates RLS policies
- Refreshes schema cache

**Status:** Run this first if not already completed

---

## Migration 2: Enhance communication_styles Table

**File:** `supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql`

**What it does:**
- Adds vocabulary_patterns column (JSONB)
- Adds tone_analysis column (JSONB)
- Adds signature_phrases column (TEXT[])
- Adds response_templates column (JSONB)
- Adds sample_size column (INTEGER)
- Adds updated_at column (TIMESTAMPTZ)
- Creates indexes for performance
- Migrates existing data

**Status:** REQUIRED - This fixes the 400 Bad Request error

---

## Migration 3: Refresh Schema Cache

After running both migrations, run this:

```sql
NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache refreshed successfully' as status;
```

Wait 10 seconds after running this.

---

## Verification

After all migrations:

```sql
-- Check communication_styles has all columns
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'communication_styles'
ORDER BY ordinal_position;

-- Should return:
-- id
-- user_id
-- style_profile
-- learning_count
-- last_updated
-- created_at
-- vocabulary_patterns
-- tone_analysis
-- signature_phrases
-- response_templates
-- sample_size
-- updated_at

-- Check business_profiles exists
SELECT COUNT(*) as exists_check
FROM information_schema.tables
WHERE table_name = 'business_profiles';

-- Should return: 1

-- Check no tables have client_id
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'client_id';

-- Should return: (no rows) or empty
```

---

## After Migrations Complete:

1. Redeploy FWIQFront in Coolify
2. Hard refresh browser (Ctrl + Shift + R)
3. Complete onboarding
4. Test workflow deployment

Both errors will be fixed:
- Communication styles insert will work
- Business profiles will be accessible

