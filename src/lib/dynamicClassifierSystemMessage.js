/**
 * DYNAMIC CLASSIFIER SYSTEM MESSAGE GENERATOR
 * 
 * This creates a fully dynamic, business-agnostic system message that adapts to:
 * - Any business type and industry
 * - Dynamic supplier lists
 * - Industry-specific keywords
 * - Business-specific categories
 * - Custom AI reply logic
 */

// Business type templates with industry-specific configurations
const BUSINESS_TYPE_TEMPLATES = {
  'Electrician': {
    keywords: ['electrical', 'wiring', 'outlet', 'breaker', 'circuit', 'power', 'electricity', 'installation', 'repair'],
    services: ['Electrical Installation', 'Electrical Repair', 'Panel Upgrades', 'Outlet Installation'],
    suppliers: ['Electrical Supply Co', 'Wire & Cable Co', 'Electrical Parts Inc'],
    categories: {
      'SALES': ['NewInstallation', 'RepairService', 'UpgradeService', 'EmergencyRepair'],
      'SUPPORT': ['TechnicalSupport', 'PartsAndSupplies', 'AppointmentScheduling', 'General'],
      'URGENT': ['ElectricalEmergency', 'PowerOutage', 'SafetyHazard', 'Other']
    }
  },
  'Plumber': {
    keywords: ['plumbing', 'pipe', 'drain', 'toilet', 'faucet', 'leak', 'water', 'sewer', 'installation'],
    services: ['Plumbing Installation', 'Plumbing Repair', 'Drain Cleaning', 'Leak Repair'],
    suppliers: ['Plumbing Supply Co', 'Pipe & Fitting Co', 'Plumbing Parts Inc'],
    categories: {
      'SALES': ['NewInstallation', 'RepairService', 'MaintenanceService', 'EmergencyRepair'],
      'SUPPORT': ['TechnicalSupport', 'PartsAndSupplies', 'AppointmentScheduling', 'General'],
      'URGENT': ['WaterLeak', 'SewerBackup', 'BurstPipe', 'Other']
    }
  },
  'HVAC': {
    keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ac', 'thermostat', 'ductwork'],
    services: ['HVAC Installation', 'HVAC Repair', 'Maintenance', 'Duct Cleaning'],
    suppliers: ['HVAC Supply Co', 'Refrigeration Parts', 'HVAC Equipment Inc'],
    categories: {
      'SALES': ['NewInstallation', 'RepairService', 'MaintenanceService', 'EmergencyRepair'],
      'SUPPORT': ['TechnicalSupport', 'PartsAndSupplies', 'AppointmentScheduling', 'General'],
      'URGENT': ['NoHeat', 'NoCooling', 'SystemFailure', 'Other']
    }
  },
  'Hot tub & Spa': {
    keywords: ['hot tub', 'spa', 'jacuzzi', 'chemicals', 'filter', 'heater', 'jets', 'cover'],
    services: ['Hot Tub Installation', 'Hot Tub Repair', 'Chemical Service', 'Cover Replacement'],
    suppliers: ['Aqua Spa Supply', 'Strong Spas', 'Paradise Patio Furniture'],
    categories: {
      'SALES': ['NewSpaSales', 'AccessorySales', 'Consultations', 'QuoteRequests'],
      'SUPPORT': ['TechnicalSupport', 'PartsAndChemicals', 'AppointmentScheduling', 'General'],
      'URGENT': ['LeakEmergencies', 'PowerOutages', 'EmergencyRepairs', 'Other']
    }
  },
  'General Contractor': {
    keywords: ['construction', 'renovation', 'remodel', 'contractor', 'building', 'project', 'estimate'],
    services: ['Construction', 'Renovation', 'Remodeling', 'Project Management'],
    suppliers: ['Building Supply Co', 'Construction Materials', 'Contractor Supply'],
    categories: {
      'SALES': ['NewProject', 'Renovation', 'Remodeling', 'Consultation'],
      'SUPPORT': ['ProjectSupport', 'MaterialsAndSupplies', 'Scheduling', 'General'],
      'URGENT': ['SafetyIssue', 'ProjectDelay', 'MaterialShortage', 'Other']
    }
  }
};

// Default template for unknown business types
const DEFAULT_TEMPLATE = {
  keywords: ['service', 'repair', 'installation', 'maintenance', 'support'],
  services: ['General Service', 'Repair', 'Installation', 'Maintenance'],
  suppliers: ['General Supply Co', 'Service Parts Inc'],
  categories: {
    'SALES': ['NewService', 'RepairService', 'MaintenanceService', 'Consultation'],
    'SUPPORT': ['TechnicalSupport', 'PartsAndSupplies', 'AppointmentScheduling', 'General'],
    'URGENT': ['EmergencyRepair', 'ServiceIssue', 'SafetyConcern', 'Other']
  }
};

