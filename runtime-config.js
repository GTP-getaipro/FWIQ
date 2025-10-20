// Runtime configuration script for environment variables
// This script will be executed at container startup to inject environment variables

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET || 'YOUR_OUTLOOK_CLIENT_SECRET_HERE'
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
  OUTLOOK_CLIENT_SECRET: '${config.OUTLOOK_CLIENT_SECRET}'
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
