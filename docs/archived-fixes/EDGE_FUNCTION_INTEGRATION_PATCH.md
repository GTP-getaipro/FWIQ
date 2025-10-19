# Edge Function Integration Patch

## Summary
This patch replaces the `behaviorReplyPrompt` generation in the edge function with our comprehensive system message generator that includes business-specific templates, inquiry types, protocols, and voice profile integration.

## Changes Required

### File: `supabase/functions/deploy-n8n/index.ts`

### **Step 1: Add Business Templates** (After line 50, before `generateDynamicAISystemMessage`)

```typescript
/**
 * Business Type Templates for comprehensive system messages
 * Inline version for Deno edge function
 */
const businessTypeTemplates = {
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
    protocols: `
**Service Call Booking:**
- Search Gmail for previous conversations
- If existing customer, use known details
- Only request missing information  
- Pricing: Site inspection $105, Labor $125/hr
- Response time: Within 24 hours
- Required info: Full name, address with city, spa brand/year, problem description
- Next steps: https://www.thehottubman.ca/repairs

**New Spa Sales:**
- Offer to schedule call or visit
- Do NOT send full spec sheets or price lists by email
- Response time: Within 4 hours
- Next steps: Browse https://www.thehottubman.ca/hot-tub-spas or schedule call

**Parts & Chemicals:**
- Direct to online store
- Offer to have tech bring items if service call booked
- Next steps: https://www.thehottubman.ca or https://www.thehottubman.ca/treatment-packages

**Emergency Repairs:**
- Priority response for leaks, no power, urgent issues
- Pricing: $105 + $125/hr
- Response time: Within 2 hours
- Next steps: Immediate booking https://www.thehottubman.ca/repairs
`,
    specialRules: [
      'Always ask if customer needs filters, chemicals, or test strips when booking service',
      'For mailed items: confirm send date, provide clear delivery timeline, offer backup plan',
      'If customer followed up multiple times, acknowledge delay and provide specific resolution',
      'When confirming appointments, restate time, technician prep needs, and service scope',
      'For payment follow-ups: offer all 3 methods (link, e-transfer to payments@thehottubman.ca, phone 403-550-5140)',
      'For attachments: always acknowledge receipt and reference how it helps'
    ],
    upsellPrompts: [
      'If you need any filters, chemicals, or test strips, let us know—we can have the tech bring those out with them!',
      'Would you like us to include any Harmony treatment packs with your service?'
    ]
  },
  
  // Add more templates as needed (Electrician, HVAC, etc.)
  // For now, General fallback handles all others
  
  'General': {
    inquiryTypes: [
      {
        name: 'Service Request',
        description: 'General service inquiries',
        keywords: 'service, help, need, repair',
        pricing: 'Varies'
      }
    ],
    protocols: 'Acknowledge request, provide relevant information, offer clear next step',
    specialRules: ['Be professional and helpful', 'Provide clear next steps'],
    upsellPrompts: []
  }
};

function getBusinessTypeTemplate(businessType) {
  return businessTypeTemplates[businessType] || businessTypeTemplates['General'];
}
```

### **Step 2: Replace `behaviorReplyPrompt` generation** (Lines 857-901)

**REPLACE THIS:**
```typescript
let behaviorReplyPrompt = `You are drafting professional email replies for ${business.name || 'Your Business'}.

BASELINE TONE (from business type):
- Tone: ${behaviorTone}
- Formality: Professional
- Be clear, concise, and helpful
`;
// ... rest of old code ...
```

**WITH THIS:**
```typescript
// Get business type template
const primaryBusinessType = businessTypes[0] || 'General';
const template = getBusinessTypeTemplate(primaryBusinessType);

// Build comprehensive behavior reply prompt
let behaviorReplyPrompt = `# AI Assistant Role for ${business.name || 'Your Business'}

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
- Assess conversation depth: If customer is on 2nd or 3rd message, avoid repeating earlier answers
- When replying to follow-ups, do not summarize prior messages—advance the resolution
- If human reply is incomplete, ensure AI reply fills gaps: confirm details, include next steps, express gratitude
- Always analyze the most recent customer input to understand current context

## Inquiry Classification

${template.inquiryTypes?.map(type => `
### ${type.name}
${type.description}
${type.keywords ? `**Keywords**: ${type.keywords}` : ''}
${type.pricing ? `**Pricing**: ${type.pricing}` : ''}
`).join('\n') || 'Standard inquiry types apply'}

