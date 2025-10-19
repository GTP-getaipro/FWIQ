/**
 * Multi-Business State Manager
 * Handles both single business and multi-business states for users
 */

import { supabase } from './customSupabaseClient';

export class MultiBusinessStateManager {
  constructor(userId) {
    this.userId = userId;
    this.currentState = null;
    this.listeners = [];
  }

  /**
   * Get the current business state for the user
   * @returns {Promise<Object>} Business state object
   */
  async getBusinessState() {
    try {
      const { data, error } = await supabase.rpc('get_user_business_state', {
        user_uuid: this.userId
      });

      if (error) {
        console.error('Error getting business state:', error);
        return this.getDefaultState();
      }

      this.currentState = data;
      this.notifyListeners();
      return data;
    } catch (error) {
      console.error('Error in getBusinessState:', error);
      return this.getDefaultState();
    }
  }

  /**
   * Switch to a different business type (for multi-business users)
   * @param {string} businessType - The business type to switch to
   * @returns {Promise<boolean>} Success status
   */
  async switchBusinessType(businessType) {
    try {
      const { data, error } = await supabase.rpc('switch_active_business_type', {
        user_uuid: this.userId,
        new_active_type: businessType
      });

      if (error) {
        console.error('Error switching business type:', error);
        return false;
      }

      if (data) {
        // Refresh the state
        await this.getBusinessState();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in switchBusinessType:', error);
      return false;
    }
  }

  /**
   * Get labels for the currently active business type
   * @returns {Promise<Array>} Array of labels
   */
  async getActiveBusinessLabels() {
    try {
      const { data, error } = await supabase.rpc('get_labels_for_active_business', {
        user_uuid: this.userId
      });

      if (error) {
        console.error('Error getting active business labels:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveBusinessLabels:', error);
      return [];
    }
  }

  /**
   * Check if user is in multi-business mode
   * @returns {boolean}
   */
  isMultiBusiness() {
    return this.currentState?.isMultiBusiness || false;
  }

  /**
   * Get the currently active business type
   * @returns {string}
   */
  getActiveBusinessType() {
    return this.currentState?.activeBusinessType || 'General';
  }

  /**
   * Get all available business types for the user
   * @returns {Array<string>}
   */
  getAllBusinessTypes() {
    return this.currentState?.allBusinessTypes || [];
  }

  /**
   * Get the business mode (single or multi)
   * @returns {string}
   */
  getBusinessMode() {
    return this.currentState?.mode || 'single';
  }

  /**
   * Add a listener for state changes
   * @param {Function} callback - Function to call when state changes
   */
  addStateChangeListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a state change listener
   * @param {Function} callback - Function to remove
   */
  removeStateChangeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  /**
   * Get default state when no data is available
   * @returns {Object}
   */
  getDefaultState() {
    return {
      mode: 'single',
      activeBusinessType: 'General',
      allBusinessTypes: ['General'],
      primaryBusinessType: 'General',
      profileId: null,
      isMultiBusiness: false
    };
  }

  /**
   * Create or update business profile for user
   * @param {Array<string>} businessTypes - Array of business types
   * @param {string} primaryType - Primary business type
   * @param {Object} clientConfig - Client configuration
   * @returns {Promise<boolean>} Success status
   */
  async createOrUpdateBusinessProfile(businessTypes, primaryType, clientConfig = {}) {
    try {
      const businessMode = businessTypes.length > 1 ? 'multi' : 'single';
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', this.userId)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('business_profiles')
          .update({
            business_types: businessTypes,
            primary_business_type: primaryType,
            active_business_type: primaryType,
            business_mode: businessMode,
            client_config: clientConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);

        if (error) {
          console.error('Error updating business profile:', error);
          return false;
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('business_profiles')
          .insert({
            user_id: this.userId,
            business_types: businessTypes,
            primary_business_type: primaryType,
            active_business_type: primaryType,
            business_mode: businessMode,
            client_config: clientConfig
          });

        if (error) {
          console.error('Error creating business profile:', error);
          return false;
        }
      }

      // Refresh state
      await this.getBusinessState();
      return true;
    } catch (error) {
      console.error('Error in createOrUpdateBusinessProfile:', error);
      return false;
    }
  }
}

// Create a singleton instance for the current user
let businessStateManager = null;

export const getBusinessStateManager = (userId) => {
  if (!businessStateManager || businessStateManager.userId !== userId) {
    businessStateManager = new MultiBusinessStateManager(userId);
  }
  return businessStateManager;
};

// React hook for using business state
export const useBusinessState = (userId) => {
  const [state, setState] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;

    const manager = getBusinessStateManager(userId);
    
    // Initial load
    manager.getBusinessState().then(state => {
      setState(state);
      setLoading(false);
    });

    // Listen for changes
    const handleStateChange = (newState) => {
      setState(newState);
    };

    manager.addStateChangeListener(handleStateChange);

    return () => {
      manager.removeStateChangeListener(handleStateChange);
    };
  }, [userId]);

  return {
    state,
    loading,
    isMultiBusiness: state?.isMultiBusiness || false,
    activeBusinessType: state?.activeBusinessType || 'General',
    allBusinessTypes: state?.allBusinessTypes || [],
    businessMode: state?.mode || 'single',
    switchBusinessType: (type) => getBusinessStateManager(userId).switchBusinessType(type),
    getActiveLabels: () => getBusinessStateManager(userId).getActiveBusinessLabels()
  };
};

