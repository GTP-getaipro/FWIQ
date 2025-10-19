#!/usr/bin/env node

/**
 * Check Table Schema
 * Inspects the actual schema of database tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

async function checkTableSchema() {
  console.log('🔍 Checking Table Schema...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check profiles table schema by trying different column combinations
    console.log('1️⃣ Checking profiles table schema...');
    
    // Try to get any data to see what columns exist
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('❌ Profiles table schema issue detected');
      console.log(`Error: ${error.message}`);
      
      // Try common column names
      const commonColumns = [
        'id', 'user_id', 'email', 'created_at', 'updated_at',
        'first_name', 'last_name', 'company_name', 'business_type',
        'phone', 'address', 'client_config', 'business', 'managers', 'suppliers'
      ];
      
      console.log('\n2️⃣ Testing common column names...');
      const workingColumns = [];
      
      for (const column of commonColumns) {
        try {
          const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select(column)
            .limit(1);
          
          if (!testError || testError.code === 'PGRST116') {
            workingColumns.push(column);
          }
        } catch (err) {
          // Column doesn't exist
        }
      }
      
      console.log(`✅ Working columns: ${workingColumns.join(', ')}`);
      
      if (workingColumns.length === 0) {
        console.log('❌ No accessible columns found');
      }
    } else {
      console.log('✅ Profiles table accessible');
      if (data && data.length > 0) {
        console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
      }
    }

    // Check other important tables
    console.log('\n3️⃣ Checking other table schemas...');
    
    const tablesToCheck = ['integrations', 'workflows', 'email_logs'];
    
    for (const table of tablesToCheck) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError && tableError.code === 'PGRST116') {
          console.log(`✅ ${table}: Accessible (no data)`);
        } else if (tableError && tableError.message.includes('column')) {
          console.log(`⚠️ ${table}: Schema issue - ${tableError.message}`);
        } else if (tableError) {
          console.log(`❌ ${table}: ${tableError.message}`);
        } else {
          console.log(`✅ ${table}: Accessible`);
          if (tableData && tableData.length > 0) {
            console.log(`   Columns: ${Object.keys(tableData[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Schema check error:', error.message);
  }
}

if (require.main === module) {
  checkTableSchema();
}

module.exports = { checkTableSchema };