### Available Services:
${services.length > 0 ? services.map(s => `- **${s.name}**: ${s.description || ''}${rules?.aiGuardrails?.allowPricing && s.price ? ` (${s.price})` : ''}`).join('\n') : '- No specific services configured'}

## Response Protocols

${template.protocols || 'Follow standard professional protocols'}

## Team & Routing

${managers.length > 0 ? `### Team Members:\n${managers.map(m => `- **${m.name}**${m.role ? ` (${m.role})` : ''}${m.email ? ` - ${m.email}` : ''}`).join('\n')}` : ''}

${managers.length > 0 ? `**Escalation**: Route critical issues to ${rules?.defaultEscalationManager || managers[0]?.name || 'management'}` : ''}

${suppliers.length > 0 ? `\n### Known Suppliers:\n${suppliers.map(s => `- **${s.name}**${s.category ? ` (${s.category})` : ''}${s.domains?.length > 0 ? ` - ${s.domains.join(', ')}` : ''}`).join('\n')}` : ''}

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

${rules?.phoneProvider ? `\n### Phone Provider: ${rules.phoneProvider.name}\n${rules.phoneProvider.senders?.length > 0 ? `Recognize these as phone notifications: ${rules.phoneProvider.senders.join(', ')}` : ''}` : ''}

${rules?.crmProvider ? `\n### CRM: ${rules.crmProvider.name}` : ''}

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
${signaturePhrases.slice(0, 10).map(p => `- "${p.phrase}"${p.context ? ` (${p.context})` : ''}`).join('\n') || '- No learned phrases yet'}

**Important**: Match this style consistently. Use these phrases and patterns to sound like YOU.
`;

    // Add few-shot examples
    if (Object.keys(fewShotExamples).length > 0) {
      behaviorReplyPrompt += `\n## Few-Shot Examples from Your Emails

These are real examples of how you communicate. Use them as reference:\n`;
      
      Object.entries(fewShotExamples).forEach(([category, examples]) => {
        if (examples && examples.length > 0) {
          behaviorReplyPrompt += `\n### ${category.toUpperCase()} Examples:\n`;
          examples.slice(0, 2).forEach((ex, idx) => {
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
  behaviorReplyPrompt += `- Use ${business.timezone} timestamps if dates/times are mentioned\n`;
}
behaviorReplyPrompt += `- Never invent facts or prices; use only data provided\n`;
behaviorReplyPrompt += `- Correct obvious spelling errors in customer emails when quoting them\n`;

if (rules?.aiGuardrails?.allowPricing) {
  behaviorReplyPrompt += `- You MAY discuss pricing as specified in the services section\n`;
} else {
  behaviorReplyPrompt += `- You may NOT discuss specific pricing - direct customers to request a quote\n`;
}

if (template.specialRules && template.specialRules.length > 0) {
  behaviorReplyPrompt += `\n### Business-Specific Rules:\n`;
  template.specialRules.forEach(rule => {
    behaviorReplyPrompt += `- ${rule}\n`;
  });
}

if (rules?.escalationRules) {
  behaviorReplyPrompt += `\n### Escalation: ${rules.escalationRules}\n`;
}

if (template.upsellPrompts && template.upsellPrompts.length > 0) {
  behaviorReplyPrompt += `\n### Upsell Opportunities:\n`;
  template.upsellPrompts.forEach(prompt => {
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
```

## Testing

After applying this patch:

1. Deploy edge function:
```bash
npx supabase functions deploy deploy-n8n --project-ref oinxzvqszingwstrbdro
```

2. Test deployment with Hot Tub & Spa business type

3. Verify system message includes:
   - Inquiry types (Service, New Spa, Chemicals, Technical)
   - Response protocols with pricing
   - Business-specific rules
   - Voice profile integration
   - Few-shot examples
   - Correct signature

## Benefits

✅ **Hot Tub Man-level system messages** for all business types
✅ **Business-specific inquiry classification**
✅ **Detailed protocols** for each scenario
✅ **Voice profile integration** (learned from emails)
✅ **Few-shot examples** from real customer interactions
✅ **Mandatory signature enforcement**
✅ **Upsell opportunities** naturally integrated
✅ **Conversation continuity** built-in

## Next Steps

1. Apply patch to edge function
2. Deploy to Supabase
3. Test with real workflow deployment
4. Add remaining business type templates (Electrician, HVAC, etc.)
5. Monitor AI draft quality improvements


