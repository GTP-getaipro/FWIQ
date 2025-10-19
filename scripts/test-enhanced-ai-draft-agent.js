/**
 * TEST ENHANCED AI DRAFT AGENT SYSTEM MESSAGE
 * 
 * This script tests the enhanced AI draft agent system message generation
 * without requiring Supabase connection
 */

import { generateEnhancedAIDraftAgentSystemMessage } from '../src/lib/enhancedAIDraftAgentSystemMessage.js';

console.log('🧪 TESTING ENHANCED AI DRAFT AGENT SYSTEM MESSAGE');
console.log('='.repeat(60));

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

// Example historical data
const historicalData = {
  examples: [
    {
      category: 'Support',
      human_reply: 'Hi there! Thank you for reaching out to us. I\'d be happy to help you with your hot tub issue. When would be a good time to discuss your requirements?',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      category: 'Sales',
      human_reply: 'I\'m sorry to hear you\'re experiencing issues with your order. Let me look into this right away and get back to you with a solution.',
      created_at: '2024-01-14T15:30:00Z'
    },
    {
      category: 'Support',
      human_reply: 'Thank you for your patience! I\'ve reviewed your case and here\'s what we can do to resolve this quickly.',
      created_at: '2024-01-13T09:15:00Z'
    }
  ],
  hasData: true,
  quality: 'good'
};

// Test with different categories
const categories = ['Support', 'Sales', 'Urgent', 'General'];

async function testEnhancedAIDraftAgent() {
  console.log('🚀 Testing Enhanced AI Draft Agent System Message Generation...\n');
  
  for (const category of categories) {
    console.log(`📧 Testing with category: ${category}`);
    console.log('─'.repeat(40));
    
    try {
      // Generate enhanced system message
      const enhancedMessage = await generateEnhancedAIDraftAgentSystemMessage(
        businessInfo,
        businessInfo.managers,
        businessInfo.suppliers,
        historicalData,
        null, // No behavior config for this example
        category
      );

      console.log(`✅ Enhanced AI draft agent system message generated for ${category}!`);
      console.log(`📊 Message length: ${enhancedMessage.length} characters`);
      console.log('📋 Preview:');
      console.log(enhancedMessage.substring(0, 500) + '...');
      console.log('\n' + '='.repeat(60) + '\n');
      
    } catch (error) {
      console.error(`❌ Error generating enhanced message for ${category}:`, error);
      console.log('\n' + '='.repeat(60) + '\n');
    }
  }
  
  // Test without historical data
  console.log('📧 Testing without historical data:');
  console.log('─'.repeat(40));
  
  try {
    const enhancedMessage = await generateEnhancedAIDraftAgentSystemMessage(
      businessInfo,
      businessInfo.managers,
      businessInfo.suppliers,
      null, // No historical data
      null, // No behavior config
      'General'
    );

    console.log(`✅ Enhanced AI draft agent system message generated without historical data!`);
    console.log(`📊 Message length: ${enhancedMessage.length} characters`);
    console.log('📋 Preview:');
    console.log(enhancedMessage.substring(0, 500) + '...');
    
  } catch (error) {
    console.error(`❌ Error generating enhanced message without historical data:`, error);
  }
  
  console.log('\n🎉 Enhanced AI draft agent system message test complete!');
}

// Run the test
testEnhancedAIDraftAgent().catch(console.error);
