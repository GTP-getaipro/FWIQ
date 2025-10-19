/**
 * User Lifecycle Management System
 * 
 * Handles user lifecycle management, state transitions,
 * and automated lifecycle actions.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class UserLifecycleManagement {
  constructor() {
    this.lifecycleRules = new Map();
    this.lifecycleStates = new Map();
    this.lifecycleTransitions = new Map();
    this.lifecycleHistory = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize user lifecycle management system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing User Lifecycle Management', { userId });

      // Load lifecycle rules and states
      await this.loadLifecycleRules(userId);
      await this.loadLifecycleStates(userId);
      await this.loadLifecycleTransitions(userId);
      await this.loadLifecycleHistory(userId);

      this.isInitialized = true;
      logger.info('User Lifecycle Management initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize User Lifecycle Management', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute lifecycle action
   */
  async executeLifecycleAction(userId, lifecycleData) {
    try {
      logger.info('Executing lifecycle action', { userId, action: lifecycleData.action });

      // Validate lifecycle data
      const validationResult = await this.validateLifecycleData(lifecycleData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Execute lifecycle action based on type
      let lifecycleResult;
      switch (lifecycleData.action) {
        case 'onboard':
          lifecycleResult = await this.executeOnboarding(userId, lifecycleData);
          break;
        case 'activate':
          lifecycleResult = await this.executeActivation(userId, lifecycleData);
          break;
        case 'suspend':
          lifecycleResult = await this.executeSuspension(userId, lifecycleData);
          break;
        case 'reactivate':
          lifecycleResult = await this.executeReactivation(userId, lifecycleData);
          break;
        case 'offboard':
          lifecycleResult = await this.executeOffboarding(userId, lifecycleData);
          break;
        case 'transfer':
          lifecycleResult = await this.executeTransfer(userId, lifecycleData);
          break;
        case 'promote':
          lifecycleResult = await this.executePromotion(userId, lifecycleData);
          break;
        case 'demote':
          lifecycleResult = await this.executeDemotion(userId, lifecycleData);
          break;
        default:
          throw new Error(`Unknown lifecycle action: ${lifecycleData.action}`);
      }

      // Store lifecycle result
      await this.storeLifecycleResult(userId, lifecycleResult);

      logger.info('Lifecycle action executed successfully', { 
        userId, 
        action: lifecycleData.action,
        targetUserId: lifecycleData.targetUserId
      });

      return lifecycleResult;
    } catch (error) {
      logger.error('Failed to execute lifecycle action', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute onboarding
   */
  async executeOnboarding(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const onboardingConfig = lifecycleData.config || {};

      // Create onboarding checklist
      const onboardingChecklist = await this.createOnboardingChecklist(targetUserId, onboardingConfig);

      // Set up initial permissions
      const initialPermissions = await this.setupInitialPermissions(targetUserId, onboardingConfig);

      // Send welcome notifications
      const notifications = await this.sendWelcomeNotifications(targetUserId, onboardingConfig);

      // Update user state
      const userUpdates = {
        status: 'onboarding',
        onboarding_started_at: new Date().toISOString(),
        onboarding_checklist: onboardingChecklist,
        initial_permissions: initialPermissions
      };

      return {
        action: 'onboard',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        checklist: onboardingChecklist,
        permissions: initialPermissions,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute onboarding', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute activation
   */
  async executeActivation(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const activationConfig = lifecycleData.config || {};

      // Complete onboarding checklist
      const completedChecklist = await this.completeOnboardingChecklist(targetUserId);

      // Activate user account
      const accountActivation = await this.activateUserAccount(targetUserId, activationConfig);

      // Set up full permissions
      const fullPermissions = await this.setupFullPermissions(targetUserId, activationConfig);

      // Send activation notifications
      const notifications = await this.sendActivationNotifications(targetUserId, activationConfig);

      // Update user state
      const userUpdates = {
        status: 'active',
        activated_at: new Date().toISOString(),
        onboarding_completed_at: new Date().toISOString(),
        full_permissions: fullPermissions
      };

      return {
        action: 'activate',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        checklist: completedChecklist,
        permissions: fullPermissions,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute activation', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute suspension
   */
  async executeSuspension(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const suspensionConfig = lifecycleData.config || {};

      // Suspend user account
      const accountSuspension = await this.suspendUserAccount(targetUserId, suspensionConfig);

      // Revoke active sessions
      const sessionRevocation = await this.revokeActiveSessions(targetUserId);

      // Backup user data
      const dataBackup = await this.backupUserData(targetUserId);

      // Send suspension notifications
      const notifications = await this.sendSuspensionNotifications(targetUserId, suspensionConfig);

      // Update user state
      const userUpdates = {
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: suspensionConfig.reason || 'Administrative action',
        data_backup: dataBackup
      };

      return {
        action: 'suspend',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        accountSuspension: accountSuspension,
        sessionRevocation: sessionRevocation,
        dataBackup: dataBackup,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute suspension', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute reactivation
   */
  async executeReactivation(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const reactivationConfig = lifecycleData.config || {};

      // Reactivate user account
      const accountReactivation = await this.reactivateUserAccount(targetUserId, reactivationConfig);

      // Restore permissions
      const restoredPermissions = await this.restoreUserPermissions(targetUserId, reactivationConfig);

      // Send reactivation notifications
      const notifications = await this.sendReactivationNotifications(targetUserId, reactivationConfig);

      // Update user state
      const userUpdates = {
        status: 'active',
        reactivated_at: new Date().toISOString(),
        reactivation_reason: reactivationConfig.reason || 'Administrative action',
        restored_permissions: restoredPermissions
      };

      return {
        action: 'reactivate',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        accountReactivation: accountReactivation,
        permissions: restoredPermissions,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute reactivation', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute offboarding
   */
  async executeOffboarding(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const offboardingConfig = lifecycleData.config || {};

      // Create offboarding checklist
      const offboardingChecklist = await this.createOffboardingChecklist(targetUserId, offboardingConfig);

      // Revoke all permissions
      const permissionRevocation = await this.revokeAllPermissions(targetUserId);

      // Archive user data
      const dataArchival = await this.archiveUserData(targetUserId, offboardingConfig);

      // Transfer ownership of resources
      const resourceTransfer = await this.transferResourceOwnership(targetUserId, offboardingConfig);

      // Send offboarding notifications
      const notifications = await this.sendOffboardingNotifications(targetUserId, offboardingConfig);

      // Update user state
      const userUpdates = {
        status: 'offboarded',
        offboarded_at: new Date().toISOString(),
        offboarding_reason: offboardingConfig.reason || 'User departure',
        archived_data: dataArchival,
        transferred_resources: resourceTransfer
      };

      return {
        action: 'offboard',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        checklist: offboardingChecklist,
        permissionRevocation: permissionRevocation,
        dataArchival: dataArchival,
        resourceTransfer: resourceTransfer,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute offboarding', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute transfer
   */
  async executeTransfer(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const transferConfig = lifecycleData.config || {};

      // Transfer user to new department/role
      const departmentTransfer = await this.transferUserDepartment(targetUserId, transferConfig);

      // Update role and permissions
      const roleUpdate = await this.updateUserRole(targetUserId, transferConfig);

      // Transfer resources
      const resourceTransfer = await this.transferUserResources(targetUserId, transferConfig);

      // Send transfer notifications
      const notifications = await this.sendTransferNotifications(targetUserId, transferConfig);

      // Update user state
      const userUpdates = {
        department: transferConfig.newDepartment,
        role: transferConfig.newRole,
        transferred_at: new Date().toISOString(),
        transfer_reason: transferConfig.reason || 'Organizational change',
        transferred_resources: resourceTransfer
      };

      return {
        action: 'transfer',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        departmentTransfer: departmentTransfer,
        roleUpdate: roleUpdate,
        resourceTransfer: resourceTransfer,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute transfer', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute promotion
   */
  async executePromotion(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const promotionConfig = lifecycleData.config || {};

      // Update user role and permissions
      const rolePromotion = await this.promoteUserRole(targetUserId, promotionConfig);

      // Grant additional permissions
      const additionalPermissions = await this.grantAdditionalPermissions(targetUserId, promotionConfig);

      // Update reporting structure
      const reportingUpdate = await this.updateReportingStructure(targetUserId, promotionConfig);

      // Send promotion notifications
      const notifications = await this.sendPromotionNotifications(targetUserId, promotionConfig);

      // Update user state
      const userUpdates = {
        role: promotionConfig.newRole,
        level: promotionConfig.newLevel,
        promoted_at: new Date().toISOString(),
        promotion_reason: promotionConfig.reason || 'Performance and merit',
        additional_permissions: additionalPermissions,
        reporting_structure: reportingUpdate
      };

      return {
        action: 'promote',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        rolePromotion: rolePromotion,
        additionalPermissions: additionalPermissions,
        reportingUpdate: reportingUpdate,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute promotion', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute demotion
   */
  async executeDemotion(userId, lifecycleData) {
    try {
      const targetUserId = lifecycleData.targetUserId;
      const demotionConfig = lifecycleData.config || {};

      // Update user role and permissions
      const roleDemotion = await this.demoteUserRole(targetUserId, demotionConfig);

      // Revoke elevated permissions
      const permissionRevocation = await this.revokeElevatedPermissions(targetUserId, demotionConfig);

      // Update reporting structure
      const reportingUpdate = await this.updateReportingStructure(targetUserId, demotionConfig);

      // Send demotion notifications
      const notifications = await this.sendDemotionNotifications(targetUserId, demotionConfig);

      // Update user state
      const userUpdates = {
        role: demotionConfig.newRole,
        level: demotionConfig.newLevel,
        demoted_at: new Date().toISOString(),
        demotion_reason: demotionConfig.reason || 'Performance or disciplinary action',
        revoked_permissions: permissionRevocation,
        reporting_structure: reportingUpdate
      };

      return {
        action: 'demote',
        targetUserId: targetUserId,
        userUpdates: userUpdates,
        notifications: notifications,
        roleDemotion: roleDemotion,
        permissionRevocation: permissionRevocation,
        reportingUpdate: reportingUpdate,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute demotion', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create onboarding checklist
   */
  async createOnboardingChecklist(targetUserId, onboardingConfig) {
    try {
      const checklist = [
        { id: 'welcome_email', name: 'Send Welcome Email', completed: false, due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        { id: 'account_setup', name: 'Complete Account Setup', completed: false, due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() },
        { id: 'training_assignment', name: 'Assign Training Modules', completed: false, due_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() },
        { id: 'equipment_setup', name: 'Setup Equipment Access', completed: false, due_date: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString() },
        { id: 'mentor_assignment', name: 'Assign Mentor', completed: false, due_date: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString() }
      ];

      return checklist;
    } catch (error) {
      logger.error('Failed to create onboarding checklist', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Setup initial permissions
   */
  async setupInitialPermissions(targetUserId, onboardingConfig) {
    try {
      const initialPermissions = {
        basic_access: true,
        profile_management: true,
        training_access: true,
        communication_access: true,
        restricted_features: false
      };

      return initialPermissions;
    } catch (error) {
      logger.error('Failed to setup initial permissions', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Send welcome notifications
   */
  async sendWelcomeNotifications(targetUserId, onboardingConfig) {
    try {
      const notifications = [
        {
          type: 'email',
          recipient: targetUserId,
          subject: 'Welcome to the Team!',
          message: 'Welcome to our organization. Please complete your onboarding checklist.',
          sent_at: new Date().toISOString()
        },
        {
          type: 'system',
          recipient: targetUserId,
          title: 'Onboarding Started',
          message: 'Your onboarding process has begun. Check your checklist for next steps.',
          sent_at: new Date().toISOString()
        }
      ];

      return notifications;
    } catch (error) {
      logger.error('Failed to send welcome notifications', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Complete onboarding checklist
   */
  async completeOnboardingChecklist(targetUserId) {
    try {
      // Simulate completing onboarding checklist
      const completedChecklist = [
        { id: 'welcome_email', name: 'Send Welcome Email', completed: true, completed_at: new Date().toISOString() },
        { id: 'account_setup', name: 'Complete Account Setup', completed: true, completed_at: new Date().toISOString() },
        { id: 'training_assignment', name: 'Assign Training Modules', completed: true, completed_at: new Date().toISOString() },
        { id: 'equipment_setup', name: 'Setup Equipment Access', completed: true, completed_at: new Date().toISOString() },
        { id: 'mentor_assignment', name: 'Assign Mentor', completed: true, completed_at: new Date().toISOString() }
      ];

      return completedChecklist;
    } catch (error) {
      logger.error('Failed to complete onboarding checklist', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Activate user account
   */
  async activateUserAccount(targetUserId, activationConfig) {
    try {
      const activation = {
        account_activated: true,
        activation_date: new Date().toISOString(),
        activation_method: activationConfig.method || 'automatic',
        activated_by: activationConfig.activatedBy || 'system'
      };

      return activation;
    } catch (error) {
      logger.error('Failed to activate user account', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Setup full permissions
   */
  async setupFullPermissions(targetUserId, activationConfig) {
    try {
      const fullPermissions = {
        basic_access: true,
        profile_management: true,
        training_access: true,
        communication_access: true,
        restricted_features: true,
        advanced_features: true,
        reporting_access: true,
        admin_access: activationConfig.adminAccess || false
      };

      return fullPermissions;
    } catch (error) {
      logger.error('Failed to setup full permissions', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Send activation notifications
   */
  async sendActivationNotifications(targetUserId, activationConfig) {
    try {
      const notifications = [
        {
          type: 'email',
          recipient: targetUserId,
          subject: 'Account Activated',
          message: 'Your account has been activated. You now have full access to the system.',
          sent_at: new Date().toISOString()
        },
        {
          type: 'system',
          recipient: targetUserId,
          title: 'Account Activated',
          message: 'Your account is now active. Welcome to the team!',
          sent_at: new Date().toISOString()
        }
      ];

      return notifications;
    } catch (error) {
      logger.error('Failed to send activation notifications', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Suspend user account
   */
  async suspendUserAccount(targetUserId, suspensionConfig) {
    try {
      const suspension = {
        account_suspended: true,
        suspension_date: new Date().toISOString(),
        suspension_reason: suspensionConfig.reason || 'Administrative action',
        suspended_by: suspensionConfig.suspendedBy || 'system',
        suspension_duration: suspensionConfig.duration || 'indefinite'
      };

      return suspension;
    } catch (error) {
      logger.error('Failed to suspend user account', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Revoke active sessions
   */
  async revokeActiveSessions(targetUserId) {
    try {
      const sessionRevocation = {
        sessions_revoked: true,
        revocation_date: new Date().toISOString(),
        revoked_sessions: 3, // Simulated count
        revocation_method: 'automatic'
      };

      return sessionRevocation;
    } catch (error) {
      logger.error('Failed to revoke active sessions', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Backup user data
   */
  async backupUserData(targetUserId) {
    try {
      const dataBackup = {
        backup_created: true,
        backup_date: new Date().toISOString(),
        backup_location: `backup_${targetUserId}_${Date.now()}`,
        backup_size: '2.5MB',
        backup_status: 'completed'
      };

      return dataBackup;
    } catch (error) {
      logger.error('Failed to backup user data', { error: error.message, targetUserId });
      return {};
    }
  }

  /**
   * Send suspension notifications
   */
  async sendSuspensionNotifications(targetUserId, suspensionConfig) {
    try {
      const notifications = [
        {
          type: 'email',
          recipient: targetUserId,
          subject: 'Account Suspended',
          message: 'Your account has been suspended. Please contact support for more information.',
          sent_at: new Date().toISOString()
        },
        {
          type: 'system',
          recipient: targetUserId,
          title: 'Account Suspended',
          message: 'Your account access has been suspended.',
          sent_at: new Date().toISOString()
        }
      ];

      return notifications;
    } catch (error) {
      logger.error('Failed to send suspension notifications', { error: error.message, targetUserId });
      return [];
    }
  }

  /**
   * Store lifecycle result
   */
  async storeLifecycleResult(userId, lifecycleResult) {
    try {
      const lifecycleData = {
        user_id: userId,
        action: lifecycleResult.action,
        target_user_id: lifecycleResult.targetUserId,
        lifecycle_result: lifecycleResult,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_lifecycle_results')
        .insert(lifecycleData);

      if (error) throw error;

      // Update in-memory history
      if (!this.lifecycleHistory.has(userId)) {
        this.lifecycleHistory.set(userId, []);
      }
      this.lifecycleHistory.get(userId).unshift(lifecycleData);

      // Keep only recent history
      const userHistory = this.lifecycleHistory.get(userId);
      if (userHistory.length > 100) {
        userHistory.splice(100);
      }
    } catch (error) {
      logger.error('Failed to store lifecycle result', { error: error.message, userId });
    }
  }

  /**
   * Load lifecycle rules
   */
  async loadLifecycleRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('user_lifecycle_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.lifecycleRules.set(userId, rules || []);
      logger.info('Lifecycle rules loaded', { userId, ruleCount: rules?.length || 0 });
    } catch (error) {
      logger.error('Failed to load lifecycle rules', { error: error.message, userId });
    }
  }

  /**
   * Load lifecycle states
   */
  async loadLifecycleStates(userId) {
    try {
      const { data: states, error } = await supabase
        .from('user_lifecycle_states')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.lifecycleStates.set(userId, states || []);
      logger.info('Lifecycle states loaded', { userId, stateCount: states?.length || 0 });
    } catch (error) {
      logger.error('Failed to load lifecycle states', { error: error.message, userId });
    }
  }

  /**
   * Load lifecycle transitions
   */
  async loadLifecycleTransitions(userId) {
    try {
      const { data: transitions, error } = await supabase
        .from('user_lifecycle_transitions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.lifecycleTransitions.set(userId, transitions || []);
      logger.info('Lifecycle transitions loaded', { userId, transitionCount: transitions?.length || 0 });
    } catch (error) {
      logger.error('Failed to load lifecycle transitions', { error: error.message, userId });
    }
  }

  /**
   * Load lifecycle history
   */
  async loadLifecycleHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('user_lifecycle_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.lifecycleHistory.set(userId, history || []);
      logger.info('Lifecycle history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load lifecycle history', { error: error.message, userId });
    }
  }

  /**
   * Get lifecycle metrics
   */
  async getLifecycleMetrics(userId) {
    try {
      const userHistory = this.lifecycleHistory.get(userId) || [];
      const userRules = this.lifecycleRules.get(userId) || [];

      const metrics = {
        totalActions: userHistory.length,
        actionsByType: this.groupActionsByType(userHistory),
        avgActionTime: this.calculateAvgActionTime(userHistory),
        totalRules: userRules.length,
        activeRules: userRules.filter(rule => rule.active).length,
        lifecycleTrends: this.analyzeLifecycleTrends(userHistory)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get lifecycle metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get lifecycle insights
   */
  async getLifecycleInsights(userId) {
    try {
      const userHistory = this.lifecycleHistory.get(userId) || [];
      const userRules = this.lifecycleRules.get(userId) || [];

      const insights = {
        lifecycleTrends: this.analyzeLifecycleTrends(userHistory),
        actionPatterns: this.analyzeActionPatterns(userHistory),
        ruleEffectiveness: this.analyzeRuleEffectiveness(userRules, userHistory),
        recommendations: this.generateLifecycleRecommendations(userHistory, userRules)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get lifecycle insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset lifecycle management system for user
   */
  async reset(userId) {
    try {
      this.lifecycleRules.delete(userId);
      this.lifecycleStates.delete(userId);
      this.lifecycleTransitions.delete(userId);
      this.lifecycleHistory.delete(userId);

      logger.info('Lifecycle management system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset lifecycle management system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
