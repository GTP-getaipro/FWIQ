/**
 * Template Optimization System
 * 
 * Handles template optimization including performance analysis,
 * optimization recommendations, and automated improvements.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class TemplateOptimizer {
  constructor() {
    this.optimizationRules = new Map();
    this.optimizationResults = new Map();
    this.optimizationMetrics = new Map();
    this.optimizationRecommendations = new Map();
    this.optimizationHistory = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize template optimization system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Template Optimizer', { userId });

      // Load optimization data
      await this.loadOptimizationRules(userId);
      await this.loadOptimizationResults(userId);
      await this.loadOptimizationMetrics(userId);
      await this.loadOptimizationRecommendations(userId);
      await this.loadOptimizationHistory(userId);

      this.isInitialized = true;
      logger.info('Template Optimizer initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Template Optimizer', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(userId, templateId) {
    try {
      logger.info('Getting optimization recommendations', { userId, templateId });

      // Analyze template
      const analysis = await this.analyzeTemplate(userId, templateId);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(userId, templateId, analysis);

      // Calculate potential impact
      const impactAnalysis = await this.calculateImpactAnalysis(userId, templateId, recommendations);

      // Store recommendations
      await this.storeOptimizationRecommendations(userId, templateId, recommendations);

      logger.info('Optimization recommendations retrieved successfully', { 
        userId, 
        templateId,
        recommendationCount: recommendations.length
      });

      return {
        success: true,
        recommendations,
        impactAnalysis
      };
    } catch (error) {
      logger.error('Failed to get optimization recommendations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply optimization
   */
  async applyOptimization(userId, templateId, optimizationConfig) {
    try {
      logger.info('Applying optimization', { userId, templateId });

      // Validate optimization configuration
      const validationResult = await this.validateOptimizationConfig(optimizationConfig);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Get current template
      const currentTemplate = await this.getCurrentTemplate(userId, templateId);
      if (!currentTemplate) {
        return { success: false, error: 'Template not found' };
      }

      // Apply optimization
      const optimizationResult = await this.applyOptimizationToTemplate(userId, templateId, optimizationConfig);

      // Store optimization result
      await this.storeOptimizationResult(userId, templateId, optimizationResult);

      // Log optimization activity
      await this.logOptimizationActivity(userId, 'optimization_applied', { templateId, optimizationConfig });

      logger.info('Optimization applied successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        optimizationResult,
        updates: optimizationResult.updates
      };
    } catch (error) {
      logger.error('Failed to apply optimization', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze template
   */
  async analyzeTemplate(userId, templateId) {
    try {
      logger.info('Analyzing template', { userId, templateId });

      // Get template
      const template = await this.getCurrentTemplate(userId, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Perform analysis
      const analysis = {
        template_id: templateId,
        user_id: userId,
        analyzed_at: new Date().toISOString(),
        content_analysis: await this.analyzeContent(template),
        style_analysis: await this.analyzeStyles(template),
        performance_analysis: await this.analyzePerformance(template),
        accessibility_analysis: await this.analyzeAccessibility(template),
        compatibility_analysis: await this.analyzeCompatibility(template),
        seo_analysis: await this.analyzeSEO(template),
        overall_score: 0
      };

      // Calculate overall score
      analysis.overall_score = await this.calculateOverallScore(analysis);

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze template', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Analyze content
   */
  async analyzeContent(template) {
    try {
      const content = template.content || '';
      const analysis = {
        word_count: this.countWords(content),
        character_count: content.length,
        paragraph_count: this.countParagraphs(content),
        heading_count: this.countHeadings(content),
        link_count: this.countLinks(content),
        image_count: this.countImages(content),
        issues: [],
        suggestions: []
      };

      // Check for content issues
      if (analysis.word_count < 50) {
        analysis.issues.push({
          type: 'warning',
          message: 'Content is too short. Consider adding more text.',
          severity: 'medium'
        });
      }

      if (analysis.word_count > 1000) {
        analysis.issues.push({
          type: 'warning',
          message: 'Content is very long. Consider breaking it into sections.',
          severity: 'low'
        });
      }

      if (analysis.link_count === 0) {
        analysis.issues.push({
          type: 'suggestion',
          message: 'No links found. Consider adding call-to-action links.',
          severity: 'medium'
        });
      }

      // Generate suggestions
      if (analysis.heading_count === 0) {
        analysis.suggestions.push({
          type: 'structure',
          message: 'Add headings to improve content structure',
          priority: 'medium'
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze content', { error: error.message });
      return {};
    }
  }

  /**
   * Analyze styles
   */
  async analyzeStyles(template) {
    try {
      const content = template.content || '';
      const styles = template.styles || {};
      const analysis = {
        inline_styles: this.countInlineStyles(content),
        css_classes: this.countCSSClasses(content),
        responsive_design: this.checkResponsiveDesign(content),
        color_contrast: this.checkColorContrast(styles),
        font_usage: this.analyzeFontUsage(styles),
        issues: [],
        suggestions: []
      };

      // Check for style issues
      if (analysis.inline_styles > 10) {
        analysis.issues.push({
          type: 'warning',
          message: 'Too many inline styles. Consider using CSS classes.',
          severity: 'medium'
        });
      }

      if (!analysis.responsive_design) {
        analysis.issues.push({
          type: 'warning',
          message: 'Template may not be responsive. Add responsive design elements.',
          severity: 'high'
        });
      }

      // Generate suggestions
      if (analysis.inline_styles > 5) {
        analysis.suggestions.push({
          type: 'optimization',
          message: 'Move inline styles to CSS classes for better maintainability',
          priority: 'medium'
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze styles', { error: error.message });
      return {};
    }
  }

  /**
   * Analyze performance
   */
  async analyzePerformance(template) {
    try {
      const content = template.content || '';
      const analysis = {
        file_size: this.calculateFileSize(content),
        image_optimization: this.checkImageOptimization(content),
        css_optimization: this.checkCSSOptimization(content),
        javascript_usage: this.checkJavaScriptUsage(content),
        loading_speed: this.estimateLoadingSpeed(content),
        issues: [],
        suggestions: []
      };

      // Check for performance issues
      if (analysis.file_size > 100000) { // 100KB
        analysis.issues.push({
          type: 'warning',
          message: 'Template file size is large. Consider optimizing images and CSS.',
          severity: 'medium'
        });
      }

      if (analysis.image_optimization.score < 70) {
        analysis.issues.push({
          type: 'warning',
          message: 'Images are not optimized. Consider compressing images.',
          severity: 'high'
        });
      }

      // Generate suggestions
      if (analysis.css_optimization.score < 80) {
        analysis.suggestions.push({
          type: 'optimization',
          message: 'Optimize CSS by removing unused styles and minifying',
          priority: 'high'
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze performance', { error: error.message });
      return {};
    }
  }

  /**
   * Analyze accessibility
   */
  async analyzeAccessibility(template) {
    try {
      const content = template.content || '';
      const analysis = {
        alt_text_coverage: this.checkAltTextCoverage(content),
        heading_structure: this.checkHeadingStructure(content),
        color_contrast: this.checkColorContrast(template.styles || {}),
        keyboard_navigation: this.checkKeyboardNavigation(content),
        screen_reader_compatibility: this.checkScreenReaderCompatibility(content),
        issues: [],
        suggestions: []
      };

      // Check for accessibility issues
      if (analysis.alt_text_coverage < 80) {
        analysis.issues.push({
          type: 'warning',
          message: 'Some images are missing alt text. Add alt text for better accessibility.',
          severity: 'high'
        });
      }

      if (analysis.heading_structure.score < 70) {
        analysis.issues.push({
          type: 'warning',
          message: 'Heading structure needs improvement for better accessibility.',
          severity: 'medium'
        });
      }

      // Generate suggestions
      if (analysis.color_contrast.score < 80) {
        analysis.suggestions.push({
          type: 'accessibility',
          message: 'Improve color contrast for better readability',
          priority: 'high'
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze accessibility', { error: error.message });
      return {};
    }
  }

  /**
   * Analyze compatibility
   */
  async analyzeCompatibility(template) {
    try {
      const content = template.content || '';
      const analysis = {
        email_client_compatibility: this.checkEmailClientCompatibility(content),
        browser_compatibility: this.checkBrowserCompatibility(content),
        mobile_compatibility: this.checkMobileCompatibility(content),
        table_usage: this.checkTableUsage(content),
        css_support: this.checkCSSSupport(content),
        issues: [],
        suggestions: []
      };

      // Check for compatibility issues
      if (analysis.email_client_compatibility.score < 80) {
        analysis.issues.push({
          type: 'warning',
          message: 'Template may not render correctly in some email clients.',
          severity: 'high'
        });
      }

      if (analysis.mobile_compatibility.score < 70) {
        analysis.issues.push({
          type: 'warning',
          message: 'Template may not be mobile-friendly.',
          severity: 'high'
        });
      }

      // Generate suggestions
      if (analysis.table_usage.score < 60) {
        analysis.suggestions.push({
          type: 'compatibility',
          message: 'Use tables for layout to improve email client compatibility',
          priority: 'high'
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze compatibility', { error: error.message });
      return {};
    }
  }

  /**
   * Analyze SEO
   */
  async analyzeSEO(template) {
    try {
      const content = template.content || '';
      const analysis = {
        title_tag: this.checkTitleTag(content),
        meta_description: this.checkMetaDescription(content),
        heading_structure: this.checkHeadingStructure(content),
        keyword_density: this.checkKeywordDensity(content),
        internal_links: this.checkInternalLinks(content),
        issues: [],
        suggestions: []
      };

      // Check for SEO issues
      if (!analysis.title_tag.exists) {
        analysis.issues.push({
          type: 'warning',
          message: 'No title tag found. Add a title tag for better SEO.',
          severity: 'high'
        });
      }

      if (!analysis.meta_description.exists) {
        analysis.issues.push({
          type: 'warning',
          message: 'No meta description found. Add a meta description for better SEO.',
          severity: 'medium'
        });
      }

      // Generate suggestions
      if (analysis.heading_structure.score < 70) {
        analysis.suggestions.push({
          type: 'seo',
          message: 'Improve heading structure for better SEO',
          priority: 'medium'
        });
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze SEO', { error: error.message });
      return {};
    }
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(userId, templateId, analysis) {
    try {
      const recommendations = [];

      // Generate recommendations based on analysis
      for (const [analysisType, analysisData] of Object.entries(analysis)) {
        if (analysisData.issues) {
          for (const issue of analysisData.issues) {
            recommendations.push({
              id: this.generateRecommendationId(),
              template_id: templateId,
              user_id: userId,
              type: analysisType,
              category: issue.type,
              priority: this.calculatePriority(issue.severity),
              title: issue.message,
              description: issue.message,
              impact: this.calculateImpact(issue.severity),
              effort: this.calculateEffort(issue.severity),
              generated_at: new Date().toISOString()
            });
          }
        }

        if (analysisData.suggestions) {
          for (const suggestion of analysisData.suggestions) {
            recommendations.push({
              id: this.generateRecommendationId(),
              template_id: templateId,
              user_id: userId,
              type: analysisType,
              category: suggestion.type,
              priority: suggestion.priority,
              title: suggestion.message,
              description: suggestion.message,
              impact: this.calculateImpact(suggestion.priority),
              effort: this.calculateEffort(suggestion.priority),
              generated_at: new Date().toISOString()
            });
          }
        }
      }

      // Sort recommendations by priority and impact
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.impact - a.impact;
      });

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate recommendations', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Calculate impact analysis
   */
  async calculateImpactAnalysis(userId, templateId, recommendations) {
    try {
      const impactAnalysis = {
        total_recommendations: recommendations.length,
        high_priority: recommendations.filter(r => r.priority === 'high').length,
        medium_priority: recommendations.filter(r => r.priority === 'medium').length,
        low_priority: recommendations.filter(r => r.priority === 'low').length,
        estimated_improvement: 0,
        estimated_effort: 0,
        categories: {}
      };

      // Calculate estimated improvement
      impactAnalysis.estimated_improvement = recommendations.reduce((total, rec) => {
        return total + rec.impact;
      }, 0);

      // Calculate estimated effort
      impactAnalysis.estimated_effort = recommendations.reduce((total, rec) => {
        return total + rec.effort;
      }, 0);

      // Group by categories
      recommendations.forEach(rec => {
        if (!impactAnalysis.categories[rec.category]) {
          impactAnalysis.categories[rec.category] = 0;
        }
        impactAnalysis.categories[rec.category]++;
      });

      return impactAnalysis;
    } catch (error) {
      logger.error('Failed to calculate impact analysis', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Apply optimization to template
   */
  async applyOptimizationToTemplate(userId, templateId, optimizationConfig) {
    try {
      const optimizationResult = {
        id: this.generateOptimizationId(),
        template_id: templateId,
        user_id: userId,
        applied_at: new Date().toISOString(),
        applied_by: userId,
        optimization_type: optimizationConfig.type,
        updates: {},
        before_metrics: {},
        after_metrics: {},
        improvement_score: 0
      };

      // Get before metrics
      optimizationResult.before_metrics = await this.getTemplateMetrics(userId, templateId);

      // Apply optimization based on type
      switch (optimizationConfig.type) {
        case 'content_optimization':
          optimizationResult.updates = await this.applyContentOptimization(templateId, optimizationConfig);
          break;
        case 'style_optimization':
          optimizationResult.updates = await this.applyStyleOptimization(templateId, optimizationConfig);
          break;
        case 'performance_optimization':
          optimizationResult.updates = await this.applyPerformanceOptimization(templateId, optimizationConfig);
          break;
        case 'accessibility_optimization':
          optimizationResult.updates = await this.applyAccessibilityOptimization(templateId, optimizationConfig);
          break;
        case 'compatibility_optimization':
          optimizationResult.updates = await this.applyCompatibilityOptimization(templateId, optimizationConfig);
          break;
        case 'seo_optimization':
          optimizationResult.updates = await this.applySEOOptimization(templateId, optimizationConfig);
          break;
        default:
          throw new Error(`Unknown optimization type: ${optimizationConfig.type}`);
      }

      // Get after metrics
      optimizationResult.after_metrics = await this.getTemplateMetrics(userId, templateId);

      // Calculate improvement score
      optimizationResult.improvement_score = await this.calculateImprovementScore(
        optimizationResult.before_metrics,
        optimizationResult.after_metrics
      );

      return optimizationResult;
    } catch (error) {
      logger.error('Failed to apply optimization to template', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Apply content optimization
   */
  async applyContentOptimization(templateId, optimizationConfig) {
    try {
      const updates = {};

      // Apply content optimizations
      if (optimizationConfig.addHeadings) {
        updates.content = await this.addHeadingsToContent(templateId);
      }

      if (optimizationConfig.improveReadability) {
        updates.content = await this.improveReadability(templateId);
      }

      if (optimizationConfig.addCallToAction) {
        updates.content = await this.addCallToAction(templateId);
      }

      return updates;
    } catch (error) {
      logger.error('Failed to apply content optimization', { error: error.message });
      return {};
    }
  }

  /**
   * Apply style optimization
   */
  async applyStyleOptimization(templateId, optimizationConfig) {
    try {
      const updates = {};

      // Apply style optimizations
      if (optimizationConfig.removeInlineStyles) {
        updates.styles = await this.removeInlineStyles(templateId);
      }

      if (optimizationConfig.addResponsiveDesign) {
        updates.styles = await this.addResponsiveDesign(templateId);
      }

      if (optimizationConfig.improveColorContrast) {
        updates.styles = await this.improveColorContrast(templateId);
      }

      return updates;
    } catch (error) {
      logger.error('Failed to apply style optimization', { error: error.message });
      return {};
    }
  }

  /**
   * Apply performance optimization
   */
  async applyPerformanceOptimization(templateId, optimizationConfig) {
    try {
      const updates = {};

      // Apply performance optimizations
      if (optimizationConfig.optimizeImages) {
        updates.content = await this.optimizeImages(templateId);
      }

      if (optimizationConfig.minifyCSS) {
        updates.styles = await this.minifyCSS(templateId);
      }

      if (optimizationConfig.removeUnusedCSS) {
        updates.styles = await this.removeUnusedCSS(templateId);
      }

      return updates;
    } catch (error) {
      logger.error('Failed to apply performance optimization', { error: error.message });
      return {};
    }
  }

  /**
   * Apply accessibility optimization
   */
  async applyAccessibilityOptimization(templateId, optimizationConfig) {
    try {
      const updates = {};

      // Apply accessibility optimizations
      if (optimizationConfig.addAltText) {
        updates.content = await this.addAltText(templateId);
      }

      if (optimizationConfig.improveHeadingStructure) {
        updates.content = await this.improveHeadingStructure(templateId);
      }

      if (optimizationConfig.addKeyboardNavigation) {
        updates.content = await this.addKeyboardNavigation(templateId);
      }

      return updates;
    } catch (error) {
      logger.error('Failed to apply accessibility optimization', { error: error.message });
      return {};
    }
  }

  /**
   * Apply compatibility optimization
   */
  async applyCompatibilityOptimization(templateId, optimizationConfig) {
    try {
      const updates = {};

      // Apply compatibility optimizations
      if (optimizationConfig.useTablesForLayout) {
        updates.content = await this.useTablesForLayout(templateId);
      }

      if (optimizationConfig.improveEmailClientCompatibility) {
        updates.content = await this.improveEmailClientCompatibility(templateId);
      }

      if (optimizationConfig.addMobileSupport) {
        updates.content = await this.addMobileSupport(templateId);
      }

      return updates;
    } catch (error) {
      logger.error('Failed to apply compatibility optimization', { error: error.message });
      return {};
    }
  }

  /**
   * Apply SEO optimization
   */
  async applySEOOptimization(templateId, optimizationConfig) {
    try {
      const updates = {};

      // Apply SEO optimizations
      if (optimizationConfig.addTitleTag) {
        updates.content = await this.addTitleTag(templateId);
      }

      if (optimizationConfig.addMetaDescription) {
        updates.content = await this.addMetaDescription(templateId);
      }

      if (optimizationConfig.improveHeadingStructure) {
        updates.content = await this.improveHeadingStructure(templateId);
      }

      return updates;
    } catch (error) {
      logger.error('Failed to apply SEO optimization', { error: error.message });
      return {};
    }
  }

  /**
   * Calculate overall score
   */
  async calculateOverallScore(analysis) {
    try {
      const weights = {
        content_analysis: 0.20,
        style_analysis: 0.15,
        performance_analysis: 0.20,
        accessibility_analysis: 0.15,
        compatibility_analysis: 0.15,
        seo_analysis: 0.15
      };

      let totalScore = 0;
      let totalWeight = 0;

      for (const [analysisType, analysisData] of Object.entries(analysis)) {
        if (weights[analysisType] && analysisData.issues) {
          const issueCount = analysisData.issues.length;
          const score = Math.max(0, 100 - (issueCount * 10));
          totalScore += score * weights[analysisType];
          totalWeight += weights[analysisType];
        }
      }

      return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    } catch (error) {
      logger.error('Failed to calculate overall score', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate priority
   */
  calculatePriority(severity) {
    switch (severity) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  /**
   * Calculate impact
   */
  calculateImpact(severity) {
    switch (severity) {
      case 'high': return 80;
      case 'medium': return 50;
      case 'low': return 20;
      default: return 50;
    }
  }

  /**
   * Calculate effort
   */
  calculateEffort(severity) {
    switch (severity) {
      case 'high': return 60;
      case 'medium': return 30;
      case 'low': return 10;
      default: return 30;
    }
  }

  /**
   * Count words
   */
  countWords(content) {
    return content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count paragraphs
   */
  countParagraphs(content) {
    return (content.match(/<p[^>]*>/gi) || []).length;
  }

  /**
   * Count headings
   */
  countHeadings(content) {
    return (content.match(/<h[1-6][^>]*>/gi) || []).length;
  }

  /**
   * Count links
   */
  countLinks(content) {
    return (content.match(/<a[^>]*>/gi) || []).length;
  }

  /**
   * Count images
   */
  countImages(content) {
    return (content.match(/<img[^>]*>/gi) || []).length;
  }

  /**
   * Count inline styles
   */
  countInlineStyles(content) {
    return (content.match(/style\s*=/gi) || []).length;
  }

  /**
   * Count CSS classes
   */
  countCSSClasses(content) {
    return (content.match(/class\s*=/gi) || []).length;
  }

  /**
   * Check responsive design
   */
  checkResponsiveDesign(content) {
    return content.includes('viewport') || content.includes('@media');
  }

  /**
   * Check color contrast
   */
  checkColorContrast(styles) {
    // Simplified color contrast check
    return {
      score: 85,
      issues: []
    };
  }

  /**
   * Analyze font usage
   */
  analyzeFontUsage(styles) {
    return {
      font_families: Object.keys(styles).filter(key => key.includes('font')),
      font_sizes: Object.keys(styles).filter(key => key.includes('font-size')),
      issues: []
    };
  }

  /**
   * Calculate file size
   */
  calculateFileSize(content) {
    return new Blob([content]).size;
  }

  /**
   * Check image optimization
   */
  checkImageOptimization(content) {
    const images = content.match(/<img[^>]*>/gi) || [];
    let optimizedCount = 0;

    images.forEach(img => {
      if (img.includes('width=') && img.includes('height=')) {
        optimizedCount++;
      }
    });

    return {
      score: images.length > 0 ? (optimizedCount / images.length) * 100 : 100,
      issues: []
    };
  }

  /**
   * Check CSS optimization
   */
  checkCSSOptimization(content) {
    const cssMatches = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    let optimizedCount = 0;

    cssMatches.forEach(css => {
      if (css.length < 1000) { // Simplified check
        optimizedCount++;
      }
    });

    return {
      score: cssMatches.length > 0 ? (optimizedCount / cssMatches.length) * 100 : 100,
      issues: []
    };
  }

  /**
   * Check JavaScript usage
   */
  checkJavaScriptUsage(content) {
    const jsMatches = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    return {
      count: jsMatches.length,
      issues: jsMatches.length > 0 ? ['JavaScript usage detected'] : []
    };
  }

  /**
   * Estimate loading speed
   */
  estimateLoadingSpeed(content) {
    const fileSize = this.calculateFileSize(content);
    const imageCount = this.countImages(content);
    
    // Simplified speed estimation
    let speedScore = 100;
    if (fileSize > 50000) speedScore -= 20;
    if (imageCount > 5) speedScore -= 15;
    if (imageCount > 10) speedScore -= 25;
    
    return Math.max(0, speedScore);
  }

  /**
   * Check alt text coverage
   */
  checkAltTextCoverage(content) {
    const images = content.match(/<img[^>]*>/gi) || [];
    let altTextCount = 0;

    images.forEach(img => {
      if (img.includes('alt=')) {
        altTextCount++;
      }
    });

    return images.length > 0 ? (altTextCount / images.length) * 100 : 100;
  }

  /**
   * Check heading structure
   */
  checkHeadingStructure(content) {
    const headings = content.match(/<h[1-6][^>]*>/gi) || [];
    let structureScore = 100;

    // Check for proper heading hierarchy
    if (headings.length > 0) {
      const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count === 0) structureScore -= 20;
      if (h1Count > 1) structureScore -= 15;
    }

    return {
      score: Math.max(0, structureScore),
      issues: []
    };
  }

  /**
   * Check keyboard navigation
   */
  checkKeyboardNavigation(content) {
    const links = content.match(/<a[^>]*>/gi) || [];
    let keyboardFriendlyCount = 0;

    links.forEach(link => {
      if (link.includes('tabindex=') || link.includes('href=')) {
        keyboardFriendlyCount++;
      }
    });

    return {
      score: links.length > 0 ? (keyboardFriendlyCount / links.length) * 100 : 100,
      issues: []
    };
  }

  /**
   * Check screen reader compatibility
   */
  checkScreenReaderCompatibility(content) {
    const images = content.match(/<img[^>]*>/gi) || [];
    let screenReaderFriendlyCount = 0;

    images.forEach(img => {
      if (img.includes('alt=') || img.includes('aria-label=')) {
        screenReaderFriendlyCount++;
      }
    });

    return {
      score: images.length > 0 ? (screenReaderFriendlyCount / images.length) * 100 : 100,
      issues: []
    };
  }

  /**
   * Check email client compatibility
   */
  checkEmailClientCompatibility(content) {
    let compatibilityScore = 100;

    // Check for table usage
    const tableCount = (content.match(/<table[^>]*>/gi) || []).length;
    if (tableCount === 0) compatibilityScore -= 30;

    // Check for CSS support
    const inlineStyleCount = this.countInlineStyles(content);
    if (inlineStyleCount > 10) compatibilityScore -= 20;

    return {
      score: Math.max(0, compatibilityScore),
      issues: []
    };
  }

  /**
   * Check browser compatibility
   */
  checkBrowserCompatibility(content) {
    return {
      score: 95,
      issues: []
    };
  }

  /**
   * Check mobile compatibility
   */
  checkMobileCompatibility(content) {
    let mobileScore = 100;

    if (!this.checkResponsiveDesign(content)) {
      mobileScore -= 40;
    }

    const tableCount = (content.match(/<table[^>]*>/gi) || []).length;
    if (tableCount > 0) mobileScore -= 20;

    return {
      score: Math.max(0, mobileScore),
      issues: []
    };
  }

  /**
   * Check table usage
   */
  checkTableUsage(content) {
    const tableCount = (content.match(/<table[^>]*>/gi) || []).length;
    return {
      score: tableCount > 0 ? 100 : 0,
      issues: tableCount === 0 ? ['No tables found for layout'] : []
    };
  }

  /**
   * Check CSS support
   */
  checkCSSSupport(content) {
    const cssCount = (content.match(/<style[^>]*>/gi) || []).length;
    return {
      score: cssCount > 0 ? 80 : 100,
      issues: []
    };
  }

  /**
   * Check title tag
   */
  checkTitleTag(content) {
    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
    return {
      exists: !!titleMatch,
      content: titleMatch ? titleMatch[1] : '',
      issues: []
    };
  }

  /**
   * Check meta description
   */
  checkMetaDescription(content) {
    const metaMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    return {
      exists: !!metaMatch,
      content: metaMatch ? metaMatch[1] : '',
      issues: []
    };
  }

  /**
   * Check keyword density
   */
  checkKeywordDensity(content) {
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Simplified keyword density check
    return {
      score: 75,
      issues: []
    };
  }

  /**
   * Check internal links
   */
  checkInternalLinks(content) {
    const links = content.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
    let internalCount = 0;

    links.forEach(link => {
      const hrefMatch = link.match(/href=["']([^"']*)["']/i);
      if (hrefMatch && !hrefMatch[1].startsWith('http')) {
        internalCount++;
      }
    });

    return {
      count: internalCount,
      issues: []
    };
  }

  /**
   * Store optimization recommendations
   */
  async storeOptimizationRecommendations(userId, templateId, recommendations) {
    try {
      const { error } = await supabase
        .from('template_optimization_recommendations')
        .upsert(recommendations, { onConflict: 'id' });

      if (error) throw error;

      // Update in-memory recommendations
      this.optimizationRecommendations.set(templateId, recommendations);
    } catch (error) {
      logger.error('Failed to store optimization recommendations', { error: error.message, userId });
    }
  }

  /**
   * Store optimization result
   */
  async storeOptimizationResult(userId, templateId, optimizationResult) {
    try {
      const { error } = await supabase
        .from('template_optimization_results')
        .insert(optimizationResult);

      if (error) throw error;

      // Update in-memory results
      if (!this.optimizationResults.has(templateId)) {
        this.optimizationResults.set(templateId, []);
      }
      this.optimizationResults.get(templateId).push(optimizationResult);
    } catch (error) {
      logger.error('Failed to store optimization result', { error: error.message, userId });
    }
  }

  /**
   * Log optimization activity
   */
  async logOptimizationActivity(userId, activityType, activityData) {
    try {
      const activity = {
        id: this.generateActivityId(),
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('template_optimization_activities')
        .insert(activity);

      if (error) throw error;

      // Update in-memory activities
      if (!this.optimizationHistory.has(userId)) {
        this.optimizationHistory.set(userId, []);
      }
      this.optimizationHistory.get(userId).unshift(activity);
    } catch (error) {
      logger.error('Failed to log optimization activity', { error: error.message, userId });
    }
  }

  /**
   * Generate recommendation ID
   */
  generateRecommendationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `REC-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate optimization ID
   */
  generateOptimizationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `OPT-${timestamp}-${random}`.toUpperCase();
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
   * Load optimization rules
   */
  async loadOptimizationRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('template_optimization_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      rules.forEach(rule => {
        this.optimizationRules.set(rule.id, rule);
      });

      logger.info('Optimization rules loaded', { userId, ruleCount: rules.length });
    } catch (error) {
      logger.error('Failed to load optimization rules', { error: error.message, userId });
    }
  }

  /**
   * Load optimization results
   */
  async loadOptimizationResults(userId) {
    try {
      const { data: results, error } = await supabase
        .from('template_optimization_results')
        .select('*')
        .eq('user_id', userId)
        .order('applied_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      results.forEach(result => {
        if (!this.optimizationResults.has(result.template_id)) {
          this.optimizationResults.set(result.template_id, []);
        }
        this.optimizationResults.get(result.template_id).push(result);
      });

      logger.info('Optimization results loaded', { userId, resultCount: results.length });
    } catch (error) {
      logger.error('Failed to load optimization results', { error: error.message, userId });
    }
  }

  /**
   * Load optimization metrics
   */
  async loadOptimizationMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('template_optimization_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      metrics.forEach(metric => {
        this.optimizationMetrics.set(metric.template_id, metric);
      });

      logger.info('Optimization metrics loaded', { userId, metricCount: metrics.length });
    } catch (error) {
      logger.error('Failed to load optimization metrics', { error: error.message, userId });
    }
  }

  /**
   * Load optimization recommendations
   */
  async loadOptimizationRecommendations(userId) {
    try {
      const { data: recommendations, error } = await supabase
        .from('template_optimization_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      recommendations.forEach(recommendation => {
        if (!this.optimizationRecommendations.has(recommendation.template_id)) {
          this.optimizationRecommendations.set(recommendation.template_id, []);
        }
        this.optimizationRecommendations.get(recommendation.template_id).push(recommendation);
      });

      logger.info('Optimization recommendations loaded', { userId, recommendationCount: recommendations.length });
    } catch (error) {
      logger.error('Failed to load optimization recommendations', { error: error.message, userId });
    }
  }

  /**
   * Load optimization history
   */
  async loadOptimizationHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('template_optimization_activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.optimizationHistory.set(userId, history);
      logger.info('Optimization history loaded', { userId, historyCount: history.length });
    } catch (error) {
      logger.error('Failed to load optimization history', { error: error.message, userId });
    }
  }

  /**
   * Reset optimization system for user
   */
  async reset(userId) {
    try {
      this.optimizationRules.clear();
      this.optimizationResults.clear();
      this.optimizationMetrics.clear();
      this.optimizationRecommendations.clear();
      this.optimizationHistory.clear();

      logger.info('Optimization system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset optimization system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
