/**
 * Integration Monitor
 * 
 * Handles integration monitoring, health checks, and performance tracking
 * for third-party integrations.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class IntegrationMonitor {
  constructor() {
    this.healthChecks = new Map();
    this.metrics = new Map();
    this.alerts = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize monitoring system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Integration Monitor', { userId });

      // Load existing health checks and metrics
      await this.loadHealthChecks(userId);
      await this.loadMetrics(userId);
      await this.loadAlerts(userId);

      this.isInitialized = true;
      logger.info('Integration Monitor initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Integration Monitor', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform health checks for integrations
   */
  async performHealthChecks(userId, integrationType = null) {
    try {
      const healthChecks = this.healthChecks.get(userId) || [];
      const results = [];

      for (const healthCheck of healthChecks) {
        if (integrationType && healthCheck.integration_type !== integrationType) {
          continue;
        }

        const result = await this.executeHealthCheck(healthCheck);
        results.push(result);

        // Update health check status
        await this.updateHealthCheckStatus(healthCheck.id, result);
      }

      return results;
    } catch (error) {
      logger.error('Failed to perform health checks', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Check integration health
   */
  async checkIntegrationHealth(userId, integrationType) {
    try {
      const healthChecks = this.healthChecks.get(userId) || [];
      const relevantChecks = healthChecks.filter(check => check.integration_type === integrationType);

      if (relevantChecks.length === 0) {
        return { isHealthy: true, message: 'No health checks configured' };
      }

      const results = await Promise.all(
        relevantChecks.map(check => this.executeHealthCheck(check))
      );

      const isHealthy = results.every(result => result.isHealthy);
      const failedChecks = results.filter(result => !result.isHealthy);

      return {
        isHealthy,
        message: isHealthy ? 'All health checks passed' : `${failedChecks.length} health checks failed`,
        failedChecks: failedChecks.map(check => check.name),
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to check integration health', { error: error.message, userId, integrationType });
      return { isHealthy: false, message: 'Health check failed', error: error.message };
    }
  }

  /**
   * Record integration metrics
   */
  async recordIntegrationMetrics(userId, integrationType, operation, result) {
    try {
      const metrics = {
        user_id: userId,
        integration_type: integrationType,
        operation,
        success: result.success,
        response_time: result.performance?.responseTime || 0,
        error_message: result.error || null,
        timestamp: new Date().toISOString()
      };

      // Store metrics in database
      const { error } = await supabase
        .from('integration_metrics')
        .insert(metrics);

      if (error) throw error;

      // Update in-memory metrics
      if (!this.metrics.has(userId)) {
        this.metrics.set(userId, []);
      }
      
      this.metrics.get(userId).push(metrics);

      // Check for alert conditions
      await this.checkAlertConditions(userId, integrationType, metrics);

      logger.info('Integration metrics recorded', { userId, integrationType, operation });
    } catch (error) {
      logger.error('Failed to record integration metrics', { error: error.message, userId });
    }
  }

  /**
   * Get integration metrics
   */
  async getIntegrationMetrics(userId) {
    try {
      const userMetrics = this.metrics.get(userId) || [];
      
      const metrics = {
        totalRequests: userMetrics.length,
        successRate: this.calculateSuccessRate(userMetrics),
        avgResponseTime: this.calculateAvgResponseTime(userMetrics),
        errorRate: this.calculateErrorRate(userMetrics),
        lastRequest: userMetrics.length > 0 ? userMetrics[0].timestamp : null,
        metricsByIntegration: this.groupMetricsByIntegration(userMetrics)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get integration metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get health metrics
   */
  async getHealthMetrics(userId) {
    try {
      const healthChecks = this.healthChecks.get(userId) || [];
      
      const metrics = {
        totalHealthChecks: healthChecks.length,
        healthyIntegrations: healthChecks.filter(check => check.status === 'healthy').length,
        unhealthyIntegrations: healthChecks.filter(check => check.status === 'unhealthy').length,
        lastHealthCheck: healthChecks.length > 0 ? healthChecks[0].last_checked : null,
        healthByIntegration: this.groupHealthByIntegration(healthChecks)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get health metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get health insights
   */
  async getHealthInsights(userId) {
    try {
      const healthChecks = this.healthChecks.get(userId) || [];
      const metrics = this.metrics.get(userId) || [];

      const insights = {
        overallHealth: this.calculateOverallHealth(healthChecks),
        healthTrends: this.analyzeHealthTrends(healthChecks),
        performanceTrends: this.analyzePerformanceTrends(metrics),
        recommendations: this.generateHealthRecommendations(healthChecks, metrics)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get health insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute individual health check
   */
  async executeHealthCheck(healthCheck) {
    try {
      const startTime = Date.now();
      
      let result;
      switch (healthCheck.check_type) {
        case 'api_endpoint':
          result = await this.checkApiEndpoint(healthCheck);
          break;
        case 'database_connection':
          result = await this.checkDatabaseConnection(healthCheck);
          break;
        case 'service_availability':
          result = await this.checkServiceAvailability(healthCheck);
          break;
        case 'authentication':
          result = await this.checkAuthentication(healthCheck);
          break;
        default:
          result = { isHealthy: false, message: 'Unknown check type' };
      }

      const responseTime = Date.now() - startTime;

      return {
        id: healthCheck.id,
        name: healthCheck.name,
        integration_type: healthCheck.integration_type,
        check_type: healthCheck.check_type,
        isHealthy: result.isHealthy,
        message: result.message,
        responseTime,
        timestamp: new Date().toISOString(),
        details: result.details || {}
      };
    } catch (error) {
      logger.error('Failed to execute health check', { error: error.message, healthCheckId: healthCheck.id });
      return {
        id: healthCheck.id,
        name: healthCheck.name,
        integration_type: healthCheck.integration_type,
        check_type: healthCheck.check_type,
        isHealthy: false,
        message: 'Health check execution failed',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check API endpoint health
   */
  async checkApiEndpoint(healthCheck) {
    try {
      const response = await fetch(healthCheck.endpoint_url, {
        method: healthCheck.http_method || 'GET',
        headers: healthCheck.headers || {},
        timeout: healthCheck.timeout || 5000
      });

      const isHealthy = response.ok && response.status >= 200 && response.status < 300;
      
      return {
        isHealthy,
        message: isHealthy ? 'API endpoint is healthy' : `API endpoint returned status ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: 'API endpoint check failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Check database connection health
   */
  async checkDatabaseConnection(healthCheck) {
    try {
      // Simulate database connection check
      const { data, error } = await supabase
        .from('integration_health_checks')
        .select('id')
        .limit(1);

      const isHealthy = !error;
      
      return {
        isHealthy,
        message: isHealthy ? 'Database connection is healthy' : 'Database connection failed',
        details: { error: error?.message }
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: 'Database connection check failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Check service availability
   */
  async checkServiceAvailability(healthCheck) {
    try {
      // Simulate service availability check
      const isHealthy = Math.random() > 0.1; // 90% availability for testing
      
      return {
        isHealthy,
        message: isHealthy ? 'Service is available' : 'Service is unavailable',
        details: { availability: isHealthy ? '100%' : '0%' }
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: 'Service availability check failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Check authentication
   */
  async checkAuthentication(healthCheck) {
    try {
      // Simulate authentication check
      const isHealthy = Math.random() > 0.05; // 95% success rate for testing
      
      return {
        isHealthy,
        message: isHealthy ? 'Authentication is valid' : 'Authentication failed',
        details: { authenticated: isHealthy }
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: 'Authentication check failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Update health check status
   */
  async updateHealthCheckStatus(healthCheckId, result) {
    try {
      const { error } = await supabase
        .from('integration_health_checks')
        .update({
          status: result.isHealthy ? 'healthy' : 'unhealthy',
          last_checked: result.timestamp,
          last_response_time: result.responseTime,
          last_message: result.message
        })
        .eq('id', healthCheckId);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to update health check status', { error: error.message, healthCheckId });
    }
  }

  /**
   * Check alert conditions
   */
  async checkAlertConditions(userId, integrationType, metrics) {
    try {
      const alerts = this.alerts.get(userId) || [];
      const relevantAlerts = alerts.filter(alert => 
        alert.integration_type === integrationType && alert.active
      );

      for (const alert of relevantAlerts) {
        let shouldTrigger = false;

        switch (alert.condition_type) {
          case 'error_rate':
            shouldTrigger = this.checkErrorRateCondition(alert, metrics);
            break;
          case 'response_time':
            shouldTrigger = this.checkResponseTimeCondition(alert, metrics);
            break;
          case 'success_rate':
            shouldTrigger = this.checkSuccessRateCondition(alert, metrics);
            break;
        }

        if (shouldTrigger) {
          await this.triggerAlert(userId, alert, metrics);
        }
      }
    } catch (error) {
      logger.error('Failed to check alert conditions', { error: error.message, userId });
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(userId, alert, metrics) {
    try {
      const alertData = {
        user_id: userId,
        alert_id: alert.id,
        integration_type: alert.integration_type,
        condition_type: alert.condition_type,
        threshold: alert.threshold,
        actual_value: this.getActualValue(alert.condition_type, metrics),
        message: alert.message,
        triggered_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_alerts')
        .insert(alertData);

      if (error) throw error;

      logger.warn('Integration alert triggered', { userId, alertId: alert.id, integrationType: alert.integration_type });
    } catch (error) {
      logger.error('Failed to trigger alert', { error: error.message, userId, alertId: alert.id });
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
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.healthChecks.set(userId, healthChecks || []);
      logger.info('Health checks loaded', { userId, healthCheckCount: healthChecks?.length || 0 });
    } catch (error) {
      logger.error('Failed to load health checks', { error: error.message, userId });
    }
  }

  /**
   * Load metrics
   */
  async loadMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('integration_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.metrics.set(userId, metrics || []);
      logger.info('Metrics loaded', { userId, metricCount: metrics?.length || 0 });
    } catch (error) {
      logger.error('Failed to load metrics', { error: error.message, userId });
    }
  }

  /**
   * Load alerts
   */
  async loadAlerts(userId) {
    try {
      const { data: alerts, error } = await supabase
        .from('integration_alerts_config')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.alerts.set(userId, alerts || []);
      logger.info('Alerts loaded', { userId, alertCount: alerts?.length || 0 });
    } catch (error) {
      logger.error('Failed to load alerts', { error: error.message, userId });
    }
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate(metrics) {
    if (metrics.length === 0) return 0;
    const successfulRequests = metrics.filter(m => m.success).length;
    return successfulRequests / metrics.length;
  }

  /**
   * Calculate average response time
   */
  calculateAvgResponseTime(metrics) {
    const responseTimes = metrics.filter(m => m.response_time > 0).map(m => m.response_time);
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(metrics) {
    if (metrics.length === 0) return 0;
    const errorRequests = metrics.filter(m => !m.success).length;
    return errorRequests / metrics.length;
  }

  /**
   * Group metrics by integration
   */
  groupMetricsByIntegration(metrics) {
    const grouped = {};
    metrics.forEach(metric => {
      if (!grouped[metric.integration_type]) {
        grouped[metric.integration_type] = [];
      }
      grouped[metric.integration_type].push(metric);
    });
    return grouped;
  }

  /**
   * Group health by integration
   */
  groupHealthByIntegration(healthChecks) {
    const grouped = {};
    healthChecks.forEach(check => {
      if (!grouped[check.integration_type]) {
        grouped[check.integration_type] = [];
      }
      grouped[check.integration_type].push(check);
    });
    return grouped;
  }

  /**
   * Calculate overall health
   */
  calculateOverallHealth(healthChecks) {
    if (healthChecks.length === 0) return 'unknown';
    
    const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
    const healthPercentage = (healthyCount / healthChecks.length) * 100;

    if (healthPercentage >= 90) return 'excellent';
    if (healthPercentage >= 75) return 'good';
    if (healthPercentage >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Reset monitor for user
   */
  async reset(userId) {
    try {
      this.healthChecks.delete(userId);
      this.metrics.delete(userId);
      this.alerts.delete(userId);

      logger.info('Monitor reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset monitor', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
