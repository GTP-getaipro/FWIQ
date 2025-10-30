# Forward Email WITH AI Draft Response

## 🎯 Enhanced Feature: Include AI Draft in Forwarded Email

**Problem:** Managers receive forwarded email but have to check main inbox for AI draft

**Solution:** Include AI draft response IN the forwarded email

---

## 📧 Complete Email Forward Format

### **When AI Can Reply (ai_can_reply: true):**

```
From: info@hottubman.ca (via FloWorx)
To: mark@hottubman.ca
Subject: Fwd: How much for a 6-person hot tub?
──────────────────────────────────────────────────────────

🤖 AI SUGGESTED RESPONSE (Review & Approve):
═══════════════════════════════════════════════════════════
Hi there,

Thanks for reaching out about a 6-person hot tub! We'd love 
to help you find the perfect spa for your needs.

We have several models that would work great. Would you be 
available for a quick 10-minute call to discuss your space 
and preferences? That helps us recommend the best fit.

You can also browse our full selection here:
https://www.thehottubman.ca/hot-tub-spas

Thanks so much for supporting our small business!
Best regards,
The Hot Tub Man Team
(403) 550-5140
═══════════════════════════════════════════════════════════

✅ AI Confidence: 93%
✅ Classification: SALES > NewInquiry
✅ Routed to you as: Sales Manager

💡 QUICK ACTIONS:
├─ ✅ Approve as-is: Reply to customer with this draft
├─ ✏️ Edit & send: Modify the draft before sending
└─ ❌ Reject draft: Write your own response

──────────────────────────────────────────────────────────

--- ORIGINAL CUSTOMER EMAIL ---
From: customer@email.com
To: info@hottubman.ca
Subject: How much for a 6-person hot tub?
Date: October 29, 2025 10:30 AM

Looking to buy a hot tub that seats 6 people. What are your 
prices? Do you have financing options?
──────────────────────────────────────────────────────────
```

---

### **When AI Cannot Reply (ai_can_reply: false):**

```
From: info@hottubman.ca (via FloWorx)
To: sarah@hottubman.ca
Subject: Fwd: Need help with water chemistry

──────────────────────────────────────────────────────────

⚠️ AI Could Not Generate Response

❌ Reason: Low confidence (67%) - requires human review
✅ Classification: SUPPORT > General
✅ Routed to you as: Service Manager

💡 This email needs your personal attention.

──────────────────────────────────────────────────────────

--- ORIGINAL CUSTOMER EMAIL ---
From: customer@email.com
To: info@hottubman.ca
Subject: Need help with water chemistry

My water is cloudy and has a weird smell. I tried adding 
chlorine but it's not helping. Can you explain what I should do?
Also, my pH test strips show 8.2 - is that normal?
──────────────────────────────────────────────────────────
```

---

## 🔄 N8N Workflow Update

### **Updated Workflow Order:**

```
1. Fetch New Email
   ↓
2. Prepare Email Data
   ↓
3. AI Classifier (Determine category, ai_can_reply)
   ↓
4. Role-Based Routing (Determine manager)
   ↓
5. Apply Gmail/Outlook Label
   ↓
6. Can AI Reply? (Check ai_can_reply flag)
   ↓
   ├─ YES → 7a. Generate AI Draft Reply
   │         ↓
   └─ NO ──┴→ 7b. Skip AI Draft
             ↓
8. Check Manager Email Exists?
   ↓
   ├─ YES → 9a. Forward Email WITH AI Draft
   │         ↓
   └─ NO ──┴→ 9b. Skip Forwarding
             ↓
10. Save AI Draft to Main Inbox (if generated)
    ↓
11. Log Performance Metrics
```

---

## 💻 Implementation Code

### **Node: "Build Forward Email Body" (Code Node)**

```javascript
// Executed after AI Draft Reply Agent (if ai_can_reply = true)

const manager = $json.matched_manager;
const managerEmail = manager?.email;
const aiCanReply = $json.ai_can_reply;
const routing = $json.routing_decision;

// Get original email data
const originalEmail = $('Prepare Email Data').first().json;

// Get AI draft if available
const aiDraft = aiCanReply 
  ? $('AI Draft Reply Agent').item?.json?.draft_response || null
  : null;

// Build forward body based on whether AI draft exists
let forwardBody = '';

if (aiDraft) {
  // Include AI draft at the top
  forwardBody = `🤖 AI SUGGESTED RESPONSE (Review & Approve):
