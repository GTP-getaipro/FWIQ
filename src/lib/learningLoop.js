/**
 * Communication Learning Loop for FloWorx
 * Learns from human edits and corrections to improve AI responses
 */

import { supabase } from './customSupabaseClient.js';
import { openai } from './aiService.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class CommunicationLearningLoop {
  constructor() {
    this.learningThreshold = 0.7; // Minimum confidence threshold for applying learnings
    this.maxLearningHistory = 100; // Maximum number of comparisons to analyze
    this.learningCategories = {
      'customer_inquiry': 'Customer Service',
      'technical_support': 'Technical Support',
      'sales_inquiry': 'Sales',
      'billing_question': 'Billing',
      'general_inquiry': 'General Communication'
    };
  }

  /**
   * Record AI-Human comparison for learning
   * @param {string} userId - User ID
   * @param {string} emailId - Email/Message ID
   * @param {string} aiDraft - AI-generated draft
   * @param {string} humanResponse - Human-edited response
   * @param {string} category - Communication category
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Learning result
   */
  async recordAIHumanComparison(userId, emailId, aiDraft, humanResponse, category, metadata = {}) {
    try {
      logger.info('Recording AI-Human comparison for learning', { 
        userId, 
        emailId, 
        category 
      });

      // Validate inputs
      if (!userId || !emailId || !aiDraft || !humanResponse || !category) {
        throw new Error('Missing required parameters for AI-Human comparison');
      }

      // Calculate similarity to determine if this is a meaningful comparison
      const similarity = await this.calculateSimilarity(aiDraft, humanResponse);
      
      if (similarity > 0.95) {
        logger.info('AI and human responses too similar, skipping learning', { 
          userId, 
          emailId, 
          similarity 
        });
        return { 
          success: true, 
          skipped: true, 
          reason: 'Responses too similar' 
        };
      }

      // Store the comparison
      const { data, error } = await supabase
        .from('ai_human_comparison')
        .insert({
          user_id: userId,
          email_id: emailId,
          category: category,
          ai_draft: aiDraft,
          human_response: humanResponse,
          similarity_score: similarity,
          metadata: metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store AI-Human comparison: ${error.message}`);
      }

      // Analyze the differences and update style profile
      const analysisResult = await this.analyzeAndUpdateStyle(
        userId, 
        aiDraft, 
        humanResponse, 
        category,
        data.id
      );

      // Track learning event
      analytics.trackBusinessEvent('ai_human_comparison_recorded', {
        userId,
        emailId,
        category,
        similarity,
        analysisResult: analysisResult.success
      });

      logger.info('AI-Human comparison recorded successfully', { 
        userId, 
        emailId, 
        category,
        similarity,
        analysisId: data.id
      });

      return {
        success: true,
        comparisonId: data.id,
        similarity,
        analysisResult
      };

    } catch (error) {
      logger.error('Failed to record AI-Human comparison', error, { 
        userId, 
        emailId, 
        category 
      });

      analytics.trackError(error, {
        operation: 'record_ai_human_comparison',
        userId,
        emailId,
        category
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze differences between AI draft and human response
   * @param {string} userId - User ID
   * @param {string} aiDraft - AI-generated draft
   * @param {string} humanResponse - Human-edited response
   * @param {string} category - Communication category
   * @param {string} comparisonId - Comparison record ID
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeAndUpdateStyle(userId, aiDraft, humanResponse, category, comparisonId) {
    try {
      logger.info('Analyzing style differences', { 
        userId, 
        category, 
        comparisonId 
      });

      // Create analysis prompt
      const prompt = this.createAnalysisPrompt(aiDraft, humanResponse, category);

      // Get AI analysis
      const analysisResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysisText = analysisResponse.choices[0].message.content;
      const analysis = this.parseAnalysisResponse(analysisText);

      // Store analysis
      await this.storeAnalysis(comparisonId, analysis);

      // Update style profile with new learnings
      const updateResult = await this.updateStyleProfile(userId, analysis, category);

      logger.info('Style analysis completed', { 
        userId, 
        category, 
        comparisonId,
        updateResult: updateResult.success
      });

      return {
        success: true,
        analysis,
        updateResult
      };

    } catch (error) {
      logger.error('Failed to analyze style differences', error, { 
        userId, 
        category, 
        comparisonId 
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create analysis prompt for OpenAI
   * @param {string} aiDraft - AI-generated draft
   * @param {string} humanResponse - Human-edited response
   * @param {string} category - Communication category
   * @returns {string} Analysis prompt
   */
  createAnalysisPrompt(aiDraft, humanResponse, category) {
    return `Compare the AI draft with the human response and identify style differences:

AI DRAFT:
${aiDraft}

HUMAN RESPONSE:
${humanResponse}

CATEGORY: ${category}

Analyze the following aspects and provide specific, actionable insights:

1. TONE ANALYSIS:
   - What tone differences exist?
   - How did the human adjust the formality level?
   - What emotional tone changes were made?

2. VOCABULARY ANALYSIS:
   - What specific words or phrases were changed?
   - What vocabulary preferences does the human show?
   - Are there industry-specific terms or jargon preferences?

3. STRUCTURE ANALYSIS:
   - What structural changes were made?
   - How did paragraph organization change?
   - What formatting or layout preferences exist?

4. PHRASE PREFERENCES:
   - What phrases or expressions did the human prefer?
   - What signature phrases or greetings/closings were used?
   - What specific language patterns emerged?

5. COMMUNICATION STYLE INSIGHTS:
   - What can we learn about this person's communication style?
   - What personality traits are reflected in their edits?
   - What business context preferences exist?

Return your analysis in the following JSON format:
{
  "tonePreferences": {
    "formality": "formal|casual|mixed",
    "emotionalTone": "professional|friendly|direct|empathetic",
    "changes": ["specific changes made"]
  },
  "vocabularyPreferences": {
    "preferredTerms": ["term1", "term2"],
    "avoidedTerms": ["term1", "term2"],
    "industryTerms": ["term1", "term2"]
  },
  "structuralPreferences": {
    "paragraphStyle": "short|medium|long",
    "organization": "chronological|priority|logical",
    "formatting": ["bullet points", "numbered lists", "paragraphs"]
  },
  "preferredPhrases": [
    {
      "phrase": "exact phrase",
      "context": "when to use",
      "replaces": "what it replaces"
    }
  ],
  "signatureElements": {
    "greetings": ["greeting1", "greeting2"],
    "closings": ["closing1", "closing2"],
    "signatures": ["signature1", "signature2"]
  },
  "communicationStyle": {
    "personality": "professional|friendly|direct|warm",
    "businessContext": "technical|sales|customer-service|general",
    "confidenceLevel": "high|medium|low"
  },
  "actionableInsights": [
    "specific insight 1",
    "specific insight 2",
    "specific insight 3"
  ]
}`;
  }

  /**
   * Parse OpenAI analysis response
   * @param {string} analysisText - Raw analysis text from OpenAI
   * @returns {Object} Parsed analysis
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Extract JSON from response (handle cases where OpenAI adds extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!analysis.tonePreferences || !analysis.vocabularyPreferences) {
        throw new Error('Invalid analysis structure');
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to parse analysis response', error);
      
      // Return fallback analysis
      return {
        tonePreferences: { formality: 'mixed', emotionalTone: 'professional', changes: [] },
        vocabularyPreferences: { preferredTerms: [], avoidedTerms: [], industryTerms: [] },
        structuralPreferences: { paragraphStyle: 'medium', organization: 'logical', formatting: ['paragraphs'] },
        preferredPhrases: [],
        signatureElements: { greetings: [], closings: [], signatures: [] },
        communicationStyle: { personality: 'professional', businessContext: 'general', confidenceLevel: 'medium' },
        actionableInsights: ['Style analysis pending manual review']
      };
    }
  }

  /**
   * Store analysis results
   * @param {string} comparisonId - Comparison record ID
   * @param {Object} analysis - Analysis results
   * @returns {Promise<void>}
   */
  async storeAnalysis(comparisonId, analysis) {
    try {
      const { error } = await supabase
        .from('ai_human_comparison')
        .update({
          analysis_results: analysis,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', comparisonId);

      if (error) {
        throw new Error(`Failed to store analysis: ${error.message}`);
      }
    } catch (error) {
      logger.error('Failed to store analysis', error, { comparisonId });
      throw error;
    }
  }

  /**
   * Update style profile with new learnings
   * @param {string} userId - User ID
   * @param {Object} analysis - Analysis results
   * @param {string} category - Communication category
   * @returns {Promise<Object>} Update result
   */
  async updateStyleProfile(userId, analysis, category) {
    try {
      const currentProfile = await this.getStyleProfile(userId);
      
      if (!currentProfile) {
        logger.warn('No existing style profile found', { userId });
        return { success: false, reason: 'No existing profile' };
      }

      // Merge new learnings with existing profile
      const updatedProfile = this.mergeStyleLearnings(currentProfile, analysis, category);
      
      // Save updated profile
      const { error } = await supabase
        .from('communication_styles')
        .update({
          style_profile: updatedProfile,
          last_updated: new Date().toISOString(),
          learning_count: (currentProfile.learning_count || 0) + 1
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update style profile: ${error.message}`);
      }

      logger.info('Style profile updated successfully', { 
        userId, 
        category,
        learningCount: (currentProfile.learning_count || 0) + 1
      });

      return {
        success: true,
        learningCount: (currentProfile.learning_count || 0) + 1
      };

    } catch (error) {
      logger.error('Failed to update style profile', error, { userId, category });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Merge new style learnings with existing profile
   * @param {Object} currentProfile - Current style profile
   * @param {Object} newAnalysis - New analysis results
   * @param {string} category - Communication category
   * @returns {Object} Updated profile
   */
  mergeStyleLearnings(currentProfile, newAnalysis, category) {
    const updated = { ...currentProfile.style_profile };

    // Update tone preferences based on category
    if (newAnalysis.tonePreferences) {
      updated.categoryTones = updated.categoryTones || {};
      updated.categoryTones[category] = this.mergeTonePreferences(
        updated.categoryTones[category] || {},
        newAnalysis.tonePreferences
      );
    }

    // Add new preferred phrases with confidence scoring
    if (newAnalysis.preferredPhrases && newAnalysis.preferredPhrases.length > 0) {
      updated.signaturePhrases = updated.signaturePhrases || [];
      
      newAnalysis.preferredPhrases.forEach(phrase => {
        const existingPhrase = updated.signaturePhrases.find(p => p.phrase === phrase.phrase);
        
        if (existingPhrase) {
          // Increase confidence for existing phrases
          existingPhrase.confidence = Math.min(1.0, existingPhrase.confidence + 0.1);
          existingPhrase.lastUsed = new Date().toISOString();
        } else {
          // Add new phrase
          updated.signaturePhrases.push({
            phrase: phrase.phrase,
            context: phrase.context || category,
            confidence: 0.8,
            addedAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            replaces: phrase.replaces || null
          });
        }
      });

      // Sort by confidence and limit to top phrases
      updated.signaturePhrases.sort((a, b) => b.confidence - a.confidence);
      updated.signaturePhrases = updated.signaturePhrases.slice(0, 50);
    }

    // Update vocabulary preferences
    if (newAnalysis.vocabularyPreferences) {
      updated.vocabularyPreferences = updated.vocabularyPreferences || {};
      updated.vocabularyPreferences[category] = this.mergeVocabularyPreferences(
        updated.vocabularyPreferences[category] || {},
        newAnalysis.vocabularyPreferences
      );
    }

    // Update signature elements
    if (newAnalysis.signatureElements) {
      updated.signatureElements = this.mergeSignatureElements(
        updated.signatureElements || {},
        newAnalysis.signatureElements
      );
    }

    // Update communication style insights
    if (newAnalysis.communicationStyle) {
      updated.communicationStyle = this.mergeCommunicationStyle(
        updated.communicationStyle || {},
        newAnalysis.communicationStyle
      );
    }

    // Add actionable insights
    if (newAnalysis.actionableInsights && newAnalysis.actionableInsights.length > 0) {
      updated.actionableInsights = updated.actionableInsights || [];
      updated.actionableInsights.push(...newAnalysis.actionableInsights.map(insight => ({
        insight,
        category,
        addedAt: new Date().toISOString(),
        confidence: 0.7
      })));
      
      // Keep only recent insights
      updated.actionableInsights = updated.actionableInsights.slice(-20);
    }

    // Update learning metadata
    updated.lastLearningUpdate = new Date().toISOString();
    updated.learningCategories = updated.learningCategories || {};
    updated.learningCategories[category] = (updated.learningCategories[category] || 0) + 1;

    return updated;
  }

  /**
   * Merge tone preferences
   * @param {Object} current - Current tone preferences
   * @param {Object} newTones - New tone preferences
   * @returns {Object} Merged tone preferences
   */
  mergeTonePreferences(current, newTones) {
    return {
      formality: newTones.formality || current.formality || 'mixed',
      emotionalTone: newTones.emotionalTone || current.emotionalTone || 'professional',
      changes: [...(current.changes || []), ...(newTones.changes || [])].slice(-10)
    };
  }

  /**
   * Merge vocabulary preferences
   * @param {Object} current - Current vocabulary preferences
   * @param {Object} newVocab - New vocabulary preferences
   * @returns {Object} Merged vocabulary preferences
   */
  mergeVocabularyPreferences(current, newVocab) {
    return {
      preferredTerms: [...new Set([...(current.preferredTerms || []), ...(newVocab.preferredTerms || [])])].slice(-20),
      avoidedTerms: [...new Set([...(current.avoidedTerms || []), ...(newVocab.avoidedTerms || [])])].slice(-20),
      industryTerms: [...new Set([...(current.industryTerms || []), ...(newVocab.industryTerms || [])])].slice(-15)
    };
  }

  /**
   * Merge signature elements
   * @param {Object} current - Current signature elements
   * @param {Object} newElements - New signature elements
   * @returns {Object} Merged signature elements
   */
  mergeSignatureElements(current, newElements) {
    return {
      greetings: [...new Set([...(current.greetings || []), ...(newElements.greetings || [])])].slice(-10),
      closings: [...new Set([...(current.closings || []), ...(newElements.closings || [])])].slice(-10),
      signatures: [...new Set([...(current.signatures || []), ...(newElements.signatures || [])])].slice(-5)
    };
  }

  /**
   * Merge communication style
   * @param {Object} current - Current communication style
   * @param {Object} newStyle - New communication style
   * @returns {Object} Merged communication style
   */
  mergeCommunicationStyle(current, newStyle) {
    return {
      personality: newStyle.personality || current.personality || 'professional',
      businessContext: newStyle.businessContext || current.businessContext || 'general',
      confidenceLevel: newStyle.confidenceLevel || current.confidenceLevel || 'medium'
    };
  }

  /**
   * Calculate similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {Promise<number>} Similarity score (0-1)
   */
  async calculateSimilarity(text1, text2) {
    try {
      // Simple similarity calculation based on common words
      const words1 = text1.toLowerCase().split(/\s+/);
      const words2 = text2.toLowerCase().split(/\s+/);
      
      const set1 = new Set(words1);
      const set2 = new Set(words2);
      
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      return intersection.size / union.size;
    } catch (error) {
      logger.error('Failed to calculate similarity', error);
      return 0.5; // Default similarity
    }
  }

  /**
   * Get style profile for user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Style profile
   */
  async getStyleProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get style profile', error, { userId });
      return null;
    }
  }

  /**
   * Get learning statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Learning statistics
   */
  async getLearningStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('ai_human_comparison')
        .select('category, created_at, similarity_score, analysis_results')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(this.maxLearningHistory);

      if (error) {
        throw new Error(`Failed to get learning statistics: ${error.message}`);
      }

      const stats = {
        totalComparisons: data.length,
        categories: {},
        averageSimilarity: 0,
        recentActivity: data.slice(0, 10),
        learningTrends: this.calculateLearningTrends(data)
      };

      // Calculate category statistics
      data.forEach(comparison => {
        if (!stats.categories[comparison.category]) {
          stats.categories[comparison.category] = {
            count: 0,
            averageSimilarity: 0,
            lastUsed: null
          };
        }
        
        stats.categories[comparison.category].count++;
        stats.categories[comparison.category].averageSimilarity += comparison.similarity_score || 0;
        stats.categories[comparison.category].lastUsed = comparison.created_at;
      });

      // Calculate averages
      Object.keys(stats.categories).forEach(category => {
        const catStats = stats.categories[category];
        catStats.averageSimilarity = catStats.averageSimilarity / catStats.count;
      });

      stats.averageSimilarity = data.reduce((sum, comp) => sum + (comp.similarity_score || 0), 0) / data.length;

      return stats;
    } catch (error) {
      logger.error('Failed to get learning statistics', error, { userId });
      return {
        totalComparisons: 0,
        categories: {},
        averageSimilarity: 0,
        recentActivity: [],
        learningTrends: {}
      };
    }
  }

  /**
   * Calculate learning trends
   * @param {Array} comparisons - Comparison data
   * @returns {Object} Learning trends
   */
  calculateLearningTrends(comparisons) {
    const trends = {
      dailyActivity: {},
      weeklyActivity: {},
      categoryGrowth: {}
    };

    comparisons.forEach(comparison => {
      const date = new Date(comparison.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(date);

      // Daily activity
      trends.dailyActivity[dayKey] = (trends.dailyActivity[dayKey] || 0) + 1;

      // Weekly activity
      trends.weeklyActivity[weekKey] = (trends.weeklyActivity[weekKey] || 0) + 1;

      // Category growth
      if (!trends.categoryGrowth[comparison.category]) {
        trends.categoryGrowth[comparison.category] = {};
      }
      trends.categoryGrowth[comparison.category][dayKey] = 
        (trends.categoryGrowth[comparison.category][dayKey] || 0) + 1;
    });

    return trends;
  }

  /**
   * Get week key for date
   * @param {Date} date - Date object
   * @returns {string} Week key (YYYY-WW)
   */
  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil((date - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const learningLoop = new CommunicationLearningLoop();

export default CommunicationLearningLoop;
