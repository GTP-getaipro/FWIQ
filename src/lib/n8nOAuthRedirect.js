/**
 * N8N OAuth Redirect Service
 * Handles OAuth redirects for Gmail and Outlook integrations
 */

import { supabase } from './customSupabaseClient';

export class N8nOAuthRedirectService {
  constructor() {
    this.redirectUri = `${window.location.origin}/oauth-callback-n8n`;
  }

  /**
   * Redirect to N8N OAuth for a specific provider
   */
  async redirectToN8NOAuth(provider, businessName, userId) {
    try {
      console.log('🚀 Starting N8N OAuth redirect for:', { provider, businessName, userId });
      
      // Get OAuth credentials from database
      const { data: credentials, error } = await supabase
        .from('oauth_credentials')
        .select('client_id, client_secret')
        .eq('provider', provider)
        .single();

      if (error || !credentials) {
        throw new Error(`OAuth credentials not found for ${provider}`);
      }

      const { client_id, client_secret } = credentials;
      
      // Create state parameter
      const state = encodeURIComponent(JSON.stringify({
        provider,
        businessName,
        userId,
        timestamp: Date.now()
      }));

      // Build OAuth URL based on provider
      let oauthUrl;
      if (provider === 'gmail') {
        oauthUrl = this.buildGoogleOAuthUrl(client_id, state);
      } else if (provider === 'outlook') {
        oauthUrl = this.buildMicrosoftOAuthUrl(client_id, state);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Store pending state
      sessionStorage.setItem('n8n_oauth_pending', JSON.stringify({
        provider,
        businessName,
        userId,
        timestamp: Date.now()
      }));

      // Redirect to OAuth provider
      window.location.href = oauthUrl;

    } catch (error) {
      console.error('OAuth redirect failed:', error);
      throw error;
    }
  }

  buildGoogleOAuthUrl(clientId, state) {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose'
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  buildMicrosoftOAuthUrl(clientId, state) {
    const scopes = [
      'Mail.Read',
      'Mail.Send'
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: state,
      response_mode: 'query'
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }
}

export const n8nOAuthRedirectService = new N8nOAuthRedirectService();
