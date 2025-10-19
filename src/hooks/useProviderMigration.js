import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ProviderMigrationService } from '@/lib/providerMigrationService';

/**
 * Custom hook for Provider Migration functionality
 */
export const useProviderMigration = () => {
  const { user } = useAuth();
  const [migrationService, setMigrationService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);

  // Initialize migration service when user changes
  useEffect(() => {
    if (user?.id) {
      const service = new ProviderMigrationService(user.id);
      setMigrationService(service);
    } else {
      setMigrationService(null);
    }
  }, [user?.id]);

  // Load migration status
  useEffect(() => {
    if (migrationService) {
      loadMigrationStatus();
    }
  }, [migrationService]);

  const loadMigrationStatus = async () => {
    if (!migrationService) return;
    
    try {
      const status = await migrationService.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    }
  };

  /**
   * Migrate from Gmail to Outlook
   */
  const migrateGmailToOutlook = useCallback(async (options = {}) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await migrationService.migrateGmailToOutlook(options);
      await loadMigrationStatus(); // Refresh status
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [migrationService]);

  /**
   * Migrate from Outlook to Gmail
   */
  const migrateOutlookToGmail = useCallback(async (options = {}) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await migrationService.migrateOutlookToGmail(options);
      await loadMigrationStatus(); // Refresh status
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [migrationService]);

  /**
   * Enable dual provider support
   */
  const enableDualProviderSupport = useCallback(async (options = {}) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await migrationService.enableDualProviderSupport(options);
      await loadMigrationStatus(); // Refresh status
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [migrationService]);

  /**
   * Disable dual provider support
   */
  const disableDualProviderSupport = useCallback(async (options = {}) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await migrationService.disableDualProviderSupport(options);
      await loadMigrationStatus(); // Refresh status
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [migrationService]);

  /**
   * Validate source integration
   */
  const validateSourceIntegration = useCallback(async (provider) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    try {
      return await migrationService.validateSourceIntegration(provider);
    } catch (err) {
      console.error(`Failed to validate ${provider} integration:`, err);
      throw err;
    }
  }, [migrationService]);

  /**
   * Validate target integration
   */
  const validateTargetIntegration = useCallback(async (provider) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    try {
      return await migrationService.validateTargetIntegration(provider);
    } catch (err) {
      console.error(`Failed to validate ${provider} integration:`, err);
      throw err;
    }
  }, [migrationService]);

  /**
   * Test provider connectivity
   */
  const testProviderConnectivity = useCallback(async (provider) => {
    if (!migrationService) {
      throw new Error('Migration service not initialized');
    }

    try {
      const integration = await migrationService.validateTargetIntegration(provider);
      return !!integration;
    } catch (err) {
      console.error(`Failed to test ${provider} connectivity:`, err);
      return false;
    }
  }, [migrationService]);

  /**
   * Get available providers for migration
   */
  const getAvailableProviders = useCallback(() => {
    if (!migrationStatus) return { source: [], target: [] };

    const activeProviders = migrationStatus.activeIntegrations.map(i => i.provider);
    const allProviders = ['gmail', 'outlook'];

    return {
      source: activeProviders,
      target: allProviders.filter(p => !activeProviders.includes(p)),
      active: activeProviders,
      all: allProviders
    };
  }, [migrationStatus]);

  /**
   * Check if migration is possible
   */
  const canMigrate = useCallback((fromProvider, toProvider) => {
    if (!migrationStatus) return false;

    const activeProviders = migrationStatus.activeIntegrations.map(i => i.provider);
    const hasSource = activeProviders.includes(fromProvider);
    const hasTarget = migrationStatus.availableProviders.includes(toProvider);

    return hasSource && hasTarget && fromProvider !== toProvider;
  }, [migrationStatus]);

  /**
   * Check if dual provider mode is available
   */
  const canEnableDualProvider = useCallback(() => {
    if (!migrationStatus) return false;

    const activeProviders = migrationStatus.activeIntegrations.map(i => i.provider);
    return activeProviders.length >= 1 && !migrationStatus.dualProviderMode;
  }, [migrationStatus]);

  /**
   * Check if dual provider mode can be disabled
   */
  const canDisableDualProvider = useCallback(() => {
    if (!migrationStatus) return false;

    return migrationStatus.dualProviderMode;
  }, [migrationStatus]);

  return {
    // State
    loading,
    error,
    migrationStatus,
    isInitialized: !!migrationService,
    
    // Migration operations
    migrateGmailToOutlook,
    migrateOutlookToGmail,
    enableDualProviderSupport,
    disableDualProviderSupport,
    
    // Validation operations
    validateSourceIntegration,
    validateTargetIntegration,
    testProviderConnectivity,
    
    // Utility functions
    getAvailableProviders,
    canMigrate,
    canEnableDualProvider,
    canDisableDualProvider,
    
    // Status refresh
    refreshStatus: loadMigrationStatus
  };
};

export default useProviderMigration;
