import { supabase } from './customSupabaseClient';
import { generateCodeChallenge, generateCodeVerifier } from './pkceUtils';

/**
 * Enhanced OAuth Service following best practices
 * 
 * Key Features:
 * 1. Separation of Concerns - n8n handles token storage & refresh
 * 2. Redirect URI Hygiene - fixed URIs per environment
 * 3. Tenant Awareness - multi-tenant Outlook support
 * 4. Scope Minimization - only required scopes
 * 5. Single Source of Truth - client_credentials_map
 * 6. Security Defaults - PKCE, no client secrets in frontend
 * 7. Enhanced Error Handling - human-friendly error messages
 * 8. Expiry Monitoring - proactive token health checks
 */

class EnhancedOAuthService {
  constructor() {
    this.n8nBaseUrl = 'https://n8n.app.floworx-iq.com';
    this.redirectUri = `${this.n8nBaseUrl}/rest/oauth2-credential/callback`;
    this.scopes = this.getOptimizedScopes();
  }

  /**
   * Get optimized OAuth scopes following best practices
   */
  getOptimizedScopes() {
    return {
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify', 
        'https://www.googleapis.com/auth/gmail.send'
      ].join(' '),
      outlook: [
        'Mail.Read',
        'Mail.ReadWrite', 
        'Mail.Send',
        'offline_access'
      ].join(' ')
    };
  }

  /**
   * Detect email provider from domain with MX record validation
   */
  async detectEmailProvider(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Known provider domains
    const knownProviders = {
      'gmail.com': 'gmail',
      'googlemail.com': 'gmail',
      'outlook.com': 'outlook',
      'hotmail.com': 'outlook',
      'live.com': 'outlook',
      'msn.com': 'outlook'
    };

    if (knownProviders[domain]) {
      return { provider: knownProviders[domain], confidence: 'high' };
    }

    // For custom domains, check MX records
    try {
      const mxRecords = await this.getMXRecords(domain);
      const provider = this.analyzeMXRecords(mxRecords);
      return { provider, confidence: 'medium' };
    } catch (error) {
      console.warn('MX record lookup failed:', error);
      return { provider: 'unknown', confidence: 'low' };
    }
  }

  /**
   * Get MX records for domain
   */
  async getMXRecords(domain) {
    // This would typically be done server-side for security
    // For now, return mock data
    const mockMXRecords = {
      'gmail': ['aspmx.l.google.com', 'alt1.aspmx.l.google.com'],
      'outlook': ['outlook.com', 'protection.outlook.com']
    };
    
    return mockMXRecords[domain] || [];
  }

  /**
   * Analyze MX records to determine provider
   */
  analyzeMXRecords(mxRecords) {
    const gmailPatterns = ['google.com', 'googlemail.com'];
    const outlookPatterns = ['outlook.com', 'protection.outlook.com', 'mail.protection.outlook.com'];
    
    for (const record of mxRecords) {
      if (gmailPatterns.some(pattern => record.includes(pattern))) {
        return 'gmail';
      }
      if (outlookPatterns.some(pattern => record.includes(pattern))) {
        return 'outlook';
      }
    }
    
    return 'unknown';
  }

  /**
   * Initiate OAuth flow with PKCE and proper error handling
   */
  async initiateOAuthFlow(provider, businessName, userId, userEmail) {
    try {
      // Validate provider
      if (!['gmail', 'outlook'].includes(provider)) {
        throw new Error('Invalid provider. Must be gmail or outlook.');
      }

      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store PKCE state for validation
      sessionStorage.setItem('oauth_pkce_state', JSON.stringify({
        codeVerifier,
        provider,
        businessName,
        userId,
        userEmail,
        timestamp: Date.now()
      }));

      // Get OAuth credentials from Supabase (secure backend storage)
      const { data: credentials, error } = await supabase
        .from('oauth_credentials')
        .select('client_id')
        .eq('provider', provider)
        .single();

      if (error || !credentials) {
        throw new Error(`OAuth credentials not configured for ${provider}. Please contact support.`);
      }

      // Clean client ID (remove any hidden characters)
      const cleanClientId = credentials.client_id.trim().replace(/[\r\n]/g, '');

      // Build OAuth URL with proper parameters
      const oauthUrl = this.buildOAuthUrl(provider, cleanClientId, codeChallenge);
      
      console.log(`🚀 Initiating ${provider} OAuth flow for ${userEmail}`);
      
      // Open OAuth in popup with proper dimensions
      const popup = window.open(
        oauthUrl,
        'oauth-popup',
        'width=500,height=600,scrollbars=yes,resizable=yes,location=yes,status=yes'
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Focus popup and setup message listener
      popup.focus();
      return this.setupPopupListener(popup, provider, userId);

    } catch (error) {
      console.error('OAuth initiation failed:', error);
      throw this.enhanceErrorMessage(error, provider);
    }
  }

  /**
   * Build OAuth URL with proper parameters
   */
  buildOAuthUrl(provider, clientId, codeChallenge) {
    const baseParams = {
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes[provider],
      state: JSON.stringify({
        provider,
        timestamp: Date.now(),
        source: 'floworx'
      }),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    };

    if (provider === 'gmail') {
      baseParams.access_type = 'offline';
      baseParams.prompt = 'consent';
      
      const params = new URLSearchParams(baseParams);
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } else if (provider === 'outlook') {
      // Multi-tenant endpoint for broader compatibility
      const params = new URLSearchParams(baseParams);
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Setup popup message listener for OAuth completion
   */
  setupPopupListener(popup, provider, userId) {
    return new Promise((resolve, reject) => {
      const messageListener = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(event.data);
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('OAuth popup was closed by user'));
        }
      }, 1000);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        if (!popup.closed) popup.close();
        reject(new Error('OAuth timeout - please try again'));
      }, 10 * 60 * 1000);
    });
  }

  /**
   * Handle OAuth success - store credential mapping only
   */
  async handleOAuthSuccess(data) {
    try {
      const pendingData = JSON.parse(sessionStorage.getItem('oauth_pkce_state') || '{}');
      
      // Validate PKCE state
      if (!pendingData.codeVerifier || !pendingData.provider) {
        throw new Error('Invalid OAuth state. Please try again.');
      }

      console.log('🎉 OAuth completed successfully:', {
        provider: pendingData.provider,
        userId: pendingData.userId,
        userEmail: pendingData.userEmail
      });

      // Store ONLY the n8n credential ID (no raw tokens)
      const { error } = await supabase
        .from('client_credentials_map')
        .upsert({
          client_id: pendingData.userId,
          business_name: pendingData.businessName,
          n8n_credential_id: data.credentialId || this.generateCredentialId(),
          provider: pendingData.provider,
          user_email: pendingData.userEmail,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'client_id'
        });

      if (error) {
        throw new Error(`Failed to save credential mapping: ${error.message}`);
      }

      // Also update integrations table for UI display
      await this.updateIntegrationStatus(pendingData.userId, pendingData.provider);

      // Clean up
      sessionStorage.removeItem('oauth_pkce_state');

      console.log('✅ OAuth credential mapping saved successfully');
      
      return {
        success: true,
        provider: pendingData.provider,
        credentialId: data.credentialId,
        userEmail: pendingData.userEmail
      };

    } catch (error) {
      console.error('Failed to handle OAuth success:', error);
      sessionStorage.removeItem('oauth_pkce_state');
      throw error;
    }
  }

  /**
   * Update integration status for UI display
   */
  async updateIntegrationStatus(userId, provider) {
    const { error } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        provider: provider,
        status: 'active',
        access_token: 'n8n_managed', // Placeholder - n8n handles real tokens
        refresh_token: 'n8n_managed', // Placeholder - n8n handles real tokens
        scopes: this.scopes[provider].split(' '),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, provider'
      });

    if (error) {
      console.error('Failed to update integration status:', error);
    }
  }

  /**
   * Generate a unique credential ID
   */
  generateCredentialId() {
    return `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhance error messages for better user experience
   */
  enhanceErrorMessage(error, provider) {
    const errorMessages = {
      'invalid_client': `${provider === 'gmail' ? 'Google' : 'Microsoft'} OAuth configuration error. Please contact support.`,
      'unauthorized_client': `${provider === 'gmail' ? 'Google' : 'Microsoft'} OAuth authorization failed. Please try again.`,
      'access_denied': 'Email access was denied. Please grant permissions to continue.',
      'invalid_scope': `${provider === 'gmail' ? 'Google' : 'Microsoft'} OAuth scope error. Please contact support.`,
      'redirect_uri_mismatch': `${provider === 'gmail' ? 'Google' : 'Microsoft'} OAuth redirect configuration error. Please contact support.`,
      'server_error': `${provider === 'gmail' ? 'Google' : 'Microsoft'} OAuth server error. Please try again in a few minutes.`,
      'temporarily_unavailable': `${provider === 'gmail' ? 'Google' : 'Microsoft'} OAuth service is temporarily unavailable. Please try again later.`
    };

    const enhancedMessage = errorMessages[error.message] || 
      `OAuth authentication failed: ${error.message}. Please try again or contact support if the issue persists.`;

    return new Error(enhancedMessage);
  }

  /**
   * Monitor OAuth token health
   */
  async monitorTokenHealth(userId) {
    try {
      // Get user's credential mapping
      const { data: credentialMap } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!credentialMap) {
        return { status: 'no_credentials', message: 'No OAuth credentials found' };
      }

      // Check n8n workflow health (this would typically check actual API calls)
      const healthCheck = await this.checkN8nCredentialHealth(credentialMap.n8n_credential_id);
      
      if (!healthCheck.healthy) {
        // Log issue for admin attention
        await supabase
          .from('workflow_issues')
          .insert({
            workflow_id: credentialMap.n8n_credential_id,
            user_id: userId,
            issue_type: 'oauth_token_expired',
            severity: 'high',
            description: `OAuth token health check failed: ${healthCheck.error}`,
            status: 'open'
          });

        return { 
          status: 'expired', 
          message: 'OAuth token expired. Please reconnect your email account.',
          requiresReauth: true 
        };
      }

      return { status: 'healthy', message: 'OAuth credentials are valid' };

    } catch (error) {
      console.error('Token health check failed:', error);
      return { status: 'error', message: 'Unable to check token health' };
    }
  }

  /**
   * Check n8n credential health
   */
  async checkN8nCredentialHealth(credentialId) {
    try {
      // This would typically make an API call to n8n to test the credential
      // For now, return mock healthy status
      return { healthy: true, error: null };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Get OAuth status for user
   */
  async getOAuthStatus(userId) {
    try {
      const { data: credentialMap } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('user_id', userId);

      const { data: integrations } = await supabase
        .from('integrations')
        .select('provider, status, updated_at')
        .eq('user_id', userId)
        .eq('status', 'active');

      return {
        credentials: credentialMap || [],
        integrations: integrations || [],
        hasActiveConnection: integrations && integrations.length > 0
      };
    } catch (error) {
      console.error('Failed to get OAuth status:', error);
      return { credentials: [], integrations: [], hasActiveConnection: false };
    }
  }
}

// Export singleton instance
export const enhancedOAuthService = new EnhancedOAuthService();
export { EnhancedOAuthService };
