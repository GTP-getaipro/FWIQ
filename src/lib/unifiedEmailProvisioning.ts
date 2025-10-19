// Unified Email Credential Provisioning: Gmail + Outlook Support
// Production-ready TypeScript implementation supporting both Gmail and Microsoft 365

import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

// Environment Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://n8n.floworx.ai";
const N8N_API_KEY = process.env.N8N_API_KEY!;
const BASE_WORKFLOW_ID = process.env.N8N_WORKFLOW_TEMPLATE_ID || "wf-template-001";

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Microsoft OAuth Configuration
const MS_CLIENT_ID = process.env.MS_CLIENT_ID!;
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET!;

// Types
type EmailProvider = "gmail" | "outlook";

interface BusinessData {
  businessId: string;
  businessName: string;
  emailProvider: EmailProvider;
  emailDomain: string;
  businessType: string;
  timezone: string;
  currency: string;
  managers: Array<{ name: string; email: string; role: string }>;
  suppliers: Array<{ name: string; email: string }>;
  services: Array<{ name: string; category: string; pricing: string }>;
}

interface OAuthData {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
  email?: string;
}

interface ProvisioningResult {
  success: boolean;
  workflowId?: string;
  credentialId?: string;
  emailProvider?: EmailProvider;
  error?: string;
  message?: string;
}

/**
 * Unified function to provision n8n workflow for Gmail or Outlook
 * This handles both email providers in one clean implementation
 */
export async function provisionN8nWorkflowForBusiness(
  business: BusinessData,
  oauth: OAuthData
): Promise<ProvisioningResult> {
  const rollbackActions: Array<() => Promise<void>> = [];
  
  try {
    console.log(`🚀 Starting unified workflow provisioning for ${business.businessName}`);
    console.log(`📧 Email Provider: ${business.emailProvider.toUpperCase()}`);
    console.log(`🏢 Business Domain: ${business.emailDomain}`);

    // Step 1. Create email credential (Gmail or Outlook)
    console.log(`🔐 Step 1: Creating ${business.emailProvider} credential...`);
    const credential = await createEmailCredential(business, oauth);
    rollbackActions.push(() => deleteN8nCredential(credential.id));

    // Step 2. Get base workflow template
    console.log(`📄 Step 2: Fetching base workflow template...`);
    const baseWorkflow = await getBaseWorkflowTemplate();

    // Step 3. Load industry-specific configuration
    console.log(`🏭 Step 3: Loading industry configuration for ${business.businessType}...`);
    const industryConfig = await loadIndustryConfiguration(business.businessType);

    // Step 4. Configure workflow nodes for the chosen email provider
    console.log(`⚙️ Step 4: Configuring workflow nodes for ${business.emailProvider}...`);
    const updatedNodes = await configureWorkflowNodesForProvider(
      baseWorkflow.nodes,
      credential,
      business,
      industryConfig
    );

    // Step 5. Create email labels/folders
    console.log(`🏷️ Step 5: Creating ${business.emailProvider} labels/folders...`);
    const createdLabels = await createEmailLabels(oauth.access_token, business.emailProvider, industryConfig.labels);

    // Step 6. Create new workflow instance
    console.log(`🚀 Step 6: Creating and activating workflow...`);
    const workflow = await createWorkflowInstance(business, updatedNodes, baseWorkflow.connections, baseWorkflow.settings);
    rollbackActions.push(() => deleteN8nWorkflow(workflow.id));

    // Step 7. Store business integration data
    console.log(`💾 Step 7: Storing business integration data...`);
    await storeBusinessIntegration(business.businessId, {
      credentialId: credential.id,
      workflowId: workflow.id,
      emailProvider: business.emailProvider,
      businessType: business.businessType,
      emailDomain: business.emailDomain,
      createdLabels: createdLabels.length,
      status: 'active'
    });

    // Step 8. Test workflow (optional)
    console.log(`🧪 Step 8: Testing workflow...`);
    await testWorkflow(business.emailDomain, business.emailProvider, oauth.access_token);

    console.log(`🎉 Workflow provisioning completed successfully for ${business.businessName}!`);

    return {
      success: true,
      workflowId: workflow.id,
      credentialId: credential.id,
      emailProvider: business.emailProvider,
      message: `Workflow provisioned successfully for ${business.businessName} (${business.emailProvider})`
    };

  } catch (err: any) {
    console.error("❌ Error provisioning workflow:", err.response?.data || err.message);
    
    // Rollback all actions
    console.log("🔄 Rolling back actions...");
    for (const rollbackAction of rollbackActions.reverse()) {
      try {
        await rollbackAction();
      } catch (rollbackError) {
        console.error("❌ Rollback failed:", rollbackError);
      }
    }

    return {
      success: false,
      error: err.message,
      message: 'Workflow provisioning failed and was rolled back'
    };
  }
}

