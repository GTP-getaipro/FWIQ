/**
 * Rule Documentation Generator
 * Automated generation of comprehensive rule documentation
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { rulePerformanceAnalytics } from './rulePerformanceAnalytics.js';
import { ruleImpactAnalysis } from './ruleImpactAnalysis.js';

export class RuleDocumentationGenerator {
  constructor() {
    this.templates = {
      rule: this.getRuleTemplate(),
      changelog: this.getChangelogTemplate(),
      api: this.getApiTemplate(),
      troubleshooting: this.getTroubleshootingTemplate(),
      bestPractices: this.getBestPracticesTemplate()
    };
    this.documentationCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Generate comprehensive rule documentation
   * @param {string} ruleId - Rule identifier
   * @param {Object} options - Documentation options
   * @returns {Promise<Object>} Generated documentation
   */
  async generateRuleDocumentation(ruleId, options = {}) {
    try {
      logger.info('Generating rule documentation', { ruleId });

      const {
        includePerformance = true,
        includeImpact = true,
        includeChangelog = true,
        includeApiDocs = true,
        includeTroubleshooting = true,
        includeBestPractices = true,
        format = 'markdown'
      } = options;

      // Get rule data
      const ruleData = await this.getRuleData(ruleId);
      if (!ruleData) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      // Get additional data in parallel
      const [
        performanceData,
        impactData,
        changelogData,
        relatedRules
      ] = await Promise.all([
        includePerformance ? rulePerformanceAnalytics.getRuleMetrics(ruleId, '30d') : null,
        includeImpact ? this.getRuleImpactData(ruleId) : null,
        includeChangelog ? this.getRuleChangelog(ruleId) : null,
        this.getRelatedRules(ruleId)
      ]);

      // Generate documentation sections
      const documentation = {
        ruleId,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        sections: {}
      };

      // Generate main rule documentation
      documentation.sections.overview = this.generateRuleOverview(ruleData, performanceData);
      
      // Generate configuration documentation
      documentation.sections.configuration = this.generateConfigurationDocs(ruleData);
      
      // Generate performance documentation
      if (includePerformance && performanceData) {
        documentation.sections.performance = this.generatePerformanceDocs(ruleData, performanceData);
      }
      
      // Generate impact documentation
      if (includeImpact && impactData) {
        documentation.sections.impact = this.generateImpactDocs(ruleData, impactData);
      }
      
      // Generate changelog documentation
      if (includeChangelog && changelogData) {
        documentation.sections.changelog = this.generateChangelogDocs(changelogData);
      }
      
      // Generate API documentation
      if (includeApiDocs) {
        documentation.sections.api = this.generateApiDocs(ruleData);
      }
      
      // Generate troubleshooting documentation
      if (includeTroubleshooting) {
        documentation.sections.troubleshooting = this.generateTroubleshootingDocs(ruleData, performanceData);
      }
      
      // Generate best practices documentation
      if (includeBestPractices) {
        documentation.sections.bestPractices = this.generateBestPracticesDocs(ruleData, relatedRules);
      }

      // Generate formatted output
      const formattedDocs = this.formatDocumentation(documentation, format);

      // Store documentation
      await this.storeDocumentation(ruleId, documentation, formattedDocs);

      logger.info('Rule documentation generated successfully', { ruleId, sections: Object.keys(documentation.sections) });

      return {
        documentation,
        formatted: formattedDocs,
        metadata: {
          ruleId,
          generatedAt: documentation.generatedAt,
          sections: Object.keys(documentation.sections),
          format
        }
      };
    } catch (error) {
      logger.error('Error generating rule documentation', { error: error.message, ruleId });
      throw error;
    }
  }

  /**
   * Generate documentation for all rules
   * @param {string} userId - User identifier
   * @param {Object} options - Documentation options
   * @returns {Promise<Object>} Generated documentation for all rules
   */
  async generateAllRulesDocumentation(userId, options = {}) {
    try {
      logger.info('Generating documentation for all rules', { userId });

      const {
        includePerformance = true,
        includeImpact = false, // Skip impact for bulk generation
        format = 'markdown',
        groupBy = 'category'
      } = options;

      // Get all rules for user
      const rules = await this.getAllRules(userId);
      
      if (rules.length === 0) {
        return {
          documentation: {
            userId,
            generatedAt: new Date().toISOString(),
            version: '1.0',
            rules: [],
            summary: this.getDefaultSummary()
          },
          formatted: this.formatEmptyDocumentation(userId),
          metadata: {
            userId,
            generatedAt: new Date().toISOString(),
            totalRules: 0,
            format
          }
        };
      }

      // Generate documentation for each rule
      const ruleDocumentations = await Promise.all(
        rules.map(async (rule) => {
          try {
            const doc = await this.generateRuleDocumentation(rule.id, {
              includePerformance,
              includeImpact,
              includeChangelog: false,
              includeApiDocs: false,
              includeTroubleshooting: false,
              includeBestPractices: false,
              format
            });
            return { rule, documentation: doc.documentation };
          } catch (error) {
            logger.warn('Failed to generate documentation for rule', { ruleId: rule.id, error: error.message });
            return { rule, documentation: null };
          }
        })
      );

      // Group rules by category if requested
      const groupedRules = groupBy === 'category' ? this.groupRulesByCategory(ruleDocumentations) : null;

      // Generate summary
      const summary = this.generateSummary(ruleDocumentations);

      const allRulesDocumentation = {
        userId,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        summary,
        rules: ruleDocumentations.filter(rd => rd.documentation !== null),
        groupedRules,
        metadata: {
          totalRules: rules.length,
          documentedRules: ruleDocumentations.filter(rd => rd.documentation !== null).length,
          groupBy
        }
      };

      // Format documentation
      const formattedDocs = this.formatAllRulesDocumentation(allRulesDocumentation, format);

      // Store documentation
      await this.storeAllRulesDocumentation(userId, allRulesDocumentation, formattedDocs);

      logger.info('All rules documentation generated successfully', { 
        userId, 
        totalRules: rules.length,
        documentedRules: allRulesDocumentation.rules.length
      });

      return {
        documentation: allRulesDocumentation,
        formatted: formattedDocs,
        metadata: {
          userId,
          generatedAt: allRulesDocumentation.generatedAt,
          totalRules: rules.length,
          documentedRules: allRulesDocumentation.rules.length,
          format
        }
      };
    } catch (error) {
      logger.error('Error generating all rules documentation', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate rule overview documentation
   * @param {Object} ruleData - Rule data
   * @param {Object} performanceData - Performance data
   * @returns {Object} Rule overview documentation
   */
  generateRuleOverview(ruleData, performanceData) {
    return {
      title: `Rule: ${ruleData.name}`,
      description: ruleData.description || 'No description provided',
      status: ruleData.enabled ? 'Active' : 'Inactive',
      priority: ruleData.priority,
      category: ruleData.category || 'General',
      createdAt: ruleData.created_at,
      updatedAt: ruleData.updated_at,
      lastExecuted: performanceData?.lastExecution || 'Never',
      totalExecutions: performanceData?.totalExecutions || 0,
      successRate: performanceData?.successRate || 0,
      averageExecutionTime: performanceData?.averageExecutionTime || 0,
      tags: this.extractTags(ruleData),
      dependencies: this.extractDependencies(ruleData),
      relatedRules: this.extractRelatedRules(ruleData)
    };
  }

  /**
   * Generate configuration documentation
   * @param {Object} ruleData - Rule data
   * @returns {Object} Configuration documentation
   */
  generateConfigurationDocs(ruleData) {
    return {
      title: 'Configuration',
      conditions: this.documentConditions(ruleData),
      actions: this.documentActions(ruleData),
      settings: this.documentSettings(ruleData),
      validation: this.documentValidation(ruleData),
      examples: this.generateConfigurationExamples(ruleData)
    };
  }

  /**
   * Generate performance documentation
   * @param {Object} ruleData - Rule data
   * @param {Object} performanceData - Performance data
   * @returns {Object} Performance documentation
   */
  generatePerformanceDocs(ruleData, performanceData) {
    return {
      title: 'Performance Metrics',
      summary: {
        totalExecutions: performanceData.totalExecutions,
        averageExecutionTime: `${performanceData.averageExecutionTime}ms`,
        successRate: `${performanceData.successRate}%`,
        triggerRate: `${performanceData.triggerRate}%`
      },
      detailedMetrics: {
        executionTime: {
          min: `${performanceData.minExecutionTime}ms`,
          max: `${performanceData.maxExecutionTime}ms`,
          median: `${performanceData.medianExecutionTime}ms`,
          p95: `${performanceData.p95ExecutionTime}ms`,
          p99: `${performanceData.p99ExecutionTime}ms`
        },
        reliability: {
          successCount: performanceData.successCount,
          failureCount: performanceData.failureCount,
          successRate: `${performanceData.successRate}%`
        },
        usage: {
          triggerCount: performanceData.triggerCount,
          triggerRate: `${performanceData.triggerRate}%`,
          lastExecution: performanceData.lastExecution
        }
      },
      trends: this.generatePerformanceTrends(performanceData),
      recommendations: this.generatePerformanceRecommendations(performanceData)
    };
  }

  /**
   * Generate impact documentation
   * @param {Object} ruleData - Rule data
   * @param {Object} impactData - Impact data
   * @returns {Object} Impact documentation
   */
  generateImpactDocs(ruleData, impactData) {
    return {
      title: 'Business Impact Analysis',
      overallImpact: {
        level: impactData.impact?.overall?.level || 'unknown',
        score: impactData.impact?.overall?.score || 0,
        description: this.getImpactDescription(impactData.impact?.overall?.level)
      },
      impactBreakdown: {
        performance: impactData.impact?.performance || {},
        business: impactData.impact?.business || {},
        operational: impactData.impact?.operational || {},
        risk: impactData.impact?.risk || {}
      },
      recommendations: impactData.recommendations || [],
      affectedSystems: impactData.metadata?.affectedSystems || [],
      changeType: impactData.metadata?.changeType || 'unknown'
    };
  }

  /**
   * Generate changelog documentation
   * @param {Array} changelogData - Changelog data
   * @returns {Object} Changelog documentation
   */
  generateChangelogDocs(changelogData) {
    return {
      title: 'Change History',
      entries: changelogData.map(entry => ({
        version: entry.version,
        date: entry.created_at,
        type: entry.change_type,
        description: entry.description,
        changes: entry.changes,
        author: entry.author,
        impact: entry.impact_assessment
      })),
      summary: this.generateChangelogSummary(changelogData)
    };
  }

  /**
   * Generate API documentation
   * @param {Object} ruleData - Rule data
   * @returns {Object} API documentation
   */
  generateApiDocs(ruleData) {
    return {
      title: 'API Reference',
      endpoints: this.generateApiEndpoints(ruleData),
      parameters: this.generateApiParameters(ruleData),
      responses: this.generateApiResponses(ruleData),
      examples: this.generateApiExamples(ruleData),
      errorCodes: this.generateErrorCodes(ruleData)
    };
  }

  /**
   * Generate troubleshooting documentation
   * @param {Object} ruleData - Rule data
   * @param {Object} performanceData - Performance data
   * @returns {Object} Troubleshooting documentation
   */
  generateTroubleshootingDocs(ruleData, performanceData) {
    return {
      title: 'Troubleshooting Guide',
      commonIssues: this.generateCommonIssues(ruleData, performanceData),
      diagnosticSteps: this.generateDiagnosticSteps(ruleData),
      errorMessages: this.generateErrorMessages(ruleData),
      solutions: this.generateSolutions(ruleData, performanceData),
      monitoring: this.generateMonitoringGuidance(ruleData)
    };
  }

  /**
   * Generate best practices documentation
   * @param {Object} ruleData - Rule data
   * @param {Array} relatedRules - Related rules
   * @returns {Object} Best practices documentation
   */
  generateBestPracticesDocs(ruleData, relatedRules) {
    return {
      title: 'Best Practices',
      recommendations: this.generateBestPracticeRecommendations(ruleData),
      patterns: this.generatePatterns(ruleData, relatedRules),
      antiPatterns: this.generateAntiPatterns(ruleData),
      optimization: this.generateOptimizationTips(ruleData),
      maintenance: this.generateMaintenanceGuidance(ruleData)
    };
  }

  /**
   * Format documentation based on format type
   * @param {Object} documentation - Documentation object
   * @param {string} format - Output format
   * @returns {string} Formatted documentation
   */
  formatDocumentation(documentation, format) {
    switch (format.toLowerCase()) {
      case 'markdown':
        return this.formatAsMarkdown(documentation);
      case 'html':
        return this.formatAsHtml(documentation);
      case 'json':
        return JSON.stringify(documentation, null, 2);
      case 'yaml':
        return this.formatAsYaml(documentation);
      default:
        return this.formatAsMarkdown(documentation);
    }
  }

  /**
   * Format documentation as Markdown
   * @param {Object} documentation - Documentation object
   * @returns {string} Markdown formatted documentation
   */
  formatAsMarkdown(documentation) {
    let markdown = `# Rule Documentation\n\n`;
    markdown += `**Rule ID:** ${documentation.ruleId}\n`;
    markdown += `**Generated:** ${documentation.generatedAt}\n`;
    markdown += `**Version:** ${documentation.version}\n\n`;

    // Overview section
    if (documentation.sections.overview) {
      const overview = documentation.sections.overview;
      markdown += `## ${overview.title}\n\n`;
      markdown += `${overview.description}\n\n`;
      markdown += `| Property | Value |\n`;
      markdown += `|----------|-------|\n`;
      markdown += `| Status | ${overview.status} |\n`;
      markdown += `| Priority | ${overview.priority} |\n`;
      markdown += `| Category | ${overview.category} |\n`;
      markdown += `| Created | ${overview.createdAt} |\n`;
      markdown += `| Updated | ${overview.updatedAt} |\n`;
      markdown += `| Last Executed | ${overview.lastExecuted} |\n`;
      markdown += `| Total Executions | ${overview.totalExecutions} |\n`;
      markdown += `| Success Rate | ${overview.successRate}% |\n`;
      markdown += `| Avg Execution Time | ${overview.averageExecutionTime}ms |\n\n`;
    }

    // Configuration section
    if (documentation.sections.configuration) {
      const config = documentation.sections.configuration;
      markdown += `## ${config.title}\n\n`;
      
      if (config.conditions) {
        markdown += `### Conditions\n\n`;
        markdown += `${config.conditions}\n\n`;
      }
      
      if (config.actions) {
        markdown += `### Actions\n\n`;
        markdown += `${config.actions}\n\n`;
      }
    }

    // Performance section
    if (documentation.sections.performance) {
      const perf = documentation.sections.performance;
      markdown += `## ${perf.title}\n\n`;
      
      markdown += `### Summary\n\n`;
      markdown += `| Metric | Value |\n`;
      markdown += `|--------|-------|\n`;
      markdown += `| Total Executions | ${perf.summary.totalExecutions} |\n`;
      markdown += `| Avg Execution Time | ${perf.summary.averageExecutionTime} |\n`;
      markdown += `| Success Rate | ${perf.summary.successRate} |\n`;
      markdown += `| Trigger Rate | ${perf.summary.triggerRate} |\n\n`;
    }

    // Add other sections as needed...
    
    return markdown;
  }

  /**
   * Format documentation as HTML
   * @param {Object} documentation - Documentation object
   * @returns {string} HTML formatted documentation
   */
  formatAsHtml(documentation) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Rule Documentation - ${documentation.ruleId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        h2 { color: #666; border-bottom: 1px solid #ccc; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metadata { background-color: #f9f9f9; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Rule Documentation</h1>
    <div class="metadata">
        <strong>Rule ID:</strong> ${documentation.ruleId}<br>
        <strong>Generated:</strong> ${documentation.generatedAt}<br>
        <strong>Version:</strong> ${documentation.version}
    </div>`;

    // Add sections...
    
    html += `</body></html>`;
    return html;
  }

  /**
   * Format documentation as YAML
   * @param {Object} documentation - Documentation object
   * @returns {string} YAML formatted documentation
   */
  formatAsYaml(documentation) {
    // Simple YAML formatting - in production, use a proper YAML library
    return `rule_id: ${documentation.ruleId}
generated_at: ${documentation.generatedAt}
version: ${documentation.version}
sections:
  overview:
    title: "${documentation.sections.overview?.title || ''}"
    description: "${documentation.sections.overview?.description || ''}"
    status: "${documentation.sections.overview?.status || ''}"
    priority: ${documentation.sections.overview?.priority || 0}`;
  }

  /**
   * Get rule data from database
   * @param {string} ruleId - Rule identifier
   * @returns {Promise<Object>} Rule data
   */
  async getRuleData(ruleId) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting rule data', { error: error.message, ruleId });
      return null;
    }
  }

  /**
   * Get all rules for user
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} All rules
   */
  async getAllRules(userId) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting all rules', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get rule impact data
   * @param {string} ruleId - Rule identifier
   * @returns {Promise<Object>} Impact data
   */
  async getRuleImpactData(ruleId) {
    try {
      const { data, error } = await supabase
        .from('rule_impact_analysis')
        .select('*')
        .eq('rule_id', ruleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.analysis_data || null;
    } catch (error) {
      logger.error('Error getting rule impact data', { error: error.message, ruleId });
      return null;
    }
  }

  /**
   * Get rule changelog
   * @param {string} ruleId - Rule identifier
   * @returns {Promise<Array>} Changelog data
   */
  async getRuleChangelog(ruleId) {
    try {
      const { data, error } = await supabase
        .from('rule_changelog')
        .select('*')
        .eq('rule_id', ruleId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting rule changelog', { error: error.message, ruleId });
      return [];
    }
  }

  /**
   * Get related rules
   * @param {string} ruleId - Rule identifier
   * @returns {Promise<Array>} Related rules
   */
  async getRelatedRules(ruleId) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .neq('id', ruleId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting related rules', { error: error.message, ruleId });
      return [];
    }
  }

  /**
   * Store documentation
   * @param {string} ruleId - Rule identifier
   * @param {Object} documentation - Documentation object
   * @param {string} formattedDocs - Formatted documentation
   */
  async storeDocumentation(ruleId, documentation, formattedDocs) {
    try {
      const { error } = await supabase
        .from('rule_documentation')
        .upsert({
          rule_id: ruleId,
          documentation_data: documentation,
          formatted_content: formattedDocs,
          generated_at: documentation.generatedAt,
          version: documentation.version
        });

      if (error) {
        logger.error('Failed to store rule documentation', { error: error.message, ruleId });
      }
    } catch (error) {
      logger.error('Error storing rule documentation', { error: error.message, ruleId });
    }
  }

  /**
   * Store all rules documentation
   * @param {string} userId - User identifier
   * @param {Object} documentation - Documentation object
   * @param {string} formattedDocs - Formatted documentation
   */
  async storeAllRulesDocumentation(userId, documentation, formattedDocs) {
    try {
      const { error } = await supabase
        .from('all_rules_documentation')
        .upsert({
          user_id: userId,
          documentation_data: documentation,
          formatted_content: formattedDocs,
          generated_at: documentation.generatedAt,
          version: documentation.version
        });

      if (error) {
        logger.error('Failed to store all rules documentation', { error: error.message, userId });
      }
    } catch (error) {
      logger.error('Error storing all rules documentation', { error: error.message, userId });
    }
  }

  // Template methods
  getRuleTemplate() {
    return {
      overview: '# {title}\n\n{description}\n\n',
      configuration: '## Configuration\n\n{content}\n\n',
      performance: '## Performance\n\n{content}\n\n',
      impact: '## Impact Analysis\n\n{content}\n\n',
      changelog: '## Change History\n\n{content}\n\n',
      api: '## API Reference\n\n{content}\n\n',
      troubleshooting: '## Troubleshooting\n\n{content}\n\n',
      bestPractices: '## Best Practices\n\n{content}\n\n'
    };
  }

  getChangelogTemplate() {
    return '### {version} - {date}\n\n**{type}:** {description}\n\n{changes}\n\n';
  }

  getApiTemplate() {
    return '#### {method} {endpoint}\n\n{description}\n\n**Parameters:**\n{parameters}\n\n**Response:**\n{response}\n\n';
  }

  getTroubleshootingTemplate() {
    return '### {issue}\n\n**Symptoms:** {symptoms}\n\n**Cause:** {cause}\n\n**Solution:** {solution}\n\n';
  }

  getBestPracticesTemplate() {
    return '### {title}\n\n{description}\n\n**Recommendation:** {recommendation}\n\n';
  }

  // Helper methods for documentation generation
  extractTags(ruleData) {
    return ruleData.tags ? ruleData.tags.split(',').map(tag => tag.trim()) : [];
  }

  extractDependencies(ruleData) {
    return ruleData.dependencies || [];
  }

  extractRelatedRules(ruleData) {
    return ruleData.related_rules || [];
  }

  documentConditions(ruleData) {
    return `**Condition Type:** ${ruleData.condition || 'N/A'}\n**Condition Value:** ${ruleData.condition_value || 'N/A'}`;
  }

  documentActions(ruleData) {
    return `**Action:** ${ruleData.escalation_action || 'N/A'}\n**Target:** ${ruleData.escalation_target || 'N/A'}`;
  }

  documentSettings(ruleData) {
    return `**Priority:** ${ruleData.priority || 'N/A'}\n**Enabled:** ${ruleData.enabled ? 'Yes' : 'No'}`;
  }

  documentValidation(ruleData) {
    return `**Validation Status:** ${ruleData.validation_status || 'Unknown'}`;
  }

  generateConfigurationExamples(ruleData) {
    return `\`\`\`json\n${JSON.stringify(ruleData, null, 2)}\n\`\`\``;
  }

  generatePerformanceTrends(performanceData) {
    return 'Performance trends would be generated here based on historical data.';
  }

  generatePerformanceRecommendations(performanceData) {
    const recommendations = [];
    
    if (performanceData.averageExecutionTime > 1000) {
      recommendations.push('Consider optimizing rule conditions for better performance');
    }
    
    if (performanceData.successRate < 90) {
      recommendations.push('Review rule logic to improve success rate');
    }
    
    return recommendations;
  }

  getImpactDescription(level) {
    const descriptions = {
      high: 'Significant impact on system performance and business operations',
      medium: 'Moderate impact with some considerations needed',
      low: 'Minimal impact with minor considerations',
      minimal: 'Negligible impact'
    };
    return descriptions[level] || 'Impact level unknown';
  }

  generateChangelogSummary(changelogData) {
    return `Total changes: ${changelogData.length}`;
  }

  generateApiEndpoints(ruleData) {
    return [
      {
        method: 'GET',
        endpoint: `/api/rules/${ruleData.id}`,
        description: 'Get rule details'
      },
      {
        method: 'PUT',
        endpoint: `/api/rules/${ruleData.id}`,
        description: 'Update rule'
      }
    ];
  }

  generateApiParameters(ruleData) {
    return 'Parameters would be documented here based on rule configuration.';
  }

  generateApiResponses(ruleData) {
    return 'Response schemas would be documented here.';
  }

  generateApiExamples(ruleData) {
    return 'API usage examples would be provided here.';
  }

  generateErrorCodes(ruleData) {
    return [
      { code: 400, description: 'Bad Request - Invalid rule configuration' },
      { code: 404, description: 'Not Found - Rule does not exist' },
      { code: 500, description: 'Internal Server Error' }
    ];
  }

  generateCommonIssues(ruleData, performanceData) {
    return [
      {
        issue: 'Rule not triggering',
        symptoms: 'Expected actions not being executed',
        cause: 'Condition not matching email content',
        solution: 'Review and adjust condition criteria'
      }
    ];
  }

  generateDiagnosticSteps(ruleData) {
    return [
      'Check rule status and enablement',
      'Verify condition criteria',
      'Review execution logs',
      'Test with sample data'
    ];
  }

  generateErrorMessages(ruleData) {
    return [
      'Rule execution timeout',
      'Invalid condition syntax',
      'Missing escalation target'
    ];
  }

  generateSolutions(ruleData, performanceData) {
    return [
      'Optimize rule conditions',
      'Add proper error handling',
      'Implement monitoring'
    ];
  }

  generateMonitoringGuidance(ruleData) {
    return 'Monitor rule execution frequency, success rate, and performance metrics.';
  }

  generateBestPracticeRecommendations(ruleData) {
    return [
      'Use descriptive rule names',
      'Keep conditions simple and clear',
      'Test rules thoroughly before deployment',
      'Monitor rule performance regularly'
    ];
  }

  generatePatterns(ruleData, relatedRules) {
    return 'Common patterns used in similar rules.';
  }

  generateAntiPatterns(ruleData) {
    return 'Common anti-patterns to avoid.';
  }

  generateOptimizationTips(ruleData) {
    return 'Tips for optimizing rule performance.';
  }

  generateMaintenanceGuidance(ruleData) {
    return 'Guidance for maintaining and updating rules.';
  }

  groupRulesByCategory(ruleDocumentations) {
    const grouped = {};
    ruleDocumentations.forEach(rd => {
      if (rd.documentation) {
        const category = rd.documentation.sections.overview?.category || 'Uncategorized';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(rd);
      }
    });
    return grouped;
  }

  generateSummary(ruleDocumentations) {
    const totalRules = ruleDocumentations.length;
    const documentedRules = ruleDocumentations.filter(rd => rd.documentation !== null).length;
    
    return {
      totalRules,
      documentedRules,
      documentationRate: totalRules > 0 ? (documentedRules / totalRules) * 100 : 0,
      categories: this.getCategorySummary(ruleDocumentations),
      performance: this.getPerformanceSummary(ruleDocumentations)
    };
  }

  getCategorySummary(ruleDocumentations) {
    const categories = {};
    ruleDocumentations.forEach(rd => {
      if (rd.documentation) {
        const category = rd.documentation.sections.overview?.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + 1;
      }
    });
    return categories;
  }

  getPerformanceSummary(ruleDocumentations) {
    const performanceData = ruleDocumentations
      .filter(rd => rd.documentation?.sections?.performance)
      .map(rd => rd.documentation.sections.performance.summary);
    
    if (performanceData.length === 0) {
      return { averageExecutionTime: 0, averageSuccessRate: 0 };
    }
    
    const avgExecutionTime = performanceData.reduce((sum, p) => sum + (p.averageExecutionTime || 0), 0) / performanceData.length;
    const avgSuccessRate = performanceData.reduce((sum, p) => sum + (p.successRate || 0), 0) / performanceData.length;
    
    return {
      averageExecutionTime: Math.round(avgExecutionTime),
      averageSuccessRate: Math.round(avgSuccessRate * 100) / 100
    };
  }

  formatAllRulesDocumentation(documentation, format) {
    return this.formatDocumentation(documentation, format);
  }

  formatEmptyDocumentation(userId) {
    return `# Rules Documentation\n\n**User ID:** ${userId}\n**Generated:** ${new Date().toISOString()}\n\nNo rules found for this user.`;
  }

  getDefaultSummary() {
    return {
      totalRules: 0,
      documentedRules: 0,
      documentationRate: 0,
      categories: {},
      performance: { averageExecutionTime: 0, averageSuccessRate: 0 }
    };
  }

  /**
   * Clear documentation cache
   */
  clearCache() {
    this.documentationCache.clear();
    logger.info('Documentation cache cleared');
  }
}

// Export singleton instance
export const ruleDocumentationGenerator = new RuleDocumentationGenerator();
export default RuleDocumentationGenerator;
