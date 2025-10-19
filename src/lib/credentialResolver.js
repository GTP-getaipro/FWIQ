/**
 * Credential ID Resolver with Caching
 * Manages credential creation and caching to avoid re-fetching/re-creating existing credentials
 */

import { supabase } from './customSupabaseClient.js';

export class CredentialResolver {
  constructor() {
    this.credentialCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.n8nApiKey = null;
    this.n8nBaseUrl = null;
  }

  /**
   * Initialize the credential resolver
   * @param {string} n8nBaseUrl - N8N base URL
   * @param {string} n8nApiKey - N8N API key
   */
  initialize(n8nBaseUrl, n8nApiKey) {
    this.n8nBaseUrl = n8nBaseUrl;
    this.n8nApiKey = n8nApiKey;
    console.log('🔐 CredentialResolver initialized');
  }

  /**
   * Get or create credential for a user
   * @param {string} userId - User ID
   * @param {string} provider - Provider type (gmail, openai, postgres, etc.)
   * @param {Object} credentialData - Credential data
   * @returns {Promise<Object>} Credential information
   */
  async getOrCreateCredential(userId, provider, credentialData = {}) {
    const cacheKey = `${userId}_${provider}`;
    
    // Check cache first
    const cached = this.getCachedCredential(cacheKey);
    if (cached) {
      console.log(`📋 Using cached credential for ${provider}:`, cached.id);
      return cached;
    }

    try {
      // Check if credential exists in database
      const existingCredential = await this.findExistingCredential(userId, provider);
      
      if (existingCredential) {
        // Verify credential still exists in N8N
        const isValid = await this.verifyCredentialInN8n(existingCredential.n8n_credential_id);
        
        if (isValid) {
          this.cacheCredential(cacheKey, existingCredential);
          console.log(`✅ Found existing valid credential for ${provider}:`, existingCredential.n8n_credential_id);
          return existingCredential;
        } else {
          console.log(`⚠️ Existing credential for ${provider} is invalid, creating new one`);
        }
      }

      // Create new credential
      const newCredential = await this.createNewCredential(userId, provider, credentialData);
      
      // Cache the new credential
      this.cacheCredential(cacheKey, newCredential);
      
      console.log(`✅ Created new credential for ${provider}:`, newCredential.n8n_credential_id);
      return newCredential;

    } catch (error) {
      console.error(`❌ Failed to get/create credential for ${provider}:`, error);
      throw new Error(`Credential resolution failed for ${provider}: ${error.message}`);
    }
  }

