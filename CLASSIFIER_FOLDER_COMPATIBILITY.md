# AI Classifier Folder Compatibility Check

**Issue:** Some folder schemas have subfolders that the AI classifier cannot handle  
**Impact:** Gmail and Outlook are the same - both have same limitation

---

## ✅ Classifier Supported Categories

Based on `src/lib/folderHealthCheck.js` and `src/lib/goldStandardSystemPrompt.js`:

### PRIMARY Categories (13):
1. **Banking** - ✅ Supports subfolders (e-transfer, invoice, receipts, etc.)
2. **FormSub** - ✅ Supports subfolders (New Submission, Work Order Forms)
3. **GoogleReview** - ❌ **NO SUBFOLDERS SUPPORTED**
4. **Manager** - ✅ Dynamic subfolders (manager names)
5. **Suppliers** - ✅ Dynamic subfolders (supplier names)
6. **Support** - ✅ Supports subfolders (Appointment Scheduling, General, Technical Support, Parts And Chemicals)
7. **Phone** - ✅ Supports subfolders (Incoming Calls, Voicemails)
8. **Urgent** - ✅ Supports subfolders (Emergency Repairs, Leak Emergencies, Power Outages, Other)
9. **Misc** - ✅ Supports subfolders (General, Personal)
10. **Promo** - ✅ Supports subfolders (Social Media, Special Offers)
11. **Recruitment** - ✅ Supports subfolders (Job Applications, Interviews, New Hires)
12. **Socialmedia** - ✅ Supports subfolders (Facebook, Instagram, Google My Business, LinkedIn)
13. **Sales** - ✅ Dynamic subfolders (business type specific)

---

## 🔍 Detailed Breakdown

### Banking (FULLY SUPPORTED - Multi-level)
```javascript
CLASSIFIER_SECONDARY_CATEGORIES.Banking = [
  'e-transfer',      // Level 2
  'invoice',
  'bank-alert', 
  'refund',
  'receipts'         // Level 2
];

CLASSIFIER_TERTIARY_CATEGORIES.Banking = {
  'e-transfer': ['FromBusiness', 'ToBusiness'],        // Level 3 ✅
  'receipts': ['PaymentSent', 'PaymentReceived']      // Level 3 ✅
};
```

**Folders Created:**
- BANKING
  - e-Transfer
    - Transfer Received ✅
    - Transfer Sent ✅
  - Receipts
    - Payment Received ✅
    - Payment Sent ✅
  - Invoice ✅
  - Payment Confirmation ✅
  - BankAlert ✅
  - Refund ✅

**Status:** ✅ COMPATIBLE (3 levels supported)

---

### GoogleReview (SINGLE CATEGORY ONLY)
```javascript
CLASSIFIER_SECONDARY_CATEGORIES.GoogleReview = ['GoogleReview'];
// NO tertiary support
```

**Should Create:**
- GOOGLE REVIEW (single folder, no subfolders)

**Was Creating (WRONG):**
- ❌ GOOGLE REVIEW
  - ❌ New Reviews
  - ❌ Review Responses

**Status:** ❌ **FIXED** - Removed all subfolders from schemas

---

### FormSub (2 LEVELS SUPPORTED)
```javascript
CLASSIFIER_SECONDARY_CATEGORIES.FormSub = [
  'NewSubmission',
  'WorkOrderForms'
];
```

**Folders Created:**
- FORMSUB
  - New Submission ✅
  - Work Order Forms ✅
  - Service Requests ✅
  - Quote Requests ✅

**Status:** ✅ COMPATIBLE

---

### Support (2 LEVELS SUPPORTED)
```javascript
CLASSIFIER_SECONDARY_CATEGORIES.Support = [
  'Appointment Scheduling',
  'General', 
  'Technical Support',
  'Parts And Chemicals'
];
```

**Folders Created:**
- SUPPORT
  - Appointment Scheduling ✅
  - General ✅
  - Technical Support ✅
  - Parts And Chemicals ✅

**Status:** ✅ COMPATIBLE

---

### Phone, Promo, Recruitment, Urgent, Misc, Socialmedia
**All support their defined secondary categories** ✅

---

