// Runtime configuration script for environment variables
// This script will be executed at container startup to inject environment variables

const fs = require('fs');
const path = require('path');

// Get environment variables from process.env
const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://oinxzvqszingwstrbdro.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJiZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDEzODQsImV4cCI6MjA3MzkxNzM4NH0.72tZYFLVr2C3ij6dB8cEKP6L-o9qmaCtrR6KEi7OD6c',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
  BACKEND_URL: process.env.BACKEND_URL || 'https://api.floworx-iq.com'
};

// Create a config.js file that will be loaded by the frontend
const configContent = `
// Runtime configuration - generated at container startup
window.__RUNTIME_CONFIG__ = {
  SUPABASE_URL: '${config.SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${config.SUPABASE_ANON_KEY}',
  OPENAI_API_KEY: '${config.OPENAI_API_KEY}',
  BACKEND_URL: '${config.BACKEND_URL}'
};
`;

// Write the config file to the dist directory
const distPath = path.join(__dirname, 'dist');
const configPath = path.join(distPath, 'config.js');

if (fs.existsSync(distPath)) {
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Runtime configuration generated successfully');
  console.log('📁 Config file written to:', configPath);
} else {
  console.error('❌ Dist directory not found:', distPath);
  process.exit(1);
}
