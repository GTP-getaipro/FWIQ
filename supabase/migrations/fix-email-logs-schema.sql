-- ============================================================================
-- FIX EMAIL_LOGS TABLE SCHEMA MISMATCH
-- This script adds missing columns to match the email monitoring code expectations
-- ============================================================================

-- First, let's check what columns already exist and what we need to add
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if email_from column exists and has NOT NULL constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_logs' 
        AND column_name = 'email_from'
        AND is_nullable = 'NO'
    ) INTO column_exists;
    
    IF column_exists THEN
        -- Drop the NOT NULL constraint temporarily
        ALTER TABLE public.email_logs ALTER COLUMN email_from DROP NOT NULL;
        RAISE NOTICE 'Dropped NOT NULL constraint from email_from column';
    END IF;
END $$;

-- Add missing columns to email_logs table (only if they don't exist)
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS from_email TEXT,
ADD COLUMN IF NOT EXISTS from_name TEXT,
ADD COLUMN IF NOT EXISTS body_preview TEXT,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON public.email_logs (provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON public.email_logs (message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_processed_at ON public.email_logs (processed_at DESC);

-- Update RLS policies to use user_id instead of client_id
DROP POLICY IF EXISTS email_logs_tenant_isolation ON public.email_logs;

CREATE POLICY email_logs_tenant_isolation
ON public.email_logs
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure the table is owned by the authenticated role for RLS to work correctly
ALTER TABLE public.email_logs OWNER TO postgres;
GRANT ALL ON public.email_logs TO postgres;
GRANT ALL ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO anon;

-- Add a trigger to automatically set processed_at if status changes to 'processed' or similar
CREATE OR REPLACE FUNCTION public.set_processed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'processed' AND OLD.status IS DISTINCT FROM 'processed' THEN
        NEW.processed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_logs_set_processed_at ON public.email_logs;
CREATE TRIGGER trg_email_logs_set_processed_at
    BEFORE UPDATE ON public.email_logs
    FOR EACH ROW EXECUTE FUNCTION public.set_processed_at();

-- Show what columns now exist in the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
  AND table_schema = 'public'
ORDER BY column_name;

-- Test insert to verify it works (using only existing columns)
INSERT INTO public.email_logs (
  client_id,
  user_id,
  provider,
  message_id,
  subject,
  from_email,
  status,
  processed_at,
  event_type,
  detail,
  email_from,
  email_subject
) VALUES (
  auth.uid(),
  auth.uid(),
  'test',
  'test-message-123',
  'Test Email',
  'test@example.com',
  'new',
  NOW(),
  'email_received',
  '{"test": true}'::jsonb,
  'test@example.com',
  'Test Email'
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM public.email_logs WHERE message_id = 'test-message-123';

SELECT 'Email logs schema fix completed successfully!' as result;