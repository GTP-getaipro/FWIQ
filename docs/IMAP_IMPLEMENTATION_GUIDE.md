# IMAP/SMTP Implementation Guide

**Version:** 1.0  
**Date:** October 29, 2025  
**Status:** Template Ready for Implementation

---

## 🎯 Overview

This guide covers the IMAP/SMTP integration for FloWorx, enabling support for **any email provider** using standard IMAP/SMTP protocols.

### **What is IMAP/SMTP?**

- **IMAP (Internet Message Access Protocol)**: Protocol for reading emails
- **SMTP (Simple Mail Transfer Protocol)**: Protocol for sending emails
- **Universal**: Works with ANY email provider (cPanel, Plesk, GoDaddy, Bluehost, etc.)

---

## 📊 IMAP vs Gmail vs Outlook

| Feature | Gmail API | Outlook/Graph API | IMAP/SMTP |
|---------|-----------|-------------------|-----------|
| **Authentication** | OAuth 2.0 | OAuth 2.0 | Username/Password |
| **Real-time Triggers** | ✅ Webhooks | ✅ Webhooks | ❌ Polling only |
| **Labels** | ✅ Nested labels | ❌ No labels | ❌ No labels |
| **Folders** | ⚠️ Simulated | ✅ Native hierarchy | ✅ Native hierarchy |
| **Multi-category** | ✅ Multiple labels | ❌ Single folder | ❌ Single folder |
| **Draft Creation** | ✅ Native API | ✅ Native API | ⚠️ SMTP workaround |
| **Attachment Download** | ✅ Via API | ✅ Via API | ✅ Via IMAP |
| **Compatibility** | Gmail only | Microsoft only | **UNIVERSAL** ✅ |
| **Setup Complexity** | Medium | Medium | **Low** ✅ |

---

## 🚀 Key Differences - IMAP Implementation

### 1. **Polling Instead of Webhooks**

**Gmail/Outlook:**
```javascript
// Real-time webhook triggers
// Email arrives → instant notification → workflow runs
```

**IMAP:**
```javascript
// Polling every 2 minutes
pollTimes: {
  item: [{
    mode: "custom",
    cronExpression: "0 */2 * * * *"  // Every 2 minutes
  }]
}

// Searches for UNSEEN (unread) emails
customEmailConfig: {
  searchFilter: ['UNSEEN']
}
```

**Impact:**
- ⚠️ 0-2 minute delay (vs instant with webhooks)
- ✅ Still acceptable for most business use cases
- ✅ More reliable (no webhook expiration issues)

---

### 2. **Folders Only (No Labels)**

**Gmail:**
```javascript
// Can apply MULTIPLE labels to one email
labels: ['SALES', 'URGENT', 'NewInquiry']
```

**IMAP:**
```javascript
// Can only be in ONE folder at a time
folder: 'SALES/NewInquiry'
```

**Solution:**
```javascript
// Use primary category for folder path
if (primary === 'SALES' && secondary === 'NewInquiry') {
  folder = 'SALES/NewInquiry';
}

// Use folder hierarchy for organization
SALES/
  ├── NewInquiry/
  ├── Quotes/
  └── FollowUp/
```

---

### 3. **Username/Password Authentication**

**Gmail/Outlook:**
```javascript
// OAuth 2.0 flow
1. User clicks "Connect Gmail"
2. Redirects to Google consent screen
3. Returns access token
4. Auto-refreshes tokens
```

**IMAP:**
```javascript
// Direct credentials
credentials: {
  imap: {
    user: "user@domain.com",
    password: "app-specific-password",  // or regular password
    host: "mail.domain.com",
    port: 993,
    secure: true  // SSL/TLS
  },
  smtp: {
    user: "user@domain.com",
    password: "app-specific-password",
    host: "mail.domain.com",
    port: 465,
    secure: true
  }
}
```

**Security Notes:**
- ✅ Use app-specific passwords when available (Gmail, Outlook IMAP)
- ✅ Store credentials encrypted in N8N
- ✅ Never log passwords
- ⚠️ Less secure than OAuth (but only option for IMAP)

