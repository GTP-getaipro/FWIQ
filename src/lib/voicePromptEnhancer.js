import { supabase } from './customSupabaseClient.js';
import { n8nWebhookService } from './n8nWebhookService.js';

/**
 * Voice Prompt Enhancer
 * Enhances AI prompts with learned voice profile and few-shot examples
 */

/**
 * Get recent AI-Human examples for few-shot learning
 * @param {string} userId - User ID
 * @param {string} category - Email category (URGENT, SALES, etc.)
 * @param {number} limit - Number of examples to retrieve (default: 3)
 * @returns {Promise<Array>} - Recent examples
 */
export const getRecentStyleExamples = async (userId, category, limit = 3) => {
  try {
    const { data, error } = await supabase
      .from('ai_human_comparison')
      .select('ai_draft, human_reply, category, created_at')
      .eq('user_id', userId)
      .eq('category', category)
      .not('human_reply', 'is', null)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(5, limit)));
    
    if (error) {
      console.warn('Could not fetch style examples:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.warn('Error fetching style examples:', error.message);
    return [];
  }
};

/**
 * Build voice-enhanced prompt with learned profile and few-shot examples
 * @param {object} basePrompt - Base behavior prompt
 * @param {object} voiceProfile - Learned voice profile from communication_styles
 * @param {string} userId - User ID
 * @param {string} category - Email category
 * @returns {Promise<string>} - Enhanced prompt with voice learning
 */
export const buildVoiceEnhancedPrompt = async (basePrompt, voiceProfile, userId, category) => {
  let enhancedPrompt = basePrompt;
  
  // Add learned voice profile if available
  if (voiceProfile?.style_profile) {
    const voice = voiceProfile.style_profile.voice || {};
    const signaturePhrases = voiceProfile.style_profile.signaturePhrases || [];
    const vocabularyPrefs = voiceProfile.style_profile.vocabularyPreferences || {};
    const categoryTones = voiceProfile.style_profile.categoryTones || {};
    const learningCount = voiceProfile.learning_count || 0;
    
    if (learningCount > 0) {
      enhancedPrompt += `\n\n🎤 LEARNED VOICE PROFILE (${learningCount} edits analyzed):\n`;
      enhancedPrompt += `- Empathy: ${voice.empathyLevel || 0.7}/1.0\n`;
      enhancedPrompt += `- Formality: ${voice.formalityLevel || 0.8}/1.0\n`;
      enhancedPrompt += `- Directness: ${voice.directnessLevel || 0.8}/1.0\n`;
      
      // Add category-specific tone if available
      if (categoryTones[category]) {
        enhancedPrompt += `\nFOR ${category} EMAILS:\n`;
        enhancedPrompt += `- Formality: ${categoryTones[category].formality}\n`;
        enhancedPrompt += `- Emotional Tone: ${categoryTones[category].emotionalTone}\n`;
      }
      
      // Add preferred phrases
      if (signaturePhrases.length > 0) {
        enhancedPrompt += `\nYOUR PREFERRED PHRASES:\n`;
        const topPhrases = signaturePhrases
          .filter(p => !category || p.context === category || p.confidence > 0.8)
          .slice(0, 8);
        
        topPhrases.forEach(p => {
          enhancedPrompt += `- "${p.phrase}" (${p.confidence?.toFixed(2)} confidence)\n`;
        });
      }
      
      // Add category-specific vocabulary
      if (vocabularyPrefs[category]) {
        const vocab = vocabularyPrefs[category];
        if (vocab.preferredTerms && vocab.preferredTerms.length > 0) {
          enhancedPrompt += `\nPREFERRED VOCABULARY:\n`;
          vocab.preferredTerms.slice(0, 10).forEach(term => {
            enhancedPrompt += `- ${term}\n`;
          });
        }
        
        if (vocab.avoidedTerms && vocab.avoidedTerms.length > 0) {
          enhancedPrompt += `\nAVOID THESE TERMS:\n`;
          vocab.avoidedTerms.slice(0, 5).forEach(term => {
            enhancedPrompt += `- ${term}\n`;
          });
        }
      }
    }
  }
  
  // Fetch recent AI-Human examples for few-shot learning
  try {
    const examples = await getRecentStyleExamples(userId, category, 3);
    
    if (examples.length > 0) {
      enhancedPrompt += `\n\n📚 RECENT EXAMPLES OF YOUR PREFERRED STYLE:\n`;
      enhancedPrompt += `(Learn from how YOU edited AI drafts - match THAT style)\n\n`;
      
      examples.forEach((ex, i) => {
        enhancedPrompt += `Example ${i + 1}:\n`;
        enhancedPrompt += `AI Draft: ${ex.ai_draft.substring(0, 150)}${ex.ai_draft.length > 150 ? '...' : ''}\n`;
        enhancedPrompt += `Your Edit: ${ex.human_reply.substring(0, 150)}${ex.human_reply.length > 150 ? '...' : ''}\n\n`;
      });
      
      enhancedPrompt += `Match the style of YOUR edited versions above. Use YOUR preferred phrases and tone.\n`;
    }
  } catch (error) {
    console.warn('Could not fetch style examples:', error.message);
  }
  
  return enhancedPrompt;
};

