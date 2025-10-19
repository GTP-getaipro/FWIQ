/**
 * FloWorx Main Service
 * Core service for managing FloWorx functionality
 */

import { supabase } from './customSupabaseClient';

export class FloWorxService {
  constructor() {
    this.serviceName = 'FloWorx';
    this.version = '2.0.0';
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    try {
      // Check database connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        return {
          status: 'unhealthy',
          database: 'disconnected',
          error: error.message
        };
      }

      return {
        status: 'healthy',
        database: 'connected',
        service: this.serviceName,
        version: this.version,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get user integrations
   */
  async getUserIntegrations(userId) {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to fetch integrations: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get user integrations:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select();

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data[0];

    } catch (error) {
      console.error('Failed to create/update profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return data || null;

    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Update onboarding step
   */
  async updateOnboardingStep(userId, step) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          onboarding_step: step,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        throw new Error(`Failed to update onboarding step: ${error.message}`);
      }

      return data[0];

    } catch (error) {
      console.error('Failed to update onboarding step:', error);
      throw error;
    }
  }

  /**
   * Get business presets
   */
  async getBusinessPresets() {
    // This would typically come from a database or configuration
    return {
      'hot-tub-service': {
        name: 'Hot Tub Service',
        description: 'Hot tub maintenance and service business',
        defaultLabels: ['inquiry', 'booking', 'maintenance', 'billing']
      },
      'pool-service': {
        name: 'Pool Service',
        description: 'Swimming pool maintenance and service',
        defaultLabels: ['inquiry', 'booking', 'maintenance', 'billing']
      },
      'landscaping': {
        name: 'Landscaping',
        description: 'Landscaping and lawn care services',
        defaultLabels: ['inquiry', 'booking', 'maintenance', 'billing']
      }
    };
  }
}

export const floworxService = new FloWorxService();
