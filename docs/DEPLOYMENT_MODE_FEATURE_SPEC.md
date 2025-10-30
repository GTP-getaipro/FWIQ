# Email Hub vs Department Mode - Feature Specification

**Date:** October 30, 2025  
**Status:** Design Specification  
**Priority:** P2 - Medium (Enhancement)

---

## ✅ Current Status

**Templates Status:**
- ✅ Gmail template: 25 nodes (includes Route to Manager + Forward to Manager)
- ✅ Outlook template: 25+ nodes (includes Route to Manager + Forward to Manager)  
- ✅ IMAP template: Ready (includes Route to Manager + Forward to Manager)

**Deployed Workflows Status:**
- ⚠️ The Hot Tub Man workflow: 19 nodes (OLD VERSION)
- ❌ Missing: Route to Manager nodes
- ❌ Missing: Forward to Manager nodes

**Action Required:** Redeploy workflow to use latest template

---

## 🎯 Feature Request: Deployment Mode Selection

### **Mode 1: Email Hub (Current Implementation)**

**How it works:**
```
One Email Address: office@thehottubman.ca
      ↓
One N8N Workflow (monitors this inbox)
      ↓
AI Classifies ALL incoming emails
      ↓
Routes to appropriate manager based on:
  - Category (SALES → Hailey, SUPPORT → Jillian, etc.)
  - Name mention
  - Content analysis
      ↓
Manager receives forwarded email with AI draft
```

**Current Implementation:**
- ✅ Fully implemented in templates
- ✅ Manager routing ready
- ✅ Works with Gmail, Outlook, IMAP
- ⚠️ Needs redeployment for existing users

---

### **Mode 2: Department Mode (NEW FEATURE)**

**How it would work:**
```
Multiple Email Addresses:
  - sales@thehottubman.ca
  - support@thehottubman.ca
  - ops@thehottubman.ca
      ↓
Multiple N8N Workflows (one per department)
      ↓
Each workflow:
  - Monitors its department inbox
  - AI classifies only relevant categories
  - Routes within department only
      ↓
Department managers receive emails
```

---

## 🏗️ What Department Mode Requires

### **Summary of Requirements:**

| Component | Current (Email Hub) | Department Mode Needed |
|-----------|---------------------|------------------------|
| **Email Accounts** | 1 | 3-5 per business |
| **OAuth Tokens** | 1 | 3-5 per business |
| **N8N Workflows** | 1 | 3-5 per business |
| **Database Tables** | Current schema | + department_oauth_tokens |
| **UI Components** | Simple email connect | Department management UI |
| **Templates** | 3 templates (gmail/outlook/imap) | 6 templates (+ department versions) |
| **Deployment Logic** | Deploy 1 workflow | Deploy multiple workflows |
| **Cost** | $50/month | $150-300/month |
| **Complexity** | ✅ Low | ⚠️ Medium-High |

---

## 📋 Detailed Implementation Checklist

### **1. Database Changes** (3 days)

```sql
-- Add deployment mode
ALTER TABLE business_profiles 
ADD COLUMN deployment_mode TEXT DEFAULT 'email_hub' 
CHECK (deployment_mode IN ('email_hub', 'department'));

-- Department configuration
ALTER TABLE business_profiles
ADD COLUMN department_config JSONB;

-- Example:
-- {
--   "departments": [
--     {
--       "id": "sales",
--       "name": "Sales",
--       "email": "sales@business.com",
--       "enabled": true,
--       "managers": ["Hailey"],
--       "categories": ["SALES", "FORMSUB"]
--     }
--   ]
-- }

-- Department OAuth tokens
CREATE TABLE department_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  department_id TEXT,
  email_address TEXT,
  provider TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, department_id)
);

-- Workflow tracking per department
ALTER TABLE workflows
ADD COLUMN department_id TEXT,
ADD COLUMN deployment_mode TEXT DEFAULT 'email_hub';
```

---

### **2. UI Components** (1 week)

**New Components:**

```typescript
// src/components/DeploymentModeSelector.jsx
- Radio button: Email Hub vs Department
- Description of each mode
- Pricing implications

// src/components/DepartmentManagement.jsx
- List of departments
- Add/Edit/Delete departments
- Email configuration per department
- Manager assignment per department
- Category selection per department

// src/components/DepartmentOAuthFlow.jsx
- OAuth flow for each department email
- Status indicator (connected/disconnected)
- Test connection button

// src/components/DepartmentDashboard.jsx
- Performance metrics per department
- Comparison charts
- Department health status
```

