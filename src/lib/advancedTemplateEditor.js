/**
 * Advanced Template Editor System
 * 
 * Core engine for advanced email template editing, A/B testing,
 * analytics, collaboration, and optimization.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';
import { TemplateABTesting } from './templateABTesting.js';
import { TemplateAnalytics } from './templateAnalytics.js';
import { TemplateCollaboration } from './templateCollaboration.js';
import { TemplateOptimizer } from './templateOptimizer.js';

export class AdvancedTemplateEditor {
  constructor() {
    this.templates = new Map();
    this.templateVersions = new Map();
    this.templateComponents = new Map();
    this.templateStyles = new Map();
    this.templateLayouts = new Map();
    this.templateAssets = new Map();
    this.isInitialized = false;
    
    // Initialize integrated components
    this.abTesting = new TemplateABTesting();
    this.analytics = new TemplateAnalytics();
    this.collaboration = new TemplateCollaboration();
    this.optimizer = new TemplateOptimizer();
  }

  /**
   * Initialize the advanced template editor
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Advanced Template Editor', { userId });

      // Initialize all components
      await this.abTesting.initialize(userId);
      await this.analytics.initialize(userId);
      await this.collaboration.initialize(userId);
      await this.optimizer.initialize(userId);

      // Load existing template configurations
      await this.loadTemplates(userId);
      await this.loadTemplateVersions(userId);
      await this.loadTemplateComponents(userId);
      await this.loadTemplateStyles(userId);
      await this.loadTemplateLayouts(userId);
      await this.loadTemplateAssets(userId);

      this.isInitialized = true;
      logger.info('Advanced Template Editor initialized successfully', { userId });

      return { success: true, message: 'Advanced Template Editor initialized' };
    } catch (error) {
      logger.error('Failed to initialize Advanced Template Editor', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create template
   */
  async createTemplate(userId, templateData) {
    try {
      if (!this.isInitialized) {
        await this.initialize(userId);
      }

      logger.info('Creating template', { userId, templateName: templateData.name });

      // Validate template data
      const validationResult = await this.validateTemplateData(templateData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create template
      const template = await this.createTemplateRecord(userId, templateData);

      // Store template
      await this.storeTemplate(userId, template);

      // Initialize template analytics
      await this.analytics.initializeTemplateAnalytics(userId, template.id);

      // Log template creation activity
      await this.logTemplateActivity(userId, 'template_created', template);

      logger.info('Template created successfully', { 
        userId, 
        templateId: template.id, 
        templateName: templateData.name 
      });

      return {
        success: true,
        template
      };
    } catch (error) {
      logger.error('Failed to create template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update template
   */
  async updateTemplate(userId, templateId, updates) {
    try {
      logger.info('Updating template', { userId, templateId });

      // Validate updates
      const validationResult = await this.validateTemplateUpdates(updates);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Get existing template
      const existingTemplate = await this.getTemplate(userId, templateId);
      if (!existingTemplate) {
        return { success: false, error: 'Template not found' };
      }

      // Create new version
      const newVersion = await this.createTemplateVersion(userId, templateId, updates);

      // Update template
      const updatedTemplate = await this.updateTemplateRecord(userId, templateId, updates, newVersion);

      // Store updated template
      await this.storeTemplate(userId, updatedTemplate);

      // Track template changes
      await this.analytics.trackTemplateChange(userId, templateId, updates);

      // Log template update activity
      await this.logTemplateActivity(userId, 'template_updated', updatedTemplate);

      logger.info('Template updated successfully', { 
        userId, 
        templateId, 
        versionId: newVersion.id
      });

      return {
        success: true,
        template: updatedTemplate,
        version: newVersion
      };
    } catch (error) {
      logger.error('Failed to update template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(userId, templateId) {
    try {
      logger.info('Deleting template', { userId, templateId });

      // Get template
      const template = await this.getTemplate(userId, templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Check if template is in use
      const usageCheck = await this.checkTemplateUsage(userId, templateId);
      if (usageCheck.isInUse) {
        return { success: false, error: `Template is currently in use by ${usageCheck.campaignCount} campaigns` };
      }

      // Archive template instead of hard delete
      const archivedTemplate = await this.archiveTemplate(userId, templateId);

      // Remove from active templates
      this.templates.delete(templateId);

      // Log template deletion activity
      await this.logTemplateActivity(userId, 'template_deleted', archivedTemplate);

      logger.info('Template deleted successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        template: archivedTemplate
      };
    } catch (error) {
      logger.error('Failed to delete template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(userId, templateId, duplicateConfig = {}) {
    try {
      logger.info('Duplicating template', { userId, templateId });

      // Get original template
      const originalTemplate = await this.getTemplate(userId, templateId);
      if (!originalTemplate) {
        return { success: false, error: 'Template not found' };
      }

      // Create duplicate template data
      const duplicateData = {
        name: duplicateConfig.name || `${originalTemplate.name} (Copy)`,
        description: duplicateConfig.description || originalTemplate.description,
        content: originalTemplate.content,
        styles: originalTemplate.styles,
        layout: originalTemplate.layout,
        components: originalTemplate.components,
        settings: originalTemplate.settings,
        tags: originalTemplate.tags || []
      };

      // Create duplicate template
      const duplicateTemplate = await this.createTemplateRecord(userId, duplicateData);

      // Store duplicate template
      await this.storeTemplate(userId, duplicateTemplate);

      // Log template duplication activity
      await this.logTemplateActivity(userId, 'template_duplicated', duplicateTemplate);

      logger.info('Template duplicated successfully', { 
        userId, 
        originalTemplateId: templateId,
        duplicateTemplateId: duplicateTemplate.id
      });

      return {
        success: true,
        template: duplicateTemplate
      };
    } catch (error) {
      logger.error('Failed to duplicate template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Preview template
   */
  async previewTemplate(userId, templateId, previewData = {}) {
    try {
      logger.info('Previewing template', { userId, templateId });

      // Get template
      const template = await this.getTemplate(userId, templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Generate preview
      const preview = await this.generateTemplatePreview(template, previewData);

      // Log preview activity
      await this.logTemplateActivity(userId, 'template_previewed', { templateId, previewData });

      logger.info('Template preview generated successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        preview
      };
    } catch (error) {
      logger.error('Failed to preview template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Test template
   */
  async testTemplate(userId, templateId, testConfig = {}) {
    try {
      logger.info('Testing template', { userId, templateId });

      // Get template
      const template = await this.getTemplate(userId, templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Run template tests
      const testResults = await this.runTemplateTests(template, testConfig);

      // Log test activity
      await this.logTemplateActivity(userId, 'template_tested', { templateId, testResults });

      logger.info('Template test completed successfully', { 
        userId, 
        templateId,
        testCount: testResults.tests.length
      });

      return {
        success: true,
        testResults
      };
    } catch (error) {
      logger.error('Failed to test template', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(userId, templateId, analyticsFilters = {}) {
    try {
      logger.info('Getting template analytics', { userId, templateId });

      // Get template analytics
      const analytics = await this.analytics.getTemplateAnalytics(userId, templateId, analyticsFilters);

      logger.info('Template analytics retrieved successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to get template analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template collaboration data
   */
  async getTemplateCollaboration(userId, templateId) {
    try {
      logger.info('Getting template collaboration data', { userId, templateId });

      // Get collaboration data
      const collaboration = await this.collaboration.getTemplateCollaboration(userId, templateId);

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
   * Get template optimization recommendations
   */
  async getTemplateOptimizationRecommendations(userId, templateId) {
    try {
      logger.info('Getting template optimization recommendations', { userId, templateId });

      // Get optimization recommendations
      const recommendations = await this.optimizer.getOptimizationRecommendations(userId, templateId);

      logger.info('Template optimization recommendations retrieved successfully', { 
        userId, 
        templateId,
        recommendationCount: recommendations.length
      });

      return {
        success: true,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to get template optimization recommendations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply template optimization
   */
  async applyTemplateOptimization(userId, templateId, optimizationConfig) {
    try {
      logger.info('Applying template optimization', { userId, templateId });

      // Apply optimization
      const optimizationResult = await this.optimizer.applyOptimization(userId, templateId, optimizationConfig);

      // Update template with optimized version
      if (optimizationResult.success) {
        await this.updateTemplate(userId, templateId, optimizationResult.updates);
      }

      logger.info('Template optimization applied successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        optimizationResult
      };
    } catch (error) {
      logger.error('Failed to apply template optimization', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template editor status
   */
  async getTemplateEditorStatus(userId) {
    try {
      const status = {
        initialized: this.isInitialized,
        templates: this.templates.size,
        templateVersions: this.templateVersions.size,
        templateComponents: this.templateComponents.size,
        templateStyles: this.templateStyles.size,
        templateLayouts: this.templateLayouts.size,
        templateAssets: this.templateAssets.size,
        components: {
          abTesting: this.abTesting.isInitialized,
          analytics: this.analytics.isInitialized,
          collaboration: this.collaboration.isInitialized,
          optimizer: this.optimizer.isInitialized
        }
      };

      return {
        success: true,
        status
      };
    } catch (error) {
      logger.error('Failed to get template editor status', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset template editor for user
   */
  async resetTemplateEditor(userId) {
    try {
      // Clear in-memory data
      this.templates.clear();
      this.templateVersions.clear();
      this.templateComponents.clear();
      this.templateStyles.clear();
      this.templateLayouts.clear();
      this.templateAssets.clear();

      // Reset components
      await this.abTesting.reset(userId);
      await this.analytics.reset(userId);
      await this.collaboration.reset(userId);
      await this.optimizer.reset(userId);

      this.isInitialized = false;

      logger.info('Template editor reset', { userId });

      return {
        success: true,
        message: 'Template editor reset successfully'
      };
    } catch (error) {
      logger.error('Failed to reset template editor', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create template record
   */
  async createTemplateRecord(userId, templateData) {
    try {
      const template = {
        id: this.generateTemplateId(),
        user_id: userId,
        name: templateData.name,
        description: templateData.description || '',
        content: templateData.content || '',
        styles: templateData.styles || {},
        layout: templateData.layout || 'default',
        components: templateData.components || [],
        settings: templateData.settings || {},
        tags: templateData.tags || [],
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      };

      return template;
    } catch (error) {
      logger.error('Failed to create template record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create template version
   */
  async createTemplateVersion(userId, templateId, updates) {
    try {
      const version = {
        id: this.generateVersionId(),
        template_id: templateId,
        user_id: userId,
        changes: updates,
        created_at: new Date().toISOString(),
        created_by: userId
      };

      return version;
    } catch (error) {
      logger.error('Failed to create template version', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update template record
   */
  async updateTemplateRecord(userId, templateId, updates, version) {
    try {
      const existingTemplate = this.templates.get(templateId);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate = {
        ...existingTemplate,
        ...updates,
        updated_at: new Date().toISOString(),
        version: existingTemplate.version + 1,
        last_version_id: version.id
      };

      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update template record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Store template
   */
  async storeTemplate(userId, template) {
    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert(template, { onConflict: 'id' });

      if (error) throw error;

      // Update in-memory template
      this.templates.set(template.id, template);
    } catch (error) {
      logger.error('Failed to store template', { error: error.message, userId });
    }
  }

  /**
   * Get template
   */
  async getTemplate(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templates.has(templateId)) {
        return this.templates.get(templateId);
      }

      // Fetch from database
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (template) {
        this.templates.set(templateId, template);
      }

      return template;
    } catch (error) {
      logger.error('Failed to get template', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Check template usage
   */
  async checkTemplateUsage(userId, templateId) {
    try {
      const { data: campaigns, error } = await supabase
        .from('email_campaigns')
        .select('id')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      return {
        isInUse: campaigns && campaigns.length > 0,
        campaignCount: campaigns ? campaigns.length : 0
      };
    } catch (error) {
      logger.error('Failed to check template usage', { error: error.message, userId });
      return { isInUse: false, campaignCount: 0 };
    }
  }

  /**
   * Archive template
   */
  async archiveTemplate(userId, templateId) {
    try {
      const template = await this.getTemplate(userId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const archivedTemplate = {
        ...template,
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: userId
      };

      const { error } = await supabase
        .from('email_templates')
        .update(archivedTemplate)
        .eq('id', templateId);

      if (error) throw error;

      return archivedTemplate;
    } catch (error) {
      logger.error('Failed to archive template', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate template preview
   */
  async generateTemplatePreview(template, previewData) {
    try {
      const preview = {
        id: this.generatePreviewId(),
        template_id: template.id,
        html: this.renderTemplateHTML(template, previewData),
        text: this.renderTemplateText(template, previewData),
        metadata: {
          generated_at: new Date().toISOString(),
          preview_data: previewData,
          template_version: template.version
        }
      };

      return preview;
    } catch (error) {
      logger.error('Failed to generate template preview', { error: error.message });
      throw error;
    }
  }

  /**
   * Run template tests
   */
  async runTemplateTests(template, testConfig) {
    try {
      const tests = [];

      // Test template structure
      tests.push(await this.testTemplateStructure(template));

      // Test template content
      tests.push(await this.testTemplateContent(template));

      // Test template styles
      tests.push(await this.testTemplateStyles(template));

      // Test template compatibility
      tests.push(await this.testTemplateCompatibility(template));

      const testResults = {
        template_id: template.id,
        tests: tests,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        total: tests.length,
        run_at: new Date().toISOString()
      };

      return testResults;
    } catch (error) {
      logger.error('Failed to run template tests', { error: error.message });
      throw error;
    }
  }

  /**
   * Test template structure
   */
  async testTemplateStructure(template) {
    try {
      const issues = [];

      // Check for required elements
      if (!template.content) {
        issues.push('Template content is missing');
      }

      if (!template.name) {
        issues.push('Template name is missing');
      }

      return {
        name: 'Template Structure Test',
        passed: issues.length === 0,
        issues: issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20))
      };
    } catch (error) {
      logger.error('Failed to test template structure', { error: error.message });
      return {
        name: 'Template Structure Test',
        passed: false,
        issues: ['Test failed due to error'],
        score: 0
      };
    }
  }

  /**
   * Test template content
   */
  async testTemplateContent(template) {
    try {
      const issues = [];

      // Check content quality
      if (template.content && template.content.length < 50) {
        issues.push('Template content is too short');
      }

      // Check for placeholder content
      if (template.content && template.content.includes('Lorem ipsum')) {
        issues.push('Template contains placeholder content');
      }

      return {
        name: 'Template Content Test',
        passed: issues.length === 0,
        issues: issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 25))
      };
    } catch (error) {
      logger.error('Failed to test template content', { error: error.message });
      return {
        name: 'Template Content Test',
        passed: false,
        issues: ['Test failed due to error'],
        score: 0
      };
    }
  }

  /**
   * Test template styles
   */
  async testTemplateStyles(template) {
    try {
      const issues = [];

      // Check for inline styles
      if (template.content && template.content.includes('style=')) {
        issues.push('Template uses inline styles (consider using CSS classes)');
      }

      // Check for responsive design
      if (template.content && !template.content.includes('viewport')) {
        issues.push('Template may not be responsive');
      }

      return {
        name: 'Template Styles Test',
        passed: issues.length === 0,
        issues: issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 30))
      };
    } catch (error) {
      logger.error('Failed to test template styles', { error: error.message });
      return {
        name: 'Template Styles Test',
        passed: false,
        issues: ['Test failed due to error'],
        score: 0
      };
    }
  }

  /**
   * Test template compatibility
   */
  async testTemplateCompatibility(template) {
    try {
      const issues = [];

      // Check for email client compatibility
      if (template.content && template.content.includes('<table>')) {
        // This is actually good for email compatibility
      } else if (template.content && template.content.includes('<div>')) {
        issues.push('Template uses divs instead of tables (may have compatibility issues)');
      }

      return {
        name: 'Template Compatibility Test',
        passed: issues.length === 0,
        issues: issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 40))
      };
    } catch (error) {
      logger.error('Failed to test template compatibility', { error: error.message });
      return {
        name: 'Template Compatibility Test',
        passed: false,
        issues: ['Test failed due to error'],
        score: 0
      };
    }
  }

  /**
   * Render template HTML
   */
  renderTemplateHTML(template, previewData) {
    try {
      let html = template.content || '';

      // Replace placeholders with preview data
      if (previewData) {
        Object.entries(previewData).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          html = html.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      return html;
    } catch (error) {
      logger.error('Failed to render template HTML', { error: error.message });
      return template.content || '';
    }
  }

  /**
   * Render template text
   */
  renderTemplateText(template, previewData) {
    try {
      let text = template.content || '';

      // Strip HTML tags for text version
      text = text.replace(/<[^>]*>/g, '');

      // Replace placeholders with preview data
      if (previewData) {
        Object.entries(previewData).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          text = text.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      return text;
    } catch (error) {
      logger.error('Failed to render template text', { error: error.message });
      return template.content || '';
    }
  }

  /**
   * Log template activity
   */
  async logTemplateActivity(userId, activityType, activityData) {
    try {
      const activity = {
        id: this.generateActivityId(),
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('template_activities')
        .insert(activity);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to log template activity', { error: error.message, userId });
    }
  }

  /**
   * Generate template ID
   */
  generateTemplateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `TEMPLATE-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate version ID
   */
  generateVersionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `VERSION-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate preview ID
   */
  generatePreviewId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `PREVIEW-${timestamp}-${random}`.toUpperCase();
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
   * Load templates
   */
  async loadTemplates(userId) {
    try {
      const { data: templates, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      templates.forEach(template => {
        this.templates.set(template.id, template);
      });

      logger.info('Templates loaded', { userId, templateCount: templates.length });
    } catch (error) {
      logger.error('Failed to load templates', { error: error.message, userId });
    }
  }

  /**
   * Load template versions
   */
  async loadTemplateVersions(userId) {
    try {
      const { data: versions, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      versions.forEach(version => {
        if (!this.templateVersions.has(version.template_id)) {
          this.templateVersions.set(version.template_id, []);
        }
        this.templateVersions.get(version.template_id).push(version);
      });

      logger.info('Template versions loaded', { userId, versionCount: versions.length });
    } catch (error) {
      logger.error('Failed to load template versions', { error: error.message, userId });
    }
  }

  /**
   * Load template components
   */
  async loadTemplateComponents(userId) {
    try {
      const { data: components, error } = await supabase
        .from('template_components')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      components.forEach(component => {
        this.templateComponents.set(component.id, component);
      });

      logger.info('Template components loaded', { userId, componentCount: components.length });
    } catch (error) {
      logger.error('Failed to load template components', { error: error.message, userId });
    }
  }

  /**
   * Load template styles
   */
  async loadTemplateStyles(userId) {
    try {
      const { data: styles, error } = await supabase
        .from('template_styles')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      styles.forEach(style => {
        this.templateStyles.set(style.id, style);
      });

      logger.info('Template styles loaded', { userId, styleCount: styles.length });
    } catch (error) {
      logger.error('Failed to load template styles', { error: error.message, userId });
    }
  }

  /**
   * Load template layouts
   */
  async loadTemplateLayouts(userId) {
    try {
      const { data: layouts, error } = await supabase
        .from('template_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      layouts.forEach(layout => {
        this.templateLayouts.set(layout.id, layout);
      });

      logger.info('Template layouts loaded', { userId, layoutCount: layouts.length });
    } catch (error) {
      logger.error('Failed to load template layouts', { error: error.message, userId });
    }
  }

  /**
   * Load template assets
   */
  async loadTemplateAssets(userId) {
    try {
      const { data: assets, error } = await supabase
        .from('template_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      assets.forEach(asset => {
        this.templateAssets.set(asset.id, asset);
      });

      logger.info('Template assets loaded', { userId, assetCount: assets.length });
    } catch (error) {
      logger.error('Failed to load template assets', { error: error.message, userId });
    }
  }
}

export const advancedTemplateEditor = new AdvancedTemplateEditor();
