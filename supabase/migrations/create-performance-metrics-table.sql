-- ============================================================================
-- CREATE PERFORMANCE_METRICS TABLE
-- This table stores performance metrics from N8N workflows
-- ============================================================================

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Drafting', 'Labeling', etc.
    emails_processed INTEGER DEFAULT 0,
    avg_minutes_per_email DECIMAL(5,2) DEFAULT 0,
    time_saved_hours DECIMAL(8,2) DEFAULT 0,
    receptionist_hourly_rate DECIMAL(8,2) DEFAULT 25,
    money_saved DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON public.performance_metrics (date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics (type);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY performance_metrics_tenant_isolation
ON public.performance_metrics
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.performance_metrics TO postgres;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT ALL ON public.performance_metrics TO anon;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_performance_metrics_updated_at
    BEFORE UPDATE ON public.performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.performance_metrics (
    user_id,
    date,
    type,
    emails_processed,
    avg_minutes_per_email,
    time_saved_hours,
    receptionist_hourly_rate,
    money_saved
) VALUES (
    'fedf818f-986f-4b30-bfa1-7fc339c7bb60',
    CURRENT_DATE,
    'Labeling',
    1,
    4.5,
    0.07,
    25,
    1.75
) ON CONFLICT DO NOTHING;

SELECT 'Performance metrics table created successfully!' as result;
