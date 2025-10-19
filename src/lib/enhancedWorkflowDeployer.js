/**
 * Enhanced Workflow Deployer with Enterprise Features
 * Integrates all new components: version control, merge engine, prompt composer, 
 * credential resolver, schema validation, and deployment metadata
 */

import { supabase } from './customSupabaseClient.js';
import { n8nApiClient } from './n8nApiClient.js';
import DirectN8nDeployer from './directN8nDeployer.js';

// Import new enterprise components
import { templateVersionManager } from './templateVersionManager.js';
import { templateMergeEngine } from './templateMergeEngine.js';
import { promptComposer } from './promptComposer.js';
import { credentialResolver } from './credentialResolver.js';
import { n8nWorkflowValidator } from './n8nWorkflowValidator.js';
import { deploymentMetadataManager } from './deploymentMetadataManager.js';
import { universalTemplateManager } from './multiBusinessTemplateAggregator.js';

export class EnhancedWorkflowDeployer {
  constructor() {
    this.apiClient = n8nApiClient;
    this.directDeployer = new DirectN8nDeployer();
    
    // Initialize enterprise components
    this.versionManager = templateVersionManager;
    this.mergeEngine = templateMergeEngine;
    this.promptBuilder = promptComposer;
    this.credentialManager = credentialResolver;
    this.validator = n8nWorkflowValidator;
    this.metadataManager = deploymentMetadataManager;
    
    console.log('🚀 EnhancedWorkflowDeployer v3.0 - Enterprise features enabled');
  }

  /**
   * Deploy workflow with full enterprise pipeline
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow configuration data
   * @returns {Promise<Object>} Deployed workflow information
   */
  async deployWorkflow(userId, workflowData) {
    let deploymentMetadata = null;
    
    try {
      console.log('🚀 Starting enhanced workflow deployment for user:', userId);

      // Step 1: Check for template upgrades
      const upgradeInfo = await this.checkForUpgrades(userId, workflowData);
      if (upgradeInfo.needsUpgrade) {
        console.log('📈 Template upgrade available:', upgradeInfo.latestVersion);
      }

      // Step 2: Create deployment metadata
      deploymentMetadata = this.createDeploymentMetadata(userId, workflowData);
      console.log('📊 Deployment metadata created:', deploymentMetadata.deployment.id);

      // Step 3: Get comprehensive onboarding data
      const onboardingData = await this.getComprehensiveOnboardingData(userId);
      if (!onboardingData) {
        throw new Error('Failed to retrieve onboarding data');
      }

      // Step 4: Get template and apply business extensions
      const templateInfo = await this.getTemplateWithExtensions(onboardingData);
      
      // Step 5: Create business overrides
      const businessOverrides = this.mergeEngine.createBusinessOverrides(onboardingData);
      
      // Step 6: Merge template with business data
      const mergedTemplate = this.mergeEngine.mergeTemplate(
        templateInfo.template, 
        businessOverrides
      );

      // Step 7: Resolve and inject credentials
      const workflowWithCredentials = await this.resolveAndInjectCredentials(
        mergedTemplate, 
        userId, 
        onboardingData
      );

      // Step 8: Generate AI prompts
      const workflowWithPrompts = await this.generateAndInjectPrompts(
        workflowWithCredentials, 
        onboardingData
      );

      // Step 9: Validate workflow schema
      const validationResult = this.validator.validateN8nWorkflow(workflowWithPrompts);
      if (!validationResult.isValid) {
        throw new Error(`Workflow validation failed: ${this.validator.getValidationSummary(validationResult)}`);
      }

      // Step 10: Inject deployment metadata
      const finalWorkflow = this.metadataManager.injectMetadataIntoWorkflow(
        workflowWithPrompts, 
        deploymentMetadata
      );

      // Step 11: Deploy to N8N
      const deploymentResult = await this.deployToN8n(userId, finalWorkflow, deploymentMetadata);

      // Step 12: Store workflow record and metadata
      await this.storeWorkflowRecord(userId, deploymentResult, workflowData);
      await this.metadataManager.storeDeploymentMetadata(deploymentMetadata);

      console.log('✅ Enhanced workflow deployment completed successfully');
      
      return {
        success: true,
        workflowId: deploymentResult.id,
        version: deploymentResult.version || 1,
        status: 'deployed',
        n8nUrl: deploymentResult.n8nUrl,
        deploymentId: deploymentMetadata.deployment.id,
        templateVersion: templateInfo.version,
        upgradeAvailable: upgradeInfo.needsUpgrade,
        validationPassed: true
      };

    } catch (error) {
      console.error('❌ Enhanced workflow deployment failed:', error);
      
      // Update metadata with error information
      if (deploymentMetadata) {
        deploymentMetadata = this.metadataManager.updateDeploymentMetadata(
          deploymentMetadata, 
          'error', 
          { errors: [error.message] }
        );
        await this.metadataManager.storeDeploymentMetadata(deploymentMetadata);
      }
      
      throw new Error(`Enhanced workflow deployment failed: ${error.message}`);
    }
  }

