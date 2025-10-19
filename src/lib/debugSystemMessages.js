/**
 * Debug System Messages
 * Helps debug why system messages are not complete for classifier and draft AI
 */

import { extractAIConfigForN8n, buildProductionClassifier, loadLabelSchemaForBusinessTypes } from './aiSchemaInjector.js';
import { extractBehaviorConfigForN8n, generateBehaviorPlaceholders } from './behaviorSchemaInjector.js';
import { GoldStandardReplyPrompt } from './goldStandardReplyPrompt.js';

export const debugSystemMessages = async (clientData) => {
  console.log('🔍 DEBUG: System Messages Analysis');
  console.log('📊 Client data:', clientData);
  
  const results = {
    aiClassifier: null,
    aiDraft: null,
    errors: [],
    warnings: []
  };
  
  try {
    // Step 1: Debug AI Classifier System Message
    console.log('🔄 Step 1: Debugging AI Classifier System Message...');
    
    const businessTypes = clientData.business?.businessTypes || ['general'];
    const businessInfo = {
      name: clientData.business?.name,
      phone: clientData.business?.phone,
      websiteUrl: clientData.business?.websiteUrl,
      emailDomain: clientData.business?.emailDomain,
      managers: clientData.managers || [],
      suppliers: clientData.suppliers || [],
      serviceAreas: clientData.business?.serviceAreas || ['Main service area'],
      timezone: clientData.business?.timezone || 'UTC/GMT -6'
    };
    
    // Extract AI config
    const aiConfig = extractAIConfigForN8n(businessTypes, businessInfo);
    console.log('✅ AI config extracted:', aiConfig);
    
    // Load label schema
    const labelConfig = await loadLabelSchemaForBusinessTypes(
      businessTypes, 
      clientData.managers || [], 
      clientData.suppliers || []
    );
    console.log('✅ Label config loaded:', labelConfig);
    
    // Build production classifier
    const productionClassifier = buildProductionClassifier(
      aiConfig, 
      labelConfig, 
      businessInfo, 
      clientData.managers || [], 
      clientData.suppliers || []
    );
    console.log('✅ Production classifier built:', productionClassifier);
    
    results.aiClassifier = {
      success: true,
      aiConfig,
      labelConfig,
      systemMessage: productionClassifier,
      length: productionClassifier.length,
      hasBusinessContext: productionClassifier.includes(businessInfo.name || 'Business'),
      hasManagers: productionClassifier.includes('Managers:'),
      hasSuppliers: productionClassifier.includes('Suppliers:'),
      hasLabels: productionClassifier.includes('LABELS:'),
      hasKeywords: productionClassifier.includes('KEYWORDS:')
    };
    
  } catch (error) {
    console.error('❌ AI Classifier debug failed:', error);
    results.errors.push(`AI Classifier: ${error.message}`);
    results.aiClassifier = {
      success: false,
      error: error.message
    };
  }
  
  try {
    // Step 2: Debug AI Draft System Message
    console.log('🔄 Step 2: Debugging AI Draft System Message...');
    
    const businessTypes = clientData.business?.businessTypes || ['general'];
    const businessInfo = {
      name: clientData.business?.name,
      phone: clientData.business?.phone,
      websiteUrl: clientData.business?.websiteUrl,
      emailDomain: clientData.business?.emailDomain,
      managers: clientData.managers || [],
      suppliers: clientData.suppliers || [],
      serviceAreas: clientData.business?.serviceAreas || ['Main service area'],
      timezone: clientData.business?.timezone || 'UTC/GMT -6'
    };
    
    // Extract behavior config
    const behaviorConfig = extractBehaviorConfigForN8n(businessTypes, businessInfo, clientData.voiceProfile);
    console.log('✅ Behavior config extracted:', behaviorConfig);
    
    // Generate gold standard prompt
    const goldStandardPrompt = new GoldStandardReplyPrompt();
    const replyPrompt = goldStandardPrompt.generateReplyPrompt({
      businessName: businessInfo.name || 'Business',
      businessPhone: businessInfo.phone || '(555) 555-5555',
      websiteUrl: businessInfo.websiteUrl || 'https://example.com',
      primaryProductService: 'hot tubs and spas',
      primaryProductCategory: 'pools_spas',
      managers: businessInfo.managers,
      serviceAreas: businessInfo.serviceAreas,
      timezone: businessInfo.timezone,
      currentDateTime: new Date().toISOString(),
      paymentOptions: clientData.business?.paymentOptions || {},
      pricingInfo: clientData.business?.pricingInfo || {},
      upsellLanguage: clientData.business?.upsellLanguage || ''
    });
    
    console.log('✅ Gold standard prompt generated:', replyPrompt);
    
    results.aiDraft = {
      success: true,
      behaviorConfig,
      systemMessage: replyPrompt,
      length: replyPrompt.length,
      hasBusinessName: replyPrompt.includes(businessInfo.name || 'Business'),
      hasAssistantRole: replyPrompt.includes('Assistant role:'),
      hasIntelligentConversation: replyPrompt.includes('Intelligent Conversation Progression'),
      hasFollowUpOwnership: replyPrompt.includes('Follow-up Ownership'),
      hasPersonalTouch: replyPrompt.includes('Personal Touch'),
      hasAvoidMistakes: replyPrompt.includes('Avoid Common Mistakes'),
      hasInstructions: replyPrompt.includes('Instructions'),
      hasRules: replyPrompt.includes('Rules'),
      hasExamples: replyPrompt.includes('Example success replies')
    };
    
  } catch (error) {
    console.error('❌ AI Draft debug failed:', error);
    results.errors.push(`AI Draft: ${error.message}`);
    results.aiDraft = {
      success: false,
      error: error.message
    };
  }
  
  // Step 3: Check template replacement
  console.log('🔄 Step 3: Checking template replacement...');
  
  const testTemplate = {
    nodes: [
      {
        id: 'ai-classifier',
        parameters: {
          systemMessage: '<<<AI_SYSTEM_MESSAGE>>>'
        }
      },
      {
        id: 'ai-draft',
        parameters: {
          systemMessage: '<<<BEHAVIOR_REPLY_PROMPT>>>'
        }
      }
    ]
  };
  
  const replacements = {
    '<<<AI_SYSTEM_MESSAGE>>>': results.aiClassifier?.systemMessage || 'DEFAULT AI MESSAGE',
    '<<<BEHAVIOR_REPLY_PROMPT>>>': results.aiDraft?.systemMessage || 'DEFAULT BEHAVIOR MESSAGE'
  };
  
  let templateString = JSON.stringify(testTemplate);
  Object.entries(replacements).forEach(([placeholder, value]) => {
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    templateString = templateString.replace(regex, value);
  });
  
  const finalTemplate = JSON.parse(templateString);
  console.log('✅ Template replacement test:', finalTemplate);
  
  results.templateReplacement = {
    success: true,
    originalTemplate: testTemplate,
    replacements,
    finalTemplate,
    aiClassifierReplaced: finalTemplate.nodes[0].parameters.systemMessage !== '<<<AI_SYSTEM_MESSAGE>>>',
    aiDraftReplaced: finalTemplate.nodes[1].parameters.systemMessage !== '<<<BEHAVIOR_REPLY_PROMPT>>>'
  };
  
  console.log('🔍 DEBUG: System Messages Analysis Complete');
  console.log('📊 Results:', results);
  
  return results;
};

export default {
  debugSystemMessages
};