═══════════════════════════════════════════════════════════
${aiDraft}
═══════════════════════════════════════════════════════════

✅ AI Confidence: ${Math.round($json.confidence * 100)}%
✅ Classification: ${$json.primary_category}${$json.secondary_category ? ' > ' + $json.secondary_category : ''}
✅ Routed to you as: ${routing.matched_roles?.join(' + ') || routing.matched_role || 'Manager'}

💡 QUICK ACTIONS:
├─ ✅ Approve as-is: Reply to customer with this draft
├─ ✏️ Edit & send: Modify the draft before sending  
└─ ❌ Reject draft: Write your own response

Note: AI draft is also saved in main inbox (info@hottubman.ca) drafts folder.

──────────────────────────────────────────────────────────

--- ORIGINAL CUSTOMER EMAIL ---
From: ${originalEmail.from}
To: ${originalEmail.to}
Subject: ${originalEmail.subject}
Date: ${originalEmail.date}

${originalEmail.body}
──────────────────────────────────────────────────────────

FloWorx Email Processing System
Powered by AI | Managed by ${manager.name}`;

} else {
  // No AI draft available (ai_can_reply = false)
  forwardBody = `⚠️ AI Could Not Generate Response

❌ Reason: ${$json.ai_cannot_reply_reason || 'Low confidence or requires human judgment'}
✅ Classification: ${$json.primary_category}${$json.secondary_category ? ' > ' + $json.secondary_category : ''}
✅ Confidence: ${Math.round($json.confidence * 100)}%
✅ Routed to you as: ${routing.matched_roles?.join(' + ') || routing.matched_role || 'Manager'}

💡 This email needs your personal attention and response.

──────────────────────────────────────────────────────────

--- ORIGINAL CUSTOMER EMAIL ---
From: ${originalEmail.from}
To: ${originalEmail.to}
Subject: ${originalEmail.subject}
Date: ${originalEmail.date}

${originalEmail.body}
──────────────────────────────────────────────────────────

FloWorx Email Processing System
Managed by ${manager.name}`;
}

return [{
  json: {
    shouldForward: !!(managerEmail && managerEmail.trim() !== ''),
    forwardTo: managerEmail,
    forwardSubject: `Fwd: ${originalEmail.subject}`,
    forwardBody: forwardBody,
    hasAIDraft: !!aiDraft,
    managerName: manager.name
  }
}];
```

---

## 📱 Manager Mobile Experience

### **Manager's Phone (Email Notification):**

```
─────────────────────────────────────
New Email

From: FloWorx <info@hottubman.ca>
Subject: Fwd: How much for 6-person hot tub?

🤖 AI SUGGESTED RESPONSE

Hi there,

Thanks for reaching out...
[See full draft below]

── Quick Actions ──
✅ Reply with AI draft
✏️ Edit before sending
❌ Write own response

[Original customer email...]
─────────────────────────────────────
```

**Manager can:**
1. Read AI draft on phone
2. Tap "Reply" 
3. AI draft auto-copied to reply
4. Edit if needed
5. Send immediately

**No need to:**
- ❌ Open laptop
- ❌ Check main business inbox
- ❌ Search for AI draft
- ❌ Copy/paste draft

---

## 🔧 Enhanced Gmail/Outlook Forward Function

```typescript
async function forwardEmailToManagerWithDraft(
  messageId, 
  managerEmail, 
  emailData, 
  aiDraft, 
  routingInfo,
  provider, 
  accessToken
) {
  try {
    console.log(`📧 Forwarding email WITH AI draft to: ${managerEmail}`);
    
    // Build formatted forward body
    let forwardBody = '';
    
    if (aiDraft && aiDraft.draft_response) {
      // Include AI draft at the top
      forwardBody = `🤖 AI SUGGESTED RESPONSE (Review & Approve):
═══════════════════════════════════════════════════════════
${aiDraft.draft_response}
═══════════════════════════════════════════════════════════

✅ AI Confidence: ${Math.round(routingInfo.confidence * 100)}%
✅ Classification: ${routingInfo.primary_category}${routingInfo.secondary_category ? ' > ' + routingInfo.secondary_category : ''}
✅ Routed to you as: ${routingInfo.matched_roles?.join(' + ') || 'Manager'}

