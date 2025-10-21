/**
 * VPS API Endpoint Handler for N8N Deployment with OAuth Delegation
 * This endpoint handles workflow deployment to N8N using client OAuth credentials
 * Updated to use the working FloWorx n8n service
 */

import { createClient } from '@supabase/supabase-js';
import { FloWorxN8nService } from './floworx-n8n-service.cjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// Initialize the working FloWorx n8n service with Supabase client
const floworxN8nService = new FloWorxN8nService(supabase);

// N8N Configuration (fallback)
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;

/**
 * Create OAuth credentials in N8N and initiate OAuth2 flow
 * This creates credentials and provides authorization URLs for OAuth2 flow
 */
async function createN8nCredentialsForClient(clientCredentials, userId) {
  const credentials = [];
  
  try {
    // Create Gmail OAuth2 credential and initiate flow
    if (clientCredentials.gmail) {
      const gmailCredential = {
        name: `Gmail OAuth2 - ${clientCredentials.profile?.email || 'Client'}`,
        type: 'gmailOAuth2',
        data: {
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          scope: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          accessTokenUrl: 'https://oauth2.googleapis.com/token',
          authQueryParameters: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      };

      const gmailResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gmailCredential)
      });

      if (gmailResponse.ok) {
        const gmailCred = await gmailResponse.json();
        
        // Get OAuth2 authorization URL
        const authResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials/${gmailCred.id}/oauth2/authorize`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });

        let authUrl = null;
        if (authResponse.ok) {
          const authData = await authResponse.json();
          authUrl = authData.authUrl;
        }

        credentials.push({
          type: 'gmail',
          id: gmailCred.id,
          name: gmailCred.name,
          authorizationUrl: authUrl,
          status: 'pending_authorization'
        });
        console.log(`✅ Gmail credential created: ${gmailCred.id}`);
        if (authUrl) {
          console.log(`🔗 Gmail OAuth2 authorization URL: ${authUrl}`);
        }
      } else {
        const errorText = await gmailResponse.text();
        console.error(`❌ Gmail credential creation failed: ${gmailResponse.status} ${errorText}`);
      }
    }

    // Create Outlook OAuth2 credential and initiate flow
    if (clientCredentials.outlook) {
      const outlookCredential = {
        name: `Outlook OAuth2 - ${clientCredentials.profile?.email || 'Client'}`,
        type: 'microsoftOutlookOAuth2Api',
        data: {
          clientId: process.env.OUTLOOK_CLIENT_ID,
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
          scope: 'Mail.ReadWrite Mail.Read offline_access User.Read MailboxSettings.ReadWrite',
          authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          accessTokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
          authQueryParameters: {
            response_mode: 'query'
          }
        }
      };

      const outlookResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outlookCredential)
      });

      if (outlookResponse.ok) {
        const outlookCred = await outlookResponse.json();
        
        // Get OAuth2 authorization URL
        const authResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials/${outlookCred.id}/oauth2/authorize`, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': N8N_API_KEY
          }
        });

        let authUrl = null;
        if (authResponse.ok) {
          const authData = await authResponse.json();
          authUrl = authData.authUrl;
        }

        credentials.push({
          type: 'outlook',
          id: outlookCred.id,
          name: outlookCred.name,
          authorizationUrl: authUrl,
          status: 'pending_authorization'
        });
        console.log(`✅ Outlook credential created: ${outlookCred.id}`);
        if (authUrl) {
          console.log(`🔗 Outlook OAuth2 authorization URL: ${authUrl}`);
        }
      } else {
        const errorText = await outlookResponse.text();
        console.error(`❌ Outlook credential creation failed: ${outlookResponse.status} ${errorText}`);
      }
    }

    return credentials;
  } catch (error) {
    console.error('❌ Error creating N8N credentials:', error);
    return credentials; // Return partial credentials
  }
}

/**
 * Inject client data into workflow template
 */
