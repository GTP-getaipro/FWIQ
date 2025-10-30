# Business Information Page - Required Updates

## 🎯 Changes Needed After Manager Forwarding Feature

Since we now have **Managers with Roles** from Team Setup, several fields on Business Information page are **redundant**.

---

## ❌ Fields to REMOVE (Redundant)

### **1. Primary Contact Name** ❌
**Current:** "Hailey"  
**Why Remove:** Already captured in Managers list (Team Setup)  
**Replacement:** Use first manager or manager with most roles  

### **2. Primary Contact Role** ❌
**Current:** "Manager"  
**Why Remove:** Managers have specific roles (Sales Manager, Service Manager, etc.)  
**Replacement:** Auto-populate from managers with roles  

### **3. Secondary Contact Name** ❌
**Current:** "Jane Doe"  
**Why Remove:** Can be added as another manager in Team Setup  
**Replacement:** Add as second manager with appropriate roles  

### **4. Secondary Contact Email** ❌
**Current:** "support@yourbusiness.com"  
**Why Remove:** Managers have individual emails for forwarding  
**Replacement:** Add as manager with Support Lead role  

### **5. Support Email** ❌
**Current:** "help@yourbusiness.com"  
**Why Remove:** Support Lead manager's email serves this purpose  
**Replacement:** Manager with Support Lead role gets support emails  

---

## ✅ Fields to KEEP (Essential)

### **1. Primary Contact Email** ✅ (Rename)
**Current:** "office@thehottubman.ca"  
**New Label:** "Billing/Account Email"  
**Purpose:** Main business email for billing, account management, admin  
**Usage:** Not for routing, just for business records  

**Updated UI:**
```
Billing/Account Email*
└─ Main business email for billing and account management
   [office@thehottubman.ca         ]
   
ℹ️ Auto-filled from your login email
```

---

### **2. After Hours Support Line** ✅
**Current:** "(403) 550-5140"  
**Keep Because:** Injected into AI for emergency routing  
**Usage:** `<<<AFTER_HOURS_PHONE>>>` in AI prompts  

**UI unchanged - this is good!**

---

### **3. Website** ✅
**Current:** "thehottubman.ca"  
**Keep Because:** Used in AI for form links and references  
**Usage:** Fallback for call-to-action links  

---

### **4. Social Media Links** ✅
**Current:** "https://facebook.com/yourbusiness"  
**Keep Because:** Just implemented - injected into AI signature  
**Usage:** `<<<SOCIAL_MEDIA_LINKS>>>` in AI prompts  

---

### **5. Reference Forms** ✅
**Current:** (section exists)  
**Keep Because:** Just implemented - custom form links for AI  
**Usage:** `<<<CALL_TO_ACTION_OPTIONS>>>` in AI prompts  

---

## 🔧 Recommended New Structure

### **Contact Info Section (Simplified):**

```
┌──────────────────────────────────────────────────────────┐
│ 📧 Contact Info                                          │
├──────────────────────────────────────────────────────────┤
│ Business & Billing                                       │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Billing/Account Email*                             │  │
│ │ Main business email for billing and admin          │  │
│ │ [office@thehottubman.ca                   ] ✅     │  │
│ │ (Auto-filled from your login)                      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Emergency Contact                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ After-Hours Emergency Phone                        │  │
│ │ For urgent customer issues outside business hours  │  │
│ │ [(403) 550-5140                           ]        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Online Presence                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Website URL                                        │  │
│ │ [thehottubman.ca                          ]        │  │
│ │                                                     │  │
│ │ Social Media Links                                 │  │
│ │ [https://facebook.com/hottubman           ] [X]    │  │
│ │ [+ Add Social Link]                                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Reference Forms (for AI to suggest to customers)        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Repair Request] [https://hottubman.ca/repairs] [X]│  │
│ │ [Product Info  ] [https://hottubman.ca/spas   ] [X]│  │
│ │ [+ Add Form Link]                                  │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Before vs After

### **Before (Current - 10 fields):**
```
1. Primary Contact Name* ❌ Redundant
2. Primary Contact Role* ❌ Redundant
3. Primary Contact Email* ✅ Keep (rename)
4. Secondary Contact Name ❌ Redundant
5. Secondary Contact Email ❌ Redundant
6. Support Email ❌ Redundant
7. After Hours Phone ✅ Keep
8. Website ✅ Keep
9. Social Media ✅ Keep
10. Reference Forms ✅ Keep
```

### **After (Simplified - 5 fields):**
```
1. Billing/Account Email* ✅ (renamed from Primary Contact Email)
2. After-Hours Phone ✅
3. Website ✅
4. Social Media Links ✅
5. Reference Forms ✅
```

**Result:** 50% reduction in fields (10 → 5)

---

## 💡 Why This Works

### **Manager Team Setup Now Handles:**
```
Team Setup (Previous Step):
├─ Mark Johnson (Sales Manager) - mark@personal.com
├─ Jillian Smith (Service Manager) - jillian@personal.com
└─ Sarah Williams (Support Lead) - sarah@personal.com

Covers what used to be:
- ✅ Primary Contact (Mark = first manager)
- ✅ Primary Role (Sales Manager = his role)
- ✅ Secondary Contact (Jillian = second manager)
- ✅ Support Email (Sarah = Support Lead)
```

### **Business Info Page Now Focuses On:**
- ✅ Billing/admin email (not for routing)
- ✅ Emergency phone (for AI urgent responses)
- ✅ Online presence (website, social)
- ✅ Customer forms (for AI to suggest)

**Clean separation of concerns!**

---

## 🔧 Implementation

**File to Update:** `src/pages/onboarding/StepBusinessInformation.jsx`

**Changes:**
1. Remove 5 redundant fields
2. Rename "Primary Contact Email" → "Billing/Account Email"
3. Auto-fill from `auth.user.email`
4. Keep emergency, website, social, forms fields

**Estimated Time:** 30 minutes

---

## ✅ Summary

**Remove:** Primary/Secondary Contact Name/Role, Support Email (5 fields)  
**Keep:** Billing Email, After-Hours Phone, Website, Social, Forms (5 fields)  
**Result:** Simpler, cleaner form with no redundancy  

**All managers info is now in Team Setup with:**
- ✅ Multiple roles
- ✅ Email forwarding
- ✅ Intelligent routing

**Should I implement these changes to simplify the Business Info page?** 🚀
