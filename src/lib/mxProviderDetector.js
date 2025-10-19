/**
 * MX Record Provider Detector
 * 
 * Enhanced email provider detection using MX record lookups with caching
 * Supports both direct domain matching and MX record analysis
 */

// Note: Supabase import will be handled by the service layer
// This file contains the core detection logic without direct Supabase dependency

class MXProviderDetector {
  constructor() {
    // Known provider domains (for direct matching)
    this.gmailDomains = [
      'gmail.com',
      'googlemail.com'
    ];

    this.outlookDomains = [
      'outlook.com',
      'hotmail.com',
      'live.com',
      'msn.com'
    ];

    // MX record patterns for provider detection
    this.mxPatterns = {
      google: [
        /aspmx\.l\.google\.com/i,
        /alt\d+\.aspmx\.l\.google\.com/i,
        /aspmx\d+\.googlemail\.com/i,
        /googlemail\.com/i,
        /google\.com/i
      ],
      microsoft: [
        /\.outlook\.com/i,
        /\.outlook\.protection\.outlook\.com/i,
        /\.protection\.outlook\.com/i,
        /\.mail\.protection\.outlook\.com/i,
        /\.prod\.outlook\.com/i,
        /\.outlook\.office365\.com/i,
        /\.mail\.eo\.outlook\.com/i
      ]
    };

    // Cache expiration time (30 days)
    this.cacheExpirationDays = 30;
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string|null} - Domain or null
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const emailRegex = /^[^\s@]+@([^\s@]+)$/;
    const match = email.match(emailRegex);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Check if domain is directly known (no MX lookup needed)
   * @param {string} domain - Domain to check
   * @returns {string|null} - Provider or null
   */
  getKnownProvider(domain) {
    if (this.gmailDomains.includes(domain)) {
      return 'gmail';
    }
    if (this.outlookDomains.includes(domain)) {
      return 'outlook';
    }
    return null;
  }

  // Note: Cache methods moved to MXProviderService to avoid Supabase dependency

  /**
   * Perform MX record lookup
   * @param {string} domain - Domain to lookup
   * @returns {Promise<Object>} - MX lookup result
   */
  async lookupMXRecords(domain) {
    try {
      // This would typically be done on the backend
      // For now, we'll simulate the MX lookup
      // In production, this should call your backend API
      
      const response = await fetch('/api/auth/detect-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: `test@${domain}` })
      });

      if (!response.ok) {
        throw new Error(`MX lookup failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        provider: result.provider,
        mxRecords: result.mxRecords || [],
        method: 'mx_lookup'
      };
    } catch (error) {
      console.error('MX lookup error:', error);
      return {
        success: false,
        error: error.message,
        method: 'mx_lookup_failed'
      };
    }
  }

  /**
   * Analyze MX records to determine provider
   * @param {Array} mxRecords - MX records from DNS lookup
   * @returns {string} - Detected provider
   */
  analyzeMXRecords(mxRecords) {
    if (!mxRecords || mxRecords.length === 0) {
      return 'unknown';
    }

    // Check for Google MX patterns
    for (const record of mxRecords) {
      for (const pattern of this.mxPatterns.google) {
        if (pattern.test(record.exchange)) {
          return 'gmail';
        }
      }
    }

    // Check for Microsoft MX patterns
    for (const record of mxRecords) {
      for (const pattern of this.mxPatterns.microsoft) {
        if (pattern.test(record.exchange)) {
          return 'outlook';
        }
      }
    }

    return 'unknown';
  }

  // Note: Full detection and cache methods moved to MXProviderService

  /**
   * Get OAuth scopes for provider
   * @param {string} provider - Provider
   * @returns {string|null} - OAuth scopes
   */
  getOAuthScopes(provider) {
    switch (provider) {
      case 'gmail':
        return 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
      case 'outlook':
        return 'Mail.ReadWrite Mail.Read offline_access User.Read MailboxSettings.ReadWrite';
      default:
        return null;
    }
  }

  /**
   * Get Supabase provider name
   * @param {string} provider - Provider
   * @returns {string|null} - Supabase provider name
   */
  getSupabaseProvider(provider) {
    switch (provider) {
      case 'gmail':
        return 'google';
      case 'outlook':
        return 'azure';
      default:
        return null;
    }
  }

  /**
   * Get display name for provider
   * @param {string} provider - Provider
   * @returns {string} - Display name
   */
  getDisplayName(provider) {
    switch (provider) {
      case 'gmail':
        return 'Gmail';
      case 'outlook':
        return 'Outlook';
      case 'unknown':
        return 'Unknown Provider';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if provider is supported
   * @param {string} provider - Provider
   * @returns {boolean} - Is supported
   */
  isSupported(provider) {
    return ['gmail', 'outlook'].includes(provider);
  }

  /**
   * Log message (can be overridden for testing)
   * @param {string} message - Message to log
   */
  log(message) {
    console.log(`[MXProviderDetector] ${message}`);
  }
}

// Export singleton instance
export const mxProviderDetector = new MXProviderDetector();

// Export class for testing
export { MXProviderDetector };
