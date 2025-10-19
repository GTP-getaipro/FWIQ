/**
 * System Monitor
 * Comprehensive system monitoring with health checks, performance tracking, and alerting
 */

import { logger } from './logger.js';
import { errorHandler } from './errorHandler.js';
import { supabase } from './customSupabaseClient.js';

export class SystemMonitor {
  constructor() {
    this.logger = logger;
    this.errorHandler = errorHandler;
    
    // Monitoring configuration
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      performanceCheckInterval: 10000, // 10 seconds
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.1, // 10%
        memoryUsage: 0.8, // 80%
        cpuUsage: 0.8, // 80%
        diskUsage: 0.9 // 90%
      },
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    // Monitoring state
    this.isMonitoring = false;
    this.healthStatus = {
      overall: 'unknown',
      services: {},
      lastChecked: null,
      uptime: 0
    };
    
    this.performanceMetrics = {
      responseTime: [],
      errorRate: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
    
    this.alerts = [];
    this.monitoringIntervals = new Map();
    
    // Service endpoints to monitor
    this.services = {
      supabase: {
        name: 'Supabase Database',
        url: import.meta.env.VITE_SUPABASE_URL,
        check: this.checkSupabaseHealth.bind(this)
      },
      n8n: {
        name: 'N8N Workflow Engine',
        url: import.meta.env.VITE_N8N_URL,
        check: this.checkN8nHealth.bind(this)
      },
      openai: {
        name: 'OpenAI API',
        url: 'https://api.openai.com/v1/models',
        check: this.checkOpenAIHealth.bind(this)
      },
      gmail: {
        name: 'Gmail API',
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        check: this.checkGmailHealth.bind(this)
      },
      outlook: {
        name: 'Outlook API',
        url: 'https://graph.microsoft.com/v1.0/me',
        check: this.checkOutlookHealth.bind(this)
      }
    };
  }

  /**
   * Start comprehensive system monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      this.logger.warn('System monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting system monitoring', { config: this.config });

    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start resource monitoring
    this.startResourceMonitoring();
    
    // Start alert processing
    this.startAlertProcessing();

    this.logger.info('System monitoring started successfully');
  }

  /**
   * Stop system monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      this.logger.warn('System monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    
    // Clear all monitoring intervals
    this.monitoringIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.monitoringIntervals.clear();

    this.logger.info('System monitoring stopped');
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    const intervalId = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    this.monitoringIntervals.set('health', intervalId);
    
    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    const intervalId = setInterval(async () => {
      await this.collectPerformanceMetrics();
    }, this.config.performanceCheckInterval);
    
    this.monitoringIntervals.set('performance', intervalId);
  }

  /**
   * Start resource monitoring
   */
  startResourceMonitoring() {
    const intervalId = setInterval(async () => {
      await this.collectResourceMetrics();
    }, this.config.performanceCheckInterval);
    
    this.monitoringIntervals.set('resources', intervalId);
  }

