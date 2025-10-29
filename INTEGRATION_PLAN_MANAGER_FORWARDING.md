# Integration Plan: Manager Email Forwarding with AI Draft

## 🎯 How to Integrate This Feature Into Current System

---

## 📋 Phase 1: Frontend Changes (Team Setup Page)

### **Step 1.1: Update StepTeamSetup.jsx**

**File:** `src/pages/onboarding/StepTeamSetup.jsx`

**Current State:**
```javascript
const [managers, setManagers] = useState([
  { name: '', email: '' }  // ← Email field exists but not used for forwarding
]);
```

**Changes Needed:**
```javascript
// Add role selection to managers state
const [managers, setManagers] = useState([
  { 
    name: '', 
    email: '',           // ← Keep existing
    roles: []            // ← ADD: Multi-select roles
  }
]);

// Add role options
const AVAILABLE_ROLES = [
  {
    id: 'sales_manager',
    label: 'Sales Manager',
    description: 'Handles quotes, new leads, pricing inquiries',
    routes: ['SALES'],
    keywords: ['price', 'quote', 'buy', 'purchase']
  },
  {
    id: 'service_manager',
    label: 'Service Manager',
    description: 'Handles repairs, appointments, emergencies',
    routes: ['SUPPORT', 'URGENT'],
    keywords: ['repair', 'fix', 'broken', 'appointment']
  },
  {
    id: 'operations_manager',
    label: 'Operations Manager',
    description: 'Handles vendors, internal ops, hiring',
    routes: ['MANAGER', 'SUPPLIERS'],
    keywords: ['vendor', 'supplier', 'hiring']
  },
  {
    id: 'support_lead',
    label: 'Support Lead',
    description: 'Handles general questions, parts, how-to',
    routes: ['SUPPORT'],
    keywords: ['help', 'question', 'parts']
  },
  {
    id: 'owner',
    label: 'Owner/CEO',
    description: 'Handles strategic, legal, high-priority',
    routes: ['MANAGER', 'URGENT'],
    keywords: ['strategic', 'legal', 'partnership']
  }
];
```

**UI Component Update:**
```jsx
{managers.map((manager, index) => (
  <div key={index} className="border rounded-lg p-4 mb-4">
    <div className="space-y-4">
      {/* Name field (existing) */}
      <div>
        <Label>Name</Label>
        <Input
          value={manager.name}
          onChange={(e) => updateManager(index, 'name', e.target.value)}
          placeholder="Mark Johnson"
        />
      </div>

      {/* Email field with forwarding explanation (existing, enhanced) */}
      <div>
        <Label className="flex items-center gap-2">
          Email (Optional)
          <InfoTooltip text="If provided, emails will be forwarded to this address with AI draft included" />
        </Label>
        <Input
          value={manager.email}
          onChange={(e) => updateManager(index, 'email', e.target.value)}
          placeholder="mark@example.com (optional)"
          type="email"
        />
        {manager.email && (
          <p className="text-xs text-green-600 mt-1">
            ✅ Forwarding enabled - Will receive emails + AI drafts
          </p>
        )}
        {!manager.email && (
          <p className="text-xs text-gray-500 mt-1">
            ℹ️ No forwarding - Will check main inbox with label filter
          </p>
        )}
      </div>

      {/* Roles multi-select (NEW) */}
      <div>
        <Label>Roles (Select all that apply)</Label>
        <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
          {AVAILABLE_ROLES.map(role => (
            <label 
              key={role.id}
              className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={manager.roles.includes(role.id)}
                onChange={() => toggleManagerRole(index, role.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{role.label}</div>
                <div className="text-xs text-gray-500">{role.description}</div>
              </div>
            </label>
          ))}
        </div>
        
        {/* Show selected roles summary */}
        {manager.roles.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📁 {manager.name || 'This person'}'s Email Routing:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              {manager.roles.map(roleId => {
                const role = AVAILABLE_ROLES.find(r => r.id === roleId);
                return (
                  <li key={roleId}>
                    • {role.routes.join(', ')} emails → {manager.name}'s folder
                  </li>
                );
              })}
              <li>• Any mention of "{manager.name}" → {manager.name}'s folder</li>
              {manager.email && (
                <li className="text-green-700 font-medium">
                  ✅ Forwarded to: {manager.email}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => removeManager(index)}
      >
        Remove Team Member
      </Button>
    </div>
  </div>
))}
```

**Helper Functions:**
```javascript
const toggleManagerRole = (managerIndex, roleId) => {
  setManagers(prev => prev.map((mgr, idx) => {
    if (idx !== managerIndex) return mgr;
    
    const hasRole = mgr.roles.includes(roleId);
    return {
      ...mgr,
      roles: hasRole 
        ? mgr.roles.filter(r => r !== roleId)  // Remove
        : [...mgr.roles, roleId]                // Add
    };
  }));
};

const updateManager = (index, field, value) => {
  setManagers(prev => prev.map((mgr, idx) => 
    idx === index ? { ...mgr, [field]: value } : mgr
  ));
};
```

---

## 📋 Phase 2: Backend Changes (N8N Template)

### **Step 2.1: Update Gmail Template**

**File:** `src/lib/templates/gmail-template.json`

**Add New Node: "Build Forward Email Body"**

**Position:** After "AI Draft Reply Agent" node, before "Save Performance Metrics"

```json
{
  "parameters": {
    "jsCode": "// Build email body for manager forwarding\nconst manager = $json.matched_manager;\nconst managerEmail = manager?.email;\nconst aiCanReply = $json.ai_can_reply;\nconst routing = $json.routing_decision;\n\n// Get original email\nconst originalEmail = $('Prepare Email Data').first().json;\n\n// Get AI draft if available\nconst aiDraft = aiCanReply ? $('AI Draft Reply Agent').item?.json?.draft_response : null;\n\n// Build forward body\nlet forwardBody = '';\n\nif (aiDraft) {\n  forwardBody = `🤖 AI SUGGESTED RESPONSE (Review & Approve):\\n${'='.repeat(60)}\\n${aiDraft}\\n${'='.repeat(60)}\\n\\n✅ AI Confidence: ${Math.round($json.confidence * 100)}%\\n✅ Classification: ${$json.primary_category}${$json.secondary_category ? ' > ' + $json.secondary_category : ''}\\n✅ Routed to you as: ${routing?.matched_roles?.join(' + ') || 'Manager'}\\n\\n💡 QUICK ACTIONS:\\n├─ ✅ Approve: Reply to customer with this draft\\n├─ ✏️ Edit: Modify before sending\\n└─ ❌ Reject: Write your own response\\n\\n${'-'.repeat(60)}\\n\\n--- ORIGINAL CUSTOMER EMAIL ---\\nFrom: ${originalEmail.from}\\nTo: ${originalEmail.to}\\nSubject: ${originalEmail.subject}\\nDate: ${originalEmail.date || new Date().toISOString()}\\n\\n${originalEmail.body}\\n\\n${'-'.repeat(60)}\\n\\nFloWorx Email Processing System\\nManaged by ${manager?.name || 'Your Team'}`;\n} else {\n  forwardBody = `⚠️ AI COULD NOT GENERATE RESPONSE\\n\\n❌ Reason: ${$json.ai_cannot_reply_reason || 'Low confidence or requires human judgment'}\\n✅ Classification: ${$json.primary_category}\\n✅ Confidence: ${Math.round($json.confidence * 100)}%\\n✅ Routed to you as: ${routing?.matched_roles?.join(' + ') || 'Manager'}\\n\\n💡 This email requires your personal response.\\n\\n${'-'.repeat(60)}\\n\\n--- ORIGINAL CUSTOMER EMAIL ---\\nFrom: ${originalEmail.from}\\nSubject: ${originalEmail.subject}\\n\\n${originalEmail.body}\\n\\n${'-'.repeat(60)}\\n\\nFloWorx Email Processing System\\nManaged by ${manager?.name || 'Your Team'}`;\n}\n\nreturn [{\n  json: {\n    shouldForward: !!(managerEmail && managerEmail.trim() !== '' && managerEmail.includes('@')),\n    forwardTo: managerEmail,\n    forwardSubject: `Fwd: ${originalEmail.subject}`,\n    forwardBody: forwardBody,\n    hasAIDraft: !!aiDraft,\n    managerName: manager?.name || 'Manager'\n  }\n}];"
  },
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [1200, 400],
  "name": "Build Forward Email Body"
}
```

**Add New Node: "IF Manager Has Email"**

```json
{
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{$json.shouldForward}}",
          "value2": true
        }
      ]
    }
  },
  "type": "n8n-nodes-base.if",
  "typeVersion": 1,
  "position": [1400, 400],
  "name": "IF Manager Has Email"
}
```

**Add New Node: "Forward to Manager (Gmail)"**

**Connected to:** "IF Manager Has Email" → TRUE branch

```json
{
  "parameters": {
    "resource": "message",
    "operation": "forward",
    "messageId": "={{$('Prepare Email Data').first().json.id}}",
    "toEmail": "={{$json.forwardTo}}",
    "subject": "={{$json.forwardSubject}}",
    "body": "={{$json.forwardBody}}"
  },
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2,
  "position": [1600, 300],
  "name": "Forward to Manager (Gmail)",
  "credentials": {
    "gmailOAuth2": {
      "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
      "name": "Gmail Account"
    }
  }
}
```

---

### **Step 2.2: Update Outlook Template**

**File:** `src/lib/templates/outlook-template.json`

**Same nodes as Gmail, but use Outlook API:**

```json
{
  "parameters": {
    "resource": "message",
    "operation": "forward",
    "messageId": "={{$('Prepare Email Data').first().json.id}}",
    "toRecipients": "={{$json.forwardTo}}",
    "comment": "={{$json.forwardBody}}"
  },
  "type": "n8n-nodes-base.microsoftOutlook",
  "typeVersion": 2,
  "position": [1600, 300],
  "name": "Forward to Manager (Outlook)",
  "credentials": {
    "microsoftOutlookOAuth2": {
      "id": "<<<CLIENT_OUTLOOK_CRED_ID>>>",
      "name": "Outlook Account"
    }
  }
}
```

---

## 📋 Phase 3: Deployment Function Updates

### **Step 3.1: Update deploy-n8n/index.ts**

**File:** `supabase/functions/deploy-n8n/index.ts`

**Add after existing manager extraction (around line 1630):**

```typescript
// CRITICAL FIX: Build role-based routing configuration
const managersWithRouting = (clientData.managers || []).map(manager => {
  const managerRoles = Array.isArray(manager.roles) 
    ? manager.roles 
    : (manager.role ? [manager.role] : []);
  
  // Get routing config for each role
  const routingConfig = {
    categories: [],
    keywords: [],
    handles: []
  };
  
  managerRoles.forEach(roleId => {
    const roleConfig = getRoleConfiguration(roleId);
    if (roleConfig) {
      routingConfig.categories.push(...roleConfig.routes);
      routingConfig.keywords.push(...roleConfig.keywords);
      routingConfig.handles.push(...roleConfig.handles);
    }
  });
  
  return {
    name: manager.name,
    email: manager.email,
    roles: managerRoles,
    forwarding_enabled: !!(manager.email && manager.email.trim() !== ''),
    routing_config: routingConfig
  };
});

// Helper function: Get role configuration
function getRoleConfiguration(roleId) {
  const configs = {
    'sales_manager': {
      routes: ['SALES'],
      keywords: ['price', 'quote', 'buy', 'purchase', 'how much', 'pricing'],
      handles: ['New inquiries', 'Quotes', 'Pricing', 'Product info']
    },
    'service_manager': {
      routes: ['SUPPORT', 'URGENT'],
      keywords: ['repair', 'fix', 'broken', 'appointment', 'schedule', 'emergency'],
      handles: ['Repairs', 'Appointments', 'Technical support', 'Emergencies']
    },
    'operations_manager': {
      routes: ['MANAGER', 'SUPPLIERS'],
      keywords: ['vendor', 'supplier', 'hiring', 'job application', 'internal'],
      handles: ['Vendors', 'Suppliers', 'Hiring', 'Internal ops']
    },
    'support_lead': {
      routes: ['SUPPORT'],
      keywords: ['help', 'question', 'how do i', 'parts', 'chemicals'],
      handles: ['General questions', 'Parts orders', 'Product advice']
    },
    'owner': {
      routes: ['MANAGER', 'URGENT'],
      keywords: ['strategic', 'legal', 'partnership', 'media', 'acquisition'],
      handles: ['Strategic decisions', 'Legal matters', 'Partnerships']
    }
  };
  
  return configs[roleId] || null;
}
```

**Add to AI system message injection:**
```typescript
// Build role-based routing rules for AI
const teamRoutingRules = buildTeamRoutingRules(managersWithRouting);

// Add to replacements
replacements['<<<TEAM_ROUTING_RULES>>>'] = teamRoutingRules;
replacements['<<<MANAGERS_WITH_ROUTING>>>'] = JSON.stringify(managersWithRouting);
```

**Build team routing rules function:**
```typescript
function buildTeamRoutingRules(managers) {
  if (!managers || managers.length === 0) {
    return 'No team members configured';
  }
  
  const rules = managers.map(mgr => {
    const rolesText = mgr.roles.map(r => r.replace(/_/g, ' ')).join(' + ');
    const forwardingStatus = mgr.forwarding_enabled 
      ? `✅ Forwarded to: ${mgr.email}`
      : '❌ No forwarding (check main inbox)';
    
    return `
**${mgr.name}** - ${mgr.email || 'No email'}
Roles: ${rolesText}
→ Handles: ${mgr.routing_config.handles.join(', ')}
→ Routes when:
  • Email mentions "${mgr.name}"
  • Email classified as: ${mgr.routing_config.categories.join(' or ')}
  • Email contains keywords: ${mgr.routing_config.keywords.slice(0, 8).join(', ')}
→ Folder: MANAGER/${mgr.name}/
→ Forwarding: ${forwardingStatus}
`;
  }).join('\n');
  
  return `
### Team Structure & Email Routing:

${rules}

### Routing Logic:

**Priority 1: Name Detection**
If customer email mentions a team member name:
${managers.map(m => `- "${m.name}" detected → Route to MANAGER/${m.name}/`).join('\n')}

**Priority 2: MANAGER Category + Content Analysis**
If email classified as MANAGER but no name mentioned:
- Analyze email content for role-specific keywords
- Score each manager based on ALL their roles
- Route to manager with highest keyword match score
${managers.filter(m => m.roles.includes('operations_manager')).map(m => `- Vendor/supplier email → ${m.name} (Operations)`).join('\n')}
${managers.filter(m => m.roles.includes('service_manager')).map(m => `- Complaint/escalation → ${m.name} (Service)`).join('\n')}
${managers.filter(m => m.roles.includes('owner')).map(m => `- Strategic/legal → ${m.name} (Owner)`).join('\n')}

**Priority 3: Category + Role Match**
${managers.filter(m => m.roles.includes('sales_manager')).map(m => `- SALES emails → ${m.name}`).join('\n')}
${managers.filter(m => m.roles.includes('service_manager')).map(m => `- SUPPORT/URGENT → ${m.name}`).join('\n')}

**Forwarding Behavior:**
${managers.filter(m => m.forwarding_enabled).map(m => 
  `- ${m.name}: Emails forwarded to ${m.email} WITH AI draft (if available)`
).join('\n')}
${managers.filter(m => !m.forwarding_enabled).map(m => 
  `- ${m.name}: Emails labeled only (no forwarding, no email provided)`
).join('\n')}
`;
}
```

---

## 📋 Phase 4: Update N8N Workflow Connections

### **Current Workflow:**
```
AI Draft Reply Agent
    ↓
Calculate Performance Metrics
    ↓
Save Performance Metrics
```

### **New Workflow:**
```
AI Draft Reply Agent
    ↓
Build Forward Email Body ⭐ NEW
    ↓
IF Manager Has Email? ⭐ NEW
    ├─ TRUE → Forward to Manager (Gmail/Outlook) ⭐ NEW
    │         ↓
    └─ FALSE ──┴─→ (Skip forwarding)
               ↓
Calculate Performance Metrics
    ↓
Save Performance Metrics
```

**Node Connections to Add:**
```json
{
  "AI Draft Reply Agent": {
    "main": [[{
      "node": "Build Forward Email Body",
      "type": "main",
      "index": 0
    }]]
  },
  "Build Forward Email Body": {
    "main": [[{
      "node": "IF Manager Has Email",
      "type": "main",
      "index": 0
    }]]
  },
  "IF Manager Has Email": {
    "main": [
      [{  // TRUE branch
        "node": "Forward to Manager (Gmail)",
        "type": "main",
        "index": 0
      }],
      [{  // FALSE branch
        "node": "Calculate Performance Metrics",
        "type": "main",
        "index": 0
      }]
    ]
  },
  "Forward to Manager (Gmail)": {
    "main": [[{
      "node": "Calculate Performance Metrics",
      "type": "main",
      "index": 0
    }]]
  }
}
```

---

## 📋 Phase 5: Database Migration (Optional)

### **Step 5.1: Update manager data structure**

**Migration:** `supabase/migrations/20251029_enhance_managers_structure.sql`

```sql
-- Update managers JSONB structure to support multiple roles
-- This is backward compatible - existing single-role managers will still work

COMMENT ON COLUMN profiles.client_config IS 'Enhanced manager structure supports:
{
  "managers": [
    {
      "name": "string",
      "email": "string (optional for forwarding)",
      "roles": ["array of role ids"],
      "role": "string (legacy, still supported)",
      "forwarding_enabled": "boolean (auto-set based on email)",
      "routing_config": {
        "categories": ["array"],
        "keywords": ["array"]
      }
    }
  ]
}';

-- No actual schema change needed since client_config is JSONB
-- Just documenting the new structure
```

---

## 📋 Phase 6: Testing Integration

### **Test 1: End-to-End with Forwarding**

**Setup:**
```
1. Add manager in Team Setup:
   - Name: Mark Johnson
   - Email: mark@personal.com ✅
   - Roles: Sales Manager
   
2. Save and complete onboarding

3. Deploy N8N workflow from dashboard
```

**Test Email:**
```
Send to: info@hottubman.ca
Subject: "How much for a hot tub?"
Body: "I want to buy a 6-person spa"
```

**Expected Results:**
```
✅ AI classifies: SALES > NewInquiry
✅ ai_can_reply: true
✅ AI generates draft response
✅ Routes to: Mark Johnson (Sales Manager)
✅ Label applied: MANAGER/Mark Johnson/
✅ Email forwarded to: mark@personal.com

Mark receives at mark@personal.com:
  Subject: Fwd: How much for a hot tub?
  Body:
    🤖 AI SUGGESTED RESPONSE:
    [Full draft here...]
    
    --- ORIGINAL EMAIL ---
    [Customer email here...]
```

**Verify:**
- [ ] Email in main inbox with label
- [ ] Email forwarded to mark@personal.com
- [ ] Forward includes AI draft at top
- [ ] Forward includes original email
- [ ] Forward includes classification metadata

---

### **Test 2: No Forwarding (Email Blank)**

**Setup:**
```
1. Add manager:
   - Name: Sarah Williams
   - Email: (blank) ❌
   - Roles: Service Manager
```

**Test Email:**
```
Subject: "Heater not working"
Body: "My hot tub won't heat up"
```

**Expected Results:**
```
✅ AI classifies: SUPPORT > TechnicalSupport
✅ Routes to: Sarah Williams (Service Manager)
✅ Label applied: MANAGER/Sarah Williams/
❌ No forwarding (email blank)

Sarah checks main inbox:
  Filters by: MANAGER/Sarah Williams/
  Sees email with AI draft in drafts folder
```

