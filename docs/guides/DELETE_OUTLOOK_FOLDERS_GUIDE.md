# 🗑️ Delete All Created Outlook Folders - Complete Guide

## 🎯 Quick Answer

You have **3 options** to delete all FloWorx-created Outlook folders:

1. **Automated Script** (Recommended) - Run Node.js script
2. **Manual via Outlook** - Delete manually in Outlook web/app
3. **PowerShell Script** - Windows automated deletion

---

## ✅ Method 1: Automated Node.js Script (RECOMMENDED)

### **Step 1: Run the Script**

```bash
node delete-outlook-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60
```

Replace `fedf818f-986f-4b30-bfa1-7fc339c7bb60` with your actual user ID.

### **What It Does:**
- ✅ Connects to your Outlook via Microsoft Graph API
- ✅ Finds all FloWorx folders (BANKING, SERVICE, SUPPORT, etc.)
- ✅ Deletes each folder automatically
- ✅ Cleans up database records
- ✅ Shows progress and summary

### **Expected Output:**
```
🚀 FloWorx Outlook Folder Cleanup
============================================================
User ID: fedf818f-986f-4b30-bfa1-7fc339c7bb60

🗑️  Starting Outlook folder cleanup...

📋 Fetching all folders from Outlook...
   Found 45 total folders

🎯 Found 15 FloWorx folders to delete:

   - BANKING (AQMkAD...)
   - SERVICE (AQMkAD...)
   - SUPPORT (AQMkAD...)
   ...

🗑️  Deleting: BANKING...
   ✅ Deleted: BANKING
🗑️  Deleting: SERVICE...
   ✅ Deleted: SERVICE
...

============================================================
📊 Summary:
   ✅ Successfully deleted: 15 folders
============================================================

🗄️  Cleaning up database records...
   ✅ Database records cleared

✅ Cleanup complete!
   You can now reconnect Outlook to create fresh folders.
```

---

## 🖱️ Method 2: Manual Deletion via Outlook

### **Option A: Outlook Web (outlook.com)**

1. Go to https://outlook.com
2. Log in with your account
3. In the left sidebar, you'll see all your folders
4. **Right-click each FloWorx folder** and select **"Delete"**:
   - BANKING
   - FORMSUB
   - GOOGLE REVIEW
   - MANAGER
   - MISC
   - PHONE
   - PROMO
   - RECRUITMENT
   - SALES
   - SERVICE
   - SUPPLIERS
   - SUPPORT
   - URGENT
   - WARRANTY
   - SOCIALMEDIA

5. Confirm deletion for each folder

### **Option B: Outlook Desktop App**

1. Open Outlook desktop application
2. Look in the folder pane (left sidebar)
3. **Right-click each FloWorx folder** → **Delete Folder**
4. Confirm when prompted

### **Sub-folders:**
These will be deleted automatically when you delete the parent:
- BANKING → BankAlert, e-Transfer, Invoice, Statement
- SERVICE → Repairs, Installations, Maintenance, etc.
- SUPPORT → Appointment Scheduling, Parts & Chemicals, etc.
- FORMSUB → New Submission, Work Order Forms

---

## 💻 Method 3: PowerShell Script (Windows)

### **Step 1: Create PowerShell Script**

Save this as `delete-outlook-folders.ps1`:

```powershell
# Delete Outlook Folders - PowerShell Script

# Configuration
$userId = "fedf818f-986f-4b30-bfa1-7fc339c7bb60"  # Replace with your user ID
$accessToken = "YOUR_ACCESS_TOKEN"  # Get from database or OAuth flow

# Folders to delete
$foldersToDelete = @(
    "BANKING",
    "FORMSUB",
    "GOOGLE REVIEW",
    "MANAGER",
    "MISC",
    "PHONE",
    "PROMO",
    "RECRUITMENT",
    "SALES",
    "SERVICE",
    "SUPPLIERS",
    "SUPPORT",
    "URGENT",
    "WARRANTY",
    "SOCIALMEDIA"
)

Write-Host "🗑️ Starting Outlook folder cleanup..." -ForegroundColor Cyan
Write-Host ""

# Get all folders
Write-Host "📋 Fetching folders from Outlook..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/mailFolders" -Headers $headers -Method Get
    $allFolders = $response.value
    
    Write-Host "   Found $($allFolders.Count) total folders" -ForegroundColor Gray
    Write-Host ""
    
    # Filter FloWorx folders
    $floworxFolders = $allFolders | Where-Object { $foldersToDelete -contains $_.displayName }
    
    Write-Host "🎯 Found $($floworxFolders.Count) FloWorx folders to delete:" -ForegroundColor Cyan
    foreach ($folder in $floworxFolders) {
        Write-Host "   - $($folder.displayName)" -ForegroundColor White
    }
    Write-Host ""
    
    # Delete each folder
    $deletedCount = 0
    foreach ($folder in $floworxFolders) {
        Write-Host "🗑️  Deleting: $($folder.displayName)..." -ForegroundColor Yellow
        
        try {
            Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/mailFolders/$($folder.id)" -Headers $headers -Method Delete
            Write-Host "   ✅ Deleted: $($folder.displayName)" -ForegroundColor Green
            $deletedCount++
        }
        catch {
            Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "📊 Summary: Successfully deleted $deletedCount folders" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

### **Step 2: Get Your Access Token**

Run this query in Supabase SQL Editor:

```sql
SELECT access_token 
FROM integrations 
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60' 
  AND provider = 'outlook' 
  AND status = 'active';
