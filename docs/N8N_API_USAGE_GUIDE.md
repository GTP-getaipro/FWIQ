# N8N API Usage Guide

Quick reference for using the N8N API in FloworxV2.

---

## Quick Start

```javascript
import { n8nApi, N8N_CREDENTIAL_TYPES } from '@/lib/n8nApiWrapper';
```

---

## Common Use Cases

### 1. Create Gmail OAuth2 Credential

```javascript
const credential = n8nApi.buildGmailCredential({
  name: 'My Business Gmail',
  accessToken: integration.access_token,
  refreshToken: integration.refresh_token,
  clientId: process.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET
});

const result = await n8nApi.createCredential(credential);
console.log('Credential ID:', result.id);
```

### 2. Create Outlook OAuth2 Credential

```javascript
const credential = n8nApi.buildOutlookCredential({
  name: 'My Business Outlook',
  accessToken: integration.access_token,
  refreshToken: integration.refresh_token,
  clientId: process.env.VITE_OUTLOOK_CLIENT_ID,
  clientSecret: process.env.VITE_OUTLOOK_CLIENT_SECRET
});

const result = await n8nApi.createCredential(credential);
console.log('Credential ID:', result.id);
```

### 3. Create and Activate Workflow

```javascript
// Create workflow
const workflow = {
  name: 'FloWorx Email Automation',
  active: false,
  nodes: [...],
  connections: {...},
  settings: {
    saveExecutionProgress: true,
    executionTimeout: 600,
    timezone: 'America/New_York'
  }
};

const created = await n8nApi.createWorkflow(workflow);
console.log('Workflow ID:', created.id);

// Activate workflow
const activated = await n8nApi.activateWorkflow(created.id);
console.log('Workflow Active:', activated.active);
```

### 4. Check N8N Health

```javascript
import { n8nHealthChecker } from '@/lib/n8nHealthChecker';

const health = await n8nHealthChecker.runHealthCheck();

if (health.overall === 'healthy') {
  console.log('✅ N8N is healthy');
} else if (health.overall === 'degraded') {
  console.log('⚠️ N8N is degraded but operational');
} else {
  console.log('❌ N8N is unhealthy');
  console.log('Recommendations:', health.recommendations);
}
```

### 5. Debug N8N Issues

```javascript
import N8nDebugger from '@/lib/n8nDebugger';

const debugger = new N8nDebugger();
const results = await debugger.runDebugAnalysis();

// Results include:
// - Health check
// - Connectivity tests
// - Credential creation tests
// - Actionable recommendations
```

### 6. Get Workflow Execution Status

```javascript
// Get recent executions for a workflow
const executions = await n8nApi.getExecutions({
  workflowId: 'workflow-id',
  limit: 10,
  status: 'error'  // Filter by status: success, error, running, waiting, canceled
});

console.log('Failed Executions:', executions.data);

// Retry a failed execution
const retried = await n8nApi.retryExecution(executionId);
console.log('Retry Started:', retried);
```

### 7. Manage Workflow Tags

```javascript
// Create a tag
const tag = await n8nApi.createTag('Production');
console.log('Tag ID:', tag.id);

// Add tag to workflow
await n8nApi.updateWorkflowTags('workflow-id', [
  { id: tag.id }
]);

// Get workflow tags
const tags = await n8nApi.getWorkflowTags('workflow-id');
console.log('Workflow Tags:', tags);
```

### 8. Pagination Example

```javascript
// Fetch all workflows with pagination
let allWorkflows = [];
let cursor = null;

do {
  const response = await n8nApi.getWorkflows({
    limit: 50,
    cursor: cursor
  });
  
  allWorkflows.push(...response.data);
  cursor = response.nextCursor;
  
} while (cursor);

console.log('Total Workflows:', allWorkflows.length);
```

---

## Error Handling

### Comprehensive Error Handling

```javascript
try {
  const result = await n8nApi.createWorkflow(workflowData);
  console.log('Success:', result);
  
} catch (error) {
  if (error.message.includes('401')) {
    console.error('❌ Authentication failed - check API key');
  } else if (error.message.includes('400')) {
    console.error('❌ Invalid request data');
  } else if (error.message.includes('404')) {
    console.error('❌ Resource not found');
  } else if (error.message.includes('409')) {
    console.error('❌ Conflict - resource already exists');
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
}
```

### Retry Logic

```javascript
async function retryableN8nCall(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const workflow = await retryableN8nCall(() => 
  n8nApi.createWorkflow(workflowData)
);
```

---

## Integration with FloworxV2

### In Workflow Deployer

