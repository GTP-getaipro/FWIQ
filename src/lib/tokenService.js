/**
 * Centralized Token Service
 * 
 * This module provides a unified interface for managing all types of tokens
 * across the application, including OAuth tokens, API keys, and session tokens.
 */

import { supabase } from '@/lib/customSupabaseClient';
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import {
  Token,
  TokenProvider,
  TokenType,
  TokenStatus,
  TokenMetadata,
  TokenStorage,
  TokenRefreshResult,
  TokenValidationResult,
  TokenCreationRequest,
  TokenUpdateRequest,
  SupabaseToken,
  OAuthToken,
  ApiKeyToken,
  ConnectionToken,
  JWTToken,
  AnyToken,
  ComputedToken,
  TokenError,
  TokenErrorType,
  TOKEN_ERROR_MESSAGES,
  TOKEN_EXPIRATION_TIMES,
  REFRESH_THRESHOLDS,
  MAX_TOKEN_RETRIES,
  TOKEN_REFRESH_DELAY,
  DEFAULT_TOKEN_CONFIG
} from '@/types/tokens';

/**
 * Centralized token service for managing all token types
 */
export class TokenService {
  constructor(config = DEFAULT_TOKEN_CONFIG) {
    this.config = config;
    this.cache = new Map();
    this.refreshPromises = new Map();
  }

  // ============================================================================
  // TOKEN STORAGE OPERATIONS
  // ============================================================================

