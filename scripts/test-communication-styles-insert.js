/**
 * Test Script: Communication Styles Insert
 * 
 * This script tests if the communication_styles table accepts
 * the minimal data structure that the frontend sends during onboarding.
 * 
 * Usage:
 * 1. Update SUPABASE_URL and SUPABASE_ANON_KEY below
 * 2. Run: node scripts/test-communication-styles-insert.js
 */

import { createClient } from '@supabase/supabase-js';

// ⚠️ UPDATE THESE WITH YOUR PROJECT CREDENTIALS
const SUPABASE_URL = 'https://oinxzvqszingwstrbdro.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Get from Supabase Dashboard > Settings > API

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCommunicationStylesInsert() {
  console.log('🧪 Testing communication_styles table insert...\n');

  // Test 1: Check table schema
  console.log('📋 Test 1: Checking table schema...');
  try {
    const { data, error } = await supabase
      .from('communication_styles')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Table access failed:', error.message);
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('💡 Solution: Run migration: supabase/migrations/20241220_create_communication_styles_table.sql');
      }
      return false;
    }
    
    console.log('✅ Table exists and is accessible\n');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }

  // Test 2: Check if required columns exist
  console.log('📋 Test 2: Checking for required columns...');
  try {
    const { data, error } = await supabase
      .from('communication_styles')
      .select('user_id, analysis_status, analysis_started_at, last_updated')
      .limit(0);

    if (error) {
      console.error('❌ Required columns missing:', error.message);
      
      // Check which columns are missing
      if (error.message.includes('analysis_status')) {
        console.error('💡 Missing: analysis_status column');
        console.error('💡 Solution: Run migration: supabase/migrations/20241221_enhance_communication_styles_table.sql');
      }
      
      return false;
    }
    
    console.log('✅ Required columns exist\n');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }

  // Test 3: Check for voice training columns (nice to have)
  console.log('📋 Test 3: Checking for voice training columns...');
  try {
    const { data, error } = await supabase
      .from('communication_styles')
      .select('vocabulary_patterns, tone_analysis, signature_phrases, response_templates, sample_size, updated_at')
      .limit(0);

    if (error) {
      console.warn('⚠️ Voice training columns missing:', error.message);
      console.warn('💡 Solution: Run migration: supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql');
      console.warn('⚠️ This is optional but recommended for full voice training functionality\n');
    } else {
      console.log('✅ Voice training columns exist (full schema ready)\n');
    }
  } catch (err) {
    console.warn('⚠️ Could not check voice training columns:', err.message);
  }

  // Test 4: Simulate the actual insert that happens during onboarding
  console.log('📋 Test 4: Simulating onboarding insert (requires authentication)...');
  console.log('⚠️ Skipped - This test requires a valid user authentication token\n');
  console.log('💡 To test the actual insert:');
  console.log('   1. Complete onboarding in your browser');
  console.log('   2. Check browser console for any errors');
  console.log('   3. Run the diagnostic SQL: scripts/diagnose-communication-styles.sql\n');

  return true;
}

// Run the test
testCommunicationStylesInsert()
  .then((success) => {
    if (success) {
      console.log('✅ All accessible tests passed!');
      console.log('\n📋 Next Steps:');
      console.log('1. Run: scripts/diagnose-communication-styles.sql in Supabase SQL Editor');
      console.log('2. If missing columns, apply migrations in order:');
      console.log('   - 20241220_create_communication_styles_table.sql');
      console.log('   - 20241221_enhance_communication_styles_table.sql');
      console.log('   - 20250122_enhance_communication_styles_for_voice_training.sql');
      console.log('3. Test onboarding flow with business type: "Hot tub & Spa"');
    } else {
      console.log('\n❌ Tests failed - see errors above for solutions');
    }
  })
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
  });

