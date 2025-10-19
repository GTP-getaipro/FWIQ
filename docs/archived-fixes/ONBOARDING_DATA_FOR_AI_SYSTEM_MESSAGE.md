# 📊 Onboarding Data Collection → AI System Message Mapping

## 🎯 Executive Summary

During onboarding, we collect **rich business data** across multiple steps. This document maps **what we collect** → **how it should inform the AI system message** for personalized, Hot Tub Man-style AI assistants.

---

## 📋 **Complete Data Collection Overview**

### **Step 1: Email Integration**
```javascript
{
  provider: 'gmail' | 'outlook',
  status: 'active',
  access_token: string,
  refresh_token: string
}
```

**AI System Message Impact:**
- ✅ Enables few-shot learning from sent emails
- ✅ Determines email-specific instructions (Gmail labels vs Outlook folders)

---

### **Step 2: Business Type Selection**
```javascript
{
  business_type: 'Electrician' | 'HVAC' | 'Plumber' | 'Pools & Spas' | etc.,
  business_types: ['Electrician', 'HVAC'], // Multi-business support
  selected_at: timestamp
}
```

**AI System Message Impact:**
- ✅ **Inquiry classification** (Emergency electrical vs scheduled service)
- ✅ **Industry keywords** (breaker, sparking, panel vs pump, heater, filter)
- ✅ **Pricing structure** ($150 emergency fee vs $125/hr labor)
- ✅ **Safety protocols** (Turn off breaker vs Turn off pump)
- ✅ **Response urgency** (2 hours for emergencies vs 24-48 hours for quotes)

---

### **Step 3: Team Setup**
```javascript
{
  managers: [
    {
      name: 'John Smith',
      email: 'john@business.com',
      role: 'Owner',
      phone: '(403) 555-1234',
      department: 'Service'
    }
  ],
  suppliers: [
    {
      name: 'ABC Electrical Supply',
      email: 'orders@abcsupply.com',
      domains: ['abcsupply.com', 'abc-parts.com'],
      category: 'equipment',
      phone: '(403) 555-5678',
      contact_person: 'Mike Johnson'
    }
  ]
}
```

**AI System Message Impact:**
- ✅ **Manager routing**: "I'll have John follow up with you tomorrow"
- ✅ **Escalation rules**: "This requires manager approval - John will reach out"
- ✅ **Supplier recognition**: Auto-categorize emails from ABC Supply
- ✅ **Team context**: "Our service manager Mike can help with that"

---

### **Step 4: Business Information**
```javascript
{
  business: {
    name: 'Smith Electrical Services',
    legalEntityName: 'Smith Electrical Services Ltd.',
    taxNumber: '123-456-789',
    address: '123 Main St, Red Deer, AB T4N 1A1',
    serviceArea: 'Red Deer, Sylvan Lake, Lacombe, Leduc',
    timezone: 'America/Edmonton',
    currency: 'CAD',
    emailDomain: '@smithelectrical.ca',
    website: 'https://smithelectrical.ca'
  },
  
  contact: {
    primaryContactName: 'John Smith',
    primaryContactRole: 'Owner',
    primaryContactEmail: 'john@smithelectrical.ca',
    afterHoursPhone: '(403) 555-9999'
  },
  
  rules: {
    sla: '4h', // Response time SLA
    tone: 'Professional', // or 'Friendly', 'Casual'
    defaultEscalationManager: 'john@smithelectrical.ca',
    escalationRules: 'Escalate all emergency calls immediately',
    
    businessHours: {
      mon_fri: '08:00-17:00',
      sat: '09:00-13:00',
      sun: 'Closed'
    },
    
    holidays: ['2025-12-25', '2025-01-01'],
    
    language: 'en',
    
    aiGuardrails: {
      allowPricing: true, // Can AI discuss pricing?
      signatureMode: 'custom' // Use custom signature
    },
    
    phoneProvider: {
      name: 'RingCentral',
      senders: ['service@ringcentral.com', 'sms@ringcentral.com']
    },
    
    crmProvider: {
      name: 'ServiceTitan',
      alertEmails: ['alerts@servicetitan.com', 'notifications@servicetitan.com']
    },
    
    urgentKeywords: [
      'urgent', 'emergency', 'no power', 'sparking', 
      'breaker tripping', 'burning smell', 'smoke'
    ]
  },
  
  services: [
    {
      name: 'Emergency Electrical Repair',
      description: '24/7 emergency electrical services',
      pricingType: 'hourly',
      price: '$150 emergency fee + $125/hr',
      category: 'emergency'
    },
    {
      name: 'Panel Upgrade',
      description: 'Electrical panel upgrade and replacement',
      pricingType: 'fixed',
      price: '$2,500 - $4,000',
      category: 'installation'
    },
    {
      name: 'Outlet Installation',
      description: 'New outlet installation',
      pricingType: 'fixed',
      price: '$150 per outlet',
      category: 'installation'
    },
    {
      name: 'Safety Inspection',
      description: 'Full electrical safety inspection',
      pricingType: 'fixed',
      price: '$150',
      category: 'inspection'
    }
  ],
  
  signature: `
