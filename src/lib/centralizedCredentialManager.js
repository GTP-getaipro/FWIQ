/**
 * Centralized N8N Credential Manager
 * 
 * This service is the SINGLE source of truth for creating and managing
 * N8N credentials. All other services MUST use this instead of creating
 * credentials directly.
 * 
 * Architecture:
 * - Single point of credential creation
 * - Duplicate prevention
 * - Centralized cleanup
 * - Consistent credential types and naming
 */

import { createClient } from '@supabase/supabase-js';

class CentralizedCredentialManager {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.n8nApiUrl = process.env.N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud';
    this.n8nApiKey = process.env.N8N_API_KEY;
    
    this.supabaseAdmin = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Get or create Gmail credential for a user
   * This is the ONLY function that should create Gmail credentials
   * 
   * @param {string} userId - User ID
   * @param {string} refreshToken - Gmail refresh token
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Credential information
   */
  async getOrCreateGmailCredential(userId, refreshToken, options = {}) {
    console.log(`🔍 Checking for existing Gmail credential for user: ${userId}`);
    
    // Step 1: Check if credential already exists
    const existingCredential = await this.findExistingGmailCredential(userId);
    if (existingCredential) {
      console.log(`✅ Found existing Gmail credential: ${existingCredential.id}`);
      return existingCredential;
    }

    // Step 2: Validate we have required data
    if (!refreshToken) {
      throw new Error('Gmail refresh token is required to create credential');
    }

    // Step 3: Get integration data for OAuth tokens
    const integration = await this.getIntegrationData(userId, 'gmail');
    if (!integration) {
      throw new Error('Gmail integration not found for user');
    }

    // Step 4: Get business data for naming
    const businessData = await this.getBusinessData(userId);
    
    // Step 5: Create new credential
    console.log(`🔧 Creating new Gmail credential for user: ${userId}`);
    const credential = await this.createGmailCredential(userId, integration, businessData);
    
    // Step 6: Store credential mapping
    await this.storeCredentialMapping(userId, 'gmail', credential.id);
    
    console.log(`✅ Successfully created Gmail credential: ${credential.id}`);
    return credential;
  }

  /**
   * Find existing Gmail credential for user
   * Checks multiple sources to prevent duplicates
   */
  async findExistingGmailCredential(userId) {
    try {
      // Check integrations table first
      const { data: integration } = await this.supabaseAdmin
        .from('integrations')
        .select('n8n_credential_id')
        .eq('user_id', userId)
        .eq('provider', 'gmail')
        .eq('status', 'active')
        .single();

      if (integration?.n8n_credential_id) {
        console.log(`✅ Found Gmail credential in integrations: ${integration.n8n_credential_id}`);
        return { id: integration.n8n_credential_id, source: 'integrations' };
      }

      // Check credential mappings table
      const { data: mapping } = await this.supabaseAdmin
        .from('n8n_credential_mappings')
        .select('gmail_credential_id')
        .eq('user_id', userId)
        .single();

      if (mapping?.gmail_credential_id) {
        console.log(`✅ Found Gmail credential in mappings: ${mapping.gmail_credential_id}`);
        return { id: mapping.gmail_credential_id, source: 'mappings' };
      }

      console.log(`ℹ️ No existing Gmail credential found for user: ${userId}`);
      return null;
    } catch (error) {
      console.error('❌ Error finding existing Gmail credential:', error);
      return null;
    }
  }

