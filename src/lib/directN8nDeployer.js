/**
 * Direct n8n Integration for Frontend
 * Bypasses backend and calls n8n API directly
 */

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzUyYTAyMi1hZWQzLTQ5YjItOTI3MS1hYWY0MDBiZGU3MTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5NTk1OTE0fQ.M1GAoAVvmU9BqMz0qR8Okr38YwI3L9PWYIPYDtlhjFY';
const N8N_BASE_URL = 'https://n8n.srv995290.hstgr.cloud/api/v1';

class DirectN8nDeployer {
  constructor() {
    this.apiKey = N8N_API_KEY;
    this.baseUrl = N8N_BASE_URL;
  }

  /**
   * Deploy workflow directly to n8n
   */
  async deployWorkflow(workflow) {
    try {
      console.log('🚀 Deploying workflow directly to n8n...');
      
      // Test n8n connectivity first
      console.log('🔍 Testing n8n connectivity...');
      const healthResponse = await fetch(`${this.baseUrl}/workflows?limit=1`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        }
      });

      if (!healthResponse.ok) {
        throw new Error(`N8N health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }

      console.log('✅ N8N connectivity confirmed');
      
      // Create workflow in n8n
      console.log('📝 Creating workflow in n8n...');
      const createResponse = await fetch(`${this.baseUrl}/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Workflow creation failed:', errorText);
        throw new Error(`Failed to create workflow: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
      }

      const createdWorkflow = await createResponse.json();
      console.log('✅ Workflow created:', createdWorkflow.id);

      // Activate the workflow
      console.log('🔄 Activating workflow...');
      const activateResponse = await fetch(`${this.baseUrl}/workflows/${createdWorkflow.id}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.error('❌ Workflow activation failed:', errorText);
        throw new Error(`Failed to activate workflow: ${activateResponse.status} ${activateResponse.statusText} - ${errorText}`);
      }

      console.log('✅ Workflow activated successfully!');

      return {
        success: true,
        workflowId: createdWorkflow.id,
        workflowName: createdWorkflow.name,
        webhookUrl: `https://n8n.srv995290.hstgr.cloud/webhook/floworx-${createdWorkflow.id}`,
        deployedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Direct deployment failed:', error.message);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to n8n server. Please check if the n8n instance is running and accessible.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication failed. Please check the n8n API key configuration.';
      } else if (error.message.includes('404')) {
        errorMessage = 'N8N endpoint not found. Please check the n8n base URL configuration.';
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.stack
      };
    }
  }

  /**
   * Test connectivity to n8n
   */
  async testConnectivity() {
    try {
      console.log('🧪 Testing n8n connectivity...');
      
      const response = await fetch(`${this.baseUrl}/workflows?limit=1`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        }
      });

      if (response.ok) {
        console.log('✅ N8N connectivity test passed');
        return {
          success: true,
          message: 'N8N connectivity confirmed'
        };
      } else {
        console.log('❌ N8N connectivity test failed:', response.status, response.statusText);
        return {
          success: false,
          error: `N8N connectivity failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('❌ N8N connectivity test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DirectN8nDeployer;