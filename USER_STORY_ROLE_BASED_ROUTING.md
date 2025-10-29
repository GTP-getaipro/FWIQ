# User Story: Role-Based Manager Routing

## 📋 User Story

**As a** business owner setting up FloWorx  
**I want to** assign specific roles to each team member  
**So that** AI can intelligently route emails based on both name mentions AND role responsibilities

---

## 🎯 Acceptance Criteria

### **AC1: Enhanced Team Setup Page**

**Given** I'm on the Team Setup page (Onboarding Step 3)  
**When** I add a team member  
**Then** I should see:
- ✅ Name input field (existing)
- ✅ Email input field (existing)
- ✅ **NEW:** Role dropdown with predefined options
- ✅ **NEW:** Role description tooltip explaining routing behavior

**Role Options:**
```
- Sales Manager
- Service Manager
- Support Lead
- Operations Manager
- Owner/CEO
- Technician
- Customer Service Rep
- Parts Coordinator
- Custom Role (enter manually)
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│ Team Member #1                                      │
├─────────────────────────────────────────────────────┤
│ Name:  [Mark Johnson            ]                   │
│ Email: [mark@hottubman.ca       ]                   │
│ Role:  [▼ Sales Manager         ] ℹ️               │
│        └─ Handles quotes, new leads, pricing        │
├─────────────────────────────────────────────────────┤
│ [X Remove]                                          │
└─────────────────────────────────────────────────────┘
```

---

### **AC2: Name-Based Routing**

**Given** a customer email mentions a team member by name  
**When** AI processes the email  
**Then** AI should:
- ✅ Detect the name mention (e.g., "Mark said...")
- ✅ Route to that manager's folder (MANAGER/Mark Johnson/)
- ✅ Set routing_reason: "name_mentioned"
- ✅ Reply with: "We'll make sure the right person follows up on that"

**Example:**
```
Email: "My sales rep Mark mentioned I'd get 10% off. Can you confirm?"

AI Routing Decision:
- Detected: "Mark" in email body
- Matched: Mark Johnson (Sales Manager)
- Primary Category: SALES
- Secondary Category: NewInquiry
- Route To: MANAGER/Mark Johnson/
- Reason: name_mentioned
- Reply: "We'll verify that discount and get back to you by Thursday"
```

---

### **AC3: Role-Based Routing**

**Given** a customer email has inquiry type that matches a manager role  
**When** AI processes the email  
**Then** AI should:
- ✅ Match inquiry type to manager role
- ✅ Route to appropriate manager's folder
- ✅ Set routing_reason: "role_matched"
- ✅ Reply with team-based language

**Role Routing Matrix:**
```
Email Type                  → Routes To Role        → Manager Folder
─────────────────────────────────────────────────────────────────────
SALES > NewInquiry          → Sales Manager         → MANAGER/Mark Johnson/
SALES > QuoteRequest        → Sales Manager         → MANAGER/Mark Johnson/
SUPPORT > TechnicalSupport  → Service Manager       → MANAGER/Jillian Smith/
SUPPORT > AppointmentSched  → Service Manager       → MANAGER/Jillian Smith/
SUPPORT > General           → Support Lead          → MANAGER/Sarah Williams/
URGENT > EmergencyRepair    → Service Manager       → MANAGER/Jillian Smith/
MANAGER > Unassigned        → Operations Manager    → MANAGER/Operations Manager/
```

**Example:**
```
Email: "I need a quote for a new hot tub installation"

AI Routing Decision:
- Classification: SALES > NewInquiry
- Role Match: "Sales Manager" handles quotes
- Manager: Mark Johnson (Sales Manager)
- Route To: MANAGER/Mark Johnson/
- Reason: role_matched
- Reply: "We'll get you a detailed quote by Thursday"
```

---

### **AC4: AI Classifier Enhancement**

**Given** managers have assigned roles  
**When** deploying N8N workflow  
**Then** AI system message should include:

