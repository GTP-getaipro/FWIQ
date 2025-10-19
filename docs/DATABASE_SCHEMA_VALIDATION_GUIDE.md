# Database Schema Validation Execution Guide

## Overview

This guide provides instructions for running the comprehensive database schema validation script that validates all database changes from Tickets #91, #92, and #93.

## Prerequisites

### Environment Variables

Ensure the following environment variables are set:

```bash
# Required for database access
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Alternative variable names (also supported)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Database Access

The validation script requires **service role key** access to perform comprehensive schema validation. The service role key has admin privileges needed to:

- Query system tables (`information_schema`, `pg_indexes`, etc.)
- Check RLS policies and constraints
- Perform data integrity tests
- Access all user tables

## Running the Validation

### Method 1: Direct Node.js Execution

```bash
# Navigate to project root
cd /path/to/FloworxV2

# Set environment variables
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run validation script
node scripts/post-deployment-schema-validator.js
```

### Method 2: Using npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "validate-schema": "node scripts/post-deployment-schema-validator.js",
    "test-schema": "jest tests/database-schema-validation.test.js"
  }
}
```

Then run:

```bash
npm run validate-schema
```

### Method 3: Docker Execution

```bash
# Build and run in Docker container
docker run --rm \
  -e VITE_SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  -v $(pwd):/app \
  -w /app \
  node:18 \
  node scripts/post-deployment-schema-validator.js
```

## Validation Checks Performed

