/**
 * Queue Monitor
 * Real-time monitoring and alerting for queue system
 */

import { EmailQueue } from './emailQueue';
import { logger } from './logger';
import { queueProcessor } from './queueProcessor';
import { deadLetterQueue } from './deadLetterQueue';

export class QueueMonitor {
  constructor(options = {}) {
    this.emailQueue = new EmailQueue();
    this.logger = logger;
    this.queueProcessor = queueProcessor;
    this.deadLetterQueue = deadLetterQueue;
    
    // Configuration
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds
    this.alertThresholds = {
      queueSize: options.queueSizeThreshold || 100,
      processingTime: options.processingTimeThreshold || 300000, // 5 minutes
      failureRate: options.failureRateThreshold || 0.1, // 10%
      deadLetterRate: options.deadLetterRateThreshold || 0.05 // 5%
    };
    
    // State
    this.isMonitoring = false;
    this.monitoringIntervalId = null;
    this.alerts = new Map();
    this.metrics = {
      queueSize: [],
      processingTime: [],
      failureRate: [],
      throughput: [],
      deadLetterCount: []
    };
    
    // Alert handlers
    this.alertHandlers = new Map();
    this.registerDefaultAlertHandlers();
  }

  registerDefaultAlertHandlers() {
    this.alertHandlers.set('queue_size_high', this.handleQueueSizeAlert.bind(this));
    this.alertHandlers.set('processing_time_high', this.handleProcessingTimeAlert.bind(this));
    this.alertHandlers.set('failure_rate_high', this.handleFailureRateAlert.bind(this));
    this.alertHandlers.set('dead_letter_rate_high', this.handleDeadLetterRateAlert.bind(this));
    this.alertHandlers.set('processor_down', this.handleProcessorDownAlert.bind(this));
  }

  registerAlertHandler(alertType, handler) {
    this.alertHandlers.set(alertType, handler);
    this.logger.info(`Registered alert handler for: ${alertType}`);
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      this.logger.warn('Queue monitor is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting queue monitoring', {
      interval: this.monitoringInterval,
      thresholds: this.alertThresholds
    });

    // Start monitoring interval
    this.monitoringIntervalId = setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);

