/**
 * Advanced User Permissions System
 * 
 * Handles advanced user permissions, role-based access control,
 * and permission management.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AdvancedPermissions {
  constructor() {
    this.permissionSets = new Map();
    this.roleDefinitions = new Map();
    this.permissionRules = new Map();
    this.accessControlLists = new Map();
    this.permissionHistory = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize advanced permissions system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Advanced Permissions', { userId });

      // Load permission sets and role definitions
      await this.loadPermissionSets(userId);
      await this.loadRoleDefinitions(userId);
      await this.loadPermissionRules(userId);
      await this.loadAccessControlLists(userId);
      await this.loadPermissionHistory(userId);

      this.isInitialized = true;
      logger.info('Advanced Permissions initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Advanced Permissions', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute permission action
   */
  async executePermissionAction(userId, permissionData) {
    try {
      logger.info('Executing permission action', { userId, action: permissionData.action });

      // Validate permission data
      const validationResult = await this.validatePermissionData(permissionData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Execute permission action based on type
      let permissionResult;
      switch (permissionData.action) {
        case 'grant':
          permissionResult = await this.grantPermissions(userId, permissionData);
          break;
        case 'revoke':
          permissionResult = await this.revokePermissions(userId, permissionData);
          break;
        case 'update':
          permissionResult = await this.updatePermissions(userId, permissionData);
          break;
        case 'assign_role':
          permissionResult = await this.assignRole(userId, permissionData);
          break;
        case 'remove_role':
          permissionResult = await this.removeRole(userId, permissionData);
          break;
        case 'create_role':
          permissionResult = await this.createRole(userId, permissionData);
          break;
        case 'delete_role':
          permissionResult = await this.deleteRole(userId, permissionData);
          break;
        case 'check_access':
          permissionResult = await this.checkAccess(userId, permissionData);
          break;
        default:
          throw new Error(`Unknown permission action: ${permissionData.action}`);
      }

      // Store permission result
      await this.storePermissionResult(userId, permissionResult);

      logger.info('Permission action executed successfully', { 
        userId, 
        action: permissionData.action,
        targetUserId: permissionData.targetUserId
      });

      return permissionResult;
    } catch (error) {
      logger.error('Failed to execute permission action', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Grant permissions
   */
  async grantPermissions(userId, permissionData) {
    try {
      const targetUserId = permissionData.targetUserId;
      const permissions = permissionData.permissions || [];
      const grantConfig = permissionData.config || {};

      // Validate permissions
      const validatedPermissions = await this.validatePermissions(permissions);

      // Grant permissions
      const grantedPermissions = await this.grantUserPermissions(targetUserId, validatedPermissions, grantConfig);

      // Update access control list
      const aclUpdate = await this.updateAccessControlList(targetUserId, grantedPermissions, 'grant');

      // Send permission notifications
      const notifications = await this.sendPermissionNotifications(targetUserId, 'granted', grantedPermissions);

      // Update user permissions
      const userUpdates = {
        permissions: grantedPermissions,
        permission_granted_at: new Date().toISOString(),
        granted_by: userId,
        grant_reason: grantConfig.reason || 'Administrative action'
      };

      return {
        action: 'grant',
        targetUserId: targetUserId,
        permissions: grantedPermissions,
        accessLevel: this.calculateAccessLevel(grantedPermissions),
        aclUpdate: aclUpdate,
        notifications: notifications,
        userUpdates: userUpdates,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to grant permissions', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Revoke permissions
   */
  async revokePermissions(userId, permissionData) {
    try {
      const targetUserId = permissionData.targetUserId;
      const permissions = permissionData.permissions || [];
      const revokeConfig = permissionData.config || {};

      // Validate permissions to revoke
      const validatedPermissions = await this.validatePermissions(permissions);

      // Revoke permissions
      const revokedPermissions = await this.revokeUserPermissions(targetUserId, validatedPermissions, revokeConfig);

      // Update access control list
      const aclUpdate = await this.updateAccessControlList(targetUserId, revokedPermissions, 'revoke');

      // Send permission notifications
      const notifications = await this.sendPermissionNotifications(targetUserId, 'revoked', revokedPermissions);

      // Update user permissions
      const userUpdates = {
        permissions: revokedPermissions,
        permission_revoked_at: new Date().toISOString(),
        revoked_by: userId,
        revoke_reason: revokeConfig.reason || 'Administrative action'
      };

      return {
        action: 'revoke',
        targetUserId: targetUserId,
        permissions: revokedPermissions,
        accessLevel: this.calculateAccessLevel(revokedPermissions),
        aclUpdate: aclUpdate,
        notifications: notifications,
        userUpdates: userUpdates,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to revoke permissions', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update permissions
   */
  async updatePermissions(userId, permissionData) {
    try {
      const targetUserId = permissionData.targetUserId;
      const newPermissions = permissionData.permissions || [];
      const updateConfig = permissionData.config || {};

      // Get current permissions
      const currentPermissions = await this.getCurrentPermissions(targetUserId);

      // Calculate permission changes
      const permissionChanges = await this.calculatePermissionChanges(currentPermissions, newPermissions);

      // Apply permission updates
      const updatedPermissions = await this.applyPermissionUpdates(targetUserId, permissionChanges, updateConfig);

      // Update access control list
      const aclUpdate = await this.updateAccessControlList(targetUserId, updatedPermissions, 'update');

      // Send permission notifications
      const notifications = await this.sendPermissionNotifications(targetUserId, 'updated', updatedPermissions);

      // Update user permissions
      const userUpdates = {
        permissions: updatedPermissions,
        permission_updated_at: new Date().toISOString(),
        updated_by: userId,
        update_reason: updateConfig.reason || 'Administrative action',
        changes: permissionChanges
      };

      return {
        action: 'update',
        targetUserId: targetUserId,
        permissions: updatedPermissions,
        accessLevel: this.calculateAccessLevel(updatedPermissions),
        aclUpdate: aclUpdate,
        notifications: notifications,
        userUpdates: userUpdates,
        changes: permissionChanges,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to update permissions', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Assign role
   */
  async assignRole(userId, permissionData) {
    try {
      const targetUserId = permissionData.targetUserId;
      const roleId = permissionData.roleId;
      const assignConfig = permissionData.config || {};

      // Get role definition
      const roleDefinition = await this.getRoleDefinition(roleId);

      // Assign role to user
      const roleAssignment = await this.assignUserRole(targetUserId, roleId, roleDefinition, assignConfig);

      // Apply role permissions
      const rolePermissions = await this.applyRolePermissions(targetUserId, roleDefinition);

      // Update access control list
      const aclUpdate = await this.updateAccessControlList(targetUserId, rolePermissions, 'role_assigned');

      // Send role assignment notifications
      const notifications = await this.sendRoleAssignmentNotifications(targetUserId, roleDefinition, 'assigned');

      // Update user permissions
      const userUpdates = {
        role: roleDefinition.name,
        role_id: roleId,
        role_assigned_at: new Date().toISOString(),
        assigned_by: userId,
        assignment_reason: assignConfig.reason || 'Role assignment',
        role_permissions: rolePermissions
      };

      return {
        action: 'assign_role',
        targetUserId: targetUserId,
        role: roleDefinition,
        permissions: rolePermissions,
        accessLevel: this.calculateAccessLevel(rolePermissions),
        aclUpdate: aclUpdate,
        notifications: notifications,
        userUpdates: userUpdates,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to assign role', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Remove role
   */
  async removeRole(userId, permissionData) {
    try {
      const targetUserId = permissionData.targetUserId;
      const roleId = permissionData.roleId;
      const removeConfig = permissionData.config || {};

      // Get current role
      const currentRole = await this.getCurrentRole(targetUserId);

      // Remove role from user
      const roleRemoval = await this.removeUserRole(targetUserId, roleId, removeConfig);

      // Revoke role permissions
      const revokedPermissions = await this.revokeRolePermissions(targetUserId, currentRole);

      // Update access control list
      const aclUpdate = await this.updateAccessControlList(targetUserId, revokedPermissions, 'role_removed');

      // Send role removal notifications
      const notifications = await this.sendRoleAssignmentNotifications(targetUserId, currentRole, 'removed');

      // Update user permissions
      const userUpdates = {
        role: null,
        role_id: null,
        role_removed_at: new Date().toISOString(),
        removed_by: userId,
        removal_reason: removeConfig.reason || 'Role removal',
        revoked_permissions: revokedPermissions
      };

      return {
        action: 'remove_role',
        targetUserId: targetUserId,
        role: currentRole,
        permissions: revokedPermissions,
        accessLevel: this.calculateAccessLevel(revokedPermissions),
        aclUpdate: aclUpdate,
        notifications: notifications,
        userUpdates: userUpdates,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to remove role', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create role
   */
  async createRole(userId, permissionData) {
    try {
      const roleData = permissionData.roleData || {};
      const createConfig = permissionData.config || {};

      // Validate role data
      const validatedRoleData = await this.validateRoleData(roleData);

      // Create role
      const newRole = await this.createUserRole(validatedRoleData, createConfig);

      // Store role definition
      await this.storeRoleDefinition(userId, newRole);

      // Send role creation notifications
      const notifications = await this.sendRoleCreationNotifications(userId, newRole);

      return {
        action: 'create_role',
        role: newRole,
        permissions: newRole.permissions,
        accessLevel: this.calculateAccessLevel(newRole.permissions),
        notifications: notifications,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to create role', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(userId, permissionData) {
    try {
      const roleId = permissionData.roleId;
      const deleteConfig = permissionData.config || {};

      // Get role definition
      const roleDefinition = await this.getRoleDefinition(roleId);

      // Check if role is in use
      const roleUsage = await this.checkRoleUsage(roleId);

      if (roleUsage.isInUse) {
        throw new Error(`Cannot delete role ${roleId}: Role is currently assigned to ${roleUsage.userCount} users`);
      }

      // Delete role
      const roleDeletion = await this.deleteUserRole(roleId, deleteConfig);

      // Send role deletion notifications
      const notifications = await this.sendRoleDeletionNotifications(userId, roleDefinition);

      return {
        action: 'delete_role',
        role: roleDefinition,
        deletion: roleDeletion,
        notifications: notifications,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to delete role', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Check access
   */
  async checkAccess(userId, permissionData) {
    try {
      const targetUserId = permissionData.targetUserId;
      const resource = permissionData.resource;
      const action = permissionData.action;

      // Get user permissions
      const userPermissions = await this.getCurrentPermissions(targetUserId);

      // Check access to resource
      const accessResult = await this.checkResourceAccess(userPermissions, resource, action);

      // Log access check
      await this.logAccessCheck(targetUserId, resource, action, accessResult);

      return {
        action: 'check_access',
        targetUserId: targetUserId,
        resource: resource,
        action: action,
        hasAccess: accessResult.hasAccess,
        accessLevel: accessResult.accessLevel,
        permissions: accessResult.permissions,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to check access', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Validate permissions
   */
  async validatePermissions(permissions) {
    try {
      const validatedPermissions = [];

      for (const permission of permissions) {
        if (this.isValidPermission(permission)) {
          validatedPermissions.push(permission);
        } else {
          logger.warn('Invalid permission skipped', { permission });
        }
      }

      return validatedPermissions;
    } catch (error) {
      logger.error('Failed to validate permissions', { error: error.message });
      return [];
    }
  }

  /**
   * Check if permission is valid
   */
  isValidPermission(permission) {
    try {
      // Basic validation
      if (!permission || typeof permission !== 'object') {
        return false;
      }

      // Check required fields
      if (!permission.resource || !permission.action) {
        return false;
      }

      // Check permission format
      if (typeof permission.resource !== 'string' || typeof permission.action !== 'string') {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate permission', { error: error.message });
      return false;
    }
  }

  /**
   * Grant user permissions
   */
  async grantUserPermissions(targetUserId, permissions, grantConfig) {
    try {
      const grantedPermissions = [];

      for (const permission of permissions) {
        const grantedPermission = {
          ...permission,
          granted_at: new Date().toISOString(),
          granted_by: grantConfig.grantedBy || 'system',
          grant_reason: grantConfig.reason || 'Administrative action',
          expires_at: grantConfig.expiresAt || null
        };

        grantedPermissions.push(grantedPermission);
      }

      return grantedPermissions;
    } catch (error) {
      logger.error('Failed to grant user permissions', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Revoke user permissions
   */
  async revokeUserPermissions(targetUserId, permissions, revokeConfig) {
    try {
      const revokedPermissions = [];

      for (const permission of permissions) {
        const revokedPermission = {
          ...permission,
          revoked_at: new Date().toISOString(),
          revoked_by: revokeConfig.revokedBy || 'system',
          revoke_reason: revokeConfig.reason || 'Administrative action'
        };

        revokedPermissions.push(revokedPermission);
      }

      return revokedPermissions;
    } catch (error) {
      logger.error('Failed to revoke user permissions', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Calculate access level
   */
  calculateAccessLevel(permissions) {
    try {
      if (!permissions || permissions.length === 0) {
        return 'none';
      }

      // Calculate access level based on permissions
      const hasAdminAccess = permissions.some(p => p.resource === 'admin' && p.action === 'all');
      const hasWriteAccess = permissions.some(p => p.action === 'write' || p.action === 'create' || p.action === 'update' || p.action === 'delete');
      const hasReadAccess = permissions.some(p => p.action === 'read' || p.action === 'view');

      if (hasAdminAccess) {
        return 'admin';
      } else if (hasWriteAccess) {
        return 'write';
      } else if (hasReadAccess) {
        return 'read';
      } else {
        return 'limited';
      }
    } catch (error) {
      logger.error('Failed to calculate access level', { error: error.message });
      return 'none';
    }
  }

  /**
   * Update access control list
   */
  async updateAccessControlList(targetUserId, permissions, action) {
    try {
      const aclUpdate = {
        user_id: targetUserId,
        permissions: permissions,
        action: action,
        updated_at: new Date().toISOString(),
        access_level: this.calculateAccessLevel(permissions)
      };

      return aclUpdate;
    } catch (error) {
      logger.error('Failed to update access control list', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Send permission notifications
   */
  async sendPermissionNotifications(targetUserId, action, permissions) {
    try {
      const notifications = [
        {
          type: 'email',
          recipient: targetUserId,
          subject: `Permissions ${action}`,
          message: `Your permissions have been ${action}. Please review your access levels.`,
          sent_at: new Date().toISOString()
        },
        {
          type: 'system',
          recipient: targetUserId,
          title: `Permissions ${action}`,
          message: `Your permissions have been ${action}.`,
          sent_at: new Date().toISOString()
        }
      ];

      return notifications;
    } catch (error) {
      logger.error('Failed to send permission notifications', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Store permission result
   */
  async storePermissionResult(userId, permissionResult) {
    try {
      const permissionData = {
        user_id: userId,
        action: permissionResult.action,
        target_user_id: permissionResult.targetUserId,
        permission_result: permissionResult,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_permission_results')
        .insert(permissionData);

      if (error) throw error;

      // Update in-memory history
      if (!this.permissionHistory.has(userId)) {
        this.permissionHistory.set(userId, []);
      }
      this.permissionHistory.get(userId).unshift(permissionData);

      // Keep only recent history
      const userHistory = this.permissionHistory.get(userId);
      if (userHistory.length > 100) {
        userHistory.splice(100);
      }
    } catch (error) {
      logger.error('Failed to store permission result', { error: error.message, userId });
    }
  }

  /**
   * Load permission sets
   */
  async loadPermissionSets(userId) {
    try {
      const { data: permissions, error } = await supabase
        .from('user_permission_sets')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.permissionSets.set(userId, permissions || []);
      logger.info('Permission sets loaded', { userId, permissionCount: permissions?.length || 0 });
    } catch (error) {
      logger.error('Failed to load permission sets', { error: error.message, userId });
    }
  }

  /**
   * Load role definitions
   */
  async loadRoleDefinitions(userId) {
    try {
      const { data: roles, error } = await supabase
        .from('user_role_definitions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.roleDefinitions.set(userId, roles || []);
      logger.info('Role definitions loaded', { userId, roleCount: roles?.length || 0 });
    } catch (error) {
      logger.error('Failed to load role definitions', { error: error.message, userId });
    }
  }

  /**
   * Load permission rules
   */
  async loadPermissionRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('user_permission_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.permissionRules.set(userId, rules || []);
      logger.info('Permission rules loaded', { userId, ruleCount: rules?.length || 0 });
    } catch (error) {
      logger.error('Failed to load permission rules', { error: error.message, userId });
    }
  }

  /**
   * Load access control lists
   */
  async loadAccessControlLists(userId) {
    try {
      const { data: acls, error } = await supabase
        .from('user_access_control_lists')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.accessControlLists.set(userId, acls || []);
      logger.info('Access control lists loaded', { userId, aclCount: acls?.length || 0 });
    } catch (error) {
      logger.error('Failed to load access control lists', { error: error.message, userId });
    }
  }

  /**
   * Load permission history
   */
  async loadPermissionHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('user_permission_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.permissionHistory.set(userId, history || []);
      logger.info('Permission history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load permission history', { error: error.message, userId });
    }
  }

  /**
   * Get permission metrics
   */
  async getPermissionMetrics(userId) {
    try {
      const userHistory = this.permissionHistory.get(userId) || [];
      const userRoles = this.roleDefinitions.get(userId) || [];

      const metrics = {
        totalActions: userHistory.length,
        actionsByType: this.groupActionsByType(userHistory),
        avgActionTime: this.calculateAvgActionTime(userHistory),
        totalRoles: userRoles.length,
        activeRoles: userRoles.filter(role => role.active).length,
        permissionTrends: this.analyzePermissionTrends(userHistory)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get permission metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get permission insights
   */
  async getPermissionInsights(userId) {
    try {
      const userHistory = this.permissionHistory.get(userId) || [];
      const userRoles = this.roleDefinitions.get(userId) || [];

      const insights = {
        permissionTrends: this.analyzePermissionTrends(userHistory),
        roleAnalysis: this.analyzeRoleAnalysis(userRoles),
        accessPatterns: this.analyzeAccessPatterns(userHistory),
        recommendations: this.generatePermissionRecommendations(userHistory, userRoles)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get permission insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset permissions system for user
   */
  async reset(userId) {
    try {
      this.permissionSets.delete(userId);
      this.roleDefinitions.delete(userId);
      this.permissionRules.delete(userId);
      this.accessControlLists.delete(userId);
      this.permissionHistory.delete(userId);

      logger.info('Permissions system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset permissions system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
