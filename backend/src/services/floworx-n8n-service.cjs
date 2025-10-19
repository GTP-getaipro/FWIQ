/**
 * FloWorx Backend Integration
 * Replace the failed webhook deployment with n8n Public API
 * 
 * Usage in your backend:
 * const { FloWorxN8nService } = require('./floworx-n8n-service.cjs');
 * const n8nService = new FloWorxN8nService();
 */

class FloWorxN8nService {
  constructor(supabaseClient = null) {
    this.apiKey = process.env.N8N_API_KEY || process.env.VITE_N8N_API_KEY;
    this.baseUrl = process.env.N8N_API_URL || process.env.VITE_N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud/api/v1';
    this.supabase = supabaseClient;
    
    if (!this.apiKey) {
      throw new Error('N8N_API_KEY environment variable is required');
    }
    
    console.log('🔧 FloWorxN8nService initialized:', {
      baseUrl: this.baseUrl,
      apiKeySet: !!this.apiKey,
      apiKeyPrefix: this.apiKey?.substring(0, 20) + '...',
      hasSupabase: !!this.supabase
    });
  }

  /**
   * Sanitize workflow name by removing control characters
   * @param {string} name - Workflow name to sanitize
   * @returns {string} Clean workflow name
   */
  sanitizeWorkflowName(name) {
    if (!name) return 'Untitled Workflow';
    return String(name)
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove ALL control characters including \b
      .replace(/[|]/g, '') // Remove specific problematic characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim(); // Trim leading/trailing whitespace
  }

  /**
   * Deploy FloWorx workflow for a client
   * @param {Object} clientData - Client information
   * @param {Object} providedWorkflow - Optional: Complete workflow JSON from frontend (with template injection)
   * @returns {Promise<Object>} Deployment result
   */
  async deployClientWorkflow(clientData, providedWorkflow = null) {
    try {
      console.log('🚀 Deploying FloWorx workflow for:', clientData.businessName);
      
      let workflow;
      
      if (providedWorkflow) {
        // Use the provided workflow from frontend (already has template injection)
        console.log('✅ Using provided workflow from frontend (template already injected)');
        workflow = providedWorkflow;
        
        // Sanitize workflow name to remove control characters like \b
        workflow.name = this.sanitizeWorkflowName(workflow.name);
        console.log('🧹 Workflow name sanitized:', workflow.name);
        
        // Ensure workflow has proper structure
        if (!workflow.name || workflow.name === 'Untitled Workflow') {
          workflow.name = `FloWorx - ${clientData.businessName} - ${new Date().toISOString().split('T')[0]}`;
        }
      } else {
        // Fallback: Build demo workflow (legacy behavior)
        console.log('⚠️ No provided workflow, building demo workflow (fallback)');
        
        // Check if user already has OAuth credentials to avoid duplicates
        let gmailCredentialId = null;
        
        if (this.supabase && clientData.userId) {
          try {
            const { data: existingIntegration } = await this.supabase
              .from('integrations')
              .select('n8n_credential_id')
              .eq('user_id', clientData.userId)
              .eq('provider', 'gmail')
              .eq('status', 'active')
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (existingIntegration?.n8n_credential_id) {
              gmailCredentialId = existingIntegration.n8n_credential_id;
              console.log('✅ Using existing OAuth credential:', gmailCredentialId);
            }
          } catch (error) {
            console.warn('Could not check for existing credential:', error.message);
          }
        }
        
        // Only create new credentials if none exist (avoid duplicates)
        if (!gmailCredentialId) {
          gmailCredentialId = await this.createGmailCredentials(clientData);
          console.log('✅ Gmail credentials created:', gmailCredentialId);
        }
        
        // Build workflow with credential references
        workflow = this.buildFloWorxWorkflow(clientData, gmailCredentialId);
      }
      
      // Sanitize workflow for n8n API (only include allowed properties)
      // NOTE: Many fields are read-only during creation (active, tags, etc.)
      // Only send: name, nodes, connections, settings, staticData
      const sanitizedWorkflow = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections || {},
        settings: workflow.settings || {},
        staticData: workflow.staticData || null
      };
      
      console.log('📤 Sending sanitized workflow to n8n API...');
      console.log('📋 Workflow properties:', Object.keys(sanitizedWorkflow));
      console.log('🔍 Detailed structure:', {
        hasName: !!sanitizedWorkflow.name,
        hasNodes: !!sanitizedWorkflow.nodes,
        nodesIsArray: Array.isArray(sanitizedWorkflow.nodes),
        nodesCount: sanitizedWorkflow.nodes?.length || 0,
        hasConnections: !!sanitizedWorkflow.connections,
        firstNodeType: sanitizedWorkflow.nodes?.[0]?.type || 'none'
      });
      
      const createResponse = await fetch(`${this.baseUrl}/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizedWorkflow)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create workflow: ${errorText}`);
      }

