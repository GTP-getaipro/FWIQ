/**
 * Credential Cleanup Manager
 * Handles cleanup of duplicate credentials and proper credential lifecycle management
 */

import { supabase } from './customSupabaseClient.js';
import { n8nApiClient } from './n8nApiClient.js';

export class CredentialCleanupManager {
  constructor() {
    this.apiClient = n8nApiClient;
  }

  /**
   * Clean up duplicate credentials for a user
   * @param {string} userId - User ID
   * @param {string} provider - Provider ('gmail' or 'outlook')
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupDuplicateCredentials(userId, provider) {
    try {
      console.log(`🧹 Cleaning up duplicate ${provider} credentials for user: ${userId.substring(0, 8)}...`);

      // Step 1: Get all credentials for this user+provider from database
      const { data: dbCredentials, error: dbError } = await supabase
        .from('n8n_credentials')
        .select('id, n8n_credential_id, credential_name, created_at, status')
        .eq('user_id', userId)
        .eq('provider', provider)
        .order('created_at', { ascending: false });

      if (dbError) {
        throw new Error(`Failed to fetch credentials from database: ${dbError.message}`);
      }

      if (!dbCredentials || dbCredentials.length <= 1) {
        console.log(`✅ No duplicate ${provider} credentials found in database`);
        return {
          success: true,
          message: 'No duplicates found',
          kept: dbCredentials?.length || 0,
          removed: 0
        };
      }

      console.log(`📋 Found ${dbCredentials.length} ${provider} credentials in database`);

      // Step 2: Keep the most recent active credential
      const activeCredentials = dbCredentials.filter(c => c.status === 'active');
      const latestCredential = activeCredentials[0]; // Most recent due to ordering

      if (!latestCredential) {
        console.log(`⚠️ No active ${provider} credentials found, keeping most recent`);
        const mostRecent = dbCredentials[0];
        return {
          success: true,
          message: 'No active credentials, kept most recent',
          kept: 1,
          removed: dbCredentials.length - 1,
          keptCredential: mostRecent
        };
      }

      console.log(`✅ Keeping latest active credential: ${latestCredential.credential_name}`);

      // Step 3: Remove duplicates from database
      const credentialsToRemove = dbCredentials.filter(c => c.id !== latestCredential.id);
      let removedCount = 0;

      for (const credential of credentialsToRemove) {
        try {
          // Update status to 'archived' instead of deleting
          const { error: updateError } = await supabase
            .from('n8n_credentials')
            .update({ 
              status: 'archived',
              updated_at: new Date().toISOString()
            })
            .eq('id', credential.id);

          if (updateError) {
            console.warn(`⚠️ Failed to archive credential ${credential.id}:`, updateError.message);
          } else {
            console.log(`📁 Archived duplicate credential: ${credential.credential_name}`);
            removedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Error archiving credential ${credential.id}:`, error.message);
        }
      }

      // Step 4: Clean up n8n credentials (optional - be careful with this)
      // Note: We don't delete from n8n automatically as it might break existing workflows
      // The user can manually clean up n8n credentials if needed

      console.log(`✅ Credential cleanup completed for ${provider}`);
      return {
        success: true,
        message: `Cleaned up ${provider} credentials`,
        kept: 1,
        removed: removedCount,
        keptCredential: latestCredential,
        archivedCredentials: credentialsToRemove
      };

    } catch (error) {
      console.error(`❌ Credential cleanup failed for ${provider}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up all duplicate credentials for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Complete cleanup result
   */
  async cleanupAllDuplicateCredentials(userId) {
    try {
      console.log(`🧹 Starting complete credential cleanup for user: ${userId.substring(0, 8)}...`);

      const results = {};
      const providers = ['gmail', 'outlook', 'google'];

      for (const provider of providers) {
        console.log(`\n🔄 Processing ${provider} credentials...`);
        results[provider] = await this.cleanupDuplicateCredentials(userId, provider);
      }

      const totalKept = Object.values(results).reduce((sum, result) => sum + (result.kept || 0), 0);
      const totalRemoved = Object.values(results).reduce((sum, result) => sum + (result.removed || 0), 0);

      console.log(`\n✅ Complete credential cleanup finished:`);
      console.log(`   📊 Total kept: ${totalKept}`);
      console.log(`   🗑️ Total archived: ${totalRemoved}`);

      return {
        success: true,
        message: 'Complete credential cleanup finished',
        totalKept,
        totalRemoved,
        results
      };

    } catch (error) {
      console.error('❌ Complete credential cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get credential summary for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Credential summary
   */
  async getCredentialSummary(userId) {
    try {
      const { data: credentials, error } = await supabase
        .from('n8n_credentials')
        .select('provider, credential_name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch credential summary: ${error.message}`);
      }

      const summary = {
        total: credentials.length,
        byProvider: {},
        byStatus: {},
        duplicates: []
      };

      // Group by provider
      credentials.forEach(cred => {
        if (!summary.byProvider[cred.provider]) {
          summary.byProvider[cred.provider] = [];
        }
        summary.byProvider[cred.provider].push(cred);
      });

      // Group by status
      credentials.forEach(cred => {
        summary.byStatus[cred.status] = (summary.byStatus[cred.status] || 0) + 1;
      });

      // Identify duplicates (same provider with multiple entries)
      Object.keys(summary.byProvider).forEach(provider => {
        if (summary.byProvider[provider].length > 1) {
          summary.duplicates.push({
            provider,
            count: summary.byProvider[provider].length,
            credentials: summary.byProvider[provider]
          });
        }
      });

      return {
        success: true,
        summary
      };

    } catch (error) {
      console.error('❌ Failed to get credential summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const credentialCleanupManager = new CredentialCleanupManager();
