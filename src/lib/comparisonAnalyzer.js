/**
 * Comparison Analyzer for FloWorx
 * Analyzes AI-Human comparisons and extracts actionable insights
 */

import { supabase } from './customSupabaseClient.js';
import { openai } from './aiService.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class ComparisonAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.batchAnalysisSize = 20;
    this.insightCategories = [
      'tone_adjustments',
      'vocabulary_preferences',
      'structural_changes',
      'signature_phrases',
      'communication_patterns',
      'business_context'
    ];
  }

  /**
   * Analyze a single AI-Human comparison
   * @param {string} comparisonId - Comparison record ID
   * @param {Object} comparison - Comparison data
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeComparison(comparisonId, comparison) {
    try {
      // Check cache first
      const cacheKey = `comparison_${comparisonId}`;
      const cached = this.analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.info('Using cached analysis', { comparisonId });
        return cached.analysis;
      }

      logger.info('Analyzing AI-Human comparison', { 
        comparisonId, 
        userId: comparison.user_id,
        category: comparison.category 
      });

      // Perform deep analysis
      const analysis = await this.performDeepAnalysis(comparison);

      // Store analysis in cache
      this.analysisCache.set(cacheKey, {
        analysis,
        timestamp: Date.now()
      });

      // Store analysis in database
      await this.storeAnalysis(comparisonId, analysis);

      // Track analysis event
      analytics.trackBusinessEvent('comparison_analyzed', {
        comparisonId,
        userId: comparison.user_id,
        category: comparison.category,
        insightCount: analysis.insights.length,
        confidenceScore: analysis.confidenceScore
      });

      logger.info('Comparison analysis completed', { 
        comparisonId, 
        insightCount: analysis.insights.length,
        confidenceScore: analysis.confidenceScore
      });

      return analysis;

    } catch (error) {
      logger.error('Failed to analyze comparison', error, { comparisonId });
      return this.getFallbackAnalysis(comparison);
    }
  }

  /**
   * Perform deep analysis of AI-Human comparison
   * @param {Object} comparison - Comparison data
   * @returns {Promise<Object>} Analysis result
   */
  async performDeepAnalysis(comparison) {
    const { ai_draft, human_response, category } = comparison;

    // Create comprehensive analysis prompt
    const prompt = this.createDeepAnalysisPrompt(ai_draft, human_response, category);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysisText = response.choices[0].message.content;
      return this.parseDeepAnalysis(analysisText, comparison);

    } catch (error) {
      logger.error('OpenAI analysis failed', error, { comparisonId: comparison.id });
      return this.getFallbackAnalysis(comparison);
    }
  }

  /**
   * Create comprehensive analysis prompt
   * @param {string} aiDraft - AI-generated draft
   * @param {string} humanResponse - Human-edited response
   * @param {string} category - Communication category
   * @returns {string} Analysis prompt
   */
  createDeepAnalysisPrompt(aiDraft, humanResponse, category) {
    return `Perform a comprehensive analysis of the differences between this AI draft and human response:

AI DRAFT:
${aiDraft}

HUMAN RESPONSE:
${humanResponse}

CATEGORY: ${category}

Analyze the following dimensions in detail:

1. TONE & STYLE ANALYSIS:
   - Formality level changes (formal/casual/mixed)
   - Emotional tone adjustments (professional/friendly/direct/empathetic)
   - Personality expression changes
   - Professional vs. personal voice adjustments

2. VOCABULARY & LANGUAGE ANALYSIS:
   - Specific word substitutions and why they were made
   - Technical vs. layman terminology preferences
   - Industry-specific language usage
   - Jargon vs. plain language preferences
   - Active vs. passive voice preferences

3. STRUCTURAL & ORGANIZATIONAL ANALYSIS:
   - Paragraph structure changes
   - Information ordering preferences
   - Bullet points vs. paragraph preferences
   - Length adjustments and reasoning
   - Flow and transition improvements

4. CONTENT & MESSAGE ANALYSIS:
   - Information addition/removal patterns
   - Emphasis changes (what was highlighted/de-emphasized)
   - Call-to-action modifications
   - Question handling approaches
   - Problem-solving communication style

5. BUSINESS CONTEXT ANALYSIS:
   - Industry-specific communication patterns
   - Customer service approach preferences
   - Sales communication style
   - Technical support communication style
   - Relationship building approach

6. COMMUNICATION PATTERNS:
   - Opening/closing preferences
   - Signature phrases or expressions
   - Repetition patterns
   - Clarification approaches
   - Follow-up communication style

For each insight, provide:
- Specific examples from the text
- Confidence level (0-1)
- Business impact assessment
- Actionable recommendations

Return your analysis in this JSON format:
{
  "overallAnalysis": {
    "primaryChanges": ["change1", "change2", "change3"],
    "dominantPatterns": ["pattern1", "pattern2"],
    "communicationStyle": "description of overall style",
    "confidenceScore": 0.85
  },
  "toneAnalysis": {
    "formalityChange": "increased|decreased|same",
    "emotionalToneChange": "more_friendly|more_professional|more_direct|more_empathetic",
    "personalityExpression": "more_personal|more_professional|same",
    "examples": ["specific example 1", "specific example 2"],
    "confidence": 0.9
  },
  "vocabularyAnalysis": {
    "substitutions": [
      {
        "aiTerm": "original term",
        "humanTerm": "replacement term",
        "reason": "why the change was made",
        "confidence": 0.8
      }
    ],
    "languageLevel": "technical|layman|mixed",
    "voicePreference": "active|passive|mixed",
    "industryTerms": ["term1", "term2"],
    "confidence": 0.85
  },
  "structuralAnalysis": {
    "organizationChange": "chronological|priority|logical",
    "paragraphStyle": "short|medium|long",
    "formattingPreference": "bullet_points|paragraphs|mixed",
    "lengthAdjustment": "shortened|lengthened|same",
    "examples": ["structural example 1", "structural example 2"],
    "confidence": 0.8
  },
  "contentAnalysis": {
    "informationChanges": [
      {
        "type": "added|removed|modified",
        "content": "what was changed",
        "reason": "why it was changed",
        "impact": "business impact"
      }
    ],
    "emphasisChanges": ["what was emphasized", "what was de-emphasized"],
    "callToActionStyle": "direct|subtle|none",
    "confidence": 0.75
  },
  "businessContextAnalysis": {
    "industryPatterns": ["pattern1", "pattern2"],
    "customerServiceApproach": "proactive|reactive|consultative",
    "salesStyle": "direct|consultative|relationship_based",
    "technicalCommunication": "detailed|simplified|mixed",
    "confidence": 0.8
  },
  "communicationPatterns": {
    "openingStyle": "formal|casual|personal",
    "closingStyle": "professional|friendly|action_oriented",
    "signaturePhrases": ["phrase1", "phrase2"],
    "clarificationApproach": "direct|diplomatic|educational",
    "followUpStyle": "proactive|reactive|minimal",
    "confidence": 0.85
  },
  "insights": [
    {
      "category": "tone_adjustments|vocabulary_preferences|structural_changes|signature_phrases|communication_patterns|business_context",
      "insight": "specific actionable insight",
      "evidence": "evidence from the text",
      "confidence": 0.9,
      "actionableRecommendation": "specific recommendation for AI improvement",
      "businessImpact": "high|medium|low"
    }
  ],
  "actionableRecommendations": [
    {
      "recommendation": "specific recommendation",
      "category": "tone|vocabulary|structure|content|business",
      "priority": "high|medium|low",
      "implementation": "how to implement this recommendation"
    }
  ]
}`;
  }

  /**
   * Parse deep analysis response
   * @param {string} analysisText - Raw analysis text from OpenAI
   * @param {Object} comparison - Original comparison data
   * @returns {Object} Parsed analysis
   */
  parseDeepAnalysis(analysisText, comparison) {
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance analysis
      const enhancedAnalysis = this.enhanceAnalysis(analysis, comparison);
      
      return enhancedAnalysis;

    } catch (error) {
      logger.error('Failed to parse deep analysis', error);
      return this.getFallbackAnalysis(comparison);
    }
  }

  /**
   * Enhance analysis with additional processing
   * @param {Object} analysis - Parsed analysis
   * @param {Object} comparison - Original comparison data
   * @returns {Object} Enhanced analysis
   */
  enhanceAnalysis(analysis, comparison) {
    // Add metadata
    analysis.metadata = {
      analyzedAt: new Date().toISOString(),
      comparisonId: comparison.id,
      userId: comparison.user_id,
      category: comparison.category,
      similarityScore: comparison.similarity_score || 0
    };

    // Calculate overall confidence score
    analysis.overallConfidence = this.calculateOverallConfidence(analysis);

    // Categorize insights
    analysis.categorizedInsights = this.categorizeInsights(analysis.insights || []);

    // Generate learning priorities
    analysis.learningPriorities = this.generateLearningPriorities(analysis);

    // Add trend analysis if possible
    analysis.trendAnalysis = this.generateTrendAnalysis(analysis);

    return analysis;
  }

  /**
   * Calculate overall confidence score
   * @param {Object} analysis - Analysis data
   * @returns {number} Overall confidence score
   */
  calculateOverallConfidence(analysis) {
    const confidenceScores = [];
    
    // Collect confidence scores from different analysis sections
    if (analysis.toneAnalysis?.confidence) confidenceScores.push(analysis.toneAnalysis.confidence);
    if (analysis.vocabularyAnalysis?.confidence) confidenceScores.push(analysis.vocabularyAnalysis.confidence);
    if (analysis.structuralAnalysis?.confidence) confidenceScores.push(analysis.structuralAnalysis.confidence);
    if (analysis.contentAnalysis?.confidence) confidenceScores.push(analysis.contentAnalysis.confidence);
    if (analysis.businessContextAnalysis?.confidence) confidenceScores.push(analysis.businessContextAnalysis.confidence);
    if (analysis.communicationPatterns?.confidence) confidenceScores.push(analysis.communicationPatterns.confidence);
    
    // Add insight confidence scores
    if (analysis.insights) {
      analysis.insights.forEach(insight => {
        if (insight.confidence) confidenceScores.push(insight.confidence);
      });
    }

    // Calculate weighted average
    if (confidenceScores.length === 0) return 0.5;
    
    const sum = confidenceScores.reduce((acc, score) => acc + score, 0);
    return sum / confidenceScores.length;
  }

  /**
   * Categorize insights by type
   * @param {Array} insights - Array of insights
   * @returns {Object} Categorized insights
   */
  categorizeInsights(insights) {
    const categorized = {};
    
    this.insightCategories.forEach(category => {
      categorized[category] = insights.filter(insight => insight.category === category);
    });

    return categorized;
  }

  /**
   * Generate learning priorities
   * @param {Object} analysis - Analysis data
   * @returns {Array} Learning priorities
   */
  generateLearningPriorities(analysis) {
    const priorities = [];

    // High confidence insights get high priority
    if (analysis.insights) {
      analysis.insights.forEach(insight => {
        if (insight.confidence >= 0.8) {
          priorities.push({
            insight: insight.insight,
            priority: 'high',
            confidence: insight.confidence,
            category: insight.category
          });
        } else if (insight.confidence >= 0.6) {
          priorities.push({
            insight: insight.insight,
            priority: 'medium',
            confidence: insight.confidence,
            category: insight.category
          });
        }
      });
    }

    // Sort by confidence
    priorities.sort((a, b) => b.confidence - a.confidence);

    return priorities;
  }

  /**
   * Generate trend analysis
   * @param {Object} analysis - Analysis data
   * @returns {Object} Trend analysis
   */
  generateTrendAnalysis(analysis) {
    return {
      dominantPatterns: analysis.overallAnalysis?.dominantPatterns || [],
      styleConsistency: analysis.overallConfidence >= 0.7 ? 'high' : 'medium',
      learningPotential: analysis.overallConfidence >= 0.6 ? 'high' : 'medium',
      recommendationCount: analysis.actionableRecommendations?.length || 0
    };
  }

  /**
   * Get fallback analysis for failed cases
   * @param {Object} comparison - Comparison data
   * @returns {Object} Fallback analysis
   */
  getFallbackAnalysis(comparison) {
    return {
      overallAnalysis: {
        primaryChanges: ['Analysis pending manual review'],
        dominantPatterns: [],
        communicationStyle: 'Style analysis requires manual review',
        confidenceScore: 0.3
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        comparisonId: comparison.id,
        userId: comparison.user_id,
        category: comparison.category,
        fallback: true
      },
      overallConfidence: 0.3,
      insights: [{
        category: 'general',
        insight: 'Manual review required for this comparison',
        confidence: 0.3,
        actionableRecommendation: 'Review comparison manually for style insights',
        businessImpact: 'medium'
      }],
      categorizedInsights: {
        general: [{
          category: 'general',
          insight: 'Manual review required',
          confidence: 0.3,
          actionableRecommendation: 'Manual review needed',
          businessImpact: 'medium'
        }]
      },
      learningPriorities: [],
      trendAnalysis: {
        dominantPatterns: [],
        styleConsistency: 'unknown',
        learningPotential: 'low',
        recommendationCount: 0
      }
    };
  }

  /**
   * Store analysis in database
   * @param {string} comparisonId - Comparison record ID
   * @param {Object} analysis - Analysis results
   * @returns {Promise<void>}
   */
  async storeAnalysis(comparisonId, analysis) {
    try {
      const { error } = await supabase
        .from('ai_human_comparison')
        .update({
          deep_analysis: analysis,
          analyzed_at: new Date().toISOString(),
          analysis_confidence: analysis.overallConfidence
        })
        .eq('id', comparisonId);

      if (error) {
        throw new Error(`Failed to store analysis: ${error.message}`);
      }

      logger.info('Analysis stored successfully', { comparisonId });
    } catch (error) {
      logger.error('Failed to store analysis', error, { comparisonId });
      throw error;
    }
  }

  /**
   * Analyze multiple comparisons in batch
   * @param {Array} comparisons - Array of comparisons to analyze
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeBatchComparisons(comparisons) {
    logger.info('Starting batch analysis', { comparisonCount: comparisons.length });

    const results = [];
    const batchSize = this.batchAnalysisSize;

    for (let i = 0; i < comparisons.length; i += batchSize) {
      const batch = comparisons.slice(i, i + batchSize);
      
      logger.info('Processing analysis batch', { 
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length 
      });

      const batchPromises = batch.map(async (comparison) => {
        try {
          const analysis = await this.analyzeComparison(comparison.id, comparison);
          return { comparisonId: comparison.id, analysis, success: true };
        } catch (error) {
          logger.error('Batch analysis failed for comparison', error, { comparisonId: comparison.id });
          return { comparisonId: comparison.id, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error('Batch analysis promise failed', result.reason);
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < comparisons.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Batch analysis completed', { 
      totalProcessed: results.length,
      successCount,
      failureCount
    });

    return results;
  }

  /**
   * Get analysis statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Analysis statistics
   */
  async getAnalysisStatistics(userId = null) {
    try {
      let query = supabase
        .from('ai_human_comparison')
        .select('id, user_id, category, analyzed_at, analysis_confidence, deep_analysis');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get analysis statistics: ${error.message}`);
      }

      const stats = {
        totalComparisons: data.length,
        analyzedComparisons: data.filter(c => c.analyzed_at).length,
        averageConfidence: 0,
        categoryBreakdown: {},
        confidenceDistribution: {
          high: 0,
          medium: 0,
          low: 0
        },
        recentAnalyses: data
          .filter(c => c.analyzed_at)
          .sort((a, b) => new Date(b.analyzed_at) - new Date(a.analyzed_at))
          .slice(0, 10)
      };

      // Calculate averages and distributions
      const confidenceScores = data
        .filter(c => c.analysis_confidence)
        .map(c => c.analysis_confidence);

      if (confidenceScores.length > 0) {
        stats.averageConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

        confidenceScores.forEach(score => {
          if (score >= 0.8) stats.confidenceDistribution.high++;
          else if (score >= 0.6) stats.confidenceDistribution.medium++;
          else stats.confidenceDistribution.low++;
        });
      }

      // Category breakdown
      data.forEach(comparison => {
        if (!stats.categoryBreakdown[comparison.category]) {
          stats.categoryBreakdown[comparison.category] = {
            total: 0,
            analyzed: 0,
            averageConfidence: 0
          };
        }
        
        stats.categoryBreakdown[comparison.category].total++;
        
        if (comparison.analyzed_at) {
          stats.categoryBreakdown[comparison.category].analyzed++;
        }
      });

      // Calculate category average confidence
      Object.keys(stats.categoryBreakdown).forEach(category => {
        const categoryComparisons = data.filter(c => c.category === category && c.analysis_confidence);
        if (categoryComparisons.length > 0) {
          const avgConfidence = categoryComparisons.reduce((sum, c) => sum + c.analysis_confidence, 0) / categoryComparisons.length;
          stats.categoryBreakdown[category].averageConfidence = avgConfidence;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get analysis statistics', error, { userId });
      return {
        totalComparisons: 0,
        analyzedComparisons: 0,
        averageConfidence: 0,
        categoryBreakdown: {},
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        recentAnalyses: []
      };
    }
  }

  /**
   * Clear analysis cache
   * @returns {void}
   */
  clearCache() {
    this.analysisCache.clear();
    logger.info('Analysis cache cleared');
  }
}

// Export singleton instance
export const comparisonAnalyzer = new ComparisonAnalyzer();

export default ComparisonAnalyzer;