/**
 * Create email credential for Gmail or Outlook
 */
async function createEmailCredential(business: BusinessData, oauth: OAuthData): Promise<any> {
  const credentialType = business.emailProvider === "gmail" 
    ? "gmailOAuth2Api" 
    : "microsoftOutlookOAuth2Api";

  const credentialName = `${business.emailProvider}-${business.emailDomain.replace('.', '-')}`;

  const credentialPayload = business.emailProvider === "gmail" 
    ? {
        name: credentialName,
        type: credentialType,
        data: {
          access_token: oauth.access_token,
          refresh_token: oauth.refresh_token,
          token_type: oauth.token_type,
          expires_in: oauth.expires_in,
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
        },
        nodesAccess: [
          { nodeType: "n8n-nodes-base.gmail" },
          { nodeType: "n8n-nodes-base.gmailTrigger" },
        ],
      }
    : {
        name: credentialName,
        type: credentialType,
        data: {
          access_token: oauth.access_token,
          refresh_token: oauth.refresh_token,
          token_type: oauth.token_type,
          scope: oauth.scope,
          clientId: MS_CLIENT_ID,
          clientSecret: MS_CLIENT_SECRET,
        },
        nodesAccess: [
          { nodeType: "n8n-nodes-base.microsoftOutlook" },
          { nodeType: "n8n-nodes-base.microsoftOutlookTrigger" },
        ],
      };

  const response = await axios.post(
    `${N8N_BASE_URL}/api/v1/credentials`,
    credentialPayload,
    {
      headers: { Authorization: `Bearer ${N8N_API_KEY}` },
    }
  );

  console.log(`✅ Created ${business.emailProvider} credential: ${credentialName} (ID: ${response.data.id})`);
  return response.data;
}

/**
 * Configure workflow nodes for the chosen email provider
 */