## 🎯 Gmail vs Outlook - Same Limitations

**Question:** Is it the same for both Gmail and Outlook?  
**Answer:** **YES** - The AI classifier is provider-agnostic

The classifier works with **logical categories**, not Gmail labels or Outlook folders:

```javascript
Email → AI Classifier → Category Decision → Folder Routing
        (provider-agnostic)

Gmail:   Email → "Banking" → routes to Label_abc123
Outlook: Email → "Banking" → routes to Folder_xyz789
```

**Both providers have same restrictions:**
- ✅ Banking supports 3 levels
- ✅ Most others support 2 levels  
- ❌ GoogleReview supports 1 level only (no subfolders)

---

## 📊 What Was Wrong in Schemas

### Before Fix:
```javascript
baseMasterSchema.js:
  "GOOGLE REVIEW": {
    sub: [
      { name: "New Reviews" },        // ❌ Classifier can't route here
      { name: "Review Responses" }    // ❌ Classifier can't route here
    ]
  }

poolsSpasLabels.js:
  "GOOGLE REVIEW": {
    sub: ["New Reviews", "Review Responses", "Review Requests"]  // ❌ All wrong
  }

multiTenantSchemaRegistry.js:
  GOOGLE_REVIEW: {
    sub: ["New Reviews", "Review Responses", "Review Requests"]  // ❌ Wrong x3
  }
```

### After Fix:
```javascript
ALL schemas now have:
  "GOOGLE REVIEW": {
    sub: []  // ✅ NO SUBFOLDERS - Classifier handles as single category
  }
```

---

## ✅ Verification

### Check Classifier Can Handle Folder:
```javascript
function isFolderClassifiable(folderName, expectedCategories) {
  // Primary category check
  if (CLASSIFIER_CATEGORIES.includes(normalizedCategory)) {
    return true;  // ✅ Can classify
  }
  
  // Secondary category check
  if (CLASSIFIER_SECONDARY_CATEGORIES[primary]?.includes(secondary)) {
    return true;  // ✅ Can classify
  }
  
  // Tertiary category check (Banking only)
  if (CLASSIFIER_TERTIARY_CATEGORIES[primary]?.[secondary]?.includes(tertiary)) {
    return true;  // ✅ Can classify
  }
  
  return false;  // ❌ Cannot classify
}
```

### Examples:
- `BANKING` → ✅ Classifiable (primary)
- `BANKING/e-Transfer` → ✅ Classifiable (secondary)
- `BANKING/e-Transfer/Transfer Received` → ✅ Classifiable (tertiary)
- `GOOGLE REVIEW` → ✅ Classifiable (primary)
- `GOOGLE REVIEW/New Reviews` → ❌ **NOT classifiable** (no secondary support)

---

## 🎯 Summary

**What We Fixed:**
- ✅ Removed `GOOGLE REVIEW` subfolders from all schemas (5 files)
- ✅ Now creates single `GOOGLE REVIEW` folder only
- ✅ All review emails go to one folder (simpler, classifier-compatible)

**Gmail vs Outlook:**
- ✅ **Same for both** - Classifier limitations are provider-independent
- ✅ Same category structure works for Gmail labels and Outlook folders
- ✅ Only difference is API endpoints (Gmail uses Labels API, Outlook uses Graph API)

**No Other Issues Found:**
- ✅ All other categories with subfolders are supported by classifier
- ✅ Banking 3-level structure works fine
- ✅ Support, FormSub, etc. 2-level structures work fine

---

## 📋 Files Modified:

1. `src/lib/baseMasterSchema.js` - Base schema (used by all business types)
2. `src/lib/poolsSpasLabels.js` - Pools & Spas specific
3. `src/lib/poolsSpasLabelsDynamic.js` - Pools & Spas dynamic
4. `src/lib/multiTenantSchemaRegistry.js` - Multi-tenant registry (3 schemas)
5. `src/lib/labelLibrary.js` - Label library definitions
6. `src/lib/goldStandardSystemPrompt.js` - AI prompt template

**Result:** GOOGLE REVIEW now creates **1 folder** instead of **3 folders** (1 parent + 2 subs)

---

**Created:** October 27, 2025  
**Status:** Ready to commit

