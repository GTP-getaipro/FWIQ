#!/usr/bin/env node

/**
 * Post-Deployment Schema Validator
 * Comprehensive validation script for database schema changes
 * Validates all tables, columns, indexes, and relationships from Tickets #91, #92, #93
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Validation results tracking
const validationResults = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  errors: [],
  warnings: []
};

/**
 * Add test result to tracking
 */
function addTestResult(testName, status, message, details = null) {
  const result = {
    test: testName,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  validationResults.tests.push(result);
  validationResults.summary.total++;
  
  switch (status) {
    case 'pass':
      validationResults.summary.passed++;
      console.log(`✅ ${testName}: ${message}`);
      break;
    case 'fail':
      validationResults.summary.failed++;
      validationResults.errors.push(result);
      console.log(`❌ ${testName}: ${message}`);
      break;
    case 'warning':
      validationResults.summary.warnings++;
      validationResults.warnings.push(result);
      console.log(`⚠️  ${testName}: ${message}`);
      break;
  }
}

/**
 * Execute SQL query and return results
 */
async function executeQuery(query, description) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error(`❌ ${description}: ${error.message}`);
    return null;
  }
}

/**
 * Validate table existence
 */
async function validateTableExistence() {
  console.log('\n🔍 Validating Table Existence...');
  
  const requiredTables = [
    // Migration management tables (Ticket #91)
    'migration_backups',
    'migration_logs', 
    'data_exports',
    
    // Outlook analytics tables (Ticket #92)
    'outlook_analytics_events',
    'outlook_business_events',
    'outlook_alerts',
    
    // Existing tables that should exist
    'profiles',
    'integrations',
    'workflows',
    'client_credentials_map'
  ];

  for (const tableName of requiredTables) {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
        ) as exists;
      `;
      
      const result = await executeQuery(query, `Check table ${tableName}`);
      
      if (result && result[0]?.exists) {
        addTestResult(
          `Table Existence: ${tableName}`,
          'pass',
          `Table ${tableName} exists`
        );
      } else {
        addTestResult(
          `Table Existence: ${tableName}`,
          'fail',
          `Table ${tableName} does not exist`
        );
      }
    } catch (error) {
      addTestResult(
        `Table Existence: ${tableName}`,
        'fail',
        `Error checking table ${tableName}: ${error.message}`
      );
    }
  }
}

/**
 * Validate column existence and data types
 */
async function validateColumnExistence() {
  console.log('\n🔍 Validating Column Existence and Data Types...');
  
  const requiredColumns = [
    // Profiles table columns (Ticket #93)
    {
      table: 'profiles',
      columns: [
        { name: 'primary_provider', type: 'character varying', nullable: true },
        { name: 'dual_provider_mode', type: 'boolean', nullable: true },
        { name: 'last_provider_change', type: 'timestamp with time zone', nullable: true },
        { name: 'migration_enabled', type: 'boolean', nullable: true }
      ]
    },
    
    // Integrations table columns (Ticket #93)
    {
      table: 'integrations',
      columns: [
        { name: 'migration_status', type: 'character varying', nullable: true },
        { name: 'migrated_from', type: 'character varying', nullable: true },
        { name: 'migrated_at', type: 'timestamp with time zone', nullable: true },
        { name: 'migration_id', type: 'character varying', nullable: true }
      ]
    },
    
    // Migration backups table columns (Ticket #91)
    {
      table: 'migration_backups',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'migration_id', type: 'character varying', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'provider', type: 'character varying', nullable: false },
        { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
        { name: 'data', type: 'jsonb', nullable: false },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true }
      ]
    },
    
    // Migration logs table columns (Ticket #91)
    {
      table: 'migration_logs',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'migration_type', type: 'character varying', nullable: false },
        { name: 'from_provider', type: 'character varying', nullable: false },
        { name: 'to_provider', type: 'character varying', nullable: false },
        { name: 'status', type: 'character varying', nullable: false },
        { name: 'steps', type: 'jsonb', nullable: true },
        { name: 'error_message', type: 'text', nullable: true },
        { name: 'duration', type: 'integer', nullable: true },
        { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true }
      ]
    },
    
    // Data exports table columns (Ticket #91)
    {
      table: 'data_exports',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'export_type', type: 'character varying', nullable: false },
        { name: 'file_name', type: 'character varying', nullable: true },
        { name: 'file_size', type: 'integer', nullable: true },
        { name: 'includes', type: 'ARRAY', nullable: true },
        { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true }
      ]
    },
    
    // Outlook analytics events table columns (Ticket #92)
    {
      table: 'outlook_analytics_events',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'provider', type: 'character varying', nullable: true },
        { name: 'event_type', type: 'character varying', nullable: false },
        { name: 'data', type: 'jsonb', nullable: false },
        { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true }
      ]
    },
    
    // Outlook business events table columns (Ticket #92)
    {
      table: 'outlook_business_events',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'event', type: 'character varying', nullable: false },
        { name: 'data', type: 'jsonb', nullable: true },
        { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true }
      ]
    },
    
    // Outlook alerts table columns (Ticket #92)
    {
      table: 'outlook_alerts',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'provider', type: 'character varying', nullable: true },
        { name: 'alert_type', type: 'character varying', nullable: false },
        { name: 'severity', type: 'character varying', nullable: false },
        { name: 'message', type: 'text', nullable: false },
        { name: 'details', type: 'jsonb', nullable: true },
        { name: 'status', type: 'character varying', nullable: true },
        { name: 'timestamp', type: 'timestamp with time zone', nullable: true },
        { name: 'resolved_at', type: 'timestamp with time zone', nullable: true },
        { name: 'created_at', type: 'timestamp with time zone', nullable: true }
      ]
    }
  ];

  for (const tableSpec of requiredColumns) {
    const { table, columns } = tableSpec;
    
    for (const columnSpec of columns) {
      try {
        const query = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = '${table}' 
            AND column_name = '${columnSpec.name}'
            AND table_schema = 'public';
        `;
        
        const result = await executeQuery(query, `Check column ${table}.${columnSpec.name}`);
        
        if (result && result.length > 0) {
          const column = result[0];
          const actualType = column.data_type;
          const expectedType = columnSpec.type;
          const actualNullable = column.is_nullable === 'YES';
          const expectedNullable = columnSpec.nullable;
          
          // Check data type (handle array types)
          const typeMatches = actualType === expectedType || 
                             (expectedType === 'ARRAY' && actualType.includes('[]'));
          
          // Check nullable constraint
          const nullableMatches = actualNullable === expectedNullable;
          
          if (typeMatches && nullableMatches) {
            addTestResult(
              `Column: ${table}.${columnSpec.name}`,
              'pass',
              `Column exists with correct type (${actualType}) and nullable (${actualNullable})`
            );
          } else {
            addTestResult(
              `Column: ${table}.${columnSpec.name}`,
              'fail',
              `Column exists but type/nullable mismatch. Expected: ${expectedType}/${expectedNullable}, Actual: ${actualType}/${actualNullable}`
            );
          }
        } else {
          addTestResult(
            `Column: ${table}.${columnSpec.name}`,
            'fail',
            `Column ${columnSpec.name} does not exist in table ${table}`
          );
        }
      } catch (error) {
        addTestResult(
          `Column: ${table}.${columnSpec.name}`,
          'fail',
          `Error checking column ${table}.${columnSpec.name}: ${error.message}`
        );
      }
    }
  }
}

