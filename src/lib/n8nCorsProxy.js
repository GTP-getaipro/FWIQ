/**
 * CORS Proxy for n8n API Calls
 * 
 * This proxy routes n8n API calls through the backend to avoid CORS issues
 * when the frontend tries to communicate with n8n directly.
 * 
 * API Reference: N8N Public API v1.1.1 - https://docs.n8n.io/api/
 */

import { supabase } from './customSupabaseClient.js';
import { getN8nConfig } from './n8nConfig.js';

class N8nCorsProxy {
  constructor() {
    const config = getN8nConfig();
    this.n8nBaseUrl = config.baseUrl;
    this.n8nApiKey = config.apiKey;
    this.apiVersion = config.apiVersion;
  }

  /**
   * Make a proxied request to n8n API
   * @param {string} endpoint - API endpoint (e.g., '/api/v1/workflows', '/api/v1/credentials')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async proxyRequest(endpoint, options = {}) {
    try {
      console.log(`🔄 Proxying n8n API request: ${endpoint}`);
      
      // Use Supabase Edge Function to proxy the request
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          endpoint: endpoint,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body || null
        }
      });

      if (error) {
        console.warn('⚠️ Edge Function not available, falling back to direct API:', error.message);
        return await this.directApiCall(endpoint, options);
      }

      // Check if the response indicates an error
      if (data && data.error) {
        console.warn('⚠️ Edge Function returned error, falling back to direct API:', data.error);
        return await this.directApiCall(endpoint, options);
      }

      console.log(`✅ n8n proxy request successful: ${endpoint}`);
      return data;

    } catch (error) {
      console.warn('⚠️ Edge Function failed, falling back to direct API:', error.message);
      return await this.directApiCall(endpoint, options);
    }
  }

  /**
   * Make a direct API call to n8n (fallback when Edge Function is not available)
   * Uses Vite proxy in development (/n8n-api) or direct URL in production
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async directApiCall(endpoint, options = {}) {
    try {
      console.log(`🔄 Making direct n8n API request: ${endpoint}`);
      
      // In development, use backend n8n proxy to bypass CORS and handle authentication
      const isDevelopment = import.meta.env.DEV;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const url = isDevelopment 
        ? `${backendUrl}/api/n8n-proxy${endpoint}`  // Use backend n8n proxy
        : `${this.n8nBaseUrl}${endpoint}`;  // Direct call in production
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Backend proxy handles API key automatically in development
      // In production, add API key directly
      if (!isDevelopment) {
        headers['X-N8N-API-KEY'] = this.n8nApiKey;
      }

      const fetchOptions = {
        method: options.method || 'GET',
        headers: headers
      };

      // In development, don't set mode (let browser handle it)
      if (!isDevelopment) {
        fetchOptions.mode = 'cors';
      }

      if (options.body) {
        fetchOptions.body = options.body;
      }

      console.log(`📍 Using ${isDevelopment ? 'backend n8n proxy' : 'direct'} API call to: ${url}`);
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ N8N API Error ${response.status}: ${response.statusText}`);
        console.error(`❌ Error details: ${errorText}`);
        
        // For credential creation errors, provide more specific error handling
        if (endpoint.includes('/api/v1/credentials') && response.status === 500) {
          throw new Error(`N8N credential creation failed: ${errorText}`);
        }
        
        // For workflow activation errors, provide more specific error handling
        if (endpoint.includes('/activate') && response.status === 400) {
          throw new Error(`N8N workflow activation failed: ${errorText}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Direct n8n API request successful: ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`❌ Direct n8n API request failed ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Check n8n health
   * Note: N8N Public API doesn't have a dedicated health endpoint
   * We check health by attempting to access the workflows endpoint
   * @returns {Promise<Object>} Health check result
   */
  async checkHealth() {
    try {
      // Use workflows endpoint with limit=1 as a lightweight health check
      const response = await this.proxyRequest('/api/v1/workflows?limit=1');
      return {
        success: true,
        status: 'healthy',
        response: response
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Workflow data
   */
  async getWorkflow(workflowId) {
    try {
      const response = await this.proxyRequest(`/api/v1/workflows/${workflowId}`);
      return {
        success: true,
        workflow: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create or update workflow
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Creation result
   */
  async createWorkflow(workflowData) {
    try {
      const response = await this.proxyRequest('/api/v1/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });
      return {
        success: true,
        workflow: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Update result
   */
  async updateWorkflow(workflowId, workflowData) {
    try {
      const response = await this.proxyRequest(`/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });
      return {
        success: true,
        workflow: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Activate workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Activation result
   */
  async activateWorkflow(workflowId) {
    try {
      const response = await this.proxyRequest(`/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST'
      });
      return {
        success: true,
        response: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test webhook endpoint
   * @param {string} webhookPath - Webhook path
   * @param {Object} testData - Test data
   * @returns {Promise<Object>} Test result
   */
  async testWebhook(webhookPath, testData = {}) {
    try {
      const response = await this.proxyRequest(`/webhook/${webhookPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      return {
        success: true,
        response: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all workflows
   * @returns {Promise<Object>} Workflows list
   */
  async getAllWorkflows() {
    try {
      const response = await this.proxyRequest('/api/v1/workflows');
      return {
        success: true,
        workflows: response.data || response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWorkflow(workflowId) {
    try {
      const response = await this.proxyRequest(`/api/v1/workflows/${workflowId}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        response: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
export const n8nCorsProxy = new N8nCorsProxy();

// Export for backward compatibility
export default n8nCorsProxy;
