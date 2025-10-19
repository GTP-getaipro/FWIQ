#!/usr/bin/env node

/**
 * Migration Validation Script
 * 
 * This script validates that all database migrations are properly applied
 * and that the schema matches the expected structure.
 * 
 * Usage: node scripts/validate-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected table schema
const expectedTables = {
  profiles: {
    columns: ['id', 'client_config', 'managers', 'suppliers', 'email_labels', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: []
  },
  integrations: {
    columns: ['id', 'client_id', 'provider', 'credentials', 'status', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_integrations_client_id']
  },
  communication_styles: {
    columns: ['id', 'client_id', 'name', 'tone', 'formality', 'personality_traits', 'signature_phrases', 'response_patterns', 'is_active', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_communication_styles_client_id']
  },
  business_hours: {
    columns: ['id', 'client_id', 'hours', 'timezone', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_business_hours_client_id']
  },
  escalation_rules: {
    columns: ['id', 'client_id', 'name', 'conditions', 'actions', 'priority', 'is_active', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_escalation_rules_client_id']
  },
  notification_settings: {
    columns: ['id', 'client_id', 'email_notifications', 'sms_notifications', 'push_notifications', 'escalation_alerts', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_notification_settings_client_id']
  },
  email_logs: {
    columns: ['id', 'client_id', 'message_id', 'from_email', 'to_email', 'subject', 'body', 'processed_at', 'status', 'created_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_email_logs_client_status', 'idx_email_logs_processed_at']
  },
  email_queue: {
    columns: ['id', 'client_id', 'email_data', 'priority', 'status', 'retry_count', 'scheduled_for', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_email_queue_status_scheduled', 'idx_email_queue_priority']
  },
  ai_responses: {
    columns: ['id', 'email_log_id', 'response_text', 'confidence_score', 'model_used', 'tokens_used', 'created_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_ai_responses_email_log_id']
  },
  analytics_events: {
    columns: ['id', 'client_id', 'event_type', 'event_data', 'timestamp'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_analytics_events_client_timestamp', 'idx_analytics_events_type']
  },
  performance_metrics: {
    columns: ['id', 'client_id', 'metric_type', 'metric_value', 'recorded_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_performance_metrics_client_recorded']
  },
  workflows: {
    columns: ['id', 'client_id', 'name', 'workflow_data', 'version', 'is_active', 'deployed_at', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_workflows_client_id']
  },
  workflow_metrics: {
    columns: ['id', 'workflow_id', 'execution_time', 'success_rate', 'error_count', 'recorded_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY'],
    indexes: ['idx_workflow_metrics_workflow_recorded']
  },
  subscriptions: {
    columns: ['id', 'client_id', 'plan_id', 'status', 'current_period_start', 'current_period_end', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_subscriptions_client_id']
  },
  invoices: {
    columns: ['id', 'subscription_id', 'amount', 'currency', 'status', 'due_date', 'paid_at', 'created_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_invoices_subscription_id']
  },
  error_logs: {
    columns: ['id', 'client_id', 'error_type', 'error_message', 'stack_trace', 'context', 'severity', 'resolved_at', 'created_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_error_logs_severity_created', 'idx_error_logs_client_created']
  },
  dead_letter_queue: {
    columns: ['id', 'client_id', 'operation_type', 'operation_data', 'error_message', 'retry_count', 'status', 'created_at', 'updated_at'],
    constraints: ['PRIMARY KEY', 'FOREIGN KEY', 'CHECK'],
    indexes: ['idx_dead_letter_queue_status_created']
  }
};

/**
 * Get all tables from the database
 */
async function getDatabaseTables() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    return data.map(row => row.table_name);
  } catch (error) {
    console.error('❌ Error fetching database tables:', error.message);
    return [];
  }
}

/**
 * Get table schema information
 */
async function getTableSchema(tableName) {
  try {
    // Get columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) throw columnsError;

    // Get constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');
    
    if (constraintsError) throw constraintsError;

    // Get indexes
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', tableName)
      .eq('schemaname', 'public');
    
    if (indexesError) throw indexesError;

    return {
      columns: columns.map(col => col.column_name),
      constraints: constraints.map(con => con.constraint_type),
      indexes: indexes.map(idx => idx.indexname)
    };
  } catch (error) {
    console.error(`❌ Error fetching schema for table ${tableName}:`, error.message);
    return null;
  }
}

/**
 * Validate table structure
 */
