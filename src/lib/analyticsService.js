import { supabase } from './customSupabaseClient';

export class AnalyticsService {
  constructor(userId) {
    this.userId = userId;
  }

  async getDashboardMetrics(timeFilter = '7d') {
    const dateFilter = this.getDateFilter(timeFilter);
    
    const [emailStats, aiStats, workflowStats] = await Promise.all([
      this.getEmailStatistics(dateFilter),
      this.getAIStatistics(dateFilter),
      this.getWorkflowStatistics(dateFilter)
    ]);

    return {
      emails: emailStats,
      ai: aiStats,
      workflows: workflowStats,
      summary: this.calculateSummary(emailStats, aiStats, workflowStats)
    };
  }

  async getEmailStatistics(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    return {
      total: emails?.length || 0,
      byCategory: this.groupByCategory(emails),
      byUrgency: this.groupByUrgency(emails),
      responseRate: this.calculateResponseRate(emails)
    };
  }

  async getAIStatistics(dateFilter) {
    const { data: aiResponses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    return {
      totalGenerated: aiResponses?.length || 0,
      totalTokens: aiResponses?.reduce((sum, r) => sum + (r.tokens_used || 0), 0) || 0,
      totalCost: aiResponses?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0,
      averageTokens: this.calculateAverage(aiResponses, 'tokens_used'),
      byStatus: this.groupByStatus(aiResponses)
    };
  }

  async getWorkflowStatistics(dateFilter) {
    const { data: workflows } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    return {
      totalExecutions: workflows?.length || 0,
      successfulExecutions: workflows?.filter(w => w.status === 'success').length || 0,
      failedExecutions: workflows?.filter(w => w.status === 'failed').length || 0,
      averageExecutionTime: this.calculateAverage(workflows, 'execution_time'),
      byStatus: this.groupByStatus(workflows)
    };
  }

  calculateSummary(emailStats, aiStats, workflowStats) {
    return {
      emailsProcessed: emailStats.total,
      aiResponsesGenerated: aiStats.totalGenerated,
      averageResponseTime: this.calculateAverageResponseTime(),
      automationEfficiency: this.calculateEfficiency(emailStats, aiStats)
    };
  }

  // Helper methods
  getDateFilter(timeFilter) {
    const now = new Date();
    switch (timeFilter) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  groupByCategory(items) {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const category = item.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

  groupByUrgency(items) {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const urgency = item.urgency || 'normal';
      acc[urgency] = (acc[urgency] || 0) + 1;
      return acc;
    }, {});
  }

  groupByStatus(items) {
    if (!items) return {};
    return items.reduce((acc, item) => {
      const status = item.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  calculateResponseRate(emails) {
    if (!emails || emails.length === 0) return 0;
    const responded = emails.filter(email => email.responded).length;
    return Math.round((responded / emails.length) * 100);
  }

  calculateAverage(items, field) {
    if (!items || items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item[field] || 0), 0);
    return Math.round(sum / items.length);
  }

  calculateAverageResponseTime() {
    // This would typically query actual response time data
    // For now, return a mock calculation
    return 2.5; // minutes
  }

  calculateEfficiency(emailStats, aiStats) {
    if (emailStats.total === 0) return 0;
    return Math.round((aiStats.totalGenerated / emailStats.total) * 100);
  }

  // Export data for custom reports
  async exportData(timeFilter = '7d', dataType = 'all') {
    const dateFilter = this.getDateFilter(timeFilter);
    
    switch (dataType) {
      case 'emails':
        return await this.getEmailStatistics(dateFilter);
      case 'ai':
        return await this.getAIStatistics(dateFilter);
      case 'workflows':
        return await this.getWorkflowStatistics(dateFilter);
      default:
        return await this.getDashboardMetrics(timeFilter);
    }
  }

  // Generate custom report
  async generateCustomReport(filters = {}) {
    const { timeFilter = '7d', metrics = [], groupBy = null } = filters;
    const dateFilter = this.getDateFilter(timeFilter);
    
    const baseData = await this.getDashboardMetrics(timeFilter);
    
    if (metrics.length === 0) {
      return baseData;
    }

    const customReport = {};
    metrics.forEach(metric => {
      if (baseData[metric]) {
        customReport[metric] = baseData[metric];
      }
    });

    return customReport;
  }
}
