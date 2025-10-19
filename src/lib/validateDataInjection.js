/**
 * Validate Data Injection
 * Checks if we're actually doing what we're supposed to do with the 3-layer schema + voice training
 */

import { extractAIConfigForN8n, buildProductionClassifier, loadLabelSchemaForBusinessTypes } from './aiSchemaInjector.js';
import { extractBehaviorConfigForN8n, generateBehaviorPlaceholders } from './behaviorSchemaInjector.js';
import { GoldStandardReplyPrompt } from './goldStandardReplyPrompt.js';
import { GoldStandardSystemPrompt } from './goldStandardSystemPrompt.js';

export const validateDataInjection = async (clientData) => {
  console.log('VALIDATION: Checking if we do what we are supposed to do');
  console.log('Input client data:', clientData);
  
  const validation = {
    layer1: { success: false, details: null, issues: [] },
    layer2: { success: false, details: null, issues: [] },
    layer3: { success: false, details: null, issues: [] },
    voiceTraining: { success: false, details: null, issues: [] },
    userData: { success: false, details: null, issues: [] },
    overall: { success: false, summary: '' }
  };
  
  try {
    // VALIDATE LAYER 1: AI Configuration (businessSchemas)
    console.log('Validating Layer 1: AI Configuration...');
    
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
    
    const aiConfig = extractAIConfigForN8n(businessTypes, businessInfo);
    
    validation.layer1 = {
      success: true,
      details: {
        businessTypes,
        businessInfo,
        aiConfig,
        systemMessageLength: aiConfig.systemMessage?.length || 0,
        hasBusinessName: aiConfig.systemMessage?.includes(businessInfo.name || 'Business') || false,
        hasKeywords: aiConfig.keywords?.length > 0 || false,
        hasIntentMapping: Object.keys(aiConfig.intentMapping || {}).length > 0
      },
      issues: []
    };
    
    console.log('Layer 1 validation:', validation.layer1);
    
  } catch (error) {
    console.error('Layer 1 validation failed:', error);
    validation.layer1 = {
      success: false,
      details: null,
      issues: [error.message]
    };
  }
  
  try {
    // VALIDATE LAYER 2: Behavior Configuration (behaviorSchemas)
    console.log('Validating Layer 2: Behavior Configuration...');
    
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
    
    const behaviorConfig = extractBehaviorConfigForN8n(businessTypes, businessInfo, clientData.voiceProfile);
    
    // Check if we're using gold standard prompt
    const goldStandardPrompt = new GoldStandardReplyPrompt();
    const expectedPrompt = goldStandardPrompt.generateReplyPrompt({
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
    
    const isUsingGoldStandard = behaviorConfig.replyPrompt?.includes('Assistant role:') && 
                               behaviorConfig.replyPrompt?.includes('Intelligent Conversation Progression') &&
                               behaviorConfig.replyPrompt?.includes('Follow-up Ownership') &&
                               behaviorConfig.replyPrompt?.includes('Personal Touch') &&
                               behaviorConfig.replyPrompt?.includes('Avoid Common Mistakes');
    
    validation.layer2 = {
      success: true,
      details: {
        behaviorConfig,
        replyPromptLength: behaviorConfig.replyPrompt?.length || 0,
        hasBusinessName: behaviorConfig.replyPrompt?.includes(businessInfo.name || 'Business') || false,
        hasAssistantRole: behaviorConfig.replyPrompt?.includes('Assistant role:') || false,
        hasIntelligentConversation: behaviorConfig.replyPrompt?.includes('Intelligent Conversation Progression') || false,
        hasFollowUpOwnership: behaviorConfig.replyPrompt?.includes('Follow-up Ownership') || false,
        hasPersonalTouch: behaviorConfig.replyPrompt?.includes('Personal Touch') || false,
        hasAvoidMistakes: behaviorConfig.replyPrompt?.includes('Avoid Common Mistakes') || false,
        isUsingGoldStandard,
        expectedPromptLength: expectedPrompt.length,
        actualVsExpected: {
          actual: behaviorConfig.replyPrompt?.length || 0,
          expected: expectedPrompt.length,
          ratio: (behaviorConfig.replyPrompt?.length || 0) / expectedPrompt.length
        }
      },
      issues: []
    };
    
    if (!isUsingGoldStandard) {
      validation.layer2.issues.push('NOT using gold standard reply prompt - using simple behavior schema instead');
    }
    
    if ((behaviorConfig.replyPrompt?.length || 0) < 1000) {
      validation.layer2.issues.push('Reply prompt is too short - should be 8000+ characters for comprehensive instructions');
    }
    
    console.log('Layer 2 validation:', validation.layer2);
    
  } catch (error) {
    console.error('Layer 2 validation failed:', error);
    validation.layer2 = {
      success: false,
      details: null,
      issues: [error.message]
    };
  }
  
  try {
    // VALIDATE LAYER 3: Label Configuration (labelSchemas)
    console.log('Validating Layer 3: Label Configuration...');
    
    const businessTypes = clientData.business?.businessTypes || ['general'];
    const labelConfig = await loadLabelSchemaForBusinessTypes(
      businessTypes, 
      clientData.managers || [], 
      clientData.suppliers || []
    );
    
    validation.layer3 = {
      success: true,
      details: {
        labelConfig,
        labelsCount: labelConfig.labels?.length || 0,
        hasLabels: (labelConfig.labels?.length || 0) > 0,
        hasSpecialRules: (labelConfig.specialRules?.length || 0) > 0,
        hasAutoReplyRules: !!labelConfig.autoReplyRules,
        hasDomainDetection: !!labelConfig.domainDetection
      },
      issues: []
    };
    
    if ((labelConfig.labels?.length || 0) === 0) {
      validation.layer3.issues.push('No labels found in label schema');
    }
    
    console.log('Layer 3 validation:', validation.layer3);
    
  } catch (error) {
    console.error('Layer 3 validation failed:', error);
    validation.layer3 = {
      success: false,
      details: null,
      issues: [error.message]
    };
  }
  
  try {
    // VALIDATE VOICE TRAINING INTEGRATION
    console.log('Validating Voice Training Integration...');
    
    const hasVoiceProfile = !!clientData.voiceProfile;
    const hasLearningCount = clientData.voiceProfile?.learning_count > 0;
    const hasStyleProfile = !!clientData.voiceProfile?.style_profile;
    const hasSignaturePhrases = (clientData.voiceProfile?.style_profile?.signaturePhrases?.length || 0) > 0;
    const hasFewShotExamples = Object.keys(clientData.voiceProfile?.style_profile?.fewShotExamples || {}).length > 0;
    
    validation.voiceTraining = {
      success: hasVoiceProfile,
      details: {
        hasVoiceProfile,
        hasLearningCount,
        hasStyleProfile,
        hasSignaturePhrases,
        hasFewShotExamples,
        learningCount: clientData.voiceProfile?.learning_count || 0,
        signaturePhrasesCount: clientData.voiceProfile?.style_profile?.signaturePhrases?.length || 0,
        fewShotExamplesCount: Object.keys(clientData.voiceProfile?.style_profile?.fewShotExamples || {}).length
      },
      issues: []
    };
    
    if (!hasVoiceProfile) {
      validation.voiceTraining.issues.push('No voice profile found in client data');
    }
    
    if (!hasLearningCount) {
      validation.voiceTraining.issues.push('No learning count found - voice training may not be active');
    }
    
    console.log('Voice Training validation:', validation.voiceTraining);
    
  } catch (error) {
    console.error('Voice Training validation failed:', error);
    validation.voiceTraining = {
      success: false,
      details: null,
      issues: [error.message]
    };
  }
  
  try {
    // VALIDATE USER DATA INJECTION
    console.log('Validating User Data Injection...');
    
    const hasBusinessName = !!clientData.business?.name;
    const hasEmailDomain = !!clientData.business?.emailDomain;
    const hasManagers = (clientData.managers?.length || 0) > 0;
    const hasSuppliers = (clientData.suppliers?.length || 0) > 0;
    const hasEmailLabels = Object.keys(clientData.email_labels || {}).length > 0;
    const hasIntegrations = Object.keys(clientData.integrations || {}).length > 0;
    
    validation.userData = {
      success: hasBusinessName && hasEmailDomain,
      details: {
        hasBusinessName,
        hasEmailDomain,
        hasManagers,
        hasSuppliers,
        hasEmailLabels,
        hasIntegrations,
        businessName: clientData.business?.name,
        emailDomain: clientData.business?.emailDomain,
        managersCount: clientData.managers?.length || 0,
        suppliersCount: clientData.suppliers?.length || 0,
        emailLabelsCount: Object.keys(clientData.email_labels || {}).length,
        integrationsCount: Object.keys(clientData.integrations || {}).length
      },
      issues: []
    };
    
    if (!hasBusinessName) {
      validation.userData.issues.push('No business name found in client data');
    }
    
    if (!hasEmailDomain) {
      validation.userData.issues.push('No email domain found in client data');
    }
    
    console.log('User Data validation:', validation.userData);
    
  } catch (error) {
    console.error('User Data validation failed:', error);
    validation.userData = {
      success: false,
      details: null,
      issues: [error.message]
    };
  }
  
  // OVERALL VALIDATION
  const allLayersSuccess = validation.layer1.success && validation.layer2.success && validation.layer3.success;
  const hasUserData = validation.userData.success;
  const hasVoiceTraining = validation.voiceTraining.success;
  
  const totalIssues = [
    ...validation.layer1.issues,
    ...validation.layer2.issues,
    ...validation.layer3.issues,
    ...validation.userData.issues,
    ...validation.voiceTraining.issues
  ];
  
  validation.overall = {
    success: allLayersSuccess && hasUserData,
    summary: `Layers: ${allLayersSuccess ? 'SUCCESS' : 'FAILED'} | User Data: ${hasUserData ? 'SUCCESS' : 'FAILED'} | Voice Training: ${hasVoiceTraining ? 'SUCCESS' : 'FAILED'} | Issues: ${totalIssues.length}`
  };
  
  console.log('VALIDATION COMPLETE:', validation);
  
  return validation;
};

export default {
  validateDataInjection
};