### 1. Table Existence Validation
- ✅ `migration_backups` (Ticket #91)
- ✅ `migration_logs` (Ticket #91)
- ✅ `data_exports` (Ticket #91)
- ✅ `outlook_analytics_events` (Ticket #92)
- ✅ `outlook_business_events` (Ticket #92)
- ✅ `outlook_alerts` (Ticket #92)
- ✅ `profiles` (existing)
- ✅ `integrations` (existing)
- ✅ `workflows` (existing)
- ✅ `client_credentials_map` (existing)

### 2. Column Existence and Data Types
- **Profiles Table** (Ticket #93):
  - `primary_provider` (VARCHAR, nullable)
  - `dual_provider_mode` (BOOLEAN, nullable)
  - `last_provider_change` (TIMESTAMP, nullable)
  - `migration_enabled` (BOOLEAN, nullable)

- **Integrations Table** (Ticket #93):
  - `migration_status` (VARCHAR, nullable)
  - `migrated_from` (VARCHAR, nullable)
  - `migrated_at` (TIMESTAMP, nullable)
  - `migration_id` (VARCHAR, nullable)

- **Migration Tables** (Ticket #91):
  - All required columns with correct types and constraints

- **Analytics Tables** (Ticket #92):
  - All required columns with correct types and constraints

### 3. Foreign Key Relationships
- All `user_id` columns properly reference `auth.users.id`
- Cascade delete relationships verified
- Referential integrity maintained

### 4. Check Constraints
- `migration_logs.status` → ['pending', 'in_progress', 'completed', 'failed', 'rolled_back']
- `outlook_alerts.severity` → ['low', 'medium', 'high', 'critical']
- `outlook_alerts.status` → ['active', 'resolved', 'dismissed']
- `profiles.primary_provider` → ['gmail', 'outlook']
- `integrations.migration_status` → ['none', 'pending', 'migrated', 'rolled_back']

### 5. Index Health and Performance
- **Migration Indexes** (26 total):
  - User ID indexes for fast lookups
  - Timestamp indexes for time-based queries
  - Status indexes for filtering
  - Provider indexes for provider-specific queries

### 6. Row Level Security (RLS)
- RLS enabled on all new tables
- Proper RLS policies in place
- User-scoped data access verified

### 7. Data Integrity Tests
- Sample insert/delete operations
- Constraint validation
- JSONB field validation
- UUID generation verification

## Expected Output

### Successful Validation
```
🚀 Starting Database Schema Validation
=====================================
Target Database: https://your-project.supabase.co
Start Time: 2024-01-01T00:00:00.000Z

🔍 Validating Table Existence...
✅ Table Existence: migration_backups: Table migration_backups exists
✅ Table Existence: migration_logs: Table migration_logs exists
✅ Table Existence: data_exports: Table data_exports exists
✅ Table Existence: outlook_analytics_events: Table outlook_analytics_events exists
✅ Table Existence: outlook_business_events: Table outlook_business_events exists
✅ Table Existence: outlook_alerts: Table outlook_alerts exists
✅ Table Existence: profiles: Table profiles exists
✅ Table Existence: integrations: Table integrations exists
✅ Table Existence: workflows: Table workflows exists
✅ Table Existence: client_credentials_map: Table client_credentials_map exists

🔍 Validating Column Existence and Data Types...
✅ Column: profiles.primary_provider: Column exists with correct type (character varying) and nullable (true)
✅ Column: profiles.dual_provider_mode: Column exists with correct type (boolean) and nullable (true)
✅ Column: profiles.last_provider_change: Column exists with correct type (timestamp with time zone) and nullable (true)
✅ Column: profiles.migration_enabled: Column exists with correct type (boolean) and nullable (true)
✅ Column: integrations.migration_status: Column exists with correct type (character varying) and nullable (true)
✅ Column: integrations.migrated_from: Column exists with correct type (character varying) and nullable (true)
✅ Column: integrations.migrated_at: Column exists with correct type (timestamp with time zone) and nullable (true)
✅ Column: integrations.migration_id: Column exists with correct type (character varying) and nullable (true)

🔍 Validating Foreign Key Relationships...
✅ Foreign Key: migration_backups.user_id: FK correctly references auth.users.id
✅ Foreign Key: migration_logs.user_id: FK correctly references auth.users.id
✅ Foreign Key: data_exports.user_id: FK correctly references auth.users.id
✅ Foreign Key: outlook_analytics_events.user_id: FK correctly references auth.users.id
✅ Foreign Key: outlook_business_events.user_id: FK correctly references auth.users.id
✅ Foreign Key: outlook_alerts.user_id: FK correctly references auth.users.id

🔍 Validating Check Constraints...
✅ Check Constraint: migration_logs.status: Check constraint exists for status
✅ Check Constraint: outlook_alerts.severity: Check constraint exists for severity
✅ Check Constraint: outlook_alerts.status: Check constraint exists for status
✅ Check Constraint: profiles.primary_provider: Check constraint exists for primary_provider
✅ Check Constraint: integrations.migration_status: Check constraint exists for migration_status

🔍 Validating Indexes...
✅ Index: idx_migration_backups_user_id: Index exists on table migration_backups
✅ Index: idx_migration_backups_migration_id: Index exists on table migration_backups
✅ Index: idx_migration_backups_timestamp: Index exists on table migration_backups
✅ Index: idx_migration_logs_user_id: Index exists on table migration_logs
✅ Index: idx_migration_logs_status: Index exists on table migration_logs
✅ Index: idx_migration_logs_timestamp: Index exists on table migration_logs
✅ Index: idx_migration_logs_migration_type: Index exists on table migration_logs
✅ Index: idx_data_exports_user_id: Index exists on table data_exports
✅ Index: idx_data_exports_timestamp: Index exists on table data_exports
✅ Index: idx_data_exports_export_type: Index exists on table data_exports
✅ Index: idx_outlook_analytics_events_user_id: Index exists on table outlook_analytics_events
✅ Index: idx_outlook_analytics_events_event_type: Index exists on table outlook_analytics_events
✅ Index: idx_outlook_analytics_events_timestamp: Index exists on table outlook_analytics_events
✅ Index: idx_outlook_analytics_events_provider: Index exists on table outlook_analytics_events
✅ Index: idx_outlook_business_events_user_id: Index exists on table outlook_business_events
✅ Index: idx_outlook_business_events_event: Index exists on table outlook_business_events
✅ Index: idx_outlook_business_events_timestamp: Index exists on table outlook_business_events
✅ Index: idx_outlook_alerts_user_id: Index exists on table outlook_alerts
✅ Index: idx_outlook_alerts_status: Index exists on table outlook_alerts
✅ Index: idx_outlook_alerts_severity: Index exists on table outlook_alerts
✅ Index: idx_outlook_alerts_timestamp: Index exists on table outlook_alerts
✅ Index: idx_profiles_primary_provider: Index exists on table profiles
✅ Index: idx_profiles_dual_provider_mode: Index exists on table profiles
✅ Index: idx_profiles_last_provider_change: Index exists on table profiles
✅ Index: idx_integrations_migration_status: Index exists on table integrations
✅ Index: idx_integrations_migrated_at: Index exists on table integrations
✅ Index: idx_integrations_migration_id: Index exists on table integrations

🔍 Validating Row Level Security Policies...
✅ RLS Enabled: migration_backups: Row Level Security is enabled on migration_backups
✅ RLS Policies: migration_backups: Found 1 RLS policy(ies) on migration_backups
✅ RLS Enabled: migration_logs: Row Level Security is enabled on migration_logs
✅ RLS Policies: migration_logs: Found 1 RLS policy(ies) on migration_logs
✅ RLS Enabled: data_exports: Row Level Security is enabled on data_exports
✅ RLS Policies: data_exports: Found 1 RLS policy(ies) on data_exports
✅ RLS Enabled: outlook_analytics_events: Row Level Security is enabled on outlook_analytics_events
✅ RLS Policies: outlook_analytics_events: Found 1 RLS policy(ies) on outlook_analytics_events
✅ RLS Enabled: outlook_business_events: Row Level Security is enabled on outlook_business_events
✅ RLS Policies: outlook_business_events: Found 1 RLS policy(ies) on outlook_business_events
✅ RLS Enabled: outlook_alerts: Row Level Security is enabled on outlook_alerts
✅ RLS Policies: outlook_alerts: Found 1 RLS policy(ies) on outlook_alerts

🔍 Validating Data Integrity with Sample Operations...
✅ Data Integrity: Migration Logs Insert: Successfully inserted test record into migration_logs
✅ Data Integrity: Migration Logs Cleanup: Successfully cleaned up test record
✅ Data Integrity: Analytics Events Insert: Successfully inserted test record into outlook_analytics_events
✅ Data Integrity: Analytics Events Cleanup: Successfully cleaned up test record

📊 Validation Report Summary
================================
Total Tests: 50
✅ Passed: 50
❌ Failed: 0
⚠️  Warnings: 0

📄 Detailed report saved to: /path/to/FloworxV2/validation-report.json

🎉 All validations passed! Database schema is ready for production.
```

### Failed Validation
```
📊 Validation Report Summary
================================
Total Tests: 50
✅ Passed: 45
❌ Failed: 5
⚠️  Warnings: 0

❌ Failed Tests:
   - Table Existence: migration_backups: Table migration_backups does not exist
   - Column: profiles.primary_provider: Column primary_provider does not exist in table profiles
   - Foreign Key: migration_backups.user_id: Foreign key constraint not found for migration_backups.user_id
   - Index: idx_migration_backups_user_id: Index idx_migration_backups_user_id does not exist
   - RLS Enabled: migration_backups: Row Level Security is not enabled on migration_backups

📄 Detailed report saved to: /path/to/FloworxV2/validation-report.json

💥 Some validations failed. Please review and fix the issues before proceeding.
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   ❌ Missing required environment variables:
      VITE_SUPABASE_URL or SUPABASE_URL
      SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
   ```
   **Solution**: Set the required environment variables before running the script.

2. **Database Connection Failed**
   ```
   ❌ Connection failed: Invalid API key
   ```
   **Solution**: Verify the service role key is correct and has proper permissions.

3. **Missing Tables**
   ```
   ❌ Table Existence: migration_backups: Table migration_backups does not exist
   ```
   **Solution**: Run the database migration script from Ticket #91 first.

4. **Missing Columns**
   ```
   ❌ Column: profiles.primary_provider: Column primary_provider does not exist in table profiles
   ```
   **Solution**: Run the database migration script from Ticket #93 first.

5. **Missing Indexes**
   ```
   ❌ Index: idx_migration_backups_user_id: Index idx_migration_backups_user_id does not exist
   ```
   **Solution**: Ensure all indexes were created during the migration scripts.

### Debug Mode

For detailed debugging, set the `DEBUG` environment variable:

```bash
export DEBUG=true
node scripts/post-deployment-schema-validator.js
```

## Report Analysis

### Validation Report Structure

The validation script generates a detailed JSON report (`validation-report.json`) containing:

```json
{
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-01-01T00:01:00.000Z",
  "duration": 60000,
  "tests": [
    {
      "test": "Table Existence: migration_backups",
      "status": "pass",
      "message": "Table migration_backups exists",
      "details": null,
      "timestamp": "2024-01-01T00:00:01.000Z"
    }
  ],
  "summary": {
    "total": 50,
    "passed": 50,
    "failed": 0,
    "warnings": 0
  },
  "errors": [],
  "warnings": []
}
```

### Success Criteria

The validation is considered **successful** when:
- ✅ All required tables exist
- ✅ All required columns exist with correct types
- ✅ All foreign key relationships are valid
- ✅ All check constraints are in place
- ✅ All required indexes exist
- ✅ RLS is enabled with proper policies
- ✅ Data integrity tests pass
- ✅ **Total failures = 0**

## Next Steps

After successful validation:

1. **Deploy to Production**: The database schema is ready for production deployment
2. **Run Application Tests**: Execute the full test suite to verify application functionality
3. **Monitor Performance**: Monitor database performance with the new schema
4. **Document Changes**: Update documentation with the new schema components

## Security Notes

- The validation script uses the **service role key** which has admin privileges
- **Never commit** the service role key to version control
- Use environment variables or secure key management systems
- The script performs **read-only** operations and **temporary test inserts** that are immediately cleaned up
- All test data uses a dummy UUID that doesn't conflict with real user data
