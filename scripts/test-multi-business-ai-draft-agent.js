/**
 * TEST MULTI-BUSINESS AI DRAFT AGENT SYSTEM MESSAGE
 * 
 * This script tests the multi-business AI draft agent system message generation
 * for businesses that operate across multiple service types
 */

import { generateMultiBusinessAIDraftAgentSystemMessage } from '../src/lib/multiBusinessAIDraftAgentSystemMessage.js';

console.log('🧪 TESTING MULTI-BUSINESS AI DRAFT AGENT SYSTEM MESSAGE');
console.log('='.repeat(60));

// Example business info for multi-business operations
const multiBusinessInfo = {
  name: 'The Hot Tub Man Ltd.',
  businessTypes: ['pools_spas', 'hvac', 'plumbing'], // Multiple business types
  phone: '403-550-5140',
  websiteUrl: 'thehottubman.ca',
  emailDomain: 'thehottubman.ca',
  serviceAreas: ['Red Deer', 'Leduc', 'Edmonton'],
  operatingHours: 'Monday-Friday 8AM-5PM',
  responseTime: '24 hours',
  managers: [
    { name: 'Hailey', role: 'General Manager', specialties: ['Operations', 'Customer Service'] },
    { name: 'Jillian', role: 'Service Manager', specialties: ['Technical Support', 'Scheduling'] }
  ],
  suppliers: [
    { name: 'Aqua Spa Supply', category: 'Chemicals', specialties: ['Water Treatment', 'Filters'] },
    { name: 'Strong Spas', category: 'Equipment', specialties: ['Hot Tubs', 'Parts'] }
  ]
};

// Test scenarios
const testScenarios = [
  {
    name: 'Single Business Type (Pools & Spas)',
    businessInfo: {
      ...multiBusinessInfo,
      businessTypes: ['pools_spas']
    }
  },
  {
    name: 'Dual Business Types (Pools & Spas + HVAC)',
    businessInfo: {
      ...multiBusinessInfo,
      businessTypes: ['pools_spas', 'hvac']
    }
  },
  {
    name: 'Triple Business Types (Pools & Spas + HVAC + Plumbing)',
    businessInfo: {
      ...multiBusinessInfo,
      businessTypes: ['pools_spas', 'hvac', 'plumbing']
    }
  },
  {
    name: 'Four Business Types (Pools & Spas + HVAC + Plumbing + Electrical)',
    businessInfo: {
      ...multiBusinessInfo,
      businessTypes: ['pools_spas', 'hvac', 'plumbing', 'electrical']
    }
  }
];

async function testMultiBusinessAIDraftAgent() {
  console.log('🚀 Testing Multi-Business AI Draft Agent System Message Generation...\n');
  
  for (const scenario of testScenarios) {
    console.log(`📧 Testing Scenario: ${scenario.name}`);
    console.log(`   Business Types: ${scenario.businessInfo.businessTypes.join(', ')}`);
    console.log('─'.repeat(50));
    
    try {
      // Generate system message
      const systemMessage = await generateMultiBusinessAIDraftAgentSystemMessage(
        scenario.businessInfo,
        scenario.businessInfo.managers,
        scenario.businessInfo.suppliers,
        null, // No historical data for this test
        'General'
      );

      console.log(`✅ Multi-business AI draft agent system message generated!`);
      console.log(`📊 Message length: ${systemMessage.length} characters`);
      console.log('📋 Preview:');
      console.log(systemMessage.substring(0, 800) + '...');
      
      // Analyze the system message
      analyzeSystemMessage(systemMessage, scenario.businessInfo.businessTypes);
      
      console.log('\n' + '='.repeat(60) + '\n');
      
    } catch (error) {
      console.error(`❌ Error generating system message for ${scenario.name}:`, error);
      console.log('\n' + '='.repeat(60) + '\n');
    }
  }
  
  // Test with different categories
  console.log('📧 Testing with different email categories:');
  console.log('─'.repeat(40));
  
  const categories = ['Support', 'Sales', 'Urgent', 'General'];
  const testBusinessInfo = {
    ...multiBusinessInfo,
    businessTypes: ['pools_spas', 'hvac', 'plumbing']
  };
  
  for (const category of categories) {
    console.log(`\n📧 Testing category: ${category}`);
    
    try {
      const systemMessage = await generateMultiBusinessAIDraftAgentSystemMessage(
        testBusinessInfo,
        testBusinessInfo.managers,
        testBusinessInfo.suppliers,
        null,
        category
      );

      console.log(`✅ System message generated for ${category}!`);
      console.log(`📊 Message length: ${systemMessage.length} characters`);
      
    } catch (error) {
      console.error(`❌ Error generating system message for ${category}:`, error);
    }
  }
  
  console.log('\n🎉 Multi-business AI draft agent system message test complete!');
}

/**
 * Analyze the system message for multi-business features
 */
function analyzeSystemMessage(systemMessage, businessTypes) {
  console.log('\n📊 System Message Analysis:');
  
  // Check for multi-business features
  const features = {
    'Multi-Service Business Context': systemMessage.includes('Multi-Service Business Context'),
    'Primary Service Focus': systemMessage.includes('Primary Service Focus'),
    'Additional Services': systemMessage.includes('Additional Services'),
    'Cross-Service Opportunities': systemMessage.includes('Cross-Service Opportunities'),
    'Multi-Service Coordination': systemMessage.includes('Multi-Service Coordination'),
    'Service-Specific Guidelines': systemMessage.includes('Response Guidelines:'),
    'Inquiry Type Classification': systemMessage.includes('Inquiry Type Classification'),
    'Upsell Opportunities': systemMessage.includes('Upsell Opportunities'),
    'Pricing Information': systemMessage.includes('Pricing:'),
    'Example Replies': systemMessage.includes('Example Reply:')
  };
  
  Object.entries(features).forEach(([feature, present]) => {
    console.log(`  ${present ? '✅' : '❌'} ${feature}`);
  });
  
  // Check for business type mentions
  console.log('\n🏢 Business Type Coverage:');
  businessTypes.forEach(businessType => {
    const mentioned = systemMessage.includes(businessType);
    console.log(`  ${mentioned ? '✅' : '❌'} ${businessType}`);
  });
  
  // Check for multi-business specific language
  const multiBusinessLanguage = [
    'multi-service',
    'cross-service',
    'service coordination',
    'primary service',
    'additional services',
    'service-specific',
    'unified communication'
  ];
  
  console.log('\n🔗 Multi-Business Language:');
  multiBusinessLanguage.forEach(phrase => {
    const present = systemMessage.toLowerCase().includes(phrase);
    console.log(`  ${present ? '✅' : '❌'} "${phrase}"`);
  });
}

// Run the test
testMultiBusinessAIDraftAgent().catch(console.error);
