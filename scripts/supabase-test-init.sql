-- Supabase Test Database Initialization Script
-- Creates Supabase test database schema for FloWorx testing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth.users table (simplified for testing)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    business_type VARCHAR(100),
    onboarding_step VARCHAR(50) DEFAULT 'welcome',
    managers JSONB DEFAULT '[]'::jsonb,
    suppliers JSONB DEFAULT '[]'::jsonb,
    client_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    access_token TEXT,
    refresh_token TEXT,
    scope TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    n8n_workflow_id VARCHAR(255),
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    deployment_status VARCHAR(20) DEFAULT 'pending',
    workflow_data JSONB DEFAULT '{}'::jsonb,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255) NOT NULL,
    subject TEXT,
    sender VARCHAR(255),
    received_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'new',
    raw_email_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI responses table
CREATE TABLE IF NOT EXISTS public.ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model VARCHAR(100),
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create communication_styles table
CREATE TABLE IF NOT EXISTS public.communication_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    style_profile JSONB DEFAULT '{}'::jsonb,
    confidence_score DECIMAL(3,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_webhooks table
CREATE TABLE IF NOT EXISTS public.email_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    webhook_url TEXT NOT NULL,
    webhook_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_hours table
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escalation_rules table
CREATE TABLE IF NOT EXISTS public.escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create response_templates table
CREATE TABLE IF NOT EXISTS public.response_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'email',
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(20) DEFAULT 'immediate',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at) VALUES
('test@floworx.com', crypt('password123', gen_salt('bf')), NOW()),
('admin@floworx.com', crypt('admin123', gen_salt('bf')), NOW()),
('user@floworx.com', crypt('user123', gen_salt('bf')), NOW());

INSERT INTO public.profiles (id, first_name, last_name, company_name, business_type, onboarding_step) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 'Test', 'User', 'Test Company', 'hvac', 'completed'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 'Admin', 'User', 'Admin Company', 'electrician', 'completed'),
((SELECT id FROM auth.users WHERE email = 'user@floworx.com'), 'Regular', 'User', 'User Company', 'plumber', 'email-integration');

INSERT INTO public.integrations (user_id, provider, status, access_token, refresh_token) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 'gmail', 'active', 'test_access_token', 'test_refresh_token'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 'outlook', 'active', 'test_access_token', 'test_refresh_token'),
((SELECT id FROM auth.users WHERE email = 'user@floworx.com'), 'gmail', 'active', 'test_access_token', 'test_refresh_token');

INSERT INTO public.workflows (user_id, n8n_workflow_id, status, deployment_status) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 'test_workflow_1', 'active', 'deployed'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 'test_workflow_2', 'active', 'deployed'),
((SELECT id FROM auth.users WHERE email = 'user@floworx.com'), 'test_workflow_3', 'active', 'deployed');

INSERT INTO public.email_logs (user_id, provider, provider_message_id, subject, sender, status) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 'gmail', 'test_msg_1', 'Test Email Subject', 'sender@example.com', 'processed'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 'outlook', 'test_msg_2', 'Admin Email Subject', 'admin@example.com', 'processed'),
((SELECT id FROM auth.users WHERE email = 'user@floworx.com'), 'gmail', 'test_msg_3', 'User Email Subject', 'user@example.com', 'new');

INSERT INTO public.performance_metrics (user_id, metric_name, metric_value, metric_unit) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 'response_time', 150.50, 'ms'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 'response_time', 120.25, 'ms'),
((SELECT id FROM auth.users WHERE email = 'user@floworx.com'), 'response_time', 180.75, 'ms');

INSERT INTO public.ai_responses (user_id, email_id, prompt, response, model, tokens_used, processing_time_ms) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 
 (SELECT id FROM email_logs WHERE provider_message_id = 'test_msg_1'), 
 'Generate response for test email', 
 'Thank you for your email. We will get back to you shortly.', 
 'gpt-3.5-turbo', 25, 1500),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 
 (SELECT id FROM email_logs WHERE provider_message_id = 'test_msg_2'), 
 'Generate response for admin email', 
 'We have received your request and will process it immediately.', 
 'gpt-3.5-turbo', 30, 1200);

INSERT INTO public.communication_styles (user_id, style_profile, confidence_score) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 
 '{"tone": "professional", "formality": "formal", "length": "concise"}', 0.85),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 
 '{"tone": "friendly", "formality": "casual", "length": "detailed"}', 0.92);

INSERT INTO public.business_hours (user_id, day_of_week, start_time, end_time) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 1, '09:00:00', '17:00:00'),
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 2, '09:00:00', '17:00:00'),
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 3, '09:00:00', '17:00:00'),
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 4, '09:00:00', '17:00:00'),
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 5, '09:00:00', '17:00:00');

INSERT INTO public.response_templates (user_id, template_name, template_content, template_type) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), 'Welcome Email', 'Welcome to our service! We are excited to help you.', 'email'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), 'Thank You', 'Thank you for contacting us. We appreciate your business.', 'email');

INSERT INTO public.notification_settings (user_id, email_notifications, push_notifications, notification_frequency) VALUES
((SELECT id FROM auth.users WHERE email = 'test@floworx.com'), true, true, 'immediate'),
((SELECT id FROM auth.users WHERE email = 'admin@floworx.com'), true, false, 'daily'),
((SELECT id FROM auth.users WHERE email = 'user@floworx.com'), true, true, 'immediate');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id ON public.ai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_styles_user_id ON public.communication_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_email_webhooks_user_id ON public.email_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_user_id ON public.business_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_user_id ON public.escalation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_response_templates_user_id ON public.response_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_webhooks_updated_at BEFORE UPDATE ON public.email_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON public.business_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escalation_rules_updated_at BEFORE UPDATE ON public.escalation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_templates_updated_at BEFORE UPDATE ON public.response_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own integrations" ON public.integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integrations" ON public.integrations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workflows" ON public.workflows
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workflows" ON public.workflows
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email logs" ON public.email_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own performance metrics" ON public.performance_metrics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI responses" ON public.ai_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI responses" ON public.ai_responses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own communication styles" ON public.communication_styles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own communication styles" ON public.communication_styles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own email webhooks" ON public.email_webhooks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email webhooks" ON public.email_webhooks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own business hours" ON public.business_hours
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own business hours" ON public.business_hours
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own escalation rules" ON public.escalation_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own escalation rules" ON public.escalation_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own response templates" ON public.response_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own response templates" ON public.response_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification settings" ON public.notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Supabase test database initialized successfully!';
    RAISE NOTICE 'Test users created: test@floworx.com, admin@floworx.com, user@floworx.com';
    RAISE NOTICE 'Test data inserted for all tables';
    RAISE NOTICE 'RLS policies created for all tables';
END $$;
