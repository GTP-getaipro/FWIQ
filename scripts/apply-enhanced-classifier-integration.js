/**
 * APPLY ENHANCED CLASSIFIER INTEGRATION
 * 
 * This script shows the exact changes needed to integrate the enhanced classifier
 * into your existing system
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 ENHANCED CLASSIFIER INTEGRATION CHANGES');
console.log('='.repeat(50));

// Show the exact changes needed for each file
const integrationChanges = {
  'src/lib/aiSchemaInjector.js': {
    description: 'Replace buildProductionClassifier function with enhanced version',
    changes: [
      '1. Add import: import { generateEnhancedClassifierSystemMessage } from "./enhancedClassifierSystemMessage.js";',
      '2. Replace buildProductionClassifier function with async version',
      '3. Add fetchHistoricalEmailData helper function',
      '4. Keep original function as fallback'
    ],
    code: `
// Add this import at the top
import { generateEnhancedClassifierSystemMessage } from './enhancedClassifierSystemMessage.js';

// Replace the existing buildProductionClassifier function (line 342)
export const buildProductionClassifier = async (
  aiConfig, 
  labelConfig, 
  businessInfo, 
  managers = [], 
  suppliers = [], 
  actualLabels = null
) => {
  console.log('🚀 Building enhanced production classifier...');
  
  try {
    // Fetch historical email data for voice enhancement
    const historicalData = await fetchHistoricalEmailData(businessInfo.id || businessInfo.user_id);
    
    // Generate enhanced system message
    const enhancedSystemMessage = await generateEnhancedClassifierSystemMessage(
      businessInfo,
      managers,
      suppliers,
      historicalData,
      labelConfig
    );
    
    return enhancedSystemMessage;
    
  } catch (error) {
    console.error('❌ Error generating enhanced classifier:', error);
    // Fallback to original implementation
    return buildOriginalProductionClassifier(aiConfig, labelConfig, businessInfo, managers, suppliers, actualLabels);
  }
};

// Add this helper function
async function fetchHistoricalEmailData(userId) {
  const { data, error } = await supabase
    .from('ai_human_comparison')
    .select('category, human_reply, created_at')
    .eq('client_id', userId)
    .not('human_reply', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('⚠️ Could not fetch historical data:', error.message);
    return null;
  }

  return {
    examples: data || [],
    hasData: (data || []).length > 0,
    quality: assessDataQuality(data || [])
  };
}

// Keep original function as fallback (rename existing function)
function buildOriginalProductionClassifier(aiConfig, labelConfig, businessInfo, managers, suppliers, actualLabels) {
  // ... existing implementation from lines 342-502
}`
  },

  'src/lib/templateService.js': {
    description: 'Make buildProductionClassifier call async',
    changes: [
      '1. Make loadTemplateForProvider function async',
      '2. Add await to buildProductionClassifier call',
      '3. Update function signature'
    ],
    code: `
// Update the function signature (around line 76)
export const loadTemplateForProvider = async (provider, businessTypes, businessInfo, clientData) => {
  // ... existing code ...
  
  // Update this call (around line 276) to be async
  const productionClassifier = await buildProductionClassifier(
    aiConfig, 
    labelConfig, 
    businessInfo,
    clientData.managers || [],
    clientData.suppliers || [],
    clientData.email_labels || null
  );
  
  // ... rest of the code ...
};`
  },

  'supabase/functions/deploy-n8n/index.ts': {
    description: 'Update system message generation with enhanced version',
    changes: [
      '1. Add import for enhanced function',
      '2. Update generateDynamicAISystemMessage function',
      '3. Add historical data fetching',
      '4. Use enhanced system message generation'
    ],
    code: `
// Add this import at the top
import { generateEnhancedClassifierSystemMessage } from '../src/lib/enhancedClassifierSystemMessage.js';

// Update the generateDynamicAISystemMessage function (around line 55)
async function generateDynamicAISystemMessage(userId) {
  // Fetch complete business profile from database
  const { data: profile, error } = await supabaseAdmin.from('profiles').select(\`
      client_config,
      managers,
      suppliers,
      business_type,
      business_types,
      email_labels
    \`).eq('id', userId).single();
    
  if (error || !profile) {
    console.error('❌ Failed to fetch profile for dynamic AI system message:', error);
    return 'You are an email classifier. Categorize emails accurately and return JSON with summary, primary_category, confidence, and ai_can_reply fields.';
  }

  // Extract business configuration
  const businessConfig = profile.client_config || {};
  const business = businessConfig.business || {};
  const businessInfo = {
    id: userId,
    name: business.name,
    businessTypes: profile.business_types || [profile.business_type],
    emailDomain: business.emailDomain,
    phone: business.phone,
    websiteUrl: business.websiteUrl,
    address: business.address,
    city: business.city,
    state: business.state,
    zipCode: business.zipCode,
    country: business.country,
    currency: business.currency,
    timezone: business.timezone,
    businessCategory: business.businessCategory,
    serviceAreas: business.serviceAreas,
    operatingHours: business.operatingHours,
    responseTime: business.responseTime,
    services: businessConfig.services || []
  };

  // Fetch historical email data
  const historicalData = await fetchHistoricalEmailData(userId);
  
  // Generate enhanced system message
  const enhancedSystemMessage = await generateEnhancedClassifierSystemMessage(
    businessInfo,
    profile.managers || [],
    profile.suppliers || [],
    historicalData,
    { labels: profile.email_labels || [] }
  );
  
  return enhancedSystemMessage;
}

// Add this helper function
async function fetchHistoricalEmailData(userId) {
  const { data, error } = await supabaseAdmin
    .from('ai_human_comparison')
    .select('category, human_reply, created_at')
    .eq('client_id', userId)
    .not('human_reply', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('⚠️ Could not fetch historical data:', error.message);
    return null;
  }

  return {
    examples: data || [],
    hasData: (data || []).length > 0,
    quality: assessDataQuality(data || [])
  };
}`
  }
};

// Display the integration changes
Object.entries(integrationChanges).forEach(([filePath, change]) => {
  console.log(`\n📁 ${filePath}`);
  console.log(`📝 ${change.description}`);
  console.log('\n🔧 Changes needed:');
  change.changes.forEach(change => {
    console.log(`   ${change}`);
  });
  console.log('\n💻 Code changes:');
  console.log(change.code);
  console.log('\n' + '─'.repeat(50));
});

console.log('\n🎯 INTEGRATION SUMMARY:');
console.log('='.repeat(50));
console.log('1. ✅ Enhanced module created: src/lib/enhancedClassifierSystemMessage.js');
console.log('2. 🔧 Update aiSchemaInjector.js - Replace buildProductionClassifier function');
console.log('3. 🔧 Update templateService.js - Make function calls async');
console.log('4. 🔧 Update deploy-n8n/index.ts - Use enhanced system message generation');
console.log('5. 🧪 Test integration with sample data');
console.log('6. 🚀 Deploy and monitor performance improvements');

console.log('\n🎉 BENEFITS AFTER INTEGRATION:');
console.log('='.repeat(50));
console.log('✅ Dynamic business context integration');
console.log('✅ Historical email data enhancement');
console.log('✅ Industry-specific categories and rules');
console.log('✅ Advanced AI reply logic with business-specific rules');
console.log('✅ Personalized system messages with voice learning');
console.log('✅ Better classification accuracy');
console.log('✅ Improved user experience');

console.log('\n🚀 READY TO INTEGRATE!');
console.log('Follow the changes above to integrate the enhanced classifier into your existing system.');
