/**
 * N8N Workflow Activation Fix
 * Resolves the "Unable to sign without access token" error by ensuring
 * OAuth credentials are properly refreshed and injected into workflow nodes
 */

import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';

export class N8nWorkflowActivationFix {
  constructor() {
    this.n8nBaseUrl = 'https://n8n.srv995290.hstgr.cloud';
    this.n8nApiKey = import.meta.env.N8N_API_KEY;
    this.backendUrl = import.meta.env.BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Fix workflow activation by refreshing OAuth tokens and updating credentials
   * @param {string} workflowId - N8N workflow ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Fix result
   */
  async fixWorkflowActivation(workflowId, userId) {
    try {
      console.log(`🔧 Fixing workflow activation for ${workflowId}...`);

      // Step 1: Get workflow details
      const workflow = await this.getWorkflowDetails(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Step 2: Get user's active integrations
      const integrations = await this.getUserIntegrations(userId);
      if (!integrations.length) {
        throw new Error('No active integrations found for user');
      }

      // Step 3: Refresh OAuth tokens for all providers
      const refreshedTokens = await this.refreshAllTokens(userId, integrations);

      // Step 4: Update N8N credentials with fresh tokens
      await this.updateN8nCredentials(refreshedTokens);

      // Step 5: Update workflow nodes with fresh credential IDs
      await this.updateWorkflowCredentials(workflowId, refreshedTokens);

      // Step 6: Attempt activation again
      const activationResult = await this.activateWorkflow(workflowId);

      return {
        success: true,
        workflowId,
        activationResult,
        refreshedTokens: Object.keys(refreshedTokens)
      };

    } catch (error) {
      console.error('❌ Failed to fix workflow activation:', error);
      return {
        success: false,
        error: error.message,
        workflowId
      };
    }
  }

  /**
   * Get workflow details from N8N
   */
  async getWorkflowDetails(workflowId) {
    try {
      const response = await fetch(`${this.backendUrl}/api/n8n-proxy/api/v1/workflows/${workflowId}`, {
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get workflow details:', error);
      return null;
    }
  }

  /**
   * Get user's active integrations
   */
  async getUserIntegrations(userId) {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook']);

    if (error) {
      throw new Error(`Failed to get integrations: ${error.message}`);
    }

    return integrations || [];
  }

  /**
   * Refresh OAuth tokens for all providers
   */
  async refreshAllTokens(userId, integrations) {
    const refreshedTokens = {};

    for (const integration of integrations) {
      try {
        console.log(`🔄 Refreshing ${integration.provider} token...`);
        
        const accessToken = await getValidAccessToken(userId, integration.provider);
        
        refreshedTokens[integration.provider] = {
          accessToken,
          credentialId: integration.n8n_credential_id,
          provider: integration.provider,
          userId
        };

        console.log(`✅ ${integration.provider} token refreshed successfully`);
      } catch (error) {
        console.error(`❌ Failed to refresh ${integration.provider} token:`, error);
        // Continue with other providers
      }
    }

    return refreshedTokens;
  }

  /**
   * Update N8N credentials with fresh tokens
   */
  async updateN8nCredentials(refreshedTokens) {
    for (const [provider, tokenData] of Object.entries(refreshedTokens)) {
      if (!tokenData.credentialId) {
        console.warn(`⚠️ No credential ID for ${provider}, skipping update`);
        continue;
      }

      try {
        console.log(`🔐 Updating N8N credential ${tokenData.credentialId} for ${provider}...`);

        // Build credential data based on provider type
        let credentialData = {};
        
        if (provider === 'outlook') {
          credentialData = {
            oauthTokenData: {
              access_token: tokenData.accessToken,
              token_type: 'Bearer',
              expires_in: 3600,
              scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send'
            }
          };
        } else if (provider === 'gmail') {
          credentialData = {
            oauthTokenData: {
              access_token: tokenData.accessToken,
              token_type: 'Bearer',
              expires_in: 3600,
              scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.labels'
            }
          };
        }

        const response = await fetch(`${this.backendUrl}/api/n8n-proxy/api/v1/credentials/${tokenData.credentialId}`, {
          method: 'PATCH',
          headers: {
            'X-N8N-API-KEY': this.n8nApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentialData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to update ${provider} credential:`, errorText);
          continue;
        }

        console.log(`✅ Updated N8N credential for ${provider}`);
      } catch (error) {
        console.error(`❌ Error updating ${provider} credential:`, error);
      }
    }
  }

  /**
   * Update workflow nodes with fresh credential IDs
   */
  async updateWorkflowCredentials(workflowId, refreshedTokens) {
    try {
      const workflow = await this.getWorkflowDetails(workflowId);
      if (!workflow) {
        throw new Error('Failed to get workflow for credential update');
      }

      let updated = false;

      // Update nodes with fresh credentials
      workflow.nodes.forEach(node => {
        if (node.credentials) {
          Object.keys(node.credentials).forEach(credType => {
            if (credType === 'microsoftOutlookOAuth2Api' && refreshedTokens.outlook) {
              node.credentials[credType] = {
                id: refreshedTokens.outlook.credentialId,
                name: `Microsoft Outlook OAuth2 account`
              };
              updated = true;
            } else if ((credType === 'gmailOAuth2' || credType === 'googleOAuth2Api') && refreshedTokens.gmail) {
              node.credentials[credType] = {
                id: refreshedTokens.gmail.credentialId,
                name: `Gmail OAuth2 account`
              };
              updated = true;
            }
          });
        }
      });

      if (updated) {
        console.log('🔄 Updating workflow with fresh credentials...');
        
        const response = await fetch(`${this.backendUrl}/api/n8n-proxy/api/v1/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'X-N8N-API-KEY': this.n8nApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workflow)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update workflow: ${errorText}`);
        }

        console.log('✅ Workflow updated with fresh credentials');
      }
    } catch (error) {
      console.error('❌ Failed to update workflow credentials:', error);
      throw error;
    }
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(workflowId) {
    try {
      console.log(`🚀 Activating workflow ${workflowId}...`);

      const response = await fetch(`${this.backendUrl}/api/n8n-proxy/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.n8nApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Activation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Workflow activated successfully');
      
      return result;
    } catch (error) {
      console.error('❌ Failed to activate workflow:', error);
      throw error;
    }
  }

  /**
   * Check if workflow is properly configured
   */
  async validateWorkflowConfiguration(workflowId) {
    try {
      const workflow = await this.getWorkflowDetails(workflowId);
      if (!workflow) {
        return { valid: false, error: 'Workflow not found' };
      }

      const issues = [];

      // Check for nodes with missing credentials
      workflow.nodes.forEach(node => {
        if (node.credentials) {
          Object.entries(node.credentials).forEach(([credType, cred]) => {
            if (!cred.id) {
              issues.push(`Node ${node.name} has missing credential ID for ${credType}`);
            }
          });
        }
      });

      return {
        valid: issues.length === 0,
        issues,
        nodeCount: workflow.nodes.length
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

export const n8nWorkflowActivationFix = new N8nWorkflowActivationFix();
