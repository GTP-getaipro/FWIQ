import express from 'express';
import Joi from 'joi';
import {  createClient  } from '@supabase/supabase-js';
import {  asyncHandler, validate, ValidationError, NotFoundError  } from '../middleware/errorHandler.js';
import {  userRateLimit, authMiddleware  } from '../middleware/auth.js';
import AIService from '../services/aiService.js';
import BusinessProfileService from '../services/businessProfileService.js';
import logger from '../utils/logger.js';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// Validation schemas
const classifyEmailSchema = Joi.object({
  from: Joi.string().email().required(),
  subject: Joi.string().max(200).required(),
  body: Joi.string().max(10000).required()
});

const generateResponseSchema = Joi.object({
  emailData: Joi.object({
    from: Joi.string().email().required(),
    subject: Joi.string().max(200).required(),
    body: Joi.string().max(10000).required()
  }).required(),
  category: Joi.string().valid('urgent', 'complaint', 'appointment', 'inquiry', 'followup', 'general').required(),
  businessContext: Joi.object({
    businessName: Joi.string().required(),
    businessType: Joi.string().required(),
    phone: Joi.string(),
    email: Joi.string().email()
  }).required()
});

const analyzeStyleSchema = Joi.object({
  emailHistory: Joi.array().items(Joi.object({
    type: Joi.string().valid('sent', 'received').required(),
    subject: Joi.string().required(),
    body: Joi.string().required()
  })).min(5).required()
});

const templateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string().valid('urgent', 'complaint', 'appointment', 'inquiry', 'followup', 'general').required(),
  subjectTemplate: Joi.string().max(200),
  bodyTemplate: Joi.string().max(2000).required(),
  variables: Joi.array().items(Joi.string()),
  enabled: Joi.boolean().default(true)
});

const businessProfileSchema = Joi.object({
  emails: Joi.array().items(Joi.object()).min(1).required(),
  userId: Joi.string().required(),
  provider: Joi.string().valid('gmail', 'outlook').optional(),
  websiteUrl: Joi.string().uri().optional()
});

const emailVoiceSchema = Joi.object({
  prompt: Joi.string().required(),
  businessType: Joi.string().optional(),
  emailSamples: Joi.array().items(Joi.object()).min(1).required()
});

// Apply rate limiting to AI endpoints
router.use(userRateLimit(30, 15 * 60 * 1000)); // 30 requests per 15 minutes

/**
 * Classify email using AI
 */
router.post('/classify', validate(classifyEmailSchema), asyncHandler(async (req, res) => {
  const emailData = req.body;
  const userId = req.user.id;

  try {
    const classification = await AIService.classifyEmail(emailData);

    logger.info(`Email classified for user ${userId}: ${classification.category} (${classification.confidence}%)`);

    res.json({
      message: 'Email classified successfully',
      classification
    });

  } catch (error) {
    logger.error('Email classification failed:', error);
    throw error;
  }
}));

/**
 * Generate AI response
 */
router.post('/generate-response', validate(generateResponseSchema), asyncHandler(async (req, res) => {
  const { emailData, category, businessContext } = req.body;
  const userId = req.user.id;

  try {
    const response = await AIService.generateStyleAwareResponse(
      userId,
      emailData,
      category,
      businessContext
    );

    logger.info(`AI response generated for user ${userId}: ${response.success}`);

    res.json({
      message: 'Response generated successfully',
      response: response.response,
      styleApplied: response.styleApplied,
      confidence: response.confidence,
      fallback: response.fallback || false
    });

  } catch (error) {
    logger.error('AI response generation failed:', error);
    throw error;
  }
}));

/**
 * Analyze communication style
 */
router.post('/analyze-style', validate(analyzeStyleSchema), asyncHandler(async (req, res) => {
  const { emailHistory } = req.body;
  const userId = req.user.id;

  try {
    const styleProfile = await AIService.analyzeCommunicationStyle(userId, emailHistory);

    logger.info(`Communication style analyzed for user ${userId}`);

    res.json({
      message: 'Communication style analyzed successfully',
      styleProfile
    });

  } catch (error) {
    logger.error('Communication style analysis failed:', error);
    throw error;
  }
}));

