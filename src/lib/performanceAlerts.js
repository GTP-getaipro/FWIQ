/**
 * Performance Alerts System
 * Advanced performance alerting and notification system for FloWorx
 */

import { logger } from './logger.js';
import { performanceMonitor } from './performance/performanceMonitor.js';
import { securityAuditLogger } from './securityAudit.js';

export class PerformanceAlertsSystem {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      // Core Web Vitals thresholds
      LCP: { warning: 2500, critical: 4000 }, // Largest Contentful Paint
      FID: { warning: 100, critical: 300 },    // First Input Delay
      CLS: { warning: 0.1, critical: 0.25 },  // Cumulative Layout Shift
      FCP: { warning: 1800, critical: 3000 }, // First Contentful Paint
      TTFB: { warning: 800, critical: 1500 }, // Time to First Byte
      TBT: { warning: 200, critical: 600 },    // Total Blocking Time
      
      // Resource thresholds
      slowResource: { warning: 1000, critical: 3000 }, // Slow resource loading
      largeResource: { warning: 500000, critical: 1000000 }, // Large resource size (500KB/1MB)
      memoryUsage: { warning: 0.7, critical: 0.9 }, // Memory usage ratio
      
      // Custom thresholds
      apiResponseTime: { warning: 2000, critical: 5000 }, // API response time
      bundleSize: { warning: 1000000, critical: 2000000 }, // Bundle size (1MB/2MB)
      errorRate: { warning: 0.05, critical: 0.1 } // Error rate (5%/10%)
    };
    
    this.alertChannels = {
      console: true,
      audit: true,
      notification: false,
      email: false
    };
    
    this.alertHistory = [];
    this.maxHistorySize = 1000;
    this.initialize();
  }

  /**
   * Initialize performance alerts system
   */
  initialize() {
    this.setupPerformanceMonitoring();
    this.setupResourceMonitoring();
    this.setupMemoryMonitoring();
    this.setupAPIMonitoring();
    this.setupErrorMonitoring();
    
    logger.info('Performance Alerts System initialized');
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor custom performance metrics
    this.monitorCustomMetrics();
    
    // Monitor performance trends
    this.monitorPerformanceTrends();
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorCoreWebVitals() {
    const vitals = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'TBT'];
    
    vitals.forEach(vital => {
      // Listen for performance metric updates
      const checkVital = () => {
        const metrics = performanceMonitor.getMetrics();
        const vitalMetric = metrics[vital];
        
        if (vitalMetric) {
          this.checkPerformanceThreshold(vital, vitalMetric.value, vitalMetric);
        }
      };
      
      // Check periodically
      setInterval(checkVital, 30000); // Every 30 seconds
    });
  }

  /**
   * Monitor custom performance metrics
   */
  monitorCustomMetrics() {
    // Monitor slow resources
    this.monitorSlowResources();
    
    // Monitor large resources
    this.monitorLargeResources();
    
    // Monitor bundle performance
    this.monitorBundlePerformance();
  }

  /**
   * Monitor slow resources
   */
  monitorSlowResources() {
    const checkSlowResources = () => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach(resource => {
        if (resource.duration > this.thresholds.slowResource.warning) {
          this.checkPerformanceThreshold('slowResource', resource.duration, {
            url: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize
          });
        }
      });
    };
    
    setInterval(checkSlowResources, 60000); // Every minute
  }

  /**
   * Monitor large resources
   */
  monitorLargeResources() {
    const checkLargeResources = () => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach(resource => {
        const size = resource.transferSize || resource.decodedBodySize;
        if (size > this.thresholds.largeResource.warning) {
          this.checkPerformanceThreshold('largeResource', size, {
            url: resource.name,
            type: resource.initiatorType,
            duration: resource.duration
          });
        }
      });
    };
    
    setInterval(checkLargeResources, 60000); // Every minute
  }

  /**
   * Monitor bundle performance
   */
  monitorBundlePerformance() {
    const checkBundlePerformance = () => {
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => 
        r.name.endsWith('.js') || r.initiatorType === 'script'
      );
      
      const totalSize = jsResources.reduce((sum, r) => 
        sum + (r.transferSize || r.decodedBodySize), 0
      );
      
      if (totalSize > this.thresholds.bundleSize.warning) {
        this.checkPerformanceThreshold('bundleSize', totalSize, {
          resourceCount: jsResources.length,
          resources: jsResources.map(r => ({
            url: r.name,
            size: r.transferSize || r.decodedBodySize
          }))
        });
      }
    };
    
    setInterval(checkBundlePerformance, 300000); // Every 5 minutes
  }

  /**
   * Setup resource monitoring
   */
  setupResourceMonitoring() {
    // Monitor resource loading failures
    this.monitorResourceFailures();
    
    // Monitor resource cache efficiency
    this.monitorCacheEfficiency();
  }

  /**
   * Monitor resource failures
   */
  monitorResourceFailures() {
    const checkResourceFailures = () => {
      const resources = performance.getEntriesByType('resource');
      const failedResources = resources.filter(r => r.transferSize === 0);
      
      if (failedResources.length > 0) {
        this.createAlert('resource_failure', 'medium', {
          failedCount: failedResources.length,
          failedResources: failedResources.map(r => ({
            url: r.name,
            type: r.initiatorType
          }))
        });
      }
    };
    
    setInterval(checkResourceFailures, 120000); // Every 2 minutes
  }

  /**
   * Monitor cache efficiency
   */
  monitorCacheEfficiency() {
    const checkCacheEfficiency = () => {
      const resources = performance.getEntriesByType('resource');
      const cachedResources = resources.filter(r => r.transferSize === 0 && r.decodedBodySize > 0);
      const totalResources = resources.length;
      
      if (totalResources > 0) {
        const cacheHitRate = cachedResources.length / totalResources;
        
        if (cacheHitRate < 0.3) { // Less than 30% cache hit rate
          this.createAlert('low_cache_efficiency', 'medium', {
            cacheHitRate: Math.round(cacheHitRate * 100),
            cachedResources: cachedResources.length,
            totalResources: totalResources
          });
        }
      }
    };
    
    setInterval(checkCacheEfficiency, 300000); // Every 5 minutes
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemoryUsage = () => {
        const memory = performance.memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usageRatio > this.thresholds.memoryUsage.warning) {
          this.checkPerformanceThreshold('memoryUsage', usageRatio, {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            usage: Math.round(usageRatio * 100)
          });
        }
      };
      
      setInterval(checkMemoryUsage, 30000); // Every 30 seconds
    }
  }

  /**
   * Setup API monitoring
   */
  setupAPIMonitoring() {
    // Monitor API response times
    this.monitorAPIResponseTimes();
    
    // Monitor API error rates
    this.monitorAPIErrorRates();
  }

  /**
   * Monitor API response times
   */
  monitorAPIResponseTimes() {
    const apiCalls = [];
    const maxCalls = 100;
    
    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0];
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Track API call
        apiCalls.push({
          url,
          duration,
          status: response.status,
          timestamp: startTime
        });
        
        // Keep only recent calls
        if (apiCalls.length > maxCalls) {
          apiCalls.splice(0, apiCalls.length - maxCalls);
        }
        
        // Check for slow API calls
        if (duration > this.thresholds.apiResponseTime.warning) {
          this.checkPerformanceThreshold('apiResponseTime', duration, {
            url,
            status: response.status,
            method: args[1]?.method || 'GET'
          });
        }
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Track failed API call
        apiCalls.push({
          url,
          duration,
          status: 'error',
          error: error.message,
          timestamp: startTime
        });
        
        return Promise.reject(error);
      }
    };
  }

  /**
   * Monitor API error rates
   */
  monitorAPIErrorRates() {
    const checkErrorRates = () => {
      const recentCalls = this.getRecentAPICalls();
      const totalCalls = recentCalls.length;
      
      if (totalCalls > 10) { // Only check if we have enough data
        const errorCalls = recentCalls.filter(call => 
          call.status >= 400 || call.status === 'error'
        );
        const errorRate = errorCalls.length / totalCalls;
        
        if (errorRate > this.thresholds.errorRate.warning) {
          this.checkPerformanceThreshold('errorRate', errorRate, {
            errorCount: errorCalls.length,
            totalCalls,
            errorRate: Math.round(errorRate * 100)
          });
        }
      }
    };
    
    setInterval(checkErrorRates, 120000); // Every 2 minutes
  }

  /**
   * Setup error monitoring
   */
  setupErrorMonitoring() {
    // Monitor JavaScript errors
    this.monitorJavaScriptErrors();
    
    // Monitor unhandled promise rejections
    this.monitorUnhandledRejections();
  }

  /**
   * Monitor JavaScript errors
   */
  monitorJavaScriptErrors() {
    let errorCount = 0;
    let lastErrorTime = 0;
    
    window.addEventListener('error', (event) => {
      errorCount++;
      lastErrorTime = Date.now();
      
      // Check for error spike
      if (errorCount > 5) {
        this.createAlert('error_spike', 'high', {
          errorCount,
          lastError: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno
          }
        });
        
        errorCount = 0; // Reset counter
      }
    });
    
    // Reset error count periodically
    setInterval(() => {
      if (Date.now() - lastErrorTime > 300000) { // 5 minutes
        errorCount = 0;
      }
    }, 60000); // Every minute
  }

  /**
   * Monitor unhandled promise rejections
   */
  monitorUnhandledRejections() {
    let rejectionCount = 0;
    let lastRejectionTime = 0;
    
    window.addEventListener('unhandledrejection', (event) => {
      rejectionCount++;
      lastRejectionTime = Date.now();
      
      // Check for rejection spike
      if (rejectionCount > 3) {
        this.createAlert('rejection_spike', 'high', {
          rejectionCount,
          lastRejection: {
            reason: event.reason?.toString(),
            stack: event.reason?.stack
          }
        });
        
        rejectionCount = 0; // Reset counter
      }
    });
    
    // Reset rejection count periodically
    setInterval(() => {
      if (Date.now() - lastRejectionTime > 300000) { // 5 minutes
        rejectionCount = 0;
      }
    }, 60000); // Every minute
  }

  /**
   * Check performance threshold
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  checkPerformanceThreshold(metric, value, metadata = {}) {
    const threshold = this.thresholds[metric];
    if (!threshold) return;
    
    let severity = null;
    if (value > threshold.critical) {
      severity = 'critical';
    } else if (value > threshold.warning) {
      severity = 'medium';
    }
    
    if (severity) {
      this.createAlert(`performance_${metric}`, severity, {
        metric,
        value,
        threshold: threshold[severity],
        metadata
      });
    }
  }

  /**
   * Create performance alert
   * @param {string} alertType - Type of alert
   * @param {string} severity - Alert severity (low, medium, high, critical)
   * @param {Object} data - Alert data
   */
  createAlert(alertType, severity, data = {}) {
    const alert = {
      id: this.generateAlertId(),
      type: alertType,
      severity,
      timestamp: new Date().toISOString(),
      data: this.sanitizeAlertData(data),
      acknowledged: false,
      resolved: false,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.alerts.push(alert);
    this.addToHistory(alert);
    
    // Process alert
    this.processAlert(alert);
    
    // Log alert
    if (this.alertChannels.audit) {
      securityAuditLogger.logSecurityEvent('performance_alert', {
        alertType,
        severity,
        ...data
      }, null, severity);
    }

    // Console logging
    if (this.alertChannels.console) {
      this.logAlert(alert);
    }

    // Send notifications
    if (this.alertChannels.notification) {
      this.sendNotification(alert);
    }

    // Send email alerts for critical issues
    if (this.alertChannels.email && severity === 'critical') {
      this.sendEmailAlert(alert);
    }
  }

  /**
   * Process alert
   * @param {Object} alert - Alert to process
   */
  processAlert(alert) {
    // Check for alert escalation
    this.checkAlertEscalation(alert);
    
    // Auto-resolve low severity alerts after 1 hour
    if (alert.severity === 'low') {
      setTimeout(() => {
        this.resolveAlert(alert.id, 'auto_resolved');
      }, 60 * 60 * 1000);
    }
  }

  /**
   * Check for alert escalation
   * @param {Object} alert - Alert to check
   */
  checkAlertEscalation(alert) {
    const recentAlerts = this.getRecentAlerts(alert.type, 5 * 60 * 1000); // 5 minutes
    
    if (recentAlerts.length >= 3) {
      this.createAlert(`${alert.type}_escalated`, 'critical', {
        originalAlert: alert.id,
        alertCount: recentAlerts.length,
        escalationReason: 'frequency_threshold_exceeded'
      });
    }
  }

  /**
   * Get recent alerts
   * @param {string} alertType - Alert type
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array} Recent alerts
   */
  getRecentAlerts(alertType, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.alerts.filter(alert => 
      alert.type === alertType && 
      new Date(alert.timestamp).getTime() > cutoff
    );
  }

  /**
   * Get recent API calls
   * @returns {Array} Recent API calls
   */
  getRecentAPICalls() {
    // This would integrate with the API monitoring data
    return [];
  }

  /**
   * Add alert to history
   * @param {Object} alert - Alert to add
   */
  addToHistory(alert) {
    this.alertHistory.push(alert);
    
    // Keep only recent alerts
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate alert ID
   * @returns {string} Unique alert ID
   */
  generateAlertId() {
    return `perf_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize alert data
   * @param {Object} data - Alert data
   * @returns {Object} Sanitized data
   */
  sanitizeAlertData(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/password|token|key|secret/gi, '[REDACTED]');
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? item.replace(/password|token|key|secret/gi, '[REDACTED]') : item
        );
      }
    });

    return sanitized;
  }

  /**
   * Log alert to console
   * @param {Object} alert - Alert to log
   */
  logAlert(alert) {
    const message = `🚨 Performance Alert: ${alert.type} (${alert.severity})`;
    const data = {
      id: alert.id,
      timestamp: alert.timestamp,
      data: alert.data
    };

    switch (alert.severity) {
      case 'critical':
        console.error(message, data);
        break;
      case 'high':
        console.warn(message, data);
        break;
      case 'medium':
        console.info(message, data);
        break;
      default:
        console.log(message, data);
    }
  }

  /**
   * Send notification
   * @param {Object} alert - Alert to send notification for
   */
  sendNotification(alert) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Performance Alert: ${alert.type}`, {
        body: `Severity: ${alert.severity}`,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }
  }

  /**
   * Send email alert
   * @param {Object} alert - Alert to send email for
   */
  sendEmailAlert(alert) {
    // In a real implementation, this would send an email
    console.warn('Email alert would be sent:', alert);
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID who acknowledged
   */
  acknowledgeAlert(alertId, userId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date().toISOString();
      
      securityAuditLogger.logSecurityEvent('performance_alert_acknowledged', {
        alertId,
        alertType: alert.type,
        severity: alert.severity
      }, userId, 'low');
    }
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @param {string} resolution - Resolution reason
   * @param {string} userId - User ID who resolved
   */
  resolveAlert(alertId, resolution, userId = null) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = userId;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      
      securityAuditLogger.logSecurityEvent('performance_alert_resolved', {
        alertId,
        alertType: alert.type,
        severity: alert.severity,
        resolution
      }, userId, 'low');
    }
  }

  /**
   * Get performance alerts dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboardData() {
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    const recentAlerts = this.alerts.slice(-20);
    
    const alertsBySeverity = {
      critical: activeAlerts.filter(alert => alert.severity === 'critical').length,
      high: activeAlerts.filter(alert => alert.severity === 'high').length,
      medium: activeAlerts.filter(alert => alert.severity === 'medium').length,
      low: activeAlerts.filter(alert => alert.severity === 'low').length
    };
    
    const alertsByType = {};
    activeAlerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
    });
    
    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      alertsBySeverity,
      alertsByType,
      recentAlerts,
      thresholds: this.thresholds,
      alertChannels: this.alertChannels
    };
  }

  /**
   * Update alert thresholds
   * @param {Object} newThresholds - New thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Performance alert thresholds updated', this.thresholds);
  }

  /**
   * Update alert channels
   * @param {Object} newChannels - New alert channels
   */
  updateAlertChannels(newChannels) {
    this.alertChannels = { ...this.alertChannels, ...newChannels };
    logger.info('Performance alert channels updated', this.alertChannels);
  }

  /**
   * Get alert statistics
   * @returns {Object} Alert statistics
   */
  getAlertStatistics() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last7d = now - (7 * 24 * 60 * 60 * 1000);
    
    const alerts24h = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > last24h
    );
    
    const alerts7d = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > last7d
    );
    
    return {
      total: this.alerts.length,
      last24h: alerts24h.length,
      last7d: alerts7d.length,
      active: this.alerts.filter(alert => !alert.resolved).length,
      resolved: this.alerts.filter(alert => alert.resolved).length,
      acknowledged: this.alerts.filter(alert => alert.acknowledged).length
    };
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts() {
    const resolvedCount = this.alerts.filter(alert => alert.resolved).length;
    this.alerts = this.alerts.filter(alert => !alert.resolved);
    
    logger.info(`Cleared ${resolvedCount} resolved performance alerts`);
  }

  /**
   * Export alerts data
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported data
   */
  exportAlerts(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.alerts, null, 2);
    } else if (format === 'csv') {
      const headers = ['id', 'type', 'severity', 'timestamp', 'acknowledged', 'resolved'];
      const rows = this.alerts.map(alert => 
        headers.map(header => alert[header] || '')
      );
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return '';
  }
}

// Export singleton instance
export const performanceAlertsSystem = new PerformanceAlertsSystem();

export default PerformanceAlertsSystem;