  /**
   * Check for template upgrades
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Object>} Upgrade information
   */
  async checkForUpgrades(userId, workflowData) {
    try {
      const businessType = workflowData.businessType || 'Pools & Spas';
      return await this.versionManager.checkForUpgrade(userId, businessType);
    } catch (error) {
      console.warn('⚠️ Could not check for upgrades:', error.message);
      return { needsUpgrade: false, error: error.message };
    }
  }

  /**
   * Create deployment metadata
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow data
   * @returns {Object} Deployment metadata
   */
  createDeploymentMetadata(userId, workflowData) {
    const businessType = workflowData.businessType || 'Pools & Spas';
    const templateInfo = this.versionManager.getTemplateMetadata(businessType);
    
    return this.metadataManager.createDeploymentMetadata(
      userId, 
      businessType, 
      workflowData, 
      templateInfo
    );
  }

  /**
   * Get comprehensive onboarding data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Onboarding data
   */
  async getComprehensiveOnboardingData(userId) {
    try {
      const { OnboardingDataAggregator } = await import('./onboardingDataAggregator.js');
      const aggregator = new OnboardingDataAggregator(userId);
      return await aggregator.prepareN8nData();
    } catch (error) {
      console.error('❌ Failed to get comprehensive onboarding data:', error);
      return null;
    }
  }

  /**
   * Get template with business extensions
   * @param {Object} onboardingData - Onboarding data
   * @returns {Promise<Object>} Template information
   */
  async getTemplateWithExtensions(onboardingData) {
    const businessTypes = onboardingData.business?.types || 
                        (onboardingData.business?.type ? [onboardingData.business.type] : ['Pools & Spas']);
    
    // If multiple business types, use the aggregator
    if (businessTypes.length > 1) {
      console.log('🔄 Multiple business types detected, using template aggregator...');
      const aggregatedTemplate = await universalTemplateManager.getUniversalTemplate(
        businessTypes, 
        onboardingData
      );
      
      return {
        template: aggregatedTemplate,
        version: 'multi-business-v1.0.0',
        id: 'multi-business-aggregated',
        metadata: {
          businessTypes: businessTypes,
          aggregatedAt: new Date().toISOString()
        }
      };
    }
    
    // Single business type - use existing logic
    const businessType = businessTypes[0];
    const templateMetadata = this.versionManager.getTemplateMetadata(businessType);
    
    // Import template based on business type (use only files that exist!)
    const templateMap = {
      'Hot tub & Spa': () => import('./n8n-templates/hot_tub_base_template.json'),
      'Pools & Spas': () => import('./n8n-templates/pools_spas_generic_template.json'),
      'Pools': () => import('./n8n-templates/pools_spas_generic_template.json'),
      'HVAC': () => import('./n8n-templates/hvac_template.json'),
      'Electrician': () => import('./n8n-templates/electrician_template.json'),
      'Plumber': () => import('./n8n-templates/plumber_template.json'),
      'Sauna & Icebath': () => import('./n8n-templates/pools_spas_generic_template.json'),
      'Flooring': () => import('./n8n-templates/flooring_template.json'),
      'General Construction': () => import('./n8n-templates/construction_template.json'),
      'Landscaping': () => import('./n8n-templates/landscaping_template.json'),
      'Painting': () => import('./n8n-templates/painting_template.json'),
      'Roofing': () => import('./n8n-templates/roofing_template.json'),
      'Insulation & Foam Spray': () => import('./n8n-templates/hvac_template.json')
    };

    const templateLoader = templateMap[businessType] || (() => import('./n8n-templates/hot_tub_base_template.json'));
    const template = await templateLoader();
    
    return {
      template: template.default || template,
      version: templateMetadata.version,
      id: templateMetadata.id,
      metadata: templateMetadata
    };
  }

