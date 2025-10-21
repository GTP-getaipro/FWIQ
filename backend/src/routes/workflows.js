import express from 'express';
import Joi from 'joi';
import {  createClient  } from '@supabase/supabase-js';
import {  asyncHandler, validate, NotFoundError  } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// Validation schemas
const workflowCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  businessType: Joi.string().valid('HVAC', 'Plumbing', 'Electrical', 'Auto Repair', 'Appliance Repair', 'Pools & Spas').required(),
  description: Joi.string().max(500),
  workflowData: Joi.object().required(),
  version: Joi.number().integer().min(1).default(1),
  status: Joi.string().valid('active', 'inactive', 'deployed', 'failed').default('active')
});

const workflowUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500),
  workflowData: Joi.object(),
  status: Joi.string().valid('active', 'inactive', 'deployed', 'failed')
});

const deploymentSchema = Joi.object({
  workflowId: Joi.string().required(),
  targetEnvironment: Joi.string().valid('development', 'staging', 'production').default('production')
});

const workflowListQuerySchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'deployed', 'failed').optional(),
  businessType: Joi.string().valid('HVAC', 'Plumbing', 'Electrical', 'Auto Repair', 'Appliance Repair', 'Pools & Spas').optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * Get all workflows for user
 */
router.get('/', validate(workflowListQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { status, businessType, limit, offset } = req.query;
  const userId = req.user.id;

  try {
    let query = supabase
      .from('workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (businessType) {
      query = query.contains('workflow_data', { businessType });
    }

    const { data: workflows, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch workflows:', error);
      throw error;
    }

    res.json({
      workflows: workflows || [],
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get workflows:', error);
    throw error;
  }
}));

/**
 * Create new workflow
 */
router.post('/', validate(workflowCreateSchema), asyncHandler(async (req, res) => {
  const { name, businessType, description, workflowData, version, status } = req.body;
  const userId = req.user.id;

  try {
    // Check if workflow with same name already exists
    const { data: existing } = await supabase
      .from('workflows')
      .select('id')
      .eq('user_id', userId)
      .eq('workflow_data->name', name)
      .single();

    if (existing) {
      return res.status(409).json({
        error: 'Workflow with this name already exists',
        code: 'WORKFLOW_EXISTS'
      });
    }

    // Create workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        version,
        status,
        workflow_data: {
          name,
          businessType,
          description,
          ...workflowData
        },
        deployment_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create workflow:', error);
      throw error;
    }

    logger.info(`Workflow created: ${name} for user ${userId}`);

    res.status(201).json({
      message: 'Workflow created successfully',
      workflow
    });

  } catch (error) {
    logger.error('Failed to create workflow:', error);
    throw error;
  }
}));

/**
 * Get workflow by ID
 */
router.get('/:workflowId', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const userId = req.user.id;

  try {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (error || !workflow) {
      throw new NotFoundError('Workflow not found');
    }

    res.json({
      workflow
    });

  } catch (error) {
    logger.error('Failed to get workflow:', error);
    throw error;
  }
}));

/**
 * Update workflow
 */
router.put('/:workflowId', validate(workflowUpdateSchema), asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const updates = req.body;
  const userId = req.user.id;

  try {
    // Get current workflow
    const { data: currentWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentWorkflow) {
      throw new NotFoundError('Workflow not found');
    }

    // Merge workflow data
    const updatedWorkflowData = {
      ...currentWorkflow.workflow_data,
      ...updates.workflowData,
      name: updates.name || currentWorkflow.workflow_data.name,
      description: updates.description || currentWorkflow.workflow_data.description
    };

    // Update workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .update({
        workflow_data: updatedWorkflowData,
        status: updates.status || currentWorkflow.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update workflow:', error);
      throw error;
    }

    logger.info(`Workflow updated: ${workflowId} for user ${userId}`);

    res.json({
      message: 'Workflow updated successfully',
      workflow
    });

  } catch (error) {
    logger.error('Failed to update workflow:', error);
    throw error;
  }
}));

/**
 * Delete workflow
 */
router.delete('/:workflowId', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const userId = req.user.id;

  try {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete workflow:', error);
      throw error;
    }

    logger.info(`Workflow deleted: ${workflowId} for user ${userId}`);

    res.json({
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete workflow:', error);
    throw error;
  }
}));