💡 QUICK ACTIONS:
├─ ✅ Approve: Reply to customer with this draft
├─ ✏️ Edit: Modify before sending
└─ ❌ Reject: Write your own response

──────────────────────────────────────────────────────────

--- ORIGINAL CUSTOMER EMAIL ---
From: ${emailData.from}
To: ${emailData.to}
Subject: ${emailData.subject}
Date: ${emailData.date}

${emailData.body}
──────────────────────────────────────────────────────────

FloWorx Email Processing System
Managed by ${routingInfo.manager_name} | Powered by AI`;
      
    } else {
      // AI could not reply or draft not available
      forwardBody = `⚠️ AI Could Not Generate Response

❌ Reason: ${routingInfo.ai_cannot_reply_reason || 'Low confidence or complex inquiry'}
✅ Classification: ${routingInfo.primary_category}
✅ Confidence: ${Math.round(routingInfo.confidence * 100)}%
✅ Routed to you as: ${routingInfo.matched_roles?.join(' + ') || 'Manager'}

💡 This email requires your personal attention.

──────────────────────────────────────────────────────────

--- ORIGINAL CUSTOMER EMAIL ---
From: ${emailData.from}
Subject: ${emailData.subject}

${emailData.body}
──────────────────────────────────────────────────────────

FloWorx Email Processing System
Managed by ${routingInfo.manager_name}`;
    }
    
    if (provider === 'gmail') {
      // Gmail API Forward with draft
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/forward`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: managerEmail,
            subject: `Fwd: ${emailData.subject}`,
            body: forwardBody,
            isHtml: false
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Gmail forward failed: ${response.statusText}`);
      }
      
      console.log(`✅ Email + AI draft forwarded to ${managerEmail}`);
      return { 
        success: true, 
        forwardedTo: managerEmail,
        includedAIDraft: !!aiDraft
      };
      
    } else if (provider === 'outlook') {
      // Outlook API Forward with draft
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/forward`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            toRecipients: [{
              emailAddress: { address: managerEmail }
            }],
            comment: forwardBody
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Outlook forward failed: ${response.statusText}`);
      }
      
      console.log(`✅ Email + AI draft forwarded to ${managerEmail}`);
      return { 
        success: true, 
        forwardedTo: managerEmail,
        includedAIDraft: !!aiDraft
      };
    }
    
  } catch (error) {
    console.error(`❌ Email forwarding failed:`, error);
    return { 
      success: false, 
      error: error.message,
      fallback: 'Email labeled but not forwarded - check main inbox'
    };
  }
}
```

---

## 🎨 Email Template Variations

### **Template 1: Standard AI Reply**

```
Subject: Fwd: Customer inquiry about pricing

🤖 AI SUGGESTED RESPONSE:
═══════════════════════════════════════════════════════════
Hi Sarah,

Thanks for reaching out! We'd be happy to provide pricing for 
our hot tub services.

[Full AI draft here...]

Best regards,
The Hot Tub Man Team
═══════════════════════════════════════════════════════════

--- ORIGINAL EMAIL ---
[Customer email here...]
```

---

### **Template 2: Urgent Issue with After-Hours Contact**

```
Subject: 🚨 URGENT: Fwd: Water leaking from hot tub

🚨 URGENT ISSUE - IMMEDIATE ATTENTION NEEDED

🤖 AI SUGGESTED RESPONSE:
═══════════════════════════════════════════════════════════
Hi there,

This sounds urgent! Since it's after hours, please call our 
emergency line immediately at (403) 555-0123 for assistance.

In the meantime, turn off your tub at the breaker to prevent 
further water damage.

Someone from our team will also follow up first thing 
tomorrow morning.

Thanks,
The Hot Tub Man Team
Emergency: (403) 555-0123
═══════════════════════════════════════════════════════════

✅ Classification: URGENT > LeakEmergency
✅ Confidence: 97%
🚨 After-hours emergency protocol activated

--- ORIGINAL EMAIL ---
[Customer emergency email...]
```

---

### **Template 3: No AI Draft (Low Confidence)**

