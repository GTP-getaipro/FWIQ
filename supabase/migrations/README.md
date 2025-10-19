# Supabase Database Migration Scripts

## Overview

This directory contains SQL migration scripts to update your Supabase database schema for the provider migration and analytics features implemented in Tickets #91, #92, and #93.

## Available Scripts

### 1. `add-missing-columns.sql` (Quick Fix)
**Use this if you only need to add the missing columns identified by the validation script.**

- Adds missing columns to `profiles` and `integrations` tables
- Creates performance indexes for new columns
- Includes verification queries

### 2. `complete-schema-migration.sql` (Complete Solution)
**Use this for a complete schema update with all features.**

- Creates all migration management tables (Ticket #91)
- Creates all Outlook analytics tables (Ticket #92)
- Adds all missing columns to existing tables (Ticket #93)
- Creates all performance indexes
- Sets up Row Level Security (RLS) policies
- Grants proper permissions
- Includes comprehensive verification queries

### 3. `add-migration-portability-schema.sql` (Original)
**This is the original comprehensive script that includes everything.**

## How to Run the Scripts

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Script**
   - Copy the contents of your chosen script
   - Paste into the SQL editor
   - Click "Run" to execute

4. **Verify Results**
   - Check the output for verification queries
   - Look for "completed successfully!" message

### Method 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push --file supabase/migrations/complete-schema-migration.sql
```

### Method 3: Direct Database Connection

```bash
# Using psql (if you have direct database access)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f supabase/migrations/complete-schema-migration.sql
```

## Which Script Should You Use?

### ✅ **Use `add-missing-columns.sql` if:**
- You've already run the complete migration before
- You only need to add the missing columns identified by validation
- You want a quick fix for the validation failures

### ✅ **Use `complete-schema-migration.sql` if:**
- This is your first time running the migration
- You want all features (migration, analytics, portability)
- You want a clean, comprehensive solution

### ✅ **Use `add-migration-portability-schema.sql` if:**
- You want the original comprehensive script
- You need all features including triggers and detailed verification

## Expected Results

After running any of these scripts, you should see:

### ✅ **Tables Created:**
- `migration_backups` - Migration backup storage
- `migration_logs` - Migration audit trail
- `data_exports` - Data portability tracking
- `outlook_analytics_events` - Outlook analytics
- `outlook_business_events` - Outlook business events
- `outlook_alerts` - Outlook monitoring alerts

### ✅ **Columns Added:**
- `profiles.primary_provider` - Primary email provider
- `profiles.dual_provider_mode` - Dual provider support
- `profiles.last_provider_change` - Migration tracking
- `profiles.migration_enabled` - Migration feature flag
- `integrations.migration_status` - Migration status
- `integrations.migrated_from` - Source provider
- `integrations.migrated_at` - Migration timestamp
- `integrations.migration_id` - Migration identifier

### ✅ **Indexes Created:**
- Performance indexes on all new columns
- User ID indexes for fast lookups
- Timestamp indexes for time-based queries
- Status indexes for filtering

### ✅ **Security Enabled:**
- Row Level Security (RLS) on all new tables
- User-scoped data access policies
- Proper permissions for authenticated users

## Verification

After running the script, run the validation script to confirm everything is working:

```bash
node scripts/post-deployment-schema-validator.cjs
```

You should see:
- ✅ All tables exist and are accessible
- ✅ All columns exist with correct types
- ✅ All indexes are created
- ✅ RLS policies are working (warnings are expected)

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the service role key
   - Check that you have admin access to the database

2. **Table Already Exists**
   - Scripts use `IF NOT EXISTS` clauses
   - Safe to run multiple times

3. **Column Already Exists**
   - Scripts use `ADD COLUMN IF NOT EXISTS`
   - Safe to run multiple times

4. **Index Already Exists**
   - Scripts use `CREATE INDEX IF NOT EXISTS`
   - Safe to run multiple times

### Rollback

If you need to rollback changes:

```sql
-- Remove new tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS outlook_alerts CASCADE;
DROP TABLE IF EXISTS outlook_business_events CASCADE;
DROP TABLE IF EXISTS outlook_analytics_events CASCADE;
DROP TABLE IF EXISTS data_exports CASCADE;
DROP TABLE IF EXISTS migration_logs CASCADE;
DROP TABLE IF EXISTS migration_backups CASCADE;

-- Remove new columns (WARNING: This will delete all data in these columns)
ALTER TABLE integrations DROP COLUMN IF EXISTS migration_id;
ALTER TABLE integrations DROP COLUMN IF EXISTS migrated_at;
ALTER TABLE integrations DROP COLUMN IF EXISTS migrated_from;
ALTER TABLE integrations DROP COLUMN IF EXISTS migration_status;

ALTER TABLE profiles DROP COLUMN IF EXISTS migration_enabled;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_provider_change;
ALTER TABLE profiles DROP COLUMN IF EXISTS dual_provider_mode;
ALTER TABLE profiles DROP COLUMN IF EXISTS primary_provider;
```

## Next Steps

After running the migration:

1. **Run Validation Script**
   ```bash
   node scripts/post-deployment-schema-validator.cjs
   ```

2. **Test Application Features**
   - Test provider migration functionality
   - Test Outlook analytics features
   - Test data portability features

3. **Monitor Performance**
   - Check database performance
   - Monitor query execution times
   - Verify indexes are being used

4. **Update Documentation**
   - Update API documentation
   - Update user guides
   - Update deployment procedures
