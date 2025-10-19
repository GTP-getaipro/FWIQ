/**
 * JSON Merge Layer for Immutable Template Overrides
 * Ensures base templates remain unchanged while applying business-specific customizations
 */

import { deepmerge } from 'deepmerge-ts';

export class TemplateMergeEngine {
  constructor() {
    this.mergeOptions = {
      // Preserve arrays instead of merging them
      arrayMerge: (target, source) => source,
      // Custom merge for specific fields
      customMerge: (key, target, source) => {
        // Handle credential IDs specially
        if (key === 'credentials') {
          return this.mergeCredentials(target, source);
        }
        // Handle parameters specially
        if (key === 'parameters') {
          return this.mergeParameters(target, source);
        }
        return undefined; // Use default merge
      }
    };
  }

  /**
   * Merge base template with business overrides
   * @param {Object} baseTemplate - Base template JSON
   * @param {Object} businessOverrides - Business-specific overrides
   * @returns {Object} Merged template
   */
  mergeTemplate(baseTemplate, businessOverrides) {
    try {
      console.log('🔄 Merging template with business overrides...');
      
      // Create a deep copy of the base template to avoid mutations
      const baseCopy = structuredClone(baseTemplate);
      
      // Apply business overrides using deep merge
      const mergedTemplate = deepmerge(baseCopy, businessOverrides, this.mergeOptions);
      
      // Add merge metadata
      mergedTemplate._mergeMetadata = {
        mergedAt: new Date().toISOString(),
        baseTemplateId: baseTemplate.templateId || 'unknown',
        businessType: businessOverrides.businessType || 'unknown',
        mergeVersion: '1.0.0'
      };

      console.log('✅ Template merge completed successfully');
      return mergedTemplate;
    } catch (error) {
      console.error('❌ Template merge failed:', error);
      throw new Error(`Template merge failed: ${error.message}`);
    }
  }

  /**
   * Create business-specific overrides from onboarding data
   * @param {Object} onboardingData - Complete onboarding data
   * @returns {Object} Business overrides object
   */
  createBusinessOverrides(onboardingData) {
    const { business, team, emailLabels, user, emailIntegration } = onboardingData;
    
    // Handle both single business type (legacy) and multiple business types (new)
    const businessTypes = business.types || (business.type ? [business.type] : []);
    const primaryBusinessType = businessTypes[0] || 'Pools & Spas';
    
    return {
      businessTypes: businessTypes,
      primaryBusinessType: primaryBusinessType,
      
      // Node-level overrides
      nodes: this.createNodeOverrides(onboardingData),
      
      // Connection overrides (if needed)
      connections: this.createConnectionOverrides(onboardingData),
      
      // Settings overrides
      settings: {
        executionTimeout: 600,
        timezone: business.timezone || 'America/New_York',
        retryOnFail: true
      },
      
      // Metadata
      metadata: {
        businessName: business.info?.name || 'Unknown Business',
        deployedFor: user.email || 'unknown@example.com',
        teamSize: team.managers?.length || 0,
        supplierCount: team.suppliers?.length || 0,
        businessTypeCount: businessTypes.length
      }
    };
  }

  /**
   * Create node-specific overrides
   * @param {Object} onboardingData - Complete onboarding data
   * @returns {Array} Node overrides
   */
  createNodeOverrides(onboardingData) {
    const { business, team, emailLabels, emailIntegration } = onboardingData;
    
    return [
      // Gmail Trigger overrides
      {
        id: 'gmail-trigger',
        parameters: {
          filters: {
            q: `in:inbox -(from:(*@floworx-iq.com)) ${this.buildEmailFilters(team)}`
          }
        },
        credentials: {
          gmailOAuth2: {
            id: `gmail_${onboardingData.id.substring(0, 8)}`,
            name: `${business.info?.name || 'Business'} Gmail`
          }
        }
      },
      
      // AI Classifier overrides
      {
        id: 'ai-classifier',
        parameters: {
          options: {
            systemMessage: this.buildSystemMessage(business, team)
          }
        },
        credentials: {
          openAi: {
            id: `openai_${onboardingData.id.substring(0, 8)}`,
            name: 'OpenAI Credentials'
          }
        }
      },
      
      // Draft Creator overrides
      {
        id: 'create-gmail-draft',
        parameters: {
          message: {
            text: `={{$json.parsed_output}}\n\n${this.buildSignatureBlock(business)}`
          }
        }
      }
    ];
  }

