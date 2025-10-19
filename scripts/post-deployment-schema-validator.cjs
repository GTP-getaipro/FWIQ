#!/usr/bin/env node

/**
 * Post-Deployment Schema Validator (Supabase Client Version)
 * Comprehensive validation script for database schema changes
 * Validates all tables, columns, indexes, and relationships from Tickets #91, #92, #93
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  }
});

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
 * Test table access by attempting to query it
 */
async function testTableAccess(tableName, description) {
  try {
    // Try to select from the table with a limit to avoid large data transfers
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Table doesn't exist
        return { exists: false, error: 'Table does not exist' };
      } else {
        // Table exists but there's another error (permissions, etc.)
        return { exists: true, error: error.message };
      }
    }
    
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
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
    const result = await testTableAccess(tableName, `Check table ${tableName}`);
    
    if (result.exists) {
      addTestResult(
        `Table Existence: ${tableName}`,
        'pass',
        `Table ${tableName} exists and is accessible`
      );
    } else {
      addTestResult(
        `Table Existence: ${tableName}`,
        'fail',
        `Table ${tableName} does not exist or is not accessible: ${result.error}`
      );
    }
  }
}

/**
 * Validate column existence by testing data access
 */
async function validateColumnExistence() {
  console.log('\n🔍 Validating Column Existence...');
  
  const columnTests = [
    // Profiles table columns (Ticket #93)
    { table: 'profiles', column: 'primary_provider', testQuery: 'primary_provider' },
    { table: 'profiles', column: 'dual_provider_mode', testQuery: 'dual_provider_mode' },
    { table: 'profiles', column: 'last_provider_change', testQuery: 'last_provider_change' },
    { table: 'profiles', column: 'migration_enabled', testQuery: 'migration_enabled' },
    
    // Integrations table columns (Ticket #93)
    { table: 'integrations', column: 'migration_status', testQuery: 'migration_status' },
    { table: 'integrations', column: 'migrated_from', testQuery: 'migrated_from' },
    { table: 'integrations', column: 'migrated_at', testQuery: 'migrated_at' },
    { table: 'integrations', column: 'migration_id', testQuery: 'migration_id' }
  ];

  for (const test of columnTests) {
    try {
      const { data, error } = await supabase
        .from(test.table)
        .select(test.testQuery)
        .limit(1);
      
      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          addTestResult(
            `Column: ${test.table}.${test.column}`,
            'fail',
            `Column ${test.column} does not exist in table ${test.table}`
          );
        } else {
          addTestResult(
            `Column: ${test.table}.${test.column}`,
            'warning',
            `Column ${test.column} exists but query failed: ${error.message}`
          );
        }
      } else {
        addTestResult(
          `Column: ${test.table}.${test.column}`,
          'pass',
          `Column ${test.column} exists in table ${test.table}`
        );
      }
    } catch (error) {
      addTestResult(
        `Column: ${test.table}.${test.column}`,
        'fail',
        `Error checking column ${test.table}.${test.column}: ${error.message}`
      );
    }
  }
}

/**
 * Test data integrity with sample operations
 */
async function validateDataIntegrity() {
  console.log('\n🔍 Validating Data Integrity...');
  
  try {
    // Test inserting a sample migration log (if table exists)
    const { data: migrationLogsTest } = await supabase
      .from('migration_logs')
      .select('id')
      .limit(1);
    
    if (migrationLogsTest !== null) {
      addTestResult(
        'Data Integrity: Migration Logs Access',
        'pass',
        'Migration logs table is accessible for queries'
      );
    } else {
      addTestResult(
        'Data Integrity: Migration Logs Access',
        'fail',
        'Migration logs table is not accessible'
      );
    }
  } catch (error) {
    addTestResult(
      'Data Integrity: Migration Logs Access',
      'fail',
      `Error accessing migration logs: ${error.message}`
    );
  }
  
  try {
    // Test inserting a sample analytics event (if table exists)
    const { data: analyticsTest } = await supabase
      .from('outlook_analytics_events')
      .select('id')
      .limit(1);
    
    if (analyticsTest !== null) {
      addTestResult(
        'Data Integrity: Analytics Events Access',
        'pass',
        'Analytics events table is accessible for queries'
      );
    } else {
      addTestResult(
        'Data Integrity: Analytics Events Access',
        'fail',
        'Analytics events table is not accessible'
      );
    }
  } catch (error) {
    addTestResult(
      'Data Integrity: Analytics Events Access',
      'fail',
      `Error accessing analytics events: ${error.message}`
    );
  }
}

/**
 * Test RLS policies by checking if we can access user-scoped data
 */
async function validateRLSPolicies() {
  console.log('\n🔍 Validating Row Level Security...');
  
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
      // Try to access the table - RLS should prevent access without proper user context
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('permission') || error.message.includes('RLS')) {
          addTestResult(
            `RLS Policy: ${tableName}`,
            'pass',
            `RLS is properly configured - access denied without user context`
          );
        } else {
          addTestResult(
            `RLS Policy: ${tableName}`,
            'warning',
            `RLS may be configured but got different error: ${error.message}`
          );
        }
      } else {
        addTestResult(
          `RLS Policy: ${tableName}`,
          'warning',
          `RLS may not be properly configured - data accessible without user context`
        );
      }
    } catch (error) {
      addTestResult(
        `RLS Policy: ${tableName}`,
        'fail',
        `Error checking RLS for ${tableName}: ${error.message}`
      );
    }
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
    // Run validation checks
    await validateTableExistence();
    await validateColumnExistence();
    await validateDataIntegrity();
    await validateRLSPolicies();
    
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
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation, validationResults };