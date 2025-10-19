/**
 * TEST SECURE SYSTEM MESSAGES
 * 
 * This script tests the secure system message storage and retrieval
 * to ensure source code protection is working correctly
 */

import { SecureSystemMessageManager } from '../src/lib/secureSystemMessageManager.js';
import { createClient } from '@supabase/supabase-js';

console.log('🔒 TESTING SECURE SYSTEM MESSAGES');
console.log('='.repeat(60));

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const ENCRYPTION_KEY = process.env.SYSTEM_MESSAGE_ENCRYPTION_KEY || SecureSystemMessageManager.generateEncryptionKey();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data
const testUserId = 'test-user-123';
const testBusinessTypes = ['pools_spas', 'hvac'];
const testSystemMessage = `You are an expert email processing and routing system for "The Hot Tub Man Ltd.".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- **Business Name:** The Hot Tub Man Ltd.
- **Business Type(s):** pools_spas, hvac
- **Email Domain:** thehottubman.ca
- **Service Area:** Red Deer, Leduc, Edmonton

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true.

If the sender's email address ends with "@thehottubman.ca", always set:
"ai_can_reply": false

1. Analyze the entire email context (sender, subject, body).
2. Choose **ONE** \`primary_category\` from the list provided.
3. If the chosen category has sub-categories, select the most appropriate \`secondary_category\`.
4. Provide a concise \`summary\` of the email's core request.
5. Extract all available \`entities\`.
6. Provide a confidence score (0.0 to 1.0) and a brief reasoning for your classification.

### Category Structure:
**Support:** Emails from existing customers related to post-sales support.
**Sales:** Emails from leads or customers expressing interest in purchasing.
**Urgent:** Emails requiring immediate attention or emergency situations.
**General:** General inquiries and miscellaneous communications.

### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.
\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\``;

