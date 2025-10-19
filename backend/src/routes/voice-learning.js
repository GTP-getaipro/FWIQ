/**
 * Voice Learning API Routes
 * Handles draft corrections and voice profile refinement
 */

import express from 'express';
import Joi from 'joi';
import {  asyncHandler, validate, ValidationError  } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import {  createClient  } from '@supabase/supabase-js';

const router = express.Router();

// Validation schemas
const draftCorrectionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  threadId: Joi.string().required(),
  emailId: Joi.string().optional(),
  aiDraft: Joi.string().min(1).max(10000).required(),
  userFinal: Joi.string().min(1).max(10000).required(),
  category: Joi.string().valid('urgent', 'complaint', 'appointment', 'inquiry', 'followup', 'general').optional(),
  aiConfidence: Joi.number().min(0).max(1).optional(),
  emailContext: Joi.object().optional()
});

const metricsParamsSchema = Joi.object({
  userId: Joi.string().uuid().required()
});

// Initialize Supabase client
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/voice-learning/draft-correction
 * Record a draft correction for learning
 */
router.post('/draft-correction', validate(draftCorrectionSchema), asyncHandler(async (req, res) => {
  const {
    userId,
    threadId,
    emailId,
    aiDraft,
    userFinal,
    category,
    aiConfidence,
    emailContext
  } = req.body;

  logger.info('Processing draft correction', { userId, threadId, category });

  try {
    // Calculate edit distance and similarity
    const editDistance = calculateEditDistance(aiDraft, userFinal);
    const maxLength = Math.max(aiDraft.length, userFinal.length);
    const similarityScore = maxLength > 0 ? 1 - (editDistance / maxLength) : 1;

    // Determine correction type
    let correctionType = 'minor';
    if (similarityScore < 0.4) correctionType = 'complete_rewrite';
    else if (similarityScore < 0.7) correctionType = 'major';
    else if (similarityScore < 0.9) correctionType = 'moderate';

    // Analyze correction patterns
    const patterns = analyzeCorrectionPatterns(aiDraft, userFinal);

    // Store correction in database
    const { data: correction, error: insertError } = await supabaseAdmin
      .from('ai_draft_corrections')
      .insert({
        user_id: userId,
        thread_id: threadId,
        email_id: emailId,
        ai_draft_text: aiDraft,
        user_final_text: userFinal,
        edit_distance: editDistance,
        similarity_score: similarityScore,
        correction_type: correctionType,
        email_category: category,
        ai_confidence: aiConfidence,
        correction_patterns: patterns,
        sent_at: new Date().toISOString(),
        metadata: emailContext
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to store correction', { error: insertError, userId });
      throw insertError;
    }

    logger.info('✅ Draft correction stored', { 
      correctionId: correction.id,
      userId,
      similarityScore: similarityScore.toFixed(2),
      correctionType 
    });

    // Update learning metrics
    await updateLearningMetrics(userId, editDistance, similarityScore);

    // Check if refinement threshold is reached
    const metrics = await getLearningMetrics(userId);
    const shouldRefine = metrics.total_corrections_made >= 10 && !metrics.learning_in_progress;

    if (shouldRefine) {
      logger.info(`🎯 Refinement threshold reached for user ${userId}`, {
        totalCorrections: metrics.total_corrections_made
      });
      
      // Trigger refinement asynchronously (don't wait for it)
      refineVoiceProfile(userId).catch(err => {
        logger.error('Voice refinement failed', { error: err.message, userId });
      });
    }

    res.json({
      success: true,
      correctionId: correction.id,
      similarityScore: similarityScore.toFixed(2),
      correctionType,
      totalCorrections: metrics.total_corrections_made,
      shouldRefine,
      improvement: {
        avgSimilarity: metrics.avg_similarity_score?.toFixed(2) || '0.00',
        avgEditDistance: metrics.avg_edit_distance?.toFixed(0) || '0'
      }
    });

  } catch (error) {
    logger.error('Draft correction processing failed', { error: error.message, userId });
    res.status(500).json({
      success: false,
      error: 'Failed to process draft correction'
    });
  }
}));

/**
 * GET /api/voice-learning/metrics/:userId
 * Get learning metrics for a user
 */
router.get('/metrics/:userId', validate(metricsParamsSchema, 'params'), asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const metrics = await getLearningMetrics(userId);

  // Get recent corrections
  const { data: recentCorrections } = await supabaseAdmin
    .from('ai_draft_corrections')
    .select('created_at, similarity_score, correction_type, email_category')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calculate improvement trend
  const improvementTrend = calculateImprovementTrend(recentCorrections || []);

  res.json({
    success: true,
    metrics: {
      totalCorrections: metrics.total_corrections_made || 0,
      avgSimilarity: parseFloat(metrics.avg_similarity_score?.toFixed(2) || '1.00'),
      avgEditDistance: parseInt(metrics.avg_edit_distance || 0),
      learningIterations: metrics.learning_iterations || 0,
      voiceConfidence: parseFloat(metrics.voice_confidence?.toFixed(2) || '0.50'),
      lastUpdate: metrics.last_learning_update
    },
    improvementTrend,
    recentCorrections: recentCorrections || []
  });
}));