```
Subject: Fwd: Complex technical question

⚠️ AI COULD NOT GENERATE RESPONSE

❌ Reason: Complex technical inquiry requiring expert knowledge
✅ Classification: SUPPORT > TechnicalSupport
✅ Confidence: 68% (below 75% threshold)
✅ Routed to you as: Service Manager

💡 This email requires your expertise. Please review and respond.

Detected issues:
• Multiple technical questions about error codes
• Requires specific model knowledge
• May need diagnostic information

--- ORIGINAL EMAIL ---
From: customer@email.com
Subject: Error code E8 and heater relay clicking

My Jacuzzi J-375 is showing error code E8. The heater relay 
is clicking on and off every 30 seconds. I've checked the 
breaker and it's fine. Water level is good. Temperature sensor 
reads 45°F but target is 102°F. What could be wrong?
──────────────────────────────────────────────────────────
```

---

## 📊 Manager Dashboard Preference

### **Settings Page for Managers:**

```
┌──────────────────────────────────────────────────────────┐
│ Email Forwarding Preferences - Mark Johnson              │
├──────────────────────────────────────────────────────────┤
│ Forward emails to: [mark@hottubman.ca              ] ✅  │
│                                                          │
│ Forwarding Options:                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ☑ Include AI draft response (when available)      │  │
│ │ ☑ Forward emails during business hours only       │  │
│ │ ☐ Forward URGENT category only                    │  │
│ │ ☑ Include routing metadata (classification info) │  │
│ │ ☐ Send daily digest instead of individual emails │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Email Format:                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [▼ Full (Draft + Original + Metadata)]            │  │
│ │                                                     │  │
│ │ Options:                                            │  │
│ │ • Full: Draft + Original + Metadata                │  │
│ │ • Summary: Draft + Original only                   │  │
│ │ • Notification: Subject + Link to main inbox       │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Preview:                                                 │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🤖 AI SUGGESTED RESPONSE:                           │  │
│ │ [Draft response here...]                            │  │
│ │                                                     │  │
│ │ --- ORIGINAL EMAIL ---                              │  │
│ │ [Customer email here...]                            │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### **Test 1: Forward WITH AI Draft**

**Setup:**
```
Mark = Sales Manager
Email: mark@hottubman.ca ✅
```

**Email:**
```
Customer: "How much for a hot tub?"
AI: Can reply = true
AI Draft: "Thanks for reaching out! We'd love to help..."
```

**Expected Forward:**
```
To: mark@hottubman.ca
Subject: Fwd: How much for a hot tub?
Body:
  🤖 AI SUGGESTED RESPONSE:
  [Full draft here]
  
  --- ORIGINAL EMAIL ---
  [Customer email here]
```

**Result:** ✅ Mark sees both draft and original in one email

---

### **Test 2: Forward WITHOUT AI Draft (Low Confidence)**

**Setup:**
```
Sarah = Service Manager
Email: sarah@hottubman.ca ✅
```

**Email:**
```
Customer: Complex technical question
AI: Can reply = false (confidence: 67%)
AI Draft: None generated
```

**Expected Forward:**
```
To: sarah@hottubman.ca
Subject: Fwd: Complex technical question
Body:
  ⚠️ AI COULD NOT GENERATE RESPONSE
  Reason: Low confidence (67%)
  
  --- ORIGINAL EMAIL ---
  [Customer email here]
  
  💡 Requires your expertise
