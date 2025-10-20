/**
 * OAuth Token Manager
 * Handles token refresh and validation for Gmail and Outlook APIs
 */

import { supabase } from './customSupabaseClient';

// Token cache to reduce repeated API calls
const tokenCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired tokens from cache
 */
const clearExpiredTokens = () => {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (value.expiresAt && value.expiresAt <= now) {
      tokenCache.delete(key);
    }
  }
};

/**
 * Get cache key for user/provider combination
 */
const getCacheKey = (userId, provider) => `${userId}:${provider}`;

/**
 * Clear token cache for a specific user/provider or all tokens
 * @param {string} userId - User ID (optional)
 * @param {string} provider - Provider (optional)
 */
export const clearTokenCache = (userId = null, provider = null) => {
  if (userId && provider) {
    // Clear specific user/provider combination
    const cacheKey = getCacheKey(userId, provider);
    tokenCache.delete(cacheKey);
    console.log(`🗑️ Cleared token cache for ${provider} user ${userId}`);
  } else if (userId) {
    // Clear all tokens for a specific user
    const userKeys = Array.from(tokenCache.keys()).filter(key => key.startsWith(`${userId}:`));
    userKeys.forEach(key => tokenCache.delete(key));
    console.log(`🗑️ Cleared all token cache for user ${userId}`);
  } else {
    // Clear all tokens
    tokenCache.clear();
    console.log(`🗑️ Cleared all token cache`);
  }
};

/**
 * Refresh OAuth tokens for a given provider
 * @param {string} provider - 'gmail' or 'outlook'
 * @param {string} refreshToken - The refresh token
 * @param {string} userId - User ID
 * @param {string} integrationId - Integration ID
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresAt: number}>}
 */
export const refreshOAuthToken = async (provider, refreshToken, userId, integrationId) => {
  console.log(`🔄 Refreshing ${provider} token for user ${userId} via server-side endpoint`);

  try {
    // Use server-side refresh endpoint to avoid CORS issues
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    // Get backend URL from runtime config or environment
    const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
    const backendUrl = runtimeConfig?.BACKEND_URL || 
                      import.meta.env.BACKEND_URL || 
                      import.meta.env.VITE_BACKEND_URL || 
                      'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/oauth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        provider
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(` Server-side token refresh failed for ${provider}:`, errorData);
      throw new Error(`Token refresh failed: ${errorData.message || errorData.error}`);
    }

    const tokenData = await response.json();
    console.log(`✅ Token refreshed successfully for ${provider} via server-side endpoint`);

    // Calculate expiration time - server already updated the database
    const expiresAt = tokenData.expires_in ? 
      Date.now() + (tokenData.expires_in * 1000) : 
      new Date(tokenData.expires_at).getTime();

    // Clear cache for this user/provider combination since token was refreshed
    const cacheKey = getCacheKey(userId, provider);
    tokenCache.delete(cacheKey);

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: expiresAt,
    };

  } catch (error) {
    console.error(` Error refreshing ${provider} token:`, error);
    throw error;
  }
};

/**
 * Get a valid access token, refreshing if necessary
 * FIXED: Retrieves tokens from n8n credentials (not from integrations table)
 * @param {string} userId - User ID
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<string>} Valid access token
 */
