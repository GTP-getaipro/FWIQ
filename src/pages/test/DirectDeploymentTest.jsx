import React, { useState } from 'react';
import DirectWorkflowDeployer from '../../lib/directWorkflowDeployer.js';
import DeploymentOverride from '../../lib/deploymentOverride.js';
import { debugBehaviorConfig, testBusinessTypeMapping } from '../../lib/debugBehaviorSchema.js';
import { debugSystemMessages } from '../../lib/debugSystemMessages.js';
import { validateDataInjection } from '../../lib/validateDataInjection.js';

const DirectDeploymentTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState({
    userId: 'test-user-123',
    business: {
      name: 'The Hot Tub Man Ltd.',
      emailDomain: 'thehottubman.ca',
      phone: '403-550-5140',
      websiteUrl: 'https://www.thehottubman.ca',
      businessTypes: ['pools_spas']
    },
    emailProvider: 'gmail',
    managers: [
      { name: 'Mark', role: 'Owner', email: 'mark@thehottubman.ca' }
    ],
    suppliers: [
      { name: 'Jacuzzi', email: 'orders@jacuzzi.com', category: 'Hot Tubs' },
      { name: 'Sundance Spas', email: 'support@sundancespas.com', category: 'Hot Tubs' }
    ],
    email_labels: {
      'URGENT': { id: 'urgent-folder', name: 'Urgent' },
      'SALES': { id: 'sales-folder', name: 'Sales' },
      'SUPPORT': { id: 'support-folder', name: 'Support' },
      'MISC': { id: 'misc-folder', name: 'Miscellaneous' }
    },
    voiceProfile: {
      learning_count: 5,
      style_profile: {
        voice: {
          empathyLevel: 0.8,
          formalityLevel: 0.7,
          directnessLevel: 0.6,
          confidence: 0.9
        },
        signaturePhrases: [
          { phrase: "We've got you covered", confidence: 0.9, context: 'reassurance' },
          { phrase: "Thanks so much for supporting our small business", confidence: 0.95, context: 'closing' }
        ]
      }
    },
    integrations: {
      gmail: { credentialId: 'VdGXM3pTQ9zHkarD' },
      openai: { credentialId: 'NxYVsH1eQ1mfzoW6' }
    }
  });

  const deployer = new DirectWorkflowDeployer();
  const override = new DeploymentOverride();

  const handleTestSystem = async () => {
    setIsLoading(true);
    try {
      const result = await override.testOverrideSystem();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployWorkflow = async () => {
    setIsLoading(true);
    try {
      const result = await override.deployWithOverride(clientData, 'gmail');
      setDeploymentResult(result);
    } catch (error) {
      setDeploymentResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHistory = () => {
    const history = deployer.getDeploymentHistory();
    console.log('Deployment History:', history);
    alert(`Found ${history.records.length} deployment records. Check console for details.`);
  };

  const handleDebugBehaviorConfig = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Debugging behavior config extraction...');
      
      // Test business type mapping
      testBusinessTypeMapping();
      
      // Debug behavior config for current client data
      const debugResult = debugBehaviorConfig(
        clientData.business.businessTypes,
        {
          name: clientData.business.name,
          phone: clientData.business.phone,
          websiteUrl: clientData.business.websiteUrl,
          emailDomain: clientData.business.emailDomain,
          managers: clientData.managers,
          suppliers: clientData.suppliers,
          serviceAreas: ['Main service area'],
          timezone: 'UTC/GMT -6'
        },
        clientData.voiceProfile
      );
      
      console.log('🔍 Debug result:', debugResult);
      
      if (debugResult.success) {
        alert('✅ Behavior config extraction successful! Check console for details.');
      } else {
        alert(`❌ Behavior config extraction failed: ${debugResult.error}`);
      }
    } catch (error) {
      console.error('❌ Debug failed:', error);
      alert(`❌ Debug failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugSystemMessages = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Debugging system messages...');
      
      const debugResult = await debugSystemMessages(clientData);
      
      console.log('🔍 System messages debug result:', debugResult);
      
      // Show summary
      let summary = 'System Messages Debug Results:\n\n';
      
      if (debugResult.aiClassifier?.success) {
        summary += `✅ AI Classifier: ${debugResult.aiClassifier.length} chars\n`;
        summary += `  - Business Context: ${debugResult.aiClassifier.hasBusinessContext ? '✅' : '❌'}\n`;
        summary += `  - Managers: ${debugResult.aiClassifier.hasManagers ? '✅' : '❌'}\n`;
        summary += `  - Suppliers: ${debugResult.aiClassifier.hasSuppliers ? '✅' : '❌'}\n`;
        summary += `  - Labels: ${debugResult.aiClassifier.hasLabels ? '✅' : '❌'}\n`;
        summary += `  - Keywords: ${debugResult.aiClassifier.hasKeywords ? '✅' : '❌'}\n\n`;
      } else {
        summary += `❌ AI Classifier: ${debugResult.aiClassifier?.error || 'Failed'}\n\n`;
      }
      
      if (debugResult.aiDraft?.success) {
        summary += `✅ AI Draft: ${debugResult.aiDraft.length} chars\n`;
        summary += `  - Business Name: ${debugResult.aiDraft.hasBusinessName ? '✅' : '❌'}\n`;
        summary += `  - Assistant Role: ${debugResult.aiDraft.hasAssistantRole ? '✅' : '❌'}\n`;
        summary += `  - Intelligent Conversation: ${debugResult.aiDraft.hasIntelligentConversation ? '✅' : '❌'}\n`;
        summary += `  - Follow-up Ownership: ${debugResult.aiDraft.hasFollowUpOwnership ? '✅' : '❌'}\n`;
        summary += `  - Personal Touch: ${debugResult.aiDraft.hasPersonalTouch ? '✅' : '❌'}\n`;
        summary += `  - Avoid Mistakes: ${debugResult.aiDraft.hasAvoidMistakes ? '✅' : '❌'}\n`;
        summary += `  - Instructions: ${debugResult.aiDraft.hasInstructions ? '✅' : '❌'}\n`;
        summary += `  - Rules: ${debugResult.aiDraft.hasRules ? '✅' : '❌'}\n`;
        summary += `  - Examples: ${debugResult.aiDraft.hasExamples ? '✅' : '❌'}\n\n`;
      } else {
        summary += `❌ AI Draft: ${debugResult.aiDraft?.error || 'Failed'}\n\n`;
      }
      
      if (debugResult.templateReplacement?.success) {
        summary += `✅ Template Replacement: Working\n`;
        summary += `  - AI Classifier Replaced: ${debugResult.templateReplacement.aiClassifierReplaced ? '✅' : '❌'}\n`;
        summary += `  - AI Draft Replaced: ${debugResult.templateReplacement.aiDraftReplaced ? '✅' : '❌'}\n`;
      } else {
        summary += `❌ Template Replacement: Failed\n`;
      }
      
      if (debugResult.errors.length > 0) {
        summary += `\n❌ Errors:\n${debugResult.errors.join('\n')}`;
      }
      
      alert(summary);
    } catch (error) {
      console.error('❌ System messages debug failed:', error);
      alert(`❌ System messages debug failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateDataInjection = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Validating data injection...');
      
      const validationResult = await validateDataInjection(clientData);
      
      console.log('🔍 Validation result:', validationResult);
      
      // Show summary
      let summary = 'Data Injection Validation Results:\n\n';
      
      summary += `📊 Overall: ${validationResult.overall.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
      summary += `   ${validationResult.overall.summary}\n\n`;
      
      summary += `🔧 Layer 1 (AI Config): ${validationResult.layer1.success ? '✅' : '❌'}\n`;
      if (validationResult.layer1.details) {
        summary += `   - System Message: ${validationResult.layer1.details.systemMessageLength} chars\n`;
        summary += `   - Business Name: ${validationResult.layer1.details.hasBusinessName ? '✅' : '❌'}\n`;
        summary += `   - Keywords: ${validationResult.layer1.details.hasKeywords ? '✅' : '❌'}\n`;
      }
      if (validationResult.layer1.issues.length > 0) {
        summary += `   Issues: ${validationResult.layer1.issues.join(', ')}\n`;
      }
      summary += '\n';
      
      summary += `🎭 Layer 2 (Behavior Config): ${validationResult.layer2.success ? '✅' : '❌'}\n`;
      if (validationResult.layer2.details) {
        summary += `   - Reply Prompt: ${validationResult.layer2.details.replyPromptLength} chars\n`;
        summary += `   - Using Gold Standard: ${validationResult.layer2.details.isUsingGoldStandard ? '✅' : '❌'}\n`;
        summary += `   - Expected vs Actual: ${validationResult.layer2.details.actualVsExpected.ratio.toFixed(2)}x\n`;
      }
      if (validationResult.layer2.issues.length > 0) {
        summary += `   Issues: ${validationResult.layer2.issues.join(', ')}\n`;
      }
      summary += '\n';
      
      summary += `🏷️ Layer 3 (Label Config): ${validationResult.layer3.success ? '✅' : '❌'}\n`;
      if (validationResult.layer3.details) {
        summary += `   - Labels: ${validationResult.layer3.details.labelsCount}\n`;
        summary += `   - Special Rules: ${validationResult.layer3.details.hasSpecialRules ? '✅' : '❌'}\n`;
        summary += `   - Auto Reply Rules: ${validationResult.layer3.details.hasAutoReplyRules ? '✅' : '❌'}\n`;
      }
      if (validationResult.layer3.issues.length > 0) {
        summary += `   Issues: ${validationResult.layer3.issues.join(', ')}\n`;
      }
      summary += '\n';
      
      summary += `👥 User Data: ${validationResult.userData.success ? '✅' : '❌'}\n`;
      if (validationResult.userData.details) {
        summary += `   - Business Name: ${validationResult.userData.details.hasBusinessName ? '✅' : '❌'}\n`;
        summary += `   - Email Domain: ${validationResult.userData.details.hasEmailDomain ? '✅' : '❌'}\n`;
        summary += `   - Managers: ${validationResult.userData.details.managersCount}\n`;
        summary += `   - Suppliers: ${validationResult.userData.details.suppliersCount}\n`;
        summary += `   - Email Labels: ${validationResult.userData.details.emailLabelsCount}\n`;
      }
      if (validationResult.userData.issues.length > 0) {
        summary += `   Issues: ${validationResult.userData.issues.join(', ')}\n`;
      }
      summary += '\n';
      
      summary += `🎤 Voice Training: ${validationResult.voiceTraining.success ? '✅' : '❌'}\n`;
      if (validationResult.voiceTraining.details) {
        summary += `   - Learning Count: ${validationResult.voiceTraining.details.learningCount}\n`;
        summary += `   - Signature Phrases: ${validationResult.voiceTraining.details.signaturePhrasesCount}\n`;
        summary += `   - Few Shot Examples: ${validationResult.voiceTraining.details.fewShotExamplesCount}\n`;
      }
      if (validationResult.voiceTraining.issues.length > 0) {
        summary += `   Issues: ${validationResult.voiceTraining.issues.join(', ')}\n`;
      }
      
      alert(summary);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      alert(`❌ Validation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Direct Deployment System Test</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">🚀 Direct Deployment System</h2>
        <p className="text-gray-700">
          This system bypasses the failing Supabase edge function and deploys workflows directly:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-700">
          <li><strong>DirectTemplateInjector:</strong> Injects comprehensive behavior prompts in frontend</li>
          <li><strong>DirectN8nDeployer:</strong> Deploys directly to N8N API</li>
          <li><strong>Gold Standard Prompt:</strong> Uses the detailed behavior prompts you showed</li>
          <li><strong>No Edge Function:</strong> Completely bypasses the failing edge function</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test System */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">🧪 Test System</h3>
          <button
            onClick={handleTestSystem}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Direct Deployment System'}
          </button>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h4 className="font-semibold">
                {testResult.success ? '✅ System Ready' : '❌ System Issues'}
              </h4>
              <p className="text-sm text-gray-700 mt-1">{testResult.message}</p>
              {!testResult.success && (
                <p className="text-sm text-red-700 mt-1">{testResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Deploy Workflow */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">🚀 Deploy Workflow</h3>
          <button
            onClick={handleDeployWorkflow}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Deploying...' : 'Deploy Gmail Workflow (Direct)'}
          </button>
          
          {deploymentResult && (
            <div className={`mt-4 p-3 rounded ${deploymentResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <h4 className="font-semibold">
                {deploymentResult.success ? '✅ Deployment Successful' : '❌ Deployment Failed'}
              </h4>
              <p className="text-sm text-gray-700 mt-1">{deploymentResult.message}</p>
              {deploymentResult.success && deploymentResult.result && (
                <div className="text-sm text-gray-700 mt-2">
                  <p><strong>Method:</strong> {deploymentResult.method}</p>
                  <p><strong>Workflow ID:</strong> {deploymentResult.result.workflowId}</p>
                  <p><strong>Business:</strong> {deploymentResult.result.businessName}</p>
                  <p><strong>Provider:</strong> {deploymentResult.result.emailProvider}</p>
                </div>
              )}
              {!deploymentResult.success && (
                <p className="text-sm text-red-700 mt-1">{deploymentResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Client Data Preview */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">📊 Client Data Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Business:</strong> {clientData.business.name}</p>
            <p><strong>Email Domain:</strong> {clientData.business.emailDomain}</p>
            <p><strong>Phone:</strong> {clientData.business.phone}</p>
            <p><strong>Provider:</strong> {clientData.emailProvider}</p>
          </div>
          <div>
            <p><strong>Managers:</strong> {clientData.managers.length}</p>
            <p><strong>Suppliers:</strong> {clientData.suppliers.length}</p>
            <p><strong>Labels:</strong> {Object.keys(clientData.email_labels).length}</p>
            <p><strong>Voice Profile:</strong> {clientData.voiceProfile.learning_count} edits</p>
            <p><strong>Gmail Cred:</strong> {clientData.integrations.gmail.credentialId}</p>
            <p><strong>OpenAI Cred:</strong> {clientData.integrations.openai.credentialId}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4 flex-wrap">
        <button
          onClick={handleGetHistory}
          className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Get Deployment History
        </button>
        <button
          onClick={() => {
            const validation = deployer.validateClientData(clientData);
            alert(`Validation: ${validation.isValid ? 'Valid' : 'Invalid'}\nErrors: ${validation.errors.join(', ')}\nWarnings: ${validation.warnings.join(', ')}`);
          }}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
        >
          Validate Client Data
        </button>
        <button
          onClick={handleDebugBehaviorConfig}
          disabled={isLoading}
          className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {isLoading ? 'Debugging...' : 'Debug Behavior Config'}
        </button>
        <button
          onClick={handleDebugSystemMessages}
          disabled={isLoading}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'Debugging...' : 'Debug System Messages'}
        </button>
        <button
          onClick={handleValidateDataInjection}
          disabled={isLoading}
          className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Validating...' : 'Validate Data Injection'}
        </button>
      </div>

      {/* Issue Explanation */}
      <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">⚠️ Current Issue</h3>
        <p className="text-gray-700">
          The Supabase edge function is failing because it's looking for a credential named <code className="bg-gray-200 px-1 rounded">openai-shared</code> 
          that doesn't exist in your N8N instance. The error message shows:
        </p>
        <div className="bg-red-100 p-3 rounded mt-2">
          <code className="text-red-800">"openai-shared credential not found. Please ensure it exists in the n8n instance."</code>
        </div>
        <p className="text-gray-700 mt-2">
          This direct deployment system bypasses that issue entirely by using the correct credential IDs directly.
        </p>
      </div>
    </div>
  );
};

export default DirectDeploymentTest;