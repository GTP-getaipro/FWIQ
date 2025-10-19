import { supabase } from '@/lib/customSupabaseClient';
import { analytics } from '@/lib/analytics';

/**
 * Outlook Monitoring and Alerting Service
 * Provides real-time monitoring, alerting, and health checks for Outlook integration
 */
export class OutlookMonitoringService {
  constructor(userId) {
    this.userId = userId;
    this.alertThresholds = {
      errorRate: 5, // 5% error rate threshold
      responseTime: 3000, // 3 second response time threshold
      consecutiveFailures: 3, // 3 consecutive failures
      authFailures: 1 // 1 authentication failure
    };
    this.activeAlerts = new Map();
    this.healthChecks = new Map();
  }

  /**
   * Perform health check on Outlook integration
   */
  async performHealthCheck() {
    const startTime = Date.now();
    const healthCheck = {
      userId: this.userId,
      timestamp: new Date().toISOString(),
      checks: {},
      overallStatus: 'healthy',
      issues: []
    };

    try {
      // Check integration status
      const integrationCheck = await this.checkIntegrationStatus();
      healthCheck.checks.integration = integrationCheck;

      // Check API connectivity
      const apiCheck = await this.checkApiConnectivity();
      healthCheck.checks.api = apiCheck;

      // Check recent error rates
      const errorCheck = await this.checkErrorRates();
      healthCheck.checks.errors = errorCheck;

      // Check performance metrics
      const performanceCheck = await this.checkPerformanceMetrics();
      healthCheck.checks.performance = performanceCheck;

      // Determine overall status
      const failedChecks = Object.values(healthCheck.checks).filter(check => check.status !== 'healthy');
      if (failedChecks.length > 0) {
        healthCheck.overallStatus = failedChecks.some(check => check.status === 'critical') ? 'critical' : 'warning';
        healthCheck.issues = failedChecks.map(check => check.message);
      }

      // Store health check result
      await this.storeHealthCheck(healthCheck);

      // Check for alerts
      await this.checkAlerts(healthCheck);

      return healthCheck;
    } catch (error) {
      console.error('Health check failed:', error);
      
      const failedHealthCheck = {
        ...healthCheck,
        overallStatus: 'critical',
        issues: ['Health check system failure'],
        error: error.message
      };

      await this.storeHealthCheck(failedHealthCheck);
      return failedHealthCheck;
    }
  }

  /**
   * Check integration status
   */
  async checkIntegrationStatus() {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('status, scopes, updated_at')
        .eq('user_id', this.userId)
        .eq('provider', 'outlook')
        .single();

      if (error || !data) {
        return {
          status: 'critical',
          message: 'Outlook integration not found',
          details: { error: error?.message }
        };
      }

      if (data.status !== 'active') {
        return {
          status: 'critical',
          message: 'Outlook integration is not active',
          details: { status: data.status }
        };
      }

      // Check if integration is recent (within last 24 hours)
      const lastUpdate = new Date(data.updated_at);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        return {
          status: 'warning',
          message: 'Outlook integration has not been updated recently',
          details: { hoursSinceUpdate: Math.round(hoursSinceUpdate) }
        };
      }

