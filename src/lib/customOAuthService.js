/**
 * Custom OAuth Service for handling Gmail and Outlook OAuth flows
 * This service provides complete control over the OAuth process without Supabase branding
 */

import { supabase } from './customSupabaseClient';

class CustomOAuthService {
  constructor() {
    // Use current port to match the running server
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Get runtime config for environment variables
    const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
    
    // Use HTTP for localhost development (Google OAuth allows HTTP for localhost)
    if (hostname === 'localhost') {
      this.redirectUri = `http://localhost:${port}/oauth-callback-n8n`;
      this.backendUrl = runtimeConfig?.BACKEND_URL || 
                       import.meta.env.BACKEND_URL || 
                       // Get backend URL from runtime config or environment
                       const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
                       runtimeConfig?.BACKEND_URL || 
                       import.meta.env.BACKEND_URL || 
                       'http://localhost:3001';
    } else {
      // For production, use environment variables for redirect URI
      this.redirectUri = runtimeConfig?.OUTLOOK_REDIRECT_URI || 
                        import.meta.env.OUTLOOK_REDIRECT_URI || 
                        `https://${hostname}/oauth-callback-n8n`;
      this.backendUrl = runtimeConfig?.BACKEND_URL || 
                       import.meta.env.BACKEND_URL || 
                       `https://${hostname}`;
    }
  }

