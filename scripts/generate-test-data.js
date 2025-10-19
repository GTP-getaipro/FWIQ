#!/usr/bin/env node

/**
 * Test Data Generator for Manual Testing
 * This script creates sample data for testing the new migration and analytics features
 * Run this after the database schema is ready
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample test data
const testData = {
  migrationLogs: [
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      migration_type: 'gmail_to_outlook',
      from_provider: 'gmail',
      to_provider: 'outlook',
      status: 'completed',
      steps: {
        step1: 'Backup Gmail data',
        step2: 'Configure Outlook integration',
        step3: 'Transfer email data',
        step4: 'Verify migration'
      },
      duration: 45000,
      timestamp: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      migration_type: 'outlook_to_gmail',
      from_provider: 'outlook',
      to_provider: 'gmail',
      status: 'in_progress',
      steps: {
        step1: 'Backup Outlook data',
        step2: 'Configure Gmail integration'
      },
      duration: 12000,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  analyticsEvents: [
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      provider: 'outlook',
      event_type: 'api_call',
      data: {
        endpoint: '/me/messages',
        method: 'GET',
        status: 200,
        duration: 150,
        response_size: 1024
      },
      timestamp: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      provider: 'outlook',
      event_type: 'calendar_operation',
      data: {
        operation: 'create_event',
        success: true,
        duration: 200,
        event_type: 'meeting'
      },
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      provider: 'outlook',
      event_type: 'error',
      data: {
        error_type: 'rate_limit',
        error_message: 'Too many requests',
        endpoint: '/me/calendar/events',
        retry_count: 2
      },
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  businessEvents: [
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      event: 'appointment_created',
      data: {
        client_name: 'John Doe',
        appointment_time: new Date(Date.now() + 86400000).toISOString(),
        duration: 60,
        location: 'Office Meeting Room'
      },
      timestamp: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      event: 'email_automation_triggered',
      data: {
        trigger_type: 'new_email',
        email_count: 5,
        automation_rules: ['urgent', 'client_followup']
      },
      timestamp: new Date(Date.now() - 900000).toISOString()
    }
  ],
  alerts: [
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      provider: 'outlook',
      alert_type: 'api_rate_limit',
      severity: 'medium',
      message: 'Approaching Microsoft Graph API rate limit',
      details: {
        current_usage: 8500,
        limit: 10000,
        reset_time: new Date(Date.now() + 3600000).toISOString()
      },
      status: 'active',
      timestamp: new Date().toISOString()
    },
    {
      user_id: '00000000-0000-0000-0000-000000000000',
      provider: 'outlook',
      alert_type: 'sync_error',
      severity: 'high',
      message: 'Calendar sync failed for 3 consecutive attempts',
      details: {
        error_count: 3,
        last_error: 'Authentication token expired',
        retry_attempts: 2
      },
      status: 'resolved',
      resolved_at: new Date(Date.now() - 1800000).toISOString(),
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ]
};

async function insertTestData() {
  console.log('🧪 Starting Test Data Generation...');
  console.log('=====================================');

  try {
    // Insert migration logs
    console.log('📝 Inserting migration logs...');
    const { data: migrationData, error: migrationError } = await supabase
      .from('migration_logs')
      .insert(testData.migrationLogs)
      .select();

    if (migrationError) {
      console.error('❌ Error inserting migration logs:', migrationError);
    } else {
      console.log(`✅ Inserted ${migrationData.length} migration logs`);
    }

    // Insert analytics events
    console.log('📊 Inserting analytics events...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('outlook_analytics_events')
      .insert(testData.analyticsEvents)
      .select();

    if (analyticsError) {
      console.error('❌ Error inserting analytics events:', analyticsError);
    } else {
      console.log(`✅ Inserted ${analyticsData.length} analytics events`);
    }

    // Insert business events
    console.log('💼 Inserting business events...');
    const { data: businessData, error: businessError } = await supabase
      .from('outlook_business_events')
      .insert(testData.businessEvents)
      .select();

    if (businessError) {
      console.error('❌ Error inserting business events:', businessError);
    } else {
      console.log(`✅ Inserted ${businessData.length} business events`);
    }

    // Insert alerts
    console.log('🚨 Inserting alerts...');
    const { data: alertsData, error: alertsError } = await supabase
      .from('outlook_alerts')
      .insert(testData.alerts)
      .select();

    if (alertsError) {
      console.error('❌ Error inserting alerts:', alertsError);
    } else {
      console.log(`✅ Inserted ${alertsData.length} alerts`);
    }

    console.log('\n🎉 Test data generation completed successfully!');
    console.log('=====================================');
    console.log('📊 Summary:');
    console.log(`   • Migration logs: ${migrationData?.length || 0}`);
    console.log(`   • Analytics events: ${analyticsData?.length || 0}`);
    console.log(`   • Business events: ${businessData?.length || 0}`);
    console.log(`   • Alerts: ${alertsData?.length || 0}`);
    console.log('\n🚀 You can now test the features at http://localhost:5173/testing');

  } catch (error) {
    console.error('💥 Test data generation failed:', error);
    process.exit(1);
  }
}

// Run the script
insertTestData();
