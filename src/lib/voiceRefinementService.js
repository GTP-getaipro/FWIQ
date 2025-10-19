/**
 * Voice Refinement Service - Supabase Edition
 * 
 * This service implements continuous learning from user corrections to AI drafts.
 * It stores refinement data in Supabase and automatically updates voice profiles
 * when enough corrections have been collected.
 */

import { supabase } from '@/lib/supabaseClient';

export class VoiceRefinementService {
  constructor(userId) {
    this.userId = userId;
    this.learningThreshold = 10; // Minimum corrections before applying learning
  }

  /**
   * Process a draft correction
   * @param {Object} comparison - Draft comparison data
   * @param {string} comparison.threadId - Email thread ID
   * @param {string} comparison.emailId - Email ID
   * @param {string} comparison.aiDraft - AI-generated draft
   * @param {string} comparison.userFinal - User's final email
   * @param {string} comparison.category - Email category
   * @param {Object} comparison.emailContext - Additional context
   */
  async processDraftCorrection(comparison) {
    try {
      console.log(`🔄 Processing draft correction for user: ${this.userId}`);

      // 1. Analyze the differences
      const analysis = this.analyzeDraftComparison(comparison.aiDraft, comparison.userFinal);

      // 2. Store the correction in database
      const { data: correctionData, error: correctionError } = await supabase
        .from('ai_draft_corrections')
        .insert({
          user_id: this.userId,
          thread_id: comparison.threadId,
          email_id: comparison.emailId,
          ai_draft_text: comparison.aiDraft,
          user_final_text: comparison.userFinal,
          edit_distance: analysis.editDistance,
          similarity_score: analysis.similarityScore,
          correction_type: analysis.correctionType,
          email_category: comparison.category,
          correction_patterns: {
            toneChanges: analysis.toneChanges,
            phraseChanges: analysis.phraseChanges,
            structureChanges: analysis.structureChanges,
            empathyAdjustment: analysis.empathyAdjustment,
            directnessAdjustment: analysis.directnessAdjustment,
            formalityAdjustment: analysis.formalityAdjustment
          },
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (correctionError) {
        console.error('❌ Failed to store correction:', correctionError);
        throw correctionError;
      }

      console.log(`✅ Correction stored: ${correctionData.id}`);

      // 3. Update learning metrics
      await this.updateLearningMetrics(analysis);

      // 4. Check if we should refine the voice profile
      const metrics = await this.getLearningMetrics();
      
      if (metrics.total_corrections_made >= this.learningThreshold && 
          !metrics.learning_in_progress) {
        console.log(`🎯 Threshold reached (${metrics.total_corrections_made} corrections) - triggering voice refinement`);
        await this.refineVoiceProfile();
      }

      return {
        success: true,
        correctionId: correctionData.id,
        totalCorrections: metrics.total_corrections_made,
        shouldRefine: metrics.total_corrections_made >= this.learningThreshold
      };

    } catch (error) {
      console.error('❌ Draft correction processing failed:', error);
      throw error;
    }
  }

  /**
   * Analyze differences between AI draft and user's final email
   */
  analyzeDraftComparison(aiDraft, userFinal) {
    // Calculate edit distance (Levenshtein distance approximation)
    const editDistance = this.calculateEditDistance(aiDraft, userFinal);
    
    // Calculate similarity score (0-1)
    const maxLength = Math.max(aiDraft.length, userFinal.length);
    const similarityScore = maxLength > 0 ? 1 - (editDistance / maxLength) : 1;

    // Determine correction type
    let correctionType = 'minor';
    if (similarityScore < 0.4) correctionType = 'complete_rewrite';
    else if (similarityScore < 0.7) correctionType = 'major';
    else if (similarityScore < 0.9) correctionType = 'moderate';

    // Detect specific changes
    const toneChanges = this.detectToneChanges(aiDraft, userFinal);
    const phraseChanges = this.detectPhraseChanges(aiDraft, userFinal);
    const structureChanges = this.detectStructureChanges(aiDraft, userFinal);

    // Calculate metric adjustments
    const empathyAdjustment = this.calculateEmpathyAdjustment(aiDraft, userFinal);
    const directnessAdjustment = this.calculateDirectnessAdjustment(aiDraft, userFinal);
    const formalityAdjustment = this.calculateFormalityAdjustment(aiDraft, userFinal);

    return {
      editDistance,
      similarityScore,
      correctionType,
      toneChanges,
      phraseChanges,
      structureChanges,
      empathyAdjustment,
      directnessAdjustment,
      formalityAdjustment
    };
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  calculateEditDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Detect tone changes
   */
  detectToneChanges(aiDraft, userFinal) {
    const changes = [];
    const aiLower = aiDraft.toLowerCase();
    const userLower = userFinal.toLowerCase();

    if (userLower.includes('sorry') && !aiLower.includes('sorry')) {
      changes.push('added_apology');
    }
    if (userLower.includes('urgent') && !aiLower.includes('urgent')) {
      changes.push('added_urgency');
    }
    if (userLower.includes('excited') && !aiLower.includes('excited')) {
      changes.push('added_enthusiasm');
    }
    if (userLower.includes('please') && !aiLower.includes('please')) {
      changes.push('increased_formality');
    }
    if (userLower.includes('no worries') && !aiLower.includes('no worries')) {
      changes.push('added_casualness');
    }

    return changes;
  }

  /**
   * Detect phrase changes
   */
  detectPhraseChanges(aiDraft, userFinal) {
    // Extract 3-6 word phrases that appear in user's version but not AI's
    const aiPhrases = this.extractPhrases(aiDraft);
    const userPhrases = this.extractPhrases(userFinal);
    
    return userPhrases.filter(phrase => 
      phrase.length > 10 && !aiPhrases.includes(phrase)
    ).slice(0, 5); // Top 5 new phrases
  }

  /**
   * Detect structure changes
   */
  detectStructureChanges(aiDraft, userFinal) {
    const changes = [];

    // Check paragraph count
    const aiParagraphs = aiDraft.split('\n\n').filter(p => p.trim()).length;
    const userParagraphs = userFinal.split('\n\n').filter(p => p.trim()).length;
    
    if (userParagraphs > aiParagraphs) changes.push('added_paragraphs');
    if (userParagraphs < aiParagraphs) changes.push('removed_paragraphs');

    // Check greeting
    const aiGreeting = this.extractGreeting(aiDraft);
    const userGreeting = this.extractGreeting(userFinal);
    if (aiGreeting !== userGreeting) changes.push('greeting_change');

    // Check closing
    const aiClosing = this.extractClosing(aiDraft);
    const userClosing = this.extractClosing(userFinal);
    if (aiClosing !== userClosing) changes.push('closing_change');

    return changes;
  }

  /**
   * Calculate empathy adjustment
   */
  calculateEmpathyAdjustment(aiDraft, userFinal) {
    const empathyWords = ['sorry', 'understand', 'frustrating', 'apologize', 'empathize', 'feel'];
    
    const aiCount = empathyWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const userCount = empathyWords.reduce((count, word) => 
      count + (userFinal.toLowerCase().split(word).length - 1), 0);

    return userCount - aiCount;
  }

  /**
   * Calculate directness adjustment
   */
  calculateDirectnessAdjustment(aiDraft, userFinal) {
    const directWords = ['urgent', 'immediately', 'asap', 'critical', 'important', 'priority'];
    
    const aiCount = directWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const userCount = directWords.reduce((count, word) => 
      count + (userFinal.toLowerCase().split(word).length - 1), 0);

    return userCount - aiCount;
  }

  /**
   * Calculate formality adjustment
   */
  calculateFormalityAdjustment(aiDraft, userFinal) {
    const formalWords = ['please', 'thank you', 'appreciate', 'sincerely', 'respectfully'];
    const casualWords = ['hey', 'thanks', 'no worries', 'cool', 'awesome'];
    
    const aiFormal = formalWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const userFormal = formalWords.reduce((count, word) => 
      count + (userFinal.toLowerCase().split(word).length - 1), 0);

    const aiCasual = casualWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const userCasual = casualWords.reduce((count, word) => 
      count + (userFinal.toLowerCase().split(word).length - 1), 0);

    return (userFormal - aiFormal) - (userCasual - aiCasual);
  }

  /**
   * Extract phrases from text
   */
  extractPhrases(text) {
    const phrases = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length >= 3 && words.length <= 6) {
        phrases.push(words.join(' ').toLowerCase());
      }
    });

    return [...new Set(phrases)]; // Remove duplicates
  }

