/**
 * Feature Flag System for Safe Rollout
 * Controls the gradual rollout of the integrated profile system
 */
export class FeatureFlagManager {
  constructor() {
    this.flags = new Map();
    this.loadFlags();
  }

  /**
   * Load feature flags from environment and database
   */
  loadFlags() {
    // Default flags
    this.flags.set('INTEGRATED_PROFILE_SYSTEM', {
      enabled: process.env.INTEGRATED_PROFILE_SYSTEM === 'true',
      rolloutPercentage: parseInt(process.env.INTEGRATED_PROFILE_ROLLOUT_PERCENTAGE || '0'),
      canaryUsers: process.env.INTEGRATED_PROFILE_CANARY_USERS?.split(',') || [],
      disabledUsers: process.env.INTEGRATED_PROFILE_DISABLED_USERS?.split(',') || [],
      environment: process.env.NODE_ENV || 'development'
    });

    this.flags.set('ENHANCED_TEMPLATE_MANAGER', {
      enabled: process.env.ENHANCED_TEMPLATE_MANAGER === 'true',
      rolloutPercentage: parseInt(process.env.ENHANCED_TEMPLATE_ROLLOUT_PERCENTAGE || '0'),
      canaryUsers: process.env.ENHANCED_TEMPLATE_CANARY_USERS?.split(',') || [],
      disabledUsers: process.env.ENHANCED_TEMPLATE_DISABLED_USERS?.split(',') || [],
      environment: process.env.NODE_ENV || 'development'
    });

    this.flags.set('ROBUST_ERROR_HANDLER', {
      enabled: process.env.ROBUST_ERROR_HANDLER === 'true',
      rolloutPercentage: parseInt(process.env.ROBUST_ERROR_ROLLOUT_PERCENTAGE || '0'),
      canaryUsers: process.env.ROBUST_ERROR_CANARY_USERS?.split(',') || [],
      disabledUsers: process.env.ROBUST_ERROR_DISABLED_USERS?.split(',') || [],
      environment: process.env.NODE_ENV || 'development'
    });

    this.flags.set('PERFORMANCE_OPTIMIZER', {
      enabled: process.env.PERFORMANCE_OPTIMIZER === 'true',
      rolloutPercentage: parseInt(process.env.PERFORMANCE_OPTIMIZER_ROLLOUT_PERCENTAGE || '0'),
      canaryUsers: process.env.PERFORMANCE_OPTIMIZER_CANARY_USERS?.split(',') || [],
      disabledUsers: process.env.PERFORMANCE_OPTIMIZER_DISABLED_USERS?.split(',') || [],
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Check if a feature is enabled for a specific user
   * @param {string} featureName - Name of the feature
   * @param {string} userId - User ID to check
   * @returns {boolean} - Whether the feature is enabled for the user
   */
  isEnabled(featureName, userId) {
    const flag = this.flags.get(featureName);
    if (!flag) return false;

    // Check if explicitly disabled for this user
    if (flag.disabledUsers.includes(userId)) return false;

    // Check if explicitly enabled for this user (canary)
    if (flag.canaryUsers.includes(userId)) return true;

    // Check rollout percentage
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;

    // Use user ID hash for consistent rollout
    const userHash = this.hashUserId(userId);
    return userHash < flag.rolloutPercentage;
  }

  /**
   * Hash user ID for consistent rollout percentage
   * @param {string} userId - User ID to hash
   * @returns {number} - Hash value between 0-99
   */
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get feature flag status for a user
   * @param {string} userId - User ID
   * @returns {object} - Feature flag status
   */
  getFeatureStatus(userId) {
    const status = {};
    for (const [featureName, flag] of this.flags) {
      status[featureName] = {
        enabled: this.isEnabled(featureName, userId),
        rolloutPercentage: flag.rolloutPercentage,
        isCanary: flag.canaryUsers.includes(userId),
        isDisabled: flag.disabledUsers.includes(userId),
        environment: flag.environment
      };
    }
    return status;
  }

  /**
   * Update feature flag rollout percentage
   * @param {string} featureName - Feature name
   * @param {number} percentage - Rollout percentage (0-100)
   */
  updateRolloutPercentage(featureName, percentage) {
    const flag = this.flags.get(featureName);
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.flags.set(featureName, flag);
    }
  }

  /**
   * Add user to canary list
   * @param {string} featureName - Feature name
   * @param {string} userId - User ID
   */
  addCanaryUser(featureName, userId) {
    const flag = this.flags.get(featureName);
    if (flag && !flag.canaryUsers.includes(userId)) {
      flag.canaryUsers.push(userId);
      this.flags.set(featureName, flag);
    }
  }

  /**
   * Remove user from canary list
   * @param {string} featureName - Feature name
   * @param {string} userId - User ID
   */
  removeCanaryUser(featureName, userId) {
    const flag = this.flags.get(featureName);
    if (flag) {
      flag.canaryUsers = flag.canaryUsers.filter(id => id !== userId);
      this.flags.set(featureName, flag);
    }
  }

  /**
   * Add user to disabled list
   * @param {string} featureName - Feature name
   * @param {string} userId - User ID
   */
  addDisabledUser(featureName, userId) {
    const flag = this.flags.get(featureName);
    if (flag && !flag.disabledUsers.includes(userId)) {
      flag.disabledUsers.push(userId);
      this.flags.set(featureName, flag);
    }
  }

  /**
   * Remove user from disabled list
   * @param {string} featureName - Feature name
   * @param {string} userId - User ID
   */
  removeDisabledUser(featureName, userId) {
    const flag = this.flags.get(featureName);
    if (flag) {
      flag.disabledUsers = flag.disabledUsers.filter(id => id !== userId);
      this.flags.set(featureName, flag);
    }
  }

  /**
   * Get all feature flags
   * @returns {Map} - All feature flags
   */
  getAllFlags() {
    return new Map(this.flags);
  }

  /**
   * Reset all feature flags to defaults
   */
  resetFlags() {
    this.flags.clear();
    this.loadFlags();
  }
}

/**
 * Monitoring and Alerting System
 * Tracks system performance and triggers alerts based on SLOs
 */
export class MonitoringSystem {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.slos = {
      buildLatencyP95: 400, // ms
      buildErrorRate: 0.5, // percentage
      cacheHitRate: 85, // percentage
      templateSelectionLatencyP95: 80 // ms
    };
  }

  /**
   * Record a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} tags - Metric tags
   */
  recordMetric(name, value, tags = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };
    
    this.metrics.get(name).push(metric);
    
    // Keep only last 1000 metrics per name
    if (this.metrics.get(name).length > 1000) {
      this.metrics.get(name).shift();
    }
    
    // Check for alerts
    this.checkAlerts(name, value, tags);
  }