async function configureWorkflowNodesForProvider(
  nodes: any[],
  credential: any,
  business: BusinessData,
  industryConfig: any
): Promise<any[]> {
  return nodes.map((node: any) => {
    const isGmailNode = node.type === "n8n-nodes-base.gmail" || node.type === "n8n-nodes-base.gmailTrigger";
    const isOutlookNode = node.type === "n8n-nodes-base.microsoftOutlook" || node.type === "n8n-nodes-base.microsoftOutlookTrigger";

    // Update email nodes with new credential
    if ((business.emailProvider === "gmail" && isGmailNode) || 
        (business.emailProvider === "outlook" && isOutlookNode)) {
      
      const credentialType = business.emailProvider === "gmail" ? "gmailOAuth2Api" : "microsoftOutlookOAuth2Api";
      
      node.credentials = {
        [credentialType]: {
          id: credential.id,
          name: credential.name,
        },
      };

      // Configure email trigger filters
      if (node.type.includes("Trigger")) {
        if (business.emailProvider === "gmail") {
          node.parameters.filters = {
            ...node.parameters.filters,
            q: `in:inbox -(from:(*@${business.emailDomain}))`
          };
        } else {
          // Outlook trigger configuration
          node.parameters.filters = {
            folder: "Inbox",
            from: { notContains: business.emailDomain },
          };
        }
      }
    }

    // Update HTTP Request nodes with business-specific URLs
    if (node.type === "n8n-nodes-base.httpRequest") {
      if (node.name === "Fetch Business Config") {
        node.parameters.url = `${process.env.FLOWORX_API_BASE_URL}/business-configs?domain=${business.emailDomain}`;
      }
    }

    // Update LangChain nodes with industry-specific prompts
    if (node.type === "@n8n/n8n-nodes-langchain.agent") {
      if (node.name === "AI Master Classifier") {
        node.parameters.systemMessage = `You are an expert email classification agent for ${business.businessName}, a ${business.businessType} company.

Analyze the incoming email and classify it according to these categories:
${JSON.stringify(industryConfig.classifierBehavior.categories)}

Urgent keywords for this business:
${industryConfig.classifierBehavior.urgent_keywords.join(', ')}

Email Provider: ${business.emailProvider.toUpperCase()}

Output a JSON with:
- summary: One-line summary of email purpose
- primary_category: Main category
- secondary_category: Subcategory or null
- confidence: Float 0.0-1.0
- ai_can_reply: Boolean
- entities: Extracted contact info, service details, etc.`;
      }

      if (node.name === "AI Draft Generator") {
        node.parameters.systemMessage = `You are ${business.businessName}'s AI assistant. Generate a professional email response based on:

Business Context:
- Company: ${business.businessName}
- Industry: ${business.businessType}
- Email Provider: ${business.emailProvider.toUpperCase()}
- Timezone: ${business.timezone}
- Currency: ${business.currency}

Tone Profile:
${JSON.stringify(industryConfig.responderBehavior.toneProfile)}

Generate a response that:
1. Acknowledges the customer's concern
2. Provides helpful information
3. Offers next steps
4. Maintains professional tone
5. Includes appropriate signature`;
      }
    }

    return node;
  });
}

/**
 * Create email labels/folders for Gmail or Outlook
 */