```javascript
// src/lib/workflowDeployer.js
import { n8nApi } from './n8nApiWrapper.js';
import { n8nHealthChecker } from './n8nHealthChecker.js';

async deployWorkflow(userId, workflowData) {
  // 1. Health check
  const health = await n8nHealthChecker.runHealthCheck();
  if (health.overall === 'error') {
    return { success: false, error: 'N8N unhealthy' };
  }

  // 2. Create credentials
  const credential = await this.createCredentials(userId);

  // 3. Create workflow
  const workflow = await n8nApi.createWorkflow(workflowData);

  // 4. Activate workflow
  const activated = await n8nApi.activateWorkflow(workflow.id);

  return { success: true, workflowId: workflow.id };
}
```

### In Credential Creator

```javascript
// src/lib/n8nCredentialCreator.js
import { n8nApi } from './n8nApiWrapper.js';

async createOAuth2Credential({ provider, accessToken, refreshToken }) {
  const credentialData = provider === 'gmail'
    ? n8nApi.buildGmailCredential({ name, accessToken, refreshToken, clientId, clientSecret })
    : n8nApi.buildOutlookCredential({ name, accessToken, refreshToken, clientId, clientSecret });

  return await n8nApi.createCredential(credentialData);
}
```

---

## Environment Variables

Required environment variables for N8N API:

```env
# N8N Configuration
VITE_N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
VITE_N8N_API_KEY=your-api-key-here

# OAuth Credentials
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id
VITE_OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
```

---

## Testing

### Unit Test Example

```javascript
import { n8nApi } from '@/lib/n8nApiWrapper';

describe('N8N API Wrapper', () => {
  it('should create a workflow', async () => {
    const workflow = {
      name: 'Test Workflow',
      nodes: [],
      connections: {}
    };

    const result = await n8nApi.createWorkflow(workflow);
    
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test Workflow');
  });

  it('should handle errors gracefully', async () => {
    await expect(
      n8nApi.getWorkflow('non-existent-id')
    ).rejects.toThrow();
  });
});
```

### Integration Test Example

```javascript
// test-n8n-integration.js
import { n8nHealthChecker } from './src/lib/n8nHealthChecker.js';
import { n8nApi } from './src/lib/n8nApiWrapper.js';

async function testIntegration() {
  console.log('🧪 Testing N8N Integration...');

  // 1. Health check
  const health = await n8nHealthChecker.runHealthCheck();
  console.log('Health:', health.overall);

  // 2. Get workflows
  const workflows = await n8nApi.getWorkflows({ limit: 5 });
  console.log('Workflows:', workflows.data.length);

  // 3. Get credential schema
  const schema = await n8nApi.getCredentialSchema('gmailOAuth2');
  console.log('Gmail Schema:', schema);

  console.log('✅ Integration test complete');
}

testIntegration();
```

---

## Troubleshooting

### Issue: 405 Method Not Allowed

**Cause:** Using GET on credentials endpoint  
**Solution:** Don't list credentials, only create them

### Issue: 401 Unauthorized

**Cause:** Invalid or missing API key  
**Solution:** Check `VITE_N8N_API_KEY` environment variable

### Issue: 404 Not Found

**Cause:** Using old `/rest/` endpoints  
**Solution:** All endpoints fixed - clear browser cache

### Issue: Workflow won't activate

**Cause:** Missing credentials  
**Solution:** Create credentials before activating workflow

---

## Advanced Usage

### Custom Credential Type

```javascript
const customCredential = {
  name: 'My Custom API',
  type: 'httpBasicAuth',  // Use actual N8N credential type
  data: {
    username: 'user',
    password: 'pass'
  }
};

const result = await n8nApi.createCredential(customCredential);
```

### Workflow with Multiple Nodes

```javascript
const workflow = {
  name: 'Multi-Node Workflow',
  nodes: [
    {
      id: 'start-node',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: [250, 300],
      parameters: {}
    },
    {
      id: 'gmail-node',
      name: 'Gmail',
      type: 'n8n-nodes-base.gmail',
      position: [450, 300],
      parameters: {
        operation: 'send',
        message: {
          to: 'recipient@example.com',
          subject: 'Test',
          body: 'Hello'
        }
      },
      credentials: {
        gmailOAuth2: {
          id: 'credential-id',
          name: 'My Gmail'
        }
      }
    }
  ],
  connections: {
    'Start': {
      main: [[{ node: 'Gmail', type: 'main', index: 0 }]]
    }
  }
};

const created = await n8nApi.createWorkflow(workflow);
```

---

**Last Updated:** 2025-10-07  
**API Version:** N8N Public API v1.1.1


