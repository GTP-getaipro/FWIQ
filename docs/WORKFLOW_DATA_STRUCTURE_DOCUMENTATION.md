# Workflow Data Structure Documentation

## 📋 **Current Workflow Structure Analysis**

Based on the codebase analysis, the workflow data is stored in the `workflows` table with the following structure:

### **Database Table: `workflows`**

#### **Core Workflow Fields**
```sql
-- Basic workflow information
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id UUID NOT NULL
name TEXT NOT NULL
status workflow_status NOT NULL DEFAULT 'active'
n8n_workflow_id TEXT -- External n8n workflow ID
version INT NOT NULL DEFAULT 1
config JSONB NOT NULL DEFAULT '{}'::jsonb

-- Timestamps
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- Constraints
UNIQUE (client_id, name)
```

#### **Workflow Status Enumeration**
```sql
-- Workflow status enumeration
CREATE TYPE workflow_status AS ENUM (
  'active',
  'inactive', 
  'archived',
  'deploying',
  'deployed',
  'failed',
  'draft'
);
```

### **Detailed Field Structures**

#### **1. `config` JSONB Structure**
```javascript
{
  // Workflow Definition
  workflow_data: {
    name: string,           // "FloWorx Automation - Business Name v1"
    nodes: WorkflowNode[],  // Array of n8n workflow nodes
    connections: object,    // Node connections mapping
    pinData: object,        // Pinned data for nodes
    settings: {
      executionOrder: string // "v1" or "v2"
    },
    staticData: object | null,
    tags: string[],
    triggerCount: number,
    updatedAt: string,      // ISO timestamp
    versionId: string       // Version identifier
  },
  
  // Deployment Configuration
  deployment: {
    status: 'pending' | 'deploying' | 'deployed' | 'failed',
    deployed_at: string | null,
    deployment_errors: string[],
    n8n_workflow_url: string | null
  },
  
  // Business Context
  business_context: {
    business_type: string,
    business_name: string,
    template_used: string,  // Template name used
    customization_level: 'basic' | 'custom' | 'advanced'
  },
  
  // Integration Mappings
  integrations: {
    gmail: {
      credentialId: string,
      enabled: boolean
    },
    outlook: {
      credentialId: string,
      enabled: boolean
    },
    openai: {
      credentialId: string,
      enabled: boolean
    },
    postgres: {
      credentialId: string,
      enabled: boolean
    }
  },
  
  // Workflow Metadata
  metadata: {
    created_by: string,     // User ID
    template_version: string,
    last_modified_by: string,
    modification_reason: string,
    tags: string[],
    description: string
  }
}
```

#### **2. Workflow Node Structure**
```javascript
interface WorkflowNode {
  id: string;                    // Unique node ID
  name: string;                  // Node display name
  type: string;                  // Node type (e.g., "n8n-nodes-base.gmailTrigger")
  typeVersion: number;           // Node type version
  position: [number, number];    // X, Y coordinates
  parameters: object;            // Node-specific parameters
  credentials?: {                // Node credentials (if applicable)
    [credentialType]: {
      id: string;
      name: string;
    }
  };
  disabled?: boolean;            // Whether node is disabled
  notes?: string;                // Node notes
  continueOnFail?: boolean;      // Continue on failure
  alwaysOutputData?: boolean;    // Always output data
  executeOnce?: boolean;         // Execute once only
}
```

#### **3. Workflow Connection Structure**
```javascript
interface WorkflowConnection {
  [nodeId: string]: {
    main: [
      [
        {
          node: string;          // Target node ID
          type: string;          // Connection type
          index: number;         // Input index
        }
      ]
    ];
  };
}
```

### **Current Usage Patterns**

#### **Frontend Components Using Workflow Data**
- `WorkflowsPage.jsx` - Displays and manages workflows
- `WorkflowCard.jsx` - Individual workflow display
- `WorkflowDesigner.jsx` - Workflow editing interface
- `deployment.js` - Workflow deployment logic

#### **Backend Services Using Workflow Data**
- `templateService.js` - Template management and injection
- `n8nConfigMapper.js` - Maps client config to n8n workflows
- Supabase functions - Workflow deployment and management

### **Data Flow**

1. **Workflow Creation** → Creates workflow record with basic info
2. **Template Selection** → Loads appropriate n8n template based on business type
3. **Data Injection** → Injects client configuration into template
4. **Workflow Storage** → Stores complete workflow in `config` JSONB field
5. **Deployment** → Deploys workflow to n8n and updates status
6. **Version Management** → Handles workflow versioning and updates

### **Template System**

#### **Available Templates**
- `hot_tub_base_template.json` - Base template for hot tub services
- `pools_spas_generic_template.json` - Generic pools & spas template
- `hvac_template.json` - HVAC business template
- `electrician_template.json` - Electrical services template
- `plumber_template.json` - Plumbing services template
- `auto_repair_template.json` - Auto repair template
- `appliance_repair_template.json` - Appliance repair template