export function generateDynamicClassifierSystemMessage(businessInfo, managers = [], suppliers = [], historicalData = null, labelConfig = {}) {
  const businessName = businessInfo.name || 'Business';
  const businessTypes = businessInfo.businessTypes || ['General Service'];
  const primaryBusinessType = businessTypes[0];
  
  // Get business-specific template
  const template = BUSINESS_TYPE_TEMPLATES[primaryBusinessType] || DEFAULT_TEMPLATE;
  
  // Build dynamic content
  const dynamicCategories = buildDynamicCategories(businessInfo, template, suppliers);
  const dynamicKeywords = buildDynamicKeywords(template, businessInfo);
  const dynamicSuppliers = buildDynamicSuppliers(suppliers, template);
  const dynamicServices = buildDynamicServices(businessInfo, template);
  const dynamicAIReplyLogic = buildDynamicAIReplyLogic(businessInfo, template);
  
  let systemMessage = `You are an expert email processing and routing system for "${businessName}". Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### CRITICAL RULES:
1. **MANDATORY SECONDARY CATEGORIES**: For the following primary categories, you MUST ALWAYS select a secondary category - NEVER return null:
   - If primary_category is 'URGENT' → secondary_category MUST be one of: ${template.categories.URGENT.join(', ')}

2. **MANDATORY TERTIARY CATEGORIES**: For the following secondary categories, you MUST ALWAYS select a tertiary category - NEVER return null:
   - If secondary_category is 'e-transfer' → tertiary_category MUST be 'FromBusiness' or 'ToBusiness'
   - If secondary_category is 'receipts' → tertiary_category MUST be 'PaymentSent' or 'PaymentReceived'
   - If secondary_category is 'invoice' → tertiary_category MUST be 'BillingDocument', 'PaymentDue', or 'FormalInvoice'
   - If secondary_category is 'bank-alert' → tertiary_category MUST be 'SecurityAlert', 'FraudWarning', or 'PasswordReset'
   - If secondary_category is 'refund' → tertiary_category MUST be 'RefundIssued' or 'RefundReceived'

3. **AI REPLY LOGIC**: Set "ai_can_reply": true ONLY if:
   - primary_category is Support OR Sales OR Urgent
   - AND confidence ≥ 0.75
   - AND sender is external (not @${businessInfo.emailDomain || 'business.com'})

4. **INTERNAL EMAIL RULE**: If sender's email ends with "@${businessInfo.emailDomain || 'business.com'}", ALWAYS set "ai_can_reply": false

### BUSINESS CONTEXT:
- Business Name: ${businessName}
- Business Type(s): ${businessTypes.join(', ')}
- Email Domain: ${businessInfo.emailDomain || 'business.com'}
- Phone: ${businessInfo.phone || 'Not provided'}
- Website: ${businessInfo.websiteUrl || 'business.com'}
- Address: ${businessInfo.address || 'Not provided'}
- Currency: ${businessInfo.currency || 'USD'}
- Timezone: ${businessInfo.timezone || 'America/New_York'}
- Service Areas: ${businessInfo.serviceAreas || 'Main service area'}
- Operating Hours: ${businessInfo.operatingHours || 'Monday-Friday 9AM-5PM'}
- Response Time: ${businessInfo.responseTime || '24 hours'}

### SERVICES OFFERED:
${dynamicServices}

### CATEGORY STRUCTURE:

${dynamicCategories}

### CLASSIFICATION VALIDATION RULES:

**CRITICAL**: Before returning your JSON response, validate that:
1. If primary_category is 'URGENT', secondary_category is NOT null and must be one of: ${template.categories.URGENT.join(', ')}
2. If secondary_category is 'e-transfer', 'receipts', 'invoice', 'bank-alert', or 'refund', tertiary_category is NOT null
3. If tertiary_category is null, verify that the secondary_category doesn't require one
4. All required fields are populated
5. Confidence score is between 0.0 and 1.0

### JSON OUTPUT FORMAT:
Return ONLY the following JSON structure. Do not add any other text or explanations.

\`\`\`json
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
\`\`\`

**REMEMBER**: 
- For URGENT primary category, secondary_category is MANDATORY and must never be null!
- For e-transfer, receipts, invoice, bank-alert, and refund secondary categories, tertiary_category is MANDATORY and must never be null!`;

  return systemMessage;
}

