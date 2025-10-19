#!/usr/bin/env node

/**
 * Test OAuth Configuration
 * Checks if OAuth credentials are properly configured in environment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing OAuth Configuration...\n');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Check Gmail OAuth credentials
console.log('📧 Gmail OAuth Configuration:');
const gmailClientId = envVars['VITE_GMAIL_CLIENT_ID'];
const gmailClientSecret = envVars['VITE_GMAIL_CLIENT_SECRET'];

if (!gmailClientId || gmailClientId.includes('your-gmail-client-id')) {
  console.log('❌ VITE_GMAIL_CLIENT_ID: Not configured or using placeholder');
} else {
  console.log('✅ VITE_GMAIL_CLIENT_ID: Configured');
  console.log(`   ID: ${gmailClientId.substring(0, 20)}...`);
}

if (!gmailClientSecret || gmailClientSecret.includes('your-gmail-client-secret')) {
  console.log('❌ VITE_GMAIL_CLIENT_SECRET: Not configured or using placeholder');
} else {
  console.log('✅ VITE_GMAIL_CLIENT_SECRET: Configured');
  console.log(`   Secret: ${gmailClientSecret.substring(0, 10)}...`);
}

// Check Outlook OAuth credentials
console.log('\n📧 Outlook OAuth Configuration:');
const outlookClientId = envVars['VITE_OUTLOOK_CLIENT_ID'];
const outlookClientSecret = envVars['VITE_OUTLOOK_CLIENT_SECRET'];

if (!outlookClientId || outlookClientId.includes('your-outlook-client-id')) {
  console.log('❌ VITE_OUTLOOK_CLIENT_ID: Not configured or using placeholder');
} else {
  console.log('✅ VITE_OUTLOOK_CLIENT_ID: Configured');
  console.log(`   ID: ${outlookClientId.substring(0, 20)}...`);
}

if (!outlookClientSecret || outlookClientSecret.includes('your-outlook-client-secret')) {
  console.log('❌ VITE_OUTLOOK_CLIENT_SECRET: Not configured or using placeholder');
} else {
  console.log('✅ VITE_OUTLOOK_CLIENT_SECRET: Configured');
  console.log(`   Secret: ${outlookClientSecret.substring(0, 10)}...`);
}

// Check redirect URIs
console.log('\n🔗 OAuth Redirect URIs:');
const googleRedirectUri = envVars['GOOGLE_REDIRECT_URI'];
const outlookRedirectUri = envVars['OUTLOOK_REDIRECT_URI'];

console.log(`Google: ${googleRedirectUri || 'Not configured'}`);
console.log(`Outlook: ${outlookRedirectUri || 'Not configured'}`);

// Summary
console.log('\n📋 Summary:');
const gmailConfigured = gmailClientId && !gmailClientId.includes('your-gmail-client-id') && 
                       gmailClientSecret && !gmailClientSecret.includes('your-gmail-client-secret');
const outlookConfigured = outlookClientId && !outlookClientId.includes('your-outlook-client-id') && 
                         outlookClientSecret && !outlookClientSecret.includes('your-outlook-client-secret');

if (gmailConfigured && outlookConfigured) {
  console.log('✅ Both Gmail and Outlook OAuth are fully configured!');
  console.log('🚀 You can now test email integrations.');
} else if (gmailConfigured) {
  console.log('✅ Gmail OAuth is configured. Outlook OAuth needs setup.');
} else if (outlookConfigured) {
  console.log('✅ Outlook OAuth is configured. Gmail OAuth needs setup.');
} else {
  console.log('❌ OAuth credentials need to be configured.');
  console.log('📖 See OAUTH_SETUP_INSTRUCTIONS.md for detailed setup guide.');
}

console.log('\n💡 Next Steps:');
if (!gmailConfigured) {
  console.log('1. Set up Google Cloud Console OAuth application');
  console.log('2. Add VITE_GMAIL_CLIENT_ID and VITE_GMAIL_CLIENT_SECRET to .env');
}
if (!outlookConfigured) {
  console.log('3. Set up Azure App Registration for Outlook');
  console.log('4. Add VITE_OUTLOOK_CLIENT_ID and VITE_OUTLOOK_CLIENT_SECRET to .env');
}
if (gmailConfigured || outlookConfigured) {
  console.log('5. Restart your development server: npm run dev');
  console.log('6. Test email integrations in the app');
}
