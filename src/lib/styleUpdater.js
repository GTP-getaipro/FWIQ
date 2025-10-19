/**
 * Style Updater for FloWorx
 * Handles real-time style profile updates and learning application
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class StyleUpdater {
  constructor() {
    this.updateThreshold = 0.6; // Minimum confidence for applying updates
    this.batchSize = 10; // Number of learnings to process in batch
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.pendingUpdates = new Map();
    this.isProcessing = false;
  }

  /**
   * Queue a style update for processing
   * @param {string} userId - User ID
   * @param {Object} learning - Learning data
   * @param {string} category - Communication category
   * @returns {Promise<void>}
   */
  async queueStyleUpdate(userId, learning, category) {
    try {
      const updateKey = `${userId}-${category}`;
      
      if (!this.pendingUpdates.has(updateKey)) {
        this.pendingUpdates.set(updateKey, []);
      }
      
      this.pendingUpdates.get(updateKey).push({
        learning,
        category,
        timestamp: new Date().toISOString(),
        processed: false
      });

      logger.info('Style update queued', { userId, category, queueSize: this.pendingUpdates.get(updateKey).length });

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processPendingUpdates();
      }

    } catch (error) {
      logger.error('Failed to queue style update', error, { userId, category });
    }
  }

  /**
   * Process pending style updates
   * @returns {Promise<void>}
   */
  async processPendingUpdates() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Starting batch style update processing', { pendingUpdates: this.pendingUpdates.size });

    try {
      for (const [updateKey, updates] of this.pendingUpdates) {
        const [userId, category] = updateKey.split('-');
        const unprocessedUpdates = updates.filter(update => !update.processed);

        if (unprocessedUpdates.length === 0) {
          continue;
        }

        try {
          await this.processBatchUpdates(userId, category, unprocessedUpdates);
          
          // Mark updates as processed
          updates.forEach(update => {
            if (!update.processed) {
              update.processed = true;
              update.processedAt = new Date().toISOString();
            }
          });

          logger.info('Batch style updates processed', { 
            userId, 
            category, 
            processedCount: unprocessedUpdates.length 
          });

        } catch (error) {
          logger.error('Failed to process batch updates', error, { userId, category });
        }
      }

      // Clean up processed updates older than 1 hour
      this.cleanupProcessedUpdates();

    } catch (error) {
      logger.error('Failed to process pending style updates', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a batch of style updates
   * @param {string} userId - User ID
   * @param {string} category - Communication category
   * @param {Array} updates - Array of updates to process
   * @returns {Promise<void>}
   */
  async processBatchUpdates(userId, category, updates) {
    try {
      // Get current style profile
      const currentProfile = await this.getStyleProfile(userId);
      if (!currentProfile) {
        logger.warn('No style profile found for batch update', { userId });
        return;
      }

      // Aggregate learnings from batch
      const aggregatedLearning = this.aggregateBatchLearnings(updates);
      
      if (!aggregatedLearning || Object.keys(aggregatedLearning).length === 0) {
        logger.info('No meaningful learnings to aggregate', { userId, category });
        return;
      }

      // Apply aggregated learning to profile
      const updatedProfile = await this.applyAggregatedLearning(
        currentProfile, 
        aggregatedLearning, 
        category
      );

      // Save updated profile
      await this.saveStyleProfile(userId, updatedProfile);

      // Track learning application
      analytics.trackBusinessEvent('style_profile_updated', {
        userId,
        category,
        updateCount: updates.length,
        learningTypes: Object.keys(aggregatedLearning)
      });

      logger.info('Batch style updates applied successfully', { 
        userId, 
        category, 
        updateCount: updates.length 
      });

    } catch (error) {
      logger.error('Failed to process batch style updates', error, { userId, category });
      throw error;
    }
  }

  /**
   * Aggregate learnings from batch updates
   * @param {Array} updates - Array of updates
   * @returns {Object} Aggregated learning
   */
  aggregateBatchLearnings(updates) {
    const aggregated = {
      tonePreferences: {},
      vocabularyPreferences: {},
      preferredPhrases: [],
      signatureElements: {},
      communicationStyle: {},
      confidenceScores: {}
    };

    updates.forEach(update => {
      const learning = update.learning;
      
      // Aggregate tone preferences
      if (learning.tonePreferences) {
        this.aggregateTonePreferences(aggregated.tonePreferences, learning.tonePreferences);
      }

      // Aggregate vocabulary preferences
      if (learning.vocabularyPreferences) {
        this.aggregateVocabularyPreferences(aggregated.vocabularyPreferences, learning.vocabularyPreferences);
      }

      // Aggregate preferred phrases
      if (learning.preferredPhrases) {
        aggregated.preferredPhrases.push(...learning.preferredPhrases);
      }

      // Aggregate signature elements
      if (learning.signatureElements) {
        this.aggregateSignatureElements(aggregated.signatureElements, learning.signatureElements);
      }

      // Aggregate communication style
      if (learning.communicationStyle) {
        this.aggregateCommunicationStyle(aggregated.communicationStyle, learning.communicationStyle);
      }
    });

    // Calculate confidence scores
    this.calculateConfidenceScores(aggregated, updates.length);

    return aggregated;
  }

  /**
   * Aggregate tone preferences
   * @param {Object} aggregated - Aggregated preferences object
   * @param {Object} newTones - New tone preferences
   * @returns {void}
   */
  aggregateTonePreferences(aggregated, newTones) {
    // Count frequency of tone preferences
    if (newTones.formality) {
      aggregated.formality = aggregated.formality || {};
      aggregated.formality[newTones.formality] = (aggregated.formality[newTones.formality] || 0) + 1;
    }

    if (newTones.emotionalTone) {
      aggregated.emotionalTone = aggregated.emotionalTone || {};
      aggregated.emotionalTone[newTones.emotionalTone] = (aggregated.emotionalTone[newTones.emotionalTone] || 0) + 1;
    }

    // Aggregate changes
    if (newTones.changes && newTones.changes.length > 0) {
      aggregated.changes = aggregated.changes || [];
      aggregated.changes.push(...newTones.changes);
    }
  }

  /**
   * Aggregate vocabulary preferences
   * @param {Object} aggregated - Aggregated preferences object
   * @param {Object} newVocab - New vocabulary preferences
   * @returns {void}
   */
  aggregateVocabularyPreferences(aggregated, newVocab) {
    // Count frequency of preferred terms
    if (newVocab.preferredTerms) {
      aggregated.preferredTerms = aggregated.preferredTerms || {};
      newVocab.preferredTerms.forEach(term => {
        aggregated.preferredTerms[term] = (aggregated.preferredTerms[term] || 0) + 1;
      });
    }

    // Count frequency of avoided terms
    if (newVocab.avoidedTerms) {
      aggregated.avoidedTerms = aggregated.avoidedTerms || {};
      newVocab.avoidedTerms.forEach(term => {
        aggregated.avoidedTerms[term] = (aggregated.avoidedTerms[term] || 0) + 1;
      });
    }

    // Count frequency of industry terms
    if (newVocab.industryTerms) {
      aggregated.industryTerms = aggregated.industryTerms || {};
      newVocab.industryTerms.forEach(term => {
        aggregated.industryTerms[term] = (aggregated.industryTerms[term] || 0) + 1;
      });
    }
  }

  /**
   * Aggregate signature elements
   * @param {Object} aggregated - Aggregated elements object
   * @param {Object} newElements - New signature elements
   * @returns {void}
   */
  aggregateSignatureElements(aggregated, newElements) {
    Object.keys(newElements).forEach(elementType => {
      if (newElements[elementType] && Array.isArray(newElements[elementType])) {
        aggregated[elementType] = aggregated[elementType] || {};
        
        newElements[elementType].forEach(element => {
          aggregated[elementType][element] = (aggregated[elementType][element] || 0) + 1;
        });
      }
    });
  }

  /**
   * Aggregate communication style
   * @param {Object} aggregated - Aggregated style object
   * @param {Object} newStyle - New communication style
   * @returns {void}
   */
  aggregateCommunicationStyle(aggregated, newStyle) {
    Object.keys(newStyle).forEach(styleAttribute => {
      if (newStyle[styleAttribute]) {
        aggregated[styleAttribute] = aggregated[styleAttribute] || {};
        aggregated[styleAttribute][newStyle[styleAttribute]] = 
          (aggregated[styleAttribute][newStyle[styleAttribute]] || 0) + 1;
      }
    });
  }

  /**
   * Calculate confidence scores for aggregated learnings
   * @param {Object} aggregated - Aggregated learning object
   * @param {number} totalUpdates - Total number of updates
   * @returns {void}
   */
  calculateConfidenceScores(aggregated, totalUpdates) {
    // Calculate confidence based on frequency and total updates
    const minThreshold = Math.max(2, Math.ceil(totalUpdates * 0.3)); // At least 30% agreement

    // Tone preferences confidence
    if (aggregated.tonePreferences.formality) {
      const maxFormality = Math.max(...Object.values(aggregated.tonePreferences.formality));
      aggregated.tonePreferences.confidence = maxFormality / totalUpdates;
      aggregated.tonePreferences.dominantFormality = Object.keys(aggregated.tonePreferences.formality)
        .find(key => aggregated.tonePreferences.formality[key] === maxFormality);
    }

    if (aggregated.tonePreferences.emotionalTone) {
      const maxTone = Math.max(...Object.values(aggregated.tonePreferences.emotionalTone));
      aggregated.tonePreferences.emotionalConfidence = maxTone / totalUpdates;
      aggregated.tonePreferences.dominantTone = Object.keys(aggregated.tonePreferences.emotionalTone)
        .find(key => aggregated.tonePreferences.emotionalTone[key] === maxTone);
    }

    // Vocabulary preferences confidence
    if (aggregated.vocabularyPreferences.preferredTerms) {
      aggregated.vocabularyPreferences.confidentTerms = 
        Object.entries(aggregated.vocabularyPreferences.preferredTerms)
          .filter(([term, count]) => count >= minThreshold)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([term]) => term);
    }

    if (aggregated.vocabularyPreferences.avoidedTerms) {
      aggregated.vocabularyPreferences.confidentAvoidedTerms = 
        Object.entries(aggregated.vocabularyPreferences.avoidedTerms)
          .filter(([term, count]) => count >= minThreshold)
          .map(([term]) => term);
    }

    // Signature elements confidence
    Object.keys(aggregated.signatureElements).forEach(elementType => {
      if (aggregated.signatureElements[elementType]) {
        const elements = aggregated.signatureElements[elementType];
        aggregated.signatureElements[`${elementType}Confident`] = 
          Object.entries(elements)
            .filter(([, count]) => count >= minThreshold)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([element]) => element);
      }
    });
  }

  /**
   * Apply aggregated learning to style profile
   * @param {Object} currentProfile - Current style profile
   * @param {Object} aggregatedLearning - Aggregated learning
   * @param {string} category - Communication category
   * @returns {Object} Updated profile
   */
  async applyAggregatedLearning(currentProfile, aggregatedLearning, category) {
    const updated = { ...currentProfile.style_profile };

    // Apply tone preferences if confidence is high enough
    if (aggregatedLearning.tonePreferences.confidence >= this.updateThreshold) {
      updated.categoryTones = updated.categoryTones || {};
      updated.categoryTones[category] = {
        formality: aggregatedLearning.tonePreferences.dominantFormality,
        emotionalTone: aggregatedLearning.tonePreferences.dominantTone,
        confidence: aggregatedLearning.tonePreferences.confidence,
        lastUpdated: new Date().toISOString()
      };
    }

    // Apply vocabulary preferences if confidence is high enough
    if (aggregatedLearning.vocabularyPreferences.confidentTerms && 
        aggregatedLearning.vocabularyPreferences.confidentTerms.length > 0) {
      updated.vocabularyPreferences = updated.vocabularyPreferences || {};
      updated.vocabularyPreferences[category] = {
        preferredTerms: aggregatedLearning.vocabularyPreferences.confidentTerms,
        avoidedTerms: aggregatedLearning.vocabularyPreferences.confidentAvoidedTerms || [],
        confidence: aggregatedLearning.vocabularyPreferences.confidentTerms.length / 10,
        lastUpdated: new Date().toISOString()
      };
    }

    // Apply signature elements if confidence is high enough
    Object.keys(aggregatedLearning.signatureElements).forEach(elementType => {
      const confidentElements = aggregatedLearning.signatureElements[`${elementType}Confident`];
      if (confidentElements && confidentElements.length > 0) {
        updated.signatureElements = updated.signatureElements || {};
        updated.signatureElements[elementType] = confidentElements;
      }
    });

    // Apply communication style if confidence is high enough
    if (aggregatedLearning.communicationStyle) {
      const styleUpdates = {};
      Object.keys(aggregatedLearning.communicationStyle).forEach(attribute => {
        const values = aggregatedLearning.communicationStyle[attribute];
        const maxCount = Math.max(...Object.values(values));
        const dominantValue = Object.keys(values).find(key => values[key] === maxCount);
        
        if (maxCount >= 2) { // At least 2 occurrences
          styleUpdates[attribute] = dominantValue;
        }
      });

      if (Object.keys(styleUpdates).length > 0) {
        updated.communicationStyle = {
          ...updated.communicationStyle,
          ...styleUpdates,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    // Update learning metadata
    updated.lastBatchUpdate = new Date().toISOString();
    updated.batchUpdateCount = (updated.batchUpdateCount || 0) + 1;
    updated.learningCategories = updated.learningCategories || {};
    updated.learningCategories[category] = (updated.learningCategories[category] || 0) + 1;

    return updated;
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
   * Save updated style profile
   * @param {string} userId - User ID
   * @param {Object} updatedProfile - Updated profile data
   * @returns {Promise<void>}
   */
  async saveStyleProfile(userId, updatedProfile) {
    try {
      const { error } = await supabase
        .from('communication_styles')
        .update({
          style_profile: updatedProfile,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to save style profile: ${error.message}`);
      }

      logger.info('Style profile saved successfully', { userId });
    } catch (error) {
      logger.error('Failed to save style profile', error, { userId });
      throw error;
    }
  }

  /**
   * Clean up processed updates older than 1 hour
   * @returns {void}
   */
  cleanupProcessedUpdates() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [updateKey, updates] of this.pendingUpdates) {
      const filteredUpdates = updates.filter(update => {
        if (!update.processed) {
          return true; // Keep unprocessed updates
        }
        
        // Remove processed updates older than 1 hour
        return new Date(update.processedAt) > oneHourAgo;
      });
      
      if (filteredUpdates.length === 0) {
        this.pendingUpdates.delete(updateKey);
      } else {
        this.pendingUpdates.set(updateKey, filteredUpdates);
      }
    }

    logger.info('Processed updates cleaned up', { remainingQueues: this.pendingUpdates.size });
  }

  /**
   * Get pending updates statistics
   * @returns {Object} Statistics about pending updates
   */
  getPendingUpdatesStats() {
    const stats = {
      totalQueues: this.pendingUpdates.size,
      totalUpdates: 0,
      processedUpdates: 0,
      unprocessedUpdates: 0,
      oldestUpdate: null,
      newestUpdate: null
    };

    for (const updates of this.pendingUpdates.values()) {
      stats.totalUpdates += updates.length;
      
      updates.forEach(update => {
        if (update.processed) {
          stats.processedUpdates++;
        } else {
          stats.unprocessedUpdates++;
        }
        
        if (!stats.oldestUpdate || new Date(update.timestamp) < new Date(stats.oldestUpdate)) {
          stats.oldestUpdate = update.timestamp;
        }
        
        if (!stats.newestUpdate || new Date(update.timestamp) > new Date(stats.newestUpdate)) {
          stats.newestUpdate = update.timestamp;
        }
      });
    }

    return stats;
  }

  /**
   * Force process all pending updates
   * @returns {Promise<void>}
   */
  async forceProcessAllUpdates() {
    logger.info('Force processing all pending updates');
    await this.processPendingUpdates();
  }
}

// Export singleton instance
export const styleUpdater = new StyleUpdater();

// Start periodic processing
setInterval(() => {
  styleUpdater.processPendingUpdates();
}, styleUpdater.updateInterval);

export default StyleUpdater;
