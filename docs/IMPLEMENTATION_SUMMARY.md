# Manager Role-Based Classification - Implementation Summary

## ✅ What Was Implemented

### 1. Shared Constants Module
**File:** `src/constants/managerRoles.js`

Created a centralized module containing:
- **AVAILABLE_ROLES**: Array of 5 predefined manager roles with:
  - Sales Manager (💰) - Handles quotes, new leads, pricing inquiries
  - Service Manager (🔧) - Handles repairs, appointments, emergencies
  - Operations Manager (⚙️) - Handles vendors, internal ops, hiring
  - Support Lead (💬) - Handles general questions, parts, how-to
  - Owner/CEO (👔) - Handles strategic, legal, high-priority

- **Utility Functions**:
  - `getRoleById(roleId)` - Get role definition by ID
  - `getKeywordsForRoles(roleIds)` - Get combined keywords for multiple roles
  - `getRoutesForRoles(roleIds)` - Get combined routes for multiple roles
  - `buildManagerInfoForAI(managers)` - Format manager info for AI classifier
  - `buildSupplierInfoForAI(suppliers)` - Format supplier info for AI classifier

### 2. Enhanced AI Classifier
**File:** `src/lib/enhancedDynamicClassifierGenerator.js`

Added two new methods:
- `generateManagerInfo()` - Generates manager section with roles and keywords
- `generateSupplierInfo()` - Generates supplier section with domain information

Updated `generateClassifierSystemMessage()` to include:
```javascript
${managerInfo}  // Injects manager names, roles, keywords, and classification guidance
${supplierInfo}  // Injects supplier names and domains
```

### 3. Updated Onboarding UI
**File:** `src/pages/onboarding/StepTeamSetup.jsx`

Changed from locally defined AVAILABLE_ROLES to:
```javascript
import { AVAILABLE_ROLES } from '@/constants/managerRoles';
```

This ensures consistency between UI and AI classification.

## 🎯 How It Works

### During Onboarding
1. User navigates to Team Setup step
2. Enters manager information: name, email, and selects multiple roles
3. Data is saved to `profiles.managers` JSONB array:
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "roles": ["sales_manager", "owner"],
  "forward_enabled": true
}
```

### During Deployment
1. `templateService.js` calls `injectOnboardingData()`
2. Manager data is passed to `buildProductionClassifier()`
3. `EnhancedDynamicClassifierGenerator` generates system message
4. `generateManagerInfo()` formats manager section using `buildManagerInfoForAI()`
5. System message includes:

```
### Team Manager Information:

