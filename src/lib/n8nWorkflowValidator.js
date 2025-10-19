/**
 * N8N Workflow Schema Validator
 * Validates final JSON before deployment to ensure all required components are present
 */

export class N8nWorkflowValidator {
  constructor() {
    this.validationRules = this.initializeValidationRules();
  }

  /**
   * Initialize validation rules
   * @returns {Object} Validation rules configuration
   */
  initializeValidationRules() {
    return {
      requiredFields: ['name', 'nodes', 'connections'],
      requiredNodes: ['gmail-trigger', 'ai-classifier', 'create-gmail-draft'],
      requiredCredentials: ['gmailOAuth2', 'openAi'],
      nodeTypes: {
        'gmail-trigger': 'n8n-nodes-base.gmailTrigger',
        'ai-classifier': '@n8n/n8n-nodes-langchain.agent',
        'create-gmail-draft': 'n8n-nodes-base.gmail'
      },
      connectionRules: {
        'gmail-trigger': ['ai-classifier'],
        'ai-classifier': ['create-gmail-draft']
      }
    };
  }

  /**
   * Validate N8N workflow JSON
   * @param {Object} workflow - Workflow JSON to validate
   * @returns {Object} Validation result
   */
  validateN8nWorkflow(workflow) {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0'
      }
    };

    try {
      console.log('🔍 Starting N8N workflow validation...');

      // Validate basic structure
      this.validateBasicStructure(workflow, validationResult);

      // Validate nodes
      this.validateNodes(workflow.nodes, validationResult);

      // Validate connections
      this.validateConnections(workflow.connections, workflow.nodes, validationResult);

      // Validate credentials
      this.validateCredentials(workflow.nodes, validationResult);

      // Validate settings
      this.validateSettings(workflow.settings, validationResult);

      // Check for common issues
      this.checkCommonIssues(workflow, validationResult);

      validationResult.isValid = validationResult.errors.length === 0;
      
      console.log(`✅ Workflow validation ${validationResult.isValid ? 'passed' : 'failed'}:`, {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length
      });

      return validationResult;

    } catch (error) {
      console.error('❌ Workflow validation error:', error);
      validationResult.isValid = false;
      validationResult.errors.push({
        type: 'validation_error',
        message: `Validation process failed: ${error.message}`,
        severity: 'critical'
      });
      return validationResult;
    }
  }

  /**
   * Validate basic workflow structure
   * @param {Object} workflow - Workflow object
   * @param {Object} result - Validation result object
   */
  validateBasicStructure(workflow, result) {
    // Check required top-level fields
    for (const field of this.validationRules.requiredFields) {
      if (!workflow[field]) {
        result.errors.push({
          type: 'missing_field',
          field: field,
          message: `Missing required field: ${field}`,
          severity: 'critical'
        });
      }
    }

    // Validate workflow name
    if (workflow.name && typeof workflow.name !== 'string') {
      result.errors.push({
        type: 'invalid_type',
        field: 'name',
        message: 'Workflow name must be a string',
        severity: 'critical'
      });
    }

    // Validate nodes array
    if (workflow.nodes && !Array.isArray(workflow.nodes)) {
      result.errors.push({
        type: 'invalid_type',
        field: 'nodes',
        message: 'Nodes must be an array',
        severity: 'critical'
      });
    }

    // Validate connections object
    if (workflow.connections && typeof workflow.connections !== 'object') {
      result.errors.push({
        type: 'invalid_type',
        field: 'connections',
        message: 'Connections must be an object',
        severity: 'critical'
      });
    }
  }

  /**
   * Validate workflow nodes
   * @param {Array} nodes - Nodes array
   * @param {Object} result - Validation result object
   */
  validateNodes(nodes, result) {
    if (!nodes || !Array.isArray(nodes)) {
      result.errors.push({
        type: 'missing_field',
        field: 'nodes',
        message: 'Workflow must contain nodes array',
        severity: 'critical'
      });
      return;
    }

    // Check for required nodes
    const nodeIds = nodes.map(node => node.id);
    for (const requiredNode of this.validationRules.requiredNodes) {
      if (!nodeIds.includes(requiredNode)) {
        result.errors.push({
          type: 'missing_node',
          nodeId: requiredNode,
          message: `Missing required node: ${requiredNode}`,
          severity: 'critical'
        });
      }
    }

    // Validate each node
    nodes.forEach((node, index) => {
      this.validateNode(node, index, result);
    });
  }

  /**
   * Validate individual node
   * @param {Object} node - Node object
   * @param {number} index - Node index
   * @param {Object} result - Validation result object
   */
  validateNode(node, index, result) {
    // Check required node fields
    const requiredNodeFields = ['id', 'name', 'type', 'position'];
    for (const field of requiredNodeFields) {
      if (!node[field]) {
        result.errors.push({
          type: 'missing_node_field',
          nodeIndex: index,
          nodeId: node.id || 'unknown',
          field: field,
          message: `Node ${index} missing required field: ${field}`,
          severity: 'critical'
        });
      }
    }

    // Validate node type
    if (node.type && !node.type.startsWith('n8n-nodes-base.') && !node.type.startsWith('@n8n/')) {
      result.warnings.push({
        type: 'unusual_node_type',
        nodeId: node.id,
        nodeType: node.type,
        message: `Unusual node type: ${node.type}`,
        severity: 'warning'
      });
    }

    // Validate position coordinates
    if (node.position && Array.isArray(node.position)) {
      if (node.position.length !== 2 || typeof node.position[0] !== 'number' || typeof node.position[1] !== 'number') {
        result.errors.push({
          type: 'invalid_position',
          nodeId: node.id,
          message: 'Node position must be [x, y] coordinates',
          severity: 'critical'
        });
      }
    }

    // Validate credentials
    if (node.credentials) {
      this.validateNodeCredentials(node, result);
    }
  }

  /**
   * Validate node credentials
   * @param {Object} node - Node object
   * @param {Object} result - Validation result object
   */
  validateNodeCredentials(node, result) {
    const credentialTypes = Object.keys(node.credentials);
    
    for (const credentialType of credentialTypes) {
      const credential = node.credentials[credentialType];
      
      if (!credential.id) {
        result.errors.push({
          type: 'missing_credential_id',
          nodeId: node.id,
          credentialType: credentialType,
          message: `Node ${node.id} missing credential ID for ${credentialType}`,
          severity: 'critical'
        });
      }

      if (!credential.name) {
        result.warnings.push({
          type: 'missing_credential_name',
          nodeId: node.id,
          credentialType: credentialType,
          message: `Node ${node.id} missing credential name for ${credentialType}`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Validate workflow connections
   * @param {Object} connections - Connections object
   * @param {Array} nodes - Nodes array
   * @param {Object} result - Validation result object
   */
  validateConnections(connections, nodes, result) {
    if (!connections || typeof connections !== 'object') {
      result.errors.push({
        type: 'missing_field',
        field: 'connections',
        message: 'Workflow must contain connections object',
        severity: 'critical'
      });
      return;
    }

    const nodeIds = nodes.map(node => node.id);
    const connectionNodes = Object.keys(connections);

    // Check that all connection nodes exist
    for (const connectionNode of connectionNodes) {
      if (!nodeIds.includes(connectionNode)) {
        result.errors.push({
          type: 'invalid_connection',
          nodeId: connectionNode,
          message: `Connection references non-existent node: ${connectionNode}`,
          severity: 'critical'
        });
      }
    }

    // Validate connection structure
    for (const [sourceNode, connectionData] of Object.entries(connections)) {
      if (!connectionData.main || !Array.isArray(connectionData.main)) {
        result.errors.push({
          type: 'invalid_connection_structure',
          nodeId: sourceNode,
          message: `Invalid connection structure for node: ${sourceNode}`,
          severity: 'critical'
        });
        continue;
      }

      // Validate each connection
      connectionData.main.forEach((connectionArray, mainIndex) => {
        if (!Array.isArray(connectionArray)) {
          result.errors.push({
            type: 'invalid_connection_array',
            nodeId: sourceNode,
            mainIndex: mainIndex,
            message: `Invalid connection array for node: ${sourceNode}`,
            severity: 'critical'
          });
          return;
        }

        connectionArray.forEach((connection, connectionIndex) => {
          if (!connection.node || !nodeIds.includes(connection.node)) {
            result.errors.push({
              type: 'invalid_connection_target',
              sourceNode: sourceNode,
              targetNode: connection.node,
              message: `Connection from ${sourceNode} to non-existent node: ${connection.node}`,
              severity: 'critical'
            });
          }
        });
      });
    }
  }

  /**
   * Validate credentials across all nodes
   * @param {Array} nodes - Nodes array
   * @param {Object} result - Validation result object
   */
  validateCredentials(nodes, result) {
    const foundCredentials = new Set();
    
    nodes.forEach(node => {
      if (node.credentials) {
        Object.keys(node.credentials).forEach(credType => {
          foundCredentials.add(credType);
        });
      }
    });

    // Check for required credentials
    for (const requiredCred of this.validationRules.requiredCredentials) {
      if (!foundCredentials.has(requiredCred)) {
        result.errors.push({
          type: 'missing_credential',
          credentialType: requiredCred,
          message: `Missing required credential type: ${requiredCred}`,
          severity: 'critical'
        });
      }
    }
  }

  /**
   * Validate workflow settings
   * @param {Object} settings - Settings object
   * @param {Object} result - Validation result object
   */
  validateSettings(settings, result) {
    if (!settings) {
      result.warnings.push({
        type: 'missing_settings',
        message: 'Workflow missing settings object',
        severity: 'warning'
      });
      return;
    }

    // Validate execution timeout
    if (settings.executionTimeout && typeof settings.executionTimeout !== 'number') {
      result.errors.push({
        type: 'invalid_setting',
        setting: 'executionTimeout',
        message: 'Execution timeout must be a number',
        severity: 'critical'
      });
    }

    // Validate timezone
    if (settings.timezone && typeof settings.timezone !== 'string') {
      result.errors.push({
        type: 'invalid_setting',
        setting: 'timezone',
        message: 'Timezone must be a string',
        severity: 'critical'
      });
    }
  }

  /**
   * Check for common workflow issues
   * @param {Object} workflow - Workflow object
   * @param {Object} result - Validation result object
   */
  checkCommonIssues(workflow, result) {
    // Check for placeholder values
    const workflowString = JSON.stringify(workflow);
    const placeholderPatterns = [
      /<<<[^>]+>>>/g,  // <<<PLACEHOLDER>>>
      /\{\{[^}]+\}\}/g  // {{PLACEHOLDER}}
    ];

    placeholderPatterns.forEach(pattern => {
      const matches = workflowString.match(pattern);
      if (matches) {
        result.errors.push({
          type: 'unresolved_placeholder',
          placeholders: matches,
          message: `Found unresolved placeholders: ${matches.join(', ')}`,
          severity: 'critical'
        });
      }
    });

    // Check for duplicate node IDs
    if (workflow.nodes) {
      const nodeIds = workflow.nodes.map(node => node.id);
      const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
      
      if (duplicateIds.length > 0) {
        result.errors.push({
          type: 'duplicate_node_id',
          duplicateIds: [...new Set(duplicateIds)],
          message: `Found duplicate node IDs: ${[...new Set(duplicateIds)].join(', ')}`,
          severity: 'critical'
        });
      }
    }

    // Check for orphaned nodes (nodes with no connections)
    if (workflow.nodes && workflow.connections) {
      const connectedNodes = new Set();
      Object.keys(workflow.connections).forEach(sourceNode => {
        connectedNodes.add(sourceNode);
        workflow.connections[sourceNode].main?.forEach(connectionArray => {
          connectionArray.forEach(connection => {
            connectedNodes.add(connection.node);
          });
        });
      });

      const orphanedNodes = workflow.nodes
        .filter(node => !connectedNodes.has(node.id))
        .map(node => node.id);

      if (orphanedNodes.length > 0) {
        result.warnings.push({
          type: 'orphaned_nodes',
          orphanedNodes: orphanedNodes,
          message: `Found orphaned nodes (no connections): ${orphanedNodes.join(', ')}`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Get validation summary
   * @param {Object} validationResult - Validation result
   * @returns {string} Human-readable summary
   */
  getValidationSummary(validationResult) {
    const { isValid, errors, warnings } = validationResult;
    
    let summary = `Workflow validation ${isValid ? 'PASSED' : 'FAILED'}\n`;
    summary += `Errors: ${errors.length}\n`;
    summary += `Warnings: ${warnings.length}\n`;
    
    if (errors.length > 0) {
      summary += '\nErrors:\n';
      errors.forEach(error => {
        summary += `- ${error.message}\n`;
      });
    }
    
    if (warnings.length > 0) {
      summary += '\nWarnings:\n';
      warnings.forEach(warning => {
        summary += `- ${warning.message}\n`;
      });
    }
    
    return summary;
  }
}

export const n8nWorkflowValidator = new N8nWorkflowValidator();