```

**Result:** ✅ Sarah knows she needs to write response from scratch

---

### **Test 3: No Forwarding (Email Blank)**

**Setup:**
```
Tom = Operations Manager
Email: (blank) ❌
```

**Email:**
```
Vendor: "Interested in partnership"
AI: Can reply = false
```

**Expected:**
```
Main inbox only:
  Label: MANAGER/Tom Wilson/
  No forwarding (Tom didn't provide email)
  Tom checks main inbox for emails
```

**Result:** ✅ Email labeled but not forwarded

---

### **Test 4: Multiple Roles, Same Email**

**Setup:**
```
Mark = Sales Manager + Operations Manager
Email: mark@hottubman.ca ✅
```

**Email A (SALES):**
```
Forward to mark@hottubman.ca
Subject: Fwd: Quote request
Body: [AI Draft] + [Original Email]
```

**Email B (MANAGER > Vendor):**
```
Forward to mark@hottubman.ca  
Subject: Fwd: Supplier inquiry
Body: [No AI Draft] + [Original Email]
```

**Result:** ✅ Mark gets both types of emails forwarded to same address

---

## 📊 Analytics & Logging

### **Enhanced Email Log:**

```javascript
{
  email_id: "msg_12345",
  from: "customer@email.com",
  subject: "How much for a hot tub?",
  classification: {
    primary: "SALES",
    secondary: "NewInquiry",
    confidence: 0.93,
    ai_can_reply: true
  },
  routing: {
    matched_manager: "Mark Johnson",
    matched_roles: ["Sales Manager"],
    routing_reason: "category_role_match",
    label_applied: "MANAGER/Mark Johnson/"
  },
  forwarding: {                           // ← NEW
    enabled: true,
    forwarded_to: "mark@hottubman.ca",
    forwarded_at: "2025-10-29T10:30:15Z",
    included_ai_draft: true,
    forward_success: true
  },
  ai_draft: {
    generated: true,
    confidence: 0.93,
    draft_text: "[Full draft...]",
    saved_to_drafts: true,
    included_in_forward: true             // ← NEW
  }
}
```

---

## 🎯 Benefits

### **For Managers:**
✅ **One-stop review** - Email + Draft in one place  
✅ **Mobile-friendly** - Review and approve on phone  
✅ **Faster response** - No need to check multiple inboxes  
✅ **Easy editing** - Draft included, just modify if needed  
✅ **Full context** - Original email + AI draft + metadata  

### **For Business Owners:**
✅ **Flexible** - Managers can opt-in to forwarding  
✅ **Scalable** - Works for solo or team setups  
✅ **Professional** - AI quality control before manager sees it  
✅ **Audit trail** - All emails labeled in main inbox too  

### **For Customers:**
✅ **Faster response** - Managers can reply immediately  
✅ **Quality replies** - AI draft as starting point  
✅ **Consistent** - Team-based branding maintained  

---

## 🔄 Updated Workflow Nodes

### **Sequence:**

```
1. Fetch Email
2. Prepare Email Data  
3. AI Classifier
4. Role-Based Routing
5. Apply Label

6. IF (ai_can_reply = true):
   → Generate AI Draft Reply
   ELSE:
   → Set aiDraft = null

7. Build Forward Email Body
   → Include AI draft if available
   → Include classification metadata
   → Include original email

8. IF (manager.email exists):
   → Forward Email (with draft)
   ELSE:
   → Skip forwarding

9. Save AI Draft to Main Inbox (if generated)
10. Log Metrics
```

---

## 📝 Manager Email Validation

```javascript
// In Team Setup page
const validateManagerEmail = (email, businessDomain) => {
  // Blank is allowed (no forwarding)
  if (!email || email.trim() === '') {
    return {
      valid: true,
      forwarding: false,
      message: 'Email forwarding disabled (no email provided)'
    };
  }
  
  // Check valid email format
  if (!email.includes('@') || !email.includes('.')) {
    return {
      valid: false,
      message: 'Please enter a valid email address'
    };
  }
  
  // Extract domain
  const emailDomain = email.split('@')[1];
  
  // Check if same as business domain
  if (emailDomain === businessDomain) {
    return {
      valid: true,
      forwarding: true,
      warning: '⚠️ Same domain as business inbox. Emails will forward to same account (may cause duplicates).',
      recommendation: 'Consider using a personal email address for cleaner inbox separation'
    };
  }
  
  // Valid external email
  return {
    valid: true,
    forwarding: true,
    message: '✅ Email forwarding enabled'
  };
};
```

---

## ✅ Summary

### **The Enhanced Rule:**

```
IF manager.email exists AND is valid:
  ✅ Forward email to manager.email
  ✅ Include AI draft response (if ai_can_reply = true)
  ✅ Include classification metadata
  ✅ Include original customer email
  ✅ Apply label: MANAGER/${manager.name}/
  
ELSE (manager.email is blank):
  ✅ Apply label: MANAGER/${manager.name}/
  ❌ No forwarding
  ✅ Manager checks main inbox with label filter
```

### **Forward Email Contains:**
1. 🤖 **AI Draft** (if available)
2. 📊 **Classification info** (category, confidence, routing reason)
3. 📧 **Original email** (from customer)
4. 💡 **Quick actions** (approve/edit/reject guidance)
5. 🏷️ **Metadata** (manager name, roles, timestamp)

### **Benefits:**
- ✅ Managers can approve AI drafts from personal inbox
- ✅ Mobile-friendly workflow
- ✅ No need to switch between inboxes
- ✅ Full context in one email
- ✅ Optional (leave email blank to disable)

---

**Complete feature design documented!** ✅

**Ready to implement this forwarding with AI draft inclusion?** 🚀