  /**
   * Resolve and inject credentials
   * @param {Object} workflow - Workflow template
   * @param {string} userId - User ID
   * @param {Object} onboardingData - Onboarding data
   * @returns {Promise<Object>} Workflow with credentials
   */
  async resolveAndInjectCredentials(workflow, userId, onboardingData) {
    try {
      console.log('🔐 Resolving credentials for workflow...');
      
      // Initialize credential resolver
      const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
      const n8nApiKey = process.env.N8N_API_KEY;
      this.credentialManager.initialize(n8nBaseUrl, n8nApiKey);

      // Get user integrations for credential data
      const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      const gmailIntegration = integrations?.find(i => i.provider === 'gmail');
      
      // Resolve Gmail credentials
      const gmailCredential = await this.credentialManager.getOrCreateCredential(
        userId, 
        'gmail', 
        {
          accessToken: gmailIntegration?.access_token,
          refreshToken: gmailIntegration?.refresh_token,
          businessName: onboardingData.business?.info?.name || 'Business'
        }
      );

      // Resolve OpenAI credentials
      const openaiCredential = await this.credentialManager.getOrCreateCredential(
        userId, 
        'openai', 
        {
          businessName: onboardingData.business?.info?.name || 'Business'
        }
      );

      // Inject credentials into workflow
      const workflowWithCredentials = this.injectCredentialsIntoWorkflow(workflow, {
        gmail: gmailCredential,
        openai: openaiCredential
      });

      console.log('✅ Credentials resolved and injected successfully');
      return workflowWithCredentials;

    } catch (error) {
      console.error('❌ Failed to resolve credentials:', error);
      throw error;
    }
  }

  /**
   * Generate and inject AI prompts
   * @param {Object} workflow - Workflow with credentials
   * @param {Object} onboardingData - Onboarding data
   * @returns {Promise<Object>} Workflow with AI prompts
   */
  async generateAndInjectPrompts(workflow, onboardingData) {
    try {
      console.log('🧠 Generating AI prompts for workflow...');
      
      const promptContext = {
        businessName: onboardingData.business?.info?.name || 'Business',
        businessTypes: onboardingData.business?.types || 
                      (onboardingData.business?.type ? [onboardingData.business.type] : ['Pools & Spas']),
        businessType: onboardingData.business?.type || 'Pools & Spas', // Legacy support
        tone: 'professional',
        primaryServices: onboardingData.business?.services || [],
        escalationRules: onboardingData.business?.rules || {},
        managers: onboardingData.team?.managers || [],
        suppliers: onboardingData.team?.suppliers || [],
        customRules: []
      };

      const prompts = this.promptBuilder.composePrompt(promptContext);
      
      // Inject prompts into workflow nodes
      const workflowWithPrompts = this.injectPromptsIntoWorkflow(workflow, prompts);
      
      console.log('✅ AI prompts generated and injected successfully');
      return workflowWithPrompts;

    } catch (error) {
      console.error('❌ Failed to generate AI prompts:', error);
      throw error;
    }
  }

