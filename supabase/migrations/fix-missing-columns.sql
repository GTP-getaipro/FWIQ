-- ============================================================================
-- FIX MISSING COLUMNS IN AI_HUMAN_COMPARISON TABLE
-- Run this to add the missing columns to your existing table
-- ============================================================================

-- Add the missing email_id column
ALTER TABLE ai_human_comparison ADD COLUMN IF NOT EXISTS email_id TEXT;

-- Add the missing client_id column (if needed)
ALTER TABLE ai_human_comparison ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id);

-- Verify the columns were added
SELECT 'Columns added successfully' as status;

-- Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_human_comparison' 
AND table_schema = 'public'
ORDER BY ordinal_position;
