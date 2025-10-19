#!/usr/bin/env node

/**
 * Check Supabase Database Status
 * Inspects current tables, schemas, and data in the Supabase project
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSupabaseStatus() {
  console.log('🔍 Checking Supabase Database Status...\n');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return;
  }

  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using key: ${supabaseKey.substring(0, 20)}...`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check connection
    console.log('\n1️⃣ Testing Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);

    if (connectionError && connectionError.code === 'PGRST116') {
      console.log('✅ Connected successfully (no _test_connection table - expected)');
    } else if (connectionError) {
      console.log(`⚠️ Connection issue: ${connectionError.message}`);
    } else {
      console.log('✅ Connected successfully');
    }

    // Check for existing tables by trying to query common FloWorx tables
    console.log('\n2️⃣ Checking Existing Tables...');
    
    const tablesToCheck = [
      'profiles',
      'integrations', 
      'oauth_credentials',
      'workflows',
      'email_logs',
      'ai_responses',
      'communication_styles',
      'email_analysis',
      'business_hours',
      'escalation_rules',
      'response_templates',
      'notification_settings'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          missingTables.push(table);
        } else if (error) {
          console.log(`⚠️ Table ${table}: ${error.message}`);
        } else {
          existingTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }

    console.log(`\n✅ Existing Tables (${existingTables.length}):`);
    existingTables.forEach(table => console.log(`   - ${table}`));

    console.log(`\n❌ Missing Tables (${missingTables.length}):`);
    missingTables.forEach(table => console.log(`   - ${table}`));

    // Check auth.users table (built-in Supabase table)
    console.log('\n3️⃣ Checking Authentication...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.log(`⚠️ Auth check: ${authError.message}`);
      } else {
        console.log('✅ Authentication system accessible');
      }
    } catch (err) {
      console.log(`⚠️ Auth check failed: ${err.message}`);
    }

    // Check if profiles table has data
    if (existingTables.includes('profiles')) {
      console.log('\n4️⃣ Checking Profiles Data...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.log(`⚠️ Profiles query: ${profilesError.message}`);
      } else {
        console.log(`📊 Found ${profiles?.length || 0} profile records`);
        if (profiles && profiles.length > 0) {
          console.log('   Sample profile structure:');
          console.log(`   - Keys: ${Object.keys(profiles[0]).join(', ')}`);
        }
      }
    }

    // Check integrations table
    if (existingTables.includes('integrations')) {
      console.log('\n5️⃣ Checking Integrations Data...');
      const { data: integrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*');

      if (integrationsError) {
        console.log(`⚠️ Integrations query: ${integrationsError.message}`);
      } else {
        console.log(`📊 Found ${integrations?.length || 0} integration records`);
      }
    }

    console.log('\n📋 SUMMARY:');
    console.log(`   - Connection: ${connectionError ? '❌ Failed' : '✅ Success'}`);
    console.log(`   - Existing Tables: ${existingTables.length}`);
    console.log(`   - Missing Tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Run database schema setup');
      console.log('   2. Create missing tables');
      console.log('   3. Set up Row Level Security policies');
    } else {
      console.log('\n🎉 Database appears to be fully configured!');
    }

  } catch (error) {
    console.error('❌ Error checking Supabase status:', error.message);
  }
}

// Run the check
if (require.main === module) {
  checkSupabaseStatus();
}

module.exports = { checkSupabaseStatus };
