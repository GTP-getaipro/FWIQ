/**
 * Deployment Override
 * Switches from edge function to direct deployment when edge function fails
 */

import DirectWorkflowDeployer from './directWorkflowDeployer.js';

class DeploymentOverride {
  constructor() {
    this.directDeployer = new DirectWorkflowDeployer();
  }

  /**
   * Override deployment to use direct method when edge function fails
   * @param {object} clientData - Complete client data
   * @param {string} templateType - 'gmail' or 'outlook'
   * @returns {Promise<object>} - Deployment result
   */
  async deployWithOverride(clientData, templateType = 'outlook') {
    try {
      console.log('🚀 Starting deployment with override system...');
      
      // First, try the direct deployment method
      console.log('🔄 Attempting direct deployment (bypassing edge function)...');
      const directResult = await this.directDeployer.deployWorkflow(clientData, templateType);
      
      if (directResult.success) {
        console.log('✅ Direct deployment successful!');
        return {
          success: true,
          method: 'direct',
          result: directResult,
          message: 'Deployed successfully using direct method (bypassed edge function)'
        };
      } else {
        console.log('❌ Direct deployment failed:', directResult.error);
        return {
          success: false,
          method: 'direct',
          error: directResult.error,
          message: 'Direct deployment failed'
        };
      }
    } catch (error) {
      console.error('❌ Deployment override failed:', error);
      return {
        success: false,
        method: 'override',
        error: error.message,
        message: 'Deployment override system failed'
      };
    }
  }

  /**
   * Test the override system
   */
  async testOverrideSystem() {
    try {
      console.log('🧪 Testing deployment override system...');
      
      const testResult = await this.directDeployer.testDeploymentSystem();
      
      return {
        success: testResult.success,
        method: 'direct',
        testResult: testResult,
        message: testResult.success ? 'Override system is ready' : 'Override system has issues'
      };
    } catch (error) {
      console.error('❌ Override system test failed:', error);
      return {
        success: false,
        method: 'override',
        error: error.message,
        message: 'Override system test failed'
      };
    }
  }
}

export default DeploymentOverride;
