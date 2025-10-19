/**
 * DEPLOY SECURE SYSTEM MESSAGES
 * 
 * This script sets up the secure system message infrastructure
 * to protect source code from exposure in client-side applications
 */

import { createClient } from '@supabase/supabase-js';
import { SecureSystemMessageManager } from '../src/lib/secureSystemMessageManager.js';
import { generateEnhancedClassifierSystemMessage } from '../src/lib/enhancedClassifierSystemMessage.js';
import { generateMultiBusinessAIDraftAgentSystemMessage } from '../src/lib/multiBusinessAIDraftAgentSystemMessage.js';

console.log('🔒 DEPLOYING SECURE SYSTEM MESSAGES');
console.log('='.repeat(60));

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const ENCRYPTION_KEY = process.env.SYSTEM_MESSAGE_ENCRYPTION_KEY || SecureSystemMessageManager.generateEncryptionKey();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deploySecureSystemMessages() {
  try {
    console.log('🚀 Starting secure system message deployment...\n');
    
    // Step 1: Verify database schema
    console.log('📋 Step 1: Verifying Database Schema');
    console.log('─'.repeat(40));
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['system_messages', 'system_message_content']);
    
    if (tablesError) {
      console.error('❌ Error checking database schema:', tablesError);
      throw new Error('Failed to verify database schema');
    }
    
    const tableNames = tables.map(t => t.table_name);
    const hasSystemMessages = tableNames.includes('system_messages');
    const hasSystemMessageContent = tableNames.includes('system_message_content');
    
    console.log(`✅ system_messages table exists: ${hasSystemMessages ? 'YES' : 'NO'}`);
    console.log(`✅ system_message_content table exists: ${hasSystemMessageContent ? 'YES' : 'NO'}`);
    
    if (!hasSystemMessages || !hasSystemMessageContent) {
      console.log('⚠️ Database schema not found. Please run the migration first:');
      console.log('   supabase migration up');
      console.log('   or run: supabase/migrations/secure_system_messages.sql');
      return;
    }
    
    // Step 2: Initialize secure system message manager
    console.log('\n🔧 Step 2: Initializing Secure System Message Manager');
    console.log('─'.repeat(40));
    
    const messageManager = new SecureSystemMessageManager(supabase, ENCRYPTION_KEY);
    console.log(`✅ Secure System Message Manager initialized`);
    console.log(`🔑 Encryption key configured: ${ENCRYPTION_KEY.length} characters`);
    
    // Step 3: Get existing users to migrate
    console.log('\n👥 Step 3: Getting Existing Users');
    console.log('─'.repeat(40));
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, client_config, business_types, business_type')
      .limit(10); // Limit for testing
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw new Error('Failed to fetch user profiles');
    }
    
    console.log(`✅ Found ${profiles.length} user profiles to process`);
    
    // Step 4: Generate and store system messages for each user
    console.log('\n📝 Step 4: Generating and Storing System Messages');
    console.log('─'.repeat(40));
    
    const results = [];
    
    for (const profile of profiles) {
      try {
        console.log(`\n👤 Processing user: ${profile.id}`);
        
        // Extract business info
        const businessConfig = profile.client_config || {};
        const business = businessConfig.business || {};
        const businessTypes = profile.business_types || (profile.business_type ? [profile.business_type] : ['general']);
        
        const businessInfo = {
          id: profile.id,
          name: business.name || 'Business',
          businessTypes: businessTypes,
          emailDomain: business.emailDomain || 'business.com',
          phone: business.phone || 'Not provided',
          websiteUrl: business.websiteUrl || 'Not provided',
          serviceAreas: business.serviceAreas || ['Main service area'],
          operatingHours: business.operatingHours || 'Monday-Friday 8AM-5PM',
          responseTime: business.responseTime || '24 hours',
          managers: businessConfig.managers || [],
          suppliers: businessConfig.suppliers || []
        };
        
        // Generate classifier system message
        console.log(`  📊 Generating classifier system message...`);
        const classifierMessage = await generateEnhancedClassifierSystemMessage(
          businessInfo,
          businessInfo.managers,
          businessInfo.suppliers,
          null, // No historical data for initial deployment
          { labels: businessConfig.email_labels || [] }
        );
        
        const classifierRef = await messageManager.generateAndStoreSystemMessage(
          profile.id,
          'classifier',
          businessTypes,
          classifierMessage
        );
        
        console.log(`  ✅ Classifier message stored: ${classifierRef.messageId.substring(0, 8)}...`);
        
        // Generate AI draft agent system message
        console.log(`  📝 Generating AI draft agent system message...`);
        const draftAgentMessage = await generateMultiBusinessAIDraftAgentSystemMessage(
          businessInfo,
          businessInfo.managers,
          businessInfo.suppliers,
          null, // No historical data for initial deployment
          'General'
        );
        
        const draftAgentRef = await messageManager.generateAndStoreSystemMessage(
          profile.id,
          'draft_agent',
          businessTypes,
          draftAgentMessage
        );
        
        console.log(`  ✅ Draft agent message stored: ${draftAgentRef.messageId.substring(0, 8)}...`);
        
        results.push({
          userId: profile.id,
          businessName: businessInfo.name,
          businessTypes: businessTypes,
          classifierMessageId: classifierRef.messageId,
          draftAgentMessageId: draftAgentRef.messageId,
          success: true
        });
        
      } catch (error) {
        console.error(`  ❌ Error processing user ${profile.id}:`, error.message);
        results.push({
          userId: profile.id,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 5: Summary
    console.log('\n📊 Step 5: Deployment Summary');
    console.log('─'.repeat(40));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successfully processed: ${successful} users`);
    console.log(`❌ Failed to process: ${failed} users`);
    
    if (successful > 0) {
      console.log('\n📋 Successfully Deployed Users:');
      results.filter(r => r.success).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.businessName} (${result.businessTypes.join(', ')})`);
        console.log(`     Classifier: ${result.classifierMessageId.substring(0, 8)}...`);
        console.log(`     Draft Agent: ${result.draftAgentMessageId.substring(0, 8)}...`);
      });
    }
    
    if (failed > 0) {
      console.log('\n❌ Failed Deployments:');
      results.filter(r => !r.success).forEach((result, index) => {
        console.log(`  ${index + 1}. User ${result.userId}: ${result.error}`);
      });
    }
    
    // Step 6: Test secure retrieval
    console.log('\n🧪 Step 6: Testing Secure Retrieval');
    console.log('─'.repeat(40));
    
    const testResult = results.find(r => r.success);
    if (testResult) {
      console.log(`🔍 Testing retrieval for user: ${testResult.userId}`);
      
      const retrievedMessage = await messageManager.getSystemMessage(
        testResult.classifierMessageId,
        testResult.userId
      );
      
      console.log(`✅ Message retrieved successfully!`);
      console.log(`📋 Content length: ${retrievedMessage.content.length} characters`);
      console.log(`🏷️ Type: ${retrievedMessage.type}`);
      console.log(`🔐 Hash: ${retrievedMessage.hash.substring(0, 16)}...`);
    }
    
    // Step 7: Environment setup instructions
    console.log('\n🔧 Step 7: Environment Setup Instructions');
    console.log('─'.repeat(40));
    
    console.log('📋 Required Environment Variables:');
    console.log(`   SYSTEM_MESSAGE_ENCRYPTION_KEY=${ENCRYPTION_KEY}`);
    console.log(`   SUPABASE_URL=${SUPABASE_URL}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY=***hidden***`);
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Deploy the resolve-system-message Edge Function');
    console.log('2. Update n8n workflows to use message references');
    console.log('3. Test the complete secure system');
    console.log('4. Monitor for any issues');
    
    console.log('\n🎉 SECURE SYSTEM MESSAGE DEPLOYMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log('🔒 Source code is now protected from exposure');
    console.log('🔐 System messages are encrypted at rest');
    console.log('🛡️ Access control prevents unauthorized access');
    console.log('📊 Versioning and integrity checking enabled');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the deployment
deploySecureSystemMessages().catch(console.error);
