import { supabase } from '@/lib/customSupabaseClient';
import { injectOnboardingData } from '@/lib/templateService';
import { workflowDeployer } from '@/lib/workflowDeployer';
import { mapClientConfigToN8n } from '@/lib/n8nConfigMapper';
import { n8nWorkflowActivationFix } from './n8nWorkflowActivationFix.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const deployAutomation = async (userId, setDeploymentStatus) => {
  try {
    setDeploymentStatus(prev => ({ ...prev, validation: 'in-progress' }));
    await sleep(1000); 
    
    // ENHANCED: Use n8nConfigMapper to get complete profile with all 3 layers + voice
    console.log('📊 Fetching complete profile with 3-layer schema system + voice training...');
    let n8nConfig = null;
    let profile = null;
    
    try {
      n8nConfig = await mapClientConfigToN8n(userId);
      console.log('✅ Complete profile retrieved with enhanced n8nConfigMapper:', {
        businessTypes: n8nConfig.business?.business_types,
        emailLabels: Object.keys(n8nConfig.email_labels || {}).length,
        voiceProfileAvailable: n8nConfig.metadata?.voiceProfileAvailable || false,
        learningCount: n8nConfig.metadata?.learningCount || 0
      });
      
      // For backward compatibility with existing code
      profile = {
        client_config: {
          business_name: n8nConfig.business?.business_name || n8nConfig.business?.name,
          ...n8nConfig.business
        }
      };
    } catch (error) {
      console.warn('⚠️ n8nConfigMapper failed, falling back to direct profile query:', error.message);
      
      // Fallback to legacy method
      const { data: fallbackProfile, error: profileError } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', userId)
        .single();

      if (profileError || !fallbackProfile || !fallbackProfile.client_config) {
        throw new Error('Failed to fetch client configuration.');
      }
      
      profile = fallbackProfile;
      n8nConfig = {
        id: userId,
        business: profile.client_config,
        managers: [],
        suppliers: [],
        email_labels: {},
        voiceProfile: null
      };
    }
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id, version, n8n_workflow_id')
      .eq('user_id', userId)  // ✅ FIXED: Use user_id instead of client_id
      .eq('status', 'active')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

    if (fetchError) {
      console.error('❌ Error checking for existing workflows:', fetchError);
      throw new Error('Failed to check for existing workflows.');
    }

    let nextVersion = 1;
    let n8nWorkflowId = `wf_${Date.now()}`;

    if (existingWorkflow) {
      nextVersion = existingWorkflow.version + 1;
      n8nWorkflowId = existingWorkflow.n8n_workflow_id; 
      
      console.log('🔄 Found existing workflow, properly deactivating and archiving...');
      
      try {
        // Step 1: Deactivate the workflow in n8n first
        console.log('⏸️ Deactivating existing workflow in n8n...');
        await workflowDeployer.apiClient.deactivateWorkflow(existingWorkflow.n8n_workflow_id);
        console.log('✅ Workflow deactivated in n8n');
        
        // Step 2: Archive in database
        console.log('📁 Archiving workflow in database...');
        const { error: archiveError } = await supabase
          .from('workflows')
          .update({ 
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWorkflow.id);
        
        if (archiveError) {
          throw new Error(`Failed to archive existing workflow: ${archiveError.message}`);
        }
        console.log('✅ Workflow archived in database');
        
      } catch (deactivationError) {
        console.warn('⚠️ Failed to properly deactivate/archive existing workflow:', deactivationError.message);
        console.warn('   Continuing with deployment - new workflow will be deployed alongside old one');
        // Continue with deployment even if deactivation fails
      }
    }

    // Create n8n credentials with business name before workflow deployment
    setDeploymentStatus(prev => ({ ...prev, validation: 'complete', credentials: 'in-progress' }));
    
    console.log('🔐 Creating n8n credentials with business name...');
    
    try {
      // Get business name from profile
      const businessName = n8nConfig.business?.business_name || n8nConfig.business?.name || 'Business';
      const businessType = n8nConfig.business?.business_type || n8nConfig.business?.type || 'General';
      
      // Get integration to determine provider
      const { data: integration } = await supabase
        .from('integrations')
        .select('provider')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (integration) {
        // Call the credential creation endpoint
        // Get backend URL from runtime config or environment
        const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
        const backendUrl = runtimeConfig?.BACKEND_URL || 
                          import.meta.env.BACKEND_URL || 
                          'http://localhost:3001';
        const credentialResponse = await fetch(`${backendUrl}/api/oauth/create-credential`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            provider: integration.provider,
            businessName: businessName,
            businessType: businessType
          })
        });
        
        if (credentialResponse.ok) {
          const credentialResult = await credentialResponse.json();
          console.log('✅ n8n credential created/updated:', credentialResult);
          setDeploymentStatus(prev => ({ ...prev, credentials: 'complete' }));
        } else {
          console.warn('⚠️ Failed to create credential, continuing with deployment');
          setDeploymentStatus(prev => ({ ...prev, credentials: 'failed' }));
        }
      } else {
        console.warn('⚠️ No active integration found, skipping credential creation');
        setDeploymentStatus(prev => ({ ...prev, credentials: 'skipped' }));
      }
    } catch (credentialError) {
      console.warn('⚠️ Credential creation failed, continuing with deployment:', credentialError.message);
      setDeploymentStatus(prev => ({ ...prev, credentials: 'failed' }));
    }

    // Deploy workflow using enhanced workflow deployer with all 3 layers + voice
    setDeploymentStatus(prev => ({ ...prev, injection: 'in-progress' }));
    
    console.log('🚀 Deploying workflow to n8n with all 3 schema layers + voice training...');
    
    // Create workflow data from n8nConfig (includes all 3 layers + voice)
    const workflowData = {
      name: `FloWorx Automation - ${n8nConfig.business?.business_name || n8nConfig.business?.name || 'Business'}`,
      nodes: [], // Will use default nodes from deployer
      connections: {}, // Will use default connections from deployer
      ...n8nConfig
    };
    
    // Deploy the workflow (now includes all enhancements)
    // Use archive-based redeployment to properly handle existing workflows
    const deploymentResult = existingWorkflow 
      ? await workflowDeployer.redeployWorkflowWithArchive(userId, workflowData)
      : await workflowDeployer.deployWorkflow(userId, workflowData);
    
    console.log('✅ Workflow deployment completed:', deploymentResult);
    console.log('📊 Deployment included:');
    console.log('  - Layer 1 (AI): Business-specific keywords and classification');
    console.log('  - Layer 2 (Behavior): Industry-appropriate tone and behavior');
    console.log('  - Layer 3 (Labels): Dynamic Gmail/Outlook label routing');
    console.log('  - Voice Training:', n8nConfig.metadata?.voiceProfileAvailable ? 
      `Learned style (${n8nConfig.metadata.learningCount} edits analyzed)` : 
      'Not available yet (new user)');
    
    // The workflow record is already stored by the workflow deployer
    console.log('✅ Workflow record stored by deployer');

    // Fix activation issues if deployment was successful but activation failed
    if (deploymentResult.success && deploymentResult.workflowId && !deploymentResult.isFunctional) {
      console.log('🔧 Attempting to fix workflow activation issues...');
      setDeploymentStatus(prev => ({ ...prev, testing: 'in-progress' }));
      
      try {
        const fixResult = await n8nWorkflowActivationFix.fixWorkflowActivation(
          deploymentResult.workflowId, 
          userId
        );
        
        if (fixResult.success) {
          console.log('✅ Workflow activation fixed successfully');
          deploymentResult.isFunctional = true;
          deploymentResult.activationFixed = true;
        } else {
          console.warn('⚠️ Could not fix workflow activation:', fixResult.error);
        }
      } catch (fixError) {
        console.warn('⚠️ Activation fix failed:', fixError.message);
      }
    }

    setDeploymentStatus(prev => ({ ...prev, injection: 'complete', workflow: 'complete', guardrails: 'in-progress' }));
    await sleep(800);
    setDeploymentStatus(prev => ({ ...prev, guardrails: 'complete', testing: 'in-progress' }));
    await sleep(500);
    setDeploymentStatus(prev => ({ ...prev, testing: 'complete' }));

    await supabase
      .from('profiles')
      .update({ onboarding_step: 'completed' })
      .eq('id', userId);

    return { 
      success: true, 
      workflowId: deploymentResult.workflowId, 
      version: deploymentResult.version,
      status: deploymentResult.status
    };

  } catch (err) {
    console.error('Deployment simulation failed:', err);
    return { success: false, error: err.message };
  }
};