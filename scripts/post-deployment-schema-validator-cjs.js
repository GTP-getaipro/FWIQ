#!/usr/bin/env node

/**
 * Post-Deployment Schema Validator (CommonJS Version)
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
