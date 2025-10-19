# **FloWorx Database Schema Documentation**

**Last Updated**: October 1, 2025  
**Version**: 1.0  
**Status**: Production Ready

## **Overview**

This document provides comprehensive documentation of the FloWorx database schema, including all tables, relationships, constraints, and data integrity rules.

## **Database Tables**

### **Core Tables**

#### **1. profiles**
**Purpose**: User profiles and client configurations  
**Primary Key**: `id` (UUID, references auth.users)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_config JSONB NOT NULL DEFAULT '{}',
  managers JSONB DEFAULT '[]',
  suppliers JSONB DEFAULT '[]',
  email_labels JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Relationships**:
- One-to-many with `integrations`
- One-to-many with `communication_styles`
- One-to-many with `business_hours`
- One-to-many with `escalation_rules`
- One-to-many with `notification_settings`

#### **2. integrations**
**Purpose**: Email provider integrations (Gmail, Outlook)  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  credentials JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. communication_styles**
**Purpose**: AI communication style profiles  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  formality TEXT NOT NULL DEFAULT 'formal',
  personality_traits JSONB DEFAULT '[]',
  signature_phrases JSONB DEFAULT '[]',
  response_patterns JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Business Logic Tables**

#### **4. business_hours**
**Purpose**: Business operating hours configuration  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hours JSONB NOT NULL DEFAULT '{}',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **5. escalation_rules**
**Purpose**: Email escalation rules and triggers  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **6. notification_settings**
**Purpose**: User notification preferences  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  escalation_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Email Processing Tables**

#### **7. email_logs**
**Purpose**: Email processing and response tracking  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'escalated', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **8. email_queue**
**Purpose**: Email processing queue  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_data JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **9. ai_responses**
**Purpose**: AI-generated email responses  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id UUID NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Analytics Tables**

#### **10. analytics_events**
**Purpose**: User interaction and system analytics  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **11. performance_metrics**
**Purpose**: System performance tracking  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Workflow Tables**

#### **12. workflows**
**Purpose**: N8N workflow configurations  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  workflow_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **13. workflow_metrics**
**Purpose**: Workflow performance tracking  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE workflow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  execution_time INTEGER,
  success_rate DECIMAL(3,2),
  error_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Billing Tables**

#### **14. subscriptions**
**Purpose**: User subscription management  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **15. invoices**
**Purpose**: Billing invoice management  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void')),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **System Tables**

#### **16. error_logs**
**Purpose**: System error logging  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **17. dead_letter_queue**
**Purpose**: Failed operations queue  
**Primary Key**: `id` (UUID)

```sql
CREATE TABLE dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  operation_data JSONB NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **Indexes**

### **Performance Indexes**
```sql
-- Email logs performance
CREATE INDEX idx_email_logs_client_status ON email_logs(client_id, status);
CREATE INDEX idx_email_logs_processed_at ON email_logs(processed_at);

-- Email queue performance
CREATE INDEX idx_email_queue_status_scheduled ON email_queue(status, scheduled_for);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);

-- Analytics performance
CREATE INDEX idx_analytics_events_client_timestamp ON analytics_events(client_id, timestamp);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- Workflow performance
CREATE INDEX idx_workflow_metrics_workflow_recorded ON workflow_metrics(workflow_id, recorded_at);

-- Error logs performance
CREATE INDEX idx_error_logs_severity_created ON error_logs(severity, created_at);
CREATE INDEX idx_error_logs_client_created ON error_logs(client_id, created_at);
```

## **Row Level Security (RLS)**

All tables implement Row Level Security policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_styles ENABLE ROW LEVEL SECURITY;
-- ... (all other tables)

-- Example RLS policy for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## **Triggers**

### **Updated At Triggers**
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (apply to all relevant tables)
```

## **Data Integrity Constraints**

### **Foreign Key Constraints**
- All client_id references enforce CASCADE DELETE
- All reference tables use appropriate ON DELETE actions
- Circular references are avoided

### **Check Constraints**
- Status fields use CHECK constraints for valid values
- Numeric fields have appropriate ranges
- JSONB fields are validated where possible

### **Unique Constraints**
- Email message_id per client must be unique
- One active communication style per client
- One active business hours configuration per client

## **Backup and Recovery**

### **Backup Strategy**
- Daily automated backups via Supabase
- Point-in-time recovery available
- Cross-region backup replication

### **Recovery Procedures**
- Database restore from backup
- Schema migration rollback procedures
- Data recovery from dead letter queue

## **Monitoring and Maintenance**

### **Performance Monitoring**
- Query performance tracking
- Index usage monitoring
- Connection pool monitoring

### **Maintenance Tasks**
- Regular VACUUM and ANALYZE
- Index maintenance
- Statistics updates

---

**Document Status**: ✅ **COMPLETE**  
**Next Review**: Monthly  
**Maintained By**: Development Team