  /**
   * Record a timing metric
   * @param {string} name - Metric name
   * @param {number} startTime - Start time
   * @param {object} tags - Metric tags
   */
  recordTiming(name, startTime, tags = {}) {
    const duration = Date.now() - startTime;
    this.recordMetric(name, duration, tags);
  }

  /**
   * Record an error
   * @param {string} errorType - Error type
   * @param {string} context - Error context
   * @param {object} metadata - Error metadata
   */
  recordError(errorType, context, metadata = {}) {
    this.recordMetric('errors', 1, {
      errorType,
      context,
      ...metadata
    });
  }

  /**
   * Check for alerts based on metrics
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} tags - Metric tags
   */
  checkAlerts(name, value, tags) {
    const alerts = this.alerts.get(name) || [];
    
    alerts.forEach(alert => {
      if (alert.condition(value, tags)) {
        this.triggerAlert(alert, value, tags);
      }
    });
  }

  /**
   * Add an alert
   * @param {string} metricName - Metric name to monitor
   * @param {string} alertName - Alert name
   * @param {function} condition - Alert condition function
   * @param {function} handler - Alert handler function
   */
  addAlert(metricName, alertName, condition, handler) {
    if (!this.alerts.has(metricName)) {
      this.alerts.set(metricName, []);
    }
    
    this.alerts.get(metricName).push({
      name: alertName,
      condition,
      handler
    });
  }

  /**
   * Trigger an alert
   * @param {object} alert - Alert configuration
   * @param {number} value - Metric value that triggered the alert
   * @param {object} tags - Metric tags
   */
  triggerAlert(alert, value, tags) {
    console.warn(`🚨 Alert triggered: ${alert.name}`, {
      value,
      tags,
      timestamp: new Date().toISOString()
    });
    
    if (alert.handler) {
      alert.handler(value, tags);
    }
  }

  /**
   * Get metric statistics
   * @param {string} name - Metric name
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {object} - Metric statistics
   */
  getMetricStats(name, timeWindow = 300000) { // 5 minutes default
    const metrics = this.metrics.get(name) || [];
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }
    
