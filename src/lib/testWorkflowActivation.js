/**
 * Test Workflow Activation Fix
 * Simple test to verify the activation fix works
 */

import { n8nWorkflowActivationFix } from './n8nWorkflowActivationFix.js';

export const testWorkflowActivation = async (workflowId, userId) => {
  try {
    console.log('🧪 Testing workflow activation fix...');
    
    // Step 1: Validate workflow configuration
    const validation = await n8nWorkflowActivationFix.validateWorkflowConfiguration(workflowId);
    console.log('📋 Workflow validation:', validation);
    
    if (!validation.valid) {
      console.error('❌ Workflow configuration issues:', validation.issues);
      return { success: false, error: 'Workflow configuration invalid' };
    }
    
    // Step 2: Attempt to fix activation
    const fixResult = await n8nWorkflowActivationFix.fixWorkflowActivation(workflowId, userId);
    console.log('🔧 Fix result:', fixResult);
    
    return fixResult;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testWorkflowActivation = testWorkflowActivation;
  window.n8nWorkflowActivationFix = n8nWorkflowActivationFix;
}