function buildDynamicCategories(businessInfo, template, suppliers) {
  const businessName = businessInfo.name || 'Business';
  const businessTypes = businessInfo.businessTypes || ['General Service'];
  
  let categories = `**BANKING**: Financial transactions, invoices, payments, bank alerts, receipts, and money-related communications
secondary_category: [BankAlert, e-Transfer, Invoice, PaymentConfirmation, Receipts, Refund]

**BankAlert** - Automated security-related messages from banks or financial platforms
tertiary_category: [SecurityAlert, FraudWarning, PasswordReset]
- SecurityAlert: General security notifications, login attempts, account updates
- FraudWarning: Specific fraud detection alerts or suspicious activity notifications  
- PasswordReset: Password change confirmations or reset notifications

**e-Transfer** - Interac e-Transfer confirmations (sent or received)
tertiary_category: [FromBusiness, ToBusiness] - **MANDATORY - NEVER NULL**
- FromBusiness: Emails confirming ${businessName} SENT a payment to vendors/suppliers
  Keywords: "you sent", "payment sent", "transfer sent", "funds sent", "payment completed"
- ToBusiness: Emails confirming ${businessName} RECEIVED a payment from customers
  Keywords: "you received", "payment received", "funds deposited", "money received"

**Invoice** - Billing documents and payment due notices
tertiary_category: [BillingDocument, PaymentDue, FormalInvoice] - **MANDATORY - NEVER NULL**
- BillingDocument: General billing statements or account summaries
- PaymentDue: Payment reminders or overdue notices
- FormalInvoice: Official invoices with line items and payment terms

**PaymentConfirmation** - Payment processing confirmations
tertiary_category: [PaymentProcessed, PaymentFailed, PaymentPending]
- PaymentProcessed: Successful payment confirmations
- PaymentFailed: Failed payment notifications
- PaymentPending: Pending payment status updates

**Receipts** - Payment receipts and transaction confirmations
tertiary_category: [PaymentSent, PaymentReceived] - **MANDATORY - NEVER NULL**
- PaymentSent: Emails confirming ${businessName} MADE a payment or purchase
  Keywords: "you paid", "payment sent", "purchase confirmed", "amount charged"
- PaymentReceived: Emails confirming ${businessName} RECEIVED payment from customers
  Keywords: "you just got paid", "payment received", "amount paid", "funds received"

**Refund** - Refund notifications and confirmations
tertiary_category: [RefundIssued, RefundReceived] - **MANDATORY - NEVER NULL**
- RefundIssued: Notifications that ${businessName} issued a refund
- RefundReceived: Notifications that ${businessName} received a refund

**FORMSUB**: Website form submissions and contact forms
secondary_category: [NewSubmission, WorkOrderForms, ServiceRequests, QuoteRequests]

**GOOGLE REVIEW**: Google Business reviews and review notifications
secondary_category: [NewReviews, ReviewResponses]

**MANAGER**: Internal management routing and team oversight
secondary_category: [Unassigned]
- Unassigned: Emails requiring manager review but not assigned to specific person

**PHONE**: Phone/SMS/voicemail communications
secondary_category: [IncomingCalls, Voicemails]
- IncomingCalls: Missed call notifications and call logs
- Voicemails: Voicemail transcripts and audio notifications

**PROMO**: Marketing, discounts, and promotional communications
secondary_category: [SocialMedia, SpecialOffers]

**RECRUITMENT**: Job applications, resumes, and hiring communications
secondary_category: [JobApplications, Interviews, NewHires]

**SALES**: ${getBusinessTypeDescription(businessTypes[0])} sales inquiries, product sales, and revenue opportunities
secondary_category: [${template.categories.SALES.join(', ')}]
${buildSalesCategoryDescriptions(template.categories.SALES, businessTypes[0])}

**SOCIALMEDIA**: Social media platform communications
secondary_category: [Facebook, Instagram, GoogleMyBusiness, LinkedIn]

**SUPPLIERS**: Supplier and vendor communications
secondary_category: [${template.suppliers.join(', ')}]
${buildSupplierCategoryDescriptions(template.suppliers)}

**SUPPORT**: Customer service and technical support
secondary_category: [${template.categories.SUPPORT.join(', ')}]
${buildSupportCategoryDescriptions(template.categories.SUPPORT, businessTypes[0])}

**URGENT**: Emergency situations requiring immediate attention
secondary_category: [${template.categories.URGENT.join(', ')}] - **MANDATORY - NEVER NULL**
${buildUrgentCategoryDescriptions(template.categories.URGENT, businessTypes[0])}

**MISC**: Miscellaneous emails and general correspondence
secondary_category: [General, Personal]`;

  return categories;
}

function buildDynamicKeywords(template, businessInfo) {
  const businessKeywords = template.keywords || [];
  const industryKeywords = getIndustryKeywords(businessInfo.businessTypes?.[0]);
  
  return [...businessKeywords, ...industryKeywords].join(', ');
}

function buildDynamicSuppliers(suppliers, template) {
  if (suppliers && suppliers.length > 0) {
    return suppliers.map(supplier => supplier.name || supplier).join(', ');
  }
  return template.suppliers.join(', ');
}

