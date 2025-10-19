/**
 * Security Monitoring System
 * Real-time security monitoring and alerting for FloWorx
 */

import { logger } from './logger.js';
import { securityAuditLogger } from './securityAudit.js';
import { threatDetectionSystem } from './threatDetection.js';

export class SecurityMonitoringSystem {
  constructor() {
    this.monitoringActive = false;
    this.alerts = [];
    this.metrics = {
      totalAlerts: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0,
      lastAlertTime: null,
      alertTrends: []
    };
    this.thresholds = {
      critical: { count: 1, timeWindow: 5 * 60 * 1000 }, // 5 minutes
      high: { count: 3, timeWindow: 15 * 60 * 1000 }, // 15 minutes
      medium: { count: 10, timeWindow: 60 * 60 * 1000 }, // 1 hour
      low: { count: 50, timeWindow: 24 * 60 * 60 * 1000 } // 24 hours
    };
    this.alertChannels = {
      console: true,
      audit: true,
      notification: false,
      email: false
    };
    this.initialize();
  }

  /**
   * Initialize security monitoring system
   */
  initialize() {
    this.startMonitoring();
    this.setupAlertProcessing();
    this.setupMetricsCollection();
    this.setupHealthChecks();
    logger.info('Security Monitoring System initialized');
  }

  /**
   * Start security monitoring
   */
  startMonitoring() {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    
    // Monitor security events
    this.monitorSecurityEvents();
    
    // Monitor system health
    this.monitorSystemHealth();
    
    // Monitor user behavior
    this.monitorUserBehavior();
    
    // Monitor network activity
    this.monitorNetworkActivity();
    
    // Monitor data access patterns
    this.monitorDataAccess();
    
    logger.info('Security monitoring started');
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring() {
    this.monitoringActive = false;
    logger.info('Security monitoring stopped');
  }

  /**
   * Monitor security events
   */
  monitorSecurityEvents() {
    // Monitor for security policy violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.createAlert('csp_violation', 'medium', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });
    });

