# Department Scope Manager Role Filtering

## Overview

Manager role information in the AI Master Classifier system message is **automatically filtered** based on the deployment mode:

- **Hub Mode** (`department_scope: ["all"]`): Shows ALL managers with ALL their roles
- **Department Mode** (`department_scope: ["sales"]`): Shows ONLY managers with relevant roles for that department

## How It Works

### 1. Role to Department Mapping

Each manager role maps to specific email categories:

| Role | ID | Routes (Categories) |
|------|-----|---------------------|
| **Sales Manager** | `sales_manager` | SALES |
| **Service Manager** | `service_manager` | SUPPORT, URGENT |
| **Operations Manager** | `operations_manager` | MANAGER, SUPPLIERS |
| **Support Lead** | `support_lead` | SUPPORT |
| **Owner/CEO** | `owner` | MANAGER, URGENT |

### 2. Department to Category Mapping

| Department Scope | Allowed Categories |
|------------------|-------------------|
| `sales` | SALES, FORMSUB |
| `support` | SUPPORT, URGENT |
| `operations` | MANAGER, SUPPLIERS |

### 3. Filtering Logic

**Example Team:**
- John Doe: Sales Manager + Owner/CEO
- Jane Smith: Service Manager
- Mike Johnson: Operations Manager + Support Lead

#### Hub Mode (`["all"]`)

**System Message Includes:**
```
### Team Manager Information:

**John Doe** (john@company.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase...
  - Owner/CEO: Handles strategic, legal, high-priority
    Keywords: strategic, legal, partnership...

**Jane Smith** (jane@company.com)
Roles:
  - Service Manager: Handles repairs, appointments, emergencies
    Keywords: repair, fix, broken, emergency...

**Mike Johnson** (mike@company.com)
Roles:
  - Operations Manager: Handles vendors, internal ops, hiring
    Keywords: vendor, supplier, hiring...
  - Support Lead: Handles general questions, parts, how-to
    Keywords: help, question, parts...
```

**Result:** All 3 managers with all their roles shown

---

#### Sales Department Mode (`["sales"]`)

**Allowed Routes:** SALES

**Filtering:**
- John Doe: ✅ Has Sales Manager role → **INCLUDED** (but only Sales Manager role shown)
- Jane Smith: ❌ No sales-related roles → **EXCLUDED**
- Mike Johnson: ❌ No sales-related roles → **EXCLUDED**

**System Message Includes:**
```
### Team Manager Information:

**John Doe** (john@company.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase...

**Classification Guidance for Manager Routing:**
...
**Department Mode:** Only showing managers relevant to Sales department(s)
```

**Result:** Only John shown, only his Sales Manager role (Owner/CEO role filtered out)

---

#### Support Department Mode (`["support"]`)

**Allowed Routes:** SUPPORT, URGENT

**Filtering:**
- John Doe: ❌ No support-related roles → **EXCLUDED** (Owner/CEO routes to MANAGER, not SUPPORT)
- Jane Smith: ✅ Has Service Manager role (SUPPORT, URGENT routes) → **INCLUDED**
- Mike Johnson: ✅ Has Support Lead role (SUPPORT route) → **INCLUDED** (Operations Manager role filtered out)

**System Message Includes:**
```
### Team Manager Information:

**Jane Smith** (jane@company.com)
Roles:
  - Service Manager: Handles repairs, appointments, emergencies
    Keywords: repair, fix, broken, emergency...

**Mike Johnson** (mike@company.com)
Roles:
  - Support Lead: Handles general questions, parts, how-to
    Keywords: help, question, parts...

**Classification Guidance for Manager Routing:**
...
**Department Mode:** Only showing managers relevant to Support department(s)
```

**Result:** Jane and Mike shown, only their support-related roles

---

#### Multi-Department Mode (`["sales", "support"]`)

**Allowed Routes:** SALES, SUPPORT, URGENT

**Filtering:**
- John Doe: ✅ Has Sales Manager role → **INCLUDED**
- Jane Smith: ✅ Has Service Manager role → **INCLUDED**
- Mike Johnson: ✅ Has Support Lead role → **INCLUDED** (Operations Manager filtered out)

**System Message Includes:**
```
### Team Manager Information:

**John Doe** (john@company.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase...

**Jane Smith** (jane@company.com)
Roles:
  - Service Manager: Handles repairs, appointments, emergencies
    Keywords: repair, fix, broken, emergency...

**Mike Johnson** (mike@company.com)
Roles:
  - Support Lead: Handles general questions, parts, how-to
    Keywords: help, question, parts...

**Classification Guidance for Manager Routing:**
...
**Department Mode:** Only showing managers relevant to Sales + Support department(s)
```

**Result:** All managers shown, but only roles relevant to Sales + Support

---

## Implementation Details

### Function: `buildManagerInfoForAI(managers, departmentScope)`

**Location:** `src/constants/managerRoles.js`

**Parameters:**
- `managers` (Array): Manager objects with name, email, roles
- `departmentScope` (Array): Department filter, e.g., `['sales']` or `['all']`

**Returns:** Formatted manager section for AI system message

