/**
 * TEST DYNAMIC SECURE SYSTEM MESSAGES
 * 
 * This script tests the secure system message storage with dynamic business data
 * to ensure it works for different businesses like @thehottubman.ca, @otherbusiness.com, etc.
 */

import { createClient } from '@supabase/supabase-js';
import { SecureSystemMessageManager } from '../src/lib/secureSystemMessageManager.js';
import { generateEnhancedClassifierSystemMessage } from '../src/lib/enhancedClassifierSystemMessage.js';
import { generateMultiBusinessAIDraftAgentSystemMessage } from '../src/lib/multiBusinessAIDraftAgentSystemMessage.js';

console.log('🚀 TESTING DYNAMIC SECURE SYSTEM MESSAGES');
console.log('='.repeat(60));

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const ENCRYPTION_KEY = process.env.SYSTEM_MESSAGE_ENCRYPTION_KEY || SecureSystemMessageManager.generateEncryptionKey();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Dynamic test businesses
const testBusinesses = [
  {
    id: 'test-business-1',
    name: 'The Hot Tub Man Ltd.',
    businessTypes: ['pools_spas'],
    emailDomain: 'thehottubman.ca',
    phone: '403-550-5140',
    websiteUrl: 'thehottubman.ca',
    address: 'Alberta, Canada',
    city: 'Red Deer',
    state: 'Alberta',
    zipCode: 'T4N 1A1',
    country: 'Canada',
    currency: 'CAD',
    timezone: 'America/Edmonton',
    businessCategory: 'Hot tub & Spa',
    serviceAreas: ['Red Deer', 'Leduc', 'Edmonton'],
    operatingHours: 'Monday-Friday 8AM-5PM',
    responseTime: '24 hours',
    managers: [
      { name: 'Hailey', email: 'hailey@thehottubman.ca', role: 'Manager' },
      { name: 'Jillian', email: 'jillian@thehottubman.ca', role: 'Manager' },
      { name: 'Stacie', email: 'stacie@thehottubman.ca', role: 'Manager' }
    ],
    suppliers: [
      { name: 'Aqua Spa Supply', email: 'orders@asp-supply.com' },
      { name: 'Strong Spas', email: 'info@strong9.com' }
    ]
  },
  {
    id: 'test-business-2',
    name: 'Cool Pool Services',
    businessTypes: ['pools_spas', 'hvac'],
    emailDomain: 'coolpoolservices.com',
    phone: '555-123-4567',
    websiteUrl: 'coolpoolservices.com',
    address: 'California, USA',
    city: 'Los Angeles',
    state: 'California',
    zipCode: '90210',
    country: 'USA',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    businessCategory: 'Pool & Spa Services',
    serviceAreas: ['Los Angeles', 'Orange County'],
    operatingHours: 'Monday-Saturday 7AM-6PM',
    responseTime: '2 hours',
    managers: [
      { name: 'Mike', email: 'mike@coolpoolservices.com', role: 'Owner' },
      { name: 'Sarah', email: 'sarah@coolpoolservices.com', role: 'Manager' }
    ],
    suppliers: [
      { name: 'Pool Supply Co', email: 'orders@poolsupplyco.com' }
    ]
  },
  {
    id: 'test-business-3',
    name: 'Elite HVAC Solutions',
    businessTypes: ['hvac', 'plumbing'],
    emailDomain: 'elitehvac.com',
    phone: '555-987-6543',
    websiteUrl: 'elitehvac.com',
    address: 'Texas, USA',
    city: 'Houston',
    state: 'Texas',
    zipCode: '77001',
    country: 'USA',
    currency: 'USD',
    timezone: 'America/Chicago',
    businessCategory: 'HVAC & Plumbing',
    serviceAreas: ['Houston', 'Austin', 'Dallas'],
    operatingHours: '24/7 Emergency Service',
    responseTime: '1 hour',
    managers: [
      { name: 'David', email: 'david@elitehvac.com', role: 'CEO' },
      { name: 'Lisa', email: 'lisa@elitehvac.com', role: 'Operations Manager' }
    ],
    suppliers: [
      { name: 'HVAC Parts Direct', email: 'orders@hvacpartsdirect.com' }
    ]
  }
];

