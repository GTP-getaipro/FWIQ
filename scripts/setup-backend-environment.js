/**
 * Setup Backend Environment Variables
 * This script helps configure the backend environment with proper Supabase credentials
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const ENV_PATH = path.resolve(process.cwd(), '.env');

function setupBackendEnvironment() {
  console.log("🔧 SETTING UP BACKEND ENVIRONMENT VARIABLES");
  console.log("=" .repeat(60));
  
  try {
    console.log("📖 Reading current .env file...");
    let content = readFileSync(ENV_PATH, 'utf8');
    
    console.log("\n🚨 ISSUE IDENTIFIED:");
    console.log("   The .env file contains placeholder values instead of real credentials");
    console.log("   This is causing the backend Supabase client initialization to fail");
    
    console.log("\n🔍 CURRENT PROBLEMATIC VALUES:");
    console.log("   SUPABASE_URL=your-project-id.supabase.co");
    console.log("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here");
    console.log("   SUPABASE_ANON_KEY=your-anon-key-here");
    
    console.log("\n💡 SOLUTION:");
    console.log("   You need to replace these placeholder values with your actual Supabase credentials");
    
    console.log("\n📋 STEPS TO FIX:");
    console.log("   1. Go to your Supabase project dashboard");
    console.log("   2. Navigate to Settings > API");
    console.log("   3. Copy the following values:");
    console.log("      - Project URL (e.g., https://your-project-id.supabase.co)");
    console.log("      - Service Role Key (starts with 'eyJ...')");
    console.log("      - Anon Key (starts with 'eyJ...')");
    console.log("   4. Update the .env file with these real values");
    
    console.log("\n🔧 ALTERNATIVE: Use environment variables from your system");
    
    // Check if environment variables are set in the system
    const systemSupabaseUrl = process.env.SUPABASE_URL;
    const systemSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const systemSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (systemSupabaseUrl && systemSupabaseServiceKey && systemSupabaseAnonKey) {
      console.log("\n✅ FOUND SYSTEM ENVIRONMENT VARIABLES:");
      console.log(`   SUPABASE_URL: ${systemSupabaseUrl}`);
      console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${systemSupabaseServiceKey.substring(0, 20)}...`);
      console.log(`   SUPABASE_ANON_KEY: ${systemSupabaseAnonKey.substring(0, 20)}...`);
      
      console.log("\n🔄 UPDATING .env FILE WITH SYSTEM VALUES...");
      
      // Update the .env file with system environment variables
      content = content.replace(
        'SUPABASE_URL=your-project-id.supabase.co',
        `SUPABASE_URL=${systemSupabaseUrl}`
      );
      
      content = content.replace(
        'SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here',
        `SUPABASE_SERVICE_ROLE_KEY=${systemSupabaseServiceKey}`
      );
      
      content = content.replace(
        'SUPABASE_ANON_KEY=your-anon-key-here',
        `SUPABASE_ANON_KEY=${systemSupabaseAnonKey}`
      );
      
      // Create backup
      const backupPath = ENV_PATH + '.backup.' + Date.now();
      writeFileSync(backupPath, readFileSync(ENV_PATH, 'utf8'));
      console.log(`📦 Created backup: ${backupPath}`);
      
      // Write updated content
      writeFileSync(ENV_PATH, content);
      console.log("✅ Updated .env file with system environment variables");
      
    } else {
      console.log("\n❌ NO SYSTEM ENVIRONMENT VARIABLES FOUND");
      console.log("   You need to manually update the .env file with your Supabase credentials");
      
      console.log("\n📝 MANUAL UPDATE REQUIRED:");
      console.log("   1. Open the .env file in your editor");
      console.log("   2. Replace the following lines:");
      console.log("      SUPABASE_URL=your-project-id.supabase.co");
      console.log("      SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here");
      console.log("      SUPABASE_ANON_KEY=your-anon-key-here");
      console.log("   3. With your actual Supabase credentials");
      
      console.log("\n🔗 GET YOUR SUPABASE CREDENTIALS:");
      console.log("   1. Go to: https://supabase.com/dashboard");
      console.log("   2. Select your project");
      console.log("   3. Go to Settings > API");
      console.log("   4. Copy the Project URL and API keys");
    }
    
    console.log("\n🧪 TESTING BACKEND CONNECTION:");
    console.log("   After updating the credentials, test the backend:");
    console.log("   cd backend && npm start");
    
    console.log("\n⚠️ IMPORTANT NOTES:");
    console.log("   - Never commit real credentials to version control");
    console.log("   - Keep your .env file secure and private");
    console.log("   - Use different credentials for development and production");
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  }
}

// Run the setup
setupBackendEnvironment();
