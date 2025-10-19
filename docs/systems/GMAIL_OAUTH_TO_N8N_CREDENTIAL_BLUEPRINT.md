# 🔐 Gmail OAuth → n8n Credential → Workflow Connection Blueprint

## 🧩 Overview: Complete Technical Flow

| Step | Action | System | Output |
|------|--------|--------|---------|
| 1️⃣ | User completes Google OAuth | Floworx Frontend | Access + Refresh tokens |
| 2️⃣ | Tokens returned to backend | Floworx Backend | Stored tokens + business context |
| 3️⃣ | Backend creates Gmail credential in n8n | n8n REST API | Encrypted n8n credential |
| 4️⃣ | Backend clones workflow + injects credential | n8n REST API | Workflow bound to credential |
| 5️⃣ | n8n workflow goes live | n8n Runtime | Active email automation |

---

## 🔐 STEP 1: Frontend Google OAuth Flow

### Required Scopes
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];
```

### OAuth Response After Approval
```json
{
  "access_token": "ya29.a0AfH6SMC...",
  "refresh_token": "1//04jv8...",
  "expires_in": 3599,
  "scope": "https://www.googleapis.com/auth/gmail.modify",
  "token_type": "Bearer",
  "email": "info@bestspa.ca"
}
```

### Send to Backend
```javascript
// Frontend sends OAuth response to backend
const response = await fetch('/api/onboarding/google/oauth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessId: 'business_123',
    oauthData: oauthResponse,
    businessDomain: 'bestspa.ca'
  })
});
```

---

## 🧰 STEP 2: Backend Create Credential in n8n

### n8n Credentials API Endpoint
```
POST /rest/credentials
Authorization: Bearer <N8N_API_KEY>
Content-Type: application/json
```

### Payload Structure
```json
{
  "name": "gmail-bestspa",
  "type": "gmailOAuth2Api",
  "data": {
    "access_token": "ya29.a0AfH6SMC...",
    "refresh_token": "1//04jv8...",
    "token_type": "Bearer",
    "expires_in": 3599,
    "clientId": "YOUR_GOOGLE_CLIENT_ID",
    "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
  },
  "nodesAccess": [
    { "nodeType": "n8n-nodes-base.gmail" },
    { "nodeType": "n8n-nodes-base.gmailTrigger" }
  ]
}
```

### Backend Implementation
```javascript
// Floworx Backend: Create n8n credential
async function createN8nCredential(businessId, oauthData, businessDomain) {
  const credentialName = `gmail-${businessDomain.replace('.', '-')}`;
  
  const credentialPayload = {
    name: credentialName,
    type: "gmailOAuth2Api",
    data: {
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      token_type: oauthData.token_type,
      expires_in: oauthData.expires_in,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    nodesAccess: [
      { nodeType: "n8n-nodes-base.gmail" },
      { nodeType: "n8n-nodes-base.gmailTrigger" }
    ]
  };

  const response = await fetch(`${process.env.N8N_API_URL}/rest/credentials`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentialPayload)
  });

  const credential = await response.json();
  
  // Store credential ID in database
  await storeBusinessCredential(businessId, credential.id, credentialName);
  
  return credential;
}
```

### Response
```json
{
  "id": "1234",
  "name": "gmail-bestspa",
  "type": "gmailOAuth2Api"
}
```

---

## 🧱 STEP 3: Clone Base Workflow Template

### Fetch Base Workflow Template
```javascript
// Get the base workflow template
async function getBaseWorkflowTemplate() {
  const response = await fetch(`${process.env.N8N_API_URL}/rest/workflows/wf-template-001`, {
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    }
  });
  
  return await response.json();
}
```

### Clone Workflow for Business
```javascript
// Clone workflow for specific business
async function cloneWorkflowForBusiness(businessId, businessName, credentialId) {
  const baseWorkflow = await getBaseWorkflowTemplate();
  
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

  const response = await fetch(`${process.env.N8N_API_URL}/rest/workflows`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clonedWorkflow)
  });

  const workflow = await response.json();
  
  // Store workflow ID in database
  await storeBusinessWorkflow(businessId, workflow.id);
  
  return workflow;
}
```

---

## 🔗 STEP 4: Inject Credential Into Workflow

### Update Workflow Nodes with Credential
```javascript
// Inject credential into workflow nodes
async function injectCredentialIntoWorkflow(workflowId, credentialId, credentialName) {
  const workflow = await getWorkflow(workflowId);
  
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

  const response = await fetch(`${process.env.N8N_API_URL}/rest/workflows/${workflowId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedWorkflow)
  });

  return await response.json();
}
```

### Specific Node Updates
```json
{
  "nodes": [
    {
      "name": "Gmail Trigger: New Email",
      "type": "n8n-nodes-base.gmailTrigger",
      "parameters": {
        "pollTimes": {
          "item": [
            { "mode": "custom", "cronExpression": "0 */2 * * * *" }
          ]
        },
        "filters": {
          "q": "in:inbox -(from:(*@bestspa.ca))"
        },
        "options": {
          "downloadAttachments": true
        }
      },
      "credentials": {
        "gmailOAuth2Api": {
          "id": "1234",
          "name": "gmail-bestspa"
        }
      }
    },
    {
      "name": "Gmail Send Reply",
      "type": "n8n-nodes-base.gmail",
      "credentials": {
        "gmailOAuth2Api": {
          "id": "1234",
          "name": "gmail-bestspa"
        }
      }
    }
  ]
}
```

---

## ⚙️ STEP 5: Activate & Test Workflow

### Activate Workflow
```javascript
// Activate the workflow
async function activateWorkflow(workflowId) {
  const response = await fetch(`${process.env.N8N_API_URL}/rest/workflows/${workflowId}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    }
  });

  return await response.json();
}
```

### Test Workflow
```javascript
// Test workflow by sending a test email
async function testWorkflow(businessDomain) {
  // Send test email to business domain
  const testEmail = {
    to: `test@${businessDomain}`,
    subject: 'Test Email for AI Classification',
    body: 'This is a test email to verify the AI classification system is working correctly.'
  };

  // The Gmail Trigger should pick this up and process it
  console.log(`Test email sent to ${businessDomain}. Check n8n execution logs.`);
}
```

---

## 💾 STEP 6: Auto-Create Gmail Labels

### Create Gmail Labels via Gmail API
```javascript
// Auto-create Gmail labels during onboarding
async function createGmailLabels(accessToken, businessConfig) {
  const labels = businessConfig.labels.labels;
  
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
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(labelPayload)
      });

      const createdLabel = await response.json();
      console.log(`Created label: ${createdLabel.name} (ID: ${createdLabel.id})`);
    } catch (error) {
      console.error(`Failed to create label ${label.name}:`, error);
    }
  }
}
```

---

## 🧠 Complete Backend Integration

### Main Onboarding Handler
```javascript
// Complete onboarding flow handler
async function handleOnboardingCompletion(businessId, businessData, oauthData) {
  try {
    // 1. Create n8n credential
    const credential = await createN8nCredential(
      businessId, 
      oauthData, 
      businessData.emailDomain
    );

    // 2. Clone workflow for business
    const workflow = await cloneWorkflowForBusiness(
      businessId,
      businessData.businessName,
      credential.id
    );

    // 3. Inject credential into workflow
    await injectCredentialIntoWorkflow(
      workflow.id,
      credential.id,
      credential.name
    );

    // 4. Create Gmail labels
    await createGmailLabels(oauthData.access_token, businessData);

    // 5. Activate workflow
    await activateWorkflow(workflow.id);

    // 6. Test workflow
    await testWorkflow(businessData.emailDomain);

    return {
      success: true,
      credentialId: credential.id,
      workflowId: workflow.id,
      message: 'Gmail integration completed successfully'
    };

  } catch (error) {
    console.error('Onboarding completion failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

## 🔧 Database Schema Updates

### Business Credentials Table
```sql
CREATE TABLE business_credentials (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  credential_id VARCHAR(36) NOT NULL,
  credential_name VARCHAR(255) NOT NULL,
  credential_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  INDEX idx_business_id (business_id),
  INDEX idx_credential_id (credential_id)
);
```

### Business Workflows Table
```sql
CREATE TABLE business_workflows (
  id VARCHAR(36) PRIMARY KEY,
  business_id VARCHAR(36) NOT NULL,
  workflow_id VARCHAR(36) NOT NULL,
  workflow_name VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive', 'error') DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  INDEX idx_business_id (business_id),
  INDEX idx_workflow_id (workflow_id)
);
```

---

## 🚨 Error Handling & Rollback

### Error Handling
```javascript
// Comprehensive error handling with rollback
async function handleOnboardingWithRollback(businessId, businessData, oauthData) {
  const rollbackActions = [];

  try {
    // 1. Create credential
    const credential = await createN8nCredential(businessId, oauthData, businessData.emailDomain);
    rollbackActions.push(() => deleteN8nCredential(credential.id));

    // 2. Clone workflow
    const workflow = await cloneWorkflowForBusiness(businessId, businessData.businessName, credential.id);
    rollbackActions.push(() => deleteN8nWorkflow(workflow.id));

    // 3. Inject credential
    await injectCredentialIntoWorkflow(workflow.id, credential.id, credential.name);

    // 4. Create labels
    await createGmailLabels(oauthData.access_token, businessData);

    // 5. Activate workflow
    await activateWorkflow(workflow.id);

    return { success: true, credentialId: credential.id, workflowId: workflow.id };

  } catch (error) {
    // Rollback all actions
    console.error('Onboarding failed, rolling back:', error);
    
    for (const rollbackAction of rollbackActions.reverse()) {
      try {
        await rollbackAction();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    return { success: false, error: error.message };
  }
}
```

---

## 🎯 Final Architecture Summary

```
[Frontend OAuth] 
   ↓ Google OAuth tokens
[Floworx Backend]
   → Stores tokens securely
   → Creates n8n credential via /rest/credentials
   → Clones base workflow via /rest/workflows
   → Injects credential_id into workflow nodes
   → Creates Gmail labels via Gmail API
   → Activates workflow
[n8n Runtime]
   → Gmail Trigger polls business inbox
   → AI Classifier processes emails
   → AI Draft Generator creates responses
   → Gmail nodes send/draft replies
   → Analytics logged to MySQL
```

This blueprint provides the **complete technical flow** from Gmail OAuth to active n8n workflow, ensuring each business gets their own isolated Gmail credential and automated email processing! 🚀
