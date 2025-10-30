# Fixed: Dynamic Label Mapping for Gmail and Outlook N8N Workflows

## Problem Identified

The N8N workflows were failing to apply labels/folders to emails because:

1. **Hardcoded Label IDs**: The "Generate Label Mappings" node had hardcoded label IDs specific to one user's account
2. **Category Name Mismatch**: The AI classifier returns category names like "Support", "Sales", but the hardcoded map had abbreviated keys like "SUPPO_GENE", "SALES"
3. **Not Dynamic**: Each user's Gmail generates unique label IDs (e.g., `Label_1004`, `Label_2001`), so hardcoded IDs don't work
4. **Outlook Not Supported**: The hardcoded solution only worked for Gmail, not Outlook folders

## Solution Implemented

### 1. Created Dynamic Label Mapping Generator (`supabase/functions/deploy-n8n/index.ts`)

Added `generateDynamicLabelMappingCode()` function that:
- **Fetches actual label IDs** from the `email_labels` field in user's profile
- **Generates N8N-compatible JavaScript** code dynamically
- **Supports both Gmail and Outlook** (checks for `Label_` or `AAMk` prefixes)
- **Handles hierarchical categories** (e.g., "Support/General", "Banking/e-Transfer")
- **Provides intelligent matching** with exact, case-insensitive, and partial matching
- **Includes fallback logic** to MISC label if no match found

### 2. Integrated with Workflow Deployment

Modified the Edge Function's node injection logic to:
- **Detect "Generate Label Mappings" nodes** by checking `node.type === 'n8n-nodes-base.code'` and matching node name
- **Inject dynamically generated code** into the node's `jsCode` parameter
- **Log the injection** for debugging and verification

### 3. Label Mapping Features

The generated code includes:

#### **Intelligent Category Matching**
```javascript
// 1. Exact match: "SUPPORT" → "Label_1013"
// 2. Case-insensitive: "support" → "Label_1013"
// 3. Partial match: "General Support" → "Label_1013"
```

#### **Hierarchical Path Support**
```javascript
// Maps "Support" + "General" → "Support/General" → Label ID
// Maps "Banking" + "e-Transfer" + "Transfer Sent" → "Banking/e-Transfer/Transfer Sent" → Label ID
```

#### **Provider Detection**
```javascript
// Gmail: Filters for label IDs starting with "Label_"
// Outlook: Filters for folder IDs starting with "AAMk"
```

#### **Robust Fallback**
```javascript
// If no labels found:
// 1. Try MISC label
// 2. Use first available label
```

## Implementation Details

### Generated JavaScript Code Structure

```javascript
// 🤖 DYNAMICALLY GENERATED LABEL MAPPING
const parsed = $json.parsed_output || $json;
const provider = 'gmail'; // or 'outlook'

// 📋 Label mapping from FloWorx database
const labelMap = {
  "SUPPORT": "Label_1013",
  "SALES": "Label_1004",
  "BANKING": "Label_981",
  // ... all user's labels
};

// Helper functions for intelligent matching
function normalizeCategory(category) { ... }
function findLabelId(category, labelMap) { ... }

// Build label IDs array
const labelIds = [];
// Add primary, secondary, tertiary category labels
// Add hierarchical path labels

// Return result
return {
  ...parsed,
  labelsToApply: finalLabels, // Array of actual label IDs
  provider: provider,
  debugInfo: { ... }
};
```

### Node Injection Logic

```typescript
// In deployment function (line ~1914)
if (node.type === 'n8n-nodes-base.code' && 
    (node.name === 'Generate Label Mappings' || node.name === 'Label ID Mapper')) {
  
  console.log(`📋 Injecting dynamic ${provider} label mapping into node: ${node.name}`);
  
  // Generate dynamic label mapping code
  const labelMappingCode = generateDynamicLabelMappingCode(
    profile.email_labels || {}, 
    provider
  );
  
  // Update the node's JavaScript code
  node.parameters = node.parameters || {};
  node.parameters.jsCode = labelMappingCode;
  
  console.log(`✅ Injected dynamic label mapping with ${Object.keys(profile.email_labels || {}).length} labels`);
}
```

## Benefits

### ✅ **User-Specific**
- Each user gets their own label IDs from their Gmail/Outlook account
- No more hardcoded IDs that only work for one user

### ✅ **Provider Agnostic**
- Works for both Gmail (`Label_*`) and Outlook (`AAMk*`) 
- Automatically detects provider and filters accordingly

### ✅ **Intelligent Matching**
- AI classifier returns "Support" → Finds "SUPPORT" label
- Handles variations: "Support", "SUPPORT", "support"
- Matches hierarchical paths: "Support/General"

### ✅ **Robust Fallback**
- If AI returns unknown category, falls back to MISC
- If MISC doesn't exist, uses first available label
- Prevents workflow failures due to missing labels

### ✅ **Debugging Support**
- Includes `debugInfo` in output with:
  - Categories found
  - Label IDs matched
  - Final labels applied
  - Label map size

## Error Flow Analysis

### **Before Fix:**
```
AI Classifier: "Support" → Label Mapper: Looks for "SUPPO_GENE" → Not Found → ❌ Error: labelId not found
```

### **After Fix:**
```
AI Classifier: "Support" → Dynamic Label Mapper: Looks for "SUPPORT" → Found "Label_1013" → ✅ Success: Label applied
```

## Testing Verification

The fix should resolve:
1. ❌ "labelId not found" errors in N8N
2. ❌ Emails not being labeled/moved to folders
3. ❌ Hardcoded label IDs failing for different users
4. ❌ Outlook folder mapping not working

After deployment:
1. ✅ Each user gets unique, dynamically generated label mapping
2. ✅ AI classifier categories properly mapped to actual label IDs
3. ✅ Both Gmail and Outlook fully supported
4. ✅ Intelligent matching handles category variations

## Files Modified

1. **`supabase/functions/deploy-n8n/index.ts`**
   - Added `generateDynamicLabelMappingCode()` function (lines 302-461)
   - Modified node injection logic to detect and update label mapping nodes (lines 1913-1925)
   - Supports both Gmail and Outlook providers

2. **`src/lib/gmailLabelSync.js`**
   - Added `businessType` parameter to function signature
   - Added business type detection logic with fallback

3. **`src/lib/labelProvisionService.js`**
   - Updated function call to pass `businessType` parameter

## Next Steps

1. **Deploy Edge Function**: Push updated `supabase/functions/deploy-n8n/index.ts` to Supabase
2. **Test Workflow**: Deploy a workflow and verify dynamic label mapping is injected
3. **Check Logs**: Look for:
   - `📋 Injecting dynamic gmail label mapping into node`
   - `✅ Injected dynamic label mapping with X labels`
4. **Test Email Processing**: Send test emails and verify labels are applied correctly
5. **Monitor N8N**: Check workflow executions for successful label application

The fix ensures that all N8N workflows get dynamically generated, user-specific label mapping code that works correctly for both Gmail and Outlook!