  /**
   * Get token by provider and user ID
   * @param {TokenProvider} provider - Token provider
   * @param {string} userId - User ID
   * @returns {Promise<Token|null>} Token or null if not found
   */
  async getToken(provider, userId) {
    try {
      const cacheKey = `${provider}:${userId}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (this.isCacheValid(cached)) {
          return cached;
        }
        this.cache.delete(cacheKey);
      }

      // Get from database
      const token = await this.getTokenFromDatabase(provider, userId);
      
      if (token) {
        this.cache.set(cacheKey, token);
        return token;
      }

      return null;
    } catch (error) {
      logger.error('Error getting token:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to get token: ${error.message}`, provider);
    }
  }

  /**
   * Store or update a token
   * @param {Token} token - Token to store
   * @returns {Promise<void>}
   */
  async setToken(token) {
    try {
      await this.validateTokenStructure(token);
      
      // Store in database
      await this.storeTokenInDatabase(token);
      
      // Update cache
      const cacheKey = `${token.provider}:${token.userId}`;
      this.cache.set(cacheKey, token);
      
      logger.info('Token stored successfully:', { 
        provider: token.provider, 
        userId: token.userId,
        tokenType: token.tokenType 
      });
    } catch (error) {
      logger.error('Error storing token:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to store token: ${error.message}`, token.provider);
    }
  }

  /**
   * Delete a token
   * @param {string} tokenId - Token ID
   * @returns {Promise<void>}
   */
  async deleteToken(tokenId) {
    try {
      // Get token info for cache cleanup
      const token = await this.getTokenById(tokenId);
      
      // Delete from database
      await this.deleteTokenFromDatabase(tokenId);
      
      // Remove from cache
      if (token) {
        const cacheKey = `${token.provider}:${token.userId}`;
        this.cache.delete(cacheKey);
      }
      
      logger.info('Token deleted successfully:', { tokenId });
    } catch (error) {
      logger.error('Error deleting token:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to delete token: ${error.message}`, 'custom');
    }
  }

  /**
   * Get all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<Token[]>} Array of tokens
   */
  async getAllTokens(userId) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(token => this.normalizeTokenFromDatabase(token));
    } catch (error) {
      logger.error('Error getting all tokens:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to get tokens: ${error.message}`, 'custom');
    }
  }

  /**
   * Get tokens by provider for a user
   * @param {TokenProvider} provider - Token provider
   * @param {string} userId - User ID
   * @returns {Promise<Token[]>} Array of tokens
   */
  async getTokensByProvider(provider, userId) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(token => this.normalizeTokenFromDatabase(token));
    } catch (error) {
      logger.error('Error getting tokens by provider:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to get tokens: ${error.message}`, provider);
    }
  }

  // ============================================================================
  // TOKEN REFRESH OPERATIONS
  // ============================================================================

  /**
   * Refresh a token if it's close to expiration
   * @param {string} tokenId - Token ID
   * @returns {Promise<TokenRefreshResult>} Refresh result
   */
  async refreshToken(tokenId) {
    try {
      // Check if refresh is already in progress
      if (this.refreshPromises.has(tokenId)) {
        return await this.refreshPromises.get(tokenId);
      }

      const refreshPromise = this.performTokenRefresh(tokenId);
      this.refreshPromises.set(tokenId, refreshPromise);

      try {
        const result = await refreshPromise;
        return result;
      } finally {
        this.refreshPromises.delete(tokenId);
      }
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return {
        success: false,
        error: error.message,
        retryAfter: TOKEN_REFRESH_DELAY
      };
    }
  }

  /**
   * Perform the actual token refresh
   * @param {string} tokenId - Token ID
   * @returns {Promise<TokenRefreshResult>} Refresh result
   */
  async performTokenRefresh(tokenId) {
    const token = await this.getTokenById(tokenId);
    if (!token) {
      return {
        success: false,
        error: 'Token not found'
      };
    }

    if (!token.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    // Provider-specific refresh logic
    switch (token.provider) {
      case 'supabase':
        return await this.refreshSupabaseToken(token);
      case 'gmail':
        return await this.refreshGmailToken(token);
      case 'outlook':
        return await this.refreshOutlookToken(token);
      default:
        return {
          success: false,
          error: `Token refresh not supported for provider: ${token.provider}`
        };
    }
  }

  /**
   * Refresh Supabase token
   * @param {SupabaseToken} token - Supabase token
   * @returns {Promise<TokenRefreshResult>} Refresh result
   */
  async refreshSupabaseToken(token) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: token.refreshToken
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        const refreshedToken = {
          ...token,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: new Date(data.session.expires_at * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };

        await this.setToken(refreshedToken);

        return {
          success: true,
          token: refreshedToken
        };
      }

      return {
        success: false,
        error: 'No session returned from refresh'
      };
    } catch (error) {
      logger.error('Error refreshing Supabase token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh Gmail token
   * @param {OAuthToken} token - Gmail token
   * @returns {Promise<TokenRefreshResult>} Refresh result
   */
  async refreshGmailToken(token) {
    try {
      // Google OAuth2 token refresh
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
          refresh_token: token.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Gmail token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const refreshedToken = {
        ...token,
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...token.metadata,
          last_refresh: new Date().toISOString(),
          refresh_count: (token.metadata?.refresh_count || 0) + 1
        }
      };

      await this.setToken(refreshedToken);

      return {
        success: true,
        token: refreshedToken
      };
    } catch (error) {
      logger.error('Error refreshing Gmail token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh Outlook token
   * @param {OAuthToken} token - Outlook token
   * @returns {Promise<TokenRefreshResult>} Refresh result
   */
  async refreshOutlookToken(token) {
    try {
      // Microsoft OAuth2 token refresh
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.VITE_MICROSOFT_CLIENT_ID,
          client_secret: process.env.VITE_MICROSOFT_CLIENT_SECRET,
          refresh_token: token.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Outlook token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const refreshedToken = {
        ...token,
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...token.metadata,
          last_refresh: new Date().toISOString(),
          refresh_count: (token.metadata?.refresh_count || 0) + 1
        }
      };

      await this.setToken(refreshedToken);

      return {
        success: true,
        token: refreshedToken
      };
    } catch (error) {
      logger.error('Error refreshing Outlook token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // TOKEN VALIDATION OPERATIONS
  // ============================================================================

  /**
   * Validate a token
   * @param {Token} token - Token to validate
   * @returns {Promise<TokenValidationResult>} Validation result
   */
  async validateToken(token) {
    try {
      // Check if token is expired
      const isExpired = this.isTokenExpired(token);
      
      // Check if token needs refresh
      const needsRefresh = this.needsTokenRefresh(token);
      
      // Provider-specific validation
      const providerValidation = await this.validateTokenWithProvider(token);
      
      return {
        isValid: !isExpired && providerValidation.isValid,
        isExpired,
        needsRefresh,
        error: providerValidation.error,
        expiresIn: this.getTokenExpiresIn(token)
      };
    } catch (error) {
      logger.error('Error validating token:', error);
      return {
        isValid: false,
        isExpired: true,
        needsRefresh: false,
        error: error.message,
        expiresIn: 0
      };
    }
  }

  /**
   * Validate token with provider
   * @param {Token} token - Token to validate
   * @returns {Promise<{isValid: boolean, error?: string}>} Validation result
   */
  async validateTokenWithProvider(token) {
    try {
      switch (token.provider) {
        case 'supabase':
          return await this.validateSupabaseToken(token);
        case 'gmail':
          return await this.validateGmailToken(token);
        case 'outlook':
          return await this.validateOutlookToken(token);
        case 'openai':
          return await this.validateOpenAIToken(token);
        default:
          return { isValid: true }; // Default to valid for unsupported providers
      }
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate Supabase token
   * @param {SupabaseToken} token - Supabase token
   * @returns {Promise<{isValid: boolean, error?: string}>} Validation result
   */
  async validateSupabaseToken(token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token.accessToken);
      
      if (error) {
        return {
          isValid: false,
          error: error.message
        };
      }

      return {
        isValid: !!user
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate Gmail token
   * @param {OAuthToken} token - Gmail token
   * @returns {Promise<{isValid: boolean, error?: string}>} Validation result
   */
  async validateGmailToken(token) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        }
      });

      return {
        isValid: response.ok
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate Outlook token
   * @param {OAuthToken} token - Outlook token
   * @returns {Promise<{isValid: boolean, error?: string}>} Validation result
   */
  async validateOutlookToken(token) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        }
      });

      return {
        isValid: response.ok
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Validate OpenAI token
   * @param {ApiKeyToken} token - OpenAI token
   * @returns {Promise<{isValid: boolean, error?: string}>} Validation result
   */
  async validateOpenAIToken(token) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        }
      });

      return {
        isValid: response.ok
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // ============================================================================
  // TOKEN CREATION AND MANAGEMENT
  // ============================================================================

  /**
   * Create a new token
   * @param {TokenCreationRequest} request - Token creation request
   * @returns {Promise<Token>} Created token
   */
  async createToken(request) {
    try {
      const token = {
        id: this.generateTokenId(),
        userId: request.userId,
        provider: request.provider,
        tokenType: request.tokenType,
        accessToken: request.accessToken,
        refreshToken: request.refreshToken,
        expiresAt: request.expiresAt || this.calculateExpiration(request.provider),
        scopes: request.scopes || [],
        metadata: request.metadata || {},
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.setToken(token);
      return token;
    } catch (error) {
      logger.error('Error creating token:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to create token: ${error.message}`, request.provider);
    }
  }

  /**
   * Update an existing token
   * @param {string} tokenId - Token ID
   * @param {TokenUpdateRequest} updates - Token updates
   * @returns {Promise<Token>} Updated token
   */
  async updateToken(tokenId, updates) {
    try {
      const currentToken = await this.getTokenById(tokenId);
      if (!currentToken) {
        throw new Error('Token not found');
      }

      const updatedToken = {
        ...currentToken,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.setToken(updatedToken);
      return updatedToken;
    } catch (error) {
      logger.error('Error updating token:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to update token: ${error.message}`, 'custom');
    }
  }

  /**
   * Revoke a token
   * @param {string} tokenId - Token ID
   * @returns {Promise<void>}
   */
  async revokeToken(tokenId) {
    try {
      const token = await this.getTokenById(tokenId);
      if (!token) {
        throw new Error('Token not found');
      }

      // Provider-specific revocation
      await this.revokeTokenWithProvider(token);

      // Update status to revoked
      await this.updateToken(tokenId, { status: 'revoked' });

      logger.info('Token revoked successfully:', { tokenId, provider: token.provider });
    } catch (error) {
      logger.error('Error revoking token:', error);
      throw this.createTokenError('NETWORK_ERROR', `Failed to revoke token: ${error.message}`, 'custom');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if token is expired
   * @param {Token} token - Token to check
   * @returns {boolean} Is expired
   */
  isTokenExpired(token) {
    if (!token.expiresAt) return false;
    return new Date(token.expiresAt) <= new Date();
  }

  /**
   * Check if token needs refresh
   * @param {Token} token - Token to check
   * @param {number} threshold - Refresh threshold in seconds
   * @returns {boolean} Needs refresh
   */
  needsTokenRefresh(token, threshold = REFRESH_THRESHOLDS.default) {
    if (!token.expiresAt || !token.refreshToken) return false;
    const expiryTime = new Date(token.expiresAt).getTime();
    const refreshTime = expiryTime - (threshold * 1000);
    return Date.now() >= refreshTime;
  }

  /**
   * Get token expiration time in seconds
   * @param {Token} token - Token to check
   * @returns {number} Seconds until expiration
   */
  getTokenExpiresIn(token) {
    if (!token.expiresAt) return Infinity;
    const expiryTime = new Date(token.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
  }

  /**
   * Generate a unique token ID
   * @returns {string} Token ID
   */
  generateTokenId() {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate token expiration time
   * @param {TokenProvider} provider - Token provider
   * @returns {string} ISO expiration time
   */
  calculateExpiration(provider) {
    const expiresIn = TOKEN_EXPIRATION_TIMES[provider] || TOKEN_EXPIRATION_TIMES.supabase;
    if (expiresIn === Infinity) return null;
    
    const expirationTime = new Date(Date.now() + (expiresIn * 1000));
    return expirationTime.toISOString();
  }

  /**
   * Check if cache entry is valid
   * @param {Token} cached - Cached token
   * @returns {boolean} Is cache valid
   */
  isCacheValid(cached) {
    if (!cached) return false;
    const cacheAge = Date.now() - new Date(cached.updatedAt).getTime();
    return cacheAge < (this.config.storage.ttl * 1000);
  }

  /**
   * Create a token error
   * @param {TokenErrorType} type - Error type
   * @param {string} message - Error message
   * @param {TokenProvider} provider - Token provider
   * @returns {TokenError} Token error
   */
  createTokenError(type, message, provider) {
    return {
      type,
      message: message || TOKEN_ERROR_MESSAGES[type],
      provider,
      statusCode: this.getErrorStatusCode(type)
    };
  }

  /**
   * Get HTTP status code for error type
   * @param {TokenErrorType} type - Error type
   * @returns {number} HTTP status code
   */
  getErrorStatusCode(type) {
    const statusCodes = {
      INVALID_TOKEN: 401,
      EXPIRED_TOKEN: 401,
      REVOKED_TOKEN: 401,
      INVALID_SIGNATURE: 401,
      MALFORMED_TOKEN: 400,
      NETWORK_ERROR: 503,
      RATE_LIMITED: 429,
      INSUFFICIENT_SCOPES: 403,
      PROVIDER_ERROR: 502
    };
    return statusCodes[type] || 500;
  }

  /**
   * Validate token structure
   * @param {Token} token - Token to validate
   * @throws {Error} If token structure is invalid
   */
  validateTokenStructure(token) {
    if (!token.id) throw new Error('Token ID is required');
    if (!token.userId) throw new Error('User ID is required');
    if (!token.provider) throw new Error('Provider is required');
    if (!token.tokenType) throw new Error('Token type is required');
    if (!token.accessToken) throw new Error('Access token is required');
    if (!token.status) throw new Error('Status is required');
  }

  /**
   * Normalize token from database format
   * @param {any} dbToken - Database token record
   * @returns {Token} Normalized token
   */
  normalizeTokenFromDatabase(dbToken) {
    return {
      id: dbToken.id,
      userId: dbToken.user_id,
      provider: dbToken.provider,
      tokenType: dbToken.token_type,
      accessToken: dbToken.access_token,
      refreshToken: dbToken.refresh_token,
      expiresAt: dbToken.expires_at,
      scopes: dbToken.scopes || [],
      metadata: dbToken.metadata || {},
      status: dbToken.status,
      createdAt: dbToken.created_at,
      updatedAt: dbToken.updated_at
    };
  }

  /**
   * Get token by ID
   * @param {string} tokenId - Token ID
   * @returns {Promise<Token|null>} Token or null
   */
  async getTokenById(tokenId) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.normalizeTokenFromDatabase(data);
    } catch (error) {
      logger.error('Error getting token by ID:', error);
      throw error;
    }
  }

  /**
   * Get token from database
   * @param {TokenProvider} provider - Token provider
   * @param {string} userId - User ID
   * @returns {Promise<Token|null>} Token or null
   */
  async getTokenFromDatabase(provider, userId) {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('provider', provider)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? this.normalizeTokenFromDatabase(data) : null;
    } catch (error) {
      logger.error('Error getting token from database:', error);
      throw error;
    }
  }

  /**
   * Store token in database
   * @param {Token} token - Token to store
   * @returns {Promise<void>}
   */
  async storeTokenInDatabase(token) {
    try {
      const dbToken = {
        id: token.id,
        user_id: token.userId,
        provider: token.provider,
        token_type: token.tokenType,
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expires_at: token.expiresAt,
        scopes: token.scopes,
        metadata: token.metadata,
        status: token.status,
        created_at: token.createdAt,
        updated_at: token.updatedAt
      };

      const { error } = await supabase
        .from('tokens')
        .upsert(dbToken, { onConflict: 'id' });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Error storing token in database:', error);
      throw error;
    }
  }

  /**
   * Delete token from database
   * @param {string} tokenId - Token ID
   * @returns {Promise<void>}
   */
  async deleteTokenFromDatabase(tokenId) {
    try {
      const { error } = await supabase
        .from('tokens')
        .delete()
        .eq('id', tokenId);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Error deleting token from database:', error);
      throw error;
    }
  }

  /**
   * Revoke token with provider
   * @param {Token} token - Token to revoke
   * @returns {Promise<void>}
   */
  async revokeTokenWithProvider(token) {
    try {
      switch (token.provider) {
        case 'gmail':
          await this.revokeGmailToken(token);
          break;
        case 'outlook':
          await this.revokeOutlookToken(token);
          break;
        case 'supabase':
          await this.revokeSupabaseToken(token);
          break;
        default:
          logger.warn(`Token revocation not implemented for provider: ${token.provider}`);
      }
    } catch (error) {
      logger.error('Error revoking token with provider:', error);
      // Don't throw error as revocation is best effort
    }
  }

  /**
   * Revoke Gmail token
   * @param {OAuthToken} token - Gmail token
   * @returns {Promise<void>}
   */
  async revokeGmailToken(token) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: token.accessToken
        })
      });
    } catch (error) {
      logger.error('Error revoking Gmail token:', error);
    }
  }

  /**
   * Revoke Outlook token
   * @param {OAuthToken} token - Outlook token
   * @returns {Promise<void>}
   */
  async revokeOutlookToken(token) {
    try {
      // Microsoft doesn't have a standard revocation endpoint
      // The token will expire naturally
      logger.info('Outlook token will expire naturally');
    } catch (error) {
      logger.error('Error revoking Outlook token:', error);
    }
  }

  /**
   * Revoke Supabase token
   * @param {SupabaseToken} token - Supabase token
   * @returns {Promise<void>}
   */
  async revokeSupabaseToken(token) {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Error revoking Supabase token:', error);
    }
  }
}

// Create singleton instance
export const tokenService = new TokenService();

export default TokenService;
