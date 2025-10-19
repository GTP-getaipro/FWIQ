/**
 * AI Model Management System
 * 
 * Handles AI model deployment, versioning, monitoring,
 * and lifecycle management.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AIModelManager {
  constructor() {
    this.models = new Map();
    this.modelVersions = new Map();
    this.deployments = new Map();
    this.modelMetrics = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize model management system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing AI Model Manager', { userId });

      // Load models and versions
      await this.loadModels(userId);
      await this.loadModelVersions(userId);
      await this.loadDeployments(userId);
      await this.loadModelMetrics(userId);

      this.isInitialized = true;
      logger.info('AI Model Manager initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize AI Model Manager', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy a new AI model
   */
  async deployModel(userId, modelData) {
    try {
      logger.info('Deploying AI model', { userId, modelName: modelData.name });

      // Validate model data
      const validationResult = await this.validateModelData(modelData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create model record
      const model = {
        user_id: userId,
        name: modelData.name,
        type: modelData.type,
        version: modelData.version || '1.0.0',
        status: 'deploying',
        configuration: modelData.configuration || {},
        metadata: modelData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: deployedModel, error } = await supabase
        .from('ai_models')
        .insert(model)
        .select()
        .single();

      if (error) throw error;

      // Create model version
      await this.createModelVersion(userId, deployedModel.id, modelData);

      // Initialize deployment
      const deployment = await this.initializeDeployment(userId, deployedModel.id);

      // Update model status
      await this.updateModelStatus(deployedModel.id, 'active');

      this.models.set(deployedModel.id, deployedModel);

      logger.info('AI model deployed successfully', { 
        userId, 
        modelId: deployedModel.id, 
        modelName: modelData.name 
      });

      return {
        success: true,
        model: deployedModel,
        deployment
      };
    } catch (error) {
      logger.error('Failed to deploy model', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing AI model
   */
  async updateModel(userId, modelData) {
    try {
      logger.info('Updating AI model', { userId, modelId: modelData.id });

      const existingModel = this.models.get(modelData.id);
      if (!existingModel) {
        return { success: false, error: 'Model not found' };
      }

      // Create new version
      const newVersion = await this.createModelVersion(userId, modelData.id, modelData);

      // Update model configuration
      const updatedModel = {
        ...existingModel,
        configuration: { ...existingModel.configuration, ...modelData.configuration },
        metadata: { ...existingModel.metadata, ...modelData.metadata },
        version: newVersion.version,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ai_models')
        .update(updatedModel)
        .eq('id', modelData.id);

      if (error) throw error;

      this.models.set(modelData.id, updatedModel);

      logger.info('AI model updated successfully', { userId, modelId: modelData.id });

      return {
        success: true,
        model: updatedModel,
        newVersion
      };
    } catch (error) {
      logger.error('Failed to update model', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback model to previous version
   */
  async rollbackModel(userId, modelData) {
    try {
      logger.info('Rolling back AI model', { userId, modelId: modelData.id });

      const model = this.models.get(modelData.id);
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      // Get previous version
      const previousVersion = await this.getPreviousVersion(userId, modelData.id);
      if (!previousVersion) {
        return { success: false, error: 'No previous version found' };
      }

      // Update model to previous version
      const rolledBackModel = {
        ...model,
        version: previousVersion.version,
        configuration: previousVersion.configuration,
        metadata: previousVersion.metadata,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ai_models')
        .update(rolledBackModel)
        .eq('id', modelData.id);

      if (error) throw error;

      this.models.set(modelData.id, rolledBackModel);

      logger.info('AI model rolled back successfully', { 
        userId, 
        modelId: modelData.id, 
        version: previousVersion.version 
      });

      return {
        success: true,
        model: rolledBackModel,
        previousVersion
      };
    } catch (error) {
      logger.error('Failed to rollback model', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete an AI model
   */
  async deleteModel(userId, modelData) {
    try {
      logger.info('Deleting AI model', { userId, modelId: modelData.id });

      const model = this.models.get(modelData.id);
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      // Check if model is in use
      const isInUse = await this.checkModelUsage(modelData.id);
      if (isInUse) {
        return { success: false, error: 'Model is currently in use and cannot be deleted' };
      }

      // Delete model and related data
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', modelData.id);

      if (error) throw error;

      // Clean up related data
      await this.cleanupModelData(modelData.id);

      this.models.delete(modelData.id);
      this.modelVersions.delete(modelData.id);
      this.deployments.delete(modelData.id);
      this.modelMetrics.delete(modelData.id);

      logger.info('AI model deleted successfully', { userId, modelId: modelData.id });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete model', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get model metrics
   */
  async getModelMetrics(userId) {
    try {
      const models = Array.from(this.models.values()).filter(m => m.user_id === userId);
      const metrics = [];

      for (const model of models) {
        const modelMetrics = this.modelMetrics.get(model.id) || {};
        const deployment = this.deployments.get(model.id) || {};

        metrics.push({
          modelId: model.id,
          modelName: model.name,
          version: model.version,
          status: model.status,
          metrics: modelMetrics,
          deployment: deployment
        });
      }

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get model metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor model performance
   */
  async monitorModelPerformance(userId, modelId, performanceData) {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        return { success: false, error: 'Model not found' };
      }

      // Update model metrics
      const existingMetrics = this.modelMetrics.get(modelId) || {};
      const updatedMetrics = {
        ...existingMetrics,
        totalRequests: (existingMetrics.totalRequests || 0) + 1,
        avgResponseTime: this.calculateAvgResponseTime(existingMetrics, performanceData),
        avgTokenUsage: this.calculateAvgTokenUsage(existingMetrics, performanceData),
        successRate: this.calculateSuccessRate(existingMetrics, performanceData),
        lastUpdated: new Date().toISOString()
      };

      this.modelMetrics.set(modelId, updatedMetrics);

      // Store metrics in database
      const { error } = await supabase
        .from('ai_model_metrics')
        .upsert({
          model_id: modelId,
          user_id: userId,
          metrics: updatedMetrics,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true, metrics: updatedMetrics };
    } catch (error) {
      logger.error('Failed to monitor model performance', { error: error.message, userId, modelId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load models for user
   */
  async loadModels(userId) {
    try {
      const { data: models, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      models.forEach(model => {
        this.models.set(model.id, model);
      });

      logger.info('Models loaded', { userId, modelCount: models.length });
    } catch (error) {
      logger.error('Failed to load models', { error: error.message, userId });
    }
  }

  /**
   * Load model versions
   */
  async loadModelVersions(userId) {
    try {
      const { data: versions, error } = await supabase
        .from('ai_model_versions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const versionMap = new Map();
      versions.forEach(version => {
        if (!versionMap.has(version.model_id)) {
          versionMap.set(version.model_id, []);
        }
        versionMap.get(version.model_id).push(version);
      });

      this.modelVersions.set(userId, versionMap);
      logger.info('Model versions loaded', { userId, versionCount: versions.length });
    } catch (error) {
      logger.error('Failed to load model versions', { error: error.message, userId });
    }
  }

  /**
   * Load deployments
   */
  async loadDeployments(userId) {
    try {
      const { data: deployments, error } = await supabase
        .from('ai_model_deployments')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      deployments.forEach(deployment => {
        this.deployments.set(deployment.model_id, deployment);
      });

      logger.info('Deployments loaded', { userId, deploymentCount: deployments.length });
    } catch (error) {
      logger.error('Failed to load deployments', { error: error.message, userId });
    }
  }

  /**
   * Load model metrics
   */
  async loadModelMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('ai_model_metrics')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      metrics.forEach(metric => {
        this.modelMetrics.set(metric.model_id, metric.metrics);
      });

      logger.info('Model metrics loaded', { userId, metricCount: metrics.length });
    } catch (error) {
      logger.error('Failed to load model metrics', { error: error.message, userId });
    }
  }

  /**
   * Validate model data
   */
  async validateModelData(modelData) {
    const requiredFields = ['name', 'type'];
    const missingFields = requiredFields.filter(field => !modelData[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate model type
    const validTypes = ['text-generation', 'text-classification', 'text-embedding', 'image-generation'];
    if (!validTypes.includes(modelData.type)) {
      return {
        valid: false,
        error: `Invalid model type. Must be one of: ${validTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Create model version
   */
  async createModelVersion(userId, modelId, modelData) {
    try {
      const version = {
        model_id: modelId,
        user_id: userId,
        version: modelData.version || '1.0.0',
        configuration: modelData.configuration || {},
        metadata: modelData.metadata || {},
        created_at: new Date().toISOString()
      };

      const { data: newVersion, error } = await supabase
        .from('ai_model_versions')
        .insert(version)
        .select()
        .single();

      if (error) throw error;

      return newVersion;
    } catch (error) {
      logger.error('Failed to create model version', { error: error.message, userId, modelId });
      throw error;
    }
  }

  /**
   * Initialize deployment
   */
  async initializeDeployment(userId, modelId) {
    try {
      const deployment = {
        model_id: modelId,
        user_id: userId,
        status: 'initializing',
        endpoint: `https://api.example.com/models/${modelId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newDeployment, error } = await supabase
        .from('ai_model_deployments')
        .insert(deployment)
        .select()
        .single();

      if (error) throw error;

      this.deployments.set(modelId, newDeployment);

      return newDeployment;
    } catch (error) {
      logger.error('Failed to initialize deployment', { error: error.message, userId, modelId });
      throw error;
    }
  }

  /**
   * Update model status
   */
  async updateModelStatus(modelId, status) {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', modelId);

      if (error) throw error;

      const model = this.models.get(modelId);
      if (model) {
        model.status = status;
        model.updated_at = new Date().toISOString();
        this.models.set(modelId, model);
      }
    } catch (error) {
      logger.error('Failed to update model status', { error: error.message, modelId });
    }
  }

  /**
   * Get previous version
   */
  async getPreviousVersion(userId, modelId) {
    try {
      const { data: versions, error } = await supabase
        .from('ai_model_versions')
        .select('*')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) throw error;

      return versions.length > 1 ? versions[1] : null;
    } catch (error) {
      logger.error('Failed to get previous version', { error: error.message, userId, modelId });
      return null;
    }
  }

  /**
   * Check model usage
   */
  async checkModelUsage(modelId) {
    try {
      const { data: usage, error } = await supabase
        .from('ai_model_usage')
        .select('id')
        .eq('model_id', modelId)
        .limit(1);

      if (error) throw error;

      return usage.length > 0;
    } catch (error) {
      logger.error('Failed to check model usage', { error: error.message, modelId });
      return false;
    }
  }

  /**
   * Cleanup model data
   */
  async cleanupModelData(modelId) {
    try {
      // Delete model versions
      await supabase
        .from('ai_model_versions')
        .delete()
        .eq('model_id', modelId);

      // Delete deployments
      await supabase
        .from('ai_model_deployments')
        .delete()
        .eq('model_id', modelId);

      // Delete metrics
      await supabase
        .from('ai_model_metrics')
        .delete()
        .eq('model_id', modelId);

      logger.info('Model data cleaned up', { modelId });
    } catch (error) {
      logger.error('Failed to cleanup model data', { error: error.message, modelId });
    }
  }

  /**
   * Calculate average response time
   */
  calculateAvgResponseTime(existingMetrics, performanceData) {
    const totalRequests = (existingMetrics.totalRequests || 0) + 1;
    const currentAvg = existingMetrics.avgResponseTime || 0;
    const newResponseTime = performanceData.responseTime || 0;

    return ((currentAvg * (totalRequests - 1)) + newResponseTime) / totalRequests;
  }

  /**
   * Calculate average token usage
   */
  calculateAvgTokenUsage(existingMetrics, performanceData) {
    const totalRequests = (existingMetrics.totalRequests || 0) + 1;
    const currentAvg = existingMetrics.avgTokenUsage || 0;
    const newTokenUsage = performanceData.tokenUsage || 0;

    return ((currentAvg * (totalRequests - 1)) + newTokenUsage) / totalRequests;
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate(existingMetrics, performanceData) {
    const totalRequests = (existingMetrics.totalRequests || 0) + 1;
    const currentSuccessCount = (existingMetrics.successRate || 0) * (totalRequests - 1);
    const newSuccess = performanceData.success ? 1 : 0;

    return (currentSuccessCount + newSuccess) / totalRequests;
  }

  /**
   * Reset model manager for user
   */
  async reset(userId) {
    try {
      // Clear in-memory data
      const userModels = Array.from(this.models.values()).filter(m => m.user_id === userId);
      userModels.forEach(model => {
        this.models.delete(model.id);
        this.modelVersions.delete(model.id);
        this.deployments.delete(model.id);
        this.modelMetrics.delete(model.id);
      });

      logger.info('Model manager reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset model manager', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
