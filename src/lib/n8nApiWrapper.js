/**
 * N8N API Wrapper
 * 
 * Official wrapper for N8N Public API v1.1.1
 * Reference: https://docs.n8n.io/api/
 * 
 * Base URL: /api/v1
 * Authentication: X-N8N-API-KEY header
 */

import { n8nCorsProxy } from './n8nCorsProxy.js';

/**
 * N8N Credential Types
 * These are the exact credential type names expected by N8N
 */
export const N8N_CREDENTIAL_TYPES = {
  GMAIL_OAUTH2: 'gmailOAuth2',           // Gmail OAuth2 credentials
  OUTLOOK_OAUTH2: 'microsoftOutlookOAuth2Api',  // Microsoft Outlook OAuth2 credentials
  GITHUB: 'githubApi',                   // GitHub API credentials
  SLACK_OAUTH2: 'slackOAuth2Api',        // Slack OAuth2 credentials
  // Add more as needed
};

/**
 * N8N API Wrapper Class
 * Provides type-safe methods for interacting with N8N Public API
 */
export class N8nApiWrapper {
  constructor() {
    this.proxy = n8nCorsProxy;
  }

  // ============================================================================
  // WORKFLOWS
  // ============================================================================

  /**
   * Create a new workflow
   * POST /api/v1/workflows
   * @param {Object} workflowData - Workflow configuration
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData) {
    return await this.proxy.proxyRequest('/api/v1/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowData)
    });
  }

  /**
   * Get all workflows
   * GET /api/v1/workflows
   * @param {Object} options - Query options (active, tags, name, projectId, limit, cursor)
   * @returns {Promise<Object>} Workflows list
   */
  async getWorkflows(options = {}) {
    const params = new URLSearchParams();
    
    if (options.active !== undefined) params.append('active', options.active);
    if (options.tags) params.append('tags', options.tags);
    if (options.name) params.append('name', options.name);
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.excludePinnedData) params.append('excludePinnedData', options.excludePinnedData);
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/workflows?${queryString}` : '/api/v1/workflows';

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get workflow by ID
   * GET /api/v1/workflows/{id}
   * @param {string} workflowId - Workflow ID
   * @param {boolean} excludePinnedData - Exclude pinned data
   * @returns {Promise<Object>} Workflow data
   */
  async getWorkflow(workflowId, excludePinnedData = false) {
    const endpoint = excludePinnedData 
      ? `/api/v1/workflows/${workflowId}?excludePinnedData=true`
      : `/api/v1/workflows/${workflowId}`;

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Update a workflow
   * PUT /api/v1/workflows/{id}
   * @param {string} workflowId - Workflow ID
   * @param {Object} workflowData - Updated workflow data
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(workflowId, workflowData) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowData)
    });
  }

  /**
   * Delete a workflow
   * DELETE /api/v1/workflows/{id}
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Deleted workflow
   */
  async deleteWorkflow(workflowId) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Activate a workflow
   * POST /api/v1/workflows/{id}/activate
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Activated workflow
   */
  async activateWorkflow(workflowId) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST'
    });
  }

  /**
   * Deactivate a workflow
   * POST /api/v1/workflows/{id}/deactivate
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Deactivated workflow
   */
  async deactivateWorkflow(workflowId) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}/deactivate`, {
      method: 'POST'
    });
  }

  /**
   * Transfer workflow to another project
   * PUT /api/v1/workflows/{id}/transfer
   * @param {string} workflowId - Workflow ID
   * @param {string} destinationProjectId - Destination project ID
   * @returns {Promise<Object>} Transfer result
   */
  async transferWorkflow(workflowId, destinationProjectId) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationProjectId })
    });
  }

  /**
   * Get workflow tags
   * GET /api/v1/workflows/{id}/tags
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Array>} Workflow tags
   */
  async getWorkflowTags(workflowId) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}/tags`, {
      method: 'GET'
    });
  }

  /**
   * Update workflow tags
   * PUT /api/v1/workflows/{id}/tags
   * @param {string} workflowId - Workflow ID
   * @param {Array} tagIds - Array of tag IDs: [{id: "tag-id"}]
   * @returns {Promise<Array>} Updated tags
   */
  async updateWorkflowTags(workflowId, tagIds) {
    return await this.proxy.proxyRequest(`/api/v1/workflows/${workflowId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tagIds)
    });
  }

  // ============================================================================
  // CREDENTIALS
  // ============================================================================

  /**
   * Create a credential
   * POST /api/v1/credentials
   * @param {Object} credentialData - Credential configuration
   * @returns {Promise<Object>} Created credential
   */
  async createCredential(credentialData) {
    return await this.proxy.proxyRequest('/api/v1/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentialData)
    });
  }

  /**
   * Delete a credential
   * DELETE /api/v1/credentials/{id}
   * @param {string} credentialId - Credential ID
   * @returns {Promise<Object>} Deleted credential
   */
  async deleteCredential(credentialId) {
    return await this.proxy.proxyRequest(`/api/v1/credentials/${credentialId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get credential schema
   * GET /api/v1/credentials/schema/{credentialTypeName}
   * @param {string} credentialTypeName - Credential type name
   * @returns {Promise<Object>} Credential schema
   */
  async getCredentialSchema(credentialTypeName) {
    return await this.proxy.proxyRequest(`/api/v1/credentials/schema/${credentialTypeName}`, {
      method: 'GET'
    });
  }

  /**
   * Transfer credential to another project
   * PUT /api/v1/credentials/{id}/transfer
   * @param {string} credentialId - Credential ID
   * @param {string} destinationProjectId - Destination project ID
   * @returns {Promise<Object>} Transfer result
   */
  async transferCredential(credentialId, destinationProjectId) {
    return await this.proxy.proxyRequest(`/api/v1/credentials/${credentialId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationProjectId })
    });
  }

  // ============================================================================
  // EXECUTIONS
  // ============================================================================

  /**
   * Get all executions
   * GET /api/v1/executions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Executions list
   */
  async getExecutions(options = {}) {
    const params = new URLSearchParams();
    
    if (options.includeData) params.append('includeData', options.includeData);
    if (options.status) params.append('status', options.status);
    if (options.workflowId) params.append('workflowId', options.workflowId);
    if (options.projectId) params.append('projectId', options.projectId);
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/executions?${queryString}` : '/api/v1/executions';

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get execution by ID
   * GET /api/v1/executions/{id}
   * @param {number} executionId - Execution ID
   * @param {boolean} includeData - Include execution data
   * @returns {Promise<Object>} Execution data
   */
  async getExecution(executionId, includeData = false) {
    const endpoint = includeData 
      ? `/api/v1/executions/${executionId}?includeData=true`
      : `/api/v1/executions/${executionId}`;

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Delete an execution
   * DELETE /api/v1/executions/{id}
   * @param {number} executionId - Execution ID
   * @returns {Promise<Object>} Deleted execution
   */
  async deleteExecution(executionId) {
    return await this.proxy.proxyRequest(`/api/v1/executions/${executionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Retry a failed execution
   * POST /api/v1/executions/{id}/retry
   * @param {number} executionId - Execution ID
   * @param {boolean} loadWorkflow - Load workflow before retry
   * @returns {Promise<Object>} Retry result
   */
  async retryExecution(executionId, loadWorkflow = true) {
    return await this.proxy.proxyRequest(`/api/v1/executions/${executionId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loadWorkflow })
    });
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  /**
   * Create a tag
   * POST /api/v1/tags
   * @param {string} name - Tag name
   * @returns {Promise<Object>} Created tag
   */
  async createTag(name) {
    return await this.proxy.proxyRequest('/api/v1/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  /**
   * Get all tags
   * GET /api/v1/tags
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tags list
   */
  async getTags(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/tags?${queryString}` : '/api/v1/tags';

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Get tag by ID
   * GET /api/v1/tags/{id}
   * @param {string} tagId - Tag ID
   * @returns {Promise<Object>} Tag data
   */
  async getTag(tagId) {
    return await this.proxy.proxyRequest(`/api/v1/tags/${tagId}`, {
      method: 'GET'
    });
  }

  /**
   * Update a tag
   * PUT /api/v1/tags/{id}
   * @param {string} tagId - Tag ID
   * @param {string} name - New tag name
   * @returns {Promise<Object>} Updated tag
   */
  async updateTag(tagId, name) {
    return await this.proxy.proxyRequest(`/api/v1/tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  /**
   * Delete a tag
   * DELETE /api/v1/tags/{id}
   * @param {string} tagId - Tag ID
   * @returns {Promise<Object>} Deleted tag
   */
  async deleteTag(tagId) {
    return await this.proxy.proxyRequest(`/api/v1/tags/${tagId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // USERS (Instance Owner Only)
  // ============================================================================

  /**
   * Get all users
   * GET /api/v1/users
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users list
   */
  async getUsers(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);
    if (options.includeRole) params.append('includeRole', options.includeRole);
    if (options.projectId) params.append('projectId', options.projectId);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/users?${queryString}` : '/api/v1/users';

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Create users
   * POST /api/v1/users
   * @param {Array} users - Array of user objects: [{email, role}]
   * @returns {Promise<Object>} Created users
   */
  async createUsers(users) {
    return await this.proxy.proxyRequest('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  }

  /**
   * Get user by ID or email
   * GET /api/v1/users/{id}
   * @param {string} idOrEmail - User ID or email
   * @param {boolean} includeRole - Include role in response
   * @returns {Promise<Object>} User data
   */
  async getUser(idOrEmail, includeRole = false) {
    const endpoint = includeRole 
      ? `/api/v1/users/${idOrEmail}?includeRole=true`
      : `/api/v1/users/${idOrEmail}`;

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Delete a user
   * DELETE /api/v1/users/{id}
   * @param {string} idOrEmail - User ID or email
   * @returns {Promise<void>}
   */
  async deleteUser(idOrEmail) {
    return await this.proxy.proxyRequest(`/api/v1/users/${idOrEmail}`, {
      method: 'DELETE'
    });
  }

  /**
   * Change user role
   * PATCH /api/v1/users/{id}/role
   * @param {string} idOrEmail - User ID or email
   * @param {string} newRoleName - New role name (e.g., "global:member")
   * @returns {Promise<Object>} Updated user
   */
  async changeUserRole(idOrEmail, newRoleName) {
    return await this.proxy.proxyRequest(`/api/v1/users/${idOrEmail}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRoleName })
    });
  }

  // ============================================================================
  // PROJECTS
  // ============================================================================

  /**
   * Create a project
   * POST /api/v1/projects
   * @param {string} name - Project name
   * @returns {Promise<Object>} Created project
   */
  async createProject(name) {
    return await this.proxy.proxyRequest('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  /**
   * Get all projects
   * GET /api/v1/projects
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Projects list
   */
  async getProjects(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/projects?${queryString}` : '/api/v1/projects';

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Update a project
   * PUT /api/v1/projects/{projectId}
   * @param {string} projectId - Project ID
   * @param {string} name - New project name
   * @returns {Promise<void>}
   */
  async updateProject(projectId, name) {
    return await this.proxy.proxyRequest(`/api/v1/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
  }

  /**
   * Delete a project
   * DELETE /api/v1/projects/{projectId}
   * @param {string} projectId - Project ID
   * @returns {Promise<void>}
   */
  async deleteProject(projectId) {
    return await this.proxy.proxyRequest(`/api/v1/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // VARIABLES
  // ============================================================================

  /**
   * Create a variable
   * POST /api/v1/variables
   * @param {string} key - Variable key
   * @param {string} value - Variable value
   * @returns {Promise<Object>} Created variable
   */
  async createVariable(key, value) {
    return await this.proxy.proxyRequest('/api/v1/variables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
  }

  /**
   * Get all variables
   * GET /api/v1/variables
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Variables list
   */
  async getVariables(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.cursor) params.append('cursor', options.cursor);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/variables?${queryString}` : '/api/v1/variables';

    return await this.proxy.proxyRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Update a variable
   * PUT /api/v1/variables/{id}
   * @param {string} variableId - Variable ID
   * @param {string} key - New key
   * @param {string} value - New value
   * @returns {Promise<void>}
   */
  async updateVariable(variableId, key, value) {
    return await this.proxy.proxyRequest(`/api/v1/variables/${variableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
  }

  /**
   * Delete a variable
   * DELETE /api/v1/variables/{id}
   * @param {string} variableId - Variable ID
   * @returns {Promise<void>}
   */
  async deleteVariable(variableId) {
    return await this.proxy.proxyRequest(`/api/v1/variables/${variableId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // AUDIT
  // ============================================================================

  /**
   * Generate security audit
   * POST /api/v1/audit
   * @param {Object} options - Audit options
   * @returns {Promise<Object>} Audit report
   */
  async generateAudit(options = {}) {
    return await this.proxy.proxyRequest('/api/v1/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        additionalOptions: options
      })
    });
  }

  // ============================================================================
  // SOURCE CONTROL
  // ============================================================================

  /**
   * Pull from repository
   * POST /api/v1/source-control/pull
   * @param {Object} options - Pull options
   * @returns {Promise<Object>} Import result
   */
  async pullFromRepository(options = {}) {
    return await this.proxy.proxyRequest('/api/v1/source-control/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check N8N instance health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    return await this.proxy.checkHealth();
  }

  /**
   * Build Gmail OAuth2 credential data
   * @param {Object} params - Credential parameters
   * @returns {Object} Credential payload
   */
  buildGmailCredential({ name, accessToken, refreshToken, clientId, clientSecret }) {
    return {
      name,
      type: N8N_CREDENTIAL_TYPES.GMAIL_OAUTH2,
      data: {
        clientId,
        clientSecret,
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * Build Outlook OAuth2 credential data
   * @param {Object} params - Credential parameters
   * @returns {Object} Credential payload
   */
  buildOutlookCredential({ name, accessToken, refreshToken, clientId, clientSecret }) {
    return {
      name,
      type: N8N_CREDENTIAL_TYPES.OUTLOOK_OAUTH2,
      data: {
        clientId,
        clientSecret,
        accessToken,
        refreshToken
      }
    };
  }
}

// Export singleton instance
export const n8nApi = new N8nApiWrapper();
export default n8nApi;


