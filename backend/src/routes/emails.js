import express from 'express';
import Joi from 'joi';
import {  createClient  } from '@supabase/supabase-js';
import {  asyncHandler, validate, NotFoundError  } from '../middleware/errorHandler.js';
import {  userRateLimit  } from '../middleware/auth.js';
import EmailService from '../services/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// Validation schemas
const emailProcessSchema = Joi.object({
  from: Joi.string().email().required(),
  to: Joi.string().email().required(),
  subject: Joi.string().max(200).required(),
  body: Joi.string().max(10000).required(),
  provider: Joi.string().valid('gmail', 'outlook', 'other').default('other'),
  messageId: Joi.string(),
  receivedAt: Joi.date().iso().default(() => new Date())
});

const recentEmailsSchema = Joi.object({
  userId: Joi.string().required(),
  maxResults: Joi.number().integer().min(1).max(100).default(50),
  includeBody: Joi.boolean().default(true)
});

const emailResponseSchema = Joi.object({
  emailId: Joi.string().required(),
  response: Joi.string().max(5000).required(),
  responseType: Joi.string().valid('manual', 'ai_generated', 'template').default('manual')
});

const emailSearchSchema = Joi.object({
  category: Joi.string().valid('urgent', 'complaint', 'appointment', 'inquiry', 'followup', 'general'),
  urgency: Joi.string().valid('critical', 'high', 'normal', 'low'),
  from: Joi.string().email(),
  subject: Joi.string(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

// Helper function to extract email body from Gmail payload
function extractEmailBody(payload) {
  try {
    if (payload.body?.data) {
      // Simple text body
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      // Multipart message
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          // For HTML emails, we'll use the HTML content
          const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Simple HTML to text conversion (remove tags)
          return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
      }
    }

    return '';
  } catch (error) {
    logger.warn('Error extracting email body:', error);
    return '';
  }
}

// Helper function to fetch Gmail emails
async function fetchGmailEmails(integration, options) {
  const { userId, maxResults, includeBody } = options;

  // Check if access token is still valid
  const now = new Date();
  const tokenExpiry = new Date(integration.access_token_expires_at);

  if (tokenExpiry <= now) {
    logger.info('Access token expired, needs refresh');
    throw new Error('Access token expired. Please refresh token.');
  }

  // Fetch recent sent emails using Gmail API
  const gmailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:sent&maxResults=${maxResults}`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!gmailResponse.ok) {
    const errorData = await gmailResponse.json();
    logger.error('Gmail API error:', gmailResponse.status, errorData);
    throw new Error(`Gmail API error: ${gmailResponse.status}`);
  }

  const gmailData = await gmailResponse.json();
  logger.info(`Found ${gmailData.messages?.length || 0} sent messages`);

  if (!gmailData.messages || gmailData.messages.length === 0) {
    return {
      success: true,
      emails: [],
      provider: 'gmail'
    };
  }

  // Fetch full message details for each email
  const emailPromises = gmailData.messages.slice(0, Math.min(maxResults, 20)).map(async (message) => {
    try {
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!messageResponse.ok) {
        logger.warn(`Failed to fetch message ${message.id}: ${messageResponse.status}`);
        return null;
      }

      const messageData = await messageResponse.json();

      // Extract headers
      const headers = messageData.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const email = {
        id: message.id,
        subject: getHeader('Subject'),
        to: getHeader('To'),
        from: getHeader('From'),
        date: getHeader('Date'),
        snippet: messageData.snippet || '',
        body: includeBody ? extractEmailBody(messageData.payload) : ''
      };

      return email;
    } catch (error) {
      logger.warn(`Error processing message ${message.id}:`, error.message);
      return null;
    }
  });

  const emails = (await Promise.all(emailPromises)).filter(email => email !== null);
  logger.info(`Successfully processed ${emails.length} emails`);

  return {
    success: true,
    emails,
    provider: 'gmail',
    totalFound: gmailData.messages.length
  };
}

// Helper function to fetch Outlook emails
async function fetchOutlookEmails(integration, options) {
  const { userId, maxResults, includeBody } = options;

  // Fetch recent sent emails using Microsoft Graph API
  const graphResponse = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages?$top=${maxResults}&$orderby=sentDateTime desc`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!graphResponse.ok) {
    const errorData = await graphResponse.json();
    logger.error('Microsoft Graph API error:', graphResponse.status, errorData);
    throw new Error(`Microsoft Graph API error: ${graphResponse.status}`);
  }

  const graphData = await graphResponse.json();
  logger.info(`Found ${graphData.value?.length || 0} sent messages`);

  if (!graphData.value || graphData.value.length === 0) {
    return {
      success: true,
      emails: [],
      provider: 'outlook'
    };
  }

  // Process emails
  const emails = graphData.value.slice(0, Math.min(maxResults, 20)).map(message => {
    const email = {
      id: message.id,
      subject: message.subject || '',
      to: message.toRecipients?.map(r => r.emailAddress?.address).join(', ') || '',
      from: message.from?.emailAddress?.address || '',
      date: message.sentDateTime || '',
      snippet: message.bodyPreview || '',
      body: includeBody ? (message.body?.content || '') : ''
    };
    return email;
  });

  logger.info(`Successfully processed ${emails.length} emails`);

  return {
    success: true,
    emails,
    provider: 'outlook',
    totalFound: graphData.value.length
  };
}

/**
 * Fetch recent emails (Gmail or Outlook)
 */
router.post('/recent-emails', validate(recentEmailsSchema), asyncHandler(async (req, res) => {
  const { userId, maxResults, includeBody } = req.body;

  logger.info(`Fetching recent emails for user: ${userId}`);

  // Get user's email integration (Gmail or Outlook)
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .in('provider', ['gmail', 'outlook'])
    .eq('status', 'active')
    .single();

  if (integrationError || !integration) {
    throw new NotFoundError('Email integration not found');
  }

  logger.info(`Found ${integration.provider} integration for user: ${userId}`);

  // Route to appropriate email provider
  let result;
  if (integration.provider === 'gmail') {
    result = await fetchGmailEmails(integration, { userId, maxResults, includeBody });
  } else if (integration.provider === 'outlook') {
    result = await fetchOutlookEmails(integration, { userId, maxResults, includeBody });
  } else {
    throw new ValidationError('Unsupported email provider');
  }

  res.json(result);
}));

// Apply rate limiting to email processing endpoints
router.use('/process', userRateLimit(50, 15 * 60 * 1000)); // 50 requests per 15 minutes

/**
 * Process incoming email
 */
router.post('/process', validate(emailProcessSchema), asyncHandler(async (req, res) => {
  const emailData = req.body;
  const userId = req.user.id;

  logger.info(`Processing email from ${emailData.from} for user ${userId}`);

  try {
    // Process email through EmailService
    const result = await EmailService.processEmail(emailData, userId);

    logger.info(`Email processed successfully for user ${userId}: ${result.success}`);

    res.json({
      message: 'Email processed successfully',
      result: {
        success: result.success,
        emailId: result.emailId,
        classification: result.classification,
        confidence: result.confidence,
        styleApplied: result.styleApplied,
        triggeredRules: result.triggeredRules,
        escalated: result.escalated,
        pipeline: result.pipeline
      },
      response: result.response
    });

  } catch (error) {
    logger.error('Email processing failed:', error);
    throw error;
  }
}));

/**
 * Get email queue status
 */
router.get('/queue', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const queueStatus = await EmailService.getQueueStatus(userId);

    res.json({
      message: 'Queue status retrieved successfully',
      queue: queueStatus
    });

  } catch (error) {
    logger.error('Failed to get queue status:', error);
    throw error;
  }
}));

