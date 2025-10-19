-- Fix: Update message_hash column size to accommodate SHA-256 hashes
-- This fixes the "value too long for type character varying(64)" error

-- Check if the column exists and update its size
DO $$
BEGIN
    -- Check if the system_messages table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_messages') THEN
        -- Check if the message_hash column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'system_messages' 
                   AND column_name = 'message_hash') THEN
            
            -- Update the column size to accommodate SHA-256 hashes (64 characters)
            ALTER TABLE system_messages 
            ALTER COLUMN message_hash TYPE VARCHAR(128);
            
            RAISE NOTICE 'Updated message_hash column size to VARCHAR(128)';
        ELSE
            RAISE NOTICE 'message_hash column does not exist in system_messages table';
        END IF;
    ELSE
        RAISE NOTICE 'system_messages table does not exist';
    END IF;
END $$;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'system_messages' 
  AND column_name = 'message_hash';
