# deploy-n8n Edge Function - Database Templates Integration

**Date:** 2025-01-15  
**Status:** ✅ Completed  
**Purpose:** Update deploy-n8n Edge Function to use database templates instead of hardcoded ones

---

## ✅ **Changes Made**

### **1. Added Database Template Fetching Function**

**Location:** `supabase/functions/deploy-n8n/index.ts` (Lines 51-84)

```typescript
async function fetchBusinessTypeTemplate(businessTypes) {
  if (!businessTypes || businessTypes.length === 0) {
    console.log('⚠️ No business types provided, skipping template fetch');
    return null;
  }

  try {
    console.log(`📋 Fetching merged template for business types: ${businessTypes.join(', ')}`);
    
    // Call database function to get merged template
    const { data, error } = await supabaseAdmin.rpc('get_merged_business_template', {
      business_types: businessTypes
    });

    if (error) {
      console.error('❌ Failed to fetch business type template:', error);
      return null;
    }

    if (!data) {
      console.log('⚠️ No template data returned from database');
      return null;
    }

    console.log(`✅ Fetched merged template for ${data.template_count} business type(s)`);
    return data;
  } catch (err) {
    console.error('❌ Error fetching business type template:', err);
    return null;
  }
}
```

**Features:**
- ✅ Fetches merged templates from database using `get_merged_business_template()` function
- ✅ Supports multi-business selection (1-12 types)
- ✅ Graceful error handling with fallback
- ✅ Detailed logging for debugging

---

### **2. Integrated Template Data into System Message**

**Location:** `supabase/functions/deploy-n8n/index.ts` (Lines 118, 153-209)

**Added:**
- Fetch business template from database
- Build inquiry types section from template
- Build protocols section from template
- Build special rules section from template
- Build upsell prompts section from template
- Inject all sections into AI system message

**System Message Now Includes:**

```
### Business Context:
- Business Name: [Name]
- Business Type(s): [Types]
- Email Domain: [Domain]
- Service Area: [Area]
- Phone Provider: [Provider]
- CRM System: [CRM]

### Inquiry Types:
- **Service Job Inquiry**: Repairs, site inspections, troubleshooting
  Keywords: repair, broken, not working, error code
  Pricing: Site inspection: $105, Labor: $125/hr

- **Sales Inquiry**: New hot tub sales, upgrades
  Keywords: buy, purchase, new hot tub, upgrade
  Pricing: Contact for quote

[... more inquiry types ...]

### Business Protocols:
**Service Requests:** Respond within 24 hours.
**Quotes:** Provide detailed quotes with breakdown.
**Support:** Answer questions promptly and professionally.

### Special Business Rules:
1. Always offer site inspection for repair requests
2. Mention warranty coverage when applicable
3. Provide clear pricing breakdown

### Upsell Opportunities:
- Suggest maintenance packages for new customers
- Offer water care products with service calls
- Recommend upgrades during repairs
```

---

## 🎯 **How It Works**

### **Workflow:**

1. **User Deploys Workflow**
   - Frontend calls `/deploy-n8n` Edge Function
   - Passes `userId` and `provider` (gmail/outlook)

2. **Edge Function Fetches Profile**
   - Queries `profiles` table for user data
   - Extracts `business_types` array (e.g., `['HVAC', 'Plumber']`)

3. **Edge Function Fetches Template**
   - Calls `get_merged_business_template(['HVAC', 'Plumber'])`
   - Database merges templates intelligently
   - Returns combined inquiry types, protocols, rules, upsells

4. **Edge Function Builds System Message**
   - Injects template data into AI system message
   - Includes business-specific inquiry types
   - Includes business-specific protocols
   - Includes business-specific rules and upsells

5. **Edge Function Deploys Workflow**
   - Creates/updates n8n workflow with personalized system message
   - Workflow now has business-specific AI behavior

---

## ✅ **Benefits**

