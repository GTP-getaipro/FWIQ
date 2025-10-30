# Example: AI Master Classifier System Message with Manager Roles

## Sample Business: The Hot Tub Man Ltd.

### Managers Configured During Onboarding

1. **John Doe** - Sales Manager + Owner/CEO
2. **Jane Smith** - Service Manager
3. **Mike Johnson** - Operations Manager + Support Lead

---

## Generated System Message (Abbreviated)

```
You are an expert email processing and routing system for "The Hot Tub Man Ltd.".

Your SOLE task is to analyze the provided email (sender, subject, and body) and return a single, well-structured JSON object containing:
A concise summary of the email's purpose.
A precise classification with exactly ONE primary_category.
The most appropriate secondary_category if applicable.
The appropriate tertiary_category for specific banking emails, or null.
All relevant extracted entities (contact name, phone number, order number).
A confidence score between 0.0 and 1.0.
A brief reasoning explaining the classification choice.

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.
If the sender's email address ends with "@hottubman.com", always set:
"ai_can_reply": false

1. Analyze the entire email context (sender, subject, body).
2. Choose exactly ONE primary_category from the list below.
3. If the primary category has sub-categories, choose the most fitting secondary_category.
4. For banking-related emails, choose the correct tertiary_category.
5. Extract all available entities: contact name, phone number, order/invoice number.
6. Provide a confidence score (0.0 to 1.0) based on your certainty.
7. Provide a brief explanation of your classification reasoning.
8. If a category or subcategory does not apply, return null for those fields.
9. Return ONLY the JSON object below — no additional text.

### Categories:

**Phone**: Only emails from phone/SMS/voicemail providers (e.g., service@ringcentral.com) should be tagged PHONE.
Examples: You have a new voice message from (403) 123-4567., New SMS received from customer., Missed call alert.
Keywords: voicemail, voice message, missed call, SMS, text message, RingCentral, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail
secondary_category: [Phone]

**Promo**: Marketing, discounts, sales flyers.
Examples: Save 25% this weekend only!, Refer a friend and earn rewards, Bundle deal on accessories, Exclusive vendor promotion
Keywords: marketing, discount, sale, promotion, offer, deal, bundle, referral, rewards
secondary_category: [Promo]

**Sales**: Emails from leads or customers expressing interest in purchasing hot tubs and spas, requesting pricing, or discussing specific models or service packages.
Examples: Quote for Jacuzzi installation, What are your prices?, Can you give me pricing on hot tub servicing?
Keywords: price, quote, buy, purchase, how much, cost, model, spa package, installation quote, new customer, interested in buying
secondary_category: [Sales]

**Support**: Emails from existing customers related to post-sales support for The Hot Tub Man Ltd.. This includes technical troubleshooting, questions about parts/chemicals, appointment scheduling, and general inquiries.
Examples: Technical troubleshooting, Parts and chemicals questions, Appointment scheduling
Keywords: repair, fix, broken, appointment, service, help, technical, parts, chemicals, maintenance
secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]

**Urgent**: Emails requiring immediate attention or indicating emergency situations.
Examples: Hot tub emergency, Urgent repair needed, Critical equipment failure
Keywords: urgent, emergency, ASAP, immediate, critical, broken, not working, emergency repair
secondary_category: [Urgent]

[... more categories ...]

### Tertiary Category Rules:

**e-transfer**:
FromBusiness - Emails confirming that The Hot Tub Man Ltd. has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider.
ToBusiness - Emails confirming that a payment has been deposited into The Hot Tub Man Ltd.'s account.

**receipts**:
PaymentSent - Email confirming The Hot Tub Man Ltd. sent a payment
PaymentReceived - Email confirming The Hot Tub Man Ltd. received a payment

### Business-Specific Rules:
If the email confirms a purchase or payment by The Hot Tub Man Ltd. (or relevant business/person), classify as: "primary_category": "Banking", "secondary_category": "receipts", "tertiary_category": "PaymentSent"
If the email confirms the business received money (e.g., from a customer): "primary_category": "Banking", "secondary_category": "receipts", "tertiary_category": "PaymentReceived"
If secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]
If secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]
Form Submission Override: An email that is a form submission MUST BE CLASSIFIED AS URGENT if the "How can we help?" section contains keywords indicating a critical service issue.
Keywords for urgent form submissions: broken, not working, leaking, won't start, no power, error code, tripping breaker, won't heat


### Team Manager Information:

Use this information to identify emails intended for specific managers by name or by their role responsibilities.

**John Doe** (john@hottubman.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, how much, cost, pricing, estimate, proposal, new customer, lead, interested in, want to buy
  - Owner/CEO: Handles strategic, legal, high-priority
    Keywords: strategic, legal, partnership, media, press, executive, important, confidential, high priority, compliance, regulation

**Jane Smith** (jane@hottubman.com)
Roles:
  - Service Manager: Handles repairs, appointments, emergencies
    Keywords: repair, fix, broken, appointment, emergency, service call, urgent, not working, need help, schedule, maintenance, inspection

**Mike Johnson** (mike@hottubman.com)
Roles:
  - Operations Manager: Handles vendors, internal ops, hiring
    Keywords: vendor, supplier, hiring, internal, operations, procurement, inventory, order, partnership, contract, staff, employee
  - Support Lead: Handles general questions, parts, how-to
    Keywords: help, question, parts, chemicals, how to, support, assistance, information, inquiry, general question, product info

**Classification Guidance for Manager Routing:**
- When an email mentions a manager by name, consider routing to that manager
- When an email contains keywords matching a manager's role, consider categorizing accordingly
- For emails addressed "Dear [Manager Name]" or "Hi [Manager Name]", prioritize that manager
- Combine manager role keywords with email content to determine the appropriate category


### Known Suppliers:

Use this information to identify emails from known suppliers and vendors.

- **Spa Supply Co.** (Domains: spasupply.com, spaorders.com)
- **Hot Tub Parts Ltd.** (Domains: hottubparts.ca)
- **Chemical Solutions Inc.** (Domains: chemicalsolutions.com)

**Classification Guidance for Supplier Emails:**
- Emails from supplier domains should typically be categorized as SUPPLIERS
- Invoices and receipts from suppliers go to Banking > receipts > PaymentSent
- Supplier promotional emails go to Promo category


### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

```json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
```
```