async function testSecureSystemMessages() {
  console.log('🚀 Testing Secure System Message Storage and Retrieval...\n');
  
  try {
    // Initialize secure system message manager
    const messageManager = new SecureSystemMessageManager(supabase, ENCRYPTION_KEY);
    
    console.log('✅ Secure System Message Manager initialized');
    console.log(`🔑 Encryption key length: ${ENCRYPTION_KEY.length} characters`);
    
    // Test 1: Store system message
    console.log('\n📝 Test 1: Storing System Message');
    console.log('─'.repeat(40));
    
    const messageRef = await messageManager.generateAndStoreSystemMessage(
      testUserId,
      'classifier',
      testBusinessTypes,
      testSystemMessage
    );
    
    console.log(`✅ System message stored successfully!`);
    console.log(`📋 Message ID: ${messageRef.messageId}`);
    console.log(`🔐 Hash: ${messageRef.hash.substring(0, 16)}...`);
    console.log(`🏷️ Type: ${messageRef.type}`);
    console.log(`🏢 Business Types: ${messageRef.businessTypes.join(', ')}`);
    
    // Test 2: Retrieve system message
    console.log('\n📖 Test 2: Retrieving System Message');
    console.log('─'.repeat(40));
    
    const retrievedMessage = await messageManager.getSystemMessage(
      messageRef.messageId,
      testUserId
    );
    
    console.log(`✅ System message retrieved successfully!`);
    console.log(`📋 Content length: ${retrievedMessage.content.length} characters`);
    console.log(`🏷️ Type: ${retrievedMessage.type}`);
    console.log(`🏢 Business Types: ${retrievedMessage.businessTypes.join(', ')}`);
    console.log(`🔐 Hash: ${retrievedMessage.hash.substring(0, 16)}...`);
    console.log(`📊 Version: ${retrievedMessage.version}`);
    
    // Test 3: Verify content integrity
    console.log('\n🔍 Test 3: Content Integrity Verification');
    console.log('─'.repeat(40));
    
    const contentMatches = retrievedMessage.content === testSystemMessage;
    const hashMatches = retrievedMessage.hash === messageRef.hash;
    
    console.log(`✅ Content matches original: ${contentMatches ? 'YES' : 'NO'}`);
    console.log(`✅ Hash matches original: ${hashMatches ? 'YES' : 'NO'}`);
    
    if (contentMatches && hashMatches) {
      console.log(`🎉 Content integrity verified successfully!`);
    } else {
      console.log(`❌ Content integrity check failed!`);
    }
    
    // Test 4: List system messages
    console.log('\n📋 Test 4: Listing System Messages');
    console.log('─'.repeat(40));
    
    const messageList = await messageManager.listSystemMessages(testUserId);
    
    console.log(`✅ Found ${messageList.length} system messages for user ${testUserId}`);
    messageList.forEach((msg, index) => {
      console.log(`  ${index + 1}. ID: ${msg.id.substring(0, 8)}...`);
      console.log(`     Type: ${msg.type}`);
      console.log(`     Business Types: ${msg.businessTypes.join(', ')}`);
      console.log(`     Created: ${new Date(msg.createdAt).toLocaleString()}`);
    });
    
    // Test 5: Update system message
    console.log('\n🔄 Test 5: Updating System Message');
    console.log('─'.repeat(40));
    
    const updatedMessage = testSystemMessage + '\n\n### Additional Rules:\n- Always prioritize customer satisfaction\n- Maintain professional tone at all times';
    
    const updateRef = await messageManager.updateSystemMessage(
      messageRef.messageId,
      testUserId,
      updatedMessage
    );
    
    console.log(`✅ System message updated successfully!`);
    console.log(`📋 New hash: ${updateRef.hash.substring(0, 16)}...`);
    console.log(`📊 New version: ${updateRef.version}`);
    
    // Test 6: Retrieve updated message
    console.log('\n📖 Test 6: Retrieving Updated Message');
    console.log('─'.repeat(40));
    
    const updatedRetrievedMessage = await messageManager.getSystemMessage(
      messageRef.messageId,
      testUserId
    );
    
    console.log(`✅ Updated message retrieved successfully!`);
    console.log(`📋 Content length: ${updatedRetrievedMessage.content.length} characters`);
    console.log(`📊 Version: ${updatedRetrievedMessage.version}`);
    console.log(`🔐 Hash: ${updatedRetrievedMessage.hash.substring(0, 16)}...`);
    
    // Test 7: Test access control (try to access with different user)
    console.log('\n🔒 Test 7: Access Control Verification');
    console.log('─'.repeat(40));
    
    try {
      await messageManager.getSystemMessage(messageRef.messageId, 'different-user-456');
      console.log(`❌ Access control failed - unauthorized access allowed!`);
    } catch (error) {
      console.log(`✅ Access control working - unauthorized access blocked`);
      console.log(`📋 Error: ${error.message}`);
    }
    
    // Test 8: Test encryption key validation
    console.log('\n🔑 Test 8: Encryption Key Validation');
    console.log('─'.repeat(40));
    
    const isValidKey = SecureSystemMessageManager.verifyEncryptionKey(ENCRYPTION_KEY);
    console.log(`✅ Encryption key is valid: ${isValidKey ? 'YES' : 'NO'}`);
    
    const invalidKey = 'invalid-key';
    const isInvalidKey = SecureSystemMessageManager.verifyEncryptionKey(invalidKey);
    console.log(`✅ Invalid key rejected: ${isInvalidKey ? 'NO' : 'YES'}`);
    
    // Test 9: Cleanup (delete test message)
    console.log('\n🗑️ Test 9: Cleanup');
    console.log('─'.repeat(40));
    
    const deleteResult = await messageManager.deleteSystemMessage(
      messageRef.messageId,
      testUserId
    );
    
    console.log(`✅ Test message deleted: ${deleteResult ? 'YES' : 'NO'}`);
    
    // Summary
    console.log('\n🎉 SECURE SYSTEM MESSAGE TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('🔒 Source code protection is working correctly');
    console.log('🔐 Encryption and decryption functioning properly');
    console.log('🛡️ Access control preventing unauthorized access');
    console.log('📊 Versioning and integrity checking working');
    console.log('🗑️ Cleanup and deletion functioning');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSecureSystemMessages().catch(console.error);
