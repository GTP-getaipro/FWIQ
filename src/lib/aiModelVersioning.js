/**
 * AI Model Versioning
 * Comprehensive versioning and lifecycle management for AI models
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class AIModelVersioning {
  constructor() {
    this.versionCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.versioningRules = this.initializeVersioningRules();
    this.deploymentStrategies = this.initializeDeploymentStrategies();
  }

  /**
   * Create new model version
   * @param {string} modelId - Base model identifier
   * @param {string} userId - User identifier
   * @param {Object} versionData - Version data
   * @returns {Promise<Object>} Version creation result
   */
  async createModelVersion(modelId, userId, versionData) {
    try {
      logger.info('Creating new model version', { modelId, userId, versionName: versionData.name });

      // Get current version number
      const { data: latestVersion, error: versionError } = await supabase
        .from('ai_model_versions')
        .select('version_number')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (versionError) throw versionError;

      const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

      const versionRecord = {
        model_id: modelId,
        user_id: userId,
        version_number: nextVersionNumber,
        version_name: versionData.name || `v${nextVersionNumber}`,
        description: versionData.description || '',
        model_config: JSON.stringify(versionData.modelConfig || {}),
        training_data_hash: versionData.trainingDataHash || null,
        performance_metrics: JSON.stringify(versionData.performanceMetrics || {}),
        deployment_status: 'draft',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: JSON.stringify(versionData.metadata || {})
      };

      const { data, error } = await supabase
        .from('ai_model_versions')
        .insert(versionRecord)
        .select()
        .single();

      if (error) throw error;

      // Log version creation
      await this.logVersionActivity({
        modelId,
        userId,
        action: 'version_created',
        details: {
          versionId: data.id,
          versionNumber: nextVersionNumber,
          versionName: versionData.name
        }
      });

      logger.info('Model version created successfully', { 
        modelId, 
        versionId: data.id, 
        versionNumber: nextVersionNumber 
      });

      return {
        success: true,
        version: data
      };
    } catch (error) {
      logger.error('Error creating model version', { 
        error: error.message, 
        modelId, 
        userId 
      });
      throw new Error(`Failed to create model version: ${error.message}`);
    }
  }

  /**
   * Deploy model version
   * @param {string} versionId - Version identifier
   * @param {string} userId - User identifier
   * @param {Object} deploymentOptions - Deployment options
   * @returns {Promise<Object>} Deployment result
   */
  async deployModelVersion(versionId, userId, deploymentOptions = {}) {
    try {
      logger.info('Deploying model version', { versionId, userId });

      // Get version data
      const { data: version, error: versionError } = await supabase
        .from('ai_model_versions')
        .select('*')
        .eq('id', versionId)
        .eq('user_id', userId)
        .single();

      if (versionError) throw versionError;

      // Validate deployment
      const validationResult = await this.validateDeployment(version, deploymentOptions);
      if (!validationResult.valid) {
        throw new Error(`Deployment validation failed: ${validationResult.reason}`);
      }

      // Deploy based on strategy
      const deploymentStrategy = deploymentOptions.strategy || 'blue_green';
      const deploymentResult = await this.executeDeployment(version, deploymentStrategy, deploymentOptions);

      // Update version status
      const { error: updateError } = await supabase
        .from('ai_model_versions')
        .update({
          deployment_status: 'deployed',
          deployed_at: new Date().toISOString(),
          deployment_config: JSON.stringify(deploymentOptions),
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId);

      if (updateError) throw updateError;

      // Log deployment
      await this.logVersionActivity({
        modelId: version.model_id,
        userId,
        action: 'version_deployed',
        details: {
          versionId,
          deploymentStrategy,
          deploymentResult
        }
      });

      logger.info('Model version deployed successfully', { 
        versionId, 
        deploymentStrategy 
      });

      return {
        success: true,
        deploymentResult,
        version: { ...version, deployment_status: 'deployed' }
      };
    } catch (error) {
      logger.error('Error deploying model version', { 
        error: error.message, 
        versionId, 
        userId 
      });
      throw new Error(`Failed to deploy model version: ${error.message}`);
    }
  }

  /**
   * Rollback model version
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {string} targetVersionId - Target version identifier
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackModelVersion(modelId, userId, targetVersionId) {
    try {
      logger.info('Rolling back model version', { modelId, userId, targetVersionId });

      // Get current deployed version
      const { data: currentVersion, error: currentError } = await supabase
        .from('ai_model_versions')
        .select('*')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .eq('deployment_status', 'deployed')
        .single();

      if (currentError && currentError.code !== 'PGRST116') {
        throw currentError;
      }

      // Get target version
      const { data: targetVersion, error: targetError } = await supabase
        .from('ai_model_versions')
        .select('*')
        .eq('id', targetVersionId)
        .eq('user_id', userId)
        .single();

      if (targetError) throw targetError;

      // Execute rollback
      const rollbackResult = await this.executeRollback(currentVersion, targetVersion);

      // Update version statuses
      if (currentVersion) {
        await supabase
          .from('ai_model_versions')
          .update({
            deployment_status: 'rolled_back',
            rolled_back_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentVersion.id);
      }

      await supabase
        .from('ai_model_versions')
        .update({
          deployment_status: 'deployed',
          deployed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', targetVersionId);

      // Log rollback
      await this.logVersionActivity({
        modelId,
        userId,
        action: 'version_rolled_back',
        details: {
          fromVersionId: currentVersion?.id,
          toVersionId: targetVersionId,
          rollbackResult
        }
      });

      logger.info('Model version rolled back successfully', { 
        modelId, 
        fromVersion: currentVersion?.version_number,
        toVersion: targetVersion.version_number
      });

      return {
        success: true,
        rollbackResult,
        fromVersion: currentVersion,
        toVersion: targetVersion
      };
    } catch (error) {
      logger.error('Error rolling back model version', { 
        error: error.message, 
        modelId, 
        userId 
      });
      throw new Error(`Failed to rollback model version: ${error.message}`);
    }
  }

  /**
   * Get model version history
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Version history
   */
  async getModelVersionHistory(modelId, userId, options = {}) {
    try {
      let query = supabase
        .from('ai_model_versions')
        .select('*')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .order('version_number', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.status) {
        query = query.eq('deployment_status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(version => ({
        ...version,
        model_config: JSON.parse(version.model_config || '{}'),
        performance_metrics: JSON.parse(version.performance_metrics || '{}'),
        metadata: JSON.parse(version.metadata || '{}')
      }));
    } catch (error) {
      logger.error('Error getting model version history', { 
        error: error.message, 
        modelId, 
        userId 
      });
      return [];
    }
  }

  /**
   * Compare model versions
   * @param {string} versionId1 - First version identifier
   * @param {string} versionId2 - Second version identifier
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Version comparison
   */
  async compareModelVersions(versionId1, versionId2, userId) {
    try {
      const { data: versions, error } = await supabase
        .from('ai_model_versions')
        .select('*')
        .in('id', [versionId1, versionId2])
        .eq('user_id', userId);

      if (error) throw error;

      if (versions.length !== 2) {
        throw new Error('Both versions not found');
      }

      const [version1, version2] = versions;

      return {
        version1: {
          ...version1,
          model_config: JSON.parse(version1.model_config || '{}'),
          performance_metrics: JSON.parse(version1.performance_metrics || '{}')
        },
        version2: {
          ...version2,
          model_config: JSON.parse(version2.model_config || '{}'),
          performance_metrics: JSON.parse(version2.performance_metrics || '{}')
        },
        differences: this.calculateVersionDifferences(version1, version2),
        recommendation: this.generateVersionRecommendation(version1, version2)
      };
    } catch (error) {
      logger.error('Error comparing model versions', { 
        error: error.message, 
        versionId1, 
        versionId2 
      });
      throw new Error(`Failed to compare model versions: ${error.message}`);
    }
  }

  /**
   * Get current deployed version
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Current deployed version
   */
  async getCurrentDeployedVersion(modelId, userId) {
    try {
      const { data, error } = await supabase
        .from('ai_model_versions')
        .select('*')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .eq('deployment_status', 'deployed')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        ...data,
        model_config: JSON.parse(data.model_config || '{}'),
        performance_metrics: JSON.parse(data.performance_metrics || '{}'),
        metadata: JSON.parse(data.metadata || '{}')
      };
    } catch (error) {
      logger.error('Error getting current deployed version', { 
        error: error.message, 
        modelId, 
        userId 
      });
      return null;
    }
  }

  /**
   * Archive model version
   * @param {string} versionId - Version identifier
   * @param {string} userId - User identifier
   * @param {string} reason - Archive reason
   * @returns {Promise<Object>} Archive result
   */
  async archiveModelVersion(versionId, userId, reason = '') {
    try {
      logger.info('Archiving model version', { versionId, userId });

      const { data, error } = await supabase
        .from('ai_model_versions')
        .update({
          deployment_status: 'archived',
          archived_at: new Date().toISOString(),
          archive_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', versionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log archiving
      await this.logVersionActivity({
        modelId: data.model_id,
        userId,
        action: 'version_archived',
        details: {
          versionId,
          reason
        }
      });

      logger.info('Model version archived successfully', { versionId });

      return {
        success: true,
        version: data
      };
    } catch (error) {
      logger.error('Error archiving model version', { 
        error: error.message, 
        versionId, 
        userId 
      });
      throw new Error(`Failed to archive model version: ${error.message}`);
    }
  }

  /**
   * Get version activity log
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Activity log
   */
  async getVersionActivityLog(modelId, userId, options = {}) {
    try {
      let query = supabase
        .from('ai_model_version_activity')
        .select('*')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.action) {
        query = query.eq('action', options.action);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting version activity log', { 
        error: error.message, 
        modelId, 
        userId 
      });
      return [];
    }
  }

  /**
   * Validate deployment
   * @param {Object} version - Version data
   * @param {Object} deploymentOptions - Deployment options
   * @returns {Promise<Object>} Validation result
   */
  async validateDeployment(version, deploymentOptions) {
    try {
      const validation = {
        valid: true,
        errors: [],
        warnings: []
      };

      // Check if version is in draft status
      if (version.deployment_status !== 'draft') {
        validation.errors.push('Version must be in draft status to deploy');
        validation.valid = false;
      }

      // Check performance metrics
      const performanceMetrics = JSON.parse(version.performance_metrics || '{}');
      if (!performanceMetrics.accuracy || performanceMetrics.accuracy < 0.8) {
        validation.warnings.push('Model accuracy is below recommended threshold (80%)');
      }

      // Check model configuration
      const modelConfig = JSON.parse(version.model_config || '{}');
      if (!modelConfig.modelName) {
        validation.errors.push('Model configuration is incomplete');
        validation.valid = false;
      }

      // Check deployment strategy
      const strategy = deploymentOptions.strategy || 'blue_green';
      if (!this.deploymentStrategies[strategy]) {
        validation.errors.push(`Invalid deployment strategy: ${strategy}`);
        validation.valid = false;
      }

      return validation;
    } catch (error) {
      logger.error('Error validating deployment', { error: error.message });
      return {
        valid: false,
        errors: ['Deployment validation failed'],
        warnings: []
      };
    }
  }

  /**
   * Execute deployment
   * @param {Object} version - Version data
   * @param {string} strategy - Deployment strategy
   * @param {Object} options - Deployment options
   * @returns {Promise<Object>} Deployment result
   */
  async executeDeployment(version, strategy, options) {
    try {
      const deploymentStrategy = this.deploymentStrategies[strategy];
      if (!deploymentStrategy) {
        throw new Error(`Unknown deployment strategy: ${strategy}`);
      }

      // Execute strategy-specific deployment
      const result = await deploymentStrategy.execute(version, options);

      // Log deployment execution
      await this.logVersionActivity({
        modelId: version.model_id,
        userId: version.user_id,
        action: 'deployment_executed',
        details: {
          versionId: version.id,
          strategy,
          result
        }
      });

      return result;
    } catch (error) {
      logger.error('Error executing deployment', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute rollback
   * @param {Object} currentVersion - Current version
   * @param {Object} targetVersion - Target version
   * @returns {Promise<Object>} Rollback result
   */
  async executeRollback(currentVersion, targetVersion) {
    try {
      // Simulate rollback execution
      const rollbackResult = {
        success: true,
        rollbackTime: new Date().toISOString(),
        fromVersion: currentVersion?.version_number || 'none',
        toVersion: targetVersion.version_number,
        rollbackDuration: Math.random() * 1000 + 500, // Simulate rollback time
        affectedEndpoints: ['/api/ai/predict', '/api/ai/classify'],
        rollbackMetadata: {
          strategy: 'immediate',
          validationPassed: true,
          healthCheckPassed: true
        }
      };

      logger.debug('Rollback executed', { rollbackResult });

      return rollbackResult;
    } catch (error) {
      logger.error('Error executing rollback', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate version differences
   * @param {Object} version1 - First version
   * @param {Object} version2 - Second version
   * @returns {Object} Version differences
   */
  calculateVersionDifferences(version1, version2) {
    const differences = {
      config: {},
      performance: {},
      metadata: {}
    };

    // Compare model configurations
    const config1 = JSON.parse(version1.model_config || '{}');
    const config2 = JSON.parse(version2.model_config || '{}');
    
    Object.keys({ ...config1, ...config2 }).forEach(key => {
      if (config1[key] !== config2[key]) {
        differences.config[key] = {
          from: config1[key],
          to: config2[key]
        };
      }
    });

    // Compare performance metrics
    const perf1 = JSON.parse(version1.performance_metrics || '{}');
    const perf2 = JSON.parse(version2.performance_metrics || '{}');
    
    Object.keys({ ...perf1, ...perf2 }).forEach(key => {
      if (perf1[key] !== perf2[key]) {
        differences.performance[key] = {
          from: perf1[key],
          to: perf2[key]
        };
      }
    });

    return differences;
  }

  /**
   * Generate version recommendation
   * @param {Object} version1 - First version
   * @param {Object} version2 - Second version
   * @returns {string} Recommendation
   */
  generateVersionRecommendation(version1, version2) {
    const perf1 = JSON.parse(version1.performance_metrics || '{}');
    const perf2 = JSON.parse(version2.performance_metrics || '{}');

    if (perf2.accuracy > perf1.accuracy) {
      return `Version ${version2.version_number} shows improved accuracy (${perf2.accuracy} vs ${perf1.accuracy}). Consider upgrading.`;
    } else if (perf1.accuracy > perf2.accuracy) {
      return `Version ${version1.version_number} has better accuracy (${perf1.accuracy} vs ${perf2.accuracy}). Consider staying with current version.`;
    } else {
      return 'Both versions have similar performance. Consider other factors like cost and deployment complexity.';
    }
  }

  /**
   * Log version activity
   * @param {Object} activityData - Activity data
   */
  async logVersionActivity(activityData) {
    try {
      const logEntry = {
        model_id: activityData.modelId,
        user_id: activityData.userId,
        action: activityData.action,
        details: JSON.stringify(activityData.details || {}),
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('ai_model_version_activity')
        .insert(logEntry);

      logger.debug('Version activity logged', { 
        modelId: activityData.modelId, 
        action: activityData.action 
      });
    } catch (error) {
      logger.error('Error logging version activity', { 
        error: error.message, 
        activityData 
      });
    }
  }

  /**
   * Initialize versioning rules
   * @returns {Array} Versioning rules
   */
  initializeVersioningRules() {
    return [
      {
        name: 'semantic_versioning',
        description: 'Follow semantic versioning principles',
        validate: (versionData) => {
          // Basic semantic versioning validation
          return versionData.name && /^v?\d+\.\d+\.\d+/.test(versionData.name);
        }
      },
      {
        name: 'performance_threshold',
        description: 'Ensure minimum performance standards',
        validate: (versionData) => {
          const metrics = versionData.performanceMetrics || {};
          return metrics.accuracy >= 0.8;
        }
      }
    ];
  }

  /**
   * Initialize deployment strategies
   * @returns {Object} Deployment strategies
   */
  initializeDeploymentStrategies() {
    return {
      blue_green: {
        name: 'Blue-Green Deployment',
        description: 'Deploy to green environment, then switch traffic',
        execute: async (version, options) => {
          // Simulate blue-green deployment
          return {
            strategy: 'blue_green',
            greenEnvironment: `green-${version.id}`,
            switchTime: new Date().toISOString(),
            rollbackCapable: true
          };
        }
      },
      canary: {
        name: 'Canary Deployment',
        description: 'Gradually roll out to a subset of users',
        execute: async (version, options) => {
          // Simulate canary deployment
          return {
            strategy: 'canary',
            canaryPercentage: options.canaryPercentage || 10,
            monitoringPeriod: options.monitoringPeriod || 3600,
            rollbackCapable: true
          };
        }
      },
      rolling: {
        name: 'Rolling Deployment',
        description: 'Deploy incrementally across instances',
        execute: async (version, options) => {
          // Simulate rolling deployment
          return {
            strategy: 'rolling',
            batchSize: options.batchSize || 1,
            rollbackCapable: true
          };
        }
      }
    };
  }

  /**
   * Clear version cache
   */
  clearCache() {
    this.versionCache.clear();
    logger.info('AI model versioning cache cleared');
  }
}

// Export singleton instance
export const aiModelVersioning = new AIModelVersioning();
export default AIModelVersioning;
