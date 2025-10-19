/**
 * INTEGRATE ENHANCED AI DRAFT AGENT SYSTEM MESSAGE
 * 
 * This script shows how to integrate the enhanced AI draft agent system message
 * into your existing behaviorSchemaInjector.js
 */

import { generateEnhancedAIDraftAgentSystemMessage } from '../src/lib/enhancedAIDraftAgentSystemMessage.js';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Enhanced version of extractBehaviorConfigForN8n
 * This replaces the existing function in behaviorSchemaInjector.js
 */
export const extractEnhancedBehaviorConfigForN8n = async (
  businessTypes, 
  businessInfo = {}, 
  voiceProfile = null,
  category = 'General'
) => {
  console.log('🚀 Building enhanced behavior config for AI draft agent...');
  
  try {
    // 1. Fetch historical email data for voice enhancement
    const historicalData = await fetchHistoricalEmailData(businessInfo.id || businessInfo.user_id);
    
    // 2. Generate enhanced system message
    const enhancedSystemMessage = await generateEnhancedAIDraftAgentSystemMessage(
      businessInfo,
      businessInfo.managers || [],
      businessInfo.suppliers || [],
      historicalData,
      null, // behaviorConfig - can be enhanced later
      category
    );
    
    console.log('✅ Enhanced AI draft agent system message generated');
    console.log(`📊 Message length: ${enhancedSystemMessage.length} characters`);
    
    // 3. Build behavior config with enhanced system message
    const behaviorConfig = {
      replyPrompt: enhancedSystemMessage,
      voiceProfile: voiceProfile,
      category: category,
      enhanced: true,
      historicalData: historicalData
    };
    
    return behaviorConfig;
    
  } catch (error) {
    console.error('❌ Error generating enhanced AI draft agent:', error);
    
    // Fallback to original function
    console.log('⚠️ Falling back to original behavior config...');
    return buildOriginalBehaviorConfig(businessTypes, businessInfo, voiceProfile);
  }
};

/**
 * Fetch historical email data for voice enhancement
 */
async function fetchHistoricalEmailData(userId) {
  try {
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
    
  } catch (error) {
    console.warn('⚠️ Error fetching historical data:', error.message);
    return null;
  }
}

/**
 * Assess the quality of historical data
 */
function assessDataQuality(examples) {
  if (examples.length === 0) return 'none';
  
  const validExamples = examples.filter(ex => 
    ex.human_reply && 
    ex.human_reply.length > 50 && 
    !ex.human_reply.includes('automated') &&
    !ex.human_reply.includes('personal')
  );
  
  if (validExamples.length === 0) return 'poor';
  if (validExamples.length < 3) return 'minimal';
  if (validExamples.length < 10) return 'good';
  return 'excellent';
}

/**
 * Original behavior config function (fallback)
 */
function buildOriginalBehaviorConfig(businessTypes, businessInfo, voiceProfile) {
  // This would be the original function from behaviorSchemaInjector.js
  // For now, return a basic config
  return {
    replyPrompt: `**Assistant role:** Draft friendly, professional, and helpful replies for ${businessInfo.name || 'the business'}.

## Business Context:
- Business: ${businessInfo.name || 'Business'}
- Industry: ${businessTypes?.[0] || 'General Services'}
- Contact: ${businessInfo.phone || 'Not provided'}

## Response Guidelines:
- Be professional and helpful
- Address customer concerns clearly
- Provide next steps and timelines
- Maintain a warm, human voice`,
    voiceProfile: voiceProfile,
    enhanced: false
  };
}

/**
 * Integration instructions for behaviorSchemaInjector.js
 */
