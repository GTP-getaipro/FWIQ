/**
 * n8n API Client
 * Handles all communication with n8n instance
 */

export class N8nApiClient {
  constructor() {
    // Remove /settings/api from the base URL - that's the UI path, not the API path
    this.baseUrl = (import.meta.env.VITE_N8N_BASE_URL || import.meta.env.N8N_BASE_URL || '').replace('/settings/api', '');
    this.apiKey = import.meta.env.VITE_N8N_API_KEY || import.meta.env.N8N_API_KEY;

    // Warn if credentials are missing
    if (!this.baseUrl) {
      console.warn('⚠️ N8N_BASE_URL not configured - n8n API calls will fail');
    }
    if (!this.apiKey) {
      console.warn('⚠️ N8N_API_KEY not configured - n8n API calls will fail');
    }
  }

  /**
   * Get headers for API requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-N8N-API-KEY'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Make API request to n8n via backend proxy
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
    try {
      // Use backend proxy to avoid CORS issues
             const backendUrl = import.meta.env.BACKEND_URL || 'http://localhost:3001';
      const proxyUrl = `${backendUrl}/api/n8n-proxy/api/v1${endpoint}`;
      
      const config = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      console.log(`📡 n8n API request via proxy: ${options.method || 'GET'} ${proxyUrl}`);

      const response = await fetch(proxyUrl, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error('❌ n8n API request failed:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   * @param {Object} workflowData - Workflow configuration
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData) {
    return this.makeRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  /**
   * Get a workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Workflow data
   */
  async getWorkflow(workflowId) {
    return this.makeRequest(`/workflows/${workflowId}`);
  }

  /**
   * Update a workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(workflowId, updates) {
    return this.makeRequest(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Activate a workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Activation result
   */
  async activateWorkflow(workflowId) {
    return this.makeRequest(`/workflows/${workflowId}/activate`, {
      method: 'POST',
    });
  }

  /**
   * Deactivate a workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateWorkflow(workflowId) {
    return this.makeRequest(`/workflows/${workflowId}/deactivate`, {
      method: 'POST',
    });
  }

  /**
   * Delete a workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWorkflow(workflowId) {
    return this.makeRequest(`/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update a specific node in a workflow
   * @param {string} workflowId - Workflow ID
   * @param {string} nodeName - Node name
   * @param {Object} nodeUpdates - Node updates
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflowNode(workflowId, nodeName, nodeUpdates) {
    // First get the current workflow
    const { data: workflow } = await this.getWorkflow(workflowId);

    // Find and update the specific node
    const updatedNodes = workflow.nodes.map(node => {
      if (node.name === nodeName) {
        return {
          ...node,
          ...nodeUpdates,
        };
      }
      return node;
    });

    // Update the workflow with modified nodes
    return this.updateWorkflow(workflowId, {
      ...workflow,
      nodes: updatedNodes,
    });
  }

  /**
   * Get workflow executions
   * @param {string} workflowId - Workflow ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Executions data
   */
  async getWorkflowExecutions(workflowId, filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const endpoint = `/executions${workflowId ? `?workflowId=${workflowId}` : ''}${queryParams.toString() ? `&${queryParams.toString()}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Get a specific execution
   * @param {string} executionId - Execution ID
   * @returns {Promise<Object>} Execution data
   */
  async getExecution(executionId) {
    return this.makeRequest(`/executions/${executionId}`);
  }

  /**
   * Test n8n connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.makeRequest('/workflows');
      console.log('✅ n8n connection successful');
      return true;
    } catch (error) {
      console.error('❌ n8n connection failed:', error);
      return false;
    }
  }

  /**
   * Get n8n instance health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/workflows?limit=1`);
      const isHealthy = response.ok;
      
      return {
        healthy: isHealthy,
        status: isHealthy ? 'online' : 'offline',
        url: this.baseUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        error: error.message,
        url: this.baseUrl,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get webhook URLs for a workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Array>} Webhook URLs
   */
  async getWorkflowWebhooks(workflowId) {
    try {
      const { data: workflow } = await this.getWorkflow(workflowId);
      
      const webhookNodes = workflow.nodes.filter(node => 
        node.type === 'n8n-nodes-base.webhook'
      );

      const webhooks = webhookNodes.map(node => ({
        nodeId: node.id,
        nodeName: node.name,
        path: node.parameters.path,
        method: node.parameters.httpMethod,
        url: `${this.baseUrl}/webhook${node.parameters.path}`,
      }));

      return webhooks;
    } catch (error) {
      console.error('❌ Failed to get workflow webhooks:', error);
      return [];
    }
  }

  /**
   * Trigger a workflow manually
   * @param {string} workflowId - Workflow ID
   * @param {Object} inputData - Input data for the workflow
   * @returns {Promise<Object>} Execution result
   */
  async triggerWorkflow(workflowId, inputData = {}) {
    return this.makeRequest(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        input: inputData,
      }),
    });
  }
}

// Export singleton instance
export const n8nApiClient = new N8nApiClient();