---

### 4. **Draft Handling**

**Gmail/Outlook:**
```javascript
// Native draft API
gmail.users.drafts.create({
  userId: 'me',
  requestBody: { message: {...} }
});
```

**IMAP:**
```javascript
// Option 1: Save to Drafts folder via IMAP (limited support)
imapConnection.append('Drafts', message);

// Option 2: Send to self via SMTP (more reliable)
smtp.send({
  from: user@domain.com,
  to: user@domain.com,
  subject: 'DRAFT: Re: Customer Inquiry'
});

// Option 3: Don't save drafts, just forward to manager ✅ RECOMMENDED
```

**FloWorx Approach:**
- ✅ Generate AI draft
- ✅ Include draft in forward to manager
- ✅ Manager can copy/edit/send from their own email client
- ⚠️ Skip automated draft saving (IMAP limitation)

---

## 📂 Folder Structure Implementation

### **Recommended IMAP Folder Hierarchy**

```
INBOX                      (monitored - workflow processes from here)
├── SALES/
│   ├── NewInquiry/
│   ├── Quotes/
│   ├── FollowUp/
│   └── Closed/
├── SUPPORT/
│   ├── General/
│   ├── Technical/
│   ├── Parts/
│   └── Warranty/
├── URGENT/
│   └── Emergency/
├── MANAGER/
│   ├── Mark Johnson/
│   ├── Sarah Williams/
│   └── Unassigned/
├── SUPPLIERS/
│   ├── Orders/
│   ├── Invoices/
│   └── Returns/
├── BANKING/
├── MISC/
└── Processed/             (archived emails)
```

### **Folder Creation Script**

```javascript
// src/lib/imapFolderProvisioner.js

import ImapClient from 'emailjs-imap-client';

export async function provisionIMAPFolders(credentials, businessType, teamConfig) {
  const client = new ImapClient(credentials.host, credentials.port, {
    auth: {
      user: credentials.user,
      pass: credentials.password
    },
    useSecureTransport: true
  });

  await client.connect();

  // Get folder structure for business type
  const folderStructure = getFolderStructureForBusinessType(businessType);

  // Create folders recursively
  for (const folder of folderStructure) {
    try {
      await client.createMailbox(folder.path);
      console.log(`✅ Created folder: ${folder.path}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️ Folder exists: ${folder.path}`);
      } else {
        console.error(`❌ Error creating ${folder.path}:`, error.message);
      }
    }
  }

  // Create manager folders
  for (const manager of teamConfig.managers) {
    const managerFolder = `MANAGER/${manager.name}`;
    try {
      await client.createMailbox(managerFolder);
      console.log(`✅ Created manager folder: ${managerFolder}`);
    } catch (error) {
      console.error(`❌ Error creating manager folder:`, error.message);
    }
  }

  await client.close();
  
  return {
    success: true,
    foldersCreated: folderStructure.length + teamConfig.managers.length
  };
}
```

---

## 🔧 N8N Workflow Template Breakdown

### **1. IMAP Email Trigger Node**

```json
{
  "type": "n8n-nodes-base.emailReadImap",
  "parameters": {
    "pollTimes": {
      "item": [{
        "mode": "custom",
        "cronExpression": "0 */2 * * * *"  // Every 2 min
      }]
    },
    "mailbox": "INBOX",
    "format": "simple",
    "options": {
      "allowUnauthorizedCerts": false,
      "forceReconnect": 5,  // Reconnect every 5 polls
      "customEmailConfig": {
        "searchFilter": ['UNSEEN']  // Only unread emails
      }
    }
  }
}
```

**Key Points:**
- Polls INBOX every 2 minutes
- Only fetches UNSEEN (unread) emails
- Auto-reconnects every 5 polls (prevents stale connections)
- SSL/TLS required (allowUnauthorizedCerts: false)

---

### **2. Prepare Email Data (IMAP Specific)**