**Logic:**
1. If `departmentScope` includes `'all'` → Show all managers with all roles (Hub Mode)
2. Else (Department Mode):
   - Map department scope to allowed category routes
   - Filter managers who have at least one role matching allowed routes
   - For each manager, filter their roles to only show relevant ones
   - Add department mode indicator to guidance section

### Function: `filterManagerInfoByDepartment(systemMessage, managers, departmentScope)`

**Location:** `src/constants/managerRoles.js`

**Purpose:** Used in Edge Function to filter an already-built system message

**Parameters:**
- `systemMessage` (string): Existing AI system message with manager section
- `managers` (Array): Manager objects
- `departmentScope` (Array): Department filter

**Returns:** System message with filtered manager section

**Logic:**
1. Locate `### Team Manager Information` section in system message
2. Extract before/after sections
3. Regenerate manager section with filtering applied
4. Reconstruct full message

---

## Use Cases

### Use Case 1: Sales Team Workflow

**Scenario:** Sales team wants their own dedicated workflow

**Configuration:**
- Department Scope: `["sales"]`
- Managers: John (Sales), Jane (Service), Mike (Operations)

**Result:**
- AI only sees John (Sales Manager) in system message
- Only sales-related keywords active
- Out-of-scope emails (support, operations) routed to OUT_OF_SCOPE folder

**Benefits:**
- Sales team AI focused only on sales classification
- Reduced confusion from irrelevant manager info
- Cleaner, more targeted system message

---

### Use Case 2: Support Team Workflow

**Scenario:** Support team handles customer service and emergencies

**Configuration:**
- Department Scope: `["support"]`
- Managers: John (Sales), Jane (Service), Mike (Operations + Support)

**Result:**
- AI sees Jane (Service Manager) and Mike (Support Lead only)
- Support and emergency keywords active
- Sales emails routed to OUT_OF_SCOPE

**Benefits:**
- Support team sees only support-relevant managers
- Keywords focused on service/emergency contexts
- Clear guidance for support classification

---

### Use Case 3: Hub (Central Email Processing)

**Scenario:** Central email hub processes ALL email types

**Configuration:**
- Department Scope: `["all"]`
- Managers: John, Jane, Mike with all their roles

**Result:**
- AI sees ALL managers with ALL roles
- ALL categories available for classification
- No OUT_OF_SCOPE filtering

**Benefits:**
- Complete view of all team members
- Comprehensive classification across all categories
- Single workflow handles everything

---

## Configuration

### Setting Department Scope

Department scope is set in the `business_profiles` table:

```sql
UPDATE business_profiles
SET department_scope = '["sales", "support"]'
WHERE user_id = 'user-id-here';
```

Or via the Department Scope selection page during deployment.

### Deployment Flow

1. User completes onboarding (managers configured with roles)
2. User selects department scope (Hub Mode or specific departments)
3. Workflow deployed to n8n
4. Edge Function retrieves department_scope
5. Manager section filtered based on department_scope
6. Department restriction section added to system message
7. AI uses filtered manager info for classification

---

## Benefits

1. **Focused Context**: AI only sees relevant managers for the department
2. **Reduced Noise**: Fewer keywords and roles to process
3. **Better Accuracy**: More targeted classification without irrelevant options
4. **Team Separation**: Sales team doesn't see operations managers, etc.
5. **Cleaner Messages**: Shorter, more relevant system messages
6. **Scalability**: Easy to add new departments and roles

---

## Testing

### Test Scenario: Sales Department

```javascript
const managers = [
  { name: 'John', email: 'john@co.com', roles: ['sales_manager', 'owner'] },
  { name: 'Jane', email: 'jane@co.com', roles: ['service_manager'] },
  { name: 'Mike', email: 'mike@co.com', roles: ['operations_manager'] }
];

const hubMode = buildManagerInfoForAI(managers, ['all']);
console.log('Hub Mode:', hubMode.includes('John'), hubMode.includes('Jane'), hubMode.includes('Mike'));
// Output: true, true, true

const salesMode = buildManagerInfoForAI(managers, ['sales']);
console.log('Sales Mode:', salesMode.includes('John'), salesMode.includes('Jane'), salesMode.includes('Mike'));
// Output: true, false, false
```

### Expected Results

| Mode | John | Jane | Mike | John's Roles |
|------|------|------|------|--------------|
| Hub `['all']` | ✅ | ✅ | ✅ | Sales + Owner |
| Sales `['sales']` | ✅ | ❌ | ❌ | Sales only |
| Support `['support']` | ❌ | ✅ | ❌ | N/A |
| Operations `['operations']` | ❌ | ❌ | ✅ | Operations only |

---

## Future Enhancements

1. **Custom Department Mapping**: Allow users to define custom department-to-route mappings
2. **Role Permissions**: Fine-grained control over which roles see which emails
3. **Manager Availability**: Time-based manager filtering (business hours, vacations)
4. **Load Balancing**: Distribute emails across managers in same role
5. **Analytics**: Track which managers handle which email types

---

## Related Documentation

- `docs/MANAGER_ROLE_CLASSIFICATION_FEATURE.md` - Core feature documentation
- `docs/DEPARTMENT_SCOPE_DEPLOYMENT_FLOW.md` - Department deployment flow
- `docs/USER_GUIDE_MANAGER_ROLES.md` - User guide
- `src/constants/managerRoles.js` - Implementation code

