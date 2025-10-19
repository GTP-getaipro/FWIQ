import { supabase } from '@/lib/customSupabaseClient';

/**
 * OnboardingDataAggregator - Collects and manages onboarding data for n8n automation
 * Minimal changes approach - adds data collection without breaking existing functionality
 */
export class OnboardingDataAggregator {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Store data for a specific onboarding step
   * @param {string} step - The onboarding step name
   * @param {object} data - The data to store
   * @returns {Promise<boolean>} - Success status
   */
  async storeStepData(step, data) {
    try {
      const { error } = await supabase
        .from('onboarding_data')
        .upsert({
          user_id: this.userId,
          step: step,
          data: data,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,step'
        });

      if (error) {
        console.error(`Error storing ${step} data:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Exception storing ${step} data:`, error);
      return false;
    }
  }

  /**
   * Get all collected onboarding data for the user
   * @returns {Promise<object|null>} - Aggregated data or null if error
   */
  async getAllData() {
    try {
      const { data, error } = await supabase
        .from('onboarding_data_aggregated')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        console.error('Error fetching aggregated onboarding data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching aggregated onboarding data:', error);
      return null;
    }
  }

  /**
   * Get data for a specific step
   * @param {string} step - The step name
   * @returns {Promise<object|null>} - Step data or null if not found
   */
  async getStepData(step) {
    try {
      const { data, error } = await supabase
        .from('onboarding_data')
        .select('data')
        .eq('user_id', this.userId)
        .eq('step', step)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error(`Error fetching ${step} data:`, error);
        }
        return null;
      }

      return data?.data || null;
    } catch (error) {
      console.error(`Exception fetching ${step} data:`, error);
      return null;
    }
  }

  /**
   * Prepare data for n8n automation
   * @returns {Promise<object|null>} - Formatted data for n8n or null if incomplete
   */
  async prepareN8nData() {
    try {
      const aggregatedData = await this.getAllData();
      if (!aggregatedData || !aggregatedData.all_data) {
        return null;
      }

      const data = aggregatedData.all_data;
      
      // Extract and structure data for n8n
      const n8nData = {
        id: this.userId,
        version: 1,
        
        // User data from registration
        user: data.registration || {},
        
        // Email integration data
        emailIntegration: data.email_integration || {},
        
        // Business configuration
        business: {
          type: data.business_type?.businessType || data.business_type?.primaryBusinessType || '',
          types: data.business_type?.businessTypes || (data.business_type?.businessType ? [data.business_type.businessType] : []),
          primaryType: data.business_type?.primaryBusinessType || data.business_type?.businessType || '',
          info: {
            ...data.business_information?.business,
            types: data.business_information?.business?.types || [],
            primaryType: data.business_information?.business?.primaryType || ''
          },
          contact: data.business_information?.contact || {},
          services: data.business_information?.services || [],
          rules: data.business_information?.rules || {}
        },
        
        // Team structure
        team: {
          managers: data.team_setup?.managers || [],
          suppliers: data.team_setup?.suppliers || []
        },
        
        // Email labels
        emailLabels: data.label_provisioning?.labels || {},
        
        // AI configuration
        aiConfig: data.label_mapping?.aiConfig || {},
        
        // Metadata
        metadata: {
          startedAt: aggregatedData.started_at,
          completedAt: aggregatedData.completed_at,
          totalSteps: aggregatedData.total_steps,
          stepTimestamps: aggregatedData.step_timestamps
        }
      };

      return n8nData;
    } catch (error) {
      console.error('Exception preparing n8n data:', error);
      return null;
    }
  }

  /**
   * Check if all required data is present for n8n automation
   * @returns {Promise<object>} - Validation result with status and missing fields
   */
  async validateAutomationReadiness() {
    try {
      const aggregatedData = await this.getAllData();
      if (!aggregatedData) {
        return {
          isReady: false,
          missing: ['No onboarding data found'],
          status: 'incomplete'
        };
      }

      const data = aggregatedData.all_data;
      const missing = [];
      
      // Check required data points
      if (!data.registration?.email) missing.push('User registration data');
      if (!data.email_integration?.provider) missing.push('Email provider integration');
      if (!data.business_type?.businessType) missing.push('Business type selection');
      if (!data.business_information?.business?.name) missing.push('Business information');
      if (!data.team_setup?.managers?.length) missing.push('Team managers setup');
      if (!data.label_provisioning?.labels) missing.push('Email labels provisioning');

      return {
        isReady: missing.length === 0,
        missing: missing,
        status: missing.length === 0 ? 'ready' : 'incomplete',
        data: aggregatedData
      };
    } catch (error) {
      console.error('Exception validating automation readiness:', error);
      return {
        isReady: false,
        missing: ['Validation error'],
        status: 'error'
      };
    }
  }

  /**
   * Clear all onboarding data for the user (useful for testing)
   * @returns {Promise<boolean>} - Success status
   */
  async clearAllData() {
    try {
      const { error } = await supabase
        .from('onboarding_data')
        .delete()
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error clearing onboarding data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception clearing onboarding data:', error);
      return false;
    }
  }
}

/**
 * Convenience function to get aggregator instance for current user
 * @param {string} userId - The user ID
 * @returns {OnboardingDataAggregator} - Aggregator instance
 */
export const getOnboardingAggregator = (userId) => {
  return new OnboardingDataAggregator(userId);
};

/**
 * Hook for React components to use the aggregator
 * @param {string} userId - The user ID
 * @returns {object} - Aggregator methods
 */
export const useOnboardingData = (userId) => {
  const aggregator = new OnboardingDataAggregator(userId);
  
  return {
    storeStepData: aggregator.storeStepData.bind(aggregator),
    getAllData: aggregator.getAllData.bind(aggregator),
    getStepData: aggregator.getStepData.bind(aggregator),
    prepareN8nData: aggregator.prepareN8nData.bind(aggregator),
    validateAutomationReadiness: aggregator.validateAutomationReadiness.bind(aggregator),
    clearAllData: aggregator.clearAllData.bind(aggregator)
  };
};



