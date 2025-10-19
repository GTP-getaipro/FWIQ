// Gmail OAuth → n8n Credential → Workflow Connection Implementation
// This file implements the complete backend flow for connecting Gmail OAuth to n8n workflows

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class N8nCredentialManager {
  constructor() {
    this.n8nApiUrl = process.env.N8N_API_URL || 'http://localhost:5678';
    this.n8nApiKey = process.env.N8N_API_KEY;
    this.googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  }

  /**
   * @deprecated Use centralizedCredentialManager.getOrCreateGmailCredential() instead
   * Create Gmail credential in n8n from OAuth tokens
   * @param {string} businessId - Unique business identifier
   * @param {Object} oauthData - OAuth response from Google
   * @param {string} businessDomain - Business email domain
   * @returns {Object} Created credential information
   */
  async createGmailCredential(businessId, oauthData, businessDomain) {
    // Redirect to centralized credential manager
    const { createGmailCredential: centralizedCreate } = await import('./credentialServiceDeprecation.js');
    return await centralizedCreate(businessId, oauthData, businessDomain);
  }

  /**
   * Clone base workflow template for specific business
   * @param {string} businessId - Unique business identifier
   * @param {string} businessName - Business name
   * @param {string} credentialId - n8n credential ID
   * @returns {Object} Cloned workflow information
   */
  async cloneWorkflowForBusiness(businessId, businessName, credentialId) {
    try {
      // Get base workflow template
      const baseWorkflow = await this.getBaseWorkflowTemplate();
      
      const clonedWorkflow = {
        name: `${businessName} - AI Email Automation`,
        active: false, // Don't activate until credential is injected
        nodes: baseWorkflow.nodes,
        connections: baseWorkflow.connections,
        settings: baseWorkflow.settings,
        tags: [
          {
            id: `business-${businessId}`,
            name: `Business: ${businessName}`
          }
        ]
      };

      const response = await axios.post(`${this.n8nApiUrl}/api/v1/workflows`, clonedWorkflow, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const workflow = response.data;
      
      // Store workflow ID in database
      await this.storeBusinessWorkflow(businessId, workflow.id, workflow.name);
      
      console.log(`✅ Cloned workflow: ${workflow.name} (ID: ${workflow.id})`);
      return workflow;

    } catch (error) {
      console.error('❌ Failed to clone workflow:', error.response?.data || error.message);
      throw new Error(`Failed to clone workflow: ${error.message}`);
    }
  }

  /**
   * Inject Gmail credential into workflow nodes
   * @param {string} workflowId - n8n workflow ID
   * @param {string} credentialId - n8n credential ID
   * @param {string} credentialName - n8n credential name
   * @returns {Object} Updated workflow information
   */
  async injectCredentialIntoWorkflow(workflowId, credentialId, credentialName) {
    try {
      // Get current workflow
      const workflow = await this.getWorkflow(workflowId);
      
      // Update Gmail nodes to use the business-specific credential
      const updatedNodes = workflow.nodes.map(node => {
        if (node.type === 'n8n-nodes-base.gmail' || node.type === 'n8n-nodes-base.gmailTrigger') {
          return {
            ...node,
            credentials: {
              gmailOAuth2Api: {
                id: credentialId,
                name: credentialName
              }
            }
          };
        }
        return node;
      });

      // Update workflow with credential-injected nodes
      const updatedWorkflow = {
        ...workflow,
        nodes: updatedNodes
      };

      const response = await axios.patch(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}`, updatedWorkflow, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Injected credential ${credentialName} into workflow ${workflowId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to inject credential into workflow:', error.response?.data || error.message);
      throw new Error(`Failed to inject credential into workflow: ${error.message}`);
    }
  }

  /**
   * Activate workflow
   * @param {string} workflowId - n8n workflow ID
   * @returns {Object} Activation response
   */
  async activateWorkflow(workflowId) {
    try {
      const response = await axios.post(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}/activate`, {}, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`
        }
      });

      console.log(`✅ Activated workflow: ${workflowId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to activate workflow:', error.response?.data || error.message);
      throw new Error(`Failed to activate workflow: ${error.message}`);
    }
  }

  /**
   * Create Gmail labels via Gmail API
   * @param {string} accessToken - Gmail access token
   * @param {Object} businessConfig - Business configuration with labels
   * @returns {Array} Created labels information
   */
  async createGmailLabels(accessToken, businessConfig) {
    const labels = businessConfig.labels.labels;
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
        const response = await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/labels', labelPayload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const createdLabel = response.data;
        createdLabels.push(createdLabel);
        console.log(`✅ Created Gmail label: ${createdLabel.name} (ID: ${createdLabel.id})`);

      } catch (error) {
        console.error(`❌ Failed to create Gmail label ${label.name}:`, error.response?.data || error.message);
        // Continue with other labels even if one fails
      }
    }

    return createdLabels;
  }

  /**
   * Get base workflow template
   * @returns {Object} Base workflow template
   */
  async getBaseWorkflowTemplate() {
    try {
      const response = await axios.get(`${this.n8nApiUrl}/api/v1/workflows/wf-template-001`, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`
        }
      });

      return response.data;

    } catch (error) {
      console.error('❌ Failed to get base workflow template:', error.response?.data || error.message);
      throw new Error(`Failed to get base workflow template: ${error.message}`);
    }
  }

  /**
   * Get specific workflow
   * @param {string} workflowId - n8n workflow ID
   * @returns {Object} Workflow information
   */
  async getWorkflow(workflowId) {
    try {
      const response = await axios.get(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`
        }
      });

      return response.data;

    } catch (error) {
      console.error('❌ Failed to get workflow:', error.response?.data || error.message);
      throw new Error(`Failed to get workflow: ${error.message}`);
    }
  }

  /**
   * Delete n8n credential (for rollback)
   * @param {string} credentialId - n8n credential ID
   * @returns {Object} Deletion response
   */
  async deleteN8nCredential(credentialId) {
    try {
      const response = await axios.delete(`${this.n8nApiUrl}/api/v1/credentials/${credentialId}`, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`
        }
      });

      console.log(`✅ Deleted n8n credential: ${credentialId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to delete n8n credential:', error.response?.data || error.message);
      throw new Error(`Failed to delete n8n credential: ${error.message}`);
    }
  }

  /**
   * Delete n8n workflow (for rollback)
   * @param {string} workflowId - n8n workflow ID
   * @returns {Object} Deletion response
   */
  async deleteN8nWorkflow(workflowId) {
    try {
      const response = await axios.delete(`${this.n8nApiUrl}/api/v1/workflows/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${this.n8nApiKey}`
        }
      });

      console.log(`✅ Deleted n8n workflow: ${workflowId}`);
      return response.data;

    } catch (error) {
      console.error('❌ Failed to delete n8n workflow:', error.response?.data || error.message);
      throw new Error(`Failed to delete n8n workflow: ${error.message}`);
    }
  }

  /**
   * Store business credential in database
   * @param {string} businessId - Business ID
   * @param {string} credentialId - n8n credential ID
   * @param {string} credentialName - n8n credential name
   */
  async storeBusinessCredential(businessId, credentialId, credentialName) {
    // Implementation depends on your database setup
    // This is a placeholder for database storage
    console.log(`📊 Storing credential: Business ${businessId} -> Credential ${credentialId} (${credentialName})`);
    
    // Example SQL:
    // INSERT INTO business_credentials (id, business_id, credential_id, credential_name, credential_type)
    // VALUES (?, ?, ?, ?, 'gmailOAuth2Api')
  }

  /**
   * Store business workflow in database
   * @param {string} businessId - Business ID
   * @param {string} workflowId - n8n workflow ID
   * @param {string} workflowName - n8n workflow name
   */
  async storeBusinessWorkflow(businessId, workflowId, workflowName) {
    // Implementation depends on your database setup
    // This is a placeholder for database storage
    console.log(`📊 Storing workflow: Business ${businessId} -> Workflow ${workflowId} (${workflowName})`);
    
    // Example SQL:
    // INSERT INTO business_workflows (id, business_id, workflow_id, workflow_name, status)
    // VALUES (?, ?, ?, ?, 'inactive')
  }
}

