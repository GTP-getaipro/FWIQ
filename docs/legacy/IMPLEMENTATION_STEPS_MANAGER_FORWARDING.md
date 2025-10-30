# Implementation Steps: Manager Email Forwarding Feature

## ✅ COMPLETED (Phases 1-2)

### Phase 1: Frontend ✅
- ✅ Added AVAILABLE_ROLES configuration
- ✅ Updated manager state to support roles array
- ✅ Multi-select checkbox UI for roles
- ✅ Email field with forwarding status
- ✅ Routing preview component
- ✅ Backward compatibility for old data

**File:** `src/pages/onboarding/StepTeamSetup.jsx`  
**Commit:** `3ee803f` - "Feature: Add multi-role selection and email forwarding"

---

### Phase 2: Backend Helpers ✅  
- ✅ Added `getRoleConfiguration()` function
- ✅ Added `buildTeamRoutingRules()` function
- ✅ Injected `<<<TEAM_ROUTING_RULES>>>` placeholder
- ✅ Multiple roles per manager support

**File:** `supabase/functions/deploy-n8n/index.ts`  
**Commit:** `570961c` - "Backend: Add role-based routing helpers"

---

## ⏳ REMAINING (Phases 3-5)

### Phase 3: N8N Template Nodes (Gmail) 🔴 **NEXT STEP**

**What to Add:**

#### **Node 1: "Build Forward Email Body"** (Code Node)

**Insert After:** "AI Draft Reply Agent" node  
**Connects To:** "IF Manager Has Email" node

```javascript
{
  "parameters": {
    "mode": "runOnceForEachItem",
    "jsCode": "// Build email body for manager forwarding with AI draft\nconst manager = $json.matched_manager || {};\nconst managerEmail = manager?.email;\nconst aiCanReply = $json.ai_can_reply;\nconst routing = $json.routing_decision || {};\n\n// Get original email\nconst originalEmail = $('Prepare Email Data').first().json;\n\n// Get AI draft if available\nconst aiDraft = aiCanReply ? $('AI Draft Reply Agent').item?.json?.draft_response : null;\n\nlet forwardBody = '';\n\nif (aiDraft) {\n  forwardBody = `🤖 AI SUGGESTED RESPONSE (Review & Approve):\\n${'='.repeat(60)}\\n${aiDraft}\\n${'='.repeat(60)}\\n\\n✅ AI Confidence: ${Math.round($json.confidence * 100)}%\\n✅ Classification: ${$json.primary_category}${$json.secondary_category ? ' > ' + $json.secondary_category : ''}\\n✅ Routed to you as: ${routing?.matched_roles?.join(' + ') || 'Manager'}\\n\\n💡 QUICK ACTIONS:\\n├─ ✅ Approve: Reply to customer with this draft\\n├─ ✏️ Edit: Modify before sending\\n└─ ❌ Reject: Write your own response\\n\\n${'-'.repeat(60)}\\n\\n--- ORIGINAL CUSTOMER EMAIL ---\\nFrom: ${originalEmail.from}\\nTo: ${originalEmail.to}\\nSubject: ${originalEmail.subject}\\nDate: ${originalEmail.date || new Date().toISOString()}\\n\\n${originalEmail.body}\\n\\n${'-'.repeat(60)}\\n\\nFloWorx Email Processing System\\nManaged by ${manager?.name || 'Your Team'}`;\n} else {\n  forwardBody = `⚠️ AI COULD NOT GENERATE RESPONSE\\n\\n❌ Reason: ${$json.ai_cannot_reply_reason || 'Low confidence or requires human judgment'}\\n✅ Classification: ${$json.primary_category}\\n✅ Confidence: ${Math.round($json.confidence * 100)}%\\n✅ Routed to you as: ${routing?.matched_roles?.join(' + ') || 'Manager'}\\n\\n💡 This email requires your personal response.\\n\\n${'-'.repeat(60)}\\n\\n--- ORIGINAL CUSTOMER EMAIL ---\\nFrom: ${originalEmail.from}\\nSubject: ${originalEmail.subject}\\n\\n${originalEmail.body}\\n\\n${'-'.repeat(60)}\\n\\nFloWorx Email Processing System\\nManaged by ${manager?.name || 'Your Team'}`;\n}\n\nreturn [{\n  json: {\n    shouldForward: !!(managerEmail && managerEmail.trim() !== '' && managerEmail.includes('@')),\n    forwardTo: managerEmail,\n    forwardSubject: `Fwd: ${originalEmail.subject}`,\n    forwardBody: forwardBody,\n    hasAIDraft: !!aiDraft,\n    managerName: manager?.name || 'Manager',\n    originalMessageId: originalEmail.id\n  }\n}];"
  },
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [50, 272],
  "id": "build-forward-body",
  "name": "Build Forward Email Body"
}
```

---

#### **Node 2: "IF Manager Has Email"** (IF Node)

**Insert After:** "Build Forward Email Body"  
**Connects To:**
- TRUE → "Forward to Manager (Gmail)"
- FALSE → "Calculate Performance Metrics"

```json
{
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{$json.shouldForward}}",
          "value2": true
        }
      ]
    }
  },
  "type": "n8n-nodes-base.if",
  "typeVersion": 1,
  "position": [250, 272],
  "id": "if-manager-email",
  "name": "IF Manager Has Email"
}
```

---

#### **Node 3: "Forward to Manager (Gmail)"** (Gmail Node)

