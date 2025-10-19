#!/usr/bin/env node

/**
 * Fix Frontend Environment Configuration
 * Updates the frontend .env file with correct Supabase credentials
 */

const fs = require('fs');
const path = require('path');

function fixFrontendEnv() {
  console.log('🔧 Fixing Frontend Environment Configuration...\n');

  const frontendEnvPath = path.join(process.cwd(), '.env');
  const backendEnvPath = path.join(process.cwd(), 'backend', '.env');

  // Read backend .env to get correct credentials
  if (!fs.existsSync(backendEnvPath)) {
    console.log('❌ Backend .env file not found');
    return;
  }

  const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Extract Supabase credentials from backend .env
  const supabaseUrlMatch = backendEnvContent.match(/SUPABASE_URL=(.+)/);
  const supabaseAnonKeyMatch = backendEnvContent.match(/SUPABASE_ANON_KEY=(.+)/);

  if (!supabaseUrlMatch || !supabaseAnonKeyMatch) {
    console.log('❌ Could not find Supabase credentials in backend .env');
    return;
  }

  const supabaseUrl = supabaseUrlMatch[1].trim();
  const supabaseAnonKey = supabaseAnonKeyMatch[1].trim();

  console.log(`📡 Correct Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  // Read current frontend .env
  let frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');

  // Update frontend .env with correct credentials
  console.log('\n🔧 Updating frontend .env file...');

  // Update Supabase URL
  frontendEnvContent = frontendEnvContent.replace(
    /SUPABASE_URL=.*/,
    `SUPABASE_URL=${supabaseUrl}`
  );

  // Update Supabase Anon Key
  frontendEnvContent = frontendEnvContent.replace(
    /SUPABASE_ANON_KEY=.*/,
    `SUPABASE_ANON_KEY=${supabaseAnonKey}`
  );

  // Update backend Supabase URL (for consistency)
  frontendEnvContent = frontendEnvContent.replace(
    /SUPABASE_URL=.*/,
    `SUPABASE_URL=${supabaseUrl}`
  );

  // Update OpenAI API key (from our previous work)
  const openaiKey = 'OPENAI_API_KEY_HERE';
  frontendEnvContent = frontendEnvContent.replace(
    /OPENAI_API_KEY=.*/,
    `OPENAI_API_KEY=${openaiKey}`
  );
  frontendEnvContent = frontendEnvContent.replace(
    /OPENAI_API_KEY=.*/,
    `OPENAI_API_KEY=${openaiKey}`
  );

  // Write updated frontend .env
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);

  console.log('✅ Frontend .env file updated successfully!');
  console.log('\n📋 Updated Configuration:');
  console.log(`   - SUPABASE_URL: ${supabaseUrl}`);
  console.log(`   - SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`   - OPENAI_API_KEY: ${openaiKey.substring(0, 20)}...`);

  console.log('\n🔄 Please restart your frontend development server:');
  console.log('   1. Stop the current server (Ctrl+C)');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the application again');

  console.log('\n🎯 The ERR_NAME_NOT_RESOLVED error should now be fixed!');
}

if (require.main === module) {
  fixFrontendEnv();
}

module.exports = { fixFrontendEnv };
