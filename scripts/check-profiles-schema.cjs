#!/usr/bin/env node

/**
 * Check Profiles Table Schema in Detail
 * Identifies the exact column structure to fix the registration issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function checkProfilesSchema() {
  console.log('🔍 Checking Profiles Table Schema in Detail...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Try to insert a test record to see what the exact error is
    console.log('1️⃣ Testing profile insert with minimal data...');
    
    const testProfile = {
      id: 'test-user-id-12345',
      email: 'test@example.com'
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
        console.log('\n🔧 Column issue detected - trying to identify correct schema...');
        
        // Try different column combinations
        const testColumns = [
          { id: 'test-1', email: 'test1@example.com' },
          { user_id: 'test-2', email: 'test2@example.com' },
          { id: 'test-3', user_id: 'test-3', email: 'test3@example.com' }
        ];
        
        for (const testCol of testColumns) {
          try {
            const { error: testError } = await supabase
              .from('profiles')
              .insert([testCol]);
            
            if (!testError || testError.code === '23505') { // 23505 = duplicate key error
              console.log(`✅ Working column structure: ${Object.keys(testCol).join(', ')}`);
              break;
            }
          } catch (err) {
            // Continue testing
          }
        }
      }
    } else {
      console.log('✅ Test insert successful - cleaning up...');
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', 'test-user-id-12345');
    }

    // Try to get any existing data to see the structure
    console.log('\n2️⃣ Checking existing profile structure...');
    const { data: existingData, error: existingError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (existingError) {
      console.log(`❌ Query error: ${existingError.message}`);
    } else if (existingData && existingData.length > 0) {
      console.log('✅ Found existing profile structure:');
      console.log(`   Columns: ${Object.keys(existingData[0]).join(', ')}`);
      console.log(`   Sample data:`, JSON.stringify(existingData[0], null, 2));
    } else {
      console.log('ℹ️ No existing profiles found');
    }

  } catch (error) {
    console.error('❌ Schema check error:', error.message);
  }
}

if (require.main === module) {
  checkProfilesSchema();
}

module.exports = { checkProfilesSchema };