**John Doe** (john@company.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, how much, cost, pricing, estimate...
  - Owner/CEO: Handles strategic, legal, high-priority
    Keywords: strategic, legal, partnership, media, press, executive...

**Classification Guidance for Manager Routing:**
- When an email mentions a manager by name, consider routing to that manager
- When an email contains keywords matching a manager's role, consider categorizing accordingly
- For emails addressed "Dear [Manager Name]" or "Hi [Manager Name]", prioritize that manager
- Combine manager role keywords with email content to determine the appropriate category
```

### During Email Classification
The AI Master Classifier:
1. Reads email content (subject, body, sender)
2. Checks for manager name mentions
3. Identifies role-specific keywords
4. Combines name recognition + keyword matching
5. Assigns appropriate category based on manager roles
6. Returns classification with high confidence when matches found

## 📊 Classification Examples

### Example 1: Manager Name + Keywords
**Email:**
```
To: info@company.com
Subject: Quote request for John

Hi John,
Can you provide pricing for hot tub installation?
```

**Classification:**
- Detects: "John" (manager name)
- Keywords: "quote", "pricing"
- Matches: Sales Manager role
- Result: `primary_category: "Sales"`, high confidence

### Example 2: Role Keywords Only
**Email:**
```
To: service@company.com
Subject: Emergency repair needed

Our hot tub stopped working and won't heat.
Need urgent repair service.
```

**Classification:**
- Keywords: "emergency", "repair", "urgent", "not working"
- Matches: Service Manager role
- Result: `primary_category: "Support"` or `"Urgent"`, high confidence

### Example 3: Operations/Vendor
**Email:**
```
To: info@company.com
Subject: Supplier partnership opportunity

We supply hot tub chemicals and would like to discuss
a partnership for procurement and inventory.
```

**Classification:**
- Keywords: "supplier", "partnership", "procurement", "inventory"
- Matches: Operations Manager role
- Result: `primary_category: "Manager"` or `"Suppliers"`, high confidence

## 🧪 Testing

### Test Results (All Passing ✅)
```
✅ AVAILABLE_ROLES properly defined (5 roles)
✅ Helper functions working correctly
✅ Manager info generation includes roles and keywords
✅ Supplier info generation working
✅ Empty array handling correct
✅ All required exports present
```

### Run Tests
```bash
node test/managerRoleClassificationTest.js
```

## 📁 Files Modified

1. ✅ **Created:** `src/constants/managerRoles.js` (184 lines)
2. ✅ **Modified:** `src/lib/enhancedDynamicClassifierGenerator.js`
   - Added import for shared constants
   - Added `generateManagerInfo()` method
   - Added `generateSupplierInfo()` method
   - Updated `generateClassifierSystemMessage()`
3. ✅ **Modified:** `src/pages/onboarding/StepTeamSetup.jsx`
   - Removed local AVAILABLE_ROLES definition
   - Added import from shared constants
4. ✅ **Created:** `docs/MANAGER_ROLE_CLASSIFICATION_FEATURE.md` (comprehensive documentation)
5. ✅ **Created:** `test/managerRoleClassificationTest.js` (test suite)

## 🎁 Benefits

1. **Intelligent Routing** - Emails automatically categorized based on manager roles
2. **Name Recognition** - AI recognizes when managers are mentioned by name
3. **Keyword Matching** - Role-specific keywords improve classification accuracy
4. **Multiple Roles** - Managers can have multiple roles for comprehensive coverage
5. **Centralized Definitions** - Single source of truth for role configurations
6. **Easy Maintenance** - Update keywords in one place, affects entire system

## 🚀 Next Steps for User

1. **Complete Onboarding**
   - Navigate to Team Setup step
   - Add managers with names, emails, and roles
   - Save and continue to deployment

2. **Deploy Workflow**
   - Complete deployment to n8n
   - Verify AI Master Classifier node contains manager information

3. **Test Classification**
   - Send test emails mentioning manager names
   - Send test emails with role-specific keywords
   - Verify correct categorization in email labels

4. **Monitor & Adjust**
   - Review classification accuracy
   - Update manager roles if needed
   - Re-deploy to apply changes

## 🔧 Configuration

### Add/Modify Roles
Edit `src/constants/managerRoles.js`:

```javascript
{
  id: 'custom_role',
  label: 'Custom Role',
  description: 'What this role handles',
  icon: '🎯',
  routes: ['CUSTOM_CATEGORY'],
  keywords: ['keyword1', 'keyword2', 'keyword3']
}
```

### Update Keywords
Simply add/remove keywords from role definitions. They automatically flow to:
- Onboarding UI (role descriptions)
- AI Classifier (classification logic)
- System message (guidance for AI)

## 📝 Database Schema

No schema changes required. Uses existing `profiles.managers` JSONB:

```sql
-- profiles table
managers JSONB DEFAULT '[]'::jsonb

-- Example data
[
  {
    "name": "John Doe",
    "email": "john@company.com",
    "roles": ["sales_manager", "owner"],
    "forward_enabled": true
  }
]
```

## 🔄 Backward Compatibility

- ✅ Existing workflows continue to work
- ✅ Managers without roles display normally (name-only fallback)
- ✅ Old format `role` (string) auto-normalized to `roles` (array)
- ✅ No database migrations required
- ✅ Re-deployment optional but recommended

## 📚 Documentation

- **Feature Documentation:** `docs/MANAGER_ROLE_CLASSIFICATION_FEATURE.md`
- **Implementation Summary:** `docs/IMPLEMENTATION_SUMMARY.md` (this file)
- **Test Suite:** `test/managerRoleClassificationTest.js`

## ✨ Summary

The manager role-based classification feature is **fully implemented and tested**. It enhances the AI Master Classifier to intelligently route emails based on both manager names and role-specific keywords, improving classification accuracy and providing more context-aware email routing.

Users can now:
- ✅ Assign multiple roles to managers during onboarding
- ✅ Have emails classified by manager name mentions
- ✅ Have emails classified by role-specific keywords
- ✅ Get more accurate email categorization
- ✅ Easily update role definitions in one place

