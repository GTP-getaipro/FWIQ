/**
 * Direct Template Injector
 * Bypasses Supabase edge function and injects template data directly in frontend
 * This ensures reliable template injection without edge function dependencies
 */

import { injectOnboardingData } from './templateService.js';
import { extractAIConfigForN8n, generateAIPlaceholders } from './aiSchemaInjector.js';
import { extractBehaviorConfigForN8n, generateBehaviorPlaceholders } from './behaviorSchemaInjector.js';
import { GoldStandardReplyPrompt } from './goldStandardReplyPrompt.js';

class DirectTemplateInjector {
  constructor() {
    this.goldStandardPrompt = new GoldStandardReplyPrompt();
  }

  /**
   * Inject template data directly without edge function
   * @param {object} clientData - Complete client onboarding data
   * @param {string} templateType - 'gmail' or 'outlook'
   * @returns {Promise<object>} - Injected workflow ready for N8N deployment
   */
  async injectTemplateData(clientData, templateType = 'outlook') {
    try {
      console.log('🚀 Starting direct template injection...');
      console.log('📊 Client data:', {
        businessName: clientData.business?.name,
        emailProvider: clientData.emailProvider,
        hasSuppliers: !!clientData.suppliers?.length,
        hasManagers: !!clientData.managers?.length,
        hasVoiceProfile: !!clientData.voiceProfile
      });

      // Step 1: Load base template
      const baseTemplate = await this.loadBaseTemplate(templateType);
      console.log('✅ Base template loaded');

      // Step 2: Extract AI configuration
      const aiConfig = await this.extractAIConfig(clientData);
      console.log('✅ AI configuration extracted');

      // Step 3: Extract behavior configuration with gold standard prompt
      const behaviorConfig = await this.extractBehaviorConfig(clientData);
      console.log('✅ Behavior configuration extracted');

      // Step 4: Build comprehensive replacements
      const replacements = await this.buildComprehensiveReplacements(clientData, aiConfig, behaviorConfig);
      console.log('✅ Comprehensive replacements built');

      // Step 5: Apply replacements to template
      const injectedWorkflow = await this.applyReplacements(baseTemplate, replacements);
      console.log('✅ Replacements applied to template');

      // Step 6: Validate injected workflow
      const validationResult = await this.validateInjectedWorkflow(injectedWorkflow);
      if (!validationResult.isValid) {
        throw new Error(`Template injection validation failed: ${validationResult.errors.join(', ')}`);
      }
      console.log('✅ Injected workflow validated');

      return {
        success: true,
        workflow: injectedWorkflow,
        metadata: {
          templateType,
          businessName: clientData.business?.name,
          emailProvider: clientData.emailProvider,
          injectedAt: new Date().toISOString(),
          validationResult
        }
      };

    } catch (error) {
      console.error('❌ Direct template injection failed:', error);
      return {
        success: false,
        error: error.message,
        details: error.stack
      };
    }
  }

  /**
   * Load base template from local files
   */
  async loadBaseTemplate(templateType) {
    try {
      const templatePath = templateType === 'gmail' 
        ? '/src/lib/templates/gmail-template.json'
        : '/src/lib/templates/outlook-template.json';
      
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to load base template:', error);
      throw new Error(`Template loading failed: ${error.message}`);
    }
  }

