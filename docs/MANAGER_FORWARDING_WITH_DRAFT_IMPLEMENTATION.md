# Manager Forwarding with Draft Reply - Complete Implementation

## 🎯 Overview

This feature automatically forwards classified emails to the appropriate manager along with an AI-generated draft reply (if available). The system intelligently routes emails based on:

1. **Manager name mentions** in the email
2. **Role-based category matching** (Sales Manager → SALES emails)
3. **Keyword analysis** matching manager role keywords
4. **Supplier detection** for operations managers

##

 📋 What Gets Forwarded

### Email Components:
1. ✅ **Classification details** (category, confidence, AI can reply status)
2. ✅ **Routing information** (which manager, why, confidence)
3. ✅ **Original email** (from, to, subject, body, date)
4. ✅ **AI draft response** (if generated and ai_can_reply = true)
5. ✅ **Next steps guidance** for the manager

### Example Forward Email:

```
From: info@company.com (via FloWorx)
To: john@company.com
Subject: [FloWorx SALES] Quote request

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 FloWorx AI Email Routing - Action Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CLASSIFICATION:
Category: SALES > NewInquiry
Confidence: 92.5%
AI Can Reply: ✅ Yes
Summary: Customer requesting pricing information

👤 ROUTED TO YOU:
Name: John Doe
Email: john@company.com
Reason: Category match: SALES
Routing Confidence: 85%
Roles: Sales Manager, Owner/CEO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 ORIGINAL EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: Customer <customer@email.com>
To: info@company.com
Date: October 30, 2025 2:30 PM
Subject: Quote request

Hi, can you send me a quote for your services?
Thanks!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI SUGGESTED DRAFT RESPONSE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi there,

Thank you for your interest! I'd be happy to provide 
you with a detailed quote.

To give you the most accurate pricing, could you let 
me know a bit more about:
- What type of service you're looking for
- Timeline you have in mind
- Any specific requirements

You can also browse our services here: 
https://www.yourcompany.com/services

Looking forward to helping you!

Best regards,
Your Company Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 NEXT STEPS:
1. Review the AI draft above
2. Edit if needed or approve as-is
3. Reply to customer

📧 Reply to: customer@email.com
📂 Filed in: MANAGER/John Doe
🤖 Processed by FloWorx AI
```

---

## 🏗️ N8N Workflow Nodes

### Required Nodes (Add these to your workflow):

#### 1. **Route to Manager** (Code Node)

**Position:** After "Generate Label Mappings" node
**Purpose:** Determines which manager should receive the email

**Configuration:**
- Node Type: `Code (JavaScript)`
- Mode: `Run Once for Each Item`
- Code: Auto-generated using `buildRoutingNodeCode()` from `managerForwarding.js`

**What it does:**
- Analyzes email content and classification
- Matches to manager based on name, category, roles, keywords
- Outputs matched manager and routing metadata

---

#### 2. **Build Forward Email Body** (Code Node)

**Position:** After "Save AI Draft for Learning" node
**Purpose:** Formats the email content to send to manager

**Configuration:**
- Node Type: `Code (JavaScript)`
- Mode: `Run Once for Each Item`

