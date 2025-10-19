import { createClient } from '@supabase/supabase-js';

// Use environment variables - no fallback for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

console.log('🔗 Supabase Configuration:', {
  url: supabaseUrl,
  keySet: !!supabaseAnonKey,
  usingEnv: true
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);