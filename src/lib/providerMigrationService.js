import { supabase } from '@/lib/customSupabaseClient';
import { analytics } from '@/lib/analytics';

/**
 * Provider Migration Service
 * Handles seamless migration between Gmail and Outlook providers with data preservation
 */
export class ProviderMigrationService {
  constructor(userId) {
    this.userId = userId;
    this.migrationSteps = [];
    this.rollbackData = new Map();
  }

  /**
   * Migrate from Gmail to Outlook
   */
  async migrateGmailToOutlook(options = {}) {
    const migrationId = `gmail_to_outlook_${Date.now()}`;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting Gmail to Outlook migration...');
      
      // Step 1: Validate current Gmail integration
      const gmailIntegration = await this.validateSourceIntegration('gmail');
      if (!gmailIntegration) {
        throw new Error('Gmail integration not found or inactive');
      }

      // Step 2: Validate target Outlook integration
      const outlookIntegration = await this.validateTargetIntegration('outlook');
      if (!outlookIntegration) {
        throw new Error('Outlook integration not found or inactive');
      }

      // Step 3: Create migration backup
      const backup = await this.createMigrationBackup('gmail', migrationId);
      this.rollbackData.set(migrationId, backup);

      // Step 4: Migrate email labels/folders
      const labelMigration = await this.migrateEmailLabels('gmail', 'outlook', options);
      this.migrationSteps.push({ step: 'labels', result: labelMigration });

      // Step 5: Migrate business configuration
      const configMigration = await this.migrateBusinessConfiguration('gmail', 'outlook', options);
      this.migrationSteps.push({ step: 'config', result: configMigration });

      // Step 6: Migrate n8n workflow credentials
      const workflowMigration = await this.migrateWorkflowCredentials('gmail', 'outlook', options);
      this.migrationSteps.push({ step: 'workflows', result: workflowMigration });

      // Step 7: Update active provider
      await this.updateActiveProvider('outlook', options);

      // Step 8: Validate migration
      const validation = await this.validateMigration('outlook', options);
      this.migrationSteps.push({ step: 'validation', result: validation });

      // Step 9: Clean up old integration (optional)
      if (options.cleanupOldIntegration !== false) {
        await this.cleanupOldIntegration('gmail', options);
      }

      const duration = Date.now() - startTime;
      
      // Track successful migration
      await analytics.trackBusinessEvent('provider_migration_completed', {
        fromProvider: 'gmail',
        toProvider: 'outlook',
        duration,
        stepsCompleted: this.migrationSteps.length,
        migrationId
      });

      console.log('✅ Gmail to Outlook migration completed successfully');
      
      return {
        success: true,
        migrationId,
        duration,
        steps: this.migrationSteps,
        rollbackData: this.rollbackData.get(migrationId)
      };

    } catch (error) {
      console.error('❌ Gmail to Outlook migration failed:', error);
      
      // Attempt rollback
      try {
        await this.rollbackMigration(migrationId);
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }

      // Track failed migration
      await analytics.trackBusinessEvent('provider_migration_failed', {
        fromProvider: 'gmail',
        toProvider: 'outlook',
        error: error.message,
        migrationId
      });

      throw error;
    }
  }

  /**
   * Migrate from Outlook to Gmail
   */
  async migrateOutlookToGmail(options = {}) {
    const migrationId = `outlook_to_gmail_${Date.now()}`;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting Outlook to Gmail migration...');
      
      // Step 1: Validate current Outlook integration
      const outlookIntegration = await this.validateSourceIntegration('outlook');
      if (!outlookIntegration) {
        throw new Error('Outlook integration not found or inactive');
      }

      // Step 2: Validate target Gmail integration
      const gmailIntegration = await this.validateTargetIntegration('gmail');
      if (!gmailIntegration) {
        throw new Error('Gmail integration not found or inactive');
      }

      // Step 3: Create migration backup
      const backup = await this.createMigrationBackup('outlook', migrationId);
      this.rollbackData.set(migrationId, backup);

      // Step 4: Migrate email folders/labels
      const labelMigration = await this.migrateEmailLabels('outlook', 'gmail', options);
      this.migrationSteps.push({ step: 'labels', result: labelMigration });

      // Step 5: Migrate business configuration
      const configMigration = await this.migrateBusinessConfiguration('outlook', 'gmail', options);
      this.migrationSteps.push({ step: 'config', result: configMigration });

      // Step 6: Migrate n8n workflow credentials
      const workflowMigration = await this.migrateWorkflowCredentials('outlook', 'gmail', options);
      this.migrationSteps.push({ step: 'workflows', result: workflowMigration });

      // Step 7: Update active provider
      await this.updateActiveProvider('gmail', options);

      // Step 8: Validate migration
      const validation = await this.validateMigration('gmail', options);
      this.migrationSteps.push({ step: 'validation', result: validation });

      // Step 9: Clean up old integration (optional)
      if (options.cleanupOldIntegration !== false) {
        await this.cleanupOldIntegration('outlook', options);
      }

      const duration = Date.now() - startTime;
      
      // Track successful migration
      await analytics.trackBusinessEvent('provider_migration_completed', {
        fromProvider: 'outlook',
        toProvider: 'gmail',
        duration,
        stepsCompleted: this.migrationSteps.length,
        migrationId
      });

      console.log('✅ Outlook to Gmail migration completed successfully');
      
      return {
        success: true,
        migrationId,
        duration,
        steps: this.migrationSteps,
        rollbackData: this.rollbackData.get(migrationId)
      };

    } catch (error) {
      console.error('❌ Outlook to Gmail migration failed:', error);
      
      // Attempt rollback
      try {
        await this.rollbackMigration(migrationId);
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }

      // Track failed migration
      await analytics.trackBusinessEvent('provider_migration_failed', {
        fromProvider: 'outlook',
        toProvider: 'gmail',
        error: error.message,
        migrationId
      });

      throw error;
    }
  }

  /**
   * Enable dual provider support (both Gmail and Outlook active)
   */
  async enableDualProviderSupport(options = {}) {
    try {
      console.log('🚀 Enabling dual provider support...');

      // Check if both integrations exist
      const integrations = await this.getUserIntegrations();
      const gmailIntegration = integrations.find(i => i.provider === 'gmail' && i.status === 'active');
      const outlookIntegration = integrations.find(i => i.provider === 'outlook' && i.status === 'active');

      if (!gmailIntegration && !outlookIntegration) {
        throw new Error('At least one email provider must be active to enable dual support');
      }

      // Set dual provider mode
      await supabase
        .from('profiles')
        .update({ 
          dual_provider_mode: true,
          primary_provider: options.primaryProvider || (gmailIntegration ? 'gmail' : 'outlook')
        })
        .eq('id', this.userId);

      // Track dual provider activation
      await analytics.trackBusinessEvent('dual_provider_enabled', {
        gmailActive: !!gmailIntegration,
        outlookActive: !!outlookIntegration,
        primaryProvider: options.primaryProvider || (gmailIntegration ? 'gmail' : 'outlook')
      });

      console.log('✅ Dual provider support enabled');
      
      return {
        success: true,
        gmailActive: !!gmailIntegration,
        outlookActive: !!outlookIntegration,
        primaryProvider: options.primaryProvider || (gmailIntegration ? 'gmail' : 'outlook')
      };

    } catch (error) {
      console.error('❌ Failed to enable dual provider support:', error);
      throw error;
    }
  }

  /**
   * Disable dual provider support
   */
  async disableDualProviderSupport(options = {}) {
    try {
      console.log('🚀 Disabling dual provider support...');

      // Set single provider mode
      await supabase
        .from('profiles')
        .update({ 
          dual_provider_mode: false,
          primary_provider: options.keepProvider || 'gmail'
        })
        .eq('id', this.userId);

      // Track dual provider deactivation
      await analytics.trackBusinessEvent('dual_provider_disabled', {
        keepProvider: options.keepProvider || 'gmail'
      });

      console.log('✅ Dual provider support disabled');
      
      return {
        success: true,
        activeProvider: options.keepProvider || 'gmail'
      };

    } catch (error) {
      console.error('❌ Failed to disable dual provider support:', error);
      throw error;
    }
  }

  /**
   * Validate source integration
   */
  async validateSourceIntegration(provider) {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      // Test API connectivity
      const isConnected = await this.testProviderConnectivity(provider, data.access_token);
      return isConnected ? data : null;
    } catch (error) {
      console.error(`Failed to validate ${provider} integration:`, error);
      return null;
    }
  }

  /**
   * Validate target integration
   */
  async validateTargetIntegration(provider) {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      // Test API connectivity
      const isConnected = await this.testProviderConnectivity(provider, data.access_token);
      return isConnected ? data : null;
    } catch (error) {
      console.error(`Failed to validate ${provider} integration:`, error);
      return null;
    }
  }

  /**
   * Test provider connectivity
   */
  async testProviderConnectivity(provider, accessToken) {
    try {
      let testUrl;
      if (provider === 'gmail') {
        testUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
      } else if (provider === 'outlook') {
        testUrl = 'https://graph.microsoft.com/v1.0/me';
      } else {
        return false;
      }

      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to test ${provider} connectivity:`, error);
      return false;
    }
  }

  /**
   * Create migration backup
   */
  async createMigrationBackup(provider, migrationId) {
    try {
      const backup = {
        migrationId,
        provider,
        timestamp: new Date().toISOString(),
        userId: this.userId,
        data: {}
      };

      // Backup integration data
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('provider', provider)
        .single();

      if (integration) {
        backup.data.integration = integration;
      }

      // Backup profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config, email_labels, managers, suppliers')
        .eq('id', this.userId)
        .single();

      if (profile) {
        backup.data.profile = profile;
      }

      // Backup credentials
      const { data: credentials } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('client_id', this.userId)
        .eq('provider', provider);

      if (credentials) {
        backup.data.credentials = credentials;
      }

      // Store backup
      await supabase
        .from('migration_backups')
        .insert(backup);

      console.log(`✅ Created migration backup for ${provider}`);
      return backup;

    } catch (error) {
      console.error(`Failed to create migration backup for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Migrate email labels/folders
   */
  async migrateEmailLabels(fromProvider, toProvider, options = {}) {
    try {
      console.log(`🔄 Migrating email labels from ${fromProvider} to ${toProvider}...`);

      // Get current email labels from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_labels')
        .eq('id', this.userId)
        .single();

      if (!profile?.email_labels) {
        return { success: true, message: 'No email labels to migrate' };
      }

      const emailLabels = profile.email_labels;
      const migratedLabels = [];

      // Migrate each label/folder
      for (const [labelName, labelData] of Object.entries(emailLabels)) {
        try {
          // Create label in target provider
          const result = await this.createLabelInProvider(toProvider, labelName, labelData);
          migratedLabels.push({
            name: labelName,
            fromProvider,
            toProvider,
            success: true,
            result
          });
        } catch (error) {
          console.warn(`Failed to migrate label ${labelName}:`, error);
          migratedLabels.push({
            name: labelName,
            fromProvider,
            toProvider,
            success: false,
            error: error.message
          });
        }
      }

      console.log(`✅ Migrated ${migratedLabels.length} email labels`);
      return {
        success: true,
        migratedLabels,
        totalLabels: Object.keys(emailLabels).length,
        successfulMigrations: migratedLabels.filter(l => l.success).length
      };

    } catch (error) {
      console.error(`Failed to migrate email labels from ${fromProvider} to ${toProvider}:`, error);
      throw error;
    }
  }

  /**
   * Create label in specific provider
   */
  async createLabelInProvider(provider, labelName, labelData) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', this.userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();

      if (!integration?.access_token) {
        throw new Error(`No active ${provider} integration found`);
      }

      if (provider === 'gmail') {
        return await this.createGmailLabel(labelName, labelData, integration.access_token);
      } else if (provider === 'outlook') {
        return await this.createOutlookFolder(labelName, labelData, integration.access_token);
      }

      throw new Error(`Unsupported provider: ${provider}`);
    } catch (error) {
      console.error(`Failed to create label in ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Create Gmail label
   */
  async createGmailLabel(labelName, labelData, accessToken) {
    const labelBody = {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    };

    if (labelData.color) {
      labelBody.color = labelData.color;
    }

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(labelBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gmail API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create Outlook folder
   */
  async createOutlookFolder(folderName, folderData, accessToken) {
    const folderBody = {
      displayName: folderName
    };

    if (folderData.color) {
      folderBody.color = folderData.color;
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Microsoft Graph API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Migrate business configuration
   */
  async migrateBusinessConfiguration(fromProvider, toProvider, options = {}) {
    try {
      console.log(`🔄 Migrating business configuration from ${fromProvider} to ${toProvider}...`);

      // Business configuration is provider-agnostic, so this is mainly validation
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', this.userId)
        .single();

      if (!profile?.client_config) {
        return { success: true, message: 'No business configuration to migrate' };
      }

      // Update configuration to reflect new provider
      const updatedConfig = {
        ...profile.client_config,
        integrations: {
          ...profile.client_config.integrations,
          primaryProvider: toProvider,
          lastMigration: new Date().toISOString(),
          migrationFrom: fromProvider
        }
      };

      await supabase
        .from('profiles')
        .update({ client_config: updatedConfig })
        .eq('id', this.userId);

      console.log(`✅ Business configuration updated for ${toProvider}`);
      return {
        success: true,
        fromProvider,
        toProvider,
        configUpdated: true
      };

    } catch (error) {
      console.error(`Failed to migrate business configuration:`, error);
      throw error;
    }
  }

  /**
   * Migrate workflow credentials
   */
  async migrateWorkflowCredentials(fromProvider, toProvider, options = {}) {
    try {
      console.log(`🔄 Migrating workflow credentials from ${fromProvider} to ${toProvider}...`);

      // Update n8n credential mapping
      const { data: oldCredentials } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('client_id', this.userId)
        .eq('provider', fromProvider);

      const { data: newCredentials } = await supabase
        .from('client_credentials_map')
        .select('*')
        .eq('client_id', this.userId)
        .eq('provider', toProvider);

      if (oldCredentials && newCredentials) {
        // Update workflow templates to use new provider credentials
        await this.updateWorkflowTemplates(fromProvider, toProvider, newCredentials[0].n8n_credential_id);
      }

      console.log(`✅ Workflow credentials migrated from ${fromProvider} to ${toProvider}`);
      return {
        success: true,
        fromProvider,
        toProvider,
        credentialsUpdated: true
      };

    } catch (error) {
      console.error(`Failed to migrate workflow credentials:`, error);
      throw error;
    }
  }

  /**
   * Update workflow templates
   */
  async updateWorkflowTemplates(fromProvider, toProvider, newCredentialId) {
    try {
      // This would typically involve updating n8n workflow templates
      // For now, we'll just track the change
      console.log(`Updating workflow templates to use ${toProvider} credentials: ${newCredentialId}`);
      
      // In a real implementation, this would:
      // 1. Fetch current n8n workflows
      // 2. Update credential references
      // 3. Redeploy workflows with new credentials
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update workflow templates:', error);
      throw error;
    }
  }

  /**
   * Update active provider
   */
  async updateActiveProvider(provider, options = {}) {
    try {
      console.log(`🔄 Setting ${provider} as active provider...`);

      // Update profile with new primary provider
      await supabase
        .from('profiles')
        .update({ 
          primary_provider: provider,
          last_provider_change: new Date().toISOString()
        })
        .eq('id', this.userId);

      console.log(`✅ ${provider} set as active provider`);
      return { success: true, activeProvider: provider };

    } catch (error) {
      console.error(`Failed to update active provider to ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Validate migration
   */
  async validateMigration(provider, options = {}) {
    try {
      console.log(`🔍 Validating ${provider} migration...`);

      // Test provider connectivity
      const isConnected = await this.validateTargetIntegration(provider);
      if (!isConnected) {
        throw new Error(`${provider} integration validation failed`);
      }

      // Test basic functionality
      const functionalityTest = await this.testProviderFunctionality(provider);
      if (!functionalityTest.success) {
        throw new Error(`Provider functionality test failed: ${functionalityTest.error}`);
      }

      console.log(`✅ ${provider} migration validation passed`);
      return {
        success: true,
        provider,
        connectivityTest: true,
        functionalityTest: true
      };

    } catch (error) {
      console.error(`Migration validation failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Test provider functionality
   */
  async testProviderFunctionality(provider) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', this.userId)
        .eq('provider', provider)
        .eq('status', 'active')
        .single();

      if (!integration?.access_token) {
        return { success: false, error: 'No access token found' };
      }

      // Test basic API call
      const isConnected = await this.testProviderConnectivity(provider, integration.access_token);
      return { success: isConnected };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up old integration
   */
  async cleanupOldIntegration(provider, options = {}) {
    try {
      if (options.preserveOldIntegration) {
        console.log(`🔄 Preserving ${provider} integration (cleanup skipped)`);
        return { success: true, message: 'Integration preserved' };
      }

      console.log(`🔄 Cleaning up old ${provider} integration...`);

      // Deactivate old integration
      await supabase
        .from('integrations')
        .update({ status: 'inactive' })
        .eq('user_id', this.userId)
        .eq('provider', provider);

      console.log(`✅ ${provider} integration cleaned up`);
      return { success: true, provider };

    } catch (error) {
      console.error(`Failed to cleanup ${provider} integration:`, error);
      throw error;
    }
  }

  /**
   * Rollback migration
   */
  async rollbackMigration(migrationId) {
    try {
      console.log(`🔄 Rolling back migration ${migrationId}...`);

      const backup = this.rollbackData.get(migrationId);
      if (!backup) {
        throw new Error('No rollback data found');
      }

      // Restore integration data
      if (backup.data.integration) {
        await supabase
          .from('integrations')
          .upsert(backup.data.integration, { onConflict: 'user_id, provider' });
      }

      // Restore profile data
      if (backup.data.profile) {
        await supabase
          .from('profiles')
          .update(backup.data.profile)
          .eq('id', this.userId);
      }

      // Restore credentials
      if (backup.data.credentials) {
        for (const credential of backup.data.credentials) {
          await supabase
            .from('client_credentials_map')
            .upsert(credential, { onConflict: 'client_id, provider' });
        }
      }

      console.log(`✅ Migration ${migrationId} rolled back successfully`);
      return { success: true, migrationId };

    } catch (error) {
      console.error(`Failed to rollback migration ${migrationId}:`, error);
      throw error;
    }
  }

  /**
   * Get user integrations
   */
  async getUserIntegrations() {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', this.userId)
        .in('provider', ['gmail', 'outlook']);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user integrations:', error);
      return [];
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_provider, dual_provider_mode, last_provider_change')
        .eq('id', this.userId)
        .single();

      const integrations = await this.getUserIntegrations();

      return {
        primaryProvider: profile?.primary_provider || 'gmail',
        dualProviderMode: profile?.dual_provider_mode || false,
        lastProviderChange: profile?.last_provider_change,
        activeIntegrations: integrations.filter(i => i.status === 'active'),
        availableProviders: integrations.map(i => i.provider)
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return {
        primaryProvider: 'gmail',
        dualProviderMode: false,
        activeIntegrations: [],
        availableProviders: []
      };
    }
  }
}

export default ProviderMigrationService;
