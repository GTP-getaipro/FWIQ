/**
 * Direct Workflow Deployer
 * Bypasses Supabase edge function and deploys workflows directly
 * Uses DirectTemplateInjector for reliable template injection
 */

import DirectTemplateInjector from './directTemplateInjector.js';
import DirectN8nDeployer from './directN8nDeployer.js';

class DirectWorkflowDeployer {
  constructor() {
    this.templateInjector = new DirectTemplateInjector();
    this.n8nDeployer = new DirectN8nDeployer();
  }

  /**
   * Deploy workflow directly without edge function
   * @param {object} clientData - Complete client onboarding data
   * @param {string} templateType - 'gmail' or 'outlook'
   * @returns {Promise<object>} - Deployment result
   */
  async deployWorkflow(clientData, templateType = 'outlook') {
    try {
      console.log('🚀 Starting direct workflow deployment...');
      console.log('📊 Deployment parameters:', {
        templateType,
        businessName: clientData.business?.name,
        emailProvider: clientData.emailProvider,
        userId: clientData.userId
      });

      // Step 1: Inject template data
      console.log('🔄 Step 1: Injecting template data...');
      const injectionResult = await this.templateInjector.injectTemplateData(clientData, templateType);
      
      if (!injectionResult.success) {
        throw new Error(`Template injection failed: ${injectionResult.error}`);
      }
      
      console.log('✅ Template injection successful');
      console.log('📋 Injected workflow metadata:', injectionResult.metadata);

      // Step 2: Deploy to N8N
      console.log('🔄 Step 2: Deploying to N8N...');
      const deploymentResult = await this.n8nDeployer.deployWorkflow(injectionResult.workflow);
      
      if (!deploymentResult.success) {
        throw new Error(`N8N deployment failed: ${deploymentResult.error}`);
      }
      
      console.log('✅ N8N deployment successful');
      console.log('📋 Deployment result:', {
        workflowId: deploymentResult.workflowId,
        workflowName: deploymentResult.workflowName,
        webhookUrl: deploymentResult.webhookUrl
      });

      // Step 3: Store deployment record
      console.log('🔄 Step 3: Storing deployment record...');
      const storageResult = await this.storeDeploymentRecord(clientData, deploymentResult, injectionResult.metadata);
      
      if (!storageResult.success) {
        console.warn('⚠️ Deployment record storage failed:', storageResult.error);
        // Continue anyway as the workflow is deployed
      } else {
        console.log('✅ Deployment record stored');
      }

      return {
        success: true,
        workflowId: deploymentResult.workflowId,
        workflowName: deploymentResult.workflowName,
        webhookUrl: deploymentResult.webhookUrl,
        templateType,
        businessName: clientData.business?.name,
        emailProvider: clientData.emailProvider,
        deployedAt: new Date().toISOString(),
        metadata: {
          injection: injectionResult.metadata,
          deployment: deploymentResult,
          storage: storageResult
        }
      };

    } catch (error) {
      console.error('❌ Direct workflow deployment failed:', error);
      return {
        success: false,
        error: error.message,
        details: error.stack,
        templateType,
        businessName: clientData.business?.name,
        emailProvider: clientData.emailProvider
      };
    }
  }

  /**
   * Store deployment record in local storage or database
   */
  async storeDeploymentRecord(clientData, deploymentResult, injectionMetadata) {
    try {
      const record = {
        id: `deployment_${Date.now()}`,
        userId: clientData.userId,
        businessName: clientData.business?.name,
        emailProvider: clientData.emailProvider,
        templateType: injectionMetadata.templateType,
        workflowId: deploymentResult.workflowId,
        workflowName: deploymentResult.workflowName,
        webhookUrl: deploymentResult.webhookUrl,
        deployedAt: new Date().toISOString(),
        status: 'active',
        metadata: {
          injection: injectionMetadata,
          deployment: deploymentResult
        }
      };

      // Store in localStorage for now (can be enhanced to use database)
      const existingRecords = JSON.parse(localStorage.getItem('workflowDeployments') || '[]');
      existingRecords.push(record);
      localStorage.setItem('workflowDeployments', JSON.stringify(existingRecords));

      return {
        success: true,
        recordId: record.id,
        record
      };
    } catch (error) {
      console.error('❌ Deployment record storage failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory() {
    try {
      const records = JSON.parse(localStorage.getItem('workflowDeployments') || '[]');
      return {
        success: true,
        records: records.sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt))
      };
    } catch (error) {
      console.error('❌ Failed to get deployment history:', error);
      return {
        success: false,
        error: error.message,
        records: []
      };
    }
  }

  /**
   * Test deployment system
   */
  async testDeploymentSystem() {
    try {
      console.log('🧪 Testing direct deployment system...');
      
      // Test template injection
      const testClientData = {
        userId: 'test-user',
        business: {
          name: 'Test Business',
          emailDomain: 'test.com',
          phone: '(555) 555-5555'
        },
        emailProvider: 'outlook',
        managers: [],
        suppliers: [],
        email_labels: {}
      };

      const injectionTest = await this.templateInjector.injectTemplateData(testClientData, 'outlook');
      if (!injectionTest.success) {
        throw new Error(`Template injection test failed: ${injectionTest.error}`);
      }

      // Test N8N connectivity
      const n8nTest = await this.n8nDeployer.testConnectivity();
      if (!n8nTest.success) {
        throw new Error(`N8N connectivity test failed: ${n8nTest.error}`);
      }

      return {
        success: true,
        tests: {
          templateInjection: injectionTest,
          n8nConnectivity: n8nTest
        }
      };
    } catch (error) {
      console.error('❌ Deployment system test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate client data before deployment
   */
  validateClientData(clientData) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!clientData.userId) {
      errors.push('User ID is required');
    }
    if (!clientData.business?.name) {
      errors.push('Business name is required');
    }
    if (!clientData.emailProvider) {
      errors.push('Email provider is required');
    }

    // Recommended fields
    if (!clientData.business?.emailDomain) {
      warnings.push('Email domain not specified');
    }
    if (!clientData.business?.phone) {
      warnings.push('Business phone not specified');
    }
    if (!clientData.managers || clientData.managers.length === 0) {
      warnings.push('No managers specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default DirectWorkflowDeployer;