Thanks for trusting us with your electrical needs!

Smith Electrical Services
(403) 555-1234
john@smithelectrical.ca
https://smithelectrical.ca
  `
}
```

**AI System Message Impact:**
- ✅ **Business name in signature**: "Thanks, Smith Electrical Services"
- ✅ **Service area awareness**: "We service Red Deer and surrounding areas"
- ✅ **Timezone handling**: All appointment times in America/Edmonton
- ✅ **Currency**: "$150" not "€150"
- ✅ **SLA compliance**: "We'll respond within 4 hours"
- ✅ **Tone matching**: Professional vs Friendly voice
- ✅ **Business hours**: "We're open Monday-Friday 8am-5pm"
- ✅ **Holiday awareness**: "We're closed Christmas Day"
- ✅ **Pricing disclosure**: Can mention "$150 per outlet" if allowPricing=true
- ✅ **Service-specific responses**: Mention available services
- ✅ **Phone provider recognition**: Auto-categorize RingCentral SMS notifications
- ✅ **CRM integration**: Recognize ServiceTitan alert emails
- ✅ **Urgent keyword detection**: "no power" → Emergency category
- ✅ **Custom signature**: Use provided signature block

---

### **Step 5: Voice Training (Automated)**
```javascript
{
  voice: {
    tone: 'Friendly and Professional',
    empathyLevel: 0.82,
    formalityLevel: 0.68,
    directnessLevel: 0.75,
    confidence: 0.85,
    signOff: 'Thanks for your patience!\\n- John',
    vocabulary: ['definitely', 'absolutely', 'appreciate', 'happy to help']
  },
  
  signaturePhrases: [
    {
      phrase: "I'd be happy to help with that",
      confidence: 0.92,
      context: 'support',
      frequency: 15
    },
    {
      phrase: 'Thanks for reaching out!',
      confidence: 0.88,
      context: 'general',
      frequency: 12
    }
  ],
  
  fewShotExamples: {
    support: [
      {
        subject: 'Re: Panel upgrade question',
        body: 'Hi Sarah! Thanks for reaching out about the panel upgrade...',
        category: 'support'
      }
    ],
    sales: [
      {
        subject: 'Quote for new construction',
        body: 'Hi Mike! I'd be happy to provide a quote for your new build...',
        category: 'sales'
      }
    ],
    urgent: [
      {
        subject: 'Re: Emergency - No power!',
        body: 'Hi Tom! I can definitely get someone out there within 2 hours...',
        category: 'urgent'
      }
    ]
  }
}
```

**AI System Message Impact:**
- ✅ **Tone consistency**: Match owner's actual writing style
- ✅ **Phrase usage**: Use their preferred phrases
- ✅ **Few-shot learning**: Real examples for each category
- ✅ **Greeting/closing patterns**: Match their style

---

### **Step 6: Email Labels**
```javascript
{
  email_labels: {
    'URGENT': 'label_urgent_id',
    'SALES': 'label_sales_id',
    'SUPPORT': 'label_support_id',
    'MANAGER/John Smith': 'label_john_id',
    'SUPPLIERS/ABC Supply': 'label_abc_id'
  }
}
```