  /**
   * Build email filters based on team configuration
   * @param {Object} team - Team configuration
   * @returns {string} Email filter string
   */
  buildEmailFilters(team) {
    const filters = [];
    
    // Add manager email filters
    if (team.managers?.length > 0) {
      const managerEmails = team.managers.map(m => m.email).filter(Boolean);
      if (managerEmails.length > 0) {
        filters.push(`(from:(${managerEmails.join(' OR ')}) OR to:(${managerEmails.join(' OR ')})`);
      }
    }
    
    // Add supplier domain filters
    if (team.suppliers?.length > 0) {
      const supplierDomains = team.suppliers.map(s => s.domains).filter(Boolean);
      if (supplierDomains.length > 0) {
        filters.push(`from:(${supplierDomains.join(' OR ')})`);
      }
    }
    
    return filters.length > 0 ? `(${filters.join(' OR ')})` : '';
  }

  /**
   * Build AI system message from business configuration
   * @param {Object} business - Business configuration
   * @param {Object} team - Team configuration
   * @returns {string} System message
   */
  buildSystemMessage(business, team) {
    const businessName = business.info?.name || 'Business';
    const services = business.services?.map(s => s.name).join(', ') || 'general services';
    const managers = team.managers?.map(m => m.name).join(', ') || 'team members';
    
    return `You are an email classifier for ${businessName}. Your primary goal is to categorize incoming emails.

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Services: ${services}
- Managers: ${managers}

CATEGORIES:
- Sales: New inquiries, quotes, product questions
- Support: Existing customer issues, technical problems, warranty claims
- Billing: Invoices, payments, account questions
- Recruitment: Job applications, resumes
- Spam: Unsolicited marketing or irrelevant messages

RULES:
- URGENT OVERRIDE: If the email contains keywords like 'ASAP', 'broken', 'urgent', immediately classify it as 'Support' with a subcategory of 'Urgent'
- RECRUITMENT: If the email contains a resume or is about a job application, classify it as 'Recruitment'

Your output must be a JSON object with the primary category. Example: {"primary_category": "Sales"}`;
  }

  /**
   * Build signature block from business configuration
   * @param {Object} business - Business configuration
   * @returns {string} Signature block
   */
  buildSignatureBlock(business) {
    const businessName = business.info?.name || 'Business';
    const phone = business.contact?.phone || '';
    const email = business.contact?.email || '';
    
    let signature = `Best regards,\n${businessName} Team`;
    
    if (phone) signature += `\nPhone: ${phone}`;
    if (email) signature += `\nEmail: ${email}`;
    
    return signature;
  }

  /**
   * Merge credentials with special handling
   * @param {Object} target - Target credentials
   * @param {Object} source - Source credentials
   * @returns {Object} Merged credentials
   */
  mergeCredentials(target, source) {
    return deepmerge(target || {}, source || {});
  }

  /**
   * Merge parameters with special handling
   * @param {Object} target - Target parameters
   * @param {Object} source - Source parameters
   * @returns {Object} Merged parameters
   */
  mergeParameters(target, source) {
    return deepmerge(target || {}, source || {});
  }

  /**
   * Create connection overrides if needed
   * @param {Object} onboardingData - Complete onboarding data
   * @returns {Object} Connection overrides
   */
  createConnectionOverrides(onboardingData) {
    // For now, return empty object as connections are typically static
    // This can be extended for dynamic routing based on business rules
    return {};
  }
}

export const templateMergeEngine = new TemplateMergeEngine();