function validateTable(tableName, expected, actual) {
  const errors = [];
  const warnings = [];

  // Check if table exists
  if (!actual) {
    errors.push(`Table '${tableName}' does not exist`);
    return { errors, warnings };
  }

  // Check columns
  const missingColumns = expected.columns.filter(col => !actual.columns.includes(col));
  const extraColumns = actual.columns.filter(col => !expected.columns.includes(col));

  if (missingColumns.length > 0) {
    errors.push(`Missing columns in '${tableName}': ${missingColumns.join(', ')}`);
  }

  if (extraColumns.length > 0) {
    warnings.push(`Extra columns in '${tableName}': ${extraColumns.join(', ')}`);
  }

  // Check constraints
  const missingConstraints = expected.constraints.filter(con => !actual.constraints.includes(con));
  if (missingConstraints.length > 0) {
    errors.push(`Missing constraints in '${tableName}': ${missingConstraints.join(', ')}`);
  }

  // Check indexes (more lenient - just warn about missing indexes)
  const missingIndexes = expected.indexes.filter(idx => !actual.indexes.includes(idx));
  if (missingIndexes.length > 0) {
    warnings.push(`Missing indexes in '${tableName}': ${missingIndexes.join(', ')}`);
  }

  return { errors, warnings };
}

/**
 * Test database connectivity
 */
async function testConnectivity() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Database connectivity test passed');
    return true;
  } catch (error) {
    console.error('❌ Database connectivity test failed:', error.message);
    return false;
  }
}

/**
 * Test RLS policies
 */
async function testRLS() {
  try {
    // Test that RLS is enabled on key tables
    const { data, error } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .in('relname', ['profiles', 'integrations', 'communication_styles'])
      .eq('relnamespace', (await supabase.from('pg_namespace').select('oid').eq('nspname', 'public').single()).data.oid);
    
    if (error) throw error;
    
    const tablesWithRLS = data.filter(row => row.relrowsecurity).map(row => row.relname);
    const expectedTablesWithRLS = ['profiles', 'integrations', 'communication_styles'];
    const missingRLS = expectedTablesWithRLS.filter(table => !tablesWithRLS.includes(table));
    
    if (missingRLS.length > 0) {
      console.warn(`⚠️  RLS not enabled on tables: ${missingRLS.join(', ')}`);
    } else {
      console.log('✅ RLS policies test passed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ RLS policies test failed:', error.message);
    return false;
  }
}

/**
 * Main validation function
 */
async function validateMigrations() {
  console.log('🔍 Starting migration validation...\n');

  // Test connectivity
  const connectivityOk = await testConnectivity();
  if (!connectivityOk) {
    process.exit(1);
  }

  // Test RLS
  await testRLS();

  // Get all tables from database
  const databaseTables = await getDatabaseTables();
  console.log(`📊 Found ${databaseTables.length} tables in database\n`);

  let totalErrors = 0;
  let totalWarnings = 0;

  // Validate each expected table
  for (const [tableName, expectedSchema] of Object.entries(expectedTables)) {
    console.log(`🔍 Validating table: ${tableName}`);
    
    const actualSchema = await getTableSchema(tableName);
    const validation = validateTable(tableName, expectedSchema, actualSchema);
    
    if (validation.errors.length > 0) {
      console.error(`   ❌ Errors: ${validation.errors.join(', ')}`);
      totalErrors += validation.errors.length;
    }
    
    if (validation.warnings.length > 0) {
      console.warn(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
      totalWarnings += validation.warnings.length;
    }
    
    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      console.log(`   ✅ Valid`);
    }
    
    console.log('');
  }

  // Check for unexpected tables
  const expectedTableNames = Object.keys(expectedTables);
  const unexpectedTables = databaseTables.filter(table => !expectedTableNames.includes(table));
  
  if (unexpectedTables.length > 0) {
    console.warn(`⚠️  Unexpected tables found: ${unexpectedTables.join(', ')}`);
    totalWarnings += unexpectedTables.length;
  }

  // Summary
  console.log('📋 Validation Summary:');
  console.log(`   Tables validated: ${expectedTableNames.length}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ Migration validation completed successfully!');
    if (totalWarnings > 0) {
      console.log('⚠️  Some warnings were found - please review above');
    }
  } else {
    console.log('\n❌ Migration validation failed with errors');
    process.exit(1);
  }
}

// Run validation
validateMigrations().catch(error => {
  console.error('💥 Validation script failed:', error);
  process.exit(1);
});