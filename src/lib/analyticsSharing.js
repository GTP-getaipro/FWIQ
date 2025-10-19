/**
 * Analytics Sharing System
 * 
 * Handles analytics data sharing, collaboration,
 * and access control.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AnalyticsSharing {
  constructor() {
    this.sharingConfigs = new Map();
    this.sharingLinks = new Map();
    this.sharingPermissions = new Map();
    this.sharingHistory = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize analytics sharing system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Analytics Sharing', { userId });

      // Load sharing configurations and history
      await this.loadSharingConfigs(userId);
      await this.loadSharingLinks(userId);
      await this.loadSharingHistory(userId);

      this.isInitialized = true;
      logger.info('Analytics Sharing initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Analytics Sharing', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create sharing link
   */
  async createSharingLink(userId, sharingData) {
    try {
      logger.info('Creating sharing link', { userId, sharingType: sharingData.type });

      // Validate sharing data
      const validationResult = await this.validateSharingData(sharingData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate sharing ID
      const sharingId = this.generateSharingId();

      // Create sharing link
      const sharingLink = {
        id: sharingId,
        user_id: userId,
        type: sharingData.type,
        resource_id: sharingData.resourceId,
        resource_type: sharingData.resourceType,
        permissions: sharingData.permissions || ['view'],
        access_level: sharingData.accessLevel || 'public',
        expires_at: sharingData.expiresAt || this.calculateDefaultExpiration(sharingData.type),
        password: sharingData.password || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Generate sharing URL
      sharingLink.sharing_url = await this.generateSharingUrl(sharingId);

      // Store sharing link
      await this.storeSharingLink(userId, sharingLink);

      // Update in-memory sharing links
      this.sharingLinks.set(sharingId, sharingLink);

      logger.info('Sharing link created successfully', { 
        userId, 
        sharingId, 
        sharingType: sharingData.type 
      });

      return {
        success: true,
        sharingLink: sharingLink
      };
    } catch (error) {
      logger.error('Failed to create sharing link', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update sharing permissions
   */
  async updateSharingPermissions(userId, sharingId, permissions) {
    try {
      logger.info('Updating sharing permissions', { userId, sharingId });

      const sharingLink = this.sharingLinks.get(sharingId);
      if (!sharingLink) {
        return { success: false, error: 'Sharing link not found' };
      }

      if (sharingLink.user_id !== userId) {
        return { success: false, error: 'Unauthorized to update sharing link' };
      }

      // Update permissions
      const updatedSharingLink = {
        ...sharingLink,
        permissions: permissions,
        updated_at: new Date().toISOString()
      };

      // Store updated sharing link
      await this.storeSharingLink(userId, updatedSharingLink);

      // Update in-memory sharing link
      this.sharingLinks.set(sharingId, updatedSharingLink);

      logger.info('Sharing permissions updated successfully', { userId, sharingId });

      return {
        success: true,
        sharingLink: updatedSharingLink
      };
    } catch (error) {
      logger.error('Failed to update sharing permissions', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke sharing link
   */
  async revokeSharingLink(userId, sharingId) {
    try {
      logger.info('Revoking sharing link', { userId, sharingId });

      const sharingLink = this.sharingLinks.get(sharingId);
      if (!sharingLink) {
        return { success: false, error: 'Sharing link not found' };
      }

      if (sharingLink.user_id !== userId) {
        return { success: false, error: 'Unauthorized to revoke sharing link' };
      }

      // Update sharing link status
      const updatedSharingLink = {
        ...sharingLink,
        is_active: false,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store updated sharing link
      await this.storeSharingLink(userId, updatedSharingLink);

      // Update in-memory sharing link
      this.sharingLinks.set(sharingId, updatedSharingLink);

      logger.info('Sharing link revoked successfully', { userId, sharingId });

      return {
        success: true,
        sharingLink: updatedSharingLink
      };
    } catch (error) {
      logger.error('Failed to revoke sharing link', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Access shared resource
   */
  async accessSharedResource(sharingId, accessData = {}) {
    try {
      logger.info('Accessing shared resource', { sharingId });

      const sharingLink = this.sharingLinks.get(sharingId);
      if (!sharingLink) {
        return { success: false, error: 'Sharing link not found' };
      }

      // Check if sharing link is active
      if (!sharingLink.is_active) {
        return { success: false, error: 'Sharing link is no longer active' };
      }

      // Check if sharing link has expired
      if (new Date(sharingLink.expires_at) < new Date()) {
        return { success: false, error: 'Sharing link has expired' };
      }

      // Check password if required
      if (sharingLink.password && accessData.password !== sharingLink.password) {
        return { success: false, error: 'Invalid password' };
      }

      // Get shared resource
      const resource = await this.getSharedResource(sharingLink);

      // Record access
      await this.recordAccess(sharingId, accessData);

      logger.info('Shared resource accessed successfully', { sharingId });

      return {
        success: true,
        resource: resource,
        permissions: sharingLink.permissions,
        accessLevel: sharingLink.access_level
      };
    } catch (error) {
      logger.error('Failed to access shared resource', { error: error.message, sharingId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sharing metrics
   */
  async getSharingMetrics(userId) {
    try {
      const userSharingLinks = Array.from(this.sharingLinks.values()).filter(link => 
        link.user_id === userId
      );

      const userSharingHistory = this.sharingHistory.get(userId) || [];

      const metrics = {
        totalSharingLinks: userSharingLinks.length,
        activeSharingLinks: userSharingLinks.filter(link => link.is_active).length,
        expiredSharingLinks: userSharingLinks.filter(link => new Date(link.expires_at) < new Date()).length,
        sharingLinksByType: this.groupSharingLinksByType(userSharingLinks),
        sharingLinksByAccessLevel: this.groupSharingLinksByAccessLevel(userSharingLinks),
        totalAccesses: userSharingHistory.length,
        uniqueAccesses: this.calculateUniqueAccesses(userSharingHistory)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get sharing metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sharing insights
   */
  async getSharingInsights(userId) {
    try {
      const userSharingLinks = Array.from(this.sharingLinks.values()).filter(link => 
        link.user_id === userId
      );

      const userSharingHistory = this.sharingHistory.get(userId) || [];

      const insights = {
        sharingTrends: this.analyzeSharingTrends(userSharingLinks),
        accessPatterns: this.analyzeAccessPatterns(userSharingHistory),
        popularResources: this.analyzePopularResources(userSharingLinks, userSharingHistory),
        recommendations: this.generateSharingRecommendations(userSharingLinks, userSharingHistory)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get sharing insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shared resource
   */
  async getSharedResource(sharingLink) {
    try {
      let resource;
      switch (sharingLink.resource_type) {
        case 'dashboard':
          resource = await this.getSharedDashboard(sharingLink.resource_id);
          break;
        case 'visualization':
          resource = await this.getSharedVisualization(sharingLink.resource_id);
          break;
        case 'export':
          resource = await this.getSharedExport(sharingLink.resource_id);
          break;
        case 'report':
          resource = await this.getSharedReport(sharingLink.resource_id);
          break;
        default:
          throw new Error(`Unknown resource type: ${sharingLink.resource_type}`);
      }

      return resource;
    } catch (error) {
      logger.error('Failed to get shared resource', { error: error.message, resourceId: sharingLink.resource_id });
      throw error;
    }
  }

  /**
   * Get shared dashboard
   */
  async getSharedDashboard(dashboardId) {
    try {
      // In a real implementation, this would fetch from the dashboard system
      const dashboard = {
        id: dashboardId,
        name: 'Shared Dashboard',
        components: [
          { type: 'chart', title: 'Sales Chart', data: Array.from({ length: 10 }, () => Math.random() * 100) },
          { type: 'metric', title: 'Total Sales', value: 125000 }
        ],
        layout: 'grid'
      };

      return dashboard;
    } catch (error) {
      logger.error('Failed to get shared dashboard', { error: error.message, dashboardId });
      throw error;
    }
  }

  /**
   * Get shared visualization
   */
  async getSharedVisualization(visualizationId) {
    try {
      // In a real implementation, this would fetch from the visualization system
      const visualization = {
        id: visualizationId,
        name: 'Shared Visualization',
        type: 'chart',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [{
            label: 'Data',
            data: [65, 59, 80, 81, 56],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        }
      };

      return visualization;
    } catch (error) {
      logger.error('Failed to get shared visualization', { error: error.message, visualizationId });
      throw error;
    }
  }

  /**
   * Get shared export
   */
  async getSharedExport(exportId) {
    try {
      // In a real implementation, this would fetch from the export system
      const exportData = {
        id: exportId,
        name: 'Shared Export',
        format: 'csv',
        downloadUrl: `https://exports.example.com/download/${exportId}`,
        size: 1024,
        createdAt: new Date().toISOString()
      };

      return exportData;
    } catch (error) {
      logger.error('Failed to get shared export', { error: error.message, exportId });
      throw error;
    }
  }

  /**
   * Get shared report
   */
  async getSharedReport(reportId) {
    try {
      // In a real implementation, this would fetch from the report system
      const report = {
        id: reportId,
        name: 'Shared Report',
        content: 'This is a shared analytics report with insights and data.',
        charts: [
          { type: 'bar', title: 'Performance Chart', data: Array.from({ length: 5 }, () => Math.random() * 100) }
        ],
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      logger.error('Failed to get shared report', { error: error.message, reportId });
      throw error;
    }
  }

  /**
   * Record access
   */
  async recordAccess(sharingId, accessData) {
    try {
      const accessRecord = {
        sharing_id: sharingId,
        accessed_at: new Date().toISOString(),
        ip_address: accessData.ipAddress || 'unknown',
        user_agent: accessData.userAgent || 'unknown',
        referrer: accessData.referrer || null
      };

      const { error } = await supabase
        .from('analytics_sharing_access')
        .insert(accessRecord);

      if (error) throw error;

      // Update in-memory history
      const sharingLink = this.sharingLinks.get(sharingId);
      if (sharingLink) {
        if (!this.sharingHistory.has(sharingLink.user_id)) {
          this.sharingHistory.set(sharingLink.user_id, []);
        }
        this.sharingHistory.get(sharingLink.user_id).push(accessRecord);
      }
    } catch (error) {
      logger.error('Failed to record access', { error: error.message, sharingId });
    }
  }

  /**
   * Generate sharing URL
   */
  async generateSharingUrl(sharingId) {
    try {
      // In a real implementation, this would generate a proper sharing URL
      const sharingUrl = `https://analytics.example.com/shared/${sharingId}`;
      
      return sharingUrl;
    } catch (error) {
      logger.error('Failed to generate sharing URL', { error: error.message, sharingId });
      throw error;
    }
  }

  /**
   * Calculate default expiration
   */
  calculateDefaultExpiration(sharingType) {
    const expirationDays = {
      temporary: 1,
      short_term: 7,
      medium_term: 30,
      long_term: 90,
      permanent: 365
    };

    const days = expirationDays[sharingType] || 30;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    
    return expirationDate.toISOString();
  }

  /**
   * Load sharing configurations
   */
  async loadSharingConfigs(userId) {
    try {
      const { data: configs, error } = await supabase
        .from('analytics_sharing_configs')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      configs.forEach(config => {
        this.sharingConfigs.set(config.id, config);
      });

      logger.info('Sharing configurations loaded', { userId, configCount: configs.length });
    } catch (error) {
      logger.error('Failed to load sharing configurations', { error: error.message, userId });
    }
  }

  /**
   * Load sharing links
   */
  async loadSharingLinks(userId) {
    try {
      const { data: links, error } = await supabase
        .from('analytics_sharing_links')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      links.forEach(link => {
        this.sharingLinks.set(link.id, link);
      });

      logger.info('Sharing links loaded', { userId, linkCount: links.length });
    } catch (error) {
      logger.error('Failed to load sharing links', { error: error.message, userId });
    }
  }

  /**
   * Load sharing history
   */
  async loadSharingHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('analytics_sharing_access')
        .select('*')
        .eq('user_id', userId)
        .order('accessed_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.sharingHistory.set(userId, history || []);
      logger.info('Sharing history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load sharing history', { error: error.message, userId });
    }
  }

  /**
   * Reset sharing system for user
   */
  async reset(userId) {
    try {
      this.sharingConfigs.clear();
      this.sharingLinks.clear();
      this.sharingPermissions.delete(userId);
      this.sharingHistory.delete(userId);

      logger.info('Sharing system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset sharing system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
