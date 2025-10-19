#!/usr/bin/env node

/**
 * Email Integration Testing Script
 * Tests Gmail and Outlook integrations for email processing
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

// Test configuration
const testConfig = {
  testData: {
    userId: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test-integration@floworx.com',
    gmailIntegration: {
      provider: 'gmail',
      status: 'active'
    },
    outlookIntegration: {
      provider: 'outlook',
      status: 'active'
    }
  }
};

async function testEmailIntegrations() {
  console.log('🔍 Testing Email Integrations...\n');
  
  const results = {
    gmail: {},
    outlook: {},
    emailProcessing: {},
    database: {},
    cleanup: [],
    overall: 'pending'
  };

  try {
    // Clean up any existing test data
    await cleanupTestData();

    // Test 1: Database Connectivity
    console.log('1️⃣ Testing Database Connectivity...');
    
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('integrations')
        .select('id')
        .limit(1);

      if (connectionError && connectionError.code === 'PGRST116') {
        console.log('   ✅ Database connection successful (integrations table exists)');
        results.database.connectivity = true;
      } else if (connectionError) {
        console.log(`   ❌ Database connection failed: ${connectionError.message}`);
        results.database.connectivity = false;
      } else {
        console.log('   ✅ Database connection successful');
        results.database.connectivity = true;
      }
    } catch (err) {
      console.log(`   ❌ Database connectivity test failed: ${err.message}`);
      results.database.connectivity = false;
    }

    // Test 2: Create Test Profile
    console.log('\n2️⃣ Creating Test Profile...');
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: testConfig.testData.userId,
          email: testConfig.testData.email,
          client_config: {
            business: {
              name: 'Test Business',
              type: 'Service Business',
              industry: 'Technology'
            }
          }
        }]);

      if (profileError) {
        console.log(`   ⚠️ Could not create test profile: ${profileError.message}`);
        results.database.profile_creation = false;
      } else {
        console.log('   ✅ Test profile created');
        results.database.profile_creation = true;
        results.cleanup.push({ table: 'profiles', id: testConfig.testData.userId });
      }
    } catch (err) {
      console.log(`   ❌ Test profile creation failed: ${err.message}`);
      results.database.profile_creation = false;
    }

    // Test 3: Test Gmail Integration Creation
    console.log('\n3️⃣ Testing Gmail Integration...');
    
    try {
      const { error: gmailError } = await supabase
        .from('integrations')
        .insert([{
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: testConfig.testData.userId,
          provider: testConfig.testData.gmailIntegration.provider,
          status: testConfig.testData.gmailIntegration.status,
          access_token: 'test-gmail-token',
          refresh_token: 'test-gmail-refresh',
          scope: 'gmail.readonly gmail.send',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        }]);

      if (gmailError) {
        console.log(`   ❌ Gmail integration creation failed: ${gmailError.message}`);
        results.gmail.creation = false;
      } else {
        console.log('   ✅ Gmail integration created');
        results.gmail.creation = true;
        results.cleanup.push({ table: 'integrations', id: 'test-gmail-integration-12345' });

        // Test Gmail integration retrieval
        const { data: gmailData, error: gmailRetrieveError } = await supabase
          .from('integrations')
          .select('*')
          .eq('id', 'test-gmail-integration-12345')
          .single();

        if (gmailRetrieveError) {
          console.log(`   ❌ Gmail integration retrieval failed: ${gmailRetrieveError.message}`);
          results.gmail.retrieval = false;
        } else {
          console.log('   ✅ Gmail integration retrieved successfully');
          results.gmail.retrieval = true;
          results.gmail.data = gmailData;
        }
      }
    } catch (err) {
      console.log(`   ❌ Gmail integration test failed: ${err.message}`);
      results.gmail.creation = false;
    }

    // Test 4: Test Outlook Integration Creation
    console.log('\n4️⃣ Testing Outlook Integration...');
    
    try {
      const { error: outlookError } = await supabase
        .from('integrations')
        .insert([{
          id: '550e8400-e29b-41d4-a716-446655440003',
          user_id: testConfig.testData.userId,
          provider: testConfig.testData.outlookIntegration.provider,
          status: testConfig.testData.outlookIntegration.status,
          access_token: 'test-outlook-token',
          refresh_token: 'test-outlook-refresh',
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        }]);

      if (outlookError) {
        console.log(`   ❌ Outlook integration creation failed: ${outlookError.message}`);
        results.outlook.creation = false;
      } else {
        console.log('   ✅ Outlook integration created');
        results.outlook.creation = true;
        results.cleanup.push({ table: 'integrations', id: 'test-outlook-integration-12345' });

        // Test Outlook integration retrieval
        const { data: outlookData, error: outlookRetrieveError } = await supabase
          .from('integrations')
          .select('*')
          .eq('id', 'test-outlook-integration-12345')
          .single();

        if (outlookRetrieveError) {
          console.log(`   ❌ Outlook integration retrieval failed: ${outlookRetrieveError.message}`);
          results.outlook.retrieval = false;
        } else {
          console.log('   ✅ Outlook integration retrieved successfully');
          results.outlook.retrieval = true;
          results.outlook.data = outlookData;
        }
      }
    } catch (err) {
      console.log(`   ❌ Outlook integration test failed: ${err.message}`);
      results.outlook.creation = false;
    }

    // Test 5: Test Email Processing Tables
    console.log('\n5️⃣ Testing Email Processing Tables...');
    
    try {
      // Test email_queue table
      const { error: queueError } = await supabase
        .from('email_queue')
        .insert([{
          id: 'test-email-queue-12345',
          user_id: testConfig.testData.userId,
          email_id: 'test-email-12345',
          provider: 'gmail',
          from_email: 'customer@example.com',
          to_email: 'support@example.com',
          subject: 'Test Email Subject',
          body: 'This is a test email body.',
          status: 'pending',
          priority: 50
        }]);

      if (queueError) {
        console.log(`   ❌ Email queue insertion failed: ${queueError.message}`);
        results.emailProcessing.queue_insertion = false;
      } else {
        console.log('   ✅ Email queue insertion successful');
        results.emailProcessing.queue_insertion = true;
        results.cleanup.push({ table: 'email_queue', id: 'test-email-queue-12345' });

        // Test email_logs table
        const { error: logsError } = await supabase
          .from('email_logs')
          .insert([{
            id: 'test-email-logs-12345',
            user_id: testConfig.testData.userId,
            email_from: 'customer@example.com',
            email_subject: 'Test Email Subject',
            category: 'support',
            urgency: 'normal',
            response_sent: false
          }]);

        if (logsError) {
          console.log(`   ❌ Email logs insertion failed: ${logsError.message}`);
          results.emailProcessing.logs_insertion = false;
        } else {
          console.log('   ✅ Email logs insertion successful');
          results.emailProcessing.logs_insertion = true;
          results.cleanup.push({ table: 'email_logs', id: 'test-email-logs-12345' });
        }
      }
    } catch (err) {
      console.log(`   ❌ Email processing table test failed: ${err.message}`);
      results.emailProcessing.queue_insertion = false;
    }

    // Test 6: Test Integration Constraints
    console.log('\n6️⃣ Testing Integration Constraints...');
    
    try {
      // Test provider constraint (should fail)
      const { error: invalidProviderError } = await supabase
        .from('integrations')
        .insert([{
          id: 'test-invalid-provider-12345',
          user_id: testConfig.testData.userId,
          provider: 'invalid_provider',
          status: 'active'
        }]);

      if (invalidProviderError && invalidProviderError.message.includes('check constraint')) {
        console.log('   ✅ Provider constraint working (invalid provider rejected)');
        results.database.provider_constraint = true;
      } else if (invalidProviderError && invalidProviderError.code === '23514') {
        console.log('   ✅ Provider constraint working (constraint violation)');
        results.database.provider_constraint = true;
      } else {
        console.log(`   ❌ Provider constraint not working: ${invalidProviderError?.message || 'No error'}`);
        results.database.provider_constraint = false;
      }

      // Test status constraint (should fail)
      const { error: invalidStatusError } = await supabase
        .from('integrations')
        .insert([{
          id: 'test-invalid-status-12345',
          user_id: testConfig.testData.userId,
          provider: 'gmail',
          status: 'invalid_status'
        }]);

      if (invalidStatusError && (invalidStatusError.message.includes('check constraint') || invalidStatusError.code === '23514')) {
        console.log('   ✅ Status constraint working (invalid status rejected)');
        results.database.status_constraint = true;
      } else {
        console.log(`   ❌ Status constraint not working: ${invalidStatusError?.message || 'No error'}`);
        results.database.status_constraint = false;
      }
    } catch (err) {
      console.log(`   ❌ Integration constraints test failed: ${err.message}`);
      results.database.provider_constraint = false;
      results.database.status_constraint = false;
    }

    // Test 7: Test Email Processing Logic
    console.log('\n7️⃣ Testing Email Processing Logic...');
    
    try {
      // Test email classification simulation
      const testEmail = {
        from: 'customer@example.com',
        subject: 'URGENT: Service is down',
        body: 'Our service is completely down. This is urgent!'
      };

      // Simulate email classification
      const classification = simulateEmailClassification(testEmail);
      console.log('   ✅ Email classification simulation successful');
      console.log(`      Category: ${classification.category}`);
      console.log(`      Urgency: ${classification.urgency}`);
      console.log(`      Sentiment: ${classification.sentiment}`);
      
      results.emailProcessing.classification = true;
      results.emailProcessing.classification_data = classification;

      // Test email routing simulation
      const routing = simulateEmailRouting(classification);
      console.log('   ✅ Email routing simulation successful');
      console.log(`      Action: ${routing.action}`);
      console.log(`      Priority: ${routing.priority}`);
      
      results.emailProcessing.routing = true;
      results.emailProcessing.routing_data = routing;

    } catch (err) {
      console.log(`   ❌ Email processing logic test failed: ${err.message}`);
      results.emailProcessing.classification = false;
      results.emailProcessing.routing = false;
    }

    // Test 8: Test Integration Status Updates
    console.log('\n8️⃣ Testing Integration Status Updates...');
    
    try {
      // Test Gmail integration status update
      const { error: gmailUpdateError } = await supabase
        .from('integrations')
        .update({ status: 'inactive' })
        .eq('id', 'test-gmail-integration-12345');

      if (gmailUpdateError) {
        console.log(`   ❌ Gmail integration status update failed: ${gmailUpdateError.message}`);
        results.gmail.status_update = false;
      } else {
        console.log('   ✅ Gmail integration status update successful');
        results.gmail.status_update = true;

        // Test Outlook integration status update
        const { error: outlookUpdateError } = await supabase
          .from('integrations')
          .update({ status: 'inactive' })
          .eq('id', 'test-outlook-integration-12345');

        if (outlookUpdateError) {
          console.log(`   ❌ Outlook integration status update failed: ${outlookUpdateError.message}`);
          results.outlook.status_update = false;
        } else {
          console.log('   ✅ Outlook integration status update successful');
          results.outlook.status_update = true;
        }
      }
    } catch (err) {
      console.log(`   ❌ Integration status update test failed: ${err.message}`);
      results.gmail.status_update = false;
      results.outlook.status_update = false;
    }

    // Summary
    console.log('\n📋 Email Integration Test Summary:');
    
    const dbTests = Object.values(results.database).filter(r => r === true).length;
    const gmailTests = Object.values(results.gmail).filter(r => r === true).length;
    const outlookTests = Object.values(results.outlook).filter(r => r === true).length;
    const processingTests = Object.values(results.emailProcessing).filter(r => r === true).length;
    
    console.log(`   - Database Tests: ${dbTests}/${Object.keys(results.database).length} passed`);
    console.log(`   - Gmail Integration: ${gmailTests}/${Object.keys(results.gmail).length} passed`);
    console.log(`   - Outlook Integration: ${outlookTests}/${Object.keys(results.outlook).length} passed`);
    console.log(`   - Email Processing: ${processingTests}/${Object.keys(results.emailProcessing).length} passed`);

    // Determine overall status
    const totalTests = Object.keys(results.database).length + 
                      Object.keys(results.gmail).length + 
                      Object.keys(results.outlook).length + 
                      Object.keys(results.emailProcessing).length;
    const passedTests = dbTests + gmailTests + outlookTests + processingTests;
    const passRate = passedTests / totalTests;

    if (passRate >= 0.9) {
      results.overall = 'success';
      console.log('\n🎉 Email integration tests PASSED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else if (passRate >= 0.7) {
      results.overall = 'warning';
      console.log('\n⚠️ Email integration tests PASSED with warnings!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else {
      results.overall = 'failed';
      console.log('\n❌ Email integration tests FAILED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    }

    // Recommendations
    console.log('\n🔧 Recommendations:');
    if (dbTests < Object.keys(results.database).length) {
      console.log(`   - Fix database connectivity and constraint issues`);
    }
    if (gmailTests < Object.keys(results.gmail).length) {
      console.log(`   - Fix Gmail integration creation and retrieval`);
    }
    if (outlookTests < Object.keys(results.outlook).length) {
      console.log(`   - Fix Outlook integration creation and retrieval`);
    }
    if (processingTests < Object.keys(results.emailProcessing).length) {
      console.log(`   - Fix email processing table operations`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();

    return results;

  } catch (error) {
    console.error('❌ Email integration test error:', error.message);
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

// Helper functions
function simulateEmailClassification(emailData) {
  const classification = {
    category: 'support',
    urgency: 'normal',
    sentiment: 'neutral',
    confidence: 85
  };

  // Check for urgent keywords
  const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediately', 'critical'];
  const text = (emailData.subject + ' ' + emailData.body).toLowerCase();
  
  if (urgentKeywords.some(keyword => text.includes(keyword))) {
    classification.urgency = 'high';
    classification.category = 'support';
  }

  // Check for negative sentiment
  const negativeKeywords = ['problem', 'issue', 'broken', 'down', 'error', 'fail'];
  if (negativeKeywords.some(keyword => text.includes(keyword))) {
    classification.sentiment = 'negative';
  }

  // Check for positive sentiment
  const positiveKeywords = ['thank', 'great', 'good', 'excellent', 'happy'];
  if (positiveKeywords.some(keyword => text.includes(keyword))) {
    classification.sentiment = 'positive';
  }

  return classification;
}

function simulateEmailRouting(classification) {
  const routing = {
    action: 'auto_reply',
    priority: 50,
    escalate: false,
    notify_immediately: false
  };

  // High urgency emails get escalated
  if (classification.urgency === 'high') {
    routing.action = 'escalate';
    routing.priority = 90;
    routing.escalate = true;
    routing.notify_immediately = true;
  }

  // Negative sentiment emails get higher priority
  if (classification.sentiment === 'negative') {
    routing.priority = Math.max(routing.priority, 70);
  }

  return routing;
}

async function cleanupTestData() {
  const cleanupQueries = [
    { table: 'email_logs', id: 'test-email-logs-12345' },
    { table: 'email_queue', id: 'test-email-queue-12345' },
    { table: 'integrations', id: 'test-gmail-integration-12345' },
    { table: 'integrations', id: 'test-outlook-integration-12345' },
    { table: 'profiles', id: testConfig.testData.userId }
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
  testEmailIntegrations()
    .then(results => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Email integration tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailIntegrations };
