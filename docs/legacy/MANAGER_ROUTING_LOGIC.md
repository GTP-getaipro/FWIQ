# 🎯 Dynamic Manager Routing - Missing Critical Node

## ⚠️ Current Problem

**The workflow is missing the ROUTING LOGIC!**

Current flow:
```
AI Classifies Email
    ↓
Generate Labels
    ↓
Build Forward Email Body  ❌ No routing decision made yet!
    ↓
Forward to Manager  ❌ Which manager?!
```

**Critical Missing Step:** Determine WHICH manager should receive the email

---

## ✅ Required Solution: "Route to Manager" Node

### **New Flow:**
```
AI Classifies Email
    ↓
Generate Labels
    ↓
Apply Labels
    ↓
🆕 ROUTE TO MANAGER (New Node)  ← Decides which manager
    ↓
Can AI Reply?
    ↓
Draft Reply
    ↓
Build Forward Email Body (uses matched_manager)
    ↓
Forward to Manager
```

---

## 🔧 Implementation: "Route to Manager" Code Node

### **Node Position:**
Insert AFTER "Apply Gmail Labels" and BEFORE "Can AI Reply?"

### **Complete Code:**

```javascript
// ═══════════════════════════════════════════════════════════
// DYNAMIC MANAGER ROUTING ENGINE
// Intelligently matches emails to the right manager
// ═══════════════════════════════════════════════════════════

const classification = $json.parsed_output || $json;
const emailData = $('Prepare Email Data').first()?.json || {};

// CRITICAL: Load team configuration from deployment
const TEAM_CONFIG = <<<TEAM_CONFIG>>>;  // Injected during N8N deployment

// Extract managers and suppliers from config
const managers = TEAM_CONFIG.managers || [];
const suppliers = TEAM_CONFIG.suppliers || [];

console.log('🎯 Starting Manager Routing...', {
  primaryCategory: classification.primary_category,
  secondaryCategory: classification.secondary_category,
  emailFrom: emailData.from,
  emailSubject: emailData.subject,
  teamSize: managers.length
});

// ═══════════════════════════════════════════════════════════
// HELPER: Role Configuration
// Maps role IDs to their routing behavior
// ═══════════════════════════════════════════════════════════
function getRoleConfig(roleId) {
  const configs = {
    'sales_manager': {
      categories: ['SALES'],
      keywords: ['quote', 'price', 'cost', 'buy', 'purchase', 'how much', 'pricing', 'estimate'],
      weight: 10
    },
    'service_manager': {
      categories: ['SUPPORT', 'URGENT'],
      keywords: ['repair', 'fix', 'broken', 'not working', 'appointment', 'emergency', 'service call'],
      weight: 10
    },
    'operations_manager': {
      categories: ['MANAGER', 'SUPPLIERS'],
      keywords: ['vendor', 'supplier', 'order', 'inventory', 'hiring', 'internal', 'operations'],
      weight: 8
    },
    'support_lead': {
      categories: ['SUPPORT'],
      keywords: ['help', 'question', 'how to', 'parts', 'chemicals', 'general', 'inquiry'],
      weight: 6
    },
    'owner': {
      categories: ['MANAGER', 'URGENT'],
      keywords: ['legal', 'strategic', 'partnership', 'media', 'important', 'urgent'],
      weight: 10
    }
  };
  
  return configs[roleId] || { categories: [], keywords: [], weight: 0 };
}

// ═══════════════════════════════════════════════════════════
// ROUTING PRIORITY LOGIC
// ═══════════════════════════════════════════════════════════

let matchedManager = null;
let routingReason = '';
let routingConfidence = 0;

// ─────────────────────────────────────────────────────────
// PRIORITY 1: Name Detection (Highest)
// If customer mentions a manager by name → route to them
// ─────────────────────────────────────────────────────────
const emailBody = emailData.body?.toLowerCase() || '';
const emailSubject = emailData.subject?.toLowerCase() || '';
const fullEmailText = `${emailSubject} ${emailBody}`;

for (const manager of managers) {
  const fullName = manager.name.toLowerCase();
  const firstName = fullName.split(' ')[0];
  
  // Check if name is mentioned
  if (fullEmailText.includes(fullName) || fullEmailText.includes(firstName)) {
    matchedManager = manager;
    routingReason = `Name mentioned: "${manager.name}"`;
    routingConfidence = 100;
    console.log(`✅ Priority 1 Match (Name): ${manager.name}`);
    break;
  }
}

// ─────────────────────────────────────────────────────────
// PRIORITY 2: Category + Role Match
// Match email category to manager roles
// ─────────────────────────────────────────────────────────
if (!matchedManager) {
  const primaryCategory = classification.primary_category?.toUpperCase() || '';
  const scores = [];
  
  for (const manager of managers) {
    let score = 0;
    const managerRoles = Array.isArray(manager.roles) ? manager.roles : (manager.role ? [manager.role] : []);
    const matchedRoles = [];
    
    // Check each role's category match
    for (const roleId of managerRoles) {
      const roleConfig = getRoleConfig(roleId);
      
      // Category match
      if (roleConfig.categories.includes(primaryCategory)) {
        score += roleConfig.weight;
        matchedRoles.push(roleId);
      }
    }
    
    if (score > 0) {
      scores.push({
        manager,
        score,
        reason: `Category match: ${primaryCategory} → ${matchedRoles.join(' + ')}`,
        matchedRoles
      });
    }
  }
  
  // Sort by score and pick highest
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    matchedManager = winner.manager;
    routingReason = winner.reason;
    routingConfidence = Math.min(95, 70 + winner.score);
    console.log(`✅ Priority 2 Match (Category): ${winner.manager.name} (score: ${winner.score})`);
  }
}

// ─────────────────────────────────────────────────────────
// PRIORITY 3: MANAGER Category + Content Analysis
// For emails classified as MANAGER but no name mentioned
// Analyze content for role-specific keywords
// ─────────────────────────────────────────────────────────
if (!matchedManager && classification.primary_category?.toUpperCase() === 'MANAGER') {
  const scores = [];
  
  for (const manager of managers) {
    let score = 0;
    const managerRoles = Array.isArray(manager.roles) ? manager.roles : (manager.role ? [manager.role] : []);
    const matchedKeywords = [];
    
    // Check each role's keywords
    for (const roleId of managerRoles) {
      const roleConfig = getRoleConfig(roleId);
      
      // Keyword matching
      for (const keyword of roleConfig.keywords) {
        if (fullEmailText.includes(keyword.toLowerCase())) {
          score += 2;  // Each keyword match adds 2 points
          matchedKeywords.push(keyword);
        }
      }
      
      // Role weight bonus
      score += roleConfig.weight * 0.1;
    }
    
    if (score > 0) {
      scores.push({
        manager,
        score,
        reason: `MANAGER content analysis: ${matchedKeywords.slice(0, 3).join(', ')}`,
        matchedKeywords
      });
    }
  }
  
  // Sort by score and pick highest
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    matchedManager = winner.manager;
    routingReason = winner.reason;
    routingConfidence = Math.min(85, 50 + winner.score * 2);
    console.log(`✅ Priority 3 Match (Content): ${winner.manager.name} (score: ${winner.score})`);
  }
}

// ─────────────────────────────────────────────────────────
// PRIORITY 4: Supplier Detection
// Check if email is from a known supplier
// ─────────────────────────────────────────────────────────
if (!matchedManager && suppliers.length > 0) {
  const senderEmail = emailData.from?.toLowerCase() || '';
  const senderDomain = senderEmail.split('@')[1] || '';
  
  for (const supplier of suppliers) {
    const supplierName = supplier.name.toLowerCase();
    const supplierEmail = supplier.email?.toLowerCase() || '';
    
    // Check if sender matches supplier
    if (senderEmail === supplierEmail || 
        fullEmailText.includes(supplierName) ||
        (supplier.domain && senderDomain.includes(supplier.domain))) {
      
      // Route to operations manager if available
      const opsManager = managers.find(m => {
        const roles = Array.isArray(m.roles) ? m.roles : (m.role ? [m.role] : []);
        return roles.includes('operations_manager');
      });
      
      if (opsManager) {
        matchedManager = opsManager;
        routingReason = `Supplier email: ${supplier.name}`;
        routingConfidence = 90;
        console.log(`✅ Priority 4 Match (Supplier): ${opsManager.name}`);
        break;
      }
    }
  }
}

// ─────────────────────────────────────────────────────────
// FALLBACK: Default to first manager or "Unassigned"
// ─────────────────────────────────────────────────────────
if (!matchedManager) {
  if (managers.length > 0) {
    // Default to first manager (usually owner/primary contact)
    matchedManager = managers[0];
    routingReason = 'Default routing (no specific match)';
    routingConfidence = 30;
    console.log(`⚠️ Fallback Match: ${matchedManager.name} (default)`);
  } else {
    // No managers configured - route to generic "Unassigned"
    matchedManager = {
      name: 'Unassigned',
      email: null,
      roles: []
    };
    routingReason = 'No managers configured';
    routingConfidence = 0;
    console.log('⚠️ No managers configured - routing to Unassigned');
  }
}

// ═══════════════════════════════════════════════════════════
// OUTPUT: Enhanced classification with routing decision
// ═══════════════════════════════════════════════════════════

return {
  json: {
    ...classification,
    
    // Manager routing result
    matched_manager: matchedManager,
    
    // Routing metadata
    routing_decision: {
      manager_name: matchedManager?.name,
      manager_email: matchedManager?.email,
      matched_roles: Array.isArray(matchedManager?.roles) 
        ? matchedManager.roles 
        : (matchedManager?.role ? [matchedManager.role] : []),
      routing_reason: routingReason,
      routing_confidence: routingConfidence,
      timestamp: new Date().toISOString()
    },
    
    // For label application (use manager folder)
    manager_folder: matchedManager?.name ? `MANAGER/${matchedManager.name}` : 'MANAGER/Unassigned',
    
    // Pass through original classification
    primary_category: classification.primary_category,
    secondary_category: classification.secondary_category,
    tertiary_category: classification.tertiary_category,
    confidence: classification.confidence,
    ai_can_reply: classification.ai_can_reply,
    summary: classification.summary
  }
};
```

---

## 📋 TEAM_CONFIG Injection

### **Deploy-n8n Edge Function Must Inject:**

```typescript
// supabase/functions/deploy-n8n/index.ts

// Build TEAM_CONFIG object
const teamConfig = {
  managers: profile.client_config?.team?.managers || [],
  suppliers: profile.client_config?.team?.suppliers || []
};

// Add to replacements
replacements['<<<TEAM_CONFIG>>>'] = JSON.stringify(teamConfig);
```

**Example TEAM_CONFIG:**
```json
{
  "managers": [
    {
      "name": "Mark Johnson",
      "email": "mark@personal.com",
      "roles": ["sales_manager", "owner"]
    },
    {
      "name": "Sarah Williams",
      "email": "",
      "roles": ["service_manager"]
    }
  ],
  "suppliers": [
    {
      "name": "Pool Supply Co",
      "email": "orders@poolsupply.com",
      "domain": "poolsupply.com"
    }
  ]
}
```

---

## 🎯 Updated Workflow Connection

### **New Node Placement:**

```json
{
  "id": "route-to-manager",
  "name": "Route to Manager",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [-100, 2736],  // Between "Apply Gmail Labels" and "Can AI Reply?"
  "parameters": {
    "mode": "runOnceForEachItem",
    "jsCode": "// [Full routing code from above]"
  }
}
```

### **Updated Connections:**

```json
"Apply Gmail Labels": {
  "main": [[
    {
      "node": "Route to Manager",  // ← NEW
      "type": "main",
      "index": 0
    },
    {
      "node": "Calculate Performance Metrics",
      "type": "main",
      "index": 0
    }
  ]]
},

"Route to Manager": {  // ← NEW NODE
  "main": [[
    {
      "node": "Can AI Reply?",
      "type": "main",
      "index": 0
    }
  ]]
},

"Can AI Reply?": {
  // ... (rest stays the same)
}
```

---

## 🧪 Example Routing Scenarios

### **Scenario 1: Name Mentioned**
```
Email: "I need to speak with Mark about pricing"
Classification: SALES > GeneralInquiry (85%)

Routing Decision:
✅ matched_manager: "Mark Johnson"
✅ routing_reason: "Name mentioned: Mark"
✅ routing_confidence: 100%
✅ Forward to: mark@personal.com
```

### **Scenario 2: Category Match**
```
Email: "I need a quote for a new hot tub installation"
Classification: SALES > NewInquiry (92%)

Routing Decision:
✅ matched_manager: "Mark Johnson" (has sales_manager role)
✅ routing_reason: "Category match: SALES → sales_manager"
✅ routing_confidence: 80%
✅ Forward to: mark@personal.com
```

### **Scenario 3: Content Analysis (MANAGER)**
```
Email: "Can we get a better price from our chemical supplier?"
Classification: MANAGER > Operations (88%)

Routing Decision:
✅ matched_manager: "Sarah Williams" (has operations_manager role)
✅ routing_reason: "MANAGER content analysis: vendor, supplier, price"
✅ routing_confidence: 65%
✅ Forward to: (no email - labeled only)
```

### **Scenario 4: Supplier Email**
```
Email from: orders@poolsupply.com
Subject: "Your order #12345 has shipped"
Classification: SUPPLIERS > OrderUpdate (95%)

Routing Decision:
✅ matched_manager: "Sarah Williams" (operations_manager)
✅ routing_reason: "Supplier email: Pool Supply Co"
✅ routing_confidence: 90%
✅ Forward to: (no email - labeled only)
```

### **Scenario 5: No Match (Fallback)**
```
Email: "Random inquiry with no clear category or name"
Classification: MISC > General (60%)

Routing Decision:
⚠️ matched_manager: "Mark Johnson" (first/default manager)
⚠️ routing_reason: "Default routing (no specific match)"
⚠️ routing_confidence: 30%
✅ Forward to: mark@personal.com
```

---

## 📊 Routing Decision Metadata

### **Output Format:**

```javascript
{
  // Original classification
  "primary_category": "SALES",
  "secondary_category": "NewInquiry",
  "confidence": 0.92,
  "ai_can_reply": true,
  
  // NEW: Manager routing
  "matched_manager": {
    "name": "Mark Johnson",
    "email": "mark@personal.com",
    "roles": ["sales_manager", "owner"]
  },
  
  // NEW: Routing metadata
  "routing_decision": {
    "manager_name": "Mark Johnson",
    "manager_email": "mark@personal.com",
    "matched_roles": ["sales_manager", "owner"],
    "routing_reason": "Category match: SALES → sales_manager",
    "routing_confidence": 80,
    "timestamp": "2025-10-29T12:34:56.789Z"
  },
  
  // NEW: For label application
  "manager_folder": "MANAGER/Mark Johnson"
}
```

---

## ✅ Benefits

1. **✅ Intelligent Routing**: Matches emails to the right manager automatically
2. **✅ Multi-Factor Decision**: Name > Category > Content > Supplier > Default
3. **✅ Confidence Scoring**: Know how certain the routing decision is
4. **✅ Audit Trail**: Full routing metadata for debugging
5. **✅ Graceful Fallback**: Always routes somewhere (never fails)
6. **✅ Supplier Awareness**: Automatically routes vendor emails to operations
7. **✅ Multi-Role Support**: Managers can handle multiple responsibilities

---

## 🚀 Deployment Checklist

- [ ] Add "Route to Manager" code node to templates
- [ ] Update deploy-n8n to inject <<<TEAM_CONFIG>>>
- [ ] Update workflow connections
- [ ] Test with name mentions
- [ ] Test with category-based routing
- [ ] Test with MANAGER content analysis
- [ ] Test with supplier emails
- [ ] Test fallback behavior
- [ ] Verify routing_decision metadata is logged

---

**This is the critical missing piece!** Without it, emails are forwarded randomly. With it, intelligent routing happens automatically. 🎯