export const getValidAccessToken = async (userId, provider) => {
  console.log(`🔍 Getting valid access token for ${provider} user ${userId}`);

  // Clear expired tokens from cache
  clearExpiredTokens();

  // Check cache first
  const cacheKey = getCacheKey(userId, provider);
  const cachedToken = tokenCache.get(cacheKey);
  
  if (cachedToken && cachedToken.expiresAt && cachedToken.expiresAt > Date.now()) {
    console.log(`✅ Using cached token for ${provider} user ${userId}`);
    return cachedToken.accessToken;
  }

  // Get the integration (has n8n_credential_id reference)
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (integrationError || !integration) {
    throw new Error(`Active ${provider} integration not found`);
  }

  const { n8n_credential_id } = integration;

  // If no n8n credential ID yet, we're in the early OAuth stage (before Step 5)
  // In this case, use the tokens stored directly in the integrations table
  if (!n8n_credential_id) {
    console.log(`🔑 No n8n credential ID yet - using direct tokens from integrations table`);
    
    // Check if we have direct access token
    if (!integration.access_token) {
      throw new Error(`No access token found for ${provider}. Please reconnect your email account.`);
    }

    // Check if token is expired
    if (integration.expires_at) {
      const expiresAt = new Date(integration.expires_at);
      const now = new Date();
      const isExpired = expiresAt <= now;
      
      if (isExpired) {
        console.log(`⏰ Token expired at ${expiresAt.toISOString()}, refreshing now...`);
        
        if (!integration.refresh_token) {
          throw new Error(`Token expired and no refresh token available. Please reconnect your ${provider} account.`);
        }
        
        // Refresh the token
        const refreshed = await refreshOAuthToken(
          provider,
          integration.refresh_token,
          userId,
          integration.id
        );
        
        return refreshed.accessToken;
      }
    }

    // Cache and return the stored access token
    const accessToken = integration.access_token;
    tokenCache.set(cacheKey, {
      accessToken,
      expiresAt: integration.expires_at ? new Date(integration.expires_at).getTime() : Date.now() + CACHE_DURATION
    });
    return accessToken;
  }

  console.log(`🔑 Found n8n credential ID: ${n8n_credential_id}`);

  // Tokens are stored in n8n, not in integrations table
  // We need to retrieve them from n8n or use backend API
  try {
    // Use backend API to get access token from n8n credential
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    // Get backend URL from runtime config or environment
    const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
    const backendUrl = runtimeConfig?.BACKEND_URL || 
                      import.meta.env.BACKEND_URL || 
                      import.meta.env.VITE_BACKEND_URL || 
                      'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/oauth/get-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        userId,
        provider,
        n8nCredentialId: n8n_credential_id
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get token from backend: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if tokens are managed by n8n (not directly accessible)
    if (data.managed_by === 'n8n') {
      console.log('ℹ️  Tokens are managed by n8n - direct API access not available');
      console.log('✅ OAuth credential exists and will be used by n8n workflows automatically');
      // Cache the n8n managed status
      tokenCache.set(cacheKey, {
        accessToken: 'N8N_MANAGED',
        expiresAt: Date.now() + CACHE_DURATION
      });
      return 'N8N_MANAGED';
    }
    
    if (!data.access_token) {
      throw new Error('Backend returned no access token');
    }

    // Check if token is expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const isExpired = expiresAt <= now;
      
      if (isExpired) {
        console.log(`⏰ Token expired at ${expiresAt.toISOString()}, refreshing now...`);
        
        // Get integration details for refresh
        const { data: integration } = await supabase
          .from('integrations')
          .select('id, refresh_token')
          .eq('user_id', userId)
          .eq('provider', provider)
          .eq('status', 'active')
          .single();
        
        if (!integration?.refresh_token) {
          throw new Error(`Token expired and no refresh token available. Please reconnect your ${provider} account.`);
        }
        
        // Refresh the token
        const refreshed = await refreshOAuthToken(
          provider,
          integration.refresh_token,
          userId,
          integration.id
        );
        
        // Token refreshed successfully
        return refreshed.accessToken;
      }
    }

    // Cache and return the retrieved access token
    const accessToken = data.access_token;
    tokenCache.set(cacheKey, {
      accessToken,
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + CACHE_DURATION
    });
    return accessToken;

  } catch (error) {
    console.error(`❌ Failed to get access token for ${provider}:`, error);
    throw new Error(`Unable to retrieve ${provider} access token. Please reconnect your email account.`);
  }
};

/**
 * LEGACY CODE - Kept for reference but not used
 * Tokens are now stored in n8n, not in Supabase integrations table
 */
const getValidAccessTokenLegacy = async (userId, provider) => {
  // Old implementation that expected tokens in integrations table
  // This is no longer used because tokens are stored in n8n credentials
  
  console.warn('⚠️ Legacy token retrieval method called - this should not happen');
  
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();
    
  if (!integration?.access_token) {
    throw new Error('No access token found in integrations table (tokens moved to n8n)');
  }
  
  return integration.access_token;
};

// Remove legacy code below - now handled by backend API call above
const testTokenValidityLegacy = async (provider, access_token) => {
  if (false) { // Disabled legacy code
    console.log(`🔍 Testing ${provider} token validity. Token length: ${access_token?.length}, starts with: ${access_token?.substring(0, 10)}...`);
    if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('InvalidAuthenticationToken')) {
      console.log(`🔄 Token invalid, refreshing ${provider} token`);
      if (!refresh_token) {
        throw new Error('Token expired and no refresh token available. Please reconnect your account.');
      }
      const refreshed = await refreshOAuthToken(provider, refresh_token, userId, integrationId);
      return refreshed.accessToken;
    }
    throw error;
  }
};

/**
 * Test if a token is valid by making a simple API call
 * @param {string} provider - 'gmail' or 'outlook'
 * @param {string} accessToken - Access token to test
 * @returns {Promise<void>}
 */
const testTokenValidity = async (provider, accessToken) => {
  let testUrl;
  
  if (provider === 'gmail') {
    testUrl = 'https://www.googleapis.com/gmail/v1/users/me/profile';
  } else if (provider === 'outlook') {
    testUrl = 'https://graph.microsoft.com/v1.0/me';
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const response = await fetch(testUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Token validation failed: ${response.status} ${response.statusText}`);
  }
};

/**
 * Validate and refresh tokens for label provisioning
 * @param {string} userId - User ID
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<{accessToken: string, integration: object}>}
 */
export const validateTokensForLabels = async (userId, provider) => {
  console.log(`🔍 Validating tokens for ${provider} label provisioning`);

  // Get integration data
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (integrationError || !integration) {
    throw new Error(`Active ${provider} integration not found`);
  }

  // Get valid access token (refresh if needed)
  const accessToken = await getValidAccessToken(userId, provider);

  // Check if tokens are managed by n8n
  if (accessToken === 'N8N_MANAGED') {
    console.log('ℹ️  Tokens are managed by n8n - skipping label provisioning');
    console.log('✅ Labels will be created automatically by n8n workflow');
    throw new Error('SKIP_LABEL_PROVISIONING:Tokens managed by n8n');
  }

  return {
    accessToken,
    integration,
  };
};