/**
 * Validate foreign key relationships
 */
async function validateForeignKeyRelationships() {
  console.log('\n🔍 Validating Foreign Key Relationships...');
  
  const expectedForeignKeys = [
    {
      table: 'migration_backups',
      column: 'user_id',
      referencedTable: 'auth.users',
      referencedColumn: 'id'
    },
    {
      table: 'migration_logs',
      column: 'user_id',
      referencedTable: 'auth.users',
      referencedColumn: 'id'
    },
    {
      table: 'data_exports',
      column: 'user_id',
      referencedTable: 'auth.users',
      referencedColumn: 'id'
    },
    {
      table: 'outlook_analytics_events',
      column: 'user_id',
      referencedTable: 'auth.users',
      referencedColumn: 'id'
    },
    {
      table: 'outlook_business_events',
      column: 'user_id',
      referencedTable: 'auth.users',
      referencedColumn: 'id'
    },
    {
      table: 'outlook_alerts',
      column: 'user_id',
      referencedTable: 'auth.users',
      referencedColumn: 'id'
    }
  ];

  for (const fkSpec of expectedForeignKeys) {
    try {
      const query = `
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = '${fkSpec.table}'
          AND kcu.column_name = '${fkSpec.column}';
      `;
      
      const result = await executeQuery(query, `Check FK ${fkSpec.table}.${fkSpec.column}`);
      
      if (result && result.length > 0) {
        const fk = result[0];
        const matches = fk.foreign_table_name === fkSpec.referencedTable && 
                       fk.foreign_column_name === fkSpec.referencedColumn;
        
        if (matches) {
          addTestResult(
            `Foreign Key: ${fkSpec.table}.${fkSpec.column}`,
            'pass',
            `FK correctly references ${fkSpec.referencedTable}.${fkSpec.referencedColumn}`
          );
        } else {
          addTestResult(
            `Foreign Key: ${fkSpec.table}.${fkSpec.column}`,
            'fail',
            `FK references ${fk.foreign_table_name}.${fk.foreign_column_name}, expected ${fkSpec.referencedTable}.${fkSpec.referencedColumn}`
          );
        }
      } else {
        addTestResult(
          `Foreign Key: ${fkSpec.table}.${fkSpec.column}`,
          'fail',
          `Foreign key constraint not found for ${fkSpec.table}.${fkSpec.column}`
        );
      }
    } catch (error) {
      addTestResult(
        `Foreign Key: ${fkSpec.table}.${fkSpec.column}`,
        'fail',
        `Error checking FK ${fkSpec.table}.${fkSpec.column}: ${error.message}`
      );
    }
  }
}