```typescript
### Team Structure & Routing Rules:

**Sales Team:**
- Mark Johnson (Sales Manager) - mark@hottubman.ca
  → Handles: New inquiries, quotes, pricing, product questions
  → Route: SALES category emails, mentions of "Mark", "sales rep"

**Service Team:**
- Jillian Smith (Service Manager) - jillian@hottubman.ca
  → Handles: Repairs, appointments, technical support, service scheduling
  → Route: SUPPORT category emails, URGENT issues, mentions of "Jillian", "service"

**Support Team:**
- Sarah Williams (Support Lead) - sarah@hottubman.ca
  → Handles: General inquiries, parts orders, water chemistry help
  → Route: SUPPORT > General, mentions of "Sarah", "support"

### Routing Priority:
1. If email explicitly mentions a team member name → Route to that person's folder
2. If email category matches a role → Route to role holder's folder
3. If multiple matches → Route to primary category match
4. If no match → Route to MANAGER/Unassigned/
```

---

### **AC5: Role-Specific Descriptions (AI Training)**

**Given** each role has specific responsibilities  
**When** AI is deciding routing  
**Then** AI should have role descriptions for intelligent matching:

```typescript
const ROLE_DESCRIPTIONS = {
  "Sales Manager": {
    handles: ["New inquiries", "Quotes", "Pricing", "Product information", "New spa sales"],
    keywords: ["price", "quote", "how much", "buy", "purchase", "new hot tub", "models"],
    categories: ["SALES"],
    description: "Routes all sales-related inquiries, pricing requests, and new customer leads"
  },
  
  "Service Manager": {
    handles: ["Repairs", "Appointments", "Service scheduling", "Technical support", "Emergency issues"],
    keywords: ["repair", "fix", "broken", "not working", "appointment", "schedule", "service call"],
    categories: ["SUPPORT", "URGENT"],
    description: "Routes service requests, repair appointments, and emergency issues"
  },
  
  "Support Lead": {
    handles: ["General questions", "Parts orders", "Water chemistry", "Product advice", "How-to help"],
    keywords: ["help", "question", "how do I", "advice", "parts", "chemicals", "filter"],
    categories: ["SUPPORT > General", "SUPPORT > PartsAndChemicals"],
    description: "Routes general support inquiries and product usage questions"
  },
  
  "Operations Manager": {
    handles: ["Vendor communications", "Internal operations", "Business admin", "Unassigned emails"],
    keywords: ["vendor", "supplier", "internal", "business"],
    categories: ["MANAGER", "SUPPLIERS", "MISC"],
    description: "Routes vendor emails, internal communications, and unclassified items"
  }
};
```

---

### **AC6: Remove Primary Contact from Business Info Page**

**Given** managers now have full context (name + role + email)  
**When** user completes Team Setup  
**Then** Business Information page should:
- ✅ Remove "Primary Contact Name" field
- ✅ Remove "Primary Contact Role" field
- ✅ Keep "Primary Contact Email" for account/billing purposes
- ✅ Keep "After-Hours Phone" for emergencies
- ✅ Auto-populate "Default Escalation Manager" from Team Setup

**Before (Business Info Page):**
```
Primary Contact Section:
- Primary Contact Name: [___________]
- Primary Contact Role: [___________]
- Primary Contact Email: [___________]
- After-Hours Phone: [___________]
```

**After (Simplified):**
```
Contact Information:
- Billing/Account Email: [___________] (auto-filled from signup)
- After-Hours Emergency Phone: [___________]
- Default Escalation Manager: [▼ Auto-selected from Team Setup]
```

---

### **AC7: Intelligent Escalation Default**

**Given** user has added managers with roles  
**When** system sets default escalation manager  
**Then** it should prioritize:
1. Service Manager (for operational issues)
2. Operations Manager (if no service manager)
3. First manager in list (if neither exists)

