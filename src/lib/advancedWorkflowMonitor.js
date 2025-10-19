/**
 * Advanced Workflow Performance Monitoring System
 * 
 * Provides comprehensive monitoring, metrics collection, and performance analysis
 * for workflow execution. Integrates with existing WorkflowMonitor service.
 */

import { supabase } from './customSupabaseClient.js';

export class AdvancedWorkflowMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      executionTime: 30000, // 30 seconds
      errorRate: 0.1, // 10%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
      queueDepth: 100
    };
    this.realTimeSubscriptions = new Map();
    this.performanceHistory = new Map();
    this.isMonitoring = false;
  }

  /**
   * Start comprehensive workflow monitoring
   */
  async startMonitoring(userId) {
    try {
      this.isMonitoring = true;
      
      // Initialize metrics collection
      await this.initializeMetrics(userId);
      
      // Start real-time monitoring
      await this.startRealTimeMonitoring(userId);
      
      // Setup performance tracking
      await this.setupPerformanceTracking(userId);
      
      console.log('Advanced workflow monitoring started');
      return { success: true, message: 'Monitoring started successfully' };
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop workflow monitoring
   */
  async stopMonitoring(userId) {
    try {
      this.isMonitoring = false;
      
      // Stop real-time subscriptions
      for (const [key, subscription] of this.realTimeSubscriptions) {
        await subscription.unsubscribe();
      }
      this.realTimeSubscriptions.clear();
      
      // Clear metrics
      this.metrics.clear();
      this.alerts.clear();
      
      console.log('Advanced workflow monitoring stopped');
      return { success: true, message: 'Monitoring stopped successfully' };
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize metrics collection for workflows
   */
  async initializeMetrics(userId) {
    try {
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('id, name, status')
        .eq('user_id', userId);

      if (error) throw error;

      // Initialize metrics for each workflow
      for (const workflow of workflows) {
        this.metrics.set(workflow.id, {
          workflowId: workflow.id,
          workflowName: workflow.name,
          executions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0,
          totalExecutionTime: 0,
          errorRate: 0,
          lastExecution: null,
          performanceScore: 100,
          resourceUsage: {
            memory: 0,
            cpu: 0,
            network: 0
          },
          alerts: []
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start real-time monitoring with Supabase subscriptions
   */
  async startRealTimeMonitoring(userId) {
    try {
      // Monitor workflow executions
      const executionSubscription = supabase
        .channel('workflow-executions')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'workflow_executions',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleExecutionUpdate(payload);
        })
        .subscribe();

      this.realTimeSubscriptions.set('executions', executionSubscription);

      // Monitor workflow status changes
      const statusSubscription = supabase
        .channel('workflow-status')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'workflows',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleStatusUpdate(payload);
        })
        .subscribe();

      this.realTimeSubscriptions.set('status', statusSubscription);

      return { success: true };
    } catch (error) {
      console.error('Failed to start real-time monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle workflow execution updates
   */
  async handleExecutionUpdate(payload) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const record = newRecord || oldRecord;
      
      if (!record) return;

      const workflowId = record.workflow_id;
      const metrics = this.metrics.get(workflowId);
      
      if (!metrics) return;

      switch (eventType) {
        case 'INSERT':
          await this.recordExecutionStart(record);
          break;
        case 'UPDATE':
          await this.recordExecutionUpdate(record);
          break;
        case 'DELETE':
          await this.recordExecutionEnd(record);
          break;
      }

      // Check for performance alerts
      await this.checkPerformanceAlerts(workflowId);
      
    } catch (error) {
      console.error('Failed to handle execution update:', error);
    }
  }

  /**
   * Handle workflow status updates
   */
  async handleStatusUpdate(payload) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      const record = newRecord || oldRecord;
      
      if (!record) return;

      const workflowId = record.id;
      const metrics = this.metrics.get(workflowId);
      
      if (!metrics) return;

      // Update workflow status in metrics
      metrics.status = record.status;
      metrics.lastStatusChange = new Date().toISOString();

      // Check for status-based alerts
      if (record.status === 'error' || record.status === 'failed') {
        await this.createAlert(workflowId, 'status_error', {
          message: `Workflow ${record.name} is in ${record.status} state`,
          severity: 'high',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Failed to handle status update:', error);
    }
  }

  /**
   * Record workflow execution start
   */
  async recordExecutionStart(execution) {
    try {
      const metrics = this.metrics.get(execution.workflow_id);
      if (!metrics) return;

      metrics.executions++;
      metrics.lastExecution = {
        id: execution.id,
        startTime: execution.created_at,
        status: 'running'
      };

      // Store execution start time for duration calculation
      this.performanceHistory.set(execution.id, {
        startTime: new Date(execution.created_at).getTime(),
        workflowId: execution.workflow_id
      });

    } catch (error) {
      console.error('Failed to record execution start:', error);
    }
  }

  /**
   * Record workflow execution update
   */
  async recordExecutionUpdate(execution) {
    try {
      const metrics = this.metrics.get(execution.workflow_id);
      if (!metrics) return;

      const history = this.performanceHistory.get(execution.id);
      if (!history) return;

      // Update execution status
      if (metrics.lastExecution && metrics.lastExecution.id === execution.id) {
        metrics.lastExecution.status = execution.status;
        metrics.lastExecution.endTime = execution.updated_at;
      }

      // Calculate execution time if completed
      if (execution.status === 'completed' || execution.status === 'failed') {
        const executionTime = new Date(execution.updated_at).getTime() - history.startTime;
        
        metrics.totalExecutionTime += executionTime;
        metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executions;

        if (execution.status === 'completed') {
          metrics.successfulExecutions++;
        } else {
          metrics.failedExecutions++;
        }

        metrics.errorRate = metrics.failedExecutions / metrics.executions;

        // Update performance score
        await this.updatePerformanceScore(execution.workflow_id);

        // Clean up history
        this.performanceHistory.delete(execution.id);
      }

    } catch (error) {
      console.error('Failed to record execution update:', error);
    }
  }

  /**
   * Record workflow execution end
   */
  async recordExecutionEnd(execution) {
    try {
      const metrics = this.metrics.get(execution.workflow_id);
      if (!metrics) return;

      const history = this.performanceHistory.get(execution.id);
      if (history) {
        const executionTime = Date.now() - history.startTime;
        metrics.totalExecutionTime += executionTime;
        metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executions;
        
        this.performanceHistory.delete(execution.id);
      }

    } catch (error) {
      console.error('Failed to record execution end:', error);
    }
  }

  /**
   * Update performance score for a workflow
   */
  async updatePerformanceScore(workflowId) {
    try {
      const metrics = this.metrics.get(workflowId);
      if (!metrics) return;

      let score = 100;

      // Deduct points for high error rate
      if (metrics.errorRate > 0.05) { // 5% threshold
        score -= (metrics.errorRate * 100) * 2; // 2 points per percentage
      }

      // Deduct points for slow execution
      if (metrics.averageExecutionTime > this.thresholds.executionTime) {
        const excessTime = metrics.averageExecutionTime - this.thresholds.executionTime;
        score -= (excessTime / this.thresholds.executionTime) * 20; // Up to 20 points
      }

      // Deduct points for resource usage
      if (metrics.resourceUsage.memory > this.thresholds.memoryUsage) {
        score -= 15;
      }
      if (metrics.resourceUsage.cpu > this.thresholds.cpuUsage) {
        score -= 15;
      }

      metrics.performanceScore = Math.max(0, Math.min(100, score));

    } catch (error) {
      console.error('Failed to update performance score:', error);
    }
  }

  /**
   * Check for performance alerts
   */
  async checkPerformanceAlerts(workflowId) {
    try {
      const metrics = this.metrics.get(workflowId);
      if (!metrics) return;

      const alerts = [];

      // Check error rate
      if (metrics.errorRate > this.thresholds.errorRate) {
        alerts.push({
          type: 'error_rate',
          severity: 'high',
          message: `Error rate ${(metrics.errorRate * 100).toFixed(1)}% exceeds threshold`,
          value: metrics.errorRate,
          threshold: this.thresholds.errorRate
        });
      }

      // Check execution time
      if (metrics.averageExecutionTime > this.thresholds.executionTime) {
        alerts.push({
          type: 'execution_time',
          severity: 'medium',
          message: `Average execution time ${metrics.averageExecutionTime}ms exceeds threshold`,
          value: metrics.averageExecutionTime,
          threshold: this.thresholds.executionTime
        });
      }

      // Check performance score
      if (metrics.performanceScore < 70) {
        alerts.push({
          type: 'performance_score',
          severity: 'medium',
          message: `Performance score ${metrics.performanceScore} is below acceptable level`,
          value: metrics.performanceScore,
          threshold: 70
        });
      }

      // Store alerts
      for (const alert of alerts) {
        await this.createAlert(workflowId, alert.type, alert);
      }

    } catch (error) {
      console.error('Failed to check performance alerts:', error);
    }
  }

  /**
   * Create a performance alert
   */
  async createAlert(workflowId, type, alertData) {
    try {
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        type,
        ...alertData,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      // Store alert in memory
      if (!this.alerts.has(workflowId)) {
        this.alerts.set(workflowId, []);
      }
      this.alerts.get(workflowId).push(alert);

      // Store alert in database
      const { error } = await supabase
        .from('workflow_alerts')
        .insert({
          workflow_id: workflowId,
          alert_type: type,
          severity: alertData.severity,
          message: alertData.message,
          alert_data: alertData,
          created_at: alert.timestamp
        });

      if (error) {
        console.error('Failed to store alert in database:', error);
      }

      // Emit alert event
      this.emitAlert(alert);

    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  /**
   * Emit alert event for real-time notifications
   */
  emitAlert(alert) {
    // This would integrate with your notification system
    // For now, we'll just log it
    console.log('Performance Alert:', alert);
    
    // You could emit to a WebSocket, send email, etc.
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('workflowAlert', { detail: alert }));
    }
  }

  /**
   * Get comprehensive workflow metrics
   */
  async getWorkflowMetrics(userId, workflowId = null) {
    try {
      if (workflowId) {
        const metrics = this.metrics.get(workflowId);
        return metrics ? { success: true, data: metrics } : { success: false, error: 'Workflow not found' };
      }

      // Get all workflow metrics
      const allMetrics = Array.from(this.metrics.values());
      
      // Calculate aggregate metrics
      const aggregateMetrics = {
        totalWorkflows: allMetrics.length,
        totalExecutions: allMetrics.reduce((sum, m) => sum + m.executions, 0),
        totalSuccessfulExecutions: allMetrics.reduce((sum, m) => sum + m.successfulExecutions, 0),
        totalFailedExecutions: allMetrics.reduce((sum, m) => sum + m.failedExecutions, 0),
        averageErrorRate: allMetrics.length > 0 ? 
          allMetrics.reduce((sum, m) => sum + m.errorRate, 0) / allMetrics.length : 0,
        averagePerformanceScore: allMetrics.length > 0 ? 
          allMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / allMetrics.length : 100,
        workflowsWithAlerts: allMetrics.filter(m => m.alerts.length > 0).length
      };

      return { 
        success: true, 
        data: {
          workflows: allMetrics,
          aggregate: aggregateMetrics
        }
      };

    } catch (error) {
      console.error('Failed to get workflow metrics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflow alerts
   */
  async getWorkflowAlerts(userId, workflowId = null, acknowledged = false) {
    try {
      let alerts = [];

      if (workflowId) {
        const workflowAlerts = this.alerts.get(workflowId) || [];
        alerts = workflowAlerts.filter(alert => 
          acknowledged === false ? !alert.acknowledged : true
        );
      } else {
        // Get all alerts
        for (const workflowAlerts of this.alerts.values()) {
          alerts.push(...workflowAlerts.filter(alert => 
            acknowledged === false ? !alert.acknowledged : true
          ));
        }
      }

      // Sort by timestamp (newest first)
      alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return { success: true, data: alerts };

    } catch (error) {
      console.error('Failed to get workflow alerts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId) {
    try {
      // Find and acknowledge alert in memory
      for (const [workflowId, alerts] of this.alerts) {
        const alert = alerts.find(a => a.id === alertId);
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedAt = new Date().toISOString();
          
          // Update in database
          await supabase
            .from('workflow_alerts')
            .update({ acknowledged: true, acknowledged_at: alert.acknowledgedAt })
            .eq('id', alertId);
          
          return { success: true, message: 'Alert acknowledged' };
        }
      }

      return { success: false, error: 'Alert not found' };

    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup performance tracking
   */
  async setupPerformanceTracking(userId) {
    try {
      // This would integrate with system monitoring tools
      // For now, we'll simulate resource usage tracking
      
      setInterval(async () => {
        if (!this.isMonitoring) return;

        // Simulate resource usage collection
        for (const [workflowId, metrics] of this.metrics) {
          // In a real implementation, you'd collect actual system metrics
          metrics.resourceUsage = {
            memory: Math.random() * 0.8, // Simulated memory usage
            cpu: Math.random() * 0.6,   // Simulated CPU usage
            network: Math.random() * 0.4 // Simulated network usage
          };

          // Check resource thresholds
          if (metrics.resourceUsage.memory > this.thresholds.memoryUsage) {
            await this.createAlert(workflowId, 'resource_usage', {
              type: 'memory',
              severity: 'high',
              message: `High memory usage: ${(metrics.resourceUsage.memory * 100).toFixed(1)}%`,
              value: metrics.resourceUsage.memory,
              threshold: this.thresholds.memoryUsage
            });
          }
        }
      }, 30000); // Check every 30 seconds

      return { success: true };

    } catch (error) {
      console.error('Failed to setup performance tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(userId, workflowId, timeRange = '24h') {
    try {
      const { data: executions, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .gte('created_at', this.getTimeRangeStart(timeRange))
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process execution data into trends
      const trends = {
        executionCount: executions.length,
        successRate: 0,
        averageExecutionTime: 0,
        errorRate: 0,
        hourlyData: this.groupExecutionsByHour(executions),
        performanceScore: 0
      };

      if (executions.length > 0) {
        const successful = executions.filter(e => e.status === 'completed').length;
        trends.successRate = successful / executions.length;
        trends.errorRate = 1 - trends.successRate;

        const totalTime = executions.reduce((sum, e) => {
          const start = new Date(e.created_at).getTime();
          const end = new Date(e.updated_at).getTime();
          return sum + (end - start);
        }, 0);
        trends.averageExecutionTime = totalTime / executions.length;

        // Calculate performance score based on trends
        trends.performanceScore = Math.max(0, 100 - (trends.errorRate * 100) - 
          (trends.averageExecutionTime > this.thresholds.executionTime ? 20 : 0));
      }

      return { success: true, data: trends };

    } catch (error) {
      console.error('Failed to get performance trends:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Group executions by hour for trend analysis
   */
  groupExecutionsByHour(executions) {
    const hourlyData = {};
    
    executions.forEach(execution => {
      const hour = new Date(execution.created_at).toISOString().substring(0, 13);
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          executions: 0,
          successful: 0,
          failed: 0,
          totalTime: 0
        };
      }
      
      hourlyData[hour].executions++;
      if (execution.status === 'completed') {
        hourlyData[hour].successful++;
      } else {
        hourlyData[hour].failed++;
      }
      
      const duration = new Date(execution.updated_at).getTime() - 
                     new Date(execution.created_at).getTime();
      hourlyData[hour].totalTime += duration;
    });

    return hourlyData;
  }

  /**
   * Get time range start based on range string
   */
  getTimeRangeStart(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Update monitoring thresholds
   */
  async updateThresholds(newThresholds) {
    try {
      this.thresholds = { ...this.thresholds, ...newThresholds };
      
      // Re-check all workflows for alerts with new thresholds
      for (const workflowId of this.metrics.keys()) {
        await this.checkPerformanceAlerts(workflowId);
      }

      return { success: true, message: 'Thresholds updated successfully' };

    } catch (error) {
      console.error('Failed to update thresholds:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export monitoring data
   */
  async exportMonitoringData(userId, format = 'json') {
    try {
      const metrics = await this.getWorkflowMetrics(userId);
      const alerts = await this.getWorkflowAlerts(userId);

      const exportData = {
        timestamp: new Date().toISOString(),
        userId,
        metrics: metrics.data,
        alerts: alerts.data,
        thresholds: this.thresholds
      };

      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      return { success: true, data: exportData };

    } catch (error) {
      console.error('Failed to export monitoring data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    // Simple CSV conversion - in a real implementation, you'd use a proper CSV library
    const csvRows = [];
    
    // Add metrics
    csvRows.push('Workflow Metrics');
    csvRows.push('Workflow ID,Name,Executions,Success Rate,Error Rate,Avg Execution Time,Performance Score');
    
    data.metrics.workflows.forEach(workflow => {
      csvRows.push([
        workflow.workflowId,
        workflow.workflowName,
        workflow.executions,
        (workflow.successfulExecutions / workflow.executions || 0).toFixed(2),
        workflow.errorRate.toFixed(2),
        workflow.averageExecutionTime.toFixed(0),
        workflow.performanceScore.toFixed(0)
      ].join(','));
    });

    return { success: true, data: csvRows.join('\n') };
  }
}

// Export singleton instance
export const advancedWorkflowMonitor = new AdvancedWorkflowMonitor();
