/**
 * MX Provider Service
 * 
 * Frontend service for calling the MX-based provider detection API
 */

import { mxProviderDetector } from './mxProviderDetector';

class MXProviderService {
  constructor() {
    // Use import.meta.env for Vite environment variables with safe fallbacks
    this.apiBaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';
    
    // Validate configuration
    if (this.apiBaseUrl.includes('your-project-id') || this.apiKey.includes('your-anon-key')) {
      console.warn('MXProviderService: Using placeholder Supabase credentials. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
  }

  /**
   * Detect provider using MX records
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

    // Check if it's a known domain first (no API call needed)
    const knownProvider = mxProviderDetector.getKnownProvider(domain);
    if (knownProvider) {
      return {
        provider: knownProvider,
        confidence: 1.0,
        domain: domain,
        method: 'known_domain'
      };
    }

    try {
      // Call the backend API for MX lookup
      const response = await fetch(`${this.apiBaseUrl}/functions/v1/detect-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        provider: result.provider,
        confidence: result.confidence,
        domain: result.domain,
        method: result.method,
        cached: result.cached,
        mxRecords: result.mxRecords,
        error: result.error
      };

    } catch (error) {
      console.error('Provider detection API error:', error);
      
      // Fallback: return unknown provider if API fails
      // Note: In a full implementation, you could implement client-side caching here

      return {
        provider: 'unknown',
        confidence: 0.1,
        domain: domain,
        error: error.message,
        method: 'api_error'
      };
    }
  }

  /**
   * Invalidate cache for a client (typically called on redeploy)
   * @param {string} clientId - Client ID
   * @param {Array} domains - Optional specific domains to invalidate
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateCache(clientId, domains = null) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/functions/v1/invalidate-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ 
          clientId,
          domains 
        })
      });

      if (!response.ok) {
        throw new Error(`Cache invalidation failed: ${response.status}`);
      }

      const result = await response.json();
      return result.success;

    } catch (error) {
      console.error('Cache invalidation error:', error);
      return false;
    }
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
}

// Export singleton instance
export const mxProviderService = new MXProviderService();

// Export class for testing
export { MXProviderService };
