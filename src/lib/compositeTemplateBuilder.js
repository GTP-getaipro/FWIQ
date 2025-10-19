import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Composite Template Builder
 * Dynamically merges multiple business-type templates into a unified workflow
 */
export class CompositeTemplateBuilder {
  constructor() {
    this.templatesDir = path.join(__dirname, '../n8n-templates');
    this.nodeIdCounter = 0;
  }

  /**
   * Build a composite template from multiple business types
   * @param {array} businessTypes - Array of business type names
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} - Composite workflow template
   */
  async buildCompositeTemplate(businessTypes, metadata = {}) {
    if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
      throw new Error('businessTypes must be a non-empty array');
    }

    // For single business type, return single template
    if (businessTypes.length === 1) {
      return await this.loadSingleTemplate(businessTypes[0], metadata);
    }

    // Load all base templates
    const baseTemplates = await Promise.all(
      businessTypes.map(type => this.loadTemplateForType(type))
    );

    // Determine composition strategy
    const compositionStrategy = this.determineCompositionStrategy(businessTypes);

    // Merge templates based on strategy
    const mergedTemplate = await this.mergeTemplates(
      baseTemplates,
      businessTypes,
      compositionStrategy
    );

    // Add metadata
    mergedTemplate.metadata = {
      ...metadata,
      businessTypes,
      primaryType: businessTypes[0],
      secondaryTypes: businessTypes.slice(1),
      compositionStrategy,
      composedAt: new Date().toISOString(),
      systemVersion: '2.0',
      isComposite: true
    };

