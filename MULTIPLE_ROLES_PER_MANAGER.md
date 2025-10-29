# Multiple Roles Per Manager - Enhanced Design

## 🎯 Feature: One Manager, Multiple Roles

**Use Case:** In small businesses, one person often handles multiple responsibilities.

**Example:**
- Mark Johnson → Sales Manager + Operations Manager
- Sarah Williams → Service Manager + Support Lead + Owner

---

## 📊 UI Design (Multi-Select)

### **Enhanced Team Setup Page:**

```
┌──────────────────────────────────────────────────────────────────┐
│ 👥 Team Member #1                                                │
├──────────────────────────────────────────────────────────────────┤
│ Name:  [Mark Johnson                               ]             │
│ Email: [mark@hottubman.ca                          ]             │
│                                                                  │
│ Roles (Select all that apply): ℹ️                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ☑ Sales Manager                                            │  │
│ │   └─ Handles quotes, new leads, pricing inquiries          │  │
│ │                                                             │  │
│ │ ☑ Operations Manager                                       │  │
│ │   └─ Handles vendors, internal ops, hiring                 │  │
│ │                                                             │  │
│ │ ☐ Service Manager                                          │  │
│ │   └─ Handles repairs, appointments, emergencies            │  │
│ │                                                             │  │
│ │ ☐ Support Lead                                             │  │
│ │   └─ Handles general questions, parts, how-to help         │  │
│ │                                                             │  │
│ │ ☐ Owner/CEO                                                │  │
│ │   └─ Handles strategic, legal, high-priority issues        │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ 📋 Mark's Responsibilities:                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ✅ Sales Manager                                            │  │
│ │    • Quotes and pricing inquiries                           │  │
│ │    • New hot tub sales leads                                │  │
│ │    • Product information requests                           │  │
│ │                                                             │  │
│ │ ✅ Operations Manager                                       │  │
│ │    • Vendor relationship management                         │  │
│ │    • Supplier communications                                │  │
│ │    • Hiring and recruitment                                 │  │
│ │    • Internal operations                                    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ 📁 Email Routing for Mark:                                       │
│    • SALES category emails → Mark's folder                       │
│    • MANAGER emails about vendors → Mark's folder                │
│    • MANAGER emails about hiring → Mark's folder                 │
│    • Any mention of "Mark" → Mark's folder                       │
│                                                                  │
│ [X Remove Team Member]                                           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 👥 Team Member #2                                                │
├──────────────────────────────────────────────────────────────────┤
│ Name:  [Sarah Williams                             ]             │
│ Email: [sarah@hottubman.ca                         ]             │
│                                                                  │
│ Roles (Select all that apply): ℹ️                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ☐ Sales Manager                                            │  │
│ │ ☑ Service Manager                                          │  │
│ │ ☑ Support Lead                                             │  │
│ │ ☐ Operations Manager                                       │  │
│ │ ☑ Owner/CEO                                                │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ 📋 Sarah's Responsibilities:                                     │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ✅ Service Manager + Support Lead + Owner/CEO               │  │
│ │    → "Wears all hats" - handles most operational work      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ 📁 Email Routing for Sarah:                                      │
│    • SUPPORT category emails → Sarah's folder                    │
│    • URGENT category emails → Sarah's folder                     │
│    • MANAGER complaints → Sarah's folder (Service Manager role)  │
│    • MANAGER strategic → Sarah's folder (Owner role)             │
│    • Any mention of "Sarah" → Sarah's folder                     │
│                                                                  │
│ [X Remove Team Member]                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structure (Multiple Roles)

### **Database Schema:**

```javascript
profiles.managers = [
  {
    name: "Mark Johnson",
    email: "mark@hottubman.ca",
    roles: [                          // ← ARRAY instead of single string
      "Sales Manager",
      "Operations Manager"
    ],
    role_types: [                     // ← Normalized for matching
      "sales_manager",
      "operations_manager"
    ],
    combined_responsibilities: "Handles quotes, new leads, pricing, vendor relationships, hiring, internal operations",
    routing_config: {
      categories: ["SALES", "MANAGER"],
      keywords: [...salesKeywords, ...operationsKeywords],
      name_triggers: ["Mark", "Mark Johnson", "sales rep", "operations"]
    }
  },
  {
    name: "Sarah Williams",
    email: "sarah@hottubman.ca",
    roles: [
      "Service Manager",
      "Support Lead",
      "Owner/CEO"
    ],
    role_types: [
      "service_manager",
      "support_lead",
      "owner"
    ],
    combined_responsibilities: "Handles repairs, support, complaints, escalations, strategic decisions",
    routing_config: {
      categories: ["SUPPORT", "URGENT", "MANAGER"],
      keywords: [...serviceKeywords, ...supportKeywords, ...ownerKeywords],
      name_triggers: ["Sarah", "Sarah Williams", "owner", "boss"]
    }
  }
]
```

---

## 🧠 Enhanced Routing Logic

### **Scenario 1: Vendor Email (Multiple Role Holders)**

**Setup:**
- Mark Johnson: Sales Manager + Operations Manager
- Sarah Williams: Service Manager + Owner

**Email:**
```
"We're a hot tub parts supplier. Interested in becoming a vendor for your business."
```

**AI Analysis:**
```
Category: MANAGER
No name mentioned
Keywords detected: "supplier", "vendor"

