# 🚀 Deployment Checklist - Verify All Fixes Are Live

**Latest Commit**: `063cb3c` - Complete client_id → user_id standardization  
**Status**: ✅ Pushed to master  
**Waiting**: Coolify rebuild  

---

## 🔍 How to Check If New Code is Deployed

### 1. Check Bundle Hash in Browser Console

**Currently Running**:
```
index-DdBeReGR.js  ❌ OLD BUNDLE
```

**After Successful Deploy**:
```
index-XXXXXXXX.js  ✅ NEW BUNDLE (different hash)
```

**How to Check**:
- Open DevTools (F12)
- Look at console logs
- Check the filename: `index-XXXXXXXX.js`
- If hash changed → New code deployed! ✅

---

### 2. Check Console Logs for New Messages

**Old Code Shows**:
```
❌ column workflows.client_id does not exist
🔄 Adding 4 top-level supplier folders
✅ Added top-level manager folder: Hailey
```

**New Code Shows**:
```
✅ No client_id errors
🏗️ SKELETON MODE: Creating core business folders only
✅ Updated MANAGER folder with Unassigned + 4 manager subfolders
✅ Updated SUPPLIERS folder with 4 subfolders
📧 Supplier domains for classifier: [...]
```

---

### 3. Check Coolify Deployment Dashboard

**FWIQFront Deployments**:
- [ ] Shows commit: `063cb3c`
- [ ] Status: Success (green)
- [ ] Deployed: Within last 5 minutes

---

## ✅ All Fixes That Need to Be in New Bundle

| Commit | Fix | Critical? |
|--------|-----|-----------|
| `063cb3c` | Complete client_id → user_id | 🔴 YES |
| `524c8b7` | Workflows client_id fix | 🔴 YES |
| `c32e0d2` | Skeleton-only in Step 3 | 🔴 YES |
| `761e484` | Dynamic folder hierarchy | 🔴 YES |
| `b48e563` | OAuth token handoff | 🔴 YES |
| `30eeb3c` | Business profile creation | 🔴 YES |

---

## 🧪 Test After Deployment

### Test 1: Bundle Hash Changed
```javascript
// In browser console
console.log(document.scripts[0].src);
// Should NOT be: index-DdBeReGR.js
// Should be: index-XXXXXXXX.js (new hash)
```

### Test 2: N8N Deployment Works
```
1. Go to /onboarding/deploy
2. Click "Activate Automation"
3. Check console:
   ✅ No "client_id does not exist" error
   ✅ Deployment proceeds
```

### Test 3: Fresh Onboarding (Complete Test)
```
1. New test user
2. Step 2: Connect Gmail
3. Step 3: Select business type
   - Check Gmail: MANAGER (Unassigned only), SUPPLIERS (empty)
4. Step 4: Add managers/suppliers
   - Click "Save & Continue"
   - Check Gmail: Folders injected NOW
5. Step 5: Deploy
   - Should work without errors
```

---

## ⚠️ If Bundle Hasn't Changed After 5 Minutes

### Manual Triggers:

**Option 1: Coolify Manual Redeploy**
1. Log into Coolify Dashboard
2. Navigate to FWIQFront
3. Click "Redeploy" or "Force Rebuild"
4. Wait for build (~2 min)

**Option 2: Clear All Browser Cache**
```
1. Ctrl + Shift + Delete
2. Select "All time"
3. Check "Cached images and files"
4. Clear data
5. Hard refresh: Ctrl + F5
```

**Option 3: Incognito/Private Window**
```
1. Open new incognito window
2. Go to app.floworx-iq.com
3. Check bundle hash
4. If still old → Coolify hasn't deployed yet
5. If new → Browser cache issue
```

---

## 📊 Expected Timeline

| Time | Event | Status |
|------|-------|--------|
| 12:36 PM | Saw client_id error | ❌ |
| ~12:38 PM | Pushed fix (063cb3c) | ✅ |
| ~12:40 PM | Coolify detects push | ⏳ |
| ~12:42 PM | Build completes | ⏳ |
| ~12:43 PM | New bundle live | ⏳ |

---

## ✅ Success Indicators

When new code is deployed, you'll see:

### In Coolify:
```
✅ Latest deployment: 063cb3c
✅ Status: Success
✅ Finished: < 5 minutes ago
```

### In Browser:
```
✅ New bundle hash (not DdBeReGR)
✅ No client_id errors
✅ Console shows new log messages
✅ Deployment works
```

### In Gmail:
```
✅ Proper folder hierarchy
✅ MANAGER/Name (nested)
✅ SUPPLIERS/Name (nested)
✅ No top-level duplicates
```

---

## 🆘 If Still Not Working

1. **Check Coolify Logs**:
   - Build logs might show errors
   - Deployment might have failed

2. **Check Git**:
   ```bash
   git log --oneline -5
   # Should show 063cb3c at top
   ```

3. **Verify Changes**:
   ```bash
   git show 063cb3c:src/lib/deployment.js | grep "user_id"
   # Should show user_id, not client_id
   ```

---

## 📋 Quick Checklist

Current Status:
- [x] All code fixes committed
- [x] All fixes pushed to master (063cb3c)
- [ ] Coolify detected push
- [ ] Coolify build started
- [ ] Coolify build succeeded
- [ ] New bundle deployed
- [ ] Browser cache cleared
- [ ] New bundle verified in browser
- [ ] N8N deployment tested

---

**All fixes are in master!** ✅  
**Waiting for Coolify to build commit 063cb3c** ⏳  
**ETA: 2-5 minutes from now** ⏰  

Check Coolify Dashboard for deployment progress! 🚀

