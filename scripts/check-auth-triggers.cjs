#!/usr/bin/env node

/**
 * Check Auth Triggers and Policies
 * Investigates if there are database triggers or policies causing the auth signup failure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function checkAuthTriggers() {
  console.log('🔍 Checking Auth Triggers and Policies...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check if there are any RLS policies on auth.users or profiles that might be causing issues
    console.log('1️⃣ Testing if profiles table has RLS policies...');
    
    // Try to query profiles table to see if RLS is blocking us
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log(`❌ Profiles query error: ${profilesError.message}`);
      if (profilesError.message.includes('RLS')) {
        console.log('🔧 Row Level Security is blocking queries - this might be the issue');
      }
    } else {
      console.log('✅ Profiles table accessible');
    }

    // Check if we can create a test user profile (this will help identify the exact issue)
    console.log('\n2️⃣ Testing profile creation with service role...');
    
    // Try with a different approach - check if the issue is with the table structure
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    // First, try to delete any existing test record
    await supabase.from('profiles').delete().eq('id', testUserId);
    
    // Try to insert a test profile
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test-profile@example.com',
        onboarding_step: 'email_integration'
      });

    if (insertError) {
      console.log(`❌ Profile insert failed: ${insertError.message}`);
      console.log(`   Code: ${insertError.code}`);
      console.log(`   Details: ${insertError.details}`);
      console.log(`   Hint: ${insertError.hint}`);
      
      // Check if it's a constraint issue
      if (insertError.code === '23505') {
        console.log('🔧 Duplicate key error - record might already exist');
      } else if (insertError.code === '23503') {
        console.log('🔧 Foreign key constraint error');
      } else if (insertError.code === '42501') {
        console.log('🔧 Permission denied - RLS policy issue');
      }
    } else {
      console.log('✅ Profile insert successful');
      // Clean up
      await supabase.from('profiles').delete().eq('id', testUserId);
    }

    // Check if the issue might be with the auth.users table structure
    console.log('\n3️⃣ Checking if auth system is working...');
    
    // Try a simple auth operation to see if the auth system itself is working
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log(`❌ Auth system error: ${sessionError.message}`);
    } else {
      console.log('✅ Auth system accessible');
    }

    console.log('\n📋 DIAGNOSIS:');
    console.log('The "Database error saving new user" suggests:');
    console.log('1. There might be a database trigger on auth.users');
    console.log('2. RLS policies might be interfering');
    console.log('3. The profiles table might have constraints');
    console.log('4. There might be a foreign key constraint issue');

  } catch (error) {
    console.error('❌ Check error:', error.message);
  }
}

if (require.main === module) {
  checkAuthTriggers();
}

module.exports = { checkAuthTriggers };
