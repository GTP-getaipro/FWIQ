/**
 * AI Learning and Adaptation Engine
 * 
 * Handles AI learning from user interactions, adaptation to user preferences,
 * and continuous improvement of AI responses.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AILearning {
  constructor() {
    this.learningData = new Map();
    this.adaptationModels = new Map();
    this.insights = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize learning system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing AI Learning', { userId });

      // Load existing learning data
      await this.loadLearningData(userId);
      await this.loadAdaptationModels(userId);
      await this.loadInsights(userId);

      this.isInitialized = true;
      logger.info('AI Learning initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize AI Learning', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Record user interaction for learning
   */
  async recordInteraction(userId, prompt, response, context = {}) {
    try {
      const interaction = {
        user_id: userId,
        prompt: prompt,
        response: response,
        context: context,
        timestamp: new Date().toISOString(),
        satisfaction_score: context.satisfaction || null,
        feedback: context.feedback || null
      };

      // Store interaction
      const { error } = await supabase
        .from('ai_interactions')
        .insert(interaction);

      if (error) throw error;

      // Update learning data
      await this.updateLearningData(userId, interaction);

      // Generate insights
      await this.generateInsights(userId, interaction);

      logger.info('Interaction recorded for learning', { userId, interactionId: interaction.id });

      return { success: true, interaction };
    } catch (error) {
      logger.error('Failed to record interaction', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process interaction for learning
   */
  async processInteraction(userId, interaction) {
    try {
      // Analyze interaction patterns
      const patterns = await this.analyzeInteractionPatterns(userId, interaction);

      // Update adaptation models
      await this.updateAdaptationModels(userId, interaction, patterns);

      // Generate learning insights
      const insights = await this.generateLearningInsights(userId, interaction, patterns);

      return {
        success: true,
        patterns,
        insights,
        adaptationUpdated: true
      };
    } catch (error) {
      logger.error('Failed to process interaction', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get learning insights for user
   */
  async getLearningInsights(userId, prompt, context = {}) {
    try {
      const userInsights = this.insights.get(userId) || {};
      const adaptationModels = this.adaptationModels.get(userId) || {};

      // Get contextual insights
      const contextualInsights = this.getContextualInsights(userId, prompt, context);

      // Get pattern-based insights
      const patternInsights = this.getPatternInsights(userId, prompt, context);

      // Get adaptation insights
      const adaptationInsights = this.getAdaptationInsights(userId, adaptationModels);

      const insights = {
        contextual: contextualInsights,
        patterns: patternInsights,
        adaptation: adaptationInsights,
        count: Object.keys(userInsights).length,
        lastUpdated: userInsights.lastUpdated || null
      };

      return insights;
    } catch (error) {
      logger.error('Failed to get learning insights', { error: error.message, userId });
      return { count: 0, contextual: {}, patterns: {}, adaptation: {} };
    }
  }

  /**
   * Get learning metrics
   */
  async getLearningMetrics(userId) {
    try {
      const learningData = this.learningData.get(userId) || [];
      const adaptationModels = this.adaptationModels.get(userId) || {};
      const insights = this.insights.get(userId) || {};

      const metrics = {
        totalInteractions: learningData.length,
        avgSatisfactionScore: this.calculateAvgSatisfactionScore(learningData),
        learningProgress: this.calculateLearningProgress(learningData),
        adaptationLevel: this.calculateAdaptationLevel(adaptationModels),
        insightCount: Object.keys(insights).length,
        lastInteraction: learningData.length > 0 ? learningData[0].timestamp : null
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get learning metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get insights
   */
  async getInsights(userId) {
    try {
      const userInsights = this.insights.get(userId) || {};
      const learningData = this.learningData.get(userId) || [];
      const adaptationModels = this.adaptationModels.get(userId) || {};

      const insights = {
        userInsights,
        learningTrends: this.analyzeLearningTrends(learningData),
        adaptationInsights: this.getAdaptationInsights(userId, adaptationModels),
        recommendations: this.getLearningRecommendations(userId, learningData, adaptationModels)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load learning data
   */
  async loadLearningData(userId) {
    try {
      const { data: interactions, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.learningData.set(userId, interactions || []);
      logger.info('Learning data loaded', { userId, interactionCount: interactions?.length || 0 });
    } catch (error) {
      logger.error('Failed to load learning data', { error: error.message, userId });
    }
  }

  /**
   * Load adaptation models
   */
  async loadAdaptationModels(userId) {
    try {
      const { data: models, error } = await supabase
        .from('ai_adaptation_models')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const modelMap = {};
      models.forEach(model => {
        modelMap[model.model_type] = model;
      });

      this.adaptationModels.set(userId, modelMap);
      logger.info('Adaptation models loaded', { userId, modelCount: models.length });
    } catch (error) {
      logger.error('Failed to load adaptation models', { error: error.message, userId });
    }
  }

  /**
   * Load insights
   */
  async loadInsights(userId) {
    try {
      const { data: insights, error } = await supabase
        .from('ai_learning_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const insightMap = {};
      insights.forEach(insight => {
        insightMap[insight.insight_type] = insight;
      });

      this.insights.set(userId, insightMap);
      logger.info('Insights loaded', { userId, insightCount: insights.length });
    } catch (error) {
      logger.error('Failed to load insights', { error: error.message, userId });
    }
  }

  /**
   * Update learning data
   */
  async updateLearningData(userId, interaction) {
    try {
      const learningData = this.learningData.get(userId) || [];
      learningData.unshift(interaction);

      // Keep only last 1000 interactions
      if (learningData.length > 1000) {
        learningData.splice(1000);
      }

      this.learningData.set(userId, learningData);
    } catch (error) {
      logger.error('Failed to update learning data', { error: error.message, userId });
    }
  }

  /**
   * Generate insights
   */
  async generateInsights(userId, interaction) {
    try {
      const learningData = this.learningData.get(userId) || [];
      
      // Generate various types of insights
      const insights = {
        satisfaction_trend: this.analyzeSatisfactionTrend(learningData),
        response_patterns: this.analyzeResponsePatterns(learningData),
        context_preferences: this.analyzeContextPreferences(learningData),
        improvement_areas: this.identifyImprovementAreas(learningData),
        lastUpdated: new Date().toISOString()
      };

      // Store insights
      const { error } = await supabase
        .from('ai_learning_insights')
        .upsert({
          user_id: userId,
          insight_type: 'comprehensive',
          insights: insights,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      this.insights.set(userId, { ...this.insights.get(userId), comprehensive: insights });
    } catch (error) {
      logger.error('Failed to generate insights', { error: error.message, userId });
    }
  }

  /**
   * Analyze interaction patterns
   */
  async analyzeInteractionPatterns(userId, interaction) {
    const patterns = {
      prompt_length: interaction.prompt?.length || 0,
      response_length: interaction.response?.content?.length || 0,
      response_time: interaction.response?.performance?.responseTime || 0,
      satisfaction_score: interaction.satisfaction_score,
      context_type: interaction.context?.type || 'general',
      feedback_type: interaction.feedback?.type || null
    };

    return patterns;
  }

  /**
   * Update adaptation models
   */
  async updateAdaptationModels(userId, interaction, patterns) {
    try {
      const adaptationModels = this.adaptationModels.get(userId) || {};
      
      // Update response length model
      if (!adaptationModels.response_length) {
        adaptationModels.response_length = {
          user_id: userId,
          model_type: 'response_length',
          preferences: {},
          accuracy: 0,
          last_updated: new Date().toISOString()
        };
      }

      // Update satisfaction model
      if (!adaptationModels.satisfaction) {
        adaptationModels.satisfaction = {
          user_id: userId,
          model_type: 'satisfaction',
          preferences: {},
          accuracy: 0,
          last_updated: new Date().toISOString()
        };
      }

      // Update context model
      if (!adaptationModels.context) {
        adaptationModels.context = {
          user_id: userId,
          model_type: 'context',
          preferences: {},
          accuracy: 0,
          last_updated: new Date().toISOString()
        };
      }

      // Update models based on interaction
      this.updateResponseLengthModel(adaptationModels.response_length, patterns);
      this.updateSatisfactionModel(adaptationModels.satisfaction, patterns);
      this.updateContextModel(adaptationModels.context, patterns);

      // Save updated models
      const { error } = await supabase
        .from('ai_adaptation_models')
        .upsert(Object.values(adaptationModels));

      if (error) throw error;

      this.adaptationModels.set(userId, adaptationModels);
    } catch (error) {
      logger.error('Failed to update adaptation models', { error: error.message, userId });
    }
  }

  /**
   * Generate learning insights
   */
  async generateLearningInsights(userId, interaction, patterns) {
    const insights = {
      interaction_quality: this.assessInteractionQuality(interaction),
      learning_opportunities: this.identifyLearningOpportunities(interaction, patterns),
      adaptation_suggestions: this.generateAdaptationSuggestions(patterns),
      performance_indicators: this.calculatePerformanceIndicators(interaction)
    };

    return insights;
  }

  /**
   * Get contextual insights
   */
  getContextualInsights(userId, prompt, context) {
    const learningData = this.learningData.get(userId) || [];
    
    return {
      similar_interactions: this.findSimilarInteractions(learningData, prompt, context),
      context_preferences: this.getContextPreferences(learningData, context),
      success_patterns: this.identifySuccessPatterns(learningData, context)
    };
  }

  /**
   * Get pattern insights
   */
  getPatternInsights(userId, prompt, context) {
    const learningData = this.learningData.get(userId) || [];
    
    return {
      prompt_patterns: this.analyzePromptPatterns(learningData, prompt),
      response_patterns: this.analyzeResponsePatterns(learningData),
      satisfaction_patterns: this.analyzeSatisfactionPatterns(learningData)
    };
  }

  /**
   * Get adaptation insights
   */
  getAdaptationInsights(userId, adaptationModels) {
    return {
      model_performance: this.calculateModelPerformance(adaptationModels),
      adaptation_level: this.calculateAdaptationLevel(adaptationModels),
      improvement_suggestions: this.generateImprovementSuggestions(adaptationModels)
    };
  }

  /**
   * Calculate average satisfaction score
   */
  calculateAvgSatisfactionScore(learningData) {
    const scores = learningData
      .filter(interaction => interaction.satisfaction_score !== null)
      .map(interaction => interaction.satisfaction_score);

    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Calculate learning progress
   */
  calculateLearningProgress(learningData) {
    if (learningData.length < 10) return 0;

    const recentScores = learningData
      .slice(0, 10)
      .filter(interaction => interaction.satisfaction_score !== null)
      .map(interaction => interaction.satisfaction_score);

    const olderScores = learningData
      .slice(10, 20)
      .filter(interaction => interaction.satisfaction_score !== null)
      .map(interaction => interaction.satisfaction_score);

    if (recentScores.length === 0 || olderScores.length === 0) return 0;

    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;

    return Math.max(0, (recentAvg - olderAvg) * 100);
  }

  /**
   * Calculate adaptation level
   */
  calculateAdaptationLevel(adaptationModels) {
    const models = Object.values(adaptationModels);
    if (models.length === 0) return 0;

    const avgAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0) / models.length;
    return Math.round(avgAccuracy * 100);
  }

  /**
   * Analyze learning trends
   */
  analyzeLearningTrends(learningData) {
    if (learningData.length < 5) return { trend: 'insufficient_data' };

    const recentScores = learningData
      .slice(0, 5)
      .filter(interaction => interaction.satisfaction_score !== null)
      .map(interaction => interaction.satisfaction_score);

    if (recentScores.length < 3) return { trend: 'insufficient_data' };

    const avgScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    
    let trend = 'stable';
    if (avgScore > 4) trend = 'improving';
    else if (avgScore < 3) trend = 'declining';

    return { trend, avgScore, dataPoints: recentScores.length };
  }

  /**
   * Get learning recommendations
   */
  getLearningRecommendations(userId, learningData, adaptationModels) {
    const recommendations = [];

    // Data quantity recommendations
    if (learningData.length < 10) {
      recommendations.push({
        type: 'data_quantity',
        message: 'More interactions needed for better learning',
        priority: 'high'
      });
    }

    // Satisfaction recommendations
    const avgSatisfaction = this.calculateAvgSatisfactionScore(learningData);
    if (avgSatisfaction < 3) {
      recommendations.push({
        type: 'satisfaction',
        message: 'Focus on improving response quality',
        priority: 'high'
      });
    }

    // Adaptation recommendations
    const adaptationLevel = this.calculateAdaptationLevel(adaptationModels);
    if (adaptationLevel < 50) {
      recommendations.push({
        type: 'adaptation',
        message: 'Increase interaction diversity for better adaptation',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Update response length model
   */
  updateResponseLengthModel(model, patterns) {
    const responseLength = patterns.response_length;
    const satisfaction = patterns.satisfaction_score;

    if (satisfaction !== null) {
      if (!model.preferences.length_preferences) {
        model.preferences.length_preferences = { short: 0, medium: 0, long: 0 };
      }

      if (responseLength < 100) model.preferences.length_preferences.short += satisfaction;
      else if (responseLength < 500) model.preferences.length_preferences.medium += satisfaction;
      else model.preferences.length_preferences.long += satisfaction;

      model.accuracy = this.calculateModelAccuracy(model.preferences.length_preferences);
      model.last_updated = new Date().toISOString();
    }
  }

  /**
   * Update satisfaction model
   */
  updateSatisfactionModel(model, patterns) {
    const satisfaction = patterns.satisfaction_score;
    const responseTime = patterns.response_time;

    if (satisfaction !== null) {
      if (!model.preferences.time_preferences) {
        model.preferences.time_preferences = { fast: 0, normal: 0, slow: 0 };
      }

      if (responseTime < 1000) model.preferences.time_preferences.fast += satisfaction;
      else if (responseTime < 5000) model.preferences.time_preferences.normal += satisfaction;
      else model.preferences.time_preferences.slow += satisfaction;

      model.accuracy = this.calculateModelAccuracy(model.preferences.time_preferences);
      model.last_updated = new Date().toISOString();
    }
  }

  /**
   * Update context model
   */
  updateContextModel(model, patterns) {
    const satisfaction = patterns.satisfaction_score;
    const contextType = patterns.context_type;

    if (satisfaction !== null) {
      if (!model.preferences.context_preferences) {
        model.preferences.context_preferences = {};
      }

      if (!model.preferences.context_preferences[contextType]) {
        model.preferences.context_preferences[contextType] = 0;
      }

      model.preferences.context_preferences[contextType] += satisfaction;
      model.accuracy = this.calculateModelAccuracy(model.preferences.context_preferences);
      model.last_updated = new Date().toISOString();
    }
  }

  /**
   * Calculate model accuracy
   */
  calculateModelAccuracy(preferences) {
    const values = Object.values(preferences);
    if (values.length === 0) return 0;

    const max = Math.max(...values);
    const sum = values.reduce((sum, val) => sum + val, 0);
    
    return sum > 0 ? max / sum : 0;
  }

  /**
   * Reset learning for user
   */
  async reset(userId) {
    try {
      this.learningData.delete(userId);
      this.adaptationModels.delete(userId);
      this.insights.delete(userId);

      logger.info('Learning reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset learning', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
