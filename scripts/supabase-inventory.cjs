#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to find .env.production file
const envPath = path.join(__dirname, '..', '.env.production');
console.log(`🔍 Looking for .env.production at: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log('✅ Found .env.production file');
  require('dotenv').config({ path: envPath });
} else {
  console.log('❌ .env.production not found, trying current directory...');
  require('dotenv').config();
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oinxzvqszingwstrbdro.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Environment check:');
console.log(`  SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
console.log(`  SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY ? '✅ (found)' : '❌ (missing)'}`);

if (!SUPABASE_SERVICE_KEY) {
  console.error('\n❌ SERVICE_ROLE_KEY is missing!');
  console.error('Please add to your .env.production file:');
  console.error('SERVICE_ROLE_KEY=eyJ...(your actual service role key)');
  console.error('\nGet it from: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function quickCheck() {
  console.log('\n🔍 QUICK SUPABASE CHECK');
  console.log('='.repeat(30));
  
  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful');
      
      // Check specific issues
      const { data: commStyles } = await supabase.from('communication_styles').select('*').limit(1);
      const { data: businessProfiles } = await supabase.from('business_profiles').select('*').limit(1);
      
      console.log(`✅ communication_styles: ${commStyles ? 'accessible' : 'error'}`);
      console.log(`✅ business_profiles: ${businessProfiles ? 'accessible' : 'error'}`);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

quickCheck();