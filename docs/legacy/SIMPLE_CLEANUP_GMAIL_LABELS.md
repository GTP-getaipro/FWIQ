# Simple Cleanup: Remove GOOGLE REVIEW Subfolders

Since the production bundle doesn't expose the modules, here's a **manual step-by-step** approach:

---

## ✅ Manual Cleanup (5 minutes)

### Step 1: Delete from Gmail

1. **Open Gmail** in another tab
2. **Click Settings** (gear icon) → **See all settings**
3. **Click "Labels" tab**
4. **Find these labels:**
   - `GOOGLE REVIEW/New Reviews`
   - `GOOGLE REVIEW/Review Responses`
   - `GOOGLE REVIEW/Review Requests` (if exists)

5. **For each one:**
   - Click "remove" (NOT delete - just removes the label)
   - Confirm removal

**Result:** Labels are removed from Gmail

---

### Step 2: Sync Database

Now click the **"Sync Folders from Gmail"** button on your dashboard:

1. Refresh dashboard (F5)
2. Widget should show "Database Not Synced" or similar
3. Click the green **"Sync Folders from Gmail"** button
4. Wait 5 seconds
5. Widget refreshes to show **58/58 folders (100%)**

---

## ✅ Expected Result

**Before:**
```
✅ All Folders Healthy
61/61 folders found (100%)

⚠️ AI Classifier Coverage  
58/61 folders classifiable (95%)
Found 3 folders that the AI classifier cannot handle:
  • GOOGLE REVIEW
  • GOOGLE REVIEW/New Reviews
  • GOOGLE REVIEW/Review Responses
```

**After:**
```
✅ All Folders Healthy
58/58 folders found (100%)

✅ AI Classifier Coverage
58/58 folders classifiable (100%)
No warnings
```

---

## 🎯 Alternative: Direct API Call

If you want to use the console, here's a version that works without imports:

### Step 1: Get Your Gmail Access Token

The console already shows you have a token. Run this to get it:

```javascript
// This will be in your session storage or you can see it in Network tab
localStorage.getItem('gmail_access_token')
```

### Step 2: Delete Labels via Gmail API

Replace `YOUR_ACCESS_TOKEN` and `LABEL_ID` with actual values:

```javascript
// Delete GOOGLE REVIEW/New Reviews
fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels/LABEL_ID_HERE', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
}).then(r => console.log('Deleted:', r.status));

// Repeat for GOOGLE REVIEW/Review Responses with its LABEL_ID
```

### Step 3: Refresh Dashboard

Press F5 and click "Sync Folders from Gmail"

---

## 💡 Easiest Method: Just Use Gmail UI

**Recommended:** Just delete the labels in Gmail settings (Step 1 above), then click the sync button on dashboard. This is the safest and simplest approach!

---

## ✅ After This Cleanup

- New users will never get these subfolders (code is fixed)
- Your dashboard will show 100% classifier coverage
- All review emails will go to single GOOGLE REVIEW folder
- N8N automation will work at 100% efficiency

**Total time: 2-3 minutes** (Gmail UI is fastest)

