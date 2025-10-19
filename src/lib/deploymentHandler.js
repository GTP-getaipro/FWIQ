import express from 'express';
import { supabase } from '../lib/customSupabaseClient.js';
import { buildCompositeTemplate } from '../lib/compositeTemplateBuilder.js';
import { injectRuntimeData } from '../lib/runtimeDataInjector.js';
import { createN8nClient } from '../lib/n8nClient.js';

const router = express.Router();

/**
 * Deploy Multi-Business Workflow
 * POST /api/deploy/:profileId
 * 
 * This endpoint handles the complete deployment pipeline:
 * 1. Fetch business profile data from Supabase
 * 2. Build composite template from business types
 * 3. Inject runtime data (labels, AI configs, business info)
 * 4. Deploy to n8n automation engine
 * 5. Update deployment status and log history
 */
router.post('/deploy/:profileId', async (req, res) => {
  const { profileId } = req.params;
  const startTime = Date.now();
  
  console.log(`🚀 Starting deployment for profile: ${profileId}`);
  
  try {
    // Step 1: Fetch complete business profile from Supabase
    console.log('📋 Fetching business profile data...');
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_complete_business_profile', { profile_id: profileId });
    
    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }
    
    if (!profileData) {
      throw new Error('Business profile not found');
    }
    
    const { profile, labels, ai_configs } = profileData;
    console.log(`✅ Profile loaded: ${profile.business_types?.join(', ')}`);
    
    // Step 2: Check for duplicate deployment
    const { data: existingDeployment } = await supabase
      .from('business_profiles')
      .select('n8n_workflow_id, deployment_status')
      .eq('id', profileId)
      .single();
    
    if (existingDeployment?.deployment_status === 'deployed' && existingDeployment?.n8n_workflow_id) {
      console.log('⚠️ Workflow already deployed, updating instead...');
      return await updateExistingWorkflow(req, res, profileId, existingDeployment.n8n_workflow_id);
    }
    
    // Step 3: Update deployment status to 'deploying'
    await supabase
      .from('business_profiles')
      .update({ 
        deployment_status: 'deploying',
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    // Step 4: Build composite template
    console.log('🧱 Building composite template...');
    const compositeTemplate = await buildCompositeTemplate(
      profile.business_types,
      { 
        profileId,
        businessName: profile.client_config?.business_name,
        emailDomain: profile.client_config?.email_domain
      }
    );
    
    console.log(`✅ Template built: ${compositeTemplate.metadata?.compositionStrategy} strategy`);
    
    // Step 5: Prepare runtime data
    const runtimeData = {
      businessName: profile.client_config?.business_name || 'Business',
      emailDomain: profile.client_config?.email_domain || 'example.com',
      timezone: profile.client_config?.timezone || 'America/New_York',
      currency: profile.client_config?.currency || 'USD',
      businessTypes: profile.business_types || [],
      primaryType: profile.primary_business_type || profile.business_types?.[0],
      labels: labels || [],
      aiConfigs: ai_configs || []
    };
    
    // Step 6: Inject runtime data into template
    console.log('🔧 Injecting runtime data...');
    const injectedWorkflow = await injectRuntimeData(compositeTemplate.template, runtimeData);
    
    // Step 7: Validate injected workflow
    const validation = validateWorkflow(injectedWorkflow);
    if (!validation.valid) {
      console.warn('⚠️ Workflow validation issues:', validation.issues);
    }
    
    // Step 8: Deploy to n8n
    console.log('🤖 Deploying to n8n...');
    const n8nClient = createN8nClient({
      baseUrl: process.env.N8N_BASE_URL,
      apiKey: process.env.N8N_API_KEY
    });
    
    const deploymentResult = await n8nClient.deployWorkflow(injectedWorkflow, {
      activate: true
    });
    
    if (!deploymentResult.success) {
      throw new Error(`N8N deployment failed: ${deploymentResult.error}`);
    }
    
    console.log(`✅ Workflow deployed successfully: ${deploymentResult.workflowId}`);
    
    // Step 9: Update business profile with deployment info
    await supabase
      .from('business_profiles')
      .update({
        n8n_workflow_id: deploymentResult.workflowId,
        deployment_status: 'deployed',
        last_deployed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    // Step 10: Log successful deployment
    await supabase
      .from('deployment_history')
      .insert({
        business_profile_id: profileId,
        n8n_workflow_id: deploymentResult.workflowId,
        deployment_type: 'create',
        status: 'success',
        workflow_json: injectedWorkflow,
        deployed_by: req.user?.id || 'system',
        deployment_duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      });
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 Deployment completed successfully in ${totalTime}ms`);
    
    // Step 11: Return success response
    res.json({
      success: true,
      workflowId: deploymentResult.workflowId,
      deploymentTime: totalTime,
      businessTypes: profile.business_types,
      compositionStrategy: compositeTemplate.metadata?.compositionStrategy,
      validation: validation,
      message: 'Multi-service automation deployed successfully'
    });
    
  } catch (error) {
    console.error(`❌ Deployment failed for profile ${profileId}:`, error);
    
    const totalTime = Date.now() - startTime;
    
    // Update deployment status to failed
    await supabase
      .from('business_profiles')
      .update({
        deployment_status: 'failed',
        deployment_error: {
          message: error.message,
          timestamp: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    // Log failed deployment
    await supabase
      .from('deployment_history')
      .insert({
        business_profile_id: profileId,
        deployment_type: 'create',
        status: 'failed',
        error_message: error.message,
        error_details: { 
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        deployed_by: req.user?.id || 'system',
        deployment_duration_ms: totalTime,
        completed_at: new Date().toISOString()
      });
    
    res.status(500).json({
      success: false,
      error: error.message,
      deploymentTime: totalTime,
      message: 'Deployment failed - check logs for details'
    });
  }
});

/**
 * Update Existing Workflow
 * PUT /api/deploy/:profileId
 */
router.put('/deploy/:profileId', async (req, res) => {
  const { profileId } = req.params;
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Updating workflow for profile: ${profileId}`);
    
    // Fetch current profile data
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_complete_business_profile', { profile_id: profileId });
    
    if (profileError || !profileData) {
      throw new Error('Business profile not found');
    }
    
    const { profile, labels, ai_configs } = profileData;
    
    // Get existing workflow ID
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('n8n_workflow_id')
      .eq('id', profileId)
      .single();
    
    if (!existingProfile?.n8n_workflow_id) {
      throw new Error('No existing workflow found to update');
    }
    
    // Build new template and inject data (same as create)
    const compositeTemplate = await buildCompositeTemplate(
      profile.business_types,
      { profileId }
    );
    
    const runtimeData = {
      businessName: profile.client_config?.business_name || 'Business',
      emailDomain: profile.client_config?.email_domain || 'example.com',
      timezone: profile.client_config?.timezone || 'America/New_York',
      currency: profile.client_config?.currency || 'USD',
      businessTypes: profile.business_types || [],
      primaryType: profile.primary_business_type || profile.business_types?.[0],
      labels: labels || [],
      aiConfigs: ai_configs || []
    };
    
    const injectedWorkflow = await injectRuntimeData(compositeTemplate.template, runtimeData);
    
    // Update existing workflow
    const n8nClient = createN8nClient({
      baseUrl: process.env.N8N_BASE_URL,
      apiKey: process.env.N8N_API_KEY
    });
    
    const updateResult = await n8nClient.redeployWorkflow(
      existingProfile.n8n_workflow_id,
      injectedWorkflow
    );
    
    if (!updateResult.success) {
      throw new Error(`Workflow update failed: ${updateResult.error}`);
    }
    
    // Log successful update
    await supabase
      .from('deployment_history')
      .insert({
        business_profile_id: profileId,
        n8n_workflow_id: existingProfile.n8n_workflow_id,
        deployment_type: 'update',
        status: 'success',
        workflow_json: injectedWorkflow,
        deployed_by: req.user?.id || 'system',
        deployment_duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      });
    
    res.json({
      success: true,
      workflowId: existingProfile.n8n_workflow_id,
      deploymentTime: Date.now() - startTime,
      message: 'Workflow updated successfully'
    });
    
  } catch (error) {
    console.error(`❌ Update failed for profile ${profileId}:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Workflow update failed'
    });
  }
});

/**
 * Get Deployment Status
 * GET /api/deploy/:profileId/status
 */
router.get('/deploy/:profileId/status', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const { data: profile, error } = await supabase
      .from('business_profiles')
      .select(`
        id,
        deployment_status,
        n8n_workflow_id,
        last_deployed_at,
        deployment_error,
        business_types,
        primary_business_type
      `)
      .eq('id', profileId)
      .single();
    
    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    // Get recent deployment history
    const { data: history } = await supabase
      .from('deployment_history')
      .select('*')
      .eq('business_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      success: true,
      profile: {
        id: profile.id,
        deploymentStatus: profile.deployment_status,
        workflowId: profile.n8n_workflow_id,
        lastDeployedAt: profile.last_deployed_at,
        businessTypes: profile.business_types,
        primaryType: profile.primary_business_type,
        error: profile.deployment_error
      },
      recentDeployments: history || []
    });
    
  } catch (error) {
    console.error('❌ Error fetching deployment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete Workflow
 * DELETE /api/deploy/:profileId
 */
router.delete('/deploy/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // Get workflow ID
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('n8n_workflow_id')
      .eq('id', profileId)
      .single();
    
    if (profile?.n8n_workflow_id) {
      // Delete from n8n
      const n8nClient = createN8nClient({
        baseUrl: process.env.N8N_BASE_URL,
        apiKey: process.env.N8N_API_KEY
      });
      
      await n8nClient.deleteWorkflow(profile.n8n_workflow_id);
    }
    
    // Update profile status
    await supabase
      .from('business_profiles')
      .update({
        n8n_workflow_id: null,
        deployment_status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Redeploy Workflow - Delete old workflow and deploy new one
 * POST /api/redeploy/:profileId
 * 
 * This endpoint handles redeployment by:
 * 1. Finding existing workflow
 * 2. Deleting old workflow
 * 3. Deploying new workflow with updated configuration
 * 4. Preserving credentials for reuse
 */
router.post('/redeploy/:profileId', async (req, res) => {
  const { profileId } = req.params;
  const startTime = Date.now();
  
  console.log(`🔄 Starting redeployment for profile: ${profileId}`);
  
  try {
    // Step 1: Fetch complete business profile from Supabase
    console.log('📋 Fetching updated business profile data...');
    const { data: profileData, error: profileError } = await supabase
      .rpc('get_complete_business_profile', { profile_id: profileId });
    
    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }
    
    if (!profileData) {
      throw new Error('Business profile not found');
    }
    
    const { profile, labels, ai_configs } = profileData;
    console.log(`✅ Updated profile loaded: ${profile.business_types?.join(', ')}`);
    
    // Step 2: Find existing workflow
    console.log('🔍 Finding existing workflow...');
    const { data: existingDeployment } = await supabase
      .from('business_profiles')
      .select('n8n_workflow_id, deployment_status')
      .eq('id', profileId)
      .single();
    
    if (!existingDeployment?.n8n_workflow_id) {
      console.log('ℹ️ No existing workflow found, proceeding with fresh deployment');
      // Redirect to regular deployment
      return res.redirect(`/api/deploy/${profileId}`);
    }
    
    console.log(`📋 Found existing workflow: ${existingDeployment.n8n_workflow_id}`);
    
    // Step 3: Update deployment status to 'redeploying'
    await supabase
      .from('business_profiles')
      .update({ 
        deployment_status: 'redeploying',
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    // Step 4: Delete old workflow
    console.log('🗑️ Deleting old workflow...');
    const n8nClient = createN8nClient();
    try {
      await n8nClient.deleteWorkflow(existingDeployment.n8n_workflow_id);
      console.log('✅ Old workflow deleted successfully');
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete old workflow, continuing with deployment:', deleteError.message);
      // Continue with deployment even if deletion fails
    }
    
    // Step 5: Build composite template with updated data
    console.log('🧱 Building updated composite template...');
    const compositeTemplate = await buildCompositeTemplate(
      profile.business_types,
      { 
        profileId,
        businessName: profile.client_config?.business_name,
        emailDomain: profile.client_config?.email_domain
      }
    );
    
    console.log(`✅ Updated template built: ${compositeTemplate.metadata?.compositionStrategy} strategy`);
    
    // Step 6: Prepare updated runtime data
    const runtimeData = {
      businessName: profile.client_config?.business_name || 'Business',
      emailDomain: profile.client_config?.email_domain || 'example.com',
      timezone: profile.client_config?.timezone || 'America/New_York',
      currency: profile.client_config?.currency || 'USD',
      businessTypes: profile.business_types || [],
      primaryType: profile.primary_business_type || profile.business_types?.[0],
      labels: labels || [],
      aiConfigs: ai_configs || []
    };
    
    // Step 7: Inject updated runtime data into template
    console.log('🔧 Injecting updated runtime data...');
    const injectedWorkflow = await injectRuntimeData(compositeTemplate.template, runtimeData);
    
    // Step 8: Validate updated workflow
    const validation = validateWorkflow(injectedWorkflow);
    if (!validation.valid) {
      console.warn('⚠️ Updated workflow validation issues:', validation.issues);
    }
    
    // Step 9: Deploy new workflow to n8n
    console.log('🚀 Deploying new workflow to n8n...');
    const deploymentResult = await n8nClient.createWorkflow(injectedWorkflow);
    
    if (!deploymentResult.success) {
      throw new Error(`Failed to deploy new workflow: ${deploymentResult.error}`);
    }
    
    const newWorkflowId = deploymentResult.workflow.id;
    console.log(`✅ New workflow deployed: ${newWorkflowId}`);
    
    // Step 10: Update database with new workflow
    await supabase
      .from('business_profiles')
      .update({ 
        n8n_workflow_id: newWorkflowId,
        deployment_status: 'deployed',
        last_deployment: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    // Step 11: Log deployment history
    await supabase
      .from('deployment_history')
      .insert({
        profile_id: profileId,
        workflow_id: newWorkflowId,
        deployment_type: 'redeployment',
        status: 'success',
        old_workflow_id: existingDeployment.n8n_workflow_id,
        template_strategy: compositeTemplate.metadata?.compositionStrategy,
        validation_score: validation.score,
        deployment_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      });
    
    const deploymentTime = Date.now() - startTime;
    console.log(`✅ Redeployment completed in ${deploymentTime}ms`);
    
    // Note: Label/folder provisioning is handled during the onboarding process
    // (Step5ProvisionLabels.jsx) before deployment, so no need to sync here
    
    res.json({
      success: true,
      message: 'Workflow redeployed successfully',
      data: {
        profileId,
        oldWorkflowId: existingDeployment.n8n_workflow_id,
        newWorkflowId,
        deploymentType: 'redeployment',
        templateStrategy: compositeTemplate.metadata?.compositionStrategy,
        validationScore: validation.score,
        deploymentTimeMs: deploymentTime,
        businessTypes: profile.business_types,
        businessName: profile.client_config?.business_name
      }
    });
    
  } catch (error) {
    console.error('❌ Redeployment failed:', error);
    
    // Update deployment status to failed
    await supabase
      .from('business_profiles')
      .update({ 
        deployment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);
    
    // Log failed deployment
    await supabase
      .from('deployment_history')
      .insert({
        profile_id: profileId,
        deployment_type: 'redeployment',
        status: 'failed',
        error_message: error.message,
        deployment_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      });
    
    res.status(500).json({
      success: false,
      error: error.message,
      deploymentType: 'redeployment'
    });
  }
});

/**
 * Validate workflow before deployment
 * @param {object} workflow - Workflow object
 * @returns {object} - Validation result
 */
function validateWorkflow(workflow) {
  const issues = [];
  
  // Check for required fields
  if (!workflow.name) {
    issues.push('Missing workflow name');
  }
  
  if (!workflow.nodes || workflow.nodes.length === 0) {
    issues.push('No nodes found in workflow');
  }
  
  if (!workflow.connections || Object.keys(workflow.connections).length === 0) {
    issues.push('No connections found in workflow');
  }
  
  // Check for required node types
  const nodeTypes = workflow.nodes?.map(node => node.type) || [];
  const hasTrigger = nodeTypes.some(type => type.includes('gmail') || type.includes('outlook'));
  const hasClassifier = nodeTypes.some(type => type.includes('langchain'));
  const hasRouter = nodeTypes.some(type => type.includes('switch'));
  
  if (!hasTrigger) issues.push('Missing email trigger node');
  if (!hasClassifier) issues.push('Missing AI classifier node');
  if (!hasRouter) issues.push('Missing router node');
  
  return {
    valid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 15))
  };
}

export default router;
