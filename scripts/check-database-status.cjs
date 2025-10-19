#!/usr/bin/env node

/**
 * Check Current Supabase Database Status
 * Uses the backend .env configuration to connect and inspect the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function checkDatabaseStatus() {
  console.log('🔍 Checking Supabase Database Status...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase credentials in backend/.env');
    console.log('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
    return;
  }

  console.log(`📡 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using key: ${supabaseAnonKey.substring(0, 20)}...`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test connection
    console.log('\n1️⃣ Testing Connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (connectionError && connectionError.code === 'PGRST116') {
      console.log('✅ Connected successfully (profiles table exists but no data)');
    } else if (connectionError) {
      console.log(`⚠️ Connection issue: ${connectionError.message}`);
      if (connectionError.message.includes('relation "profiles" does not exist')) {
        console.log('   → This means the database schema needs to be set up');
      }
    } else {
      console.log('✅ Connected successfully');
    }

    // Check for FloWorx tables
    console.log('\n2️⃣ Checking FloWorx Tables...');
    
    const floWorxTables = [
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
      'notification_settings',
      'email_queue',
      'email_webhooks'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of floWorxTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          existingTables.push(table);
        } else if (error && error.message.includes('does not exist')) {
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

    // Check auth.users (built-in Supabase table)
    console.log('\n3️⃣ Checking Authentication System...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.getUser();
      if (authError && authError.message.includes('Invalid JWT')) {
        console.log('✅ Auth system accessible (no user logged in - expected)');
      } else if (authError) {
        console.log(`⚠️ Auth check: ${authError.message}`);
      } else {
        console.log('✅ Auth system working');
      }
    } catch (err) {
      console.log(`⚠️ Auth check failed: ${err.message}`);
    }

    // Check for data in existing tables
    if (existingTables.length > 0) {
      console.log('\n4️⃣ Checking Data in Existing Tables...');
      
      for (const table of existingTables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' });

          if (error) {
            console.log(`⚠️ ${table}: ${error.message}`);
          } else {
            console.log(`   - ${table}: ${count || 0} records`);
            if (data && data.length > 0) {
              console.log(`     Sample keys: ${Object.keys(data[0]).join(', ')}`);
            }
          }
        } catch (err) {
          console.log(`⚠️ ${table}: Error checking data`);
        }
      }
    }

    // Summary
    console.log('\n📋 DATABASE STATUS SUMMARY:');
    console.log(`   - Connection: ${connectionError ? '❌ Issues' : '✅ Success'}`);
    console.log(`   - Existing Tables: ${existingTables.length}/${floWorxTables.length}`);
    console.log(`   - Missing Tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Set up missing database tables');
      console.log('   2. Configure Row Level Security policies');
      console.log('   3. Test data operations');
      console.log('\n💡 Run: node scripts/setup-database-schema.cjs');
    } else {
      console.log('\n🎉 Database appears to be fully configured!');
      console.log('💡 You can now test authentication and data operations');
    }

  } catch (error) {
    console.error('❌ Error checking database status:', error.message);
  }
}

if (require.main === module) {
  checkDatabaseStatus();
}

module.exports = { checkDatabaseStatus };