  /**
   * Extract greeting from text
   */
  extractGreeting(text) {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim() || '';
    
    if (firstLine.match(/^(hi|hello|dear|good morning|good afternoon)/i)) {
      return firstLine;
    }
    
    return '';
  }

  /**
   * Extract closing from text
   */
  extractClosing(text) {
    const lines = text.split('\n');
    const lastLines = lines.slice(-3).join('\n').trim();
    
    if (lastLines.match(/(thanks|thank you|best|regards|sincerely)/i)) {
      return lastLines;
    }
    
    return '';
  }

  /**
   * Update learning metrics in database
   */
  async updateLearningMetrics(analysis) {
    // Get current metrics
    const { data: currentMetrics } = await supabase
      .from('voice_learning_metrics')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    const totalDrafts = (currentMetrics?.total_drafts_generated || 0) + 1;
    const totalCorrections = (currentMetrics?.total_corrections_made || 0) + 1;
    
    // Calculate running averages
    const avgEditDistance = currentMetrics 
      ? ((currentMetrics.avg_edit_distance * (totalCorrections - 1)) + analysis.editDistance) / totalCorrections
      : analysis.editDistance;
    
    const avgSimilarity = currentMetrics
      ? ((currentMetrics.avg_similarity_score * (totalCorrections - 1)) + analysis.similarityScore) / totalCorrections
      : analysis.similarityScore;

    // Update or insert metrics
    const { error } = await supabase
      .from('voice_learning_metrics')
      .upsert({
        user_id: this.userId,
        total_drafts_generated: totalDrafts,
        total_corrections_made: totalCorrections,
        avg_edit_distance: avgEditDistance,
        avg_similarity_score: avgSimilarity,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Failed to update learning metrics:', error);
      throw error;
    }

    console.log(`📊 Learning metrics updated: ${totalCorrections} corrections, ${avgSimilarity.toFixed(2)} avg similarity`);
  }

  /**
   * Get current learning metrics
   */
  async getLearningMetrics() {
    const { data, error } = await supabase
      .from('voice_learning_metrics')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Failed to get learning metrics:', error);
      throw error;
    }

    return data || {
      total_drafts_generated: 0,
      total_corrections_made: 0,
      avg_edit_distance: 0,
      avg_similarity_score: 1.0,
      learning_iterations: 0,
      voice_confidence: 0.5
    };
  }