/**
 * Deploy workflow to N8N (proxy endpoint to avoid CORS)
 * Note: This endpoint bypasses auth for testing - should be secured in production
 */
router.post('/deploy', asyncHandler(async (req, res) => {
  const { userId, workflowData } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing userId',
      code: 'MISSING_USER_ID'
    });
  }

  try {
    const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://n8n.floworx-iq.com';
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nBaseUrl || !n8nApiKey) {
      return res.status(500).json({
        success: false,
        error: 'N8N configuration missing'
      });
    }

    // Get user's integration to find their email credential
    const { data: integration } = await supabase
      .from('integrations')
      .select('n8n_credential_id, provider')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['outlook', 'gmail'])
      .single();

    logger.info(`Found integration for user ${userId}:`, {
      provider: integration?.provider,
      credentialId: integration?.n8n_credential_id
    });

    // Get user's complete profile data for comprehensive AI system message injection
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        client_config, 
        managers, 
        suppliers, 
        email_labels, 
        business_types,
        business_type
      `)
      .eq('id', userId)
      .single();

    // Log what data we're about to inject
    logger.info(`📊 Profile data available for injection:`, {
      hasClientConfig: !!profile?.client_config,
      hasManagers: !!profile?.managers?.length,
      hasSuppliers: !!profile?.suppliers?.length,
      hasEmailLabels: !!profile?.email_labels,
      hasBusinessTypes: !!profile?.business_types?.length,
      hasVoiceProfile: !!voiceProfile?.style_profile
    });

    // Get user's voice profile for behavior prompt injection
    const { data: voiceData } = await supabase
      .from('communication_styles')
      .select('style_profile, learning_count, last_updated')
      .eq('user_id', userId)
      .maybeSingle();

    const voiceProfile = voiceData || null;

    // Generate AI system messages for injection
    let aiSystemMessage = 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
    let behaviorReplyPrompt = 'You are drafting professional email replies. Be helpful, clear, and maintain a professional tone.';

    if (profile?.client_config) {
      const businessConfig = profile.client_config;
      const business = businessConfig.business || {};
      const rules = businessConfig.rules || {};
      const services = businessConfig.services || [];
      const businessName = business.name || 'the business';
      const emailDomain = business.emailDomain || 'yourbusiness.com';
      
      // Ensure businessTypes is always an array
      const businessTypes = profile.business_types || (profile.business_type ? [profile.business_type] : []);
      
      // Extract managers from profile
      const managers = profile.managers || [];
      const managerNames = managers.map(m => m.name).filter(Boolean);
      const managerCategories = managerNames.length > 0 ? managerNames.join(', ') + ', Unassigned' : 'Unassigned';
      
      // Extract suppliers from profile
      const suppliers = profile.suppliers || [];
      const supplierNames = suppliers.map(s => s.name).filter(Boolean);
      const supplierCategories = supplierNames.length > 0 ? supplierNames.join(', ') : 'General Suppliers';
      
      // Get phone provider info
      const phoneProvider = rules?.phoneProvider?.name || 'RingCentral';
      const phoneSenders = rules?.phoneProvider?.senders || ['service@ringcentral.com'];
      
      // Get CRM alert emails
      const crmAlertEmails = rules?.crmAlertEmails || ['alerts@servicetitan.com'];
      
      // Get urgent keywords from rules
      const urgentKeywords = rules?.urgentKeywords || [
        'urgent', 'asap', 'immediately', 'emergency', 'leaking', 'leak', 
        'water leak', 'won\'t heat', 'not heating', 'no power', 'tripping breaker', 'error code'
      ];
      
      // Build comprehensive AI system message (matches deploy-n8n function)
      aiSystemMessage = `You are an expert email processing and routing system for "${businessName}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- **Business Name:** ${businessName}
- **Business Type(s):** ${businessTypes.join(', ')}
- **Email Domain:** ${emailDomain}
- **Service Area:** ${business.serviceArea || 'Not specified'}
- **Phone Provider:** ${phoneProvider}
- **CRM System:** ${crmAlertEmails.join(', ')}

