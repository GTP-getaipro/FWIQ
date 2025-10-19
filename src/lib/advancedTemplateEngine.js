/**
 * Advanced Template Engine
 * Enhanced email template system with advanced features
 */

import { emailTemplates, compileEmailTemplate, validateEmailTemplate } from '@/templates/email-templates';

export class AdvancedTemplateEngine {
  constructor() {
    this.templates = new Map();
    this.templateCache = new Map();
    this.compiledCache = new Map();
    this.performanceMetrics = {
      compilationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.loadDefaultTemplates();
  }

  /**
   * Load default templates from existing system
   */
  loadDefaultTemplates() {
    Object.entries(emailTemplates).forEach(([key, template]) => {
      this.templates.set(key, {
        ...template,
        id: key,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          category: this.categorizeTemplate(key),
          tags: this.generateTags(key),
          usage: 0,
          performance: { avgCompileTime: 0, avgRenderTime: 0 }
        }
      });
    });
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Object} Created template
   */
  createTemplate(templateData) {
    const startTime = performance.now();
    
    const validation = validateEmailTemplate(templateData);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    const template = {
      id: this.generateTemplateId(),
      ...templateData,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        category: templateData.category || 'custom',
        tags: templateData.tags || [],
        usage: 0,
        performance: { avgCompileTime: 0, avgRenderTime: 0 }
      }
    };

    this.templates.set(template.id, template);
    this.updatePerformanceMetrics(startTime, 'compilation');
    
