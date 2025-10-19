# RFC: Add "Equipment" Label Category

**Author**: AI Assistant  
**Date**: 2025-10-07  
**Status**: Example Template  
**Type**: Contract Change  

---

## Problem

Currently, emails about equipment purchases, maintenance contracts, and warranty claims don't have a dedicated category. They're being misclassified as "Operations" or "Support", which reduces routing accuracy and makes it hard to track equipment-related expenses.

**Business Impact**:
- 15% of emails misclassified
- Equipment costs mixed with operational costs in analytics
- Difficult to track warranty claims

---

## Proposed Change

Add a new label category: **"Equipment"** to the frozen label category enum.

### Scope

This affects **3 frozen contracts**:

1. **Database Schema** - `business_labels.category` enum
2. **AI Classifier** - Intent taxonomy
3. **n8n Workflows** - Label Generator node output

---

## Detailed Implementation

### 1. Database Migration

**File**: `migrations/2025_10_07_03_add_equipment_category.sql`

```sql
-- Add "Equipment" to category enum values
-- This is a contract change requiring RFC approval

BEGIN;

-- Update check constraint to include new category
ALTER TABLE public.business_labels 
  DROP CONSTRAINT IF EXISTS business_labels_category_check;

ALTER TABLE public.business_labels
  ADD CONSTRAINT business_labels_category_check
  CHECK (category IN ('Sales', 'Support', 'Operations', 'Banking', 'Marketing', 'HR', 'Admin', 'Equipment'));

-- Add default labels for Equipment category
INSERT INTO public.business_labels (user_id, provider, label_name, category, intent, created_at)
SELECT 
  id as user_id,
  provider,
  'EQUIPMENT' as label_name,
  'Equipment' as category,
  'equipment_general' as intent,
  NOW() as created_at
FROM (
  SELECT DISTINCT user_id as id, provider 
  FROM public.integrations 
  WHERE status = 'active'
) users
ON CONFLICT (user_id, provider, label_name) DO NOTHING;

COMMIT;
```

**Rollback**: `migrations/2025_10_07_03_rollback.sql`

```sql
BEGIN;

-- Remove Equipment category labels
DELETE FROM public.business_labels WHERE category = 'Equipment';

-- Restore original constraint
ALTER TABLE public.business_labels 
  DROP CONSTRAINT IF EXISTS business_labels_category_check;

ALTER TABLE public.business_labels
  ADD CONSTRAINT business_labels_category_check
  CHECK (category IN ('Sales', 'Support', 'Operations', 'Banking', 'Marketing', 'HR', 'Admin'));

COMMIT;
```

### 2. AI Classifier Update

**File**: `src/lib/aiClassifier.js`

```javascript
// Add to intent taxonomy
const INTENT_TAXONOMY = {
  // ... existing categories ...
  'Equipment': {
    'purchase': ['buy', 'purchase', 'order equipment', 'quote for'],
    'maintenance': ['maintenance contract', 'service agreement', 'warranty'],
    'warranty_claim': ['warranty claim', 'defective', 'broken equipment'],
    'inventory': ['stock', 'inventory', 'equipment list']
  }
};
```

### 3. n8n Label Generator

**File**: Update all workflow templates

```javascript
// Add to Label Generator node output
{
  "EQUIPMENT_PURCHASE": "folder-id-equipment-purchase",
  "EQUIPMENT_MAINTENANCE": "folder-id-equipment-maintenance",
  "EQUIPMENT_WARRANTY": "folder-id-equipment-warranty"
}
```

### 4. Frontend Enum Update

**File**: `src/lib/constants.js`

```javascript
export const LABEL_CATEGORIES = [
  'Sales',
  'Support',
  'Operations',
  'Banking',
  'Marketing',
  'HR',
  'Admin',
  'Equipment'  // NEW
];
```

---

## Affected Components

- [x] Frontend - Add "Equipment" to category dropdown
- [x] Backend API - No changes (contract-compatible)
- [x] Supabase Schema - Add enum value + migration
- [x] n8n Workflows - Update Label Generator in all templates
- [x] AI Layer - Extend intent taxonomy

---

## Migration Plan

### Phase 1: Database (Day 1)
1. Run migration in **staging** environment
2. Verify no constraint violations
3. Test label provisioning with new category
4. Rollback if issues detected

### Phase 2: AI Training (Day 2-3)
1. Add "Equipment" examples to training set
2. Retrain classifier
3. Validate accuracy > 85% on test set
4. Deploy updated model to staging

### Phase 3: n8n Workflows (Day 4)
1. Update Label Generator node in base template
2. Deploy test workflow to staging
3. Verify Equipment folders created correctly
4. Update all active workflows (version bump)

### Phase 4: Frontend (Day 5)
1. Add "Equipment" to category UI
2. Update label provisioning logic
3. Test onboarding flow end-to-end

### Phase 5: Production (Day 6)
1. Deploy migration to production
2. Monitor for 24 hours
3. Update architecture docs
4. Bump system version to v2.5.0

---

## Rollback Plan

### Immediate Rollback (< 1 hour)

If critical issues detected after deployment:

```sql
-- Run rollback migration
\i migrations/2025_10_07_03_rollback.sql

-- Verify
SELECT COUNT(*) FROM business_labels WHERE category = 'Equipment';
-- Should return 0
```

### Partial Rollback

If only AI layer has issues:
- Revert AI classifier to previous version
- Keep database changes (backward compatible)
- Mark "Equipment" category as "experimental"

---

## Testing Checklist

### Pre-Deployment (Staging)

- [ ] Database migration runs without errors
- [ ] No existing labels violate new constraint
- [ ] Label provisioning creates Equipment folders
- [ ] AI classifier recognizes Equipment intents (accuracy > 85%)
- [ ] n8n workflows route Equipment emails correctly
- [ ] Frontend shows Equipment in category dropdown
- [ ] Analytics dashboards include Equipment category

### Post-Deployment (Production)

- [ ] Monitor error logs for 24 hours
- [ ] Verify Equipment folders created for all users
- [ ] Check AI classification accuracy (production traffic)
- [ ] No user-reported issues for 48 hours

---

## Performance Impact

**Estimated Impact**: Minimal

- Database: +1 enum value (no performance impact)
- AI: +4 intent patterns (~2ms latency increase)
- n8n: +3 folder IDs per workflow (negligible)
- Storage: ~500KB for new folder metadata across all users

---

## Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| RFC Review | 2 days | Architecture team |
| Implementation | 3 days | Integration dev |
| Staging Testing | 2 days | QA |
| Production Deploy | 1 day | DevOps |
| **Total** | **8 days** | - |

---

## Approval Signatures

- [ ] **Architecture Team Lead** - Approved
- [ ] **Database Admin** - Reviewed migration
- [ ] **AI/ML Dev** - Confirmed classifier update
- [ ] **Automation Engineer** - Approved n8n changes
- [ ] **Frontend Dev** - Confirmed UI compatibility

---

## Related Documents

- `ARCHITECTURE_GOVERNANCE.md` - Governance process
- `migrations/2025_10_07_03_add_equipment_category.sql` - Migration script
- `docs/generated/label-taxonomy-v1.1.json` - Updated intent taxonomy

---

## Notes

This RFC serves as a **template** for all future contract changes. Use this structure when proposing changes to frozen contracts.

---

**Status**: Example Template - Not for actual implementation  
**Next Steps**: Review this template, then create real RFCs following this format