#### **Template Structure**
```javascript
{
  name: string,              // Template name with placeholders
  nodes: WorkflowNode[],     // Array of workflow nodes
  connections: object,       // Node connections
  pinData: object,           // Pinned data
  settings: object,          // Workflow settings
  staticData: object | null, // Static data
  tags: string[],            // Template tags
  triggerCount: number,      // Number of triggers
  updatedAt: string,         // Last updated timestamp
  versionId: string          // Template version
}
```

### **Template Injection Process**

#### **Placeholder Replacement**
```javascript
const replacements = {
  '<<<BUSINESS_NAME>>>': business.name,
  '<<<CONFIG_VERSION>>>': version,
  '<<<CLIENT_ID>>>': clientId,
  '<<<EMAIL_DOMAIN>>>': business.emailDomain,
  '<<<CURRENCY>>>': business.currency,
  '<<<CLIENT_GMAIL_CRED_ID>>>': integrations.gmail.credentialId,
  '<<<CLIENT_POSTGRES_CRED_ID>>>': integrations.postgres.credentialId,
  '<<<MANAGERS_TEXT>>>': managersText,
  '<<<SUPPLIERS>>>': JSON.stringify(suppliers),
  '<<<LABEL_MAP>>>': JSON.stringify(email_labels),
  '<<<SIGNATURE_BLOCK>>>': signatureBlock,
  '<<<SERVICE_CATALOG_TEXT>>>': serviceCatalogText,
  '<<<ESCALATION_RULE>>>': rules.escalationRules,
  '<<<REPLY_TONE>>>': rules.tone,
  '<<<ALLOW_PRICING>>>': String(rules.aiGuardrails.allowPricing)
};
```

### **Version Management**

#### **Versioning Strategy**
- **Version Number**: Incremental integer (1, 2, 3, ...)
- **Version ID**: String identifier for template versions
- **Archive Strategy**: Previous versions marked as 'archived'
- **Active Version**: Only one active version per client per workflow name

#### **Version Control Logic**
```javascript
// Get latest version
const { data: existingWorkflow } = await supabase
  .from('workflows')
  .select('version, n8n_workflow_id')
  .eq('user_id', userId)
  .eq('status', 'active')
  .order('version', { ascending: false })
  .limit(1)
  .maybeSingle();

// Calculate next version
let nextVersion = 1;
let n8nWorkflowId = `wf_${Date.now()}`;

if (existingWorkflow) {
  nextVersion = existingWorkflow.version + 1;
  n8nWorkflowId = existingWorkflow.n8n_workflow_id;
  
  // Archive previous version
  await supabase
    .from('workflows')
    .update({ status: 'archived' })
    .eq('id', existingWorkflow.id);
}
```

### **Deployment Process**

#### **Deployment States**
1. **pending** - Workflow created but not deployed
2. **deploying** - Currently being deployed to n8n
3. **deployed** - Successfully deployed and active
4. **failed** - Deployment failed

#### **Deployment Flow**
```javascript
// 1. Update status to deploying
await supabase
  .from('workflows')
  .update({ 
    status: 'deployed',
    deployment_status: 'deploying',
    updated_at: new Date().toISOString()
  })
  .eq('id', workflowId);

// 2. Deploy to n8n
const deploymentResult = await deployToN8n(workflowData);

// 3. Update with deployment result
await supabase
  .from('workflows')
  .update({
    n8n_workflow_id: deploymentResult.workflowId,
    status: deploymentResult.success ? 'deployed' : 'failed',
    deployment_status: deploymentResult.success ? 'deployed' : 'failed',
    deployment_errors: deploymentResult.errors || [],
    n8n_workflow_url: deploymentResult.url,
    deployed_at: deploymentResult.success ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  })
  .eq('id', workflowId);
```

### **Validation Rules**

#### **Required Fields**
- `name` - Workflow name is required
- `client_id` - Must reference valid user
- `config.workflow_data.nodes` - Must have at least one node
- `version` - Must be positive integer

#### **Business Rules**
- Only one active workflow per client per name
- Version numbers must be sequential
- n8n_workflow_id must be unique across all workflows
- Deployment can only happen for 'pending' or 'failed' workflows

#### **Data Constraints**
- `config` JSONB field has size limit (PostgreSQL limit)
- Node positions must be within reasonable bounds
- Credential IDs must reference valid credentials
- Template placeholders must be replaced before deployment

### **Integration Points**

#### **n8n Integration**
- Workflow deployment via n8n API
- Credential management for external services
- Workflow execution monitoring
- Error handling and retry logic

#### **Client Configuration Integration**
- Business information injection
- Service catalog integration
- Email label mapping
- Manager and supplier data

#### **Template System Integration**
- Business type-based template selection
- Custom template support
- Template version management
- Placeholder injection system

### **Performance Considerations**

- JSONB fields are indexed for common queries
- Workflow queries filtered by client_id for tenant isolation
- Version queries optimized with composite indexes
- Large workflow configs stored efficiently in JSONB

### **Security Considerations**

- Row Level Security (RLS) enabled on workflows table
- Client isolation enforced at database level
- Credential data encrypted in workflow nodes
- Workflow access controlled by user authentication

### **Migration Considerations**

The workflow structure has evolved with additions for:
- Enhanced deployment tracking
- Better error handling and reporting
- Improved template system
- Advanced configuration management
- Workflow versioning and archiving
