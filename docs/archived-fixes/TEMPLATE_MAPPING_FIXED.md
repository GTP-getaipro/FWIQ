# Template Mapping - FIXED

## Issue
The template mapping was referencing files that don't exist, causing deployment failures.

## ❌ Incorrect Mappings (Before)
```javascript
'Hot tub & Spa': 'hot_tub_template.json',        // ❌ File doesn't exist
'Pools': 'pools_template.json',                   // ❌ File doesn't exist  
'Sauna & Icebath': 'sauna_icebath_template.json', // ❌ File doesn't exist
'General Construction': 'general_construction_template.json' // ❌ File doesn't exist
```

## ✅ Correct Mappings (After)
```javascript
'Hot tub & Spa': 'hot_tub_base_template.json',    // ✅ Exists in src/lib/n8n-templates/
'Pools': 'pools_spas_generic_template.json',      // ✅ Exists
'Pools & Spas': 'pools_spas_generic_template.json', // ✅ Exists
'Sauna & Icebath': 'pools_spas_generic_template.json', // ✅ Exists
'General Construction': 'construction_template.json', // ✅ Exists
'Auto Repair': 'pools_spas_generic_template.json', // ✅ Fallback
'Appliance Repair': 'pools_spas_generic_template.json' // ✅ Fallback
```

## 📁 Available Template Files

Located in `src/lib/n8n-templates/`:

| File Name | Business Types |
|-----------|---------------|
| `hot_tub_base_template.json` | Hot tub & Spa |
| `pools_spas_generic_template.json` | Pools, Pools & Spas, Sauna & Icebath |
| `electrician_template.json` | Electrician |
| `hvac_template.json` | HVAC, Insulation & Foam Spray |
| `plumber_template.json` | Plumber |
| `construction_template.json` | General Construction, General Contractor |
| `flooring_template.json` | Flooring |
| `painting_template.json` | Painting, Painting Contractor |
| `roofing_template.json` | Roofing, Roofing Contractor |
| `landscaping_template.json` | Landscaping |

## 🔧 Files Updated

1. **`src/lib/enhancedTemplateManager.js`**
   - Line 107-126: Updated `getSingleBusinessTemplate()` mapping
   - Line 229-244: Updated composite template selection
   - All references now point to existing files

2. **`src/lib/enhancedWorkflowDeployer.js`**
   - Line 222-238: Updated import statements
   - Using only files that actually exist

3. **`supabase/functions/deploy-n8n/index.ts`**
   - Line 438-454: Already correct! ✅
   - Maps to base names (without `.json` extension)

## ✅ Complete Business Type Mapping

```javascript
const BUSINESS_TYPE_TO_TEMPLATE = {
  // Home Services - Specific Templates
  'Electrician': 'electrician_template.json',
  'HVAC': 'hvac_template.json',
  'Insulation & Foam Spray': 'hvac_template.json',
  'Plumber': 'plumber_template.json',
  
  // Construction - Specific Templates  
  'General Construction': 'construction_template.json',
  'General Contractor': 'construction_template.json',
  'Flooring': 'flooring_template.json',
  'Painting': 'painting_template.json',
  'Painting Contractor': 'painting_template.json',
  'Roofing': 'roofing_template.json',
  'Roofing Contractor': 'roofing_template.json',
  'Landscaping': 'landscaping_template.json',
  
  // Water-based Services - Dedicated Templates
  'Hot tub & Spa': 'hot_tub_base_template.json',
  'Pools': 'pools_spas_generic_template.json',
  'Pools & Spas': 'pools_spas_generic_template.json',
  'Sauna & Icebath': 'pools_spas_generic_template.json',
  
  // Other Services - Generic Fallback
  'Auto Repair': 'pools_spas_generic_template.json',
  'Appliance Repair': 'pools_spas_generic_template.json',
  
  // Default Fallback
  'default': 'pools_spas_generic_template.json'
};
```

## 🧪 Testing Template Loading

### Test if template exists:
```javascript
import { enhancedTemplateManager } from '@/lib/enhancedTemplateManager';

const businessType = 'Hot tub & Spa';
const config = await enhancedTemplateManager.getSingleBusinessTemplate(businessType);

console.log('Template file:', config.templateFile);
// Expected: hot_tub_base_template.json

console.log('Template loaded:', !!config.template);
// Expected: true (no fallback needed)
```

### Verify file exists:
```bash
# PowerShell
Test-Path "src\lib\n8n-templates\hot_tub_base_template.json"
# Should return: True

# List all templates
Get-ChildItem "src\lib\n8n-templates\" -Filter "*.json" | Select-Object Name
```

## 🚨 Error Handling

If a template file is missing:
1. **Fallback template** is used (`pools_spas_generic_template.json`)
2. **Warning is logged**: `Could not load template X, using fallback`
3. **Deployment continues** with generic template

## 📊 Template Loading Flow

```
User selects business type
       │
       ▼
enhancedTemplateManager.getSingleBusinessTemplate(type)
       │
       ▼
Lookup in templateMap
       │
       ▼
   ┌───┴───┐
   │       │
Found    Not Found
   │       │
   ▼       ▼
Load    Use Default
File    (pools_spas_generic)
   │       │
   └───┬───┘
       │
       ▼
 Try to import
       │
   ┌───┴───┐
   │       │
Success  Error
   │       │
   ▼       ▼
Return  Return
Template Fallback
```

## ✅ Status: FIXED

All template mappings now reference **actual files that exist** in the codebase.

**No more "Could not load template" errors!** 🎉

---

## Quick Reference

**Hot tub & Spa**: `hot_tub_base_template.json` ✅  
**Pools**: `pools_spas_generic_template.json` ✅  
**Pools & Spas**: `pools_spas_generic_template.json` ✅  
**Sauna & Icebath**: `pools_spas_generic_template.json` ✅  

All templates verified to exist in `src/lib/n8n-templates/` directory.

