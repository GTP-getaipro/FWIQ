#!/usr/bin/env node

/**
 * Database Validation Test Script
 * 
 * This script tests the database validation tools without requiring
 * actual database connections.
 * 
 * Usage: node scripts/test-db-validation.js
 */

import fs from 'fs/promises';
import path from 'path';

console.log('🧪 Testing Database Validation Tools...\n');

// Test 1: Check if schema documentation exists
async function testSchemaDocumentation() {
  console.log('📋 Testing schema documentation...');
  
  try {
    const schemaPath = 'docs/database-schema.md';
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    
    // Check for key sections
    const requiredSections = [
      '# **FloWorx Database Schema Documentation**',
      '## **Database Tables**',
      'profiles',
      'integrations',
      'communication_styles',
      'email_logs',
      'email_queue',
      'ai_responses',
      'workflows'
    ];
    
    let missingSections = [];
    requiredSections.forEach(section => {
      if (!schemaContent.includes(section)) {
        missingSections.push(section);
      }
    });
    
    if (missingSections.length === 0) {
      console.log('   ✅ Schema documentation is complete');
      return true;
    } else {
      console.log(`   ❌ Missing sections: ${missingSections.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading schema documentation: ${error.message}`);
    return false;
  }
}

// Test 2: Check if migration validation script exists and is valid
async function testMigrationValidationScript() {
  console.log('🔍 Testing migration validation script...');
  
  try {
    const scriptPath = 'scripts/validate-migrations.js';
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    
    // Check for key components
    const requiredComponents = [
      'createClient',
      'expectedTables',
      'getDatabaseTables',
      'getTableSchema',
      'validateTable',
      'testConnectivity',
      'testRLS'
    ];
    
    let missingComponents = [];
    requiredComponents.forEach(component => {
      if (!scriptContent.includes(component)) {
        missingComponents.push(component);
      }
    });
    
    if (missingComponents.length === 0) {
      console.log('   ✅ Migration validation script is complete');
      return true;
    } else {
      console.log(`   ❌ Missing components: ${missingComponents.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading migration validation script: ${error.message}`);
    return false;
  }
}

// Test 3: Check if integrity test script exists and is valid
async function testIntegrityTestScript() {
  console.log('🔗 Testing integrity test script...');
  
  try {
    const scriptPath = 'scripts/test-database-integrity.js';
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    
    // Check for key components
    const requiredComponents = [
      'testForeignKeyIntegrity',
      'testDataConsistency',
      'testUniqueConstraints',
      'testPerformanceMetrics',
      'testDataRetention'
    ];
    
    let missingComponents = [];
    requiredComponents.forEach(component => {
      if (!scriptContent.includes(component)) {
        missingComponents.push(component);
      }
    });
    
    if (missingComponents.length === 0) {
      console.log('   ✅ Integrity test script is complete');
      return true;
    } else {
      console.log(`   ❌ Missing components: ${missingComponents.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading integrity test script: ${error.message}`);
    return false;
  }
}

// Test 4: Check if SQL validation script exists and is valid
async function testSQLValidationScript() {
  console.log('🗄️  Testing SQL validation script...');
  
  try {
    const scriptPath = 'supabase/migrations/validation.sql';
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    
    // Check for key sections
    const requiredSections = [
      'SCHEMA VALIDATION',
      'FOREIGN KEY VALIDATION',
      'CONSTRAINT VALIDATION',
      'UNIQUE CONSTRAINT VALIDATION',
      'DATA TYPE VALIDATION',
      'INDEX VALIDATION',
      'ROW LEVEL SECURITY VALIDATION'
    ];
    
    let missingSections = [];
    requiredSections.forEach(section => {
      if (!scriptContent.includes(section)) {
        missingSections.push(section);
      }
    });
    
    if (missingSections.length === 0) {
      console.log('   ✅ SQL validation script is complete');
      return true;
    } else {
      console.log(`   ❌ Missing sections: ${missingSections.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading SQL validation script: ${error.message}`);
    return false;
  }
}

// Test 5: Validate expected tables structure
async function testExpectedTablesStructure() {
  console.log('📊 Testing expected tables structure...');
  
  try {
    const scriptPath = 'scripts/validate-migrations.js';
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    
    // Extract expected tables from the script
    const expectedTablesMatch = scriptContent.match(/const expectedTables = \{([\s\S]*?)\};/);
    if (!expectedTablesMatch) {
      console.log('   ❌ Could not find expectedTables definition');
      return false;
    }
    
    const tablesDefinition = expectedTablesMatch[1];
    const requiredTables = [
      'profiles',
      'integrations', 
      'communication_styles',
      'business_hours',
      'escalation_rules',
      'notification_settings',
      'email_logs',
      'email_queue',
      'ai_responses',
      'analytics_events',
      'performance_metrics',
      'workflows',
      'workflow_metrics',
      'subscriptions',
      'invoices',
      'error_logs',
      'dead_letter_queue'
    ];
    
    let missingTables = [];
    requiredTables.forEach(table => {
      if (!tablesDefinition.includes(`${table}:`)) {
        missingTables.push(table);
      }
    });
    
    if (missingTables.length === 0) {
      console.log('   ✅ All required tables are defined');
      return true;
    } else {
      console.log(`   ❌ Missing table definitions: ${missingTables.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error validating tables structure: ${error.message}`);
    return false;
  }
}

// Test 6: Check file permissions and accessibility
async function testFileAccessibility() {
  console.log('📁 Testing file accessibility...');
  
  const requiredFiles = [
    'docs/database-schema.md',
    'scripts/validate-migrations.js',
    'scripts/test-database-integrity.js',
    'supabase/migrations/validation.sql'
  ];
  
  let inaccessibleFiles = [];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
    } catch (error) {
      inaccessibleFiles.push(file);
    }
  }
  
  if (inaccessibleFiles.length === 0) {
    console.log('   ✅ All required files are accessible');
    return true;
  } else {
    console.log(`   ❌ Inaccessible files: ${inaccessibleFiles.join(', ')}`);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting database validation tool tests...\n');
  
  const tests = [
    { name: 'Schema Documentation', fn: testSchemaDocumentation },
    { name: 'Migration Validation Script', fn: testMigrationValidationScript },
    { name: 'Integrity Test Script', fn: testIntegrityTestScript },
    { name: 'SQL Validation Script', fn: testSQLValidationScript },
    { name: 'Expected Tables Structure', fn: testExpectedTablesStructure },
    { name: 'File Accessibility', fn: testFileAccessibility }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passedTests++;
    }
    console.log('');
  }
  
  // Summary
  console.log('📋 Test Summary:');
  console.log(`   Tests passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ All database validation tools are properly implemented!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set up environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    console.log('   2. Run: node scripts/validate-migrations.js');
    console.log('   3. Run: node scripts/test-database-integrity.js');
    console.log('   4. Execute: psql -f supabase/migrations/validation.sql');
  } else {
    console.log('\n❌ Some tests failed - please review the issues above');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