Role matching:
┌─────────────────────────────────────────────────┐
│ Mark Johnson                                    │
│ ✅ Operations Manager → "vendor" (3 keywords)   │
│ ❌ Sales Manager → 0 keywords                   │
│ Score: 3.0                                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Sarah Williams                                  │
│ ❌ Service Manager → 0 keywords                 │
│ ❌ Support Lead → 0 keywords                    │
│ ❌ Owner → "business" (1 keyword)               │
│ Score: 0.9                                      │
└─────────────────────────────────────────────────┘

Best Match: Mark Johnson (Score: 3.0)
Matched Role: Operations Manager
Route to: MANAGER/Mark Johnson/
Reason: "manager_role_content_match"
```

---

### **Scenario 2: Customer Complaint (Multiple Role Holders)**

**Setup:**
- Mark Johnson: Sales Manager + Operations Manager
- Sarah Williams: Service Manager + Support Lead + Owner

**Email:**
```
"I'm very disappointed with the service I received. This is unacceptable."
```

**AI Analysis:**
```
Category: MANAGER
No name mentioned
Keywords detected: "disappointed", "service", "unacceptable"

Role matching:
┌─────────────────────────────────────────────────┐
│ Mark Johnson                                    │
│ ❌ Operations Manager → 0 keywords              │
│ ❌ Sales Manager → 0 keywords                   │
│ Score: 0.0                                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Sarah Williams                                  │
│ ✅ Service Manager → "disappointed", "service"  │
│   (2 keywords × 1.2 weight) = 2.4               │
│ ❌ Support Lead → 0 keywords                    │
│ ❌ Owner → 0 keywords                           │
│ Score: 2.4                                      │
└─────────────────────────────────────────────────┘

Best Match: Sarah Williams (Score: 2.4)
Matched Role: Service Manager
Route to: MANAGER/Sarah Williams/
Escalation: Yes (complaint detected)
Reason: "manager_role_content_match"
```

---

### **Scenario 3: Strategic Partnership (Multiple Roles)**

**Email:**
```
"We're interested in discussing a potential franchise opportunity"
```

**AI Analysis:**
```
Category: MANAGER
No name mentioned
Keywords detected: "franchise", "opportunity"

Role matching:
┌─────────────────────────────────────────────────┐
│ Sarah Williams                                  │
│ ❌ Service Manager → 0 keywords                 │
│ ❌ Support Lead → 0 keywords                    │
│ ✅ Owner/CEO → "franchise" (1 keyword × 0.9)    │
│ Score: 0.9                                      │
└─────────────────────────────────────────────────┘

