// Mock for import.meta.env in Jest environment
export const importMetaEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_GMAIL_CLIENT_ID: 'test-gmail-client-id',
  VITE_OUTLOOK_CLIENT_ID: 'test-outlook-client-id',
  VITE_API_URL: 'http://localhost:3001/api',
  VITE_APP_ENV: 'test',
  VITE_DEBUG_MODE: 'true'
};

// Mock import.meta object
export const importMeta = {
  env: importMetaEnv
};

// Make it available globally for Jest
if (typeof global !== 'undefined') {
  global.importMeta = importMeta;
  global.importMetaEnv = importMetaEnv;
}
