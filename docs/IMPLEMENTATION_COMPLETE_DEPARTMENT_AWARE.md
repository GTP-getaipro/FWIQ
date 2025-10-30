# Manager Role Classification - Department-Aware Implementation ✅

## 🎯 What Was Requested

> "the system message expected to be different for the hub setup deployment and for the team like Sales"

You wanted the AI Master Classifier system message to **automatically filter manager information** based on whether it's deployed as:
- **Hub Mode**: Central email hub processing ALL email types
- **Department Mode**: Team-specific workflow (e.g., Sales team, Support team)

## ✨ What Was Implemented

### 1. Department-Aware Manager Filtering

**Function:** `buildManagerInfoForAI(managers, departmentScope)`

**Location:** `src/constants/managerRoles.js`

**Behavior:**

#### Hub Mode (`departmentScope: ['all']`)
```javascript
buildManagerInfoForAI(managers, ['all'])
```
- Shows **ALL** managers
- Shows **ALL** roles for each manager
- No filtering applied

#### Department Mode (`departmentScope: ['sales']`)
```javascript
buildManagerInfoForAI(managers, ['sales'])
```
- Shows **ONLY** managers who have sales-related roles
- Shows **ONLY** the sales-related roles (filters out other roles)
- Adds department mode indicator to guidance

### 2. Role-to-Department Mapping

| Manager Role | Routes (Categories) | Shown in Department |
|-------------|---------------------|---------------------|
| Sales Manager | SALES | `['sales']` |
| Service Manager | SUPPORT, URGENT | `['support']` |
| Operations Manager | MANAGER, SUPPLIERS | `['operations']` |
| Support Lead | SUPPORT | `['support']` |
| Owner/CEO | MANAGER, URGENT | `['operations']`, `['support']` (Urgent) |

### 3. Enhanced Classifier Generator

**Updated:** `EnhancedDynamicClassifierGenerator` class

**New Constructor Parameter:**
```javascript
constructor(businessType, businessInfo, managers, suppliers, actualLabels, departmentScope)
```

**Behavior:**
- Accepts `departmentScope` parameter
- Passes it to `buildManagerInfoForAI()` 
- Automatically filters manager section based on department

### 4. Production Classifier Function

**Updated:** `buildProductionClassifier()` in `aiSchemaInjector.js`

**New Parameter:**
```javascript
buildProductionClassifier(aiConfig, labelConfig, businessInfo, managers, suppliers, actualLabels, departmentScope)
```

**Behavior:**
- Accepts optional `departmentScope` parameter (defaults to `['all']`)
- Passes it to `EnhancedDynamicClassifierGenerator`
- Logs department scope in debug output

---

## 📊 Real-World Example

### Team Configuration

| Manager | Roles |
|---------|-------|
| John Doe | Sales Manager + Owner/CEO |
| Jane Smith | Service Manager |
| Mike Johnson | Operations Manager + Support Lead |

---

### Hub Mode Deployment (`['all']`)

**System Message Includes:**
```
### Team Manager Information:

**John Doe** (john@company.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, how much...
  - Owner/CEO: Handles strategic, legal, high-priority
    Keywords: strategic, legal, partnership, media...

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

**Classification Guidance for Manager Routing:**
...
```

**Result:** All 3 managers, all their roles shown

---

### Sales Department Deployment (`['sales']`)

**System Message Includes:**
```
### Team Manager Information:

**John Doe** (john@company.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, how much...

**Classification Guidance for Manager Routing:**
...
**Department Mode:** Only showing managers relevant to Sales department(s)
```

**Result:** Only John (who has Sales Manager role), only his Sales Manager role shown (Owner/CEO filtered out)

---

### Support Department Deployment (`['support']`)

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

**Result:** Jane and Mike (support-related roles), Operations Manager role filtered out for Mike

---

### Multi-Department Deployment (`['sales', 'support']`)

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

**Result:** All 3 managers, but only their sales/support-related roles

---

## 🔄 Deployment Flow

```
User Completes Onboarding
    ↓
Managers configured with roles
    ↓
User Selects Department Scope
    ├─ ["all"] - Hub Mode
    └─ ["sales"] - Sales Department
    ↓
Frontend Builds System Message
    ↓
buildProductionClassifier() called
    ├─ departmentScope: ['all'] (default if not yet selected)
    ├─ EnhancedDynamicClassifierGenerator instantiated
    └─ Manager section generated (filtered if department mode)
    ↓
Edge Function (deploy-n8n) Receives System Message
    ↓
Edge Function Retrieves department_scope from database
    ↓
Edge Function Adds Department Restriction Section
    ├─ Allowed categories listed
    ├─ OUT_OF_SCOPE handling explained
    └─ Examples provided
    ↓
Complete System Message Deployed to n8n
    ↓
AI Uses Filtered Manager Info + Department Restrictions
```

---

## 💡 Key Benefits

### 1. **Focused Context**
- Sales team AI only sees sales managers
- Support team AI only sees support managers
- No confusion from irrelevant manager info