**JavaScript Code:**
```javascript
// Build Forward Email Body
const emailData = $('Prepare Email Data').first().json;
const classification = $json;
const manager = classification.matched_manager;

// Get draft if it was generated
let draftText = 'No AI draft generated';
try {
  const formatNode = $('Format Reply as HTML').first();
  if (formatNode && formatNode.json && formatNode.json.output) {
    draftText = formatNode.json.output
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');
  }
} catch (e) {
  console.log('No draft available:', e.message);
}

const hasDraft = draftText && !draftText.includes('No AI draft');

const forwardBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 FloWorx AI Email Routing - Action Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CLASSIFICATION:
Category: ${classification.primary_category || 'N/A'} > ${classification.secondary_category || 'General'}
${classification.tertiary_category ? `Tertiary: ${classification.tertiary_category}\n` : ''}Confidence: ${(classification.confidence * 100).toFixed(1)}%
AI Can Reply: ${classification.ai_can_reply ? '✅ Yes' : '❌ No'}
Summary: ${classification.summary || 'N/A'}

👤 ROUTED TO YOU:
Name: ${manager?.name || 'Unassigned'}
Email: ${manager?.email || 'Not configured'}
Reason: ${classification.routing_decision?.routing_reason || 'N/A'}
Routing Confidence: ${classification.routing_decision?.routing_confidence || 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 ORIGINAL EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: ${emailData.fromName || emailData.from} <${emailData.from}>
To: ${emailData.to}
Date: ${new Date(emailData.date).toLocaleString()}
Subject: ${emailData.subject}

${emailData.body || 'No content'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${hasDraft ? `🤖 AI SUGGESTED DRAFT RESPONSE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${draftText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : `⚠️ NO AI DRAFT GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reason: Low confidence - requires human review
This email needs your personal attention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}

💡 NEXT STEPS:
${hasDraft ? '1. Review the AI draft above\n2. Edit if needed or approve as-is\n3. Reply to customer' : '1. Review the original email\n2. Write your response\n3. Reply to customer'}

📧 Reply to: ${emailData.from}
📂 Filed in: ${classification.manager_folder || classification.primary_category}
🤖 Processed by FloWorx AI
⏰ ${new Date().toLocaleString()}
`;

return {
  json: {
    ...classification,
    forward_body: forwardBody,
    forward_to: manager?.email || null,
    forward_subject: `[FloWorx ${classification.primary_category || 'Email'}] ${emailData.subject}`
  }
};
```

---

#### 3. **Should Forward to Manager?** (IF Node)

**Position:** After "Build Forward Email Body"
**Purpose:** Checks if manager has email and forwarding is enabled

**Configuration:**
- Node Type: `IF`
- Condition Type: `String`
- Value 1: `{{ $json.forward_to }}`
- Operation: `is not empty`

**What it does:**
- Checks if `forward_to` (manager email) exists
- Routes to "Forward to Manager" if yes
- Skips forwarding if no (manager has no email or forwarding disabled)

---

#### 4. **Forward to Manager** (Gmail/Outlook Node)

**Position:** After "Should Forward to Manager?" (TRUE branch)
**Purpose:** Sends the forwarded email to manager

**Configuration for Gmail:**
```json
{
  "parameters": {
    "sendTo": "={{ $json.forward_to }}",
    "subject": "={{ $json.forward_subject }}",
    "emailType": "text",
    "message": "={{ $json.forward_body }}",
    "options": {}
  },
  "type": "n8n-nodes-base.gmail",
  "credentials": {
    "gmailOAuth2": {
      "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Gmail"
    }
  }
}
```

**Configuration for Outlook:**
```json
{
  "parameters": {
    "resource": "message",
    "operation": "send",
    "toRecipients": "={{ $json.forward_to }}",
    "subject": "={{ $json.forward_subject }}",
    "bodyContent": "={{ $json.forward_body }}",
    "bodyContentType": "text"
  },
  "type": "n8n-nodes-base.microsoftOutlook",
  "credentials": {
    "microsoftOutlookOAuth2Api": {
      "id": "<<<CLIENT_OUTLOOK_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Outlook"
    }
  }
}
```

---

## 🔄 Workflow Connections

### Update these connections in your workflow:

```json
{
  "Generate Label Mappings": {
    "main": [
      [{
        "node": "Route to Manager",
        "type": "main",
        "index": 0
      }]
    ]
  },
  "Route to Manager": {
    "main": [
      [
        {
          "node": "Apply Gmail Labels",
          "type": "main",
          "index": 0
        },
        {
          "node": "Calculate Performance Metrics",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Save AI Draft for Learning": {
    "main": [
      [{
        "node": "Build Forward Email Body",
        "type": "main",
        "index": 0
      }]
    ]
  },
  "Build Forward Email Body": {
    "main": [
      [{
        "node": "Should Forward to Manager?",
        "type": "main",
        "index": 0
      }]
    ]
  },
  "Should Forward to Manager?": {
    "main": [
      [{
        "node": "Forward to Manager",
        "type": "main",
        "index": 0
      }]
    ]
  }
}
```

---

## 🚀 Implementation Steps

### Step 1: Generate Team Configuration

Use the helper function to generate team config:

```javascript
import { generateTeamConfigForN8n, buildRoutingNodeCode } from '@/constants/managerForwarding.js';

// Get managers from database
const managers = [
  { name: 'John Doe', email: 'john@co.com', roles: ['sales_manager', 'owner'], forward_enabled: true },
  { name: 'Jane Smith', email: 'jane@co.com', roles: ['service_manager'], forward_enabled: true }
];

// Generate team config
const teamConfig = generateTeamConfigForN8n(managers, suppliers);

// Generate routing node code
const routingCode = buildRoutingNodeCode(managers, suppliers);
```

### Step 2: Add Nodes to Workflow

1. Open your n8n workflow
2. Add the 4 new nodes listed above
3. Update the connections as shown
4. Save the workflow

### Step 3: Test

Send test emails:
- Mention manager by name: "Hi John, can you help?"
- Use role keywords: "Need a quote" → Sales Manager
- Check manager receives forwarded email with draft

---

## 🎯 Routing Logic Priority

The system routes emails using this priority order:

| Priority | Method | Example | Confidence |
|----------|--------|---------|------------|
| 1 | **Name Mention** | "Hi John..." | 100% |
| 2 | **AI Category** | MANAGER/Jane | 95% |
| 3 | **Category Match** | SALES → Sales Manager | 85% |
| 4 | **Keyword Match** | "quote" → Sales Manager | 70-85% |
| 5 | **Supplier** | Supplier email → Ops Manager | 90% |
| 6 | **Default/Fallback** | First manager | 30% |

---

## 📊 Benefits

✅ **Managers get complete context** - Original email + AI draft in one place
✅ **Intelligent routing** - Right email to right manager
✅ **Time savings** - Managers can quickly approve/edit AI drafts
✅ **No switching** - Everything in forwarded email, no need to check main inbox
✅ **Audit trail** - Classification details included
✅ **Flexible** - Can disable forwarding per manager

---

## 🔧 Configuration Options

### Per-Manager Settings

```javascript
{
  name: 'John Doe',
  email: 'john@company.com',
  roles: ['sales_manager'],
  forward_enabled: true  // Set to false to disable forwarding for this manager
}
```

### Department-Aware Forwarding

When deploying in Department Mode, only relevant managers receive forwards:

- **Sales Department**: Only sales managers get forwarded emails
- **Support Department**: Only service managers get forwarded emails
- **Hub Mode**: All managers get forwarded emails based on routing

---

## 📚 Related Documentation

- `src/constants/managerForwarding.js` - Helper functions
- `src/constants/managerRoles.js` - Role definitions
- `docs/MANAGER_ROLE_CLASSIFICATION_FEATURE.md` - Core classification
- `docs/DEPARTMENT_SCOPE_MANAGER_FILTERING.md` - Department filtering

---

## ✅ Checklist

Before deploying:
- [ ] Managers configured with emails
- [ ] Roles assigned to each manager
- [ ] `forward_enabled` set correctly
- [ ] 4 new nodes added to workflow
- [ ] Connections updated
- [ ] Gmail/Outlook credentials configured
- [ ] Test emails sent and verified

---

**Implementation Complete!** Managers now receive intelligently routed emails with AI draft replies. 🎉

