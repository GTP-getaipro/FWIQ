// Deno Edge Function: Deploy per-client n8n workflow
// - Creates/ensures Gmail or Outlook credential in n8n using the client's refresh_token
// - Resolves shared credential IDs (OpenAI, Supabase metrics)
// - Injects client data into the workflow template, then creates/updates and activates it in n8n.
import { serve } from 'https://deno.land/std@0.200.0/http/server.ts'; // FIX 1: Updated Deno std version
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Inline OpenAI key rotation (avoids shared dependency issues)
let cachedKeys = null;
let keyCounter = 0;

// PERFORMANCE NOTE: Global state in Deno Edge Functions persists across warm starts
// This is intentional behavior for serverless functions to enable efficient key rotation
// without re-initializing on every invocation
function loadKeys() {
  if (cachedKeys) return cachedKeys;
  const envKeys = [
    Deno.env.get('OPENAI_KEY_1'),
    Deno.env.get('OPENAI_KEY_2'),
    Deno.env.get('OPENAI_KEY_3'),
    Deno.env.get('OPENAI_KEY_4'),
    Deno.env.get('OPENAI_KEY_5')
  ].filter((k)=>Boolean(k)); // Type assertion for filter
  cachedKeys = envKeys;
  return envKeys;
}

function getNextKey() {
  const keys = loadKeys();
  if (keys.length === 0) {
    throw new Error('No OpenAI keys configured in Edge Function secrets');
  }
  // Key rotation: cycles through available keys for load balancing and rate limit management
  const key = keys[keyCounter % keys.length];
  keyCounter++;
  const ref = key.slice(0, 10) + '...';
  console.log(`🔑 Using API Key rotation: ${ref}`);
  return {
    key,
    ref
  };
}
const N8N_BASE_URL = Deno.env.get('N8N_BASE_URL') || Deno.env.get('NBN_BASE_URL') || '';
const N8N_API_KEY = Deno.env.get('N8N_API_KEY') || Deno.env.get('NBN_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// Using service role key for Supabase client operations
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

// CRITICAL: Validate all essential environment variables
// This prevents silent failures and provides clear error messages
function validateEnvironmentVariables() {
  const missingVars = [];
  
  if (!SUPABASE_URL) {
    missingVars.push('SUPABASE_URL');
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  
  if (!N8N_BASE_URL) {
    missingVars.push('N8N_BASE_URL (or NBN_BASE_URL)');
  }
  
  if (!N8N_API_KEY) {
    missingVars.push('N8N_API_KEY (or NBN_API_KEY)');
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. Please check your Supabase Edge Function secrets configuration.`;
    console.error(`❌ CRITICAL: ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  console.log('✅ Essential environment variables validated');
}

// Move Supabase client creation inside handler to prevent crash on OPTIONS requests
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    // Environment variables are already validated at module load time,
    // but we add an extra safety check here for redundancy
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required Supabase environment variables. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    
    // TODO: Replace with RLS-enabled service key that only has access to:
    // - profiles table (specific user records)
    // - integrations table (specific user records) 
    // - workflows table (specific user records)
    // - email_labels table (specific user records)
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdmin;
}
function slugify(input, fallback) {
  const s = (input || fallback || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  // SECURITY IMPROVEMENT: Increase from 20 to 50 chars to prevent collisions
  // For example: "the-hot-tub-man-spa-services-limited" vs "the-hot-tub-man-spa"
  return s.slice(0, 50);
}
/**
 * Business Type Templates for Comprehensive System Messages
 * Inline version for Deno edge function compatibility
 */ const businessTypeTemplates = {
  'Hot tub & Spa': {
    inquiryTypes: [
      {
        name: 'Service Job Inquiry',
        description: 'Repairs, site inspections, troubleshooting, warranty work',
        keywords: 'repair, broken, not working, error code, leaking, pump, heater',
        pricing: 'Site inspection: $105, Labor: $125/hr, Mileage: $1.50/km outside Red Deer/Leduc'
      },
      {
        name: 'New Spa Inquiry',
        description: 'Shopping for a new hot tub or spa',
        keywords: 'new hot tub, buying, purchasing, models, prices',
        pricing: 'Schedule consultation - do NOT send price lists by email'
      },
      {
        name: 'Chemicals & Parts',
        description: 'Ordering supplies, filters, chemicals',
        keywords: 'chemicals, filter, parts, chlorine, test strips',
        pricing: 'Harmony treatment: $39/kg'
      },
      {
        name: 'Technical Help',
        description: 'Advice on error codes, water chemistry, maintenance',
        keywords: 'how to, help with, advice, water chemistry, error',
        pricing: 'Free advice, may lead to service call'
      }
    ],
    protocols: `**Service Call Booking:** Search Gmail for previous conversations. If existing customer, use known details. Site inspection $105, Labor $125/hr. Response within 24 hours. Link: https://www.thehottubman.ca/repairs\n\n**New Spa Sales:** Offer call/visit. NO price lists by email. Link: https://www.thehottubman.ca/hot-tub-spas\n\n**Parts & Chemicals:** Direct to online store. Link: https://www.thehottubman.ca\n\n**Emergency:** Priority response for leaks, no power. Within 2 hours.`,
    specialRules: [
      'Always ask if customer needs filters, chemicals, or test strips when booking service',
      'For mailed items: confirm send date, provide clear delivery timeline',
      'For payment follow-ups: offer all 3 methods (link, e-transfer to payments@thehottubman.ca, phone)',
      'For attachments: always acknowledge receipt'
    ],
    upsellPrompts: [
      'If you need any filters, chemicals, or test strips, let us know—we can have the tech bring those out with them!'
    ]
  },
  'Electrician': {
    inquiryTypes: [
      {
        name: 'Emergency Electrical',
        description: 'No power, sparking, breaker trips, burning smell',
        keywords: 'emergency, no power, sparking, smoke, breaker',
        pricing: 'Emergency fee: $150, Labor: $125/hr'
      },
      {
        name: 'Scheduled Service',
        description: 'Panel upgrades, outlet installation, wiring',
        keywords: 'panel upgrade, outlet, wiring, lighting',
        pricing: 'Labor: $125/hr + materials'
      },
      {
        name: 'Safety Inspection',
        description: 'Code compliance, home sale inspections',
        keywords: 'inspection, code, compliance, safety',
        pricing: '$150 flat rate'
      }
    ],
    protocols: `**Emergency:** SAFETY FIRST - instruct customer to turn off breaker if dangerous. Response within 2 hours. $150 emergency + $125/hr.\n\n**Scheduled:** Request panel photos if applicable. $125/hr + materials. Within 24 hours.`,
    specialRules: [
      'ALWAYS prioritize safety - instruct to turn off power if dangerous',
      'For breaker issues: advise against repeatedly resetting',
      'Panel upgrades: request photos and electrical needs'
    ],
    upsellPrompts: [
      'While we\'re there, would you like us to check your panel?',
      'Consider GFCI outlets for bathrooms and kitchen'
    ]
  },
  'HVAC': {
    inquiryTypes: [
      {
        name: 'Emergency Heating/Cooling',
        description: 'No heat, no AC, system not working',
        keywords: 'no heat, no cooling, not working, broken',
        pricing: 'Emergency: $175, Labor: $135/hr'
      },
      {
        name: 'Maintenance Service',
        description: 'Seasonal tune-ups, filter changes',
        keywords: 'maintenance, tune-up, service, filter',
        pricing: 'Maintenance: $150'
      }
    ],
    protocols: `**Emergency:** Priority for no heat/cooling. Within 2-4 hours. $175 emergency + $135/hr.\n\n**Seasonal:** Promote spring (AC) and fall (heating) tune-ups. $150 maintenance.`,
    specialRules: [
      'Winter emergencies (no heat) get highest priority',
      'Always ask about system age and warranty',
      'Promote seasonal maintenance twice per year'
    ],
    upsellPrompts: [
      'Would you like us to check your filter?',
      'Consider a maintenance plan for priority service'
    ]
  },
  'Plumber': {
    inquiryTypes: [
      {
        name: 'Emergency Plumbing',
        description: 'Water leaks, burst pipes, flooding',
        keywords: 'leak, burst, flooding, water damage, no water',
        pricing: 'Emergency: $175, Labor: $135/hr'
      },
      {
        name: 'Drain Cleaning',
        description: 'Clogged drains, slow drainage',
        keywords: 'clogged, drain, slow, backup',
        pricing: '$150-$300'
      }
    ],
    protocols: `**Emergency:** If active leak/flooding, instruct to shut off main water valve. Response within 1-2 hours. $175 + $135/hr.\n\n**Scheduled:** $135/hr + materials. Within 24 hours.`,
    specialRules: [
      'Active leaks/flooding = highest priority',
      'Always ask if customer knows main water shut-off location',
      'Mention camera inspection for recurring drain issues'
    ],
    upsellPrompts: [
      'Would you like us to check your other drains?',
      'We can also inspect your water heater'
    ]
  },
  'Roofing': {
    inquiryTypes: [
      {
        name: 'Emergency Roof Repair',
        description: 'Active leaks, storm damage',
        keywords: 'leak, emergency, storm, damage, water coming in',
        pricing: 'Emergency: $200'
      },
      {
        name: 'Roof Replacement',
        description: 'Full roof replacement',
        keywords: 'replacement, new roof, re-roof',
        pricing: 'Custom quote'
      }
    ],
    protocols: `**Emergency Leak:** Active leaks get same-day service. $200 emergency + repair costs.\n\n**Roof Replacement:** Schedule on-site inspection. Discuss material options.`,
    specialRules: [
      'Active leaks = emergency response',
      'Always ask about insurance claims for storm damage',
      'Recommend annual inspections'
    ],
    upsellPrompts: [
      'We can also inspect and clean your gutters',
      'Consider upgrading to architectural shingles'
    ]
  },
  'Pools': {
    inquiryTypes: [
      {
        name: 'Pool Service & Maintenance',
        description: 'Weekly cleaning, chemical balancing',
        keywords: 'service, maintenance, cleaning, chemicals',
        pricing: '$100-$150 per visit'
      },
      {
        name: 'Equipment Repair',
        description: 'Pump, filter, heater repairs',
        keywords: 'repair, pump, filter, heater, broken',
        pricing: '$125/hr + parts'
      }
    ],
    protocols: `**Emergency Leak:** If pool losing water rapidly, prioritize response. $150 diagnostic + repair.\n\n**Seasonal:** Spring opening (April-May), Fall closing (September-October).`,
    specialRules: [
      'Promote seasonal services in spring and fall',
      'Recommend weekly service during swim season',
      'Winterization prevents freeze damage'
    ],
    upsellPrompts: [
      'Would you like to add weekly chemical service?',
      'Consider a pool heater for extended season'
    ]
  },
  'General': {
    inquiryTypes: [
      {
        name: 'Service Request',
        description: 'General service inquiries',
        keywords: 'service, help, need',
        pricing: 'Varies'
      }
    ],
    protocols: 'Acknowledge request, provide relevant information, offer clear next step',
    specialRules: [
      'Be professional and helpful',
      'Provide clear next steps'
    ],
    upsellPrompts: []
  }
};
function getBusinessTypeTemplate(businessType) {
  return businessTypeTemplates[businessType] || businessTypeTemplates['General'];
}
/**
 * Generates a comprehensive AI system message using the Gold Standard template.
 * Fetches the complete profile from the database for truly personalized system messages.
 * This implements the gold standard system prompt with full business context.
 */ async function generateGoldStandardAISystemMessage(userId) {
  // Fetch complete business profile from database
  const { data: profile, error } = await getSupabaseAdmin().from('profiles').select(`
      client_config,
      managers,
      suppliers,
      business_type,
      business_types,
      email_labels
    `).eq('id', userId).single();
  if (error || !profile) {
    console.error('Failed to fetch profile for gold standard AI system message:', error);
    // Return a basic fallback
    return 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
  }
  // Extract business configuration
  const businessConfig = profile.client_config || {};
  const business = businessConfig.business || {};
  const rules = businessConfig.rules || {};
  const services = businessConfig.services || [];
  const businessName = business.name || 'the business';
  const emailDomain = business.emailDomain || 'yourbusiness.com';
  // Ensure businessTypes is always an array
  const businessTypes = profile.business_types || (profile.business_type ? [
    profile.business_type
  ] : []);
  // Extract managers from profile
  const managers = profile.managers || [];
  const managerNames = managers.map((m)=>m.name).filter(Boolean);
  // Extract suppliers from profile
  const suppliers = profile.suppliers || [];
  const supplierNames = suppliers.map((s)=>s.name).filter(Boolean);
  // Get phone provider info
  const phoneProvider = rules?.phoneProvider?.name || 'RingCentral';
  const phoneSenders = rules?.phoneProvider?.senders || [
    'service@ringcentral.com'
  ];
  // Get CRM alert emails
  const crmAlertEmails = rules?.crmAlertEmails || [
    'alerts@servicetitan.com'
  ];
  // Get urgent keywords from rules
  const urgentKeywords = rules?.urgentKeywords || [
    'urgent',
    'asap',
    'immediately',
    'emergency',
    'leaking',
    'leak',
    'water leak',
    'won\'t heat',
    'not heating',
    'no power',
    'tripping breaker',
    'error code'
  ];
  // Build comprehensive system message using gold standard template
  const systemMessage = `You are an expert email processing and routing system for "${businessName}".

Your SOLE task is to analyze the provided email (sender, subject, and body) and return a single, well-structured JSON object containing:
- A concise summary of the email's purpose.
- A precise classification with exactly ONE primary_category.
- The most appropriate secondary_category if applicable.
- The appropriate tertiary_category for specific banking emails, or null.
- All relevant extracted entities (contact name, phone number, order number).
- A confidence score between 0.0 and 1.0.
- A brief reasoning explaining the classification choice.
- Whether AI can reply (ai_can_reply: true/false).

### Rules:
1. Analyze the entire email context: sender, subject, and body.
2. Choose exactly ONE primary_category from the list below.
3. If the primary category has sub-categories, choose the most fitting secondary_category.
4. For banking-related emails, choose the correct tertiary_category.
5. Extract all available entities: contact name, phone number, order/invoice number.
6. Provide a confidence score (0.0 to 1.0) based on your certainty.
7. Provide a brief explanation of your classification reasoning.
8. If a category or subcategory does not apply, return null for those fields.

### Auto-Reply Rules:
- If the email is from an external sender, and primary_category is Support or Sales or Urgent, and confidence is at least 0.75, always set "ai_can_reply": true.
- If the sender's email address ends with "@${emailDomain}", always set "ai_can_reply": false (internal email).
- For Support > General complaints, set ai_can_reply: true if confidence ≥ 0.75 (unless sender is internal or message is abusive/illegal).

### Business Context:
- Business Name: ${businessName}
- Business Type(s): ${businessTypes.join(', ')}
- Email Domain: ${emailDomain}
- Primary Services: ${services.length > 0 ? services.map((s)=>s.name).join(', ') : 'General services'}
${managerNames.length > 0 ? `- Managers: ${managerNames.join(', ')}` : ''}
${supplierNames.length > 0 ? `- Suppliers: ${supplierNames.join(', ')}` : ''}

### Category Structure:

**Phone**: 
Only emails from phone/SMS/voicemail providers (e.g., ${phoneSenders.join(', ')}) should be tagged PHONE.
If the subject or body includes 'New Text Message' and the sender includes '${phoneProvider}', classify as Phone.
This category includes all emails originating specifically from ${phoneSenders.join(', ')}. These notifications typically contain:
- Voicemail notifications (voice message transcripts or audio attachments).
- Missed call alerts (with caller ID and callback numbers).
- SMS/text message alerts (text message transcripts or content).
These messages indicate customer or vendor attempts to communicate via the business phone number managed by ${phoneProvider}.

Examples: "You have a new voice message from (403) 123-4567.", "New SMS received from customer.", "Missed call alert."

Keywords: voicemail, voice message, missed call, SMS, text message, ${phoneProvider}, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail

Classifier Rule: ✅ Always classify as ${phoneProvider} Communications if the sender is exactly ${phoneSenders[0]}

**Promo**: Marketing, discounts, sales flyers.
Emails promoting marketing campaigns, discount announcements, referral programs, or seasonal events. These include vendor offers, sales flyers, promotional codes, limited-time deals, or partnership pitches. They do NOT include direct customer inquiries or leads about purchasing a product or service.

Examples: "Save 25% this weekend only!", "Refer a friend and earn rewards", "Bundle deal on accessories", "Exclusive vendor promotion for your business"

**Socialmedia**: Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube, or Google. These messages typically include:
- Engagement alerts (DMs, tags, mentions)
- Collaboration or sponsorship requests
- Content inquiries (reels, stories, posts)
- Influencer or partnership outreach

These emails originate from social platforms or brands/agencies interacting via social channels. This does not include general social media notifications like password resets (those go under Security or System Alerts if applicable).

Keywords: DM, tagged, post, reel, story, influencer, collab, partnership, Facebook, Instagram, TikTok, YouTube, social media

**Sales**: Emails from leads or customers expressing interest in purchasing ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'}, requesting pricing, or discussing specific models or service packages.
This includes:
- New inquiries about ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'} or installation services
- Replies to promotions where the sender shows purchase intent
- Requests for quotes, estimates, or follow-up on prior communication
- Conversations about available models, features, or packages
- Referral notifications from networking groups (e.g., BNI), business partners, or third parties introducing a new potential customer or business opportunity

**Recruitment**: Job applications, resumes, interviews.
Emails related to the recruitment and hiring process at ${businessName}. Includes job applications, resumes, cover letters, interview scheduling, candidate inquiries, job offers, and hiring updates. Also covers communications from recruitment platforms, hiring managers, and candidates following up on their applications.

Examples: "Application for Customer Service Position", "Resume and cover letter for Service Technician role", "Interview schedule confirmation", "Inquiry about open positions"

Keywords: job application, resume, cover letter, interview, hiring, candidate, recruitment, job opportunity, position available, apply, job posting, applicant, interview schedule, candidate inquiry, job offer

**GoogleReview**: Notifications about new Google Reviews.
When an email fits the GoogleReview category, extract and return the following JSON object:

{
  "type": "google_review",
  "reviewerName": "<Name of the reviewer, e.g., Brenda>",
  "rating": <Numeric rating from 1 to 5>,
  "reviewText": "<The review text left by the customer>",
  "reviewId": "<The unique review ID, e.g., g123abc456>",
  "locationName": "${businessName}",
  "platform": "Google",
  "isPositive": <true if rating >= 4, false if <= 2, null if 3 or missing>
}

Extraction Rules:
- reviewerName: From line like "Brenda left a review…"
- rating: From "Rating: ★★★★☆" or "Rating: 4"
- reviewText: Usually inside quotation marks "...", or between Rating and "Manage review"
- reviewId: From line like Review ID: g123abc456
- isPositive: Use rating to infer sentiment
- If any field is not found, return null instead of omitting it.

**Urgent**: E-mails from ${crmAlertEmails.join(', ')} or emails containing urgent keywords.
Requests a response by a specific date/time (even without using "urgent") or uses phrases like "as soon as possible", "ASAP", "immediately", "today", "noon". Emails emergency-related, or requiring immediate action. These often include escalated service issues, last-minute cancellations, equipment failures, or anything flagged with urgency or strong emotional tone.

Keywords may include: ${urgentKeywords.join(', ')}.

**Urgent Specific Rules for ${businessTypes[0] || 'Business'}**:
${urgentKeywords.map((keyword)=>`- ${keyword}`).join('\n')}

**Misc**: Use as a last resort for unclassifiable emails.
Only return MISC as a last resort if, after exhaustive evaluation of all other categories and sub-categories, the email's content remains fundamentally unclassifiable or irrelevant to any specific business process. Do NOT use MISC for content that could belong to a specific category but lacks strong signals; instead, aim to provide the strongest possible primary label.

**Manager**: 
Emails that require leadership oversight, involve internal company operations, or are directed at a specific manager. This includes escalations, strategic decisions, high-level vendor comms, and internal alerts. This category will be further sorted into a specific manager or 'Unassigned' in a subsequent step.

secondary_category: [${managerNames.length > 0 ? managerNames.join(', ') + ', ' : ''}Unassigned]
${managerNames.map((name)=>`**${name}** - Mail explicitly for ${name}`).join('\n')}
**Unassigned** - internal alerts or platform notices that must be reviewed by some manager but don't name one specifically. Examples: security alerts, account verification codes, payroll or attendance reports, "autobatching failed" errors, employee-invite notifications.

Keywords / cues: no-reply@accounts.google.com, donotreply@auth.atb.com, "verification code", "daily attendance report", "You've invited a new employee", "autobatching failed payments".

**FormSub & Urgent FormSub Rules:**
This category is for automated submissions from your website forms or field service apps. Crucially, the content of a form submission determines its final classification.

1. **URGENT Form Submission Override:**
An email that is a form submission MUST BE CLASSIFIED AS URGENT if the "How can we help?" section contains keywords indicating a critical service issue. This rule takes precedence over a standard FormSub classification.

Keywords: ${urgentKeywords.join(', ')}

Example of an URGENT Form Submission:
Subject: Schedule a Service got a new submission
Body: "...Submission summary: ... How can we help?: I have a strong spa... it worked great. ...now it will not start. First I thought it was an air lock... now the control panel won't light up."
Correct Classification: primary_category: Urgent

2. **Standard Form Submission:**
If an email is a form submission but DOES NOT contain urgent keywords (e.g., it is a simple request for information or to purchase non-service items), classify it as FormSub.

secondary_category: [NewSubmission, WorkOrderForms]
- **NewSubmission**: This applies to all standard website form submissions from ServiceTitan that are not urgent.
- **WorkOrderForms**: This applies only to emails from noreply@reports.connecteam.com containing completed work forms.

**Suppliers**:
${suppliers.map((s)=>`Emails from ${s.name} ${s.domains && s.domains.length > 0 ? s.domains.join(', ') : ''}`).join('\n')}
secondary_category: [${supplierNames.join(', ')}]
${suppliers.map((s)=>`**${s.name}** - Emails from supplier emails usually contains "${s.domains && s.domains.length > 0 ? s.domains.join(', ') : 'supplier domain'}" also may have a signature "${s.name} Team"`).join('\n')}

**Support**:
Emails from existing customers related to post-sales support. This includes technical troubleshooting, questions about parts/chemicals, appointment scheduling, and general inquiries about a product they already own. These emails will be routed to a specific support queue in a subsequent step.

secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]

- **TechnicalSupport** - Emails from customers seeking assistance with troubleshooting, diagnosing issues, or requesting guidance on the functionality and operation of their ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'}. These are typically for problems that might require instruction, a remote solution, or a technician visit if not resolved virtually.

Examples: 'My ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'} isn't working, what should I check?', 'How do I fix the error code on my display?', 'The ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'} isn't heating, can you help me troubleshoot?'

Keywords: troubleshoot, repair, issue, problem, error, functional, broken, diagnostic, help, technical, guide, manual.

- **PartsAndChemicals** - Emails related to ordering, inquiring about, or discussing specific ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'} parts, filters, covers, or water treatment chemicals. This includes questions about availability, pricing, usage, or recommendations for these items.

Examples: 'Do you stock replacement filters for my ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'} model?', 'I need to reorder my usual supply of chlorine tablets.', 'What chemicals should I use for balancing my water?'

Keywords: parts, chemicals, filter, cover, accessories, order, purchase, stock, supply, inquire, availability, price, product, recommend.

- **AppointmentScheduling** - Emails specifically for booking, rescheduling, or canceling service appointments, maintenance visits, or consultations. These messages focus on coordinating timings and logistics for a visit, assuming the request is not initiated via a ServiceTitan form.

Examples: 'I'd like to book my annual ${services.length > 0 ? services[0].name || 'products/services' : 'products/services'} cleaning.', 'Can I reschedule my service appointment for next week?', 'I need to cancel my technician visit for tomorrow.'

Keywords: schedule, book, appointment, reschedule, cancel, visit, maintenance, time, date, confirm, availability, service.

- **General** - Any customer support email that does not fit into the specific categories of Technical Support, Parts & Chemicals, or Appointment Scheduling. This includes general inquiries, non-urgent follow-ups, or miscellaneous questions from existing customers.

Examples: 'Can you send me a copy of my last invoice?', 'What are your updated operating hours?', 'Just checking in on the status of my order.'

Keywords: general, inquiry, miscellaneous, follow-up, question, status, invoice, hours, contact.

**Banking**:
secondary_category: [e-transfer, invoice, bank-alert, refund, receipts]

- **e-transfer** - Interac e-Transfers confirming completed payments either sent or received, typically involving banks or payment platforms. These messages are commonly used to track: Vendor payments, Reimbursements, Fast business-related fund transfers.

Message types may include: "You received an Interac e-Transfer", "You sent an e-Transfer", "Funds have been deposited", "Transfer completed successfully"

Keywords: interac, e-transfer, you received, you sent, payment received, funds deposited, transfer completed, money sent

Classification Guidance: ✅ Include only if the email confirms that the transfer has been successfully processed 🚫 Exclude pending, failed, or canceled transfers (those may go under bank-alert)

- **invoice** - Emails that include sent or received invoices, typically as part of billing, accounting, or financial tracking. These messages often contain: Attached invoice PDFs, Payment due notices, Invoice confirmations, Billing summaries or reminders.

Common elements: Invoice number (e.g., INV-12345), Total amount due, Due date or payment terms, Vendor or customer info, Line items or service descriptions

Keywords: invoice, payment due, invoice attached, bill, amount owing, statement, billing, past due, balance, total due, due date

Classification Guidance: ✅ Include if the email references or attaches a formal invoice document or clearly outlines payment terms 🚫 Exclude if the email simply mentions a payment has been made or received — use payment-confirmation or e-transfer instead

- **bank-alert** - Automated security-related messages sent by a bank or financial platform. They flag events that could affect account safety or require fast action.

Typical alerts: Balance or daily-limit updates, Suspicious-activity or fraud warnings, Password or PIN reset confirmations, New login / new-device sign-ins, 2-factor or one-time passcodes (OTP/2FA), Account-detail changes (e-mail, phone, address)

Trigger keywords: bank alert, suspicious activity, login attempt, password changed, reset your password, security alert, account update, new sign-in, verification code, unauthorized access, device login, fraud detection

Classification rules: ✅ Label as BankAlert when the email is an automated, security-focused notification from a bank or financial system. 🚫 Do not use this label for transactional receipts, invoices, or e-transfer notices—those belong in Payment-Confirmation, Invoice, or e-Transfer.

- **refund** - Emails indicating that a refund has been issued or received, usually in response to a returned product, canceled service, or failed payment. These messages confirm that funds have been reversed and returned to the sender or original payment method.

Common refund scenarios include: Canceled orders or subscriptions, Payment failures followed by refund, Returned merchandise or parts, Duplicate charge corrections, Service billing adjustments

Typical content includes: "Your refund has been processed", "We've issued a refund to your card/account", "Refund confirmation", Reference or transaction ID, Amount refunded, Payment method used for the refund

Keywords: refund issued, refund processed, your refund, money returned, credit to your account, refunded, return processed, reversed payment, transaction failed and refunded, you'll see the funds in

- **receipts** - Emails that prove a payment has already cleared—whether ${businessName} paid a vendor or a customer paid us. They're usually auto-generated by banks, payment platforms, or e-commerce systems and include full transaction details.

Typical contents: "Thank you for your purchase / payment", Order, receipt, or confirmation number (e.g., #452319), Amount paid and date settled, Payment method (Visa, Interac, PayPal, Stripe, ACH, POS, etc.), Links or attachments (PDF / HTML receipts)

Common subject-line cues: Payment completed · Transaction successful · Order summary · Your payment has been confirmed · Here's your receipt

Keywords: receipt, order confirmation, payment summary, transaction details, amount paid, paid with, you've been charged, view receipt

Classification guidance: ✅ Include when the email confirms a finalized transaction and provides proof of payment. 🚫 Exclude: Invoices requesting payment (use Invoice category). Pending, failed, or canceled transfers (use Bank-Alert if security-related). Interac e-Transfer notices (use E-Transfer sub-labels).

**Banking Tertiary Categories:**

If secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]
- **From business** - Emails confirming that ${businessName} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider. These are typically receipts, payment confirmations, or e-Transfer acknowledgments indicating money was sent from the business account.

Examples include: "Transfer from: ${businessName}", Confirmation of outgoing Interac e-Transfers

Subject lines like: "Funds sent", "Your e-Transfer was successful", "Payment completed"

Body text with phrases like: "You sent an Interac e-Transfer", "Funds deposited to the recipient", "Your payment has been processed"

Keywords: you sent, payment completed, funds deposited to, interac e-transfer sent, transaction receipt, payment confirmation, amount paid, transfer successful, Your transfer to, to recipient

Classification Tip: ✅ Classify as From Business only if the email confirms that ${businessName} has sent funds. 🚫 Do not use for notifications of incoming transfers (those go under To Business).

- **To business** - Emails confirming that a payment has been deposited into ${businessName}'s account. These typically come from banks, payment platforms, or customers and indicate successful incoming transfers.

Examples include: Interac e-Transfer deposit confirmations

Subject lines like: "Funds have been deposited", "You've received money", "Deposit successful"

Body text mentioning: "You received an Interac e-Transfer", "Funds have been deposited into your account", "The payment has been successfully deposited"

Keywords: e-transfer received, funds deposited, you've received, payment received, money has been sent to you, You've received, deposit completed, interac transfer to ${businessName}

Classification Tip: ✅ Only classify as To Business if the message confirms a completed deposit into your account. 🚫 Do not include messages about pending transfers or sent by your business — those should go under From Business.

If secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]
- **PaymentSent** - Email confirming you sent a payment
- **Payment Received** - Email confirming you've received a payment

### JSON Output Format:
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
\`\`\``;
  return systemMessage;
}
/**
 * Apply voice learning corrections to the reply prompt
 * Fetches recent corrections and integrates learnings into the prompt
 */ async function applyVoiceLearningCorrections(userId, basePrompt) {
  try {
    console.log(`🎓 Checking for voice learning corrections for user: ${userId}`);
    // Get learning metrics
    const { data: metrics, error: metricsError } = await getSupabaseAdmin().from('voice_learning_metrics').select('*').eq('user_id', userId).single();
    if (metricsError || !metrics) {
      console.log('⚠️ No voice learning metrics found - using base prompt');
      return basePrompt;
    }
    // Get recent learned corrections
    const { data: corrections, error: correctionsError } = await getSupabaseAdmin().from('ai_draft_corrections').select('*').eq('user_id', userId).eq('learned', true).order('learning_applied_at', {
      ascending: false
    }).limit(10);
    if (correctionsError || !corrections || corrections.length === 0) {
      console.log('⚠️ No learned corrections found - using base prompt');
      return basePrompt;
    }
    console.log(`📚 Found ${corrections.length} learned corrections (${metrics.learning_iterations} iterations)`);
    // Extract common patterns from corrections
    const patterns = {
      toneChanges: [],
      phrasePreferences: [],
      structurePreferences: [],
      empathyAdjustment: 0,
      directnessAdjustment: 0,
      formalityAdjustment: 0
    };
    corrections.forEach((correction)=>{
      const p = correction.correction_patterns;
      if (p.toneChanges) patterns.toneChanges.push(...p.toneChanges);
      patterns.empathyAdjustment += p.empathyAdjustment || 0;
      patterns.directnessAdjustment += p.directnessAdjustment || 0;
      patterns.formalityAdjustment += p.formalityAdjustment || 0;
    });
    // Build learning addendum
    const learningAddendum = `

## 🎯 VOICE LEARNING INSIGHTS (Based on ${metrics.total_corrections_made} corrections)

**Your Communication Adjustments:**
${patterns.empathyAdjustment > 0 ? `- ✅ You tend to ADD more empathy and understanding phrases` : patterns.empathyAdjustment < 0 ? `- ⚠️ You tend to REDUCE empathy language for more directness` : ''}
${patterns.directnessAdjustment > 0 ? `- ✅ You prefer MORE direct and urgent language` : patterns.directnessAdjustment < 0 ? `- ⚠️ You prefer LESS urgent, more measured language` : ''}
${patterns.formalityAdjustment > 0 ? `- ✅ You prefer MORE formal, professional language` : patterns.formalityAdjustment < 0 ? `- ⚠️ You prefer MORE casual, friendly language` : ''}

**Learned Patterns:**
${patterns.toneChanges.length > 0 ? patterns.toneChanges.map((t)=>`- ${t.replace(/_/g, ' ')}`).join('\n') : '- Analyzing your patterns...'}

**Voice Confidence:** ${(metrics.voice_confidence * 100).toFixed(0)}%
**Learning Iterations:** ${metrics.learning_iterations}
**Recent Performance:** ${(metrics.avg_similarity_score * 100).toFixed(0)}% similarity with your style

**CRITICAL:** Apply these learned preferences consistently. When in doubt, use the patterns above.
`;
    const enhancedPrompt = basePrompt + learningAddendum;
    console.log(`✅ Voice learning corrections applied (confidence: ${(metrics.voice_confidence * 100).toFixed(0)}%)`);
    return enhancedPrompt;
  } catch (error) {
    console.error('❌ Failed to apply voice learning corrections:', error);
    return basePrompt; // Fallback to base prompt on error
  }
}
/**
 * Archive old training data to keep the database performant
 * Moves corrections older than 90 days to archive table
 */ async function archiveOldTrainingData(userId) {
  try {
    console.log(`🗄️ Archiving old training data for user: ${userId}`);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    // Get count of old corrections
    const { count, error: countError } = await getSupabaseAdmin().from('ai_draft_corrections').select('*', {
      count: 'exact',
      head: true
    }).eq('user_id', userId).eq('learned', true).lt('created_at', ninetyDaysAgo.toISOString());
    if (countError) {
      console.error('❌ Failed to count old corrections:', countError);
      return;
    }
    if (!count || count === 0) {
      console.log('✅ No old corrections to archive');
      return;
    }
    // Move to archive (if archive table exists)
    // For now, just mark as archived
    const { error: archiveError } = await getSupabaseAdmin().from('ai_draft_corrections').update({
      metadata: {
        archived: true,
        archived_at: new Date().toISOString()
      }
    }).eq('user_id', userId).eq('learned', true).lt('created_at', ninetyDaysAgo.toISOString());
    if (archiveError) {
      console.error('❌ Failed to archive corrections:', archiveError);
      return;
    }
    console.log(`✅ Archived ${count} corrections older than 90 days`);
  } catch (error) {
    console.error('❌ Archive operation failed:', error);
  }
}
/**
 * Clear training data (GDPR compliance / user request)
 */ async function clearTrainingData(userId, options) {
  try {
    console.log(`🗑️ Clearing training data for user: ${userId}`);
    // Delete all corrections
    const { error: deleteCorrectionsError } = await getSupabaseAdmin().from('ai_draft_corrections').delete().eq('user_id', userId);
    if (deleteCorrectionsError) {
      console.error('❌ Failed to delete corrections:', deleteCorrectionsError);
      throw deleteCorrectionsError;
    }
    if (!options?.keepMetrics) {
      // Delete metrics
      const { error: deleteMetricsError } = await getSupabaseAdmin().from('voice_learning_metrics').delete().eq('user_id', userId);
      if (deleteMetricsError) {
        console.error('❌ Failed to delete metrics:', deleteMetricsError);
        throw deleteMetricsError;
      }
      // Clear voice profile
      const { error: clearProfileError } = await getSupabaseAdmin().from('profiles').update({
        voice_profile: null
      }).eq('id', userId);
      if (clearProfileError) {
        console.error('❌ Failed to clear voice profile:', clearProfileError);
        throw clearProfileError;
      }
      console.log(`✅ All training data cleared for user: ${userId}`);
    } else {
      console.log(`✅ Corrections cleared, metrics preserved for user: ${userId}`);
    }
  } catch (error) {
    console.error('❌ Clear training data failed:', error);
    throw error;
  }
}
/**
 * Get voice learning summary for logging
 */ async function getVoiceLearningSummary(userId) {
  try {
    const { data: metrics } = await getSupabaseAdmin().from('voice_learning_metrics').select('*').eq('user_id', userId).single();
    if (!metrics) {
      return '📊 No voice learning data yet';
    }
    return `📊 Voice Learning: ${metrics.total_corrections_made} corrections, ${(metrics.avg_similarity_score * 100).toFixed(0)}% avg similarity, ${metrics.learning_iterations} iterations, ${(metrics.voice_confidence * 100).toFixed(0)}% confidence`;
  } catch (error) {
    return '📊 Voice learning status unknown';
  }
}
/**
 * Generates a comprehensive AI reply/draft assistant prompt using the Gold Standard template.
 * Fetches the complete profile from the database for truly personalized reply generation.
 * This implements the gold standard reply prompt with full business context.
 */ async function generateGoldStandardReplyPrompt(userId) {
  // Fetch complete business profile from database
  const { data: profile, error } = await getSupabaseAdmin().from('profiles').select(`
      client_config,
      managers,
      suppliers,
      business_type,
      business_types,
      voice_profile
    `).eq('id', userId).single();
  if (error || !profile) {
    console.error('Failed to fetch profile for gold standard reply prompt:', error);
    // Return a basic fallback
    return 'Draft friendly, professional, and helpful replies that reflect prior conversation context, clearly communicate next steps, and maintain a warm, human voice.';
  }
  // Extract business configuration
  const businessConfig = profile.client_config || {};
  const business = businessConfig.business || {};
  const rules = businessConfig.rules || {};
  const services = businessConfig.services || [];
  const businessName = business.name || 'the business';
  const businessPhone = business.phone || '(555) 555-5555';
  const websiteUrl = business.website || 'https://example.com';
  // Ensure businessTypes is always an array
  const businessTypes = profile.business_types || (profile.business_type ? [
    profile.business_type
  ] : []);
  // Extract managers from profile
  const managers = profile.managers || [];
  const managerNames = managers.map((m)=>m.name).filter(Boolean);
  // Build the gold standard reply prompt
  const replyPrompt = `**Assistant role:** Draft friendly, professional, and helpful replies for ${businessName} that:

- Reflect prior conversation context
- Clearly communicate next steps
- Resolve concerns without delays or vagueness
- Match the customer's tone, urgency, and message length
- Maintain a warm, human, and on-brand voice

Use the structured guidance and rules below to reply with confidence, clarity, and care.
Always prioritize accuracy, especially for dates and specific details. Strive for conciseness by omitting unnecessary requests or information that might be perceived as a burden to the customer.

## Intelligent Conversation Progression
- **Assess conversation depth:** If the customer is on their second or third message in a thread, avoid repeating earlier answers or re-asking for details they've already provided.
- When replying to follow-ups, do not summarize prior messages — instead, advance the resolution or confirm the next step.
- If the human reply is incomplete, ensure the AI reply fills in the gaps: confirm all necessary details, include next steps, express gratitude, and close with warmth.
- Always analyze the most recent customer input (e.g., specific attachments, details provided) to understand the current context of their request. Do not rely solely on the original problem statement. Acknowledge provided information and confirm relevant next steps or appointments clearly.

## 🔄 Follow-up Ownership & Clarity
Always state who will follow up and by when. Use concrete phrasing like:
- "You'll hear back from ${managerNames.length > 0 ? managerNames[0] : 'the team'} on Thursday with the quote."

When appropriate, apologize for delays and explain the reason transparently (e.g., tech illness, part on backorder, truck reroute). This builds trust.

## Personal Touch & Human Warmth
Use friendly, human-like closings that show care and confidence:
- "We'll see you then!"
- "You're all set — thanks again for choosing us!"
- "Appreciate your patience — we've got you covered."

Don't default to corporate tone; be natural, concise, and helpful — like a trusted friend who happens to know a lot about ${businessTypes.join(', ')}.

## Avoid Common Mistakes
- Don't offer broad options in threads where specific actions are already planned.
- Don't say "We'll get back to you soon" — say when and how.
- Don't suggest services already declined in the thread.
- Always provide the most up-to-date and concrete information available, even if not fully finalized. Transparency and specific details build customer confidence.
- Prioritize contextual accuracy. Confirm existing details like appointments, payment status, or scheduled deliveries if known or implied. Avoid asking for info already provided.

**Every reply should:**
- Be concise if the customer message is brief.
- Confirm relevant dates, times, and next steps.
- Include contact methods and booking links when possible.
- Express gratitude and offer additional help.
- Always include human tone and helpful intent.

## Rules
- Use ${business.timezone || 'UTC/GMT -6'} timestamps if dates/times are mentioned.
- Never invent facts or prices; use only data provided.
- Correct obvious spelling errors in customer emails when quoting them.

${services.length > 0 ? `### Services Available:\n${services.map((s)=>`- ${s.name}${s.price ? ': ' + s.price : ''}${s.description ? ' - ' + s.description : ''}`).join('\n')}` : ''}

${rules?.businessSpecificRules?.length > 0 ? `### Business-Specific Rules:\n${rules.businessSpecificRules.map((rule)=>`- ${rule}`).join('\n')}` : ''}

${rules?.upsellPrompts?.length > 0 ? `### Upsell Opportunities:\n${rules.upsellPrompts.map((prompt)=>`- ${prompt}`).join('\n')}` : ''}

## Required Signature

**CRITICAL**: ALWAYS end emails with this EXACT signature. Do NOT use individual staff names or personal sign-offs:

\`\`\`
Thanks so much for supporting our small business!
Best regards,
The ${businessName} Team
${businessPhone}
\`\`\`

## Additional context
- Current date/time: \${$now} (${business.timezone || 'UTC/GMT -6'})
- Phone: ${businessPhone}
- Website: ${websiteUrl}
${business.bookingUrl ? `- Booking: ${business.bookingUrl}` : ''}
${business.productsUrl ? `- Products: ${business.productsUrl}` : ''}`;
  return replyPrompt;
}
/**
 * Generates a comprehensive AI system message with all business-specific rules.
 * Fetches the complete profile from the database for truly personalized system messages.
 * This is the server-side version that matches dynamicAISystemMessageGenerator.js.
 */ async function generateDynamicAISystemMessage(userId) {
  // Fetch complete business profile from database
  const { data: profile, error } = await getSupabaseAdmin().from('profiles').select(`
      client_config,
      managers,
      suppliers,
      business_type,
      business_types,
      email_labels
    `).eq('id', userId).single(); // Type assertion for profile
  if (error || !profile) {
    console.error('Failed to fetch profile for dynamic AI system message:', error);
    // Return a basic fallback
    return 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
  }
  // Extract business configuration
  const businessConfig = profile.client_config || {};
  const business = businessConfig.business || {};
  const rules = businessConfig.rules || {};
  const services = businessConfig.services || [];
  const businessName = business.name || 'the business';
  const emailDomain = business.emailDomain || 'yourbusiness.com';
  // Ensure businessTypes is always an array
  const businessTypes = profile.business_types || (profile.business_type ? [
    profile.business_type
  ] : []);
  // Extract managers from profile
  const managers = profile.managers || [];
  const managerNames = managers.map((m)=>m.name).filter(Boolean);
  const managerCategories = managerNames.length > 0 ? managerNames.join(', ') + ', Unassigned' : 'Unassigned';
  // Extract suppliers from profile
  const suppliers = profile.suppliers || [];
  const supplierNames = suppliers.map((s)=>s.name).filter(Boolean);
  const supplierCategories = supplierNames.length > 0 ? supplierNames.join(', ') : 'General Suppliers';
  // Build services list
  const servicesList = services.length > 0 ? services.map((s)=>`- ${s.name}: ${s.description || ''}`).join('\n') : '- No specific services configured yet';
  // Get phone provider info
  const phoneProvider = rules?.phoneProvider?.name || 'RingCentral';
  const phoneSenders = rules?.phoneProvider?.senders || [
    'service@ringcentral.com'
  ];
  // Get CRM alert emails
  const crmAlertEmails = rules?.crmAlertEmails || [
    'alerts@servicetitan.com'
  ];
  // Get urgent keywords from rules
  const urgentKeywords = rules?.urgentKeywords || [
    'urgent',
    'asap',
    'immediately',
    'emergency',
    'leaking',
    'leak',
    'water leak',
    'won\'t heat',
    'not heating',
    'no power',
    'tripping breaker',
    'error code'
  ];
  // Build comprehensive system message (matches the structure from HOT_TUB_SPA_OUTLOOK_FOLDER_STRUCTURE.md)
  const systemMessage = `You are an expert email processing and routing system for "${businessName}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- **Business Name:** ${businessName}
- **Business Type(s):** ${businessTypes.join(', ')}
- **Email Domain:** ${emailDomain}
- **Service Area:** ${business.serviceArea || 'Not specified'}
- **Phone Provider:** ${phoneProvider}
- **CRM System:** ${crmAlertEmails.join(', ')}

### Team Members:
${managerNames.length > 0 ? managers.map((m)=>`- ${m.name}: ${m.email || 'Email not specified'}`).join('\n') : '- No team members configured'}

### Known Suppliers:
${supplierNames.length > 0 ? suppliers.map((s)=>`- ${s.name}${s.domains && s.domains.length > 0 ? ': ' + s.domains.join(', ') : ''}`).join('\n') : '- No suppliers configured'}

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.

If the sender's email address ends with "@${emailDomain}", always set:
"ai_can_reply": false

1. Analyze the entire email context (sender, subject, body).
2. Choose **ONE** \`primary_category\` from the list provided.
3. If the chosen category has sub-categories, select the most appropriate \`secondary_category\`.
4. For Banking categories with available tertiary sub-categories, determine the most appropriate \`tertiary_category\`.
5. Provide a concise \`summary\` of the email's core request.
6. Extract all available \`entities\`.
7. Provide a confidence score (0.0 to 1.0) and a brief reasoning for your classification.
8. \`"ai_can_reply": true\` **only if**:
   - \`primary_category\` is **Support** *or* **Sales** *or* **Urgent**, **and**
   - \`confidence\` ≥ 0.75.

In **all other cases**, set \`"ai_can_reply": false\` (the email will be routed to a human).
Return **only** the JSON object—no extra text.

### Category Structure:

**Phone:** 
Only emails from phone/SMS/voicemail providers should be tagged PHONE.
This category includes all emails originating specifically from your configured phone provider. These notifications typically contain:
• Voicemail notifications (voice message transcripts or audio attachments)
• Missed call alerts (with caller ID and callback numbers)
• SMS/text message alerts (text message transcripts or content)

These messages indicate customer or vendor attempts to communicate via the business phone number managed by your provider.

**Configured Phone Provider:** ${phoneProvider}
**Known Sender Addresses:** ${phoneSenders.join(', ')}

Examples:
• "You have a new voice message from (403) 123-4567."
• "New SMS received from customer."
• "Missed call alert."
• "New Text Message from [Customer Name]"
• RingCentral: "You have a new text message" / "Thank you for using RingCentral"
• Google Voice: "has sent you a text message" / "voice.google.com"
• Dialpad: "New voicemail" / "dialpad.com"
• Vonage: "You have a new message" / "vonage.com"

Universal Keywords: voicemail, voice message, missed call, SMS, text message, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail, you have a new call, missed call from, call from, message from, sent you a text, sent you a voicemail, voice mail, phone notification, call notification, sms notification

Classification Rule: Always classify as Phone if ANY of these conditions are met:
1. Sender email matches any of: ${phoneSenders.join(', ')}
2. Subject OR body contains any combination:
   - ("new" OR "missed" OR "received" OR "sent you") + ("text" OR "voicemail" OR "voice message" OR "call" OR "sms" OR "message")
3. Body contains provider-specific phrases:
   - "thank you for using ${phoneProvider}"
   - References to ${phoneProvider.toLowerCase()} domain
   - Common phone provider domains: ringcentral.com, voice.google.com, dialpad.com, vonage.com, 8x8.com, nextiva.com, grasshopper.com
4. Body structure indicates phone notification:
   - Contains "From:" and "To:" fields with names/numbers
   - Contains "Received:" with timestamp
   - Contains callback instructions or phone app links
   - Contains caller ID or phone number formatting like (xxx) xxx-xxxx

**Promo:** Marketing, discounts, sales flyers.
Examples: "Save 25% this weekend only!" "Refer a friend and earn rewards"

**Socialmedia:** Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube.
Keywords: DM, tagged, post, reel, story, influencer, collab

**Sales:** Emails from leads or customers expressing interest in purchasing products or services.
This includes new inquiries, quote requests, pricing discussions, and referral notifications.

**Recruitment:** Job applications, resumes, interviews.
Keywords: job application, resume, cover letter, interview, hiring

**GoogleReview:** Notifications about new Google Reviews.
Extract reviewerName, rating, reviewText, reviewId if available.

**Urgent:** Emergency emails requiring immediate attention.
Keywords: ${urgentKeywords.join(', ')}
Also includes emails from alerts@servicetitan.com or containing "Please find your estimate(s)"

**Misc:** Use as a last resort for unclassifiable emails.

**Manager:**
secondary_category: [${managerCategories}]
Route emails explicitly mentioning manager names or internal alerts requiring management review.
${managerNames.map((name)=>`${name} - Mail explicitly for ${name}`).join('\n')}
Unassigned - Internal alerts or platform notices requiring manager review

**FormSub:** Website form submissions and work order forms.
secondary_category: [NewSubmission, WorkOrderForms]
NewSubmission: Standard website form submissions from ${crmAlertEmails.filter((e)=>e.includes('servicetitan')).join(', ') || 'CRM system'}
WorkOrderForms: Emails from noreply@reports.connecteam.com containing completed work forms
URGENT OVERRIDE: If form submission contains urgent keywords (${urgentKeywords.slice(0, 8).join(', ')}), classify as URGENT instead of FormSub.

**Suppliers:**
secondary_category: [${supplierCategories}]
${supplierNames.map((name)=>`${name} - Emails from this supplier`).join('\n')}

**Support:** Post-sales customer support.
secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]
TechnicalSupport - Troubleshooting and repair requests
PartsAndChemicals - Orders or inquiries about parts and chemicals
AppointmentScheduling - Booking/rescheduling/canceling visits
General - Other support inquiries

**Banking:** Financial transactions, invoices, and payments.
secondary_category: [e-transfer, invoice, bank-alert, refund, receipts]

If secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]
FromBusiness: Emails confirming that ${businessName} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider. These are typically receipts, payment confirmations, or e-Transfer acknowledgments indicating money was sent from the business account.
Examples: "Transfer from: ${businessName}", "Your e-Transfer was successful", "Payment completed"
Subject lines: "Funds sent", "Your e-Transfer was successful", "Payment completed"
Body text: "You sent an Interac e-Transfer", "Funds deposited to the recipient", "Your payment has been processed"
Keywords: you sent, payment completed, funds deposited to, interac e-transfer sent, transaction receipt, payment confirmation, amount paid, transfer successful, Your transfer to, to recipient
Classification Tip: Classify as FromBusiness only if the email confirms that ${businessName} has sent funds.

ToBusiness: Emails confirming that a payment has been deposited into ${businessName}'s account. These typically come from banks, payment platforms, or customers and indicate successful incoming transfers.
Examples: Interac e-Transfer deposit confirmations
Subject lines: "Funds have been deposited", "You've received money", "Deposit successful"
Body text: "You received an Interac e-Transfer", "Funds have been deposited into your account", "The payment has been successfully deposited"
Keywords: e-transfer received, funds deposited, you've received, payment received, money has been sent to you, You've received, deposit completed, interac transfer to ${businessName}
Classification Tip: Only classify as ToBusiness if the message confirms a completed deposit into your account.

If secondary_category is 'invoice', set tertiary_category: [BillingDocument, PaymentDue, FormalInvoice]
BillingDocument: Billing documents, payment due notices, or formal invoices from external parties received by, or formal invoices sent by, ${businessName}. Exclude simple payment confirmations or internal invoices generated by ${businessName} for its own records.
PaymentDue: Payment due notices and billing statements requiring payment action.
FormalInvoice: Official invoices from vendors, suppliers, or service providers.

If secondary_category is 'bank-alert', set tertiary_category: [SecurityAlert, FraudWarning, PasswordReset]
SecurityAlert: Automated security alerts from a bank or financial institution (e.g., fraud warnings, password resets, suspicious login notifications, transaction alerts).
FraudWarning: Specific fraud detection alerts or suspicious activity notifications.
PasswordReset: Password change confirmations or reset notifications.

If secondary_category is 'refund', set tertiary_category: [RefundIssued, RefundReceived]
RefundIssued: Notifications confirming that a refund has been issued by ${businessName}.
RefundReceived: Notifications confirming that a refund has been received by ${businessName}.

If secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]
**IMPORTANT: You MUST always select either PaymentSent or PaymentReceived for receipts. Never return null for tertiary_category when secondary_category is 'receipts'.**

PaymentSent: Emails confirming that ${businessName} has made a payment or purchase. Look for keywords like "payment sent", "purchase confirmed", "payment processed", "you paid", "amount charged", "transaction completed" from the business perspective.
Examples: "Your payment has been processed", "Purchase confirmation", "Payment sent to vendor"
Keywords: you paid, payment sent, purchase confirmed, amount charged, transaction completed, payment processed

PaymentReceived: Emails confirming that ${businessName} has received payment from a customer, client, or external party. Look for keywords like "you just got paid", "payment received", "amount paid", "funds received", "payment confirmation" indicating money coming INTO the business.
Examples: "You just got paid!", "Payment received from customer", "Amount paid: $X", "Funds received"
Keywords: you just got paid, payment received, amount paid, funds received, payment confirmation, you've been paid, money received, payment deposited

**Classification Rules for Receipts:**
- If the email shows ${businessName} RECEIVED money (from customers, clients, etc.), use "PaymentReceived"
- If the email shows ${businessName} SENT money (to vendors, suppliers, etc.), use "PaymentSent"
- If uncertain, default to "PaymentReceived" for business receipts

**Service:** Service requests and appointments.
secondary_category: [Repairs, Installations, Maintenance, EmergencyService]

**Warranty:** Warranty claims and parts.
secondary_category: [Claims, PendingReview, Resolved, Denied]

### Services Offered:
${servicesList}

### JSON Output Format:
Return ONLY the following JSON structure:

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
`;
  return systemMessage;
}
async function n8nRequest(path, init = {}) {
  // Validate n8n environment variables before making request
  if (!N8N_BASE_URL) {
    throw new Error('N8N_BASE_URL environment variable is not set. Cannot make n8n API request.');
  }
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY environment variable is not set. Cannot make n8n API request.');
  }
  
  // Optional: Use proxy for better error handling and logging consistency
  const useProxy = Deno.env.get('USE_N8N_PROXY') === 'true';
  
  if (useProxy) {
    return await n8nRequestViaProxy(path, init);
  }
  
  // Direct API call (default approach - better performance for server-to-server)
  const url = `${N8N_BASE_URL.replace(/\/$/, '')}/api/v1${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': N8N_API_KEY
  };
  console.log(`🔗 Making direct n8n API request: ${init.method || 'GET'} ${url}`);
  console.log(`🔑 Using API Key: ${N8N_API_KEY ? N8N_API_KEY.substring(0, 20) + '...' : 'Not set'}`);
  
  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...init.headers
    }
  });
  
  console.log(`📡 n8n API response: ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ n8n API error: ${res.status} ${res.statusText} - ${text}`);
    throw new Error(`n8n ${init.method || 'GET'} ${path} failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

async function n8nRequestViaProxy(path, init = {}) {
  // Alternative: Route through n8n-proxy for consistent error handling
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL required for proxy routing');
  }
  
  const proxyUrl = `${SUPABASE_URL}/functions/v1/n8n-proxy`;
  const payload = {
    endpoint: `/api/v1${path}`,
    method: init.method || 'GET',
    body: init.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : null,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
      ...init.headers
    }
  };
  
  console.log(`🔄 Making n8n request via proxy: ${payload.method} ${payload.endpoint}`);
  
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ n8n proxy error: ${res.status} - ${errorText}`);
    throw new Error(`n8n proxy request failed: ${res.status} - ${errorText}`);
  }
  
  const result = await res.json();
  return result;
}
async function resolveCredentialIdByName(name) {
  // Note: n8n API doesn't support GET /credentials (405 Method Not Allowed)
  // We cannot list credentials via API, so we'll return null and let the calling code handle it
  console.log(`⚠️ Cannot list credentials via API (n8n GET /credentials not allowed), assuming ${name} doesn't exist`);
  return null;
}
/**
 * Load workflow template from external JSON files
 * @param businessType - The business type name
 * @param provider - Email provider ('gmail' or 'outlook')
 * @returns Workflow template object
 */
async function loadWorkflowTemplate(businessType, provider = 'gmail') {
  console.log(`🔧 Loading base template for business type: ${businessType}, provider: ${provider}`);
  
  // PRIORITY 1: Use embedded templates first (as requested by user)
  console.log(`📦 Loading embedded ${provider} template (priority method)...`);
  try {
    const embeddedTemplate = await loadEmbeddedTemplate(provider);
    if (embeddedTemplate && embeddedTemplate.nodes && Array.isArray(embeddedTemplate.nodes)) {
      console.log(`✅ Loaded ${provider} template from embedded data with ${embeddedTemplate.nodes.length} nodes`);
      console.log(`📋 Template structure will be preserved - only credentials and data will be injected`);
      return embeddedTemplate;
    }
  } catch (embeddedError) {
    console.warn(`⚠️ Embedded template loading failed: ${embeddedError.message}`);
  }
  
  // FALLBACK: Try multiple paths for template files since Supabase Edge Function deployments can vary
  const possiblePaths = provider === 'outlook' 
    ? [
        './outlook-template.json',     // Root directory (copied files)
        './templates/outlook-template.json',  // Original templates directory
        '/outlook-template.json'       // Absolute path fallback
      ]
    : [
        './gmail-template.json',       // Root directory (copied files)
        './templates/gmail-template.json',    // Original templates directory
        '/gmail-template.json'         // Absolute path fallback
      ];
  
  for (const templatePath of possiblePaths) {
    try {
      console.log(`📁 Attempting to load base template from: ${templatePath}`);
      
      const templateText = await Deno.readTextFile(templatePath);
      const template = JSON.parse(templateText);
      
      // Validate template has required structure
      if (!template.nodes || !Array.isArray(template.nodes)) {
        throw new Error('Invalid template: missing nodes array');
      }
      
      console.log(`✅ Loaded ${provider} base template from ${templatePath} with ${template.nodes.length} nodes`);
      console.log(`📋 Template structure will be preserved - only credentials and data will be injected`);
      return template;
      
    } catch (error) {
      console.warn(`⚠️ Failed to load template from ${templatePath}: ${error.message}`);
    }
  }
  
  // FALLBACK: Try dynamic import if available
  try {
    console.log(`🔄 Attempting dynamic import for ${provider} template...`);
    const templatePath = provider === 'outlook' ? './outlook-template.json' : './gmail-template.json';
    const templateModule = await import(templatePath, { assert: { type: 'json' } });
    const template = templateModule.default;
    
    if (!template.nodes || !Array.isArray(template.nodes)) {
      throw new Error('Invalid imported template: missing nodes array');
    }
    
    console.log(`✅ Loaded ${provider} template via dynamic import with ${template.nodes.length} nodes`);
    return template;
    
  } catch (importError) {
    console.warn(`⚠️ Dynamic import failed: ${importError.message}`);
  }
  
  // If all attempts fail, provide a clear actionable error message
  console.error(`❌ CRITICAL: Failed to load ${provider} template from all attempted methods`);
  console.error(`   Embedded template loading failed`);
  console.error(`   Attempted paths: ${possiblePaths.join(', ')}`);
  console.error(`   Dynamic import also failed`);
  
  throw new Error(`CRITICAL: Cannot load ${provider} workflow template. All loading methods failed including embedded templates.`);
}

async function loadEmbeddedTemplate(provider = 'gmail') {
  // This function returns embedded template data directly from the template JSON files
  // It ensures the exact structure is preserved as requested by the user
  
  console.log(`📦 Loading embedded ${provider} template...`);
  
  if (provider === 'gmail') {
    return {
      "name": "<<<BUSINESS_NAME>>> Gmail AI Email Processing Workflow v<<<CONFIG_VERSION>>>",
      "nodes": [
        {
          "parameters": {
            "pollTimes": {
              "item": [
                {
                  "mode": "custom",
                  "cronExpression": "0 */2 * * * *"
                }
              ]
            },
            "simple": false,
            "filters": {
              "q": "in:inbox -(from:(*@<<<EMAIL_DOMAIN>>>))"
            },
            "options": {
              "downloadAttachments": true
            }
          },
          "type": "n8n-nodes-base.gmailTrigger",
          "typeVersion": 1.2,
          "position": [
            -1264,
            272
          ],
          "id": "gmail-trigger",
          "name": "Email Trigger",
          "credentials": {
            "gmailOAuth2": {
              "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> Gmail"
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Universal email data normalizer - works with Gmail, Outlook, Yahoo, etc.\nconst item = $json;\n\nfunction htmlToText(html) {\n  if (!html) return '';\n  return html\n    .replace(/<script[^>]*>([\\S\\s]*?)<\\/script>/gmi, '')\n    .replace(/<style[^>]*>([\\S\\s]*?)<\\/style>/gmi, '')\n    .replace(/<!--[\\s\\S]*?-->/g, '')\n    .replace(/<br\\s*\\/?>/gi, '\\n')\n    .replace(/<\\/(div|p|h[1-6]|li|tr)>/gi, '\\n')\n    .replace(/<[^>]+>/g, '')\n    .replace(/&nbsp;/g, ' ')\n    .replace(/&amp;/g, '&')\n    .replace(/&lt;/g, '<')\n    .replace(/&gt;/g, '>')\n    .replace(/&quot;/g, '\"')\n    .replace(/&#39;/g, \"'\")\n    .replace(/(\\n\\s*){3,}/g, '\\n\\n')\n    .trim();\n}\n\nconst messageBody = htmlToText(item.html || item.body?.content);\nconst messageId = item.headers?.['message-id'] || item.internetMessageId || item.id;\n\nreturn {\n  json: {\n    id: item.id,\n    threadId: item.threadId || item.conversationId,\n    subject: item.subject,\n    from: item.from?.value?.[0]?.address || item.from?.emailAddress?.address || null,\n    fromName: item.from?.value?.[0]?.name || item.from?.emailAddress?.name || null,\n    to: item.to?.value?.[0]?.address || item.toRecipients?.[0]?.emailAddress?.address || null,\n    toName: item.to?.value?.[0]?.name || item.toRecipients?.[0]?.emailAddress?.name || null,\n    date: item.date || item.receivedDateTime,\n    body: messageBody,\n    bodyHtml: item.html || item.body?.content,\n    labels: item.labelIds || [],\n    categories: item.categories || [],\n    provider: item.labelIds ? 'gmail' : (item.categories !== undefined ? 'outlook' : 'unknown'),\n    hasAttachments: !!(item.hasAttachments || (item.attachments?.length > 0)),\n    sizeEstimate: item.sizeEstimate || 0,\n    messageId: messageId\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            -1040,
            272
          ],
          "id": "prepare-email-data",
          "name": "Prepare Email Data"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=Subject: {{ $json.subject }}\nFrom: {{ $json.from }}\nTo: {{ $json.to }}\nDate: {{ $now }}\nThread ID: {{ $json.threadId }}\nMessage ID: {{ $json.id }}\nProvider: {{ $json.provider }}\nHas Attachments: {{ $json.hasAttachments }}\n\nEmail Body:\n{{ $json.body }}",
            "options": {
              "systemMessage": "<<<AI_SYSTEM_MESSAGE>>>"
            }
          },
          "id": "ai-classifier",
          "name": "AI Master Classifier",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [
            -816,
            272
          ],
          "typeVersion": 1.8
        },
        {
          "parameters": {
            "model": {
              "__rl": true,
              "value": "gpt-4o-mini",
              "mode": "list",
              "cachedResultName": "gpt-4o-mini"
            },
            "options": {
              "temperature": 0.3
            }
          },
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1.2,
          "position": [
            -752,
            496
          ],
          "id": "openai-classifier-model-gmail",
          "name": "OpenAI Classifier Model",
          "credentials": {
            "openAiApi": {
              "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> OpenAI"
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "const outputs = [];\n\nconst aiItems = $input.all();\nconst emailItems = $('Prepare Email Data').all();\n\nfor (let i = 0; i < aiItems.length; i++) {\n  const aiOutput = aiItems[i].json.output;\n\n  try {\n    // Normalize to JSON string\n    let clean = typeof aiOutput === 'string' ? aiOutput.trim() : JSON.stringify(aiOutput);\n\n    // Remove markdown fences\n    clean = clean.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```$/, '');\n\n    // Trim after last closing brace (common LLM quirk)\n    const lastBrace = clean.lastIndexOf('}');\n    if (lastBrace !== -1) clean = clean.slice(0, lastBrace + 1);\n\n    const parsedOutput = JSON.parse(clean);\n\n    // Attach email metadata\n    const email = emailItems[Math.min(i, emailItems.length - 1)]?.json || {};\n    if (email.id) parsedOutput.id = email.id;\n    if (email.threadId) parsedOutput.threadId = email.threadId;\n    if (email.provider) parsedOutput.provider = email.provider;\n\n    outputs.push({ json: { parsed_output: parsedOutput, error: false } });\n\n  } catch (e) {\n    // ERROR HANDLING: Critical for production\n    const email = emailItems[Math.min(i, emailItems.length - 1)]?.json || {};\n    outputs.push({\n      json: {\n        error: true,\n        id: email.id,\n        threadId: email.threadId,\n        provider: email.provider,\n        errorMessage: e.message,\n        originalOutput: aiOutput\n      }\n    });\n  }\n}\n\nreturn outputs;"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            -464,
            272
          ],
          "id": "parse-classification",
          "name": "Parse AI Classification"
        },
        {
          "parameters": {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
              },
              "conditions": [
                {
                  "id": "error-check-condition",
                  "leftValue": "={{ $json.error }}",
                  "rightValue": "\"true\"",
                  "operator": {
                    "type": "boolean",
                    "operation": "true",
                    "singleValue": true
                  }
                }
              ],
              "combinator": "and"
            },
            "options": {}
          },
          "type": "n8n-nodes-base.if",
          "typeVersion": 2.2,
          "position": [
            -240,
            272
          ],
          "id": "check-classification-errors",
          "name": "Check for Classification Errors"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/rest/v1/workflow_errors",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "<<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Authorization",
                  "value": "Bearer <<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Content-Type",
                  "value": "application/json"
                },
                {
                  "name": "Prefer",
                  "value": "return=minimal"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={\n  \"user_id\": \"<<<USER_ID>>>\",\n  \"business_name\": \"<<<BUSINESS_NAME>>>\",\n  \"error_type\": \"email_classification_error\",\n  \"email_from\": \"{{ $json.from }}\",\n  \"email_subject\": \"{{ $json.subject }}\",\n  \"email_date\": \"{{ $json.date }}\",\n  \"thread_id\": \"{{ $json.threadId }}\",\n  \"message_id\": \"{{ $json.id }}\",\n  \"error_message\": \"{{ $json.error || 'Unknown classification error' }}\",\n  \"created_at\": \"{{ $now.toISO() }}\"\n}",
            "options": {}
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            -112,
            -64
          ],
          "id": "log-error-to-supabase",
          "name": "Log Error to Supabase",
          "continueOnFail": true
        },
        {
          "parameters": {
            "jsCode": "const parsed = $json.parsed_output;\nconst provider = parsed.provider || 'gmail';\n\n// Dynamic label mapping from database\nconst labelMap = <<<LABEL_MAP>>>;\n\n// Helper function to normalize category names\nfunction normalizeCategory(category) {\n  if (!category) return null;\n  return category.toString().toUpperCase().trim();\n}\n\n// Helper function to find label with fuzzy matching\nfunction findLabel(category, labelMap) {\n  if (!category) return null;\n  \n  const normalized = normalizeCategory(category);\n  \n  // Try exact match first\n  const exactIdMatch = labelMap[normalized]?.id;\n  if (exactIdMatch) {\n    return exactIdMatch;\n  }\n  \n  // Try case-insensitive match (on keys)\n  const caseInsensitiveKey = Object.keys(labelMap).find(key => \n    key.toUpperCase() === normalized\n  );\n  if (caseInsensitiveKey) {\n    return labelMap[caseInsensitiveKey].id;\n  }\n  \n  // Try partial match (on keys)\n  const partialMatchKey = Object.keys(labelMap).find(key => \n    key.toUpperCase().includes(normalized) || \n    normalized.includes(key.toUpperCase())\n  );\n  if (partialMatchKey) {\n    return labelMap[partialMatchKey].id;\n  }\n  \n  return null;\n}\n\nconst labels = [];\n\n// Add primary category label with improved matching\nconst primaryLabelId = findLabel(parsed.primary_category, labelMap);\nif (primaryLabelId) {\n  labels.push(primaryLabelId);\n}\n\n// Add secondary category label\nif (parsed.secondary_category) {\n  const key = `${parsed.primary_category}/${parsed.secondary_category}`;\n  const secondaryLabelId = findLabel(key, labelMap);\n  if (secondaryLabelId) {\n    labels.push(secondaryLabelId);\n  }\n}\n\n// Add tertiary category label\nif (parsed.tertiary_category) {\n  const key = `${parsed.primary_category}/${parsed.secondary_category}/${parsed.tertiary_category}`;\n  const tertiaryLabelId = findLabel(key, labelMap);\n  if (tertiaryLabelId) {\n    labels.push(tertiaryLabelId);\n  }\n}\n\n// Remove duplicates and ensure we have valid label IDs\nconst uniqueLabels = [...new Set(labels)].filter(labelId => labelId && (labelId.startsWith('Label_') || labelId.includes('/')));\n\n// CRITICAL FIX: Fallback to MISC label ID if no valid labels found\nconst miscLabelId = labelMap['MISC']?.id || null;\n\nconst finalLabels = uniqueLabels.length > 0 ? uniqueLabels : (miscLabelId ? [miscLabelId] : []);\n\nreturn {\n  json: {\n    ...parsed,\n    labelsToApply: finalLabels,\n    categoriesToApply: finalLabels.map(l => {\n      // Find category name from label ID for debug purposes\n      const entry = Object.entries(labelMap).find(([k, v]) => v.id === l);\n      return entry ? entry[0] : l;\n    }),\n    provider: provider\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            32,
            272
          ],
          "id": "generate-label-mappings",
          "name": "Generate Label Mappings"
        },
        {
          "parameters": {
            "operation": "addLabels",
            "messageId": "={{ $json.id }}",
            "labelIds": "={{ $json.labelsToApply }}"
          },
          "type": "n8n-nodes-base.gmail",
          "typeVersion": 2.1,
          "position": [
            240,
            272
          ],
          "id": "apply-gmail-labels",
          "name": "Apply Gmail Labels",
          "credentials": {
            "gmailOAuth2": {
              "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> Gmail"
            }
          }
        },
        {
          "parameters": {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
              },
              "conditions": [
                {
                  "id": "can-reply-condition",
                  "leftValue": "={{ $json.parsed_output.ai_can_reply }}",
                  "rightValue": "\"true\"",
                  "operator": {
                    "type": "boolean",
                    "operation": "true",
                    "singleValue": true
                  }
                }
              ],
              "combinator": "and"
            },
            "options": {}
          },
          "type": "n8n-nodes-base.if",
          "typeVersion": 2.2,
          "position": [
            432,
            272
          ],
          "id": "check-can-reply",
          "name": "Can AI Reply?"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/functions/v1/style-memory",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "supabaseApi",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "Authorization",
                  "value": "=Bearer <<<SUPABASE_ANON_KEY>>>"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\n  userId: \"<<<USER_ID>>>\",\n  category: $json.parsed_output.primary_category,\n  limit: 5\n}) }}",
            "options": {
              "response": {
                "response": {
                  "neverError": true
                }
              }
            }
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            640,
            160
          ],
          "id": "fetch-voice-context",
          "name": "Fetch Voice Context (Optional)",
          "credentials": {
            "supabaseApi": {
              "id": "<<<CLIENT_SUPABASE_CRED_ID>>>",
              "name": "Supabase FWIQ"
            }
          },
          "continueOnFail": true
        },
        {
          "parameters": {
            "mode": "combine",
            "combineBy": "combineByPosition",
            "options": {}
          },
          "type": "n8n-nodes-base.merge",
          "typeVersion": 3.2,
          "position": [
            880,
            272
          ],
          "id": "merge-email-voice-context",
          "name": "Merge Email + Voice Context"
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Prepare context for AI reply agent\nconst emailData = $('Prepare Email Data').first()?.json || {};\nconst classification = $json.parsed_output || {};\nconst voiceContext = $('Fetch Voice Context (Optional)').first()?.json || {};\n\n// Handle optional voice training data\nlet voiceExamples = '';\nlet voiceMetrics = '';\n\nif (voiceContext && voiceContext.examples && voiceContext.examples.length > 0) {\n  voiceExamples = `RECENT STYLE EXAMPLES (How you typically write):\n${'─'.repeat(60)}\n${voiceContext.examples.map((ex, i) => `Example ${i+1}:\\n${ex}`).join('\\n\\n')}`;\n  \n  if (voiceContext.metrics) {\n    voiceMetrics = `\\nVOICE METRICS:\nFormality: ${voiceContext.metrics.formality || 'N/A'}\nEmpathy: ${voiceContext.metrics.empathy || 'N/A'}\nDirectness: ${voiceContext.metrics.directness || 'N/A'}`;\n  }\n} else {\n  voiceExamples = `VOICE TRAINING: Not yet available (will learn from your sent emails)`;\n}\n\nreturn {\n  json: {\n    emailSubject: emailData.subject,\n    emailFrom: emailData.from,\n    emailBody: emailData.body,\n    threadId: emailData.threadId,\n    classification: classification,\n    voiceExamples: voiceExamples,\n    voiceMetrics: voiceMetrics,\n    hasVoiceTraining: !!(voiceContext && voiceContext.examples && voiceContext.examples.length > 0)\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            1104,
            272
          ],
          "id": "prepare-draft-context",
          "name": "Prepare Draft Context"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=EMAIL TO REPLY TO:\n─────────────────────────────────────────────────────────────\nSubject: {{ $json.emailSubject }}\nFrom: {{ $json.emailFrom }}\nBody: {{ $json.emailBody }}\n\nCLASSIFICATION:\n─────────────────────────────────────────────────────────────\nCategory: {{ $json.classification.primary_category }}\nSubcategory: {{ $json.classification.secondary_category }}\nSummary: {{ $json.classification.summary }}\nConfidence: {{ $json.classification.confidence }}\n\n{{ $json.voiceExamples }}\n{{ $json.voiceMetrics }}\n\nTHREAD CONTEXT:\n─────────────────────────────────────────────────────────────\nThread ID: {{ $json.threadId }}",
            "options": {
              "systemMessage": "<<<BEHAVIOR_REPLY_PROMPT>>>"
            }
          },
          "id": "ai-reply",
          "name": "AI Draft Reply Agent",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [
            1328,
            272
          ],
          "typeVersion": 1.8
        },
        {
          "parameters": {
            "model": {
              "__rl": true,
              "value": "gpt-4o-mini",
              "mode": "list",
              "cachedResultName": "gpt-4o-mini"
            },
            "options": {
              "temperature": 0.7
            }
          },
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1.2,
          "position": [
            1392,
            496
          ],
          "id": "openai-reply-model-gmail",
          "name": "OpenAI Draft Model",
          "credentials": {
            "openAiApi": {
              "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> OpenAI"
            }
          }
        },
        {
          "parameters": {
            "sessionIdType": "customKey",
            "sessionKey": "={{ $('Prepare Email Data').item.json.threadId }}",
            "contextWindowLength": 10
          },
          "id": "conversation-memory",
          "name": "Conversation Memory",
          "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          "position": [
            1488,
            496
          ],
          "typeVersion": 1.3
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Format reply as HTML for email\nreturn {\n  json: {\n    output: $json.output.replace(/\\n/g, '<br>')\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            1600,
            272
          ],
          "id": "format-reply-html",
          "name": "Format Reply as HTML"
        },
        {
          "parameters": {
            "resource": "draft",
            "subject": "={{ $('Prepare Email Data').first().json.subject }}",
            "emailType": "html",
            "message": "={{ $json.output }}",
            "options": {
              "replyTo": "={{ /@(<<<EMAIL_DOMAIN>>>)$/i.test($('Prepare Email Data').first().json.from) ? $('Prepare Email Data').first().json.to : $('Prepare Email Data').first().json.from }}",
              "threadId": "={{ $('Prepare Email Data').first().json.threadId }}",
              "sendTo": "={{ /@(<<<EMAIL_DOMAIN>>>)$/i.test($('Prepare Email Data').first().json.from) ? $('Prepare Email Data').first().json.to : $('Prepare Email Data').first().json.from }}"
            }
          },
          "type": "n8n-nodes-base.gmail",
          "typeVersion": 2.1,
          "position": [
            1776,
            272
          ],
          "id": "create-gmail-draft",
          "name": "Create Gmail Draft",
          "credentials": {
            "gmailOAuth2": {
              "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> Gmail"
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Calculate performance metrics\nconst avgMinutesPerEmail = 4.5;\nconst receptionistHourlyRate = 25;\n\nconst emailsProcessed = 1;\nconst timeSavedHours = +(emailsProcessed * avgMinutesPerEmail / 60).toFixed(2);\nconst moneySaved = +(timeSavedHours * receptionistHourlyRate).toFixed(2);\n\nreturn {\n  json: {\n    date: new Date().toISOString().slice(0, 10),\n    type: $json.parsed_output?.ai_can_reply ? 'Drafting' : 'Labeling',\n    emailsProcessed,\n    avgMinutesPerEmail,\n    timeSavedHours,\n    receptionistHourlyRate,\n    moneySaved,\n    userId: '<<<USER_ID>>>'\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            256,
            464
          ],
          "id": "calculate-metrics",
          "name": "Calculate Performance Metrics"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/rest/v1/performance_metrics",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "<<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Authorization",
                  "value": "Bearer <<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Content-Type",
                  "value": "application/json"
                },
                {
                  "name": "Prefer",
                  "value": "return=minimal"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\n  client_id: \"<<<USER_ID>>>\",\n  metric_date: $json.date,\n  metric_name: \"email_processing\",\n  metric_value: $json.emailsProcessed,\n  dimensions: { type: $json.type, timeSavedHours: $json.timeSavedHours, moneySaved: $json.moneySaved, avgMinutesPerEmail: $json.avgMinutesPerEmail, receptionistHourlyRate: $json.receptionistHourlyRate, workflow: 'email-automation' }\n}) }}",
            "options": {}
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            448,
            464
          ],
          "id": "save-metrics",
          "name": "Save Performance Metrics",
          "continueOnFail": true
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/rest/v1/ai_draft_learning",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "<<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Authorization",
                  "value": "Bearer <<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Content-Type",
                  "value": "application/json"
                },
                {
                  "name": "Prefer",
                  "value": "return=minimal"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\n  user_id: \"<<<USER_ID>>>\",\n  thread_id: $('Prepare Email Data').first().json.threadId,\n  email_id: $('Prepare Email Data').first().json.id,\n  original_email: $('Prepare Email Data').first().json.body,\n  ai_draft: $('Format Reply as HTML').first().json.output,\n  classification: $('Parse AI Classification').first().json.parsed_output,\n  confidence_score: $('Parse AI Classification').first().json.parsed_output.confidence,\n  model_used: \"gpt-4o-mini\"\n}) }}",
            "options": {}
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            2000,
            272
          ],
          "id": "save-to-learning-db",
          "name": "Save AI Draft for Learning",
          "continueOnFail": true
        }
      ],
      "connections": {
        "Email Trigger": {
          "main": [
            [
              {
                "node": "Prepare Email Data",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Prepare Email Data": {
          "main": [
            [
              {
                "node": "AI Master Classifier",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "AI Master Classifier": {
          "main": [
            [
              {
                "node": "Parse AI Classification",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Classifier Model": {
          "ai_languageModel": [
            [
              {
                "node": "AI Master Classifier",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Parse AI Classification": {
          "main": [
            [
              {
                "node": "Check for Classification Errors",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Check for Classification Errors": {
          "main": [
            [
              {
                "node": "Log Error to Supabase",
                "type": "main",
                "index": 0
              }
            ],
            [
              {
                "node": "Calculate Performance Metrics",
                "type": "main",
                "index": 0
              },
              {
                "node": "Generate Label Mappings",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Generate Label Mappings": {
          "main": [
            [
              {
                "node": "Apply Gmail Labels",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Apply Gmail Labels": {
          "main": [
            [
              {
                "node": "Can AI Reply?",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Can AI Reply?": {
          "main": [
            [
              {
                "node": "Fetch Voice Context (Optional)",
                "type": "main",
                "index": 0
              },
              {
                "node": "Merge Email + Voice Context",
                "type": "main",
                "index": 1
              }
            ],
            []
          ]
        },
        "Fetch Voice Context (Optional)": {
          "main": [
            [
              {
                "node": "Merge Email + Voice Context",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Merge Email + Voice Context": {
          "main": [
            [
              {
                "node": "Prepare Draft Context",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Prepare Draft Context": {
          "main": [
            [
              {
                "node": "AI Draft Reply Agent",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "AI Draft Reply Agent": {
          "main": [
            [
              {
                "node": "Format Reply as HTML",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Draft Model": {
          "ai_languageModel": [
            [
              {
                "node": "AI Draft Reply Agent",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Conversation Memory": {
          "ai_memory": [
            [
              {
                "node": "AI Draft Reply Agent",
                "type": "ai_memory",
                "index": 0
              }
            ]
          ]
        },
        "Format Reply as HTML": {
          "main": [
            [
              {
                "node": "Create Gmail Draft",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Create Gmail Draft": {
          "main": [
            [
              {
                "node": "Save AI Draft for Learning",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Calculate Performance Metrics": {
          "main": [
            [
              {
                "node": "Save Performance Metrics",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "pinData": {},
      "settings": {
        "executionOrder": "v1"
      }
    };
  } else {
    // Outlook template
    return {
      "name": "<<<BUSINESS_NAME>>> Outlook AI Email Processing Workflow v<<<CONFIG_VERSION>>>",
      "nodes": [
        {
          "parameters": {
            "pollTimes": {
              "item": [
                {
                  "mode": "everyMinute"
                }
              ]
            },
            "filters": {},
            "options": {}
          },
          "type": "n8n-nodes-base.microsoftOutlookTrigger",
          "typeVersion": 1,
          "position": [
            -1264,
            272
          ],
          "id": "outlook-trigger",
          "name": "Microsoft Outlook Trigger",
          "credentials": {
            "microsoftOutlookOAuth2Api": {
              "id": "<<<CLIENT_OUTLOOK_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> Outlook"
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Universal email data normalizer - works with Gmail, Outlook, Yahoo, etc.\nconst item = $json;\n\nfunction htmlToText(html) {\n  if (!html) return '';\n  return html\n    .replace(/<script[^>]*>([\\S\\s]*?)<\\/script>/gmi, '')\n    .replace(/<style[^>]*>([\\S\\s]*?)<\\/style>/gmi, '')\n    .replace(/<!--[\\s\\S]*?-->/g, '')\n    .replace(/<br\\s*\\/?>/gi, '\\n')\n    .replace(/<\\/(div|p|h[1-6]|li|tr)>/gi, '\\n')\n    .replace(/<[^>]+>/g, '')\n    .replace(/&nbsp;/g, ' ')\n    .replace(/&amp;/g, '&')\n    .replace(/&lt;/g, '<')\n    .replace(/&gt;/g, '>')\n    .replace(/&quot;/g, '\"')\n    .replace(/&#39;/g, \"'\")\n    .replace(/(\\n\\s*){3,}/g, '\\n\\n')\n    .trim();\n}\n\nconst messageBody = htmlToText(item.html || item.body?.content);\nconst messageId = item.headers?.['message-id'] || item.internetMessageId || item.id;\n\nreturn {\n  json: {\n    id: item.id,\n    threadId: item.threadId || item.conversationId,\n    subject: item.subject,\n    from: item.from?.value?.[0]?.address || item.from?.emailAddress?.address || null,\n    fromName: item.from?.value?.[0]?.name || item.from?.emailAddress?.name || null,\n    to: item.to?.value?.[0]?.address || item.toRecipients?.[0]?.emailAddress?.address || null,\n    toName: item.to?.value?.[0]?.name || item.toRecipients?.[0]?.emailAddress?.name || null,\n    date: item.date || item.receivedDateTime,\n    body: messageBody,\n    bodyHtml: item.html || item.body?.content,\n    labels: item.labelIds || [],\n    categories: item.categories || [],\n    provider: item.labelIds ? 'gmail' : (item.categories !== undefined ? 'outlook' : 'unknown'),\n    hasAttachments: !!(item.hasAttachments || (item.attachments?.length > 0)),\n    sizeEstimate: item.sizeEstimate || 0,\n    messageId: messageId\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            -1040,
            272
          ],
          "id": "prepare-email-data",
          "name": "Prepare Email Data"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=Subject: {{ $json.subject }}\nFrom: {{ $json.from }}\nTo: {{ $json.to }}\nDate: {{ $now }}\nThread ID: {{ $json.threadId }}\nMessage ID: {{ $json.id }}\nProvider: {{ $json.provider }}\nHas Attachments: {{ $json.hasAttachments }}\n\nEmail Body:\n{{ $json.body }}",
            "options": {
              "systemMessage": "<<<AI_SYSTEM_MESSAGE>>>"
            }
          },
          "id": "ai-classifier",
          "name": "AI Master Classifier",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [
            -816,
            272
          ],
          "typeVersion": 1.8
        },
        {
          "parameters": {
            "model": {
              "__rl": true,
              "value": "gpt-4o-mini",
              "mode": "list",
              "cachedResultName": "gpt-4o-mini"
            },
            "options": {
              "temperature": 0.3
            }
          },
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1.2,
          "position": [
            -752,
            496
          ],
          "id": "openai-classifier-model",
          "name": "OpenAI Classifier Model",
          "credentials": {
            "openAiApi": {
              "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> OpenAI"
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "const outputs = [];\n\nconst aiItems = $input.all();\nconst emailItems = $('Prepare Email Data').all();\n\nfor (let i = 0; i < aiItems.length; i++) {\n  const aiOutput = aiItems[i].json.output;\n\n  try {\n    // Normalize to JSON string\n    let clean = typeof aiOutput === 'string' ? aiOutput.trim() : JSON.stringify(aiOutput);\n\n    // Remove markdown fences\n    clean = clean.replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```$/, '');\n\n    // Trim after last closing brace (common LLM quirk)\n    const lastBrace = clean.lastIndexOf('}');\n    if (lastBrace !== -1) clean = clean.slice(0, lastBrace + 1);\n\n    const parsedOutput = JSON.parse(clean);\n\n    // Attach email metadata\n    const email = emailItems[Math.min(i, emailItems.length - 1)]?.json || {};\n    if (email.id) parsedOutput.id = email.id;\n    if (email.threadId) parsedOutput.threadId = email.threadId;\n    if (email.provider) parsedOutput.provider = email.provider;\n\n    outputs.push({ json: { parsed_output: parsedOutput, error: false } });\n\n  } catch (e) {\n    // ERROR HANDLING: Critical for production\n    const email = emailItems[Math.min(i, emailItems.length - 1)]?.json || {};\n    outputs.push({\n      json: {\n        error: true,\n        id: email.id,\n        threadId: email.threadId,\n        provider: email.provider,\n        errorMessage: e.message,\n        originalOutput: aiOutput\n      }\n    });\n  }\n}\n\nreturn outputs;"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            -464,
            272
          ],
          "id": "parse-classification",
          "name": "Parse AI Classification"
        },
        {
          "parameters": {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
              },
              "conditions": [
                {
                  "id": "error-check-condition",
                  "leftValue": "={{ $json.error }}",
                  "rightValue": "\"true\"",
                  "operator": {
                    "type": "boolean",
                    "operation": "true",
                    "singleValue": true
                  }
                }
              ],
              "combinator": "and"
            },
            "options": {}
          },
          "type": "n8n-nodes-base.if",
          "typeVersion": 2.2,
          "position": [
            -240,
            272
          ],
          "id": "check-classification-errors",
          "name": "Check for Classification Errors"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/rest/v1/workflow_errors",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "<<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Authorization",
                  "value": "Bearer <<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Content-Type",
                  "value": "application/json"
                },
                {
                  "name": "Prefer",
                  "value": "return=minimal"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={\n  \"user_id\": \"<<<USER_ID>>>\",\n  \"business_name\": \"<<<BUSINESS_NAME>>>\",\n  \"error_type\": \"email_classification_error\",\n  \"email_from\": \"{{ $json.from }}\",\n  \"email_subject\": \"{{ $json.subject }}\",\n  \"email_date\": \"{{ $json.date }}\",\n  \"thread_id\": \"{{ $json.threadId }}\",\n  \"message_id\": \"{{ $json.id }}\",\n  \"error_message\": \"{{ $json.error || 'Unknown classification error' }}\",\n  \"created_at\": \"{{ $now.toISO() }}\"\n}",
            "options": {}
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            -112,
            -64
          ],
          "id": "log-error-to-supabase",
          "name": "Log Error to Supabase",
          "continueOnFail": true
        },
        {
          "parameters": {
            "jsCode": "const parsed = $json.parsed_output;\nconst provider = parsed.provider || 'outlook';\n\n// Dynamic label mapping from database\nconst labelMap = <<<LABEL_MAP>>>;\n\n// Helper function to normalize category names\nfunction normalizeCategory(category) {\n  if (!category) return null;\n  return category.toString().toUpperCase().trim();\n}\n\n// Helper function to find label with fuzzy matching\nfunction findLabel(category, labelMap) {\n  if (!category) return null;\n  \n  const normalized = normalizeCategory(category);\n  \n  // Try exact match first\n  const exactIdMatch = labelMap[normalized]?.id;\n  if (exactIdMatch) {\n    return exactIdMatch;\n  }\n  \n  // Try case-insensitive match (on keys)\n  const caseInsensitiveKey = Object.keys(labelMap).find(key => \n    key.toUpperCase() === normalized\n  );\n  if (caseInsensitiveKey) {\n    return labelMap[caseInsensitiveKey].id;\n  }\n  \n  // Try partial match (on keys)\n  const partialMatchKey = Object.keys(labelMap).find(key => \n    key.toUpperCase().includes(normalized) || \n    normalized.includes(key.toUpperCase())\n  );\n  if (partialMatchKey) {\n    return labelMap[partialMatchKey].id;\n  }\n  \n  return null;\n}\n\nconst labels = [];\n\n// Add primary category label with improved matching\nconst primaryLabelId = findLabel(parsed.primary_category, labelMap);\nif (primaryLabelId) {\n  labels.push(primaryLabelId);\n}\n\n// Add secondary category label\nif (parsed.secondary_category) {\n  const key = `${parsed.primary_category}/${parsed.secondary_category}`;\n  const secondaryLabelId = findLabel(key, labelMap);\n  if (secondaryLabelId) {\n    labels.push(secondaryLabelId);\n  }\n}\n\n// Add tertiary category label\nif (parsed.tertiary_category) {\n  const key = `${parsed.primary_category}/${parsed.secondary_category}/${parsed.tertiary_category}`;\n  const tertiaryLabelId = findLabel(key, labelMap);\n  if (tertiaryLabelId) {\n    labels.push(tertiaryLabelId);\n  }\n}\n\n// Remove duplicates and ensure we have valid label IDs\nconst uniqueLabels = [...new Set(labels)].filter(labelId => labelId && (labelId.startsWith('Label_') || labelId.includes('/')));\n\n// CRITICAL FIX: Fallback to MISC label ID if no valid labels found\nconst miscLabelId = labelMap['MISC']?.id || (provider === 'outlook' ? 'junkemail' : null);\n\nconst finalLabels = uniqueLabels.length > 0 ? uniqueLabels : (miscLabelId ? [miscLabelId] : []);\n\n// Safety check: if fallback to null Gmail ID, use an Outlook-style ID instead\nif (provider === 'gmail' && finalLabels.length === 1 && finalLabels[0] === null) {\n  finalLabels[0] = 'Label_Fallback_MISC';\n}\n\nreturn {\n  json: {\n    ...parsed,\n    labelsToApply: finalLabels,\n    categoriesToApply: finalLabels.map(l => {\n      // Find category name from label ID for debug purposes\n      const entry = Object.entries(labelMap).find(([k, v]) => v.id === l);\n      return entry ? entry[0] : l;\n    }),\n    provider: provider\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            32,
            272
          ],
          "id": "generate-label-mappings",
          "name": "Generate Label Mappings"
        },
        {
          "parameters": {
            "operation": "move",
            "messageId": "={{ $json.id }}",
            "folderId": "={{ $json.labelsToApply && $json.labelsToApply.length > 0 ? $json.labelsToApply[0] : 'inbox' }}"
          },
          "type": "n8n-nodes-base.microsoftOutlook",
          "typeVersion": 2,
          "position": [
            240,
            272
          ],
          "id": "apply-outlook-labels",
          "name": "Move a message",
          "credentials": {
            "microsoftOutlookOAuth2Api": {
              "id": "<<<CLIENT_OUTLOOK_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> Outlook"
            }
          }
        },
        {
          "parameters": {
            "conditions": {
              "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
              },
              "conditions": [
                {
                  "id": "can-reply-condition",
                  "leftValue": "={{ $json.parsed_output.ai_can_reply }}",
                  "rightValue": "\"true\"",
                  "operator": {
                    "type": "boolean",
                    "operation": "true",
                    "singleValue": true
                  }
                }
              ],
              "combinator": "and"
            },
            "options": {}
          },
          "type": "n8n-nodes-base.if",
          "typeVersion": 2.2,
          "position": [
            432,
            272
          ],
          "id": "check-can-reply",
          "name": "Can AI Reply?"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/functions/v1/style-memory",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "supabaseApi",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "Authorization",
                  "value": "=Bearer <<<SUPABASE_ANON_KEY>>>"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\n  userId: \"<<<USER_ID>>>\",\n  category: $json.parsed_output.primary_category,\n  limit: 5\n}) }}",
            "options": {
              "response": {
                "response": {
                  "neverError": true
                }
              }
            }
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            640,
            160
          ],
          "id": "fetch-voice-context",
          "name": "Fetch Voice Context (Optional)",
          "credentials": {
            "supabaseApi": {
              "id": "<<<CLIENT_SUPABASE_CRED_ID>>>",
              "name": "Supabase FWIQ"
            }
          },
          "continueOnFail": true
        },
        {
          "parameters": {
            "mode": "combine",
            "combineBy": "combineByPosition",
            "options": {}
          },
          "type": "n8n-nodes-base.merge",
          "typeVersion": 3.2,
          "position": [
            880,
            272
          ],
          "id": "merge-email-voice-context",
          "name": "Merge Email + Voice Context"
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Prepare context for AI reply agent\nconst emailData = $('Prepare Email Data').first()?.json || {};\nconst classification = $json.parsed_output || {};\nconst voiceContext = $('Fetch Voice Context (Optional)').first()?.json || {};\n\n// Handle optional voice training data\nlet voiceExamples = '';\nlet voiceMetrics = '';\n\nif (voiceContext && voiceContext.examples && voiceContext.examples.length > 0) {\n  voiceExamples = `RECENT STYLE EXAMPLES (How you typically write):\n${'─'.repeat(60)}\n${voiceContext.examples.map((ex, i) => `Example ${i+1}:\\n${ex}`).join('\\n\\n')}`;\n  \n  if (voiceContext.metrics) {\n    voiceMetrics = `\\nVOICE METRICS:\nFormality: ${voiceContext.metrics.formality || 'N/A'}\nEmpathy: ${voiceContext.metrics.empathy || 'N/A'}\nDirectness: ${voiceContext.metrics.directness || 'N/A'}`;\n  }\n} else {\n  voiceExamples = `VOICE TRAINING: Not yet available (will learn from your sent emails)`;\n}\n\nreturn {\n  json: {\n    emailSubject: emailData.subject,\n    emailFrom: emailData.from,\n    emailBody: emailData.body,\n    threadId: emailData.threadId,\n    classification: classification,\n    voiceExamples: voiceExamples,\n    voiceMetrics: voiceMetrics,\n    hasVoiceTraining: !!(voiceContext && voiceContext.examples && voiceContext.examples.length > 0)\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            1104,
            272
          ],
          "id": "prepare-draft-context",
          "name": "Prepare Draft Context"
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "=EMAIL TO REPLY TO:\n─────────────────────────────────────────────────────────────\nSubject: {{ $json.emailSubject }}\nFrom: {{ $json.emailFrom }}\nBody: {{ $json.emailBody }}\n\nCLASSIFICATION:\n─────────────────────────────────────────────────────────────\nCategory: {{ $json.classification.primary_category }}\nSubcategory: {{ $json.classification.secondary_category }}\nSummary: {{ $json.classification.summary }}\nConfidence: {{ $json.classification.confidence }}\n\n{{ $json.voiceExamples }}\n{{ $json.voiceMetrics }}\n\nTHREAD CONTEXT:\n─────────────────────────────────────────────────────────────\nThread ID: {{ $json.threadId }}",
            "options": {
              "systemMessage": "<<<BEHAVIOR_REPLY_PROMPT>>>"
            }
          },
          "id": "ai-draft-reply",
          "name": "AI Draft Reply Agent",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [
            1328,
            272
          ],
          "typeVersion": 1.8
        },
        {
          "parameters": {
            "model": {
              "__rl": true,
              "value": "gpt-4o-mini",
              "mode": "list",
              "cachedResultName": "gpt-4o-mini"
            },
            "options": {
              "temperature": 0.7
            }
          },
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1.2,
          "position": [
            1392,
            496
          ],
          "id": "openai-draft-model",
          "name": "OpenAI Draft Model",
          "credentials": {
            "openAiApi": {
              "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> OpenAI"
            }
          }
        },
        {
          "parameters": {
            "sessionIdType": "customKey",
            "sessionKey": "={{ $('Prepare Email Data').item.json.threadId }}",
            "contextWindowLength": 10
          },
          "id": "conversation-memory",
          "name": "Conversation Memory",
          "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          "position": [
            1488,
            496
          ],
          "typeVersion": 1.3
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Format reply as HTML for email\nreturn {\n  json: {\n    output: $json.output.replace(/\\n/g, '<br>')\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            1600,
            272
          ],
          "id": "format-reply-html",
          "name": "Format Reply as HTML"
        },
        {
          "parameters": {
            "resource": "draft",
            "additionalFields": {
              "subject": "={{ $('Prepare Email Data').first().json.subject }}",
              "bodyContent": "={{ $json.output }}",
              "bodyContentType": "html"
            }
          },
          "type": "n8n-nodes-base.microsoftOutlook",
          "typeVersion": 2,
          "position": [
            1776,
            144
          ],
          "id": "create-outlook-draft",
          "name": "Create a draft",
          "credentials": {
            "microsoftOutlookOAuth2Api": {
              "id": "<<<CLIENT_OUTLOOK_CRED_ID>>>",
              "name": "<<<BUSINESS_NAME>>> Outlook"
            }
          }
        },
        {
          "parameters": {
            "mode": "runOnceForEachItem",
            "jsCode": "// Calculate performance metrics\nconst avgMinutesPerEmail = 4.5;\nconst receptionistHourlyRate = 25;\n\nconst emailsProcessed = 1;\nconst timeSavedHours = +(emailsProcessed * avgMinutesPerEmail / 60).toFixed(2);\nconst moneySaved = +(timeSavedHours * receptionistHourlyRate).toFixed(2);\n\nreturn {\n  json: {\n    date: new Date().toISOString().slice(0, 10),\n    type: $json.parsed_output?.ai_can_reply ? 'Drafting' : 'Labeling',\n    emailsProcessed,\n    avgMinutesPerEmail,\n    timeSavedHours,\n    receptionistHourlyRate,\n    moneySaved,\n    userId: '<<<USER_ID>>>'\n  }\n};"
          },
          "type": "n8n-nodes-base.code",
          "typeVersion": 2,
          "position": [
            256,
            464
          ],
          "id": "calculate-metrics",
          "name": "Calculate Performance Metrics"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/rest/v1/performance_metrics",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "<<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Authorization",
                  "value": "Bearer <<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Content-Type",
                  "value": "application/json"
                },
                {
                  "name": "Prefer",
                  "value": "return=minimal"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\n  client_id: \"<<<USER_ID>>>\",\n  metric_date: $json.date,\n  metric_name: \"email_processing\",\n  metric_value: $json.emailsProcessed,\n  dimensions: { type: $json.type, timeSavedHours: $json.timeSavedHours, moneySaved: $json.moneySaved, avgMinutesPerEmail: $json.avgMinutesPerEmail, receptionistHourlyRate: $json.receptionistHourlyRate, workflow: 'email-automation' }\n}) }}",
            "options": {}
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            448,
            464
          ],
          "id": "save-metrics",
          "name": "Save Performance Metrics",
          "continueOnFail": true
        },
        {
          "parameters": {
            "method": "POST",
            "url": "<<<SUPABASE_URL>>>/rest/v1/ai_draft_learning",
            "sendHeaders": true,
            "headerParameters": {
              "parameters": [
                {
                  "name": "apikey",
                  "value": "<<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Authorization",
                  "value": "Bearer <<<SUPABASE_ANON_KEY>>>"
                },
                {
                  "name": "Content-Type",
                  "value": "application/json"
                },
                {
                  "name": "Prefer",
                  "value": "return=minimal"
                }
              ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={{ JSON.stringify({\n  user_id: \"<<<USER_ID>>>\",\n  thread_id: $('Prepare Email Data').first().json.threadId,\n  email_id: $('Prepare Email Data').first().json.id,\n  original_email: $('Prepare Email Data').first().json.body,\n  ai_draft: $('Format Reply as HTML').first().json.output,\n  classification: $('Parse AI Classification').first().json.parsed_output,\n  confidence_score: $('Parse AI Classification').first().json.parsed_output.confidence,\n  model_used: \"gpt-4o-mini\"\n}) }}",
            "options": {}
          },
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 4.2,
          "position": [
            2000,
            272
          ],
          "id": "save-to-learning-db",
          "name": "Save AI Draft for Learning",
          "continueOnFail": true
        }
      ],
      "connections": {
        "Microsoft Outlook Trigger": {
          "main": [
            [
              {
                "node": "Prepare Email Data",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Prepare Email Data": {
          "main": [
            [
              {
                "node": "AI Master Classifier",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "AI Master Classifier": {
          "main": [
            [
              {
                "node": "Parse AI Classification",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Classifier Model": {
          "ai_languageModel": [
            [
              {
                "node": "AI Master Classifier",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Parse AI Classification": {
          "main": [
            [
              {
                "node": "Check for Classification Errors",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Check for Classification Errors": {
          "main": [
            [
              {
                "node": "Log Error to Supabase",
                "type": "main",
                "index": 0
              }
            ],
            [
              {
                "node": "Calculate Performance Metrics",
                "type": "main",
                "index": 0
              },
              {
                "node": "Generate Label Mappings",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Generate Label Mappings": {
          "main": [
            [
              {
                "node": "Move a message",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Move a message": {
          "main": [
            [
              {
                "node": "Can AI Reply?",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Can AI Reply?": {
          "main": [
            [
              {
                "node": "Fetch Voice Context (Optional)",
                "type": "main",
                "index": 0
              },
              {
                "node": "Merge Email + Voice Context",
                "type": "main",
                "index": 1
              }
            ],
            []
          ]
        },
        "Fetch Voice Context (Optional)": {
          "main": [
            [
              {
                "node": "Merge Email + Voice Context",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Merge Email + Voice Context": {
          "main": [
            [
              {
                "node": "Prepare Draft Context",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Prepare Draft Context": {
          "main": [
            [
              {
                "node": "AI Draft Reply Agent",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "AI Draft Reply Agent": {
          "main": [
            [
              {
                "node": "Format Reply as HTML",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Draft Model": {
          "ai_languageModel": [
            [
              {
                "node": "AI Draft Reply Agent",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Conversation Memory": {
          "ai_memory": [
            [
              {
                "node": "AI Draft Reply Agent",
                "type": "ai_memory",
                "index": 0
              }
            ]
          ]
        },
        "Format Reply as HTML": {
          "main": [
            [
              {
                "node": "Create a draft",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Create a draft": {
          "main": [
            [
              {
                "node": "Save AI Draft for Learning",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Calculate Performance Metrics": {
          "main": [
            [
              {
                "node": "Save Performance Metrics",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "pinData": {},
      "settings": {
        "executionOrder": "v1"
      }
    };
  }
}

async function injectOnboardingData(clientData, workflowTemplate) {
  let templateString = JSON.stringify(workflowTemplate);
  const { business = {}, contact = {}, services = [], rules = {}, integrations = {}, id: clientId, version } = clientData;
  // Build signature block
  const signatureBlock = `\n\nBest regards,\nThe ${business.name || 'Your Business'} Team\n${contact.phone || ''}`;
  const serviceCatalogText = (services || []).map((s)=>`- ${s.name} (${s.pricingType} ${s.price} ${business.currency || 'USD'}): ${s.description}`).join('\n');
  const managersText = (clientData.managers || []).map((m)=>m.name).join(', ');
  
  // Extract business types
  const businessTypes = clientData.business?.types || (clientData.business?.type ? [
    clientData.business.type
  ] : []);
  const businessTypesText = Array.isArray(businessTypes) ? businessTypes.join(' + ') : businessTypes;
  
  // BUILD AI CONFIGURATION (Layer 1)
  // Using comprehensive dynamic AI system message generator
  // Fetches complete profile from database for truly personalized system messages
  const userId = clientData.userId || clientData.user_id || clientData.id;
  const aiSystemMessage = await generateGoldStandardAISystemMessage(userId);
  console.log(` Generated AI system message (${aiSystemMessage.length} chars)`);
  console.log(` System message preview: ${aiSystemMessage.substring(0, 200)}...`);
  
  // BUILD BEHAVIOR CONFIGURATION (Layer 2 + Voice Training)
  // Combines behavior schema with learned voice profile
  const behaviorTone = rules?.tone || 'Professional, friendly, and helpful';
  // Get business type template for comprehensive system message
  const primaryBusinessType = businessTypes[0] || 'General';
  const template = getBusinessTypeTemplate(primaryBusinessType);
  console.log(`🎯 Using business type template: ${primaryBusinessType}`);
  // Build comprehensive behavior reply prompt using gold standard template
  let behaviorReplyPrompt = await generateGoldStandardReplyPrompt(userId);
  // Apply voice learning corrections (if any exist)
  behaviorReplyPrompt = await applyVoiceLearningCorrections(userId, behaviorReplyPrompt);
  // Archive old training data (async, non-blocking)
  archiveOldTrainingData(userId).catch((err)=>console.warn('⚠️ Archive operation failed (non-critical):', err.message));
  // Log voice learning summary
  const voiceLearningSummary = await getVoiceLearningSummary(userId);
  console.log(voiceLearningSummary);
  // Note: The gold standard template already includes all business-specific rules, voice training,
  // and few-shot examples. The following code was replaced by generateGoldStandardReplyPrompt().
  /* OLD CODE PRESERVED FOR REFERENCE:
Draft ${behaviorTone.toLowerCase()} email replies that:
- Reflect prior conversation context
- Clearly communicate next steps
- Resolve concerns without delays or vagueness
- Match the customer's tone, urgency, and message length
- Maintain a warm, human, and on-brand voice

Use the structured guidance and rules below to reply with confidence, clarity, and care.
Always prioritize accuracy, especially for dates and specific details.
Strive for conciseness by omitting unnecessary requests or information that might be perceived as a burden to the customer.

## Intelligent Conversation Progression
- Assess conversation depth: If a customer is on their 2nd or 3rd message, avoid repeating earlier answers.
- When replying to follow-ups, do not summarize prior messages—instead, advance the resolution.
- If a human reply is incomplete, ensure the AI reply fills gaps: confirm details, include next steps, and express gratitude.
- Always analyze the most recent customer input to understand the current context.

## Inquiry Classification

${template.inquiryTypes?.map((type: { name: string; description: string; keywords: string; pricing: string }) => `
### ${type.name}
${type.description}
${type.keywords ? `**Keywords**: ${type.keywords}` : ''}
${type.pricing ? `**Pricing**: ${type.pricing}` : ''}
`).join('\n') || 'Standard inquiry types apply'}

### Available Services:
${services.length > 0 ? services.map((s: { name: string; description: string; price: number }) => `- **${s.name}**: ${s.description || ''}${rules?.aiGuardrails?.allowPricing && s.price ? ` (${s.price})` : ''}`).join('\n') : '- No specific services configured'}

## Response Protocols

${template.protocols || 'Follow standard professional protocols'}

## Team & Routing

${clientData.managers?.length > 0 ? `### Team Members:\n${clientData.managers.map((m: { name: string; role: string; email: string }) => `- **${m.name}**${m.role ? ` (${m.role})` : ''}${m.email ? ` - ${m.email}` : ''}`).join('\n')}` : ''}

${clientData.managers?.length > 0 ? `\n**Escalation**: Route critical issues to ${rules?.defaultEscalationManager || clientData.managers[0]?.name || 'management'}` : ''}

${clientData.suppliers?.length > 0 ? `\n### Known Suppliers:\n${clientData.suppliers.map((s: { name: string; category: string; domains: string[] }) => `- **${s.name}**${s.category ? ` (${s.category})` : ''}${s.domains?.length > 0 ? ` - ${s.domains.join(', ')}` : ''}`).join('\n')}` : ''}

## Business Context
- **Business**: ${business.name || 'Your Business'}
- **Service Area**: ${business.serviceArea || 'Not specified'}
${contact?.afterHoursPhone || business.phone ? `- **Phone**: ${contact?.afterHoursPhone || business.phone}` : ''}
${business.website ? `- **Website**: ${business.website}` : ''}
${business.timezone ? `- **Timezone**: ${business.timezone}` : ''}
${business.currency ? `- **Currency**: ${business.currency}` : ''}

### Business Hours:
${rules?.businessHours?.mon_fri ? `- Monday-Friday: ${rules.businessHours.mon_fri}` : ''}
${rules?.businessHours?.sat ? `- Saturday: ${rules.businessHours.sat}` : ''}
${rules?.businessHours?.sun ? `- Sunday: ${rules.businessHours.sun}` : ''}

### AI Guidelines:
- **Pricing Discussion**: ${rules?.aiGuardrails?.allowPricing ? 'ALLOWED' : 'NOT ALLOWED - Direct to quote request'}

${rules?.phoneProvider ? `\n### Phone Provider: ${rules.phoneProvider.name}` : ''}
${rules?.crmProvider ? `### CRM: ${rules.crmProvider.name}` : ''}
${rules?.urgentKeywords?.length > 0 ? `\n**Urgent Keywords**: ${rules.urgentKeywords.join(', ')}` : ''}
`;

  // Add voice profile if available
  if (clientData.voiceProfile?.style_profile) {
    const voice = clientData.voiceProfile.style_profile.voice || {};
    const signaturePhrases = clientData.voiceProfile.style_profile.signaturePhrases || [];
    const fewShotExamples = clientData.voiceProfile.style_profile.fewShotExamples || {};
    const learningCount = clientData.voiceProfile.learning_count || 0;

    if (learningCount > 0) {
      behaviorReplyPrompt += `\n## Your Communication Style (Learned from Your Emails)

### Voice Characteristics:
- **Tone**: ${voice.tone || behaviorTone}
- **Empathy Level**: ${((voice.empathyLevel || 0.7) * 100).toFixed(0)}%
- **Formality**: ${((voice.formalityLevel || 0.8) * 100).toFixed(0)}%
- **Directness**: ${((voice.directnessLevel || 0.8) * 100).toFixed(0)}%

### Your Preferred Phrases (Use These Frequently):
${signaturePhrases.slice(0, 10).map((p: { phrase: string; context: string }) => `- "${p.phrase}"${p.context ? ` (${p.context})` : ''}`).join('\n') || '- No learned phrases yet'}

**Important**: Match this style consistently. Use these phrases and patterns to sound like YOU.
`;

      // Add few-shot examples
      const exampleCategories = Object.keys(fewShotExamples);
      if (exampleCategories.length > 0) {
        behaviorReplyPrompt += `\n## Few-Shot Examples from Your Emails\n\nThese are real examples of how you communicate. Use them as reference:\n`;

        exampleCategories.forEach((category) => {
          const examples = fewShotExamples[category];
          if (examples && examples.length > 0) {
            behaviorReplyPrompt += `\n### ${category.toUpperCase()} Examples:\n`;
            examples.slice(0, 2).forEach((ex: { subject: string; body: string }, idx: number) => {
              behaviorReplyPrompt += `\n**Example ${idx + 1}:**\n`;
              if (ex.subject) behaviorReplyPrompt += `Subject: "${ex.subject}"\n`;
              if (ex.body) {
                const preview = ex.body.substring(0, 300);
                behaviorReplyPrompt += `\`\`\`\n${preview}${ex.body.length > 300 ? '...' : ''}\n\`\`\`\n`;
              }
            });
          }
        });
      }
    }
  }

  // Add business-specific rules
  behaviorReplyPrompt += `\n## Important Rules\n`;
  if (business.timezone) {
    behaviorReplyPrompt += `- Use ${business.timezone} timestamps if dates/times are mentioned.\n`;
  }
  behaviorReplyPrompt += `- Never invent facts or prices; use only data provided.\n`;
  behaviorReplyPrompt += `- Correct obvious spelling errors in customer emails when quoting them.\n`;

  if (rules?.aiGuardrails?.allowPricing) {
    behaviorReplyPrompt += `- You MAY discuss pricing as specified in the services section.\n`;
  } else {
    behaviorReplyPrompt += `- You may NOT discuss specific pricing - direct customers to request a quote.\n`;
  }

  if (template.specialRules && template.specialRules.length > 0) {
    behaviorReplyPrompt += `\n### Business-Specific Rules:\n`;
    template.specialRules.forEach((rule: string) => {
      behaviorReplyPrompt += `- ${rule}\n`;
    });
  }

  if (rules?.escalationRules) {
    behaviorReplyPrompt += `\n### Escalation: ${rules.escalationRules}\n`;
  }

  if (template.upsellPrompts && template.upsellPrompts.length > 0) {
    behaviorReplyPrompt += `\n### Upsell Opportunities:\n`;
    template.upsellPrompts.forEach((prompt: string) => {
      behaviorReplyPrompt += `- ${prompt}\n`;
    });
  }

  // Add signature
  behaviorReplyPrompt += `\n## Required Signature\n\n**CRITICAL**: ALWAYS end emails with this EXACT signature. Do NOT use individual staff names or personal sign-offs:\n\n\`\`\`\n`;

  if (clientData.signature) {
    behaviorReplyPrompt += clientData.signature;
  } else if (clientData.voiceProfile?.style_profile?.voice?.signOff) {
    behaviorReplyPrompt += clientData.voiceProfile.style_profile.voice.signOff;
  } else {
    behaviorReplyPrompt += `Thanks for your business!\n\nBest regards,\n${business.name || 'Our Team'}\n`;
    if (contact?.afterHoursPhone || business.phone) behaviorReplyPrompt += `${contact?.afterHoursPhone || business.phone}\n`;
    if (contact?.primaryContactEmail) behaviorReplyPrompt += `${contact.primaryContactEmail}\n`;
    if (business.website) behaviorReplyPrompt += `${business.website}\n`;
  }

  behaviorReplyPrompt += `\`\`\``;
  END OF OLD CODE */ console.log(`✅ Generated gold standard behavior reply prompt (${behaviorReplyPrompt.length} chars)`);
  // BASE REPLACEMENTS
  // Build rich label mapping with metadata for better debugging and future extensibility
  const richLabelMap = {};
  if (clientData.email_labels && Object.keys(clientData.email_labels).length > 0) {
    try {
      // Fetch full label metadata from database
      const { data: labelRecords } = await getSupabaseAdmin().from('email_labels').select('name, gmail_id, outlook_id, created_at, status, color').eq('user_id', userId).eq('status', 'active');
      // Build rich mapping with metadata
      for (const [labelName, labelId] of Object.entries(clientData.email_labels)){
        const labelRecord = labelRecords?.find((r)=>r.gmail_id === labelId || r.outlook_id === labelId || r.name === labelName);
        richLabelMap[labelName] = {
          id: String(labelId),
          name: labelName,
          type: 'user',
          created: labelRecord?.created_at || new Date().toISOString()
        };
      }
      console.log(`✅ Built rich label map with ${Object.keys(richLabelMap).length} labels`);
    } catch (error) {
      console.error('⚠️ Failed to build rich label map, using simple format:', error);
      // Fallback to simple format
      for (const [name, id] of Object.entries(clientData.email_labels)){
        richLabelMap[name] = {
          id: String(id),
          name,
          type: 'user'
        };
      }
    }
  }
  const replacements = {
    // Business info
    '<<<BUSINESS_NAME>>>': business.name || 'Your Business',
    '<<<CONFIG_VERSION>>>': String(version || 1),
    '<<<CLIENT_ID>>>': clientId,
    '<<<USER_ID>>>': clientId,
    '<<<EMAIL_DOMAIN>>>': business.emailDomain || '',
    '<<<CURRENCY>>>': business.currency || 'USD',
    '<<<EXCLUDED_DOMAINS>>>': business.excludedDomains || 'noreply,notification',
    '<<<HOURLY_RATE>>>': String(business.hourlyRate || 25),
    '<<<WORKFLOW_VERSION_ID>>>': String(version || 1),
    '<<<LABEL_MAPPINGS>>>': JSON.stringify(richLabelMap),
    // Credentials
    '<<<CLIENT_GMAIL_CRED_ID>>>': integrations.gmail?.credentialId || '',
    '<<<CLIENT_OUTLOOK_CRED_ID>>>': integrations.outlook?.credentialId || '',
    '<<<CLIENT_POSTGRES_CRED_ID>>>': integrations.postgres?.credentialId || 'mQziputTJekSuLa6',
    '<<<CLIENT_SUPABASE_CRED_ID>>>': integrations.postgres?.credentialId || 'mQziputTJekSuLa6',
    '<<<CLIENT_OPENAI_CRED_ID>>>': integrations.openai?.credentialId || 'openai-shared',
    // Team data
    '<<<MANAGERS_TEXT>>>': managersText,
    '<<<SUPPLIERS>>>': JSON.stringify((clientData.suppliers || []).map((s)=>({
        name: s.name,
        email: s.email,
        category: s.category
      }))),
    // Labels
    '<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {}),
    // Content
    '<<<SIGNATURE_BLOCK>>>': signatureBlock,
    '<<<SERVICE_CATALOG_TEXT>>>': serviceCatalogText,
    // Legacy fields
    '<<<ESCALATION_RULE>>>': rules?.escalationRules || '',
    '<<<REPLY_TONE>>>': behaviorTone,
    '<<<ALLOW_PRICING>>>': String(rules?.aiGuardrails?.allowPricing ?? false),
    // AI Configuration (Layer 1)
    '<<<AI_KEYWORDS>>>': JSON.stringify([
      'urgent',
      'emergency',
      'ASAP',
      'service',
      'quote',
      'leak',
      'broken',
      'not working'
    ]),
    '<<<AI_SYSTEM_MESSAGE>>>': aiSystemMessage,
    '<<<AI_CLASSIFICATION_PROMPT>>>': aiSystemMessage,
    '<<<AI_REPLY_BEHAVIOR_PROMPT>>>': behaviorReplyPrompt,
    '<<<AI_CLASSIFIER_MODEL>>>': 'gpt-4o-mini',
    '<<<AI_DRAFT_MODEL>>>': 'gpt-4o-mini',
    '<<<AI_INTENT_MAPPING>>>': JSON.stringify({
      'ai.emergency_request': 'URGENT',
      'ai.service_request': 'SALES',
      'ai.support_request': 'SUPPORT',
      'ai.billing_inquiry': 'BILLING',
      'ai.recruitment': 'RECRUITMENT'
    }),
    '<<<AI_CLASSIFICATION_RULES>>>': 'See system message for classification rules',
    '<<<AI_ESCALATION_RULES>>>': rules?.escalationRules || 'Escalate all URGENT emails immediately',
    '<<<AI_CATEGORIES>>>': 'URGENT, SALES, SUPPORT, MANAGER, RECRUITMENT, BILLING, MISC',
    '<<<AI_BUSINESS_TYPES>>>': businessTypesText,
    // Behavior Configuration (Layer 2)
    '<<<BEHAVIOR_VOICE_TONE>>>': behaviorTone,
    '<<<BEHAVIOR_FORMALITY>>>': 'professional',
    '<<<BEHAVIOR_ALLOW_PRICING>>>': String(rules?.aiGuardrails?.allowPricing ?? false),
    '<<<BEHAVIOR_UPSELL_TEXT>>>': rules?.upsellGuidelines || '',
    '<<<BEHAVIOR_FOLLOWUP_TEXT>>>': rules?.followUpGuidelines || '',
    '<<<BEHAVIOR_GOALS>>>': '1. Acknowledge request\n2. Provide helpful info\n3. Clear next steps',
    '<<<BEHAVIOR_REPLY_PROMPT>>>': behaviorReplyPrompt,
    '<<<BEHAVIOR_CATEGORY_OVERRIDES>>>': JSON.stringify({}),
    '<<<BEHAVIOR_SIGNATURE_TEMPLATE>>>': signatureBlock,
    // Supabase Configuration
    '<<<SUPABASE_URL>>>': SUPABASE_URL || '',
    '<<<SUPABASE_ANON_KEY>>>': Deno.env.get('SUPABASE_ANON_KEY') || ''
  };
  // DYNAMIC LABEL ID INJECTION (Layer 3)
  // Add individual label IDs for routing nodes
  if (clientData.email_labels) {
    for (const [labelName, labelId] of Object.entries(clientData.email_labels)){
      // Convert label name to placeholder format: "URGENT" → "<<<LABEL_URGENT_ID>>>"
      const placeholderKey = `<<<LABEL_${String(labelName).toUpperCase().replace(/\s+/g, '_').replace(/\//g, '_')}_ID>>>`;
      replacements[placeholderKey] = String(labelId);
    }
  }
  // Apply all replacements with proper JSON escaping
  for (const [ph, val] of Object.entries(replacements)){
    let safe = val == null ? '' : String(val);
    // Escape JSON special characters for string values that will be inside JSON strings
    // (backslashes, quotes, newlines, etc.)
    safe = safe.replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
    .replace(/\f/g, '\\f') // Escape form feeds
    .replace(/\b/g, '\\b'); // Escape backspaces
    // Escape special regex characters in placeholder
    const escapedPh = ph.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    templateString = templateString.replace(new RegExp(escapedPh, 'g'), safe);
  }
  
  // CRITICAL FIX: Add error handling for JSON.parse to prevent silent failures
  try {
    const parsedTemplate = JSON.parse(templateString);
    console.log(`✅ Template injection completed successfully`);
    console.log(`🔍 Parsed template has connections:`, !!parsedTemplate.connections);
    console.log(`🔍 Parsed template connections keys:`, parsedTemplate.connections ? Object.keys(parsedTemplate.connections) : 'No connections');
    return parsedTemplate;
  } catch (error) {
    console.error(`❌ CRITICAL: JSON.parse failed after template injection:`, error);
    console.error(`🔍 Template string preview (first 500 chars):`, templateString.substring(0, 500));
    console.error(`🔍 Template string preview (last 500 chars):`, templateString.substring(Math.max(0, templateString.length - 500)));
    
    // Try to identify which replacement caused the issue
    const problematicReplacements = Object.entries(replacements)
      .filter(([placeholder, value]) => {
        // Look for values that might cause JSON issues
        return value && typeof value === 'string' && (
          value.includes('\\') && !value.includes('\\\\') || // Unescaped backslashes
          value.includes('"') && !value.includes('\\"') ||  // Unescaped quotes
          value.includes('\n') && !value.includes('\\n') || // Unescaped newlines
          placeholder.includes('BEHAVIOR_REPLY_PROMPT') ||    // Large prompt that might have issues
          placeholder.includes('AI_SYSTEM_MESSAGE')          // Large AI message
        );
      });
    
    if (problematicReplacements.length > 0) {
      console.error(`🔍 Potentially problematic replacements:`, problematicReplacements.map(([p, v]) => ({
        placeholder: p,
        valueLength: v.length,
        valuePreview: v.substring(0, 200)
      })));
    }
    
    throw new Error(`Template injection failed: Invalid JSON after replacements - ${error.message}`);
  }
}
/**
 * Sync database labels with actual email box state
 * Removes invalid label IDs and updates the database to match reality
 */ async function syncDatabaseWithEmailBox(userId, accessToken, provider) {
  try {
    console.log(`🔄 Syncing database with actual ${provider} email box state...`);
    // Get current labels from email box
    const currentLabels = await getCurrentEmailLabels(accessToken, provider);
    const currentLabelIds = new Set(currentLabels.map((label)=>label.id));
    const currentLabelNames = new Set(currentLabels.map((label)=>label.name));
    console.log(`📊 Found ${currentLabels.length} actual labels in ${provider} email box`);
    // Get stored labels from database
    const { data: storedLabels, error: dbError } = await getSupabaseAdmin().from('email_labels').select('name, gmail_id, status').eq('user_id', userId).eq('status', 'active');
    if (dbError) {
      console.error('❌ Failed to fetch stored labels:', dbError);
      return {
        validLabels: [],
        invalidLabels: []
      };
    }
    console.log(`📋 Found ${storedLabels?.length || 0} stored labels in database`);
    // Separate valid and invalid labels
    const validLabels = [];
    const missingLabels = []; // Labels that need to be recreated
    const recreatedLabels = [];
    for (const storedLabel of storedLabels || []){
      const labelId = storedLabel.gmail_id;
      const labelName = storedLabel.name;
      // Check if the label ID still exists in the email box
      if (currentLabelIds.has(labelId)) {
        // Label ID is valid
        validLabels.push(storedLabel);
        console.log(`✅ Label ID valid: ${labelName} (${labelId})`);
      } else if (currentLabelNames.has(labelName)) {
        // Label name exists but ID changed (label was recreated)
        const actualLabel = currentLabels.find((l)=>l.name === labelName);
        if (actualLabel) {
          console.log(`🔄 Label ID changed: ${labelName} (${labelId} -> ${actualLabel.id})`);
          // Update the database with the new ID
          await getSupabaseAdmin().from('email_labels').update({
            gmail_id: actualLabel.id
          }).eq('user_id', userId).eq('name', labelName);
          validLabels.push({
            ...storedLabel,
            gmail_id: actualLabel.id
          });
        }
      } else {
        // Label doesn't exist in email box - needs to be recreated
        console.log(`🔄 Label missing from email box: ${labelName} (${labelId}) - will recreate`);
        missingLabels.push(storedLabel);
      }
    }
    // Recreate missing labels in email box
    if (missingLabels.length > 0) {
      console.log(`🔄 Recreating ${missingLabels.length} missing labels in email box...`);
      for (const missingLabel of missingLabels){
        try {
          console.log(`🔄 Recreating label: ${missingLabel.name}`);
          // Create the label in the email box
          const result = await createLabelWithColor(accessToken, missingLabel.name, missingLabel.color || null, null, provider);
          if (result.success) {
            // Update database with new label ID
            await getSupabaseAdmin().from('email_labels').update({
              gmail_id: result.id,
              status: 'active'
            }).eq('user_id', userId).eq('name', missingLabel.name);
            recreatedLabels.push({
              ...missingLabel,
              gmail_id: result.id
            });
            console.log(`✅ Recreated label: ${missingLabel.name} (${result.id})`);
          } else {
            console.warn(`⚠️ Failed to recreate label: ${missingLabel.name} (${result.status})`);
          }
        } catch (error) {
          console.error(`❌ Error recreating label "${missingLabel.name}":`, error.message);
        // Continue with other labels instead of failing completely
        }
      }
      console.log(`✅ Recreated ${recreatedLabels.length}/${missingLabels.length} missing labels`);
    }
    // Also add any new labels that exist in email box but not in database
    const newLabels = [];
    for (const currentLabel of currentLabels){
      const existsInDb = (storedLabels || []).some((stored)=>stored.name === currentLabel.name || stored.gmail_id === currentLabel.id);
      if (!existsInDb) {
        console.log(`🆕 New label found in email box: ${currentLabel.name} (${currentLabel.id})`);
        newLabels.push(currentLabel);
        // Add to database
        await getSupabaseAdmin().from('email_labels').insert({
          user_id: userId,
          name: currentLabel.name,
          gmail_id: currentLabel.id,
          color: currentLabel.color || null,
          status: 'active',
          created_at: new Date().toISOString()
        });
      }
    }
    if (newLabels.length > 0) {
      console.log(`✅ Added ${newLabels.length} new labels to database`);
    }
    console.log(`🎯 Sync complete: ${validLabels.length} valid, ${missingLabels.length} missing, ${recreatedLabels.length} recreated, ${newLabels.length} new`);
    return {
      validLabels,
      missingLabels,
      recreatedLabels,
      newLabels,
      totalCurrentLabels: currentLabels.length
    };
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    return {
      validLabels: [],
      missingLabels: [],
      recreatedLabels: [],
      newLabels: [],
      totalCurrentLabels: 0
    };
  }
}
/**
 * Refresh OAuth token for a provider
 */ async function refreshOAuthToken(refreshToken, provider) {
  let tokenUrl;
  let clientId;
  let clientSecret;
  if (provider === 'gmail') {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    clientId = GMAIL_CLIENT_ID;
    clientSecret = GMAIL_CLIENT_SECRET;
  } else if (provider === 'outlook') {
    tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    clientId = Deno.env.get('OUTLOOK_CLIENT_ID') || Deno.env.get('MICROSOFT_CLIENT_ID') || '';
    clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET') || Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';
  } else {
    throw new Error(`Unsupported provider for token refresh: ${provider}`);
  }
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');
  if (provider === 'outlook') {
    params.append('scope', 'Mail.ReadWrite Mail.Send offline_access');
  }
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }
  return await response.json();
}
/**
 * Provision email labels/folders for the user
 * Supports both Gmail and Outlook with business-specific schemas
 */ async function provisionEmailLabels(userId, provider, businessTypes, businessName) {
  try {
    console.log(`🏷️ Provisioning ${provider} labels for business types: ${businessTypes.join(', ')}`);
    // Get user profile for managers and suppliers
    const { data: profile } = await getSupabaseAdmin().from('profiles').select('managers, suppliers').eq('id', userId).single();
    const managers = profile?.managers || [];
    const suppliers = profile?.suppliers || [];
    console.log(`📋 Dynamic values: ${managers.length} managers, ${suppliers.length} suppliers`);
    // Get integration for access token
    // Try normalized provider first, then alternate variation
    let integration;
    const { data: primaryIntegration } = await getSupabaseAdmin().from('integrations').select('access_token, refresh_token, n8n_credential_id').eq('user_id', userId).eq('provider', provider).eq('status', 'active').maybeSingle();
    if (primaryIntegration) {
      integration = primaryIntegration;
    } else {
      // Fallback: Try alternate provider name
      const alternateProvider = provider === 'gmail' ? 'google' : provider === 'outlook' ? 'microsoft' : null;
      if (alternateProvider) {
        console.log(`⚠️ Provisioning: Trying alternate provider name: ${alternateProvider}`);
        const { data: alternateIntegration } = await getSupabaseAdmin().from('integrations').select('access_token, refresh_token, n8n_credential_id').eq('user_id', userId).eq('provider', alternateProvider).eq('status', 'active').maybeSingle();
        if (alternateIntegration) {
          integration = alternateIntegration;
          console.log(`✅ Found integration with alternate provider: ${alternateProvider}`);
        }
      }
    }
    if (!integration) {
      throw new Error(`No active ${provider} integration found`);
    }
    // Refresh token if needed before provisioning
    let accessToken = integration.access_token;
    if (integration.refresh_token) {
      try {
        console.log(`🔄 Refreshing ${provider} token before provisioning...`);
        const refreshedToken = await refreshOAuthToken(integration.refresh_token, provider);
        if (refreshedToken && refreshedToken.access_token) {
          accessToken = refreshedToken.access_token;
          console.log(`✅ Token refreshed successfully for ${provider}`);
          // Update the integration with the new token
          await getSupabaseAdmin().from('integrations').update({
            access_token: refreshedToken.access_token,
            updated_at: new Date().toISOString()
          }).eq('user_id', userId).eq('provider', provider).eq('status', 'active');
        }
      } catch (tokenError) {
        console.warn(`⚠️ Token refresh failed for ${provider}, using existing token:`, tokenError.message);
      // Continue with existing token - if it's expired, the API calls will fail gracefully
      }
    }
    // Load schema for business type
    const businessType = businessTypes[0] || 'General';
    const schema = await loadLabelSchema(businessType);
    // Replace dynamic placeholders
    const processedSchema = replaceDynamicPlaceholders(schema, managers, suppliers);
    console.log(`📋 Processing schema: ${processedSchema.labels.length} parent categories`);
    // FIRST: Sync database with actual email box state
    const syncResult = await syncDatabaseWithEmailBox(userId, accessToken, provider);
    console.log(`🔄 Database sync result: ${syncResult.validLabels.length} valid, ${syncResult.missingLabels.length} missing, ${syncResult.recreatedLabels.length} recreated, ${syncResult.newLabels.length} new`);
    // Get current email labels/folders (after sync)
    const currentLabels = await getCurrentEmailLabels(accessToken, provider);
    const currentLabelNames = new Set(currentLabels.map((label)=>label.name));
    console.log(`📊 Found ${currentLabelNames.size} existing labels/folders after sync`);
    // Build expected label list
    const expectedLabels = buildExpectedLabelList(processedSchema);
    const missingLabels = expectedLabels.filter((labelName)=>!currentLabelNames.has(labelName));
    console.log(`❌ Missing ${missingLabels.length} labels that need to be created`);
    if (missingLabels.length === 0) {
      console.log('✅ All labels already exist, no provisioning needed');
      return;
    }
    // Create missing labels
    const createdLabels = {};
    let successCount = 0;
    for (const parentLabel of processedSchema.labels){
      // Create parent label
      if (!currentLabelNames.has(parentLabel.name)) {
        try {
          console.log(`🔄 Creating parent label: ${parentLabel.name}`);
          const result = await createLabelWithColor(accessToken, parentLabel.name, parentLabel.color, null, provider);
          if (result.success) {
            createdLabels[parentLabel.name] = {
              id: result.id,
              name: parentLabel.name,
              color: parentLabel.color,
              type: 'user',
              created: new Date().toISOString()
            };
            successCount++;
            console.log(`✅ Created parent label: ${parentLabel.name}`);
          } else {
            console.warn(`⚠️ Failed to create parent label: ${parentLabel.name} (${result.status})`);
          }
        } catch (error) {
          console.error(`❌ Error creating parent label "${parentLabel.name}":`, error.message);
        // Continue with other labels instead of failing completely
        }
      }
      // Create sub-labels
      if (parentLabel.sub && Array.isArray(parentLabel.sub)) {
        for (const subLabel of parentLabel.sub){
          const subName = typeof subLabel === 'string' ? subLabel : subLabel.name;
          const fullSubName = `${parentLabel.name}/${subName}`;
          if (!currentLabelNames.has(fullSubName)) {
            try {
              console.log(`🔄 Creating sub-label: ${fullSubName}`);
              const result = await createLabelWithColor(accessToken, fullSubName, parentLabel.color, null, provider);
              if (result.success) {
                createdLabels[fullSubName] = {
                  id: result.id,
                  name: fullSubName,
                  color: parentLabel.color,
                  type: 'user',
                  created: new Date().toISOString()
                };
                successCount++;
                console.log(`  ✅ Created sub-label: ${fullSubName}`);
              } else {
                console.warn(`⚠️ Failed to create sub-label: ${fullSubName} (${result.status})`);
              }
            } catch (error) {
              console.error(`❌ Error creating sub-label "${fullSubName}":`, error.message);
            // Continue with other labels instead of failing completely
            }
          }
          // Create nested labels (3rd level)
          if (typeof subLabel === 'object' && subLabel.sub && Array.isArray(subLabel.sub)) {
            for (const tertiaryLabel of subLabel.sub){
              const tertiaryName = typeof tertiaryLabel === 'string' ? tertiaryLabel : tertiaryLabel.name;
              const fullTertiaryName = `${parentLabel.name}/${subName}/${tertiaryName}`;
              if (!currentLabelNames.has(fullTertiaryName)) {
                try {
                  console.log(`🔄 Creating nested label: ${fullTertiaryName}`);
                  const result = await createLabelWithColor(accessToken, fullTertiaryName, parentLabel.color, null, provider);
                  if (result.success) {
                    createdLabels[fullTertiaryName] = {
                      id: result.id,
                      name: fullTertiaryName,
                      color: parentLabel.color,
                      type: 'user',
                      created: new Date().toISOString()
                    };
                    successCount++;
                    console.log(`    ✅ Created nested label: ${fullTertiaryName}`);
                  } else {
                    console.warn(`⚠️ Failed to create nested label: ${fullTertiaryName} (${result.status})`);
                  }
                } catch (error) {
                  console.error(`❌ Error creating nested label "${fullTertiaryName}":`, error.message);
                // Continue with other labels instead of failing completely
                }
              }
            }
          }
        }
      }
    }
    // Update database with created labels
    if (Object.keys(createdLabels).length > 0) {
      await getSupabaseAdmin().from('email_labels').upsert(Object.entries(createdLabels).map(([name, labelData])=>({
          user_id: userId,
          name: name,
          gmail_id: labelData.id,
          color: labelData.color,
          status: 'active',
          created_at: labelData.created
        })), {
        onConflict: 'user_id,name'
      });
      // Also update the profile's email_labels field for workflow deployment
      // First, get existing labels from the database
      const { data: existingLabels } = await getSupabaseAdmin().from('email_labels').select('name, gmail_id').eq('user_id', userId).eq('status', 'active');
      // Build complete label map (existing + newly created)
      const existingLabelMap = Object.fromEntries((existingLabels || []).map((label)=>[
          label.name,
          label.gmail_id
        ]));
      const newLabelMap = Object.fromEntries(Object.entries(createdLabels).map(([name, labelData])=>[
          name,
          labelData.id
        ]));
      const completeLabelMap = {
        ...existingLabelMap,
        ...newLabelMap
      };
      await getSupabaseAdmin().from('profiles').update({
        email_labels: completeLabelMap
      }).eq('id', userId);
      console.log(`✅ Updated profile email_labels with ${Object.keys(completeLabelMap).length} total mappings (${Object.keys(newLabelMap).length} new)`);
      console.log(`✅ Database updated with ${Object.keys(createdLabels).length} new labels`);
    } else {
      // No new labels created, but ensure profile has correct email_labels mapping
      const { data: existingLabels } = await getSupabaseAdmin().from('email_labels').select('name, gmail_id').eq('user_id', userId).eq('status', 'active');
      if (existingLabels && existingLabels.length > 0) {
        const labelMap = Object.fromEntries(existingLabels.map((label)=>[
            label.name,
            label.gmail_id
          ]));
        await getSupabaseAdmin().from('profiles').update({
          email_labels: labelMap
        }).eq('id', userId);
        console.log(`✅ Updated profile email_labels with ${Object.keys(labelMap).length} existing mappings`);
      }
    }
    console.log(`🎉 Provisioning complete: ${successCount} labels created`);
    // Return success even if some labels failed - partial success is better than complete failure
    return {
      success: true,
      labelsCreated: successCount,
      totalAttempted: missingLabels.length,
      createdLabels: Object.keys(createdLabels).length,
      syncResult: {
        validLabels: syncResult.validLabels.length,
        missingLabels: syncResult.missingLabels.length,
        recreatedLabels: syncResult.recreatedLabels.length,
        newLabels: syncResult.newLabels.length,
        totalCurrentLabels: syncResult.totalCurrentLabels
      }
    };
  } catch (error) {
    console.error('❌ Email label provisioning failed:', error);
    // Don't throw error - let workflow deployment continue even if provisioning fails
    console.warn('⚠️ Continuing with workflow deployment despite provisioning failure');
    return {
      success: false,
      error: error.message,
      labelsCreated: 0,
      syncResult: {
        validLabels: 0,
        missingLabels: 0,
        recreatedLabels: 0,
        newLabels: 0,
        totalCurrentLabels: 0
      },
      totalAttempted: 0,
      createdLabels: 0
    };
  }
}
/**
 * Normalize provider name to handle variations
 * Handles: 'google' → 'gmail', 'microsoft' → 'outlook'
 */ function normalizeProvider(provider) {
  const normalized = provider.toLowerCase().trim();
  // Handle variations
  if (normalized === 'google') return 'gmail';
  if (normalized === 'microsoft') return 'outlook';
  // Already normalized
  return normalized;
}
/**
 * Load label schema for business type dynamically
 */ async function loadLabelSchema(businessType) {
  try {
    // Try to load from external schema file first
    const schemaUrl = `https://raw.githubusercontent.com/your-org/fwqv2-schemas/main/${encodeURIComponent(businessType)}.json`;
    try {
      const response = await fetch(schemaUrl);
      if (response.ok) {
        const schema = await response.json();
        console.log(`✅ Loaded schema for "${businessType}" from external source`);
        return schema;
      }
    } catch (fetchError) {
      console.log(`⚠️ Could not load external schema for "${businessType}", using fallback`);
    }
    // Fallback: Try to load from Supabase storage or database
    // This could be a table like 'business_schemas' or a file in Supabase Storage
    // Final fallback: Use base schema with dynamic business type extension
    return await loadBaseSchemaWithExtension(businessType);
  } catch (error) {
    console.error(`❌ Failed to load schema for "${businessType}":`, error);
    // Return minimal fallback schema
    return {
      labels: [
        {
          name: 'BANKING',
          color: {
            backgroundColor: '#4285f4',
            textColor: '#ffffff'
          },
          sub: []
        },
        {
          name: 'FORMS',
          color: {
            backgroundColor: '#34a853',
            textColor: '#ffffff'
          },
          sub: []
        },
        {
          name: 'REVIEWS',
          color: {
            backgroundColor: '#fbbc04',
            textColor: '#000000'
          },
          sub: []
        },
        {
          name: 'SALES',
          color: {
            backgroundColor: '#9c27b0',
            textColor: '#ffffff'
          },
          sub: []
        },
        {
          name: 'SUPPORT',
          color: {
            backgroundColor: '#00bcd4',
            textColor: '#ffffff'
          },
          sub: []
        },
        {
          name: 'URGENT',
          color: {
            backgroundColor: '#f44336',
            textColor: '#ffffff'
          },
          sub: []
        },
        {
          name: 'MISC',
          color: {
            backgroundColor: '#607d8b',
            textColor: '#ffffff'
          },
          sub: []
        }
      ]
    };
  }
}
/**
 * Load base schema with dynamic business type extension
 */ async function loadBaseSchemaWithExtension(businessType) {
  // Base universal labels
  const baseLabels = [
    {
      name: 'BANKING',
      color: {
        backgroundColor: '#4285f4',
        textColor: '#ffffff'
      },
      sub: [
        'BankAlert',
        'e-Transfer',
        'Invoice',
        'Receipts',
        'Refund'
      ]
    },
    {
      name: 'FORMS',
      color: {
        backgroundColor: '#34a853',
        textColor: '#ffffff'
      },
      sub: [
        'New Submission',
        'Service Requests'
      ]
    },
    {
      name: 'REVIEWS',
      color: {
        backgroundColor: '#fbbc04',
        textColor: '#000000'
      },
      sub: [
        'New Review',
        'Response Needed'
      ]
    },
    {
      name: 'MANAGER',
      color: {
        backgroundColor: '#ea4335',
        textColor: '#ffffff'
      },
      sub: [
        'Unassigned',
        'Escalations'
      ]
    },
    {
      name: 'SALES',
      color: {
        backgroundColor: '#9c27b0',
        textColor: '#ffffff'
      },
      sub: [
        'Quotes',
        'Consultations',
        'Follow-ups'
      ]
    },
    {
      name: 'SUPPLIERS',
      color: {
        backgroundColor: '#ff9800',
        textColor: '#ffffff'
      },
      sub: []
    },
    {
      name: 'SUPPORT',
      color: {
        backgroundColor: '#00bcd4',
        textColor: '#ffffff'
      },
      sub: [
        'General',
        'Technical Support',
        'Appointment Scheduling'
      ]
    },
    {
      name: 'URGENT',
      color: {
        backgroundColor: '#f44336',
        textColor: '#ffffff'
      },
      sub: [
        'Emergency Repairs',
        'Safety Issues'
      ]
    },
    {
      name: 'MISC',
      color: {
        backgroundColor: '#607d8b',
        textColor: '#ffffff'
      },
      sub: [
        'General',
        'Archive'
      ]
    },
    {
      name: 'PHONE',
      color: {
        backgroundColor: '#3f51b5',
        textColor: '#ffffff'
      },
      sub: [
        'Incoming Calls',
        'Voicemails'
      ]
    },
    {
      name: 'PROMO',
      color: {
        backgroundColor: '#e91e63',
        textColor: '#ffffff'
      },
      sub: [
        'Email Campaigns',
        'Special Offers'
      ]
    },
    {
      name: 'RECRUITMENT',
      color: {
        backgroundColor: '#8bc34a',
        textColor: '#000000'
      },
      sub: [
        'Applications',
        'Interviews',
        'New Hires'
      ]
    },
    {
      name: 'SOCIAL',
      color: {
        backgroundColor: '#673ab7',
        textColor: '#ffffff'
      },
      sub: [
        'Facebook',
        'Instagram',
        'LinkedIn'
      ]
    }
  ];
  // Try to load from Supabase database first
  try {
    const { data: schemaData } = await getSupabaseAdmin().from('business_schemas').select('schema_data').eq('business_type', businessType).eq('status', 'active').single();
    if (schemaData?.schema_data) {
      console.log(`✅ Loaded schema for "${businessType}" from database`);
      return schemaData.schema_data;
    }
  } catch (dbError) {
    console.log(`⚠️ Could not load schema for "${businessType}" from database, using base schema`);
  }
  // Fallback: Use base schema with business type-specific extensions
  // This allows for dynamic extension without hardcoding all business types
  const extendedSchema = extendBaseSchemaForBusinessType(baseLabels, businessType);
  return {
    labels: extendedSchema
  };
}
/**
 * Extend base schema with business type-specific labels
 */ function extendBaseSchemaForBusinessType(baseLabels, businessType) {
  // Create a copy of base labels
  let extendedLabels = [
    ...baseLabels
  ];
  // Add business type-specific labels based on common patterns
  const businessTypeLower = businessType.toLowerCase();
  if (businessTypeLower.includes('hot tub') || businessTypeLower.includes('spa')) {
    extendedLabels.push({
      name: 'SEASONAL',
      color: {
        backgroundColor: '#795548',
        textColor: '#ffffff'
      },
      sub: [
        'Winterization',
        'Spring Start-up',
        'Annual Service'
      ]
    });
  }
  if (businessTypeLower.includes('hvac')) {
    extendedLabels.push({
      name: 'SERVICE',
      color: {
        backgroundColor: '#2196f3',
        textColor: '#ffffff'
      },
      sub: [
        'Emergency Heating',
        'Emergency Cooling',
        'Seasonal Maintenance',
        'New Installations'
      ]
    }, {
      name: 'WARRANTY',
      color: {
        backgroundColor: '#a479e2',
        textColor: '#ffffff'
      },
      sub: [
        'Claims',
        'Pending Review',
        'Approved',
        'Denied',
        'Parts Replacement'
      ]
    });
  }
  if (businessTypeLower.includes('roofing')) {
    extendedLabels.push({
      name: 'INSPECTIONS',
      color: {
        backgroundColor: '#a479e2',
        textColor: '#ffffff'
      },
      sub: [
        'Initial Inspections',
        'Pre-Install Inspections',
        'Post-Repair Inspections',
        'Drone Reports'
      ]
    }, {
      name: 'PROJECTS',
      color: {
        backgroundColor: '#2196f3',
        textColor: '#ffffff'
      },
      sub: [
        'Active Jobs',
        'Shingle Installations',
        'Metal Roofing',
        'Flat Roofing',
        'Gutter Work'
      ]
    }, {
      name: 'INSURANCE',
      color: {
        backgroundColor: '#ff5722',
        textColor: '#ffffff'
      },
      sub: [
        'New Claims',
        'In Progress',
        'Approved',
        'Denied',
        'Adjuster Communication'
      ]
    });
  }
  if (businessTypeLower.includes('landscaping')) {
    extendedLabels.push({
      name: 'PROJECTS',
      color: {
        backgroundColor: '#2196f3',
        textColor: '#ffffff'
      },
      sub: [
        'Active Jobs',
        'Surface Prep',
        'Site Planning',
        'Hardscape Installations'
      ]
    }, {
      name: 'MAINTENANCE',
      color: {
        backgroundColor: '#795548',
        textColor: '#ffffff'
      },
      sub: [
        'Lawn Care',
        'Tree Trimming',
        'Garden Maintenance',
        'Irrigation Services'
      ]
    }, {
      name: 'ESTIMATES',
      color: {
        backgroundColor: '#9e9e9e',
        textColor: '#ffffff'
      },
      sub: [
        'Pending Estimates',
        'Approved Estimates',
        'Revisions'
      ]
    });
  }
  if (businessTypeLower.includes('flooring')) {
    extendedLabels.push({
      name: 'INSTALLATIONS',
      color: {
        backgroundColor: '#2196f3',
        textColor: '#ffffff'
      },
      sub: [
        'Hardwood Installation',
        'Laminate Installation',
        'Tile Installation',
        'Carpet Installation',
        'Vinyl Plank Installation'
      ]
    }, {
      name: 'PROJECTS',
      color: {
        backgroundColor: '#00897b',
        textColor: '#ffffff'
      },
      sub: [
        'Active Jobs',
        'Pending Start',
        'Completed Jobs'
      ]
    });
  }
  if (businessTypeLower.includes('construction')) {
    extendedLabels.push({
      name: 'PROJECTS',
      color: {
        backgroundColor: '#2196f3',
        textColor: '#ffffff'
      },
      sub: [
        'Active Projects',
        'Pending Approval',
        'Completed Projects',
        'Change Orders',
        'Site Updates'
      ]
    }, {
      name: 'PERMITS',
      color: {
        backgroundColor: '#a479e2',
        textColor: '#ffffff'
      },
      sub: [
        'Permit Requests',
        'Inspections',
        'City Correspondence',
        'Compliance Docs'
      ]
    }, {
      name: 'SAFETY',
      color: {
        backgroundColor: '#ff5722',
        textColor: '#ffffff'
      },
      sub: [
        'Incident Reports',
        'Safety Meetings',
        'Equipment Failures',
        'Worksite Hazards'
      ]
    });
  }
  return extendedLabels;
}
/**
 * Replace dynamic placeholders in schema
 */ function replaceDynamicPlaceholders(schema, managers, suppliers) {
  const processedLabels = schema.labels.map((label)=>{
    if (label.name === 'MANAGER' && managers.length > 0) {
      return {
        ...label,
        sub: [
          ...label.sub || [],
          ...managers.map((m)=>m.name)
        ]
      };
    }
    if (label.name === 'SUPPLIERS' && suppliers.length > 0) {
      return {
        ...label,
        sub: [
          ...label.sub || [],
          ...suppliers.map((s)=>s.name)
        ]
      };
    }
    return label;
  });
  return {
    ...schema,
    labels: processedLabels
  };
}
/**
 * Get current email labels/folders
 */ async function getCurrentEmailLabels(accessToken, provider) {
  let apiUrl;
  if (provider === 'gmail') {
    apiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/labels';
  } else if (provider === 'outlook') {
    apiUrl = 'https://graph.microsoft.com/v1.0/me/mailFolders';
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`${provider.toUpperCase()} API request failed: Token expired or invalid (401) - ${errorText}`);
    }
    throw new Error(`${provider.toUpperCase()} API request failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  if (provider === 'gmail') {
    const labels = data.labels || [];
    const systemLabels = [
      'INBOX',
      'SENT',
      'DRAFT',
      'SPAM',
      'TRASH',
      'UNREAD',
      'STARRED',
      'IMPORTANT'
    ];
    return labels.filter((label)=>label.type === 'user' && !label.id.startsWith('CATEGORY_') && !systemLabels.includes(label.id));
  } else if (provider === 'outlook') {
    const folders = data.value || [];
    const systemFolders = [
      'inbox',
      'sentitems',
      'drafts',
      'junkemail',
      'deleteditems',
      'archive'
    ];
    return folders.filter((folder)=>!systemFolders.includes(folder.displayName.toLowerCase()));
  }
  return [];
}
/**
 * Create email label/folder with color
 */ async function createLabelWithColor(accessToken, labelName, color, parentId, provider) {
  // Validate label name for Gmail
  if (provider === 'gmail') {
    // Gmail label name validation
    if (labelName.length > 100) {
      throw new Error(`Label name too long: ${labelName} (max 100 characters)`);
    }
    if (labelName.includes('GOOGLE') || labelName.includes('GMAIL')) {
      throw new Error(`Label name contains reserved word: ${labelName}`);
    }
    // Remove any problematic characters
    const cleanLabelName = labelName.replace(/[^\w\s\/\-&]/g, '').trim();
    if (cleanLabelName !== labelName) {
      console.warn(`⚠️ Cleaned label name: "${labelName}" -> "${cleanLabelName}"`);
      labelName = cleanLabelName;
    }
  }
  let apiUrl;
  let requestBody;
  if (provider === 'gmail') {
    requestBody = {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    };
    if (color && color.backgroundColor) {
      requestBody.color = {
        backgroundColor: color.backgroundColor,
        textColor: color.textColor || '#ffffff'
      };
    }
    apiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/labels';
  } else if (provider === 'outlook') {
    requestBody = {
      displayName: labelName
    };
    if (color && color.backgroundColor) {
      requestBody.color = color.backgroundColor;
    }
    apiUrl = 'https://graph.microsoft.com/v1.0/me/mailFolders';
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  if (response.ok) {
    const labelData = await response.json();
    return {
      success: true,
      id: labelData.id,
      status: 'created'
    };
  } else if (response.status === 409) {
    return {
      success: false,
      id: null,
      status: 'already_exists'
    };
  } else {
    const errorText = await response.text();
    console.error(`❌ ${provider.toUpperCase()} API Error ${response.status}:`, errorText);
    console.error(`❌ Request body was:`, JSON.stringify(requestBody, null, 2));
    if (response.status === 401) {
      throw new Error(`Failed to create ${provider} label: Token expired or invalid (401) - Please reconnect your email account`);
    } else if (response.status === 403) {
      throw new Error(`Failed to create ${provider} label: Insufficient permissions (403) - Please check your email account permissions`);
    } else if (response.status === 400) {
      throw new Error(`Failed to create ${provider} label: Invalid request (400) - ${errorText}`);
    } else {
      throw new Error(`Failed to create ${provider} label: ${response.status} - ${errorText}`);
    }
  }
}
/**
 * Build complete expected label list from schema
 */ function buildExpectedLabelList(schema) {
  const expectedLabels = [];
  for (const parentLabel of schema.labels){
    expectedLabels.push(parentLabel.name);
    if (parentLabel.sub && Array.isArray(parentLabel.sub)) {
      for (const subLabel of parentLabel.sub){
        const subName = typeof subLabel === 'string' ? subLabel : subLabel.name;
        expectedLabels.push(`${parentLabel.name}/${subName}`);
        if (typeof subLabel === 'object' && subLabel.sub && Array.isArray(subLabel.sub)) {
          for (const tertiaryLabel of subLabel.sub){
            const tertiaryName = typeof tertiaryLabel === 'string' ? tertiaryLabel : tertiaryLabel.name;
            expectedLabels.push(`${parentLabel.name}/${subName}/${tertiaryName}`);
          }
        }
      }
    }
  }
  return expectedLabels;
}

// CORS headers helper function
function getCorsHeaders(additionalHeaders = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}

/**
 * NEW SIMPLIFIED DEPLOYMENT APPROACH
 * This function handles n8n workflow deployment in a more robust, step-by-step manner
 */
async function deployWorkflowRobust(userId, provider = 'gmail') {
  console.log(`🚀 Starting robust deployment for user ${userId} with provider ${provider}`);
  
  try {
    // STEP 1: Get basic user data
    console.log('📋 Step 1: Fetching user profile...');
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('client_config, managers, suppliers, email_labels, business_types')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile?.client_config) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message || 'No profile found'}`);
    }
    
    const businessName = profile.client_config?.business?.name || 'Client';
    const businessSlug = slugify(businessName, 'client');
    const clientShort = String(userId).replace(/-/g, '').slice(0, 5);
    
    // STEP 2: Get integration data
    console.log('🔗 Step 2: Fetching email integration...');
    const { data: integration } = await getSupabaseAdmin()
      .from('integrations')
      .select('access_token, refresh_token, provider, status, n8n_credential_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .maybeSingle();
    
    if (!integration) {
      throw new Error(`No active ${provider} integration found for user ${userId}`);
    }
    
    // STEP 3: Ensure credentials exist
    console.log('🔐 Step 3: Ensuring n8n credentials...');
    let credentialId = integration.n8n_credential_id;
    
    if (!credentialId) {
      console.log('⚠️ No credential ID found, will create new credential');
      // We'll handle credential creation in the workflow deployment
    }
    
    // STEP 4: Load and prepare workflow template
    console.log('📝 Step 4: Loading workflow template...');
    const workflowTemplate = await loadWorkflowTemplate(profile.client_config?.business?.type || 'General', provider);
    
    // Get voice profile
    const { data: voiceData } = await getSupabaseAdmin()
      .from('communication_styles')
      .select('style_profile, learning_count, last_updated')
      .eq('user_id', userId)
      .maybeSingle();
    
    const voiceProfile = voiceData || null;
    
    // STEP 5: Prepare client data for template injection
    console.log('🔧 Step 5: Preparing client data...');
    const clientData = {
      id: userId,
      ...profile.client_config,
      managers: profile.managers || [],
      suppliers: profile.suppliers || [],
      email_labels: profile.email_labels || {},
      voiceProfile: voiceProfile,
      integrations: {
        gmail: {
          credentialId: provider === 'gmail' ? credentialId : ''
        },
        outlook: {
          credentialId: provider === 'outlook' ? credentialId : ''
        },
        openai: {
          credentialId: 'openai-shared' // We'll resolve this properly later
        },
        postgres: {
          credentialId: 'mQziputTJekSuLa6'
        }
      }
    };
    
    // STEP 6: Inject data into template
    console.log('💉 Step 6: Injecting client data into template...');
    const workflowJson = await injectOnboardingData(clientData, workflowTemplate);
    workflowJson.name = `${businessSlug}-${clientShort}-workflow`;
    
    // STEP 7: Handle OpenAI credentials
    console.log('🤖 Step 7: Handling OpenAI credentials...');
    let openaiId = null;
    const { data: openaiMap } = await getSupabaseAdmin()
      .from('n8n_credential_mappings')
      .select('openai_credential_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    openaiId = openaiMap?.openai_credential_id || 'openai-shared';
    
    // STEP 8: Create minimal, validated payload for n8n
    console.log('📦 Step 8: Creating deployment payload...');
    const cleanPayload = {
      name: workflowJson.name,
      nodes: workflowJson.nodes || [],
      connections: workflowJson.connections || {}
    };
    
    // Validate payload
    if (!cleanPayload.nodes || cleanPayload.nodes.length === 0) {
      throw new Error('Workflow template has no nodes');
    }
    
    // STEP 9: Deploy to n8n
    console.log('🚀 Step 9: Deploying to n8n...');
    
    // Check for existing workflow
    const { data: existingWf } = await getSupabaseAdmin()
      .from('workflows')
      .select('id, n8n_workflow_id, version')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let n8nWorkflowId;
    let nextVersion = 1;
    
    if (existingWf?.n8n_workflow_id) {
      // Update existing workflow
      console.log(`🔄 Updating existing workflow ${existingWf.n8n_workflow_id}`);
      nextVersion = (existingWf.version || 1) + 1;
      
      try {
        await n8nRequest(`/workflows/${existingWf.n8n_workflow_id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanPayload)
        });
        n8nWorkflowId = existingWf.n8n_workflow_id;
      } catch (updateError) {
        console.error('❌ Workflow update failed:', updateError);
        throw new Error(`Failed to update workflow: ${updateError.message}`);
      }
    } else {
      // Create new workflow
      console.log('📝 Creating new workflow in n8n');
      
      try {
        const createdWf = await n8nRequest('/workflows', {
          method: 'POST',
          body: JSON.stringify(cleanPayload)
        });
        n8nWorkflowId = createdWf.id;
      } catch (createError) {
        console.error('❌ Workflow creation failed:', createError);
        throw new Error(`Failed to create workflow: ${createError.message}`);
      }
    }
    
    // STEP 10: Activate workflow (optional - don't fail if this fails)
    console.log(`🔄 Step 10: Activating workflow ${n8nWorkflowId}...`);
    try {
      await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
        method: 'POST'
      });
      console.log('✅ Workflow activated successfully');
    } catch (activationError) {
      console.warn(`⚠️ Workflow activation failed (non-critical): ${activationError.message}`);
      // Don't throw - activation failure shouldn't fail the entire deployment
    }
    
    // STEP 11: Update database
    console.log('💾 Step 11: Updating database...');
    
    // Archive previous workflow if exists
    if (existingWf?.id) {
      await getSupabaseAdmin()
        .from('workflows')
        .update({ status: 'archived' })
        .eq('id', existingWf.id);
    }
    
    // Save new workflow record
    await getSupabaseAdmin()
      .from('workflows')
      .insert({
        user_id: userId,
        n8n_workflow_id: n8nWorkflowId,
        name: workflowJson.name,
        version: nextVersion,
        status: 'active',
        workflow_json: workflowJson
      });
    
    console.log('✅ Deployment completed successfully!');
    
    return {
      success: true,
      workflowId: n8nWorkflowId,
      version: nextVersion,
      message: 'Workflow deployed successfully'
    };
    
  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      message: 'Workflow deployment failed'
    };
  }
}

async function handler(req) {
  // Handle CORS preflight FIRST - completely outside any try-catch to prevent ANY interference
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
      }
    });
  }

  try {
    // Log all requests for debugging
    console.log(`🌐 Request received: ${req.method} ${req.url}`);
    
    // CRITICAL: Validate environment variables early to catch missing vars before any processing
    try {
      validateEnvironmentVariables();
    } catch (envError) {
      console.error(`❌ Environment variable validation failed: ${envError.message}`);
      return new Response(JSON.stringify({
        success: false,
        error: "CRITICAL: Missing required environment variables. Check your Supabase Edge Function secrets configuration.",
        details: envError.message,
        isEnvironmentVariableError: true
      }), {
        status: 500,
        headers: getCorsHeaders()
      });
    }

  // Now handle the main request logic
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', {
      status: 405,
      headers: getCorsHeaders()
    });
    
    // Safely parse request body with error handling for CORS
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse request JSON:', jsonError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: getCorsHeaders()
      });
    }
    const { userId, checkOnly, action } = requestBody;
    if (!userId) return new Response('Missing userId', {
      status: 400,
      headers: getCorsHeaders()
    });
    // Handle special actions
    // Action: Clear training data
    if (action === 'clear-training-data') {
      try {
        await clearTrainingData(userId, {
          keepMetrics: requestBody.keepMetrics
        });
        return new Response(JSON.stringify({
          success: true,
          message: 'Training data cleared successfully'
        }), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Action: Archive old training data
    if (action === 'archive-training-data') {
      try {
        await archiveOldTrainingData(userId);
        return new Response(JSON.stringify({
          success: true,
          message: 'Old training data archived successfully'
        }), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // If this is just a check for availability, test N8N connection
    if (checkOnly) {
      try {
        await n8nRequest('/workflows', {
          method: 'GET'
        });
        return new Response(JSON.stringify({
          success: true,
          available: true
        }), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          available: false,
          error: error.message
        }), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // WorkflowData might be included in the main requestBody if sent from frontend
    const { workflowData, emailProvider } = requestBody;
    // Determine the email provider (default to gmail for backward compatibility)
    let provider = emailProvider || 'gmail';
    // Normalize provider name to handle variations ('google' → 'gmail', 'microsoft' → 'outlook')
    provider = normalizeProvider(provider);
    console.log(`📧 Using email provider: ${provider}`);
    
    // ===== NEW SIMPLIFIED DEPLOYMENT APPROACH =====
    console.log('🚀 Using new simplified deployment approach...');
    const deploymentResult = await deployWorkflowRobust(userId, provider);
    
    if (deploymentResult.success) {
      console.log('✅ Deployment completed successfully using new approach');
      return new Response(JSON.stringify({
        success: true,
        workflowId: deploymentResult.workflowId,
        version: deploymentResult.version,
        message: deploymentResult.message || 'Workflow deployed successfully'
      }), {
        headers: getCorsHeaders()
      });
    } else {
      console.error('❌ New deployment approach failed:', deploymentResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: deploymentResult.error || 'Deployment failed',
        message: deploymentResult.message || 'Workflow deployment failed'
      }), {
        status: 500,
        headers: getCorsHeaders()
      });
    }
    // ===== END NEW APPROACH =====
  } catch (err) {
    console.error('❌ Edge Function execution failed:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: getCorsHeaders()
    });
  }
  
  } catch (outerError) {
    console.error('❌ Critical error in handler:', outerError);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false',
        'Content-Type': 'application/json'
      }
    });
  }
}

// Serve the main handler with top-level crash protection for CORS
serve(async (req) => {
  try {
    return await handler(req);
  } catch (e) {
    console.error("❌ GLOBAL CATCH: Deno runtime/handler initialization crashed.", e);
    
    // Detect if this is an environment variable issue
    const isEnvVarError = e.message && (
      e.message.includes('Missing required environment variables') ||
      e.message.includes('environment variable is required') ||
      e.message.includes('environment variable is not set')
    );
    
    const errorMessage = isEnvVarError 
      ? "CRITICAL: Missing required environment variables. Check your Supabase Edge Function secrets configuration."
      : "Global handler error during initialization or execution. Check Edge Function logs for uncaught exceptions.";
    
    // CRITICAL: Ensure a valid CORS response even on global crash
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      internalMessage: e.message,
      isEnvironmentVariableError: isEnvVarError
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false',
        'Content-Type': 'application/json',
      }
    });
  }
});
            clientSecret: GMAIL_CLIENT_SECRET,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: '',
            oauthTokenData: {
              access_token: integration?.access_token || '',
              refresh_token: refreshToken,
              token_type: 'Bearer',
              expires_in: 3599,
              scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.labels'
            }
          },
          nodesAccess: [
            {
              nodeType: 'n8n-nodes-base.gmail'
            },
            {
              nodeType: 'n8n-nodes-base.gmailTrigger'
            }
          ]
        };
        const created = await n8nRequest('/credentials', {
          method: 'POST',
          body: JSON.stringify(credBody)
        });
        gmailId = created.id;
        await getSupabaseAdmin().from('n8n_credential_mappings').upsert({
          user_id: userId,
          gmail_credential_id: gmailId
        }, {
          onConflict: 'user_id'
        });
        // ALSO update integrations table so frontend can find it
        await getSupabaseAdmin().from('integrations').update({
          n8n_credential_id: gmailId,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId).eq('provider', 'gmail').eq('status', 'active');
        console.log(` Created new Gmail credential: ${gmailId}`);
    } else if (provider === 'outlook') {
      // Get Outlook client credentials from env
      const OUTLOOK_CLIENT_ID = Deno.env.get('OUTLOOK_CLIENT_ID') || Deno.env.get('MICROSOFT_CLIENT_ID') || '';
      const OUTLOOK_CLIENT_SECRET = Deno.env.get('OUTLOOK_CLIENT_SECRET') || Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';
      // First, try to find existing credential from the integrations table (frontend-created)
      const { data: existingIntegration } = await getSupabaseAdmin().from('integrations').select('n8n_credential_id').eq('user_id', userId).eq('provider', 'outlook').eq('status', 'active').single();
      if (existingIntegration?.n8n_credential_id) {
        outlookId = existingIntegration.n8n_credential_id;
        console.log(`✅ Reusing existing Outlook credential: ${outlookId}`);
      } else {
        // Fallback: check credential mappings table
        const { data: existingMap } = await getSupabaseAdmin().from('n8n_credential_mappings').select('outlook_credential_id').eq('user_id', userId).maybeSingle();
        outlookId = existingMap?.outlook_credential_id || null;
        if (outlookId) {
          console.log(`✅ Found Outlook credential in mappings: ${outlookId}`);
        }
      }
      // Only create new credential if none exists AND we have refresh token
      if (!outlookId && refreshToken) {
        const credBody = {
          name: `${businessSlug}-${clientShort}-outlook`,
          type: 'microsoftOutlookOAuth2Api',
          data: {
            clientId: OUTLOOK_CLIENT_ID,
            clientSecret: OUTLOOK_CLIENT_SECRET,
            sendAdditionalBodyProperties: false,
            additionalBodyProperties: '',
            oauthTokenData: {
              access_token: integration?.access_token || '',
              refresh_token: refreshToken,
              token_type: 'Bearer',
              expires_in: 3599,
              scope: 'Mail.ReadWrite Mail.Send offline_access'
            }
          },
          nodesAccess: [
            {
              nodeType: 'n8n-nodes-base.microsoftOutlook'
            },
            {
              nodeType: 'n8n-nodes-base.microsoftOutlookTrigger'
            }
          ]
        };
        const created = await n8nRequest('/credentials', {
          method: 'POST',
          body: JSON.stringify(credBody)
        });
        outlookId = created.id;
        await getSupabaseAdmin().from('n8n_credential_mappings').upsert({
          user_id: userId,
          outlook_credential_id: outlookId
        }, {
          onConflict: 'user_id'
        });
        // ALSO update integrations table so frontend can find it
        await getSupabaseAdmin().from('integrations').update({
          n8n_credential_id: outlookId,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId).eq('provider', 'outlook').eq('status', 'active');
        console.log(` Created new Outlook credential: ${outlookId}`);
      } else if (!outlookId) {
        console.log(`❌ No Outlook credential found and no refresh token available`);
      }
    }
    // Resolve OpenAI credential for tenant:
    // 1) If mapping has openai_credential_id, use it
    // 2) Else check for existing 'openai-shared' credential first (to avoid duplicates)
    // 3) Only create new credential if neither exists
    let openaiId = null;
    const { data: openaiMap } = await getSupabaseAdmin().from('n8n_credential_mappings').select('openai_credential_id').eq('user_id', userId).maybeSingle();
    openaiId = openaiMap?.openai_credential_id || null;
    
    // If no mapped credential, check for existing 'openai-shared' to avoid duplicates
    if (!openaiId) {
      console.log(`🔍 No mapped OpenAI credential found, checking for existing 'openai-shared' credential...`);
      openaiId = await resolveCredentialIdByName('openai-shared');
      if (openaiId) {
        console.log(`✅ Found existing 'openai-shared' credential: ${openaiId} - will reuse to avoid duplicates`);
        // Update the mapping so we don't recreate it on next deployment
        await getSupabaseAdmin().from('n8n_credential_mappings').upsert({
          user_id: userId,
          openai_credential_id: openaiId
        }, {
          onConflict: 'user_id'
        });
        console.log(`💾 Updated credential mapping to use existing 'openai-shared' credential`);
      }
    }
    
    if (!openaiId) {
      // Allocate key: least used, oldest last_assigned_at. Prefer secrets-based key rotation; fall back to DB pool if needed.
      try {
        const { key, ref } = getNextKey();
        const openaiCredName = `${businessSlug}-${clientShort}-openai`;
        const created = await n8nRequest('/credentials', {
          method: 'POST',
          body: JSON.stringify({
            name: openaiCredName,
            type: 'openAiApi',
            data: {
              apiKey: key,
              headerName: 'Authorization',
              headerValue: 'Bearer {{ $json.apiKey }}'
            },
            nodesAccess: [
              {
                nodeType: '@n8n/n8n-nodes-langchain.agent'
              }
            ]
          })
        });
        openaiId = created.id;
        await getSupabaseAdmin().from('n8n_credential_mappings').upsert({
          user_id: userId,
          openai_credential_id: openaiId
        }, {
          onConflict: 'user_id'
        });
        // Optionally mirror key_ref in DB for monitoring (no raw key stored)
        await getSupabaseAdmin().from('openai_keys').insert({
          key_ref: ref,
          status: 'active'
        }).onConflict('key_ref');
      } catch (_e) {
        console.warn(`Failed to create OpenAI credential using secrets. Checking one more time for existing 'openai-shared' credential.`);
        // We already checked for openai-shared above, but check again as fallback
        if (!openaiId) {
          openaiId = await resolveCredentialIdByName('openai-shared');
          if (openaiId) {
            console.log(`✅ Found existing 'openai-shared' credential in fallback: ${openaiId}`);
            // Update the mapping so we don't recreate it on next deployment
            await getSupabaseAdmin().from('n8n_credential_mappings').upsert({
              user_id: userId,
              openai_credential_id: openaiId
            }, {
              onConflict: 'user_id'
            });
          } else {
            console.error(`❌ No OpenAI credentials available - neither custom nor 'openai-shared' found. Using fallback.`);
            openaiId = 'openai-shared'; // Fallback to name instead of creating duplicate
          }
        }
      }
    }
    // Use hardcoded Supabase credential ID
    const postgresId = 'mQziputTJekSuLa6';
    console.log(`✅ Using hardcoded Supabase credential: ${postgresId}`);
    // Validate that required credentials exist based on provider
    console.log(` Validating credentials for provider: ${provider}`);
    console.log(`   - Gmail ID: ${gmailId || 'NOT SET'}`);
    console.log(`   - Outlook ID: ${outlookId || 'NOT SET'}`);
    console.log(`   - OpenAI ID: ${openaiId || 'NOT SET'}`);
    console.log(`   - Supabase ID: ${postgresId}`);
    if (provider === 'gmail' && !gmailId) {
      throw new Error(`Gmail credential ID not set! Refresh token exists: ${!!refreshToken}`);
    }
    if (provider === 'outlook' && !outlookId) {
      throw new Error(`Outlook credential ID not set! Refresh token exists: ${!!refreshToken}`);
    }
    // Build client data for template injection
    const clientData = {
      id: userId,
      ...profile.client_config,
      managers: profile.managers || [],
      suppliers: profile.suppliers || [],
      email_labels: profile.email_labels || {},
      voiceProfile: voiceProfile,
      integrations: {
        gmail: {
          credentialId: gmailId || ''
        },
        outlook: {
          credentialId: outlookId || ''
        },
        openai: {
          credentialId: openaiId || 'openai-shared'
        },
        postgres: {
          credentialId: postgresId || 'mQziputTJekSuLa6'
        }
      }
    };
    let workflowJson;
    // FORCE USE OF YOUR BASE TEMPLATES - Ignore frontend workflowData to prevent broken deployments
    console.log('🚫 Ignoring frontend workflowData - FORCING use of YOUR base templates');
    console.log(`📋 Loading YOUR base template for provider: ${provider}`);
    const workflowTemplate = await loadWorkflowTemplate(clientData.business?.type || 'Pools & Spas', provider);
    
    // Inject only client-specific data while preserving exact template structure
    workflowJson = await injectOnboardingData(clientData, workflowTemplate);
    console.log('✅ Using YOUR base template with preserved structure and injected client data');
    // Ensure workflow has proper name and credentials
    workflowJson.name = `${businessSlug}-${clientShort}-workflow`;
    // DEBUG: Log credential IDs before injection
    console.log(` Credential IDs ready for injection:`);
    console.log(`   - OpenAI ID: ${openaiId || 'NOT SET'}`);
    console.log(`   - Supabase ID: ${postgresId || 'NOT SET'}`);
    console.log(`   - Gmail ID: ${gmailId || 'NOT SET'}`);
    console.log(`   - Outlook ID: ${outlookId || 'NOT SET'}`);
    // --- CREDENTIAL INJECTION: Inject client credentials while preserving exact template structure ---
    let gmailNodesUpdated = 0;
    let outlookNodesUpdated = 0;
    let openaiNodesUpdated = 0;
    let supabaseNodesUpdated = 0;
    
    // DEBUG: Log all node types from template to confirm structure preservation
    console.log(`🔍 Template contains ${workflowJson.nodes.length} nodes (structure preserved):`);
    workflowJson.nodes.forEach(node => {
      console.log(`  - Node: ${node.name} (type: ${node.type})`);
    });
    
    // Inject credentials only - preserve all other template properties
    for (const node of workflowJson.nodes){
      if (!node.credentials) {
        node.credentials = {};
      }
      
      // CREDENTIAL INJECTION ONLY - No structure modifications
      // Base templates are already provider-specific via loadWorkflowTemplate()
      
      // Gmail credential injection for Gmail nodes
      if (node.type === 'n8n-nodes-base.gmailTrigger' || node.type === 'n8n-nodes-base.gmail') {
        if (gmailId) {
          node.credentials.gmailOAuth2 = {
            id: gmailId,
            name: `${businessName} Gmail`
          };
          gmailNodesUpdated++;
          console.log(`🔧 Updated Gmail credential in node: ${node.name} (${node.id})`);
        } else {
          console.warn(`⚠️ Gmail credential ID missing for node: ${node.name} - skipping`);
        }
      }
      
      // Outlook credential injection for Outlook nodes  
      if (node.type === 'n8n-nodes-base.microsoftOutlookTrigger' || node.type === 'n8n-nodes-base.microsoftOutlook') {
        if (outlookId) {
          node.credentials.microsoftOutlookOAuth2Api = {
            id: outlookId,
            name: `${businessName} Outlook`
          };
          outlookNodesUpdated++;
          console.log(`🔧 Updated Outlook credential in node: ${node.name} (${node.id})`);
        } else {
          console.warn(`⚠️ Outlook credential ID missing for node: ${node.name} - skipping`);
        }
      }
      // Update OpenAI credentials for LangChain OpenAI nodes
      // CRITICAL FIX: Only inject credentials into lmChatOpenAi nodes, not agent nodes
      if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
        if (!node.credentials) {
          node.credentials = {};
        }
        node.credentials.openAiApi = {
          id: openaiId || 'openai-shared',
          name: 'openai-shared'
        };
        openaiNodesUpdated++;
        console.log(`🔧 Updated OpenAI credential in lmChatOpenAi node: ${node.name} (${node.id})`);
      } else if (node.credentials.openAiApi) {
        node.credentials.openAiApi.id = openaiId || 'openai-shared';
        node.credentials.openAiApi.name = 'openai-shared';
        openaiNodesUpdated++; // Increment even if it's a "general" OpenAI credential
        console.log(`🔧 FORCE updated generic OpenAI API credential in node: ${node.name} (${node.id})`);
      } else if (node.credentials.openAi) {
        node.credentials.openAi.id = openaiId || 'openai-shared';
        node.credentials.openAi.name = 'openai-shared';
        openaiNodesUpdated++;
        console.log(`🔧 FORCE updated legacy OpenAI credential in node: ${node.name} (${node.id})`);
      }
      // Update Supabase credentials for Supabase nodes
      if (node.type === 'n8n-nodes-base.supabase') {
        node.credentials.supabaseApi = {
          id: postgresId || 'mQziputTJekSuLa6',
          name: 'Supabase FWIQ'
        };
        supabaseNodesUpdated++;
        console.log(`🔧 FORCE updated Supabase credential in node: ${node.name} (${node.id})`);
      } else if (node.credentials.supabaseApi) {
        node.credentials.supabaseApi.id = postgresId || 'mQziputTJekSuLa6';
        node.credentials.supabaseApi.name = 'Supabase FWIQ';
        supabaseNodesUpdated++; // Increment even if it's a "general" Supabase credential
        console.log(`🔧 FORCE updated generic Supabase credential in node: ${node.name} (${node.id})`);
      }
    }
    console.log(` ✅ FORCE credential injection complete (all stale credentials overwritten).`);
    console.log(`    - Gmail nodes updated: ${gmailNodesUpdated}`);
    console.log(`    - Outlook nodes updated: ${outlookNodesUpdated}`);
    console.log(`    - OpenAI nodes updated: ${openaiNodesUpdated}`);
    console.log(`    - Supabase nodes updated: ${supabaseNodesUpdated}`);
    // SIMPLIFIED VALIDATION: Since templates are now provider-specific, 
    // we expect the correct node types to be present
    
    if (provider === 'gmail' && gmailNodesUpdated === 0) {
      console.error(`❌ CRITICAL: No Gmail nodes found/updated for Gmail provider!`);
      console.error(`   Workflow should contain Gmail nodes since template is provider-specific`);
      throw new Error('Gmail credential injection failed - no Gmail nodes found in workflow');
    }
    
    if (provider === 'outlook' && outlookNodesUpdated === 0) {
      console.error(`❌ CRITICAL: No Outlook nodes found/updated for Outlook provider!`);
      console.error(`   Workflow should contain Outlook nodes since template is provider-specific`);
      throw new Error('Outlook credential injection failed - no Outlook nodes found in workflow');
    }
    
    console.log(`✅ Provider validation passed: ${provider} provider has ${provider === 'gmail' ? gmailNodesUpdated : outlookNodesUpdated} correct node types updated`);
    // --- END CRITICAL FIX ---
    // --- PRESERVE EXACT TEMPLATE STRUCTURE - Only inject credentials and data ---
    // Use the exact structure from the template, only ensuring credentials are properly set
    const cleanPayload = {
      name: workflowJson.name, // Ensure the name is set correctly
      nodes: workflowJson.nodes || [], // Required nodes array
      connections: workflowJson.connections || {} // Required connections object
    };
    
    // Validate workflow structure before deployment (preserving exact template structure)
    if (!cleanPayload.nodes || cleanPayload.nodes.length === 0) {
      throw new Error('Workflow validation failed: No nodes found in workflow');
    }
    
    // Validate each node has required properties for n8n execution (without modifying structure)
    for (const node of cleanPayload.nodes) {
      if (!node.id || !node.type || !node.name) {
        console.error(`❌ Invalid node structure:`, {
          id: node.id,
          type: node.type,
          name: node.name
        });
        throw new Error(`Workflow validation failed: Node missing required properties (id, type, name)`);
      }
      
      // Ensure node has required execution properties
      if (!node.position) {
        console.warn(`⚠️ Node ${node.name} (${node.id}) missing position property`);
      }
      
      // Ensure typeVersion is set for compatibility
      if (node.typeVersion === undefined) {
        console.warn(`⚠️ Node ${node.name} (${node.id}) missing typeVersion, n8n may not execute properly`);
      }
    }
    
    // Validate connections exist if workflow has multiple nodes
    if (cleanPayload.nodes.length > 1 && (!cleanPayload.connections || Object.keys(cleanPayload.connections).length === 0)) {
      console.warn(`⚠️ Workflow has ${cleanPayload.nodes.length} nodes but no connections defined`);
    }
    
    // Debug: Log the payload structure to confirm we preserved the template structure
    console.log('🔍 Payload keys being sent to n8n:', Object.keys(cleanPayload));
    console.log('🔍 Sample node structure from template:', cleanPayload.nodes?.[0] ? {
      name: cleanPayload.nodes[0].name,
      type: cleanPayload.nodes[0].type,
      keys: Object.keys(cleanPayload.nodes[0])
    } : 'No nodes found');
    console.log('🔍 Connections property exists:', !!cleanPayload.connections);
    console.log('🔍 Connections keys:', cleanPayload.connections ? Object.keys(cleanPayload.connections) : 'No connections');
    console.log(`✅ Using exact template structure with ${cleanPayload.nodes.length} nodes and ${Object.keys(cleanPayload.connections || {}).length} connection groups`);
    
    // Safely get existing workflow with error handling
    let existingWf = null;
    try {
      const { data, error } = await getSupabaseAdmin().from('workflows').select('id, n8n_workflow_id, version').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) {
        console.error('❌ Error fetching existing workflow:', error);
        // Continue without existing workflow - will create new one
      } else {
        existingWf = data;
      }
    } catch (supabaseError) {
      console.error('❌ Supabase connection error:', supabaseError);
      // Continue without existing workflow - will create new one
    }
    
    let n8nWorkflowId;
    let nextVersion;
    if (existingWf?.n8n_workflow_id) {
      n8nWorkflowId = existingWf.n8n_workflow_id;
      nextVersion = (existingWf.version || 1) + 1;
      console.log(`🔄 Updating existing workflow ${n8nWorkflowId}`);
      
      try {
        await n8nRequest(`/workflows/${n8nWorkflowId}`, {
          method: 'PUT',
          body: JSON.stringify(cleanPayload) // Send clean payload without extra fields
        });
      } catch (error) {
        console.error('❌ Workflow update failed, trying with minimal payload...');
        
        // Fallback: Try with absolutely minimal payload (preserving template structure)
        const minimalPayload = {
          name: cleanPayload.name,
          nodes: cleanPayload.nodes.map(node => ({
            id: node.id,
            name: node.name,
            type: node.type,
            position: node.position,
            ...(node.parameters && Object.keys(node.parameters).length > 0 ? { parameters: node.parameters } : {}),
            ...(node.credentials && Object.keys(node.credentials).length > 0 ? { credentials: node.credentials } : {})
          })),
          connections: cleanPayload.connections || {}
        };
        
        await n8nRequest(`/workflows/${n8nWorkflowId}`, {
          method: 'PUT',
          body: JSON.stringify(minimalPayload)
        });
      }
    } else {
      console.log('📝 Creating new workflow in n8n');
      
      // Log the exact payload being sent for debugging
      console.log('🔍 Full payload being sent to n8n:', JSON.stringify(cleanPayload, null, 2));
      
      try {
        const createdWf = await n8nRequest('/workflows', {
          method: 'POST',
          body: JSON.stringify(cleanPayload) // Send clean payload without extra fields
        });
        n8nWorkflowId = createdWf.id;
        nextVersion = 1;
      } catch (error) {
        console.error('❌ Workflow creation failed, trying with even more minimal payload...');
        
        // Fallback: Try with absolutely minimal payload (preserving template structure)
        const minimalPayload = {
          name: cleanPayload.name,
          nodes: cleanPayload.nodes.map(node => ({
            id: node.id,
            name: node.name,
            type: node.type,
            position: node.position,
            ...(node.parameters && Object.keys(node.parameters).length > 0 ? { parameters: node.parameters } : {}),
            ...(node.credentials && Object.keys(node.credentials).length > 0 ? { credentials: node.credentials } : {})
          })),
          connections: cleanPayload.connections || {}
        };
        
        console.log('🔍 Minimal fallback payload:', JSON.stringify(minimalPayload, null, 2));
        
        const createdWf = await n8nRequest('/workflows', {
          method: 'POST',
          body: JSON.stringify(minimalPayload)
        });
        n8nWorkflowId = createdWf.id;
        nextVersion = 1;
      }
    }
    // 🏷️ PROVISION EMAIL LABELS/FOLDERS (Asynchronous - Non-blocking)
    console.log('🏷️ Starting email label provisioning (async)...');

    // CRITICAL FIX: Make this non-blocking to prevent Edge Function timeout
    provisionEmailLabels(userId, provider, profile.client_config?.business?.types || ['General'], businessName)
        .then((result) => console.log(`[ASYNC: SUCCESS] Label provisioning complete. Labels Created: ${result.labelsCreated}`))
        .catch((error) => console.error(`[ASYNC: ERROR] Label provisioning failed: ${error.message}`));
    // Activate workflow with better error handling
    try {
      console.log(`🔄 Activating workflow ${n8nWorkflowId}...`);
      await n8nRequest(`/workflows/${n8nWorkflowId}/activate`, {
        method: 'POST'
      });
      console.log(`✅ Workflow ${n8nWorkflowId} activated successfully`);
    } catch (activationError) {
      console.error(`❌ Workflow activation failed for ${n8nWorkflowId}:`, activationError);
      
      // Try to get workflow details to diagnose the issue
      try {
        const workflowDetails = await n8nRequest(`/workflows/${n8nWorkflowId}`);
        console.log(`🔍 Workflow details:`, {
          id: workflowDetails.id,
          name: workflowDetails.name,
          active: workflowDetails.active,
          nodeCount: workflowDetails.nodes?.length || 0,
          hasConnections: !!workflowDetails.connections
        });
      } catch (detailsError) {
        console.error(`❌ Could not fetch workflow details:`, detailsError);
      }
      
      // Don't fail the entire deployment - the workflow was created successfully
      // Just log the activation issue for debugging
      console.warn(`⚠️ Workflow deployed but activation failed - this may need manual intervention`);
    }
    // Archive previous active and save new record
    if (existingWf?.id) {
      await getSupabaseAdmin().from('workflows').update({
        status: 'archived'
      }).eq('id', existingWf.id);
    }
    // Save workflow record to database (removed unsupported columns: issues, is_functional, last_checked)
    await getSupabaseAdmin().from('workflows').insert({
      user_id: userId,
      n8n_workflow_id: n8nWorkflowId,
      name: workflowJson.name,
      version: nextVersion,
      status: 'active',
      workflow_json: workflowJson // Save the fully injected workflow JSON
    });
    // Get voice learning summary for response
    const voiceLearningStatus = await getVoiceLearningSummary(userId);
    
    // Return response immediately, without waiting for provisioning
    return new Response(JSON.stringify({
      success: true,
      workflowId: n8nWorkflowId,
      version: nextVersion,
      voiceLearning: voiceLearningStatus,
      provisioningStatus: 'Async task initiated and running in background.'
    }), {
      headers: getCorsHeaders()
    });
  } catch (err) {
    console.error('❌ Edge Function execution failed:', err); // Enhanced error logging
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: getCorsHeaders()
    });
  }
  
  } catch (outerError) {
    console.error('❌ Critical error in handler:', outerError);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false',
        'Content-Type': 'application/json'
      }
    });
  }
}
// Serve the main handler with top-level crash protection for CORS
serve(async (req) => {
  try {
    return await handler(req);
  } catch (e) {
    console.error("❌ GLOBAL CATCH: Deno runtime/handler initialization crashed.", e);
    
    // Detect if this is an environment variable issue
    const isEnvVarError = e.message && (
      e.message.includes('Missing required environment variables') ||
      e.message.includes('environment variable is required') ||
      e.message.includes('environment variable is not set')
    );
    
    const errorMessage = isEnvVarError 
      ? "CRITICAL: Missing required environment variables. Check your Supabase Edge Function secrets configuration."
      : "Global handler error during initialization or execution. Check Edge Function logs for uncaught exceptions.";
    
    // CRITICAL: Ensure a valid CORS response even on global crash
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      internalMessage: e.message,
      isEnvironmentVariableError: isEnvVarError
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false',
        'Content-Type': 'application/json',
      }
    });
  }
});