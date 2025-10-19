import { UnifiedProfileManager } from './unifiedProfileManager';
import { EnhancedTemplateManager } from './enhancedTemplateManager';
import { RobustErrorHandler } from './robustErrorHandler';
import { PerformanceOptimizer } from './performanceOptimizer';

/**
 * Integrated Profile System - Combines all improvements into a unified system
 * Provides Profile Data Consistency, Enhanced Template Management, Robust Error Handling, and Performance Optimization
 */
export class IntegratedProfileSystem {
  constructor(userId) {
    this.userId = userId;
    this.profileManager = new UnifiedProfileManager(userId);
    this.templateManager = new EnhancedTemplateManager();
    this.errorHandler = new RobustErrorHandler(userId);
    this.performanceOptimizer = new PerformanceOptimizer(userId);
    
    // Initialize system
    this.initialize();
  }

  /**
   * Initialize the integrated system
   */
  async initialize() {
    try {
      // Preload user profile for better performance
      await this.performanceOptimizer.preloadData([this.userId]);
      
      // Note: Template caching disabled to avoid loading unnecessary templates
      // Templates will be loaded on-demand when actually needed
      // await this.cacheFrequentlyUsedTemplates();
      
      console.log('Integrated Profile System initialized successfully');
    } catch (error) {
      console.warn('System initialization had minor issues:', error.message);
    }
  }

  /**
   * Cache templates for user's selected business types only
   * This optimizes performance by only loading what's needed
   */
  async cacheFrequentlyUsedTemplates() {
    try {
      // Get user's business types from their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_types, client_config')
        .eq('id', this.userId)
        .single();
      
      if (!profile) {
        console.warn('⚠️ No profile found for template caching, skipping');
        return;
      }
      
      // Get business types from profile (could be in business_types or client_config)
      const businessTypes = profile.business_types || 
                          profile.client_config?.business_types || 
                          profile.client_config?.businessTypes || 
                          [];
      
      if (businessTypes.length === 0) {
        console.log('ℹ️ No business types selected yet, skipping template cache');
        return;
      }
      
      console.log(`📦 Caching templates for ${businessTypes.length} business type(s):`, businessTypes);
      
      // Only cache templates for user's selected business types
      const operations = businessTypes.map(businessType => ({
        type: 'template_load',
        templateName: `${businessType.toLowerCase().replace(/\s+/g, '_')}_template.json`,
        operation: 'loadTemplate'
      }));
      
      if (operations.length > 0) {
        await this.performanceOptimizer.batchOperations(operations);
      }
    } catch (error) {
      console.warn('ℹ️ Template pre-caching skipped (not critical):', error.message);
      // Don't throw - this is just an optimization, not critical
    }
  }

  /**
   * Get complete profile with all optimizations
   * @param {object} options - Options for profile retrieval
   * @returns {Promise<object>} - Complete profile data
   */
  async getCompleteProfile(options = {}) {
    const {
      forceRefresh = false,
      includeValidation = true,
      includeTemplates = true,
      includeIntegrations = true
    } = options;

    try {
      // Get optimized profile data
      const profileData = await this.performanceOptimizer.getOptimizedProfile(forceRefresh);
      
      // Normalize and validate profile
      const normalizedProfile = this.profileManager.normalizeProfile(profileData);
      
      let validation = null;
      if (includeValidation) {
        validation = this.profileManager.validateProfile(normalizedProfile);
      }
      
      // Get appropriate template
      let templateConfig = null;
      if (includeTemplates) {
        templateConfig = await this.getOptimizedTemplate(normalizedProfile.business.types);
      }
      
      // Get integration data
      let integrations = null;
      if (includeIntegrations) {
        integrations = await this.getOptimizedIntegrations();
      }
      
      // Get voice profile (learned communication style)
      let voiceProfile = null;
      try {
        voiceProfile = await this.getVoiceProfile();
      } catch (error) {
        console.warn('Could not fetch voice profile:', error.message);
      }
      
      // Cache the complete profile for future use
      this.performanceOptimizer.setInCache(
        `complete_profile_${this.userId}`, 
        { normalizedProfile, validation, templateConfig, integrations, voiceProfile }, 
        'profile'
      );
      
      return {
        success: true,
        profile: normalizedProfile,
        validation,
        template: templateConfig,
        integrations,
        voiceProfile,
        metadata: {
          fromCache: profileData.fromCache,
          cacheAge: profileData.cacheAge,
          systemVersion: '2.0',
          generatedAt: new Date().toISOString(),
          voiceProfileAvailable: voiceProfile !== null
        }
      };
      
    } catch (error) {
      // Handle error with robust error handling
      return await this.errorHandler.handleError(error, 'getCompleteProfile', {
        forceRefresh,
        includeValidation,
        includeTemplates,
        includeIntegrations
      });
    }
  }

