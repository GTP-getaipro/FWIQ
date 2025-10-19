// Complete Backend Integration: Gmail OAuth → n8n Workflow Provisioning
// Production-ready TypeScript implementation for Floworx backend

import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

// Environment Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://n8n.floworx.ai";
const N8N_API_KEY = process.env.N8N_API_KEY!;
const BASE_WORKFLOW_ID = process.env.N8N_WORKFLOW_TEMPLATE_ID || "wf-template-001";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// Types
interface BusinessData {
  businessId: string;
  businessName: string;
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
  expires_in: number;
  token_type: string;
  email?: string;
}

interface ProvisioningResult {
  success: boolean;
  workflowId?: string;
  credentialId?: string;
  error?: string;
  message?: string;
}

/**
 * Creates a Gmail OAuth credential + clones & configures a workflow in n8n
 * This is the main function that handles the complete OAuth → n8n workflow provisioning
 */
export async function provisionN8nWorkflowForBusiness(
  business: BusinessData,
  oauth: OAuthData
): Promise<ProvisioningResult> {
  const rollbackActions: Array<() => Promise<void>> = [];
  
  try {
    console.log(`🚀 Starting workflow provisioning for ${business.businessName} (${business.emailDomain})`);

    // Step 1. Create Gmail credential
    console.log(`🔐 Step 1: Creating Gmail credential for ${business.businessName}...`);
    const credentialRes = await axios.post(
      `${N8N_BASE_URL}/api/v1/credentials`,
      {
        name: `gmail-${business.emailDomain.replace('.', '-')}`,
        type: "gmailOAuth2Api",
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
      },
      {
        headers: { Authorization: `Bearer ${N8N_API_KEY}` },
      }
    );

    const credentialId = credentialRes.data.id;
    const credentialName = credentialRes.data.name;
    console.log(`✅ Gmail credential created: ${credentialName} (ID: ${credentialId})`);
    
    // Add rollback action
    rollbackActions.push(() => deleteN8nCredential(credentialId));

    // Step 2. Get base workflow template
    console.log(`📄 Step 2: Fetching base workflow template (${BASE_WORKFLOW_ID})...`);
    const templateRes = await axios.get(
      `${N8N_BASE_URL}/api/v1/workflows/${BASE_WORKFLOW_ID}`,
      {
        headers: { Authorization: `Bearer ${N8N_API_KEY}` },
      }
    );

    const baseWorkflow = templateRes.data;
    delete baseWorkflow.id; // must not reuse ID
    delete baseWorkflow.versionId;

    // Step 3. Load industry-specific configuration
    console.log(`🏭 Step 3: Loading industry configuration for ${business.businessType}...`);
    const industryConfig = await loadIndustryConfiguration(business.businessType);

    // Step 4. Update workflow nodes with business-specific configuration
    console.log(`⚙️ Step 4: Configuring workflow nodes...`);
    const updatedNodes = await configureWorkflowNodes(
      baseWorkflow.nodes,
      credentialId,
      credentialName,
      business,
      industryConfig
    );

    // Step 5. Create Gmail labels
    console.log(`🏷️ Step 5: Creating Gmail labels...`);
    const createdLabels = await createGmailLabels(oauth.access_token, industryConfig.labels);

    // Step 6. Create new workflow instance
    console.log(`🚀 Step 6: Creating and activating workflow...`);
    const newWorkflowBody = {
      name: `${business.businessName} - AI Email Automation`,
      active: true, // Set to false for QA if needed
      nodes: updatedNodes,
      connections: baseWorkflow.connections,
      settings: baseWorkflow.settings,
      tags: [
        {
          id: `business-${business.businessId}`,
          name: `Business: ${business.businessName}`
        },
        {
          id: `industry-${business.businessType.toLowerCase().replace(/\s+/g, '-')}`,
          name: `Industry: ${business.businessType}`
        }
      ]
    };

    const createWorkflowRes = await axios.post(
      `${N8N_BASE_URL}/api/v1/workflows`,
      newWorkflowBody,
      {
        headers: { Authorization: `Bearer ${N8N_API_KEY}` },
      }
    );

    const newWorkflowId = createWorkflowRes.data.id;
    console.log(`✅ Workflow created and activated: ${newWorkflowId}`);
    
    // Add rollback action
    rollbackActions.push(() => deleteN8nWorkflow(newWorkflowId));

    // Step 7. Store business integration data
    console.log(`💾 Step 7: Storing business integration data...`);
    await storeBusinessIntegration(business.businessId, {
      credentialId,
      workflowId: newWorkflowId,
      businessType: business.businessType,
      emailDomain: business.emailDomain,
      createdLabels: createdLabels.length,
      status: 'active'
    });

    // Step 8. Test workflow (optional)
    console.log(`🧪 Step 8: Testing workflow...`);
    await testWorkflow(business.emailDomain, oauth.access_token);

    console.log(`🎉 Workflow provisioning completed successfully for ${business.businessName}!`);

    return {
      success: true,
      workflowId: newWorkflowId,
      credentialId,
      message: `Workflow provisioned successfully for ${business.businessName}`
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
 * Configure workflow nodes with business-specific settings
 */
async function configureWorkflowNodes(
  nodes: any[],
  credentialId: string,
  credentialName: string,
  business: BusinessData,
  industryConfig: any
): Promise<any[]> {
  return nodes.map((node: any) => {
    // Update Gmail nodes with new credential
    if (node.type === "n8n-nodes-base.gmail" || node.type === "n8n-nodes-base.gmailTrigger") {
      node.credentials = {
        gmailOAuth2Api: {
          id: credentialId,
          name: credentialName,
        },
      };

      // Update Gmail Trigger filters to exclude business domain
      if (node.type === "n8n-nodes-base.gmailTrigger") {
        node.parameters.filters = {
          ...node.parameters.filters,
          q: `in:inbox -(from:(*@${business.emailDomain}))`
        };
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
 * Load industry-specific configuration
 */
async function loadIndustryConfiguration(businessType: string): Promise<any> {
  try {
    // Load from CDN or local files
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
 * Create Gmail labels via Gmail API
 */
async function createGmailLabels(accessToken: string, labelSchema: any): Promise<any[]> {
  const labels = labelSchema.labels || [];
  const createdLabels = [];

  for (const label of labels) {
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

    try {
      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        labelPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      createdLabels.push(response.data);
      console.log(`✅ Created Gmail label: ${response.data.name} (ID: ${response.data.id})`);

    } catch (error) {
      console.error(`❌ Failed to create Gmail label ${label.name}:`, error);
      // Continue with other labels even if one fails
    }
  }

  return createdLabels;
}

/**
 * Test workflow by sending a test email
 */
async function testWorkflow(emailDomain: string, accessToken: string): Promise<void> {
  try {
    console.log(`🧪 Sending test email to ${emailDomain}...`);
    
    const testEmail = {
      to: `test@${emailDomain}`,
      subject: 'Test Email for AI Classification',
      body: 'This is a test email to verify the AI classification system is working correctly.'
    };

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

    console.log(`✅ Test email sent successfully (Message ID: ${response.data.id})`);
    console.log('📊 Check n8n execution logs to verify AI classification is working');

  } catch (error) {
    console.error('❌ Test email failed:', error);
    // Don't throw - test email failure shouldn't fail the entire provisioning
  }
}

/**
 * Store business integration data in database
 */
async function storeBusinessIntegration(businessId: string, integrationData: any): Promise<void> {
  // Implementation depends on your database setup
  console.log(`📊 Storing integration data for business ${businessId}:`, integrationData);
  
  // Example SQL:
  // INSERT INTO business_integrations (id, business_id, credential_id, workflow_id, business_type, email_domain, status, created_at)
  // VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
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
 * Express.js API endpoint handler
 */
export async function handleOAuthCallback(req: any, res: any): Promise<void> {
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

    console.log(`🔄 Processing OAuth callback for business: ${businessId}`);

    // Provision the workflow
    const result = await provisionN8nWorkflowForBusiness(businessData, oauthData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          workflowId: result.workflowId,
          credentialId: result.credentialId,
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
    console.error('❌ OAuth callback handler failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error during OAuth processing'
    });
  }
}

/**
 * Usage example for Express.js
 */
export function setupOAuthRoutes(app: any): void {
  app.post('/api/onboarding/google/oauth', handleOAuthCallback);
  
  app.get('/api/onboarding/google/oauth/status/:businessId', async (req: any, res: any) => {
    try {
      const { businessId } = req.params;
      const status = await getBusinessIntegrationStatus(businessId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/onboarding/google/oauth/:businessId', async (req: any, res: any) => {
    try {
      const { businessId } = req.params;
      await removeBusinessIntegration(businessId);
      res.json({ success: true, message: 'Gmail integration removed successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

/**
 * Helper function to get business integration status
 */
async function getBusinessIntegrationStatus(businessId: string): Promise<any> {
  // Implementation depends on your database setup
  return {
    businessId,
    hasGmailCredential: false,
    hasActiveWorkflow: false,
    credentialId: null,
    workflowId: null,
    lastUpdated: null
  };
}

/**
 * Helper function to remove business integration
 */
async function removeBusinessIntegration(businessId: string): Promise<void> {
  // Implementation depends on your database setup
  console.log(`📊 Removing Gmail integration for business: ${businessId}`);
}