/**
 * Get voice profile summary for logging/debugging
 * @param {object} voiceProfile - Voice profile object
 * @returns {object} - Summary object
 */
export const getVoiceProfileSummary = (voiceProfile) => {
  if (!voiceProfile?.style_profile) {
    return {
      available: false,
      learningCount: 0,
      confidence: 0
    };
  }
  
  const voice = voiceProfile.style_profile.voice || {};
  const signaturePhrases = voiceProfile.style_profile.signaturePhrases || [];
  
  return {
    available: true,
    learningCount: voiceProfile.learning_count || 0,
    confidence: voice.confidence || 0,
    empathyLevel: voice.empathyLevel || 0,
    formalityLevel: voice.formalityLevel || 0,
    directnessLevel: voice.directnessLevel || 0,
    phraseCount: signaturePhrases.length,
    lastUpdated: voiceProfile.last_updated,
    tone: voice.tone || 'unknown'
  };
};

/**
 * Record AI-Human comparison for learning loop
 * @param {string} userId - User ID  
 * @param {string} emailId - Email ID
 * @param {string} aiDraft - AI-generated draft
 * @param {string} humanResponse - Human-edited response
 * @param {string} category - Email category
 * @returns {Promise<object>} - Recording result
 */
export const recordDraftComparison = async (userId, emailId, aiDraft, humanResponse, category) => {
  try {
    // Import learning loop dynamically to avoid circular dependencies
    const { learningLoop } = await import('./learningLoop.js');
    
    const result = await learningLoop.recordAIHumanComparison(
      userId,
      emailId,
      aiDraft,
      humanResponse,
      category,
      {
        timestamp: new Date().toISOString(),
        source: 'n8n_workflow'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Error recording draft comparison:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger voice profile refinement if threshold reached
 * @param {string} userId - User ID
 * @param {string} trigger - Trigger type ('manual' or 'automatic')
 * @returns {Promise<object>} - Refinement result
 */
export const triggerVoiceRefinement = async (userId, trigger = 'manual') => {
  try {
    // Use centralized webhook service
    const thresholdCheck = await n8nWebhookService.checkRefinementThreshold(userId);
    
    if (!thresholdCheck.shouldRefine && trigger === 'automatic') {
      return { 
        success: true, 
        message: `Only ${thresholdCheck.pendingCount}/${thresholdCheck.threshold} comparisons pending`,
        ...thresholdCheck
      };
    }
    
    // Trigger refinement via webhook
    const result = await n8nWebhookService.triggerVoiceRefinement(userId, trigger);
    
    return { 
      success: true, 
      message: 'Voice refinement triggered successfully',
      ...thresholdCheck,
      ...result
    };
  } catch (error) {
    console.error('Error triggering voice refinement:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  getRecentStyleExamples,
  buildVoiceEnhancedPrompt,
  getVoiceProfileSummary,
  recordDraftComparison,
  triggerVoiceRefinement
};

