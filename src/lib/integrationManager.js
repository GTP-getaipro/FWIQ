/**
 * Integration Manager
 * 
 * Handles integration lifecycle management, configuration,
 * and administration for third-party integrations.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class IntegrationManager {
  constructor() {
    this.integrations = new Map();
    this.configurations = new Map();
    this.credentials = new Map();
    this.permissions = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize management system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Integration Manager', { userId });

      // Load integrations and configurations
      await this.loadIntegrations(userId);
      await this.loadConfigurations(userId);
      await this.loadCredentials(userId);
      await this.loadPermissions(userId);

      this.isInitialized = true;
      logger.info('Integration Manager initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Integration Manager', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create new integration
   */
  async createIntegration(userId, integrationData) {
    try {
      logger.info('Creating integration', { userId, integrationType: integrationData.type });

      // Validate integration data
      const validationResult = await this.validateIntegrationData(integrationData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create integration record
      const integration = {
        user_id: userId,
        name: integrationData.name,
        type: integrationData.type,
        provider: integrationData.provider,
        status: 'inactive',
        configuration: integrationData.configuration || {},
        metadata: integrationData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdIntegration, error } = await supabase
        .from('integrations')
        .insert(integration)
        .select()
        .single();

      if (error) throw error;

      // Create configuration
      if (integrationData.configuration) {
        await this.createConfiguration(userId, createdIntegration.id, integrationData.configuration);
      }

      // Create credentials if provided
      if (integrationData.credentials) {
        await this.createCredentials(userId, createdIntegration.id, integrationData.credentials);
      }

      // Set permissions
      if (integrationData.permissions) {
        await this.setPermissions(userId, createdIntegration.id, integrationData.permissions);
      }

      this.integrations.set(createdIntegration.id, createdIntegration);

      logger.info('Integration created successfully', { 
        userId, 
        integrationId: createdIntegration.id, 
        integrationType: integrationData.type 
      });

      return {
        success: true,
        integration: createdIntegration
      };
    } catch (error) {
      logger.error('Failed to create integration', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update existing integration
   */
  async updateIntegration(userId, integrationData) {
    try {
      logger.info('Updating integration', { userId, integrationId: integrationData.id });

      const existingIntegration = this.integrations.get(integrationData.id);
      if (!existingIntegration) {
        return { success: false, error: 'Integration not found' };
      }

      // Validate update data
      const validationResult = await this.validateIntegrationData(integrationData, true);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Update integration
      const updatedIntegration = {
        ...existingIntegration,
        name: integrationData.name || existingIntegration.name,
        configuration: { ...existingIntegration.configuration, ...integrationData.configuration },
        metadata: { ...existingIntegration.metadata, ...integrationData.metadata },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integrations')
        .update(updatedIntegration)
        .eq('id', integrationData.id);

      if (error) throw error;

      // Update configuration if provided
      if (integrationData.configuration) {
        await this.updateConfiguration(userId, integrationData.id, integrationData.configuration);
      }

      // Update credentials if provided
      if (integrationData.credentials) {
        await this.updateCredentials(userId, integrationData.id, integrationData.credentials);
      }

      this.integrations.set(integrationData.id, updatedIntegration);

      logger.info('Integration updated successfully', { userId, integrationId: integrationData.id });

      return {
        success: true,
        integration: updatedIntegration
      };
    } catch (error) {
      logger.error('Failed to update integration', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(userId, integrationData) {
    try {
      logger.info('Deleting integration', { userId, integrationId: integrationData.id });

      const integration = this.integrations.get(integrationData.id);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      // Check if integration is in use
      const isInUse = await this.checkIntegrationUsage(integrationData.id);
      if (isInUse) {
        return { success: false, error: 'Integration is currently in use and cannot be deleted' };
      }

      // Delete integration and related data
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationData.id);

      if (error) throw error;

      // Clean up related data
      await this.cleanupIntegrationData(integrationData.id);

      this.integrations.delete(integrationData.id);
      this.configurations.delete(integrationData.id);
      this.credentials.delete(integrationData.id);
      this.permissions.delete(integrationData.id);

      logger.info('Integration deleted successfully', { userId, integrationId: integrationData.id });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete integration', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Activate integration
   */
  async activateIntegration(userId, integrationData) {
    try {
      logger.info('Activating integration', { userId, integrationId: integrationData.id });

      const integration = this.integrations.get(integrationData.id);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      // Validate integration before activation
      const validationResult = await this.validateIntegrationForActivation(integration);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Update integration status
      const { error } = await supabase
        .from('integrations')
        .update({ 
          status: 'active', 
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationData.id);

      if (error) throw error;

      // Update in-memory integration
      integration.status = 'active';
      integration.activated_at = new Date().toISOString();
      integration.updated_at = new Date().toISOString();
      this.integrations.set(integrationData.id, integration);

      logger.info('Integration activated successfully', { userId, integrationId: integrationData.id });

      return { success: true };
    } catch (error) {
      logger.error('Failed to activate integration', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Deactivate integration
   */
  async deactivateIntegration(userId, integrationData) {
    try {
      logger.info('Deactivating integration', { userId, integrationId: integrationData.id });

      const integration = this.integrations.get(integrationData.id);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      // Update integration status
      const { error } = await supabase
        .from('integrations')
        .update({ 
          status: 'inactive', 
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationData.id);

      if (error) throw error;

      // Update in-memory integration
      integration.status = 'inactive';
      integration.deactivated_at = new Date().toISOString();
      integration.updated_at = new Date().toISOString();
      this.integrations.set(integrationData.id, integration);

      logger.info('Integration deactivated successfully', { userId, integrationId: integrationData.id });

      return { success: true };
    } catch (error) {
      logger.error('Failed to deactivate integration', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get integration details
   */
  async getIntegrationDetails(userId, integrationId) {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      const configuration = this.configurations.get(integrationId) || {};
      const credentials = this.credentials.get(integrationId) || {};
      const permissions = this.permissions.get(integrationId) || {};

      const details = {
        ...integration,
        configuration,
        credentials: this.sanitizeCredentials(credentials),
        permissions
      };

      return {
        success: true,
        integration: details
      };
    } catch (error) {
      logger.error('Failed to get integration details', { error: error.message, userId, integrationId });
      return { success: false, error: error.message };
    }
  }

  /**
   * List integrations
   */
  async listIntegrations(userId, filters = {}) {
    try {
      const integrations = Array.from(this.integrations.values()).filter(integration => 
        integration.user_id === userId
      );

      let filteredIntegrations = integrations;

      // Apply filters
      if (filters.status) {
        filteredIntegrations = filteredIntegrations.filter(integration => 
          integration.status === filters.status
        );
      }

      if (filters.type) {
        filteredIntegrations = filteredIntegrations.filter(integration => 
          integration.type === filters.type
        );
      }

      if (filters.provider) {
        filteredIntegrations = filteredIntegrations.filter(integration => 
          integration.provider === filters.provider
        );
      }

      return {
        success: true,
        integrations: filteredIntegrations,
        total: filteredIntegrations.length
      };
    } catch (error) {
      logger.error('Failed to list integrations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate integration data
   */
  async validateIntegrationData(integrationData, isUpdate = false) {
    try {
      const requiredFields = ['name', 'type', 'provider'];
      const missingFields = requiredFields.filter(field => !integrationData[field]);

      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      // Validate integration type
      const validTypes = ['api', 'webhook', 'database', 'file', 'message_queue'];
      if (!validTypes.includes(integrationData.type)) {
        return {
          valid: false,
          error: `Invalid integration type. Must be one of: ${validTypes.join(', ')}`
        };
      }

      // Validate configuration if provided
      if (integrationData.configuration) {
        const configValidation = await this.validateConfiguration(integrationData.configuration);
        if (!configValidation.valid) {
          return configValidation;
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate configuration
   */
  async validateConfiguration(configuration) {
    try {
      // Basic configuration validation
      if (typeof configuration !== 'object') {
        return {
          valid: false,
          error: 'Configuration must be an object'
        };
      }

      // Validate required configuration fields based on type
      // This would be expanded based on specific integration requirements

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Configuration validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate integration for activation
   */
  async validateIntegrationForActivation(integration) {
    try {
      // Check if configuration is complete
      const configuration = this.configurations.get(integration.id);
      if (!configuration || Object.keys(configuration).length === 0) {
        return {
          valid: false,
          error: 'Integration configuration is incomplete'
        };
      }

      // Check if credentials are provided
      const credentials = this.credentials.get(integration.id);
      if (!credentials || Object.keys(credentials).length === 0) {
        return {
          valid: false,
          error: 'Integration credentials are missing'
        };
      }

      // Check if permissions are set
      const permissions = this.permissions.get(integration.id);
      if (!permissions || Object.keys(permissions).length === 0) {
        return {
          valid: false,
          error: 'Integration permissions are not configured'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Activation validation failed: ${error.message}`
      };
    }
  }

  /**
   * Create configuration
   */
  async createConfiguration(userId, integrationId, configuration) {
    try {
      const configData = {
        user_id: userId,
        integration_id: integrationId,
        configuration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_configurations')
        .insert(configData);

      if (error) throw error;

      this.configurations.set(integrationId, configuration);
    } catch (error) {
      logger.error('Failed to create configuration', { error: error.message, userId, integrationId });
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration(userId, integrationId, configuration) {
    try {
      const { error } = await supabase
        .from('integration_configurations')
        .update({
          configuration,
          updated_at: new Date().toISOString()
        })
        .eq('integration_id', integrationId);

      if (error) throw error;

      this.configurations.set(integrationId, configuration);
    } catch (error) {
      logger.error('Failed to update configuration', { error: error.message, userId, integrationId });
    }
  }

  /**
   * Create credentials
   */
  async createCredentials(userId, integrationId, credentials) {
    try {
      const encryptedCredentials = await this.encryptCredentials(credentials);
      
      const credentialData = {
        user_id: userId,
        integration_id: integrationId,
        credentials: encryptedCredentials,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_credentials')
        .insert(credentialData);

      if (error) throw error;

      this.credentials.set(integrationId, credentials);
    } catch (error) {
      logger.error('Failed to create credentials', { error: error.message, userId, integrationId });
    }
  }

  /**
   * Update credentials
   */
  async updateCredentials(userId, integrationId, credentials) {
    try {
      const encryptedCredentials = await this.encryptCredentials(credentials);
      
      const { error } = await supabase
        .from('integration_credentials')
        .update({
          credentials: encryptedCredentials,
          updated_at: new Date().toISOString()
        })
        .eq('integration_id', integrationId);

      if (error) throw error;

      this.credentials.set(integrationId, credentials);
    } catch (error) {
      logger.error('Failed to update credentials', { error: error.message, userId, integrationId });
    }
  }

  /**
   * Set permissions
   */
  async setPermissions(userId, integrationId, permissions) {
    try {
      const permissionData = {
        user_id: userId,
        integration_id: integrationId,
        permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_permissions')
        .upsert(permissionData);

      if (error) throw error;

      this.permissions.set(integrationId, permissions);
    } catch (error) {
      logger.error('Failed to set permissions', { error: error.message, userId, integrationId });
    }
  }

  /**
   * Check integration usage
   */
  async checkIntegrationUsage(integrationId) {
    try {
      const { data: usage, error } = await supabase
        .from('integration_usage')
        .select('id')
        .eq('integration_id', integrationId)
        .limit(1);

      if (error) throw error;

      return usage.length > 0;
    } catch (error) {
      logger.error('Failed to check integration usage', { error: error.message, integrationId });
      return false;
    }
  }

  /**
   * Cleanup integration data
   */
  async cleanupIntegrationData(integrationId) {
    try {
      // Delete configuration
      await supabase
        .from('integration_configurations')
        .delete()
        .eq('integration_id', integrationId);

      // Delete credentials
      await supabase
        .from('integration_credentials')
        .delete()
        .eq('integration_id', integrationId);

      // Delete permissions
      await supabase
        .from('integration_permissions')
        .delete()
        .eq('integration_id', integrationId);

      logger.info('Integration data cleaned up', { integrationId });
    } catch (error) {
      logger.error('Failed to cleanup integration data', { error: error.message, integrationId });
    }
  }

  /**
   * Encrypt credentials
   */
  async encryptCredentials(credentials) {
    try {
      // In a real implementation, this would use proper encryption
      // For now, we'll just return the credentials as-is
      return credentials;
    } catch (error) {
      logger.error('Failed to encrypt credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Sanitize credentials for display
   */
  sanitizeCredentials(credentials) {
    const sanitized = {};
    Object.keys(credentials).forEach(key => {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = credentials[key];
      }
    });
    return sanitized;
  }

  /**
   * Load integrations
   */
  async loadIntegrations(userId) {
    try {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      integrations.forEach(integration => {
        this.integrations.set(integration.id, integration);
      });

      logger.info('Integrations loaded', { userId, integrationCount: integrations.length });
    } catch (error) {
      logger.error('Failed to load integrations', { error: error.message, userId });
    }
  }

  /**
   * Load configurations
   */
  async loadConfigurations(userId) {
    try {
      const { data: configurations, error } = await supabase
        .from('integration_configurations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      configurations.forEach(config => {
        this.configurations.set(config.integration_id, config.configuration);
      });

      logger.info('Configurations loaded', { userId, configCount: configurations.length });
    } catch (error) {
      logger.error('Failed to load configurations', { error: error.message, userId });
    }
  }

  /**
   * Load credentials
   */
  async loadCredentials(userId) {
    try {
      const { data: credentials, error } = await supabase
        .from('integration_credentials')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      credentials.forEach(cred => {
        this.credentials.set(cred.integration_id, cred.credentials);
      });

      logger.info('Credentials loaded', { userId, credentialCount: credentials.length });
    } catch (error) {
      logger.error('Failed to load credentials', { error: error.message, userId });
    }
  }

  /**
   * Load permissions
   */
  async loadPermissions(userId) {
    try {
      const { data: permissions, error } = await supabase
        .from('integration_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      permissions.forEach(perm => {
        this.permissions.set(perm.integration_id, perm.permissions);
      });

      logger.info('Permissions loaded', { userId, permissionCount: permissions.length });
    } catch (error) {
      logger.error('Failed to load permissions', { error: error.message, userId });
    }
  }

  /**
   * Reset manager for user
   */
  async reset(userId) {
    try {
      // Clear in-memory data
      const userIntegrations = Array.from(this.integrations.values()).filter(integration => 
        integration.user_id === userId
      );
      
      userIntegrations.forEach(integration => {
        this.integrations.delete(integration.id);
        this.configurations.delete(integration.id);
        this.credentials.delete(integration.id);
        this.permissions.delete(integration.id);
      });

      logger.info('Integration manager reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset integration manager', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}