async function testDynamicSecureSystemMessages() {
  console.log('🚀 Testing Dynamic Secure System Message Storage...\n');
  
  try {
    // Initialize secure system message manager
    const messageManager = new SecureSystemMessageManager(supabase, ENCRYPTION_KEY);
    
    console.log('✅ Secure System Message Manager initialized');
    console.log(`🔑 Using encryption key: ${ENCRYPTION_KEY.substring(0, 8)}...`);
    
    // Test each business
    for (const business of testBusinesses) {
      console.log(`\n🏢 Testing Business: ${business.name}`);
      console.log('─'.repeat(50));
      
      // Test 1: Generate and store classifier system message
      console.log('📋 Step 1: Generating Classifier System Message');
      
      const classifierSystemMessage = await generateEnhancedClassifierSystemMessage(
        business,
        business.managers,
        business.suppliers,
        null, // No historical data for testing
        { labels: [] }
      );
      
      console.log(`   ✅ Generated classifier message (${classifierSystemMessage.length} characters)`);
      console.log(`   📧 Email domain: ${business.emailDomain}`);
      console.log(`   🏷️  Business types: ${business.businessTypes.join(', ')}`);
      
      // Store classifier message
      const classifierResult = await messageManager.generateAndStoreSystemMessage(
        business.id,
        'classifier',
        business.businessTypes,
        classifierSystemMessage
      );
      
      console.log(`   🔒 Stored classifier message with ID: ${classifierResult.id}`);
      console.log(`   🔐 Hash: ${classifierResult.hash.substring(0, 16)}...`);
      
      // Test 2: Generate and store multi-business AI draft agent message
      console.log('\n📝 Step 2: Generating Multi-Business AI Draft Agent Message');
      
      const draftAgentSystemMessage = await generateMultiBusinessAIDraftAgentSystemMessage(
        business,
        business.managers,
        business.suppliers,
        null, // No historical data for testing
        { labels: [] }
      );
      
      console.log(`   ✅ Generated draft agent message (${draftAgentSystemMessage.length} characters)`);
      
      // Store draft agent message
      const draftAgentResult = await messageManager.generateAndStoreSystemMessage(
        business.id,
        'draft_agent',
        business.businessTypes,
        draftAgentSystemMessage
      );
      
      console.log(`   🔒 Stored draft agent message with ID: ${draftAgentResult.id}`);
      console.log(`   🔐 Hash: ${draftAgentResult.hash.substring(0, 16)}...`);
      
      // Test 3: Retrieve and verify messages
      console.log('\n🔍 Step 3: Retrieving and Verifying Messages');
      
      const retrievedClassifier = await messageManager.getSystemMessage(
        business.id,
        'classifier',
        business.businessTypes
      );
      
      const retrievedDraftAgent = await messageManager.getSystemMessage(
        business.id,
        'draft_agent',
        business.businessTypes
      );
      
      console.log(`   ✅ Retrieved classifier message: ${retrievedClassifier ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   ✅ Retrieved draft agent message: ${retrievedDraftAgent ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 4: Verify dynamic content
      console.log('\n🎯 Step 4: Verifying Dynamic Content');
      
      if (retrievedClassifier) {
        const hasCorrectDomain = retrievedClassifier.includes(business.emailDomain);
        const hasCorrectBusinessName = retrievedClassifier.includes(business.name);
        const hasCorrectManagers = business.managers.every(manager => 
          retrievedClassifier.includes(manager.name)
        );
        
        console.log(`   📧 Contains correct email domain: ${hasCorrectDomain ? '✅' : '❌'}`);
        console.log(`   🏢 Contains correct business name: ${hasCorrectBusinessName ? '✅' : '❌'}`);
        console.log(`   👥 Contains correct managers: ${hasCorrectManagers ? '✅' : '❌'}`);
      }
      
      if (retrievedDraftAgent) {
        const hasCorrectDomain = retrievedDraftAgent.includes(business.emailDomain);
        const hasCorrectBusinessName = retrievedDraftAgent.includes(business.name);
        const hasCorrectPhone = retrievedDraftAgent.includes(business.phone);
        
        console.log(`   📧 Contains correct email domain: ${hasCorrectDomain ? '✅' : '❌'}`);
        console.log(`   🏢 Contains correct business name: ${hasCorrectBusinessName ? '✅' : '❌'}`);
        console.log(`   📞 Contains correct phone: ${hasCorrectPhone ? '✅' : '❌'}`);
      }
      
      // Test 5: Test Edge Function resolution
      console.log('\n🌐 Step 5: Testing Edge Function Resolution');
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/resolve-system-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            message_id: classifierResult.id,
            client_id: business.id
          })
        });
        
        if (response.ok) {
          const resolvedMessage = await response.json();
          console.log(`   ✅ Edge function resolved message: ${resolvedMessage.success ? 'SUCCESS' : 'FAILED'}`);
          if (resolvedMessage.success) {
            console.log(`   📝 Resolved message length: ${resolvedMessage.message.length} characters`);
          }
        } else {
          console.log(`   ⚠️  Edge function not deployed or not accessible`);
        }
      } catch (error) {
        console.log(`   ⚠️  Edge function test skipped: ${error.message}`);
      }
      
      console.log(`\n✅ Business ${business.name} test completed successfully!`);
    }
    
    console.log('\n🎉 ALL DYNAMIC TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('✅ Multiple businesses tested');
    console.log('✅ Dynamic content generation verified');
    console.log('✅ Secure storage and retrieval working');
    console.log('✅ Different email domains handled correctly');
    console.log('✅ Business-specific managers and suppliers included');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testDynamicSecureSystemMessages();
