/**
 * Email Provider Detection Utility
 * 
 * Automatically detects email provider (Gmail/Outlook) based on email domain
 * Supports gmail.com, outlook.com and their variants
 */

class EmailProviderDetector {
  constructor() {
    // Gmail domains
    this.gmailDomains = [
      'gmail.com',
      'googlemail.com'
    ];

    // Outlook domains
    this.outlookDomains = [
      'outlook.com',
      'hotmail.com',
      'live.com',
      'msn.com'
    ];

    // Office 365 domains (these are typically Outlook)
    this.office365Domains = [
      'office365.com',
      'onmicrosoft.com'
    ];
  }

  /**
   * Detect email provider from email address
   * @param {string} email - Email address to analyze
   * @returns {Object} - Provider detection result
   */
  detectProvider(email) {
    if (!email || typeof email !== 'string') {
      return {
        provider: null,
        confidence: 0,
        domain: null,
        error: 'Invalid email address'
      };
    }

    // Extract domain from email
    const domain = this.extractDomain(email.toLowerCase());
    
    if (!domain) {
      return {
        provider: null,
        confidence: 0,
        domain: null,
        error: 'Could not extract domain from email'
      };
    }

    // Check Gmail domains
    if (this.gmailDomains.includes(domain)) {
      return {
        provider: 'gmail',
        confidence: 1.0,
        domain: domain,
        method: 'exact_match'
      };
    }

    // Check Outlook domains
    if (this.outlookDomains.includes(domain)) {
      return {
        provider: 'outlook',
        confidence: 1.0,
        domain: domain,
        method: 'exact_match'
      };
    }

    // Check Office 365 domains
    if (this.office365Domains.includes(domain)) {
      return {
        provider: 'outlook',
        confidence: 0.9,
        domain: domain,
        method: 'office365_domain'
      };
    }

    // Check for Microsoft-related subdomains
    if (this.isMicrosoftDomain(domain)) {
      return {
        provider: 'outlook',
        confidence: 0.8,
        domain: domain,
        method: 'microsoft_domain'
      };
    }

    // Check for Google-related subdomains
    if (this.isGoogleDomain(domain)) {
      return {
        provider: 'gmail',
        confidence: 0.8,
        domain: domain,
        method: 'google_domain'
      };
    }

    // Default: unsupported domain
    return {
      provider: null,
      confidence: 0,
      domain: domain,
      error: 'Unsupported email domain. We currently support Gmail and Outlook only.',
      supportedDomains: [...this.gmailDomains, ...this.outlookDomains]
    };
  }

  /**
   * Extract domain from email address
   * @param {string} email - Email address
   * @returns {string|null} - Domain part or null
   */
  extractDomain(email) {
    const emailRegex = /^[^\s@]+@([^\s@]+)$/;
    const match = email.match(emailRegex);
    return match ? match[1] : null;
  }

  /**
   * Check if domain is Microsoft-related
   * @param {string} domain - Domain to check
   * @returns {boolean}
   */
  isMicrosoftDomain(domain) {
    const microsoftIndicators = [
      'microsoft',
      'office365',
      'outlook',
      'live',
      'hotmail',
      'msn'
    ];

    return microsoftIndicators.some(indicator => 
      domain.includes(indicator)
    );
  }

  /**
   * Check if domain is Google-related
   * @param {string} domain - Domain to check
   * @returns {boolean}
   */
  isGoogleDomain(domain) {
    const googleIndicators = [
      'google',
      'gmail',
      'googlemail',
      'googlegroups'
    ];

    return googleIndicators.some(indicator => 
      domain.includes(indicator)
    );
  }

  /**
   * Get OAuth provider name for Supabase
   * @param {string} provider - Provider from detection
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
   * Get OAuth scopes for provider
   * @param {string} provider - Provider from detection
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
   * Validate if email domain is supported
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isSupported(email) {
    const detection = this.detectProvider(email);
    return detection.provider !== null && detection.confidence > 0.5;
  }

  /**
   * Get user-friendly provider name
   * @param {string} provider - Provider from detection
   * @returns {string}
   */
  getDisplayName(provider) {
    switch (provider) {
      case 'gmail':
        return 'Gmail';
      case 'outlook':
        return 'Outlook';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get provider icon/logo
   * @param {string} provider - Provider from detection
   * @returns {string}
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
export const emailProviderDetector = new EmailProviderDetector();

// Export class for testing
export { EmailProviderDetector };