---

## Classification Examples with Manager Context

### Example 1: Email Mentioning Manager by Name

**Input Email:**
```
From: customer@example.com
To: info@hottubman.com
Subject: Question for John about pricing

Hi John,

I'm interested in getting a hot tub installed. Can you provide 
me with a quote for a 6-person spa with installation?

Thanks,
Bob
```

**AI Classification:**
```json
{
  "summary": "Customer requesting installation quote, addressed to John (Sales Manager)",
  "reasoning": "Email mentions 'John' by name who is Sales Manager, contains sales keywords 'quote', 'pricing', 'interested', and 'installation'",
  "confidence": 0.95,
  "primary_category": "Sales",
  "secondary_category": "Sales",
  "tertiary_category": null,
  "entities": {
    "contact_name": "Bob",
    "email_address": "customer@example.com",
    "phone_number": null,
    "order_number": null
  },
  "ai_can_reply": true
}
```

**Why High Confidence:**
- Manager name "John" mentioned directly
- John's role is Sales Manager
- Email contains multiple sales keywords: "quote", "pricing", "interested"
- Content matches Sales Manager's responsibilities

---

### Example 2: Email with Role Keywords (No Name)

**Input Email:**
```
From: customer@example.com
To: service@hottubman.com
Subject: URGENT - Hot tub not working

Our hot tub stopped heating and shows an error code.
We need emergency repair service as soon as possible.

Thanks
```

**AI Classification:**
```json
{
  "summary": "Emergency repair request for hot tub heating failure",
  "reasoning": "Contains urgent/emergency keywords matching Service Manager role: 'urgent', 'not working', 'emergency repair', 'error code'. Jane Smith handles repairs and emergencies.",
  "confidence": 0.92,
  "primary_category": "Urgent",
  "secondary_category": "Urgent",
  "tertiary_category": null,
  "entities": {
    "contact_name": null,
    "email_address": "customer@example.com",
    "phone_number": null,
    "order_number": null
  },
  "ai_can_reply": true
}
```

**Why High Confidence:**
- Multiple Service Manager keywords: "urgent", "emergency", "repair", "not working", "error code"
- Matches Jane Smith's responsibilities (Service Manager)
- Clear emergency/urgent context

---

### Example 3: Operations/Vendor Email

**Input Email:**
```
From: vendor@chemicals.com
To: info@hottubman.com
Subject: Partnership Opportunity - Bulk Chemical Supplier

Dear Mike,

We're reaching out to discuss a potential partnership for 
supplying hot tub chemicals and parts to your business.
We offer competitive pricing and can manage your inventory.

Best regards,
Chemical Solutions Inc.
```

**AI Classification:**
```json
{
  "summary": "Vendor partnership proposal from chemical supplier, addressed to Mike (Operations Manager)",
  "reasoning": "Email addressed to 'Mike' who is Operations Manager responsible for vendor relationships. Contains operations keywords: 'partnership', 'supplier', 'inventory', 'vendor'. From supplier domain.",
  "confidence": 0.93,
  "primary_category": "Manager",
  "secondary_category": null,
  "tertiary_category": null,
  "entities": {
    "contact_name": "Chemical Solutions Inc.",
    "email_address": "vendor@chemicals.com",
    "phone_number": null,
    "order_number": null
  },
  "ai_can_reply": false
}
```

**Why High Confidence:**
- Manager name "Mike" mentioned (Operations Manager)
- Multiple operations keywords: "partnership", "supplier", "inventory"
- From supplier/vendor email address
- Matches Mike Johnson's operations responsibilities

---

## Key Improvements

### Before This Implementation
- Only manager names were listed
- No role context for classification
- No keywords to guide AI decisions
- Lower confidence in manager-related emails

**Old System Message:**
```
- Managers: John Doe, Jane Smith, Mike Johnson
- Suppliers: Spa Supply Co, Hot Tub Parts Ltd
```

### After This Implementation
- Full manager profiles with roles
- Role-specific keywords for each manager
- Clear classification guidance
- Higher confidence with better context

**New System Message:**
```
### Team Manager Information:

**John Doe** (john@hottubman.com)
Roles:
  - Sales Manager: Handles quotes, new leads, pricing inquiries
    Keywords: price, quote, buy, purchase, how much, cost...
  - Owner/CEO: Handles strategic, legal, high-priority
    Keywords: strategic, legal, partnership, media...

[Full role descriptions with keywords for each manager]

**Classification Guidance for Manager Routing:**
- When an email mentions a manager by name, consider routing...
- When an email contains keywords matching a manager's role...
```

---

## Benefits Summary

✅ **Name Recognition**: AI identifies when specific managers are mentioned
✅ **Keyword Matching**: Role-specific keywords improve category assignment
✅ **Higher Confidence**: More context = better classification decisions
✅ **Multiple Roles**: Managers can wear multiple hats
✅ **Guidance Included**: Clear instructions for AI on how to use manager info
✅ **Consistent Definitions**: Single source of truth for all role definitions

