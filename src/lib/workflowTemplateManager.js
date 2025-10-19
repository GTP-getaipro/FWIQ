/**
 * Advanced Workflow Template Management System
 * 
 * Provides comprehensive template management for workflow creation, sharing,
 * and reuse. Includes template categories, versioning, and marketplace features.
 */

import { supabase } from './customSupabaseClient.js';

export class WorkflowTemplateManager {
  constructor() {
    this.templates = new Map();
    this.categories = new Map();
    this.templateCache = new Map();
    this.marketplaceTemplates = new Map();
    this.userTemplates = new Map();
  }

  /**
   * Initialize template management system
   */
  async initialize(userId) {
    try {
      // Load built-in templates
      await this.loadBuiltInTemplates();
      
      // Load user templates
      await this.loadUserTemplates(userId);
      
      // Load marketplace templates
      await this.loadMarketplaceTemplates();
      
      // Load template categories
      await this.loadTemplateCategories();
      
      console.log('Workflow template management initialized');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize template management:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load built-in workflow templates
   */
  async loadBuiltInTemplates() {
    try {
      const builtInTemplates = [
        {
          id: 'email-automation-basic',
          name: 'Basic Email Automation',
          description: 'Simple email processing and routing workflow',
          category: 'email-automation',
          version: '1.0.0',
          isBuiltIn: true,
          isPublic: true,
          tags: ['email', 'automation', 'basic'],
          workflow: {
            nodes: [
              {
                id: 'email-trigger',
                type: 'email-trigger',
                name: 'Email Received',
                position: { x: 100, y: 100 },
                parameters: {
                  trigger: 'email_received',
                  conditions: []
                }
              },
              {
                id: 'email-processor',
                type: 'email-processor',
                name: 'Process Email',
                position: { x: 300, y: 100 },
                parameters: {
                  actions: ['extract_content', 'classify_email', 'set_priority']
                }
              },
              {
                id: 'email-router',
                type: 'email-router',
                name: 'Route Email',
                position: { x: 500, y: 100 },
                parameters: {
                  routing_rules: [
                    { condition: 'priority = high', action: 'send_to_manager' },
                    { condition: 'category = support', action: 'send_to_support' },
                    { condition: 'default', action: 'send_to_inbox' }
                  ]
                }
              }
            ],
            connections: [
              { from: 'email-trigger', to: 'email-processor' },
              { from: 'email-processor', to: 'email-router' }
            ]
          },
          metadata: {
            estimatedExecutionTime: 5000,
            complexity: 'basic',
            requiredPermissions: ['email_read', 'email_write'],
            compatibility: ['n8n', 'zapier']
          }
        },
        {
          id: 'lead-scoring-advanced',
          name: 'Advanced Lead Scoring',
          description: 'Comprehensive lead scoring and qualification workflow',
          category: 'lead-management',
          version: '1.2.0',
          isBuiltIn: true,
          isPublic: true,
          tags: ['lead-scoring', 'crm', 'advanced'],
          workflow: {
            nodes: [
              {
                id: 'lead-trigger',
                type: 'lead-trigger',
                name: 'New Lead',
                position: { x: 100, y: 100 },
                parameters: {
                  trigger: 'lead_created',
                  sources: ['website', 'social', 'referral']
                }
              },
              {
                id: 'data-enrichment',
                type: 'data-enrichment',
                name: 'Enrich Lead Data',
                position: { x: 300, y: 100 },
                parameters: {
                  services: ['clearbit', 'hunter', 'linkedin'],
                  fields: ['company', 'industry', 'job_title', 'email_verification']
                }
              },
              {
                id: 'scoring-engine',
                type: 'scoring-engine',
                name: 'Calculate Score',
                position: { x: 500, y: 100 },
                parameters: {
                  scoring_criteria: [
                    { field: 'company_size', weight: 0.3, values: { 'large': 100, 'medium': 70, 'small': 40 } },
                    { field: 'industry', weight: 0.2, values: { 'technology': 90, 'finance': 80, 'healthcare': 85 } },
                    { field: 'job_title', weight: 0.25, values: { 'ceo': 100, 'cto': 95, 'manager': 70 } },
                    { field: 'email_verified', weight: 0.15, values: { 'true': 100, 'false': 0 } },
                    { field: 'website_activity', weight: 0.1, values: { 'high': 100, 'medium': 60, 'low': 20 } }
                  ]
                }
              },
              {
                id: 'qualification-router',
                type: 'qualification-router',
                name: 'Qualify Lead',
                position: { x: 700, y: 100 },
                parameters: {
                  qualification_rules: [
                    { condition: 'score >= 80', action: 'hot_lead', next_action: 'assign_to_sales' },
                    { condition: 'score >= 60', action: 'warm_lead', next_action: 'nurture_campaign' },
                    { condition: 'score < 60', action: 'cold_lead', next_action: 'general_campaign' }
                  ]
                }
              }
            ],
            connections: [
              { from: 'lead-trigger', to: 'data-enrichment' },
              { from: 'data-enrichment', to: 'scoring-engine' },
              { from: 'scoring-engine', to: 'qualification-router' }
            ]
          },
          metadata: {
            estimatedExecutionTime: 15000,
            complexity: 'advanced',
            requiredPermissions: ['crm_read', 'crm_write', 'data_enrichment'],
            compatibility: ['n8n', 'zapier', 'hubspot']
          }
        },
        {
          id: 'customer-onboarding',
          name: 'Customer Onboarding',
          description: 'Automated customer onboarding and welcome sequence',
          category: 'customer-success',
          version: '1.1.0',
          isBuiltIn: true,
          isPublic: true,
          tags: ['onboarding', 'customer-success', 'automation'],
          workflow: {
            nodes: [
              {
                id: 'signup-trigger',
                type: 'signup-trigger',
                name: 'Customer Signed Up',
                position: { x: 100, y: 100 },
                parameters: {
                  trigger: 'customer_signup',
                  required_fields: ['email', 'name', 'company']
                }
              },
              {
                id: 'account-setup',
                type: 'account-setup',
                name: 'Setup Account',
                position: { x: 300, y: 100 },
                parameters: {
                  actions: ['create_account', 'send_verification', 'setup_preferences']
                }
              },
              {
                id: 'welcome-email',
                type: 'welcome-email',
                name: 'Send Welcome Email',
                position: { x: 500, y: 100 },
                parameters: {
                  template: 'welcome_series',
                  delay: 0,
                  personalization: ['name', 'company']
                }
              },
              {
                id: 'onboarding-sequence',
                type: 'onboarding-sequence',
                name: 'Start Onboarding',
                position: { x: 700, y: 100 },
                parameters: {
                  sequence: [
                    { day: 1, action: 'send_tutorial_email' },
                    { day: 3, action: 'schedule_demo_call' },
                    { day: 7, action: 'send_best_practices' },
                    { day: 14, action: 'check_in_call' }
                  ]
                }
              }
            ],
            connections: [
              { from: 'signup-trigger', to: 'account-setup' },
              { from: 'account-setup', to: 'welcome-email' },
              { from: 'welcome-email', to: 'onboarding-sequence' }
            ]
          },
          metadata: {
            estimatedExecutionTime: 10000,
            complexity: 'intermediate',
            requiredPermissions: ['email_send', 'account_management'],
            compatibility: ['n8n', 'mailchimp', 'hubspot']
          }
        }
      ];

      // Store built-in templates
      for (const template of builtInTemplates) {
        this.templates.set(template.id, template);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to load built-in templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load user-created templates
   */
  async loadUserTemplates(userId) {
    try {
      const { data: templates, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_built_in', false);

      if (error) throw error;

      // Store user templates
      for (const template of templates) {
        this.userTemplates.set(template.id, template);
        this.templates.set(template.id, template);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to load user templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load marketplace templates
   */
  async loadMarketplaceTemplates() {
    try {
      const { data: templates, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_public', true)
        .eq('is_built_in', false)
        .eq('is_marketplace', true);

      if (error) throw error;

      // Store marketplace templates
      for (const template of templates) {
        this.marketplaceTemplates.set(template.id, template);
        this.templates.set(template.id, template);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to load marketplace templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load template categories
   */
  async loadTemplateCategories() {
    try {
      const categories = [
        {
          id: 'email-automation',
          name: 'Email Automation',
          description: 'Templates for email processing and automation',
          icon: 'email',
          color: '#3B82F6'
        },
        {
          id: 'lead-management',
          name: 'Lead Management',
          description: 'Templates for lead scoring and qualification',
          icon: 'users',
          color: '#10B981'
        },
        {
          id: 'customer-success',
          name: 'Customer Success',
          description: 'Templates for customer onboarding and support',
          icon: 'heart',
          color: '#F59E0B'
        },
        {
          id: 'data-processing',
          name: 'Data Processing',
          description: 'Templates for data transformation and analysis',
          icon: 'database',
          color: '#8B5CF6'
        },
        {
          id: 'integration',
          name: 'Integration',
          description: 'Templates for system integration and API workflows',
          icon: 'link',
          color: '#EF4444'
        },
        {
          id: 'notification',
          name: 'Notifications',
          description: 'Templates for alert and notification systems',
          icon: 'bell',
          color: '#06B6D4'
        }
      ];

      // Store categories
      for (const category of categories) {
        this.categories.set(category.id, category);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to load template categories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(categoryId, userId = null) {
    try {
      const templates = Array.from(this.templates.values())
        .filter(template => {
          // Filter by category
          if (template.category !== categoryId) return false;
          
          // Filter by visibility
          if (template.isPublic) return true;
          if (template.user_id === userId) return true;
          
          return false;
        })
        .sort((a, b) => {
          // Built-in templates first, then by popularity/rating
          if (a.isBuiltIn && !b.isBuiltIn) return -1;
          if (!a.isBuiltIn && b.isBuiltIn) return 1;
          return (b.popularity || 0) - (a.popularity || 0);
        });

      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to get templates by category:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all available templates
   */
  async getAllTemplates(userId = null, filters = {}) {
    try {
      let templates = Array.from(this.templates.values());

      // Apply filters
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      
      if (filters.complexity) {
        templates = templates.filter(t => t.metadata?.complexity === filters.complexity);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t => 
          filters.tags.some(tag => t.tags?.includes(tag))
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm) ||
          t.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Filter by visibility
      templates = templates.filter(template => {
        if (template.isPublic) return true;
        if (template.user_id === userId) return true;
        return false;
      });

      // Sort templates
      templates.sort((a, b) => {
        // Built-in templates first
        if (a.isBuiltIn && !b.isBuiltIn) return -1;
        if (!a.isBuiltIn && b.isBuiltIn) return 1;
        
        // Then by popularity/rating
        return (b.popularity || 0) - (a.popularity || 0);
      });

      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to get all templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId, userId = null) {
    try {
      const template = this.templates.get(templateId);
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Check visibility
      if (!template.isPublic && template.user_id !== userId) {
        return { success: false, error: 'Template not accessible' };
      }

      return { success: true, data: template };
    } catch (error) {
      console.error('Failed to get template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new template from workflow
   */
  async createTemplate(userId, templateData) {
    try {
      const template = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        version: '1.0.0',
        isBuiltIn: false,
        isPublic: templateData.isPublic || false,
        isMarketplace: templateData.isMarketplace || false,
        tags: templateData.tags || [],
        workflow: templateData.workflow,
        metadata: templateData.metadata || {},
        popularity: 0,
        rating: 0,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Validate template
      const validation = await this.validateTemplate(template);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Store in database
      const { error } = await supabase
        .from('workflow_templates')
        .insert(template);

      if (error) throw error;

      // Store in memory
      this.templates.set(template.id, template);
      this.userTemplates.set(template.id, template);

      return { success: true, data: template };
    } catch (error) {
      console.error('Failed to create template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(userId, templateId, updateData) {
    try {
      const template = this.templates.get(templateId);
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Check ownership
      if (template.user_id !== userId) {
        return { success: false, error: 'Not authorized to update this template' };
      }

      // Update template
      const updatedTemplate = {
        ...template,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Validate updated template
      const validation = await this.validateTemplate(updatedTemplate);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Update in database
      const { error } = await supabase
        .from('workflow_templates')
        .update(updatedTemplate)
        .eq('id', templateId);

      if (error) throw error;

      // Update in memory
      this.templates.set(templateId, updatedTemplate);
      this.userTemplates.set(templateId, updatedTemplate);

      return { success: true, data: updatedTemplate };
    } catch (error) {
      console.error('Failed to update template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(userId, templateId) {
    try {
      const template = this.templates.get(templateId);
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Check ownership
      if (template.user_id !== userId) {
        return { success: false, error: 'Not authorized to delete this template' };
      }

      // Cannot delete built-in templates
      if (template.isBuiltIn) {
        return { success: false, error: 'Cannot delete built-in templates' };
      }

      // Delete from database
      const { error } = await supabase
        .from('workflow_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Remove from memory
      this.templates.delete(templateId);
      this.userTemplates.delete(templateId);

      return { success: true, message: 'Template deleted successfully' };
    } catch (error) {
      console.error('Failed to delete template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create workflow from template
   */
  async createWorkflowFromTemplate(userId, templateId, customizations = {}) {
    try {
      const template = this.templates.get(templateId);
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Check visibility
      if (!template.isPublic && template.user_id !== userId) {
        return { success: false, error: 'Template not accessible' };
      }

      // Create workflow from template
      const workflow = {
        name: customizations.name || `${template.name} (Copy)`,
        description: customizations.description || template.description,
        workflow_definition: {
          ...template.workflow,
          ...customizations.workflow
        },
        category: template.category,
        tags: [...(template.tags || []), ...(customizations.tags || [])],
        metadata: {
          ...template.metadata,
          ...customizations.metadata,
          created_from_template: templateId,
          template_version: template.version
        },
        status: 'draft',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store workflow
      const { data: createdWorkflow, error } = await supabase
        .from('workflows')
        .insert(workflow)
        .select()
        .single();

      if (error) throw error;

      // Update template usage count
      await this.incrementTemplateUsage(templateId);

      return { success: true, data: createdWorkflow };
    } catch (error) {
      console.error('Failed to create workflow from template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Increment template usage count
   */
  async incrementTemplateUsage(templateId) {
    try {
      const template = this.templates.get(templateId);
      if (!template) return;

      template.usage_count = (template.usage_count || 0) + 1;

      // Update in database
      await supabase
        .from('workflow_templates')
        .update({ usage_count: template.usage_count })
        .eq('id', templateId);

      // Update in memory
      this.templates.set(templateId, template);

    } catch (error) {
      console.error('Failed to increment template usage:', error);
    }
  }

  /**
   * Rate a template
   */
  async rateTemplate(userId, templateId, rating) {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }

      const template = this.templates.get(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Store rating
      const { error } = await supabase
        .from('template_ratings')
        .upsert({
          user_id: userId,
          template_id: templateId,
          rating: rating,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update template average rating
      const { data: ratings } = await supabase
        .from('template_ratings')
        .select('rating')
        .eq('template_id', templateId);

      if (ratings) {
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        template.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place

        // Update in database
        await supabase
          .from('workflow_templates')
          .update({ rating: template.rating })
          .eq('id', templateId);

        // Update in memory
        this.templates.set(templateId, template);
      }

      return { success: true, message: 'Template rated successfully' };
    } catch (error) {
      console.error('Failed to rate template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template categories
   */
  async getTemplateCategories() {
    try {
      const categories = Array.from(this.categories.values());
      return { success: true, data: categories };
    } catch (error) {
      console.error('Failed to get template categories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(query, userId = null, filters = {}) {
    try {
      const searchTerm = query.toLowerCase();
      
      let templates = Array.from(this.templates.values());

      // Apply search
      templates = templates.filter(template => {
        return template.name.toLowerCase().includes(searchTerm) ||
               template.description.toLowerCase().includes(searchTerm) ||
               template.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      });

      // Apply additional filters
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      
      if (filters.complexity) {
        templates = templates.filter(t => t.metadata?.complexity === filters.complexity);
      }
      
      if (filters.minRating) {
        templates = templates.filter(t => (t.rating || 0) >= filters.minRating);
      }

      // Filter by visibility
      templates = templates.filter(template => {
        if (template.isPublic) return true;
        if (template.user_id === userId) return true;
        return false;
      });

      // Sort by relevance (exact matches first, then by popularity)
      templates.sort((a, b) => {
        const aExactMatch = a.name.toLowerCase() === searchTerm;
        const bExactMatch = b.name.toLowerCase() === searchTerm;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        return (b.popularity || 0) - (a.popularity || 0);
      });

      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to search templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit = 10) {
    try {
      const templates = Array.from(this.templates.values())
        .filter(template => template.isPublic)
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, limit);

      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to get popular templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recently used templates by user
   */
  async getRecentlyUsedTemplates(userId, limit = 10) {
    try {
      const { data: recentTemplates, error } = await supabase
        .from('template_usage')
        .select(`
          template_id,
          workflow_templates (*)
        `)
        .eq('user_id', userId)
        .order('last_used', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const templates = recentTemplates.map(usage => usage.workflow_templates);
      return { success: true, data: templates };
    } catch (error) {
      console.error('Failed to get recently used templates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate template structure
   */
  async validateTemplate(template) {
    try {
      const errors = [];

      // Required fields
      if (!template.name) errors.push('Template name is required');
      if (!template.description) errors.push('Template description is required');
      if (!template.category) errors.push('Template category is required');
      if (!template.workflow) errors.push('Template workflow is required');

      // Validate workflow structure
      if (template.workflow) {
        if (!template.workflow.nodes || !Array.isArray(template.workflow.nodes)) {
          errors.push('Workflow must have nodes array');
        }
        
        if (!template.workflow.connections || !Array.isArray(template.workflow.connections)) {
          errors.push('Workflow must have connections array');
        }

        // Validate nodes
        if (template.workflow.nodes) {
          for (const node of template.workflow.nodes) {
            if (!node.id) errors.push('All nodes must have an ID');
            if (!node.type) errors.push('All nodes must have a type');
            if (!node.name) errors.push('All nodes must have a name');
          }
        }
      }

      // Validate category exists
      if (template.category && !this.categories.has(template.category)) {
        errors.push('Invalid template category');
      }

      if (errors.length > 0) {
        return { success: false, error: errors.join(', ') };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to validate template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export template
   */
  async exportTemplate(templateId, format = 'json') {
    try {
      const template = this.templates.get(templateId);
      
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Remove sensitive data
      const exportData = {
        ...template,
        user_id: undefined,
        usage_count: undefined,
        created_at: undefined,
        updated_at: undefined
      };

      if (format === 'json') {
        return { success: true, data: exportData };
      } else if (format === 'yaml') {
        // In a real implementation, you'd use a YAML library
        return { success: true, data: JSON.stringify(exportData, null, 2) };
      }

      return { success: false, error: 'Unsupported export format' };
    } catch (error) {
      console.error('Failed to export template:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import template
   */
  async importTemplate(userId, templateData) {
    try {
      // Validate imported template
      const validation = await this.validateTemplate(templateData);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Create new template from imported data
      const template = {
        ...templateData,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        isBuiltIn: false,
        isPublic: false,
        isMarketplace: false,
        usage_count: 0,
        rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store template
      const { error } = await supabase
        .from('workflow_templates')
        .insert(template);

      if (error) throw error;

      // Store in memory
      this.templates.set(template.id, template);
      this.userTemplates.set(template.id, template);

      return { success: true, data: template };
    } catch (error) {
      console.error('Failed to import template:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const workflowTemplateManager = new WorkflowTemplateManager();