**AI System Message Impact:**
- ✅ **Classification accuracy**: AI knows exact label structure
- ✅ **Routing logic**: "This will go to John Smith's folder"
- ✅ **Multi-level categories**: Support > Technical Support > Electrical

---

## 🎯 **How This Maps to Hot Tub Man-Style System Messages**

### **Current Hot Tub Man Example:**
```
Assistant role: Draft friendly, professional replies for The Hot Tub Man Ltd. that:
- Reflect prior conversation context
- Clearly communicate next steps
- Resolve concerns without delays
- Match customer tone and urgency
- Maintain warm, human voice

INQUIRY CLASSIFICATION:
1. Service Job Inquiry (repairs / inspections)
   - Site inspection: $105
   - Labor: $125/hr
   - Mileage: $1.50/km outside Red Deer/Leduc
   
2. New Spa Inquiry (shopping for hot tub)
   - Book consultation call
   - Link: thehottubman.ca/hot-tub-spas
   
3. Chemicals & Parts Inquiry
   - Link: thehottubman.ca/category/all-products
   - Harmony treatment: $39/kg
   
4. Technical Help / Troubleshooting
   - Error codes, leaks, water chemistry

UPSELL OPPORTUNITIES:
"If you need filters, chemicals, or test strips, we can have the tech bring them!"

SIGNATURE (REQUIRED):
Thanks so much for supporting our small business!
Best regards,
The Hot Tub Man Team
403-550-5140
```

---

## 🚀 **Dynamic System Message Generation Strategy**

### **Option 1: Template-Based (Simple)**
```javascript
// For each business type, create a template
const electricianTemplate = (businessData, voiceProfile) => `
Assistant role: Draft ${businessData.rules.tone.toLowerCase()} replies for ${businessData.business.name} that:
- Prioritize electrical safety
- Respond to emergencies within ${businessData.rules.sla}
- Match customer tone and urgency
- Use clear, jargon-free language

INQUIRY CLASSIFICATION:
${businessData.services.map(service => `
${service.category.toUpperCase()}: ${service.name}
- ${service.description}
- Pricing: ${service.price}
`).join('\n')}

SERVICE AREA: ${businessData.business.serviceArea}
BUSINESS HOURS: ${formatBusinessHours(businessData.rules.businessHours)}
PHONE: ${businessData.contact.afterHoursPhone || businessData.business.phone}

FEW-SHOT EXAMPLES:
${formatFewShotExamples(voiceProfile.fewShotExamples)}

SIGNATURE (REQUIRED):
${businessData.signature || generateDefaultSignature(businessData)}
`;
```

---

### **Option 2: Dynamic Builder (Scalable)**
```javascript
export function buildComprehensiveSystemMessage(profile) {
  const {
    business_type,
    business_types,
    client_config,
    managers,
    suppliers,
    voiceProfile
  } = profile;
  
  return `
# AI ASSISTANT FOR ${client_config.business.name}

## ROLE & TONE
${buildRoleSection(business_type, client_config.rules.tone, voiceProfile)}

## INQUIRY CLASSIFICATION
${buildInquiryTypes(business_type, client_config.services)}

## RESPONSE PROTOCOLS
${buildProtocols(business_type, client_config)}

## TEAM & ROUTING
${buildTeamSection(managers, suppliers)}

## BUSINESS CONTEXT
- Service Area: ${client_config.business.serviceArea}
- Hours: ${formatBusinessHours(client_config.rules.businessHours)}
- Phone: ${client_config.contact.afterHoursPhone}
- Website: ${client_config.business.website}
- ${client_config.rules.aiGuardrails.allowPricing ? 'CAN discuss pricing' : 'CANNOT discuss pricing'}

## VOICE & STYLE
${buildVoiceSection(voiceProfile)}

## FEW-SHOT EXAMPLES
${buildFewShotSection(voiceProfile.fewShotExamples)}

## SIGNATURE (REQUIRED)
${client_config.signature}
  `;
}
```