function buildDynamicServices(businessInfo, template) {
  const services = businessInfo.services || template.services || [];
  return services.map(service => `- ${service}`).join('\n');
}

function buildDynamicAIReplyLogic(businessInfo, template) {
  const businessType = businessInfo.businessTypes?.[0] || 'General Service';
  
  // Customize AI reply logic based on business type
  if (businessType.includes('Emergency') || businessType.includes('Urgent')) {
    return "Set ai_can_reply: true for URGENT, Support, and Sales categories with confidence ≥ 0.75";
  } else if (businessType.includes('Medical') || businessType.includes('Legal')) {
    return "Set ai_can_reply: false for all categories (requires human review)";
  } else {
    return "Set ai_can_reply: true for Support, Sales, and Urgent categories with confidence ≥ 0.75";
  }
}

function getBusinessTypeDescription(businessType) {
  const descriptions = {
    'Electrician': 'Electrical service',
    'Plumber': 'Plumbing service', 
    'HVAC': 'HVAC service',
    'Hot tub & Spa': 'Hot tub and spa',
    'General Contractor': 'Construction and contracting',
    'Painting': 'Painting service',
    'Roofing': 'Roofing service'
  };
  
  return descriptions[businessType] || 'Service';
}

function buildSalesCategoryDescriptions(salesCategories, businessType) {
  return salesCategories.map(category => {
    const descriptions = {
      'NewSpaSales': 'New hot tub or spa purchase inquiries and sales opportunities',
      'NewInstallation': 'New installation service inquiries and sales opportunities',
      'RepairService': 'Repair service inquiries and sales opportunities',
      'MaintenanceService': 'Maintenance service inquiries and sales opportunities',
      'AccessorySales': 'Accessory and parts sales inquiries',
      'Consultations': 'Sales consultations and product demonstrations',
      'QuoteRequests': 'Pricing requests and quote inquiries'
    };
    
    return `- ${category}: ${descriptions[category] || 'Sales inquiries and opportunities'}`;
  }).join('\n');
}

function buildSupplierCategoryDescriptions(suppliers) {
  return suppliers.map(supplier => {
    return `- ${supplier}: Emails from ${supplier} supplier`;
  }).join('\n');
}

function buildSupportCategoryDescriptions(supportCategories, businessType) {
  return supportCategories.map(category => {
    const descriptions = {
      'TechnicalSupport': 'Technical issues, troubleshooting, and repair guidance',
      'PartsAndSupplies': 'Parts, supplies, and equipment inquiries',
      'PartsAndChemicals': 'Parts, chemicals, and supplies inquiries',
      'AppointmentScheduling': 'Service appointment requests and scheduling',
      'General': 'General customer questions and support inquiries'
    };
    
    return `- ${category}: ${descriptions[category] || 'Customer support inquiries'}`;
  }).join('\n');
}

function buildUrgentCategoryDescriptions(urgentCategories, businessType) {
  return urgentCategories.map(category => {
    const descriptions = {
      'EmergencyRepairs': 'Urgent repair requests and equipment failures',
      'LeakEmergencies': 'Water leaks and plumbing emergencies',
      'PowerOutages': 'Electrical failures and power issues',
      'ElectricalEmergency': 'Electrical emergencies and safety hazards',
      'WaterLeak': 'Water leaks and flooding emergencies',
      'SewerBackup': 'Sewer backup and drainage emergencies',
      'BurstPipe': 'Burst pipe and water damage emergencies',
      'NoHeat': 'Heating system failures and emergencies',
      'NoCooling': 'Cooling system failures and emergencies',
      'SystemFailure': 'System failures and equipment breakdowns',
      'SafetyIssue': 'Safety concerns and hazardous situations',
      'ProjectDelay': 'Project delays and scheduling emergencies',
      'MaterialShortage': 'Material shortages and supply emergencies',
      'Other': 'Other urgent matters requiring immediate attention'
    };
    
    return `- ${category}: ${descriptions[category] || 'Urgent matters requiring immediate attention'}`;
  }).join('\n');
}

function getIndustryKeywords(businessType) {
  const industryKeywords = {
    'Electrician': ['electrical', 'wiring', 'outlet', 'breaker', 'circuit', 'power'],
    'Plumber': ['plumbing', 'pipe', 'drain', 'toilet', 'faucet', 'leak', 'water'],
    'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'thermostat'],
    'Hot tub & Spa': ['hot tub', 'spa', 'jacuzzi', 'chemicals', 'filter', 'heater'],
    'General Contractor': ['construction', 'renovation', 'remodel', 'contractor', 'building']
  };
  
  return industryKeywords[businessType] || [];
}
