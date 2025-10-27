# Execute Complete Standardization - Action Plan

**Pushed to GitHub:** Commit f6f6d5b  
**Status:** Ready to execute  
**Time Required:** 30-45 minutes  

---

## Step 1: Run Database Migrations (10 minutes)

### In Supabase SQL Editor, run these migrations IN ORDER:

**Migration 1:** `supabase/migrations/20241027_standardize_user_id.sql`
- Converts all client_id to user_id across 6 tables
- Updates foreign keys and RLS policies
- Creates proper indexes

**Migration 2:** `supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql`
- Adds missing columns to communication_styles table
- Fixes the 400 Bad Request error

**Migration 3:** Refresh schema cache
```sql
NOTIFY pgrst, 'reload schema';
```

**Wait 10 seconds after running all migrations.**

---

## Step 2: Verify Migrations Worked (2 minutes)

Run verification queries from `VERIFY_TABLES.sql`:

```sql
-- Should return 0 (no tables with client_id)
SELECT COUNT(*) FROM information_schema.columns
WHERE column_name = 'client_id' AND table_schema = 'public';

-- Should return 1 (business_profiles exists)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'business_profiles' AND table_schema = 'public';

-- Should show all new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'communication_styles'
ORDER BY ordinal_position;
```

---

## Step 3: Update All Frontend Code (15 minutes)

### Option A: Run Automated Script (Recommended)

```bash
cd c:\FloWorx-Production
node scripts/standardize-user-id.cjs
```

This will:
- Scan all 228 files
- Replace all client_id with user_id
- Show you what was changed
- Create a summary report

### Option B: Manual Updates (If script fails)

Search and replace in your IDE:
1. Open VS Code / Cursor
2. Press Ctrl + Shift + H (Find in Files)
3. Find: `client_id`
4. Replace: `user_id`
5. Include: `src/**/*.js, src/**/*.jsx`
6. Replace All

---

## Step 4: Review Changes (5 minutes)

```bash
git diff
```

**What to look for:**
- client_id changed to user_id
- clientId changed to userId
- No unexpected changes
- All files still have valid syntax

---

## Step 5: Commit & Push (2 minutes)

```bash
git add src/
git commit -m "refactor: Standardize all client_id to user_id in frontend code"
git push origin master
```

---

## Step 6: Redeploy Both Services (10 minutes)

### In Coolify:

**Deploy FWIQBack:**
1. Click FWIQBack
2. Click Redeploy
3. Wait for "Deployment Finished"

**Deploy FWIQFront:**
1. Click FWIQFront
2. Click Redeploy
3. Wait for "Deployment Finished"

---

## Step 7: Test Complete System (10 minutes)

### Test Checklist:

1. **Hard refresh browser** (Ctrl + Shift + R)

2. **Test Registration:**
   - Register new user
   - Verify email
   - Should redirect to onboarding

3. **Test Onboarding:**
   - Step 1: Connect Gmail/Outlook
   - Step 2: Select business type
   - Step 3: Add managers/suppliers
   - Step 4: Fill business information
   - Step 5: Deploy workflow

4. **Verify No Errors:**
   - Open Console (F12)
   - Should NOT see:
     - "client_id" anywhere
     - 400 Bad Request on communication_styles
     - 406 Not Acceptable on business_profiles
     - null value in column "user_id"

5. **Verify Success Messages:**
   - Workflow deployed to N8N: {id}
   - Workflow record stored successfully
   - Business profile created
   - Labels provisioned

---

## Success Criteria

System is fully standardized when:

- [ ] All database migrations completed
- [ ] No client_id columns in database
- [ ] All code uses user_id
- [ ] Both services deployed successfully
- [ ] Complete onboarding works end-to-end
- [ ] Workflow deployment succeeds
- [ ] No console errors
- [ ] Favicon shows correctly

---

## If Something Breaks

### Rollback Database:
```sql
-- Don't do this unless absolutely necessary
-- Contact developer first
```

### Rollback Code:
```bash
git revert HEAD
git push origin master
# Then redeploy in Coolify
```

---

## Current Status

**Created:**
- Database migration for user_id standardization
- Communication styles enhancement migration
- Automated standardization script
- Coding standards documentation
- Complete implementation plan

**Fixed:**
- src/lib/workflowDeployer.js
- src/lib/enhancedWorkflowDeployer.js
- index.html (favicon)

**Ready to Execute:**
- Database migrations
- Code standardization script
- Redeployment
- Testing

---

## Next Action

**RIGHT NOW:** Go to Supabase and run the 2 migrations:
1. `20241027_standardize_user_id.sql`
2. `20250122_enhance_communication_styles_for_voice_training.sql`

Then let me know if they complete successfully!