### 2. **Reduced Token Usage**
- Shorter system messages in department mode
- Fewer keywords to process
- More efficient AI classification

### 3. **Better Accuracy**
- AI not distracted by irrelevant managers
- Clearer context for department-specific classification
- Keywords align with allowed categories

### 4. **Team Separation**
- Sales team doesn't see operations info
- Support team doesn't see sales managers
- Clean separation of concerns

### 5. **Scalability**
- Easy to add new departments
- Easy to add new roles
- Flexible manager assignments

---

## 🧪 Testing

### Test Case 1: Hub Mode
```javascript
const managers = [
  { name: 'John', roles: ['sales_manager', 'owner'] },
  { name: 'Jane', roles: ['service_manager'] },
  { name: 'Mike', roles: ['operations_manager', 'support_lead'] }
];

const result = buildManagerInfoForAI(managers, ['all']);

// Expected: All 3 managers with all their roles
assert(result.includes('John'));
assert(result.includes('Jane'));
assert(result.includes('Mike'));
assert(result.includes('Sales Manager'));
assert(result.includes('Owner/CEO'));
assert(result.includes('Service Manager'));
assert(result.includes('Operations Manager'));
assert(result.includes('Support Lead'));
```

### Test Case 2: Sales Department
```javascript
const result = buildManagerInfoForAI(managers, ['sales']);

// Expected: Only John, only Sales Manager role
assert(result.includes('John'));
assert(!result.includes('Jane'));
assert(!result.includes('Mike'));
assert(result.includes('Sales Manager'));
assert(!result.includes('Owner/CEO')); // Filtered out
assert(result.includes('Department Mode: Only showing managers relevant to Sales'));
```

### Test Case 3: Support Department
```javascript
const result = buildManagerInfoForAI(managers, ['support']);

// Expected: Jane and Mike, support-related roles only
assert(!result.includes('John'));
assert(result.includes('Jane'));
assert(result.includes('Mike'));
assert(result.includes('Service Manager'));
assert(result.includes('Support Lead'));
assert(!result.includes('Operations Manager')); // Filtered out for Mike
```

---

## 📁 Files Modified

1. ✅ **src/constants/managerRoles.js**
   - Updated `buildManagerInfoForAI()` with department filtering
   - Added `filterManagerInfoByDepartment()` helper function
   - Added department-to-route mapping

2. ✅ **src/lib/enhancedDynamicClassifierGenerator.js**
   - Added `departmentScope` parameter to constructor
   - Updated `generateManagerInfo()` to pass department scope
   - Stores department scope in class instance

3. ✅ **src/lib/aiSchemaInjector.js**
   - Added `departmentScope` parameter to `buildProductionClassifier()`
   - Passes department scope to `EnhancedDynamicClassifierGenerator`
   - Enhanced debug logging

4. ✅ **docs/DEPARTMENT_SCOPE_MANAGER_FILTERING.md**
   - Comprehensive documentation of filtering logic
   - Real-world examples
   - Test scenarios

---

## 🎓 Usage

### Frontend (Default Behavior)
```javascript
// During onboarding/deployment, department scope defaults to ['all']
const systemMessage = buildProductionClassifier(
  aiConfig,
  labelConfig,
  businessInfo,
  managers,
  suppliers,
  actualLabels,
  ['all'] // Hub mode by default
);
```

### Edge Function (Department-Aware)
```javascript
// Edge function retrieves department_scope from database
const { data: businessProfile } = await supabaseAdmin
  .from('business_profiles')
  .select('department_scope')
  .eq('user_id', userId)
  .single();

const departmentScope = businessProfile?.department_scope || ['all'];

// If system message needs to be regenerated with filtering:
const filteredMessage = filterManagerInfoByDepartment(
  existingSystemMessage,
  managers,
  departmentScope
);

// Then add department restriction section
if (!departmentScope.includes('all')) {
  filteredMessage += departmentRestrictionSection;
}
```

---

## ✅ Summary

The manager role classification system now **intelligently filters manager information** based on deployment mode:

- **Hub Mode**: Shows all managers with all their roles for comprehensive email routing
- **Department Mode**: Shows only relevant managers with relevant roles for focused team workflows

This ensures:
- **Sales teams** see only sales managers and sales keywords
- **Support teams** see only service/support managers and support keywords
- **Hub deployments** see everyone for centralized email processing

The system automatically handles the filtering based on the `department_scope` setting in the `business_profiles` table, requiring no manual configuration beyond the initial department scope selection.

---

## 📚 Related Documentation

- `docs/MANAGER_ROLE_CLASSIFICATION_FEATURE.md` - Original feature documentation
- `docs/DEPARTMENT_SCOPE_DEPLOYMENT_FLOW.md` - Department deployment architecture
- `docs/DEPARTMENT_SCOPE_MANAGER_FILTERING.md` - Detailed filtering examples
- `docs/USER_GUIDE_MANAGER_ROLES.md` - End-user guide
- `src/constants/managerRoles.js` - Implementation code