```javascript
// Normalizes IMAP format to FloWorx standard

function extractEmail(address) {
  // Handles: "Name <email@domain.com>" or "email@domain.com"
  const match = address.match(/<([^>]+)>/);
  return match ? match[1] : address.trim();
}

const normalized = {
  id: item.uid,                    // IMAP uses UID instead of message ID
  threadId: item.headers?.['in-reply-to'] || item.uid,
  subject: item.subject,
  from: extractEmail(item.from),
  body: htmlToText(item.html || item.text),
  provider: 'imap',
  uid: item.uid,                   // Keep UID for move operations
  mailbox: 'INBOX'
};
```

---

### **3. Move Email to Folder (IMAP)**

```json
{
  "type": "n8n-nodes-base.emailReadImap",
  "operation": "move",
  "parameters": {
    "uidAttributeName": "={{ $('Prepare Email Data').first().json.uid }}",
    "path": "={{ $json.folder_path }}",  // e.g., "SALES/NewInquiry"
    "options": {
      "allowUnauthorizedCerts": false
    }
  }
}
```

**How it works:**
1. Gets email UID from previous step
2. Moves email from INBOX to target folder
3. Email remains accessible in new folder
4. INBOX stays clean (processed emails removed)

---

### **4. Send Email via SMTP**

```json
{
  "type": "n8n-nodes-base.emailSend",
  "operation": "send",
  "parameters": {
    "fromEmail": "<<<BUSINESS_EMAIL>>>",
    "toEmail": "={{ $json.forward_to }}",
    "subject": "={{ $json.forward_subject }}",
    "message": "={{ $json.forward_body }}",
    "options": {
      "allowUnauthorizedCerts": false,
      "replyTo": "customer@example.com"  // Original sender
    }
  },
  "credentials": {
    "smtp": {
      "id": "<<<CLIENT_SMTP_CRED_ID>>>"
    }
  }
}
```

---

## 🔐 IMAP/SMTP Server Configuration

### **Common Email Providers**

#### **1. cPanel (Most Common)**

```javascript
IMAP Settings:
- Host: mail.yourdomain.com
- Port: 993 (SSL) or 143 (STARTTLS)
- Username: user@yourdomain.com
- Password: your-password

SMTP Settings:
- Host: mail.yourdomain.com
- Port: 465 (SSL) or 587 (TLS)
- Username: user@yourdomain.com
- Password: your-password
```

#### **2. GoDaddy**

```javascript
IMAP:
- Host: imap.secureserver.net
- Port: 993

SMTP:
- Host: smtpout.secureserver.net
- Port: 465
```

#### **3. Bluehost**

```javascript
IMAP:
- Host: mail.yourdomain.com
- Port: 993

SMTP:
- Host: mail.yourdomain.com
- Port: 465
```

#### **4. Namecheap**

```javascript
IMAP:
- Host: mail.privateemail.com
- Port: 993

SMTP:
- Host: mail.privateemail.com
- Port: 465
```

#### **5. Gmail (IMAP Mode)**

```javascript
IMAP:
- Host: imap.gmail.com
- Port: 993
- Password: App-specific password (not regular password)

SMTP:
- Host: smtp.gmail.com
- Port: 465
```

**Enable IMAP:**
1. Gmail → Settings → Forwarding and POP/IMAP
2. Enable IMAP
3. Create app-specific password (Security → 2-Step Verification → App passwords)

#### **6. Outlook/Microsoft 365 (IMAP Mode)**

```javascript
IMAP:
- Host: outlook.office365.com
- Port: 993
- Password: App-specific password

SMTP:
- Host: smtp.office365.com
- Port: 587 (TLS)
```

**Enable IMAP:**
1. Outlook.com → Settings → Sync email
2. Enable IMAP
3. Use app password

---

## 📝 Edge Function Updates

### **Update deploy-n8n to Support IMAP**