---

### **3. Backend API Endpoints** (1 week)

```javascript
// New routes: backend/src/routes/departments.js

// Get deployment mode
GET /api/departments/:userId/mode

// Set deployment mode
PUT /api/departments/:userId/mode
Body: { deployment_mode: 'email_hub' | 'department' }

// List departments
GET /api/departments/:userId

// Add department
POST /api/departments/:userId
Body: {
  name: 'Sales',
  email: 'sales@business.com',
  managers: ['Hailey'],
  categories: ['SALES']
}

// Update department
PUT /api/departments/:userId/:deptId
Body: { enabled: true, email: 'newsales@business.com' }

// Delete department
DELETE /api/departments/:userId/:deptId

// Initiate OAuth for department
GET /api/departments/:userId/:deptId/oauth/:provider

// Deploy department workflow
POST /api/departments/:userId/:deptId/deploy

// Get department metrics
GET /api/departments/:userId/:deptId/metrics
```

---

### **4. N8N Template Variations** (1 week)

**Create department-specific templates:**

```javascript
// backend/templates/gmail-department-template.json

{
  "name": "<<<BUSINESS_NAME>>> - <<<DEPARTMENT_NAME>>> Department",
  "meta": {
    "deploymentMode": "department",
    "department": "<<<DEPARTMENT_ID>>>",
    "allowedCategories": <<<ALLOWED_CATEGORIES>>>
  },
  "nodes": [
    // Same nodes as email hub BUT:
    
    // 1. Email Trigger uses department email
    {
      "credentials": {
        "gmailOAuth2": {
          "id": "<<<DEPT_CREDENTIAL_ID>>>",
          "name": "<<<DEPARTMENT_EMAIL>>>"
        }
      }
    },
    
    // 2. AI Classifier restricted to department categories
    {
      "name": "AI Classifier",
      "systemMessage": "Only classify into: <<<ALLOWED_CATEGORIES>>>\n\nIf email is out of scope, return:\n{\n  \"primary_category\": \"OUT_OF_SCOPE\",\n  \"suggested_department\": \"sales|support|operations\"\n}"
    },
    
    // 3. Out-of-scope handler (NEW)
    {
      "name": "Check If Out of Scope",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": [{
          "leftValue": "={{ $json.primary_category }}",
          "rightValue": "OUT_OF_SCOPE"
        }]
      }
    },
    
    // 4. Route to Manager (department-scoped)
    {
      "name": "Route to Manager",
      "jsCode": "// Only managers in THIS department\nconst departmentManagers = <<<DEPARTMENT_MANAGERS>>>;\n// Route within department only"
    },
    
    // 5. Forward to other department (NEW)
    {
      "name": "Forward to Correct Department",
      "parameters": {
        "sendTo": "={{ $json.suggested_department_email }}",
        "subject": "FWD: Email misrouted to <<<DEPARTMENT_NAME>>>"
      }
    }
  ]
}
```

---

### **5. Deploy-N8N Edge Function Updates** (1 week)

