/**
 * Runtime Data Injector
 * Injects user-specific data into workflow templates
 */
export class RuntimeDataInjector {
  constructor() {
    this.injectionPatterns = {
      businessName: /\{\{businessName\}\}/g,
      emailDomain: /\{\{emailDomain\}\}/g,
      timezone: /\{\{timezone\}\}/g,
      currency: /\{\{currency\}\}/g,
      labelIds: /\{\{labelIds\}\}/g,
      aiConfig: /\{\{aiConfig\}\}/g,
      businessTypes: /\{\{businessTypes\}\}/g,
      primaryType: /\{\{primaryType\}\}/g
    };
  }

  /**
   * Inject runtime data into workflow template
   * @param {object} workflowTemplate - Base workflow template
   * @param {object} runtimeData - User-specific data to inject
   * @returns {Promise<object>} - Injected workflow
   */
  async injectRuntimeData(workflowTemplate, runtimeData) {
    try {
      console.log('🔧 Injecting runtime data into workflow template...');
      
      // Deep clone the template to avoid mutations
      const injectedWorkflow = JSON.parse(JSON.stringify(workflowTemplate));
      
      // Inject data into workflow metadata
      await this.injectWorkflowMetadata(injectedWorkflow, runtimeData);
      
      // Inject data into nodes
      await this.injectNodeData(injectedWorkflow.nodes, runtimeData);
      
      // Inject data into connections (if any contain dynamic data)
      await this.injectConnectionData(injectedWorkflow.connections, runtimeData);
      
      // Inject data into settings
      await this.injectSettingsData(injectedWorkflow.settings, runtimeData);
      
      console.log('✅ Runtime data injection completed');
      return injectedWorkflow;
      
    } catch (error) {
      console.error('❌ Error injecting runtime data:', error);
      throw error;
    }
  }

  /**
   * Inject data into workflow metadata
   * @param {object} workflow - Workflow object
   * @param {object} runtimeData - Runtime data
   */
  async injectWorkflowMetadata(workflow, runtimeData) {
    const { businessName, emailDomain, businessTypes, primaryType } = runtimeData;
    
    // Update workflow name with business name
    if (businessName && workflow.name) {
      workflow.name = workflow.name.replace(/\{\{businessName\}\}/g, businessName);
    }
    
    // Add runtime metadata
    workflow.metadata = {
      ...workflow.metadata,
      businessName,
      emailDomain,
      businessTypes,
      primaryType,
      injectedAt: new Date().toISOString(),
      version: '2.0'
    };
  }

  /**
   * Inject data into workflow nodes
   * @param {array} nodes - Array of workflow nodes
   * @param {object} runtimeData - Runtime data
   */
  async injectNodeData(nodes, runtimeData) {
    for (const node of nodes) {
      await this.injectSingleNodeData(node, runtimeData);
    }
  }

  /**
   * Inject data into a single node
   * @param {object} node - Single workflow node
   * @param {object} runtimeData - Runtime data
   */
  async injectSingleNodeData(node, runtimeData) {
    const { businessName, emailDomain, timezone, currency, labels, aiConfigs, businessTypes, primaryType } = runtimeData;
    
    // Inject into node parameters
    if (node.parameters) {
      await this.injectParameters(node.parameters, runtimeData);
    }
    
    // Inject into node name
    if (node.name) {
      node.name = this.replacePatterns(node.name, runtimeData);
    }
    
    // Inject into node position (if needed)
    if (node.position && node.position.length >= 2) {
      // Could adjust positioning based on business types count
      const businessTypeCount = businessTypes?.length || 1;
      if (node.name.includes('Responder') && businessTypeCount > 1) {
        // Adjust responder positions for multiple business types
        const baseY = node.position[1];
        const index = businessTypes.indexOf(node.name.split(' ')[0]);
        if (index >= 0) {
          node.position[1] = baseY + (index * 200);
        }
      }
    }
  }

  /**
   * Inject data into node parameters
   * @param {object} parameters - Node parameters
   * @param {object} runtimeData - Runtime data
   */
  async injectParameters(parameters, runtimeData) {
    const { businessName, emailDomain, timezone, currency, labels, aiConfigs, businessTypes, primaryType } = runtimeData;
    
    // Recursively inject into all parameter values
    for (const key in parameters) {
      if (typeof parameters[key] === 'string') {
        parameters[key] = this.replacePatterns(parameters[key], runtimeData);
      } else if (typeof parameters[key] === 'object' && parameters[key] !== null) {
        await this.injectParameters(parameters[key], runtimeData);
      }
    }
    
    // Special handling for specific parameter types
    await this.injectSpecialParameters(parameters, runtimeData);
  }