/**
 * POST /api/voice-learning/refine/:userId
 * Manually trigger voice profile refinement
 */
router.post('/refine/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  logger.info(`🔧 Manual voice refinement triggered for user ${userId}`);

  try {
    const result = await refineVoiceProfile(userId);

    res.json({
      success: true,
      message: 'Voice profile refined successfully',
      learningIteration: result.learningIteration,
      voiceConfidence: result.voiceConfidence
    });
  } catch (error) {
    logger.error('Manual voice refinement failed', { error: error.message, userId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateEditDistance(str1, str2) {
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
 * Analyze correction patterns
 */
function analyzeCorrectionPatterns(aiDraft, userFinal) {
  const aiLower = aiDraft.toLowerCase();
  const userLower = userFinal.toLowerCase();

  const toneChanges = [];
  if (userLower.includes('sorry') && !aiLower.includes('sorry')) toneChanges.push('added_apology');
  if (userLower.includes('urgent') && !aiLower.includes('urgent')) toneChanges.push('added_urgency');
  if (userLower.includes('please') && !aiLower.includes('please')) toneChanges.push('increased_formality');

  const empathyWords = ['sorry', 'understand', 'frustrating', 'apologize'];
  const empathyAdjustment = empathyWords.reduce((count, word) => 
    count + (userLower.split(word).length - aiLower.split(word).length), 0);

  const directWords = ['urgent', 'immediately', 'asap', 'critical'];
  const directnessAdjustment = directWords.reduce((count, word) => 
    count + (userLower.split(word).length - aiLower.split(word).length), 0);

  const formalWords = ['please', 'thank you', 'appreciate'];
  const casualWords = ['hey', 'thanks', 'no worries'];
  const formalityAdjustment = 
    formalWords.reduce((count, word) => count + (userLower.split(word).length - aiLower.split(word).length), 0) -
    casualWords.reduce((count, word) => count + (userLower.split(word).length - aiLower.split(word).length), 0);

  return {
    toneChanges,
    empathyAdjustment,
    directnessAdjustment,
    formalityAdjustment,
    lengthChange: userFinal.length - aiDraft.length,
    paragraphChange: userFinal.split('\n\n').length - aiDraft.split('\n\n').length
  };
}

/**
 * Update learning metrics
 */
async function updateLearningMetrics(userId, editDistance, similarityScore) {
  const { data: currentMetrics } = await supabaseAdmin
    .from('voice_learning_metrics')
    .select('*')
    .eq('user_id', userId)
    .single();

  const totalCorrections = (currentMetrics?.total_corrections_made || 0) + 1;
  
  const avgEditDistance = currentMetrics 
    ? ((currentMetrics.avg_edit_distance * (totalCorrections - 1)) + editDistance) / totalCorrections
    : editDistance;
  
  const avgSimilarity = currentMetrics
    ? ((currentMetrics.avg_similarity_score * (totalCorrections - 1)) + similarityScore) / totalCorrections
    : similarityScore;

  await supabaseAdmin
    .from('voice_learning_metrics')
    .upsert({
      user_id: userId,
      total_corrections_made: totalCorrections,
      avg_edit_distance: avgEditDistance,
      avg_similarity_score: avgSimilarity,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
}

/**
 * Get learning metrics
 */
async function getLearningMetrics(userId) {
  const { data } = await supabaseAdmin
    .from('voice_learning_metrics')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data || {
    total_corrections_made: 0,
    avg_edit_distance: 0,
    avg_similarity_score: 1.0,
    learning_iterations: 0,
    voice_confidence: 0.5
  };
}

/**
 * Refine voice profile based on corrections
 */
async function refineVoiceProfile(userId) {
  logger.info(`🎯 Starting voice refinement for user ${userId}`);

  // Mark as in progress
  await supabaseAdmin
    .from('voice_learning_metrics')
    .update({ learning_in_progress: true })
    .eq('user_id', userId);

  try {
    // Get unlearned corrections
    const { data: corrections } = await supabaseAdmin
      .from('ai_draft_corrections')
      .select('*')
      .eq('user_id', userId)
      .eq('learned', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!corrections || corrections.length === 0) {
      logger.warn('No unlearned corrections found', { userId });
      await supabaseAdmin
        .from('voice_learning_metrics')
        .update({ learning_in_progress: false })
        .eq('user_id', userId);
      return;
    }

    // Aggregate learnings
    let totalEmpathy = 0, totalDirectness = 0, totalFormality = 0;
    const allPhrases = [];

    corrections.forEach(c => {
      const patterns = c.correction_patterns;
      totalEmpathy += patterns.empathyAdjustment || 0;
      totalDirectness += patterns.directnessAdjustment || 0;
      totalFormality += patterns.formalityAdjustment || 0;
    });

    const avgEmpathy = totalEmpathy / corrections.length;
    const avgDirectness = totalDirectness / corrections.length;
    const avgFormality = totalFormality / corrections.length;

    // Get current voice profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('voice_profile')
      .eq('id', userId)
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
          empathyLevel: Math.max(0, Math.min(1, (currentStyle.empathyLevel || 0.7) + (avgEmpathy * 0.1))),
          directnessLevel: Math.max(0, Math.min(1, (currentStyle.directnessLevel || 0.8) + (avgDirectness * 0.1))),
          formalityLevel: Math.max(0, Math.min(1, (currentStyle.formalityLevel || 0.8) + (avgFormality * 0.1)))
        }
      },
      learning_count: (currentVoice.learning_count || 0) + 1,
      last_refined: new Date().toISOString()
    };

    // Update voice profile
    await supabaseAdmin
      .from('profiles')
      .update({ voice_profile: refinedVoice })
      .eq('id', userId);

    // Mark corrections as learned
    const correctionIds = corrections.map(c => c.id);
    await supabaseAdmin
      .from('ai_draft_corrections')
      .update({ 
        learned: true,
        learning_applied_at: new Date().toISOString()
      })
      .in('id', correctionIds);

    // Update metrics
    const voiceConfidence = Math.min((currentStyle.empathyLevel || 0.5) + 0.05, 1.0);
    await supabaseAdmin
      .from('voice_learning_metrics')
      .update({ 
        learning_iterations: refinedVoice.learning_count,
        voice_confidence: voiceConfidence,
        last_learning_update: new Date().toISOString(),
        learning_in_progress: false
      })
      .eq('user_id', userId);

    logger.info(`✅ Voice profile refined`, { 
      userId,
      learningIteration: refinedVoice.learning_count,
      correctionsApplied: corrections.length
    });

    return {
      learningIteration: refinedVoice.learning_count,
      voiceConfidence
    };

  } catch (error) {
    logger.error('Voice refinement failed', { error: error.message, userId });
    
    await supabaseAdmin
      .from('voice_learning_metrics')
      .update({ learning_in_progress: false })
      .eq('user_id', userId);
    
    throw error;
  }
}

/**
 * Calculate improvement trend from recent corrections
 */
function calculateImprovementTrend(corrections) {
  if (corrections.length < 2) return { trend: 'insufficient_data' };

  const recent = corrections.slice(0, 5);
  const older = corrections.slice(5, 10);

  const recentAvg = recent.reduce((sum, c) => sum + c.similarity_score, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, c) => sum + c.similarity_score, 0) / older.length
    : recentAvg;

  const improvement = recentAvg - olderAvg;

  return {
    trend: improvement > 0.05 ? 'improving' : improvement < -0.05 ? 'declining' : 'stable',
    recentAvgSimilarity: recentAvg.toFixed(2),
    olderAvgSimilarity: olderAvg.toFixed(2),
    change: (improvement * 100).toFixed(1) + '%'
  };
}

export default router;





