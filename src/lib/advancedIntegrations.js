/**
 * Advanced Integrations Engine
 * 
 * Core engine for advanced third-party integrations including
 * monitoring, error recovery, and performance optimization.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';
import { IntegrationMonitor } from './integrationMonitor.js';
import { IntegrationRecovery } from './integrationRecovery.js';
import { IntegrationOptimizer } from './integrationOptimizer.js';
import { IntegrationManager } from './integrationManager.js';

/**
 * Advanced Integrations Component
 * Handles individual integration operations
 */
export class AdvancedIntegrations {
  constructor() {
    this.integrations = new Map();
    this.status = 'initialized';
    this.isInitialized = false;
  }

  async initialize(userId) {
    try {
      this.isInitialized = true;
      logger.info('AdvancedIntegrations initialized', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize AdvancedIntegrations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  async addIntegration(integration) {
    try {
      const integrationData = {
        id: integration.id || `integration_${Date.now()}`,
        name: integration.name,
        type: integration.type,
        config: integration.config,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      this.integrations.set(integrationData.id, integrationData);
      
      logger.info('Integration added', { integrationId: integrationData.id });
      return { success: true, id: integrationData.id };
    } catch (error) {
      logger.error('Failed to add integration', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async removeIntegration(id) {
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }
      
      this.integrations.delete(id);
      
      logger.info('Integration removed', { integrationId: id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to remove integration', { error: error.message, integrationId: id });
      return { success: false, error: error.message };
    }
  }

  async getIntegration(id) {
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }
      
      return { success: true, integration };
    } catch (error) {
      logger.error('Failed to get integration', { error: error.message, integrationId: id });
      return { success: false, error: error.message };
    }
  }

  async getAllIntegrations() {
    try {
      const integrations = Array.from(this.integrations.values());
      return { success: true, integrations };
    } catch (error) {
      logger.error('Failed to get all integrations', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async updateIntegration(id, updates) {
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }
      
      const updatedIntegration = { ...integration, ...updates, updatedAt: new Date().toISOString() };
      this.integrations.set(id, updatedIntegration);
      
      logger.info('Integration updated', { integrationId: id });
      return { success: true, integration: updatedIntegration };
    } catch (error) {
      logger.error('Failed to update integration', { error: error.message, integrationId: id });
      return { success: false, error: error.message };
    }
  }
}

export class AdvancedIntegrationEngine {
  constructor() {
    this.activeIntegrations = new Map();
    this.integrationMetrics = new Map();
    this.healthChecks = new Map();
    this.errorRecoveryStrategies = new Map();
    this.performanceOptimizations = new Map();
    this.isInitialized = false;
    
    // Initialize integrated components
    this.integrations = new AdvancedIntegrations();
    this.monitor = new IntegrationMonitor();
    this.recovery = new IntegrationRecovery();
    this.optimizer = new IntegrationOptimizer();
    this.manager = new IntegrationManager();
  }

  /**
   * Initialize the advanced integration engine
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Advanced Integration Engine', { userId });

      // Initialize all components
      await this.integrations.initialize(userId);
      await this.monitor.initialize(userId);
      await this.recovery.initialize(userId);
      await this.optimizer.initialize(userId);
      await this.manager.initialize(userId);

      // Load existing integrations and configurations
      await this.loadIntegrations(userId);
      await this.loadHealthChecks(userId);
      await this.loadErrorRecoveryStrategies(userId);
      await this.loadPerformanceOptimizations(userId);

      this.isInitialized = true;
      logger.info('Advanced Integration Engine initialized successfully', { userId });

      return { success: true, message: 'Advanced Integration Engine initialized' };
    } catch (error) {
      logger.error('Failed to initialize Advanced Integration Engine', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute integration with advanced features
   */
  async executeIntegration(userId, integrationType, operation, data = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize(userId);
      }

      logger.info('Executing integration', { userId, integrationType, operation });

      // Check integration health before execution
      const healthStatus = await this.monitor.checkIntegrationHealth(userId, integrationType);
      if (!healthStatus.isHealthy) {
        logger.warn('Integration health check failed', { integrationType, healthStatus });
        
        // Attempt recovery
        const recoveryResult = await this.recovery.attemptRecovery(userId, integrationType, healthStatus);
        if (!recoveryResult.success) {
          return { success: false, error: 'Integration unhealthy and recovery failed' };
        }
      }

      // Optimize integration parameters
      const optimizedParams = await this.optimizer.optimizeIntegrationParams(userId, integrationType, operation, data);

      // Execute integration
      const result = await this.integrations.executeIntegration({
        type: integrationType,
        operation,
        data: { ...data, ...optimizedParams },
        userId
      });

      // Monitor performance
      await this.monitor.recordIntegrationMetrics(userId, integrationType, operation, result);

      // Update performance optimizations
      await this.optimizer.updatePerformanceData(userId, integrationType, result);

      logger.info('Integration executed successfully', { 
        userId, 
        integrationType, 
        operation,
        success: result.success
      });

      return {
        success: result.success,
        data: result.data,
        metadata: {
          integrationType,
          operation,
          performance: result.performance,
          healthStatus: healthStatus.isHealthy
        }
      };
    } catch (error) {
      logger.error('Failed to execute integration', { error: error.message, userId, integrationType });
      
      // Record error for recovery analysis
      await this.recovery.recordError(userId, integrationType, operation, error);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor integration health
   */
  async monitorHealth(userId, integrationType = null) {
    try {
      const healthResults = await this.monitor.performHealthChecks(userId, integrationType);
      
      return {
        success: true,
        healthResults,
        overallHealth: this.calculateOverallHealth(healthResults)
      };
    } catch (error) {
      logger.error('Failed to monitor health', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Recover from integration errors
   */
  async recoverFromError(userId, integrationType, error) {
    try {
      const recoveryResult = await this.recovery.executeRecoveryStrategy(userId, integrationType, error);
      
      return {
        success: recoveryResult.success,
        recoveryResult,
        strategiesApplied: recoveryResult.strategiesApplied
      };
    } catch (error) {
      logger.error('Failed to recover from error', { error: error.message, userId, integrationType });
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize integration performance
   */
  async optimizePerformance(userId, integrationType = null) {
    try {
      const optimizationResult = await this.optimizer.optimizeIntegrationPerformance(userId, integrationType);
      
      return {
        success: true,
        optimizationResult,
        performanceGain: optimizationResult.performanceGain
      };
    } catch (error) {
      logger.error('Failed to optimize performance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Manage integration configurations
   */
  async manageIntegration(userId, action, integrationData) {
    try {
      let result;
      
      switch (action) {
        case 'create':
          result = await this.manager.createIntegration(userId, integrationData);
          break;
        case 'update':
          result = await this.manager.updateIntegration(userId, integrationData);
          break;
        case 'delete':
          result = await this.manager.deleteIntegration(userId, integrationData);
          break;
        case 'activate':
          result = await this.manager.activateIntegration(userId, integrationData);
          break;
        case 'deactivate':
          result = await this.manager.deactivateIntegration(userId, integrationData);
          break;
        default:
          throw new Error(`Unknown integration action: ${action}`);
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      logger.error('Failed to manage integration', { error: error.message, userId, action });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get integration metrics
   */
  async getIntegrationMetrics(userId) {
    try {
      const metrics = await this.monitor.getIntegrationMetrics(userId);
      const healthMetrics = await this.monitor.getHealthMetrics(userId);
      const performanceMetrics = await this.optimizer.getPerformanceMetrics(userId);
      const recoveryMetrics = await this.recovery.getRecoveryMetrics(userId);

      return {
        success: true,
        metrics: {
          integration: metrics,
          health: healthMetrics,
          performance: performanceMetrics,
          recovery: recoveryMetrics
        }
      };
    } catch (error) {
      logger.error('Failed to get integration metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get integration insights
   */
  async getIntegrationInsights(userId) {
    try {
      const healthInsights = await this.monitor.getHealthInsights(userId);
      const performanceInsights = await this.optimizer.getPerformanceInsights(userId);
      const recoveryInsights = await this.recovery.getRecoveryInsights(userId);

      return {
        success: true,
        insights: {
          health: healthInsights,
          performance: performanceInsights,
          recovery: recoveryInsights
        }
      };
    } catch (error) {
      logger.error('Failed to get integration insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load integrations for user
   */
  async loadIntegrations(userId) {
    try {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      integrations.forEach(integration => {
        this.activeIntegrations.set(integration.id, integration);
      });

      logger.info('Integrations loaded', { userId, integrationCount: integrations.length });
    } catch (error) {
      logger.error('Failed to load integrations', { error: error.message, userId });
    }
  }

  /**
   * Load health checks
   */
  async loadHealthChecks(userId) {
    try {
      const { data: healthChecks, error } = await supabase
        .from('integration_health_checks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      healthChecks.forEach(healthCheck => {
        this.healthChecks.set(healthCheck.integration_id, healthCheck);
      });

      logger.info('Health checks loaded', { userId, healthCheckCount: healthChecks.length });
    } catch (error) {
      logger.error('Failed to load health checks', { error: error.message, userId });
    }
  }

  /**
   * Load error recovery strategies
   */
  async loadErrorRecoveryStrategies(userId) {
    try {
      const { data: strategies, error } = await supabase
        .from('integration_error_recovery_strategies')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      strategies.forEach(strategy => {
        this.errorRecoveryStrategies.set(strategy.integration_id, strategy);
      });

      logger.info('Error recovery strategies loaded', { userId, strategyCount: strategies.length });
    } catch (error) {
      logger.error('Failed to load error recovery strategies', { error: error.message, userId });
    }
  }

  /**
   * Load performance optimizations
   */
  async loadPerformanceOptimizations(userId) {
    try {
      const { data: optimizations, error } = await supabase
        .from('integration_performance_optimizations')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      optimizations.forEach(optimization => {
        this.performanceOptimizations.set(optimization.integration_id, optimization);
      });

      logger.info('Performance optimizations loaded', { userId, optimizationCount: optimizations.length });
    } catch (error) {
      logger.error('Failed to load performance optimizations', { error: error.message, userId });
    }
  }

  /**
   * Calculate overall health
   */
  calculateOverallHealth(healthResults) {
    if (!healthResults || healthResults.length === 0) return 'unknown';

    const healthyCount = healthResults.filter(result => result.isHealthy).length;
    const totalCount = healthResults.length;
    const healthPercentage = (healthyCount / totalCount) * 100;

    if (healthPercentage >= 90) return 'excellent';
    if (healthPercentage >= 75) return 'good';
    if (healthPercentage >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(userId) {
    try {
      const status = {
        initialized: this.isInitialized,
        activeIntegrations: this.activeIntegrations.size,
        healthChecks: this.healthChecks.size,
        errorRecoveryStrategies: this.errorRecoveryStrategies.size,
        performanceOptimizations: this.performanceOptimizations.size,
        components: {
          integrations: this.integrations.isInitialized,
          monitor: this.monitor.isInitialized,
          recovery: this.recovery.isInitialized,
          optimizer: this.optimizer.isInitialized,
          manager: this.manager.isInitialized
        }
      };

      return {
        success: true,
        status
      };
    } catch (error) {
      logger.error('Failed to get integration status', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset integration engine for user
   */
  async resetIntegrationEngine(userId) {
    try {
      // Clear in-memory data
      this.activeIntegrations.clear();
      this.integrationMetrics.clear();
      this.healthChecks.clear();
      this.errorRecoveryStrategies.clear();
      this.performanceOptimizations.clear();

      // Reset components
      await this.monitor.reset(userId);
      await this.recovery.reset(userId);
      await this.optimizer.reset(userId);
      await this.manager.reset(userId);

      this.isInitialized = false;

      logger.info('Integration engine reset', { userId });

      return {
        success: true,
        message: 'Integration engine reset successfully'
      };
    } catch (error) {
      logger.error('Failed to reset integration engine', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}

export const advancedIntegrationEngine = new AdvancedIntegrationEngine();
