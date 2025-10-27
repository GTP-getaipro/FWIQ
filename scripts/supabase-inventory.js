#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oinxzvqszingwstrbdro.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required in .env.production');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 SUPABASE INVENTORY - LIVE SCAN');
console.log('='.repeat(50));
console.log(`📍 Database: ${SUPABASE_URL}`);
console.log(`⏰ Time: ${new Date().toISOString()}`);
console.log('='.repeat(50));

async function runInventory() {
  try {
    // Method 1: Check expected tables from your code
    console.log('\n🎯 METHOD 1: Checking Expected Tables');
    const expectedTables = [
      'users', 'profiles', 'business_profiles', 'communication_styles',
      'email_integrations', 'outlook_analytics_events', 'voice_learning_drafts',
      'user_audit_logs', 'security_audit_logs', 'subscriptions', 'business_type_templates',
      'business_labels', 'email_threads', 'ai_responses'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
          missingTables.push(tableName);
        } else {
          console.log(`  ✅ ${tableName}: ${count} rows`);
          existingTables.push({ name: tableName, count });
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
        missingTables.push(tableName);
      }
    }

    // Method 2: Check Auth Users
    console.log('\n🔐 METHOD 2: Auth Schema Check');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authUsers) {
        console.log(`✅ Auth users: ${authUsers.users.length} registered`);
        if (authUsers.users.length > 0) {
          authUsers.users.slice(0, 3).forEach(user => {
            console.log(`  👤 ${user.email} (${user.created_at.split('T')[0]})`);
          });
        }
      } else {
        console.log('❌ Auth check failed:', authError?.message);
      }
    } catch (err) {
      console.log('❌ Auth error:', err.message);
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Existing tables: ${existingTables.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);
    
    if (existingTables.length > 0) {
      console.log('\n📋 EXISTING TABLES:');
      existingTables.forEach(table => {
        console.log(`  ✅ ${table.name} (${table.count} rows)`);
      });
    }

    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
    }

  } catch (error) {
    console.error('❌ Inventory failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 INVENTORY COMPLETE');
  console.log('='.repeat(50));
}

runInventory();