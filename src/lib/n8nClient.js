import fetch from 'node-fetch';

/**
 * N8N REST Client
 * Handles all communication with n8n automation engine
 */
export class N8nClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = config.apiKey || process.env.N8N_API_KEY;
    this.timeout = config.timeout || 30000;
    
    if (!this.apiKey) {
      throw new Error('N8N_API_KEY is required');
    }
  }

  /**
   * Create a new workflow in n8n
   * @param {object} workflow - Workflow JSON object
   * @returns {Promise<object>} - Created workflow response
   */
  async createWorkflow(workflow) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.apiKey
        },
        body: JSON.stringify(workflow),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create workflow: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Workflow created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Update an existing workflow
   * @param {string} workflowId - N8N workflow ID
   * @param {object} workflow - Updated workflow JSON
   * @returns {Promise<object>} - Updated workflow response
   */
  async updateWorkflow(workflowId, workflow) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.apiKey
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
   * Activate a workflow
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Activation response
   */
  async activateWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to activate workflow: ${response.status} ${errorText}`);
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
   * Deactivate a workflow
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Deactivation response
   */
  async deactivateWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/deactivate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to deactivate workflow: ${response.status}`;
        
        if (response.status === 404) {
          errorMessage = `Workflow not found in n8n (ID: ${workflowId}) - may have been manually deleted`;
        } else if (response.status === 400) {
          errorMessage = `Workflow is already inactive (ID: ${workflowId})`;
        } else {
          errorMessage += ` ${errorText}`;
        }
        
        throw new Error(errorMessage);
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
   * Get workflow details
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Workflow details
   */
  async getWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get workflow: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting workflow:', error);
      throw error;
    }
  }

  /**
   * List all workflows
   * @param {object} options - Query options
   * @returns {Promise<object>} - List of workflows
   */
  async listWorkflows(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.active !== undefined) queryParams.append('active', options.active);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.offset) queryParams.append('offset', options.offset);

      const response = await fetch(`${this.baseUrl}/api/v1/workflows?${queryParams}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list workflows: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error listing workflows:', error);
      throw error;
    }
  }

  /**
   * Delete a workflow
   * @param {string} workflowId - N8N workflow ID
   * @returns {Promise<object>} - Deletion response
   */
  async deleteWorkflow(workflowId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete workflow: ${response.status} ${errorText}`);
      }

      console.log('✅ Workflow deleted successfully:', workflowId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow manually
   * @param {string} workflowId - N8N workflow ID
   * @param {object} inputData - Input data for execution
   * @returns {Promise<object>} - Execution response
   */
  async executeWorkflow(workflowId, inputData = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.apiKey
        },
        body: JSON.stringify({ data: inputData }),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute workflow: ${response.status} ${errorText}`);
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

      const response = await fetch(`${this.baseUrl}/api/v1/executions?workflowId=${workflowId}&${queryParams}`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get executions: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting executions:', error);
      throw error;
    }
  }

  /**
   * Test n8n connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey
        },
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      console.error('❌ N8N connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Deploy workflow with activation
   * @param {object} workflow - Workflow JSON object
   * @param {object} options - Deployment options
   * @returns {Promise<object>} - Deployment result
   */
  async deployWorkflow(workflow, options = {}) {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting workflow deployment...');
      
      // Step 1: Create workflow
      const createdWorkflow = await this.createWorkflow(workflow);
      
      // Step 2: Activate if requested (default: true)
      if (options.activate !== false) {
        await this.activateWorkflow(createdWorkflow.id);
      }
      
      const deploymentTime = Date.now() - startTime;
      
      console.log(`✅ Workflow deployed successfully in ${deploymentTime}ms`);
      
      return {
        success: true,
        workflowId: createdWorkflow.id,
        deploymentTime,
        status: options.activate !== false ? 'active' : 'inactive',
        workflow: createdWorkflow
      };
      
    } catch (error) {
      const deploymentTime = Date.now() - startTime;
      console.error(`❌ Workflow deployment failed after ${deploymentTime}ms:`, error);
      
      return {
        success: false,
        error: error.message,
        deploymentTime
      };
    }
  }

  /**
   * Redeploy workflow (update + reactivate)
   * @param {string} workflowId - Existing workflow ID
   * @param {object} workflow - Updated workflow JSON
   * @returns {Promise<object>} - Redeployment result
   */
  async redeployWorkflow(workflowId, workflow) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Starting workflow redeployment for ${workflowId}...`);
      
      // Step 1: Deactivate existing workflow
      await this.deactivateWorkflow(workflowId);
      
      // Step 2: Update workflow
      const updatedWorkflow = await this.updateWorkflow(workflowId, workflow);
      
      // Step 3: Reactivate
      await this.activateWorkflow(workflowId);
      
      const deploymentTime = Date.now() - startTime;
      
      console.log(`✅ Workflow redeployed successfully in ${deploymentTime}ms`);
      
      return {
        success: true,
        workflowId,
        deploymentTime,
        status: 'active',
        workflow: updatedWorkflow
      };
      
    } catch (error) {
      const deploymentTime = Date.now() - startTime;
      console.error(`❌ Workflow redeployment failed after ${deploymentTime}ms:`, error);
      
      return {
        success: false,
        workflowId,
        error: error.message,
        deploymentTime
      };
    }
  }
}

/**
 * Convenience function to create N8N client
 * @param {object} config - Configuration options
 * @returns {N8nClient} - N8N client instance
 */
export function createN8nClient(config = {}) {
  return new N8nClient(config);
}

export default N8nClient;
