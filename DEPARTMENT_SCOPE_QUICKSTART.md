# Department Scope Feature - Quick Start Guide

**Feature:** One Profile = One Department = One Workflow  
**Status:** ✅ Implemented & Ready to Deploy  
**Time to Deploy:** ~30 minutes

---

## 🎯 What This Feature Does

Allows FloWorx users to configure their workflow to handle **one specific department** instead of all emails.

### **Perfect For:**

**Medium-Sized Businesses:**
```
Hailey's Profile:
  Email: sales@thehottubman.ca
  Department: Sales Only
  Processes: SALES, FORMSUB
  Ignores: Everything else
  
Jillian's Profile:
  Email: support@thehottubman.ca
  Department: Support Only
  Processes: SUPPORT, URGENT
  Ignores: Everything else
  
Aaron's Profile:
  Email: ops@thehottubman.ca
  Department: Operations Only
  Processes: MANAGER, SUPPLIERS, BANKING
  Ignores: Everything else
```

---

## 🚀 How to Deploy (3 Steps)

### **Step 1: Run Database Migration** (5 min)

```bash
# Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/[your-project]/sql
2. Copy contents from: supabase/migrations/20251030_add_department_scope.sql
3. Paste and click "Run"
4. Verify success message

# OR via CLI
supabase db push
```

**Verify:**
```sql
SELECT department_scope FROM business_profiles LIMIT 1;
-- Should return 'all' (existing profiles default to Office Hub)
```

---

### **Step 2: Deploy Code** (15 min)

```bash
# Deploy Edge Function
cd supabase/functions
supabase functions deploy deploy-n8n

# Deploy Frontend
git add -A
git commit -m "feat: Add department scope - one profile, one department, one flow"
git push origin master

# Coolify will auto-deploy (or trigger manual rebuild)
```

---

### **Step 3: Test** (10 min)

```bash
# Test 1: Existing user (should default to 'all')
1. Login as existing user
2. Check dashboard → Should show "📧 Office Hub"
3. Send test email → Should process normally

# Test 2: Change to department scope
1. Go to Settings → Email Integration
2. Change department to "Sales Only"
3. Redeploy workflow
4. Send sales email → ✅ Processed
5. Send support email → ⚠️ OUT_OF_SCOPE
```

---

## 💡 How to Use

### **For Small Businesses (1-10 people):**

**Use "Office Hub" (Default):**
- One email: office@business.com
- Handles everything
- AI routes automatically
- **Simple, recommended**

---

### **For Medium Businesses (10+ people):**

**Create Department-Specific Profiles:**

**Profile 1: Sales Manager**
```
Name: Hailey
Email: sales@thehottubman.ca
Department: Sales Only
Manages: Sales inquiries, quotes, form submissions
```

**Profile 2: Support Manager**
```
Name: Jillian
Email: support@thehottubman.ca
Department: Support Only
Manages: Customer support, technical help, emergencies
```

**Profile 3: Operations Manager**
```
Name: Aaron
Email: ops@thehottubman.ca
Department: Operations Only
Manages: Suppliers, banking, internal operations
```

**Each person:**
- ✅ Signs up with their department email
- ✅ Selects their department scope
- ✅ Gets their own focused workflow
- ✅ Only sees relevant emails

---

## 🎨 UI Preview

### **Onboarding (Step 2):**

```
┌─────────────────────────────────────────────────┐
│  What does this email handle?                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  [🏢 All Departments (Office Hub) - Recommended ▼]
│                                                  │
│  Other options:                                 │
│  - 💰 Sales Only                                │
│  - 🛠️ Support Only                             │
│  - ⚙️ Operations Only                          │
│  - 🚨 Urgent/Emergency Only                     │
│  - ⚡ Custom (Advanced)                         │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ ✅ Office Hub Mode:                      │  │
│  │ Processes ALL email types and routes to │  │
│  │ appropriate team members automatically.  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### **Dashboard Header:**

```
FloWorx [💰 Sales Department]
```
or
```
FloWorx [📧 Office Hub (All Departments)]
```

---

## 📊 Department Options

| Department | Emoji | Processes | Ignores |
|-----------|-------|-----------|---------|
| **All** (Office Hub) | 📧 | Everything | Nothing |
| **Sales** | 💰 | SALES, FORMSUB | SUPPORT, URGENT, MANAGER, etc. |
| **Support** | 🛠️ | SUPPORT, URGENT | SALES, MANAGER, BANKING, etc. |
| **Operations** | ⚙️ | MANAGER, SUPPLIERS, BANKING, RECRUITMENT | SALES, SUPPORT, etc. |
| **Urgent** | 🚨 | URGENT only | Everything else |
| **Custom** | ⚡ | User-defined | User-defined |

---

## 🔧 Technical Details

### **How It Works:**

**1. User Selects Department** (Onboarding)
```jsx
<select onChange={handleDepartmentChange}>
  <option value="all">All Departments</option>
  <option value="sales">Sales Only</option>
