import { supabase } from './customSupabaseClient.js';
import { n8nApiClient } from './n8nApiClient.js';

/**
 * Workflow Monitoring Service
 * Handles real-time monitoring of deployed n8n workflows
 */
export class WorkflowMonitor {
  constructor() {
    this.apiClient = n8nApiClient;
    this.monitoringInterval = null;
  }

  /**
   * Start monitoring all active workflows
   */
  async startMonitoring() {
    console.log('🔍 Starting workflow monitoring...');
    
    // Check workflows every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllWorkflows();
    }, 5 * 60 * 1000); // 5 minutes

    // Initial check
    await this.checkAllWorkflows();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Workflow monitoring stopped');
    }
  }

  /**
   * Check health of all active workflows
   */
  async checkAllWorkflows() {
    try {
      // Get all active workflows
      const { data: workflows, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('status', 'active')
        .in('user_id', await this.getActiveClientIds());

      if (error) {
        console.error('❌ Error fetching workflows:', error);
        return;
      }

      console.log(`🔍 Checking ${workflows.length} active workflows...`);

      for (const workflow of workflows) {
        await this.checkWorkflowHealth(workflow);
      }

    } catch (error) {
      console.error('❌ Error in workflow monitoring:', error);
    }
  }

  /**
   * Check individual workflow health
   */
  async checkWorkflowHealth(workflow) {
    try {
      // Check n8n workflow status
      const response = await fetch(`${this.n8nBaseUrl}/api/v1/workflows/${workflow.n8n_workflow_id}`, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const n8nWorkflow = await response.json();
      
      // Check if workflow is active
      if (!n8nWorkflow.active) {
        console.warn(`⚠️ Workflow ${workflow.n8n_workflow_id} is inactive`);
        await this.handleInactiveWorkflow(workflow);
        return;
      }

      // Check recent executions
      const executionsResponse = await fetch(`${this.n8nBaseUrl}/api/v1/executions?workflowId=${workflow.n8n_workflow_id}&limit=10`, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY
        }
      });

      if (executionsResponse.ok) {
        const executions = await executionsResponse.json();
        await this.analyzeExecutions(workflow, executions.data || []);
      }

      console.log(`✅ Workflow ${workflow.n8n_workflow_id} is healthy`);

    } catch (error) {
      console.error(`❌ Error checking workflow ${workflow.n8n_workflow_id}:`, error);
      await this.handleWorkflowError(workflow, error);
    }
  }

  /**
   * Analyze workflow executions for patterns
   */
  async analyzeExecutions(workflow, executions) {
    const recentFailures = executions.filter(exec => 
      exec.finished === true && exec.mode === 'production' && !exec.success
    ).length;

    const recentSuccesses = executions.filter(exec => 
      exec.finished === true && exec.mode === 'production' && exec.success
    ).length;

    const totalRecent = recentFailures + recentSuccesses;
    
    if (totalRecent > 0) {
      const failureRate = recentFailures / totalRecent;
      
      // Alert if failure rate is high
      if (failureRate > 0.5) {
        console.warn(`⚠️ High failure rate for workflow ${workflow.n8n_workflow_id}: ${(failureRate * 100).toFixed(1)}%`);
        await this.handleHighFailureRate(workflow, failureRate);
      }

      // Log success rate
      console.log(`📊 Workflow ${workflow.n8n_workflow_id}: ${recentSuccesses}/${totalRecent} successful (${((1-failureRate) * 100).toFixed(1)}%)`);
    }

    // Store execution metrics
    await this.storeExecutionMetrics(workflow.user_id, {
      workflow_id: workflow.n8n_workflow_id,
      recent_executions: totalRecent,
      success_rate: totalRecent > 0 ? (1 - recentFailures / totalRecent) : 1,
      last_checked: new Date().toISOString()
    });
  }

  /**
   * Handle inactive workflow
   */
  async handleInactiveWorkflow(workflow) {
    // Log the issue
    await supabase
      .from('workflow_issues')
      .insert({
        workflow_id: workflow.n8n_workflow_id,
        user_id: workflow.user_id,
        issue_type: 'inactive_workflow',
        severity: 'high',
        description: 'Workflow is not active in n8n',
        status: 'open'
      });

    // Notify admin team
    console.error(`🚨 ALERT: Workflow ${workflow.n8n_workflow_id} for user ${workflow.user_id} is inactive`);
  }

  /**
   * Handle workflow errors
   */
  async handleWorkflowError(workflow, error) {
    // Log the error
    await supabase
      .from('workflow_issues')
      .insert({
        workflow_id: workflow.n8n_workflow_id,
        user_id: workflow.user_id,
        issue_type: 'connection_error',
        severity: 'medium',
        description: error.message,
        status: 'open'
      });

    console.error(`🚨 Workflow ${workflow.n8n_workflow_id} connection error: ${error.message}`);
  }

  /**
   * Handle high failure rate
   */
  async handleHighFailureRate(workflow, failureRate) {
    await supabase
      .from('workflow_issues')
      .insert({
        workflow_id: workflow.n8n_workflow_id,
        user_id: workflow.user_id,
        issue_type: 'high_failure_rate',
        severity: 'high',
        description: `Failure rate: ${(failureRate * 100).toFixed(1)}%`,
        status: 'open'
      });

    console.error(`🚨 High failure rate detected for workflow ${workflow.n8n_workflow_id}: ${(failureRate * 100).toFixed(1)}%`);
  }

  /**
   * Store execution metrics
   */
  async storeExecutionMetrics(userId, metrics) {
    await supabase
      .from('workflow_metrics')
      .upsert({
        user_id: userId,
        workflow_id: metrics.workflow_id,
        recent_executions: metrics.recent_executions,
        success_rate: metrics.success_rate,
        last_checked: metrics.last_checked,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, workflow_id'
      });
  }

  /**
   * Get active client IDs (those with active subscriptions)
   */
  async getActiveClientIds() {
    // This would typically check subscription status
    // For now, return all users with active workflows
    const { data } = await supabase
      .from('workflows')
      .select('user_id')
      .eq('status', 'active');

    return data?.map(w => w.user_id) || [];
  }

  /**
   * Get workflow health summary for dashboard
   */
  async getHealthSummary() {
    const { data: metrics } = await supabase
      .from('workflow_metrics')
      .select('*')
      .gte('last_checked', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const { data: issues } = await supabase
      .from('workflow_issues')
      .select('*')
      .eq('status', 'open');

    return {
      totalWorkflows: metrics?.length || 0,
      averageSuccessRate: metrics?.length > 0 ? 
        metrics.reduce((sum, m) => sum + m.success_rate, 0) / metrics.length : 0,
      openIssues: issues?.length || 0,
      criticalIssues: issues?.filter(i => i.severity === 'high').length || 0
    };
  }

  /**
   * Deploy and monitor a new workflow
   * @param {string} userId - User ID
   * @param {Object} workflowData - Workflow configuration
   * @returns {Promise<Object>} Deployment result with monitoring setup
   */
  async deployAndMonitorWorkflow(userId, workflowData) {
    try {
      console.log('🚀 Deploying and setting up monitoring for workflow');

      // Import workflow deployer dynamically to avoid circular dependency
      const { workflowDeployer } = await import('./workflowDeployer.js');
      
      // Deploy the workflow
      const deploymentResult = await workflowDeployer.deployWorkflow(userId, workflowData);
      
      if (deploymentResult.success) {
        // Start monitoring for this specific workflow
        await this.startWorkflowMonitoring(userId, deploymentResult.workflowId);
        
        console.log('✅ Workflow deployed and monitoring started');
      }

      return deploymentResult;
    } catch (error) {
      console.error('❌ Failed to deploy and monitor workflow:', error);
      throw error;
    }
  }

  /**
   * Start monitoring for a specific workflow
   * @param {string} userId - User ID
   * @param {string} workflowId - Workflow ID
   */
  async startWorkflowMonitoring(userId, workflowId) {
    try {
      // Store monitoring configuration
      await supabase
        .from('workflow_metrics')
        .insert({
          user_id: userId,
          workflow_id: workflowId,
          metric_type: 'monitoring_setup',
          metric_value: 1,
          metadata: {
            monitoring_enabled: true,
            setup_timestamp: new Date().toISOString()
          }
        });

      console.log(`✅ Monitoring setup for workflow ${workflowId}`);
    } catch (error) {
      console.error('❌ Failed to setup workflow monitoring:', error);
    }
  }
}

// Singleton instance
export const workflowMonitor = new WorkflowMonitor();