```typescript
function getDefaultEscalationManager(managers) {
  // Priority 1: Service Manager
  const serviceManager = managers.find(m => 
    m.role?.toLowerCase().includes('service')
  );
  if (serviceManager) return serviceManager.name;
  
  // Priority 2: Operations Manager
  const opsManager = managers.find(m => 
    m.role?.toLowerCase().includes('operations')
  );
  if (opsManager) return opsManager.name;
  
  // Priority 3: First manager
  return managers[0]?.name || 'Management';
}
```

---

## 🔄 Complete User Flow

### **Step 1: Team Setup (Enhanced)**

**User Action:**
```
1. Click "Add Team Member"
2. Enter: "Mark Johnson"
3. Enter: "mark@hottubman.ca"
4. Select from dropdown: "Sales Manager"
5. See tooltip: "Handles quotes, new leads, pricing inquiries"
6. Click "Add Another"
7. Enter: "Jillian Smith"
8. Enter: "jillian@hottubman.ca"
9. Select: "Service Manager"
10. See tooltip: "Handles repairs, appointments, technical support"
```

**System Result:**
```javascript
managers: [
  { 
    name: "Mark Johnson", 
    email: "mark@hottubman.ca", 
    role: "Sales Manager",
    responsibilities: "Handles quotes, new leads, pricing inquiries"
  },
  { 
    name: "Jillian Smith", 
    email: "jillian@hottubman.ca", 
    role: "Service Manager",
    responsibilities: "Handles repairs, appointments, technical support"
  }
]
```

---

### **Step 2: Business Information (Simplified)**

**User Sees:**
```
Contact Information:
- Billing Email: mark@hottubman.ca ✅ (auto-filled)
- After-Hours Phone: (403) 555-0123
- Emergency Escalation: [▼ Jillian Smith (Service Manager)] ✅ (auto-selected)
```

**No longer asks for:**
- ❌ Primary Contact Name (redundant with managers)
- ❌ Primary Contact Role (redundant with managers)

---

### **Step 3: Email Processing (Automatic)**

**Scenario A: Name Mentioned**
```
Email: "Mark said I'd get 10% off. Can you confirm?"

AI Decision:
- Detected name: "Mark" 
- Matched: Mark Johnson (Sales Manager)
- Route to: MANAGER/Mark Johnson/
- Customer sees: "We'll verify that discount and get back to you by Thursday"
```

**Scenario B: Role Matched**
```
Email: "My heater isn't working. Can someone come fix it?"

AI Decision:
- Classification: SUPPORT > TechnicalSupport
- Role match: Service Manager handles repairs
- Route to: MANAGER/Jillian Smith/
- Customer sees: "We'll schedule a technician to diagnose the issue"
```

**Scenario C: Urgent Escalation**
```
Email: "URGENT: Water leaking everywhere!" (sent at 10 PM)

AI Decision:
- Classification: URGENT > LeakEmergency
- Escalation: Service Manager (Jillian)
- Notification sent to: jillian@hottubman.ca
- Route to: MANAGER/Jillian Smith/
- Customer sees: "This is urgent! Call our emergency line at (403) 555-0123 immediately"
```

---

## 🎨 UI Design Mockup

