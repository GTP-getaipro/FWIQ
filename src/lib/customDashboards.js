/**
 * Custom Analytics Dashboards System
 * 
 * Handles custom dashboard creation, management,
 * and visualization components.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class CustomDashboards {
  constructor() {
    this.dashboards = new Map();
    this.dashboardComponents = new Map();
    this.dashboardLayouts = new Map();
    this.dashboardData = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize custom dashboards system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Custom Dashboards', { userId });

      // Load dashboards and components
      await this.loadDashboards(userId);
      await this.loadDashboardComponents(userId);
      await this.loadDashboardLayouts(userId);

      this.isInitialized = true;
      logger.info('Custom Dashboards initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Custom Dashboards', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create custom dashboard
   */
  async createDashboard(userId, dashboardData) {
    try {
      logger.info('Creating custom dashboard', { userId, dashboardName: dashboardData.name });

      // Validate dashboard data
      const validationResult = await this.validateDashboardData(dashboardData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate dashboard ID
      const dashboardId = this.generateDashboardId();

      // Create dashboard
      const dashboard = {
        id: dashboardId,
        user_id: userId,
        name: dashboardData.name,
        description: dashboardData.description || '',
        layout: dashboardData.layout || 'grid',
        components: dashboardData.components || [],
        filters: dashboardData.filters || {},
        settings: dashboardData.settings || {},
        is_public: dashboardData.isPublic || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store dashboard
      await this.storeDashboard(userId, dashboard);

      // Initialize dashboard components
      await this.initializeDashboardComponents(userId, dashboard);

      // Update in-memory dashboards
      this.dashboards.set(dashboardId, dashboard);

      logger.info('Custom dashboard created successfully', { 
        userId, 
        dashboardId, 
        dashboardName: dashboardData.name 
      });

      return {
        success: true,
        dashboard: dashboard
      };
    } catch (error) {
      logger.error('Failed to create custom dashboard', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update dashboard
   */
  async updateDashboard(userId, dashboardId, updateData) {
    try {
      logger.info('Updating dashboard', { userId, dashboardId });

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        return { success: false, error: 'Dashboard not found' };
      }

      // Update dashboard
      const updatedDashboard = {
        ...dashboard,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Store updated dashboard
      await this.storeDashboard(userId, updatedDashboard);

      // Update in-memory dashboard
      this.dashboards.set(dashboardId, updatedDashboard);

      logger.info('Dashboard updated successfully', { userId, dashboardId });

      return {
        success: true,
        dashboard: updatedDashboard
      };
    } catch (error) {
      logger.error('Failed to update dashboard', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(userId, dashboardId) {
    try {
      logger.info('Deleting dashboard', { userId, dashboardId });

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        return { success: false, error: 'Dashboard not found' };
      }

      // Delete dashboard from database
      const { error } = await supabase
        .from('analytics_custom_dashboards')
        .delete()
        .eq('id', dashboardId)
        .eq('user_id', userId);

      if (error) throw error;

      // Delete dashboard components
      await this.deleteDashboardComponents(userId, dashboardId);

      // Remove from in-memory dashboards
      this.dashboards.delete(dashboardId);

      logger.info('Dashboard deleted successfully', { userId, dashboardId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete dashboard', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add component to dashboard
   */
  async addDashboardComponent(userId, dashboardId, componentData) {
    try {
      logger.info('Adding dashboard component', { userId, dashboardId, componentType: componentData.type });

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        return { success: false, error: 'Dashboard not found' };
      }

      // Generate component ID
      const componentId = this.generateComponentId();

      // Create component
      const component = {
        id: componentId,
        dashboard_id: dashboardId,
        type: componentData.type,
        title: componentData.title,
        data_source: componentData.dataSource,
        configuration: componentData.configuration || {},
        position: componentData.position || { x: 0, y: 0, width: 4, height: 3 },
        created_at: new Date().toISOString()
      };

      // Store component
      await this.storeDashboardComponent(userId, component);

      // Add component to dashboard
      dashboard.components.push(component);
      await this.updateDashboard(userId, dashboardId, { components: dashboard.components });

      // Update in-memory components
      if (!this.dashboardComponents.has(dashboardId)) {
        this.dashboardComponents.set(dashboardId, []);
      }
      this.dashboardComponents.get(dashboardId).push(component);

      logger.info('Dashboard component added successfully', { userId, dashboardId, componentId });

      return {
        success: true,
        component: component
      };
    } catch (error) {
      logger.error('Failed to add dashboard component', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update dashboard component
   */
  async updateDashboardComponent(userId, dashboardId, componentId, updateData) {
    try {
      logger.info('Updating dashboard component', { userId, dashboardId, componentId });

      const components = this.dashboardComponents.get(dashboardId) || [];
      const component = components.find(comp => comp.id === componentId);

      if (!component) {
        return { success: false, error: 'Component not found' };
      }

      // Update component
      const updatedComponent = {
        ...component,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Store updated component
      await this.storeDashboardComponent(userId, updatedComponent);

      // Update dashboard components
      const dashboard = this.dashboards.get(dashboardId);
      if (dashboard) {
        dashboard.components = dashboard.components.map(comp => 
          comp.id === componentId ? updatedComponent : comp
        );
        await this.updateDashboard(userId, dashboardId, { components: dashboard.components });
      }

      // Update in-memory component
      const componentIndex = components.findIndex(comp => comp.id === componentId);
      if (componentIndex !== -1) {
        components[componentIndex] = updatedComponent;
      }

      logger.info('Dashboard component updated successfully', { userId, dashboardId, componentId });

      return {
        success: true,
        component: updatedComponent
      };
    } catch (error) {
      logger.error('Failed to update dashboard component', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(userId, dashboardId) {
    try {
      logger.info('Getting dashboard data', { userId, dashboardId });

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        return { success: false, error: 'Dashboard not found' };
      }

      // Get data for each component
      const componentData = await this.getComponentData(userId, dashboard.components);

      // Apply dashboard filters
      const filteredData = await this.applyDashboardFilters(userId, dashboard, componentData);

      return {
        success: true,
        dashboard: dashboard,
        data: filteredData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get dashboard data', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(userId) {
    try {
      const userDashboards = Array.from(this.dashboards.values()).filter(dashboard => 
        dashboard.user_id === userId
      );

      const metrics = {
        totalDashboards: userDashboards.length,
        publicDashboards: userDashboards.filter(dashboard => dashboard.is_public).length,
        privateDashboards: userDashboards.filter(dashboard => !dashboard.is_public).length,
        dashboardsByLayout: this.groupDashboardsByLayout(userDashboards),
        totalComponents: userDashboards.reduce((sum, dashboard) => sum + dashboard.components.length, 0),
        avgComponentsPerDashboard: this.calculateAvgComponentsPerDashboard(userDashboards)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dashboard insights
   */
  async getDashboardInsights(userId) {
    try {
      const userDashboards = Array.from(this.dashboards.values()).filter(dashboard => 
        dashboard.user_id === userId
      );

      const insights = {
        dashboardTrends: this.analyzeDashboardTrends(userDashboards),
        componentUsage: this.analyzeComponentUsage(userDashboards),
        layoutPreferences: this.analyzeLayoutPreferences(userDashboards),
        recommendations: this.generateDashboardRecommendations(userDashboards)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get dashboard insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize dashboard components
   */
  async initializeDashboardComponents(userId, dashboard) {
    try {
      for (const component of dashboard.components) {
        await this.storeDashboardComponent(userId, component);
      }

      // Update in-memory components
      this.dashboardComponents.set(dashboard.id, dashboard.components);
    } catch (error) {
      logger.error('Failed to initialize dashboard components', { error: error.message, userId });
    }
  }

  /**
   * Get component data
   */
  async getComponentData(userId, components) {
    try {
      const componentData = {};

      for (const component of components) {
        const data = await this.fetchComponentData(userId, component);
        componentData[component.id] = data;
      }

      return componentData;
    } catch (error) {
      logger.error('Failed to get component data', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Fetch component data
   */
  async fetchComponentData(userId, component) {
    try {
      let data;
      switch (component.type) {
        case 'chart':
          data = await this.fetchChartData(userId, component);
          break;
        case 'table':
          data = await this.fetchTableData(userId, component);
          break;
        case 'metric':
          data = await this.fetchMetricData(userId, component);
          break;
        case 'gauge':
          data = await this.fetchGaugeData(userId, component);
          break;
        case 'map':
          data = await this.fetchMapData(userId, component);
          break;
        default:
          data = { error: 'Unknown component type' };
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch component data', { error: error.message, componentId: component.id });
      return { error: error.message };
    }
  }

  /**
   * Fetch chart data
   */
  async fetchChartData(userId, component) {
    try {
      // Simulate chart data based on configuration
      const config = component.configuration || {};
      const dataPoints = config.dataPoints || 10;
      const chartType = config.chartType || 'line';

      const data = {
        labels: Array.from({ length: dataPoints }, (_, i) => `Point ${i + 1}`),
        datasets: [{
          label: component.title || 'Data',
          data: Array.from({ length: dataPoints }, () => Math.random() * 100),
          backgroundColor: config.backgroundColor || 'rgba(54, 162, 235, 0.2)',
          borderColor: config.borderColor || 'rgba(54, 162, 235, 1)',
          borderWidth: config.borderWidth || 1
        }]
      };

      return data;
    } catch (error) {
      logger.error('Failed to fetch chart data', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Fetch table data
   */
  async fetchTableData(userId, component) {
    try {
      const config = component.configuration || {};
      const rows = config.rows || 5;
      const columns = config.columns || 3;

      const data = {
        headers: Array.from({ length: columns }, (_, i) => `Column ${i + 1}`),
        rows: Array.from({ length: rows }, () => 
          Array.from({ length: columns }, () => Math.random() * 1000)
        )
      };

      return data;
    } catch (error) {
      logger.error('Failed to fetch table data', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Fetch metric data
   */
  async fetchMetricData(userId, component) {
    try {
      const config = component.configuration || {};
      const value = config.value || Math.random() * 1000;
      const previousValue = config.previousValue || value * 0.9;

      const data = {
        value: value,
        previousValue: previousValue,
        change: value - previousValue,
        changePercent: ((value - previousValue) / previousValue) * 100,
        format: config.format || 'number'
      };

      return data;
    } catch (error) {
      logger.error('Failed to fetch metric data', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Fetch gauge data
   */
  async fetchGaugeData(userId, component) {
    try {
      const config = component.configuration || {};
      const value = config.value || Math.random() * 100;
      const max = config.max || 100;
      const min = config.min || 0;

      const data = {
        value: value,
        min: min,
        max: max,
        percentage: ((value - min) / (max - min)) * 100,
        color: this.getGaugeColor(value, min, max)
      };

      return data;
    } catch (error) {
      logger.error('Failed to fetch gauge data', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Fetch map data
   */
  async fetchMapData(userId, component) {
    try {
      const config = component.configuration || {};
      const dataPoints = config.dataPoints || 5;

      const data = {
        type: 'FeatureCollection',
        features: Array.from({ length: dataPoints }, (_, i) => ({
          type: 'Feature',
          properties: {
            name: `Location ${i + 1}`,
            value: Math.random() * 100
          },
          geometry: {
            type: 'Point',
            coordinates: [
              -122.4194 + (Math.random() - 0.5) * 0.1, // San Francisco area
              37.7749 + (Math.random() - 0.5) * 0.1
            ]
          }
        }))
      };

      return data;
    } catch (error) {
      logger.error('Failed to fetch map data', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Apply dashboard filters
   */
  async applyDashboardFilters(userId, dashboard, componentData) {
    try {
      const filters = dashboard.filters || {};
      const filteredData = { ...componentData };

      // Apply time range filter
      if (filters.timeRange) {
        // Filter data based on time range
        // This would be implemented based on specific data structure
      }

      // Apply category filter
      if (filters.category) {
        // Filter data based on category
        // This would be implemented based on specific data structure
      }

      return filteredData;
    } catch (error) {
      logger.error('Failed to apply dashboard filters', { error: error.message, userId });
      return componentData;
    }
  }

  /**
   * Load dashboards
   */
  async loadDashboards(userId) {
    try {
      const { data: dashboards, error } = await supabase
        .from('analytics_custom_dashboards')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      dashboards.forEach(dashboard => {
        this.dashboards.set(dashboard.id, dashboard);
      });

      logger.info('Dashboards loaded', { userId, dashboardCount: dashboards.length });
    } catch (error) {
      logger.error('Failed to load dashboards', { error: error.message, userId });
    }
  }

  /**
   * Load dashboard components
   */
  async loadDashboardComponents(userId) {
    try {
      const { data: components, error } = await supabase
        .from('analytics_dashboard_components')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Group components by dashboard
      const componentsByDashboard = {};
      components.forEach(component => {
        if (!componentsByDashboard[component.dashboard_id]) {
          componentsByDashboard[component.dashboard_id] = [];
        }
        componentsByDashboard[component.dashboard_id].push(component);
      });

      // Update in-memory components
      Object.entries(componentsByDashboard).forEach(([dashboardId, comps]) => {
        this.dashboardComponents.set(dashboardId, comps);
      });

      logger.info('Dashboard components loaded', { userId, componentCount: components.length });
    } catch (error) {
      logger.error('Failed to load dashboard components', { error: error.message, userId });
    }
  }

  /**
   * Load dashboard layouts
   */
  async loadDashboardLayouts(userId) {
    try {
      const { data: layouts, error } = await supabase
        .from('analytics_dashboard_layouts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      layouts.forEach(layout => {
        this.dashboardLayouts.set(layout.id, layout);
      });

      logger.info('Dashboard layouts loaded', { userId, layoutCount: layouts.length });
    } catch (error) {
      logger.error('Failed to load dashboard layouts', { error: error.message, userId });
    }
  }

  /**
   * Reset dashboards system for user
   */
  async reset(userId) {
    try {
      this.dashboards.clear();
      this.dashboardComponents.clear();
      this.dashboardLayouts.clear();
      this.dashboardData.delete(userId);

      logger.info('Dashboards system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset dashboards system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