/**
 * Analyze email voice patterns (for voice training)
 */
router.post('/analyze-email-voice', asyncHandler(async (req, res) => {
  const { emails, businessType } = req.body;
  const userId = req.user.id;

  try {
    logger.info(`Voice analysis request for user ${userId} with ${emails?.length || 0} emails`);

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'No emails provided for analysis',
        code: 'NO_EMAILS'
      });
    }

    // Call AI service to analyze voice patterns
    const voiceAnalysis = await AIService.analyzeEmailVoice(userId, emails, businessType);

    logger.info(`Voice analysis completed for user ${userId}`);

    res.json({
      message: 'Voice analysis completed successfully',
      voiceAnalysis
    });

  } catch (error) {
    logger.error('Voice analysis failed:', error);
    throw error;
  }
}));

/**
 * Get user's communication style profile
 */
router.get('/style-profile', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: styleProfile, error } = await supabase
      .from('communication_styles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch style profile:', error);
      throw error;
    }

    res.json({
      styleProfile: styleProfile || null,
      hasProfile: !!styleProfile
    });

  } catch (error) {
    logger.error('Failed to get style profile:', error);
    throw error;
  }
}));

/**
 * Process email through complete AI pipeline
 */
router.post('/process-pipeline', validate(generateResponseSchema), asyncHandler(async (req, res) => {
  const { emailData, businessContext } = req.body;
  const userId = req.user.id;

  try {
    const result = await AIService.processEmailPipeline(emailData, businessContext, userId);

    logger.info(`AI pipeline processed email for user ${userId}: ${result.success}`);

    res.json({
      message: 'Email processed through AI pipeline successfully',
      result: {
        success: result.success,
        classification: result.classification,
        finalResponse: result.finalResponse,
        styleApplied: result.styleApplied,
        confidence: result.confidence,
        quality: result.quality,
        triggeredRules: result.triggeredRules?.length || 0,
        escalated: result.escalationResult?.escalated || false,
        pipeline: result.pipeline
      }
    });

  } catch (error) {
    logger.error('AI pipeline processing failed:', error);
    throw error;
  }
}));

/**
 * Get AI processing statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { timeframe = '7d' } = req.query;
  const userId = req.user.id;

  try {
    const stats = await AIService.getAIStats(userId, timeframe);

    res.json({
      message: 'AI statistics retrieved successfully',
      stats: stats || {
        total: 0,
        byCategory: {},
        byUrgency: {},
        averageConfidence: 0,
        styleAppliedCount: 0
      }
    });

  } catch (error) {
    logger.error('Failed to get AI stats:', error);
    throw error;
  }
}));

/**
 * Create response template
 */
router.post('/templates', validate(templateSchema), asyncHandler(async (req, res) => {
  const templateData = req.body;
  const userId = req.user.id;

  try {
    // Import ResponseTemplateEngine dynamically
    const { ResponseTemplateEngine } = await import('../../src/lib/responseTemplateEngine.js');
    const templateEngine = new ResponseTemplateEngine();

    const template = await templateEngine.createTemplate(userId, templateData);

    logger.info(`Response template created for user ${userId}: ${templateData.name}`);

    res.status(201).json({
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    logger.error('Template creation failed:', error);
    throw error;
  }
}));

/**
 * Get user's response templates
 */
router.get('/templates', asyncHandler(async (req, res) => {
  const { category, limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  try {
    const pagination = parsePaginationParams(req.query);

    // Query templates with pagination
    let query = supabase
      .from('response_templates')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch templates:', error);
      throw error;
    }

    res.json(buildPaginatedResponse(templates, count, pagination.limit, pagination.offset));

  } catch (error) {
    logger.error('Failed to get templates:', error);
    throw error;
  }
}));

/**
 * Update response template
 */
router.put('/templates/:templateId', validate(templateSchema), asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const updates = req.body;
  const userId = req.user.id;

  try {
    // Verify template ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('response_templates')
      .select('id')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    // Import ResponseTemplateEngine dynamically
    const { ResponseTemplateEngine } = await import('../../src/lib/responseTemplateEngine.js');
    const templateEngine = new ResponseTemplateEngine();

    const template = await templateEngine.updateTemplate(templateId, updates);

    logger.info(`Response template updated for user ${userId}: ${templateId}`);

    res.json({
      message: 'Template updated successfully',
      template
    });

  } catch (error) {
    logger.error('Template update failed:', error);
    throw error;
  }
}));

