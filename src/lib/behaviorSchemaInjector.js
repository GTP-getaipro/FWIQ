import { mergeBusinessTypeBehaviors } from './behaviorSchemaMerger.js';
import { buildVoiceEnhancedPrompt, getVoiceProfileSummary } from './voicePromptEnhancer.js';
import { GoldStandardReplyPrompt } from './goldStandardReplyPrompt.js';

/**
 * Extracts behavior configuration from merged behavior schemas for n8n deployment
 * Enhanced with learned voice profile from voice training system
 * @param {string[]} businessTypes - Array of business types
 * @param {object} businessInfo - Business metadata
 * @param {object} voiceProfile - Learned voice profile (optional)
 * @returns {object} - Behavior config ready for n8n injection
 */
export const extractBehaviorConfigForN8n = (businessTypes, businessInfo = {}, voiceProfile = null) => {
  // Ensure businessTypes is an array
  const types = Array.isArray(businessTypes) ? businessTypes : [businessTypes];
  
  // Merge behavior schemas for all business types
  const mergedBehavior = mergeBusinessTypeBehaviors(types);
  
  // Extract voice profile
  const voiceTone = mergedBehavior.voiceProfile?.tone || 'Professional and friendly';
  const formalityLevel = mergedBehavior.voiceProfile?.formalityLevel || 'professional';
  const allowPricing = mergedBehavior.voiceProfile?.allowPricingInReplies !== false;
  
  // Extract AI draft rules
  const upsellEnabled = mergedBehavior.aiDraftRules?.upsellGuidelines?.enabled !== false;
  const upsellText = mergedBehavior.aiDraftRules?.upsellGuidelines?.text || '';
  
  const followUpEnabled = mergedBehavior.aiDraftRules?.followUpGuidelines?.enabled !== false;
  const followUpText = mergedBehavior.aiDraftRules?.followUpGuidelines?.text || '';
  
  const escalationGuidelines = mergedBehavior.aiDraftRules?.escalationGuidelines || {};
  
  // Extract category overrides
  const categoryOverrides = mergedBehavior.categoryOverrides || {};
  
  // Build behavior goals text
  const behaviorGoals = (mergedBehavior.behaviorGoals || []).map((goal, i) => 
    `${i + 1}. ${goal}`
  ).join('\n');
  
  // Use Gold Standard Reply Prompt instead of simple prompt
  const goldStandardPrompt = new GoldStandardReplyPrompt();
  
  // Debug: Log what business info we're receiving
  console.log('🔍 DEBUG: Behavior config - businessInfo received:', {
    name: businessInfo.name,
    phone: businessInfo.phone,
    websiteUrl: businessInfo.websiteUrl,
    emailDomain: businessInfo.emailDomain,
    businessTypes: businessInfo.businessTypes,
    managers: businessInfo.managers?.length || 0,
    suppliers: businessInfo.suppliers?.length || 0
  });
  
  // Build comprehensive reply prompt using gold standard template
  // Include ALL business information from onboarding wizard
  const promptData = {
    businessName: businessInfo.name || 'Business',
    businessPhone: businessInfo.phone || '(555) 555-5555',
    websiteUrl: businessInfo.websiteUrl || 'https://example.com',
    businessType: businessInfo.businessTypes?.join(', ') || businessTypes.join(', ') || 'General Services',
    primaryProductService: getPrimaryProductService(businessInfo.businessTypes || businessTypes),
    primaryProductCategory: getPrimaryProductCategory(businessInfo.businessTypes || businessTypes),
    operatingHours: businessInfo.operatingHours || 'Monday-Friday 8AM-5PM',
    responseTime: businessInfo.responseTime || '24 hours',
    inquiryTypes: getInquiryTypes(businessInfo.businessTypes || businessTypes),
    paymentOptions: buildPaymentOptions(businessInfo),
    callToActionOptions: buildCallToActionOptions(businessInfo),
    signatureBlock: buildSignatureBlock(businessInfo),
    managers: businessInfo.managers || [],
    suppliers: businessInfo.suppliers || [],
    serviceAreas: businessInfo.serviceAreas || ['Main service area'],
    techPrepTips: getTechPrepTips(businessInfo.businessTypes || businessTypes),
    deliveryPrepActions: getDeliveryPrepActions(businessInfo.businessTypes || businessTypes),
    partnerSupport: getPartnerSupport(businessInfo.businessTypes || businessTypes),
    technicalSpecs: getTechnicalSpecs(businessInfo.businessTypes || businessTypes),
    upsellOpportunities: getUpsellOpportunities(businessInfo.businessTypes || businessTypes),
    upsellLanguage: getUpsellLanguage(businessInfo.businessTypes || businessTypes),
    productDetails: getProductDetails(businessInfo.businessTypes || businessTypes),
    newClientInfoRequired: getNewClientInfoRequired(businessInfo.businessTypes || businessTypes),
    pricingInfo: buildPricingInfo(businessInfo),
    additionalLinks: buildAdditionalLinks(businessInfo),
    timezone: businessInfo.timezone || 'UTC/GMT -6',
    currentDateTime: new Date().toISOString(),
    exampleReplies: buildExampleReplies(businessInfo, voiceProfile)
  };
  
  // Debug: Log what we're passing to generateReplyPrompt
  console.log('🔍 DEBUG: Prompt data being passed to generateReplyPrompt:', {
    businessName: promptData.businessName,
    businessPhone: promptData.businessPhone,
    websiteUrl: promptData.websiteUrl,
    primaryProductService: promptData.primaryProductService,
    managers: promptData.managers?.length || 0,
    suppliers: promptData.suppliers?.length || 0,
    exampleRepliesLength: promptData.exampleReplies?.length || 0
  });
  
  let replyPrompt = goldStandardPrompt.generateReplyPrompt(promptData);
  
  // Add signature template info
  const signatureTemplate = mergedBehavior.signatureTemplate || null;
  if (signatureTemplate) {
    replyPrompt += `\nSIGNATURE TEMPLATE:\n${signatureTemplate}\n`;
  }

  // VOICE TRAINING ENHANCEMENT: Add learned voice profile if available
  if (voiceProfile?.style_profile) {
    const voice = voiceProfile.style_profile.voice || {};
    const signaturePhrases = voiceProfile.style_profile.signaturePhrases || [];
    const fewShotExamples = voiceProfile.style_profile.fewShotExamples || {};
    const learningCount = voiceProfile.learning_count || 0;
    const source = voiceProfile.style_profile.source || 'unknown';
    
    // Show voice profile for both initial analysis and learned profiles
    if (learningCount > 0 || source === 'onboarding_analysis') {
      const profileSource = learningCount > 0 
        ? `from ${learningCount} analyzed edits` 
        : `from historical email analysis`;
        
      replyPrompt += `\n\n🎤 VOICE PROFILE (${profileSource}):\n`;
      replyPrompt += `- Empathy Level: ${voice.empathyLevel || 0.7}/1.0\n`;
      replyPrompt += `- Formality Level: ${voice.formalityLevel || 0.8}/1.0\n`;
      replyPrompt += `- Directness Level: ${voice.directnessLevel || 0.8}/1.0\n`;
      replyPrompt += `- Voice Confidence: ${voice.confidence || 0.5}/1.0\n`;
      
      if (signaturePhrases.length > 0) {
        replyPrompt += `\nYOUR PREFERRED PHRASES (use these frequently):\n`;
        const topPhrases = signaturePhrases
          .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
          .slice(0, 10);
        
        topPhrases.forEach(p => {
          replyPrompt += `- "${p.phrase}" (${(p.confidence || 0).toFixed(2)} confidence, context: ${p.context})\n`;
        });
      }
      
      if (voice.commonPhrases && voice.commonPhrases.length > 0) {
        replyPrompt += `\nCOMMON PHRASES FROM YOUR STYLE:\n`;
        voice.commonPhrases.slice(0, 8).forEach(phrase => {
          replyPrompt += `- "${phrase}"\n`;
        });
      }
      
      // NEW: Add few-shot examples by category
      if (Object.keys(fewShotExamples).length > 0) {
        replyPrompt += `\n\n📚 REAL EXAMPLES FROM YOUR HISTORICAL EMAILS:\n`;
        replyPrompt += `(Use these as templates to match your authentic style)\n\n`;
        
        // Add examples for each category that has them
        Object.entries(fewShotExamples).forEach(([category, examples]) => {
          if (examples && examples.length > 0) {
            replyPrompt += `${category.toUpperCase()} EMAILS:\n`;
            examples.slice(0, 2).forEach((example, i) => {
              // Only show clean, readable examples (not HTML)
              const cleanBody = example.body || '';
              if (cleanBody && !cleanBody.includes('<') && !cleanBody.includes('DOCTYPE')) {
                replyPrompt += `\nExample ${i + 1}:\n`;
                replyPrompt += `Subject: ${example.subject || 'No Subject'}\n`;
                replyPrompt += `Body: ${cleanBody.substring(0, 200)}${cleanBody.length > 200 ? '...' : ''}\n`;
              }
            });
            replyPrompt += '\n';
          }
        });
        
        replyPrompt += `Match the STYLE and TONE of these examples when drafting similar emails.\n`;
      } else {
        // Provide default professional examples when no historical data is available
        replyPrompt += `\n\n📚 PROFESSIONAL EMAIL EXAMPLES:\n`;
        replyPrompt += `Use these as reference for professional communication style:\n\n`;
        
        replyPrompt += `GENERAL EMAILS:\n`;
        replyPrompt += `Example 1:\n`;
        replyPrompt += `Subject: Thank you for your inquiry\n`;
        replyPrompt += `Body: Hi [Name],\n\nThank you for reaching out to us. I appreciate your interest in our services.\n\nI'll review your request and get back to you within 24 hours with more details.\n\nBest regards,\n[Your Name]\n\n`;
        
        replyPrompt += `Example 2:\n`;
        replyPrompt += `Subject: Following up on your message\n`;
        replyPrompt += `Body: Hi [Name],\n\nI wanted to follow up on your recent message about [topic].\n\nBased on what you've shared, I believe we can help you with [solution]. Let me know if you'd like to schedule a brief call to discuss further.\n\nBest regards,\n[Your Name]\n\n`;
        
        replyPrompt += `Match this professional and helpful tone when drafting similar emails.\n`;
      }
      
      if (voice.signOff) {
        replyPrompt += `\nYOUR SIGNATURE SIGN-OFF:\n${voice.signOff}\n`;
      } else {
        replyPrompt += `\nYOUR SIGNATURE SIGN-OFF:\nBest regards,\n`;
      }
      
      replyPrompt += `\nIMPORTANT: Match YOUR voice style. Use YOUR preferred phrases and real examples above.\n`;
    }
  }
  
  const voiceSummary = getVoiceProfileSummary(voiceProfile);
  
  return {
    voiceTone,
    formalityLevel,
    allowPricing,
    upsellEnabled,
    upsellText,
    followUpEnabled,
    followUpText,
    behaviorGoals,
    categoryOverrides,
    replyPrompt,
    signatureTemplate,
    escalationGuidelines,
    voiceProfile: voiceProfile,
    voiceSummary: voiceSummary,
    mergedSchema: mergedBehavior // Include full schema for advanced usage
  };
};

