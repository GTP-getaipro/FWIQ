import { supabase } from './customSupabaseClient';

export class ResponseTemplateEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.defaultTemplates = this.getDefaultTemplates();
  }

  async getTemplates(userId, category = null) {
    const cacheKey = `templates_${userId}_${category || 'all'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.templates;
      }
    }

    try {
      let query = supabase
        .from('response_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: templates, error } = await query;

      if (error) throw error;

      const result = templates || [];
      
      // Cache the result
      this.cache.set(cacheKey, {
        templates: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Failed to get templates:', error);
      return this.getDefaultTemplatesForCategory(category);
    }
  }

  async createTemplate(userId, templateData) {
    try {
      const template = {
        user_id: userId,
        name: templateData.name,
        category: templateData.category || 'general',
        subject_template: templateData.subjectTemplate || 'Re: {{subject}}',
        body_template: templateData.bodyTemplate,
        variables: templateData.variables || [],
        enabled: templateData.enabled !== false,
        is_default: templateData.isDefault || false,
        metadata: {
          created_by: 'template_engine',
          version: '1.0',
          usage_count: 0,
          last_used: null
        }
      };

      const { data, error } = await supabase
        .from('response_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;

      // Clear cache to force reload
      this.clearUserCache(userId);

      console.log(`Template created: ${templateData.name}`);
      return data;

    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache to force reload
      this.cache.clear();

      return data;

    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId) {
    try {
      const { error } = await supabase
        .from('response_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Clear cache to force reload
      this.cache.clear();

      return true;

    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  async renderTemplate(templateId, variables = {}) {
    try {
      const { data: template, error } = await supabase
        .from('response_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Render the template
      const rendered = this.processTemplate(template, variables);

      // Update usage statistics
      await this.updateTemplateUsage(templateId);

      return rendered;

    } catch (error) {
      console.error('Failed to render template:', error);
      throw error;
    }
  }

  processTemplate(template, variables = {}) {
    try {
      let subject = template.subject_template || 'Re: {{subject}}';
      let body = template.body_template || '{{response}}';

      // Default variables
      const defaultVars = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        datetime: new Date().toLocaleString(),
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        day: new Date().getDate().toString().padStart(2, '0')
      };

      // Merge variables
      const allVariables = { ...defaultVars, ...variables };

      // Process subject template
      subject = this.replaceVariables(subject, allVariables);

      // Process body template
      body = this.replaceVariables(body, allVariables);

      return {
        subject,
        body,
        template: template,
        variables: allVariables
      };

    } catch (error) {
      console.error('Template processing failed:', error);
      return {
        subject: variables.subject || 'Re: Your Message',
        body: variables.response || 'Thank you for your message.',
        template: template,
        variables: variables,
        error: error.message
      };
    }
  }

  replaceVariables(text, variables) {
    let result = text;

    // Replace {{variable}} format
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, value || '');
    });

    // Replace {variable} format (for backward compatibility)
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{\\s*${key}\\s*}`, 'gi');
      result = result.replace(regex, value || '');
    });

    // Handle conditional blocks {{#if variable}}content{{/if}}
    result = this.processConditionals(result, variables);

    // Handle loops {{#each array}}content{{/each}}
    result = this.processLoops(result, variables);

    return result;
  }

  processConditionals(text, variables) {
    // Simple conditional processing: {{#if variable}}content{{/if}}
    const conditionalRegex = /{{#if\s+(\w+)}}(.*?){{\/if}}/gis;
    
    return text.replace(conditionalRegex, (match, varName, content) => {
      const value = variables[varName];
      return value ? content : '';
    });
  }

  processLoops(text, variables) {
    // Simple loop processing: {{#each array}}{{item}}{{/each}}
    const loopRegex = /{{#each\s+(\w+)}}(.*?){{\/each}}/gis;
    
    return text.replace(loopRegex, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = content;
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            itemContent = itemContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), value);
          });
        } else {
          itemContent = itemContent.replace(/{{\\s*item\\s*}}/gi, item);
        }
        return itemContent;
      }).join('');
    });
  }

  async findBestTemplate(userId, context = {}) {
    try {
      const templates = await this.getTemplates(userId);
      
      if (!templates || templates.length === 0) {
        return this.getDefaultTemplate(context.category);
      }

      // Priority order for template selection:
      // 1. Category + urgency match
      // 2. Category match
      // 3. Default template
      // 4. First available template

      const { category, urgency } = context;

      // Look for category + urgency match
      if (category && urgency) {
        const exactMatch = templates.find(t => 
          t.category === category && 
          t.name.toLowerCase().includes(urgency.toLowerCase())
        );
        if (exactMatch) return exactMatch;
      }

      // Look for category match
      if (category) {
        const categoryMatch = templates.find(t => t.category === category);
        if (categoryMatch) return categoryMatch;
      }

      // Look for default template
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) return defaultTemplate;

      // Return first available template
      return templates[0];

    } catch (error) {
      console.error('Failed to find best template:', error);
      return this.getDefaultTemplate(context.category);
    }
  }

  async updateTemplateUsage(templateId) {
    try {
      const { error } = await supabase
        .rpc('increment_template_usage', { template_id: templateId });

      if (error) {
        // Fallback if RPC doesn't exist
        await supabase
          .from('response_templates')
          .update({
            metadata: supabase.raw(`
              jsonb_set(
                coalesce(metadata, '{}'), 
                '{usage_count}', 
                (coalesce(metadata->>'usage_count', '0')::int + 1)::text::jsonb
              )
            `),
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId);
      }

    } catch (error) {
      console.error('Failed to update template usage:', error);
    }
  }

  // Template validation
  validateTemplate(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!templateData.bodyTemplate || templateData.bodyTemplate.trim().length === 0) {
      errors.push('Template body is required');
    }

    if (templateData.bodyTemplate && templateData.bodyTemplate.length > 5000) {
      errors.push('Template body is too long (max 5000 characters)');
    }

    // Validate template syntax
    try {
      this.validateTemplateSyntax(templateData.bodyTemplate);
    } catch (syntaxError) {
      errors.push(`Template syntax error: ${syntaxError.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateTemplateSyntax(template) {
    // Check for unmatched braces
    const openBraces = (template.match(/{{/g) || []).length;
    const closeBraces = (template.match(/}}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new Error('Unmatched template braces');
    }

    // Check for valid conditional syntax
    const conditionals = template.match(/{{#if\s+\w+}}/g) || [];
    const conditionalEnds = template.match(/{{\/if}}/g) || [];
    
    if (conditionals.length !== conditionalEnds.length) {
      throw new Error('Unmatched conditional blocks');
    }

    // Check for valid loop syntax
    const loops = template.match(/{{#each\s+\w+}}/g) || [];
    const loopEnds = template.match(/{{\/each}}/g) || [];
    
    if (loops.length !== loopEnds.length) {
      throw new Error('Unmatched loop blocks');
    }

    return true;
  }

  // Get template statistics
  async getTemplateStats(userId) {
    try {
      const { data: templates, error } = await supabase
        .from('response_templates')
        .select('id, name, category, enabled, metadata, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: templates.length,
        enabled: templates.filter(t => t.enabled).length,
        disabled: templates.filter(t => !t.enabled).length,
        byCategory: {},
        totalUsage: 0,
        mostUsed: null,
        leastUsed: null
      };

      let maxUsage = 0;
      let minUsage = Infinity;

      templates.forEach(template => {
        // Count by category
        stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;

        // Track usage
        const usage = template.metadata?.usage_count || 0;
        stats.totalUsage += usage;

        if (usage > maxUsage) {
          maxUsage = usage;
          stats.mostUsed = template;
        }

        if (usage < minUsage) {
          minUsage = usage;
          stats.leastUsed = template;
        }
      });

      return stats;

    } catch (error) {
      console.error('Failed to get template stats:', error);
      return null;
    }
  }

  // Default templates
  getDefaultTemplates() {
    return {
      general: {
        name: 'General Response',
        category: 'general',
        subject_template: 'Re: {{subject}}',
        body_template: `Hello,

Thank you for your message. {{response}}

If you have any additional questions, please don't hesitate to contact us.

Best regards,
{{business_name}}
{{business_phone}}`,
        variables: ['response', 'subject', 'business_name', 'business_phone']
      },

      urgent: {
        name: 'Urgent Response',
        category: 'urgent',
        subject_template: 'URGENT: Re: {{subject}}',
        body_template: `Hello,

We have received your urgent message and understand the importance of addressing this matter quickly.

{{response}}

We will prioritize this issue and keep you updated on our progress.

{{#if business_phone}}
For immediate assistance, please call us at {{business_phone}}.
{{/if}}

Best regards,
{{business_name}}`,
        variables: ['response', 'subject', 'business_name', 'business_phone']
      },

      complaint: {
        name: 'Complaint Response',
        category: 'complaint',
        subject_template: 'Re: Your Concern - {{subject}}',
        body_template: `Dear Valued Customer,

Thank you for bringing this matter to our attention. We take all customer concerns seriously and want to make this right.

{{response}}

We are committed to resolving this issue to your satisfaction and will follow up with you within 24 hours with our action plan.

We appreciate your patience and the opportunity to address this concern.

Sincerely,
{{business_name}}
{{business_phone}}`,
        variables: ['response', 'subject', 'business_name', 'business_phone']
      },

      appointment: {
        name: 'Appointment Response',
        category: 'appointment',
        subject_template: 'Re: Appointment Request - {{subject}}',
        body_template: `Hello,

Thank you for your interest in scheduling service with us.

{{response}}

We will review our availability and get back to you within 24 hours with available time slots that work for your schedule.

{{#if business_phone}}
If you have any urgent scheduling needs, please call us at {{business_phone}}.
{{/if}}

Best regards,
{{business_name}}`,
        variables: ['response', 'subject', 'business_name', 'business_phone']
      },

      inquiry: {
        name: 'Inquiry Response',
        category: 'inquiry',
        subject_template: 'Re: {{subject}}',
        body_template: `Hello,

Thank you for your inquiry about our services.

{{response}}

If you need additional information or would like to discuss your specific needs, please don't hesitate to contact us.

Best regards,
{{business_name}}
{{business_phone}}
{{business_email}}`,
        variables: ['response', 'subject', 'business_name', 'business_phone', 'business_email']
      }
    };
  }

  getDefaultTemplate(category = 'general') {
    return this.defaultTemplates[category] || this.defaultTemplates.general;
  }

  getDefaultTemplatesForCategory(category) {
    if (category && this.defaultTemplates[category]) {
      return [this.defaultTemplates[category]];
    }
    return Object.values(this.defaultTemplates);
  }

  // Cache management
  clearCache() {
    this.cache.clear();
  }

  clearUserCache(userId) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`templates_${userId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}

export default new ResponseTemplateEngine();
