#!/usr/bin/env node

/**
 * Temporarily Disable OAuth Integration
 * Updates environment to disable OAuth features for testing
 */

const fs = require('fs');
const path = require('path');

function disableOAuthTemp() {
  console.log('🔧 Temporarily disabling OAuth integration...\n');

  const envPath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Comment out OAuth credentials to disable them
  envContent = envContent.replace(
    /VITE_GMAIL_CLIENT_ID=.*/,
    '# VITE_GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com'
  );
  
  envContent = envContent.replace(
    /VITE_GMAIL_CLIENT_SECRET=.*/,
    '# VITE_GMAIL_CLIENT_SECRET=your-gmail-client-secret-here'
  );
  
  envContent = envContent.replace(
    /VITE_OUTLOOK_CLIENT_ID=.*/,
    '# VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id-here'
  );
  
  envContent = envContent.replace(
    /VITE_OUTLOOK_CLIENT_SECRET=.*/,
    '# VITE_OUTLOOK_CLIENT_SECRET=your-outlook-client-secret-here'
  );

  fs.writeFileSync(envPath, envContent);

  console.log('✅ OAuth integration temporarily disabled');
  console.log('📝 OAuth credentials are now commented out');
  console.log('\n🔄 Please restart your frontend server:');
  console.log('   1. Stop the current server (Ctrl+C)');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the application without OAuth');

  console.log('\n💡 To re-enable OAuth later:');
  console.log('   1. Set up real Google/Microsoft OAuth credentials');
  console.log('   2. Uncomment the OAuth lines in .env');
  console.log('   3. Update with real client IDs and secrets');
}

if (require.main === module) {
  disableOAuthTemp();
}

module.exports = { disableOAuthTemp };