**Insert After:** "IF Manager Has Email" (TRUE branch)  
**Connects To:** "Calculate Performance Metrics"

```json
{
  "parameters": {
    "resource": "message",
    "operation": "send",
    "emailType": "text",
    "toEmail": "={{$json.forwardTo}}",
    "subject": "={{$json.forwardSubject}}",
    "message": "={{$json.forwardBody}}",
    "options": {}
  },
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2.1,
  "position": [450, 200],
  "id": "forward-to-manager",
  "name": "Forward to Manager (Gmail)",
  "credentials": {
    "gmailOAuth2": {
      "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Gmail"
    }
  },
  "continueOnFail": true
}
```

---

#### **Update Connections:**

**Old connections:**
```json
"AI Draft Reply Agent": {
  "main": [[{
    "node": "Format Reply as HTML",
    "type": "main",
    "index": 0
  }]]
}
```

**New connections:**
```json
"AI Draft Reply Agent": {
  "main": [[{
    "node": "Build Forward Email Body",  // ← NEW
    "type": "main",
    "index": 0
  }]]
},
"Build Forward Email Body": {
  "main": [[{
    "node": "IF Manager Has Email",  // ← NEW
    "type": "main",
    "index": 0
  }]]
},
"IF Manager Has Email": {
  "main": [
    [{  // TRUE branch
      "node": "Forward to Manager (Gmail)",  // ← NEW
      "type": "main",
      "index": 0
    }],
    [{  // FALSE branch
      "node": "Calculate Performance Metrics",
      "type": "main",
      "index": 0
    }]
  ]
},
"Forward to Manager (Gmail)": {
  "main": [[{
    "node": "Calculate Performance Metrics",  // ← Reconnect
    "type": "main",
    "index": 0
  }]]
}
```

---

### Phase 4: N8N Template Nodes (Outlook) 🔴 **NEXT STEP**

**Same nodes as Gmail, but use Outlook API:**

#### **Node 3 for Outlook:**

```json
{
  "parameters": {
    "resource": "message",
    "operation": "send",
    "toRecipients": "={{$json.forwardTo}}",
    "subject": "={{$json.forwardSubject}}",
    "bodyContent": "={{$json.forwardBody}}",
    "bodyContentType": "text",
    "options": {}
  },
  "type": "n8n-nodes-base.microsoftOutlook",
  "typeVersion": 2.1,
  "position": [450, 200],
  "id": "forward-to-manager-outlook",
  "name": "Forward to Manager (Outlook)",
  "credentials": {
    "microsoftOutlookOAuth2": {
      "id": "<<<CLIENT_OUTLOOK_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Outlook"
    }
  },
  "continueOnFail": true
}
```

**File:** `src/lib/templates/outlook-template.json`

---

### Phase 5: Inject Team Routing Rules into AI 🔴 **CURRENT**

**Need to add to AI system message templates:**

#### **File:** `src/lib/hotTubManAIDraftAgentSystemMessage.js`

**Add after line 370 (before closing):**

```javascript
<<<TEAM_ROUTING_RULES>>>
```

**Full insertion:**
```javascript
- Supplies & accessories: <https://www.thehottubman.ca/category/all-products>

<<<TEAM_ROUTING_RULES>>>

`;
}
```

---

#### **File:** `src/lib/goldStandardReplyPrompt.js`

**Add after line 345 (in example section):**

```javascript
## Example success replies

{{EXAMPLE_REPLIES}}

<<<TEAM_ROUTING_RULES>>>

### Few-Shot Learning Examples
```

---

#### **File:** `src/lib/multiBusinessAIDraftAgentSystemMessage.js`

**Add after line 290:**

```javascript
## Maintain the Required Tone
...

<<<TEAM_ROUTING_RULES>>>

## Rules
- Use UTC/GMT -6 timestamps...
```

---

## 📦 Quick Commands to Complete Implementation

### **Step 1: Commit Current Progress**
```bash
git add -A
git commit -m "WIP: Manager forwarding integration in progress"
git push origin master
```

### **Step 2: Add Team Routing to AI Templates**
```bash
# Run these search-replaces in the three AI template files
```

### **Step 3: Add N8N Template Nodes** 
```bash
# Manually add the 3 new nodes to gmail-template.json
# Manually add the 3 new nodes to outlook-template.json
# Update connections between nodes
```

### **Step 4: Test**
```bash
# Deploy workflow from dashboard
# Send test email
# Check if forwarding works
```

---

## 🎯 Status Summary

**Frontend:**  
✅ Team Setup page with multi-role UI - DONE  
✅ Email field with forwarding indicator - DONE  
✅ Routing preview - DONE  

**Backend:**  
✅ Role configuration helpers - DONE  
✅ Team routing rules builder - DONE  
✅ Placeholder injection - DONE  

**N8N Templates:**  
⏳ Add 3 forwarding nodes to Gmail template - IN PROGRESS  
⏳ Add 3 forwarding nodes to Outlook template - PENDING  
⏳ Update node connections - PENDING  

**AI System Messages:**  
⏳ Inject team routing rules - IN PROGRESS  

**Testing:**  
⏳ End-to-end test - PENDING  

---

## 🚀 Next Immediate Actions

1. **Add team routing rules to AI system messages** (5 minutes)
2. **Add forwarding nodes to Gmail template** (15 minutes)
3. **Add forwarding nodes to Outlook template** (15 minutes)
4. **Test with real email** (10 minutes)

**Total remaining: ~45 minutes**

---

**Current status committed. Ready to continue with N8N template nodes?**