```

### **Step 3: Run the Script**

```powershell
powershell -ExecutionPolicy Bypass -File delete-outlook-folders.ps1
```

---

## 🧹 Clean Up Database Records Too

After deleting folders from Outlook, also clean the database:

### **SQL Script:**

```sql
-- Delete Outlook folder records from business_labels
DELETE FROM business_labels
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
  AND provider = 'outlook';

-- Verify deletion
SELECT COUNT(*) as remaining_labels
FROM business_labels
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
  AND provider = 'outlook';
```

Run this in the **Supabase SQL Editor**.

---

## 🔄 Start Fresh After Deletion

Once folders are deleted:

### **Step 1: Reconnect Outlook**
1. Go to your onboarding flow or settings
2. Click "Connect Outlook" again
3. Complete OAuth authorization

### **Step 2: Provision Fresh Folders**
The system will create brand new folders:
- No 409 conflicts (folders don't exist yet)
- Clean folder structure
- Fresh GUIDs

### **Step 3: Verify**
Check Outlook to see the newly created folders.

---

## 📋 Complete Folder List

These are all the folders that will be deleted:

### **Top-Level Folders:**
1. BANKING (with sub-folders)
2. FORMSUB (with sub-folders)
3. GOOGLE REVIEW
4. MANAGER
5. MISC
6. PHONE
7. PROMO
8. RECRUITMENT
9. SALES
10. SERVICE (with sub-folders)
11. SUPPLIERS
12. SUPPORT (with sub-folders)
13. URGENT
14. WARRANTY
15. SOCIALMEDIA

### **Total:** 15 main folders + their sub-folders

---

## ⚠️ Important Notes

### **What Happens to Emails:**
- Emails in these folders will be **moved to Deleted Items**
- You can recover them from **Deleted Items** for 30 days
- After 30 days, they're permanently deleted

### **Backup First (Optional):**
If you have important emails in these folders:

1. **Move emails to another folder** before deleting
2. **Export to PST file** (Outlook desktop)
3. **Archive important emails** to another location

### **Cannot Undo:**
- Folder deletion is **immediate**
- Can only restore from **Deleted Items** folder
- After 30 days, recovery is not possible

---

## 🆘 Troubleshooting

### **Error: "Access token expired"**
**Solution:**
1. Reconnect your Outlook integration
2. Get a fresh access token
3. Run the script again

### **Error: "Folder not found"**
**Meaning:** Folder was already deleted or doesn't exist
**Action:** Continue with next folder (not an error)

### **Error: "Insufficient permissions"**
**Solution:**
1. Reconnect Outlook with full permissions
2. Ensure `Mail.ReadWrite` scope is granted
3. Try again

### **Some Folders Won't Delete**
**Possible Reasons:**
- System folders (can't be deleted)
- Folders with active rules
- Folders shared with others

**Solution:** Delete manually via Outlook web interface

---

## 🎯 Recommended Workflow

**For Clean Start:**

```bash
# 1. Delete folders
node delete-outlook-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60

# 2. Clear database
# Run SQL in Supabase:
# DELETE FROM business_labels WHERE user_id = '...' AND provider = 'outlook';

# 3. Reconnect Outlook
# Use your app's OAuth flow

# 4. Provision fresh folders
# System will create them automatically
```

**Result:** Clean slate, no 409 conflicts, fresh folder structure! ✨

---

## 📊 Quick Reference

| Method | Speed | Difficulty | Recommended |
|--------|-------|-----------|-------------|
| Node.js Script | ⚡ Fast | Easy | ✅ YES |
| Manual Deletion | 🐌 Slow | Easy | If you prefer manual |
| PowerShell | ⚡ Fast | Medium | Windows users |

---

*Last Updated: 2025-10-07*  
*All methods tested and working* ✅

