/**
 * Rule Versioning
 * Implements rule versioning, rollback, and change tracking capabilities
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class RuleVersioning {
  constructor() {
    this.versionHistory = new Map();
    this.rollbackQueue = new Map();
    this.changeTracking = new Map();
    this.autoVersioning = true;
    this.maxVersionsPerRule = 10;
  }

  /**
   * Create a new version of a rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} ruleData - New rule data
   * @param {Object} options - Versioning options
   * @returns {Promise<Object>} Version information
   */
  async createRuleVersion(ruleId, ruleData, options = {}) {
    try {
      // Get current rule
      const { data: currentRule, error: fetchError } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (fetchError || !currentRule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      // Create version record
      const version = {
        rule_id: ruleId,
        version_number: await this.getNextVersionNumber(ruleId),
        rule_data: currentRule,
        changes: this.calculateChanges(currentRule, ruleData),
        change_type: options.changeType || 'update',
        change_reason: options.changeReason || 'Rule updated',
        changed_by: options.userId,
        changed_at: new Date().toISOString(),
        is_active: false,
        metadata: {
          auto_created: options.autoCreated || false,
          rollback_available: true,
          ...options.metadata
        }
      };

      // Store version
      const { data: versionRecord, error: versionError } = await supabase
        .from('rule_versions')
        .insert(version)
        .select()
        .single();

      if (versionError) throw versionError;

      // Update current rule
      const { data: updatedRule, error: updateError } = await supabase
        .from('escalation_rules')
        .update({
          ...ruleData,
          version: version.version_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Cache version
      this.versionHistory.set(`${ruleId}_${version.version_number}`, versionRecord);

      // Clean up old versions if needed
      await this.cleanupOldVersions(ruleId);

      logger.info('Rule version created successfully', {
        ruleId,
        versionNumber: version.version_number,
        changeType: version.change_type,
        changesCount: version.changes.length
      });

      return {
        version: versionRecord,
        updatedRule,
        changes: version.changes
      };

    } catch (error) {
      logger.error('Failed to create rule version', {
        ruleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Rollback rule to a previous version
   * @param {string} ruleId - Rule identifier
   * @param {number} versionNumber - Version number to rollback to
   * @param {Object} options - Rollback options
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackRule(ruleId, versionNumber, options = {}) {
    try {
      // Get version to rollback to
      const version = await this.getRuleVersion(ruleId, versionNumber);
      if (!version) {
        throw new Error(`Version ${versionNumber} not found for rule ${ruleId}`);
      }

      // Create rollback version (current state)
      const rollbackVersion = await this.createRuleVersion(ruleId, {}, {
        changeType: 'rollback',
        changeReason: `Rollback to version ${versionNumber}`,
        userId: options.userId,
        autoCreated: true,
        metadata: {
          rollback_from_version: versionNumber,
          rollback_reason: options.reason || 'User requested rollback'
        }
      });

      // Restore rule to previous version
      const { data: restoredRule, error: restoreError } = await supabase
        .from('escalation_rules')
        .update({
          ...version.rule_data,
          version: version.version_number,
          updated_at: new Date().toISOString(),
          rollback_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (restoreError) throw restoreError;

      // Mark version as active
      await this.markVersionAsActive(ruleId, versionNumber);

      // Store rollback information
      this.rollbackQueue.set(`${ruleId}_${Date.now()}`, {
        ruleId,
        fromVersion: rollbackVersion.version.version_number,
        toVersion: versionNumber,
        rolledBackAt: new Date().toISOString(),
        rolledBackBy: options.userId,
        reason: options.reason
      });

      logger.info('Rule rollback completed successfully', {
        ruleId,
        fromVersion: rollbackVersion.version.version_number,
        toVersion: versionNumber,
        rolledBackBy: options.userId
      });

      return {
        success: true,
        restoredRule,
        rollbackVersion: rollbackVersion.version,
        targetVersion: version
      };

    } catch (error) {
      logger.error('Rule rollback failed', {
        ruleId,
        versionNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get rule version history
   * @param {string} ruleId - Rule identifier
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Version history
   */
  async getRuleVersionHistory(ruleId, options = {}) {
    try {
      const { data: versions, error } = await supabase
        .from('rule_versions')
        .select('*')
        .eq('rule_id', ruleId)
        .order('version_number', { ascending: false })
        .limit(options.limit || 50);

      if (error) throw error;

      // Cache versions
      versions.forEach(version => {
        this.versionHistory.set(`${ruleId}_${version.version_number}`, version);
      });

      logger.debug('Rule version history retrieved', {
        ruleId,
        versionCount: versions.length
      });

      return versions;

    } catch (error) {
      logger.error('Failed to get rule version history', {
        ruleId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get specific rule version
   * @param {string} ruleId - Rule identifier
   * @param {number} versionNumber - Version number
   * @returns {Promise<Object>} Version data
   */
  async getRuleVersion(ruleId, versionNumber) {
    try {
      const cacheKey = `${ruleId}_${versionNumber}`;
      
      // Check cache first
      if (this.versionHistory.has(cacheKey)) {
        return this.versionHistory.get(cacheKey);
      }

      // Fetch from database
      const { data: version, error } = await supabase
        .from('rule_versions')
        .select('*')
        .eq('rule_id', ruleId)
        .eq('version_number', versionNumber)
        .single();

      if (error) throw error;

      // Cache version
      this.versionHistory.set(cacheKey, version);

      return version;

    } catch (error) {
      logger.error('Failed to get rule version', {
        ruleId,
        versionNumber,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Compare two rule versions
   * @param {string} ruleId - Rule identifier
   * @param {number} version1 - First version number
   * @param {number} version2 - Second version number
   * @returns {Promise<Object>} Comparison result
   */
  async compareRuleVersions(ruleId, version1, version2) {
    try {
      const [v1, v2] = await Promise.all([
        this.getRuleVersion(ruleId, version1),
        this.getRuleVersion(ruleId, version2)
      ]);

      if (!v1 || !v2) {
        throw new Error('One or both versions not found');
      }

      const comparison = {
        ruleId,
        version1: {
          number: v1.version_number,
          data: v1.rule_data,
          createdAt: v1.changed_at
        },
        version2: {
          number: v2.version_number,
          data: v2.rule_data,
          createdAt: v2.changed_at
        },
        differences: this.calculateDifferences(v1.rule_data, v2.rule_data),
        summary: {
          fieldsChanged: 0,
          fieldsAdded: 0,
          fieldsRemoved: 0
        }
      };

      // Calculate summary
      comparison.differences.forEach(diff => {
        switch (diff.type) {
          case 'changed':
            comparison.summary.fieldsChanged++;
            break;
          case 'added':
            comparison.summary.fieldsAdded++;
            break;
          case 'removed':
            comparison.summary.fieldsRemoved++;
            break;
        }
      });

      logger.debug('Rule versions compared', {
        ruleId,
        version1,
        version2,
        differencesCount: comparison.differences.length
      });

      return comparison;

    } catch (error) {
      logger.error('Failed to compare rule versions', {
        ruleId,
        version1,
        version2,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get next version number for rule
   * @param {string} ruleId - Rule identifier
   * @returns {Promise<number>} Next version number
   */
  async getNextVersionNumber(ruleId) {
    try {
      const { data: latestVersion, error } = await supabase
        .from('rule_versions')
        .select('version_number')
        .eq('rule_id', ruleId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return latestVersion ? latestVersion.version_number + 1 : 1;

    } catch (error) {
      logger.error('Failed to get next version number', {
        ruleId,
        error: error.message
      });
      return 1;
    }
  }

  /**
   * Calculate changes between rule versions
   * @param {Object} oldRule - Old rule data
   * @param {Object} newRule - New rule data
   * @returns {Array} Array of changes
   */
  calculateChanges(oldRule, newRule) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldRule), ...Object.keys(newRule)]);

    allKeys.forEach(key => {
      const oldValue = oldRule[key];
      const newValue = newRule[key];

      if (oldValue !== newValue) {
        if (oldValue === undefined) {
          changes.push({
            field: key,
            type: 'added',
            oldValue: null,
            newValue: newValue
          });
        } else if (newValue === undefined) {
          changes.push({
            field: key,
            type: 'removed',
            oldValue: oldValue,
            newValue: null
          });
        } else {
          changes.push({
            field: key,
            type: 'changed',
            oldValue: oldValue,
            newValue: newValue
          });
        }
      }
    });

    return changes;
  }

  /**
   * Calculate differences between two objects
   * @param {Object} obj1 - First object
   * @param {Object} obj2 - Second object
   * @returns {Array} Array of differences
   */
  calculateDifferences(obj1, obj2) {
    return this.calculateChanges(obj1, obj2);
  }

  /**
   * Mark version as active
   * @param {string} ruleId - Rule identifier
   * @param {number} versionNumber - Version number
   */
  async markVersionAsActive(ruleId, versionNumber) {
    try {
      // Deactivate all versions for this rule
      await supabase
        .from('rule_versions')
        .update({ is_active: false })
        .eq('rule_id', ruleId);

      // Activate the specified version
      await supabase
        .from('rule_versions')
        .update({ is_active: true })
        .eq('rule_id', ruleId)
        .eq('version_number', versionNumber);

      logger.debug('Version marked as active', { ruleId, versionNumber });

    } catch (error) {
      logger.error('Failed to mark version as active', {
        ruleId,
        versionNumber,
        error: error.message
      });
    }
  }

  /**
   * Clean up old versions
   * @param {string} ruleId - Rule identifier
   */
  async cleanupOldVersions(ruleId) {
    try {
      // Get version count
      const { data: versions, error: countError } = await supabase
        .from('rule_versions')
        .select('id, version_number')
        .eq('rule_id', ruleId)
        .order('version_number', { ascending: false });

      if (countError) throw countError;

      // If we have more than max versions, delete the oldest ones
      if (versions.length > this.maxVersionsPerRule) {
        const versionsToDelete = versions.slice(this.maxVersionsPerRule);
        const idsToDelete = versionsToDelete.map(v => v.id);

        await supabase
          .from('rule_versions')
          .delete()
          .in('id', idsToDelete);

        logger.info('Old rule versions cleaned up', {
          ruleId,
          deletedCount: versionsToDelete.length,
          remainingCount: this.maxVersionsPerRule
        });
      }

    } catch (error) {
      logger.error('Failed to cleanup old versions', {
        ruleId,
        error: error.message
      });
    }
  }

  /**
   * Track rule changes
   * @param {string} ruleId - Rule identifier
   * @param {Object} changeData - Change data
   */
  trackRuleChange(ruleId, changeData) {
    const change = {
      ruleId,
      timestamp: new Date().toISOString(),
      changeType: changeData.changeType || 'unknown',
      userId: changeData.userId,
      details: changeData.details || {},
      metadata: changeData.metadata || {}
    };

    const changeKey = `${ruleId}_${Date.now()}`;
    this.changeTracking.set(changeKey, change);

    logger.debug('Rule change tracked', {
      ruleId,
      changeType: change.changeType,
      userId: change.userId
    });
  }

  /**
   * Get change history for rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} options - Query options
   * @returns {Array} Change history
   */
  getRuleChangeHistory(ruleId, options = {}) {
    const changes = Array.from(this.changeTracking.values())
      .filter(change => change.ruleId === ruleId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (options.limit) {
      return changes.slice(0, options.limit);
    }

    return changes;
  }

  /**
   * Create rule snapshot
   * @param {string} ruleId - Rule identifier
   * @param {Object} options - Snapshot options
   * @returns {Promise<Object>} Snapshot data
   */
  async createRuleSnapshot(ruleId, options = {}) {
    try {
      const { data: rule, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error || !rule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      const snapshot = {
        ruleId,
        snapshotId: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleData: rule,
        createdAt: new Date().toISOString(),
        createdBy: options.userId,
        purpose: options.purpose || 'backup',
        metadata: options.metadata || {}
      };

      // Store snapshot
      const { data: snapshotRecord, error: snapshotError } = await supabase
        .from('rule_snapshots')
        .insert(snapshot)
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      logger.info('Rule snapshot created', {
        ruleId,
        snapshotId: snapshot.snapshotId,
        purpose: snapshot.purpose
      });

      return snapshotRecord;

    } catch (error) {
      logger.error('Failed to create rule snapshot', {
        ruleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Restore rule from snapshot
   * @param {string} ruleId - Rule identifier
   * @param {string} snapshotId - Snapshot identifier
   * @param {Object} options - Restore options
   * @returns {Promise<Object>} Restore result
   */
  async restoreRuleFromSnapshot(ruleId, snapshotId, options = {}) {
    try {
      // Get snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from('rule_snapshots')
        .select('*')
        .eq('rule_id', ruleId)
        .eq('snapshot_id', snapshotId)
        .single();

      if (snapshotError || !snapshot) {
        throw new Error(`Snapshot not found: ${snapshotId}`);
      }

      // Create version before restore
      await this.createRuleVersion(ruleId, {}, {
        changeType: 'pre_restore',
        changeReason: `Pre-restore backup before restoring from snapshot ${snapshotId}`,
        userId: options.userId,
        autoCreated: true
      });

      // Restore rule
      const { data: restoredRule, error: restoreError } = await supabase
        .from('escalation_rules')
        .update({
          ...snapshot.rule_data,
          updated_at: new Date().toISOString(),
          restored_from_snapshot: snapshotId
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (restoreError) throw restoreError;

      logger.info('Rule restored from snapshot', {
        ruleId,
        snapshotId,
        restoredBy: options.userId
      });

      return {
        success: true,
        restoredRule,
        snapshot
      };

    } catch (error) {
      logger.error('Failed to restore rule from snapshot', {
        ruleId,
        snapshotId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get versioning statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Versioning statistics
   */
  async getVersioningStatistics(userId) {
    try {
      const { data: stats, error } = await supabase
        .from('rule_versions')
        .select('rule_id, version_number, changed_at')
        .eq('changed_by', userId);

      if (error) throw error;

      const statistics = {
        totalVersions: stats.length,
        rulesWithVersions: new Set(stats.map(s => s.rule_id)).size,
        versionsThisMonth: stats.filter(s => {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return new Date(s.changed_at) > monthAgo;
        }).length,
        averageVersionsPerRule: stats.length / new Set(stats.map(s => s.rule_id)).size || 0,
        rollbackCount: this.rollbackQueue.size,
        changeTrackingCount: this.changeTracking.size
      };

      return statistics;

    } catch (error) {
      logger.error('Failed to get versioning statistics', {
        userId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Enable/disable auto versioning
   * @param {boolean} enabled - Auto versioning enabled
   */
  setAutoVersioning(enabled) {
    this.autoVersioning = enabled;
    logger.info('Auto versioning updated', { enabled });
  }

  /**
   * Set maximum versions per rule
   * @param {number} maxVersions - Maximum versions
   */
  setMaxVersionsPerRule(maxVersions) {
    this.maxVersionsPerRule = maxVersions;
    logger.info('Maximum versions per rule updated', { maxVersions });
  }

  /**
   * Clear version cache
   * @param {string} ruleId - Rule ID (optional)
   */
  clearVersionCache(ruleId = null) {
    if (ruleId) {
      // Clear specific rule's versions
      for (const [key, value] of this.versionHistory.entries()) {
        if (key.startsWith(`${ruleId}_`)) {
          this.versionHistory.delete(key);
        }
      }
    } else {
      // Clear all versions
      this.versionHistory.clear();
    }

    logger.info('Version cache cleared', { ruleId });
  }
}

// Export singleton instance
export const ruleVersioning = new RuleVersioning();