  /**
   * Inject data into special parameter types
   * @param {object} parameters - Node parameters
   * @param {object} runtimeData - Runtime data
   */
  async injectSpecialParameters(parameters, runtimeData) {
    const { labels, aiConfigs, businessTypes, primaryType } = runtimeData;
    
    // Inject label IDs for Gmail/Outlook nodes
    if (parameters.resource === 'message' && parameters.operation === 'addLabels') {
      if (labels && labels.length > 0) {
        parameters.labelIds = labels.map(label => label.provider_label_id || label.label_id);
      }
    }
    
    // Inject label IDs for trigger nodes
    if (parameters.resource === 'message' && parameters.operation === 'getAll') {
      if (labels && labels.length > 0) {
        const labelIds = labels.map(label => label.provider_label_id || label.label_id);
        if (parameters.filters) {
          parameters.filters.labelIds = labelIds;
        } else {
          parameters.filters = { labelIds };
        }
      }
    }
    
    // Inject AI configuration for LangChain nodes
    if (parameters.model && parameters.systemMessage) {
      const primaryAiConfig = aiConfigs?.find(config => config.business_type === primaryType);
      if (primaryAiConfig) {
        // Inject classifier behavior
        if (parameters.systemMessage.includes('classify')) {
          const categories = primaryAiConfig.classifier_behavior?.categories || {};
          const urgentKeywords = primaryAiConfig.classifier_behavior?.urgent_keywords || [];
          
          parameters.systemMessage = parameters.systemMessage.replace(
            /\{\{categories\}\}/g,
            JSON.stringify(categories)
          );
          parameters.systemMessage = parameters.systemMessage.replace(
            /\{\{urgent_keywords\}\}/g,
            JSON.stringify(urgentKeywords)
          );
        }
        
        // Inject responder behavior
        if (parameters.systemMessage.includes('respond')) {
          const toneProfile = primaryAiConfig.responder_behavior?.toneProfile || {};
          const responseTemplates = primaryAiConfig.responder_behavior?.responseTemplates || {};
          
          parameters.systemMessage = parameters.systemMessage.replace(
            /\{\{toneProfile\}\}/g,
            JSON.stringify(toneProfile)
          );
          parameters.systemMessage = parameters.systemMessage.replace(
            /\{\{responseTemplates\}\}/g,
            JSON.stringify(responseTemplates)
          );
        }
      }
    }
    
    // Inject business types for switch/router nodes
    if (parameters.dataPropertyName === 'businessType' && parameters.rules) {
      if (businessTypes && businessTypes.length > 0) {
        parameters.rules.rules = businessTypes.map((type, index) => ({
          value: type,
          output: index
        }));
      }
    }
    
    // Inject business domain for HTTP request nodes
    if (parameters.url && parameters.url.includes('api.floworx.ai')) {
      if (parameters.sendBody && parameters.bodyParameters) {
        const bodyParams = parameters.bodyParameters.parameters || [];
        
        // Add business domain parameter
        bodyParams.push({
          name: 'businessDomain',
          value: runtimeData.emailDomain || 'unknown'
        });
        
        // Add business types parameter
        bodyParams.push({
          name: 'businessTypes',
          value: JSON.stringify(businessTypes || [])
        });
        
        parameters.bodyParameters.parameters = bodyParams;
      }
    }
  }

  /**
   * Inject data into connections
   * @param {object} connections - Workflow connections
   * @param {object} runtimeData - Runtime data
   */
  async injectConnectionData(connections, runtimeData) {
    // Connections typically don't need runtime injection
    // But we could adjust them based on business types count
    const { businessTypes } = runtimeData;
    
    if (businessTypes && businessTypes.length > 1) {
      // Could adjust connection routing based on business types
      // This is more advanced and would depend on specific workflow structure
    }
  }

  /**
   * Inject data into workflow settings
   * @param {object} settings - Workflow settings
   * @param {object} runtimeData - Runtime data
   */
  async injectSettingsData(settings, runtimeData) {
    const { businessName, emailDomain, timezone } = runtimeData;
    
    // Add business-specific settings
    settings.businessContext = {
      businessName,
      emailDomain,
      timezone,
      injectedAt: new Date().toISOString()
    };
  }

  /**
   * Replace patterns in string with runtime data
   * @param {string} text - Text to process
   * @param {object} runtimeData - Runtime data
   * @returns {string} - Processed text
   */
  replacePatterns(text, runtimeData) {
    const { businessName, emailDomain, timezone, currency, businessTypes, primaryType } = runtimeData;
    
    return text
      .replace(this.injectionPatterns.businessName, businessName || '{{businessName}}')
      .replace(this.injectionPatterns.emailDomain, emailDomain || '{{emailDomain}}')
      .replace(this.injectionPatterns.timezone, timezone || '{{timezone}}')
      .replace(this.injectionPatterns.currency, currency || '{{currency}}')
      .replace(this.injectionPatterns.businessTypes, JSON.stringify(businessTypes || []))
      .replace(this.injectionPatterns.primaryType, primaryType || '{{primaryType}}');
  }

  /**
   * Validate injected workflow
   * @param {object} workflow - Injected workflow
   * @returns {object} - Validation result
   */
  validateInjectedWorkflow(workflow) {
    const issues = [];
    
    // Check for unresolved patterns
    const workflowString = JSON.stringify(workflow);
    const unresolvedPatterns = workflowString.match(/\{\{[^}]+\}\}/g);
    
    if (unresolvedPatterns) {
      issues.push({
        type: 'unresolved_patterns',
        patterns: unresolvedPatterns,
        message: 'Some patterns were not resolved during injection'
      });
    }
    
    // Check for required nodes
    const requiredNodeTypes = ['gmail', 'switch', 'langchain'];
    const nodeTypes = workflow.nodes?.map(node => node.type) || [];
    
    for (const requiredType of requiredNodeTypes) {
      if (!nodeTypes.some(type => type.includes(requiredType))) {
        issues.push({
          type: 'missing_node_type',
          nodeType: requiredType,
          message: `Required node type ${requiredType} not found`
        });
      }
    }
    
    // Check for valid connections
    if (!workflow.connections || Object.keys(workflow.connections).length === 0) {
      issues.push({
        type: 'no_connections',
        message: 'Workflow has no connections between nodes'
      });
    }
    
    return {
      valid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }
}

/**
 * Convenience function to inject runtime data
 * @param {object} workflowTemplate - Base workflow template
 * @param {object} runtimeData - User-specific data
 * @returns {Promise<object>} - Injected workflow
 */
export async function injectRuntimeData(workflowTemplate, runtimeData) {
  const injector = new RuntimeDataInjector();
  return await injector.injectRuntimeData(workflowTemplate, runtimeData);
}

export default RuntimeDataInjector;