  /**
   * Inject credentials into workflow
   * @param {Object} workflow - Workflow template
   * @param {Object} credentials - Resolved credentials
   * @returns {Object} Workflow with credentials
   */
  injectCredentialsIntoWorkflow(workflow, credentials) {
    const workflowWithCredentials = JSON.parse(JSON.stringify(workflow));
    
    workflowWithCredentials.nodes.forEach(node => {
      if (node.credentials) {
        Object.keys(node.credentials).forEach(credType => {
          if (credType === 'gmailOAuth2' && credentials.gmail) {
            node.credentials[credType] = {
              id: credentials.gmail.n8n_credential_id,
              name: credentials.gmail.credential_name
            };
          } else if (credType === 'openAi' && credentials.openai) {
            node.credentials[credType] = {
              id: credentials.openai.n8n_credential_id,
              name: credentials.openai.credential_name
            };
          }
        });
      }
    });

    return workflowWithCredentials;
  }

  /**
   * Inject prompts into workflow
   * @param {Object} workflow - Workflow with credentials
   * @param {Object} prompts - Generated prompts
   * @returns {Object} Workflow with prompts
   */
  injectPromptsIntoWorkflow(workflow, prompts) {
    const workflowWithPrompts = JSON.parse(JSON.stringify(workflow));
    
    workflowWithPrompts.nodes.forEach(node => {
      if (node.id === 'ai-classifier' && node.parameters?.options) {
        node.parameters.options.systemMessage = prompts.classifier;
      } else if (node.id === 'ai-draft-reply' && node.parameters?.options) {
        node.parameters.options.systemMessage = prompts.responder;
      }
    });

    return workflowWithPrompts;
  }

  /**
   * Deploy workflow to N8N
   * @param {string} userId - User ID
   * @param {Object} workflow - Final workflow JSON
   * @param {Object} metadata - Deployment metadata
   * @returns {Promise<Object>} Deployment result
   */
  async deployToN8n(userId, workflow, metadata) {
    try {
      console.log('🚀 Deploying workflow to N8N...');
      
      // Update metadata
      const updatedMetadata = this.metadataManager.updateDeploymentMetadata(
        metadata, 
        'deployment_start'
      );

      // Use existing deployment logic
      const deploymentResult = await this.directDeployer.deployWorkflow(userId, workflow);
      
      // Update metadata with completion
      this.metadataManager.updateDeploymentMetadata(
        updatedMetadata, 
        'completion'
      );

      return deploymentResult;

    } catch (error) {
      console.error('❌ N8N deployment failed:', error);
      throw error;
    }
  }

  /**
   * Store workflow record in database
   * @param {string} userId - User ID
   * @param {Object} deploymentResult - Deployment result
   * @param {Object} workflowData - Original workflow data
   * @returns {Promise<void>}
   */
  async storeWorkflowRecord(userId, deploymentResult, workflowData) {
    try {
      const workflowRecord = {
        client_id: userId,
        n8n_workflow_id: deploymentResult.id,
        workflow_name: workflowData.name || 'FloWorx Automation',
        status: 'active',
        version: deploymentResult.version || 1,
        template_version: workflowData.templateVersion || '1.0.0',
        deployment_id: workflowData.deploymentId,
        n8n_url: deploymentResult.n8nUrl,
        webhook_url: deploymentResult.webhookUrl,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('workflows')
        .insert(workflowRecord);

      if (error) {
        console.error('Error storing workflow record:', error);
        throw new Error(`Failed to store workflow record: ${error.message}`);
      }

      console.log('✅ Workflow record stored successfully');
    } catch (error) {
      console.error('❌ Failed to store workflow record:', error);
      throw error;
    }
  }
}

export const enhancedWorkflowDeployer = new EnhancedWorkflowDeployer();