### **Enhanced Team Setup Page:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 👥 Team Setup                                                   │
│                                                                 │
│ Add team members for smart email routing and organization      │
│                                                                 │
│ ℹ️ Benefits:                                                    │
│ • Emails automatically organized by role                        │
│ • AI routes sales/service/support to right person              │
│ • Urgent issues escalated to appropriate manager               │
│ • Customers see "The Hot Tub Man Team" (not individual names)  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Team Member #1                                              ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Name:  [Mark Johnson                    ]                   ││
│ │ Email: [mark@hottubman.ca               ]                   ││
│ │ Role:  [▼ Sales Manager                 ] ℹ️               ││
│ │        └─ Handles: Quotes, new leads, pricing inquiries     ││
│ │           Routes: SALES category emails                     ││
│ │                                                              ││
│ │ [X Remove Team Member]                                      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Team Member #2                                              ││
│ ├─────────────────────────────────────────────────────────────┤│
│ │ Name:  [Jillian Smith                   ]                   ││
│ │ Email: [jillian@hottubman.ca            ]                   ││
│ │ Role:  [▼ Service Manager               ] ℹ️               ││
│ │        └─ Handles: Repairs, appointments, emergencies       ││
│ │           Routes: SUPPORT & URGENT emails                   ││
│ │                                                              ││
│ │ [X Remove Team Member]                                      ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [+ Add Team Member]                                            │
│                                                                 │
│ 📁 Email Folder Preview:                                       │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ MANAGER/                                                   │ │
│ │   ├── Mark Johnson/ (Sales Manager)                        │ │
│ │   │   └── All sales inquiries and quotes                   │ │
│ │   ├── Jillian Smith/ (Service Manager)                     │ │
│ │   │   └── All service requests and urgent issues           │ │
│ │   └── Unassigned/                                          │ │
│ │       └── General emails not matching any role             │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [Skip - I'm a solo business] [Save & Continue]                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### **AC2: AI Classifier Name Detection**

**Given** an email mentions a team member's name  
**When** AI processes the email  
**Then** AI should:

```typescript
### Team Member Name Detection:

**Mark Johnson** (Sales Manager)
- Detection triggers: "Mark", "Mark Johnson", "my sales rep Mark"
- Routes to: MANAGER/Mark Johnson/
- Also routes if: Email classified as SALES (role match)

**Jillian Smith** (Service Manager)  
- Detection triggers: "Jillian", "Jillian Smith", "service manager", "the technician"
- Routes to: MANAGER/Jillian Smith/
- Also routes if: Email classified as SUPPORT or URGENT

**Sarah Williams** (Support Lead)
- Detection triggers: "Sarah", "Sarah Williams", "support team"
- Routes to: MANAGER/Sarah Williams/
- Also routes if: Email classified as SUPPORT > General
```

**AI System Message Injection:**
```
### Routing Logic:

1. **Check for name mentions first:**
   - Email contains "Mark" or "Mark Johnson" → Route to Mark's folder
   - Email contains "Jillian" or "Jillian Smith" → Route to Jillian's folder

2. **If no name mentioned, route by role:**
   - SALES category → Route to Sales Manager (Mark Johnson)
   - SUPPORT > TechnicalSupport → Route to Service Manager (Jillian Smith)
   - SUPPORT > General → Route to Support Lead (Sarah Williams)

3. **If no role match:**
   - Route to MANAGER/Unassigned/
```

---

### **AC3: AI Classifier Role-Based Intelligence**

**Given** AI receives email classification request  
**When** email is about sales inquiry  
**Then** AI should:
- ✅ Classify as: SALES > NewInquiry
- ✅ Match role: "Sales Manager handles new inquiries"
- ✅ Route to: Mark Johnson's folder
- ✅ Log decision: "Routed to Sales Manager based on SALES classification"

**AI Decision Tree:**
```
Email arrives: "How much for a 6-person hot tub?"

Step 1: Classify
→ Primary: SALES
→ Secondary: NewInquiry
→ Confidence: 0.95

Step 2: Match to Role
→ SALES category = Sales Manager role
→ Sales Manager = Mark Johnson
→ Route to: MANAGER/Mark Johnson/

Step 3: Reply
→ "We'll get you a detailed quote by Thursday with pricing and options"
→ Customer sees: Team-based language (no "Mark" mentioned)
→ Mark sees: Email in his folder with role-matched routing
```

---

### **AC4: Simplified Business Information Page**

**Given** managers are configured with roles in Team Setup  
**When** user reaches Business Information page  
**Then** page should:
- ✅ Remove "Primary Contact Name" field (redundant)
- ✅ Remove "Primary Contact Role" field (redundant)
- ✅ Keep "Billing Email" (auto-filled from auth.user.email)
- ✅ Auto-populate "Default Escalation Manager" dropdown from Team Setup
- ✅ Show which manager was auto-selected and why

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Contact & Emergency Information                                 │
├─────────────────────────────────────────────────────────────────┤
│ Billing/Account Email: mark@hottubman.ca ✅ (from your login)  │
│                                                                 │
│ After-Hours Emergency Phone: [(403) 555-0123       ]           │
│                                                                 │
│ Default Escalation Manager: [▼ Jillian Smith      ] ✅         │
│                             (Service Manager)                   │
│                                                                 │
│ ℹ️ Auto-selected: Service Manager handles most urgent issues   │
│    You can change this if needed.                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### **AC5: Database Schema Update**

**Given** managers now have roles  
**When** saving team setup  
**Then** database should store:

```javascript
profiles.managers = [
  {
    name: "Mark Johnson",
    email: "mark@hottubman.ca",
    role: "Sales Manager",
    role_type: "sales",  // Normalized for matching
    responsibilities: "Handles quotes, new leads, pricing inquiries",
    routing_keywords: ["price", "quote", "buy", "purchase"],
    routing_categories: ["SALES"]
  },
  {
    name: "Jillian Smith",
    email: "jillian@hottubman.ca",
    role: "Service Manager",
    role_type: "service",
    responsibilities: "Handles repairs, appointments, technical support",
    routing_keywords: ["repair", "fix", "broken", "appointment"],
    routing_categories: ["SUPPORT", "URGENT"]
  }
]
```

---

## 🔧 Technical Implementation

### **Frontend Changes:**

#### **1. Enhanced Team Setup Component**
**File:** `src/pages/onboarding/StepTeamSetup.jsx`

```jsx
const ROLE_OPTIONS = [
  {
    value: 'sales_manager',
    label: 'Sales Manager',
    description: 'Handles quotes, new leads, pricing inquiries',
    routes: ['SALES'],
    keywords: ['price', 'quote', 'buy', 'purchase']
  },
  {
    value: 'service_manager',
    label: 'Service Manager',
    description: 'Handles repairs, appointments, emergencies',
    routes: ['SUPPORT', 'URGENT'],
    keywords: ['repair', 'fix', 'broken', 'appointment']
  },
  {
    value: 'support_lead',
    label: 'Support Lead',
    description: 'Handles general questions, parts, water chemistry',
    routes: ['SUPPORT > General', 'SUPPORT > PartsAndChemicals'],
    keywords: ['help', 'question', 'parts', 'chemicals']
  },
  {
    value: 'operations_manager',
    label: 'Operations Manager',
    description: 'Handles vendors, internal ops, unclassified emails',
    routes: ['MANAGER', 'SUPPLIERS', 'MISC'],
    keywords: ['vendor', 'supplier', 'internal']
  },
  {
    value: 'owner',
    label: 'Owner/CEO',
    description: 'Receives escalations and high-priority issues',
    routes: ['URGENT', 'MANAGER'],
    keywords: ['owner', 'boss', 'ceo']
  },
  {
    value: 'custom',
    label: 'Custom Role',
    description: 'Define your own role',
    routes: [],
    keywords: []
  }
];

// Component
{managers.map((manager, index) => (
  <div key={index} className="border p-4 rounded-lg">
    <Input 
      placeholder="Name"
      value={manager.name}
      onChange={(e) => updateManager(index, 'name', e.target.value)}
    />
    <Input 
      placeholder="Email"
      value={manager.email}
      onChange={(e) => updateManager(index, 'email', e.target.value)}
    />
    <CustomDropdown
      value={manager.role}
      onChange={(val) => updateManager(index, 'role', val)}
      options={ROLE_OPTIONS}
      placeholder="Select role"
    />
    {manager.role && (
      <p className="text-xs text-gray-500 mt-2">
        {ROLE_OPTIONS.find(r => r.value === manager.role)?.description}
      </p>
    )}
  </div>
))}
```

---

#### **2. Simplified Business Info Page**
**File:** `src/pages/onboarding/StepBusinessInformation.jsx`

```jsx
// REMOVE these fields:
// - primaryContactName
// - primaryContactRole

// KEEP these fields:
const [values, setValues] = useState({
  // ... other fields
  primaryContactEmail: user.email, // Auto-filled from auth
  afterHoursPhone: '',
  defaultEscalationManager: '' // Auto-populated from managers
});

// Auto-populate escalation manager
useEffect(() => {
  if (managers.length > 0) {
    const defaultManager = getDefaultEscalationManager(managers);
    setValues(prev => ({
      ...prev,
      defaultEscalationManager: defaultManager
    }));
  }
}, [managers]);
```

---

### **Backend Changes:**

#### **3. Enhanced AI Classifier Injection**
**File:** `supabase/functions/deploy-n8n/index.ts`

```typescript
// Build role-based routing rules
function buildRoleBasedRoutingRules(managers) {
  if (!managers || managers.length === 0) {
    return 'No team members configured - all emails route to general folders';
  }
  
  const rules = managers.map(manager => {
    const roleConfig = getRoleConfiguration(manager.role);
    
    return `
**${manager.name}** (${manager.role}) - ${manager.email}
→ Handles: ${roleConfig.handles.join(', ')}
→ Routes when:
  • Email mentions "${manager.name}" or "${manager.name.split(' ')[0]}"
  • Email classified as: ${roleConfig.categories.join(' or ')}
  • Email contains keywords: ${roleConfig.keywords.slice(0, 5).join(', ')}
→ Folder: MANAGER/${manager.name}/
`;
  }).join('\n');
  
  return `
### Team Structure & Intelligent Routing:

${rules}

### Routing Priority:
1. Name mention (highest priority) - "Mark said..." → Mark's folder
2. Role + category match - SALES email → Sales Manager's folder
3. Category only - SUPPORT email → Best matching role
4. No match - MANAGER/Unassigned/
`;
}

// Inject into AI system message
const teamRoutingRules = buildRoleBasedRoutingRules(clientData.managers);

'<<<TEAM_ROUTING_RULES>>>': teamRoutingRules
```

---

#### **4. Name Detection in AI Classifier**
**Add to AI system message:**

```typescript
### Name-Based Routing (Highest Priority):

Scan email body and subject for these name mentions:
${managers.map(m => `- "${m.name}" or "${m.name.split(' ')[0]}" → Route to MANAGER/${m.name}/`).join('\n')}

If a customer writes "Mark said..." or "I spoke with Jillian":
1. Extract the name
2. Route to that person's folder
3. Tag with routing_reason: "name_mentioned"
4. Reply: "We'll make sure to follow up on that"
```

---

## 📊 Data Structure Changes

### **Current Structure:**
```javascript
managers: [
  { name: "Mark Johnson", email: "mark@hottubman.ca" }
]
```

### **Enhanced Structure:**
```javascript
managers: [
  {
    name: "Mark Johnson",
    email: "mark@hottubman.ca",
    role: "Sales Manager",
    role_type: "sales",  // Normalized for AI matching
    responsibilities: "Handles quotes, new leads, pricing inquiries",
    routing_config: {
      categories: ["SALES"],
      keywords: ["price", "quote", "how much", "buy", "purchase"],
      name_triggers: ["Mark", "Mark Johnson", "sales rep"]
    }
  }
]
```

---

## 🎯 Benefits

### **For Users (Business Owners):**
✅ Simpler onboarding (fewer redundant fields on Business Info page)  
✅ Clear role assignment (dropdown vs free text)  
✅ Visual folder structure preview  
✅ Intelligent email organization  

### **For AI Routing:**
✅ Name detection ("Mark said...")  
✅ Role-based routing (SALES → Sales Manager)  
✅ Keyword matching (enhanced accuracy)  
✅ Escalation priority (Service Manager for urgent)  

### **For Customers:**
✅ Professional team-based replies  
✅ No confusion about who's who  
✅ Consistent "The Hot Tub Man Team" branding  
✅ Right person handles their issue (behind the scenes)  

---

## 🧪 Test Scenarios

### **Test 1: Name Mention Routing**
```
Email: "Mark mentioned I'd get a discount on accessories"

Expected:
- Detected: "Mark"
- Matched: Mark Johnson (Sales Manager)
- Classification: SALES > AccessorySales
- Route: MANAGER/Mark Johnson/
- Reply: "We'll confirm that accessory discount and get back to you"
- Logging: routing_reason = "name_mentioned", matched_manager = "Mark Johnson"
```

### **Test 2: Role-Based Routing**
```
Email: "I need to schedule a service appointment"

Expected:
- No name detected
- Classification: SUPPORT > AppointmentScheduling
- Role match: Service Manager handles appointments
- Route: MANAGER/Jillian Smith/
- Reply: "We'll call you to schedule your service visit"
- Logging: routing_reason = "role_matched", matched_role = "Service Manager"
```

### **Test 3: Multiple Managers Same Role**
```
Setup: 
- Mark Johnson (Sales Manager)
- Tom Brown (Sales Manager)

Email: "I want to buy a new hot tub"

Expected:
- Classification: SALES > NewInquiry
- Multiple matches: 2 Sales Managers
- Route: Round-robin to Mark (first in list) OR least loaded
- Reply: "We'll get you a quote by Thursday"
- Logging: routing_reason = "role_matched", selected_manager = "Mark Johnson", selection_method = "round_robin"
```

### **Test 4: Urgent Escalation**
```
Email: "URGENT: Hot tub is leaking water everywhere!"

Expected:
- Classification: URGENT > LeakEmergency
- Role match: Service Manager handles emergencies
- Route: MANAGER/Jillian Smith/
- Escalation: Send email notification to jillian@hottubman.ca
- Reply: "This is urgent! Call our emergency line at (403) 555-0123 immediately"
- Logging: routing_reason = "urgent_escalation", notified_manager = "Jillian Smith"
```

### **Test 5: No Manager Match**
```
Email: "General question about water chemistry"

Setup: No Support Lead configured

Expected:
- Classification: SUPPORT > General
- No role match found
- Route: MANAGER/Unassigned/
- Reply: "Our team will review your water chemistry question and get back to you"
- Logging: routing_reason = "no_role_match", routed_to = "Unassigned"
```

---

## 📋 Definition of Done

### **Frontend:**
- [ ] Team Setup page has role dropdowns
- [ ] Role options with descriptions
- [ ] Folder structure preview
- [ ] "Skip for solo business" button
- [ ] Auto-populate escalation manager on Business Info page
- [ ] Remove redundant Primary Contact fields

### **Backend:**
- [ ] `buildRoleBasedRoutingRules()` function
- [ ] Name detection in AI classifier
- [ ] Role-to-category mapping
- [ ] Enhanced manager data structure
- [ ] Escalation auto-selection logic

### **AI System Messages:**
- [ ] Team routing rules section
- [ ] Name detection instructions
- [ ] Role-based routing priority
- [ ] Fallback to Unassigned logic

### **Testing:**
- [ ] Name mention detection works
- [ ] Role-based routing works
- [ ] Multiple managers with same role handled
- [ ] Urgent escalation notifications sent
- [ ] Unassigned folder catches unmatched emails
- [ ] Customer replies never mention names

---

## 📝 User Story Summary

**As a** business owner  
**I want to** assign roles to my team members  
**So that** emails are intelligently routed to the right person based on both name mentions AND role responsibilities

**Acceptance:** 
- ✅ Sales emails go to Sales Manager
- ✅ Service emails go to Service Manager  
- ✅ "Mark said..." emails go to Mark's folder
- ✅ Urgent issues escalate to Service Manager
- ✅ No redundant Primary Contact fields
- ✅ Customers never see individual names

**Priority:** HIGH  
**Effort:** Medium (3-5 days)  
**Impact:** High (much smarter routing + simplified onboarding)

---

**Ready to implement this enhancement?** 🚀

