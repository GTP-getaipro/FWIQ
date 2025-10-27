# N8N Folder Mapping - How It Works

## 📊 Data Structure Flow

### 1. Email Labels Storage (`profiles.email_labels`)
```json
{
  "BANKING": { 
    "id": "Label_abc123xyz", 
    "name": "BANKING",
    "color": { "backgroundColor": "#ff0000" }
  },
  "FORMSUB": { 
    "id": "Label_def456", 
    "name": "FORMSUB" 
  },
  "GOOGLE REVIEW": { 
    "id": "Label_ghi789", 
    "name": "GOOGLE REVIEW" 
  },
  "MANAGER": { 
    "id": "Label_jkl012", 
    "name": "MANAGER" 
  }
}
```

**Key Points:**
- Key = Actual folder name (as it appears in Gmail/Outlook)
- Value = Object with `id` (Gmail Label ID or Outlook Folder ID) and `name`

---

### 2. N8N Routing (`getFolderIdsForN8n`)

This function transforms `email_labels` into n8n-friendly format:

```javascript
// Source: src/lib/labelSyncValidator.js line 1803-1834
Object.entries(labelMap).forEach(([labelName, labelData]) => {
  const folderId = labelData.id;
  
  // Simple mapping: folder name -> folder ID
  simpleMapping[labelName] = folderId;
  
  // Categorize by top-level folder
  const topLevelFolder = labelName.split('/')[0];
  if (!categories[topLevelFolder]) {
    categories[topLevelFolder] = [];
  }
  categories[topLevelFolder].push(folderId);
});

// Build routing configuration for n8n classifier
const routing = {
  banking: categories['BANKING'] || [],
  support: categories['SUPPORT'] || [],
  sales: categories['SALES'] || [],
  suppliers: categories['SUPPLIERS'] || [],
  urgent: categories['URGENT'] || [],
  forms: categories['FORMS'] || categories['FORMSUB'] || [],  // Handles both
  social: categories['SOCIAL'] || categories['SOCIALMEDIA'] || [],  // Handles both
  phone: categories['PHONE'] || [],
  misc: categories['MISC'] || []
};
```

**Result sent to N8N:**
```json
{
  "provider": "gmail",
  "folders": {
    "BANKING": { "id": "Label_abc123xyz", "name": "BANKING" },
    "FORMSUB": { "id": "Label_def456", "name": "FORMSUB" }
  },
  "categories": {
    "BANKING": ["Label_abc123xyz"],
    "FORMSUB": ["Label_def456"]
  },
  "routing": {
    "banking": ["Label_abc123xyz"],
    "forms": ["Label_def456"],
    "social": [],
    "phone": []
  },
  "simpleMapping": {
    "BANKING": "Label_abc123xyz",
    "FORMSUB": "Label_def456"
  }
}
```

---

### 3. N8N Classifier Categories

The n8n AI classifier uses these **category names**:

```javascript
// N8N expects these categories (lowercase, simplified)
{
  "Banking",      // Maps to BANKING
  "FormSub",      // Maps to FORMSUB
  "GoogleReview", // Maps to GOOGLE REVIEW
  "Manager",      // Maps to MANAGER
  "Suppliers",    // Maps to SUPPLIERS
  "Support",      // Maps to SUPPORT
  "Sales",        // Maps to SALES
  "Phone",        // Maps to PHONE
  "Urgent",       // Maps to URGENT
  "Socialmedia",  // Maps to SOCIALMEDIA
  "Recruitment",  // Maps to RECRUITMENT
  "Promo",        // Maps to PROMO
  "Misc"          // Maps to MISC
}
```

---

## ✅ How `createMissingFolders` Works Correctly

### Current Implementation:

```javascript
// Creates the folder via Gmail/Outlook API
const folderId = await createGmailLabel(accessToken, folderName);

// Stores in email_labels with correct structure
currentLabels[folderName] = {
  id: folderId,      // Gmail Label ID (e.g., "Label_abc123")
  name: folderName   // Actual folder name (e.g., "BANKING")
};

// Updates profile
await supabase.from('profiles').update({ 
  email_labels: currentLabels  // Contains BANKING, FORMSUB, etc.
});
```

### Why This Works:

1. **Folder Name as Key:** `currentLabels["BANKING"]` - n8n can find it
2. **ID Mapping:** `{ id: "Label_abc123" }` - Gmail/Outlook can find it
3. **Name Preserved:** `{ name: "BANKING" }` - Human-readable reference

When n8n workflow runs:
```javascript
// 1. getFolderIdsForN8n() reads email_labels
const labelMap = profile.email_labels;
// { "BANKING": { id: "Label_abc123", name: "BANKING" } }

// 2. Builds routing
routing.banking = categories['BANKING'];
// ["Label_abc123"]

// 3. N8N classifier categorizes email as "Banking"
const category = await classifyEmail(email);
// "Banking"

// 4. N8N gets folder ID from routing
const folderId = routing[category.toLowerCase()][0];
// "Label_abc123"

// 5. Gmail API moves email to folder
await gmail.users.messages.modify({
  addLabelIds: [folderId]  // "Label_abc123"
});
```

---

## 🎯 Category Name Mapping

| Gmail/Outlook Folder | email_labels Key | N8N Category | routing Key |
|---------------------|------------------|--------------|-------------|
| BANKING | `"BANKING"` | "Banking" | `banking` |
| FORMSUB | `"FORMSUB"` | "FormSub" | `forms` |
| GOOGLE REVIEW | `"GOOGLE REVIEW"` | "GoogleReview" | `social` (or dedicated) |
| MANAGER | `"MANAGER"` | "Manager" | `manager` |
| SUPPLIERS | `"SUPPLIERS"` | "Suppliers" | `suppliers` |
| SUPPORT | `"SUPPORT"` | "Support" | `support` |
| SALES | `"SALES"` | "Sales" | `sales` |
| PHONE | `"PHONE"` | "Phone" | `phone` |
| URGENT | `"URGENT"` | "Urgent" | `urgent` |
| SOCIALMEDIA | `"SOCIALMEDIA"` | "Socialmedia" | `social` |
| RECRUITMENT | `"RECRUITMENT"` | "Recruitment" | `recruitment` |
| PROMO | `"PROMO"` | "Promo" | `promo` |
| MISC | `"MISC"` | "Misc" | `misc` |

---

## 🔍 Verification Query

To check if folders are properly mapped for n8n:

```sql
SELECT 
  id,
  email,
  jsonb_object_keys(email_labels) as folder_names,
  email_labels
FROM profiles
WHERE id = 'user-id';
```

Expected output:
```
folder_names | BANKING
folder_names | FORMSUB
folder_names | GOOGLE REVIEW
...

email_labels | {
  "BANKING": {"id": "Label_123", "name": "BANKING"},
  "FORMSUB": {"id": "Label_456", "name": "FORMSUB"}
}
```

---

## ✅ Summary

The `createMissingFolders` function correctly:

1. **Creates folder** via Gmail/Outlook API
2. **Stores with correct key** (actual folder name like "BANKING")
3. **Includes ID** for API operations
4. **Preserves name** for human reference
5. **N8N can map it** via `getFolderIdsForN8n()` routing logic

**No additional mapping needed!** The system already handles the translation from folder names to n8n categories internally.

---

**Key Files:**
- `src/lib/folderHealthCheck.js` - Creates missing folders
- `src/lib/labelSyncValidator.js` - Maps folders for n8n (getFolderIdsForN8n)
- `src/lib/labelProvisionService.js` - Full provisioning system
- `src/components/dashboard/FolderHealthWidget.jsx` - UI for fixes

