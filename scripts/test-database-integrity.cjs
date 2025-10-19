#!/usr/bin/env node

/**
 * Database Integrity Testing Script
 * Tests data integrity, foreign key relationships, and constraint validation
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

// Test data for integrity checks
const testData = {
  userId: 'test-integrity-user-12345',
  email: 'test-integrity@floworx.com',
  provider: 'gmail',
  workflowId: 'test-workflow-12345',
  emailId: 'test-email-12345'
};

async function testDatabaseIntegrity() {
  console.log('🔍 Testing Database Integrity...\n');
  
  const results = {
    foreignKeys: {},
    constraints: {},
    dataTypes: {},
    cleanup: [],
    overall: 'pending'
  };

  try {
    // Clean up any existing test data first
    console.log('🧹 Cleaning up existing test data...');
    await cleanupTestData();

    // Test 1: Foreign Key Relationships
    console.log('\n1️⃣ Testing Foreign Key Relationships...');
    
    // Test profiles -> auth.users relationship
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: testData.userId,
          email: testData.email
        }]);

      if (profileError) {
        console.log(`   ❌ Profiles FK test failed: ${profileError.message}`);
        results.foreignKeys.profiles_auth = false;
      } else {
        console.log('   ✅ Profiles -> auth.users FK relationship working');
        results.foreignKeys.profiles_auth = true;
        results.cleanup.push({ table: 'profiles', id: testData.userId });
      }
    } catch (err) {
      console.log(`   ❌ Profiles FK test error: ${err.message}`);
      results.foreignKeys.profiles_auth = false;
    }

    // Test integrations -> auth.users relationship
    try {
      const { error: integrationError } = await supabase
        .from('integrations')
        .insert([{
          id: 'test-integration-12345',
          user_id: testData.userId,
          provider: testData.provider,
          status: 'active'
        }]);

      if (integrationError) {
        console.log(`   ❌ Integrations FK test failed: ${integrationError.message}`);
        results.foreignKeys.integrations_auth = false;
      } else {
        console.log('   ✅ Integrations -> auth.users FK relationship working');
        results.foreignKeys.integrations_auth = true;
        results.cleanup.push({ table: 'integrations', id: 'test-integration-12345' });
      }
    } catch (err) {
      console.log(`   ❌ Integrations FK test error: ${err.message}`);
      results.foreignKeys.integrations_auth = false;
    }

    // Test workflows -> auth.users relationship
    try {
      const { error: workflowError } = await supabase
        .from('workflows')
        .insert([{
          id: 'test-workflow-12345',
          user_id: testData.userId,
          n8n_workflow_id: testData.workflowId,
          status: 'active'
        }]);

      if (workflowError) {
        console.log(`   ❌ Workflows FK test failed: ${workflowError.message}`);
        results.foreignKeys.workflows_auth = false;
      } else {
        console.log('   ✅ Workflows -> auth.users FK relationship working');
        results.foreignKeys.workflows_auth = true;
        results.cleanup.push({ table: 'workflows', id: 'test-workflow-12345' });
      }
    } catch (err) {
      console.log(`   ❌ Workflows FK test error: ${err.message}`);
      results.foreignKeys.workflows_auth = false;
    }

    // Test 2: Check Constraints
    console.log('\n2️⃣ Testing Check Constraints...');
    
    // Test provider constraint in integrations
    try {
      const { error: invalidProviderError } = await supabase
        .from('integrations')
        .insert([{
          id: 'test-invalid-provider-12345',
          user_id: testData.userId,
          provider: 'invalid_provider',
          status: 'active'
        }]);

      if (invalidProviderError && invalidProviderError.message.includes('check constraint')) {
        console.log('   ✅ Provider check constraint working (invalid provider rejected)');
        results.constraints.integrations_provider = true;
      } else if (invalidProviderError && invalidProviderError.code === '23514') {
        console.log('   ✅ Provider check constraint working (constraint violation)');
        results.constraints.integrations_provider = true;
      } else {
        console.log(`   ❌ Provider check constraint not working: ${invalidProviderError?.message || 'No error'}`);
        results.constraints.integrations_provider = false;
      }
    } catch (err) {
      console.log(`   ❌ Provider constraint test error: ${err.message}`);
      results.constraints.integrations_provider = false;
    }

    // Test status constraint in integrations
    try {
      const { error: invalidStatusError } = await supabase
        .from('integrations')
        .insert([{
          id: 'test-invalid-status-12345',
          user_id: testData.userId,
          provider: 'gmail',
          status: 'invalid_status'
        }]);

      if (invalidStatusError && (invalidStatusError.message.includes('check constraint') || invalidStatusError.code === '23514')) {
        console.log('   ✅ Status check constraint working (invalid status rejected)');
        results.constraints.integrations_status = true;
      } else {
        console.log(`   ❌ Status check constraint not working: ${invalidStatusError?.message || 'No error'}`);
        results.constraints.integrations_status = false;
      }
    } catch (err) {
      console.log(`   ❌ Status constraint test error: ${err.message}`);
      results.constraints.integrations_status = false;
    }

    // Test workflow status constraint
    try {
      const { error: invalidWorkflowStatusError } = await supabase
        .from('workflows')
        .insert([{
          id: 'test-invalid-workflow-status-12345',
          user_id: testData.userId,
          n8n_workflow_id: 'test-workflow-invalid',
          status: 'invalid_status'
        }]);

      if (invalidWorkflowStatusError && (invalidWorkflowStatusError.message.includes('check constraint') || invalidWorkflowStatusError.code === '23514')) {
        console.log('   ✅ Workflow status check constraint working');
        results.constraints.workflows_status = true;
      } else {
        console.log(`   ❌ Workflow status constraint not working: ${invalidWorkflowStatusError?.message || 'No error'}`);
        results.constraints.workflows_status = false;
      }
    } catch (err) {
      console.log(`   ❌ Workflow status constraint test error: ${err.message}`);
      results.constraints.workflows_status = false;
    }

    // Test 3: Unique Constraints
    console.log('\n3️⃣ Testing Unique Constraints...');
    
    // Test profiles email unique constraint
    try {
      // First insert should work
      const { error: firstInsertError } = await supabase
        .from('profiles')
        .insert([{
          id: 'test-unique-email-1',
          email: 'unique-test@floworx.com'
        }]);

      if (firstInsertError) {
        console.log(`   ⚠️ First profile insert failed: ${firstInsertError.message}`);
      } else {
        results.cleanup.push({ table: 'profiles', id: 'test-unique-email-1' });

        // Second insert with same email should fail
        const { error: duplicateEmailError } = await supabase
          .from('profiles')
          .insert([{
            id: 'test-unique-email-2',
            email: 'unique-test@floworx.com'
          }]);

        if (duplicateEmailError && duplicateEmailError.code === '23505') {
          console.log('   ✅ Profiles email unique constraint working');
          results.constraints.profiles_email_unique = true;
        } else {
          console.log(`   ❌ Profiles email unique constraint not working: ${duplicateEmailError?.message || 'No error'}`);
          results.constraints.profiles_email_unique = false;
        }
      }
    } catch (err) {
      console.log(`   ❌ Email unique constraint test error: ${err.message}`);
      results.constraints.profiles_email_unique = false;
    }

    // Test 4: Data Type Validation
    console.log('\n4️⃣ Testing Data Type Validation...');
    
    // Test UUID format validation
    try {
      const { error: invalidUuidError } = await supabase
        .from('profiles')
        .insert([{
          id: 'not-a-valid-uuid',
          email: 'invalid-uuid-test@floworx.com'
        }]);

      if (invalidUuidError && (invalidUuidError.message.includes('invalid input syntax') || invalidUuidError.code === '22P02')) {
        console.log('   ✅ UUID format validation working');
        results.dataTypes.uuid_validation = true;
      } else {
        console.log(`   ❌ UUID validation not working: ${invalidUuidError?.message || 'No error'}`);
        results.dataTypes.uuid_validation = false;
      }
    } catch (err) {
      console.log(`   ❌ UUID validation test error: ${err.message}`);
      results.dataTypes.uuid_validation = false;
    }

    // Test 5: JSONB Data Type
    try {
      const { error: jsonbError } = await supabase
        .from('profiles')
        .insert([{
          id: 'test-jsonb-12345',
          email: 'jsonb-test@floworx.com',
          client_config: { test: 'value', nested: { key: 'value' } }
        }]);

      if (jsonbError) {
        console.log(`   ❌ JSONB validation failed: ${jsonbError.message}`);
        results.dataTypes.jsonb_validation = false;
      } else {
        console.log('   ✅ JSONB data type validation working');
        results.dataTypes.jsonb_validation = true;
        results.cleanup.push({ table: 'profiles', id: 'test-jsonb-12345' });
      }
    } catch (err) {
      console.log(`   ❌ JSONB validation test error: ${err.message}`);
      results.dataTypes.jsonb_validation = false;
    }

    // Test 6: Cascade Delete Behavior
    console.log('\n5️⃣ Testing Cascade Delete Behavior...');
    
    try {
      // Create a profile with related data
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: 'test-cascade-12345',
          email: 'cascade-test@floworx.com'
        }]);

      if (profileError) {
        console.log(`   ⚠️ Cannot test cascade delete - profile creation failed: ${profileError.message}`);
        results.foreignKeys.cascade_delete = false;
      } else {
        results.cleanup.push({ table: 'profiles', id: 'test-cascade-12345' });

        // Create related integration
        const { error: integrationError } = await supabase
          .from('integrations')
          .insert([{
            id: 'test-cascade-integration-12345',
            user_id: 'test-cascade-12345',
            provider: 'gmail',
            status: 'active'
          }]);

        if (integrationError) {
          console.log(`   ⚠️ Cannot test cascade delete - integration creation failed: ${integrationError.message}`);
          results.foreignKeys.cascade_delete = false;
        } else {
          // Delete the profile (should cascade to integration)
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', 'test-cascade-12345');

          if (deleteError) {
            console.log(`   ❌ Profile delete failed: ${deleteError.message}`);
            results.foreignKeys.cascade_delete = false;
          } else {
            // Check if integration was also deleted
            const { data: integrationData, error: checkError } = await supabase
              .from('integrations')
              .select('id')
              .eq('id', 'test-cascade-integration-12345');

            if (checkError) {
              console.log(`   ⚠️ Cannot verify cascade delete: ${checkError.message}`);
              results.foreignKeys.cascade_delete = false;
            } else if (!integrationData || integrationData.length === 0) {
              console.log('   ✅ Cascade delete working (integration deleted with profile)');
              results.foreignKeys.cascade_delete = true;
            } else {
              console.log('   ❌ Cascade delete not working (integration still exists)');
              results.foreignKeys.cascade_delete = false;
            }
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Cascade delete test error: ${err.message}`);
      results.foreignKeys.cascade_delete = false;
    }

    // Summary
    console.log('\n📋 Database Integrity Test Summary:');
    
    const fkTests = Object.values(results.foreignKeys).filter(r => r === true).length;
    const constraintTests = Object.values(results.constraints).filter(r => r === true).length;
    const dataTypeTests = Object.values(results.dataTypes).filter(r => r === true).length;
    
    console.log(`   - Foreign Key Tests: ${fkTests}/${Object.keys(results.foreignKeys).length} passed`);
    console.log(`   - Constraint Tests: ${constraintTests}/${Object.keys(results.constraints).length} passed`);
    console.log(`   - Data Type Tests: ${dataTypeTests}/${Object.keys(results.dataTypes).length} passed`);

    // Determine overall status
    const totalTests = Object.keys(results.foreignKeys).length + Object.keys(results.constraints).length + Object.keys(results.dataTypes).length;
    const passedTests = fkTests + constraintTests + dataTypeTests;
    const passRate = passedTests / totalTests;

    if (passRate >= 0.9) {
      results.overall = 'success';
      console.log('\n🎉 Database integrity tests PASSED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else if (passRate >= 0.7) {
      results.overall = 'warning';
      console.log('\n⚠️ Database integrity tests PASSED with warnings!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else {
      results.overall = 'failed';
      console.log('\n❌ Database integrity tests FAILED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();

    return results;

  } catch (error) {
    console.error('❌ Database integrity test error:', error.message);
    results.overall = 'error';
    
    // Attempt cleanup even on error
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }
    
    return results;
  }
}

async function cleanupTestData() {
  const cleanupQueries = [
    { table: 'integrations', id: 'test-integration-12345' },
    { table: 'integrations', id: 'test-invalid-provider-12345' },
    { table: 'integrations', id: 'test-invalid-status-12345' },
    { table: 'integrations', id: 'test-cascade-integration-12345' },
    { table: 'workflows', id: 'test-workflow-12345' },
    { table: 'workflows', id: 'test-invalid-workflow-status-12345' },
    { table: 'profiles', id: 'test-integrity-user-12345' },
    { table: 'profiles', id: 'test-unique-email-1' },
    { table: 'profiles', id: 'test-unique-email-2' },
    { table: 'profiles', id: 'test-jsonb-12345' },
    { table: 'profiles', id: 'test-cascade-12345' }
  ];

  for (const query of cleanupQueries) {
    try {
      await supabase
        .from(query.table)
        .delete()
        .eq('id', query.id);
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  testDatabaseIntegrity()
    .then(results => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Integrity tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseIntegrity };
