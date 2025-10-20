import { createClient } from '@supabase/supabase-js';

// Use runtime configuration if available, otherwise fall back to environment variables
const getConfig = () => {
  // Check for runtime configuration first (for production deployment)
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    return {
      supabaseUrl: window.__RUNTIME_CONFIG__.SUPABASE_URL,
      supabaseAnonKey: window.__RUNTIME_CONFIG__.SUPABASE_ANON_KEY
    };
  }
  
  // Fall back to environment variables (for development)
  return {
    supabaseUrl: import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
  };
};

const { supabaseUrl, supabaseAnonKey } = getConfig();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file or runtime configuration.');
}

console.log('🔗 Supabase Configuration:', {
  url: supabaseUrl,
  keySet: !!supabaseAnonKey,
  usingRuntimeConfig: !!(typeof window !== 'undefined' && window.__RUNTIME_CONFIG__),
  runtimeConfigAvailable: !!(typeof window !== 'undefined' && window.__RUNTIME_CONFIG__)
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);