/**
 * Workflow Data Validation Utility
 * 
 * This module provides validation functions for workflow data structures.
 * It ensures data consistency and prevents invalid workflow operations.
 */

import { 
  ERROR_CODES, 
  createError, 
  isValidErrorCode 
} from '@/constants/errorCodes';

import {
  Workflow,
  WorkflowConfig,
  WorkflowData,
  WorkflowNode,
  WorkflowStatus,
  BusinessType,
  DeploymentStatus,
  CustomizationLevel,
  ValidationResult,
  MAX_WORKFLOW_NODES,
  MAX_WORKFLOW_NAME_LENGTH,
  MAX_WORKFLOW_DESCRIPTION_LENGTH,
  TEMPLATE_BUSINESS_TYPE_MAP,
  SUPPORTED_TEMPLATES
} from '@/types/workflow';

/**
 * Workflow validator class
 */
export class WorkflowValidator {
  /**
   * Validate complete workflow
   * @param {Workflow} workflow - Workflow to validate
   * @returns {ValidationResult} Validation result
   */
  static validateWorkflow(workflow) {
    const errors = [];
    const warnings = [];

    // Validate required fields
    if (!workflow.id) {
      errors.push('Workflow ID is required');
    }

    if (!workflow.client_id) {
      errors.push('Client ID is required');
    }

    if (!workflow.name || typeof workflow.name !== 'string') {
      errors.push('Workflow name is required and must be a string');
    } else if (workflow.name.length > MAX_WORKFLOW_NAME_LENGTH) {
      errors.push(`Workflow name cannot exceed ${MAX_WORKFLOW_NODES} characters`);
    }

    if (!this.isValidWorkflowStatus(workflow.status)) {
      errors.push(`Invalid workflow status: ${workflow.status}`);
    }

    if (!workflow.version || typeof workflow.version !== 'number' || workflow.version < 1) {
      errors.push('Workflow version must be a positive integer');
    }

    if (!workflow.config || typeof workflow.config !== 'object') {
      errors.push('Workflow config is required and must be an object');
    } else {
      const configValidation = this.validateWorkflowConfig(workflow.config);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate workflow configuration
   * @param {WorkflowConfig} config - Workflow config to validate
   * @returns {ValidationResult} Validation result
   */
  static validateWorkflowConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate required config sections
    if (!config.workflow_data) {
      errors.push('Workflow data is required');
    } else {
      const workflowDataValidation = this.validateWorkflowData(config.workflow_data);
      errors.push(...workflowDataValidation.errors);
      warnings.push(...workflowDataValidation.warnings);
    }

    if (!config.deployment) {
      errors.push('Deployment configuration is required');
    } else {
      const deploymentValidation = this.validateDeploymentConfig(config.deployment);
      errors.push(...deploymentValidation.errors);
      warnings.push(...deploymentValidation.warnings);
    }

    if (!config.business_context) {
      errors.push('Business context is required');
    } else {
      const businessValidation = this.validateBusinessContext(config.business_context);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
    }

    if (!config.integrations) {
      errors.push('Integrations configuration is required');
    } else {
      const integrationsValidation = this.validateIntegrations(config.integrations);
      errors.push(...integrationsValidation.errors);
      warnings.push(...integrationsValidation.warnings);
    }

    if (!config.metadata) {
      errors.push('Workflow metadata is required');
    } else {
      const metadataValidation = this.validateMetadata(config.metadata);
      errors.push(...metadataValidation.errors);
      warnings.push(...metadataValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate workflow data (n8n format)
   * @param {WorkflowData} workflowData - Workflow data to validate
   * @returns {ValidationResult} Validation result
   */
  static validateWorkflowData(workflowData) {
    const errors = [];
    const warnings = [];

    // Validate required fields
    if (!workflowData.name || typeof workflowData.name !== 'string') {
      errors.push('Workflow data name is required');
    }

    if (!Array.isArray(workflowData.nodes)) {
      errors.push('Workflow nodes must be an array');
    } else {
      if (workflowData.nodes.length === 0) {
        errors.push('Workflow must have at least one node');
      } else if (workflowData.nodes.length > MAX_WORKFLOW_NODES) {
        errors.push(`Workflow cannot have more than ${MAX_WORKFLOW_NODES} nodes`);
      } else {
        // Validate each node
        workflowData.nodes.forEach((node, index) => {
          const nodeValidation = this.validateWorkflowNode(node);
          nodeValidation.errors.forEach(error => {
            errors.push(`Node ${index + 1}: ${error}`);
          });
          nodeValidation.warnings.forEach(warning => {
            warnings.push(`Node ${index + 1}: ${warning}`);
          });
        });
      }
    }

    if (!workflowData.connections || typeof workflowData.connections !== 'object') {
      errors.push('Workflow connections must be an object');
    }

    if (!workflowData.settings || typeof workflowData.settings !== 'object') {
      errors.push('Workflow settings must be an object');
    }

    if (typeof workflowData.triggerCount !== 'number' || workflowData.triggerCount < 0) {
      warnings.push('Trigger count should be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate workflow node
   * @param {WorkflowNode} node - Workflow node to validate
   * @returns {ValidationResult} Validation result
   */
  static validateWorkflowNode(node) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!node.id || typeof node.id !== 'string') {
      errors.push('Node ID is required and must be a string');
    }

    if (!node.name || typeof node.name !== 'string') {
      errors.push('Node name is required and must be a string');
    }

    if (!node.type || typeof node.type !== 'string') {
      errors.push('Node type is required and must be a string');
    }

    if (typeof node.typeVersion !== 'number' || node.typeVersion < 1) {
      errors.push('Node type version must be a positive number');
    }

    if (!Array.isArray(node.position) || node.position.length !== 2) {
      errors.push('Node position must be an array with exactly 2 numbers');
    } else {
      if (typeof node.position[0] !== 'number' || typeof node.position[1] !== 'number') {
        errors.push('Node position coordinates must be numbers');
      }
    }

    if (!node.parameters || typeof node.parameters !== 'object') {
      errors.push('Node parameters must be an object');
    }

    // Optional fields validation
    if (node.credentials && typeof node.credentials !== 'object') {
      errors.push('Node credentials must be an object');
    }

    if (node.notes && typeof node.notes !== 'string') {
      warnings.push('Node notes should be a string');
    }

    if (node.disabled !== undefined && typeof node.disabled !== 'boolean') {
      warnings.push('Node disabled flag should be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate deployment configuration
   * @param {DeploymentConfig} deployment - Deployment config to validate
   * @returns {ValidationResult} Validation result
   */
  static validateDeploymentConfig(deployment) {
    const errors = [];
    const warnings = [];

    if (!this.isValidDeploymentStatus(deployment.status)) {
      errors.push(`Invalid deployment status: ${deployment.status}`);
    }

    if (!Array.isArray(deployment.deployment_errors)) {
      errors.push('Deployment errors must be an array');
    }

    if (deployment.deployed_at && !this.isValidISODate(deployment.deployed_at)) {
      errors.push('Deployed at must be a valid ISO date string');
    }

    if (deployment.n8n_workflow_url && !this.isValidUrl(deployment.n8n_workflow_url)) {
      warnings.push('n8n workflow URL format may be invalid');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate business context
   * @param {BusinessContext} businessContext - Business context to validate
   * @returns {ValidationResult} Validation result
   */
  static validateBusinessContext(businessContext) {
    const errors = [];
    const warnings = [];

    if (!this.isValidBusinessType(businessContext.business_type)) {
      errors.push(`Invalid business type: ${businessContext.business_type}`);
    }

    if (!businessContext.business_name || typeof businessContext.business_name !== 'string') {
      errors.push('Business name is required');
    }

    if (!businessContext.template_used || typeof businessContext.template_used !== 'string') {
      errors.push('Template used is required');
    } else if (!SUPPORTED_TEMPLATES.includes(businessContext.template_used)) {
      warnings.push(`Template '${businessContext.template_used}' may not be supported`);
    }

    if (!this.isValidCustomizationLevel(businessContext.customization_level)) {
      errors.push(`Invalid customization level: ${businessContext.customization_level}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate integrations configuration
   * @param {WorkflowIntegrations} integrations - Integrations to validate
   * @returns {ValidationResult} Validation result
   */
  static validateIntegrations(integrations) {
    const errors = [];
    const warnings = [];

    const requiredIntegrations = ['gmail', 'outlook', 'openai', 'postgres'];
    
    requiredIntegrations.forEach(integration => {
      if (!integrations[integration]) {
        errors.push(`${integration} integration configuration is required`);
      } else {
        const integrationConfig = integrations[integration];
        
        if (typeof integrationConfig.credentialId !== 'string') {
          errors.push(`${integration} credential ID must be a string`);
        }

        if (typeof integrationConfig.enabled !== 'boolean') {
          warnings.push(`${integration} enabled flag should be a boolean`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate workflow metadata
   * @param {WorkflowMetadata} metadata - Metadata to validate
   * @returns {ValidationResult} Validation result
   */
  static validateMetadata(metadata) {
    const errors = [];
    const warnings = [];

    if (!metadata.created_by || typeof metadata.created_by !== 'string') {
      errors.push('Created by user ID is required');
    }

    if (!metadata.template_version || typeof metadata.template_version !== 'string') {
      errors.push('Template version is required');
    }

    if (!Array.isArray(metadata.tags)) {
      errors.push('Metadata tags must be an array');
    }

    if (metadata.description && typeof metadata.description !== 'string') {
      warnings.push('Metadata description should be a string');
    } else if (metadata.description && metadata.description.length > MAX_WORKFLOW_DESCRIPTION_LENGTH) {
      warnings.push(`Metadata description should not exceed ${MAX_WORKFLOW_DESCRIPTION_LENGTH} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // UTILITY VALIDATION METHODS
  // ============================================================================

  /**
   * Validate workflow status
   * @param {any} status - Status to validate
   * @returns {boolean} Is valid workflow status
   */
  static isValidWorkflowStatus(status) {
    return [
      'active', 'inactive', 'archived', 'deploying',
      'deployed', 'failed', 'draft'
    ].includes(status);
  }

  /**
   * Validate deployment status
   * @param {any} status - Status to validate
   * @returns {boolean} Is valid deployment status
   */
  static isValidDeploymentStatus(status) {
    return ['pending', 'deploying', 'deployed', 'failed'].includes(status);
  }

  /**
   * Validate business type
   * @param {any} type - Type to validate
   * @returns {boolean} Is valid business type
   */
  static isValidBusinessType(type) {
    return Object.keys(TEMPLATE_BUSINESS_TYPE_MAP).includes(type);
  }

  /**
   * Validate customization level
   * @param {any} level - Level to validate
   * @returns {boolean} Is valid customization level
   */
  static isValidCustomizationLevel(level) {
    return ['basic', 'custom', 'advanced'].includes(level);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Is valid URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate ISO date string
   * @param {string} dateString - Date string to validate
   * @returns {boolean} Is valid ISO date
   */
  static isValidISODate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString === date.toISOString();
  }

  /**
   * Validate workflow name format
   * @param {string} name - Workflow name to validate
   * @returns {boolean} Is valid workflow name
   */
  static isValidWorkflowName(name) {
    if (!name || typeof name !== 'string') return false;
    if (name.length === 0 || name.length > MAX_WORKFLOW_NAME_LENGTH) return false;
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(name);
  }

  /**
   * Validate workflow version compatibility
   * @param {number} currentVersion - Current workflow version
   * @param {number} newVersion - New workflow version
   * @returns {boolean} Is compatible version
   */
  static isValidVersionTransition(currentVersion, newVersion) {
    return newVersion >= currentVersion && newVersion <= currentVersion + 1;
  }

  /**
   * Validate template compatibility with business type
   * @param {string} templateName - Template name
   * @param {BusinessType} businessType - Business type
   * @returns {boolean} Is compatible template
   */
  static isCompatibleTemplate(templateName, businessType) {
    const expectedTemplate = TEMPLATE_BUSINESS_TYPE_MAP[businessType];
    return templateName === expectedTemplate || templateName === 'pools_spas_generic_template';
  }

  /**
   * Sanitize workflow data by removing invalid fields
   * @param {Workflow} workflow - Workflow to sanitize
   * @returns {Workflow} Sanitized workflow
   */
  static sanitizeWorkflow(workflow) {
    const sanitized = { ...workflow };

    // Remove invalid status
    if (!this.isValidWorkflowStatus(sanitized.status)) {
      delete sanitized.status;
    }

    // Sanitize workflow name
    if (sanitized.name && !this.isValidWorkflowName(sanitized.name)) {
      sanitized.name = sanitized.name.substring(0, MAX_WORKFLOW_NAME_LENGTH).replace(/[<>:"/\\|?*]/g, '');
    }

    // Sanitize nodes
    if (sanitized.config?.workflow_data?.nodes && Array.isArray(sanitized.config.workflow_data.nodes)) {
      sanitized.config.workflow_data.nodes = sanitized.config.workflow_data.nodes.filter(node => 
        this.validateWorkflowNode(node).isValid
      );
    }

    return sanitized;
  }

  /**
   * Validate workflow update request
   * @param {Partial<Workflow>} update - Workflow update to validate
   * @returns {ValidationResult} Validation result
   */
  static validateWorkflowUpdate(update) {
    const errors = [];
    const warnings = [];

    // Only validate provided fields
    if (update.name !== undefined && !this.isValidWorkflowName(update.name)) {
      errors.push('Invalid workflow name format');
    }

    if (update.status !== undefined && !this.isValidWorkflowStatus(update.status)) {
      errors.push(`Invalid workflow status: ${update.status}`);
    }

    if (update.version !== undefined && (typeof update.version !== 'number' || update.version < 1)) {
      errors.push('Workflow version must be a positive integer');
    }

    if (update.config !== undefined) {
      const configValidation = this.validateWorkflowConfig(update.config);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Validate workflow and throw error if invalid
 * @param {Workflow} workflow - Workflow to validate
 * @throws {Error} Validation error if workflow is invalid
 */
export function validateWorkflowOrThrow(workflow) {
  const validation = WorkflowValidator.validateWorkflow(workflow);
  
  if (!validation.isValid) {
    const error = createError('VALIDATION_FAILED', 'Workflow validation failed', validation.errors);
    throw new Error(error.message);
  }
}

/**
 * Validate workflow creation request
 * @param {WorkflowCreationRequest} request - Creation request to validate
 * @returns {ValidationResult} Validation result
 */
export function validateWorkflowCreationRequest(request) {
  const errors = [];
  const warnings = [];

  if (!request.name || typeof request.name !== 'string') {
    errors.push('Workflow name is required');
  } else if (!WorkflowValidator.isValidWorkflowName(request.name)) {
    errors.push('Invalid workflow name format');
  }

  if (!request.business_type || !WorkflowValidator.isValidBusinessType(request.business_type)) {
    errors.push('Valid business type is required');
  }

  if (request.template_name && !SUPPORTED_TEMPLATES.includes(request.template_name)) {
    warnings.push(`Template '${request.template_name}' may not be supported`);
  }

  if (request.custom_config) {
    const configValidation = WorkflowValidator.validateWorkflowConfig(request.custom_config);
    errors.push(...configValidation.errors);
    warnings.push(...configValidation.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export default WorkflowValidator;