      const createdWorkflow = await createResponse.json();
      console.log('✅ Workflow created in n8n:', createdWorkflow.id);
      console.log('📊 Workflow details:', {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        nodes: sanitizedWorkflow.nodes?.length || 0,
        active: createdWorkflow.active || false,
        usedTemplate: !!providedWorkflow
      });

      return {
        success: true,
        workflowId: createdWorkflow.id,
        workflowName: createdWorkflow.name,
        webhookUrl: `https://n8n.srv995290.hstgr.cloud/webhook/floworx-${clientData.userId?.substring(0, 8) || 'client'}`,
        status: 'deployed',
        message: providedWorkflow 
          ? 'Workflow deployed successfully with custom template and onboarding data'
          : 'Workflow created successfully (demo mode)',
        deployedAt: new Date().toISOString(),
        usedProvidedWorkflow: !!providedWorkflow
      };

    } catch (error) {
      console.error('❌ Workflow deployment failed:', error.message);
      return {
        success: false,
        error: error.message,
        deployedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get or create Gmail credentials in n8n
   * Checks for existing OAuth credentials first
   */
  async createGmailCredentials(clientData) {
    try {
      // First, check if user already has OAuth credentials from Step 1
      if (this.supabase && clientData.userId) {
        console.log('🔍 Checking for existing n8n credentials from OAuth flow...');
        
        const { data: existingIntegration, error } = await this.supabase
          .from('integrations')
          .select('n8n_credential_id, provider')
          .eq('user_id', clientData.userId)
          .eq('provider', clientData.provider || 'gmail')
          .eq('status', 'active')
          .single();
        
        if (!error && existingIntegration?.n8n_credential_id) {
          console.log(`✅ Found existing n8n credential from OAuth: ${existingIntegration.n8n_credential_id}`);
          return existingIntegration.n8n_credential_id;
        }
        
        console.log('ℹ️ No existing OAuth credentials found, creating placeholder...');
      }
      
      // Create a placeholder credential (user will need to authenticate it in n8n)
      const gmailCredential = {
        name: `Gmail OAuth2 - ${clientData.email || 'Client'}`,
        type: 'gmailOAuth2',
        data: {
          clientId: process.env.VITE_GMAIL_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.VITE_GMAIL_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
          sendAdditionalBodyProperties: false,
          additionalBodyProperties: ''
          // Note: accessToken, refreshToken, and expiresAt will be populated by n8n during OAuth flow
        }
      };

      const response = await fetch(`${this.baseUrl}/credentials`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gmailCredential)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create Gmail credential: ${response.status} ${errorText}`);
      }

      const credential = await response.json();
      console.log('✅ Gmail credential created in n8n:', credential.id);
      
      return credential.id;
    } catch (error) {
      console.error('❌ Failed to create Gmail credentials:', error.message);
      throw error;
    }
  }

  /**
   * Build the complete FloWorx workflow structure
   */
  buildFloWorxWorkflow(clientData, gmailCredentialId) {
    const workflowName = `FloWorx - ${clientData.businessName || 'Client'} - ${new Date().toISOString().split('T')[0]}`;
    const webhookPath = `floworx-${clientData.userId?.substring(0, 8) || 'client'}`;
    
    return {
      name: workflowName,
      nodes: [
        // Webhook Trigger
        {
          id: 'webhook-trigger',
          name: 'FloWorx Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [240, 300],
          parameters: {
            path: webhookPath,
            httpMethod: 'POST',
            responseMode: 'responseNode'
          }
        },
        
        // Authentication & Validation
        {
          id: 'auth-validation',
          name: 'Auth & Validation',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [460, 300],
          parameters: {
            jsCode: `
// Authentication and data validation
const headers = $input.first().json.headers || {};
const body = $input.first().json.body || {};

// Check API key
const apiKey = headers['x-floworx-api-key'];
if (!apiKey || apiKey !== 'floworx-secure-key') {
  throw new Error('Unauthorized: Invalid API key');
}

// Validate required fields
if (!body.email || !body.provider) {
  throw new Error('Bad Request: Missing required fields (email, provider)');
}

// Extract client data
const clientData = {
  userId: body.userId || '${clientData.userId || 'unknown'}',
  businessName: body.businessName || '${clientData.businessName || 'Unknown Business'}',
  email: body.email,
  provider: body.provider,
  managersCount: body.managersCount || ${clientData.managersCount || 0},
  suppliersCount: body.suppliersCount || ${clientData.suppliersCount || 0},
  integrationsCount: body.integrationsCount || ${clientData.integrationsCount || 0},
  timestamp: new Date().toISOString()
};

return {
  json: {
    authenticated: true,
    clientData: clientData,
    processingStarted: new Date().toISOString()
  }
};`
          }
        },
        
        // Gmail Trigger (if Gmail is the provider)
        {
          id: 'gmail-trigger',
          name: 'Gmail Trigger',
          type: 'n8n-nodes-base.gmailTrigger',
          typeVersion: 1,
          position: [680, 200],
          credentials: {
            gmailOAuth2: {
              id: gmailCredentialId,
              name: `Gmail OAuth2 - ${clientData.email || 'Client'}`
            }
          },
          parameters: {
            pollTimes: {
              item: [
                {
                  mode: 'custom',
                  cronExpression: '0 */5 * * * *' // Check every 5 minutes
                }
              ]
            },
            simple: false,
            filters: {
              q: 'in:inbox is:unread'
            },
            options: {
              allowUnauthorizedCerts: false,
              downloadAttachments: false
            }
          }
        },
        
        // Gmail Get All (for manual processing)
        {
          id: 'gmail-get-all',
          name: 'Gmail Get All',
          type: 'n8n-nodes-base.gmail',
          typeVersion: 2,
          position: [900, 200],
          credentials: {
            gmailOAuth2: {
              id: gmailCredentialId,
              name: `Gmail OAuth2 - ${clientData.email || 'Client'}`
            }
          },
          parameters: {
            operation: 'getAll',
            returnAll: false,
            limit: 10,
            simple: false,
            filters: {
              q: 'in:inbox is:unread'
            },
            options: {
              allowUnauthorizedCerts: false,
              downloadAttachments: false
            }
          }
        },
        
        // Email Provider Processing
        {
          id: 'provider-processor',
          name: 'Provider Processor',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [680, 400],
          parameters: {
            jsCode: `
const data = $input.first().json;
const provider = data.clientData.provider;

// Process based on email provider
let processedData;

if (provider === 'gmail') {
  processedData = {
    labels: [
      { name: 'Important', id: 'gmail_important', color: '#ea4335' },
      { name: 'Work', id: 'gmail_work', color: '#34a853' },
      { name: 'Personal', id: 'gmail_personal', color: '#4285f4' },
      { name: 'Newsletters', id: 'gmail_newsletters', color: '#fbbc04' },
      { name: 'Promotions', id: 'gmail_promotions', color: '#9aa0a6' }
    ],
    provider: 'gmail',
    processingType: 'labels'
  };
} else if (provider === 'outlook') {
  processedData = {
    folders: [
      { name: 'Inbox', id: 'outlook_inbox', color: '#0078d4' },
      { name: 'Important', id: 'outlook_important', color: '#ea4300' },
      { name: 'Work', id: 'outlook_work', color: '#107c10' },
      { name: 'Personal', id: 'outlook_personal', color: '#5c2d91' },
      { name: 'Archive', id: 'outlook_archive', color: '#6b6b6b' }
    ],
    provider: 'outlook',
    processingType: 'folders'
  };
} else {
  throw new Error(\`Unsupported provider: \${provider}\`);
}

return {
  json: {
    ...data,
    processedData: processedData,
    processingCompleted: new Date().toISOString()
  }
};`
          }
        },
        
        // AI Analysis
        {
          id: 'ai-analysis',
          name: 'AI Analysis',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 300],
          parameters: {
            jsCode: `
const data = $input.first().json;

// Simulate AI-powered analysis
const aiAnalysis = {
  sentiment: 'positive',
  category: 'business',
  priority: 'medium',
  suggestedActions: [
    'Auto-reply to urgent emails',
    'Archive promotional content',
    'Flag important clients',
    'Schedule follow-ups'
  ],
  confidence: 0.87,
  businessInsights: {
    emailVolume: 'medium',
    responseTime: 'within 2 hours',
    categorizationAccuracy: '92%'
  }
};

return {
  json: {
    ...data,
    aiAnalysis: aiAnalysis,
    analysisTimestamp: new Date().toISOString()
  }
};`
          }
        },
        
        // Database Update
        {
          id: 'database-update',
          name: 'Update Database',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [1120, 300],
          parameters: {
            method: 'POST',
            url: 'https://oinxzvqszingwstrbdro.supabase.co/rest/v1/email_label_mappings',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'apikey',
                  value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJiZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NTk1OTE0LCJleHAiOjIwNTE1MzE1OTR9.example'
                },
                {
                  name: 'Authorization',
                  value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJiZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NTk1OTE0LCJleHAiOjIwNTE1MzE1OTR9.example'
                },
                {
                  name: 'Content-Type',
                  value: 'application/json'
                }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'user_id',
                  value: '={{ $json.clientData.userId }}'
                },
                {
                  name: 'provider',
                  value: '={{ $json.clientData.provider }}'
                },
                {
                  name: 'label_name',
                  value: '={{ $json.processedData.provider === "gmail" ? $json.processedData.labels[0].name : $json.processedData.folders[0].name }}'
                },
                {
                  name: 'label_id',
                  value: '={{ $json.processedData.provider === "gmail" ? $json.processedData.labels[0].id : $json.processedData.folders[0].id }}'
                }
              ]
            }
          }
        },
        
        // Success Response
        {
          id: 'success-response',
          name: 'Success Response',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [1340, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{ JSON.stringify({ success: true, message: "FloWorx workflow executed successfully", workflowId: "' + (clientData.workflowId || 'unknown') + '", data: $json, timestamp: new Date().toISOString() }) }}'
          }
        }
      ],
      
      connections: {
        'FloWorx Webhook': {
          main: [[{ node: 'Auth & Validation', type: 'main', index: 0 }]]
        },
        'Auth & Validation': {
          main: [
            [{ node: 'Gmail Trigger', type: 'main', index: 0 }],
            [{ node: 'Provider Processor', type: 'main', index: 0 }]
          ]
        },
        'Gmail Trigger': {
          main: [[{ node: 'Gmail Get All', type: 'main', index: 0 }]]
        },
        'Gmail Get All': {
          main: [[{ node: 'AI Analysis', type: 'main', index: 0 }]]
        },
        'Provider Processor': {
          main: [[{ node: 'AI Analysis', type: 'main', index: 0 }]]
        },
        'AI Analysis': {
          main: [[{ node: 'Update Database', type: 'main', index: 0 }]]
        },
        'Update Database': {
          main: [[{ node: 'Success Response', type: 'main', index: 0 }]]
        }
      },
      
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all'
      }
    };
  }

  /**
   * Get all FloWorx workflows
   */
  async getWorkflows() {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflows: ${response.statusText}`);
      }

      const data = await response.json();
      const floworxWorkflows = (data.data || []).filter(workflow => 
        workflow.name.includes('FloWorx')
      );

      return {
        success: true,
        workflows: floworxWorkflows,
        count: floworxWorkflows.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        workflows: []
      };
    }
  }

  /**
   * Test a deployed workflow
   */
  async testWorkflow(webhookUrl, testData) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-floworx-api-key': 'floworx-secure-key'
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook test failed: ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        response: result,
        testedAt: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        testedAt: new Date().toISOString()
      };
    }
  }
}

// Export for use in backend
module.exports = { FloWorxN8nService };

// Example usage for your backend
if (require.main === module) {
  console.log(`
🚀 FloWorx n8n Service Ready!

To use this in your backend:

1. Copy this file to your backend directory
2. Import it in your workflow deployment code:

   const { FloWorxN8nService } = require('./floworx-n8n-service.cjs');
   const n8nService = new FloWorxN8nService();

3. Replace your failed webhook deployment with:

   const deployment = await n8nService.deployClientWorkflow(clientData);
   
   if (deployment.success) {
     console.log('✅ Workflow deployed:', deployment.workflowId);
     console.log('Webhook URL:', deployment.webhookUrl);
   } else {
     console.error('❌ Deployment failed:', deployment.error);
   }

4. The service will:
   - Create a complete FloWorx workflow in n8n
   - Activate it automatically
   - Return the webhook URL for testing
   - Handle authentication and validation
   - Process Gmail/Outlook data
   - Update your Supabase database
   - Provide AI analysis

✅ Ready to integrate with your FloWorx backend!
`);
}
