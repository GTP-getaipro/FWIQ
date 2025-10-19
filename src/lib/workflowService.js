/**
 * Workflow Service
 * 
 * This module provides a centralized service for managing workflow data.
 * It ensures consistent data handling and validation across the application.
 */

import { supabase } from '@/lib/customSupabaseClient';
import { WorkflowValidator, validateWorkflowCreationRequest } from '@/lib/workflowValidator';
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { getTemplateForBusinessType, injectOnboardingData } from '@/lib/templateService';

/**
 * Workflow service class for managing workflows
 */
export class WorkflowService {
  /**
   * Get workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Workflow|null>} Workflow or null if not found
   */
  static async getWorkflow(workflowId) {
    try {
      if (!workflowId) {
        throw new Error('Workflow ID is required');
      }

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Workflow not found
          return null;
        }
        throw error;
      }

      // Validate the retrieved workflow
      const validation = WorkflowValidator.validateWorkflow(data);
      if (!validation.isValid) {
        logger.warn('Retrieved workflow has validation issues:', validation.errors);
      }

      return data;
    } catch (error) {
      logger.error('Error fetching workflow:', error);
      errorHandler.handleError(error, { title: 'Workflow Fetch Error' });
      throw error;
    }
  }

  /**
   * Get workflows for a client
   * @param {string} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Promise<Workflow[]>} Array of workflows
   */
  static async getWorkflows(clientId, options = {}) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      let query = supabase
        .from('workflows')
        .select('*')
        .eq('client_id', clientId);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Apply ordering
      const orderBy = options.orderBy || 'created_at';
      const ascending = options.ascending !== false;
      query = query.order(orderBy, { ascending });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Validate each workflow
      const validatedWorkflows = [];
      for (const workflow of data || []) {
        const validation = WorkflowValidator.validateWorkflow(workflow);
        if (!validation.isValid) {
          logger.warn(`Workflow ${workflow.id} has validation issues:`, validation.errors);
        }
        validatedWorkflows.push(workflow);
      }

      return validatedWorkflows;
    } catch (error) {
      logger.error('Error fetching workflows:', error);
      errorHandler.handleError(error, { title: 'Workflows Fetch Error' });
      throw error;
    }
  }

  /**
   * Create a new workflow
   * @param {string} clientId - Client ID
   * @param {WorkflowCreationRequest} request - Workflow creation request
   * @returns {Promise<Workflow>} Created workflow
   */
  static async createWorkflow(clientId, request) {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Validate the creation request
      const validation = validateWorkflowCreationRequest(request);
      if (!validation.isValid) {
        throw new Error(`Workflow creation validation failed: ${validation.errors.join(', ')}`);
      }

      // Get the next version number
      const { data: existingWorkflow } = await supabase
        .from('workflows')
        .select('version')
        .eq('client_id', clientId)
        .eq('name', request.name)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (existingWorkflow?.version || 0) + 1;

      // Get template for business type
      const template = getTemplateForBusinessType(request.business_type);
      
      // Prepare workflow data
      const workflowData = {
        name: request.name,
        nodes: template.nodes || [],
        connections: template.connections || {},
        pinData: template.pinData || {},
        settings: template.settings || { executionOrder: 'v1' },
        staticData: template.staticData || null,
        tags: template.tags || [],
        triggerCount: template.triggerCount || 0,
        updatedAt: new Date().toISOString(),
        versionId: String(nextVersion)
      };

      // Create workflow configuration
      const workflowConfig = {
        workflow_data: workflowData,
        deployment: {
          status: 'pending',
          deployed_at: null,
          deployment_errors: [],
          n8n_workflow_url: null
        },
        business_context: {
          business_type: request.business_type,
          business_name: 'Business', // Will be updated during deployment
          template_used: request.template_name || 'pools_spas_generic_template',
          customization_level: 'basic'
        },
        integrations: {
          gmail: { credentialId: '', enabled: false },
          outlook: { credentialId: '', enabled: false },
          openai: { credentialId: '', enabled: false },
          postgres: { credentialId: '', enabled: false }
        },
        metadata: {
          created_by: clientId,
          template_version: '1.0',
          tags: [],
          description: request.description || ''
        },
        ...request.custom_config
      };

      // Create the workflow
      const newWorkflow = {
        client_id: clientId,
        name: request.name,
        status: 'draft',
        version: nextVersion,
        config: workflowConfig
      };

      // Validate the complete workflow
      const workflowValidation = WorkflowValidator.validateWorkflow(newWorkflow);
      if (!workflowValidation.isValid) {
        throw new Error(`Workflow validation failed: ${workflowValidation.errors.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('workflows')
        .insert([newWorkflow])
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Workflow created successfully:', { workflowId: data.id, clientId, name: request.name });
      return data;
    } catch (error) {
      logger.error('Error creating workflow:', error);
      errorHandler.handleError(error, { title: 'Workflow Creation Error' });
      throw error;
    }
  }

  /**
   * Update workflow
   * @param {string} workflowId - Workflow ID
   * @param {Partial<Workflow>} updates - Workflow updates
   * @returns {Promise<Workflow>} Updated workflow
   */
  static async updateWorkflow(workflowId, updates) {
    try {
      if (!workflowId) {
        throw new Error('Workflow ID is required');
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No updates provided');
      }

      // Validate the updates
      const validation = WorkflowValidator.validateWorkflowUpdate(updates);
      if (!validation.isValid) {
        throw new Error(`Workflow update validation failed: ${validation.errors.join(', ')}`);
      }

      // Get current workflow to merge updates
      const currentWorkflow = await this.getWorkflow(workflowId);
      if (!currentWorkflow) {
        throw new Error('Workflow not found');
      }

      // Merge updates with current workflow
      const updatedWorkflow = {
        ...currentWorkflow,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Validate the complete updated workflow
      const fullValidation = WorkflowValidator.validateWorkflow(updatedWorkflow);
      if (!fullValidation.isValid) {
        throw new Error(`Updated workflow validation failed: ${fullValidation.errors.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', workflowId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Workflow updated successfully:', { workflowId, updatedFields: Object.keys(updates) });
      return data;
    } catch (error) {
      logger.error('Error updating workflow:', error);
      errorHandler.handleError(error, { title: 'Workflow Update Error' });
      throw error;
    }
  }

  /**
   * Update workflow status
   * @param {string} workflowId - Workflow ID
   * @param {WorkflowStatus} status - New status
   * @returns {Promise<Workflow>} Updated workflow
   */
  static async updateWorkflowStatus(workflowId, status) {
    try {
      if (!WorkflowValidator.isValidWorkflowStatus(status)) {
        throw new Error(`Invalid workflow status: ${status}`);
      }

      return await this.updateWorkflow(workflowId, { status });
    } catch (error) {
      logger.error('Error updating workflow status:', error);
      errorHandler.handleError(error, { title: 'Workflow Status Update Error' });
      throw error;
    }
  }

  /**
   * Archive workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Workflow>} Archived workflow
   */
  static async archiveWorkflow(workflowId) {
    try {
      return await this.updateWorkflowStatus(workflowId, 'archived');
    } catch (error) {
      logger.error('Error archiving workflow:', error);
      errorHandler.handleError(error, { title: 'Workflow Archive Error' });
      throw error;
    }
  }

  /**
   * Create new workflow version
   * @param {string} clientId - Client ID
   * @param {string} workflowName - Workflow name
   * @param {Partial<WorkflowConfig>} configUpdates - Configuration updates
   * @returns {Promise<Workflow>} New workflow version
   */
  static async createWorkflowVersion(clientId, workflowName, configUpdates = {}) {
    try {
      if (!clientId || !workflowName) {
        throw new Error('Client ID and workflow name are required');
      }

      // Get current workflow
      const { data: currentWorkflow } = await supabase
        .from('workflows')
        .select('*')
        .eq('client_id', clientId)
        .eq('name', workflowName)
        .eq('status', 'active')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!currentWorkflow) {
        throw new Error('Active workflow not found');
      }

      // Archive current version
      await this.archiveWorkflow(currentWorkflow.id);

      // Create new version
      const nextVersion = currentWorkflow.version + 1;
      const newConfig = {
        ...currentWorkflow.config,
        ...configUpdates,
        metadata: {
          ...currentWorkflow.config.metadata,
          last_modified_by: clientId,
          modification_reason: 'Version update'
        }
      };

      const newWorkflow = {
        client_id: clientId,
        name: workflowName,
        status: 'draft',
        version: nextVersion,
        config: newConfig
      };

      const { data, error } = await supabase
        .from('workflows')
        .insert([newWorkflow])
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Workflow version created successfully:', { 
        workflowId: data.id, 
        clientId, 
        name: workflowName, 
        version: nextVersion 
      });
      
      return data;
    } catch (error) {
      logger.error('Error creating workflow version:', error);
      errorHandler.handleError(error, { title: 'Workflow Version Creation Error' });
      throw error;
    }
  }

  /**
   * Deploy workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} deploymentOptions - Deployment options
   * @returns {Promise<Workflow>} Deployed workflow
   */
  static async deployWorkflow(workflowId, deploymentOptions = {}) {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status === 'deployed') {
        throw new Error('Workflow is already deployed');
      }

      // Update status to deploying
      await this.updateWorkflow(workflowId, {
        status: 'deploying',
        config: {
          ...workflow.config,
          deployment: {
            ...workflow.config.deployment,
            status: 'deploying',
            deployment_errors: []
          }
        }
      });

      try {
        // Here you would integrate with n8n deployment
        // For now, we'll simulate a successful deployment
        const deploymentResult = {
          success: true,
          n8n_workflow_id: `n8n_${Date.now()}`,
          n8n_workflow_url: `https://n8n.example.com/workflow/${Date.now()}`,
          errors: [],
          warnings: []
        };

        // Update workflow with deployment result
        const updatedWorkflow = await this.updateWorkflow(workflowId, {
          status: 'deployed',
          n8n_workflow_id: deploymentResult.n8n_workflow_id,
          config: {
            ...workflow.config,
            deployment: {
              ...workflow.config.deployment,
              status: 'deployed',
              deployed_at: new Date().toISOString(),
              n8n_workflow_url: deploymentResult.n8n_workflow_url,
              deployment_errors: deploymentResult.errors
            }
          }
        });

        logger.info('Workflow deployed successfully:', { 
          workflowId, 
          n8n_workflow_id: deploymentResult.n8n_workflow_id 
        });

        return updatedWorkflow;
      } catch (deploymentError) {
        // Update workflow with deployment failure
        await this.updateWorkflow(workflowId, {
          status: 'failed',
          config: {
            ...workflow.config,
            deployment: {
              ...workflow.config.deployment,
              status: 'failed',
              deployment_errors: [deploymentError.message]
            }
          }
        });

        throw deploymentError;
      }
    } catch (error) {
      logger.error('Error deploying workflow:', error);
      errorHandler.handleError(error, { title: 'Workflow Deployment Error' });
      throw error;
    }
  }

  /**
   * Delete workflow
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<void>}
   */
  static async deleteWorkflow(workflowId) {
    try {
      if (!workflowId) {
        throw new Error('Workflow ID is required');
      }

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) {
        throw error;
      }

      logger.info('Workflow deleted successfully:', { workflowId });
    } catch (error) {
      logger.error('Error deleting workflow:', error);
      errorHandler.handleError(error, { title: 'Workflow Deletion Error' });
      throw error;
    }
  }

  /**
   * Get workflow deployment status
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<DeploymentStatus>} Deployment status
   */
  static async getDeploymentStatus(workflowId) {
    try {
      const workflow = await this.getWorkflow(workflowId);
      return workflow?.config?.deployment?.status || 'pending';
    } catch (error) {
      logger.error('Error getting deployment status:', error);
      return 'failed';
    }
  }

  /**
   * Check if workflow can be deployed
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<boolean>} Can be deployed
   */
  static async canDeployWorkflow(workflowId) {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) return false;

      const validStatuses = ['draft', 'failed'];
      const validDeploymentStatuses = ['pending', 'failed'];

      return (
        validStatuses.includes(workflow.status) &&
        validDeploymentStatuses.includes(workflow.config?.deployment?.status)
      );
    } catch (error) {
      logger.error('Error checking deployment capability:', error);
      return false;
    }
  }

  /**
   * Sanitize workflow data before saving
   * @param {Workflow} workflow - Workflow to sanitize
   * @returns {Workflow} Sanitized workflow
   */
  static sanitizeWorkflow(workflow) {
    return WorkflowValidator.sanitizeWorkflow(workflow);
  }

  /**
   * Validate workflow data
   * @param {Workflow} workflow - Workflow to validate
   * @returns {ValidationResult} Validation result
   */
  static validateWorkflow(workflow) {
    return WorkflowValidator.validateWorkflow(workflow);
  }
}

export default WorkflowService;
