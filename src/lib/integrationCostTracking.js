import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class IntegrationCostTracking {
  constructor(userId) {
    this.userId = userId;
    // Integration cost models (per operation or per data unit)
    this.costModels = {
      'salesforce': {
        api_calls: 0.001, // $0.001 per API call
        data_sync: 0.0001, // $0.0001 per record
        bulk_operations: 0.0005 // $0.0005 per bulk operation
      },
      'google-calendar': {
        api_calls: 0.0005,
        calendar_sync: 0.0002,
        event_processing: 0.0001
      },
      'slack': {
        api_calls: 0.0003,
        message_sync: 0.0001,
        file_processing: 0.0002
      },
      'hubspot': {
        api_calls: 0.0008,
        contact_sync: 0.0003,
        deal_processing: 0.0005
      }
    };
  }

  /**
   * Records integration cost data
   * @param {string} integrationId - The ID of the integration
   * @param {string} operation - The operation performed
   * @param {Object} costData - Cost-related data (apiCalls, dataUnits, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object|null>} The inserted data or null if error
   */
  async recordIntegrationCost(integrationId, operation, costData = {}, metadata = {}) {
    try {
      const costModel = this.costModels[integrationId] || {};
      const operationCost = costModel[operation] || 0;
      
      // Calculate total cost based on operation type
      let totalCost = 0;
      if (operation === 'api_calls') {
        totalCost = (costData.apiCalls || 0) * operationCost;
      } else if (operation === 'data_sync' || operation === 'contact_sync' || operation === 'calendar_sync') {
        totalCost = (costData.recordsProcessed || 0) * operationCost;
      } else if (operation === 'bulk_operations') {
        totalCost = (costData.bulkOperations || 0) * operationCost;
      } else {
        totalCost = (costData.operations || 1) * operationCost;
      }

      const { data, error } = await supabase
        .from('integration_cost_logs')
        .insert({
          user_id: this.userId,
          integration_id: integrationId,
          operation: operation,
          api_calls: costData.apiCalls || 0,
          records_processed: costData.recordsProcessed || 0,
          bulk_operations: costData.bulkOperations || 0,
          data_size_bytes: costData.dataSize || 0,
          cost_per_unit: operationCost,
          total_cost: totalCost,
          metadata: metadata,
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`Integration cost recorded for ${integrationId}: $${totalCost.toFixed(4)}`, { 
        userId: this.userId, 
        integrationId, 
        operation, 
        totalCost 
      });
      return data;
    } catch (error) {
      logger.error(`Error recording integration cost for ${integrationId}:`, { error: error.message, userId: this.userId });
      return null;
    }
  }

  /**
   * Gets integration cost summary
   * @param {string} timeFilter - '24h', '7d', '30d', '90d'
   * @param {string} [integrationId] - Optional: Filter by specific integration
   * @returns {Promise<Object>} Cost summary
   */
  async getIntegrationCostSummary(timeFilter = '7d', integrationId = null) {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      let query = supabase
        .from('integration_cost_logs')
        .select('integration_id, operation, api_calls, records_processed, bulk_operations, data_size_bytes, total_cost, created_at')
        .eq('user_id', this.userId)
        .gte('created_at', dateFilter.toISOString());

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data: costLogs, error } = await query;

      if (error) throw error;

      const summary = costLogs.reduce((acc, log) => {
        if (!acc[log.integration_id]) {
          acc[log.integration_id] = {
            totalCost: 0,
            totalApiCalls: 0,
            totalRecordsProcessed: 0,
            totalBulkOperations: 0,
            totalDataSize: 0,
            operations: {},
            costPerOperation: {},
            averageCostPerRecord: 0,
            averageCostPerApiCall: 0
          };
        }

        const integration = acc[log.integration_id];
        integration.totalCost += log.total_cost;
        integration.totalApiCalls += log.api_calls;
        integration.totalRecordsProcessed += log.records_processed;
        integration.totalBulkOperations += log.bulk_operations;
        integration.totalDataSize += log.data_size_bytes;

        // Track operations
        if (!integration.operations[log.operation]) {
          integration.operations[log.operation] = {
            count: 0,
            totalCost: 0,
            apiCalls: 0,
            recordsProcessed: 0
          };
        }
        integration.operations[log.operation].count++;
        integration.operations[log.operation].totalCost += log.total_cost;
        integration.operations[log.operation].apiCalls += log.api_calls;
        integration.operations[log.operation].recordsProcessed += log.records_processed;

        return acc;
      }, {});

      // Calculate derived metrics
      Object.keys(summary).forEach(id => {
        const integration = summary[id];
        integration.averageCostPerRecord = integration.totalRecordsProcessed > 0 
          ? integration.totalCost / integration.totalRecordsProcessed 
          : 0;
        integration.averageCostPerApiCall = integration.totalApiCalls > 0 
          ? integration.totalCost / integration.totalApiCalls 
          : 0;

        // Calculate cost per operation
        Object.keys(integration.operations).forEach(op => {
          const opData = integration.operations[op];
          integration.costPerOperation[op] = {
            averageCost: opData.count > 0 ? opData.totalCost / opData.count : 0,
            costPerRecord: opData.recordsProcessed > 0 ? opData.totalCost / opData.recordsProcessed : 0,
            costPerApiCall: opData.apiCalls > 0 ? opData.totalCost / opData.apiCalls : 0
          };
        });
      });

      logger.info('Integration cost summary fetched', { userId: this.userId, timeFilter, integrationId });
      return summary;
    } catch (error) {
      logger.error('Error fetching integration cost summary:', { error: error.message, userId: this.userId });
      return {};
    }
  }

  /**
   * Gets cost trends over time
   * @param {string} integrationId - The integration ID
   * @param {string} timeFilter - Time period for trends
   * @returns {Promise<Array>} Cost trends data
   */
  async getIntegrationCostTrends(integrationId, timeFilter = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      const { data, error } = await supabase
        .from('integration_cost_logs')
        .select('created_at, total_cost, api_calls, records_processed, operation')
        .eq('user_id', this.userId)
        .eq('integration_id', integrationId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day and calculate daily costs
      const dailyCosts = {};
      data.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!dailyCosts[date]) {
          dailyCosts[date] = {
            date,
            totalCost: 0,
            totalApiCalls: 0,
            totalRecordsProcessed: 0,
            operations: {}
          };
        }
        
        const day = dailyCosts[date];
        day.totalCost += record.total_cost;
        day.totalApiCalls += record.api_calls;
        day.totalRecordsProcessed += record.records_processed;

        if (!day.operations[record.operation]) {
          day.operations[record.operation] = { count: 0, cost: 0 };
        }
        day.operations[record.operation].count++;
        day.operations[record.operation].cost += record.total_cost;
      });

      const trends = Object.values(dailyCosts).sort((a, b) => new Date(a.date) - new Date(b.date));
      logger.info(`Integration cost trends fetched for ${integrationId}`, { userId: this.userId, integrationId, trendsCount: trends.length });
      return trends;
    } catch (error) {
      logger.error(`Error fetching integration cost trends for ${integrationId}:`, { error: error.message, userId: this.userId });
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

export const integrationCostTracking = new IntegrationCostTracking();
