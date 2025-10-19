/**
 * Cleanup Duplicate Credentials Script
 * 
 * This script cleans up duplicate credentials for "The Hot Tub Man" client
 * and demonstrates the credential cleanup functionality.
 */

import { credentialCleanupManager } from '../src/lib/credentialCleanupManager.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'your-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function cleanupCredentialsForHotTubMan() {
  try {
    console.log('🧹 Starting credential cleanup for "The Hot Tub Man"...\n');

    // Step 1: Find the user ID for "The Hot Tub Man"
    console.log('🔍 Step 1: Finding user ID for "The Hot Tub Man"...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, client_config')
      .ilike('client_config->>business_name', '%Hot Tub Man%')
      .limit(5);

    if (profileError) {
      throw new Error(`Failed to find profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found for "The Hot Tub Man"');
      return;
    }

    console.log(`✅ Found ${profiles.length} profile(s) for "The Hot Tub Man":`);
    profiles.forEach((profile, index) => {
      const businessName = profile.client_config?.business_name || 'Unknown';
      console.log(`   ${index + 1}. ${profile.email} - ${businessName}`);
    });

    // Step 2: Get credential summary for each user
    for (const profile of profiles) {
      console.log(`\n📊 Step 2: Analyzing credentials for ${profile.email}...`);
      
      const summaryResult = await credentialCleanupManager.getCredentialSummary(profile.id);
      
      if (summaryResult.success) {
        const summary = summaryResult.summary;
        console.log(`   📋 Total credentials: ${summary.total}`);
        console.log(`   📊 By provider:`, summary.byProvider);
        console.log(`   📊 By status:`, summary.byStatus);
        
        if (summary.duplicates.length > 0) {
          console.log(`   ⚠️ Duplicates found:`);
          summary.duplicates.forEach(dup => {
            console.log(`      - ${dup.provider}: ${dup.count} credentials`);
          });
        } else {
          console.log(`   ✅ No duplicates found`);
        }
      } else {
        console.log(`   ❌ Failed to get summary: ${summaryResult.error}`);
      }
    }

    // Step 3: Clean up duplicates for each user
    for (const profile of profiles) {
      console.log(`\n🧹 Step 3: Cleaning up credentials for ${profile.email}...`);
      
      const cleanupResult = await credentialCleanupManager.cleanupAllDuplicateCredentials(profile.id);
      
      if (cleanupResult.success) {
        console.log(`   ✅ Cleanup completed:`);
        console.log(`      📊 Kept: ${cleanupResult.totalKept} credentials`);
        console.log(`      🗑️ Archived: ${cleanupResult.totalRemoved} credentials`);
        
        // Show detailed results by provider
        Object.keys(cleanupResult.results).forEach(provider => {
          const result = cleanupResult.results[provider];
          if (result.removed > 0) {
            console.log(`      🔧 ${provider}: kept ${result.kept}, archived ${result.removed}`);
          }
        });
      } else {
        console.log(`   ❌ Cleanup failed: ${cleanupResult.error}`);
      }
    }

    console.log('\n✅ Credential cleanup process completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check the n8n interface to verify duplicate credentials are gone');
    console.log('   2. Manually delete any remaining duplicate credentials in n8n if needed');
    console.log('   3. Future deployments will now use the enhanced credential management');

  } catch (error) {
    console.error('❌ Credential cleanup failed:', error);
  }
}

// Run the cleanup
cleanupCredentialsForHotTubMan();