  /**
   * Find existing credential in database
   * @param {string} userId - User ID
   * @param {string} provider - Provider type
   * @returns {Promise<Object|null>} Existing credential or null
   */
  async findExistingCredential(userId, provider) {
    try {
      const { data, error } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('client_id', userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error finding existing credential:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception finding existing credential:', error);
      return null;
    }
  }

  /**
   * Verify credential exists in N8N
   * @param {string} credentialId - N8N credential ID
   * @returns {Promise<boolean>} True if credential is valid
   */
  async verifyCredentialInN8n(credentialId) {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials/${credentialId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error verifying credential in N8N:', error);
      return false;
    }
  }

  /**
   * Create new credential in N8N and database
   * @param {string} userId - User ID
   * @param {string} provider - Provider type
   * @param {Object} credentialData - Credential data
   * @returns {Promise<Object>} Created credential
   */
  async createNewCredential(userId, provider, credentialData) {
    const credentialId = `${provider}_${userId.substring(0, 8)}_${Date.now()}`;
    
    // Create credential in N8N
    const n8nCredential = await this.createCredentialInN8n(credentialId, provider, credentialData);
    
    // Store credential mapping in database
    const credentialRecord = {
      client_id: userId,
      provider: provider,
      n8n_credential_id: credentialId,
      credential_name: `${credentialData.businessName || 'Business'} ${provider.toUpperCase()}`,
      status: 'active',
      created_at: new Date().toISOString(),
      metadata: {
        n8n_id: n8nCredential.id,
        created_via: 'automated_resolver',
        version: '1.0.0'
      }
    };

    const { data, error } = await supabase
      .from('client_credentials_map')
      .insert(credentialRecord)
      .select()
      .single();

    if (error) {
      console.error('Error storing credential mapping:', error);
      throw new Error(`Failed to store credential mapping: ${error.message}`);
    }

    return data;
  }

  /**
   * Create credential in N8N
   * @param {string} credentialId - Credential ID
   * @param {string} provider - Provider type
   * @param {Object} credentialData - Credential data
   * @returns {Promise<Object>} N8N credential response
   */
  async createCredentialInN8n(credentialId, provider, credentialData) {
    const credentialPayload = this.buildCredentialPayload(credentialId, provider, credentialData);
    
    const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': this.n8nApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentialPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N credential creation failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Build credential payload for N8N
   * @param {string} credentialId - Credential ID
   * @param {string} provider - Provider type
   * @param {Object} credentialData - Credential data
   * @returns {Object} Credential payload
   */
  buildCredentialPayload(credentialId, provider, credentialData) {
    const basePayload = {
      id: credentialId,
      name: `${credentialData.businessName || 'Business'} ${provider.toUpperCase()}`,
      type: this.getN8nCredentialType(provider),
      data: {}
    };

    switch (provider) {
      case 'gmail':
        return {
          ...basePayload,
          data: {
            clientId: credentialData.clientId || process.env.GOOGLE_CLIENT_ID,
            clientSecret: credentialData.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
            accessToken: credentialData.accessToken,
            refreshToken: credentialData.refreshToken,
            scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose'
          }
        };

      case 'openai':
        return {
          ...basePayload,
          data: {
            apiKey: credentialData.apiKey || process.env.OPENAI_API_KEY
          }
        };

      case 'postgres':
        return {
          ...basePayload,
          data: {
            host: credentialData.host || process.env.SUPABASE_HOST,
            port: credentialData.port || 5432,
            database: credentialData.database || 'postgres',
            user: credentialData.user || 'postgres',
            password: credentialData.password || process.env.SUPABASE_PASSWORD,
            ssl: true
          }
        };

      default:
        throw new Error(`Unsupported credential provider: ${provider}`);
    }
  }

  /**
   * Get N8N credential type for provider
   * @param {string} provider - Provider type
   * @returns {string} N8N credential type
   */
  getN8nCredentialType(provider) {
    const typeMap = {
      'gmail': 'n8n-nodes-base.gmailOAuth2',
      'openai': 'n8n-nodes-base.openAi',
      'postgres': 'n8n-nodes-base.postgres'
    };
    
    return typeMap[provider] || `n8n-nodes-base.${provider}`;
  }

  /**
   * Get cached credential
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached credential or null
   */
  getCachedCredential(cacheKey) {
    const cached = this.credentialCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.credentialCache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Cache credential
   * @param {string} cacheKey - Cache key
   * @param {Object} credential - Credential data
   */
  cacheCredential(cacheKey, credential) {
    this.credentialCache.set(cacheKey, {
      data: credential,
      timestamp: Date.now()
    });
  }

  /**
   * Clear credential cache for user
   * @param {string} userId - User ID
   */
  clearUserCache(userId) {
    const keysToDelete = [];
    
    for (const key of this.credentialCache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.credentialCache.delete(key));
    console.log(`🗑️ Cleared credential cache for user: ${userId}`);
  }

  /**
   * Get all credentials for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User credentials
   */
  async getUserCredentials(userId) {
    try {
      const { data, error } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('client_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user credentials:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching user credentials:', error);
      return [];
    }
  }

  /**
   * Invalidate credential (mark as inactive)
   * @param {string} userId - User ID
   * @param {string} provider - Provider type
   * @returns {Promise<boolean>} Success status
   */
  async invalidateCredential(userId, provider) {
    try {
      const { error } = await supabase
        .from('client_credentials_map')
        .update({ status: 'inactive', invalidated_at: new Date().toISOString() })
        .eq('client_id', userId)
        .eq('provider', provider)
        .eq('status', 'active');

      if (error) {
        console.error('Error invalidating credential:', error);
        return false;
      }

      // Clear from cache
      this.clearUserCache(userId);
      
      console.log(`✅ Invalidated credential for ${provider}`);
      return true;
    } catch (error) {
      console.error('Exception invalidating credential:', error);
      return false;
    }
  }
}

export const credentialResolver = new CredentialResolver();