```typescript
// supabase/functions/deploy-n8n/index.ts

async function deployWorkflow(userId: string, provider: string) {
  let template;
  
  // Load appropriate template
  if (provider === 'gmail') {
    template = await loadTemplate('gmail-template.json');
  } else if (provider === 'outlook' || provider === 'microsoft') {
    template = await loadTemplate('outlook-template.json');
  } else if (provider === 'imap') {
    template = await loadTemplate('imap-template.json');  // NEW
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  
  // ... rest of deployment logic
}
```

### **Update Folder Provisioning**

```typescript
// src/lib/labelSyncValidator.js

export async function provisionFolders(provider, credentials, businessType) {
  if (provider === 'gmail') {
    return await provisionGmailLabels(credentials, businessType);
  } else if (provider === 'outlook') {
    return await provisionOutlookFolders(credentials, businessType);
  } else if (provider === 'imap') {
    return await provisionIMAPFolders(credentials, businessType);  // NEW
  }
}
```

---

## 🧪 Testing IMAP Integration

### **1. Test Connection**

```javascript
// Test script
import ImapClient from 'emailjs-imap-client';

async function testIMAPConnection() {
  const client = new ImapClient('mail.yourdomain.com', 993, {
    auth: {
      user: 'test@yourdomain.com',
      pass: 'your-password'
    },
    useSecureTransport: true
  });

  try {
    await client.connect();
    console.log('✅ IMAP connection successful');
    
    // List mailboxes
    const mailboxes = await client.listMailboxes();
    console.log('📂 Available mailboxes:', mailboxes);
    
    await client.close();
  } catch (error) {
    console.error('❌ IMAP connection failed:', error.message);
  }
}

testIMAPConnection();
```

### **2. Test Folder Creation**

```javascript
async function testFolderCreation() {
  const client = await connectIMAP();
  
  try {
    await client.createMailbox('SALES');
    console.log('✅ Created SALES folder');
    
    await client.createMailbox('SALES/NewInquiry');
    console.log('✅ Created SALES/NewInquiry subfolder');
  } catch (error) {
    console.error('❌ Folder creation failed:', error.message);
  }
  
  await client.close();
}
```

### **3. Test Email Move**

```javascript
async function testEmailMove() {
  const client = await connectIMAP();
  
  await client.selectMailbox('INBOX');
  const messages = await client.listMessages('INBOX', '1:1');
  
  if (messages.length > 0) {
    const uid = messages[0].uid;
    await client.moveMessage(uid, 'SALES');
    console.log(`✅ Moved email ${uid} to SALES folder`);
  }
  
  await client.close();
}
```

---

## ⚠️ Known Limitations & Workarounds

### **1. No Real-Time Notifications**

**Limitation:** IMAP requires polling (2-minute delay)

**Workaround:**
- Set polling interval to 1-2 minutes
- Acceptable for most business use cases
- More reliable than webhooks (no expiration)

**Why it's okay:**
- Contractors rarely need instant responses
- 2-minute delay is negligible for customer service
- Avoids webhook complexity

---

### **2. No Multi-Category Support**

**Limitation:** Email can only be in one folder

**Workaround:**
```javascript
// Use hierarchical folders for sub-categories
if (primary === 'SALES' && secondary === 'URGENT') {
  // Choose most important category
  folder = 'URGENT';  // URGENT takes priority
} else if (primary === 'SALES') {
  folder = 'SALES/NewInquiry';
}
```

**Alternative:**
- Use folder name to encode categories: `URGENT-SALES-NewInquiry`
- Or use metadata in email headers (custom headers)

---

### **3. Draft Creation Limited**

**Limitation:** Most IMAP servers don't support programmatic draft creation

**Workaround:**
```javascript
// Option 1: Skip draft creation
// Just include AI draft in forward to manager ✅ RECOMMENDED

// Option 2: Send draft to self
await smtp.send({
  to: businessEmail,
  subject: 'DRAFT: ' + originalSubject,
  body: aiDraft
});

// Option 3: Append to Drafts folder (if supported)
await imap.append('Drafts', draftMessage);
```

---

### **4. Folder Hierarchy Varies by Server**

