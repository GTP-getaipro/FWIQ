/**
 * Create local .env file from current environment variables
 * This script creates a proper .env file for local development
 */

import { writeFileSync } from 'fs';

function createLocalEnvFile() {
  console.log("🔧 CREATING LOCAL .ENV FILE");
  console.log("=" .repeat(50));
  
  // Get current environment variables
  const envVars = {
    // Supabase Configuration
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    
    // OAuth Configuration
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || process.env.VITE_GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || process.env.VITE_GMAIL_CLIENT_SECRET,
    OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID || process.env.VITE_OUTLOOK_CLIENT_ID,
    OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET || process.env.VITE_OUTLOOK_CLIENT_SECRET,
    
    // AI Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
    
    // N8N Configuration
    N8N_API_KEY: process.env.N8N_API_KEY || process.env.VITE_N8N_API_KEY,
    N8N_BASE_URL: process.env.N8N_BASE_URL || process.env.VITE_N8N_BASE_URL,
    
    // Security Configuration
    SYSTEM_MESSAGE_ENCRYPTION_KEY: process.env.SYSTEM_MESSAGE_ENCRYPTION_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    
    // Deployment Configuration
    DEPLOY_API_KEY: process.env.DEPLOY_API_KEY,
    
    // Environment Configuration
    NODE_ENV: 'development',
    PORT: '3001',
    LOG_LEVEL: 'debug'
  };
  
  // Create .env content
  let envContent = `# =============================================================================
# FWIQv2 LOCAL DEVELOPMENT ENVIRONMENT VARIABLES
# =============================================================================
# Generated on ${new Date().toISOString()}
# NEVER commit this file to version control

# ----------------------------------------------------------------------------
# 🗄️ SUPABASE CONFIGURATION (REQUIRED)
# ----------------------------------------------------------------------------
SUPABASE_URL=${envVars.SUPABASE_URL || 'your-project-id.supabase.co'}
SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'}
SUPABASE_ANON_KEY=${envVars.SUPABASE_ANON_KEY || 'your-anon-key-here'}

# ----------------------------------------------------------------------------
# 🔐 OAUTH CONFIGURATION (REQUIRED FOR EMAIL INTEGRATIONS)
# ----------------------------------------------------------------------------
GMAIL_CLIENT_ID=${envVars.GMAIL_CLIENT_ID || 'your-gmail-client-id-here'}
GMAIL_CLIENT_SECRET=${envVars.GMAIL_CLIENT_SECRET || 'your-gmail-client-secret-here'}

OUTLOOK_CLIENT_ID=${envVars.OUTLOOK_CLIENT_ID || 'your-outlook-client-id-here'}
OUTLOOK_CLIENT_SECRET=${envVars.OUTLOOK_CLIENT_SECRET || 'your-outlook-client-secret-here'}

# ----------------------------------------------------------------------------
# 🤖 AI CONFIGURATION (REQUIRED)
# ----------------------------------------------------------------------------
OPENAI_API_KEY=${envVars.OPENAI_API_KEY || 'your-openai-api-key-here'}

# ----------------------------------------------------------------------------
# 🔧 N8N CONFIGURATION (REQUIRED)
# ----------------------------------------------------------------------------
N8N_API_KEY=${envVars.N8N_API_KEY || 'your-n8n-api-key-here'}
N8N_BASE_URL=${envVars.N8N_BASE_URL || 'https://your-n8n-instance.com'}

# ----------------------------------------------------------------------------
# 🔒 SECURITY CONFIGURATION (REQUIRED)
# ----------------------------------------------------------------------------
SYSTEM_MESSAGE_ENCRYPTION_KEY=${envVars.SYSTEM_MESSAGE_ENCRYPTION_KEY || 'your-32-character-encryption-key-here'}
JWT_SECRET=${envVars.JWT_SECRET || 'your-jwt-secret-here'}

# ----------------------------------------------------------------------------
# 🚀 DEPLOYMENT CONFIGURATION
# ----------------------------------------------------------------------------
DEPLOY_API_KEY=${envVars.DEPLOY_API_KEY || 'your-deploy-api-key-here'}

# ----------------------------------------------------------------------------
# 🌍 ENVIRONMENT CONFIGURATION
# ----------------------------------------------------------------------------
NODE_ENV=${envVars.NODE_ENV}
PORT=${envVars.PORT}
LOG_LEVEL=${envVars.LOG_LEVEL}

# ----------------------------------------------------------------------------
# 📧 EMAIL CONFIGURATION (OPTIONAL)
# ----------------------------------------------------------------------------
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# ----------------------------------------------------------------------------
# 🔍 MONITORING CONFIGURATION (OPTIONAL)
# ----------------------------------------------------------------------------
SENTRY_DSN=your-sentry-dsn-here
ANALYTICS_ID=your-analytics-id-here
`;

  // Write the .env file
  writeFileSync('.env', envContent);
  
  console.log("✅ Created .env file successfully!");
  
  // Show which variables were populated
  console.log("\n📊 ENVIRONMENT VARIABLES STATUS:");
  console.log("-".repeat(50));
  
  const requiredVars = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY',
    'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'OUTLOOK_CLIENT_ID', 'OUTLOOK_CLIENT_SECRET',
    'OPENAI_API_KEY', 'N8N_API_KEY', 'N8N_BASE_URL', 'JWT_SECRET'
  ];
  
  requiredVars.forEach(varName => {
    const value = envVars[varName];
    const status = value && !value.includes('your-') ? '✅' : '❌';
    console.log(`${status} ${varName}: ${value ? 'SET' : 'NOT SET'}`);
  });
  
  console.log("\n🔧 NEXT STEPS:");
  console.log("1. Review the .env file and update any placeholder values");
  console.log("2. Add .env to your .gitignore file (if not already there)");
  console.log("3. Test your application with the new environment variables");
  console.log("4. Set up Supabase Edge Function secrets:");
  console.log("   supabase secrets set OPENAI_API_KEY=your-key");
  console.log("   supabase secrets set N8N_API_KEY=your-key");
  console.log("   supabase secrets set SYSTEM_MESSAGE_ENCRYPTION_KEY=your-key");
}

// Run the script
createLocalEnvFile();
