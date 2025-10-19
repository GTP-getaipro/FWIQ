#!/usr/bin/env node

/**
 * Test Simple Registration (Without Profile Creation)
 * Tests if the basic Supabase auth signup works without profile creation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function testSimpleRegistration() {
  console.log('🧪 Testing Simple Registration (No Profile Creation)...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test basic auth signup without any profile creation
    console.log('1️⃣ Testing basic auth signup...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`   Testing with email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:5173/login',
      },
    });

    if (error) {
      console.log(`❌ Auth signup failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Status: ${error.status}`);
      
      if (error.message.includes('Database error')) {
        console.log('\n🔧 DIAGNOSIS:');
        console.log('The "Database error saving new user" suggests:');
        console.log('1. There might be a database trigger on auth.users that creates profiles');
        console.log('2. The trigger is failing due to RLS policies');
        console.log('3. We need to fix the database trigger or RLS policies');
        
        console.log('\n💡 SOLUTION:');
        console.log('Run the SQL fix in Supabase Dashboard:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Run the contents of scripts/simple-rls-fix.sql');
        console.log('3. This will fix the RLS policies for profile creation');
      }
    } else {
      console.log('✅ Auth signup successful!');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Clean up - sign out the test user
      await supabase.auth.signOut();
      console.log('✅ Test user cleaned up');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

if (require.main === module) {
  testSimpleRegistration();
}

module.exports = { testSimpleRegistration };
