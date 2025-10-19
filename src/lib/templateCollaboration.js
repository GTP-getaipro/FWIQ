/**
 * Template Collaboration System
 * 
 * Handles template collaboration features including sharing,
 * commenting, version control, and team collaboration.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class TemplateCollaboration {
  constructor() {
    this.templateShares = new Map();
    this.templateComments = new Map();
    this.templateCollaborators = new Map();
    this.templatePermissions = new Map();
    this.templateActivities = new Map();
    this.templateNotifications = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize template collaboration system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Template Collaboration', { userId });

      // Load collaboration data
      await this.loadTemplateShares(userId);
      await this.loadTemplateComments(userId);
      await this.loadTemplateCollaborators(userId);
      await this.loadTemplatePermissions(userId);
      await this.loadTemplateActivities(userId);
      await this.loadTemplateNotifications(userId);

      this.isInitialized = true;
      logger.info('Template Collaboration initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Template Collaboration', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Share template
   */
  async shareTemplate(userId, templateId, shareConfig) {
    try {
      logger.info('Sharing template', { userId, templateId });

      // Validate share configuration
      const validationResult = await this.validateShareConfig(shareConfig);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create share record
      const share = await this.createShareRecord(userId, templateId, shareConfig);

      // Store share
      await this.storeTemplateShare(userId, share);

      // Send notifications to collaborators
      await this.sendShareNotifications(userId, templateId, shareConfig);

      // Log share activity
      await this.logCollaborationActivity(userId, 'template_shared', { templateId, shareConfig });

      logger.info('Template shared successfully', { 
        userId, 
        templateId,
        shareId: share.id
      });

      return {
        success: true,
        share
      };
    } catch (error) {
      logger.error('Failed to share template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add collaborator
   */
  async addCollaborator(userId, templateId, collaboratorData) {
    try {
      logger.info('Adding collaborator', { userId, templateId, collaboratorEmail: collaboratorData.email });

      // Validate collaborator data
      const validationResult = await this.validateCollaboratorData(collaboratorData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create collaborator record
      const collaborator = await this.createCollaboratorRecord(userId, templateId, collaboratorData);

      // Store collaborator
      await this.storeTemplateCollaborator(userId, collaborator);

      // Set up permissions
      await this.setupCollaboratorPermissions(userId, templateId, collaborator);

      // Send invitation notification
      await this.sendCollaborationInvitation(userId, templateId, collaborator);

      // Log collaboration activity
      await this.logCollaborationActivity(userId, 'collaborator_added', { templateId, collaborator });

      logger.info('Collaborator added successfully', { 
        userId, 
        templateId,
        collaboratorId: collaborator.id
      });

      return {
        success: true,
        collaborator
      };
    } catch (error) {
      logger.error('Failed to add collaborator', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove collaborator
   */
  async removeCollaborator(userId, templateId, collaboratorId) {
    try {
      logger.info('Removing collaborator', { userId, templateId, collaboratorId });

      // Get collaborator
      const collaborator = await this.getCollaborator(userId, templateId, collaboratorId);
      if (!collaborator) {
        return { success: false, error: 'Collaborator not found' };
      }

      // Remove collaborator
      await this.removeCollaboratorRecord(userId, templateId, collaboratorId);

      // Remove permissions
      await this.removeCollaboratorPermissions(userId, templateId, collaboratorId);

      // Send removal notification
      await this.sendCollaborationRemovalNotification(userId, templateId, collaborator);

      // Log collaboration activity
      await this.logCollaborationActivity(userId, 'collaborator_removed', { templateId, collaborator });

      logger.info('Collaborator removed successfully', { 
        userId, 
        templateId,
        collaboratorId
      });

      return {
        success: true,
        collaborator
      };
    } catch (error) {
      logger.error('Failed to remove collaborator', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add comment
   */
  async addComment(userId, templateId, commentData) {
    try {
      logger.info('Adding comment', { userId, templateId });

      // Validate comment data
      const validationResult = await this.validateCommentData(commentData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create comment record
      const comment = await this.createCommentRecord(userId, templateId, commentData);

      // Store comment
      await this.storeTemplateComment(userId, comment);

      // Send comment notifications
      await this.sendCommentNotifications(userId, templateId, comment);

      // Log collaboration activity
      await this.logCollaborationActivity(userId, 'comment_added', { templateId, comment });

      logger.info('Comment added successfully', { 
        userId, 
        templateId,
        commentId: comment.id
      });

      return {
        success: true,
        comment
      };
    } catch (error) {
      logger.error('Failed to add comment', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template collaboration data
   */
  async getTemplateCollaboration(userId, templateId) {
    try {
      logger.info('Getting template collaboration data', { userId, templateId });

      // Get collaborators
      const collaborators = await this.getTemplateCollaborators(userId, templateId);

      // Get comments
      const comments = await this.getTemplateComments(userId, templateId);

      // Get shares
      const shares = await this.getTemplateShares(userId, templateId);

      // Get permissions
      const permissions = await this.getTemplatePermissions(userId, templateId);

      // Get activities
      const activities = await this.getTemplateActivities(userId, templateId);

      // Get notifications
      const notifications = await this.getTemplateNotifications(userId, templateId);

      const collaboration = {
        template_id: templateId,
        user_id: userId,
        collaborators: collaborators,
        comments: comments,
        shares: shares,
        permissions: permissions,
        activities: activities,
        notifications: notifications,
        generated_at: new Date().toISOString()
      };

      logger.info('Template collaboration data retrieved successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        collaboration
      };
    } catch (error) {
      logger.error('Failed to get template collaboration data', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaboratorPermissions(userId, templateId, collaboratorId, permissions) {
    try {
      logger.info('Updating collaborator permissions', { userId, templateId, collaboratorId });

      // Validate permissions
      const validationResult = await this.validatePermissions(permissions);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Update permissions
      const updatedPermissions = await this.updatePermissionsRecord(userId, templateId, collaboratorId, permissions);

      // Send permission update notification
      await this.sendPermissionUpdateNotification(userId, templateId, collaboratorId, permissions);

      // Log collaboration activity
      await this.logCollaborationActivity(userId, 'permissions_updated', { templateId, collaboratorId, permissions });

      logger.info('Collaborator permissions updated successfully', { 
        userId, 
        templateId,
        collaboratorId
      });

      return {
        success: true,
        permissions: updatedPermissions
      };
    } catch (error) {
      logger.error('Failed to update collaborator permissions', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get collaboration notifications
   */
  async getCollaborationNotifications(userId, notificationFilters = {}) {
    try {
      logger.info('Getting collaboration notifications', { userId });

      // Get notifications
      const notifications = await this.getNotifications(userId, notificationFilters);

      // Mark notifications as read if requested
      if (notificationFilters.markAsRead) {
        await this.markNotificationsAsRead(userId, notifications);
      }

      logger.info('Collaboration notifications retrieved successfully', { 
        userId,
        notificationCount: notifications.length
      });

      return {
        success: true,
        notifications
      };
    } catch (error) {
      logger.error('Failed to get collaboration notifications', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create share record
   */
  async createShareRecord(userId, templateId, shareConfig) {
    try {
      const share = {
        id: this.generateShareId(),
        user_id: userId,
        template_id: templateId,
        share_type: shareConfig.shareType || 'view',
        share_url: shareConfig.shareUrl || this.generateShareUrl(templateId),
        expires_at: shareConfig.expiresAt || null,
        password_protected: shareConfig.passwordProtected || false,
        password: shareConfig.password || null,
        allow_download: shareConfig.allowDownload || false,
        allow_comments: shareConfig.allowComments || false,
        created_at: new Date().toISOString(),
        created_by: userId
      };

      return share;
    } catch (error) {
      logger.error('Failed to create share record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create collaborator record
   */
  async createCollaboratorRecord(userId, templateId, collaboratorData) {
    try {
      const collaborator = {
        id: this.generateCollaboratorId(),
        user_id: userId,
        template_id: templateId,
        collaborator_email: collaboratorData.email,
        collaborator_name: collaboratorData.name || '',
        role: collaboratorData.role || 'viewer',
        permissions: collaboratorData.permissions || ['view'],
        status: 'pending',
        invited_at: new Date().toISOString(),
        invited_by: userId
      };

      return collaborator;
    } catch (error) {
      logger.error('Failed to create collaborator record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create comment record
   */
  async createCommentRecord(userId, templateId, commentData) {
    try {
      const comment = {
        id: this.generateCommentId(),
        user_id: userId,
        template_id: templateId,
        comment_text: commentData.text,
        comment_type: commentData.type || 'general',
        parent_comment_id: commentData.parentCommentId || null,
        is_resolved: false,
        created_at: new Date().toISOString(),
        created_by: userId
      };

      return comment;
    } catch (error) {
      logger.error('Failed to create comment record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Setup collaborator permissions
   */
  async setupCollaboratorPermissions(userId, templateId, collaborator) {
    try {
      const permissions = {
        id: this.generatePermissionId(),
        user_id: userId,
        template_id: templateId,
        collaborator_id: collaborator.id,
        permissions: collaborator.permissions,
        role: collaborator.role,
        created_at: new Date().toISOString(),
        created_by: userId
      };

      await this.storeTemplatePermission(userId, permissions);
    } catch (error) {
      logger.error('Failed to setup collaborator permissions', { error: error.message, userId });
    }
  }

  /**
   * Send share notifications
   */
  async sendShareNotifications(userId, templateId, shareConfig) {
    try {
      const notifications = [];

      // Send notification to template owner
      notifications.push({
        id: this.generateNotificationId(),
        user_id: userId,
        template_id: templateId,
        notification_type: 'template_shared',
        title: 'Template Shared',
        message: `Template has been shared with ${shareConfig.recipients?.length || 0} recipients`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      // Send notifications to recipients
      if (shareConfig.recipients) {
        for (const recipient of shareConfig.recipients) {
          notifications.push({
            id: this.generateNotificationId(),
            user_id: recipient.userId,
            template_id: templateId,
            notification_type: 'template_shared_with_you',
            title: 'Template Shared With You',
            message: `You have been given access to a template`,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      // Store notifications
      for (const notification of notifications) {
        await this.storeTemplateNotification(userId, notification);
      }
    } catch (error) {
      logger.error('Failed to send share notifications', { error: error.message, userId });
    }
  }

  /**
   * Send collaboration invitation
   */
  async sendCollaborationInvitation(userId, templateId, collaborator) {
    try {
      const notification = {
        id: this.generateNotificationId(),
        user_id: userId,
        template_id: templateId,
        notification_type: 'collaboration_invitation',
        title: 'Collaboration Invitation',
        message: `You have been invited to collaborate on a template`,
        is_read: false,
        created_at: new Date().toISOString()
      };

      await this.storeTemplateNotification(userId, notification);
    } catch (error) {
      logger.error('Failed to send collaboration invitation', { error: error.message, userId });
    }
  }

  /**
   * Send comment notifications
   */
  async sendCommentNotifications(userId, templateId, comment) {
    try {
      // Get template collaborators
      const collaborators = await this.getTemplateCollaborators(userId, templateId);

      const notifications = [];

      // Send notification to all collaborators except the comment author
      for (const collaborator of collaborators) {
        if (collaborator.collaborator_email !== userId) {
          notifications.push({
            id: this.generateNotificationId(),
            user_id: collaborator.collaborator_email,
            template_id: templateId,
            notification_type: 'comment_added',
            title: 'New Comment',
            message: `A new comment has been added to the template`,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      // Store notifications
      for (const notification of notifications) {
        await this.storeTemplateNotification(userId, notification);
      }
    } catch (error) {
      logger.error('Failed to send comment notifications', { error: error.message, userId });
    }
  }

  /**
   * Get template collaborators
   */
  async getTemplateCollaborators(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templateCollaborators.has(templateId)) {
        return this.templateCollaborators.get(templateId);
      }

      // Fetch from database
      const { data: collaborators, error } = await supabase
        .from('template_collaborators')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      if (collaborators) {
        this.templateCollaborators.set(templateId, collaborators);
      }

      return collaborators || [];
    } catch (error) {
      logger.error('Failed to get template collaborators', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get template comments
   */
  async getTemplateComments(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templateComments.has(templateId)) {
        return this.templateComments.get(templateId);
      }

      // Fetch from database
      const { data: comments, error } = await supabase
        .from('template_comments')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (comments) {
        this.templateComments.set(templateId, comments);
      }

      return comments || [];
    } catch (error) {
      logger.error('Failed to get template comments', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get template shares
   */
  async getTemplateShares(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templateShares.has(templateId)) {
        return this.templateShares.get(templateId);
      }

      // Fetch from database
      const { data: shares, error } = await supabase
        .from('template_shares')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      if (shares) {
        this.templateShares.set(templateId, shares);
      }

      return shares || [];
    } catch (error) {
      logger.error('Failed to get template shares', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get template permissions
   */
  async getTemplatePermissions(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templatePermissions.has(templateId)) {
        return this.templatePermissions.get(templateId);
      }

      // Fetch from database
      const { data: permissions, error } = await supabase
        .from('template_permissions')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId);

      if (error) throw error;

      if (permissions) {
        this.templatePermissions.set(templateId, permissions);
      }

      return permissions || [];
    } catch (error) {
      logger.error('Failed to get template permissions', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get template activities
   */
  async getTemplateActivities(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templateActivities.has(templateId)) {
        return this.templateActivities.get(templateId);
      }

      // Fetch from database
      const { data: activities, error } = await supabase
        .from('template_activities')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (activities) {
        this.templateActivities.set(templateId, activities);
      }

      return activities || [];
    } catch (error) {
      logger.error('Failed to get template activities', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get template notifications
   */
  async getTemplateNotifications(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templateNotifications.has(templateId)) {
        return this.templateNotifications.get(templateId);
      }

      // Fetch from database
      const { data: notifications, error } = await supabase
        .from('template_notifications')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (notifications) {
        this.templateNotifications.set(templateId, notifications);
      }

      return notifications || [];
    } catch (error) {
      logger.error('Failed to get template notifications', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Store template share
   */
  async storeTemplateShare(userId, share) {
    try {
      const { error } = await supabase
        .from('template_shares')
        .insert(share);

      if (error) throw error;

      // Update in-memory shares
      if (!this.templateShares.has(share.template_id)) {
        this.templateShares.set(share.template_id, []);
      }
      this.templateShares.get(share.template_id).push(share);
    } catch (error) {
      logger.error('Failed to store template share', { error: error.message, userId });
    }
  }

  /**
   * Store template collaborator
   */
  async storeTemplateCollaborator(userId, collaborator) {
    try {
      const { error } = await supabase
        .from('template_collaborators')
        .insert(collaborator);

      if (error) throw error;

      // Update in-memory collaborators
      if (!this.templateCollaborators.has(collaborator.template_id)) {
        this.templateCollaborators.set(collaborator.template_id, []);
      }
      this.templateCollaborators.get(collaborator.template_id).push(collaborator);
    } catch (error) {
      logger.error('Failed to store template collaborator', { error: error.message, userId });
    }
  }

  /**
   * Store template comment
   */
  async storeTemplateComment(userId, comment) {
    try {
      const { error } = await supabase
        .from('template_comments')
        .insert(comment);

      if (error) throw error;

      // Update in-memory comments
      if (!this.templateComments.has(comment.template_id)) {
        this.templateComments.set(comment.template_id, []);
      }
      this.templateComments.get(comment.template_id).unshift(comment);
    } catch (error) {
      logger.error('Failed to store template comment', { error: error.message, userId });
    }
  }

  /**
   * Store template permission
   */
  async storeTemplatePermission(userId, permission) {
    try {
      const { error } = await supabase
        .from('template_permissions')
        .insert(permission);

      if (error) throw error;

      // Update in-memory permissions
      if (!this.templatePermissions.has(permission.template_id)) {
        this.templatePermissions.set(permission.template_id, []);
      }
      this.templatePermissions.get(permission.template_id).push(permission);
    } catch (error) {
      logger.error('Failed to store template permission', { error: error.message, userId });
    }
  }

  /**
   * Store template notification
   */
  async storeTemplateNotification(userId, notification) {
    try {
      const { error } = await supabase
        .from('template_notifications')
        .insert(notification);

      if (error) throw error;

      // Update in-memory notifications
      if (!this.templateNotifications.has(notification.template_id)) {
        this.templateNotifications.set(notification.template_id, []);
      }
      this.templateNotifications.get(notification.template_id).unshift(notification);
    } catch (error) {
      logger.error('Failed to store template notification', { error: error.message, userId });
    }
  }

  /**
   * Log collaboration activity
   */
  async logCollaborationActivity(userId, activityType, activityData) {
    try {
      const activity = {
        id: this.generateActivityId(),
        user_id: userId,
        template_id: activityData.templateId,
        activity_type: activityType,
        activity_data: activityData,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('template_activities')
        .insert(activity);

      if (error) throw error;

      // Update in-memory activities
      if (!this.templateActivities.has(activityData.templateId)) {
        this.templateActivities.set(activityData.templateId, []);
      }
      this.templateActivities.get(activityData.templateId).unshift(activity);
    } catch (error) {
      logger.error('Failed to log collaboration activity', { error: error.message, userId });
    }
  }

  /**
   * Generate share ID
   */
  generateShareId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `SHARE-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate collaborator ID
   */
  generateCollaboratorId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `COLLAB-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate comment ID
   */
  generateCommentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `COMMENT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate permission ID
   */
  generatePermissionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `PERM-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate notification ID
   */
  generateNotificationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `NOTIF-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate activity ID
   */
  generateActivityId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ACTIVITY-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate share URL
   */
  generateShareUrl(templateId) {
    const random = Math.random().toString(36).substring(2, 8);
    return `https://app.example.com/template/${templateId}/share/${random}`;
  }

  /**
   * Load template shares
   */
  async loadTemplateShares(userId) {
    try {
      const { data: shares, error } = await supabase
        .from('template_shares')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      shares.forEach(share => {
        if (!this.templateShares.has(share.template_id)) {
          this.templateShares.set(share.template_id, []);
        }
        this.templateShares.get(share.template_id).push(share);
      });

      logger.info('Template shares loaded', { userId, shareCount: shares.length });
    } catch (error) {
      logger.error('Failed to load template shares', { error: error.message, userId });
    }
  }

  /**
   * Load template comments
   */
  async loadTemplateComments(userId) {
    try {
      const { data: comments, error } = await supabase
        .from('template_comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      comments.forEach(comment => {
        if (!this.templateComments.has(comment.template_id)) {
          this.templateComments.set(comment.template_id, []);
        }
        this.templateComments.get(comment.template_id).push(comment);
      });

      logger.info('Template comments loaded', { userId, commentCount: comments.length });
    } catch (error) {
      logger.error('Failed to load template comments', { error: error.message, userId });
    }
  }

  /**
   * Load template collaborators
   */
  async loadTemplateCollaborators(userId) {
    try {
      const { data: collaborators, error } = await supabase
        .from('template_collaborators')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      collaborators.forEach(collaborator => {
        if (!this.templateCollaborators.has(collaborator.template_id)) {
          this.templateCollaborators.set(collaborator.template_id, []);
        }
        this.templateCollaborators.get(collaborator.template_id).push(collaborator);
      });

      logger.info('Template collaborators loaded', { userId, collaboratorCount: collaborators.length });
    } catch (error) {
      logger.error('Failed to load template collaborators', { error: error.message, userId });
    }
  }

  /**
   * Load template permissions
   */
  async loadTemplatePermissions(userId) {
    try {
      const { data: permissions, error } = await supabase
        .from('template_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      permissions.forEach(permission => {
        if (!this.templatePermissions.has(permission.template_id)) {
          this.templatePermissions.set(permission.template_id, []);
        }
        this.templatePermissions.get(permission.template_id).push(permission);
      });

      logger.info('Template permissions loaded', { userId, permissionCount: permissions.length });
    } catch (error) {
      logger.error('Failed to load template permissions', { error: error.message, userId });
    }
  }

  /**
   * Load template activities
   */
  async loadTemplateActivities(userId) {
    try {
      const { data: activities, error } = await supabase
        .from('template_activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      activities.forEach(activity => {
        if (!this.templateActivities.has(activity.template_id)) {
          this.templateActivities.set(activity.template_id, []);
        }
        this.templateActivities.get(activity.template_id).push(activity);
      });

      logger.info('Template activities loaded', { userId, activityCount: activities.length });
    } catch (error) {
      logger.error('Failed to load template activities', { error: error.message, userId });
    }
  }

  /**
   * Load template notifications
   */
  async loadTemplateNotifications(userId) {
    try {
      const { data: notifications, error } = await supabase
        .from('template_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      notifications.forEach(notification => {
        if (!this.templateNotifications.has(notification.template_id)) {
          this.templateNotifications.set(notification.template_id, []);
        }
        this.templateNotifications.get(notification.template_id).push(notification);
      });

      logger.info('Template notifications loaded', { userId, notificationCount: notifications.length });
    } catch (error) {
      logger.error('Failed to load template notifications', { error: error.message, userId });
    }
  }

  /**
   * Reset collaboration system for user
   */
  async reset(userId) {
    try {
      this.templateShares.clear();
      this.templateComments.clear();
      this.templateCollaborators.clear();
      this.templatePermissions.clear();
      this.templateActivities.clear();
      this.templateNotifications.clear();

      logger.info('Collaboration system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset collaboration system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