### **Before (Hardcoded):**
- ❌ Templates hardcoded in Edge Function
- ❌ Required code deployment to update templates
- ❌ No multi-business support
- ❌ Difficult to maintain

### **After (Database-Driven):**
- ✅ Templates stored in database
- ✅ Update templates via SQL (no deployment)
- ✅ Multi-business support (1-12 types)
- ✅ Easy to maintain and version
- ✅ Template merging for combined businesses
- ✅ Version history tracking

---

## 🧪 **Testing**

### **Test 1: Single Business Type**

```sql
-- Set user to single business type
UPDATE profiles
SET business_types = ARRAY['HVAC']
WHERE id = 'your-user-id';

-- Deploy workflow via frontend
-- Check n8n workflow system message includes HVAC-specific:
-- - Inquiry types (Emergency Heating/Cooling, Seasonal Maintenance, etc.)
-- - Protocols (24-hour emergency response, etc.)
-- - Special rules (Always ask about furnace age, etc.)
-- - Upsell prompts (Suggest maintenance plans, etc.)
```

### **Test 2: Multi-Business Type**

```sql
-- Set user to multiple business types
UPDATE profiles
SET business_types = ARRAY['HVAC', 'Plumber', 'Electrician']
WHERE id = 'your-user-id';

-- Deploy workflow via frontend
-- Check n8n workflow system message includes merged:
-- - All inquiry types from all 3 businesses
-- - Protocols from all 3 businesses (with section headers)
-- - Combined special rules (deduplicated)
-- - Combined upsell prompts (deduplicated)
```

### **Test 3: Template Update**

```sql
-- Update a template in database
UPDATE business_type_templates
SET upsell_prompts = upsell_prompts || '["New upsell prompt"]'::jsonb
WHERE business_type = 'HVAC';

-- Redeploy workflow via frontend
-- Check n8n workflow system message includes new upsell prompt
-- No code deployment required! ✅
```

---

## 📋 **Database Functions Used**

### **get_merged_business_template(TEXT[])**
- **Purpose:** Merge multiple business type templates
- **Input:** Array of business types (e.g., `['HVAC', 'Plumber']`)
- **Output:** Merged JSONB object with combined templates
- **Location:** `supabase/migrations/20250115_template_merging_functions.sql`

**Example:**
```sql
SELECT get_merged_business_template(ARRAY['HVAC', 'Plumber']);
```

**Returns:**
```json
{
  "business_types": ["HVAC", "Plumber"],
  "inquiry_types": [...],
  "protocols": "**HVAC Protocols:**\n...\n\n---\n\n**Plumber Protocols:**\n...",
  "special_rules": [...],
  "upsell_prompts": [...],
  "template_count": 2,
  "merged_at": "2025-01-15T12:00:00Z"
}
```

---

## 🚀 **Deployment**

### **Edge Function Deployment:**

```bash
# Deploy updated Edge Function
supabase functions deploy deploy-n8n

# Verify deployment
supabase functions list
```

### **Test Deployment:**

```bash
# Test with curl
curl -X POST https://ygdcxqigrfzhqvqpqhxl.supabase.co/functions/v1/deploy-n8n \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "provider": "gmail"
  }'
```

---

## ✅ **Next Steps**

1. ✅ Database templates synced with frontend (12 active types)
2. ✅ Template quality improvements applied
3. ✅ Edge Function updated to use database templates
4. ⏳ **Deploy Edge Function to production**
5. ⏳ **Test workflow deployment with database templates**
6. ⏳ **Update frontend to support multi-business selection**

---

## 📝 **Notes**

- Edge Function gracefully handles missing templates (falls back to basic system message)
- Template fetching is logged for debugging
- Multi-business merging is automatic (no frontend changes needed)
- Template updates take effect immediately (no code deployment)
- Version history is tracked automatically in database

---

**All changes complete! Ready to deploy Edge Function.** 🚀