Best Match: Sarah Williams (Score: 0.9)
Matched Role: Owner/CEO
Route to: MANAGER/Sarah Williams/
Reason: "manager_role_content_match"
```

---

### **Scenario 4: Dual Role Match (Highest Score Wins)**

**Setup:**
- Mark: Sales Manager + Operations Manager

**Email:**
```
"We're a commercial business looking for bulk hot tub service contracts and also interested in becoming a parts supplier"
```

**AI Analysis:**
```
Keywords detected: "commercial", "bulk", "supplier"

Mark's role matching:
┌─────────────────────────────────────────────────┐
│ Sales Manager role:                             │
│ • "commercial" (weight: 1.0) = 1.0              │
│ • "bulk" (weight: 1.0) = 1.0                    │
│ Subtotal: 2.0                                   │
│                                                 │
│ Operations Manager role:                        │
│ • "supplier" (weight: 1.0) = 1.0                │
│ Subtotal: 1.0                                   │
│                                                 │
│ Combined Score: 3.0                             │
└─────────────────────────────────────────────────┘

Best Match: Mark Johnson (Total Score: 3.0)
Matched Roles: Sales Manager (2.0) + Operations Manager (1.0)
Route to: MANAGER/Mark Johnson/
Reason: "manager_multiple_roles_matched"
```

**AI logs the match detail:**
```json
{
  "routing_decision": {
    "matched_manager": "Mark Johnson",
    "total_score": 3.0,
    "matched_roles": [
      { "role": "Sales Manager", "score": 2.0, "keywords": ["commercial", "bulk"] },
      { "role": "Operations Manager", "score": 1.0, "keywords": ["supplier"] }
    ],
    "reason": "manager_multiple_roles_matched"
  }
}
```

---

## 🔧 Implementation Code

### **Frontend: Multi-Select Role Component**

**File:** `src/pages/onboarding/StepTeamSetup.jsx`

```jsx
const AVAILABLE_ROLES = [
  {
    id: 'sales_manager',
    label: 'Sales Manager',
    description: 'Handles quotes, new leads, pricing inquiries',
    icon: '💰'
  },
  {
    id: 'service_manager',
    label: 'Service Manager',
    description: 'Handles repairs, appointments, emergencies',
    icon: '🔧'
  },
  {
    id: 'operations_manager',
    label: 'Operations Manager',
    description: 'Handles vendors, internal ops, hiring',
    icon: '⚙️'
  },
  {
    id: 'support_lead',
    label: 'Support Lead',
    description: 'Handles general questions, parts, how-to help',
    icon: '💬'
  },
  {
    id: 'owner',
    label: 'Owner/CEO',
    description: 'Handles strategic, legal, high-priority issues',
    icon: '👔'
  }
];

// Component
const [managers, setManagers] = useState([
  { name: '', email: '', roles: [] }  // ← roles is array
]);

const toggleRole = (managerIndex, roleId) => {
  setManagers(prev => prev.map((mgr, idx) => {
    if (idx !== managerIndex) return mgr;
    
    const hasRole = mgr.roles.includes(roleId);
    return {
      ...mgr,
      roles: hasRole 
        ? mgr.roles.filter(r => r !== roleId)  // Remove role
        : [...mgr.roles, roleId]                // Add role
    };
  }));
};