    const values = recentMetrics.map(m => m.value);
    values.sort((a, b) => a - b);
    
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = values[0];
    const max = values[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = values[p95Index];
    
    return { count, avg, min, max, p95 };
  }

  /**
   * Get system health status
   * @returns {object} - System health status
   */
  getSystemHealth() {
    const buildLatency = this.getMetricStats('build_latency');
    const buildErrors = this.getMetricStats('errors');
    const cacheHits = this.getMetricStats('cache_hits');
    const cacheMisses = this.getMetricStats('cache_misses');
    
    const cacheHitRate = cacheHits.count + cacheMisses.count > 0 
      ? (cacheHits.count / (cacheHits.count + cacheMisses.count)) * 100 
      : 0;
    
    const buildErrorRate = buildErrors.count > 0 
      ? (buildErrors.count / (buildErrors.count + buildLatency.count)) * 100 
      : 0;
    
    const health = {
      buildLatency: {
        p95: buildLatency.p95,
        status: buildLatency.p95 <= this.slos.buildLatencyP95 ? 'healthy' : 'warning'
      },
      buildErrorRate: {
        rate: buildErrorRate,
        status: buildErrorRate <= this.slos.buildErrorRate ? 'healthy' : 'warning'
      },
      cacheHitRate: {
        rate: cacheHitRate,
        status: cacheHitRate >= this.slos.cacheHitRate ? 'healthy' : 'warning'
      },
      overall: 'healthy'
    };
    
    // Determine overall health
    if (health.buildLatency.status === 'warning' || 
        health.buildErrorRate.status === 'warning' || 
        health.cacheHitRate.status === 'warning') {
      health.overall = 'warning';
    }
    
    return health;
  }

  /**
   * Setup default alerts
   */
  setupDefaultAlerts() {
    // Build latency alert
    this.addAlert(
      'build_latency',
      'High Build Latency',
      (value) => value > this.slos.buildLatencyP95,
      (value) => console.warn(`Build latency ${value}ms exceeds SLO of ${this.slos.buildLatencyP95}ms`)
    );
    
    // Build error rate alert
    this.addAlert(
      'errors',
      'High Error Rate',
      (value, tags) => {
        const errorStats = this.getMetricStats('errors');
        const buildStats = this.getMetricStats('build_latency');
        const errorRate = errorStats.count > 0 
          ? (errorStats.count / (errorStats.count + buildStats.count)) * 100 
          : 0;
        return errorRate > this.slos.buildErrorRate;
      },
      (value) => console.warn(`Error rate ${value}% exceeds SLO of ${this.slos.buildErrorRate}%`)
    );
    
    // Cache hit rate alert
    this.addAlert(
      'cache_misses',
      'Low Cache Hit Rate',
      (value) => {
        const hitStats = this.getMetricStats('cache_hits');
        const missStats = this.getMetricStats('cache_misses');
        const hitRate = hitStats.count + missStats.count > 0 
          ? (hitStats.count / (hitStats.count + missStats.count)) * 100 
          : 0;
        return hitRate < this.slos.cacheHitRate;
      },
      (value) => console.warn(`Cache hit rate ${value}% below SLO of ${this.slos.cacheHitRate}%`)
    );
  }
}

/**
 * Rollout Manager
 * Manages the gradual rollout of features
 */
export class RolloutManager {
  constructor() {
    this.featureFlags = new FeatureFlagManager();
    this.monitoring = new MonitoringSystem();
    this.rolloutHistory = [];
    
    // Setup default monitoring
    this.monitoring.setupDefaultAlerts();
  }

  /**
   * Start a gradual rollout
   * @param {string} featureName - Feature name
   * @param {number} initialPercentage - Initial rollout percentage
   * @param {object} options - Rollout options
   */
  startRollout(featureName, initialPercentage = 5, options = {}) {
    const rollout = {
      featureName,
      startTime: Date.now(),
      currentPercentage: initialPercentage,
      targetPercentage: options.targetPercentage || 100,
      stepSize: options.stepSize || 5,
      stepInterval: options.stepInterval || 30 * 60 * 1000, // 30 minutes
      canaryUsers: options.canaryUsers || [],
      disabledUsers: options.disabledUsers || [],
      status: 'active',
      steps: []
    };
    
    this.rolloutHistory.push(rollout);
    this.featureFlags.updateRolloutPercentage(featureName, initialPercentage);
    
    // Add canary users
    rollout.canaryUsers.forEach(userId => {
      this.featureFlags.addCanaryUser(featureName, userId);
    });
    
    // Add disabled users
    rollout.disabledUsers.forEach(userId => {
      this.featureFlags.addDisabledUser(featureName, userId);
    });
    
    console.log(`🚀 Started rollout for ${featureName} at ${initialPercentage}%`);
    
    return rollout;
  }

