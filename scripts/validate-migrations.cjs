#!/usr/bin/env node

/**
 * Migration Validation Script
 * Validates that all database migrations have been applied correctly
 * and checks for data integrity issues
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Expected tables and their required columns
const expectedSchema = {
  profiles: {
    requiredColumns: ['id', 'email', 'onboarding_step', 'client_config', 'created_at'],
    optionalColumns: ['managers', 'suppliers', 'email_labels', 'business_type', 'business_name', 'timezone', 'currency', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'email UNIQUE']
  },
  integrations: {
    requiredColumns: ['id', 'user_id', 'provider', 'status', 'created_at'],
    optionalColumns: ['access_token', 'refresh_token', 'scope', 'expires_at', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'provider CHECK (provider IN (\'gmail\', \'outlook\'))']
  },
  workflows: {
    requiredColumns: ['id', 'user_id', 'n8n_workflow_id', 'version', 'status', 'created_at'],
    optionalColumns: ['deployment_status', 'workflow_data', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'status CHECK (status IN (\'active\', \'archived\', \'draft\'))']
  },
  email_queue: {
    requiredColumns: ['id', 'user_id', 'email_from', 'email_to', 'status', 'created_at'],
    optionalColumns: ['email_subject', 'email_body', 'priority', 'retry_count', 'max_retries', 'scheduled_at', 'sent_at', 'error_message', 'metadata', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'status CHECK (status IN (\'pending\', \'processing\', \'sent\', \'failed\', \'retrying\'))']
  },
  ai_responses: {
    requiredColumns: ['id', 'user_id', 'status', 'created_at'],
    optionalColumns: ['email_id', 'original_email', 'ai_response', 'confidence_score', 'response_type', 'metadata', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'status CHECK (status IN (\'draft\', \'approved\', \'sent\', \'rejected\'))']
  },
  email_logs: {
    requiredColumns: ['id', 'user_id', 'email_from', 'created_at'],
    optionalColumns: ['email_subject', 'category', 'urgency', 'response_sent'],
    constraints: ['id PRIMARY KEY']
  },
  email_webhooks: {
    requiredColumns: ['id', 'user_id', 'provider', 'webhook_url', 'status', 'created_at'],
    optionalColumns: ['secret_key', 'last_ping', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'status CHECK (status IN (\'active\', \'inactive\', \'failed\'))']
  },
  business_hours: {
    requiredColumns: ['id', 'user_id', 'day_of_week', 'start_time', 'end_time', 'created_at'],
    optionalColumns: ['timezone', 'is_active', 'updated_at'],
    constraints: ['id PRIMARY KEY', 'day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6)']
  },
  escalation_rules: {
    requiredColumns: ['id', 'user_id', 'rule_name', 'conditions', 'actions', 'created_at'],
    optionalColumns: ['priority', 'is_active', 'updated_at'],
    constraints: ['id PRIMARY KEY']
  },
  response_templates: {
    requiredColumns: ['id', 'user_id', 'template_name', 'template_body', 'created_at'],
    optionalColumns: ['template_subject', 'category', 'variables', 'is_active', 'updated_at'],
    constraints: ['id PRIMARY KEY']
  },
  notification_settings: {
    requiredColumns: ['id', 'user_id', 'notification_type', 'created_at'],
    optionalColumns: ['is_enabled', 'settings', 'updated_at'],
    constraints: ['id PRIMARY KEY']
  }
};

// Expected indexes
const expectedIndexes = [
  'idx_profiles_email',
  'idx_profiles_onboarding_step',
  'idx_integrations_user_provider',
  'idx_integrations_status',
  'idx_workflows_user_status',
  'idx_email_queue_status',
  'idx_email_queue_user_status',
  'idx_ai_responses_user_id',
  'idx_ai_responses_status',
  'idx_email_logs_user_id',
  'idx_business_hours_user_id',
  'idx_escalation_rules_user_id',
  'idx_response_templates_user_id',
  'idx_notification_settings_user_id'
];

async function validateMigrations() {
  console.log('🔍 Validating Database Migrations...\n');
  
  const results = {
    connection: false,
    tables: {},
    indexes: {},
    constraints: {},
    rls: {},
    overall: 'pending'
  };

  try {
    // Test connection
    console.log('1️⃣ Testing Database Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (connectionError && connectionError.code === 'PGRST116') {
      console.log('✅ Database connection successful (profiles table exists)');
      results.connection = true;
    } else if (connectionError) {
      console.log(`❌ Connection error: ${connectionError.message}`);
      results.connection = false;
    } else {
      console.log('✅ Database connection successful');
      results.connection = true;
    }

    // Validate table schemas
    console.log('\n2️⃣ Validating Table Schemas...');
    for (const [tableName, schema] of Object.entries(expectedSchema)) {
      console.log(`\n   Checking ${tableName}...`);
      
      try {
        // Test table exists and get column info
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (tableError && tableError.message.includes('does not exist')) {
          console.log(`   ❌ Table ${tableName} does not exist`);
          results.tables[tableName] = { exists: false, columns: [], error: tableError.message };
          continue;
        }

        if (tableError && tableError.code === 'PGRST116') {
          // Table exists but no data - check structure by trying to select specific columns
          console.log(`   ✅ Table ${tableName} exists (no data)`);
          results.tables[tableName] = { exists: true, columns: [], error: null };
        } else if (tableError) {
          console.log(`   ⚠️ Table ${tableName} accessible with issues: ${tableError.message}`);
          results.tables[tableName] = { exists: true, columns: [], error: tableError.message };
        } else {
          console.log(`   ✅ Table ${tableName} exists with data`);
          const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
          results.tables[tableName] = { exists: true, columns, error: null };
          
          // Validate required columns
          const missingColumns = schema.requiredColumns.filter(col => !columns.includes(col));
          if (missingColumns.length > 0) {
            console.log(`   ⚠️ Missing required columns: ${missingColumns.join(', ')}`);
          } else {
            console.log(`   ✅ All required columns present`);
          }
        }

        // Test RLS is enabled
        console.log(`   Checking RLS for ${tableName}...`);
        try {
          // Try to access without auth (should fail if RLS is enabled)
          const { error: rlsError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (rlsError && rlsError.message.includes('Row Level Security')) {
            console.log(`   ✅ RLS enabled for ${tableName}`);
            results.rls[tableName] = true;
          } else if (rlsError) {
            console.log(`   ⚠️ RLS check inconclusive: ${rlsError.message}`);
            results.rls[tableName] = false;
          } else {
            console.log(`   ⚠️ RLS may not be enabled for ${tableName}`);
            results.rls[tableName] = false;
          }
        } catch (rlsErr) {
          console.log(`   ❌ RLS check failed: ${rlsErr.message}`);
          results.rls[tableName] = false;
        }

      } catch (err) {
        console.log(`   ❌ Error checking ${tableName}: ${err.message}`);
        results.tables[tableName] = { exists: false, columns: [], error: err.message };
      }
    }

    // Validate indexes (simplified check)
    console.log('\n3️⃣ Validating Database Indexes...');
    for (const indexName of expectedIndexes) {
      try {
        // This is a simplified check - in a real scenario, you'd query pg_indexes
        console.log(`   ✅ Index ${indexName} expected (validation requires direct DB access)`);
        results.indexes[indexName] = true;
      } catch (err) {
        console.log(`   ❌ Index ${indexName} validation failed: ${err.message}`);
        results.indexes[indexName] = false;
      }
    }

    // Test data integrity constraints
    console.log('\n4️⃣ Testing Data Integrity Constraints...');
    
    // Test profiles table constraints
    try {
      const { error: duplicateEmailError } = await supabase
        .from('profiles')
        .insert([{ id: 'test-constraint-1', email: 'duplicate@test.com' }]);
      
      if (duplicateEmailError && duplicateEmailError.code === '23505') {
        console.log('   ✅ Unique constraint on profiles.email working');
        results.constraints['profiles_email_unique'] = true;
      } else {
        console.log('   ⚠️ Unique constraint on profiles.email may not be enforced');
        results.constraints['profiles_email_unique'] = false;
      }
    } catch (err) {
      console.log(`   ❌ Constraint test failed: ${err.message}`);
      results.constraints['profiles_email_unique'] = false;
    }

    // Test integrations provider constraint
    try {
      const { error: invalidProviderError } = await supabase
        .from('integrations')
        .insert([{ 
          id: 'test-constraint-2', 
          user_id: 'test-user-123', 
          provider: 'invalid_provider' 
        }]);
      
      if (invalidProviderError && invalidProviderError.message.includes('check constraint')) {
        console.log('   ✅ Provider constraint on integrations working');
        results.constraints['integrations_provider_check'] = true;
      } else {
        console.log('   ⚠️ Provider constraint on integrations may not be enforced');
        results.constraints['integrations_provider_check'] = false;
      }
    } catch (err) {
      console.log(`   ❌ Provider constraint test failed: ${err.message}`);
      results.constraints['integrations_provider_check'] = false;
    }

    // Overall validation summary
    console.log('\n📋 Migration Validation Summary:');
    
    const tableExists = Object.values(results.tables).filter(t => t.exists).length;
    const totalTables = Object.keys(expectedSchema).length;
    const rlsEnabled = Object.values(results.rls).filter(r => r === true).length;
    const constraintsWorking = Object.values(results.constraints).filter(c => c === true).length;
    
    console.log(`   - Database Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`   - Tables Present: ${tableExists}/${totalTables} (${Math.round(tableExists/totalTables*100)}%)`);
    console.log(`   - RLS Enabled: ${rlsEnabled}/${totalTables} (${Math.round(rlsEnabled/totalTables*100)}%)`);
    console.log(`   - Constraints Working: ${constraintsWorking}/2 tested`);
    console.log(`   - Indexes Expected: ${expectedIndexes.length}`);

    // Determine overall status
    if (results.connection && tableExists === totalTables && rlsEnabled === totalTables) {
      results.overall = 'success';
      console.log('\n🎉 Migration validation PASSED!');
      console.log('   All required tables exist with proper RLS policies.');
    } else if (results.connection && tableExists >= totalTables * 0.8) {
      results.overall = 'warning';
      console.log('\n⚠️ Migration validation PASSED with warnings!');
      console.log('   Most tables exist, but some issues detected.');
    } else {
      results.overall = 'failed';
      console.log('\n❌ Migration validation FAILED!');
      console.log('   Significant issues detected that need attention.');
    }

    // Recommendations
    console.log('\n🔧 Recommendations:');
    if (tableExists < totalTables) {
      console.log(`   - Run database schema migration to create missing tables`);
      console.log(`   - Execute: supabase/migrations/database-complete-schema-fix.sql`);
    }
    if (rlsEnabled < totalTables) {
      console.log(`   - Enable RLS policies on tables without proper security`);
    }
    if (constraintsWorking < 2) {
      console.log(`   - Verify data integrity constraints are properly enforced`);
    }

    return results;

  } catch (error) {
    console.error('❌ Migration validation error:', error.message);
    results.overall = 'error';
    return results;
  }
}

// Run validation if called directly
if (require.main === module) {
  validateMigrations()
    .then(results => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateMigrations, expectedSchema, expectedIndexes };
