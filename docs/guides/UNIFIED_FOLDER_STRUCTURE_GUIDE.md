### 📋 Complete Migration Instructions

Apply these SQL scripts in order in your Supabase SQL Editor:

#### Step 1: Add Intent Columns (5 minutes)
```bash
# In Supabase SQL Editor, run:
migrations/add-intent-based-columns.sql
```

#### Step 2: Run Migration Script
```bash
# Update existing folders with new structure
node scripts/migrateToUnifiedFolders.js

# Or dry-run first
node scripts/migrateToUnifiedFolders.js --dry-run

# Or specific provider
node scripts/migrateToUnifiedFolders.js --provider=outlook
```

#### Step 3: Import n8n Node
```bash
# Generated file: n8n-label-generator-outlook.json
# Import into n8n workflow as "Label Generator" node
```

---

## 📊 Results After Migration

### Before (Business-Type-Specific)
```
❌ Pools Sales
❌ Spa Sales  
❌ Sauna Sales
❌ Cold Plunge Sales
❌ Accessory Sales
❌ Pool Maintenance
❌ Spa Maintenance
❌ ... 40+ folders
```

### After (Intent-Based)
```
✅ Sales/
   ├── Pools Sales
   ├── Spa Sales
   ├── Sauna & Icebath Sales
   ├── Accessory Sales
   ├── Quotes
   └── Denied

✅ Support/
   ├── Emergency Service
   ├── Technical Support
   ├── Maintenance
   └── ... (8 total)

✅ Operations/
✅ Marketing/
✅ HR/
✅ Admin/
✅ Unassigned/

Total: ~35 folders (40% reduction!)
```

---

## 🎯 n8n Integration

### Generated Label Map
```javascript
{
  "LEAD_POOLS": "AAMkAD...",
  "LEAD_SPA": "AAMkAD...",
  "LEAD_SAUNA": "AAMkAD...",
  "EMERGENCY": "AAMkAD...",
  "TECHNICAL": "AAMkAD...",
  "MAINTENANCE": "AAMkAD...",
  // ... all intents
}
```

### AI Classification → Folder Routing
```javascript
// In n8n Switch node
const intent = $json.classification; // From AI

// Map to folder
const folderId = $node["Label Generator"].json.labels[intent.toUpperCase()];

// Move email
moveEmailToFolder(folderId);
```

### Example Classifications
| Email Content | AI Classification | Intent | Folder |
|--------------|-------------------|--------|--------|
| "Need pool installation quote" | `lead_pools` | `LEAD_POOLS` | Sales/Pools Sales |
| "Spa heater not working" | `technical` | `TECHNICAL` | Support/Technical Support |
| "Instagram inquiry about hot tubs" | `instagram` | `INSTAGRAM` | Marketing/Social Media/Instagram |
| "Job application for technician" | `job_application` | `JOB_APPLICATION` | HR/Job Applications |

---

## 🔧 Troubleshooting

### Issue: Folders not updating
**Solution**: Check if `parent_id` column exists
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'business_labels' 
  AND column_name IN ('category', 'intent', 'path');
```

### Issue: n8n node not finding labels
**Solution**: Regenerate label map
```bash
node scripts/migrateToUnifiedFolders.js --provider=outlook
```

### Issue: 409 Conflict errors
**Solution**: Run the label sync first
```bash
node scripts/syncEmailLabels.js
```

---

## ✅ Verification

### Check Folder Structure
```sql
-- View migrated folders
SELECT 
  category,
  intent,
  path,
  label_name,
  COUNT(*) as count
FROM business_labels
WHERE is_deleted = FALSE
GROUP BY category, intent, path, label_name
ORDER BY category, path;
```

### Check Intent Coverage
```sql
-- Ensure all folders have intents
SELECT 
  label_name,
  category,
  intent
FROM business_labels
WHERE is_deleted = FALSE
  AND (category IS NULL OR intent IS NULL);
```

Should return 0 rows if migration is complete.

---

## 🎓 Best Practices

1. **Always sync before provisioning**: Prevents 409 conflicts
2. **Use intent, not name**: Intents are stable, names can change
3. **Test AI classification**: Ensure mappings are accurate
4. **Monitor unassigned folder**: Check for misclassified emails
5. **Update keywords**: Keep intent keywords current

---

## 📞 Support

- **Full Documentation**: [UNIFIED_FOLDER_STRUCTURE_GUIDE.md](./UNIFIED_FOLDER_STRUCTURE_GUIDE.md)
- **Label Sync System**: [LABEL_SYNC_SYSTEM.md](./LABEL_SYNC_SYSTEM.md)
- **Migration Scripts**: `scripts/migrateToUnifiedFolders.js`

---

**Migration Date**: January 7, 2025  
**Status**: ✅ Ready for deployment  
**Estimated Time**: 10-15 minutes per profile

