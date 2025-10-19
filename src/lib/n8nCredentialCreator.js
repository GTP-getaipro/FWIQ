/**
 * N8N Credential Creator
 * Creates n8n OAuth2 credentials programmatically using the correct n8n REST API
 * 
 * API Reference: n8n Public API v1.1.1 - https://docs.n8n.io/api/
 * Endpoint: POST /api/v1/credentials
 * Credential Types:
 *  - Gmail: "gmailOAuth2"
 *  - Outlook: "microsoftOutlookOAuth2Api"
 */

import { supabase } from './customSupabaseClient.js';
import { n8nCorsProxy } from './n8nCorsProxy.js';

export class N8nCredentialCreator {
  /**
   * Create or update n8n OAuth2 credential for Gmail or Outlook
   * @param {Object} params - Creation parameters
   * @param {string} params.userId - User ID
   * @param {string} params.provider - 'gmail' or 'outlook'
   * @param {string} params.businessName - Business name
   * @param {string} params.accessToken - OAuth access token
   * @param {string} params.refreshToken - OAuth refresh token
   * @returns {Promise<Object>} Created credential info
   */
  async createOAuth2Credential({ userId, provider, businessName, accessToken, refreshToken }) {
    try {
      console.log(`🔐 Creating n8n OAuth2 credential for ${provider}...`);

      // First, check if credential already exists for this user+provider
      const existingCredential = await this.findExistingCredential(userId, provider);
      
      if (existingCredential) {
        console.log(`✅ Found existing credential: ${existingCredential.id}, will reuse it`);
        return {
          success: true,
          credentialId: existingCredential.id,
          credentialName: existingCredential.name,
          provider: provider,
          existed: true
        };
      }

      // Get OAuth client credentials from environment
      const clientCredentials = this.getOAuthClientCredentials(provider);
      
      if (!clientCredentials) {
        throw new Error(`OAuth client credentials not configured for ${provider}`);
      }

      // Create credential name
      const credentialName = `${businessName} ${provider.charAt(0).toUpperCase() + provider.slice(1)}`.replace(/[^a-zA-Z0-9\s-]/g, '');

      // Build the credential payload using the CORRECT n8n format
      const credentialPayload = this.buildCredentialPayload({
        provider,
        credentialName,
        accessToken,
        refreshToken,
        clientId: clientCredentials.clientId,
        clientSecret: clientCredentials.clientSecret
      });

      console.log(`📤 Sending credential creation request to n8n (endpoint: /api/v1/credentials)...`);

      // Create credential via n8n API using the CORRECT endpoint
      const createResult = await n8nCorsProxy.proxyRequest('/api/v1/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: credentialPayload
      });

      if (!createResult || !createResult.id) {
        throw new Error(`Failed to create n8n credential: No credential ID returned`);
      }

      console.log(`✅ n8n credential created: ${createResult.id} (${credentialName})`);

      // Save credential mapping to Supabase
      await this.saveCredentialMapping(userId, provider, createResult.id, createResult.name || credentialName);

      return {
        success: true,
        credentialId: createResult.id,
        credentialName: createResult.name || credentialName,
        provider: provider
      };

    } catch (error) {
      console.error(`❌ Failed to create n8n credential for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Find existing n8n credential for user and provider
   */
  async findExistingCredential(userId, provider) {
    try {
      const { data, error } = await supabase
        .from('n8n_credentials')
        .select('n8n_credential_id, credential_name')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn(`⚠️ Error checking for existing credentials:`, error);
        return null;
      }

      if (data) {
        return {
          id: data.n8n_credential_id,
          name: data.credential_name
        };
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ Error finding existing credential:`, error);
      return null;
    }
  }

  /**
   * Build credential payload for n8n REST API
   * Based on n8nCredentialManager.js format
   */
  buildCredentialPayload({ provider, credentialName, accessToken, refreshToken, clientId, clientSecret }) {
    if (provider === 'gmail') {
      return {
        name: credentialName,
        type: "gmailOAuth2",  // Correct type name per N8N API docs
        data: {
          clientId: clientId,
          clientSecret: clientSecret,
          sendAdditionalBodyProperties: false,  // Required by N8N schema
          additionalBodyProperties: {},          // Required by N8N schema
          oauthTokenData: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "Bearer",
            scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels"
          }
        }
      };
    } else if (provider === 'outlook') {
      return {
        name: credentialName,
        type: "microsoftOutlookOAuth2Api",  // Correct type name per N8N API docs
        data: {
          clientId: clientId,
          clientSecret: clientSecret,
          sendAdditionalBodyProperties: false,  // Required by N8N schema
          additionalBodyProperties: {},          // Required by N8N schema
          useShared: false,                      // Use delegated permissions (not shared mailbox)
          oauthTokenData: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "Bearer"
          }
        }
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Get OAuth client credentials from environment
   */
  getOAuthClientCredentials(provider) {
    if (provider === 'gmail') {
      const clientId = import.meta.env.VITE_GMAIL_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GMAIL_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error('❌ Gmail OAuth client credentials not configured');
        console.error('   Required env vars: VITE_GMAIL_CLIENT_ID, VITE_GMAIL_CLIENT_SECRET');
        return null;
      }

      return { clientId, clientSecret };
    } else if (provider === 'outlook') {
      const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_OUTLOOK_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error('❌ Outlook OAuth client credentials not configured');
        console.error('   Required env vars: VITE_OUTLOOK_CLIENT_ID, VITE_OUTLOOK_CLIENT_SECRET');
        return null;
      }

      return { clientId, clientSecret };
    }

    return null;
  }

  /**
   * Save credential mapping to Supabase
   */
  async saveCredentialMapping(userId, provider, credentialId, credentialName) {
    try {
      // Store in integrations table with n8n_credential_id
      const { data, error } = await supabase
        .from('integrations')
        .update({
          n8n_credential_id: credentialId,
          n8n_credential_name: credentialName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('status', 'active');

      if (error) {
        console.error('❌ Failed to save credential mapping:', error);
        throw error;
      }

      console.log(`✅ Credential mapping saved: ${userId} -> ${credentialId} (${provider})`);
      return data;
    } catch (error) {
      console.error('❌ Failed to save credential mapping:', error);
      throw error;
    }
  }

  /**
   * Create credentials for all active integrations
   * @param {string} userId - User ID
   * @param {string} businessName - Business name
   * @returns {Promise<Object>} Created credentials map
   */
  async createCredentialsForUser(userId, businessName) {
    try {
      console.log(`🔐 Creating n8n credentials for user ${userId}...`);

      // Get all active integrations
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('provider, n8n_credential_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error || !integrations || integrations.length === 0) {
        throw new Error('No active integrations found');
      }

      const credentialsMap = {};

      // Create credentials for each integration
      for (const integration of integrations) {
        try {
          const credential = await this.createOAuth2Credential({
            userId: userId,
            provider: integration.provider,
            businessName: businessName,
            accessToken: integration.access_token,
            refreshToken: integration.refresh_token
          });

          credentialsMap[integration.provider] = credential.credentialId;
          console.log(`✅ ${integration.provider} credential: ${credential.credentialId} ${credential.existed ? '(reused existing)' : '(created new)'}`);
        } catch (providerError) {
          console.error(`❌ Failed to create ${integration.provider} credential:`, providerError);
          // Continue with other providers even if one fails
        }
      }

      if (Object.keys(credentialsMap).length === 0) {
        throw new Error('Failed to create any n8n credentials');
      }

      console.log(`✅ Processed ${Object.keys(credentialsMap).length} n8n credentials`);
      return {
        success: true,
        credentials: credentialsMap
      };

    } catch (error) {
      console.error('❌ Failed to create credentials for user:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const n8nCredentialCreator = new N8nCredentialCreator();