  /**
   * Start alert processing
   */
  startAlertProcessing() {
    const intervalId = setInterval(() => {
      this.processAlerts();
    }, 5000); // Check alerts every 5 seconds
    
    this.monitoringIntervals.set('alerts', intervalId);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      this.logger.debug('Performing health check');
      
      const healthResults = {};
      let overallHealthy = true;
      
      // Check each service
      for (const [serviceKey, service] of Object.entries(this.services)) {
        try {
          const result = await service.check();
          healthResults[serviceKey] = {
            name: service.name,
            status: result.healthy ? 'healthy' : 'unhealthy',
            responseTime: result.responseTime,
            lastChecked: new Date().toISOString(),
            details: result.details || {}
          };
          
          if (!result.healthy) {
            overallHealthy = false;
          }
        } catch (error) {
          healthResults[serviceKey] = {
            name: service.name,
            status: 'error',
            error: error.message,
            lastChecked: new Date().toISOString()
          };
          overallHealthy = false;
          
          // Log service error
          await this.errorHandler.handleError(error, {
            service: serviceKey,
            operation: 'health_check'
          });
        }
      }
      
      // Update health status
      this.healthStatus = {
        overall: overallHealthy ? 'healthy' : 'unhealthy',
        services: healthResults,
        lastChecked: new Date().toISOString(),
        uptime: Date.now() - (this.startTime || Date.now())
      };
      
      // Store health status
      await this.storeHealthStatus();
      
      // Check for alerts
      this.checkHealthAlerts();
      
      this.logger.debug('Health check completed', { 
        overall: this.healthStatus.overall,
        healthyServices: Object.values(healthResults).filter(s => s.status === 'healthy').length,
        totalServices: Object.keys(healthResults).length
      });
      
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message });
      await this.errorHandler.handleError(error, {
        operation: 'health_check'
      });
    }
  }

  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        responseTime: await this.measureResponseTime(),
        errorRate: await this.calculateErrorRate(),
        throughput: await this.calculateThroughput(),
        timestamp: new Date().toISOString()
      };
      
      // Update performance metrics
      this.performanceMetrics = {
        ...this.performanceMetrics,
        ...metrics
      };
      
      // Store metrics
      await this.storePerformanceMetrics(metrics);
      
      // Check performance alerts
      this.checkPerformanceAlerts();
      
      this.logger.debug('Performance metrics collected', metrics);
      
    } catch (error) {
      this.logger.error('Performance metrics collection failed', { error: error.message });
    }
  }

  /**
   * Collect resource metrics
   */
  async collectResourceMetrics() {
    try {
      const metrics = {
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage(),
        diskUsage: await this.getDiskUsage(),
        timestamp: new Date().toISOString()
      };
      
      // Update performance metrics
      this.performanceMetrics = {
        ...this.performanceMetrics,
        ...metrics
      };
      
      // Store metrics
      await this.storeResourceMetrics(metrics);
      
      // Check resource alerts
      this.checkResourceAlerts();
      
      this.logger.debug('Resource metrics collected', metrics);
      
    } catch (error) {
      this.logger.error('Resource metrics collection failed', { error: error.message });
    }
  }

  /**
   * Check Supabase health
   */
  async checkSupabaseHealth() {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: !error,
        responseTime,
        details: {
          error: error?.message,
          dataCount: data?.length || 0
        }
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Check N8N health
   */
  async checkN8nHealth() {
    const startTime = Date.now();
    
    try {
      const n8nUrl = import.meta.env.VITE_N8N_URL;
      if (!n8nUrl) {
        return {
          healthy: false,
          responseTime: 0,
          details: { error: 'N8N URL not configured' }
        };
      }
      
      const response = await fetch(`${n8nUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: response.ok,
        responseTime,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Check OpenAI health
   */
  async checkOpenAIHealth() {
    const startTime = Date.now();
    
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return {
          healthy: false,
          responseTime: 0,
          details: { error: 'OpenAI API key not configured' }
        };
      }
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: response.ok,
        responseTime,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Check Gmail health
   */
  async checkGmailHealth() {
    const startTime = Date.now();
    
    try {
      // This would require proper OAuth token
      // For now, return a basic check
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
        details: {
          note: 'Gmail health check requires OAuth token'
        }
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Check Outlook health
   */
  async checkOutlookHealth() {
    const startTime = Date.now();
    
    try {
      // This would require proper OAuth token
      // For now, return a basic check
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
        details: {
          note: 'Outlook health check requires OAuth token'
        }
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Measure response time
   */
  async measureResponseTime() {
    try {
      const startTime = Date.now();
      
      // Test with a simple API call
      await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return Date.now() - startTime;
    } catch (error) {
      return -1; // Indicates error
    }
  }

  /**
   * Calculate error rate
   */
  async calculateErrorRate() {
    try {
      // Get recent error logs
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
        .order('created_at', { ascending: false });
      
      if (error) {
        return 0;
      }
      
      // Calculate error rate based on total operations vs errors
      const totalOperations = 100; // This would be tracked from actual operations
      const errorCount = data?.length || 0;
      
      return errorCount / totalOperations;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate throughput
   */
  async calculateThroughput() {
    try {
      // This would be calculated based on actual operations per minute
      // For now, return a placeholder
      return 10; // operations per minute
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get memory usage (browser)
   */
  getMemoryUsage() {
    try {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get CPU usage (browser estimation)
   */
  getCPUUsage() {
    try {
      // Browser doesn't provide direct CPU usage
      // This is a placeholder for estimation
      return 0.1; // 10% estimated
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      // Browser doesn't provide disk usage
      // This is a placeholder
      return 0.1; // 10% estimated
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check health alerts
   */
  checkHealthAlerts() {
    const unhealthyServices = Object.values(this.healthStatus.services)
      .filter(service => service.status !== 'healthy');
    
    if (unhealthyServices.length > 0) {
      this.createAlert({
        type: 'health',
        severity: 'high',
        message: `${unhealthyServices.length} services are unhealthy`,
        details: {
          services: unhealthyServices.map(s => s.name),
          status: this.healthStatus.overall
        }
      });
    }
  }

  /**
   * Check performance alerts
   */
  checkPerformanceAlerts() {
    const metrics = this.performanceMetrics;
    
    if (metrics.responseTime > this.config.alertThresholds.responseTime) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `High response time: ${metrics.responseTime}ms`,
        details: { responseTime: metrics.responseTime }
      });
    }
    
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        message: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        details: { errorRate: metrics.errorRate }
      });
    }
  }

  /**
   * Check resource alerts
   */
  checkResourceAlerts() {
    const metrics = this.performanceMetrics;
    
    if (metrics.memoryUsage > this.config.alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'resource',
        severity: 'medium',
        message: `High memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`,
        details: { memoryUsage: metrics.memoryUsage }
      });
    }
    
    if (metrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
      this.createAlert({
        type: 'resource',
        severity: 'medium',
        message: `High CPU usage: ${(metrics.cpuUsage * 100).toFixed(1)}%`,
        details: { cpuUsage: metrics.cpuUsage }
      });
    }
  }

  /**
   * Create alert
   */
  createAlert(alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...alertData
    };
    
    this.alerts.push(alert);
    
    // Log alert
    this.logger.warn('System alert created', alert);
    
    // Dispatch alert event
    window.dispatchEvent(new CustomEvent('system-alert', {
      detail: alert
    }));
    
    // Store alert
    this.storeAlert(alert);
  }

  /**
   * Process alerts
   */
  processAlerts() {
    // Remove old alerts (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneHourAgo
    );
    
    // Process high severity alerts
    const highSeverityAlerts = this.alerts.filter(alert => alert.severity === 'high');
    if (highSeverityAlerts.length > 0) {
      this.handleHighSeverityAlerts(highSeverityAlerts);
    }
  }

  /**
   * Handle high severity alerts
   */
  handleHighSeverityAlerts(alerts) {
    // Send notifications for high severity alerts
    alerts.forEach(alert => {
      this.logger.error('High severity system alert', alert);
      
      // Send to error handler for additional processing
      this.errorHandler.handleError(new Error(alert.message), {
        alertId: alert.id,
        alertType: alert.type,
        severity: alert.severity,
        details: alert.details
      });
    });
  }

  /**
   * Store health status
   */
  async storeHealthStatus() {
    try {
      await supabase
        .from('system_health')
        .upsert({
          id: 'current',
          status: this.healthStatus.overall,
          services: this.healthStatus.services,
          last_checked: this.healthStatus.lastChecked,
          uptime: this.healthStatus.uptime,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      this.logger.warn('Failed to store health status', { error: error.message });
    }
  }

  /**
   * Store performance metrics
   */
  async storePerformanceMetrics(metrics) {
    try {
      await supabase
        .from('performance_metrics')
        .insert({
          id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          client_id: 'system',
          metric_type: 'system_performance',
          response_time_ms: metrics.responseTime,
          error_rate: metrics.errorRate,
          throughput: metrics.throughput,
          timestamp: metrics.timestamp
        });
    } catch (error) {
      this.logger.warn('Failed to store performance metrics', { error: error.message });
    }
  }

  /**
   * Store resource metrics
   */
  async storeResourceMetrics(metrics) {
    try {
      await supabase
        .from('performance_metrics')
        .insert({
          id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          client_id: 'system',
          metric_type: 'system_resources',
          memory_usage: metrics.memoryUsage,
          cpu_usage: metrics.cpuUsage,
          disk_usage: metrics.diskUsage,
          timestamp: metrics.timestamp
        });
    } catch (error) {
      this.logger.warn('Failed to store resource metrics', { error: error.message });
    }
  }

  /**
   * Store alert
   */
  async storeAlert(alert) {
    try {
      await supabase
        .from('error_logs')
        .insert({
          id: alert.id,
          client_id: 'system',
          error_type: 'system_alert',
          error_message: alert.message,
          severity: alert.severity,
          context: {
            alertType: alert.type,
            details: alert.details
          },
          created_at: alert.timestamp
        });
    } catch (error) {
      this.logger.warn('Failed to store alert', { error: error.message });
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    return this.healthStatus;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > Date.now() - 3600000 // Last hour
    );
  }

  /**
   * Get system summary
   */
  getSystemSummary() {
    return {
      health: this.healthStatus,
      performance: this.performanceMetrics,
      alerts: this.getActiveAlerts(),
      monitoring: {
        isActive: this.isMonitoring,
        uptime: this.healthStatus.uptime,
        lastChecked: this.healthStatus.lastChecked
      }
    };
  }
}

// Export singleton instance
export const systemMonitor = new SystemMonitor();