  /**
   * Advance rollout to next step
   * @param {string} featureName - Feature name
   * @returns {boolean} - Whether rollout was advanced
   */
  advanceRollout(featureName) {
    const rollout = this.rolloutHistory.find(r => 
      r.featureName === featureName && r.status === 'active'
    );
    
    if (!rollout) return false;
    
    const health = this.monitoring.getSystemHealth();
    
    // Check if system is healthy enough to advance
    if (health.overall === 'warning') {
      console.warn(`⚠️ Rollout paused for ${featureName} due to system health issues`);
      return false;
    }
    
    const nextPercentage = Math.min(
      rollout.currentPercentage + rollout.stepSize,
      rollout.targetPercentage
    );
    
    rollout.currentPercentage = nextPercentage;
    rollout.steps.push({
      percentage: nextPercentage,
      timestamp: Date.now(),
      health: health.overall
    });
    
    this.featureFlags.updateRolloutPercentage(featureName, nextPercentage);
    
    console.log(`📈 Advanced rollout for ${featureName} to ${nextPercentage}%`);
    
    // Check if rollout is complete
    if (nextPercentage >= rollout.targetPercentage) {
      rollout.status = 'completed';
      rollout.endTime = Date.now();
      console.log(`✅ Rollout completed for ${featureName}`);
    }
    
    return true;
  }

  /**
   * Pause rollout
   * @param {string} featureName - Feature name
   * @param {string} reason - Reason for pausing
   */
  pauseRollout(featureName, reason = 'Manual pause') {
    const rollout = this.rolloutHistory.find(r => 
      r.featureName === featureName && r.status === 'active'
    );
    
    if (rollout) {
      rollout.status = 'paused';
      rollout.pauseReason = reason;
      rollout.pauseTime = Date.now();
      console.log(`⏸️ Rollout paused for ${featureName}: ${reason}`);
    }
  }

  /**
   * Resume rollout
   * @param {string} featureName - Feature name
   */
  resumeRollout(featureName) {
    const rollout = this.rolloutHistory.find(r => 
      r.featureName === featureName && r.status === 'paused'
    );
    
    if (rollout) {
      rollout.status = 'active';
      rollout.resumeTime = Date.now();
      console.log(`▶️ Rollout resumed for ${featureName}`);
    }
  }

  /**
   * Rollback rollout
   * @param {string} featureName - Feature name
   * @param {string} reason - Reason for rollback
   */
  rollbackRollout(featureName, reason = 'Manual rollback') {
    const rollout = this.rolloutHistory.find(r => 
      r.featureName === featureName && r.status === 'active'
    );
    
    if (rollout) {
      rollout.status = 'rolled_back';
      rollout.rollbackReason = reason;
      rollout.rollbackTime = Date.now();
      this.featureFlags.updateRolloutPercentage(featureName, 0);
      console.log(`🔄 Rollout rolled back for ${featureName}: ${reason}`);
    }
  }

  /**
   * Get rollout status
   * @param {string} featureName - Feature name
   * @returns {object} - Rollout status
   */
  getRolloutStatus(featureName) {
    const rollout = this.rolloutHistory.find(r => r.featureName === featureName);
    const flag = this.featureFlags.flags.get(featureName);
    const health = this.monitoring.getSystemHealth();
    
    return {
      featureName,
      rollout,
      flag,
      health,
      canAdvance: health.overall === 'healthy'
    };
  }

  /**
   * Get all rollout statuses
   * @returns {array} - All rollout statuses
   */
  getAllRolloutStatuses() {
    const statuses = [];
    for (const [featureName] of this.featureFlags.flags) {
      statuses.push(this.getRolloutStatus(featureName));
    }
    return statuses;
  }
}

// Export singleton instances
export const featureFlags = new FeatureFlagManager();
export const monitoring = new MonitoringSystem();
export const rolloutManager = new RolloutManager();
