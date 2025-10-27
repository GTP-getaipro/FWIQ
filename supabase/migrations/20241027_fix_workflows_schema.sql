-- Fix workflows table schema issues
-- The table exists but schema cache might be stale or column names inconsistent

-- First, check if we need to rename client_id to user_id for consistency
DO $$
BEGIN
    -- Check if column client_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' 
        AND column_name = 'client_id'
        AND table_schema = 'public'
    ) THEN
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'workflows' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            -- Add user_id as alias/copy of client_id
            ALTER TABLE public.workflows ADD COLUMN user_id UUID;
            -- Copy data from client_id to user_id
            UPDATE public.workflows SET user_id = client_id WHERE user_id IS NULL;
            -- Make it NOT NULL after copying
            ALTER TABLE public.workflows ALTER COLUMN user_id SET NOT NULL;
            -- Add foreign key constraint
            ALTER TABLE public.workflows 
                ADD CONSTRAINT workflows_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added user_id column to workflows table';
        END IF;
    END IF;
END $$;

-- Ensure config column exists and is JSONB
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' 
        AND column_name = 'config'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.workflows ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added config column to workflows table';
    END IF;
END $$;

-- Ensure is_functional column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' 
        AND column_name = 'is_functional'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.workflows ADD COLUMN is_functional BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_functional column to workflows table';
    END IF;
END $$;

-- Add index for user_id if it exists
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_status ON public.workflows(user_id, status);

-- Update RLS policies to work with both client_id and user_id
DROP POLICY IF EXISTS workflows_tenant_isolation ON public.workflows;

CREATE POLICY workflows_tenant_isolation
ON public.workflows
USING (
    COALESCE(user_id, client_id) = auth.uid()
)
WITH CHECK (
    COALESCE(user_id, client_id) = auth.uid()
);

-- Grant necessary permissions
GRANT ALL ON public.workflows TO postgres, authenticated, anon, service_role;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Workflows table schema updated and cache refreshed';
END $$;

