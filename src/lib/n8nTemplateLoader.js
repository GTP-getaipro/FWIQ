/**
 * N8N Workflow Template Loader
 * Loads production-ready workflow templates for deployment
 */

/**
 * Load N8N workflow template for the specified email provider
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<Object>} The workflow template JSON
 */
export async function loadN8NTemplate(provider = 'gmail') {
  const templatePath = provider.toLowerCase() === 'outlook' 
    ? '/templates/outlook-workflow-template.json'
    : '/templates/gmail-workflow-template.json';
  
  try {
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${provider} template: ${response.statusText}`);
    }
    
    const template = await response.json();
    
    console.log(`✅ Loaded ${provider} template:`, {
      name: template.name,
      nodeCount: template.nodes?.length || 0,
      version: template.meta?.templateVersion
    });
    
    return template;
    
  } catch (error) {
    console.error(`❌ Failed to load ${provider} workflow template:`, error);
    throw new Error(`Template loading failed: ${error.message}`);
  }
}

/**
 * Deploy workflow to N8N for a specific user
 * @param {Object} supabaseClient - Supabase client instance
 * @param {string} userId - User's Supabase ID
 * @param {string} emailProvider - 'gmail' or 'outlook'
 * @returns {Promise<Object>} Deployment result with workflowId and version
 */
export async function deployWorkflowForUser(supabaseClient, userId, emailProvider = 'gmail') {
  try {
    console.log(`🚀 Starting workflow deployment for user ${userId} (${emailProvider})...`);
    
    // Load the production template
    const template = await loadN8NTemplate(emailProvider);
    
    // Call the Edge Function with the template
    const { data, error } = await supabaseClient.functions.invoke('deploy-n8n', {
      body: {
        userId: userId,
        emailProvider: emailProvider,
        workflowData: template  // Send the production template!
      }
    });
    
    if (error) {
      throw error;
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Deployment failed');
    }
    
    console.log(`✅ Workflow deployed successfully:`, {
      workflowId: data.workflowId,
      version: data.version,
      provider: emailProvider
    });
    
    return {
      success: true,
      workflowId: data.workflowId,
      version: data.version,
      provider: emailProvider
    };
    
  } catch (error) {
    console.error(`❌ Workflow deployment failed:`, error);
    throw error;
  }
}

/**
 * Check if N8N service is available
 * @param {Object} supabaseClient - Supabase client instance
 * @returns {Promise<boolean>} True if N8N is available
 */
export async function checkN8NAvailability(supabaseClient) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('deploy-n8n', {
      body: {
        userId: 'check',
        checkOnly: true
      }
    });
    
    if (error) return false;
    
    return data?.available === true;
    
  } catch (error) {
    console.error('N8N availability check failed:', error);
    return false;
  }
}