```typescript
// supabase/functions/deploy-n8n/index.ts

export async function deployWorkflow(userId: string, provider: string, options?: any) {
  const profile = await getBusinessProfile(userId);
  const deploymentMode = profile.deployment_mode || 'email_hub';
  
  console.log(`📊 Deployment Mode: ${deploymentMode}`);
  
  if (deploymentMode === 'email_hub') {
    // CURRENT: Deploy single workflow for main email
    return await deployEmailHubWorkflow(userId, provider, profile);
    
  } else if (deploymentMode === 'department') {
    // NEW: Deploy multiple workflows (one per department)
    const departments = profile.department_config?.departments || [];
    const deployedWorkflows = [];
    
    for (const dept of departments) {
      if (!dept.enabled) {
        console.log(`⏭️ Skipping disabled department: ${dept.name}`);
        continue;
      }
      
      console.log(`🏢 Deploying workflow for department: ${dept.name} (${dept.email})`);
      
      // Get department-specific OAuth credential
      const deptCredential = await getDepartmentCredential(userId, dept.id, provider);
      
      if (!deptCredential) {
        console.error(`❌ No OAuth credential for department ${dept.name}`);
        continue;
      }
      
      // Load department template
      const template = await loadTemplate(`${provider}-department-template.json`);
      
      // Department-specific replacements
      const replacements = {
        '<<<BUSINESS_NAME>>>': profile.business_name,
        '<<<DEPARTMENT_NAME>>>': dept.name,
        '<<<DEPARTMENT_ID>>>': dept.id,
        '<<<DEPARTMENT_EMAIL>>>': dept.email,
        '<<<DEPT_CREDENTIAL_ID>>>': deptCredential.id,
        '<<<ALLOWED_CATEGORIES>>>': JSON.stringify(dept.categories),
        '<<<DEPARTMENT_MANAGERS>>>': JSON.stringify(
          managers.filter(m => dept.managers.includes(m.name))
        )
      };
      
      // Inject and deploy
      const injectedWorkflow = injectPlaceholders(template, replacements);
      const deployed = await createN8NWorkflow(injectedWorkflow);
      
      // Save to database
      await supabase.from('workflows').insert({
        user_id: userId,
        department_id: dept.id,
        deployment_mode: 'department',
        n8n_workflow_id: deployed.id,
        provider: provider,
        status: 'active'
      });
      
      deployedWorkflows.push({
        department: dept.name,
        workflowId: deployed.id,
        email: dept.email
      });
    }
    
    return {
      success: true,
      mode: 'department',
      workflows: deployedWorkflows,
      departmentsDeployed: deployedWorkflows.length
    };
  }
}
```

---

## 📊 User Experience Flows

### **Email Hub Mode (Current):**

```
User Onboarding:
Step 1: Connect Gmail
  ↓
  "Connect office@thehottubman.ca" button
  ↓
  OAuth flow (one time)
  ↓
Step 2: Select business type
Step 3: Add team (managers)
Step 4: Deploy
  ↓
  ONE workflow deployed
  ↓
✅ Done! All emails processed automatically
```

---

### **Department Mode (New):**

```
User Onboarding:
Step 1: Choose Deployment Mode
  ↓
  [ ] Email Hub (one email)
  [✓] Department Mode (multiple emails)
  ↓
Step 1.5: Configure Departments
  ↓
  Sales Department:
    Email: sales@business.com
    Managers: [Hailey]
    Categories: [SALES, FORMSUB]
    [Connect Gmail] ← OAuth flow
  ↓
  Support Department:
    Email: support@business.com
    Managers: [Jillian]
    Categories: [SUPPORT, URGENT]
    [Connect Gmail] ← OAuth flow
  ↓
  Operations Department:
    Email: ops@business.com
    Managers: [Aaron]
    Categories: [MANAGER, SUPPLIERS, BANKING]
    [Connect Gmail] ← OAuth flow
  ↓
Step 2: Select business type
Step 3: Add team (managers → assigned to departments)
Step 4: Deploy
  ↓
  THREE workflows deployed (one per department)
  ↓
✅ Done! Department emails processed separately
```

---

## 🎨 UI Mockup (Department Configuration)

```
┌─────────────────────────────────────────────────────────┐
│  Choose How FloWorx Works for Your Business             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ○ Email Hub (Recommended for small businesses)         │
│    One central inbox processes all emails               │
│    ✅ Simple setup  ✅ Lower cost  ✅ Auto-routing       │
│                                                          │
│  ● Department Mode (For larger teams)                   │
│    Separate inboxes for each department                 │
│    ⚠️ Multiple emails  ⚠️ Higher cost  ✅ Dedicated     │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Configure Departments                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [✓] Sales Department                                   │
│      Email: sales@thehottubman.ca                       │
│      Managers: Hailey ▼                                 │
│      Categories: ☑ SALES  ☑ FORMSUB                     │
│      Status: ⚪ Not Connected  [Connect Gmail]          │
│                                                          │
│  [✓] Support Department                                 │
│      Email: support@thehottubman.ca                     │
│      Managers: Jillian ▼                                │
│      Categories: ☑ SUPPORT  ☑ URGENT                    │
│      Status: ⚪ Not Connected  [Connect Gmail]          │
│                                                          │
│  [ ] Operations Department                              │
│      Email: ops@thehottubman.ca                         │
│      Managers: Aaron ▼                                  │
│      Categories: ☑ MANAGER  ☑ SUPPLIERS  ☑ BANKING      │
│      Status: Disabled                                   │
│                                                          │
│  [+ Add Custom Department]                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Smart Hybrid Approach (RECOMMENDED)

Instead of full Department Mode, add **"Department Awareness"** to Email Hub:

### **How it works:**

**Same Email Hub setup** (one email, one workflow) **BUT:**

- Managers tagged with departments
- Routing considers department assignments
- Analytics show department breakdown
- UI shows department performance

**Benefits:**
- ✅ 80% of department mode benefits
- ✅ 20% of the complexity
- ✅ No multiple email accounts needed
- ✅ No multiple OAuth flows
- ✅ Same N8N cost
- ✅ Easier to implement (2-3 weeks vs 10-12 weeks)

**Implementation:**

```javascript
// Just add "department" field to managers
managers: [
  { 
    name: "Hailey", 
    email: "dizelll2007@gmail.com",
    roles: ["sales_manager"],
    department: "sales"  // ← NEW FIELD
  },
  { 
    name: "Jillian", 
    email: "dizelll2007@gmail.com",
    roles: ["service_manager"],
    department: "support"  // ← NEW FIELD
  },
  { 
    name: "Aaron", 
    email: "Aaron@thehottubman.ca",
    roles: ["operations_manager"],
    department: "operations"  // ← NEW FIELD
  }
]