  /**
   * Get optimized template for business types
   * @param {array} businessTypes - Array of business types
   * @returns {Promise<object>} - Template configuration
   */
  async getOptimizedTemplate(businessTypes) {
    try {
      const cacheKey = `template_${businessTypes.sort().join('_')}`;
      const cached = this.performanceOptimizer.getFromCache(cacheKey, 'templates');
      
      if (cached) {
        return cached;
      }
      
      const templateConfig = await this.templateManager.getTemplateForBusinessTypes(businessTypes);
      
      // Cache the template configuration
      this.performanceOptimizer.setInCache(cacheKey, templateConfig, 'templates');
      
      return templateConfig;
      
    } catch (error) {
      return await this.errorHandler.handleError(error, 'getOptimizedTemplate', {
        businessTypes
      });
    }
  }

  /**
   * Get optimized integrations
   * @returns {Promise<object>} - Integration data
   */
  async getOptimizedIntegrations() {
    try {
      const cacheKey = `integrations_${this.userId}`;
      const cached = this.performanceOptimizer.getFromCache(cacheKey, 'integrations');
      
      if (cached) {
        return cached;
      }
      
      const { data: integrations, error } = await this.performanceOptimizer.optimizedQuery(
        'client_credentials_map',
        {
          select: 'provider, n8n_credential_id',
          filters: { client_id: this.userId },
          cacheKey,
          cacheType: 'integrations'
        }
      );
      
      if (error) {
        throw new Error(`Failed to fetch integrations: ${error.message}`);
      }
      
      return integrations;
      
    } catch (error) {
      return await this.errorHandler.handleError(error, 'getOptimizedIntegrations');
    }
  }

  /**
   * Get voice profile (learned communication style)
   * @returns {Promise<object|null>} - Voice profile data
   */
  async getVoiceProfile() {
    try {
      const cacheKey = `voice_profile_${this.userId}`;
      const cached = this.performanceOptimizer.getFromCache(cacheKey, 'voice');
      
      if (cached) {
        return cached;
      }
      
      const { data: styleData, error } = await this.performanceOptimizer.optimizedQuery(
        'communication_styles',
        {
          select: 'style_profile, learning_count, last_updated',
          filters: { user_id: this.userId },
          cacheKey,
          cacheType: 'voice'
        }
      );
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No voice profile found - this is OK for new users
          return null;
        }
        throw new Error(`Failed to fetch voice profile: ${error.message}`);
      }
      
      // Return the first result (or null if none)
      const voiceProfile = Array.isArray(styleData) ? styleData[0] : styleData;
      
