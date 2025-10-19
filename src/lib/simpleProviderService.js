/**
 * Simple Provider Service
 * 
 * Fallback service that works without backend API calls
 * Uses only known domain detection for immediate functionality
 */

import { mxProviderDetector } from './mxProviderDetector';

class SimpleProviderService {
  constructor() {
    // No API dependencies - works offline
  }

  /**
   * Detect provider using only known domains (no API calls)
   * @param {string} email - Email address to analyze
   * @returns {Promise<Object>} - Detection result
   */
  async detectProvider(email) {
    if (!email || typeof email !== 'string') {
      return {
        provider: null,
        confidence: 0,
        domain: null,
        error: 'Invalid email address',
        method: 'validation_error'
      };
    }

    const domain = mxProviderDetector.extractDomain(email);
    if (!domain) {
      return {
        provider: null,
        confidence: 0,
        domain: null,
        error: 'Could not extract domain from email',
        method: 'domain_extraction_error'
      };
    }

    // Check if it's a known domain
    const knownProvider = mxProviderDetector.getKnownProvider(domain);
    if (knownProvider) {
      return {
        provider: knownProvider,
        confidence: 1.0,
        domain: domain,
        method: 'known_domain'
      };
    }

    // For unknown domains, return unknown (no API call)
    return {
      provider: 'unknown',
      confidence: 0.1,
      domain: domain,
      error: 'Custom domain - MX lookup not available',
      method: 'known_domain_only'
    };
  }

  /**
   * Get OAuth scopes for provider
   * @param {string} provider - Provider
   * @returns {string|null} - OAuth scopes
   */
  getOAuthScopes(provider) {
    return mxProviderDetector.getOAuthScopes(provider);
  }

  /**
   * Get Supabase provider name
   * @param {string} provider - Provider
   * @returns {string|null} - Supabase provider name
   */
  getSupabaseProvider(provider) {
    return mxProviderDetector.getSupabaseProvider(provider);
  }

  /**
   * Get display name for provider
   * @param {string} provider - Provider
   * @returns {string} - Display name
   */
  getDisplayName(provider) {
    return mxProviderDetector.getDisplayName(provider);
  }

  /**
   * Check if provider is supported
   * @param {string} provider - Provider
   * @returns {boolean} - Is supported
   */
  isSupported(provider) {
    return mxProviderDetector.isSupported(provider);
  }

  /**
   * Get provider icon/logo
   * @param {string} provider - Provider
   * @returns {string} - Icon URL
   */
  getProviderIcon(provider) {
    switch (provider) {
      case 'gmail':
        return 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg';
      case 'outlook':
        return 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg';
      default:
        return null;
    }
  }

  /**
   * Placeholder for cache invalidation (not implemented in simple version)
   */
  async invalidateCache(clientId, domains = null) {
    console.log('Cache invalidation not implemented in simple mode');
    return false;
  }
}

// Export singleton instance
export const simpleProviderService = new SimpleProviderService();

// Export class for testing
export { SimpleProviderService };
