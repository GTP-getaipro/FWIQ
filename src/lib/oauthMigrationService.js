/**
 * OAuth Migration Service
 * 
 * Handles migration of existing OAuth integrations from Supabase to n8n credentials
 * Provides utilities for both automatic and manual migration
 */

import { supabase } from '@/lib/customSupabaseClient';
import { n8nCredentialService } from './n8nCredentialService';

class OAuthMigrationService {
  constructor() {
    this.migrationStatus = {
      completed: false,
      errors: [],
      migrated: [],
      skipped: []
    };
  }

  /**
   * Check if a user has existing integrations that need migration
   */
  async checkMigrationNeeded(userId) {
    try {
      const { data: existingIntegrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .in('provider', ['gmail', 'outlook'])
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to check existing integrations: ${error.message}`);
      }

      const { data: existingMappings, error: mappingError } = await supabase
        .from('client_credentials_map')
        .select('provider')
        .eq('user_id', userId);

      if (mappingError) {
        throw new Error(`Failed to check existing mappings: ${mappingError.message}`);
      }

      const migratedProviders = existingMappings?.map(m => m.provider) || [];
      const needsMigration = existingIntegrations?.filter(
        integration => !migratedProviders.includes(integration.provider)
      ) || [];

      return {
        needsMigration: needsMigration.length > 0,
        existingIntegrations,
        migratedProviders,
        pendingMigration: needsMigration
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      throw error;
    }
  }

  /**
   * Migrate a single integration to n8n credentials
   */
  async migrateIntegration(userId, integration, businessName) {
    try {
      console.log(`🔄 Migrating ${integration.provider} integration for user ${userId}...`);

      // Get OAuth client credentials from environment or database
      const clientCredentials = await this.getClientCredentials(integration.provider);
      
      if (!clientCredentials) {
        throw new Error(`Client credentials not found for ${integration.provider}`);
      }

      // Create new credential in n8n
      const credential = await n8nCredentialService.createOAuth2Credential(
        integration.provider,
        clientCredentials.clientId,
        clientCredentials.clientSecret,
        businessName,
        userId
      );

      // Save mapping to Supabase
      await n8nCredentialService.saveCredentialMapping(
        userId,
        businessName,
        credential.id,
        integration.provider
      );

      // Mark old integration as migrated (don't delete yet for rollback safety)
      const { error } = await supabase
        .from('integrations')
        .update({ 
          status: 'migrated',
          migrated_to_n8n: true,
          migrated_at: new Date().toISOString(),
          n8n_credential_id: credential.id
        })
        .eq('id', integration.id);

      if (error) {
        console.warn(`Failed to mark integration as migrated: ${error.message}`);
      }

      console.log(`✅ Successfully migrated ${integration.provider} integration to credential ${credential.id}`);
      
      return {
        success: true,
        provider: integration.provider,
        oldIntegrationId: integration.id,
        newCredentialId: credential.id
      };

    } catch (error) {
      console.error(`❌ Failed to migrate ${integration.provider} integration:`, error);
      throw error;
    }
  }

  /**
   * Migrate all pending integrations for a user
   */
  async migrateAllIntegrations(userId, businessName) {
    try {
      const migrationCheck = await this.checkMigrationNeeded(userId);
      
      if (!migrationCheck.needsMigration) {
        return {
          success: true,
          message: 'No migrations needed',
          migrated: [],
          skipped: []
        };
      }

      const results = {
        success: true,
        migrated: [],
        errors: [],
        skipped: []
      };

      for (const integration of migrationCheck.pendingMigration) {
        try {
          const result = await this.migrateIntegration(userId, integration, businessName);
          results.migrated.push(result);
        } catch (error) {
          results.errors.push({
            provider: integration.provider,
            error: error.message
          });
        }
      }

      results.success = results.errors.length === 0;
      
      return results;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get OAuth client credentials for a provider
   */
  async getClientCredentials(provider) {
    // In production, these should be stored securely (e.g., in Supabase secrets)
    const credentials = {
      gmail: {
        clientId: process.env.VITE_GOOGLE_CLIENT_ID,
        clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET
      },
      outlook: {
        clientId: process.env.VITE_AZURE_CLIENT_ID,
        clientSecret: process.env.VITE_AZURE_CLIENT_SECRET
      }
    };

    return credentials[provider] || null;
  }

  /**
   * Force user to re-authorize (recommended approach)
   */
  async forceReauthorization(userId, provider, businessName) {
    try {
      // Remove existing integration
      await supabase
        .from('integrations')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      // Remove existing mapping if any
      await supabase
        .from('client_credentials_map')
        .delete()
        .eq('user_id', userId)
        .eq('provider', provider);

      // Redirect to n8n OAuth flow
      const n8nRedirectUrl = n8nCredentialService.getOAuthRedirectUrl(
        provider,
        (await this.getClientCredentials(provider)).clientId,
        (await this.getClientCredentials(provider)).clientSecret,
        businessName,
        userId
      );

      return {
        success: true,
        redirectUrl: n8nRedirectUrl
      };
    } catch (error) {
      console.error('Failed to force reauthorization:', error);
      throw error;
    }
  }

  /**
   * Get migration status for a user
   */
  async getMigrationStatus(userId) {
    try {
      const migrationCheck = await this.checkMigrationNeeded(userId);
      
      return {
        needsMigration: migrationCheck.needsMigration,
        hasOldIntegrations: migrationCheck.existingIntegrations?.length > 0,
        hasNewMappings: migrationCheck.migratedProviders.length > 0,
        pendingCount: migrationCheck.pendingMigration?.length || 0,
        migratedCount: migrationCheck.migratedProviders.length,
        status: migrationCheck.needsMigration ? 'pending' : 'complete'
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Clean up old integrations after successful migration
   */
  async cleanupOldIntegrations(userId) {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('user_id', userId)
        .eq('migrated_to_n8n', true);

      if (error) {
        throw new Error(`Failed to cleanup old integrations: ${error.message}`);
      }

      console.log(`✅ Cleaned up old integrations for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to cleanup old integrations:', error);
      throw error;
    }
  }

  /**
   * Rollback migration (emergency use only)
   */
  async rollbackMigration(userId, provider) {
    try {
      console.log(`🔄 Rolling back ${provider} migration for user ${userId}...`);

      // Get the n8n credential ID
      const { data: mapping } = await supabase
        .from('client_credentials_map')
        .select('n8n_credential_id')
        .eq('user_id', userId)
        .eq('provider', provider)
        .single();

      if (mapping) {
        // Delete from n8n
        await n8nCredentialService.deleteCredential(mapping.n8n_credential_id);
        
        // Remove mapping
        await supabase
          .from('client_credentials_map')
          .delete()
          .eq('user_id', userId)
          .eq('provider', provider);
      }

      // Restore old integration
      await supabase
        .from('integrations')
        .update({ 
          status: 'active',
          migrated_to_n8n: false,
          migrated_at: null,
          n8n_credential_id: null
        })
        .eq('user_id', userId)
        .eq('provider', provider);

      console.log(`✅ Rolled back ${provider} migration for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to rollback migration:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const oauthMigrationService = new OAuthMigrationService();

// Export class for testing
export { OAuthMigrationService };
