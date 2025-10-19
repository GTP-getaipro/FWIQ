import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class IntegrationAnalytics {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Records integration usage analytics
   * @param {string} integrationId - The ID of the integration
   * @param {string} operation - The operation performed (e.g., 'sync', 'fetch', 'push')
   * @param {Object} metrics - Performance metrics (duration, success, dataSize, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object|null>} The inserted data or null if error
   */
  async recordIntegrationUsage(integrationId, operation, metrics = {}, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('integration_analytics')
        .insert({
          user_id: this.userId,
          integration_id: integrationId,
          operation: operation,
          duration_ms: metrics.duration || 0,
          success: metrics.success || false,
          data_size_bytes: metrics.dataSize || 0,
          records_processed: metrics.recordsProcessed || 0,
          error_count: metrics.errorCount || 0,
          metadata: metadata,
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`Integration analytics recorded for ${integrationId}`, { userId: this.userId, integrationId, operation });
      return data;
    } catch (error) {
      logger.error(`Error recording integration analytics for ${integrationId}:`, { error: error.message, userId: this.userId });
      return null;
    }
  }

  /**
   * Gets comprehensive integration analytics summary
   * @param {string} timeFilter - '24h', '7d', '30d', '90d'
   * @param {string} [integrationId] - Optional: Filter by specific integration
   * @returns {Promise<Object>} Analytics summary
   */
  async getIntegrationAnalytics(timeFilter = '7d', integrationId = null) {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      let query = supabase
        .from('integration_analytics')
        .select('integration_id, operation, duration_ms, success, data_size_bytes, records_processed, error_count, created_at')
        .eq('user_id', this.userId)
        .gte('created_at', dateFilter.toISOString());

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data: analytics, error } = await query;

      if (error) throw error;

      const summary = analytics.reduce((acc, record) => {
        if (!acc[record.integration_id]) {
          acc[record.integration_id] = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            totalDuration: 0,
            totalDataSize: 0,
            totalRecordsProcessed: 0,
            totalErrors: 0,
            operations: {},
            successRate: 0,
            averageDuration: 0,
            throughput: 0
          };
        }

        const integration = acc[record.integration_id];
        integration.totalOperations++;
        integration.totalDuration += record.duration_ms;
        integration.totalDataSize += record.data_size_bytes;
        integration.totalRecordsProcessed += record.records_processed;
        integration.totalErrors += record.error_count;

        if (record.success) {
          integration.successfulOperations++;
        } else {
          integration.failedOperations++;
        }

        // Track operations
        if (!integration.operations[record.operation]) {
          integration.operations[record.operation] = {
            count: 0,
            success: 0,
            totalDuration: 0,
            totalDataSize: 0
          };
        }
        integration.operations[record.operation].count++;
        if (record.success) integration.operations[record.operation].success++;
        integration.operations[record.operation].totalDuration += record.duration_ms;
        integration.operations[record.operation].totalDataSize += record.data_size_bytes;

        return acc;
      }, {});

      // Calculate derived metrics
      Object.keys(summary).forEach(id => {
        const integration = summary[id];
        integration.successRate = integration.totalOperations > 0 
          ? (integration.successfulOperations / integration.totalOperations) * 100 
          : 0;
        integration.averageDuration = integration.totalOperations > 0 
          ? integration.totalDuration / integration.totalOperations 
          : 0;
        integration.throughput = integration.totalDuration > 0 
          ? (integration.totalRecordsProcessed / integration.totalDuration) * 1000 
          : 0;
      });

      logger.info('Integration analytics summary fetched', { userId: this.userId, timeFilter, integrationId });
      return summary;
    } catch (error) {
      logger.error('Error fetching integration analytics:', { error: error.message, userId: this.userId });
      return {};
    }
  }

  /**
   * Gets integration performance trends over time
   * @param {string} integrationId - The integration ID
   * @param {string} timeFilter - Time period for trends
   * @returns {Promise<Array>} Performance trends data
   */
  async getIntegrationPerformanceTrends(integrationId, timeFilter = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      const { data, error } = await supabase
        .from('integration_analytics')
        .select('created_at, duration_ms, success, data_size_bytes, records_processed')
        .eq('user_id', this.userId)
        .eq('integration_id', integrationId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day and calculate daily metrics
      const dailyTrends = {};
      data.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!dailyTrends[date]) {
          dailyTrends[date] = {
            date,
            totalOperations: 0,
            successfulOperations: 0,
            averageDuration: 0,
            totalDataSize: 0,
            totalRecordsProcessed: 0,
            successRate: 0
          };
        }
        
        const day = dailyTrends[date];
        day.totalOperations++;
        day.averageDuration += record.duration_ms;
        day.totalDataSize += record.data_size_bytes;
        day.totalRecordsProcessed += record.records_processed;
        
        if (record.success) {
          day.successfulOperations++;
        }
      });

      // Calculate final metrics for each day
      Object.values(dailyTrends).forEach(day => {
        day.averageDuration = day.totalOperations > 0 ? day.averageDuration / day.totalOperations : 0;
        day.successRate = day.totalOperations > 0 ? (day.successfulOperations / day.totalOperations) * 100 : 0;
      });

      const trends = Object.values(dailyTrends).sort((a, b) => new Date(a.date) - new Date(b.date));
      logger.info(`Integration performance trends fetched for ${integrationId}`, { userId: this.userId, integrationId, trendsCount: trends.length });
      return trends;
    } catch (error) {
      logger.error(`Error fetching integration performance trends for ${integrationId}:`, { error: error.message, userId: this.userId });
      return [];
    }
  }

  /**
   * Gets the date filter based on timeFilter string
   * @param {string} timeFilter - '24h', '7d', '30d', '90d'
   * @returns {Date} The calculated Date object
   */
  _getDateFilter(timeFilter) {
    const now = new Date();
    const filters = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    return filters[timeFilter] || filters['7d'];
  }
}

export const integrationAnalytics = new IntegrationAnalytics();
