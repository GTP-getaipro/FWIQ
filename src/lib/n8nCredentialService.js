/**
 * n8n Credential Management Service
 * 
 * Handles OAuth credential creation and management in n8n
 * Replaces direct token storage in Supabase with n8n credential references
 */

import { supabase } from '@/lib/customSupabaseClient';

class N8nCredentialService {
  constructor() {
    this.n8nBaseUrl = process.env.VITE_N8N_BASE_URL || 'https://n8n.app.floworx-iq.com';
    this.n8nApiKey = process.env.VITE_N8N_API_KEY; // This should be stored securely
  }

  /**
   * Get n8n API headers with authentication
   */
  getApiHeaders() {
    return {
      'Authorization': `Bearer ${this.n8nApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Create OAuth2 credential in n8n
   * @param {string} provider - 'gmail' or 'outlook'
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @param {string} businessName - Business name for credential naming
   * @param {string} userId - User ID for unique naming
   */
  async createOAuth2Credential(provider, clientId, clientSecret, businessName, userId) {
    try {
      const credentialName = `${provider}-oauth2-${businessName}-${userId}`.replace(/[^a-zA-Z0-9-]/g, '-');
      
      const credentialData = {
        name: credentialName,
        type: 'oauth2',
        data: {
          clientId,
          clientSecret,
          // OAuth2 URLs will be handled by n8n's built-in providers
          ...this.getProviderSpecificConfig(provider)
        }
      };

      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials`, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(credentialData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create n8n credential: ${response.status} ${errorData}`);
      }

      const credential = await response.json();
      console.log(`✅ Created n8n credential: ${credential.name} (ID: ${credential.id})`);
      
      return credential;
    } catch (error) {
      console.error('❌ Failed to create n8n credential:', error);
      throw error;
    }
  }

  /**
   * Get provider-specific OAuth2 configuration
   */
  getProviderSpecificConfig(provider) {
    switch (provider) {
      case 'gmail':
        return {
          scope: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          accessTokenUrl: 'https://oauth2.googleapis.com/token',
          authQueryParameters: {
            access_type: 'offline',
            prompt: 'consent'
          }
        };
      
      case 'outlook':
        return {
          scope: 'Mail.ReadWrite Mail.Read offline_access User.Read MailboxSettings.ReadWrite',
          authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          accessTokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          authQueryParameters: {
            response_mode: 'query'
          }
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get all credentials from n8n
   */
  async getAllCredentials() {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials`, {
        headers: this.getApiHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch credentials: ${response.status}`);
      }

      const credentials = await response.json();
      return credentials;
    } catch (error) {
      console.error('❌ Failed to fetch n8n credentials:', error);
      throw error;
    }
  }

  /**
   * Get a specific credential by ID
   */
  async getCredential(credentialId) {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials/${credentialId}`, {
        headers: this.getApiHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch credential ${credentialId}: ${response.status}`);
      }

      const credential = await response.json();
      return credential;
    } catch (error) {
      console.error(`❌ Failed to fetch credential ${credentialId}:`, error);
      throw error;
    }
  }

  /**
   * Find the most recent credential for a user
   * @param {string} provider - 'gmail' or 'outlook'
   * @param {string} businessName - Business name to search for
   * @param {string} userId - User ID to search for
   */
  async findUserCredential(provider, businessName, userId) {
    try {
      const credentials = await this.getAllCredentials();
      const searchPattern = `${provider}-oauth2-${businessName}-${userId}`.replace(/[^a-zA-Z0-9-]/g, '-');
      
      // Find credentials matching the pattern, sorted by creation date (most recent first)
      const matchingCredentials = credentials
        .filter(cred => cred.name.includes(searchPattern))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return matchingCredentials.length > 0 ? matchingCredentials[0] : null;
    } catch (error) {
      console.error('❌ Failed to find user credential:', error);
      throw error;
    }
  }

  /**
   * Delete a credential from n8n
   */
  async deleteCredential(credentialId) {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: this.getApiHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to delete credential ${credentialId}: ${response.status}`);
      }

      console.log(`✅ Deleted n8n credential: ${credentialId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete credential ${credentialId}:`, error);
      throw error;
    }
  }

  /**
   * Save credential mapping to Supabase
   */
  async saveCredentialMapping(clientId, businessName, n8nCredentialId, provider) {
    try {
      const { data, error } = await supabase.rpc('save_client_credential_mapping', {
        p_client_id: clientId,
        p_business_name: businessName,
        p_n8n_credential_id: n8nCredentialId,
        p_provider: provider
      });

      if (error) {
        throw new Error(`Failed to save credential mapping: ${error.message}`);
      }

      console.log(`✅ Saved credential mapping: ${clientId} -> ${n8nCredentialId} (${provider})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save credential mapping:', error);
      throw error;
    }
  }

  /**
   * Get credential mapping for a client
   */
  async getCredentialMapping(clientId, provider = null) {
    try {
      const { data, error } = await supabase.rpc('get_client_credential_mapping', {
        p_client_id: clientId,
        p_provider: provider
      });

      if (error) {
        throw new Error(`Failed to get credential mapping: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get credential mapping:', error);
      throw error;
    }
  }

  /**
   * Get OAuth redirect URL for n8n credential flow
   */
  getOAuthRedirectUrl(provider, clientId, clientSecret, businessName, userId) {
    const credentialName = `${provider}-oauth2-${businessName}-${userId}`.replace(/[^a-zA-Z0-9-]/g, '-');
    const params = new URLSearchParams({
      name: credentialName,
      type: 'oauth2',
      clientId,
      clientSecret,
      ...this.getProviderSpecificConfig(provider)
    });

    return `${this.n8nBaseUrl}/rest/oauth2-credential/callback?${params.toString()}`;
  }

  /**
   * Handle OAuth callback from n8n
   * This should be called after the user completes OAuth in n8n
   */
  async handleOAuthCallback(provider, businessName, userId) {
    try {
      // Find the most recent credential created for this user
      const credential = await this.findUserCredential(provider, businessName, userId);
      
      if (!credential) {
        throw new Error('No credential found after OAuth completion');
      }

      // Save the mapping to Supabase
      await this.saveCredentialMapping(userId, businessName, credential.id, provider);
      
      console.log(`✅ OAuth callback handled: ${provider} credential ${credential.id} mapped to user ${userId}`);
      
      return {
        success: true,
        credentialId: credential.id,
        credentialName: credential.name
      };
    } catch (error) {
      console.error('❌ Failed to handle OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Migrate existing integration to n8n credential
   * This is for migrating users from the old system
   */
  async migrateExistingIntegration(userId, provider, businessName, existingTokens) {
    try {
      console.log(`🔄 Migrating ${provider} integration for user ${userId}...`);
      
      // Create new credential in n8n with existing tokens
      const credential = await this.createOAuth2Credential(
        provider,
        existingTokens.clientId,
        existingTokens.clientSecret,
        businessName,
        userId
      );

      // Save mapping
      await this.saveCredentialMapping(userId, businessName, credential.id, provider);
      
      console.log(`✅ Migration complete: ${provider} integration migrated to credential ${credential.id}`);
      
      return {
        success: true,
        credentialId: credential.id,
        migrated: true
      };
    } catch (error) {
      console.error(`❌ Migration failed for ${provider}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const n8nCredentialService = new N8nCredentialService();

// Export class for testing
export { N8nCredentialService };
