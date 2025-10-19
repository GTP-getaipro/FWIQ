// Style Profile Management utilities
import { supabase } from '@/lib/customSupabaseClient';

export class StyleProfileManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getStyleProfile(userId, useCache = true) {
    // Check cache first
    if (useCache && this.cache.has(userId)) {
      const cached = this.cache.get(userId);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.profile;
      }
    }

    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching style profile:', error);
        return null;
      }

      // Cache the result
      if (data) {
        this.cache.set(userId, {
          profile: data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error('Failed to get style profile:', error);
      return null;
    }
  }

  async updateStyleProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .upsert({
          user_id: userId,
          ...updates,
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating style profile:', error);
        throw error;
      }

      // Clear cache for this user
      this.cache.delete(userId);

      return data;
    } catch (error) {
      console.error('Failed to update style profile:', error);
      throw error;
    }
  }

  // Extract style preferences for AI prompting
  extractStylePreferences(styleProfile) {
    if (!styleProfile) {
      return this.getDefaultStylePreferences();
    }

    const profile = styleProfile.style_profile || {};
    const toneAnalysis = styleProfile.tone_analysis || {};
    const vocabulary = styleProfile.vocabulary_patterns || {};

    return {
      tone: toneAnalysis.tone || profile.tone || 'professional',
      formality: toneAnalysis.formality || profile.formality || 'balanced',
      personality: toneAnalysis.personality || profile.personality || ['professional', 'helpful'],
      greetingStyle: profile.greetingPattern || 'Hello',
      closingStyle: profile.closingPattern || 'Best regards',
      responseLength: this.categorizeResponseLength(profile.averageEmailLength || 300),
      vocabularyLevel: this.categorizeVocabularyLevel(vocabulary),
      customerApproach: profile.customerApproach || 'professional',
      industryFocus: profile.industryTerminology || 'moderate',
      signaturePhrases: styleProfile.signature_phrases || [],
      confidence: profile.confidence || 50
    };
  }

  getDefaultStylePreferences() {
    return {
      tone: 'professional',
      formality: 'balanced',
      personality: ['professional', 'helpful'],
      greetingStyle: 'Hello',
      closingStyle: 'Best regards',
      responseLength: 'moderate',
      vocabularyLevel: 'standard',
      customerApproach: 'professional',
      industryFocus: 'moderate',
      signaturePhrases: [],
      confidence: 25
    };
  }

  categorizeResponseLength(averageLength) {
    if (averageLength < 200) return 'brief';
    if (averageLength < 400) return 'moderate';
    if (averageLength < 600) return 'detailed';
    return 'comprehensive';
  }

  categorizeVocabularyLevel(vocabulary) {
    if (!vocabulary || !vocabulary.technical_terms) return 'standard';
    
    const technicalCount = vocabulary.technical_terms.length;
    if (technicalCount < 3) return 'basic';
    if (technicalCount < 8) return 'standard';
    if (technicalCount < 15) return 'advanced';
    return 'expert';
  }

  // Generate style summary for UI display
  generateStyleSummary(styleProfile) {
    const preferences = this.extractStylePreferences(styleProfile);
    
    return {
      primaryTone: preferences.tone,
      communicationStyle: `${preferences.formality} ${preferences.tone}`,
      responsePattern: `${preferences.responseLength} responses with ${preferences.greetingStyle} greetings`,
      personalityTraits: Array.isArray(preferences.personality) 
        ? preferences.personality.join(', ') 
        : preferences.personality,
      confidence: preferences.confidence,
      lastUpdated: styleProfile?.last_updated || null,
      signaturePhrasesCount: preferences.signaturePhrases.length,
      industrySpecialization: preferences.industryFocus
    };
  }

  // Validate style profile completeness
  validateStyleProfile(styleProfile) {
    const validation = {
      isComplete: false,
      missingElements: [],
      confidence: 0,
      recommendations: []
    };

    if (!styleProfile) {
      validation.missingElements = ['entire_profile'];
      validation.recommendations.push('Analyze email history to create style profile');
      return validation;
    }

    const profile = styleProfile.style_profile || {};
    const requiredElements = [
      'tone', 'formality', 'greetingPattern', 'closingPattern', 'customerApproach'
    ];

    requiredElements.forEach(element => {
      if (!profile[element]) {
        validation.missingElements.push(element);
      }
    });

    // Check signature phrases
    if (!styleProfile.signature_phrases || styleProfile.signature_phrases.length < 3) {
      validation.missingElements.push('signature_phrases');
      validation.recommendations.push('Analyze more emails to identify signature phrases');
    }

    // Check vocabulary patterns
    if (!styleProfile.vocabulary_patterns || !styleProfile.vocabulary_patterns.common_words) {
      validation.missingElements.push('vocabulary_patterns');
      validation.recommendations.push('Analyze vocabulary usage patterns');
    }

    validation.isComplete = validation.missingElements.length === 0;
    validation.confidence = Math.max(0, 100 - (validation.missingElements.length * 15));

    if (validation.confidence < 70) {
      validation.recommendations.push('Analyze additional email samples to improve accuracy');
    }

    return validation;
  }

  // Get style profile for multiple users (batch operation)
  async getBatchStyleProfiles(userIds) {
    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching batch style profiles:', error);
        return {};
      }

      // Convert to map for easy lookup
      const profileMap = {};
      data.forEach(profile => {
        profileMap[profile.user_id] = profile;
        
        // Cache each profile
        this.cache.set(profile.user_id, {
          profile: profile,
          timestamp: Date.now()
        });
      });

      return profileMap;
    } catch (error) {
      console.error('Failed to get batch style profiles:', error);
      return {};
    }
  }

  // Clear cache for a specific user or all users
  clearCache(userId = null) {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }

  // Export style profile for backup or transfer
  exportStyleProfile(styleProfile) {
    if (!styleProfile) return null;

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: {
        style_profile: styleProfile.style_profile,
        vocabulary_patterns: styleProfile.vocabulary_patterns,
        tone_analysis: styleProfile.tone_analysis,
        signature_phrases: styleProfile.signature_phrases,
        response_templates: styleProfile.response_templates
      },
      metadata: {
        confidence: styleProfile.style_profile?.confidence || 0,
        lastUpdated: styleProfile.last_updated,
        createdAt: styleProfile.created_at
      }
    };
  }

  // Import style profile from backup
  async importStyleProfile(userId, exportedProfile) {
    if (!exportedProfile || !exportedProfile.profile) {
      throw new Error('Invalid profile format');
    }

    const profileData = {
      user_id: userId,
      style_profile: exportedProfile.profile.style_profile,
      vocabulary_patterns: exportedProfile.profile.vocabulary_patterns,
      tone_analysis: exportedProfile.profile.tone_analysis,
      signature_phrases: exportedProfile.profile.signature_phrases,
      response_templates: exportedProfile.profile.response_templates,
      last_updated: new Date().toISOString()
    };

    return this.updateStyleProfile(userId, profileData);
  }

  // Generate style comparison between two profiles
  compareStyleProfiles(profile1, profile2) {
    if (!profile1 || !profile2) {
      return { similarity: 0, differences: ['One or both profiles missing'] };
    }

    const prefs1 = this.extractStylePreferences(profile1);
    const prefs2 = this.extractStylePreferences(profile2);

    const similarities = [];
    const differences = [];

    // Compare key attributes
    const attributes = ['tone', 'formality', 'greetingStyle', 'closingStyle', 'customerApproach'];
    
    attributes.forEach(attr => {
      if (prefs1[attr] === prefs2[attr]) {
        similarities.push(attr);
      } else {
        differences.push(`${attr}: ${prefs1[attr]} vs ${prefs2[attr]}`);
      }
    });

    const similarity = (similarities.length / attributes.length) * 100;

    return {
      similarity: Math.round(similarity),
      similarities,
      differences,
      recommendation: similarity > 80 ? 'Very similar styles' : 
                     similarity > 60 ? 'Moderately similar styles' : 
                     'Different communication styles'
    };
  }
}
