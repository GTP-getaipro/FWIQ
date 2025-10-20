// Runtime configuration script for environment variables
// This script will be executed at container startup to inject environment variables

console.log('🚀 Runtime config script starting...');
console.log('🔍 Node.js version:', process.version);
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 Script directory:', __dirname);

try {
  const fs = require('fs');
  const path = require('path');

// Get environment variables from process.env
const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://oinxzvqszingwstrbdro.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJiZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDEzODQsImV4cCI6MjA3MzkxNzM4NH0.72tZYFLVr2C3ij6dB8cEKP6L-o9qmaCtrR6KEi7OD6c',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
  BACKEND_URL: process.env.BACKEND_URL || 'https://api.floworx-iq.com',
  N8N_API_KEY: process.env.N8N_API_KEY || 'YOUR_N8N_API_KEY_HERE',
  N8N_BASE_URL: process.env.N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud',
  // OAuth credentials
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || 'YOUR_GMAIL_CLIENT_ID_HERE',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || 'YOUR_GMAIL_CLIENT_SECRET_HERE',
  OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID || 'YOUR_OUTLOOK_CLIENT_ID_HERE',
  OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET || 'YOUR_OUTLOOK_CLIENT_SECRET_HERE',
  // OAuth redirect URIs
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI || 'https://app.floworx-iq.com/oauth-callback-n8n',
  OUTLOOK_REDIRECT_URI: process.env.OUTLOOK_REDIRECT_URI || 'https://app.floworx-iq.com/oauth-callback-n8n'
};

// Debug: Log available environment variables
console.log('🔍 Available environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('N8N_API_KEY:', process.env.N8N_API_KEY ? 'SET' : 'NOT SET');
console.log('N8N_BASE_URL:', process.env.N8N_BASE_URL ? 'SET' : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('BACKEND_URL:', process.env.BACKEND_URL ? 'SET' : 'NOT SET');
console.log('GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('OUTLOOK_CLIENT_ID:', process.env.OUTLOOK_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('OUTLOOK_CLIENT_SECRET:', process.env.OUTLOOK_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('GMAIL_REDIRECT_URI:', process.env.GMAIL_REDIRECT_URI ? 'SET' : 'NOT SET');
console.log('OUTLOOK_REDIRECT_URI:', process.env.OUTLOOK_REDIRECT_URI ? 'SET' : 'NOT SET');

// Debug: Log actual values (redacted for security)
console.log('🔍 Environment variable values (redacted):');
console.log('OUTLOOK_CLIENT_ID value:', process.env.OUTLOOK_CLIENT_ID ? process.env.OUTLOOK_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET');
console.log('GMAIL_CLIENT_ID value:', process.env.GMAIL_CLIENT_ID ? process.env.GMAIL_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET');

// Create a config.js file that will be loaded by the frontend
const configContent = `
// Runtime configuration - generated at container startup
window.__RUNTIME_CONFIG__ = {
  SUPABASE_URL: '${config.SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${config.SUPABASE_ANON_KEY}',
  OPENAI_API_KEY: '${config.OPENAI_API_KEY}',
  BACKEND_URL: '${config.BACKEND_URL}',
  N8N_API_KEY: '${config.N8N_API_KEY}',
  N8N_BASE_URL: '${config.N8N_BASE_URL}',
  GMAIL_CLIENT_ID: '${config.GMAIL_CLIENT_ID}',
  GMAIL_CLIENT_SECRET: '${config.GMAIL_CLIENT_SECRET}',
  OUTLOOK_CLIENT_ID: '${config.OUTLOOK_CLIENT_ID}',
  OUTLOOK_CLIENT_SECRET: '${config.OUTLOOK_CLIENT_SECRET}',
  GMAIL_REDIRECT_URI: '${config.GMAIL_REDIRECT_URI}',
  OUTLOOK_REDIRECT_URI: '${config.OUTLOOK_REDIRECT_URI}'
};
`;

// Write the config file to the dist directory
const distPath = path.join(__dirname, 'dist');
const configPath = path.join(distPath, 'config.js');

console.log('🔍 Checking dist directory:', distPath);
console.log('🔍 Dist directory exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Runtime configuration generated successfully');
  console.log('📁 Config file written to:', configPath);
  
  // Verify the file was written correctly
  if (fs.existsSync(configPath)) {
    const fileContent = fs.readFileSync(configPath, 'utf8');
    console.log('✅ Config file verification: File exists and contains', fileContent.length, 'characters');
    console.log('🔧 Configuration values:');
    console.log('  - BACKEND_URL:', config.BACKEND_URL);
    console.log('  - N8N_BASE_URL:', config.N8N_BASE_URL);
    console.log('  - GMAIL_CLIENT_ID:', config.GMAIL_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('  - OUTLOOK_CLIENT_ID:', config.OUTLOOK_CLIENT_ID ? 'SET' : 'NOT SET');
  } else {
    console.error('❌ Config file verification failed: File does not exist');
  }
} else {
  console.error('❌ Dist directory not found:', distPath);
  console.log('🔍 Current working directory:', process.cwd());
  console.log('🔍 Directory contents:', fs.readdirSync(__dirname));
  process.exit(1);
}

} catch (error) {
  console.error('❌ Runtime config script failed:', error);
  console.error('❌ Error stack:', error.stack);
  process.exit(1);
}