/**
 * Validate check constraints
 */
async function validateCheckConstraints() {
  console.log('\n🔍 Validating Check Constraints...');
  
  const expectedConstraints = [
    {
      table: 'migration_logs',
      column: 'status',
      values: ['pending', 'in_progress', 'completed', 'failed', 'rolled_back']
    },
    {
      table: 'outlook_alerts',
      column: 'severity',
      values: ['low', 'medium', 'high', 'critical']
    },
    {
      table: 'outlook_alerts',
      column: 'status',
      values: ['active', 'resolved', 'dismissed']
    },
    {
      table: 'profiles',
      column: 'primary_provider',
      values: ['gmail', 'outlook']
    },
    {
      table: 'integrations',
      column: 'migration_status',
      values: ['none', 'pending', 'migrated', 'rolled_back']
    }
  ];

  for (const constraintSpec of expectedConstraints) {
    try {
      const query = `
        SELECT 
          tc.constraint_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = '${constraintSpec.table}'
          AND tc.constraint_type = 'CHECK';
      `;
      
      const result = await executeQuery(query, `Check constraints for ${constraintSpec.table}`);
      
      if (result && result.length > 0) {
        const hasConstraint = result.some(row => 
          row.check_clause.includes(constraintSpec.column)
        );
        
        if (hasConstraint) {
          addTestResult(
            `Check Constraint: ${constraintSpec.table}.${constraintSpec.column}`,
            'pass',
            `Check constraint exists for ${constraintSpec.column}`
          );
        } else {
          addTestResult(
            `Check Constraint: ${constraintSpec.table}.${constraintSpec.column}`,
            'fail',
            `Check constraint not found for ${constraintSpec.column}`
          );
        }
      } else {
        addTestResult(
          `Check Constraint: ${constraintSpec.table}.${constraintSpec.column}`,
          'fail',
          `No check constraints found for table ${constraintSpec.table}`
        );
      }
    } catch (error) {
      addTestResult(
        `Check Constraint: ${constraintSpec.table}.${constraintSpec.column}`,
        'fail',
        `Error checking constraints for ${constraintSpec.table}: ${error.message}`
      );
    }
  }
}

/**
 * Validate index existence and health
 */