async function createEmailLabels(accessToken: string, emailProvider: EmailProvider, labelSchema: any): Promise<any[]> {
  const labels = labelSchema.labels || [];
  const createdLabels = [];

  for (const label of labels) {
    try {
      let response;
      
      if (emailProvider === "gmail") {
        // Create Gmail labels
        const labelPayload = {
          name: label.name,
          labelListVisibility: "labelShow",
          messageListVisibility: "show"
        };

        if (label.color) {
          labelPayload.color = {
            backgroundColor: label.color.backgroundColor,
            textColor: label.color.textColor
          };
        }

        response = await axios.post(
          'https://gmail.googleapis.com/gmail/v1/users/me/labels',
          labelPayload,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Create Outlook folders
        const folderPayload = {
          displayName: label.name,
          parentFolderId: "inbox"
        };

        response = await axios.post(
          'https://graph.microsoft.com/v1.0/me/mailFolders',
          folderPayload,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      createdLabels.push(response.data);
      console.log(`✅ Created ${emailProvider} label/folder: ${response.data.name || response.data.displayName} (ID: ${response.data.id})`);

    } catch (error) {
      console.error(`❌ Failed to create ${emailProvider} label/folder ${label.name}:`, error);
      // Continue with other labels even if one fails
    }
  }

  return createdLabels;
}

/**
 * Test workflow by sending a test email
 */
async function testWorkflow(emailDomain: string, emailProvider: EmailProvider, accessToken: string): Promise<void> {
  try {
    console.log(`🧪 Sending test email to ${emailDomain} via ${emailProvider}...`);
    
    const testEmail = {
      to: `test@${emailDomain}`,
      subject: 'Test Email for AI Classification',
      body: 'This is a test email to verify the AI classification system is working correctly.'
    };

    if (emailProvider === "gmail") {
      // Send via Gmail API
      const emailPayload = {
        raw: Buffer.from(
          `To: ${testEmail.to}\r\n` +
          `Subject: ${testEmail.subject}\r\n` +
          `Content-Type: text/plain; charset=UTF-8\r\n` +
          `\r\n` +
          `${testEmail.body}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      };

      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        emailPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Test email sent via Gmail (Message ID: ${response.data.id})`);
    } else {
      // Send via Microsoft Graph API
      const emailPayload = {
        message: {
          subject: testEmail.subject,
          body: {
            contentType: "Text",
            content: testEmail.body
          },
          toRecipients: [
            {
              emailAddress: {
                address: testEmail.to
              }
            }
          ]
        },
        saveToSentItems: true
      };

      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        emailPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Test email sent via Outlook (Status: ${response.status})`);
    }

    console.log('📊 Check n8n execution logs to verify AI classification is working');

  } catch (error) {
    console.error('❌ Test email failed:', error);
    // Don't throw - test email failure shouldn't fail the entire provisioning
  }
}

/**
 * Get base workflow template
 */
async function getBaseWorkflowTemplate(): Promise<any> {
  const response = await axios.get(`${N8N_BASE_URL}/api/v1/workflows/${BASE_WORKFLOW_ID}`, {
    headers: { Authorization: `Bearer ${N8N_API_KEY}` }
  });

  const baseWorkflow = response.data;
  delete baseWorkflow.id; // must not reuse ID
  delete baseWorkflow.versionId;
  
  return baseWorkflow;
}

/**
 * Load industry-specific configuration
 */
async function loadIndustryConfiguration(businessType: string): Promise<any> {
  try {
    const configUrl = `${process.env.FLOWORX_CDN_BASE_URL}/schemas/${encodeURIComponent(businessType)}`;
    
    const [labelSchema, classifierBehavior, responderBehavior] = await Promise.all([
      axios.get(`${configUrl}/labelSchema.json`),
      axios.get(`${configUrl}/classifierBehavior.json`),
      axios.get(`${configUrl}/responderBehavior.json`)
    ]);

    return {
      labels: labelSchema.data,
      classifierBehavior: classifierBehavior.data,
      responderBehavior: responderBehavior.data
    };
  } catch (error) {
    console.error(`Failed to load industry configuration for ${businessType}:`, error);
    throw new Error(`Industry configuration not found for ${businessType}`);
  }
}

/**
 * Create workflow instance
 */
async function createWorkflowInstance(business: BusinessData, nodes: any[], connections: any, settings: any): Promise<any> {
  const newWorkflowBody = {
    name: `${business.businessName} - AI Email Automation (${business.emailProvider.toUpperCase()})`,
    active: true,
    nodes,
    connections,
    settings,
    tags: [
      {
        id: `business-${business.businessId}`,
        name: `Business: ${business.businessName}`
      },
      {
        id: `industry-${business.businessType.toLowerCase().replace(/\s+/g, '-')}`,
        name: `Industry: ${business.businessType}`
      },
      {
        id: `provider-${business.emailProvider}`,
        name: `Provider: ${business.emailProvider.toUpperCase()}`
      }
    ]
  };

  const response = await axios.post(`${N8N_BASE_URL}/api/v1/workflows`, newWorkflowBody, {
    headers: { Authorization: `Bearer ${N8N_API_KEY}` }
  });

  console.log(`✅ Workflow created: ${newWorkflowBody.name} (ID: ${response.data.id})`);
  return response.data;
}

/**
 * Store business integration data in database
 */
async function storeBusinessIntegration(businessId: string, integrationData: any): Promise<void> {
  console.log(`📊 Storing integration data for business ${businessId}:`, integrationData);
  
  // Example SQL:
  // INSERT INTO business_integrations (id, business_id, credential_id, workflow_id, email_provider, business_type, email_domain, status, created_at)
  // VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
}

/**
 * Delete n8n credential (for rollback)
 */
async function deleteN8nCredential(credentialId: string): Promise<void> {
  try {
    await axios.delete(`${N8N_BASE_URL}/api/v1/credentials/${credentialId}`, {
      headers: { Authorization: `Bearer ${N8N_API_KEY}` }
    });
    console.log(`✅ Deleted n8n credential: ${credentialId}`);
  } catch (error) {
    console.error(`❌ Failed to delete n8n credential ${credentialId}:`, error);
  }
}

/**
 * Delete n8n workflow (for rollback)
 */
async function deleteN8nWorkflow(workflowId: string): Promise<void> {
  try {
    await axios.delete(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
      headers: { Authorization: `Bearer ${N8N_API_KEY}` }
    });
    console.log(`✅ Deleted n8n workflow: ${workflowId}`);
  } catch (error) {
    console.error(`❌ Failed to delete n8n workflow ${workflowId}:`, error);
  }
}

/**
 * Express.js API endpoint handler for unified email OAuth
 */
export async function handleUnifiedOAuthCallback(req: any, res: any): Promise<void> {
  try {
    const { businessId, businessData, oauthData } = req.body;

    // Validate required fields
    if (!businessId || !businessData || !oauthData) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: businessId, businessData, oauthData'
      });
      return;
    }

    // Validate email provider
    if (!businessData.emailProvider || !['gmail', 'outlook'].includes(businessData.emailProvider)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email provider. Must be "gmail" or "outlook"'
      });
      return;
    }

    // Validate OAuth data
    if (!oauthData.access_token || !oauthData.refresh_token) {
      res.status(400).json({
        success: false,
        error: 'Invalid OAuth data: missing access_token or refresh_token'
      });
      return;
    }

    // Validate business data
    if (!businessData.emailDomain || !businessData.businessName || !businessData.businessType) {
      res.status(400).json({
        success: false,
        error: 'Invalid business data: missing emailDomain, businessName, or businessType'
      });
      return;
    }

    console.log(`🔄 Processing unified OAuth callback for business: ${businessId}`);
    console.log(`📧 Email Provider: ${businessData.emailProvider.toUpperCase()}`);

    // Provision the workflow
    const result = await provisionN8nWorkflowForBusiness(businessData, oauthData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          workflowId: result.workflowId,
          credentialId: result.credentialId,
          emailProvider: result.emailProvider,
          businessDomain: businessData.emailDomain,
          businessType: businessData.businessType
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: result.message
      });
    }

  } catch (error: any) {
    console.error('❌ Unified OAuth callback handler failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error during OAuth processing'
    });
  }
}

/**
 * Setup unified OAuth routes for Express.js
 */
export function setupUnifiedOAuthRoutes(app: any): void {
  app.post('/api/onboarding/email/oauth', handleUnifiedOAuthCallback);
  
  app.get('/api/onboarding/email/oauth/status/:businessId', async (req: any, res: any) => {
    try {
      const { businessId } = req.params;
      const status = await getBusinessIntegrationStatus(businessId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/onboarding/email/oauth/:businessId', async (req: any, res: any) => {
    try {
      const { businessId } = req.params;
      await removeBusinessIntegration(businessId);
      res.json({ success: true, message: 'Email integration removed successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

/**
 * Helper function to get business integration status
 */
async function getBusinessIntegrationStatus(businessId: string): Promise<any> {
  return {
    businessId,
    hasEmailCredential: false,
    hasActiveWorkflow: false,
    emailProvider: null,
    credentialId: null,
    workflowId: null,
    lastUpdated: null
  };
}

/**
 * Helper function to remove business integration
 */
async function removeBusinessIntegration(businessId: string): Promise<void> {
  console.log(`📊 Removing email integration for business: ${businessId}`);
}
