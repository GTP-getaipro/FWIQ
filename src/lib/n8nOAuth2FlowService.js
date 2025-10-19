/**
 * N8N OAuth2 Flow Management Service
 * Handles proper OAuth2 credential creation and authorization flow initiation
 */

import { supabase } from '@/lib/customSupabaseClient';

export class N8nOAuth2FlowService {
  constructor() {
    this.n8nBaseUrl = process.env.VITE_N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
    this.n8nApiKey = process.env.VITE_N8N_API_KEY;
  }

  /**
   * Get N8N API headers
   */
  getApiHeaders() {
    return {
      'X-N8N-API-KEY': this.n8nApiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Create OAuth2 credential and initiate authorization flow
   * @param {string} provider - 'gmail' or 'outlook'
   * @param {string} clientId - OAuth client ID
   * @param {string} clientSecret - OAuth client secret
   * @param {string} businessName - Business name for credential naming
   * @param {string} userId - User ID for unique naming
   */
  async createOAuth2CredentialAndInitiateFlow(provider, clientId, clientSecret, businessName, userId) {
    try {
      console.log(`🔄 Creating ${provider} OAuth2 credential and initiating flow...`);

      // Step 1: Create OAuth2 credential
      const credential = await this.createOAuth2Credential(provider, clientId, clientSecret, businessName, userId);
      
      // Step 2: Initiate OAuth2 authorization flow
      const authUrl = await this.initiateOAuth2Flow(credential.id, provider);
      
      // Step 3: Store credential mapping
      await this.storeCredentialMapping(userId, businessName, credential.id, provider);

      return {
        success: true,
        credentialId: credential.id,
        credentialName: credential.name,
        authorizationUrl: authUrl,
        message: `Please complete OAuth2 authorization for ${provider}`
      };

    } catch (error) {
      console.error(`❌ Failed to create ${provider} OAuth2 credential and initiate flow:`, error);
      throw error;
    }
  }

  /**
   * Create OAuth2 credential in N8N
   */
  async createOAuth2Credential(provider, clientId, clientSecret, businessName, userId) {
    const credentialName = `${provider}-oauth2-${businessName}-${userId}`.replace(/[^a-zA-Z0-9-]/g, '-');
    
    const credentialData = {
      name: credentialName,
      type: this.getCredentialType(provider),
      data: {
        clientId,
        clientSecret,
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
      throw new Error(`Failed to create ${provider} credential: ${response.status} ${errorData}`);
    }

    const credential = await response.json();
    console.log(`✅ Created ${provider} credential: ${credential.id}`);
    
    return credential;
  }

  /**
   * Initiate OAuth2 authorization flow
   */
  async initiateOAuth2Flow(credentialId, provider) {
    try {
      // Get OAuth2 authorization URL from N8N
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials/${credentialId}/oauth2/authorize`, {
        method: 'GET',
        headers: this.getApiHeaders()
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to get OAuth2 authorization URL: ${response.status} ${errorData}`);
      }

      const authData = await response.json();
      console.log(`✅ OAuth2 authorization URL generated for ${provider}: ${authData.authUrl}`);
      
      return authData.authUrl;

    } catch (error) {
      console.error(`❌ Failed to initiate OAuth2 flow for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get credential type for provider
   */
  getCredentialType(provider) {
    switch (provider) {
      case 'gmail':
        return 'gmailOAuth2';
      case 'outlook':
        return 'microsoftOutlookOAuth2Api';
      default:
        throw new Error(`Unsupported provider: ${provider}`);
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
   * Store credential mapping in Supabase
   */
  async storeCredentialMapping(userId, businessName, credentialId, provider) {
    try {
      const { data, error } = await supabase
        .from('client_credentials_map')
        .upsert({
          client_id: userId,
          business_name: businessName,
          n8n_credential_id: credentialId,
          provider: provider,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id,provider'
        });

      if (error) {
        throw new Error(`Failed to store credential mapping: ${error.message}`);
      }

      console.log(`✅ Stored credential mapping: ${userId} -> ${credentialId} (${provider})`);
      return true;
    } catch (error) {
      console.error('❌ Failed to store credential mapping:', error);
      throw error;
    }
  }

  /**
   * Check OAuth2 credential status
   */
  async checkCredentialStatus(credentialId) {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/credentials/${credentialId}`, {
        headers: this.getApiHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to check credential status: ${response.status}`);
      }

      const credential = await response.json();
      
      return {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        hasAccessToken: !!credential.data?.accessToken,
        isActive: credential.data?.accessToken ? true : false,
        status: credential.data?.accessToken ? 'authorized' : 'pending_authorization'
      };

    } catch (error) {
      console.error(`❌ Failed to check credential status:`, error);
      throw error;
    }
  }

  /**
   * Get all OAuth2 credentials for a user
   */
  async getUserOAuth2Credentials(userId) {
    try {
      const { data, error } = await supabase
        .from('client_credentials_map')
        .select('provider, n8n_credential_id, business_name, created_at')
        .eq('client_id', userId);

      if (error) {
        throw new Error(`Failed to get user credentials: ${error.message}`);
      }

      // Check status of each credential
      const credentialsWithStatus = await Promise.all(
        data.map(async (mapping) => {
          try {
            const status = await this.checkCredentialStatus(mapping.n8n_credential_id);
            return {
              ...mapping,
              ...status
            };
          } catch (error) {
            console.error(`Failed to check status for credential ${mapping.n8n_credential_id}:`, error);
            return {
              ...mapping,
              status: 'error',
              hasAccessToken: false,
              isActive: false
            };
          }
        })
      );

      return credentialsWithStatus;
    } catch (error) {
      console.error('❌ Failed to get user OAuth2 credentials:', error);
      throw error;
    }
  }

  /**
   * Complete OAuth2 flow (called after user completes authorization)
   */
  async completeOAuth2Flow(credentialId, provider) {
    try {
      // Check if credential now has access token
      const status = await this.checkCredentialStatus(credentialId);
      
      if (status.hasAccessToken) {
        console.log(`✅ OAuth2 flow completed for ${provider} credential: ${credentialId}`);
        return {
          success: true,
          credentialId: credentialId,
          status: 'authorized',
          message: `${provider} OAuth2 authorization completed successfully`
        };
      } else {
        return {
          success: false,
          credentialId: credentialId,
          status: 'pending_authorization',
          message: `${provider} OAuth2 authorization still pending`
        };
      }
    } catch (error) {
      console.error(`❌ Failed to complete OAuth2 flow for ${provider}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const n8nOAuth2FlowService = new N8nOAuth2FlowService();

// Export class for testing
export { N8nOAuth2FlowService };
