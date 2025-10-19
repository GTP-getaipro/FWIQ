#!/usr/bin/env node

/**
 * Test Registration Fix
 * Verifies that the registration profile creation works correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function testRegistrationFix() {
  console.log('🧪 Testing Registration Profile Creation Fix...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test profile creation with the corrected structure
    console.log('1️⃣ Testing profile creation with user_id column...');
    
    const testProfile = {
      user_id: 'test-user-id-12345-67890-abcdef', // Valid UUID format
      email: 'test@example.com',
      onboarding_step: 'email_integration'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testProfile]);

    if (insertError) {
      console.log('❌ Insert error details:');
      console.log(`   Code: ${insertError.code}`);
      console.log(`   Message: ${insertError.message}`);
      console.log(`   Details: ${insertError.details}`);
      console.log(`   Hint: ${insertError.hint}`);
      
      if (insertError.message.includes('column') || insertError.message.includes('does not exist')) {
        console.log('\n🔧 Column issue detected - trying alternative approaches...');
        
        // Try with minimal data
        const minimalProfile = { user_id: 'test-user-id-12345-67890-abcdef' };
        const { error: minimalError } = await supabase
          .from('profiles')
          .insert([minimalProfile]);
        
        if (minimalError) {
          console.log(`❌ Minimal insert also failed: ${minimalError.message}`);
        } else {
          console.log('✅ Minimal insert successful');
          // Clean up
          await supabase.from('profiles').delete().eq('user_id', 'test-user-id-12345-67890-abcdef');
        }
      }
    } else {
      console.log('✅ Profile creation successful!');
      // Clean up test data
      await supabase.from('profiles').delete().eq('user_id', 'test-user-id-12345-67890-abcdef');
    }

    // Test with a real UUID format
    console.log('\n2️⃣ Testing with proper UUID format...');
    const realUuidProfile = {
      user_id: '550e8400-e29b-41d4-a716-446655440000', // Proper UUID format
      email: 'test-uuid@example.com',
      onboarding_step: 'email_integration'
    };

    const { data: uuidData, error: uuidError } = await supabase
      .from('profiles')
      .insert([realUuidProfile]);

    if (uuidError) {
      console.log(`❌ UUID test failed: ${uuidError.message}`);
    } else {
      console.log('✅ UUID format test successful');
      // Clean up
      await supabase.from('profiles').delete().eq('user_id', '550e8400-e29b-41d4-a716-446655440000');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

if (require.main === module) {
  testRegistrationFix();
}

module.exports = { testRegistrationFix };