    // Initial metrics collection
    await this.collectMetrics();
  }

  async stopMonitoring() {
    if (!this.isMonitoring) {
      this.logger.warn('Queue monitor is not running');
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.logger.info('Queue monitoring stopped');
  }

  async collectMetrics() {
    try {
      const timestamp = new Date();
      
      // Get queue stats
      const queueStats = await this.emailQueue.getQueueStats();
      
      // Get processor stats
      const processorStats = this.queueProcessor.getStats();
      
      // Get dead letter queue stats
      const dlqStats = await this.deadLetterQueue.getDeadLetterQueueStats();
      
      // Calculate metrics
      const metrics = {
        timestamp,
        queueSize: queueStats?.total || 0,
        processingTime: this.calculateAverageProcessingTime(queueStats),
        failureRate: this.calculateFailureRate(queueStats),
        throughput: this.calculateThroughput(processorStats),
        deadLetterCount: dlqStats?.total || 0,
        activeWorkers: processorStats.activeWorkers || 0,
        isProcessing: processorStats.isProcessing || false
      };

      // Store metrics
      this.storeMetrics(metrics);
      
      // Check for alerts
      await this.checkAlerts(metrics);
      
      this.logger.debug('Metrics collected', metrics);

    } catch (error) {
      this.logger.error('Failed to collect metrics', { error: error.message });
    }
  }

  calculateAverageProcessingTime(queueStats) {
    return queueStats?.averageProcessingTime || 0;
  }

  calculateFailureRate(queueStats) {
    if (!queueStats || queueStats.total === 0) return 0;
    return (queueStats.failed || 0) / queueStats.total;
  }

  calculateThroughput(processorStats) {
    if (!processorStats.startTime) return 0;
    const uptime = (new Date() - processorStats.startTime) / 1000; // seconds
    return uptime > 0 ? (processorStats.processed || 0) / uptime : 0;
  }

  storeMetrics(metrics) {
    const timestamp = metrics.timestamp.getTime();
    
    // Store with sliding window (keep last 100 points)
    Object.keys(metrics).forEach(key => {
      if (key !== 'timestamp' && this.metrics[key]) {
        this.metrics[key].push({ timestamp, value: metrics[key] });
        
        // Keep only last 100 points
        if (this.metrics[key].length > 100) {
          this.metrics[key] = this.metrics[key].slice(-100);
        }
      }
    });
  }

  async checkAlerts(metrics) {
    const alerts = [];

    // Queue size alert
    if (metrics.queueSize > this.alertThresholds.queueSize) {
      alerts.push({
        type: 'queue_size_high',
        severity: 'warning',
        message: `Queue size is high: ${metrics.queueSize} items`,
        value: metrics.queueSize,
        threshold: this.alertThresholds.queueSize
      });
    }

    // Processing time alert
    if (metrics.processingTime > this.alertThresholds.processingTime) {
      alerts.push({
        type: 'processing_time_high',
        severity: 'warning',
        message: `Processing time is high: ${Math.round(metrics.processingTime / 1000)}s`,
        value: metrics.processingTime,
        threshold: this.alertThresholds.processingTime
      });
    }

    // Failure rate alert
    if (metrics.failureRate > this.alertThresholds.failureRate) {
      alerts.push({
        type: 'failure_rate_high',
        severity: 'critical',
        message: `Failure rate is high: ${(metrics.failureRate * 100).toFixed(1)}%`,
        value: metrics.failureRate,
        threshold: this.alertThresholds.failureRate
      });
    }

    // Dead letter rate alert
    if (metrics.deadLetterCount > 0) {
      const deadLetterRate = metrics.deadLetterCount / Math.max(metrics.queueSize, 1);
      if (deadLetterRate > this.alertThresholds.deadLetterRate) {
        alerts.push({
          type: 'dead_letter_rate_high',
          severity: 'warning',
          message: `Dead letter rate is high: ${(deadLetterRate * 100).toFixed(1)}%`,
          value: deadLetterRate,
          threshold: this.alertThresholds.deadLetterRate
        });
      }
    }

    // Processor down alert
    if (!metrics.isProcessing && metrics.queueSize > 0) {
      alerts.push({
        type: 'processor_down',
        severity: 'critical',
        message: 'Queue processor is not running but items are pending',
        value: metrics.queueSize
      });
    }

    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
  }

  async processAlert(alert) {
    const alertKey = `${alert.type}_${Math.floor(Date.now() / 60000)}`; // Group by minute
    
    // Check if we've already sent this alert recently
    if (this.alerts.has(alertKey)) {
      return;
    }

    // Store alert
    this.alerts.set(alertKey, {
      ...alert,
      timestamp: new Date(),
      id: alertKey
    });

    // Clean up old alerts (older than 1 hour)
    this.cleanupOldAlerts();

    // Execute alert handler
    const handler = this.alertHandlers.get(alert.type);
    if (handler) {
      try {
        await handler(alert);
      } catch (error) {
        this.logger.error('Alert handler failed', {
          alertType: alert.type,
          error: error.message
        });
      }
    }

    this.logger.warn('Alert triggered', alert);
  }

  cleanupOldAlerts() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [key, alert] of this.alerts) {
      if (alert.timestamp.getTime() < oneHourAgo) {
        this.alerts.delete(key);
      }
    }
  }

  // Default alert handlers
  async handleQueueSizeAlert(alert) {
    this.logger.error('QUEUE SIZE ALERT', {
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    });
    
    // Could send notifications, scale workers, etc.
  }

  async handleProcessingTimeAlert(alert) {
    this.logger.error('PROCESSING TIME ALERT', {
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    });
  }

  async handleFailureRateAlert(alert) {
    this.logger.error('FAILURE RATE ALERT', {
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    });
  }

  async handleDeadLetterRateAlert(alert) {
    this.logger.error('DEAD LETTER RATE ALERT', {
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold
    });
  }

  async handleProcessorDownAlert(alert) {
    this.logger.error('PROCESSOR DOWN ALERT', {
      message: alert.message,
      value: alert.value
    });
    
    // Attempt to restart processor
    try {
      await this.queueProcessor.restartProcessing();
      this.logger.info('Queue processor restarted automatically');
    } catch (error) {
      this.logger.error('Failed to restart queue processor', { error: error.message });
    }
  }

  // Metrics and reporting
  getMetrics(timeRange = '1h') {
    const now = Date.now();
    let startTime;
    
    switch (timeRange) {
      case '1h':
        startTime = now - (60 * 60 * 1000);
        break;
      case '6h':
        startTime = now - (6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (60 * 60 * 1000);
    }

    const filteredMetrics = {};
    
    Object.keys(this.metrics).forEach(key => {
      filteredMetrics[key] = this.metrics[key].filter(
        point => point.timestamp >= startTime
      );
    });

    return filteredMetrics;
  }

  getCurrentStatus() {
    const latestMetrics = {};
    
    Object.keys(this.metrics).forEach(key => {
      const points = this.metrics[key];
      if (points.length > 0) {
        latestMetrics[key] = points[points.length - 1].value;
      }
    });

    return {
      isMonitoring: this.isMonitoring,
      latestMetrics,
      activeAlerts: Array.from(this.alerts.values()),
      thresholds: this.alertThresholds,
      timestamp: new Date().toISOString()
    };
  }

  getHealthScore() {
    const status = this.getCurrentStatus();
    const metrics = status.latestMetrics;
    
    let score = 100;
    
    // Deduct points for issues
    if (metrics.queueSize > this.alertThresholds.queueSize) {
      score -= Math.min(30, (metrics.queueSize / this.alertThresholds.queueSize) * 15);
    }
    
    if (metrics.failureRate > this.alertThresholds.failureRate) {
      score -= Math.min(40, metrics.failureRate * 200);
    }
    
    if (metrics.processingTime > this.alertThresholds.processingTime) {
      score -= Math.min(20, (metrics.processingTime / this.alertThresholds.processingTime) * 10);
    }
    
    if (!metrics.isProcessing && metrics.queueSize > 0) {
      score -= 50; // Major penalty for processor being down
    }
    
    return Math.max(0, Math.round(score));
  }

  // Configuration methods
  updateAlertThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    this.logger.info('Alert thresholds updated', this.alertThresholds);
  }

  updateMonitoringInterval(interval) {
    this.monitoringInterval = interval;
    
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
    
    this.logger.info('Monitoring interval updated', { interval });
  }

  // Dashboard data
  getDashboardData() {
    const metrics = this.getMetrics('1h');
    const status = this.getCurrentStatus();
    const healthScore = this.getHealthScore();
    
    return {
      healthScore,
      status: this.getHealthStatus(healthScore),
      metrics: {
        current: status.latestMetrics,
        trends: this.calculateTrends(metrics),
        summary: this.calculateSummary(metrics)
      },
      alerts: status.activeAlerts,
      timestamp: new Date().toISOString()
    };
  }

  getHealthStatus(score) {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'degraded';
    return 'critical';
  }

  calculateTrends(metrics) {
    const trends = {};
    
    Object.keys(metrics).forEach(key => {
      const points = metrics[key];
      if (points.length >= 2) {
        const first = points[0].value;
        const last = points[points.length - 1].value;
        const change = last - first;
        const percentChange = first > 0 ? (change / first) * 100 : 0;
        
        trends[key] = {
          change,
          percentChange,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      }
    });
    
    return trends;
  }

  calculateSummary(metrics) {
    const summary = {};
    
    Object.keys(metrics).forEach(key => {
      const points = metrics[key];
      if (points.length > 0) {
        const values = points.map(p => p.value);
        summary[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length
        };
      }
    });
    
    return summary;
  }

  // Cleanup
  async cleanup() {
    await this.stopMonitoring();
    this.alerts.clear();
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });
    this.logger.info('Queue monitor cleaned up');
  }
}

// Export a default instance
export const queueMonitor = new QueueMonitor();
