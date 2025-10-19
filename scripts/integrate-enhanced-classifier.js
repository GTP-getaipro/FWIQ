/**
 * INTEGRATE ENHANCED CLASSIFIER SYSTEM MESSAGE
 * 
 * This script shows how to integrate the enhanced classifier system message
 * into your existing aiSchemaInjector.js
 */

import { generateEnhancedClassifierSystemMessage } from '../src/lib/enhancedClassifierSystemMessage.js';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Enhanced version of buildProductionClassifier
 * This replaces the existing function in aiSchemaInjector.js
 */
export const buildEnhancedProductionClassifier = async (
  aiConfig, 
  labelConfig, 
  businessInfo, 
  managers = [], 
  suppliers = [], 
  actualLabels = null
) => {
  console.log('🚀 Building enhanced production classifier...');
  
  try {
    // 1. Fetch historical email data for voice enhancement
    const historicalData = await fetchHistoricalEmailData(businessInfo.id || businessInfo.user_id);
    
    // 2. Generate enhanced system message
    const enhancedSystemMessage = await generateEnhancedClassifierSystemMessage(
      businessInfo,
      managers,
      suppliers,
      historicalData,
      labelConfig
    );
    
    console.log('✅ Enhanced classifier system message generated');
    console.log(`📊 Message length: ${enhancedSystemMessage.length} characters`);
    
    return enhancedSystemMessage;
    
  } catch (error) {
    console.error('❌ Error generating enhanced classifier:', error);
    
    // Fallback to original function
    console.log('⚠️ Falling back to original classifier...');
    return buildOriginalProductionClassifier(aiConfig, labelConfig, businessInfo, managers, suppliers, actualLabels);
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
 * Original buildProductionClassifier function (fallback)
 */
function buildOriginalProductionClassifier(aiConfig, labelConfig, businessInfo, managers, suppliers, actualLabels) {
  // This would be the original function from aiSchemaInjector.js
  // For now, return a basic message
  return `You are an expert email processing and routing system for "${businessInfo.name || 'the business'}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- Business Name: ${businessInfo.name || 'Business'}
- Business Type(s): ${businessInfo.businessTypes?.join(', ') || 'General Services'}
- Email Domain: ${businessInfo.emailDomain || 'example.com'}

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
}

/**
 * Integration instructions for aiSchemaInjector.js
 */
export const integrationInstructions = () => {
  console.log('🔧 INTEGRATION INSTRUCTIONS:');
  console.log('='.repeat(50));
  console.log('');
  console.log('1. In src/lib/aiSchemaInjector.js:');
  console.log('   - Import the enhanced function:');
  console.log('     import { generateEnhancedClassifierSystemMessage } from "./enhancedClassifierSystemMessage.js";');
  console.log('');
  console.log('   - Replace buildProductionClassifier with buildEnhancedProductionClassifier');
  console.log('   - Add async/await to the function call');
  console.log('');
  console.log('2. In src/lib/templateService.js:');
  console.log('   - Update the call to buildProductionClassifier to be async');
  console.log('   - Add await keyword before the function call');
  console.log('');
  console.log('3. In supabase/functions/deploy-n8n/index.ts:');
  console.log('   - Update the AI system message generation to use the enhanced version');
  console.log('   - Add historical data fetching before system message generation');
  console.log('');
  console.log('4. Test the integration:');
  console.log('   - Run the enhanced classifier with sample data');
  console.log('   - Verify the system message includes historical data');
  console.log('   - Check that business-specific categories are included');
  console.log('');
  console.log('✅ This will give you dynamic, personalized classifier system messages!');
};

/**
 * Example usage
 */
export const exampleUsage = async () => {
  console.log('🧪 Testing Enhanced Classifier System Message...');
  
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
    ]
  };

  // Example managers
  const managers = [
    { name: 'Hailey', role: 'General Manager', specialties: ['Operations', 'Customer Service'] },
    { name: 'Jillian', role: 'Service Manager', specialties: ['Technical Support', 'Scheduling'] }
  ];

  // Example suppliers
  const suppliers = [
    { name: 'Aqua Spa Supply', category: 'Chemicals', specialties: ['Water Treatment', 'Filters'] },
    { name: 'Strong Spas', category: 'Equipment', specialties: ['Hot Tubs', 'Parts'] }
  ];

  // Example label config
  const labelConfig = {
    labels: [
      {
        name: 'Support',
        description: 'Customer support and service requests',
        sub: [
          { name: 'TechnicalSupport', description: 'Technical issues and troubleshooting' },
          { name: 'PartsAndChemicals', description: 'Parts and chemical orders' }
        ]
      },
      {
        name: 'Sales',
        description: 'Sales inquiries and new customer requests',
        sub: [
          { name: 'NewSpaSales', description: 'New hot tub and spa sales' },
          { name: 'AccessorySales', description: 'Accessory and chemical sales' }
        ]
      }
    ]
  };

  try {
    // Generate enhanced system message
    const enhancedMessage = await generateEnhancedClassifierSystemMessage(
      businessInfo,
      managers,
      suppliers,
      null, // No historical data for this example
      labelConfig
    );

    console.log('✅ Enhanced system message generated successfully!');
    console.log(`📊 Message length: ${enhancedMessage.length} characters`);
    console.log('📋 Preview:');
    console.log(enhancedMessage.substring(0, 500) + '...');
    
    return enhancedMessage;
    
  } catch (error) {
    console.error('❌ Error generating enhanced message:', error);
    return null;
  }
};

// Run example if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().then(() => {
    console.log('\n🎉 Enhanced classifier system message test complete!');
  });
}

export default {
  buildEnhancedProductionClassifier,
  integrationInstructions,
  exampleUsage
};