function injectClientDataIntoWorkflowTemplate(workflowData, clientData) {
  const template = {
    name: `FloWorx Automation - ${clientData.businessName}`,
    nodes: [
      {
        "parameters": {
          "pollTimes": {
            "item": [
              {
                "mode": "custom",
                "cronExpression": "0 */2 * * * *"
              }
            ]
          },
          "simple": false,
          "filters": {
            "q": `in:inbox -(from:(*@floworx-iq.com))`
          },
          "options": {
            "downloadAttachments": true
          }
        },
        "type": "n8n-nodes-base.gmailTrigger",
        "typeVersion": 1.2,
        "position": [-1200, 336],
        "id": "gmail-trigger",
        "name": "Gmail Trigger",
        "credentials": {
          "gmailOAuth2": {
            "id": clientData.oauthCredentials.gmail?.credentialId,
            "name": `Gmail - ${clientData.email}`
          }
        }
      },
      {
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": `
// Process email data for ${clientData.businessName}
const item = $json;

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>([\\S\\s]*?)<\\/script>/gmi, '')
    .replace(/<style[^>]*>([\\S\\s]*?)<\\/style>/gmi, '')
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<br\\s*\\/?>/gi, '\\n')
    .replace(/<\\/(div|p|h[1-6]|li|tr)>/gi, '\\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/(\\n\\s*){3,}/g, '\\n\\n')
    .trim();
}

const messageBody = htmlToText(item.html);
const messageId = item.headers?.['message-id'] || null;

return {
  json: {
    id: item.id,
    threadId: item.threadId,
    subject: item.subject,
    from: item.from?.value?.[0]?.address || null,
    fromName: item.from?.value?.[0]?.name || null,
    to: item.to?.value?.[0]?.address || null,
    toName: item.to?.value?.[0]?.name || null,
    date: item.date,
    body: messageBody,
    bodyHtml: item.html,
    labels: item.labelIds,
    sizeEstimate: item.sizeEstimate,
    messageId: messageId,
    businessName: '${clientData.businessName}',
    clientEmail: '${clientData.email}'
  }
};`
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [-976, 336],
        "id": "prepare-email-data",
        "name": "Prepare Email Data"
      },
      {
        "parameters": {
          "promptType": "define",
          "text": "=Subject: {{ $json.subject }}\\nFrom: {{ $json.from }}\\nTo: {{ $json.to }}\\nDate: {{ $now }}\\nThread ID: {{ $json.threadId }}\\nMessage ID: {{ $json.id }}\\n\\nEmail Body:\\n{{ $json.body }}\\n\\nBusiness Context:\\n- Business Name: ${clientData.businessName}\\n- Client Email: ${clientData.email}\\n- Managers: ${JSON.stringify(clientData.managers || [])}\\n- Suppliers: ${JSON.stringify(clientData.suppliers || [])}\\n- Email Labels: ${JSON.stringify(clientData.emailLabels || {})}",
          "options": {
            "systemMessage": "You are an expert email processing and routing system for \\\"${clientData.businessName}.\\\" Your task is to analyze the email and return a single JSON object with a summary, classifications, and extracted entities. Follow all rules precisely.\\n\\n### Rules:\\n1. Analyze the entire email context (sender, subject, body).\\n2. Choose **ONE** `primary_category` from the list.\\n3. If applicable, select the most appropriate `secondary_category` and `tertiary_category`.\\n4. Provide a concise `summary` of the email's core request.\\n5. Extract all available `entities`.\\n6. Set `\\\"ai_can_reply\\\": true` **only if** `primary_category` is **Sales**, **Support**, or **Urgent** AND `confidence` ≥ 0.75. In all other cases, or if the sender is internal (@floworx-iq.com), set it to `false`.\\n7. Return **only** the JSON object—no extra text.\\n\\n### Category Structure:\\n- **Sales**: New leads asking for quotes, pricing, or hot tub models.\\n- **Support**: Post-sales support from existing customers.\\n  - `secondary_category`: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]\\n- **Billing**: Financial transactions and payment inquiries.\\n  - `secondary_category`: [Invoice, Payment, Refund, Receipts]\\n- **Urgent**: Messages with keywords like 'ASAP', 'emergency', 'broken', 'not working', or 'leaking'.\\n- **Appointment**: Scheduling requests and service appointments.\\n- **Recruitment**: Job applications, resumes, employment inquiries.\\n- **Supplier**: Emails from known suppliers (Aqua Spa Supply, Strong Spas, Balboa Water Group, etc.).\\n  - `secondary_category`: [AquaSpaSupply, StrongSpas, BalboaWaterGroup, WaterwayPlastics]\\n- **GoogleReview**: Customer feedback and reviews.\\n- **Misc**: Use as a last resort for unclassifiable emails.\\n\\n### JSON Output Format:\\n```json\\n{\\n  \\\"summary\\\": \\\"A concise, one-sentence summary of the email's purpose.\\\",\\n  \\\"reasoning\\\": \\\"A brief explanation for the chosen categories.\\\",\\n  \\\"confidence\\\": 0.9,\\n  \\\"primary_category\\\": \\\"The chosen primary category\\\",\\n  \\\"secondary_category\\\": \\\"The chosen secondary category, or null if not applicable.\\\",\\n  \\\"tertiary_category\\\": \\\"The chosen tertiary category, or null if not applicable.\\\",\\n  \\\"entities\\\": {\\n    \\\"contact_name\\\": \\\"Extracted contact name, or null.\\\",\\n    \\\"email_address\\\": \\\"Extracted email address, or null.\\\",\\n    \\\"phone_number\\\": \\\"Extracted phone number, or null.\\\",\\n    \\\"service_type\\\": \\\"Extracted service type (installation, repair, maintenance), or null.\\\"\\n  },\\n  \\\"ai_can_reply\\\": true\\n}\\n```"
          }
        },
        "id": "ai-classifier",
        "name": "AI Master Classifier",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [-752, 336],
        "typeVersion": 1.8
      }
    ],
    connections: {
      "Gmail Trigger": {
        "main": [
          [
            {
              "node": "Prepare Email Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Prepare Email Data": {
        "main": [
          [
            {
              "node": "AI Master Classifier",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    active: false,
    settings: {
      executionTimeout: 600,
      saveDataErrorExecution: "all",
      saveDataSuccessExecution: "all",
      saveManualExecutions: true,
      executionOrder: "v1"
    }
  };

  return template;
}

/**
 * Create OAuth credentials in N8N from captured data
 * Note: For OAuth2 credentials, we only provide clientId and clientSecret
 * N8N will handle the OAuth2 flow and populate access tokens
 */
async function createN8nCredentialsFromCapturedData(capturedData, userId) {
  const credentials = [];
  
  try {
    // Create Gmail OAuth2 credential from captured data
    const gmailIntegration = capturedData.integrations.find(i => i.provider === 'gmail');
    if (gmailIntegration) {
      const gmailCredential = {
        name: `Gmail OAuth2 - ${capturedData.email}`,
        type: 'gmailOAuth2',
        data: {
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET
          // Note: Do NOT include accessToken, refreshToken, or expiresAt
          // N8N will populate these during the OAuth2 flow
        }
      };

      const gmailResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gmailCredential)
      });

      if (gmailResponse.ok) {
        const gmailCred = await gmailResponse.json();
        credentials.push({
          type: 'gmail',
          id: gmailCred.id,
          name: gmailCred.name
        });
        console.log(`✅ Gmail credential created from captured data: ${gmailCred.id}`);
      } else {
        const errorText = await gmailResponse.text();
        console.error(`❌ Gmail credential creation failed: ${gmailResponse.status} ${errorText}`);
      }
    }

    // Create Outlook OAuth2 credential from captured data
    const outlookIntegration = capturedData.integrations.find(i => i.provider === 'outlook');
    if (outlookIntegration) {
      const outlookCredential = {
        name: `Outlook OAuth2 - ${capturedData.email}`,
        type: 'microsoftOutlookOAuth2Api',
        data: {
          clientId: process.env.OUTLOOK_CLIENT_ID,
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET
          // Note: Do NOT include accessToken, refreshToken, or expiresAt
          // N8N will populate these during the OAuth2 flow
        }
      };

      const outlookResponse = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outlookCredential)
      });

      if (outlookResponse.ok) {
        const outlookCred = await outlookResponse.json();
        credentials.push({
          type: 'outlook',
          id: outlookCred.id,
          name: outlookCred.name
        });
        console.log(`✅ Outlook credential created from captured data: ${outlookCred.id}`);
      } else {
        const errorText = await outlookResponse.text();
        console.error(`❌ Outlook credential creation failed: ${outlookResponse.status} ${errorText}`);
      }
    }

    return credentials;
  } catch (error) {
    console.error('❌ Error creating N8N credentials from captured data:', error);
    return credentials; // Return partial credentials
  }
}

/**
 * Create workflow template from captured data
 */
async function createWorkflowTemplateFromCapturedData(capturedData) {
  const template = {
    name: `FloWorx Automation - ${capturedData.businessName}`,
    nodes: [
      {
        "parameters": {
          "pollTimes": {
            "item": [
              {
                "mode": "custom",
                "cronExpression": "0 */2 * * * *"
              }
            ]
          },
          "simple": false,
          "filters": {
            "q": `in:inbox -(from:(*@floworx-iq.com))`
          },
          "options": {
            "downloadAttachments": true
          }
        },
        "type": "n8n-nodes-base.gmailTrigger",
        "typeVersion": 1.2,
        "position": [-1200, 336],
        "id": "gmail-trigger",
        "name": "Gmail Trigger",
        "credentials": {
          "gmailOAuth2": {
            "id": capturedData.integrations.find(i => i.provider === 'gmail')?.credential_id || 'gmail_default',
            "name": `Gmail - ${capturedData.email}`
          }
        }
      },
      {
        "parameters": {
          "mode": "runOnceForEachItem",
          "jsCode": `
// Process email data for ${capturedData.businessName}
const item = $json;

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>([\\S\\s]*?)<\\/script>/gmi, '')
    .replace(/<style[^>]*>([\\S\\s]*?)<\\/style>/gmi, '')
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<br\\s*\\/?>/gi, '\\n')
    .replace(/<\\/(div|p|h[1-6]|li|tr)>/gi, '\\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/(\\n\\s*){3,}/g, '\\n\\n')
    .trim();
}

const messageBody = htmlToText(item.html);
const messageId = item.headers?.['message-id'] || null;

// Business context from captured data
const businessContext = {
  businessName: '${capturedData.businessName}',
  clientEmail: '${capturedData.email}',
  managers: ${JSON.stringify(capturedData.managers)},
  suppliers: ${JSON.stringify(capturedData.suppliers)},
  emailLabels: ${JSON.stringify(capturedData.emailLabels)},
  labelMappings: ${JSON.stringify(capturedData.labelMappings)}
};

return {
  json: {
    id: item.id,
    threadId: item.threadId,
    subject: item.subject,
    from: item.from?.value?.[0]?.address || null,
    fromName: item.from?.value?.[0]?.name || null,
    to: item.to?.value?.[0]?.address || null,
    toName: item.to?.value?.[0]?.name || null,
    date: item.date,
    body: messageBody,
    bodyHtml: item.html,
    labels: item.labelIds,
    sizeEstimate: item.sizeEstimate,
    messageId: messageId,
    businessContext: businessContext
  }
};`
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [-976, 336],
        "id": "prepare-email-data",
        "name": "Prepare Email Data"
      }
    ],
    connections: {
      "Gmail Trigger": {
        "main": [
          [
            {
              "node": "Prepare Email Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    active: false,
    settings: {
      executionTimeout: 600,
      saveDataErrorExecution: "all",
      saveDataSuccessExecution: "all",
      saveManualExecutions: true,
      executionOrder: "v1"
    }
  };

  return template;
}

/**
 * Main VPS API handler for N8N deployment with captured data
 * Updated to use the working FloWorx n8n service
 */
export async function handleVpsN8nDeployment(req, res) {
  try {
    const { userId, workflowData, capturedData, n8nTemplate, deployToN8n, useCapturedData, checkOnly, emailProvider } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId'
      });
    }

    if (checkOnly) {
      // Just check if N8N is available using our working service
      try {
        const workflows = await floworxN8nService.getWorkflows();
        
        return res.json({
          success: workflows.success,
          n8nAvailable: workflows.success,
          message: workflows.success ? 'N8N is available' : 'N8N is not available',
          workflowsCount: workflows.count
        });
      } catch (error) {
        return res.json({
          success: false,
          n8nAvailable: false,
          message: 'N8N is not available'
        });
      }
    }

    if (!deployToN8n) {
      return res.status(400).json({
        success: false,
        error: 'Missing deployToN8n flag'
      });
    }

    // Handle both old format (with capturedData) and new format (without capturedData)
    let finalCapturedData = capturedData;
    if (!capturedData) {
      // Create minimal captured data from available info
      finalCapturedData = {
        userId: userId,
        emailProvider: emailProvider || 'gmail',
        businessName: 'Business', // Default business name
        email: 'unknown@example.com', // Will be updated from database
        managers: [],
        suppliers: [],
        integrations: [{ provider: emailProvider || 'gmail' }]
      };
      
      // Try to get user data from database
      try {
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SERVICE_ROLE_KEY
        );

        const { data: profile } = await supabase
          .from('profiles')
          .select('email, client_config, managers, suppliers')
          .eq('id', userId)
          .single();

        if (profile) {
          finalCapturedData.email = profile.email || finalCapturedData.email;
          finalCapturedData.businessName = profile.client_config?.business?.name || finalCapturedData.businessName;
          finalCapturedData.managers = profile.managers || [];
          finalCapturedData.suppliers = profile.suppliers || [];
        }
      } catch (dbError) {
        console.warn('Could not fetch user data from database, using defaults:', dbError.message);
      }
    }

    console.log(`🚀 Starting VPS N8N deployment with captured data for user: ${userId}`);
    console.log(`📊 Request body keys:`, Object.keys(req.body));
    console.log(`📋 useProvidedWorkflow flag:`, req.body.useProvidedWorkflow);
    console.log(`📄 workflowData present:`, !!workflowData);
    console.log(`📏 workflowData size:`, workflowData ? JSON.stringify(workflowData).length : 0);

    // Check if frontend provided a complete workflow
    const useProvidedWorkflow = req.body.useProvidedWorkflow || false;
    const providedWorkflow = useProvidedWorkflow ? workflowData : null;
    
    console.log(`🔍 Using provided workflow:`, !!providedWorkflow);
    console.log(`🔍 workflowData type:`, typeof workflowData);
    console.log(`🔍 workflowData keys:`, workflowData ? Object.keys(workflowData) : 'null');
    
    if (providedWorkflow) {
      console.log(`📊 Provided workflow details:`, {
        name: providedWorkflow.name,
        nodes: providedWorkflow.nodes?.length || 0,
        nodesPresent: !!providedWorkflow.nodes,
        hasConnections: !!providedWorkflow.connections,
        topLevelKeys: Object.keys(providedWorkflow)
      });
    }

    // Prepare client data for the FloWorx service
    const clientData = {
      userId: userId,
      businessName: finalCapturedData.businessName || 'Unknown Business',
      email: finalCapturedData.email || 'unknown@example.com',
      provider: finalCapturedData.integrations?.[0]?.provider || finalCapturedData.emailProvider || 'gmail',
      managersCount: finalCapturedData.managers?.length || 0,
      suppliersCount: finalCapturedData.suppliers?.length || 0,
      integrationsCount: finalCapturedData.integrations?.length || 0,
      capturedData: finalCapturedData
    };

    // Use the working FloWorx n8n service to deploy
    // Pass the complete workflow JSON if provided by frontend
    const deployment = useProvidedWorkflow 
      ? await floworxN8nService.deployClientWorkflow(clientData, providedWorkflow)
      : await floworxN8nService.deployClientWorkflow(clientData);

    if (!deployment.success) {
      throw new Error(`Workflow deployment failed: ${deployment.error}`);
    }

    console.log(`✅ Workflow deployed successfully: ${deployment.workflowId}`);

    // Sanitize workflow name before storing in database
    const sanitizeWorkflowName = (name) => {
      if (!name) return 'Untitled Workflow';
      return String(name)
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove ALL control characters including \b
        .replace(/[|]/g, '') // Remove specific problematic characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim(); // Trim leading/trailing whitespace
    };

    // Store workflow in database with captured data
    const { data: workflow, error: createError } = await supabase
      .from('workflows')
      .insert({
        user_id: userId,
        client_id: userId,
        n8n_workflow_id: deployment.workflowId,
        name: sanitizeWorkflowName(deployment.workflowName),
        version: 1,
        status: 'active',
        workflow_data: workflowData,
        captured_data: capturedData,
        deployment_status: 'deployed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to store workflow in database:', createError);
    }

    console.log(`✅ VPS N8N deployment with captured data completed for user ${userId}`);

    res.json({
      success: true,
      workflowId: deployment.workflowId,
      workflowName: deployment.workflowName,
      webhookUrl: deployment.webhookUrl,
      version: 1,
      status: 'deployed',
      n8nUrl: `${N8N_BASE_URL}/workflow/${deployment.workflowId}`,
      capturedData: capturedData,
      deployedAt: deployment.deployedAt
    });

  } catch (error) {
    console.error('❌ VPS N8N deployment with captured data failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'VPS N8N deployment with captured data failed'
    });
  }
}
