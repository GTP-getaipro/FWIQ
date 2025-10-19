/**
 * OAuth Token Exchange Service
 * Handles exchanging authorization codes for access tokens
 */

import { supabase } from './customSupabaseClient';

export class OAuthTokenExchangeService {
  constructor() {
    this.redirectUri = `${window.location.origin}/oauth-callback-n8n`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(provider, code) {
    try {
      console.log('🔄 Exchanging code for tokens:', { provider, code: code.substring(0, 10) + '...' });

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

      let tokenResponse;
      if (provider === 'gmail') {
        tokenResponse = await this.exchangeGoogleTokens(code, client_id, client_secret);
      } else if (provider === 'outlook') {
        tokenResponse = await this.exchangeMicrosoftTokens(code, client_id, client_secret);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      console.log('✅ Token exchange successful:', {
        hasAccessToken: !!tokenResponse.access_token,
        hasRefreshToken: !!tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in
      });

      return tokenResponse;

    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  async exchangeGoogleTokens(code, clientId, clientSecret) {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google token exchange failed: ${response.status} ${errorData}`);
    }

    return await response.json();
  }

  async exchangeMicrosoftTokens(code, clientId, clientSecret) {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Microsoft token exchange failed: ${response.status} ${errorData}`);
    }

    return await response.json();
  }

  /**
   * Save OAuth tokens to database
   */
  async saveTokensToDatabase(userId, provider, tokenData, businessName) {
    try {
      console.log('💾 Saving tokens to database:', { userId, provider, businessName });

      const integrationData = {
        user_id: userId,
        provider: provider,
        status: 'active',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        scopes: tokenData.scope ? tokenData.scope.split(' ') : this.getDefaultScopes(provider),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add expires_at if available
      if (tokenData.expires_in) {
        integrationData.expires_at = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
      }

      const { data, error } = await supabase
        .from('integrations')
        .upsert(integrationData, {
          onConflict: 'user_id, provider'
        })
        .select();

      if (error) {
        throw new Error(`Failed to save integration: ${error.message}`);
      }

      console.log('✅ Integration saved successfully:', data[0].id);
      return data[0];

    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw error;
    }
  }

  getDefaultScopes(provider) {
    if (provider === 'gmail') {
      return [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose'
      ];
    } else if (provider === 'outlook') {
      return [
        'Mail.Read',
        'Mail.Send'
      ];
    }
    return [];
  }
}

export const oauthTokenExchange = new OAuthTokenExchangeService();
