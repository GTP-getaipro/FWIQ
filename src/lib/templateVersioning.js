/**
 * Template Versioning System
 * Manages template versions, history, and rollback functionality
 */

import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class TemplateVersioning {
  constructor() {
    this.versionHistory = new Map();
    this.maxVersionsPerTemplate = 10;
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimers = new Map();
  }

  /**
   * Create a new version of a template
   * @param {string} templateId - Template ID
   * @param {Object} templateData - Template data
   * @param {string} changeDescription - Description of changes
   * @param {string} userId - User ID
   * @returns {Object} Version data
   */
  async createVersion(templateId, templateData, changeDescription, userId) {
    try {
      const version = {
        id: this.generateVersionId(),
        templateId,
        version: await this.getNextVersionNumber(templateId),
        data: { ...templateData },
        changeDescription,
        userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        metadata: {
          size: JSON.stringify(templateData).length,
          checksum: this.generateChecksum(templateData),
          diff: await this.generateDiff(templateId, templateData)
        }
      };

      // Store in memory
      if (!this.versionHistory.has(templateId)) {
        this.versionHistory.set(templateId, []);
      }
      this.versionHistory.get(templateId).push(version);

      // Store in database
      await this.saveVersionToDatabase(version);

      // Clean up old versions
      await this.cleanupOldVersions(templateId);

      logger.info('Template version created', { templateId, version: version.version, userId });
      return version;
    } catch (error) {
      logger.error('Failed to create template version', { templateId, error: error.message });
      throw error;
    }
  }

  /**
   * Get version history for a template
   * @param {string} templateId - Template ID
   * @returns {Array} Version history
   */
  async getVersionHistory(templateId) {
    try {
      // Check memory first
      if (this.versionHistory.has(templateId)) {
        return this.versionHistory.get(templateId);
      }

      // Load from database
      const { data: versions, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version', { ascending: false });

      if (error) throw error;

      // Store in memory
      this.versionHistory.set(templateId, versions || []);

      return versions || [];
    } catch (error) {
      logger.error('Failed to get version history', { templateId, error: error.message });
      return [];
    }
  }

  /**
   * Get a specific version of a template
   * @param {string} templateId - Template ID
   * @param {number} version - Version number
   * @returns {Object} Version data
   */
  async getVersion(templateId, version) {
    try {
      const { data: versionData, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('template_id', templateId)
        .eq('version', version)
        .single();

      if (error) throw error;
      return versionData;
    } catch (error) {
      logger.error('Failed to get template version', { templateId, version, error: error.message });
      throw error;
    }
  }

  /**
   * Restore a template to a specific version
   * @param {string} templateId - Template ID
   * @param {number} version - Version number to restore
   * @param {string} userId - User ID
   * @returns {Object} Restored template
   */
  async restoreVersion(templateId, version, userId) {
    try {
      const versionData = await this.getVersion(templateId, version);
      if (!versionData) {
        throw new Error(`Version ${version} not found for template ${templateId}`);
      }

      // Create a new version with the restored data
      const restoredVersion = await this.createVersion(
        templateId,
        versionData.data,
        `Restored from version ${version}`,
        userId
      );

      logger.info('Template version restored', { templateId, fromVersion: version, toVersion: restoredVersion.version });
      return restoredVersion;
    } catch (error) {
      logger.error('Failed to restore template version', { templateId, version, error: error.message });
      throw error;
    }
  }

  /**
   * Compare two versions of a template
   * @param {string} templateId - Template ID
   * @param {number} version1 - First version
   * @param {number} version2 - Second version
   * @returns {Object} Comparison result
   */
  async compareVersions(templateId, version1, version2) {
    try {
      const [v1Data, v2Data] = await Promise.all([
        this.getVersion(templateId, version1),
        this.getVersion(templateId, version2)
      ]);

      if (!v1Data || !v2Data) {
        throw new Error('One or both versions not found');
      }

      const comparison = {
        templateId,
        version1: {
          version: v1Data.version,
          createdAt: v1Data.createdAt,
          changeDescription: v1Data.changeDescription,
          data: v1Data.data
        },
        version2: {
          version: v2Data.version,
          createdAt: v2Data.createdAt,
          changeDescription: v2Data.changeDescription,
          data: v2Data.data
        },
        differences: this.calculateDifferences(v1Data.data, v2Data.data),
        summary: this.generateComparisonSummary(v1Data.data, v2Data.data)
      };

      return comparison;
    } catch (error) {
      logger.error('Failed to compare template versions', { templateId, version1, version2, error: error.message });
      throw error;
    }
  }

  /**
   * Get template statistics
   * @param {string} templateId - Template ID
   * @returns {Object} Template statistics
   */
  async getTemplateStatistics(templateId) {
    try {
      const versions = await this.getVersionHistory(templateId);
      
      if (versions.length === 0) {
        return {
          totalVersions: 0,
          firstVersion: null,
          lastVersion: null,
          averageChangesPerVersion: 0,
          mostActiveUser: null,
          versionFrequency: {}
        };
      }

      const stats = {
        totalVersions: versions.length,
        firstVersion: versions[versions.length - 1],
        lastVersion: versions[0],
        averageChangesPerVersion: this.calculateAverageChanges(versions),
        mostActiveUser: this.findMostActiveUser(versions),
        versionFrequency: this.calculateVersionFrequency(versions),
        totalSize: versions.reduce((sum, v) => sum + (v.metadata?.size || 0), 0),
        averageSize: 0
      };

      stats.averageSize = stats.totalSize / stats.totalVersions;

      return stats;
    } catch (error) {
      logger.error('Failed to get template statistics', { templateId, error: error.message });
      return null;
    }
  }

  /**
   * Enable auto-save for a template
   * @param {string} templateId - Template ID
   * @param {Function} getCurrentData - Function to get current template data
   * @param {string} userId - User ID
   */
  enableAutoSave(templateId, getCurrentData, userId) {
    if (this.autoSaveTimers.has(templateId)) {
      this.disableAutoSave(templateId);
    }

    const timer = setInterval(async () => {
      try {
        const currentData = getCurrentData();
        if (currentData && this.hasChanges(templateId, currentData)) {
          await this.createVersion(
            templateId,
            currentData,
            'Auto-save',
            userId
          );
        }
      } catch (error) {
        logger.error('Auto-save failed', { templateId, error: error.message });
      }
    }, this.autoSaveInterval);

    this.autoSaveTimers.set(templateId, timer);
  }

  /**
   * Disable auto-save for a template
   * @param {string} templateId - Template ID
   */
  disableAutoSave(templateId) {
    const timer = this.autoSaveTimers.get(templateId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(templateId);
    }
  }

  /**
   * Delete a specific version
   * @param {string} templateId - Template ID
   * @param {number} version - Version number
   * @returns {boolean} Success status
   */
  async deleteVersion(templateId, version) {
    try {
      const { error } = await supabase
        .from('template_versions')
        .delete()
        .eq('template_id', templateId)
        .eq('version', version);

      if (error) throw error;

      // Update memory cache
      if (this.versionHistory.has(templateId)) {
        const versions = this.versionHistory.get(templateId);
        const updatedVersions = versions.filter(v => v.version !== version);
        this.versionHistory.set(templateId, updatedVersions);
      }

      logger.info('Template version deleted', { templateId, version });
      return true;
    } catch (error) {
      logger.error('Failed to delete template version', { templateId, version, error: error.message });
      return false;
    }
  }

  /**
   * Clean up old versions for a template
   * @param {string} templateId - Template ID
   */
  async cleanupOldVersions(templateId) {
    try {
      const versions = await this.getVersionHistory(templateId);
      
      if (versions.length > this.maxVersionsPerTemplate) {
        const versionsToDelete = versions.slice(this.maxVersionsPerTemplate);
        
        for (const version of versionsToDelete) {
          await this.deleteVersion(templateId, version.version);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old versions', { templateId, error: error.message });
    }
  }

  // Helper methods
  generateVersionId() {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getNextVersionNumber(templateId) {
    const versions = await this.getVersionHistory(templateId);
    return versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;
  }

  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async generateDiff(templateId, newData) {
    try {
      const versions = await this.getVersionHistory(templateId);
      if (versions.length === 0) return null;

      const lastVersion = versions[0];
      return this.calculateDifferences(lastVersion.data, newData);
    } catch (error) {
      logger.error('Failed to generate diff', { templateId, error: error.message });
      return null;
    }
  }

  calculateDifferences(data1, data2) {
    const differences = {
      subject: data1.subject !== data2.subject,
      html: data1.html !== data2.html,
      text: data1.text !== data2.text,
      category: data1.category !== data2.category,
      tags: JSON.stringify(data1.tags) !== JSON.stringify(data2.tags)
    };

    return differences;
  }

  generateComparisonSummary(data1, data2) {
    const differences = this.calculateDifferences(data1, data2);
    const changedFields = Object.keys(differences).filter(key => differences[key]);
    
    return {
      hasChanges: changedFields.length > 0,
      changedFields,
      changeCount: changedFields.length,
      summary: changedFields.length > 0 
        ? `Changed: ${changedFields.join(', ')}`
        : 'No changes detected'
    };
  }

  calculateAverageChanges(versions) {
    if (versions.length < 2) return 0;
    
    let totalChanges = 0;
    for (let i = 1; i < versions.length; i++) {
      const diff = this.calculateDifferences(versions[i].data, versions[i-1].data);
      totalChanges += Object.values(diff).filter(Boolean).length;
    }
    
    return totalChanges / (versions.length - 1);
  }

  findMostActiveUser(versions) {
    const userCounts = {};
    versions.forEach(version => {
      userCounts[version.userId] = (userCounts[version.userId] || 0) + 1;
    });
    
    return Object.keys(userCounts).reduce((a, b) => 
      userCounts[a] > userCounts[b] ? a : b
    );
  }

  calculateVersionFrequency(versions) {
    const frequency = {};
    versions.forEach(version => {
      const date = new Date(version.createdAt).toISOString().split('T')[0];
      frequency[date] = (frequency[date] || 0) + 1;
    });
    
    return frequency;
  }

  hasChanges(templateId, currentData) {
    if (!this.versionHistory.has(templateId)) return true;
    
    const versions = this.versionHistory.get(templateId);
    if (versions.length === 0) return true;
    
    const lastVersion = versions[0];
    const differences = this.calculateDifferences(lastVersion.data, currentData);
    
    return Object.values(differences).some(Boolean);
  }

  async saveVersionToDatabase(version) {
    try {
      const { error } = await supabase
        .from('template_versions')
        .insert({
          id: version.id,
          template_id: version.templateId,
          version: version.version,
          data: version.data,
          change_description: version.changeDescription,
          user_id: version.userId,
          created_at: version.createdAt,
          is_active: version.isActive,
          metadata: version.metadata
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to save version to database', { versionId: version.id, error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.autoSaveTimers.forEach(timer => clearInterval(timer));
    this.autoSaveTimers.clear();
    this.versionHistory.clear();
  }
}

export default TemplateVersioning;