/**
 * Main onboarding completion handler
 * @param {string} businessId - Unique business identifier
 * @param {Object} businessData - Business configuration data
 * @param {Object} oauthData - Gmail OAuth response data
 * @returns {Object} Completion result
 */
async function handleOnboardingCompletion(businessId, businessData, oauthData) {
  const credentialManager = new N8nCredentialManager();
  const rollbackActions = [];

  try {
    console.log(`🚀 Starting onboarding completion for business: ${businessId}`);

    // 1. Create n8n credential
    console.log('📝 Step 1: Creating n8n credential...');
    const credential = await credentialManager.createGmailCredential(
      businessId, 
      oauthData, 
      businessData.emailDomain
    );
    rollbackActions.push(() => credentialManager.deleteN8nCredential(credential.id));

    // 2. Clone workflow for business
    console.log('📝 Step 2: Cloning workflow...');
    const workflow = await credentialManager.cloneWorkflowForBusiness(
      businessId,
      businessData.businessName,
      credential.id
    );
    rollbackActions.push(() => credentialManager.deleteN8nWorkflow(workflow.id));

    // 3. Inject credential into workflow
    console.log('📝 Step 3: Injecting credential into workflow...');
    await credentialManager.injectCredentialIntoWorkflow(
      workflow.id,
      credential.id,
      credential.name
    );

    // 4. Create Gmail labels
    console.log('📝 Step 4: Creating Gmail labels...');
    const createdLabels = await credentialManager.createGmailLabels(
      oauthData.access_token, 
      businessData
    );

    // 5. Activate workflow
    console.log('📝 Step 5: Activating workflow...');
    await credentialManager.activateWorkflow(workflow.id);

    console.log('✅ Onboarding completion successful!');

    return {
      success: true,
      credentialId: credential.id,
      workflowId: workflow.id,
      createdLabels: createdLabels.length,
      message: 'Gmail integration completed successfully'
    };

  } catch (error) {
    console.error('❌ Onboarding completion failed:', error.message);
    
    // Rollback all actions
    console.log('🔄 Rolling back actions...');
    for (const rollbackAction of rollbackActions.reverse()) {
      try {
        await rollbackAction();
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
    }

    return {
      success: false,
      error: error.message,
      message: 'Onboarding completion failed and was rolled back'
    };
  }
}

/**
 * Test workflow functionality
 * @param {string} businessDomain - Business email domain
 * @param {string} accessToken - Gmail access token
 */
async function testWorkflow(businessDomain, accessToken) {
  try {
    console.log(`🧪 Testing workflow for domain: ${businessDomain}`);
    
    // Send test email to business domain
    const testEmail = {
      to: `test@${businessDomain}`,
      subject: 'Test Email for AI Classification',
      body: 'This is a test email to verify the AI classification system is working correctly.'
    };

    // Send test email via Gmail API
    const emailPayload = {
      raw: Buffer.from(
        `To: ${testEmail.to}\r\n` +
        `Subject: ${testEmail.subject}\r\n` +
        `Content-Type: text/plain; charset=UTF-8\r\n` +
        `\r\n` +
        `${testEmail.body}`
      ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    };

    const response = await axios.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', emailPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Test email sent successfully (Message ID: ${response.data.id})`);
    console.log('📊 Check n8n execution logs to verify AI classification is working');

  } catch (error) {
    console.error('❌ Test email failed:', error.response?.data || error.message);
  }
}

module.exports = {
  N8nCredentialManager,
  handleOnboardingCompletion,
  testWorkflow
};
