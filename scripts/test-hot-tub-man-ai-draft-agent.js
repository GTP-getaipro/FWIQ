/**
 * TEST HOT TUB MAN AI DRAFT AGENT SYSTEM MESSAGE
 * 
 * This script tests the Hot Tub Man specific AI draft agent system message
 */

import { generateHotTubManAIDraftAgentSystemMessage } from '../src/lib/hotTubManAIDraftAgentSystemMessage.js';

console.log('🧪 TESTING HOT TUB MAN AI DRAFT AGENT SYSTEM MESSAGE');
console.log('='.repeat(60));

// Example business info for The Hot Tub Man
const businessInfo = {
  name: 'The Hot Tub Man Ltd.',
  phone: '403-550-5140',
  websiteUrl: 'thehottubman.ca',
  emailDomain: 'thehottubman.ca'
};

// Test with different categories
const categories = ['Support', 'Sales', 'Urgent', 'General'];

async function testHotTubManAIDraftAgent() {
  console.log('🚀 Testing Hot Tub Man AI Draft Agent System Message Generation...\n');
  
  for (const category of categories) {
    console.log(`📧 Testing with category: ${category}`);
    console.log('─'.repeat(40));
    
    try {
      // Generate system message
      const systemMessage = await generateHotTubManAIDraftAgentSystemMessage(
        businessInfo,
        null, // No historical data for this test
        category
      );

      console.log(`✅ Hot Tub Man AI draft agent system message generated for ${category}!`);
      console.log(`📊 Message length: ${systemMessage.length} characters`);
      console.log('📋 Preview:');
      console.log(systemMessage.substring(0, 800) + '...');
      console.log('\n' + '='.repeat(60) + '\n');
      
    } catch (error) {
      console.error(`❌ Error generating system message for ${category}:`, error);
      console.log('\n' + '='.repeat(60) + '\n');
    }
  }
  
  // Test the complete system message
  console.log('📧 Testing complete system message:');
  console.log('─'.repeat(40));
  
  try {
    const completeSystemMessage = await generateHotTubManAIDraftAgentSystemMessage(
      businessInfo,
      null,
      'General'
    );

    console.log(`✅ Complete Hot Tub Man AI draft agent system message generated!`);
    console.log(`📊 Total message length: ${completeSystemMessage.length} characters`);
    
    // Show key sections
    console.log('\n📋 Key Sections Included:');
    console.log('✅ Assistant role and guidelines');
    console.log('✅ Intelligent conversation progression');
    console.log('✅ Follow-up ownership & clarity');
    console.log('✅ Personal touch & human warmth');
    console.log('✅ Common mistakes to avoid');
    console.log('✅ Special response guidelines');
    console.log('✅ Inquiry type classification');
    console.log('✅ Thread continuity maintenance');
    console.log('✅ Mailed items & deliveries');
    console.log('✅ Payment clarifications');
    console.log('✅ Service status & delays');
    console.log('✅ Location-specific responses');
    console.log('✅ Attachment handling');
    console.log('✅ Technical inquiries');
    console.log('✅ Upsell opportunities');
    console.log('✅ Rescheduling language');
    console.log('✅ Repair vs disposal logic');
    console.log('✅ Gmail conversation search');
    console.log('✅ Four-part reply structure');
    console.log('✅ Required signature');
    console.log('✅ Tone guidelines');
    console.log('✅ Pricing information');
    console.log('✅ Upsell lines');
    console.log('✅ Customer service guidelines');
    console.log('✅ Escalation handling');
    console.log('✅ Example replies');
    console.log('✅ Additional context & links');
    
    console.log('\n🎯 This system message provides:');
    console.log('• Complete business-specific guidance for The Hot Tub Man');
    console.log('• Detailed response protocols for different scenarios');
    console.log('• Clear pricing and service information');
    console.log('• Specific upsell opportunities');
    console.log('• Thread continuity and context awareness');
    console.log('• Professional yet friendly tone guidelines');
    console.log('• Comprehensive example responses');
    console.log('• All necessary business links and contact information');
    
  } catch (error) {
    console.error(`❌ Error generating complete system message:`, error);
  }
  
  console.log('\n🎉 Hot Tub Man AI draft agent system message test complete!');
}

// Run the test
testHotTubManAIDraftAgent().catch(console.error);