</select>
```

**2. Saved to Database**
```sql
INSERT INTO business_profiles (department_scope) 
VALUES ('sales');
```

**3. Deployment Reads Scope**
```typescript
const departmentScope = businessProfile.department_scope; // 'sales'
```

**4. AI System Message Updated**
```
🎯 DEPARTMENT SCOPE: SALES ONLY

ALLOWED CATEGORIES:
  ✅ SALES
  ✅ FORMSUB

FOR OTHER EMAILS:
Return OUT_OF_SCOPE
```

**5. Runtime Classification**
```javascript
// Sales email
{ primary_category: "SALES" } ✅ Processed

// Support email  
{ primary_category: "OUT_OF_SCOPE" } ⚠️ Labeled only
```

---

## 📝 Quick Reference

### **Default Values:**

```javascript
department_scope: 'all'  // Office Hub (existing users)
```

### **Valid Values:**

```javascript
'all'        // Office Hub (all departments)
'sales'      // Sales Department only
'support'    // Support Department only
'operations' // Operations Department only
'urgent'     // Emergency Department only
'custom'     // Custom categories
```

### **Category Mappings:**

```javascript
sales      → ['SALES', 'FORMSUB']
support    → ['SUPPORT', 'URGENT']
operations → ['MANAGER', 'SUPPLIERS', 'BANKING', 'RECRUITMENT']
urgent     → ['URGENT']
all        → ['*']  // Everything
```

---

## 🎉 Benefits

### **For Users:**

✅ **Focused Workflows** - Only see relevant emails  
✅ **Clearer Responsibilities** - Each person owns their department  
✅ **Better Organization** - Department-specific processing  
✅ **Flexibility** - Can use Office Hub OR department mode  

### **For FloWorx:**

✅ **Market Expansion** - Serves medium businesses  
✅ **Revenue Growth** - 3 profiles × $50 = $150/month vs $50  
✅ **Competitive Edge** - Unique feature  
✅ **Upsell Path** - Start with Hub, upgrade to departments  

---

## 🚀 Next Steps

### **Today:**
```bash
1. Run migration (5 min)
2. Deploy code (15 min)
3. Test (10 min)
```

### **This Week:**
```
4. Monitor usage
5. Gather feedback
6. Fix any issues
```

### **Next Month:**
```
7. Add department analytics
8. Inter-department forwarding (optional)
9. Custom category UI (optional)
```

---

## ✅ Success Criteria

**Feature is successful when:**

- ✅ Department selector appears in onboarding
- ✅ Selection saves to database
- ✅ Dashboard shows department badge
- ✅ AI filters categories correctly
- ✅ OUT_OF_SCOPE emails labeled properly
- ✅ No breaking changes for existing users
- ✅ 5-10% of users adopt department scope

---

## 📞 Support

**If Issues Arise:**

1. **Check migration ran:**
   ```sql
   SELECT * FROM business_profiles LIMIT 1;
   -- Should have department_scope column
   ```

2. **Check edge function deployed:**
   ```bash
   supabase functions list
   # deploy-n8n should show recent timestamp
   ```

3. **Check logs:**
   ```bash
   supabase functions logs deploy-n8n --follow
   # Look for: "🏢 Department Scope: ..."
   ```

---

## 🎯 The Bottom Line

**What:** One profile, one department, one workflow  
**Why:** Enables medium business support  
**How:** 4 file changes, 1 database migration  
**When:** Ready to deploy NOW  
**Effort:** 1 day of development  
**Value:** Huge (market expansion + revenue growth)  

---

**✅ IMPLEMENTATION COMPLETE - READY FOR PRODUCTION! 🚀**

**See full details:** `DEPARTMENT_SCOPE_IMPLEMENTATION_COMPLETE.md`  
**Testing guide:** `docs/DEPARTMENT_SCOPE_TESTING_GUIDE.md`

