-- Test Database Initialization Script
-- Creates test database schema for FloWorx testing

-- Create test database
CREATE DATABASE floworx_test;

-- Connect to test database
\c floworx_test;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test users table
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test profiles table
CREATE TABLE IF NOT EXISTS test_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    business_type VARCHAR(100),
    onboarding_step VARCHAR(50) DEFAULT 'welcome',
    managers JSONB DEFAULT '[]'::jsonb,
    suppliers JSONB DEFAULT '[]'::jsonb,
    client_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test integrations table
CREATE TABLE IF NOT EXISTS test_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    access_token TEXT,
    refresh_token TEXT,
    scope TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test workflows table
CREATE TABLE IF NOT EXISTS test_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
    n8n_workflow_id VARCHAR(255),
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    deployment_status VARCHAR(20) DEFAULT 'pending',
    workflow_data JSONB DEFAULT '{}'::jsonb,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test email logs table
CREATE TABLE IF NOT EXISTS test_email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255) NOT NULL,
    subject TEXT,
    sender VARCHAR(255),
    received_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'new',
    raw_email_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test performance metrics table
CREATE TABLE IF NOT EXISTS test_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data
INSERT INTO test_users (email, password_hash, first_name, last_name) VALUES
('test@floworx.com', crypt('password123', gen_salt('bf')), 'Test', 'User'),
('admin@floworx.com', crypt('admin123', gen_salt('bf')), 'Admin', 'User');

INSERT INTO test_profiles (user_id, company_name, business_type, onboarding_step) VALUES
((SELECT id FROM test_users WHERE email = 'test@floworx.com'), 'Test Company', 'hvac', 'completed'),
((SELECT id FROM test_users WHERE email = 'admin@floworx.com'), 'Admin Company', 'electrician', 'completed');

INSERT INTO test_integrations (user_id, provider, status, access_token, refresh_token) VALUES
((SELECT id FROM test_users WHERE email = 'test@floworx.com'), 'gmail', 'active', 'test_access_token', 'test_refresh_token'),
((SELECT id FROM test_users WHERE email = 'admin@floworx.com'), 'outlook', 'active', 'test_access_token', 'test_refresh_token');

INSERT INTO test_workflows (user_id, n8n_workflow_id, status, deployment_status) VALUES
((SELECT id FROM test_users WHERE email = 'test@floworx.com'), 'test_workflow_1', 'active', 'deployed'),
((SELECT id FROM test_users WHERE email = 'admin@floworx.com'), 'test_workflow_2', 'active', 'deployed');

INSERT INTO test_email_logs (user_id, provider, provider_message_id, subject, sender, status) VALUES
((SELECT id FROM test_users WHERE email = 'test@floworx.com'), 'gmail', 'test_msg_1', 'Test Email Subject', 'sender@example.com', 'processed'),
((SELECT id FROM test_users WHERE email = 'admin@floworx.com'), 'outlook', 'test_msg_2', 'Admin Email Subject', 'admin@example.com', 'processed');

INSERT INTO test_performance_metrics (user_id, metric_name, metric_value, metric_unit) VALUES
((SELECT id FROM test_users WHERE email = 'test@floworx.com'), 'response_time', 150.50, 'ms'),
((SELECT id FROM test_users WHERE email = 'admin@floworx.com'), 'response_time', 120.25, 'ms');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_profiles_user_id ON test_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_test_integrations_user_id ON test_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_test_workflows_user_id ON test_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_test_email_logs_user_id ON test_email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_test_performance_metrics_user_id ON test_performance_metrics(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_test_users_updated_at BEFORE UPDATE ON test_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_profiles_updated_at BEFORE UPDATE ON test_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_integrations_updated_at BEFORE UPDATE ON test_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_workflows_updated_at BEFORE UPDATE ON test_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Test database initialized successfully!';
    RAISE NOTICE 'Test users created: test@floworx.com, admin@floworx.com';
    RAISE NOTICE 'Test data inserted for all tables';
END $$;