export const integrationInstructions = () => {
  console.log('🔧 INTEGRATION INSTRUCTIONS FOR AI DRAFT AGENT:');
  console.log('='.repeat(50));
  console.log('');
  console.log('1. In src/lib/behaviorSchemaInjector.js:');
  console.log('   - Import the enhanced function:');
  console.log('     import { generateEnhancedAIDraftAgentSystemMessage } from "./enhancedAIDraftAgentSystemMessage.js";');
  console.log('');
  console.log('   - Replace extractBehaviorConfigForN8n with extractEnhancedBehaviorConfigForN8n');
  console.log('   - Add async/await to the function call');
  console.log('   - Pass category parameter for context-specific enhancement');
  console.log('');
  console.log('2. In src/lib/templateService.js:');
  console.log('   - Update the call to extractBehaviorConfigForN8n to be async');
  console.log('   - Add await keyword before the function call');
  console.log('   - Pass category parameter from email classification');
  console.log('');
  console.log('3. In supabase/functions/deploy-n8n/index.ts:');
  console.log('   - Update the behavior reply prompt generation to use the enhanced version');
  console.log('   - Add historical data fetching before system message generation');
  console.log('   - Pass category parameter for context-specific enhancement');
  console.log('');
  console.log('4. Test the integration:');
  console.log('   - Run the enhanced AI draft agent with sample data');
  console.log('   - Verify the system message includes historical data');
  console.log('   - Check that business-specific response protocols are included');
  console.log('   - Test with different email categories');
  console.log('');
  console.log('✅ This will give you dynamic, personalized AI draft agent system messages!');
};

/**
 * Example usage
 */
export const exampleUsage = async () => {
  console.log('🧪 Testing Enhanced AI Draft Agent System Message...');
  
  // Example business info
  const businessInfo = {
    id: 'test-user-id',
    name: 'The Hot Tub Man Ltd.',
    businessTypes: ['pools_spas'],
    emailDomain: 'thehottubman.ca',
    phone: '(555) 123-4567',
    websiteUrl: 'thehottubman.ca',
    address: '123 Main St',
    city: 'Red Deer',
    state: 'AB',
    zipCode: 'T4N 1A1',
    country: 'Canada',
    currency: 'CAD',
    timezone: 'America/Edmonton',
    businessCategory: 'Hot tub & Spa',
    serviceAreas: ['Red Deer', 'Leduc', 'Edmonton'],
    operatingHours: 'Monday-Friday 8AM-5PM',
    responseTime: '24 hours',
    services: [
      { name: 'Hot Tub Service', pricingType: 'per hour', price: 125 },
      { name: 'Chemical Treatment', pricingType: 'per kg', price: 39 }
    ],
    managers: [
      { name: 'Hailey', role: 'General Manager', specialties: ['Operations', 'Customer Service'] },
      { name: 'Jillian', role: 'Service Manager', specialties: ['Technical Support', 'Scheduling'] }
    ],
    suppliers: [
      { name: 'Aqua Spa Supply', category: 'Chemicals', specialties: ['Water Treatment', 'Filters'] },
      { name: 'Strong Spas', category: 'Equipment', specialties: ['Hot Tubs', 'Parts'] }
    ]
  };

  // Example voice profile
  const voiceProfile = {
    style_profile: {
      voice: {
        empathyLevel: 0.8,
        formalityLevel: 0.7,
        directnessLevel: 0.8
      },
      signaturePhrases: [
        { phrase: 'Thank you for reaching out', confidence: 0.9, context: 'Support' },
        { phrase: 'I\'d be happy to help', confidence: 0.8, context: 'General' }
      ]
    },
    learning_count: 25
  };

  // Test with different categories
  const categories = ['Support', 'Sales', 'Urgent', 'General'];
  
  for (const category of categories) {
    console.log(`\n📧 Testing with category: ${category}`);
    
    try {
      // Generate enhanced system message
      const enhancedMessage = await generateEnhancedAIDraftAgentSystemMessage(
        businessInfo,
        businessInfo.managers,
        businessInfo.suppliers,
        null, // No historical data for this example
        null, // No behavior config for this example
        category
      );

      console.log(`✅ Enhanced AI draft agent system message generated for ${category}!`);
      console.log(`📊 Message length: ${enhancedMessage.length} characters`);
      console.log('📋 Preview:');
      console.log(enhancedMessage.substring(0, 300) + '...');
      
    } catch (error) {
      console.error(`❌ Error generating enhanced message for ${category}:`, error);
    }
  }
  
  return true;
};

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().then(() => {
    console.log('\n🎉 Enhanced AI draft agent system message test complete!');
  });
}

export default {
  extractEnhancedBehaviorConfigForN8n,
  integrationInstructions,
  exampleUsage
};