  /**
   * Start OAuth flow for a provider
   */
  async startOAuthFlow(provider, businessName, userId) {
    try {
      // Get OAuth credentials from runtime config or environment
      const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
      let clientId, clientSecret;
      
      if (provider === 'gmail') {
        clientId = runtimeConfig?.GMAIL_CLIENT_ID || import.meta.env.GMAIL_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
        clientSecret = runtimeConfig?.GMAIL_CLIENT_SECRET || import.meta.env.GMAIL_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
      } else if (provider === 'outlook') {
        clientId = runtimeConfig?.OUTLOOK_CLIENT_ID || import.meta.env.OUTLOOK_CLIENT_ID || import.meta.env.MICROSOFT_CLIENT_ID;
        clientSecret = runtimeConfig?.OUTLOOK_CLIENT_SECRET || import.meta.env.OUTLOOK_CLIENT_SECRET || import.meta.env.MICROSOFT_CLIENT_SECRET;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (!clientId || !clientSecret) {
        throw new Error(`OAuth credentials not found in environment for ${provider}`);
      }

      const cleanClientId = clientId.trim().replace(/[\r\n]/g, '');
      const scopes = this.getOAuthScopes(provider);
      
      // Create state parameter to pass data through OAuth flow
      const state = encodeURIComponent(JSON.stringify({
        provider,
        businessName,
        userId,
        timestamp: Date.now()
      }));

      let oauthUrl;
      
      if (provider === 'gmail') {
        oauthUrl = this.buildGoogleOAuthUrl(cleanClientId, scopes, state);
      } else if (provider === 'outlook') {
        oauthUrl = this.buildMicrosoftOAuthUrl(cleanClientId, scopes, state);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Store pending OAuth state and redirect
      const pendingState = {
        provider,
        businessName,
        userId,
        timestamp: Date.now()
      };
      sessionStorage.setItem('n8n_oauth_pending', JSON.stringify(pendingState));
      window.location.href = oauthUrl;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(code, state, user) {
    try {
      // Input validation
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid OAuth code provided');
      }
      
      if (!state || typeof state !== 'string') {
        throw new Error('Invalid OAuth state provided');
      }
      
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // Parse and validate state data
      let stateData;
      try {
        stateData = JSON.parse(decodeURIComponent(state));
      } catch (parseError) {
        throw new Error('Invalid OAuth state format');
      }
      
      const { provider, businessName, userId } = stateData;
      
      // Validate state data
      if (!provider || !['gmail', 'outlook'].includes(provider)) {
        throw new Error('Invalid OAuth provider in state');
      }
      
      if (!userId || userId !== user.id) {
        throw new Error('OAuth state user ID mismatch');
      }
      
      // Exchange code for tokens
      console.log('🔄 Starting token exchange for provider:', provider);
      const tokenData = await this.exchangeCodeForTokens(provider, code);
      console.log('✅ Token exchange successful:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });
      
      // Check if tokenData indicates a pending request (202 response was handled internally)
      if (tokenData.status === 'pending' || (!tokenData.access_token && !tokenData.refresh_token)) {
        console.log('⏳ OAuth request in progress, will retry automatically');
        return {
          provider,
          businessName,
          userId,
          status: 'pending',
          message: 'OAuth request is being processed'
        };
      }
      
      // Only validate access token for successful responses (200)
      if (!tokenData.access_token) {
        throw new Error('No access token received from OAuth provider');
      }
      
      // ✅ Save tokens AND n8n_credential_id to Supabase (hybrid approach)
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();
      
      const integrationData = {
        user_id: user.id,
        provider: provider,
        status: 'active',
        access_token: tokenData.access_token,  // ✅ Store for API calls
        refresh_token: tokenData.refresh_token,  // ✅ Store for token refresh
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokenData.scope || this.getOAuthScopes(provider).join(' '),
        n8n_credential_id: tokenData.n8n_credential_id || null,  // ✅ Also store n8n reference
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Attempting to save integration to database (hybrid approach)...');
      console.log('   User ID:', integrationData.user_id);
      console.log('   Provider:', integrationData.provider);
      console.log('   n8n Credential ID:', integrationData.n8n_credential_id);
      console.log('   Has Access Token:', !!integrationData.access_token);
      console.log('   Has Refresh Token:', !!integrationData.refresh_token);
      console.log('   Expires At:', integrationData.expires_at);
      console.log('   Status:', integrationData.status);

      const { data: integrationResult, error: integrationError } = await supabase
        .from('integrations')
        .upsert(integrationData, {
          onConflict: 'user_id, provider'
        })
        .select();

      if (integrationError) {
        console.error('❌ Database save failed:', integrationError);
        console.error('   Error code:', integrationError.code);
        console.error('   Error message:', integrationError.message);
        console.error('   Error details:', integrationError.details);
        console.error('   Error hint:', integrationError.hint);
        throw new Error(`Failed to save integration: ${integrationError.message}`);
      }

      console.log('✅ Database save successful!');
      console.log('   Integration result:', integrationResult);
      console.log('   Integration ID:', integrationResult[0]?.id);

      // Clean up session storage
      sessionStorage.removeItem('n8n_oauth_pending');

      const result = {
        provider,
        businessName,
        userId,
        integrationId: integrationResult[0].id,
        status: 'success'
      };

      return result;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeCodeForTokens(provider, code) {
    try {
      // Get OAuth credentials from runtime config or environment
      const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
      let clientId, clientSecret;
      
      if (provider === 'gmail') {
        clientId = runtimeConfig?.GMAIL_CLIENT_ID || import.meta.env.GMAIL_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
        clientSecret = runtimeConfig?.GMAIL_CLIENT_SECRET || import.meta.env.GMAIL_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
      } else if (provider === 'outlook') {
        clientId = runtimeConfig?.OUTLOOK_CLIENT_ID || import.meta.env.OUTLOOK_CLIENT_ID || import.meta.env.MICROSOFT_CLIENT_ID;
        clientSecret = runtimeConfig?.OUTLOOK_CLIENT_SECRET || import.meta.env.OUTLOOK_CLIENT_SECRET || import.meta.env.MICROSOFT_CLIENT_SECRET;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      if (!clientId) {
        throw new Error(`OAuth client ID not found in environment for ${provider}`);
      }

      const cleanClientId = clientId.trim().replace(/[\r\n]/g, '');
      const cleanClientSecret = clientSecret ? clientSecret.trim().replace(/[\r\n]/g, '') : null;

      let tokenResponse;

      if (provider === 'gmail') {
        tokenResponse = await this.exchangeGoogleTokens(code, cleanClientId, cleanClientSecret);
      } else if (provider === 'outlook') {
        tokenResponse = await this.exchangeOutlookTokens(code, cleanClientId, cleanClientSecret);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      return tokenResponse;

    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Exchange Google OAuth code for tokens (Server-side flow for n8n credential creation)
   */
  async exchangeGoogleTokens(code, clientId, clientSecret) {
    console.log('🔄 Gmail server-side token exchange:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'Missing',
      hasCode: !!code,
      redirectUri: this.redirectUri,
      note: 'Using server-side flow to create n8n credentials'
    });
    
    // Use server-side endpoint for token exchange (to create n8n credentials)
    const requestUrl = `${this.backendUrl}/api/oauth/exchange-token`;
    
    console.log('🌐 Making request to backend server:', requestUrl);
    console.log('📦 Request body:', {
      provider: 'gmail',
      code: code.substring(0, 20) + '...',
      redirect_uri: this.redirectUri
    });

    try {
      // Get current user ID for credential naming
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'gmail',
          code: code,
          redirect_uri: this.redirectUri,
          userId: userId  // ✅ Include user ID for credential management
        }),
      });

      console.log('📡 Backend token exchange response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 Backend token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Backend server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Backend token exchange successful:', { hasAccessToken: !!data.access_token, hasRefreshToken: !!data.refresh_token });
      return data;
      
    } catch (error) {
      console.error('🚨 Backend fetch error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        requestUrl: requestUrl
      });
      throw error;
    }
  }

  /**
   * Exchange Outlook OAuth code for tokens (Server-side flow)
   * Outlook requires server-side token exchange for Web applications
   */
  async exchangeOutlookTokens(code, clientId, clientSecret) {
    console.log('🔄 Outlook server-side token exchange:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'Missing',
      hasCode: !!code,
      redirectUri: this.redirectUri,
      note: 'Using server-side flow (required for Web app type)'
    });
    
    // Use server-side endpoint for token exchange (required for Azure AD Web apps)
    // Get backend URL from runtime config or environment
    const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
    const backendUrl = runtimeConfig?.BACKEND_URL || 
                      import.meta.env.BACKEND_URL || 
                      'http://localhost:3001';
    const requestUrl = `${backendUrl}/api/oauth/exchange-token`;
    console.log('🌐 Making request to backend server:', requestUrl);
    console.log('📦 Request body:', { provider: 'outlook', code: code, redirect_uri: this.redirectUri });
    
    try {
      // Get current user ID for credential naming
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'outlook',
          code: code,
          redirect_uri: this.redirectUri,
          userId: userId  // ✅ Include user ID for credential management
        }),
      });
      
      console.log('📡 Backend token exchange response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend server response error:', errorText);
        
        // Handle 202 Accepted (request already in progress)
        if (response.status === 202) {
          console.log('🔄 Request already in progress, returning pending status');
          // Return a special object to indicate pending status
          return {
            access_token: null,
            refresh_token: null,
            status: 'pending',
            message: 'Request already in progress'
          };
        }
        
        // Handle expired authorization codes
        if (errorText && errorText.includes('AADSTS70000')) {
          console.warn('⚠️ Authorization code expired, this is a known Microsoft issue');
          throw new Error('AUTHORIZATION_CODE_EXPIRED');
        }
        
        // Handle request failed recently
        if (errorText && errorText.includes('Request failed recently')) {
          console.warn('⚠️ Request failed recently, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          throw new Error('REQUEST_FAILED_RECENTLY');
        }
        
        throw new Error(`Backend server responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Backend token exchange successful:', { hasAccessToken: !!data.access_token, hasRefreshToken: !!data.refresh_token });
      return data;
      
    } catch (error) {
      console.error('🚨 Backend fetch error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        requestUrl: requestUrl
      });
      throw error;
    }
  }

  /**
   * Build Google OAuth URL
   */
  buildGoogleOAuthUrl(clientId, scopes, state) {
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

  /**
   * Build Microsoft OAuth URL
   */
  buildMicrosoftOAuthUrl(clientId, scopes, state) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: scopes.join(' '),  // Now includes offline_access!
      state: state,
      prompt: 'consent'  // ✅ Force consent to get refresh token
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Get OAuth scopes for a provider
   */
  getOAuthScopes(provider) {
    if (provider === 'gmail') {
      return [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels'
      ];
    } else if (provider === 'outlook') {
      return [
        'offline_access',  // ✅ CRITICAL: Required for refresh token!
        'Mail.Read',
        'Mail.ReadWrite',
        'Mail.Send',
        'MailboxSettings.ReadWrite',
        'User.Read',
        'openid',
        'profile',
        'email'
      ];
    }
    return [];
  }
}

export const customOAuthService = new CustomOAuthService();
