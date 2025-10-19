#!/usr/bin/env node

/**
 * Setup Supabase Environment Variables
 * Helps configure .env file with Supabase credentials
 */

const fs = require('fs');
const path = require('path');

function setupSupabaseEnv() {
  console.log('🔧 Setting up Supabase Environment Variables...\n');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Creating from template...');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file from env.example template');
    } else {
      console.log('❌ env.example template not found');
      return;
    }
  }

  // Read current .env content
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update Supabase configuration
  console.log('\n🔑 Configuring Supabase credentials...');
  
  // Update the URL (based on the publishable key pattern)
  const supabaseUrl = 'https://owygswocga4pgftrcnirhwghb3a8rd.supabase.co';
  envContent = envContent.replace(
    /SUPABASE_URL=.*/,
    `SUPABASE_URL=${supabaseUrl}`
  );

  // Update the anon key
  const anonKey = 'sb_publishable_owygsWoCGa4PGfTRcNIrhw_GHB3a8rd';
  envContent = envContent.replace(
    /SUPABASE_ANON_KEY=.*/,
    `SUPABASE_ANON_KEY=${anonKey}`
  );

  // Update backend SUPABASE_URL
  envContent = envContent.replace(
    /SUPABASE_URL=.*/,
    `SUPABASE_URL=${supabaseUrl}`
  );

  // Update OpenAI API key (from our previous work)
  const openaiKey = 'YOUR_OPENAI_API_KEY_HERE';
  envContent = envContent.replace(
    /OPENAI_API_KEY=.*/,
    `OPENAI_API_KEY=${openaiKey}`
  );
  envContent = envContent.replace(
    /OPENAI_API_KEY=.*/,
    `OPENAI_API_KEY=${openaiKey}`
  );

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Updated .env file with Supabase credentials:');
  console.log(`   - URL: ${supabaseUrl}`);
  console.log(`   - Anon Key: ${anonKey.substring(0, 20)}...`);
  console.log(`   - OpenAI Key: ${openaiKey.substring(0, 20)}...`);

  console.log('\n📝 NOTE: You still need to get your SERVICE_ROLE_KEY from Supabase Dashboard:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to Settings → API');
  console.log('   4. Copy the "service_role" key');
  console.log('   5. Update SUPABASE_SERVICE_ROLE_KEY in .env file');

  console.log('\n🚀 Next steps:');
  console.log('   1. Run: node scripts/check-supabase-status.cjs');
  console.log('   2. Set up database schema if needed');
  console.log('   3. Test the connection');
}

if (require.main === module) {
  setupSupabaseEnv();
}

module.exports = { setupSupabaseEnv };