### Team Members:
${managerNames.length > 0 ? managerNames.map((name, idx) => `- ${name}: ${managers[idx]?.email || 'Email not specified'}`).join('\n') : '- No team members configured'}

### Known Suppliers:
${supplierNames.length > 0 ? supplierNames.map((name, idx) => {
  const domains = suppliers[idx]?.domains || [];
  return `- ${name}${domains.length > 0 ? ': ' + domains.join(', ') : ''}`;
}).join('\n') : '- No suppliers configured'}

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.

If the sender's email address ends with "@${emailDomain}", always set "ai_can_reply": false.

### Category Structure:

**Phone:** 
Only emails from phone/SMS/voicemail providers should be tagged PHONE.
**Configured Phone Provider:** ${phoneProvider}
**Known Sender Addresses:** ${phoneSenders.join(', ')}

**Promo:** Marketing, discounts, sales flyers.

**Socialmedia:** Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube.

**Sales:** Emails from leads or customers expressing interest in purchasing products or services.

**Recruitment:** Job applications, resumes, interviews.

**GoogleReview:** Notifications about new Google Reviews.

**Urgent:** Emergency emails requiring immediate attention.
Keywords: ${urgentKeywords.join(', ')}

**Misc:** Use as a last resort for unclassifiable emails.

**Manager:**
secondary_category: [${managerCategories}]
Route emails explicitly mentioning manager names or internal alerts requiring management review.
${managerNames.map(name => `${name} - Mail explicitly for ${name}`).join('\n')}
Unassigned - Internal alerts or platform notices requiring manager review

**FormSub:** Website form submissions and work order forms.
secondary_category: [NewSubmission, WorkOrderForms]
NewSubmission: Standard website form submissions from ${crmAlertEmails.filter(e => e.includes('servicetitan')).join(', ') || 'CRM system'}

**Suppliers:**
secondary_category: [${supplierCategories}]
${supplierNames.map(name => `${name} - Emails from this supplier`).join('\n')}

**Support:** Post-sales customer support.
secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]

**Banking:** Financial transactions, invoices, and payments.
secondary_category: [e-transfer, invoice, bank-alert, refund, receipts]

**Service:** Service requests and appointments.
secondary_category: [Repairs, Installations, Maintenance, EmergencyService]

**Warranty:** Warranty claims and parts.
secondary_category: [Claims, PendingReview, Resolved, Denied]

### Services Offered:
${services.length > 0 ? services.map(s => `- ${s.name}: ${s.description || ''}`).join('\n') : '- No specific services configured yet'}

### JSON Output Format:
Return ONLY the following JSON structure:
\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\``;

      // Build behavior reply prompt with voice training
      const behaviorTone = rules?.tone || 'Professional, friendly, and helpful';
      behaviorReplyPrompt = `You are drafting professional email replies for ${businessName}.

BASELINE TONE (from business type):
- Tone: ${behaviorTone}
- Formality: Professional
- Be clear, concise, and helpful

${voiceProfile?.style_profile && voiceProfile.learning_count > 0 ? `
🎤 LEARNED VOICE PROFILE (from ${voiceProfile.learning_count} analyzed edits):
- Empathy Level: ${voiceProfile.style_profile.voice?.empathyLevel || 0.7}/1.0
- Formality Level: ${voiceProfile.style_profile.voice?.formalityLevel || 0.8}/1.0
- Directness Level: ${voiceProfile.style_profile.voice?.directnessLevel || 0.8}/1.0
- Confidence: ${voiceProfile.style_profile.voice?.confidence || 0.5}/1.0

YOUR PREFERRED PHRASES (use these frequently):
${voiceProfile.style_profile.signaturePhrases?.slice(0, 10).map(p => `- "${p.phrase}" (confidence: ${p.confidence?.toFixed(2)}, when: ${p.context})`).join('\n') || '- No learned phrases yet'}

YOUR COMMON VOCABULARY:
${(voiceProfile.style_profile.voice?.vocabulary || []).slice(0, 15).map(word => `- ${word}`).join('\n') || '- Standard vocabulary'}

YOUR SIGNATURE PATTERN:
${voiceProfile.style_profile.voice?.signOff || `\n\nBest regards,\n${businessName} Team\n${business.phone || ''}`}