      return voiceProfile || null;
      
    } catch (error) {
      console.warn('Error fetching voice profile:', error.message);
      return null; // Gracefully handle missing voice profiles
    }
  }

  /**
   * Save profile with comprehensive validation and optimization
   * @param {object} profileData - Profile data to save
   * @param {object} options - Save options
   * @returns {Promise<object>} - Save result
   */
  async saveProfile(profileData, options = {}) {
    const {
      validateBeforeSave = true,
      createBackup = true,
      updateTemplate = true,
      batchOperations = true
    } = options;

    try {
      // Create backup if requested
      if (createBackup) {
        await this.createProfileBackup();
      }
      
      // Normalize profile data
      const normalizedProfile = this.profileManager.normalizeProfile(profileData);
      
      // Validate profile if requested
      let validation = null;
      if (validateBeforeSave) {
        validation = this.profileManager.validateProfile(normalizedProfile);
        
        if (!validation.isValid) {
          return {
            success: false,
            validation,
            message: 'Profile validation failed',
            errors: validation.errors
          };
        }
      }
      
      // Save profile using optimized method
      const saveResult = await this.profileManager.saveProfile(normalizedProfile);
      
      if (!saveResult.success) {
        return saveResult;
      }
      
      // Update template if requested
      if (updateTemplate) {
        await this.updateTemplateForProfile(normalizedProfile);
      }
      
      // Clear relevant caches
      this.performanceOptimizer.clearCacheForUser(this.userId, 'profile');
      this.performanceOptimizer.clearCacheForUser(this.userId, 'templates');
      
      // Cache the updated profile
      this.performanceOptimizer.setInCache(
        `profile_${this.userId}`, 
        normalizedProfile, 
        'profile'
      );
      
      return {
        success: true,
        validation,
        saveResult,
        version: saveResult.version,
        message: 'Profile saved successfully'
      };
      
    } catch (error) {
      return await this.errorHandler.handleError(error, 'saveProfile', {
        validateBeforeSave,
        createBackup,
        updateTemplate
      });
    }
  }

  /**
   * Create profile backup
   * @returns {Promise<object>} - Backup result
   */
  async createProfileBackup() {
    try {
      const profileData = await this.performanceOptimizer.getOptimizedProfile();
      const backupData = {
        ...profileData,
        backupCreatedAt: new Date().toISOString(),
        backupVersion: profileData.version || 1
      };
      
      // Store backup in database
      const { error } = await supabase
        .from('profile_backups')
        .insert({
          user_id: this.userId,
          profile_data: backupData,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(`Failed to create backup: ${error.message}`);
      }
      
      return { success: true, message: 'Backup created successfully' };
      
    } catch (error) {
      console.warn('Failed to create profile backup:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update template for profile
   * @param {object} profile - Profile data
   * @returns {Promise<object>} - Update result
   */
  async updateTemplateForProfile(profile) {
    try {
      const businessTypes = profile.business.types;
      const templateConfig = await this.getOptimizedTemplate(businessTypes);
      
      // Store template configuration
      const { error } = await supabase
        .from('profile_templates')
        .upsert({
          user_id: this.userId,
          business_types: businessTypes,
          template_config: templateConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        throw new Error(`Failed to update template: ${error.message}`);
      }
      
      return { success: true, templateConfig };
      
    } catch (error) {
      console.warn('Failed to update template:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy n8n workflow with all optimizations
   * @param {object} options - Deployment options
   * @returns {Promise<object>} - Deployment result
   */
  async deployN8nWorkflow(options = {}) {
    const {
      useOptimizedTemplate = true,
      validateBeforeDeploy = true,
      createBackup = true,
      batchOperations = true
    } = options;

    try {
      // Get complete profile data
      const profileResult = await this.getCompleteProfile({
        forceRefresh: false,
        includeValidation: validateBeforeDeploy,
        includeTemplates: useOptimizedTemplate,
        includeIntegrations: true
      });
      
      if (!profileResult.success) {
        return profileResult;
      }
      
      const { profile, validation, template, integrations } = profileResult;
      
      // Validate before deployment
      if (validateBeforeDeploy && validation && !validation.isValid) {
        return {
          success: false,
          message: 'Profile validation failed',
          validation,
          errors: validation.errors
        };
      }
      
      // Create backup if requested
      if (createBackup) {
        await this.createProfileBackup();
      }
      
      // Prepare deployment data
      const deploymentData = {
        profile,
        template,
        integrations,
        metadata: {
          deployedAt: new Date().toISOString(),
          systemVersion: '2.0',
          userId: this.userId
        }
      };
      
      // Deploy to n8n (this would call the actual deployment function)
      const deploymentResult = await this.executeN8nDeployment(deploymentData);
      
      // Log successful deployment
      this.errorHandler.cacheData('deployment', deploymentResult);
      
      return {
        success: true,
        deployment: deploymentResult,
        profile,
        template,
        message: 'N8N workflow deployed successfully'
      };
      
    } catch (error) {
      return await this.errorHandler.handleError(error, 'deployN8nWorkflow', options);
    }
  }

  /**
   * Execute N8N deployment
   * @param {object} deploymentData - Deployment data
   * @returns {Promise<object>} - Deployment result
   */
  async executeN8nDeployment(deploymentData) {
    // This would integrate with the actual N8N deployment system
    // For now, return a mock result
    return {
      workflowId: `wf_${Date.now()}`,
      status: 'deployed',
      version: 1,
      deployedAt: new Date().toISOString(),
      template: deploymentData.template?.type || 'unknown'
    };
  }

  /**
   * Get system health and performance metrics
   * @returns {object} - System metrics
   */
  getSystemMetrics() {
    return {
      profileManager: {
        cacheStats: this.profileManager.getCacheStats ? this.profileManager.getCacheStats() : null
      },
      templateManager: {
        cacheStats: this.templateManager.getCacheStats()
      },
      errorHandler: {
        errorStats: this.errorHandler.getErrorStats()
      },
      performanceOptimizer: {
        cacheStats: this.performanceOptimizer.getCacheStats()
      },
      systemHealth: {
        timestamp: new Date().toISOString(),
        userId: this.userId,
        version: '2.0'
      }
    };
  }

  /**
   * Clear all caches and reset system
   */
  clearAllCaches() {
    this.profileManager.clearCache();
    this.templateManager.clearCache();
    this.performanceOptimizer.clearAllCache();
    this.errorHandler.clearErrorLogs();
  }

  /**
   * Get comprehensive system status
   * @returns {object} - System status
   */
  async getSystemStatus() {
    try {
      const metrics = this.getSystemMetrics();
      const profileHealth = await this.getCompleteProfile({ includeValidation: true });
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics,
        profileHealth: profileHealth.success ? 'valid' : 'invalid',
        systemVersion: '2.0',
        userId: this.userId
      };
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        error: error.message,
        systemVersion: '2.0',
        userId: this.userId
      };
    }
  }
}

/**
 * Convenience function to get integrated profile system instance
 * @param {string} userId - The user ID
 * @returns {IntegratedProfileSystem} - System instance
 */
export const getIntegratedProfileSystem = (userId) => {
  return new IntegratedProfileSystem(userId);
};

/**
 * React hook for integrated profile system
 * @param {string} userId - The user ID
 * @returns {object} - System methods
 */
export const useIntegratedProfileSystem = (userId) => {
  const system = new IntegratedProfileSystem(userId);
  
  return {
    getCompleteProfile: system.getCompleteProfile.bind(system),
    saveProfile: system.saveProfile.bind(system),
    deployN8nWorkflow: system.deployN8nWorkflow.bind(system),
    getSystemMetrics: system.getSystemMetrics.bind(system),
    getSystemStatus: system.getSystemStatus.bind(system),
    clearAllCaches: system.clearAllCaches.bind(system)
  };
};
