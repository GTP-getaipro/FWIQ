/**
 * Profile Service
 * 
 * This module provides a centralized service for managing user profile data.
 * It ensures consistent data handling and validation across the application.
 */

import { supabase } from '@/lib/customSupabaseClient';
import { ProfileValidator, validateProfileUpdate } from '@/lib/profileValidator';
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

/**
 * Profile service class for managing user profiles
 */
export class ProfileService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<UserProfile|null>} User profile or null if not found
   */
  static async getProfile(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found
          return null;
        }
        throw error;
      }

      // Validate the retrieved profile
      const validation = ProfileValidator.validateProfile(data);
      if (!validation.isValid) {
        logger.warn('Retrieved profile has validation issues:', validation.errors);
      }

      return data;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      errorHandler.handleError(error, { title: 'Profile Fetch Error' });
      throw error;
    }
  }

  /**
   * Create a new user profile
   * @param {string} userId - User ID
   * @param {Partial<UserProfile>} profileData - Initial profile data
   * @returns {Promise<UserProfile>} Created profile
   */
  static async createProfile(userId, profileData = {}) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Create basic profile structure
      const newProfile = {
        id: userId,
        business_type: profileData.business_type || null,
        onboarding_step: profileData.onboarding_step || 'email_integration',
        primary_provider: profileData.primary_provider || 'gmail',
        dual_provider_mode: profileData.dual_provider_mode || false,
        migration_enabled: profileData.migration_enabled !== undefined ? profileData.migration_enabled : true,
        client_config: profileData.client_config || null,
        managers: profileData.managers || [],
        suppliers: profileData.suppliers || [],
        email_labels: profileData.email_labels || null,
        ...profileData
      };

      // Validate the profile before creating
      const validation = ProfileValidator.validateProfile(newProfile);
      if (!validation.isValid) {
        throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Profile created successfully:', { userId, profileId: data.id });
      return data;
    } catch (error) {
      logger.error('Error creating profile:', error);
      errorHandler.handleError(error, { title: 'Profile Creation Error' });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Partial<UserProfile>} updates - Profile updates
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateProfile(userId, updates) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No updates provided');
      }

      // Validate the updates
      const validation = validateProfileUpdate(updates);
      if (!validation.isValid) {
        throw new Error(`Profile update validation failed: ${validation.errors.join(', ')}`);
      }

      // Get current profile to merge updates
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      // Merge updates with current profile
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Validate the complete updated profile
      const fullValidation = ProfileValidator.validateProfile(updatedProfile);
      if (!fullValidation.isValid) {
        throw new Error(`Updated profile validation failed: ${fullValidation.errors.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Profile updated successfully:', { userId, updatedFields: Object.keys(updates) });
      return data;
    } catch (error) {
      logger.error('Error updating profile:', error);
      errorHandler.handleError(error, { title: 'Profile Update Error' });
      throw error;
    }
  }

  /**
   * Update client configuration
   * @param {string} userId - User ID
   * @param {Partial<ClientConfig>} configUpdates - Configuration updates
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateClientConfig(userId, configUpdates) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!configUpdates || Object.keys(configUpdates).length === 0) {
        throw new Error('No configuration updates provided');
      }

      // Get current profile
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      // Merge client config updates
      const currentConfig = currentProfile.client_config || {};
      const updatedConfig = {
        ...currentConfig,
        ...configUpdates,
        version: (currentConfig.version || 0) + 1,
        client_id: userId
      };

      // Validate the updated configuration
      const configValidation = ProfileValidator.validateClientConfig(updatedConfig);
      if (!configValidation.isValid) {
        throw new Error(`Client config validation failed: ${configValidation.errors.join(', ')}`);
      }

      return await this.updateProfile(userId, { client_config: updatedConfig });
    } catch (error) {
      logger.error('Error updating client config:', error);
      errorHandler.handleError(error, { title: 'Configuration Update Error' });
      throw error;
    }
  }

  /**
   * Update business type
   * @param {string} userId - User ID
   * @param {BusinessType} businessType - New business type
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateBusinessType(userId, businessType) {
    try {
      if (!ProfileValidator.isValidBusinessType(businessType)) {
        throw new Error(`Invalid business type: ${businessType}`);
      }

      return await this.updateProfile(userId, { business_type: businessType });
    } catch (error) {
      logger.error('Error updating business type:', error);
      errorHandler.handleError(error, { title: 'Business Type Update Error' });
      throw error;
    }
  }

  /**
   * Update onboarding step
   * @param {string} userId - User ID
   * @param {OnboardingStep} step - New onboarding step
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateOnboardingStep(userId, step) {
    try {
      if (!ProfileValidator.isValidOnboardingStep(step)) {
        throw new Error(`Invalid onboarding step: ${step}`);
      }

      return await this.updateProfile(userId, { onboarding_step: step });
    } catch (error) {
      logger.error('Error updating onboarding step:', error);
      errorHandler.handleError(error, { title: 'Onboarding Step Update Error' });
      throw error;
    }
  }

  /**
   * Update managers list
   * @param {string} userId - User ID
   * @param {Manager[]} managers - Updated managers list
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateManagers(userId, managers) {
    try {
      const validation = ProfileValidator.validateManagers(managers);
      if (!validation.isValid) {
        throw new Error(`Managers validation failed: ${validation.errors.join(', ')}`);
      }

      return await this.updateProfile(userId, { managers });
    } catch (error) {
      logger.error('Error updating managers:', error);
      errorHandler.handleError(error, { title: 'Managers Update Error' });
      throw error;
    }
  }

  /**
   * Update suppliers list
   * @param {string} userId - User ID
   * @param {Supplier[]} suppliers - Updated suppliers list
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateSuppliers(userId, suppliers) {
    try {
      const validation = ProfileValidator.validateSuppliers(suppliers);
      if (!validation.isValid) {
        throw new Error(`Suppliers validation failed: ${validation.errors.join(', ')}`);
      }

      return await this.updateProfile(userId, { suppliers });
    } catch (error) {
      logger.error('Error updating suppliers:', error);
      errorHandler.handleError(error, { title: 'Suppliers Update Error' });
      throw error;
    }
  }

  /**
   * Update email labels
   * @param {string} userId - User ID
   * @param {EmailLabels} emailLabels - Updated email labels
   * @returns {Promise<UserProfile>} Updated profile
   */
  static async updateEmailLabels(userId, emailLabels) {
    try {
      return await this.updateProfile(userId, { email_labels: emailLabels });
    } catch (error) {
      logger.error('Error updating email labels:', error);
      errorHandler.handleError(error, { title: 'Email Labels Update Error' });
      throw error;
    }
  }

  /**
   * Check if user has completed onboarding
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if onboarding is complete
   */
  static async isOnboardingComplete(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.onboarding_step === 'completed';
    } catch (error) {
      logger.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Get user's current onboarding step
   * @param {string} userId - User ID
   * @returns {Promise<OnboardingStep|null>} Current onboarding step
   */
  static async getOnboardingStep(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.onboarding_step || null;
    } catch (error) {
      logger.error('Error getting onboarding step:', error);
      return null;
    }
  }

  /**
   * Get user's business type
   * @param {string} userId - User ID
   * @returns {Promise<BusinessType|null>} User's business type
   */
  static async getBusinessType(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.business_type || null;
    } catch (error) {
      logger.error('Error getting business type:', error);
      return null;
    }
  }

  /**
   * Get user's client configuration
   * @param {string} userId - User ID
   * @returns {Promise<ClientConfig|null>} User's client configuration
   */
  static async getClientConfig(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.client_config || null;
    } catch (error) {
      logger.error('Error getting client config:', error);
      return null;
    }
  }

  /**
   * Get user's managers
   * @param {string} userId - User ID
   * @returns {Promise<Manager[]>} User's managers list
   */
  static async getManagers(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.managers || [];
    } catch (error) {
      logger.error('Error getting managers:', error);
      return [];
    }
  }

  /**
   * Get user's suppliers
   * @param {string} userId - User ID
   * @returns {Promise<Supplier[]>} User's suppliers list
   */
  static async getSuppliers(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.suppliers || [];
    } catch (error) {
      logger.error('Error getting suppliers:', error);
      return [];
    }
  }

  /**
   * Delete user profile
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async deleteProfile(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      logger.info('Profile deleted successfully:', { userId });
    } catch (error) {
      logger.error('Error deleting profile:', error);
      errorHandler.handleError(error, { title: 'Profile Deletion Error' });
      throw error;
    }
  }

  /**
   * Sanitize profile data before saving
   * @param {UserProfile} profile - Profile to sanitize
   * @returns {UserProfile} Sanitized profile
   */
  static sanitizeProfile(profile) {
    return ProfileValidator.sanitizeProfile(profile);
  }

  /**
   * Validate profile data
   * @param {UserProfile} profile - Profile to validate
   * @returns {ValidationResult} Validation result
   */
  static validateProfile(profile) {
    return ProfileValidator.validateProfile(profile);
  }
}

export default ProfileService;
