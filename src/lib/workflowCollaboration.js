/**
 * Workflow Collaboration Features
 * Team collaboration and workflow sharing capabilities
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class WorkflowCollaboration {
  constructor() {
    this.collaborationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.notificationQueue = [];
    this.maxNotificationQueue = 100;
  }

  /**
   * Share workflow with team members
   * @param {string} workflowId - Workflow identifier
   * @param {string} ownerId - Workflow owner ID
   * @param {Array} teamMemberIds - Array of team member IDs
   * @param {Object} permissions - Permission settings
   * @returns {Promise<Object>} Sharing result
   */
  async shareWorkflow(workflowId, ownerId, teamMemberIds, permissions = {}) {
    try {
      logger.info('Sharing workflow with team members', { 
        workflowId, 
        ownerId, 
        teamMemberCount: teamMemberIds.length 
      });

      const sharingData = {
        workflow_id: workflowId,
        owner_id: ownerId,
        shared_at: new Date().toISOString(),
        permissions: JSON.stringify({
          canView: permissions.canView !== false,
          canEdit: permissions.canEdit || false,
          canExecute: permissions.canExecute || false,
          canShare: permissions.canShare || false,
          canDelete: permissions.canDelete || false
        }),
        status: 'active'
      };

      // Create sharing records for each team member
      const sharingRecords = teamMemberIds.map(memberId => ({
        ...sharingData,
        user_id: memberId
      }));

      const { data, error } = await supabase
        .from('workflow_sharing')
        .insert(sharingRecords)
        .select();

      if (error) throw error;

      // Send notifications to team members
      await this.sendSharingNotifications(workflowId, ownerId, teamMemberIds, permissions);

      // Log sharing activity
      await this.logCollaborationActivity({
        workflowId,
        userId: ownerId,
        action: 'workflow_shared',
        details: {
          teamMemberIds,
          permissions,
          sharedCount: teamMemberIds.length
        }
      });

      logger.info('Workflow shared successfully', { 
        workflowId, 
        sharedCount: teamMemberIds.length 
      });

      return {
        success: true,
        sharedWith: teamMemberIds.length,
        sharingRecords: data,
        permissions
      };
    } catch (error) {
      logger.error('Error sharing workflow', { 
        error: error.message, 
        workflowId, 
        ownerId 
      });
      throw new Error(`Failed to share workflow: ${error.message}`);
    }
  }

  /**
   * Get shared workflows for a user
   * @param {string} userId - User identifier
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Shared workflows
   */
  async getSharedWorkflows(userId, filters = {}) {
    try {
      const cacheKey = `shared_workflows_${userId}_${JSON.stringify(filters)}`;
      
      // Check cache first
      if (this.collaborationCache.has(cacheKey)) {
        const cached = this.collaborationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      let query = supabase
        .from('workflow_sharing')
        .select(`
          *,
          workflows:workflow_id (
            id,
            name,
            description,
            status,
            created_at,
            updated_at,
            owner_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Apply filters
      if (filters.permission) {
        query = query.contains('permissions', JSON.stringify({ [filters.permission]: true }));
      }

      if (filters.workflowStatus) {
        query = query.eq('workflows.status', filters.workflowStatus);
      }

      const { data, error } = await query.order('shared_at', { ascending: false });

      if (error) throw error;

      const sharedWorkflows = (data || []).map(share => ({
        id: share.id,
        workflowId: share.workflow_id,
        workflow: share.workflows,
        permissions: JSON.parse(share.permissions || '{}'),
        sharedAt: share.shared_at,
        ownerId: share.owner_id
      }));

      // Cache the result
      this.collaborationCache.set(cacheKey, {
        data: sharedWorkflows,
        timestamp: Date.now()
      });

      return sharedWorkflows;
    } catch (error) {
      logger.error('Error getting shared workflows', { 
        error: error.message, 
        userId 
      });
      return [];
    }
  }

  /**
   * Update workflow sharing permissions
   * @param {string} sharingId - Sharing record ID
   * @param {string} userId - User making the change
   * @param {Object} newPermissions - New permission settings
   * @returns {Promise<Object>} Update result
   */
  async updateSharingPermissions(sharingId, userId, newPermissions) {
    try {
      logger.info('Updating workflow sharing permissions', { 
        sharingId, 
        userId 
      });

      const { data, error } = await supabase
        .from('workflow_sharing')
        .update({
          permissions: JSON.stringify(newPermissions),
          updated_at: new Date().toISOString()
        })
        .eq('id', sharingId)
        .select()
        .single();

      if (error) throw error;

      // Log permission change
      await this.logCollaborationActivity({
        workflowId: data.workflow_id,
        userId,
        action: 'permissions_updated',
        details: {
          sharingId,
          newPermissions,
          previousPermissions: data.permissions
        }
      });

      logger.info('Workflow sharing permissions updated', { 
        sharingId, 
        workflowId: data.workflow_id 
      });

      return {
        success: true,
        sharingRecord: data,
        newPermissions
      };
    } catch (error) {
      logger.error('Error updating sharing permissions', { 
        error: error.message, 
        sharingId, 
        userId 
      });
      throw new Error(`Failed to update permissions: ${error.message}`);
    }
  }

  /**
   * Revoke workflow sharing
   * @param {string} sharingId - Sharing record ID
   * @param {string} userId - User revoking access
   * @returns {Promise<Object>} Revocation result
   */
  async revokeWorkflowSharing(sharingId, userId) {
    try {
      logger.info('Revoking workflow sharing', { 
        sharingId, 
        userId 
      });

      const { data, error } = await supabase
        .from('workflow_sharing')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: userId
        })
        .eq('id', sharingId)
        .select()
        .single();

      if (error) throw error;

      // Log revocation
      await this.logCollaborationActivity({
        workflowId: data.workflow_id,
        userId,
        action: 'sharing_revoked',
        details: {
          sharingId,
          revokedUserId: data.user_id
        }
      });

      logger.info('Workflow sharing revoked', { 
        sharingId, 
        workflowId: data.workflow_id 
      });

      return {
        success: true,
        revokedSharing: data
      };
    } catch (error) {
      logger.error('Error revoking workflow sharing', { 
        error: error.message, 
        sharingId, 
        userId 
      });
      throw new Error(`Failed to revoke sharing: ${error.message}`);
    }
  }

  /**
   * Add workflow comment
   * @param {string} workflowId - Workflow identifier
   * @param {string} userId - User ID
   * @param {string} comment - Comment text
   * @param {string} parentCommentId - Parent comment ID (for replies)
   * @returns {Promise<Object>} Comment result
   */
  async addWorkflowComment(workflowId, userId, comment, parentCommentId = null) {
    try {
      logger.info('Adding workflow comment', { 
        workflowId, 
        userId, 
        parentCommentId 
      });

      const commentData = {
        workflow_id: workflowId,
        user_id: userId,
        comment_text: comment,
        parent_comment_id: parentCommentId,
        created_at: new Date().toISOString(),
        status: 'active'
      };

      const { data, error } = await supabase
        .from('workflow_comments')
        .insert(commentData)
        .select(`
          *,
          user:user_id (
            id,
            email,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Send notifications to workflow collaborators
      await this.sendCommentNotifications(workflowId, userId, data.id);

      // Log comment activity
      await this.logCollaborationActivity({
        workflowId,
        userId,
        action: 'comment_added',
        details: {
          commentId: data.id,
          parentCommentId,
          commentLength: comment.length
        }
      });

      logger.info('Workflow comment added', { 
        workflowId, 
        commentId: data.id 
      });

      return {
        success: true,
        comment: data
      };
    } catch (error) {
      logger.error('Error adding workflow comment', { 
        error: error.message, 
        workflowId, 
        userId 
      });
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  /**
   * Get workflow comments
   * @param {string} workflowId - Workflow identifier
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Workflow comments
   */
  async getWorkflowComments(workflowId, options = {}) {
    try {
      let query = supabase
        .from('workflow_comments')
        .select(`
          *,
          user:user_id (
            id,
            email,
            full_name
          ),
          replies:parent_comment_id (
            *,
            user:user_id (
              id,
              email,
              full_name
            )
          )
        `)
        .eq('workflow_id', workflowId)
        .eq('status', 'active')
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting workflow comments', { 
        error: error.message, 
        workflowId 
      });
      return [];
    }
  }

  /**
   * Create workflow template from existing workflow
   * @param {string} workflowId - Source workflow ID
   * @param {string} userId - User creating template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Template creation result
   */
  async createWorkflowTemplate(workflowId, userId, templateData) {
    try {
      logger.info('Creating workflow template', { 
        workflowId, 
        userId, 
        templateName: templateData.name 
      });

      // Get source workflow data
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      const templateRecord = {
        name: templateData.name,
        description: templateData.description || workflow.description,
        category: templateData.category || 'general',
        tags: JSON.stringify(templateData.tags || []),
        workflow_data: JSON.stringify(workflow),
        created_by: userId,
        created_at: new Date().toISOString(),
        status: 'active',
        is_public: templateData.isPublic || false,
        usage_count: 0
      };

      const { data, error } = await supabase
        .from('workflow_templates')
        .insert(templateRecord)
        .select()
        .single();

      if (error) throw error;

      // Log template creation
      await this.logCollaborationActivity({
        workflowId,
        userId,
        action: 'template_created',
        details: {
          templateId: data.id,
          templateName: templateData.name,
          isPublic: templateData.isPublic
        }
      });

      logger.info('Workflow template created', { 
        templateId: data.id, 
        workflowId 
      });

      return {
        success: true,
        template: data
      };
    } catch (error) {
      logger.error('Error creating workflow template', { 
        error: error.message, 
        workflowId, 
        userId 
      });
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Get available workflow templates
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Available templates
   */
  async getWorkflowTemplates(filters = {}) {
    try {
      let query = supabase
        .from('workflow_templates')
        .select(`
          *,
          creator:created_by (
            id,
            email,
            full_name
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting workflow templates', { 
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Use workflow template
   * @param {string} templateId - Template ID
   * @param {string} userId - User using template
   * @param {Object} customization - Customization options
   * @returns {Promise<Object>} Template usage result
   */
  async useWorkflowTemplate(templateId, userId, customization = {}) {
    try {
      logger.info('Using workflow template', { 
        templateId, 
        userId 
      });

      // Get template data
      const { data: template, error: templateError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Parse workflow data
      const workflowData = JSON.parse(template.workflow_data);
      
      // Create new workflow from template
      const newWorkflow = {
        name: customization.name || `${template.name} - Copy`,
        description: customization.description || template.description,
        user_id: userId,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        template_id: templateId,
        ...customization.workflowData
      };

      const { data: newWorkflowData, error: workflowError } = await supabase
        .from('workflows')
        .insert(newWorkflow)
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Update template usage count
      await supabase
        .from('workflow_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      // Log template usage
      await this.logCollaborationActivity({
        workflowId: newWorkflowData.id,
        userId,
        action: 'template_used',
        details: {
          templateId,
          templateName: template.name,
          customization
        }
      });

      logger.info('Workflow template used', { 
        templateId, 
        newWorkflowId: newWorkflowData.id 
      });

      return {
        success: true,
        workflow: newWorkflowData,
        template: template
      };
    } catch (error) {
      logger.error('Error using workflow template', { 
        error: error.message, 
        templateId, 
        userId 
      });
      throw new Error(`Failed to use template: ${error.message}`);
    }
  }

  /**
   * Get collaboration activity log
   * @param {string} workflowId - Workflow identifier
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Activity log
   */
  async getCollaborationActivity(workflowId, options = {}) {
    try {
      let query = supabase
        .from('workflow_collaboration_log')
        .select(`
          *,
          user:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('workflow_id', workflowId)
        .order('timestamp', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.action) {
        query = query.eq('action', options.action);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting collaboration activity', { 
        error: error.message, 
        workflowId 
      });
      return [];
    }
  }

  /**
   * Send sharing notifications
   * @param {string} workflowId - Workflow identifier
   * @param {string} ownerId - Workflow owner ID
   * @param {Array} teamMemberIds - Team member IDs
   * @param {Object} permissions - Permission settings
   */
  async sendSharingNotifications(workflowId, ownerId, teamMemberIds, permissions) {
    try {
      const notifications = teamMemberIds.map(memberId => ({
        user_id: memberId,
        type: 'workflow_shared',
        title: 'Workflow Shared',
        message: `A workflow has been shared with you`,
        data: JSON.stringify({
          workflowId,
          ownerId,
          permissions
        }),
        created_at: new Date().toISOString(),
        status: 'unread'
      }));

      await supabase
        .from('notifications')
        .insert(notifications);

      logger.debug('Sharing notifications sent', { 
        workflowId, 
        notificationCount: notifications.length 
      });
    } catch (error) {
      logger.error('Error sending sharing notifications', { 
        error: error.message, 
        workflowId 
      });
    }
  }

  /**
   * Send comment notifications
   * @param {string} workflowId - Workflow identifier
   * @param {string} commenterId - Commenter ID
   * @param {string} commentId - Comment ID
   */
  async sendCommentNotifications(workflowId, commenterId, commentId) {
    try {
      // Get workflow collaborators
      const { data: collaborators } = await supabase
        .from('workflow_sharing')
        .select('user_id')
        .eq('workflow_id', workflowId)
        .eq('status', 'active')
        .neq('user_id', commenterId); // Exclude commenter

      if (collaborators && collaborators.length > 0) {
        const notifications = collaborators.map(collab => ({
          user_id: collab.user_id,
          type: 'workflow_comment',
          title: 'New Workflow Comment',
          message: `A new comment was added to a workflow you're collaborating on`,
          data: JSON.stringify({
            workflowId,
            commentId,
            commenterId
          }),
          created_at: new Date().toISOString(),
          status: 'unread'
        }));

        await supabase
          .from('notifications')
          .insert(notifications);

        logger.debug('Comment notifications sent', { 
          workflowId, 
          commentId, 
          notificationCount: notifications.length 
        });
      }
    } catch (error) {
      logger.error('Error sending comment notifications', { 
        error: error.message, 
        workflowId, 
        commentId 
      });
    }
  }

  /**
   * Log collaboration activity
   * @param {Object} activityData - Activity data
   */
  async logCollaborationActivity(activityData) {
    try {
      const logEntry = {
        workflow_id: activityData.workflowId,
        user_id: activityData.userId,
        action: activityData.action,
        details: JSON.stringify(activityData.details || {}),
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('workflow_collaboration_log')
        .insert(logEntry);

      logger.debug('Collaboration activity logged', { 
        workflowId: activityData.workflowId, 
        action: activityData.action 
      });
    } catch (error) {
      logger.error('Error logging collaboration activity', { 
        error: error.message, 
        activityData 
      });
    }
  }

  /**
   * Clear collaboration cache
   */
  clearCache() {
    this.collaborationCache.clear();
    logger.info('Workflow collaboration cache cleared');
  }

  /**
   * Get collaboration statistics
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<Object>} Collaboration statistics
   */
  async getCollaborationStats(workflowId) {
    try {
      const [
        sharingStats,
        commentStats,
        activityStats
      ] = await Promise.all([
        supabase
          .from('workflow_sharing')
          .select('id')
          .eq('workflow_id', workflowId)
          .eq('status', 'active'),
        supabase
          .from('workflow_comments')
          .select('id')
          .eq('workflow_id', workflowId)
          .eq('status', 'active'),
        supabase
          .from('workflow_collaboration_log')
          .select('action')
          .eq('workflow_id', workflowId)
      ]);

      const stats = {
        totalCollaborators: sharingStats.data?.length || 0,
        totalComments: commentStats.data?.length || 0,
        totalActivities: activityStats.data?.length || 0,
        activityBreakdown: {}
      };

      // Calculate activity breakdown
      if (activityStats.data) {
        activityStats.data.forEach(activity => {
          stats.activityBreakdown[activity.action] = 
            (stats.activityBreakdown[activity.action] || 0) + 1;
        });
      }

      return stats;
    } catch (error) {
      logger.error('Error getting collaboration statistics', { 
        error: error.message, 
        workflowId 
      });
      return {
        totalCollaborators: 0,
        totalComments: 0,
        totalActivities: 0,
        activityBreakdown: {}
      };
    }
  }
}

// Export singleton instance
export const workflowCollaboration = new WorkflowCollaboration();
export default WorkflowCollaboration;