**Verify:**
- [ ] Email in main inbox with label
- [ ] NO email forwarded
- [ ] AI draft in drafts folder
- [ ] Sarah can see it with label filter

---

### **Test 3: Multiple Roles, One Email**

**Setup:**
```
1. Add manager:
   - Name: Tom Wilson
   - Email: tom@personal.com ✅
   - Roles: Sales Manager + Operations Manager
```

**Test Email A (Sales):**
```
Subject: "Quote request"
→ Routes to Tom (Sales role)
→ Forwards to tom@personal.com ✅
```

**Test Email B (Vendor):**
```
Subject: "Supplier partnership inquiry"  
→ Routes to Tom (Operations role)
→ Forwards to tom@personal.com ✅
```

**Verify:**
- [ ] Both emails forwarded to same address
- [ ] Both include appropriate AI drafts
- [ ] Routing metadata shows different roles matched

---

## 📋 Phase 7: Rollout Strategy

### **Step 7.1: Existing Users (Backward Compatibility)**

**Current Data Structure:**
```javascript
managers: [
  { name: "Mark", email: "mark@...", role: "Sales Manager" }  // ← Single role
]
```

**Automatic Migration:**
```typescript
// In deploy-n8n function
const normalizedManagers = (clientData.managers || []).map(mgr => ({
  name: mgr.name,
  email: mgr.email,
  roles: Array.isArray(mgr.roles) 
    ? mgr.roles                    // ← New format
    : (mgr.role ? [mgr.role] : []),  // ← Convert old format
  forwarding_enabled: !!(mgr.email && mgr.email.trim())
}));
```

**Result:** ✅ Existing users continue working, no data migration needed

---

### **Step 7.2: New Users**

**Onboarding Flow:**
```
1. Team Setup page
   → Select multiple roles per manager
   → Optionally provide email for forwarding
   
2. Save to database
   → roles: ["array", "of", "roles"]
   
3. Deploy workflow
   → Includes forwarding logic
   → Includes role-based routing
```

---

### **Step 7.3: Feature Flag (Optional)**

**Control rollout with feature flag:**

```typescript
// In deploy-n8n/index.ts
const FEATURE_FLAGS = {
  MANAGER_EMAIL_FORWARDING: true,    // ← Enable/disable forwarding
  INCLUDE_AI_DRAFT_IN_FORWARD: true, // ← Enable/disable AI draft inclusion
  ROLE_BASED_ROUTING: true           // ← Enable/disable role routing
};

// Apply conditionally
if (FEATURE_FLAGS.MANAGER_EMAIL_FORWARDING) {
  // Add forwarding nodes
}
```

---

## 📋 Phase 8: Documentation for Users

### **Help Text in UI:**