    return template;
  }

  /**
   * Update an existing template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated template
   */
  updateTemplate(templateId, updates) {
    const startTime = performance.now();
    const existingTemplate = this.templates.get(templateId);
    
    if (!existingTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    const validation = validateEmailTemplate({ ...existingTemplate, ...updates });
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    const updatedTemplate = {
      ...existingTemplate,
      ...updates,
      version: existingTemplate.version + 1,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...existingTemplate.metadata,
        ...updates.metadata
      }
    };

    this.templates.set(templateId, updatedTemplate);
    this.clearTemplateCache(templateId);
    this.updatePerformanceMetrics(startTime, 'compilation');
    
    return updatedTemplate;
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Object} Template
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   * @param {Object} filters - Filter options
   * @returns {Array} Templates
   */
  getTemplates(filters = {}) {
    let templates = Array.from(this.templates.values());
    
    if (filters.category) {
      templates = templates.filter(t => t.metadata.category === filters.category);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      templates = templates.filter(t => 
        filters.tags.some(tag => t.metadata.tags.includes(tag))
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      templates = templates.filter(t => 
        t.subject.toLowerCase().includes(searchTerm) ||
        t.html.toLowerCase().includes(searchTerm) ||
        t.text.toLowerCase().includes(searchTerm)
      );
    }
    
    return templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Compile template with data
   * @param {string} templateId - Template ID
   * @param {Object} data - Data to inject
   * @returns {Object} Compiled template
   */
  compileTemplate(templateId, data) {
    const startTime = performance.now();
    const cacheKey = `${templateId}_${JSON.stringify(data)}`;
    
    // Check cache first
    if (this.compiledCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      return this.compiledCache.get(cacheKey);
    }
    
    this.performanceMetrics.cacheMisses++;
    
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const compiled = compileEmailTemplate(template, data);
    
    // Cache the result
    this.compiledCache.set(cacheKey, compiled);
    
    // Update usage statistics
    template.metadata.usage++;
    
    this.updatePerformanceMetrics(startTime, 'compilation');
    
    return compiled;
  }

  /**
   * Render template to HTML
   * @param {string} templateId - Template ID
   * @param {Object} data - Data to inject
   * @returns {string} Rendered HTML
   */
  renderTemplate(templateId, data) {
    const startTime = performance.now();
    const compiled = this.compileTemplate(templateId, data);
    
    this.updatePerformanceMetrics(startTime, 'render');
    
    return compiled.html;
  }

  /**
   * Duplicate template
   * @param {string} templateId - Template ID
   * @param {string} newName - New template name
   * @returns {Object} Duplicated template
   */
  duplicateTemplate(templateId, newName) {
    const originalTemplate = this.templates.get(templateId);
    if (!originalTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    const duplicatedTemplate = {
      ...originalTemplate,
      id: this.generateTemplateId(),
      subject: `${originalTemplate.subject} (Copy)`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...originalTemplate.metadata,
        usage: 0,
        performance: { avgCompileTime: 0, avgRenderTime: 0 }
      }
    };

    this.templates.set(duplicatedTemplate.id, duplicatedTemplate);
    return duplicatedTemplate;
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @returns {boolean} Success status
   */
  deleteTemplate(templateId) {
    if (this.templates.has(templateId)) {
      this.templates.delete(templateId);
      this.clearTemplateCache(templateId);
      return true;
    }
    return false;
  }

  /**
   * Get template analytics
   * @param {string} templateId - Template ID
   * @returns {Object} Analytics data
   */
  getTemplateAnalytics(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      id: templateId,
      usage: template.metadata.usage,
      performance: template.metadata.performance,
      lastUsed: template.updatedAt,
      version: template.version,
      category: template.metadata.category,
      tags: template.metadata.tags
    };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / 
        (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100,
      totalTemplates: this.templates.size,
      cacheSize: this.compiledCache.size
    };
  }

  /**
   * Clear template cache
   * @param {string} templateId - Template ID (optional)
   */
  clearTemplateCache(templateId = null) {
    if (templateId) {
      // Clear specific template cache
      for (const key of this.compiledCache.keys()) {
        if (key.startsWith(`${templateId}_`)) {
          this.compiledCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.compiledCache.clear();
    }
  }

  /**
   * Export templates
   * @param {Array} templateIds - Template IDs to export
   * @returns {Object} Export data
   */
  exportTemplates(templateIds = null) {
    const templatesToExport = templateIds ? 
      templateIds.map(id => this.templates.get(id)).filter(Boolean) :
      Array.from(this.templates.values());

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates: templatesToExport,
      metadata: {
        totalTemplates: templatesToExport.length,
        engineVersion: '1.0'
      }
    };
  }

  /**
   * Import templates
   * @param {Object} importData - Import data
   * @returns {Object} Import results
   */
  importTemplates(importData) {
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    if (!importData.templates || !Array.isArray(importData.templates)) {
      throw new Error('Invalid import data format');
    }

    importData.templates.forEach(template => {
      try {
        const validation = validateEmailTemplate(template);
        if (!validation.isValid) {
          results.errors.push(`Template ${template.id || 'unknown'}: ${validation.errors.join(', ')}`);
          results.skipped++;
          return;
        }

        // Generate new ID to avoid conflicts
        const newTemplate = {
          ...template,
          id: this.generateTemplateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.templates.set(newTemplate.id, newTemplate);
        results.imported++;
      } catch (error) {
        results.errors.push(`Template ${template.id || 'unknown'}: ${error.message}`);
        results.skipped++;
      }
    });

    return results;
  }

  // Helper methods
  generateTemplateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  categorizeTemplate(templateKey) {
    const categories = {
      'DEFAULT': 'system',
      'EMAIL_RECEIVED': 'notification',
      'WORKFLOW_DEPLOYED': 'workflow',
      'WORKFLOW_FAILED': 'workflow',
      'SYSTEM_ALERT': 'system',
      'BILLING_REMINDER': 'billing',
      'DAILY_SUMMARY': 'report'
    };
    return categories[templateKey] || 'custom';
  }

  generateTags(templateKey) {
    const tagMap = {
      'EMAIL_RECEIVED': ['email', 'notification', 'inbox'],
      'WORKFLOW_DEPLOYED': ['workflow', 'deployment', 'success'],
      'WORKFLOW_FAILED': ['workflow', 'error', 'failure'],
      'SYSTEM_ALERT': ['system', 'alert', 'monitoring'],
      'BILLING_REMINDER': ['billing', 'payment', 'subscription'],
      'DAILY_SUMMARY': ['report', 'summary', 'analytics']
    };
    return tagMap[templateKey] || ['custom'];
  }

  updatePerformanceMetrics(startTime, operation) {
    const duration = performance.now() - startTime;
    
    if (operation === 'compilation') {
      this.performanceMetrics.compilationTime += duration;
    } else if (operation === 'render') {
      this.performanceMetrics.renderTime = (this.performanceMetrics.renderTime + duration) / 2;
    }
  }
}

// Export singleton instance
export const advancedTemplateEngine = new AdvancedTemplateEngine();
export default AdvancedTemplateEngine;