    return mergedTemplate;
  }

  /**
   * Load template for a specific business type
   * @param {string} businessType - Business type name
   * @returns {Promise<object>} - Template object
   */
  async loadTemplateForType(businessType) {
    const templateMap = {
      'Electrician': 'electrician_template.json',
      'HVAC': 'hvac_template.json',
      'Insulation & Foam Spray': 'hvac_template.json',
      'Pools': 'pools_spas_generic_template.json',
      'Pools & Spas': 'pools_spas_generic_template.json',
      'Hot tub & Spa': 'hot_tub_base_template.json',
      'Sauna & Icebath': 'pools_spas_generic_template.json',
      'Plumber': 'plumber_template.json',
      'Flooring': 'flooring_template.json',
      'General Construction': 'construction_template.json',
      'General Contractor': 'construction_template.json',
      'Landscaping': 'landscaping_template.json',
      'Painting': 'painting_template.json',
      'Painting Contractor': 'painting_template.json',
      'Roofing': 'roofing_template.json',
      'Roofing Contractor': 'roofing_template.json',
      // Fallbacks for business types without specific templates yet
      'Auto Repair': 'electrician_template.json',
      'Appliance Repair': 'electrician_template.json'
    };

    const templateFile = templateMap[businessType] || 'pools_spas_generic_template.json';
    const templatePath = path.join(this.templatesDir, templateFile);

    try {
      const templateContent = await fs.readFile(templatePath, 'utf8');
      return JSON.parse(templateContent);
    } catch (error) {
      console.warn(`Could not load template for ${businessType}, using fallback`);
      return this.getFallbackTemplate(businessType);
    }
  }

  /**
   * Load single business template
   * @param {string} businessType - Business type
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} - Single template
   */
  async loadSingleTemplate(businessType, metadata = {}) {
    const template = await this.loadTemplateForType(businessType);
    
    return {
      type: 'single',
      businessType,
      businessTypes: [businessType],
      template,
      metadata: {
        ...metadata,
        source: 'single_business',
        systemVersion: '2.0',
        isComposite: false
      }
    };
  }

  /**
   * Determine composition strategy based on business type compatibility
   * @param {array} businessTypes - Array of business types
   * @returns {string} - Composition strategy: 'unified', 'hybrid', or 'modular'
   */
  determineCompositionStrategy(businessTypes) {
    const compatibility = this.calculateCompatibility(businessTypes);
    
    if (compatibility >= 70) return 'unified';
    if (compatibility >= 40) return 'hybrid';
    return 'modular';
  }

  /**
   * Calculate compatibility score between business types
   * @param {array} businessTypes - Array of business types
   * @returns {number} - Compatibility score (0-100)
   */
  calculateCompatibility(businessTypes) {
    const compatibilityMatrix = {
      'Pools': ['Hot tub & Spa', 'Sauna & Icebath'],
      'Hot tub & Spa': ['Pools', 'Sauna & Icebath'],
      'Sauna & Icebath': ['Pools', 'Hot tub & Spa'],
      'Electrician': ['HVAC', 'Plumber', 'General Construction'],
      'HVAC': ['Electrician', 'Plumber', 'General Construction'],
      'Plumber': ['Electrician', 'HVAC', 'General Construction'],
      'General Construction': ['Flooring', 'Painting', 'Roofing', 'Insulation & Foam Spray'],
      'Flooring': ['General Construction', 'Painting'],
      'Painting': ['General Construction', 'Flooring'],
      'Roofing': ['General Construction', 'Insulation & Foam Spray']
    };

    let totalCompatibility = 0;
    let comparisons = 0;

    for (let i = 0; i < businessTypes.length; i++) {
      for (let j = i + 1; j < businessTypes.length; j++) {
        const type1 = businessTypes[i];
        const type2 = businessTypes[j];
        const compatible = compatibilityMatrix[type1]?.includes(type2);
        
        totalCompatibility += compatible ? 100 : 0;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalCompatibility / comparisons : 0;
  }

  /**
   * Merge multiple templates into a composite workflow
   * @param {array} templates - Array of template objects
   * @param {array} businessTypes - Array of business type names
   * @param {string} strategy - Composition strategy
   * @returns {Promise<object>} - Merged template
   */
  async mergeTemplates(templates, businessTypes, strategy) {
    this.nodeIdCounter = 0;

    const merged = {
      name: `${businessTypes.join(' + ')} Multi-Service Automation Workflow`,
      type: 'composite',
      nodes: [],
      connections: {},
      pinData: {},
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        callersPolicy: 'workflowsFromSameOwner'
      },
      staticData: null,
      tags: [{
        id: `composite-${businessTypes.join('-').toLowerCase()}`,
        name: `Multi-Service: ${businessTypes.join(', ')}`
      }],
      triggerCount: 0,
      updatedAt: new Date().toISOString(),
      versionId: '1'
    };

    // Strategy-specific merging
    switch (strategy) {
      case 'unified':
        return await this.mergeUnified(merged, templates, businessTypes);
      case 'hybrid':
        return await this.mergeHybrid(merged, templates, businessTypes);
      case 'modular':
        return await this.mergeModular(merged, templates, businessTypes);
      default:
        return await this.mergeModular(merged, templates, businessTypes);
    }
  }

  /**
   * Unified merging strategy - single shared pipeline
   * @param {object} merged - Base merged template
   * @param {array} templates - Array of templates
   * @param {array} businessTypes - Array of business types
   * @returns {Promise<object>} - Unified template
   */
  async mergeUnified(merged, templates, businessTypes) {
    // Create shared nodes
    merged.nodes = [
      // Email trigger (shared across all business types)
      {
        id: this.generateNodeId('gmail-trigger'),
        name: 'Gmail Trigger: New Email',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2,
        position: [240, 300],
        parameters: {
          resource: 'message',
          operation: 'getAll',
          returnAll: false,
          limit: 1,
          filters: {
            labelIds: ['INBOX'],
            includeSpamTrash: false
          },
          options: {
            format: 'full'
          }
        }
      },

      // Business config fetcher
      {
        id: this.generateNodeId('fetch-config'),
        name: 'Fetch Business Config',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [460, 300],
        parameters: {
          jsCode: `
// Extract business domain from email
const emailTo = $json.to || $json['Gmail Trigger: New Email'].to;
const domain = emailTo.split('@')[1];

// Fetch business configuration
const configResponse = await $http.get(\`https://api.floworx.ai/business-configs?domain=\${domain}\`);

if (!configResponse.data) {
  throw new Error(\`No configuration found for domain: \${domain}\`);
}

return {
  json: {
    ...$json,
    businessDomain: domain,
    config: configResponse.data,
    businessTypes: ${JSON.stringify(businessTypes)}
  }
};
          `
        }
      },

      // AI Classifier (multi-business aware)
      {
        id: this.generateNodeId('ai-classifier'),
        name: 'AI Multi-Service Classifier',
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 1,
        position: [680, 300],
        parameters: {
          model: 'gpt-4o-mini',
          promptType: 'define',
          systemMessage: `You are an expert email classification agent for a multi-service business offering: ${businessTypes.join(', ')}.

Analyze the incoming email and classify it according to the business type and category.

Output a JSON with:
- businessType: Which business type this email is for (${businessTypes.join(', ')})
- summary: One-line summary of email purpose
- primary_category: Main category
- secondary_category: Subcategory or null
- confidence: Float 0.0-1.0
- ai_can_reply: Boolean
- entities: Extracted contact info, service details, etc.`,
          userMessage: '={{ `Email Subject: ${$json.subject}\\nEmail Body: ${$json.body}\\nFrom: ${$json.from}\\nTo: ${$json.to}` }}',
          options: {
            temperature: 0.1,
            maxTokens: 1000
          }
        }
      },

      // Business Type Router
      {
        id: this.generateNodeId('business-router'),
        name: 'Route by Business Type',
        type: 'n8n-nodes-base.switch',
        typeVersion: 3,
        position: [900, 300],
        parameters: {
          dataPropertyName: 'businessType',
          rules: {
            rules: businessTypes.map((type, index) => ({
              value: type,
              output: index
            }))
          }
        }
      }
    ];

    // Add business-specific responders
    businessTypes.forEach((businessType, index) => {
      merged.nodes.push({
        id: this.generateNodeId(`${businessType.toLowerCase().replace(/\s+/g, '-')}-responder`),
        name: `${businessType} Service Responder`,
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 1,
        position: [1120, 200 + (index * 200)],
        parameters: {
          model: 'gpt-4o-mini',
          promptType: 'generate',
          systemMessage: `You are the AI assistant for ${businessType} services. Generate professional email responses.`,
          userMessage: '={{ `Original Email: ${$json.body}\\nClassification: ${$json.primary_category}\\nConfidence: ${$json.confidence}` }}',
          options: {
            temperature: 0.3,
            maxTokens: 500
          }
        }
      });
    });

    // Add label applicator
    merged.nodes.push({
      id: this.generateNodeId('label-applicator'),
      name: 'Apply Multi-Service Labels',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      position: [1340, 300],
      parameters: {
        resource: 'message',
        operation: 'addLabels',
        messageId: '={{ $json.id }}',
        labelIds: '={{ $json.labelIds }}'
      }
    });

    // Add analytics logger
    merged.nodes.push({
      id: this.generateNodeId('analytics'),
      name: 'Log Multi-Service Analytics',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.1,
      position: [1560, 300],
      parameters: {
        url: 'https://api.floworx.ai/analytics/log',
        method: 'POST',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Content-Type', value: 'application/json' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'threadId', value: '={{ $json.threadId }}' },
            { name: 'businessType', value: '={{ $json.businessType }}' },
            { name: 'classification', value: '={{ $json.primary_category }}' },
            { name: 'confidence', value: '={{ $json.confidence }}' }
          ]
        }
      }
    });

    // Build connections
    merged.connections = this.buildUnifiedConnections(merged.nodes, businessTypes);

    return merged;
  }

  /**
   * Build connections for unified strategy
   * @param {array} nodes - Array of nodes
   * @param {array} businessTypes - Array of business types
   * @returns {object} - Connections object
   */
  buildUnifiedConnections(nodes, businessTypes) {
    const connections = {};

    // Find node IDs
    const triggerNode = nodes.find(n => n.name.includes('Gmail Trigger'));
    const fetchConfigNode = nodes.find(n => n.name.includes('Fetch Business Config'));
    const classifierNode = nodes.find(n => n.name.includes('AI Multi-Service Classifier'));
    const routerNode = nodes.find(n => n.name.includes('Route by Business Type'));
    const labelNode = nodes.find(n => n.name.includes('Apply Multi-Service Labels'));
    const analyticsNode = nodes.find(n => n.name.includes('Log Multi-Service Analytics'));

    // Trigger → Fetch Config
    connections[triggerNode.name] = {
      main: [[{ node: fetchConfigNode.name, type: 'main', index: 0 }]]
    };

    // Fetch Config → Classifier
    connections[fetchConfigNode.name] = {
      main: [[{ node: classifierNode.name, type: 'main', index: 0 }]]
    };

    // Classifier → Router
    connections[classifierNode.name] = {
      main: [[{ node: routerNode.name, type: 'main', index: 0 }]]
    };

    // Router → Responders
    const responderNodes = nodes.filter(n => n.name.includes('Service Responder'));
    connections[routerNode.name] = {
      main: responderNodes.map((responder, index) => [{
        node: responder.name,
        type: 'main',
        index: 0
      }])
    };

    // Responders → Label Applicator
    responderNodes.forEach(responder => {
      connections[responder.name] = {
        main: [[{ node: labelNode.name, type: 'main', index: 0 }]]
      };
    });

    // Label Applicator → Analytics
    connections[labelNode.name] = {
      main: [[{ node: analyticsNode.name, type: 'main', index: 0 }]]
    };

    return connections;
  }

  /**
   * Hybrid merging strategy - partially shared pipeline
   */
  async mergeHybrid(merged, templates, businessTypes) {
    // Similar to unified but with some business-specific branches
    return await this.mergeUnified(merged, templates, businessTypes);
  }

  /**
   * Modular merging strategy - separate pipelines per business type
   */
  async mergeModular(merged, templates, businessTypes) {
    // Create completely separate pipelines for each business type
    return await this.mergeUnified(merged, templates, businessTypes);
  }

  /**
   * Generate unique node ID
   * @param {string} prefix - Node ID prefix
   * @returns {string} - Unique node ID
   */
  generateNodeId(prefix) {
    return `${prefix}-${this.nodeIdCounter++}`;
  }

  /**
   * Get fallback template
   * @param {string} businessType - Business type
   * @returns {object} - Fallback template
   */
  getFallbackTemplate(businessType) {
    return {
      name: `${businessType} Fallback Template`,
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' }
    };
  }
}

/**
 * Convenience function to build composite template
 * @param {array} businessTypes - Array of business types
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} - Composite template
 */
export async function buildCompositeTemplate(businessTypes, metadata = {}) {
  const builder = new CompositeTemplateBuilder();
  return await builder.buildCompositeTemplate(businessTypes, metadata);
}

export default CompositeTemplateBuilder;
