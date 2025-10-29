# Primary Contact vs. Managers - Usage Analysis

## 🔍 Current Status

### ❌ **Primary Contact Name (Business Info Page)**
**NOT currently used in AI system messages!**

**Where it's collected:**
- **Page:** Business Information (Onboarding Step 4)
- **Fields:**
  - Primary Contact Name: "John Doe"
  - Primary Contact Role: "Owner"
  - Primary Contact Email: "john@hottubman.ca"

**Where it's stored:**
```javascript
profiles.client_config.contact.primary = {
  name: "John Doe",
  role: "Owner",
  email: "john@hottubman.ca"
}
```

**Where it's used:**
- ❌ NOT in AI classifier system message
- ❌ NOT in AI draft reply system message
- ✅ Only stored in database for reference

---

### ✅ **Managers List (Team Setup Page)**
**ACTIVELY used in AI system messages!**

**Where it's collected:**
- **Page:** Team Setup (Onboarding Step 3)
- **Fields:**
  - Manager names: ["Mark Johnson", "Jillian Smith", "Sarah Williams"]
  - Manager roles: ["Sales Manager", "Service Manager", "Support Lead"]
  - Manager emails: ["mark@...", "jillian@...", "sarah@..."]

**Where it's stored:**
```javascript
profiles.client_config.managers = [
  { name: "Mark Johnson", role: "Sales Manager", email: "mark@..." },
  { name: "Jillian Smith", role: "Service Manager", email: "jillian@..." },
  { name: "Sarah Williams", role: "Support Lead", email: "sarah@..." }
]
```

**Where it's used:**
✅ **Injected into AI System Messages:**

```typescript
// supabase/functions/deploy-n8n/index.ts (Line 2899-2901)
${clientData.managers?.length > 0 ? 
  `### Team Members:\n${clientData.managers.map((m) => 
    `- **${m.name}**${m.role ? ` (${m.role})` : ''}${m.email ? ` - ${m.email}` : ''}`
  ).join('\n')}` 
  : ''
}

${clientData.managers?.length > 0 ? 
  `\n**Escalation**: Route critical issues to ${rules?.defaultEscalationManager || clientData.managers[0]?.name || 'management'}` 
  : ''
}
```

**AI Prompt Receives:**
```
### Team Members:
- **Mark Johnson** (Sales Manager) - mark@hottubman.ca
- **Jillian Smith** (Service Manager) - jillian@hottubman.ca
- **Sarah Williams** (Support Lead) - sarah@hottubman.ca

**Escalation**: Route critical issues to Mark Johnson

## 🔄 Follow-up Ownership & Clarity
Always state who will follow up and by when. Use concrete phrasing like:
- "You'll hear back from Mark on Thursday with the quote."
- "Jillian will call you tomorrow to schedule the service visit."
- "I'll have Sarah review your request and get back to you by end of day."
```

---

## 📊 Comparison Table

| Data Point | Collected From | Used in AI? | Purpose |
|------------|---------------|-------------|---------|
| **Primary Contact Name** | Business Info (Step 4) | ❌ **NO** | Database reference only |
| **Primary Contact Email** | Business Info (Step 4) | ❌ **NO** | Contact record only |
| **Managers List** | Team Setup (Step 3) | ✅ **YES** | AI assigns tasks to managers |
| **Default Escalation Manager** | Business Rules (Step 4) | ✅ **YES** | AI routes urgent issues |

---

## 🤔 Why Two Different Places?

### **Primary Contact (Business Info)**
- **Purpose:** Legal/administrative contact
- **Typical Use:** Owner, CEO, Primary account holder
- **Not Used by AI Because:** Too high-level, not involved in day-to-day operations

### **Managers (Team Setup)**
- **Purpose:** Operational team members
- **Typical Use:** Sales manager, service manager, support lead
- **Used by AI Because:** These are the people who actually respond to customers

---

## 💡 Real-World Example

**Your Setup:**

**Business Info (Step 4):**
- Primary Contact: **"Robert Smith"** (Owner)
- Primary Email: robert@hottubman.ca

**Team Setup (Step 3):**
- Manager 1: **"Mark Johnson"** (Sales Manager)
- Manager 2: **"Jillian Williams"** (Service Manager)
- Manager 3: **"Sarah Brown"** (Support Lead)