/**
 * Generate behavior-specific placeholders for n8n template injection
 * @param {object} behaviorConfig - Output from extractBehaviorConfigForN8n
 * @returns {object} - Placeholder replacements
 */
export const generateBehaviorPlaceholders = (behaviorConfig) => {
  return {
    '<<<BEHAVIOR_VOICE_TONE>>>': behaviorConfig.voiceTone,
    '<<<BEHAVIOR_FORMALITY>>>': behaviorConfig.formalityLevel,
    '<<<BEHAVIOR_ALLOW_PRICING>>>': String(behaviorConfig.allowPricing),
    '<<<BEHAVIOR_UPSELL_TEXT>>>': behaviorConfig.upsellText,
    '<<<BEHAVIOR_FOLLOWUP_TEXT>>>': behaviorConfig.followUpText,
    '<<<BEHAVIOR_GOALS>>>': behaviorConfig.behaviorGoals,
    '<<<BEHAVIOR_REPLY_PROMPT>>>': behaviorConfig.replyPrompt,
    '<<<BEHAVIOR_CATEGORY_OVERRIDES>>>': JSON.stringify(behaviorConfig.categoryOverrides),
    '<<<BEHAVIOR_SIGNATURE_TEMPLATE>>>': behaviorConfig.signatureTemplate || ''
  };
};

