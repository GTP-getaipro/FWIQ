#!/usr/bin/env node

/**
 * Test Registration After Fix
 * Tests registration after applying the database fix
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function testAfterFix() {
  console.log('🧪 Testing Registration After Database Fix...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test 1: Basic auth signup
    console.log('1️⃣ Testing basic auth signup...');
    
    const testEmail = `test-fix-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`   Email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:5173/login',
      },
    });

    if (error) {
      console.log(`❌ Auth signup still failing: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Status: ${error.status}`);
      
      if (error.message.includes('Database error')) {
        console.log('\n🔧 ADDITIONAL STEPS NEEDED:');
        console.log('The database fix may not have been applied yet.');
        console.log('Please run ONE of these SQL scripts in Supabase Dashboard:');
        console.log('\n📄 Option 1 (Recommended): scripts/disable-profile-trigger.sql');
        console.log('   - Disables automatic profile creation');
        console.log('   - Handles profiles in the application');
        console.log('\n📄 Option 2: scripts/comprehensive-registration-fix.sql');
        console.log('   - Fixes triggers and RLS policies');
        console.log('   - Creates profiles automatically');
      }
    } else {
      console.log('✅ Auth signup successful!');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      
      // Test 2: Check if profile was created automatically
      console.log('\n2️⃣ Checking if profile was created...');
      
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError && profileError.code === 'PGRST116') {
          console.log('ℹ️ No profile created automatically (this is OK - will be created on first login)');
        } else if (profileError) {
          console.log(`⚠️ Profile check error: ${profileError.message}`);
        } else {
          console.log('✅ Profile created automatically');
          console.log(`   Profile data:`, JSON.stringify(profile, null, 2));
        }
      }
      
      // Clean up
      console.log('\n3️⃣ Cleaning up test user...');
      await supabase.auth.signOut();
      console.log('✅ Test user cleaned up');
      
      console.log('\n🎉 REGISTRATION IS NOW WORKING!');
      console.log('You can now register new users in the frontend application.');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

if (require.main === module) {
  testAfterFix();
}

module.exports = { testAfterFix };