// Dashboard shows department breakdown
Performance by Department:
- Sales: 45 emails, $112.50 saved
- Support: 67 emails, $167.50 saved
- Operations: 23 emails, $57.50 saved
```

---

## 🎯 Recommended Implementation Path

### **Phase 1: Fix Current Deployment** (Immediate)
✅ Redeploy workflows to use latest template  
✅ Verify manager routing works  
✅ Clean up duplicates  

### **Phase 2: Add Department Awareness** (2-3 weeks)
✅ Add "department" field to managers  
✅ Update dashboard to show department breakdown  
✅ Filter by department in analytics  
✅ Department-based performance metrics  

**Effort:** 2-3 weeks, $10-15K  
**Value:** High - provides department insights without complexity

### **Phase 3: Full Department Mode** (3-4 months - IF needed)
⏸️ Only implement if users request it  
⏸️ Validate demand with Phase 2 analytics  
⏸️ Consider as premium tier ($200+/month)  

**Effort:** 10-12 weeks, $50-60K  
**Value:** Medium - only needed by larger businesses

---

## 📊 Cost-Benefit Analysis

### **Hybrid Approach (Department Awareness):**

**Development Cost:** $10-15K (2-3 weeks)  

**Benefits:**
- ✅ Department performance tracking
- ✅ Manager-department assignment
- ✅ Department-filtered analytics
- ✅ Better insights for users
- ✅ No infrastructure cost increase

**ROI:** High - low cost, high value

---

### **Full Department Mode:**

**Development Cost:** $50-60K (10-12 weeks)  

**Infrastructure Costs:**
- 3 emails × $6/month = $18/month per customer
- 3 workflows × N8N cost = +200% execution cost
- 3 OAuth tokens = +200% API calls

**Pricing Required:**
- Must charge $150-300/month to justify costs
- Only 10-20% of customers would use it

**ROI:** Medium-Low - high cost, limited market

---

## ✅ Final Recommendation

### **Implement in this order:**

**Now (Week 1):**
1. ✅ Redeploy workflows with manager routing
2. ✅ Verify routing works end-to-end
3. ✅ Clean up duplicate workflows

**Short-term (Weeks 2-4):**
4. ✅ Add "department" field to managers
5. ✅ Update dashboard with department breakdown
6. ✅ Add department filtering to analytics
7. ✅ Gather user feedback on department needs

**Medium-term (Months 3-6):**
8. ⏸️ Implement full Department Mode IF:
   - Users actively request it (5+ requests)
   - Willing to pay $200+/month premium
   - Medium-sized businesses in pipeline

---

## 🎯 Summary

### **Your Templates Are Ready!** ✅
- Gmail template: Has manager routing
- Outlook template: Has manager routing
- IMAP template: Has manager routing

### **Your Deployed Workflow Is Old** ⚠️
- Missing manager routing nodes
- Needs redeployment

### **Department Mode: Not Essential Now** 📋
- Current Email Hub mode works great for 90% of users
- Add "department awareness" first (2-3 weeks)
- Full department mode later if needed (10-12 weeks)

---

**Next Step: Redeploy "The Hot Tub Man" workflow to use the latest template with manager routing! 🚀**

Then consider adding department awareness as an enhancement rather than full department mode.