**Team Setup Page:**
```
┌──────────────────────────────────────────────────────────┐
│ ℹ️ Email Forwarding Feature                              │
├──────────────────────────────────────────────────────────┤
│ Provide an email address to receive forwarded emails:   │
│                                                          │
│ ✅ WITH email:                                           │
│    • You receive emails in your personal inbox          │
│    • AI draft included for review                       │
│    • Reply directly from your inbox                     │
│    • No need to check main business inbox              │
│                                                          │
│ ⚠️ WITHOUT email (leave blank):                          │
│    • Emails stay in main business inbox only            │
│    • Check main inbox with folder filters               │
│    • Good for centralized team approach                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Integration Checklist

### **Frontend:**
- [ ] Update `StepTeamSetup.jsx` with multi-select roles UI
- [ ] Add email field tooltip explaining forwarding
- [ ] Add folder preview showing routing
- [ ] Add role configuration constants
- [ ] Add validation for email format
- [ ] Show forwarding status indicator

### **Backend:**
- [ ] Update `deploy-n8n/index.ts` with role configuration
- [ ] Add `getRoleConfiguration()` helper function
- [ ] Add `buildTeamRoutingRules()` function
- [ ] Add manager normalization (backward compatibility)
- [ ] Inject `<<<TEAM_ROUTING_RULES>>>` placeholder

### **N8N Templates:**
- [ ] Add "Build Forward Email Body" node (Gmail)
- [ ] Add "Build Forward Email Body" node (Outlook)
- [ ] Add "IF Manager Has Email" node (both)
- [ ] Add "Forward to Manager (Gmail)" node
- [ ] Add "Forward to Manager (Outlook)" node
- [ ] Update node connections
- [ ] Add error handling for failed forwards

### **AI System Messages:**
- [ ] Add team routing rules section
- [ ] Add name detection instructions
- [ ] Add MANAGER category content matching rules
- [ ] Add forwarding behavior documentation

### **Testing:**
- [ ] Test with email forwarding enabled
- [ ] Test with email forwarding disabled (blank)
- [ ] Test AI draft included in forward
- [ ] Test no AI draft (ai_can_reply = false)
- [ ] Test multiple roles per manager
- [ ] Test name detection routing
- [ ] Test role-based routing
- [ ] Test MANAGER category intelligent routing

### **Documentation:**
- [ ] Update user guide with forwarding feature
- [ ] Create manager onboarding guide
- [ ] Document troubleshooting for failed forwards
- [ ] Add FAQ about forwarding vs labeling

---

## 📊 Migration Path

### **Week 1: Core Implementation**
- ✅ Frontend UI updates (Team Setup page)
- ✅ Backend role configuration logic
- ✅ N8N template nodes (forwarding logic)

### **Week 2: Testing & Refinement**
- ✅ End-to-end testing
- ✅ Error handling
- ✅ Edge case fixes
- ✅ Performance optimization

### **Week 3: Rollout**
- ✅ Deploy to production
- ✅ Existing users: Automatic migration
- ✅ New users: Full feature available
- ✅ Monitor forwarding success rates

---

## 🎯 Quick Start Integration Steps

### **Minimal Viable Integration (MVP):**

1. **Update Team Setup Page (1 hour)**
   - Add "roles" field to manager state
   - Keep UI simple: single dropdown for now
   - Email field already exists

2. **Update N8N Template (2 hours)**
   - Add "Build Forward Email Body" code node
   - Add "IF Manager Has Email" conditional
   - Add "Forward to Manager" Gmail node
   - Update connections

3. **Update Deployment Function (1 hour)**
   - Build managers with routing config
   - Inject team routing rules into AI
   - Add backward compatibility for old format

4. **Test End-to-End (30 minutes)**
   - Deploy test workflow
   - Send test email
   - Verify forward includes AI draft

**Total Time: ~4.5 hours for MVP** ⚡

---

### **Full Feature Integration (Complete):**

1. **Multi-select roles UI (2 hours)**
2. **Role-based content matching (3 hours)**
3. **Enhanced AI routing rules (2 hours)**
4. **Outlook template update (1 hour)**
5. **Comprehensive testing (2 hours)**
6. **Documentation (1 hour)**

**Total Time: ~11 hours for full feature** 🚀

---

## ✅ Integration Summary

**What Changes:**
1. ✅ Team Setup page: Add multi-select roles
2. ✅ N8N templates: Add forwarding nodes (3 new nodes)
3. ✅ Deployment function: Build routing configuration
4. ✅ AI system message: Inject team routing rules

**What Stays Same:**
1. ✅ Existing manager data structure (backward compatible)
2. ✅ Gmail/Outlook label creation
3. ✅ AI classification logic
4. ✅ Draft generation logic

**What's New:**
1. 🆕 Multi-role support per manager
2. 🆕 Email forwarding with AI draft
3. 🆕 Role-based content matching for MANAGER category
4. 🆕 Smart routing (no more Unassigned)

---

**Complete integration plan documented!** ✅

**Ready to start implementation? Which phase should we tackle first?** 🚀

Options:
- **A:** MVP (4.5 hours) - Basic forwarding with single role
- **B:** Full Feature (11 hours) - Multi-roles + content matching
- **C:** Staged rollout - MVP first, then enhance