    // Monitor for error events
    window.addEventListener('error', (event) => {
      if (this.isSecurityRelatedError(event)) {
        this.createAlert('client_error', 'medium', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    });

    // Monitor for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isSecurityRelatedRejection(event)) {
        this.createAlert('unhandled_rejection', 'medium', {
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        });
      }
    });
  }

  /**
   * Monitor system health
   */
  monitorSystemHealth() {
    setInterval(() => {
      const healthMetrics = this.collectSystemHealthMetrics();
      
      // Check for performance degradation
      if (healthMetrics.memoryUsage > 0.8) {
        this.createAlert('high_memory_usage', 'medium', {
          memoryUsage: healthMetrics.memoryUsage,
          threshold: 0.8
        });
      }

      // Check for slow response times
      if (healthMetrics.avgResponseTime > 5000) {
        this.createAlert('slow_response_time', 'medium', {
          avgResponseTime: healthMetrics.avgResponseTime,
          threshold: 5000
        });
      }

      // Check for high error rate
      if (healthMetrics.errorRate > 0.1) {
        this.createAlert('high_error_rate', 'high', {
          errorRate: healthMetrics.errorRate,
          threshold: 0.1
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Monitor user behavior
   */
  monitorUserBehavior() {
    let userActions = [];
    const maxActions = 1000;

    // Monitor clicks
    document.addEventListener('click', (event) => {
      userActions.push({
        type: 'click',
        target: event.target.tagName,
        timestamp: Date.now(),
        x: event.clientX,
        y: event.clientY
      });
      
      if (userActions.length > maxActions) {
        userActions = userActions.slice(-maxActions);
      }
      
      this.analyzeUserBehavior(userActions);
    });

    // Monitor keyboard input
    document.addEventListener('keydown', (event) => {
      userActions.push({
        type: 'keydown',
        key: event.key,
        timestamp: Date.now()
      });
      
      if (userActions.length > maxActions) {
        userActions = userActions.slice(-maxActions);
      }
    });

    // Monitor form interactions
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        userActions.push({
          type: 'input',
          target: event.target.tagName,
          fieldName: event.target.name,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Monitor network activity
   */
  monitorNetworkActivity() {
    const originalFetch = window.fetch;
    const networkRequests = [];
    const maxRequests = 500;

    window.fetch = async (...args) => {
      const startTime = Date.now();
      const requestInfo = {
        url: args[0],
        method: args[1]?.method || 'GET',
        timestamp: startTime
      };

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        requestInfo.duration = endTime - startTime;
        requestInfo.status = response.status;
        requestInfo.success = response.ok;
        
        networkRequests.push(requestInfo);
        
        if (networkRequests.length > maxRequests) {
          networkRequests.splice(0, networkRequests.length - maxRequests);
        }
        
        this.analyzeNetworkActivity(networkRequests);
        
        return response;
      } catch (error) {
        const endTime = Date.now();
        requestInfo.duration = endTime - startTime;
        requestInfo.error = error.message;
        requestInfo.success = false;
        
        networkRequests.push(requestInfo);
        this.analyzeNetworkActivity(networkRequests);
        
        throw error;
      }
    };
  }

  /**
   * Monitor data access patterns
   */
  monitorDataAccess() {
    // Monitor localStorage access
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;

    localStorage.setItem = function(key, value) {
      securityAuditLogger.logDataAccessEvent('localStorage', 'write', {
        key: key,
        valueLength: value?.length || 0
      });
      return originalSetItem.call(this, key, value);
    };

    localStorage.getItem = function(key) {
      securityAuditLogger.logDataAccessEvent('localStorage', 'read', {
        key: key
      });
      return originalGetItem.call(this, key);
    };

    localStorage.removeItem = function(key) {
      securityAuditLogger.logDataAccessEvent('localStorage', 'delete', {
        key: key
      });
      return originalRemoveItem.call(this, key);
    };

    // Monitor sessionStorage access
    const originalSessionSetItem = sessionStorage.setItem;
    const originalSessionGetItem = sessionStorage.getItem;
    const originalSessionRemoveItem = sessionStorage.removeItem;

    sessionStorage.setItem = function(key, value) {
      // Avoid logging security session ID access to prevent infinite recursion
      if (key === 'security_session_id') {
        return originalSessionSetItem.call(this, key, value);
      }
      
      securityAuditLogger.logDataAccessEvent('sessionStorage', 'write', {
        key: key,
        valueLength: value?.length || 0
      });
      return originalSessionSetItem.call(this, key, value);
    };

    sessionStorage.getItem = function(key) {
      // Avoid logging security session ID access to prevent infinite recursion
      if (key === 'security_session_id') {
        return originalSessionGetItem.call(this, key);
      }
      
      securityAuditLogger.logDataAccessEvent('sessionStorage', 'read', {
        key: key
      });
      return originalSessionGetItem.call(this, key);
    };

    sessionStorage.removeItem = function(key) {
      securityAuditLogger.logDataAccessEvent('sessionStorage', 'delete', {
        key: key
      });
      return originalSessionRemoveItem.call(this, key);
    };
  }

  /**
   * Create security alert
   * @param {string} alertType - Type of alert
   * @param {string} severity - Alert severity (low, medium, high, critical)
   * @param {Object} data - Alert data
   * @param {string} userId - User ID (optional)
   */
  createAlert(alertType, severity, data = {}, userId = null) {
    const alert = {
      id: this.generateAlertId(),
      type: alertType,
      severity,
      timestamp: new Date().toISOString(),
      userId,
      data: this.sanitizeAlertData(data),
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);
    this.updateMetrics(alert);
    
    // Process alert
    this.processAlert(alert);
    
    // Log alert
    if (this.alertChannels.audit) {
      securityAuditLogger.logSecurityEvent('security_alert', {
        alertType,
        severity,
        ...data
      }, userId, severity);
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
    // Check if alert exceeds threshold
    const threshold = this.thresholds[alert.severity];
    if (threshold) {
      const recentAlerts = this.getRecentAlerts(alert.type, threshold.timeWindow);
      
      if (recentAlerts.length >= threshold.count) {
        this.createEscalatedAlert(alert, recentAlerts);
      }
    }

    // Auto-resolve low severity alerts after 24 hours
    if (alert.severity === 'low') {
      setTimeout(() => {
        this.resolveAlert(alert.id, 'auto_resolved');
      }, 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Create escalated alert
   * @param {Object} originalAlert - Original alert
   * @param {Array} recentAlerts - Recent alerts of same type
   */
  createEscalatedAlert(originalAlert, recentAlerts) {
    const escalatedAlert = {
      id: this.generateAlertId(),
      type: `${originalAlert.type}_escalated`,
      severity: this.escalateSeverity(originalAlert.severity),
      timestamp: new Date().toISOString(),
      userId: originalAlert.userId,
      data: {
        originalAlert: originalAlert.id,
        alertCount: recentAlerts.length,
        timeWindow: this.thresholds[originalAlert.severity].timeWindow,
        escalationReason: 'threshold_exceeded'
      },
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(escalatedAlert);
    this.updateMetrics(escalatedAlert);
    
    securityAuditLogger.logSecurityEvent('alert_escalated', {
      originalAlertType: originalAlert.type,
      escalatedSeverity: escalatedAlert.severity,
      alertCount: recentAlerts.length
    }, originalAlert.userId, escalatedAlert.severity);
  }

  /**
   * Analyze user behavior
   * @param {Array} userActions - User actions array
   */
  analyzeUserBehavior(userActions) {
    const recentActions = userActions.filter(
      action => Date.now() - action.timestamp < 60000 // Last minute
    );

    // Check for rapid clicking (bot behavior)
    const clicks = recentActions.filter(action => action.type === 'click');
    if (clicks.length > 50) {
      this.createAlert('rapid_clicking', 'medium', {
        clickCount: clicks.length,
        timeWindow: '1 minute'
      });
    }

    // Check for unusual mouse patterns
    const mouseMovements = recentActions.filter(action => action.type === 'mousemove');
    if (mouseMovements.length > 1000) {
      this.createAlert('unusual_mouse_pattern', 'medium', {
        movementCount: mouseMovements.length,
        timeWindow: '1 minute'
      });
    }

    // Check for form automation
    const inputs = recentActions.filter(action => action.type === 'input');
    if (inputs.length > 100) {
      this.createAlert('rapid_form_input', 'medium', {
        inputCount: inputs.length,
        timeWindow: '1 minute'
      });
    }
  }

  /**
   * Analyze network activity
   * @param {Array} networkRequests - Network requests array
   */
  analyzeNetworkActivity(networkRequests) {
    const recentRequests = networkRequests.filter(
      request => Date.now() - request.timestamp < 60000 // Last minute
    );

    // Check for high request volume
    if (recentRequests.length > 100) {
      this.createAlert('high_request_volume', 'medium', {
        requestCount: recentRequests.length,
        timeWindow: '1 minute'
      });
    }

    // Check for high error rate
    const failedRequests = recentRequests.filter(request => !request.success);
    const errorRate = failedRequests.length / recentRequests.length;
    
    if (errorRate > 0.3 && recentRequests.length > 10) {
      this.createAlert('high_error_rate', 'high', {
        errorRate: errorRate,
        failedRequests: failedRequests.length,
        totalRequests: recentRequests.length
      });
    }

    // Check for slow requests
    const slowRequests = recentRequests.filter(request => request.duration > 10000);
    if (slowRequests.length > 5) {
      this.createAlert('slow_requests', 'medium', {
        slowRequestCount: slowRequests.length,
        avgDuration: slowRequests.reduce((sum, req) => sum + req.duration, 0) / slowRequests.length
      });
    }
  }

  /**
   * Collect system health metrics
   * @returns {Object} System health metrics
   */
  collectSystemHealthMetrics() {
    const metrics = {
      memoryUsage: 0,
      avgResponseTime: 0,
      errorRate: 0,
      activeConnections: 0,
      timestamp: new Date().toISOString()
    };

    // Memory usage (simplified)
    if (performance.memory) {
      metrics.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
    }

    // Response time (simplified)
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      metrics.avgResponseTime = navigation.responseEnd - navigation.requestStart;
    }

    // Error rate (simplified)
    const errors = this.alerts.filter(alert => 
      alert.type.includes('error') && 
      Date.now() - new Date(alert.timestamp).getTime() < 3600000 // Last hour
    );
    const totalAlerts = this.alerts.filter(alert => 
      Date.now() - new Date(alert.timestamp).getTime() < 3600000 // Last hour
    );
    metrics.errorRate = totalAlerts.length > 0 ? errors.length / totalAlerts.length : 0;

    return metrics;
  }

  /**
   * Check if error is security related
   * @param {ErrorEvent} event - Error event
   * @returns {boolean} Is security related
   */
  isSecurityRelatedError(event) {
    const securityKeywords = [
      'cors', 'csrf', 'xss', 'injection', 'unauthorized', 'forbidden',
      'security', 'authentication', 'authorization', 'token', 'session'
    ];
    
    const errorMessage = event.message?.toLowerCase() || '';
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if rejection is security related
   * @param {PromiseRejectionEvent} event - Rejection event
   * @returns {boolean} Is security related
   */
  isSecurityRelatedRejection(event) {
    const reason = event.reason?.toString()?.toLowerCase() || '';
    const securityKeywords = [
      'unauthorized', 'forbidden', 'cors', 'csrf', 'security', 'auth'
    ];
    
    return securityKeywords.some(keyword => reason.includes(keyword));
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
   * Escalate severity level
   * @param {string} severity - Current severity
   * @returns {string} Escalated severity
   */
  escalateSeverity(severity) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(severity);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  /**
   * Update metrics
   * @param {Object} alert - Alert to update metrics with
   */
  updateMetrics(alert) {
    this.metrics.totalAlerts++;
    this.metrics[`${alert.severity}Alerts`]++;
    this.metrics.lastAlertTime = alert.timestamp;
    
    // Update trends
    this.metrics.alertTrends.push({
      timestamp: alert.timestamp,
      severity: alert.severity,
      type: alert.type
    });
    
    // Keep only last 1000 trends
    if (this.metrics.alertTrends.length > 1000) {
      this.metrics.alertTrends = this.metrics.alertTrends.slice(-1000);
    }
  }

  /**
   * Generate alert ID
   * @returns {string} Unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const message = `🚨 Security Alert: ${alert.type} (${alert.severity})`;
    const data = {
      id: alert.id,
      timestamp: alert.timestamp,
      userId: alert.userId,
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
      new Notification(`Security Alert: ${alert.type}`, {
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
      
      securityAuditLogger.logSecurityEvent('alert_acknowledged', {
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
      
      securityAuditLogger.logSecurityEvent('alert_resolved', {
        alertId,
        alertType: alert.type,
        severity: alert.severity,
        resolution
      }, userId, 'low');
    }
  }

  /**
   * Get monitoring dashboard data
   * @returns {Object} Dashboard data
   */
  getDashboardData() {
    return {
      metrics: this.metrics,
      activeAlerts: this.alerts.filter(alert => !alert.resolved),
      recentAlerts: this.alerts.slice(-20),
      threatStatistics: threatDetectionSystem.getThreatStatistics(),
      systemHealth: this.collectSystemHealthMetrics(),
      monitoringStatus: {
        active: this.monitoringActive,
        alertChannels: this.alertChannels,
        thresholds: this.thresholds
      }
    };
  }

  /**
   * Setup alert processing
   */
  setupAlertProcessing() {
    // Process alerts every 30 seconds
    setInterval(() => {
      this.processPendingAlerts();
    }, 30000);
  }

  /**
   * Setup metrics collection
   */
  setupMetricsCollection() {
    // Collect metrics every 5 minutes
    setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Setup health checks
   */
  setupHealthChecks() {
    // Health check every minute
    setInterval(() => {
      this.performHealthCheck();
    }, 60000);
  }

  /**
   * Process pending alerts
   */
  processPendingAlerts() {
    const pendingAlerts = this.alerts.filter(alert => !alert.resolved);
    
    pendingAlerts.forEach(alert => {
      // Check for stale alerts
      const alertAge = Date.now() - new Date(alert.timestamp).getTime();
      if (alertAge > 24 * 60 * 60 * 1000 && alert.severity === 'low') {
        this.resolveAlert(alert.id, 'stale_alert');
      }
    });
  }

  /**
   * Collect metrics
   */
  collectMetrics() {
    const metrics = this.collectSystemHealthMetrics();
    
    securityAuditLogger.logSecurityEvent('metrics_collected', {
      metrics,
      alertCount: this.alerts.length,
      activeAlerts: this.alerts.filter(alert => !alert.resolved).length
    }, null, 'low');
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const healthStatus = {
      monitoringActive: this.monitoringActive,
      alertCount: this.alerts.length,
      criticalAlerts: this.alerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length,
      systemHealth: this.collectSystemHealthMetrics(),
      timestamp: new Date().toISOString()
    };

    if (healthStatus.criticalAlerts > 0) {
      this.createAlert('health_check_critical', 'critical', healthStatus);
    }
  }
}

// Export singleton instance
export const securityMonitoringSystem = new SecurityMonitoringSystem();

export default SecurityMonitoringSystem;
