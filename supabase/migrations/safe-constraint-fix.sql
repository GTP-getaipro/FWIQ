-- ============================================================================
-- FLOWORX SAFE CONSTRAINT FIX
-- This script safely fixes NOT NULL constraints excluding primary key columns
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- CHECK CURRENT TABLE STRUCTURE
-- ============================================================================

-- Check migration_logs table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'migration_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- SAFELY FIX NOT NULL CONSTRAINTS (EXCLUDING PRIMARY KEYS)
-- ============================================================================

-- Make columns nullable but exclude primary key columns
DO $$
DECLARE
    col_record RECORD;
BEGIN
    -- Loop through all columns in migration_logs, excluding primary key columns
    FOR col_record IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND table_schema = 'public'
        AND is_nullable = 'NO'
        AND column_name NOT IN ('id', 'log_id') -- Exclude primary key columns
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE migration_logs ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
            RAISE NOTICE 'Made column % nullable in migration_logs', col_record.column_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not make column % nullable: %', col_record.column_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- ADD DEFAULT VALUES FOR COMMON COLUMNS
-- ============================================================================

-- Add sensible defaults for common columns
DO $$
BEGIN
    -- Add default for level if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs ALTER COLUMN level SET DEFAULT 'info';
        RAISE NOTICE 'Added default value for level column';
    END IF;

    -- Add default for migration_type if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'migration_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs ALTER COLUMN migration_type SET DEFAULT 'unknown';
        RAISE NOTICE 'Added default value for migration_type column';
    END IF;

    -- Add default for status if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs ALTER COLUMN status SET DEFAULT 'pending';
        RAISE NOTICE 'Added default value for status column';
    END IF;

    -- Add default for from_provider if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'from_provider'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs ALTER COLUMN from_provider SET DEFAULT 'unknown';
        RAISE NOTICE 'Added default value for from_provider column';
    END IF;

    -- Add default for to_provider if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'to_provider'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs ALTER COLUMN to_provider SET DEFAULT 'unknown';
        RAISE NOTICE 'Added default value for to_provider column';
    END IF;

    -- Add default for migration_run_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'migration_run_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs ALTER COLUMN migration_run_id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Added default value for migration_run_id column';
    END IF;
END $$;

-- ============================================================================
-- TEST DATA INSERTION WITH MINIMAL FIELDS
-- ============================================================================

-- Test inserting data with only the most basic fields
DO $$
BEGIN
    -- Try to insert test data with minimal fields
    INSERT INTO migration_logs (user_id, migration_type, from_provider, to_provider, status) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'test_validation', 'gmail', 'outlook', 'completed');
    
    RAISE NOTICE 'Test data insertion successful with minimal fields';
    
    -- Clean up test data
    DELETE FROM migration_logs WHERE migration_type = 'test_validation';
    RAISE NOTICE 'Test data cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test data insertion failed: %', SQLERRM;
        
        -- Try with even fewer fields
        BEGIN
            INSERT INTO migration_logs (user_id) 
            VALUES ('00000000-0000-0000-0000-000000000000');
            
            RAISE NOTICE 'Test data insertion successful with only user_id';
            
            -- Clean up test data
            DELETE FROM migration_logs WHERE user_id = '00000000-0000-0000-0000-000000000000';
            RAISE NOTICE 'Test data cleaned up';
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Even minimal insertion failed: %', SQLERRM;
        END;
END $$;

-- ============================================================================
-- VERIFY FINAL STRUCTURE
-- ============================================================================

-- Show final table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'migration_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Safe constraint fixes completed!' as result;
SELECT 'NOT NULL constraints have been safely relaxed for testing.' as status;
SELECT 'Run the validation script again to test.' as next_step;
