/**
 * N8N Proxy Client
 * Routes all n8n API calls through backend to avoid CORS issues
 */
export class N8nProxyClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Test connection to n8n through proxy
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/test`, {
        method: 'GET',
        timeout: this.timeout
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ N8N proxy connection test failed:', error);
      return false;
    }
  }

  /**
   * Get workflow details
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Workflow details
   */
  async getWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}`, {
        method: 'GET',
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting workflow:', error);
      throw error;
    }
  }

  /**
   * List workflows
   * @param {object} options - Query options
   * @returns {Promise<object>} - List of workflows
   */
  async listWorkflows(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.active !== undefined) queryParams.append('active', options.active);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);

      const response = await fetch(`${this.baseUrl}/api/n8n/workflows?${queryParams}`, {
        method: 'GET',
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error listing workflows:', error);
      throw error;
    }
  }

  /**
   * Activate workflow
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Activation response
   */
  async activateWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}/activate`, {
        method: 'POST',
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to activate workflow: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Workflow activated successfully:', workflowId);
      return result;
    } catch (error) {
      console.error('❌ Error activating workflow:', error);
      throw error;
    }
  }

  /**
   * Deactivate workflow
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Deactivation response
   */
  async deactivateWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}/deactivate`, {
        method: 'POST',
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate workflow: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Workflow deactivated successfully:', workflowId);
      return result;
    } catch (error) {
      console.error('❌ Error deactivating workflow:', error);
      throw error;
    }
  }

  /**
   * Execute workflow manually
   * @param {string} workflowId - N8N workflow ID
   * @param {object} inputData - Input data for execution
   * @returns {Promise<object>} - Execution response
   */
  async executeWorkflow(workflowId, inputData = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: inputData }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Workflow executed successfully:', workflowId);
      return result;
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution history
   * @param {string} workflowId - N8N workflow ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Execution history
   */
  async getWorkflowExecutions(workflowId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.status) queryParams.append('status', options.status);
      if (options.from) queryParams.append('from', options.from);
      if (options.to) queryParams.append('to', options.to);

      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}/executions?${queryParams}`, {
        method: 'GET',
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to get executions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting executions:', error);
      throw error;
    }
  }

  /**
   * Delete workflow
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Deletion response
   */
  async deleteWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}`, {
        method: 'DELETE',
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.status}`);
      }

      console.log('✅ Workflow deleted successfully:', workflowId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting workflow:', error);
      throw error;
    }
  }

  /**
   * Deploy workflow
   * @param {object} workflow - Workflow JSON object
   * @param {object} options - Deployment options
   * @returns {Promise<object>} - Deployment result
   */
  async deployWorkflow(workflow, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.activate !== undefined) queryParams.append('activate', options.activate);

      const response = await fetch(`${this.baseUrl}/api/n8n/workflows?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to deploy workflow: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Workflow deployed successfully:', result.workflowId);
      return result;
    } catch (error) {
      console.error('❌ Error deploying workflow:', error);
      throw error;
    }
  }

  /**
   * Update workflow
   * @param {string} workflowId - N8N workflow ID
   * @param {object} workflow - Updated workflow JSON
   * @returns {Promise<object>} - Update result
   */
  async updateWorkflow(workflowId, workflow) {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update workflow: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Workflow updated successfully:', workflowId);
      return result;
    } catch (error) {
      console.error('❌ Error updating workflow:', error);
      throw error;
    }
  }

  /**
   * Check n8n health through proxy
   * @returns {Promise<object>} - Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/n8n/health`, {
        method: 'GET',
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Convenience function to create N8N proxy client
 * @param {object} config - Configuration options
 * @returns {N8nProxyClient} - N8N proxy client instance
 */
export function createN8nProxyClient(config = {}) {
  return new N8nProxyClient(config);
}

export default N8nProxyClient;
