-- ============================================================================
-- FIX EXISTING AI_HUMAN_COMPARISON TABLE SCHEMA
-- This script adapts to your existing table structure
-- ============================================================================

-- Add email_id column (the style-memory function expects this)
ALTER TABLE ai_human_comparison ADD COLUMN IF NOT EXISTS email_id TEXT;

-- Make client_id NOT NULL (as expected by the function)
ALTER TABLE ai_human_comparison ALTER COLUMN client_id SET NOT NULL;

-- Add created_at column if missing
ALTER TABLE ai_human_comparison ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at column if missing  
ALTER TABLE ai_human_comparison ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify the updated structure
SELECT 'Table schema updated successfully' as status;

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_human_comparison' 
AND table_schema = 'public'
ORDER BY ordinal_position;