---

## 📋 **Implementation Options**

### **Option A: Create Business Type Templates** (Manual, High Quality)
- ✅ Create 12 business-specific templates (Electrician, HVAC, Plumber, etc.)
- ✅ Each template has industry-specific inquiry types
- ✅ Each template has business-specific protocols
- ✅ Combined with onboarding data + voice profile at deployment
- ⏱️ **Time**: 2-3 hours per template = 24-36 hours total
- 🎯 **Quality**: Highest - Hot Tub Man level for each industry

### **Option B: Dynamic System Message Generator** (Automated, Scalable)
- ✅ Create universal generator function
- ✅ Reads business type from profile
- ✅ Loads business-specific rules from schema
- ✅ Injects onboarding data dynamically
- ✅ Adds voice profile automatically
- ✅ Works for all business types
- ⏱️ **Time**: 4-6 hours total
- 🎯 **Quality**: Good - Consistent across all types

### **Option C: Hybrid Approach** (Best of Both)
- ✅ Create core templates for top 5 business types (Electrician, HVAC, Plumber, Pools, Roofing)
- ✅ Use dynamic generator for remaining types
- ✅ Best quality where it matters most
- ✅ Scalable for new business types
- ⏱️ **Time**: 10-15 hours total
- 🎯 **Quality**: Excellent for top types, Good for others

---

## 🎯 **Recommended Next Steps**

### **Phase 1: Proof of Concept** (2-4 hours)
1. ✅ Create comprehensive system message for **Hot Tub & Spa** (your actual business)
2. ✅ Use ALL onboarding data collected
3. ✅ Integrate voice profile from email analysis
4. ✅ Test with real customer emails
5. ✅ Measure quality vs current system

### **Phase 2: Top 5 Business Types** (10-15 hours)
1. ✅ Electrician
2. ✅ HVAC
3. ✅ Plumber
4. ✅ Pools & Spas
5. ✅ Roofing

### **Phase 3: Dynamic Generator** (4-6 hours)
1. ✅ Build universal generator
2. ✅ Support all 12+ business types
3. ✅ Auto-update when onboarding changes

### **Phase 4: Continuous Improvement** (Ongoing)
1. ✅ Collect user feedback
2. ✅ A/B test different prompt structures
3. ✅ Refine based on AI draft quality
4. ✅ Add new business types as needed

---

## 💡 **Key Insights**

### **What Makes Hot Tub Man System Message Great:**
1. ✅ **Specific inquiry types** (not generic "support")
2. ✅ **Exact pricing** ($105 site inspection, not "contact for pricing")
3. ✅ **Clear protocols** (what to do for each inquiry type)
4. ✅ **Upsell opportunities** (natural, contextual)
5. ✅ **Mandatory signature** (no AI variations)
6. ✅ **Real examples** (few-shot learning from actual emails)
7. ✅ **Conversation continuity** (don't repeat yourself)
8. ✅ **Action-oriented** (always provide next steps)

### **What We're Missing:**
1. ❌ Business-specific inquiry classification
2. ❌ Service-specific response protocols
3. ❌ Pricing rules (when to disclose, when to defer)
4. ❌ Upsell opportunities per business type
5. ❌ Industry-specific safety protocols
6. ❌ Seasonal considerations (HVAC in winter, pools in summer)

---

## 🚀 **What Should I Build?**

Please choose:

**A) Hot Tub Man Proof of Concept** (2-4 hours)
- Create comprehensive system message for your actual business
- Test with real data
- Measure quality improvement

**B) Top 5 Business Type Templates** (10-15 hours)
- Electrician, HVAC, Plumber, Pools, Roofing
- Hot Tub Man-level quality for each
- Manual creation, high quality

**C) Dynamic System Message Generator** (4-6 hours)
- Universal generator for all business types
- Uses onboarding data + voice profile
- Automated, scalable, good quality

**D) Hybrid Approach** (10-15 hours)
- Option A + Option C combined
- Best quality for top types
- Scalable for all others

Let me know which direction you prefer, and I'll implement it! 🎯