**What AI Says:**

❌ AI will NEVER say:
```
"Robert will call you tomorrow with a quote"
```

✅ AI will say:
```
"Mark will call you tomorrow with a quote"  (Sales Manager)
"Jillian will schedule your service visit"  (Service Manager)
"Sarah will help with your water chemistry question"  (Support Lead)
```

---

## 🔧 Current Implementation

### **In `supabase/functions/deploy-n8n/index.ts`:**

```typescript
// Line 1529: Extract managers for injection
const managersText = (clientData.managers || [])
  .map((m) => m.name)
  .join(', ');

// Line 1715: Inject into replacements
'<<<MANAGERS_TEXT>>>': managersText,

// Lines 2899-2904: Full manager context in AI prompt
${clientData.managers?.length > 0 ? 
  `### Team Members:\n${clientData.managers.map((m) => 
    `- **${m.name}**${m.role ? ` (${m.role})` : ''}${m.email ? ` - ${m.email}` : ''}`
  ).join('\n')}` 
  : ''
}
```

### **Primary Contact is NOT Injected:**
```typescript
// ❌ This is NOT in the code:
'<<<PRIMARY_CONTACT_NAME>>>': contact.primary?.name  // DOES NOT EXIST

// ❌ This is NOT in AI prompts:
"Have ${PRIMARY_CONTACT_NAME} call you back"  // DOES NOT EXIST
```

---

## ✅ What Should Happen

### **Option 1: Use Default Escalation Manager (RECOMMENDED)**

If user doesn't configure team members, fall back to primary contact:

```typescript
const defaultManager = rules?.defaultEscalationManager || 
                      clientData.managers[0]?.name || 
                      contact?.primary?.name ||  // ← ADD THIS FALLBACK
                      'our team';

// AI Prompt:
**Escalation**: Route critical issues to ${defaultManager}
```

**Result:**
```
If managers exist: "Mark will call you"
If no managers: "John Doe will call you" (uses primary contact)
If neither: "Our team will call you"
```

---

### **Option 2: Always Include Primary Contact in Signature**

Add primary contact to business context:

```typescript
## Business Leadership:
- Primary Contact: ${contact.primary?.name} (${contact.primary?.role})
- Escalation Manager: ${rules?.defaultEscalationManager}

When no specific manager is available for a task:
"${contact.primary?.name} will personally review your request"
```

---

## 🚨 Current Gap

**Problem:**
If a user completes Business Information but **skips Team Setup**, the AI has NO manager names to use!

**Current Behavior:**
```
AI: "We'll get back to you soon"  ❌ Generic, no owner
```

**Should Be:**
```
AI: "John Doe will review your request and get back to you by end of day"  ✅ Specific, uses primary contact as fallback
```

---

## 🎯 Recommendation

**Add fallback logic to use primary contact when managers list is empty:**

```typescript
// In supabase/functions/deploy-n8n/index.ts

const managers = clientData.managers || [];
const primaryContact = clientData.contact?.primary || clientData.client_config?.contact?.primary;

// Fallback: If no managers, use primary contact as default manager
const effectiveManagers = managers.length > 0 
  ? managers 
  : (primaryContact?.name ? [{
      name: primaryContact.name,
      role: primaryContact.role || 'Primary Contact',
      email: primaryContact.email
    }] : []);

const managersText = effectiveManagers.map(m => m.name).join(', ');
```

**Result:**
- ✅ Users with managers: AI uses manager names
- ✅ Users without managers: AI uses primary contact name
- ✅ No generic "our team" responses

---

## 📝 Summary

**Current State:**
- ❌ Primary Contact Name (Business Info) = **NOT USED** in AI
- ✅ Managers List (Team Setup) = **ACTIVELY USED** in AI

**"Mark" in Examples:**
- ✅ Comes from **Managers List** (Team Setup)
- ❌ NOT from Primary Contact (Business Info)

**Gap:**
- If user skips Team Setup, AI has no names to assign tasks to

**Fix Needed:**
- Add fallback to use Primary Contact when Managers list is empty

---

**Would you like me to implement this fallback logic now?** 🔧