// JSX
<div className="space-y-2">
  <Label>Roles (Select all that apply)</Label>
  <div className="border rounded-lg p-3 space-y-2">
    {AVAILABLE_ROLES.map(role => (
      <label key={role.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
        <input
          type="checkbox"
          checked={manager.roles.includes(role.id)}
          onChange={() => toggleRole(index, role.id)}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            <span>{role.icon}</span>
            <span>{role.label}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {role.description}
          </div>
        </div>
      </label>
    ))}
  </div>
  
  {manager.roles.length > 0 && (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
      <p className="text-sm font-medium text-blue-900 mb-2">
        📁 {manager.name || 'This person'}'s Email Routing:
      </p>
      <ul className="text-xs text-blue-700 space-y-1">
        {manager.roles.includes('sales_manager') && (
          <li>• SALES emails → {manager.name}'s folder</li>
        )}
        {manager.roles.includes('service_manager') && (
          <li>• SUPPORT & URGENT emails → {manager.name}'s folder</li>
        )}
        {manager.roles.includes('operations_manager') && (
          <li>• Vendor & hiring emails → {manager.name}'s folder</li>
        )}
        {manager.roles.includes('support_lead') && (
          <li>• General support emails → {manager.name}'s folder</li>
        )}
        {manager.roles.includes('owner') && (
          <li>• Strategic & legal emails → {manager.name}'s folder</li>
        )}
        <li>• Any mention of "{manager.name}" → {manager.name}'s folder</li>
      </ul>
    </div>
  )}
</div>
```

---

## 🎯 AI System Message Injection

### **Enhanced Team Context:**

```typescript
// Build team routing rules with multiple roles support
function buildRoleBasedRoutingRules(managers) {
  if (!managers || managers.length === 0) {
    return 'No team members configured';
  }
  
  const rules = managers.map(manager => {
    // Support both old (single role) and new (multiple roles) format
    const managerRoles = Array.isArray(manager.roles) 
      ? manager.roles 
      : (manager.role ? [manager.role] : []);
    
    if (managerRoles.length === 0) {
      return `**${manager.name}** - ${manager.email}\n→ No roles assigned`;
    }
    
    // Get combined routing config for all roles
    const allCategories = [];
    const allKeywords = [];
    const allHandles = [];
    
    managerRoles.forEach(role => {
      const roleConfig = getRoleConfiguration(role);
      allCategories.push(...roleConfig.categories);
      allKeywords.push(...roleConfig.keywords);
      allHandles.push(...roleConfig.handles);
    });
    
    // Remove duplicates
    const uniqueCategories = [...new Set(allCategories)];
    const uniqueKeywords = [...new Set(allKeywords)];
    const uniqueHandles = [...new Set(allHandles)];
    
    return `
**${manager.name}** - ${manager.email}
Roles: ${managerRoles.join(' + ')}
→ Handles: ${uniqueHandles.join(', ')}
→ Routes when:
  • Email mentions "${manager.name}"
  • Email classified as: ${uniqueCategories.join(' or ')}
  • Email contains keywords: ${uniqueKeywords.slice(0, 8).join(', ')}
→ Folder: MANAGER/${manager.name}/
`;
  }).join('\n');
  
  return `
### Team Structure & Intelligent Routing:

${rules}

### MANAGER Category Content-Based Routing:
When email is MANAGER category but doesn't mention a name:

1. Analyze email content for role-specific keywords
2. Score each manager based on ALL their roles
3. Route to manager with highest combined role score
4. Only use Unassigned if no managers configured

Example:
Email: "We're a supplier and interested in bulk pricing"
→ Keywords: "supplier" (Operations) + "bulk pricing" (Sales)
→ If Mark has both roles: Combined score = high → Route to Mark
→ If separate people: Route to person with higher individual score
`;
}
```

---

## 📊 Routing Examples with Multiple Roles

### **Example 1: Solo Owner Wearing All Hats**

**Setup:**
```
Sarah Williams (Owner)
├─ Sales Manager
├─ Service Manager
├─ Operations Manager
└─ Support Lead
```

**Result:** ALL emails route to Sarah's folder (she handles everything)

**Benefits:**
- ✅ Simple for solo businesses
- ✅ One person sees all business emails
- ✅ Still organized in subfolders by category
- ✅ Can add team members later without reconfiguring

---

### **Example 2: Small Team with Shared Responsibilities**

**Setup:**
```
Mark Johnson
├─ Sales Manager (primary)
└─ Operations Manager (secondary)

Sarah Williams  
├─ Service Manager (primary)
├─ Support Lead (secondary)
└─ Owner/CEO (strategic oversight)
```

**Routing:**
```
SALES emails → Mark (Sales role)
Vendor emails → Mark (Operations role)
Hiring emails → Mark (Operations role)

SUPPORT emails → Sarah (Service role)
URGENT emails → Sarah (Service role)
Complaints → Sarah (Service role)
General questions → Sarah (Support role)
Legal/strategic → Sarah (Owner role)
```

---

### **Example 3: Growing Business Specialization**

**Setup:**
```
Mark Johnson
└─ Sales Manager (focused)

Tom Wilson
└─ Operations Manager (focused)

Sarah Williams
├─ Service Manager
└─ Support Lead
```

**Routing:**
```
SALES only → Mark
Vendors/hiring only → Tom
SUPPORT/URGENT → Sarah (both roles)
```

**Benefit:** Clean separation for larger teams

---

## 🔄 Migration Path

### **Existing Users (Single Role):**
```javascript
// Old format (still supported)
{
  name: "Mark",
  role: "Sales Manager"  // ← Single string
}

// Auto-converted to:
{
  name: "Mark",
  roles: ["Sales Manager"]  // ← Array with one item
}
```

### **New Users (Multiple Roles):**
```javascript
{
  name: "Mark",
  roles: ["Sales Manager", "Operations Manager"]  // ← Array from start
}
```

---

## ✅ Benefits

### **For Solo Businesses:**
✅ One person can handle all roles  
✅ All emails route to them  
✅ No need to create fake "team members"  
✅ Can expand roles as business grows  

### **For Small Teams:**
✅ Flexible role assignment  
✅ One person can cover gaps (vacation, sick days)  
✅ Realistic reflection of how small teams work  
✅ Easy to adjust as responsibilities shift  

### **For Growing Businesses:**
✅ Can start with overlapping roles  
✅ Gradually specialize as team expands  
✅ No need to reconfigure entire system  
✅ Smooth transition from generalist to specialist  

---

## 🧪 Test Scenarios

### **Test 1: Solo Owner (All Roles)**
```
Setup: Sarah = Sales + Service + Operations + Support + Owner

Email Type        → Routes To
───────────────────────────────────────
SALES             → Sarah (Sales role)
SUPPORT           → Sarah (Service role)
Vendor email      → Sarah (Operations role)
Complaint         → Sarah (Service role)
Strategic inquiry → Sarah (Owner role)

Result: 100% coverage with one person ✅
```

### **Test 2: Two-Person Team (Overlapping Roles)**
```
Setup:
- Mark = Sales + Operations
- Sarah = Service + Support + Owner

Vendor email ("supplier") → Mark (Operations role) ✅
Sales email ("quote") → Mark (Sales role) ✅
Complaint ("unhappy") → Sarah (Service role) ✅
General question → Sarah (Support role) ✅
Partnership → Sarah (Owner role) ✅

Result: Smart distribution based on content ✅
```

### **Test 3: Keyword Conflict (Highest Score Wins)**
```
Setup:
- Mark = Sales + Operations  
- Sarah = Service + Owner

Email: "We're interested in a commercial partnership for bulk service contracts"

Keywords: "commercial", "bulk", "partnership", "service"

Scoring:
Mark:
  • Sales role: "commercial" (1.0) + "bulk" (1.0) = 2.0
  • Operations role: "partnership" (1.0) = 1.0
  • Total: 3.0

Sarah:
  • Service role: "service" (1.2) = 1.2
  • Owner role: "partnership" (0.9) = 0.9
  • Total: 2.1

Winner: Mark (Score: 3.0) ✅
Route to: MANAGER/Mark Johnson/
Reason: "Higher combined role score"
```

---

## 📝 Summary

### **Enhancement:**
✅ Managers can now have **multiple roles**  
✅ UI shows **multi-select checkboxes** for roles  
✅ AI scores **all roles** for each manager  
✅ Routes to manager with **highest combined score**  
✅ Reflects **real-world small business** operations  

### **Routing Priority:**
1. Name mentioned → Route to that person
2. MANAGER category → Analyze content, score all manager's roles, route to highest
3. Other category → Route to person with matching role
4. Unassigned → Only if no managers configured

### **Data Structure:**
```javascript
{
  name: "Mark Johnson",
  email: "mark@hottubman.ca",
  roles: ["Sales Manager", "Operations Manager"],  // ← ARRAY
  // Old single 'role' field still supported for backward compatibility
}
```

**All changes documented and committed to git!** ✅

**Ready to implement this multi-role feature?** 🚀