/**
 * Build category-specific reply instructions
 * @param {string} category - Email category (e.g., 'Urgent', 'Sales')
 * @param {object} behaviorConfig - Output from extractBehaviorConfigForN8n
 * @returns {string} - Category-specific instructions
 */
export const getCategorySpecificInstructions = (category, behaviorConfig) => {
  const override = behaviorConfig.categoryOverrides[category];
  
  if (!override) {
    return behaviorConfig.replyPrompt;
  }
  
  let instructions = `Replying to ${category} email:\n\n`;
  
  if (override.tone) {
    instructions += `Use ${override.tone} tone.\n`;
  } else {
    instructions += `Use ${behaviorConfig.voiceTone} tone.\n`;
  }
  
  if (override.customLanguage && override.customLanguage.length > 0) {
    instructions += `\nInclude these elements:\n`;
    override.customLanguage.forEach(phrase => {
      instructions += `- ${phrase}\n`;
    });
  }
  
  if (override.priorityLevel) {
    instructions += `\nPriority: ${override.priorityLevel}\n`;
  }
  
  instructions += `\n${behaviorConfig.replyPrompt}`;
  
  return instructions;
};

// Helper functions for business-specific data generation
function getPrimaryProductService(businessTypes) {
  const typeMapping = {
    'pools_spas': 'hot tubs and spas',
    'hvac': 'HVAC systems',
    'plumbing': 'plumbing services',
    'electrical': 'electrical services',
    'general_contractor': 'construction and renovation services',
    'landscaping': 'landscaping and outdoor services'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || 'products and services';
}

function getPrimaryProductCategory(businessTypes) {
  const typeMapping = {
    'pools_spas': 'spas',
    'hvac': 'HVAC equipment',
    'plumbing': 'plumbing fixtures',
    'electrical': 'electrical components',
    'general_contractor': 'construction materials',
    'landscaping': 'landscaping materials'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || 'products';
}

function getInquiryTypes(businessTypes) {
  const typeMapping = {
    'pools_spas': [
      'Service Job Inquiry (repairs / site inspections)',
      'New Spa Inquiry (shopping for a new hot tub)',
      'Chemicals & Parts Inquiry (supplies or replacement parts)',
      'Technical Help / Troubleshooting (advice on error codes, leaks, water chemistry, etc.)'
    ],
    'hvac': [
      'Service Job Inquiry (repairs / maintenance)',
      'New System Inquiry (shopping for HVAC equipment)',
      'Parts & Accessories Inquiry',
      'Technical Help / Troubleshooting'
    ],
    'plumbing': [
      'Service Job Inquiry (repairs / installations)',
      'New Fixture Inquiry',
      'Parts & Accessories Inquiry',
      'Technical Help / Troubleshooting'
    ],
    'electrical': [
      'Service Job Inquiry (repairs / installations)',
      'New Electrical Work Inquiry',
      'Parts & Accessories Inquiry',
      'Technical Help / Troubleshooting'
    ],
    'general_contractor': [
      'Project Inquiry (renovations / construction)',
      'New Build Inquiry',
      'Materials & Supplies Inquiry',
      'Technical Help / Troubleshooting'
    ],
    'landscaping': [
      'Service Job Inquiry (maintenance / installations)',
      'New Landscape Design Inquiry',
      'Plants & Materials Inquiry',
      'Technical Help / Troubleshooting'
    ]
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || [
    'Service Job Inquiry',
    'New Product Inquiry',
    'Parts & Accessories Inquiry',
    'Technical Help / Troubleshooting'
  ];
}

function buildPaymentOptions(businessInfo) {
  const emailDomain = businessInfo.emailDomain || 'business.com';
  const phone = businessInfo.phone || '(555) 555-5555';
  
  return `For payment, you can:
- Click the link in the estimate
- E-transfer to payments@${emailDomain}
- Call us with your credit card at ${phone}—whichever method is easiest for you!`;
}

function buildCallToActionOptions(businessInfo) {
  const websiteUrl = businessInfo.websiteUrl || 'https://example.com';
  
  return `- Schedule a service call → ${websiteUrl}/repairs
- Order online → ${websiteUrl}
- Browse products → ${websiteUrl}/products`;
}

function buildSignatureBlock(businessInfo) {
  const businessName = businessInfo.name || 'Business';
  const phone = businessInfo.phone || '(555) 555-5555';
  
  return `Thanks so much for supporting our small business!
Best regards,
The ${businessName} Team
${phone}`;
}

function getTechPrepTips(businessTypes) {
  const typeMapping = {
    'pools_spas': '(like ensuring the tub is full and accessible)',
    'hvac': '(like ensuring the system is accessible and powered off)',
    'plumbing': '(like ensuring water is turned off)',
    'electrical': '(like ensuring power is turned off)',
    'general_contractor': '(like ensuring the work area is accessible)',
    'landscaping': '(like ensuring the area is accessible)'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || '(like ensuring the equipment is accessible)';
}

function getDeliveryPrepActions(businessTypes) {
  const typeMapping = {
    'pools_spas': '(gate width, electrical readiness, access path)',
    'hvac': '(access to installation area, electrical requirements)',
    'plumbing': '(access to plumbing lines, shut-off locations)',
    'electrical': '(access to electrical panel, circuit requirements)',
    'general_contractor': '(access to work area, material delivery location)',
    'landscaping': '(access to property, soil conditions)'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || '(gate width, access, power setup)';
}

function getPartnerSupport(businessTypes) {
  const typeMapping = {
    'pools_spas': '(like electricians for spa electrical work)',
    'hvac': '(like electricians for electrical connections)',
    'plumbing': '(like electricians for electrical work)',
    'electrical': '(like plumbers for related plumbing work)',
    'general_contractor': '(like electricians, plumbers, and other trades)',
    'landscaping': '(like irrigation specialists)'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || '(like electricians or contractors)';
}

function getTechnicalSpecs(businessTypes) {
  const typeMapping = {
    'pools_spas': 'amperage, clearance, or installation requirements',
    'hvac': 'BTU requirements, ductwork, or electrical specifications',
    'plumbing': 'pipe sizes, water pressure, or installation requirements',
    'electrical': 'amperage, voltage, or circuit requirements',
    'general_contractor': 'dimensions, materials, or structural requirements',
    'landscaping': 'soil conditions, drainage, or irrigation requirements'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || 'amperage, clearance, or installation requirements';
}

function getUpsellOpportunities(businessTypes) {
  const typeMapping = {
    'pools_spas': '(like filters, chemicals, or accessories)',
    'hvac': '(like filters, thermostats, or maintenance plans)',
    'plumbing': '(like fixtures, water treatment, or maintenance plans)',
    'electrical': '(like surge protectors, smart switches, or maintenance plans)',
    'general_contractor': '(like materials, fixtures, or additional services)',
    'landscaping': '(like plants, irrigation, or maintenance services)'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || '(like filters, parts, or accessories)';
}

function getUpsellLanguage(businessTypes) {
  const typeMapping = {
    'pools_spas': '"If you need any filters, chemicals, or test strips, let us know — we can have the tech bring those out with them!"',
    'hvac': '"If you need any filters, thermostats, or maintenance supplies, let us know — we can bring those along!"',
    'plumbing': '"If you need any fixtures, water treatment, or maintenance supplies, let us know — we can bring those along!"',
    'electrical': '"If you need any surge protectors, smart switches, or electrical supplies, let us know — we can bring those along!"',
    'general_contractor': '"If you need any materials, fixtures, or additional services, let us know — we can include those in the project!"',
    'landscaping': '"If you need any plants, irrigation supplies, or maintenance services, let us know — we can include those!"'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || '"If you need any parts, accessories, or supplies, let us know — we can bring those along!"';
}

function getProductDetails(businessTypes) {
  const typeMapping = {
    'pools_spas': 'brand, model, and approximate year',
    'hvac': 'brand, model, and approximate age',
    'plumbing': 'brand, model, and approximate age',
    'electrical': 'brand, model, and approximate age',
    'general_contractor': 'dimensions, materials, and current condition',
    'landscaping': 'size, type, and current condition'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || 'brand, model, and approximate year';
}

function getNewClientInfoRequired(businessTypes) {
  const typeMapping = {
    'pools_spas': `- Full name
- Address (with city)
- Spa brand and approx. year
- Access details
- Problem description and any error codes`,
    'hvac': `- Full name
- Address (with city)
- System brand and approx. age
- Access details
- Problem description and any error codes`,
    'plumbing': `- Full name
- Address (with city)
- Fixture brand and approx. age
- Access details
- Problem description`,
    'electrical': `- Full name
- Address (with city)
- System brand and approx. age
- Access details
- Problem description`,
    'general_contractor': `- Full name
- Address (with city)
- Project type and scope
- Access details
- Timeline and budget`,
    'landscaping': `- Full name
- Address (with city)
- Property size and type
- Access details
- Desired services`
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || `- Full name
- Address (with city)
- Product brand and approx. year
- Access details
- Problem description and any error codes`;
}

export default {
  extractBehaviorConfigForN8n,
  generateBehaviorPlaceholders,
  getCategorySpecificInstructions
};

