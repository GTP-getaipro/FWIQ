/**
 * Advanced Business Intelligence Engine
 * 
 * Core engine for advanced BI reporting, automated insights,
 * data modeling, and performance optimization.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';
import { AdvancedBIReporting } from './advancedBIReporting.js';
import { AutomatedInsights } from './automatedInsights.js';
import { BIDataModeling } from './biDataModeling.js';
import { BIOptimizer } from './biOptimizer.js';
import { BIScheduler } from './biScheduler.js';

export class AdvancedBIEngine {
  constructor() {
    this.reportTemplates = new Map();
    this.insightRules = new Map();
    this.dataModels = new Map();
    this.optimizationConfigs = new Map();
    this.scheduledReports = new Map();
    this.isInitialized = false;
    
    // Initialize integrated components
    this.biReporting = new AdvancedBIReporting();
    this.automatedInsights = new AutomatedInsights();
    this.dataModeling = new BIDataModeling();
    this.biOptimizer = new BIOptimizer();
    this.biScheduler = new BIScheduler();
  }

  /**
   * Initialize the advanced BI engine
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Advanced BI Engine', { userId });

      // Initialize all components
      await this.biReporting.initialize(userId);
      await this.automatedInsights.initialize(userId);
      await this.dataModeling.initialize(userId);
      await this.biOptimizer.initialize(userId);
      await this.biScheduler.initialize(userId);

      // Load existing BI configurations
      await this.loadReportTemplates(userId);
      await this.loadInsightRules(userId);
      await this.loadDataModels(userId);
      await this.loadOptimizationConfigs(userId);
      await this.loadScheduledReports(userId);

      this.isInitialized = true;
      logger.info('Advanced BI Engine initialized successfully', { userId });

      return { success: true, message: 'Advanced BI Engine initialized' };
    } catch (error) {
      logger.error('Failed to initialize Advanced BI Engine', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate BI report
   */
  async generateBIReport(userId, reportData) {
    try {
      if (!this.isInitialized) {
        await this.initialize(userId);
      }

      logger.info('Generating BI report', { userId, reportType: reportData.type });

      // Validate report data
      const validationResult = await this.validateReportData(reportData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate report
      const report = await this.biReporting.generateReport(userId, reportData);

      // Store report
      await this.storeReport(userId, report);

      logger.info('BI report generated successfully', { 
        userId, 
        reportId: report.id, 
        reportType: reportData.type 
      });

      return {
        success: true,
        report
      };
    } catch (error) {
      logger.error('Failed to generate BI report', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate automated insights
   */
  async generateAutomatedInsights(userId, insightData) {
    try {
      logger.info('Generating automated insights', { userId, insightType: insightData.type });

      // Validate insight data
      const validationResult = await this.validateInsightData(insightData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate insights
      const insights = await this.automatedInsights.generateInsights(userId, insightData);

      // Store insights
      await this.storeInsights(userId, insights);

      logger.info('Automated insights generated successfully', { 
        userId, 
        insightType: insightData.type,
        insightCount: insights.insights.length
      });

      return {
        success: true,
        insights,
        confidence: insights.confidence,
        recommendations: insights.recommendations
      };
    } catch (error) {
      logger.error('Failed to generate automated insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create data model
   */
  async createDataModel(userId, modelData) {
    try {
      logger.info('Creating data model', { userId, modelName: modelData.name });

      // Validate model data
      const validationResult = await this.validateModelData(modelData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create data model
      const dataModel = await this.dataModeling.createModel(userId, modelData);

      // Store data model
      await this.storeDataModel(userId, dataModel);

      logger.info('Data model created successfully', { 
        userId, 
        modelId: dataModel.id, 
        modelName: modelData.name 
      });

      return {
        success: true,
        dataModel
      };
    } catch (error) {
      logger.error('Failed to create data model', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize BI performance
   */
  async optimizeBIPerformance(userId, optimizationData) {
    try {
      logger.info('Optimizing BI performance', { userId, optimizationType: optimizationData.type });

      // Validate optimization data
      const validationResult = await this.validateOptimizationData(optimizationData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Perform optimization
      const optimizationResult = await this.biOptimizer.optimizePerformance(userId, optimizationData);

      // Store optimization results
      await this.storeOptimizationResults(userId, optimizationResult);

      logger.info('BI performance optimized successfully', { 
        userId, 
        optimizationType: optimizationData.type,
        performanceGain: optimizationResult.performanceGain
      });

      return {
        success: true,
        optimizationResult,
        performanceGain: optimizationResult.performanceGain,
        recommendations: optimizationResult.recommendations
      };
    } catch (error) {
      logger.error('Failed to optimize BI performance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule BI report
   */
  async scheduleBIReport(userId, scheduleData) {
    try {
      logger.info('Scheduling BI report', { userId, scheduleType: scheduleData.type });

      // Validate schedule data
      const validationResult = await this.validateScheduleData(scheduleData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create schedule
      const schedule = await this.biScheduler.createSchedule(userId, scheduleData);

      // Store schedule
      await this.storeSchedule(userId, schedule);

      logger.info('BI report scheduled successfully', { 
        userId, 
        scheduleId: schedule.id, 
        scheduleType: scheduleData.type 
      });

      return {
        success: true,
        schedule
      };
    } catch (error) {
      logger.error('Failed to schedule BI report', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get BI insights
   */
  async getBIInsights(userId, insightType = null) {
    try {
      logger.info('Getting BI insights', { userId, insightType });

      const reportingInsights = await this.biReporting.getInsights(userId);
      const automatedInsights = await this.automatedInsights.getInsights(userId);
      const dataModelInsights = await this.dataModeling.getInsights(userId);
      const optimizationInsights = await this.biOptimizer.getInsights(userId);
      const schedulingInsights = await this.biScheduler.getInsights(userId);

      const insights = {
        reporting: reportingInsights,
        automated: automatedInsights,
        dataModeling: dataModelInsights,
        optimization: optimizationInsights,
        scheduling: schedulingInsights,
        overall: this.calculateOverallInsights(reportingInsights, automatedInsights, dataModelInsights)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get BI insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get BI metrics
   */
  async getBIMetrics(userId) {
    try {
      const reportingMetrics = await this.biReporting.getMetrics(userId);
      const automatedMetrics = await this.automatedInsights.getMetrics(userId);
      const dataModelMetrics = await this.dataModeling.getMetrics(userId);
      const optimizationMetrics = await this.biOptimizer.getMetrics(userId);
      const schedulingMetrics = await this.biScheduler.getMetrics(userId);

      return {
        success: true,
        metrics: {
          reporting: reportingMetrics,
          automated: automatedMetrics,
          dataModeling: dataModelMetrics,
          optimization: optimizationMetrics,
          scheduling: schedulingMetrics
        }
      };
    } catch (error) {
      logger.error('Failed to get BI metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update BI configuration
   */
  async updateBIConfiguration(userId, configType, configuration) {
    try {
      logger.info('Updating BI configuration', { userId, configType });

      let result;
      switch (configType) {
        case 'reporting':
          result = await this.biReporting.updateConfiguration(userId, configuration);
          break;
        case 'automated':
          result = await this.automatedInsights.updateConfiguration(userId, configuration);
          break;
        case 'dataModeling':
          result = await this.dataModeling.updateConfiguration(userId, configuration);
          break;
        case 'optimization':
          result = await this.biOptimizer.updateConfiguration(userId, configuration);
          break;
        case 'scheduling':
          result = await this.biScheduler.updateConfiguration(userId, configuration);
          break;
        default:
          throw new Error(`Unknown configuration type: ${configType}`);
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      logger.error('Failed to update BI configuration', { error: error.message, userId, configType });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load report templates
   */
  async loadReportTemplates(userId) {
    try {
      const { data: templates, error } = await supabase
        .from('bi_report_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      templates.forEach(template => {
        this.reportTemplates.set(template.id, template);
      });

      logger.info('Report templates loaded', { userId, templateCount: templates.length });
    } catch (error) {
      logger.error('Failed to load report templates', { error: error.message, userId });
    }
  }

  /**
   * Load insight rules
   */
  async loadInsightRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('bi_insight_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      rules.forEach(rule => {
        this.insightRules.set(rule.id, rule);
      });

      logger.info('Insight rules loaded', { userId, ruleCount: rules.length });
    } catch (error) {
      logger.error('Failed to load insight rules', { error: error.message, userId });
    }
  }

  /**
   * Load data models
   */
  async loadDataModels(userId) {
    try {
      const { data: models, error } = await supabase
        .from('bi_data_models')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      models.forEach(model => {
        this.dataModels.set(model.id, model);
      });

      logger.info('Data models loaded', { userId, modelCount: models.length });
    } catch (error) {
      logger.error('Failed to load data models', { error: error.message, userId });
    }
  }

  /**
   * Load optimization configs
   */
  async loadOptimizationConfigs(userId) {
    try {
      const { data: configs, error } = await supabase
        .from('bi_optimization_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      configs.forEach(config => {
        this.optimizationConfigs.set(config.id, config);
      });

      logger.info('Optimization configs loaded', { userId, configCount: configs.length });
    } catch (error) {
      logger.error('Failed to load optimization configs', { error: error.message, userId });
    }
  }

  /**
   * Load scheduled reports
   */
  async loadScheduledReports(userId) {
    try {
      const { data: schedules, error } = await supabase
        .from('bi_scheduled_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      schedules.forEach(schedule => {
        this.scheduledReports.set(schedule.id, schedule);
      });

      logger.info('Scheduled reports loaded', { userId, scheduleCount: schedules.length });
    } catch (error) {
      logger.error('Failed to load scheduled reports', { error: error.message, userId });
    }
  }

  /**
   * Get BI status
   */
  async getBIStatus(userId) {
    try {
      const status = {
        initialized: this.isInitialized,
        reportTemplates: this.reportTemplates.size,
        insightRules: this.insightRules.size,
        dataModels: this.dataModels.size,
        optimizationConfigs: this.optimizationConfigs.size,
        scheduledReports: this.scheduledReports.size,
        components: {
          biReporting: this.biReporting.isInitialized,
          automatedInsights: this.automatedInsights.isInitialized,
          dataModeling: this.dataModeling.isInitialized,
          biOptimizer: this.biOptimizer.isInitialized,
          biScheduler: this.biScheduler.isInitialized
        }
      };

      return {
        success: true,
        status
      };
    } catch (error) {
      logger.error('Failed to get BI status', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset BI engine for user
   */
  async resetBIEngine(userId) {
    try {
      // Clear in-memory data
      this.reportTemplates.clear();
      this.insightRules.clear();
      this.dataModels.clear();
      this.optimizationConfigs.clear();
      this.scheduledReports.clear();

      // Reset components
      await this.biReporting.reset(userId);
      await this.automatedInsights.reset(userId);
      await this.dataModeling.reset(userId);
      await this.biOptimizer.reset(userId);
      await this.biScheduler.reset(userId);

      this.isInitialized = false;

      logger.info('BI engine reset', { userId });

      return {
        success: true,
        message: 'BI engine reset successfully'
      };
    } catch (error) {
      logger.error('Failed to reset BI engine', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}

export const advancedBIEngine = new AdvancedBIEngine();