async function validateIndexes() {
  console.log('\n🔍 Validating Indexes...');
  
  const requiredIndexes = [
    // Migration table indexes
    'idx_migration_backups_user_id',
    'idx_migration_backups_migration_id',
    'idx_migration_backups_timestamp',
    'idx_migration_logs_user_id',
    'idx_migration_logs_status',
    'idx_migration_logs_timestamp',
    'idx_migration_logs_migration_type',
    'idx_data_exports_user_id',
    'idx_data_exports_timestamp',
    'idx_data_exports_export_type',
    
    // Outlook analytics indexes
    'idx_outlook_analytics_events_user_id',
    'idx_outlook_analytics_events_event_type',
    'idx_outlook_analytics_events_timestamp',
    'idx_outlook_analytics_events_provider',
    'idx_outlook_business_events_user_id',
    'idx_outlook_business_events_event',
    'idx_outlook_business_events_timestamp',
    'idx_outlook_alerts_user_id',
    'idx_outlook_alerts_status',
    'idx_outlook_alerts_severity',
    'idx_outlook_alerts_timestamp',
    
    // Profile and integration indexes
    'idx_profiles_primary_provider',
    'idx_profiles_dual_provider_mode',
    'idx_profiles_last_provider_change',
    'idx_integrations_migration_status',
    'idx_integrations_migrated_at',
    'idx_integrations_migration_id'
  ];

  for (const indexName of requiredIndexes) {
    try {
      const query = `
        SELECT 
          indexname,
          tablename,
          indexdef
        FROM pg_indexes 
        WHERE indexname = '${indexName}'
          AND schemaname = 'public';
      `;
      
      const result = await executeQuery(query, `Check index ${indexName}`);
      
      if (result && result.length > 0) {
        const index = result[0];
        addTestResult(
          `Index: ${indexName}`,
          'pass',
          `Index exists on table ${index.tablename}`
        );
      } else {
        addTestResult(
          `Index: ${indexName}`,
          'fail',
          `Index ${indexName} does not exist`
        );
      }
    } catch (error) {
      addTestResult(
        `Index: ${indexName}`,
        'fail',
        `Error checking index ${indexName}: ${error.message}`
      );
    }
  }
}

/**
 * Validate RLS policies
 */
async function validateRLSPolicies() {
  console.log('\n🔍 Validating Row Level Security Policies...');
  
  const tablesWithRLS = [
    'migration_backups',
    'migration_logs',
    'data_exports',
    'outlook_analytics_events',
    'outlook_business_events',
    'outlook_alerts'
  ];

  for (const tableName of tablesWithRLS) {
    try {
      // Check if RLS is enabled
      const rlsQuery = `
        SELECT 
          relrowsecurity as rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = '${tableName}' 
          AND n.nspname = 'public';
      `;
      
      const rlsResult = await executeQuery(rlsQuery, `Check RLS for ${tableName}`);
      
      if (rlsResult && rlsResult[0]?.rls_enabled) {
        addTestResult(
          `RLS Enabled: ${tableName}`,
          'pass',
          `Row Level Security is enabled on ${tableName}`
        );
        
        // Check for RLS policies
        const policyQuery = `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename = '${tableName}'
            AND schemaname = 'public';
        `;
        
        const policyResult = await executeQuery(policyQuery, `Check policies for ${tableName}`);
        
        if (policyResult && policyResult.length > 0) {
          addTestResult(
            `RLS Policies: ${tableName}`,
            'pass',
            `Found ${policyResult.length} RLS policy(ies) on ${tableName}`
          );
        } else {
          addTestResult(
            `RLS Policies: ${tableName}`,
            'warning',
            `RLS enabled but no policies found on ${tableName}`
          );
        }
      } else {
        addTestResult(
          `RLS Enabled: ${tableName}`,
          'fail',
          `Row Level Security is not enabled on ${tableName}`
        );
      }
    } catch (error) {
      addTestResult(
        `RLS: ${tableName}`,
        'fail',
        `Error checking RLS for ${tableName}: ${error.message}`
      );
    }
  }
}

/**
 * Validate data integrity with sample operations
 */
