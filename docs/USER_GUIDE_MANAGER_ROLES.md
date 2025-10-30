# User Guide: Manager Role-Based Email Classification

## Overview

Your FloWorx AI system can now intelligently route emails based on your team members' roles. When you set up managers during onboarding, the AI will recognize both their names and the types of work they handle.

## How to Set Up Manager Roles

### Step 1: Navigate to Team Setup

During onboarding, you'll reach the "Team Setup" step where you can add your managers and team members.

### Step 2: Add Manager Information

For each manager, provide:

1. **Name**: Full name of the manager
2. **Email**: Their email address (for forwarding)
3. **Roles**: Select one or more roles from:

   - **💰 Sales Manager**: Handles quotes, new leads, pricing inquiries
   - **🔧 Service Manager**: Handles repairs, appointments, emergencies
   - **⚙️ Operations Manager**: Handles vendors, internal ops, hiring
   - **💬 Support Lead**: Handles general questions, parts, how-to
   - **👔 Owner/CEO**: Handles strategic, legal, high-priority matters

4. **Email Forwarding**: Toggle on/off whether to forward emails to this manager

### Step 3: Example Configuration

**Example Company: "The Hot Tub Man Ltd."**

| Manager | Email | Roles | Forwarding |
|---------|-------|-------|------------|
| John Doe | john@hottubman.com | Sales Manager, Owner/CEO | ✅ On |
| Jane Smith | jane@hottubman.com | Service Manager | ✅ On |
| Mike Johnson | mike@hottubman.com | Operations Manager, Support Lead | ✅ On |

### Step 4: Save and Deploy

After setting up your team:
1. Click "Save & Continue"
2. Complete the deployment process
3. Your AI system will now recognize your managers by name and role

---

## How Email Classification Works

### By Manager Name

When customers mention a manager by name, the AI recognizes them:

**Example 1:**
```
Subject: Question for John
Body: Hi John, can you send me a quote for installation?
```
➡️ **Result**: Categorized as **SALES** (John is Sales Manager)

**Example 2:**
```
Subject: For Jane - Emergency Repair
Body: Jane, our hot tub stopped working. Need urgent help!
```
➡️ **Result**: Categorized as **URGENT/SUPPORT** (Jane is Service Manager)

### By Role Keywords

Even without mentioning names, the AI understands what each role handles:

**Sales Manager Keywords:**
- price, quote, buy, purchase, how much, cost
- estimate, proposal, new customer, interested in

**Example:**
```
Subject: Pricing inquiry
Body: Can I get a quote for hot tub installation?
```
➡️ **Result**: Categorized as **SALES** (matches Sales Manager keywords)

**Service Manager Keywords:**
- repair, fix, broken, appointment, emergency
- service call, urgent, not working, maintenance

**Example:**
```
Subject: Hot tub not heating
Body: Our spa won't heat up and is showing error codes.
```
➡️ **Result**: Categorized as **SUPPORT/URGENT** (matches Service Manager keywords)

**Operations Manager Keywords:**
- vendor, supplier, hiring, internal operations
- procurement, inventory, partnership, contract

**Example:**
```
Subject: Supplier partnership opportunity
Body: We'd like to discuss supplying chemicals to your business.
```
➡️ **Result**: Categorized as **MANAGER/SUPPLIERS** (matches Operations keywords)

---

## Real-World Scenarios

### Scenario 1: Customer Knows Who to Ask

**Email:**
```
From: customer@gmail.com
To: info@hottubman.com
Subject: John - Need pricing info

Hi John,

We met at the home show last week. Can you send me 
pricing for the 6-person spa we discussed?

Thanks,
Sarah
```

**What Happens:**
1. ✅ AI recognizes "John" (Sales Manager)
2. ✅ Identifies keywords: "pricing", "spa"
3. ✅ Categorizes as **SALES**
4. ✅ High confidence classification
5. ✅ Email routed to Sales folder
6. ✅ Auto-forwarded to john@hottubman.com (if enabled)

---

### Scenario 2: Emergency Service Request

**Email:**
```
From: customer@gmail.com
To: service@hottubman.com
Subject: URGENT - Hot tub emergency

Our hot tub is broken and leaking water everywhere!
We need someone to come fix this ASAP!
```

