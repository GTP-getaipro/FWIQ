/**
 * AI Personalization System
 * 
 * Handles AI response personalization based on user preferences,
 * behavior patterns, and contextual information.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AIPersonalization {
  constructor() {
    this.userProfiles = new Map();
    this.preferences = new Map();
    this.behaviorPatterns = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize personalization system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing AI Personalization', { userId });

      // Load user profile and preferences
      await this.loadUserProfile(userId);
      await this.loadUserPreferences(userId);
      await this.loadBehaviorPatterns(userId);

      this.isInitialized = true;
      logger.info('AI Personalization initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize AI Personalization', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get personalized settings for user
   */
  async getPersonalizedSettings(userId, context = {}) {
    try {
      const profile = this.userProfiles.get(userId) || {};
      const preferences = this.preferences.get(userId) || {};
      const behaviorPatterns = this.behaviorPatterns.get(userId) || {};

      // Determine personalization level
      const personalizationLevel = this.calculatePersonalizationLevel(profile, preferences, behaviorPatterns);

      // Get contextual preferences
      const contextualPreferences = this.getContextualPreferences(userId, context);

      // Generate personalized settings
      const personalizedSettings = {
        level: personalizationLevel,
        preferences: {
          ...preferences,
          ...contextualPreferences
        },
        behaviorPatterns,
        profile,
        context
      };

      return personalizedSettings;
    } catch (error) {
      logger.error('Failed to get personalized settings', { error: error.message, userId });
      return { level: 'basic', preferences: {}, behaviorPatterns: {}, profile: {}, context };
    }
  }

  /**
   * Personalize AI response
   */
  async personalizeResponse(userId, response, context = {}) {
    try {
      const personalizedSettings = await this.getPersonalizedSettings(userId, context);
      
      // Apply personalization based on level
      let personalizedResponse = { ...response };

      switch (personalizedSettings.level) {
        case 'high':
          personalizedResponse = await this.applyHighPersonalization(userId, response, personalizedSettings);
          break;
        case 'medium':
          personalizedResponse = await this.applyMediumPersonalization(userId, response, personalizedSettings);
          break;
        case 'basic':
        default:
          personalizedResponse = await this.applyBasicPersonalization(userId, response, personalizedSettings);
          break;
      }

      // Apply role-based personalization
      const profile = this.userProfiles.get(userId);
      if (profile) {
        personalizedResponse = await this.applyRoleBasedPersonalization(userId, personalizedResponse, profile);
      }

      // Update behavior patterns
      await this.updateBehaviorPatterns(userId, response, context);

      return {
        ...personalizedResponse,
        personalization: {
          level: personalizedSettings.level,
          applied: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to personalize response', { error: error.message, userId });
      return response;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const existingPreferences = this.preferences.get(userId) || {};
      const updatedPreferences = { ...existingPreferences, ...preferences };

      this.preferences.set(userId, updatedPreferences);

      // Save to database
      const { error } = await supabase
        .from('ai_user_preferences')
        .upsert({
          user_id: userId,
          preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      logger.info('User preferences updated', { userId, preferenceCount: Object.keys(updatedPreferences).length });

      return { success: true, preferences: updatedPreferences };
    } catch (error) {
      logger.error('Failed to update user preferences', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get personalization insights
   */
  async getInsights(userId) {
    try {
      const profile = this.userProfiles.get(userId) || {};
      const preferences = this.preferences.get(userId) || {};
      const behaviorPatterns = this.behaviorPatterns.get(userId) || {};

      const insights = {
        personalizationLevel: this.calculatePersonalizationLevel(profile, preferences, behaviorPatterns),
        topPreferences: this.getTopPreferences(preferences),
        behaviorInsights: this.getBehaviorInsights(behaviorPatterns),
        recommendations: this.getPersonalizationRecommendations(userId, profile, preferences, behaviorPatterns)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get personalization insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get personalization metrics
   */
  async getPersonalizationMetrics(userId) {
    try {
      const profile = this.userProfiles.get(userId) || {};
      const preferences = this.preferences.get(userId) || {};
      const behaviorPatterns = this.behaviorPatterns.get(userId) || {};

      const metrics = {
        personalizationLevel: this.calculatePersonalizationLevel(profile, preferences, behaviorPatterns),
        preferenceCount: Object.keys(preferences).length,
        behaviorPatternCount: Object.keys(behaviorPatterns).length,
        profileCompleteness: this.calculateProfileCompleteness(profile),
        personalizationScore: this.calculatePersonalizationScore(profile, preferences, behaviorPatterns)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get personalization metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load user profile
   */
  async loadUserProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('ai_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (profile) {
        this.userProfiles.set(userId, profile);
      } else {
        // Create default profile
        const defaultProfile = {
          user_id: userId,
          name: '',
          role: '',
          industry: '',
          experience_level: 'beginner',
          communication_style: 'professional',
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.userProfiles.set(userId, defaultProfile);
      }
    } catch (error) {
      logger.error('Failed to load user profile', { error: error.message, userId });
    }
  }

  /**
   * Load user preferences
   */
  async loadUserPreferences(userId) {
    try {
      const { data: preferences, error } = await supabase
        .from('ai_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (preferences) {
        this.preferences.set(userId, preferences.preferences || {});
      } else {
        this.preferences.set(userId, {});
      }
    } catch (error) {
      logger.error('Failed to load user preferences', { error: error.message, userId });
    }
  }

  /**
   * Load behavior patterns
   */
  async loadBehaviorPatterns(userId) {
    try {
      const { data: patterns, error } = await supabase
        .from('ai_behavior_patterns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const behaviorPatterns = this.analyzeBehaviorPatterns(patterns);
      this.behaviorPatterns.set(userId, behaviorPatterns);
    } catch (error) {
      logger.error('Failed to load behavior patterns', { error: error.message, userId });
    }
  }

  /**
   * Calculate personalization level
   */
  calculatePersonalizationLevel(profile, preferences, behaviorPatterns) {
    let score = 0;

    // Role-based personalization boost
    if (profile.role === 'Premium') {
      score += 20; // Premium users get 20-point boost for enhanced personalization
    } else if (profile.role === 'Standard') {
      score += 5;  // Standard users get minimal boost
    }

    // Profile completeness (0-40 points)
    score += this.calculateProfileCompleteness(profile) * 0.4;

    // Preferences richness (0-30 points)
    score += Math.min(Object.keys(preferences).length / 10, 1) * 30;

    // Behavior pattern depth (0-30 points)
    score += Math.min(Object.keys(behaviorPatterns).length / 5, 1) * 30;

    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'basic';
  }

  /**
   * Calculate profile completeness
   */
  calculateProfileCompleteness(profile) {
    const requiredFields = ['name', 'role', 'industry', 'experience_level', 'communication_style'];
    const completedFields = requiredFields.filter(field => profile[field] && profile[field].trim() !== '');
    return completedFields.length / requiredFields.length;
  }

  /**
   * Calculate personalization score
   */
  calculatePersonalizationScore(profile, preferences, behaviorPatterns) {
    const profileScore = this.calculateProfileCompleteness(profile) * 100;
    const preferenceScore = Math.min(Object.keys(preferences).length * 5, 100);
    const behaviorScore = Math.min(Object.keys(behaviorPatterns).length * 10, 100);

    return Math.round((profileScore + preferenceScore + behaviorScore) / 3);
  }

  /**
   * Get contextual preferences
   */
  getContextualPreferences(userId, context) {
    const preferences = this.preferences.get(userId) || {};
    const contextualPreferences = {};

    // Time-based preferences
    const hour = new Date().getHours();
    if (hour < 9 || hour > 17) {
      contextualPreferences.tone = 'casual';
    } else {
      contextualPreferences.tone = 'professional';
    }

    // Context-based preferences
    if (context.type === 'support') {
      contextualPreferences.detail_level = 'high';
      contextualPreferences.examples = true;
    } else if (context.type === 'quick_question') {
      contextualPreferences.detail_level = 'low';
      contextualPreferences.examples = false;
    }

    return contextualPreferences;
  }

  /**
   * Apply high personalization
   */
  async applyHighPersonalization(userId, response, settings) {
    const personalizedResponse = { ...response };

    // Apply advanced personalization
    if (settings.preferences.tone) {
      personalizedResponse.tone = settings.preferences.tone;
    }

    if (settings.preferences.detail_level) {
      personalizedResponse.detailLevel = settings.preferences.detail_level;
    }

    if (settings.preferences.examples) {
      personalizedResponse.includeExamples = true;
    }

    // Apply behavior-based personalization
    if (settings.behaviorPatterns.preferred_length) {
      personalizedResponse.targetLength = settings.behaviorPatterns.preferred_length;
    }

    return personalizedResponse;
  }

  /**
   * Apply medium personalization
   */
  async applyMediumPersonalization(userId, response, settings) {
    const personalizedResponse = { ...response };

    // Apply moderate personalization
    if (settings.preferences.tone) {
      personalizedResponse.tone = settings.preferences.tone;
    }

    if (settings.preferences.detail_level) {
      personalizedResponse.detailLevel = settings.preferences.detail_level;
    }

    return personalizedResponse;
  }

  /**
   * Apply basic personalization
   */
  async applyBasicPersonalization(userId, response, settings) {
    const personalizedResponse = { ...response };

    // Apply minimal personalization
    if (settings.preferences.tone) {
      personalizedResponse.tone = settings.preferences.tone;
    }

    return personalizedResponse;
  }

  /**
   * Apply role-based personalization
   */
  async applyRoleBasedPersonalization(userId, response, profile) {
    if (profile.role === 'Premium') {
      return await this.applyPremiumPersonalization(userId, response);
    } else if (profile.role === 'Standard') {
      return await this.applyStandardPersonalization(userId, response);
    }
    return response;
  }

  /**
   * Apply Premium user personalization
   */
  async applyPremiumPersonalization(userId, response) {
    const personalizedResponse = { ...response };
    
    // Enhanced features for Premium users
    personalizedResponse.enhancedFeatures = true;
    personalizedResponse.prioritySupport = true;
    personalizedResponse.advancedAnalytics = true;
    personalizedResponse.detailedInsights = true;
    
    // More detailed and comprehensive responses
    if (personalizedResponse.content) {
      personalizedResponse.content = personalizedResponse.content + 
        '\n\n[Premium Feature: Enhanced insights and priority support available]';
    }
    
    return personalizedResponse;
  }

  /**
   * Apply Standard user personalization
   */
  async applyStandardPersonalization(userId, response) {
    const personalizedResponse = { ...response };
    
    // Basic features for Standard users
    personalizedResponse.enhancedFeatures = false;
    personalizedResponse.prioritySupport = false;
    personalizedResponse.advancedAnalytics = false;
    personalizedResponse.detailedInsights = false;
    
    // Standard responses without premium features
    return personalizedResponse;
  }

  /**
   * Update behavior patterns
   */
  async updateBehaviorPatterns(userId, response, context) {
    try {
      const behaviorData = {
        user_id: userId,
        interaction_type: context.type || 'general',
        response_length: response.content?.length || 0,
        response_time: response.performance?.responseTime || 0,
        satisfaction_score: context.satisfaction || null,
        context: context,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ai_behavior_patterns')
        .insert(behaviorData);

      if (error) throw error;

      // Update in-memory patterns
      const patterns = this.behaviorPatterns.get(userId) || {};
      patterns[behaviorData.interaction_type] = patterns[behaviorData.interaction_type] || [];
      patterns[behaviorData.interaction_type].push(behaviorData);

      this.behaviorPatterns.set(userId, patterns);
    } catch (error) {
      logger.error('Failed to update behavior patterns', { error: error.message, userId });
    }
  }

  /**
   * Analyze behavior patterns
   */
  analyzeBehaviorPatterns(patterns) {
    const analysis = {};

    patterns.forEach(pattern => {
      const type = pattern.interaction_type;
      if (!analysis[type]) {
        analysis[type] = {
          count: 0,
          avgResponseLength: 0,
          avgResponseTime: 0,
          avgSatisfaction: 0,
          preferredLength: 'medium',
          preferredTime: 'normal'
        };
      }

      analysis[type].count++;
      analysis[type].avgResponseLength += pattern.response_length;
      analysis[type].avgResponseTime += pattern.response_time;
      if (pattern.satisfaction_score) {
        analysis[type].avgSatisfaction += pattern.satisfaction_score;
      }
    });

    // Calculate averages and preferences
    Object.keys(analysis).forEach(type => {
      const data = analysis[type];
      data.avgResponseLength = Math.round(data.avgResponseLength / data.count);
      data.avgResponseTime = Math.round(data.avgResponseTime / data.count);
      data.avgSatisfaction = data.avgSatisfaction / data.count;

      // Determine preferences
      if (data.avgResponseLength < 100) data.preferredLength = 'short';
      else if (data.avgResponseLength > 500) data.preferredLength = 'long';
      else data.preferredLength = 'medium';

      if (data.avgResponseTime < 1000) data.preferredTime = 'fast';
      else if (data.avgResponseTime > 5000) data.preferredTime = 'slow';
      else data.preferredTime = 'normal';
    });

    return analysis;
  }

  /**
   * Get top preferences
   */
  getTopPreferences(preferences) {
    return Object.entries(preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([key, value]) => ({ key, value }));
  }

  /**
   * Get behavior insights
   */
  getBehaviorInsights(behaviorPatterns) {
    const insights = [];

    Object.entries(behaviorPatterns).forEach(([type, data]) => {
      insights.push({
        type,
        count: data.count,
        avgSatisfaction: data.avgSatisfaction,
        preferredLength: data.preferredLength,
        preferredTime: data.preferredTime
      });
    });

    return insights;
  }

  /**
   * Get personalization recommendations
   */
  getPersonalizationRecommendations(userId, profile, preferences, behaviorPatterns) {
    const recommendations = [];

    // Profile completion recommendations
    if (this.calculateProfileCompleteness(profile) < 0.8) {
      recommendations.push({
        type: 'profile_completion',
        message: 'Complete your profile to improve personalization',
        priority: 'high'
      });
    }

    // Preference recommendations
    if (Object.keys(preferences).length < 5) {
      recommendations.push({
        type: 'preferences',
        message: 'Set more preferences for better personalization',
        priority: 'medium'
      });
    }

    // Behavior pattern recommendations
    if (Object.keys(behaviorPatterns).length < 3) {
      recommendations.push({
        type: 'behavior_patterns',
        message: 'More interactions will improve personalization',
        priority: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Reset personalization for user
   */
  async reset(userId) {
    try {
      this.userProfiles.delete(userId);
      this.preferences.delete(userId);
      this.behaviorPatterns.delete(userId);

      logger.info('Personalization reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset personalization', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