/**
 * Delete response template
 */
router.delete('/templates/:templateId', asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const userId = req.user.id;

  try {
    // Verify template ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('response_templates')
      .select('id')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    // Import ResponseTemplateEngine dynamically
    const { ResponseTemplateEngine } = await import('../../src/lib/responseTemplateEngine.js');
    const templateEngine = new ResponseTemplateEngine();

    await templateEngine.deleteTemplate(templateId);

    logger.info(`Response template deleted for user ${userId}: ${templateId}`);

    res.json({
      message: 'Template deleted successfully'
    });

  } catch (error) {
    logger.error('Template deletion failed:', error);
    throw error;
  }
}));

/**
 * Render template with variables
 */
router.post('/templates/:templateId/render', asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { variables = {} } = req.body;
  const userId = req.user.id;

  try {
    // Verify template ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('response_templates')
      .select('id')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTemplate) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    // Import ResponseTemplateEngine dynamically
    const { ResponseTemplateEngine } = await import('../../src/lib/responseTemplateEngine.js');
    const templateEngine = new ResponseTemplateEngine();

    const rendered = await templateEngine.renderTemplate(templateId, variables);

    res.json({
      message: 'Template rendered successfully',
      rendered
    });

  } catch (error) {
    logger.error('Template rendering failed:', error);
    throw error;
  }
}));

/**
 * Validate AI pipeline configuration
 */
router.get('/validate-config', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const validation = await AIService.validateConfiguration();

    res.json({
      message: 'Configuration validation completed',
      validation
    });

  } catch (error) {
    logger.error('Configuration validation failed:', error);
    throw error;
  }
}));

/**
 * Get AI service health status
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const health = AIService.getHealthStatus();

    res.json({
      message: 'AI service health retrieved successfully',
      health
    });

  } catch (error) {
    logger.error('Failed to get AI service health:', error);
    throw error;
  }
}));

/**
 * Analyze business profile from emails
 */
router.post('/analyze-business-profile', validate(businessProfileSchema), asyncHandler(async (req, res) => {
  const { emails, userId, provider, websiteUrl } = req.body;

  logger.info(`Business profile analysis request for user ${userId}`);

  // Verify user exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    logger.error('User profile not found:', profileError?.message);
    throw new NotFoundError('User profile not found');
  }

  logger.info('User profile verified');

  // Analyze business profile using AI
  const parsedProfile = await BusinessProfileService.analyzeBusinessProfile(emails, userId);

  res.json({
    success: true,
    profile: parsedProfile,
    emailCount: emails.length,
    provider: provider || 'unknown',
    timestamp: new Date().toISOString()
  });
}));

/**
 * Analyze email voice/writing style
 */
router.post('/analyze-email-voice', validate(emailVoiceSchema), asyncHandler(async (req, res) => {
  const { prompt, businessType, emailSamples } = req.body;

  logger.info(`Email voice analysis for ${businessType || 'unknown'} business`);

  // Analyze email voice using AI
  const analysis = await BusinessProfileService.analyzeEmailVoice(prompt, businessType, emailSamples);

  res.json({
    success: true,
    analysis,
    model: 'gpt-4o-mini',
    timestamp: new Date().toISOString()
  });
}));

export default router;