**What Happens:**
1. ✅ AI identifies keywords: "urgent", "emergency", "broken", "leaking", "fix", "ASAP"
2. ✅ Matches Service Manager role (Jane Smith)
3. ✅ Categorizes as **URGENT**
4. ✅ High confidence classification
5. ✅ Email routed to Urgent folder
6. ✅ Auto-forwarded to jane@hottubman.com (if enabled)
7. ✅ Priority notification sent

---

### Scenario 3: Vendor Outreach

**Email:**
```
From: vendor@suppliers.com
To: info@hottubman.com
Subject: Partnership proposal for Mike

Dear Mike,

We supply hot tub parts and chemicals and would like
to discuss a partnership for your procurement needs.
```

**What Happens:**
1. ✅ AI recognizes "Mike" (Operations Manager)
2. ✅ Identifies keywords: "supplier", "partnership", "procurement"
3. ✅ Categorizes as **MANAGER** or **SUPPLIERS**
4. ✅ High confidence classification
5. ✅ Email routed to appropriate folder
6. ✅ Auto-forwarded to mike@hottubman.com (if enabled)

---

## Benefits for Your Business

### 1. Smarter Email Routing
Emails automatically go to the right category based on:
- Who they mention
- What they're about
- Which team member handles that type of request

### 2. Higher Accuracy
With role information, the AI makes better decisions:
- **Before**: "This email mentions pricing" → maybe Sales?
- **After**: "This email mentions pricing AND John (Sales Manager)" → definitely Sales!

### 3. Team Flexibility
Managers can wear multiple hats:
- **Owner/CEO + Sales Manager**: Handles strategic AND sales inquiries
- **Operations + Support Lead**: Manages vendors AND customer questions

### 4. Easy Updates
Change manager roles anytime:
1. Update manager information in settings
2. Re-deploy workflow
3. AI immediately uses new role assignments

---

## Tips for Best Results

### ✅ Do This:
- Assign roles that match actual responsibilities
- Use multiple roles if someone handles multiple areas
- Keep manager email addresses current
- Enable forwarding for managers who need notifications

### ❌ Avoid This:
- Don't assign all roles to one person (reduces routing precision)
- Don't leave roles blank if possible (reduces AI context)
- Don't forget to re-deploy after updating manager info

---

## Updating Manager Information

### After Initial Setup

1. **Navigate to Settings** → **Team Management**
2. **Edit Manager Information**:
   - Update names, emails, or roles
   - Add/remove managers
   - Toggle email forwarding
3. **Save Changes**
4. **Re-Deploy Workflow**:
   - Go to Deployment page
   - Click "Re-Deploy"
   - Confirm deployment
5. **Verify Changes**:
   - Check email classification
   - Test with sample emails if needed

---

## Troubleshooting

### Problem: Emails not routing to correct manager

**Solution:**
1. Check manager role assignments match their actual duties
2. Verify keywords in test emails match role keywords
3. Re-deploy workflow after making changes

### Problem: Manager name not recognized

**Solution:**
1. Ensure name spelling is exact in manager setup
2. Check that name appears in email subject or body
3. Verify manager profile is saved correctly

### Problem: Keywords not working

**Solution:**
1. Role keywords are predefined - check documentation for full list
2. Use exact keywords when testing
3. Remember AI considers context, not just single words

---

## Advanced: Role Keyword Reference

### Sales Manager Keywords
`price, quote, buy, purchase, how much, cost, pricing, estimate, proposal, new customer, lead, interested in, want to buy`

### Service Manager Keywords
`repair, fix, broken, appointment, emergency, service call, urgent, not working, need help, schedule, maintenance, inspection`

### Operations Manager Keywords
`vendor, supplier, hiring, internal, operations, procurement, inventory, order, partnership, contract, staff, employee`

### Support Lead Keywords
`help, question, parts, chemicals, how to, support, assistance, information, inquiry, general question, product info`

### Owner/CEO Keywords
`strategic, legal, partnership, media, press, executive, important, confidential, high priority, compliance, regulation`

---

## Need Help?

If you have questions about manager role configuration:

1. **Check Documentation**: Review `MANAGER_ROLE_CLASSIFICATION_FEATURE.md`
2. **Test Classification**: Send test emails to verify routing
3. **Contact Support**: Reach out if you need assistance with setup

---

## What's Next?

Once your manager roles are configured:

1. ✅ Complete onboarding and deployment
2. ✅ Monitor email classification accuracy
3. ✅ Adjust roles as your team evolves
4. ✅ Enjoy smarter, more accurate email routing!

Your AI assistant now understands your team structure and can route emails more intelligently than ever before.