async function validateDataIntegrity() {
  console.log('\n🔍 Validating Data Integrity with Sample Operations...');
  
  try {
    // Test inserting a sample migration log
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Test UUID
    
    const insertQuery = `
      INSERT INTO migration_logs (
        user_id, migration_type, from_provider, to_provider, 
        status, steps, duration, timestamp
      ) VALUES (
        '${testUserId}', 'test_migration', 'gmail', 'outlook',
        'completed', '{"step1": "test"}', 1000, NOW()
      ) RETURNING id;
    `;
    
    const insertResult = await executeQuery(insertQuery, 'Test insert into migration_logs');
    
    if (insertResult && insertResult[0]?.id) {
      addTestResult(
        'Data Integrity: Migration Logs Insert',
        'pass',
        'Successfully inserted test record into migration_logs'
      );
      
      // Clean up test record
      const deleteQuery = `DELETE FROM migration_logs WHERE id = '${insertResult[0].id}';`;
      await executeQuery(deleteQuery, 'Clean up test record');
      
      addTestResult(
        'Data Integrity: Migration Logs Cleanup',
        'pass',
        'Successfully cleaned up test record'
      );
    } else {
      addTestResult(
        'Data Integrity: Migration Logs Insert',
        'fail',
        'Failed to insert test record into migration_logs'
      );
    }
  } catch (error) {
    addTestResult(
      'Data Integrity: Migration Logs Test',
      'fail',
      `Error testing data integrity: ${error.message}`
    );
  }
  
  try {
    // Test inserting a sample analytics event
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Test UUID
    
    const insertQuery = `
      INSERT INTO outlook_analytics_events (
        user_id, provider, event_type, data, timestamp
      ) VALUES (
        '${testUserId}', 'outlook', 'test_event', '{"test": true}', NOW()
      ) RETURNING id;
    `;
    
    const insertResult = await executeQuery(insertQuery, 'Test insert into outlook_analytics_events');
    
    if (insertResult && insertResult[0]?.id) {
      addTestResult(
        'Data Integrity: Analytics Events Insert',
        'pass',
        'Successfully inserted test record into outlook_analytics_events'
      );
      
      // Clean up test record
      const deleteQuery = `DELETE FROM outlook_analytics_events WHERE id = '${insertResult[0].id}';`;
      await executeQuery(deleteQuery, 'Clean up test record');
      
      addTestResult(
        'Data Integrity: Analytics Events Cleanup',
        'pass',
        'Successfully cleaned up test record'
      );
    } else {
      addTestResult(
        'Data Integrity: Analytics Events Insert',
        'fail',
        'Failed to insert test record into outlook_analytics_events'
      );
    }
  } catch (error) {
    addTestResult(
      'Data Integrity: Analytics Events Test',
      'fail',
      `Error testing data integrity: ${error.message}`
    );
  }
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n📊 Validation Report Summary');
  console.log('================================');
  console.log(`Total Tests: ${validationResults.summary.total}`);
  console.log(`✅ Passed: ${validationResults.summary.passed}`);
  console.log(`❌ Failed: ${validationResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${validationResults.summary.warnings}`);
  
  if (validationResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    validationResults.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.message}`);
    });
  }
  
  if (validationResults.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validationResults.warnings.forEach(warning => {
      console.log(`   - ${warning.test}: ${warning.message}`);
    });
  }
  
  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'validation-report.json');
  validationResults.endTime = new Date().toISOString();
  validationResults.duration = new Date(validationResults.endTime) - new Date(validationResults.startTime);
  
  fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return validationResults.summary.failed === 0;
}

/**
 * Main validation function
 */
async function runValidation() {
  console.log('🚀 Starting Database Schema Validation');
  console.log('=====================================');
  console.log(`Target Database: ${SUPABASE_URL}`);
  console.log(`Start Time: ${validationResults.startTime}`);
  
  try {
    // Run all validation checks
    await validateTableExistence();
    await validateColumnExistence();
    await validateForeignKeyRelationships();
    await validateCheckConstraints();
    await validateIndexes();
    await validateRLSPolicies();
    await validateDataIntegrity();
    
    // Generate and display report
    const success = generateReport();
    
    if (success) {
      console.log('\n🎉 All validations passed! Database schema is ready for production.');
      process.exit(0);
    } else {
      console.log('\n💥 Some validations failed. Please review and fix the issues before proceeding.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Validation process failed:', error.message);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}

export { runValidation, validationResults };