**Limitation:** Different IMAP servers use different separators

**Examples:**
```javascript
Gmail:        "SALES/NewInquiry"     (uses "/")
Courier:      "SALES.NewInquiry"     (uses ".")
Cyrus:        "SALES^NewInquiry"     (uses "^")
```

**Solution:**
```javascript
// Detect separator on connection
const serverInfo = await client.listNamespaces();
const separator = serverInfo.personal[0].delimiter;  // "/" or "." or "^"

// Use detected separator
const folderPath = `SALES${separator}NewInquiry`;
```

---

## 🚀 Implementation Checklist

### **Backend Updates**

- [ ] Add IMAP template (`backend/templates/imap-workflow-template.json`) ✅
- [ ] Update `deploy-n8n` edge function to support IMAP
- [ ] Add IMAP folder provisioning function
- [ ] Add IMAP connection testing utility
- [ ] Update provider detection to include 'imap'

### **Frontend Updates**

- [ ] Add "Connect IMAP Email" button to onboarding
- [ ] Create IMAP credential input form (host, port, user, password)
- [ ] Add IMAP server auto-detection (common providers)
- [ ] Update folder health check for IMAP
- [ ] Add IMAP-specific setup instructions

### **N8N Configuration**

- [ ] Upload IMAP template to N8N
- [ ] Test template with cPanel email
- [ ] Test template with GoDaddy email
- [ ] Test template with Bluehost email
- [ ] Verify folder creation works
- [ ] Verify email moving works
- [ ] Verify SMTP forwarding works

### **Testing**

- [ ] Test with 5 different IMAP providers
- [ ] Test folder hierarchy creation
- [ ] Test email classification and routing
- [ ] Test AI draft generation
- [ ] Test manager forwarding
- [ ] Test performance metrics tracking
- [ ] Load test (100+ emails)

### **Documentation**

- [ ] User guide: "Connecting Your Domain Email"
- [ ] Troubleshooting: Common IMAP errors
- [ ] Provider setup guides (cPanel, GoDaddy, etc.)
- [ ] Migration guide (Gmail/Outlook → IMAP)

---

## 📊 Expected Performance

### **Comparison Table**

| Metric | Gmail | Outlook | IMAP |
|--------|-------|---------|------|
| **Connection Time** | 2-3s | 2-3s | 1-2s ✅ |
| **Email Processing** | 3-5s | 3-5s | 3-5s |
| **Folder Creation** | 10-15s | 20-30s | 5-10s ✅ |
| **Latency (trigger)** | <1s | <1s | 0-120s ⚠️ |
| **Reliability** | 99.9% | 99.5% | 99.8% |
| **Setup Complexity** | Medium | Medium | **Low** ✅ |

**IMAP Advantages:**
- ✅ Faster folder creation
- ✅ Simpler setup (no OAuth)
- ✅ Universal compatibility
- ✅ More reliable (no webhook expiration)

**IMAP Disadvantages:**
- ⚠️ Polling delay (0-2 minutes)
- ⚠️ No multi-category support
- ⚠️ Limited draft creation

---

## 🎯 Conclusion

**IMAP/SMTP integration is ESSENTIAL for FloWorx because:**

1. ✅ **Market Coverage**: Adds 15-20% market (contractors with domain email)
2. ✅ **Perfect Fit**: Target customers use web hosting email
3. ✅ **Universal**: Works with ANY email provider
4. ✅ **Simple Setup**: Easier than OAuth
5. ✅ **Competitive Advantage**: Most competitors don't support IMAP well

**Recommended Timeline:**
- Week 1-2: Backend implementation (IMAP folder provisioner)
- Week 3-4: Frontend updates (IMAP credential form)
- Week 5-6: Testing with 5+ providers
- Week 7: Documentation and launch

**Total Effort:** 6 weeks, 1 developer

**ROI:** 31x (as calculated in EMAIL_SYSTEM_COVERAGE_ANALYSIS.md)

---

**The IMAP template is ready - implementation can begin immediately! 🚀**