      return {
        status: 'healthy',
        message: 'Outlook integration is active and recent',
        details: { scopes: data.scopes.length }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'Failed to check integration status',
        details: { error: error.message }
      };
    }
  }

  /**
   * Check API connectivity
   */
  async checkApiConnectivity() {
    try {
      const startTime = Date.now();
      
      // Try to make a simple API call
      const { data, error } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('user_id', this.userId)
        .eq('provider', 'outlook')
        .eq('status', 'active')
        .single();

      if (error || !data?.access_token) {
        return {
          status: 'critical',
          message: 'No valid access token found',
          details: { error: error?.message }
        };
      }

      // Test API call
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: 'critical',
          message: 'Microsoft Graph API is not accessible',
          details: { 
            status: response.status,
            statusText: response.statusText,
            duration 
          }
        };
      }

      if (duration > this.alertThresholds.responseTime) {
        return {
          status: 'warning',
          message: 'API response time is slow',
          details: { duration }
        };
      }

      return {
        status: 'healthy',
        message: 'Microsoft Graph API is accessible',
        details: { duration }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'API connectivity check failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Check recent error rates
   */
  async checkErrorRates() {
    try {
      const timeRangeStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour
      
      const { data, error } = await supabase
        .from('outlook_api_metrics')
        .select('status')
        .eq('user_id', this.userId)
        .gte('timestamp', timeRangeStart);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          status: 'healthy',
          message: 'No recent API calls to analyze',
          details: { totalCalls: 0 }
        };
      }

      const totalCalls = data.length;
      const failedCalls = data.filter(m => m.status < 200 || m.status >= 300).length;
      const errorRate = (failedCalls / totalCalls) * 100;

      if (errorRate > this.alertThresholds.errorRate) {
        return {
          status: 'warning',
          message: `Error rate is above threshold: ${errorRate.toFixed(1)}%`,
          details: { errorRate, totalCalls, failedCalls }
        };
      }

      return {
        status: 'healthy',
        message: `Error rate is within acceptable range: ${errorRate.toFixed(1)}%`,
        details: { errorRate, totalCalls, failedCalls }
      };
    } catch (error) {
      return {
        status: 'warning',
        message: 'Failed to check error rates',
        details: { error: error.message }
      };
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics() {
    try {
      const timeRangeStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour
      
      const { data, error } = await supabase
        .from('outlook_performance_metrics')
        .select('duration, success')
        .eq('user_id', this.userId)
        .gte('timestamp', timeRangeStart);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          status: 'healthy',
          message: 'No recent performance data to analyze',
          details: { totalOperations: 0 }
        };
      }

      const totalOperations = data.length;
      const avgDuration = data.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
      const failedOperations = data.filter(m => !m.success).length;
      const failureRate = (failedOperations / totalOperations) * 100;

      const issues = [];
      if (avgDuration > this.alertThresholds.responseTime) {
        issues.push(`Average response time is slow: ${avgDuration.toFixed(0)}ms`);
      }
      if (failureRate > this.alertThresholds.errorRate) {
        issues.push(`Operation failure rate is high: ${failureRate.toFixed(1)}%`);
      }

      if (issues.length > 0) {
        return {
          status: 'warning',
          message: issues.join(', '),
          details: { avgDuration, failureRate, totalOperations }
        };
      }

      return {
        status: 'healthy',
        message: 'Performance metrics are within acceptable ranges',
        details: { avgDuration, failureRate, totalOperations }
      };
    } catch (error) {
      return {
        status: 'warning',
        message: 'Failed to check performance metrics',
        details: { error: error.message }
      };
    }
  }

  /**
   * Store health check result
   */
  async storeHealthCheck(healthCheck) {
    try {
      await supabase
        .from('outlook_health_checks')
        .insert({
          user_id: this.userId,
          overall_status: healthCheck.overallStatus,
          checks: healthCheck.checks,
          issues: healthCheck.issues,
          timestamp: healthCheck.timestamp,
          duration: Date.now() - new Date(healthCheck.timestamp).getTime()
        });
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  /**
   * Check for alerts based on health check
   */
  async checkAlerts(healthCheck) {
    const alerts = [];

    // Check for critical issues
    if (healthCheck.overallStatus === 'critical') {
      alerts.push({
        type: 'critical',
        title: 'Critical Outlook Integration Issue',
        message: healthCheck.issues.join(', '),
        timestamp: new Date().toISOString(),
        userId: this.userId
      });
    }

    // Check for warning issues
    if (healthCheck.overallStatus === 'warning') {
      alerts.push({
        type: 'warning',
        title: 'Outlook Integration Warning',
        message: healthCheck.issues.join(', '),
        timestamp: new Date().toISOString(),
        userId: this.userId
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.createAlert(alert);
    }

    return alerts;
  }

  /**
   * Create alert
   */
  async createAlert(alert) {
    try {
      const alertId = `${alert.type}_${alert.userId}_${Date.now()}`;
      
      // Check if similar alert already exists
      const existingAlert = this.activeAlerts.get(alertId);
      if (existingAlert) {
        return existingAlert;
      }

      // Store alert
      await supabase
        .from('outlook_alerts')
        .insert({
          id: alertId,
          user_id: alert.userId,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp,
          status: 'active'
        });

      // Track in analytics
      analytics.trackBusinessEvent('outlook_alert_created', {
        type: alert.type,
        title: alert.title
      });

      // Store in memory
      this.activeAlerts.set(alertId, alert);

      return alert;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      const { data, error } = await supabase
        .from('outlook_alerts')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'active')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, resolution = 'manual') {
    try {
      await supabase
        .from('outlook_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution
        })
        .eq('id', alertId)
        .eq('user_id', this.userId);

      // Remove from memory
      this.activeAlerts.delete(alertId);

      // Track in analytics
      analytics.trackBusinessEvent('outlook_alert_resolved', {
        alertId,
        resolution
      });

      return true;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  /**
   * Get health check history
   */
  async getHealthCheckHistory(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('outlook_health_checks')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get health check history:', error);
      return [];
    }
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs = 300000) { // 5 minutes default
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Monitoring check failed:', error);
      }
    }, intervalMs);

    console.log(`Outlook monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Outlook monitoring stopped');
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus() {
    return {
      isMonitoring: !!this.monitoringInterval,
      activeAlerts: this.activeAlerts.size,
      lastHealthCheck: this.healthChecks.get('last')?.timestamp
    };
  }
}

export default OutlookMonitoringService;
