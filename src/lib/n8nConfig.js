/**
 * N8N Configuration
 * 
 * Centralized configuration for N8N API access
 * Uses environment variables with sensible defaults
 */

/**
 * Get N8N configuration from environment variables
 * @returns {Object} N8N configuration
 */
export function getN8nConfig() {
  const config = {
    baseUrl: import.meta.env.N8N_BASE_URL ||
             import.meta.env.VITE_N8N_BASE_URL ||
             import.meta.env.VITE_N8N_API_URL,

    apiKey: import.meta.env.N8N_API_KEY ||
            import.meta.env.VITE_N8N_API_KEY,

    apiVersion: '/api/v1', // Official N8N Public API version

    // OAuth client credentials
    gmail: {
      clientId: import.meta.env.VITE_GMAIL_CLIENT_ID ||
                import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GMAIL_CLIENT_SECRET ||
                    import.meta.env.VITE_GOOGLE_CLIENT_SECRET
    },

    outlook: {
      clientId: import.meta.env.VITE_OUTLOOK_CLIENT_ID ||
                import.meta.env.VITE_MICROSOFT_CLIENT_ID,
      clientSecret: import.meta.env.VITE_OUTLOOK_CLIENT_SECRET ||
                    import.meta.env.VITE_MICROSOFT_CLIENT_SECRET
    }
  };

  // Validate required configuration
  if (!config.apiKey) {
    console.warn('⚠️ N8N API key not configured - API calls may fail');
  }

  if (!config.baseUrl) {
    console.warn('⚠️ N8N base URL not configured - using default');
  }

  // Log configuration (redact sensitive data)
  console.log('🔧 N8N Configuration:', {
    baseUrl: config.baseUrl,
    apiKeySet: !!config.apiKey,
    apiKeyPrefix: config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'NOT SET',
    apiVersion: config.apiVersion,
    gmailClientIdSet: !!config.gmail.clientId,
    outlookClientIdSet: !!config.outlook.clientId
  });

  return config;
}

/**
 * Build full API URL
 * @param {string} endpoint - API endpoint (e.g., '/workflows')
 * @returns {string} Full URL
 */
export function buildApiUrl(endpoint) {
  const config = getN8nConfig();
  const cleanBase = config.baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If endpoint already includes /api/v1, don't add it again
  if (cleanEndpoint.startsWith('/api/v1')) {
    return `${cleanBase}${cleanEndpoint}`;
  }
  
  return `${cleanBase}${config.apiVersion}${cleanEndpoint}`;
}

/**
 * Get API headers
 * @returns {Object} Headers object
 */
export function getApiHeaders() {
  const config = getN8nConfig();
  
  return {
    'X-N8N-API-KEY': config.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Validate N8N configuration
 * @returns {Object} Validation result
 */
export function validateN8nConfig() {
  const config = getN8nConfig();
  const errors = [];
  const warnings = [];

  // Check required fields
  if (!config.apiKey) {
    errors.push('N8N API key is not configured');
  }

  if (!config.baseUrl) {
    errors.push('N8N base URL is not configured');
  }

  // Check API key format (should be a JWT)
  if (config.apiKey && !config.apiKey.includes('.')) {
    warnings.push('N8N API key does not appear to be a valid JWT token');
  }

  // Check OAuth credentials
  if (!config.gmail.clientId) {
    warnings.push('Gmail OAuth client ID not configured');
  }

  if (!config.gmail.clientSecret) {
    warnings.push('Gmail OAuth client secret not configured');
  }

  if (!config.outlook.clientId) {
    warnings.push('Outlook OAuth client ID not configured');
  }

  if (!config.outlook.clientSecret) {
    warnings.push('Outlook OAuth client secret not configured');
  }

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    errors,
    warnings,
    config: {
      baseUrl: config.baseUrl,
      apiKeySet: !!config.apiKey,
      gmailConfigured: !!(config.gmail.clientId && config.gmail.clientSecret),
      outlookConfigured: !!(config.outlook.clientId && config.outlook.clientSecret)
    }
  };
}

// Export default config
export default getN8nConfig();


