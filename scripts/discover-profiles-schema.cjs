#!/usr/bin/env node

/**
 * Discover Profiles Table Schema
 * Finds out what columns actually exist in the profiles table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function discoverProfilesSchema() {
  console.log('🔍 Discovering Profiles Table Schema...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Try to select all columns to see what's available
    console.log('1️⃣ Testing different column names...');
    
    const columnTests = [
      'id',
      'user_id', 
      'email',
      'first_name',
      'last_name',
      'company_name',
      'business_type',
      'onboarding_step',
      'created_at',
      'updated_at'
    ];

    const workingColumns = [];
    
    for (const column of columnTests) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);
        
        if (!error || error.code === 'PGRST116') {
          workingColumns.push(column);
          console.log(`✅ Column '${column}' exists`);
        } else {
          console.log(`❌ Column '${column}' does not exist: ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Column '${column}' error: ${err.message}`);
      }
    }

    console.log(`\n📋 Working columns: ${workingColumns.join(', ')}`);

    // Try to insert with just the working columns
    if (workingColumns.length > 0) {
      console.log('\n2️⃣ Testing insert with working columns...');
      
      const testData = {};
      workingColumns.forEach(col => {
        if (col === 'id') {
          testData[col] = '550e8400-e29b-41d4-a716-446655440000';
        } else if (col === 'email') {
          testData[col] = 'test@example.com';
        } else if (col === 'onboarding_step') {
          testData[col] = 'email_integration';
        }
        // Add other columns as needed
      });

      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert([testData]);

      if (insertError) {
        console.log(`❌ Insert failed: ${insertError.message}`);
      } else {
        console.log('✅ Insert successful with working columns!');
        // Clean up
        if (testData.id) {
          await supabase.from('profiles').delete().eq('id', testData.id);
        }
      }
    }

  } catch (error) {
    console.error('❌ Discovery error:', error.message);
  }
}

if (require.main === module) {
  discoverProfilesSchema();
}

module.exports = { discoverProfilesSchema };