  /**
   * Refine voice profile based on accumulated corrections
   */
  async refineVoiceProfile() {
    try {
      console.log(`🎯 Refining voice profile for user: ${this.userId}`);

      // Mark learning as in progress
      await supabase
        .from('voice_learning_metrics')
        .update({ learning_in_progress: true })
        .eq('user_id', this.userId);

      // Get recent unlearned corrections
      const { data: corrections, error: correctionsError } = await supabase
        .from('ai_draft_corrections')
        .select('*')
        .eq('user_id', this.userId)
        .eq('learned', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (correctionsError) {
        throw correctionsError;
      }

      if (!corrections || corrections.length === 0) {
        console.log('⚠️ No unlearned corrections found');
        return;
      }

      // Aggregate learnings
      let totalEmpathyAdj = 0;
      let totalDirectnessAdj = 0;
      let totalFormalityAdj = 0;
      const allToneChanges = [];
      const allPhraseChanges = [];

      corrections.forEach(correction => {
        const patterns = correction.correction_patterns;
        totalEmpathyAdj += patterns.empathyAdjustment || 0;
        totalDirectnessAdj += patterns.directnessAdjustment || 0;
        totalFormalityAdj += patterns.formalityAdjustment || 0;
        
        if (patterns.toneChanges) allToneChanges.push(...patterns.toneChanges);
        if (patterns.phraseChanges) allPhraseChanges.push(...patterns.phraseChanges);
      });

      // Calculate average adjustments
      const avgEmpathyAdj = totalEmpathyAdj / corrections.length;
      const avgDirectnessAdj = totalDirectnessAdj / corrections.length;
      const avgFormalityAdj = totalFormalityAdj / corrections.length;

      // Get current voice profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('voice_profile')
        .eq('id', this.userId)
        .single();

      const currentVoice = profile?.voice_profile || {};
      const currentStyle = currentVoice.style_profile?.voice || {};

      // Apply adjustments
      const refinedVoice = {
        ...currentVoice,
        style_profile: {
          ...currentVoice.style_profile,
          voice: {
            ...currentStyle,
            empathyLevel: Math.max(0, Math.min(1, (currentStyle.empathyLevel || 0.7) + (avgEmpathyAdj * 0.1))),
            directnessLevel: Math.max(0, Math.min(1, (currentStyle.directnessLevel || 0.8) + (avgDirectnessAdj * 0.1))),
            formalityLevel: Math.max(0, Math.min(1, (currentStyle.formalityLevel || 0.8) + (avgFormalityAdj * 0.1)))
          },
          signaturePhrases: [
            ...(currentVoice.style_profile?.signaturePhrases || []),
            ...allPhraseChanges.slice(0, 5).map(phrase => ({ phrase, context: 'learned_from_corrections' }))
          ]
        },
        learning_count: (currentVoice.learning_count || 0) + 1,
        last_refined: new Date().toISOString()
      };

      // Update voice profile
      await supabase
        .from('profiles')
        .update({ voice_profile: refinedVoice })
        .eq('id', this.userId);

      // Mark corrections as learned
      const correctionIds = corrections.map(c => c.id);
      await supabase
        .from('ai_draft_corrections')
        .update({ 
          learned: true,
          learning_applied_at: new Date().toISOString()
        })
        .in('id', correctionIds);

      // Update learning metrics
      await supabase
        .from('voice_learning_metrics')
        .update({ 
          learning_iterations: (currentVoice.learning_count || 0) + 1,
          voice_confidence: Math.min((currentStyle.empathyLevel || 0.5) + 0.05, 1.0),
          last_learning_update: new Date().toISOString(),
          learning_in_progress: false
        })
        .eq('user_id', this.userId);

      console.log(`✅ Voice profile refined successfully. Learning iteration: ${refinedVoice.learning_count}`);

      return refinedVoice;

    } catch (error) {
      console.error('❌ Voice profile refinement failed:', error);
      
      // Reset learning_in_progress flag
      await supabase
        .from('voice_learning_metrics')
        .update({ learning_in_progress: false })
        .eq('user_id', this.userId);
      
      throw error;
    }
  }
}

export default VoiceRefinementService;





