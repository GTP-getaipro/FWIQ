/**
 * Provider Validation Service
 * 
 * Ensures one provider per user and handles provider validation
 */

import { supabase } from '@/lib/customSupabaseClient';
import { emailProviderDetector } from './emailProviderDetector';

class ProviderValidationService {
  /**
   * Check if user already has a provider connected
   * @param {string} userId - User ID
   * @param {string} excludeProvider - Provider to exclude from check (for updates)
   * @returns {Object} Validation result
   */
  async checkExistingProvider(userId, excludeProvider = null) {
    try {
      // Check new n8n credential mappings
      const { data: mappings, error: mappingError } = await supabase
        .from('client_credentials_map')
        .select('provider, business_name, created_at')
        .eq('client_id', userId);

      if (mappingError) {
        console.error('Error checking credential mappings:', mappingError);
      }

      // Check old integrations table as fallback
      const { data: integrations, error: integrationError } = await supabase
        .from('integrations')
        .select('provider, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (integrationError) {
        console.error('Error checking integrations:', integrationError);
      }

      const existingProviders = [];

      // Process mappings
      if (mappings && mappings.length > 0) {
        mappings.forEach(mapping => {
          if (!excludeProvider || mapping.provider !== excludeProvider) {
            existingProviders.push({
              provider: mapping.provider,
              type: 'n8n_mapping',
              businessName: mapping.business_name,
              createdAt: mapping.created_at
            });
          }
        });
      }

      // Process integrations (fallback)
      if (integrations && integrations.length > 0) {
        integrations.forEach(integration => {
          const supabaseProvider = emailProviderDetector.getSupabaseProvider(integration.provider);
          if (!excludeProvider || integration.provider !== excludeProvider) {
            existingProviders.push({
              provider: integration.provider,
              type: 'legacy_integration',
              createdAt: integration.created_at
            });
          }
        });
      }

      return {
        hasExistingProvider: existingProviders.length > 0,
        existingProviders,
        count: existingProviders.length
      };

    } catch (error) {
      console.error('Provider validation error:', error);
      return {
        hasExistingProvider: false,
        existingProviders: [],
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Validate if user can add a new provider
   * @param {string} userId - User ID
   * @param {string} newProvider - Provider to add
   * @returns {Object} Validation result
   */
  async validateNewProvider(userId, newProvider) {
    try {
      const existingCheck = await this.checkExistingProvider(userId, newProvider);

      if (existingCheck.hasExistingProvider) {
        const existingProvider = existingCheck.existingProviders[0];
        return {
          canAdd: false,
          reason: 'already_has_provider',
          existingProvider: existingProvider.provider,
          existingProviderDisplay: emailProviderDetector.getDisplayName(existingProvider.provider),
          message: `You already have ${emailProviderDetector.getDisplayName(existingProvider.provider)} connected. You can only connect one email provider per account.`
        };
      }

      return {
        canAdd: true,
        reason: 'no_existing_provider'
      };

    } catch (error) {
      console.error('Provider validation error:', error);
      return {
        canAdd: false,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  /**
   * Get user's current provider
   * @param {string} userId - User ID
   * @returns {Object} Current provider info
   */
  async getCurrentProvider(userId) {
    try {
      const existingCheck = await this.checkExistingProvider(userId);

      if (existingCheck.hasExistingProvider) {
        const provider = existingCheck.existingProviders[0];
        return {
          hasProvider: true,
          provider: provider.provider,
          displayName: emailProviderDetector.getDisplayName(provider.provider),
          type: provider.type,
          businessName: provider.businessName,
          createdAt: provider.createdAt
        };
      }

      return {
        hasProvider: false,
        provider: null
      };

    } catch (error) {
      console.error('Error getting current provider:', error);
      return {
        hasProvider: false,
        provider: null,
        error: error.message
      };
    }
  }

  /**
   * Validate email domain for provider detection
   * @param {string} email - Email address
   * @returns {Object} Validation result
   */
  validateEmailDomain(email) {
    const detection = emailProviderDetector.detectProvider(email);
    
    if (!detection.provider) {
      return {
        isValid: false,
        error: detection.error,
        supportedDomains: detection.supportedDomains
      };
    }

    return {
      isValid: true,
      provider: detection.provider,
      displayName: emailProviderDetector.getDisplayName(detection.provider),
      confidence: detection.confidence
    };
  }

  /**
   * Check if user's email matches their connected provider
   * @param {string} userId - User ID
   * @param {string} userEmail - User's email address
   * @returns {Object} Validation result
   */
  async validateEmailProviderMatch(userId, userEmail) {
    try {
      const currentProvider = await this.getCurrentProvider(userId);
      const emailValidation = this.validateEmailDomain(userEmail);

      if (!currentProvider.hasProvider) {
        return {
          isValid: true,
          canProceed: true,
          reason: 'no_existing_provider'
        };
      }

      if (!emailValidation.isValid) {
        return {
          isValid: false,
          canProceed: false,
          reason: 'invalid_email_domain',
          error: emailValidation.error
        };
      }

      if (currentProvider.provider === emailValidation.provider) {
        return {
          isValid: true,
          canProceed: true,
          reason: 'provider_matches'
        };
      }

      return {
        isValid: false,
        canProceed: false,
        reason: 'provider_mismatch',
        currentProvider: currentProvider.displayName,
        emailProvider: emailValidation.displayName,
        message: `Your email is ${emailValidation.displayName} but you have ${currentProvider.displayName} connected. Please use a ${currentProvider.displayName} email or disconnect the current provider.`
      };

    } catch (error) {
      console.error('Email provider validation error:', error);
      return {
        isValid: false,
        canProceed: false,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  /**
   * Get provider requirements and restrictions
   * @returns {Object} Provider requirements
   */
  getProviderRequirements() {
    return {
      supportedProviders: ['gmail', 'outlook'],
      supportedDomains: {
        gmail: ['gmail.com', 'googlemail.com'],
        outlook: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']
      },
      restrictions: {
        oneProviderPerUser: true,
        emailDomainMustMatch: true,
        autoDetectionEnabled: true
      },
      messages: {
        unsupportedDomain: 'We currently only support Gmail and Outlook email addresses.',
        alreadyConnected: 'You can only connect one email provider per account.',
        providerMismatch: 'Your email domain must match your connected provider.'
      }
    };
  }
}

// Export singleton instance
export const providerValidationService = new ProviderValidationService();

// Export class for testing
export { ProviderValidationService };
