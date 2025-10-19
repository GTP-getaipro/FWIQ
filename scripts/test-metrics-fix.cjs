#!/usr/bin/env node

/**
 * Test Metrics Fix
 * Verifies that the timezone fix works correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function testMetricsFix() {
  console.log('🧪 Testing Metrics Timezone Fix...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test the date filter that was causing issues
    const now = new Date();
    const dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    console.log('📅 Testing date filter:');
    console.log(`   Raw date: ${dateFilter}`);
    console.log(`   ISO string: ${dateFilter.toISOString()}`);

    // Test email_logs query (this was failing)
    console.log('\n1️⃣ Testing email_logs query...');
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_logs')
      .select('category, urgency, response_sent, created_at')
      .gte('created_at', dateFilter.toISOString())
      .limit(5);

    if (emailError) {
      console.log(`❌ Email logs query failed: ${emailError.message}`);
    } else {
      console.log(`✅ Email logs query successful (${emailLogs?.length || 0} records)`);
    }

    // Test performance_metrics query (this was also failing)
    console.log('\n2️⃣ Testing performance_metrics query...');
    const { data: perfMetrics, error: perfError } = await supabase
      .from('performance_metrics')
      .select('category, response_time_seconds, created_at')
      .gte('created_at', dateFilter.toISOString())
      .limit(5);

    if (perfError) {
      console.log(`❌ Performance metrics query failed: ${perfError.message}`);
    } else {
      console.log(`✅ Performance metrics query successful (${perfMetrics?.length || 0} records)`);
    }

    console.log('\n📋 TEST SUMMARY:');
    if (!emailError && !perfError) {
      console.log('✅ Timezone fix working correctly!');
      console.log('✅ Dashboard metrics should now load without errors');
    } else {
      console.log('❌ Some queries still failing');
      if (emailError) console.log(`   - Email logs: ${emailError.message}`);
      if (perfError) console.log(`   - Performance metrics: ${perfError.message}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

if (require.main === module) {
  testMetricsFix();
}

module.exports = { testMetricsFix };