  /**
   * Create new Gmail credential in N8N
   * Uses standardized type and naming convention
   */
  async createGmailCredential(userId, integration, businessData) {
    const businessSlug = this.sanitizeBusinessSlug(businessData?.name || 'unknown');
    const clientShort = userId.substring(0, 8);
    const credentialName = `${businessSlug}-${clientShort}-gmail`;

    const credentialPayload = {
      name: credentialName,
      type: 'googleOAuth2Api', // Standardized type
      data: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: '',
        oauthTokenData: {
          access_token: integration.access_token || '',
          refresh_token: integration.refresh_token,
          token_type: integration.token_type || 'Bearer',
          expires_in: 3599,
          scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels'
        }
      },
      nodesAccess: [
        { nodeType: 'n8n-nodes-base.gmail' },
        { nodeType: 'n8n-nodes-base.gmailTrigger' }
      ]
    };

    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentialPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create Gmail credential: ${response.status} ${errorText}`);
      }

      const credential = await response.json();
      console.log(`✅ Created Gmail credential in N8N: ${credential.id}`);
      return credential;
    } catch (error) {
      console.error('❌ Failed to create Gmail credential:', error);
      throw error;
    }
  }

  /**
   * Store credential mapping in database
   */
  async storeCredentialMapping(userId, provider, credentialId) {
    try {
      // Update integrations table
      await this.supabaseAdmin
        .from('integrations')
        .update({
          n8n_credential_id: credentialId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('status', 'active');

      // Update credential mappings table
      const mappingData = {
        user_id: userId,
        [`${provider}_credential_id`]: credentialId
      };

      await this.supabaseAdmin
        .from('n8n_credential_mappings')
        .upsert(mappingData, { onConflict: 'user_id' });

      console.log(`✅ Stored credential mapping: ${provider} -> ${credentialId}`);
    } catch (error) {
      console.error('❌ Failed to store credential mapping:', error);
      throw error;
    }
  }

  /**
   * Get integration data for user
   */
  async getIntegrationData(userId, provider) {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Failed to get ${provider} integration data:`, error);
      return null;
    }
  }

  /**
   * Get business data for user
   */
  async getBusinessData(userId) {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('profiles')
        .select('business_name, business_type')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return {
        name: data.business_name,
        type: data.business_type
      };
    } catch (error) {
      console.error('❌ Failed to get business data:', error);
      return { name: 'Unknown Business', type: 'Unknown' };
    }
  }

  /**
   * Sanitize business name for credential naming
   */
  sanitizeBusinessSlug(businessName) {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
  }

  /**
   * Clean up unused credentials
   * This should be called periodically to remove orphaned credentials
   */
  async cleanupUnusedCredentials() {
    console.log('🧹 Starting credential cleanup...');
    
    try {
      // Get all credential mappings
      const { data: mappings } = await this.supabaseAdmin
        .from('n8n_credential_mappings')
        .select('*');

      if (!mappings) return;

      for (const mapping of mappings) {
        // Check if user still exists and has active integrations
        const { data: user } = await this.supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', mapping.user_id)
          .single();

        if (!user) {
          console.log(`🗑️ User ${mapping.user_id} not found, cleaning up credentials...`);
          await this.deleteCredentialIfExists(mapping.gmail_credential_id);
          await this.deleteCredentialIfExists(mapping.outlook_credential_id);
          await this.deleteCredentialIfExists(mapping.openai_credential_id);
          
          // Remove mapping
          await this.supabaseAdmin
            .from('n8n_credential_mappings')
            .delete()
            .eq('user_id', mapping.user_id);
        }
      }

      console.log('✅ Credential cleanup completed');
    } catch (error) {
      console.error('❌ Credential cleanup failed:', error);
    }
  }

  /**
   * Delete credential from N8N if it exists
   */
  async deleteCredentialIfExists(credentialId) {
    if (!credentialId) return;

    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey
        }
      });

      if (response.ok) {
        console.log(`🗑️ Deleted credential: ${credentialId}`);
      } else {
        console.log(`ℹ️ Credential ${credentialId} may not exist or already deleted`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete credential ${credentialId}:`, error);
    }
  }

  /**
   * Get credential by ID (for validation)
   */
  async getCredentialById(credentialId) {
    try {
      const response = await fetch(`${this.n8nApiUrl}/api/v1/credentials/${credentialId}`, {
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey
        }
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`❌ Failed to get credential ${credentialId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const credentialManager = new CentralizedCredentialManager();
export default credentialManager;




