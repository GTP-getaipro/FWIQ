import {  createClient  } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

/**
 * Singleton Supabase client for backend services
 * This ensures we have only one connection instance across all backend services
 */
class SupabaseClientManager {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  /**
   * Get or create Supabase client instance
   */
  getClient() {
    if (!this.client) {
      this.client = this.createClient();
    }
    return this.client;
  }

  /**
   * Create new Supabase client with proper configuration
   */
  createClient() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        logger.error('Missing required Supabase environment variables');
        throw new Error('SUPABASE_URL and SERVICE_ROLE_KEY are required');
      }

      const client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'floworx-backend'
          }
        }
      });

      this.initialized = true;
      logger.info('Supabase client initialized successfully');
      
      return client;

    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  /**
   * Test connection to Supabase
   */
  async testConnection() {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is OK
        throw error;
      }

      logger.info('Supabase connection test successful');
      return true;

    } catch (error) {
      logger.error('Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      hasClient: !!this.client,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset client (for testing or error recovery)
   */
  reset() {
    this.client = null;
    this.initialized = false;
    logger.info('Supabase client reset');
  }
}

// Create singleton instance
const supabaseManager = new SupabaseClientManager();

// Export the client getter and manager
export default {
  get supabase() { return supabaseManager.getClient(); },
  supabaseManager,
  testConnection: () => supabaseManager.testConnection(),
  getStatus: () => supabaseManager.getStatus(),
  reset: () => supabaseManager.reset()
};
