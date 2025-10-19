/**
 * Implement Login Workflow Restoration (Fixed)
 * This script creates the necessary functions to handle user login after workflow deployment
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const WORKFLOW_DEPLOYER_PATH = path.resolve(process.cwd(), 'src/lib/workflowDeployer.js');

function implementLoginWorkflowRestoration() {
  console.log("🔧 IMPLEMENTING LOGIN WORKFLOW RESTORATION");
  console.log("=" .repeat(60));
  
  try {
    console.log("📖 Reading workflowDeployer.js...");
    let content = readFileSync(WORKFLOW_DEPLOYER_PATH, 'utf8');
    
    // Add login workflow restoration functions
    console.log("🔧 Adding login workflow restoration functions...");
    
    const loginRestorationFunctions = `
  /**
   * Handle user login and restore workflow state
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Complete user dashboard state
   */
  async handleUserLogin(userId) {
    try {
      console.log('🔄 Handling user login for:', userId);
      
      // 1. Restore user session
      const userSession = await this.restoreUserSession(userId);
      
      // 2. Check workflow status
      const workflowStatus = await this.checkWorkflowStatus(userId);
      
      // 3. Verify email integrations
      const integrationStatus = await this.checkEmailIntegrations(userId);
      
      // 4. Perform health checks
      const healthStatus = await this.performHealthChecks(userId);
      
      // 5. Update dashboard state
      const dashboardState = {
        user: userSession,
        workflow: workflowStatus,
        integrations: integrationStatus,
        health: healthStatus,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ User login handled successfully');
      return dashboardState;
      
    } catch (error) {
      console.error('❌ Login process failed:', error);
      throw error;
    }
  }

  /**
   * Restore user session data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User session data
   */
  async restoreUserSession(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw new Error('Failed to restore user session: ' + error.message);
      }
      
      return {
        id: profile.id,
        email: profile.email,
        business_name: profile.business_name,
        business_types: profile.business_types,
        client_config: profile.client_config,
        last_login: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to restore user session:', error);
      throw error;
    }
  }

  /**
   * Check workflow status for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Workflow status information
   */
  async checkWorkflowStatus(userId) {
    try {
      console.log('🔍 Checking workflow status for user:', userId);
      
      // Get workflow from database
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error('Database error: ' + error.message);
      }
      
      if (!workflow) {
        return { 
          status: 'not_deployed', 
          message: 'No active workflow found',
          needs_deployment: true
        };
      }
      
      // Check n8n workflow status
      let n8nStatus = null;
      try {
        n8nStatus = await this.apiClient.getWorkflow(workflow.n8n_workflow_id);
      } catch (n8nError) {
        console.warn('⚠️ Could not check n8n workflow status:', n8nError.message);
        n8nStatus = { active: false, error: n8nError.message };
      }
      
      return {
        status: n8nStatus?.active ? 'active' : 'inactive',
        n8n_workflow_id: workflow.n8n_workflow_id,
        workflow_name: workflow.workflow_name,
        last_updated: workflow.updated_at,
        n8n_status: n8nStatus,
        needs_reactivation: !n8nStatus?.active
      };
      
    } catch (error) {
      console.error('❌ Failed to check workflow status:', error);
      return { 
        status: 'error', 
        message: error.message,
        needs_attention: true
      };
    }
  }

  /**
   * Check email integrations for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Email integration status
   */
  async checkEmailIntegrations(userId) {
    try {
      console.log('🔍 Checking email integrations for user:', userId);
      
      const { data: integrations, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (error) {
        throw new Error('Database error: ' + error.message);
      }
      
      if (!integrations || integrations.length === 0) {
        return { 
          status: 'no_integrations', 
          message: 'No email integrations found',
          needs_setup: true
        };
      }
      
      // Check each integration
      const integrationStatuses = await Promise.all(
        integrations.map(async (integration) => {
          try {
            // Test email provider connection
            const connectionTest = await this.testEmailConnection(integration);
            return {
              id: integration.id,
              provider: integration.provider,
              status: connectionTest.success ? 'connected' : 'disconnected',
              last_checked: new Date().toISOString(),
              error: connectionTest.error || null
            };
          } catch (error) {
            return {
              id: integration.id,
              provider: integration.provider,
              status: 'error',
              error: error.message,
              last_checked: new Date().toISOString()
            };
          }
        })
      );
      
      const connectedCount = integrationStatuses.filter(i => i.status === 'connected').length;
      const totalCount = integrationStatuses.length;
      
      return { 
        integrations: integrationStatuses,
        summary: {
          total: totalCount,
          connected: connectedCount,
          disconnected: totalCount - connectedCount,
          status: connectedCount === totalCount ? 'all_connected' : 'partial_connection'
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to check email integrations:', error);
      return { 
        status: 'error', 
        message: error.message,
        needs_attention: true
      };
    }
  }

  /**
   * Test email provider connection
   * @param {Object} integration - Email integration object
   * @returns {Promise<Object>} Connection test result
   */
  async testEmailConnection(integration) {
    try {
      // This is a simplified test - in production, you'd want more comprehensive testing
      if (!integration.access_token) {
        return { success: false, error: 'No access token available' };
      }
      
      // Test with a simple API call
      const testUrl = integration.provider === 'gmail' 
        ? 'https://www.googleapis.com/gmail/v1/users/me/profile'
        : 'https://graph.microsoft.com/v1.0/me';
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': 'Bearer ' + integration.access_token,
          'Content-Type': 'application/json'
        }
      });
      
      return { 
        success: response.ok, 
        error: response.ok ? null : 'HTTP ' + response.status + ': ' + response.statusText
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform comprehensive health checks
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Health check results
   */
  async performHealthChecks(userId) {
    try {
      console.log('🔍 Performing health checks for user:', userId);
      
      const healthChecks = {
        n8n: await this.checkN8nHealth(),
        email: await this.checkEmailHealth(userId),
        webhook: await this.checkWebhookHealth(userId),
        database: await this.checkDatabaseHealth(userId)
      };
      
      const overallHealth = Object.values(healthChecks).every(check => check.status === 'healthy') 
        ? 'healthy' 
        : 'unhealthy';
      
      return {
        overall: overallHealth,
        checks: healthChecks,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Health checks failed:', error);
      return {
        overall: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check n8n health
   * @returns {Promise<Object>} N8N health status
   */
  async checkN8nHealth() {
    try {
      const health = await this.apiClient.getHealth();
      return {
        status: health.status === 'ok' ? 'healthy' : 'unhealthy',
        details: health
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check email health
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Email health status
   */
  async checkEmailHealth(userId) {
    try {
      const { data: integrations } = await supabase
        .from('email_integrations')
        .select('provider, status')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      const activeIntegrations = integrations?.length || 0;
      
      return {
        status: activeIntegrations > 0 ? 'healthy' : 'unhealthy',
        active_integrations: activeIntegrations
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check webhook health
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Webhook health status
   */
  async checkWebhookHealth(userId) {
    try {
      // Check if user has active webhook
      const { data: workflow } = await supabase
        .from('workflows')
        .select('webhook_url')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (!workflow?.webhook_url) {
        return {
          status: 'unhealthy',
          error: 'No webhook URL found'
        };
      }
      
      // Test webhook endpoint
      const response = await fetch(workflow.webhook_url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        webhook_url: workflow.webhook_url,
        response_status: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check database health
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Database health status
   */
  async checkDatabaseHealth(userId) {
    try {
      // Simple database connectivity test
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1);
      
      return {
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message || null
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

`;

    // Insert the functions before the closing brace of the WorkflowDeployer class
    const insertPoint = content.lastIndexOf('}');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) + loginRestorationFunctions + content.slice(insertPoint);
      console.log("✅ Added login workflow restoration functions");
    }
    
    // Create backup
    const backupPath = WORKFLOW_DEPLOYER_PATH + '.backup.' + Date.now();
    writeFileSync(backupPath, readFileSync(WORKFLOW_DEPLOYER_PATH, 'utf8'));
    console.log(`📦 Created backup: ${backupPath}`);
    
    // Write the updated content
    console.log("💾 Writing updated workflowDeployer.js...");
    writeFileSync(WORKFLOW_DEPLOYER_PATH, content);
    
    console.log("\n✅ LOGIN WORKFLOW RESTORATION IMPLEMENTED!");
    console.log("=" .repeat(60));
    console.log("🔧 Functions added:");
    console.log("   1. ✅ handleUserLogin() - Main login handler");
    console.log("   2. ✅ restoreUserSession() - Restore user session data");
    console.log("   3. ✅ checkWorkflowStatus() - Check workflow status");
    console.log("   4. ✅ checkEmailIntegrations() - Verify email integrations");
    console.log("   5. ✅ performHealthChecks() - Comprehensive health checks");
    console.log("   6. ✅ testEmailConnection() - Test email provider connections");
    console.log("   7. ✅ checkN8nHealth() - Check n8n system health");
    console.log("   8. ✅ checkEmailHealth() - Check email system health");
    console.log("   9. ✅ checkWebhookHealth() - Check webhook endpoints");
    console.log("   10. ✅ checkDatabaseHealth() - Check database connectivity");
    
    console.log("\n🎯 Expected functionality:");
    console.log("   - User logs in and immediately sees workflow status");
    console.log("   - System checks all components automatically");
    console.log("   - Clear status indicators for what's working");
    console.log("   - Easy recovery options if issues are found");
    
    console.log("\n⚠️ Next steps:");
    console.log("   1. Test the login workflow restoration");
    console.log("   2. Integrate with the frontend dashboard");
    console.log("   3. Add error handling and user notifications");
    console.log("   4. Implement automatic recovery options");
    
  } catch (error) {
    console.error("❌ Implementation failed:", error.message);
  }
}

// Run the implementation
implementLoginWorkflowRestoration();
