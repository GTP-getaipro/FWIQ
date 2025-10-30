# Manager Role-Based Classification Feature

## Overview

This feature enhances the AI Master Classifier to intelligently route emails based on manager information captured during onboarding. The system now recognizes both **manager names** and **role-specific keywords** to properly classify and route emails.

## Architecture

### 1. Shared Constants (`src/constants/managerRoles.js`)

Centralized role definitions used across the entire application:

```javascript
export const AVAILABLE_ROLES = [
  {
    id: 'sales_manager',
    label: 'Sales Manager',
    description: 'Handles quotes, new leads, pricing inquiries',
    icon: '💰',
    routes: ['SALES'],
    keywords: ['price', 'quote', 'buy', 'purchase', 'how much', 'cost', ...]
  },
  // ... other roles
];
```

**Key Features:**
- 5 predefined roles (Sales Manager, Service Manager, Operations Manager, Support Lead, Owner/CEO)
- Each role includes:
  - Unique ID for storage
  - Display label and description
  - Icon for UI
  - Routes (categories this role should receive)
  - Keywords for AI classification

### 2. Onboarding Integration (`src/pages/onboarding/StepTeamSetup.jsx`)

**What Changed:**
- Now imports `AVAILABLE_ROLES` from shared constants
- Allows users to assign multiple roles per manager
- Stores manager data with structure:
  ```javascript
  {
    name: "John Doe",
    email: "john@example.com",
    roles: ["sales_manager", "service_manager"],  // Array of role IDs
    forward_enabled: true
  }
  ```

### 3. AI Classifier Enhancement (`src/lib/enhancedDynamicClassifierGenerator.js`)

**What Changed:**
- Added `generateManagerInfo()` method
- Added `generateSupplierInfo()` method
- Integrated manager/supplier sections into classifier system message
- Uses shared utility functions from `managerRoles.js`

**System Message Structure:**
```
You are an expert email processing and routing system...

### Categories:
[Standard category structure...]

### Business-Specific Rules:
[Standard rules...]

### Team Manager Information:

**John Doe** (john@example.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, how much, cost, ...
  - Service Manager: Handles repairs, appointments, emergencies
    Keywords: repair, fix, broken, appointment, emergency, ...

**Classification Guidance for Manager Routing:**
- When an email mentions a manager by name, consider routing to that manager
- When an email contains keywords matching a manager's role, consider categorizing accordingly
- For emails addressed "Dear [Manager Name]" or "Hi [Manager Name]", prioritize that manager
- Combine manager role keywords with email content to determine the appropriate category

### Known Suppliers:
[Supplier information...]
```

## Classification Behavior

### By Manager Name
When an email mentions a manager by name:
- "Hi John, I have a question about pricing" → Recognizes John + pricing keywords → SALES category
- "Dear Jane Smith, can you fix our equipment?" → Recognizes Jane + repair keywords → SUPPORT/URGENT

### By Role Keywords
When an email contains role-specific keywords:
- "I need a quote for installation" → Matches Sales Manager keywords → SALES
- "Our system is broken and needs emergency repair" → Matches Service Manager keywords → SUPPORT/URGENT
- "We need to hire a new technician" → Matches Operations Manager keywords → MANAGER

### Combined Classification
The AI considers:
1. **Manager name mentions** in email body or subject
2. **Role-specific keywords** from all assigned roles
3. **Email content context** to determine best category
4. **Confidence scoring** based on keyword matches

## Data Flow

```
Onboarding Process
    ↓
StepTeamSetup.jsx
    ↓
User enters manager info (name, email, roles)
    ↓
Saved to profiles.managers JSONB
    ↓
Deployment Process
    ↓
templateService.js → injectOnboardingData()
    ↓
aiSchemaInjector.js → buildProductionClassifier()
    ↓
enhancedDynamicClassifierGenerator.js → generateManagerInfo()
    ↓
managerRoles.js → buildManagerInfoForAI()
    ↓
AI Master Classifier System Message
    ↓
n8n Workflow Deployment
    ↓
Email Classification with Manager Context
```

## Database Schema

### profiles.managers (JSONB)
```json
[
  {
    "name": "John Doe",
    "email": "john@company.com",
    "roles": ["sales_manager", "owner"],
    "forward_enabled": true
  },
  {
    "name": "Jane Smith", 
    "email": "jane@company.com",
    "roles": ["service_manager"],
    "forward_enabled": true
  }
]
```