/**
 * Get recent emails
 */
router.get('/recent', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const result = await EmailService.getRecentEmails(userId, parseInt(limit), parseInt(offset));

    res.json({
      message: 'Recent emails retrieved successfully',
      emails: result.emails,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get recent emails:', error);
    throw error;
  }
}));

/**
 * Retry failed email
 */
router.post('/retry', asyncHandler(async (req, res) => {
  const { emailId } = req.body;
  const userId = req.user.id;

  if (!emailId) {
    return res.status(400).json({
      error: 'Email ID is required',
      code: 'EMAIL_ID_MISSING'
    });
  }

  try {
    const result = await EmailService.retryEmail(emailId, userId);

    res.json({
      message: 'Email retry completed successfully',
      result: {
        success: result.success,
        emailId: result.emailId,
        classification: result.classification,
        confidence: result.confidence,
        styleApplied: result.styleApplied,
        triggeredRules: result.triggeredRules,
        escalated: result.escalated,
        pipeline: result.pipeline
      },
      response: result.response
    });

  } catch (error) {
    logger.error('Email retry failed:', error);
    throw error;
  }
}));

/**
 * Get email processing history
 */
router.get('/history', validate(emailSearchSchema, 'query'), asyncHandler(async (req, res) => {
  const { category, urgency, from, subject, startDate, endDate, limit, offset } = req.query;
  const userId = req.user.id;

  try {
    let query = supabase
      .from('email_logs')
      .select(`
        id,
        email_from,
        email_subject,
        category,
        urgency,
        response_sent,
        escalated,
        escalation_reason,
        processing_completed,
        created_at,
        metadata
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) query = query.eq('category', category);
    if (urgency) query = query.eq('urgency', urgency);
    if (from) query = query.ilike('email_from', `%${from}%`);
    if (subject) query = query.ilike('email_subject', `%${subject}%`);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: emails, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch email history:', error);
      throw error;
    }

    res.json({
      emails: emails || [],
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count > offset + limit
      }
    });

  } catch (error) {
    logger.error('Failed to get email history:', error);
    throw error;
  }
}));

/**
 * Get AI response history
 */
router.get('/ai-responses', asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.id;

  try {
    const { data: responses, error } = await supabase
      .from('ai_responses')
      .select(`
        id,
        email_id,
        category,
        urgency,
        ai_response,
        final_response,
        style_applied,
        confidence,
        response_type,
        status,
        created_at,
        metadata
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      logger.error('Failed to fetch AI responses:', error);
      throw error;
    }

    res.json({
      responses: responses || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: responses?.length === parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get AI responses:', error);
    throw error;
  }
}));

/**
 * Get email statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { timeframe = '7d' } = req.query;
  const userId = req.user.id;

  try {
    // Calculate date range
    const now = new Date();
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get email statistics
    const { data: emailStats, error: emailError } = await supabase
      .from('email_logs')
      .select('category, urgency, response_sent, escalated, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (emailError) {
      logger.error('Failed to fetch email stats:', emailError);
      throw emailError;
    }

    // Get AI response statistics
    const { data: aiStats, error: aiError } = await supabase
      .from('ai_responses')
      .select('category, confidence, style_applied, response_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (aiError) {
      logger.error('Failed to fetch AI stats:', aiError);
      throw aiError;
    }

    // Calculate statistics
    const stats = {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      emails: {
        total: emailStats?.length || 0,
        byCategory: {},
        byUrgency: {},
        responded: emailStats?.filter(e => e.response_sent).length || 0,
        escalated: emailStats?.filter(e => e.escalated).length || 0
      },
      aiResponses: {
        total: aiStats?.length || 0,
        styleApplied: aiStats?.filter(r => r.style_applied).length || 0,
        averageConfidence: 0,
        byType: {}
      }
    };

    // Calculate email category and urgency stats
    emailStats?.forEach(email => {
      stats.emails.byCategory[email.category] = (stats.emails.byCategory[email.category] || 0) + 1;
      stats.emails.byUrgency[email.urgency] = (stats.emails.byUrgency[email.urgency] || 0) + 1;
    });

    // Calculate AI response stats
    let totalConfidence = 0;
    aiStats?.forEach(response => {
      stats.aiResponses.byType[response.response_type] = (stats.aiResponses.byType[response.response_type] || 0) + 1;
      totalConfidence += response.confidence || 0;
    });

    if (aiStats?.length > 0) {
      stats.aiResponses.averageConfidence = totalConfidence / aiStats.length;
    }

    res.json(stats);

  } catch (error) {
    logger.error('Failed to get email statistics:', error);
    throw error;
  }
}));

/**
 * Send response to email
 */
router.post('/respond', validate(emailResponseSchema), asyncHandler(async (req, res) => {
  const { emailId, response, responseType } = req.body;
  const userId = req.user.id;

  try {
    // Store response in AI responses table
    const { data: responseData, error: responseError } = await supabase
      .from('ai_responses')
      .insert({
        user_id: userId,
        email_id: emailId,
        ai_response: response,
        final_response: response,
        response_type: responseType,
        status: 'sent',
        confidence: responseType === 'manual' ? 100 : 75
      })
      .select('id')
      .single();

    if (responseError) {
      logger.error('Failed to store response:', responseError);
      throw responseError;
    }

    // Update email log to mark as responded
    const { error: updateError } = await supabase
      .from('email_logs')
      .update({ 
        response_sent: true,
        metadata: { response_id: responseData.id }
      })
      .eq('user_id', userId)
      .eq('email_from', emailId); // Assuming emailId is the from address for simplicity

    if (updateError) {
      logger.warn('Failed to update email log:', updateError);
    }

    logger.info(`Response sent for email ${emailId} by user ${userId}`);

    res.json({
      message: 'Response sent successfully',
      responseId: responseData.id
    });

  } catch (error) {
    logger.error('Failed to send response:', error);
    throw error;
  }
}));

/**
 * Get email by ID
 */
router.get('/:emailId', asyncHandler(async (req, res) => {
  const { emailId } = req.params;
  const userId = req.user.id;

  try {
    const { data: email, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();

    if (error || !email) {
      throw new NotFoundError('Email not found');
    }

    // Get associated AI responses
    const { data: responses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('email_id', email.email_from)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    res.json({
      email,
      responses: responses || []
    });

  } catch (error) {
    logger.error('Failed to get email:', error);
    throw error;
  }
}));

/**
 * Delete email from history
 */
router.delete('/:emailId', asyncHandler(async (req, res) => {
  const { emailId } = req.params;
  const userId = req.user.id;

  try {
    const { error } = await supabase
      .from('email_logs')
      .delete()
      .eq('id', emailId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to delete email:', error);
      throw error;
    }

    logger.info(`Email ${emailId} deleted by user ${userId}`);

    res.json({
      message: 'Email deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete email:', error);
    throw error;
  }
}));

/**
 * Store email log entry
 */
router.post('/logs', asyncHandler(async (req, res) => {
  const { user_id, provider, status, processed_at, email_from, email_subject, message_id } = req.body;

  if (!user_id || !provider) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: user_id and provider'
    });
  }

  // Use the updated email_logs schema with proper column names
  const emailLogData = {
    user_id: user_id,
    provider: provider,
    message_id: message_id || null,
    subject: email_subject || 'No Subject',
    from_email: email_from || 'unknown@example.com',
    processed_at: processed_at || new Date().toISOString(),
    meta: {
      status: status || 'normal',
      urgency: status === 'urgent' ? 'urgent' : 'normal',
      response_sent: false
    }
  };

  // Insert the email log entry
  const { data, error } = await supabase
    .from('email_logs')
    .insert(emailLogData)
    .select();

  if (error) {
    logger.error('Failed to store email log:', error);
    throw error;
  }

  logger.info(`Email log stored: ${message_id || 'no-message-id'}`);
  res.json({
    success: true,
    data: data[0]
  });
}));

export default router;