IMPORTANT: Match the style of YOUR learned voice profile. Use YOUR preferred phrases and tone.
` : ''}

BEHAVIOR GOALS:
1. Acknowledge the customer's request or concern
2. Provide helpful information or next steps
3. Maintain a ${behaviorTone} tone throughout
4. End with a clear call-to-action or next step

${rules?.aiGuardrails?.allowPricing ? 'You may discuss pricing and provide estimates when asked.' : 'Do not discuss pricing. Direct customers to request a formal quote.'}

SIGNATURE: ${voiceProfile?.style_profile?.voice?.signOff || `\n\nBest regards,\n${businessName} Team\n${business.phone || ''}`}`;
    }

    // Create workflow payload for N8N (without 'active' field - it's read-only)
    // Strip 'active' field from incoming workflowData if present
    const { active: _, ...cleanWorkflowData } = workflowData || {};
    
    // Inject credentials into workflow nodes
    if (cleanWorkflowData.nodes && Array.isArray(cleanWorkflowData.nodes)) {
      cleanWorkflowData.nodes.forEach((node) => {
        // Initialize credentials object if it doesn't exist
        if (!node.credentials) {
          node.credentials = {};
        }

        // Inject OpenAI credentials for LangChain ChatOpenAI nodes
        if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
          // Try to get the OpenAI credential ID from environment or use known ID
          const openaiCredentialId = process.env.N8N_OPENAI_CREDENTIAL_ID || 'NxYVsH1eQ1mfzoW6';
          node.credentials.openAiApi = {
            id: openaiCredentialId,
            name: 'openai-shared'
          };
          logger.info(`Injected OpenAI credential into node: ${node.name} with ID: ${openaiCredentialId}`);
        }

        // Inject email credentials (Gmail or Outlook)
        if (integration?.n8n_credential_id) {
          const provider = integration.provider;
          
          // Gmail nodes
          if (provider === 'gmail' && (node.type === 'n8n-nodes-base.gmailTrigger' || node.type === 'n8n-nodes-base.gmail')) {
            node.credentials.gmailOAuth2 = {
              id: integration.n8n_credential_id,
              name: `${provider}-credential`
            };
            logger.info(`Injected Gmail credential into node: ${node.name}`);
          }
          
          // Outlook nodes
          if (provider === 'outlook' && (node.type === 'n8n-nodes-base.microsoftOutlookTrigger' || node.type === 'n8n-nodes-base.microsoftOutlook')) {
            node.credentials.microsoftOutlookOAuth2Api = {
              id: integration.n8n_credential_id,
              name: `${provider}-credential`
            };
            logger.info(`Injected Outlook credential into node: ${node.name}`);
          }
        }

        // Inject Supabase credentials
        if (node.type === 'n8n-nodes-base.supabase' || node.credentials?.supabaseApi) {
          node.credentials.supabaseApi = {
            id: 'vKqQGjAQQ0k38UdC', // supabase-metrics credential ID
            name: 'supabase-metrics'
          };
          logger.info(`Injected Supabase credential into node: ${node.name}`);
        }

        // Inject AI system messages for ALL AI node types
        const isAIClassifierNode = node.name?.toLowerCase().includes('classifier') || 
                                  node.name?.toLowerCase().includes('ai master') ||
                                  node.name?.toLowerCase().includes('parse ai');
        
        const isAIReplyNode = node.name?.toLowerCase().includes('reply') || 
                             node.name?.toLowerCase().includes('draft') ||
                             node.name?.toLowerCase().includes('ai reply');

        // LangChain ChatOpenAI nodes
        if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
          if (isAIClassifierNode) {
            if (!node.parameters) node.parameters = {};
            if (!node.parameters.options) node.parameters.options = {};
            node.parameters.options.systemMessage = aiSystemMessage;
            logger.info(`✅ Injected AI system message into LangChain classifier node: ${node.name}`);
          } else if (isAIReplyNode) {
            if (!node.parameters) node.parameters = {};
            if (!node.parameters.options) node.parameters.options = {};
            node.parameters.options.systemMessage = behaviorReplyPrompt;
            logger.info(`✅ Injected behavior reply prompt into LangChain reply node: ${node.name}`);
          }
        }

        // Regular OpenAI nodes
        if (node.type === 'n8n-nodes-base.openAi') {
          if (isAIClassifierNode) {
            if (!node.parameters) node.parameters = {};
            if (!node.parameters.options) node.parameters.options = {};
            node.parameters.options.systemMessage = aiSystemMessage;
            logger.info(`✅ Injected AI system message into OpenAI classifier node: ${node.name}`);
          } else if (isAIReplyNode) {
            if (!node.parameters) node.parameters = {};
            if (!node.parameters.options) node.parameters.options = {};
            node.parameters.options.systemMessage = behaviorReplyPrompt;
            logger.info(`✅ Injected behavior reply prompt into OpenAI reply node: ${node.name}`);
          }
        }

        // LangChain Agent nodes (another common type)
        if (node.type === '@n8n/n8n-nodes-langchain.agent') {
          if (isAIClassifierNode) {
            if (!node.parameters) node.parameters = {};
            if (!node.parameters.options) node.parameters.options = {};
            node.parameters.options.systemMessage = aiSystemMessage;
            logger.info(`✅ Injected AI system message into LangChain agent classifier node: ${node.name}`);
          } else if (isAIReplyNode) {
            if (!node.parameters) node.parameters = {};
            if (!node.parameters.options) node.parameters.options = {};
            node.parameters.options.systemMessage = behaviorReplyPrompt;
            logger.info(`✅ Injected behavior reply prompt into LangChain agent reply node: ${node.name}`);
          }
        }

        // Debug logging for all AI-related nodes
        if (node.type?.includes('openai') || node.type?.includes('langchain') || node.type?.includes('ai')) {
          logger.info(`🔍 Found AI node: ${node.name} (type: ${node.type}) - Classifier: ${isAIClassifierNode}, Reply: ${isAIReplyNode}`);
        }
      });
    }
    
    const workflowPayload = {
      name: cleanWorkflowData.name || `FloWorx Automation - ${new Date().toISOString().split('T')[0]}`,
      nodes: cleanWorkflowData.nodes || [
        {
          id: 'webhook-trigger',
          name: 'Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [240, 300],
          parameters: {
            path: 'email-webhook',
            httpMethod: 'POST',
            responseMode: 'responseNode'
          }
        },
        {
          id: 'email-processor',
          name: 'Email Processor',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [460, 300],
          parameters: {
            functionCode: '// Process incoming email data\nreturn [{ json: { processed: true } }];'
          }
        }
      ],
      connections: cleanWorkflowData.connections || {
        'Webhook Trigger': {
          main: [[{ node: 'Email Processor', type: 'main', index: 0 }]]
        }
      },
      settings: cleanWorkflowData.settings || {
        executionOrder: 'v1',
        saveManualExecutions: true,
        callersPolicy: 'workflowsFromSameOwner',
        errorWorkflow: null
      }
      // NOTE: 'active' field is read-only and must NOT be included in request body
    };

    logger.info(`Creating workflow in N8N for user ${userId}...`);

    // Create workflow in N8N
    const createResponse = await fetch(`${n8nBaseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`N8N workflow creation failed: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
    }

    const n8nWorkflow = await createResponse.json();
    logger.info(`Workflow created in N8N: ${n8nWorkflow.id}`);

    // Activate the workflow
    const activateResponse = await fetch(`${n8nBaseUrl}/api/v1/workflows/${n8nWorkflow.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      logger.warn(`Failed to activate workflow ${n8nWorkflow.id}: ${errorText}`);
    } else {
      logger.info(`Workflow activated in N8N: ${n8nWorkflow.id}`);
    }

    // Store workflow in database
    const { data: workflow, error: createError } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        client_id: userId, // For compatibility
        n8n_workflow_id: n8nWorkflow.id,
        name: n8nWorkflow.name,
        version: 1,
        status: 'active',
        workflow_data: workflowData,
        deployment_status: 'deployed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to store workflow in database:', createError);
      // Don't fail the entire operation if database storage fails
    }

    logger.info(`Workflow deployed successfully: ${n8nWorkflow.id} for user ${userId}`);

    res.json({
      success: true,
      workflowId: n8nWorkflow.id,
      version: 1,
      status: 'deployed',
      workflow: n8nWorkflow
    });

  } catch (error) {
    logger.error('Failed to deploy workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed'
    });
  }
}));

/**
 * Deploy workflow by ID
 */
router.post('/:workflowId/deploy', validate(deploymentSchema), asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const { targetEnvironment } = req.body;
  const userId = req.user.id;

  try {
    // Get workflow
    const { data: workflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !workflow) {
      throw new NotFoundError('Workflow not found');
    }

    // Update deployment status
    await supabase
      .from('workflows')
      .update({
        deployment_status: 'deploying',
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId);

    // Simulate deployment process
    // In a real implementation, this would deploy to n8n or other workflow engine
    setTimeout(async () => {
      try {
        // Simulate successful deployment
        const n8nWorkflowId = Math.floor(Math.random() * 10000) + 1000;
        
        await supabase
          .from('workflows')
          .update({
            n8n_workflow_id: n8nWorkflowId,
            deployment_status: 'deployed',
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', workflowId);

        logger.info(`Workflow deployed successfully: ${workflowId} -> n8n:${n8nWorkflowId}`);

      } catch (deployError) {
        logger.error('Deployment failed:', deployError);
        
        await supabase
          .from('workflows')
          .update({
            deployment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', workflowId);
      }
    }, 2000); // 2 second delay to simulate deployment

    logger.info(`Workflow deployment started: ${workflowId} for user ${userId}`);

    res.json({
      message: 'Workflow deployment started',
      workflowId,
      targetEnvironment,
      status: 'deploying'
    });

  } catch (error) {
    logger.error('Failed to deploy workflow:', error);
    throw error;
  }
}));

/**
 * Get workflow deployment status
 */
router.get('/:workflowId/deployment', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const userId = req.user.id;

  try {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('deployment_status, n8n_workflow_id, status, updated_at')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (error || !workflow) {
      throw new NotFoundError('Workflow not found');
    }

    res.json({
      workflowId,
      deploymentStatus: workflow.deployment_status,
      n8nWorkflowId: workflow.n8n_workflow_id,
      status: workflow.status,
      lastUpdated: workflow.updated_at
    });

  } catch (error) {
    logger.error('Failed to get deployment status:', error);
    throw error;
  }
}));

/**
 * Get workflow statistics
 */
router.get('/:workflowId/stats', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const { timeframe = '7d' } = req.query;
  const userId = req.user.id;

  try {
    // Verify workflow ownership
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (workflowError || !workflow) {
      throw new NotFoundError('Workflow not found');
    }

    // Calculate date range
    const now = new Date();
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get workflow execution stats (simulated)
    // In a real implementation, this would query n8n execution logs
    const stats = {
      workflowId,
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      executions: {
        total: Math.floor(Math.random() * 100) + 10,
        successful: Math.floor(Math.random() * 80) + 10,
        failed: Math.floor(Math.random() * 10),
        pending: Math.floor(Math.random() * 5)
      },
      performance: {
        averageExecutionTime: Math.floor(Math.random() * 5000) + 1000, // ms
        successRate: Math.floor(Math.random() * 20) + 80, // 80-100%
        lastExecution: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    res.json(stats);

  } catch (error) {
    logger.error('Failed to get workflow stats:', error);
    throw error;
  }
}));

/**
 * Duplicate workflow
 */
router.post('/:workflowId/duplicate', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  try {
    // Get original workflow
    const { data: originalWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !originalWorkflow) {
      throw new NotFoundError('Workflow not found');
    }

    // Create duplicate
    const duplicateData = {
      ...originalWorkflow.workflow_data,
      name: name || `${originalWorkflow.workflow_data.name} (Copy)`
    };

    const { data: newWorkflow, error } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        version: 1,
        status: 'inactive',
        workflow_data: duplicateData,
        deployment_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to duplicate workflow:', error);
      throw error;
    }

    logger.info(`Workflow duplicated: ${workflowId} -> ${newWorkflow.id} for user ${userId}`);

    res.status(201).json({
      message: 'Workflow duplicated successfully',
      workflow: newWorkflow
    });

  } catch (error) {
    logger.error('Failed to duplicate workflow:', error);
    throw error;
  }
}));

export default router;