## API & Utility Functions

### `buildManagerInfoForAI(managers)`
Generates formatted manager information for AI classifier system message.

**Input:**
```javascript
[
  { name: "John", email: "john@ex.com", roles: ["sales_manager"] }
]
```

**Output:**
```
### Team Manager Information:

**John** (john@ex.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, ...

**Classification Guidance for Manager Routing:**
...
```

### `getRoleById(roleId)`
Retrieves role definition by ID.

### `getKeywordsForRoles(roleIds)`
Returns combined keywords for multiple roles.

### `getRoutesForRoles(roleIds)`
Returns combined routes for multiple roles.

## Example Scenarios

### Scenario 1: Sales Inquiry with Manager Name
**Email:**
```
To: info@company.com
Subject: Quote Request for John

Hi John,
Can you provide a quote for hot tub installation?
Thanks!
```

**Classification:**
- Recognizes: "John" (manager name)
- Keywords: "quote", "pricing inquiry"
- Result: `primary_category: "Sales"`
- Confidence: High (name + keywords match)

### Scenario 2: Emergency Service Request
**Email:**
```
To: service@company.com
Subject: URGENT - Hot tub not heating

Our hot tub stopped working and won't heat up.
We need emergency repair.
```

**Classification:**
- Keywords: "urgent", "emergency", "repair", "not working"
- Matches: Service Manager role keywords
- Result: `primary_category: "Urgent"` or `"Support"`
- Confidence: High (strong keyword matches)

### Scenario 3: Internal Operations Email
**Email:**
```
To: info@company.com
Subject: Vendor Partnership Inquiry

We're a supplier interested in partnering with your company
for hot tub parts and chemicals.
```

**Classification:**
- Keywords: "vendor", "supplier", "partnership"
- Matches: Operations Manager role keywords
- Result: `primary_category: "Manager"` or `"Suppliers"`
- Confidence: High (clear vendor context)

## Benefits

1. **Intelligent Routing**: Emails automatically categorized based on manager expertise
2. **Name Recognition**: AI recognizes when specific managers are mentioned
3. **Role-Based Classification**: Keywords associated with roles improve categorization
4. **Flexible Assignment**: Managers can have multiple roles for comprehensive coverage
5. **Consistent Definitions**: Single source of truth for role definitions
6. **Easy Maintenance**: Update role keywords in one place, affects entire system

## Testing Recommendations

### 1. Onboarding Flow Test
- Navigate to Team Setup during onboarding
- Add managers with different role combinations
- Verify roles are saved correctly in database
- Check that `profiles.managers` JSONB contains role array

### 2. Deployment Test
- Complete onboarding with manager information
- Deploy workflow to n8n
- Verify AI Master Classifier node system message includes manager section
- Check for role-specific keywords in system message

### 3. Classification Test
Send test emails:
- Email mentioning manager by name
- Email with role-specific keywords
- Email combining both name and keywords
- Verify correct category assignment

### 4. Re-deployment Test
- Modify manager information via settings/reconfiguration
- Re-deploy workflow
- Verify updated manager info in classifier system message

## Future Enhancements

1. **Dynamic Role Creation**: Allow custom roles beyond the 5 predefined
2. **Role Learning**: AI learns which managers handle which types of emails over time
3. **Priority Routing**: Certain managers get priority based on role importance
4. **Availability Integration**: Consider manager availability for routing
5. **Department Scope**: Integrate with department-based email routing
6. **Analytics**: Track which roles receive most emails, classification accuracy

## Related Files

- `src/constants/managerRoles.js` - Role definitions and utilities
- `src/pages/onboarding/StepTeamSetup.jsx` - Onboarding UI
- `src/lib/enhancedDynamicClassifierGenerator.js` - Classifier generator
- `src/lib/aiSchemaInjector.js` - AI configuration injection
- `src/lib/templateService.js` - Workflow template injection
- `supabase/migrations/*_create_business_profiles.sql` - Database schema

## Migration Notes

**Breaking Changes:** None - This is a backward-compatible enhancement.

**Existing Data:** 
- Managers without roles will display normally (fallback to name-only)
- Old manager format with `role` (string) is automatically normalized to `roles` (array)

**Deployment:**
- No database migrations required
- Existing workflows will continue to work
- Re-deployment recommended to get enhanced classification