  /**
   * Extract AI configuration with enhanced system message
   */
  async extractAIConfig(clientData) {
    try {
      const businessTypes = clientData.business?.businessTypes || 
                           clientData.business?.types || 
                           clientData.business?.business_types || 
                           (clientData.business?.type ? [clientData.business.type] : null) ||
                           (clientData.business?.business_type ? [clientData.business.business_type] : null) ||
                           ['general'];
      const businessInfo = {
        name: clientData.business?.name,
        phone: clientData.business?.phone,
        websiteUrl: clientData.business?.websiteUrl,
        emailDomain: clientData.business?.emailDomain,
        businessTypes: businessTypes,
        address: clientData.business?.address,
        city: clientData.business?.city,
        state: clientData.business?.state,
        zipCode: clientData.business?.zipCode,
        country: clientData.business?.country,
        currency: clientData.business?.currency,
        timezone: clientData.business?.timezone || 'UTC/GMT -6',
        businessCategory: clientData.business?.businessCategory,
        // Include contact information
        contactEmail: clientData.contact?.email,
        contactPhone: clientData.business?.phone,
        // Include services information
        services: clientData.services || [],
        // Include rules and integrations
        rules: clientData.rules || {},
        integrations: clientData.integrations || {},
        // Include managers and suppliers
        managers: clientData.managers || [],
        suppliers: clientData.suppliers || [],
        serviceAreas: clientData.business?.serviceAreas || ['Main service area']
      };

      const aiConfig = extractAIConfigForN8n(businessTypes, businessInfo);
      
      // Load and process label schema with dynamic values
      const { loadLabelSchemaForBusinessTypes, buildProductionClassifier } = await import('@/lib/aiSchemaInjector.js');
      const labelConfig = await loadLabelSchemaForBusinessTypes(businessTypes, businessInfo.managers, businessInfo.suppliers);
      
      // Debug: Log business info before building classifier
      console.log('🔍 DEBUG: DirectTemplateInjector - businessInfo before buildProductionClassifier:', {
        name: businessInfo.name,
        phone: businessInfo.phone,
        websiteUrl: businessInfo.websiteUrl,
        emailDomain: businessInfo.emailDomain,
        businessTypes: businessInfo.businessTypes,
        managers: businessInfo.managers?.length || 0,
        suppliers: businessInfo.suppliers?.length || 0
      });
      
      // Build production classifier with processed label schema
      const productionSystemMessage = buildProductionClassifier(aiConfig, labelConfig, businessInfo, businessInfo.managers, businessInfo.suppliers);
      
      return {
        ...aiConfig,
        systemMessage: productionSystemMessage
      };
    } catch (error) {
      console.error('❌ AI config extraction failed:', error);
      throw new Error(`AI configuration extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract behavior configuration with gold standard prompt
   */
  async extractBehaviorConfig(clientData) {
    try {
      const businessTypes = clientData.business?.businessTypes || 
                           clientData.business?.types || 
                           clientData.business?.business_types || 
                           (clientData.business?.type ? [clientData.business.type] : null) ||
                           (clientData.business?.business_type ? [clientData.business.business_type] : null) ||
                           ['general'];
      const businessInfo = {
        name: clientData.business?.name,
        phone: clientData.business?.phone,
        websiteUrl: clientData.business?.websiteUrl,
        emailDomain: clientData.business?.emailDomain,
        businessTypes: businessTypes,
        address: clientData.business?.address,
        city: clientData.business?.city,
        state: clientData.business?.state,
        zipCode: clientData.business?.zipCode,
        country: clientData.business?.country,
        currency: clientData.business?.currency,
        timezone: clientData.business?.timezone || 'UTC/GMT -6',
        businessCategory: clientData.business?.businessCategory,
        // Include contact information
        contactEmail: clientData.contact?.email,
        contactPhone: clientData.business?.phone,
        // Include services information
        services: clientData.services || [],
        // Include rules and integrations
        rules: clientData.rules || {},
        integrations: clientData.integrations || {},
        // Include managers and suppliers
        managers: clientData.managers || [],
        suppliers: clientData.suppliers || [],
        serviceAreas: clientData.business?.serviceAreas || ['Main service area']
      };

      // Extract behavior config with comprehensive business information
      const behaviorConfig = extractBehaviorConfigForN8n(businessTypes, businessInfo, clientData.voiceProfile);

      return behaviorConfig;
    } catch (error) {
      console.error('❌ Behavior config extraction failed:', error);
      throw new Error(`Behavior configuration extraction failed: ${error.message}`);
    }
  }

  /**
   * Build comprehensive replacements for template injection
   */
  async buildComprehensiveReplacements(clientData, aiConfig, behaviorConfig) {
    try {
      const businessInfo = clientData.business || {};
      const integrations = clientData.integrations || {};
      const rules = clientData.rules || {};
      const suppliers = clientData.suppliers || [];
      const managers = clientData.managers || [];

      // Build managers text
      const managersText = managers.length > 0 
        ? managers.map(m => `${m.name} (${m.role || 'Manager'})`).join(', ')
        : 'No managers specified';

      // Build suppliers text
      const suppliersText = suppliers.length > 0
        ? suppliers.map(s => `${s.name} (${s.category || 'Supplier'})`).join(', ')
        : 'No suppliers specified';

      // Build signature block
      const signatureBlock = this.buildSignatureBlock(businessInfo, managers);

      // Build service catalog text
      const serviceCatalogText = this.buildServiceCatalogText(businessInfo);
      
      // CRITICAL FIX: Build call-to-action options from custom form links
      const callToActionOptions = this.buildCallToActionFromForms(clientData);

      // Generate AI placeholders
      const aiPlaceholders = generateAIPlaceholders(aiConfig);

      // Generate behavior placeholders
      const behaviorPlaceholders = generateBehaviorPlaceholders(behaviorConfig);

      return {
        // Business info
        "<<<BUSINESS_NAME>>>": this.sanitizeForWorkflowName(businessInfo.name) || 'Your Business',
        "<<<CONFIG_VERSION>>>": 1,
        "<<<CLIENT_ID>>>": clientData.userId || 'client',
        "<<<USER_ID>>>": clientData.userId || 'client',
        "<<<EMAIL_DOMAIN>>>": businessInfo.emailDomain || 'example.com',
        "<<<CURRENCY>>>": businessInfo.currency || 'USD',
        
        // Credentials
        "<<<CLIENT_GMAIL_CRED_ID>>>": integrations?.gmail?.credentialId || '',
        "<<<CLIENT_OUTLOOK_CRED_ID>>>": integrations?.outlook?.credentialId || '',
        "<<<CLIENT_POSTGRES_CRED_ID>>>": integrations?.postgres?.credentialId || 'mQziputTJekSuLa6',
        "<<<CLIENT_OPENAI_CRED_ID>>>": integrations?.openai?.credentialId || 'openAi',
        "<<<CLIENT_SUPABASE_CRED_ID>>>": integrations?.supabase?.credentialId || 'supabase-cred',
        
        // Supabase configuration
        "<<<SUPABASE_URL>>>": import.meta.env.VITE_SUPABASE_URL || 'https://oinxzvqszingwstrbdro.supabase.co',
        "<<<SUPABASE_ANON_KEY>>>": import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbnh6dnFzemluZ3dzdHJicmRybyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM5NzQ4NzQ0LCJleHAiOjIwNTUzMjQ3NDR9.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
        
        // Team data
        "<<<MANAGERS_TEXT>>>": managersText,
        "<<<SUPPLIERS>>>": JSON.stringify(suppliers.map(s => ({ 
          name: s.name, 
          email: s.email, 
          category: s.category 
        }))),
        
        // Email labels
        "<<<LABEL_MAP>>>": JSON.stringify(clientData.email_labels || {}),
        "<<<LABEL_MAPPINGS>>>": JSON.stringify(clientData.email_labels || {}),
        "<<<CALL_TO_ACTION_OPTIONS>>>": callToActionOptions,
        
        // Content
        "<<<SIGNATURE_BLOCK>>>": signatureBlock,
        "<<<SERVICE_CATALOG_TEXT>>>": serviceCatalogText,
        
        // Legacy fields
        "<<<ESCALATION_RULE>>>": this.escapeForJson(rules?.escalationRules),
        "<<<REPLY_TONE>>>": this.escapeForJson(rules?.tone),
        "<<<ALLOW_PRICING>>>": String(rules?.aiGuardrails?.allowPricing || false),
        
        // AI Configuration
        ...aiPlaceholders,
        
        // Behavior Configuration
        ...behaviorPlaceholders
      };
    } catch (error) {
      console.error('❌ Replacement building failed:', error);
      throw new Error(`Replacement building failed: ${error.message}`);
    }
  }

  /**
   * Apply replacements to template
   */
  async applyReplacements(template, replacements) {
    try {
      let templateString = JSON.stringify(template);
      
      // Apply all replacements with proper JSON escaping
      Object.entries(replacements).forEach(([placeholder, value]) => {
        // Properly escape the value for JSON
        const escapedValue = JSON.stringify(value).slice(1, -1); // Remove outer quotes
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        templateString = templateString.replace(regex, escapedValue);
      });

      // Parse back to object
      const injectedWorkflow = JSON.parse(templateString);
      
      // Inject credentials into nodes
      await this.injectCredentials(injectedWorkflow, replacements);
      
      return injectedWorkflow;
    } catch (error) {
      console.error('❌ Replacement application failed:', error);
      throw new Error(`Replacement application failed: ${error.message}`);
    }
  }

  /**
   * Inject credentials into workflow nodes
   */
  async injectCredentials(workflow, replacements) {
    try {
      if (!workflow.nodes) return;

      workflow.nodes.forEach(node => {
        if (node.credentials) {
          Object.keys(node.credentials).forEach(credType => {
            const cred = node.credentials[credType];
            if (cred && cred.id) {
              // Replace credential ID placeholders
              if (cred.id.includes('<<<CLIENT_GMAIL_CRED_ID>>>')) {
                cred.id = replacements['<<<CLIENT_GMAIL_CRED_ID>>>'] || '';
              } else if (cred.id.includes('<<<CLIENT_OUTLOOK_CRED_ID>>>')) {
                cred.id = replacements['<<<CLIENT_OUTLOOK_CRED_ID>>>'] || '';
              } else if (cred.id.includes('<<<CLIENT_OPENAI_CRED_ID>>>')) {
                cred.id = replacements['<<<CLIENT_OPENAI_CRED_ID>>>'] || '';
              } else if (cred.id.includes('<<<CLIENT_POSTGRES_CRED_ID>>>')) {
                cred.id = replacements['<<<CLIENT_POSTGRES_CRED_ID>>>'] || '';
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Credential injection failed:', error);
      throw new Error(`Credential injection failed: ${error.message}`);
    }
  }

  /**
   * Validate injected workflow
   */
  async validateInjectedWorkflow(workflow) {
    const errors = [];
    
    try {
      // Check for remaining placeholders
      const workflowString = JSON.stringify(workflow);
      const placeholderMatches = workflowString.match(/<<<[^>]+>>>/g);
      if (placeholderMatches) {
        errors.push(`Unreplaced placeholders found: ${placeholderMatches.join(', ')}`);
      }

      // Check for required nodes
      if (!workflow.nodes || workflow.nodes.length === 0) {
        errors.push('No nodes found in workflow');
      }

      // Check for trigger node
      const hasTrigger = workflow.nodes.some(node => 
        node.type.includes('Trigger') || node.type.includes('trigger')
      );
      if (!hasTrigger) {
        errors.push('No trigger node found');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Build enhanced system message with comprehensive business context
   */
  buildEnhancedSystemMessage(aiConfig, businessInfo) {
    let message = aiConfig.systemMessage || `You are an expert email classifier for ${businessInfo.name || 'the business'}.`;
    
    // Add business context
    if (businessInfo.name) {
      message += `\n\nBUSINESS CONTEXT:\n`;
      message += `- Business Name: ${businessInfo.name}\n`;
      if (businessInfo.phone) message += `- Phone: ${businessInfo.phone}\n`;
      if (businessInfo.websiteUrl) message += `- Website: ${businessInfo.websiteUrl}\n`;
      if (businessInfo.emailDomain) message += `- Email Domain: ${businessInfo.emailDomain}\n`;
    }

    // Add team context
    if (businessInfo.managers && businessInfo.managers.length > 0) {
      message += `\n- Managers: ${businessInfo.managers.map(m => m.name).join(', ')}\n`;
    }

    if (businessInfo.suppliers && businessInfo.suppliers.length > 0) {
      message += `- Suppliers: ${businessInfo.suppliers.map(s => s.name).join(', ')}\n`;
    }

    return message;
  }

  /**
   * Build signature block
   */
  buildSignatureBlock(businessInfo, managers) {
    const businessName = businessInfo.name || 'Your Business';
    const phone = businessInfo.phone || '';
    const website = businessInfo.websiteUrl || '';
    
    let signature = `Thanks so much for supporting our small business!\nBest regards,\n${businessName} Team`;
    
    if (phone) {
      signature += `\n${phone}`;
    }
    
    if (website) {
      signature += `\n${website}`;
    }
    
    return signature;
  }

  /**
   * Build service catalog text
   */
  buildServiceCatalogText(businessInfo) {
    const services = businessInfo.services || [];
    if (services.length === 0) {
      return 'Our comprehensive services are designed to meet your needs.';
    }
    
    return services.map(service => `- ${service.name}: ${service.description || 'Professional service'}`).join('\n');
  }

  /**
   * Sanitize business name for workflow naming
   */
  sanitizeForWorkflowName(name) {
    if (!name) return null;
    return name
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50);
  }

  /**
   * Escape JSON strings
   */
  escapeForJson(str) {
    if (!str) return '';
    return JSON.stringify(str).slice(1, -1);
  }
}

export default DirectTemplateInjector;
