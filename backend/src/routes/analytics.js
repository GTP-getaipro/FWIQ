import express from 'express';
import Joi from 'joi';
import {  createClient  } from '@supabase/supabase-js';
import {  asyncHandler, validate, ValidationError  } from '../middleware/errorHandler.js';
import {  authMiddleware  } from '../middleware/auth.js';
import {  sendSuccess, sendError, sendValidationError  } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validation schemas
const analyticsEventSchema = Joi.object({
  type: Joi.string().min(1).max(100).required(),
  data: Joi.object().default({})
});

const sessionDataSchema = Joi.object({
  sessionId: Joi.string().uuid().optional(),
  duration: Joi.number().integer().min(0).optional(),
  pageViews: Joi.number().integer().min(0).optional(),
  interactions: Joi.number().integer().min(0).optional(),
  errors: Joi.array().items(Joi.object()).optional(),
  metadata: Joi.object().optional()
});

const dashboardQuerySchema = Joi.object({
  timeRange: Joi.string().valid('1h', '24h', '7d', '30d').default('24h')
});

/**
 * POST /api/analytics/events
 * Store analytics events from frontend
 */
router.post('/events', authMiddleware, validate(analyticsEventSchema), asyncHandler(async (req, res) => {
  const { type, data } = req.body;
  const userId = req.user.id;

  try {
    // Store event in outlook_analytics_events table
    const { error } = await supabase
      .from('outlook_analytics_events')
      .insert({
        user_id: userId,
        event_type: type,
        data: data || {},
        provider: 'general',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Failed to store analytics event:', error);
      throw error;
    }

    logger.info(`Analytics event stored: ${type} for user ${userId}`);

    sendSuccess(res, { eventType: type, userId }, 'Analytics event stored successfully');

  } catch (error) {
    logger.error('Analytics event storage failed:', error);
    throw error;
  }
}));

/**
 * POST /api/analytics/sessions
 * Store session analytics data
 */
router.post('/sessions', authMiddleware, validate(sessionDataSchema), asyncHandler(async (req, res) => {
  const sessionData = req.body;
  const userId = req.user.id;

  try {
    // Store session summary as an event
    const { error } = await supabase
      .from('outlook_analytics_events')
      .insert({
        user_id: userId,
        event_type: 'session_summary',
        data: {
          ...sessionData,
          timestamp: new Date().toISOString()
        },
        provider: 'general',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Failed to store session data:', error);
      throw error;
    }

    logger.info(`Session data stored for user ${userId}`);

    sendSuccess(res, { sessionId, userId }, 'Session data stored successfully');

  } catch (error) {
    logger.error('Session data storage failed:', error);
    throw error;
  }
}));

/**
 * GET /api/analytics/dashboard/:userId
 * Get analytics dashboard data for a user
 */
router.get('/dashboard/:userId', authMiddleware, validate(dashboardQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { timeRange } = req.query;

  // Ensure user can only access their own data
  if (req.user.id !== userId) {
    throw new ValidationError('Unauthorized access to user data');
  }

  try {
    // Calculate date range
    const now = new Date();
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 30d
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Get analytics events for the time range
    const { data: events, error: eventsError } = await supabase
      .from('outlook_analytics_events')
      .select('event_type, data, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (eventsError) {
      logger.error('Failed to fetch analytics events:', eventsError);
      throw eventsError;
    }

    // Get performance metrics for the time range
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('metric_name, metric_value, metric_date, dimensions')
      .eq('client_id', userId)
      .gte('metric_date', startDate.toISOString())
      .order('metric_date', { ascending: false });

    if (metricsError) {
      logger.warn('Failed to fetch performance metrics:', metricsError);
      // Don't throw error for metrics as they might not exist
    }

    // Process analytics data
    const analytics = {
      timeRange,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      events: {
        total: events?.length || 0,
        byType: {},
        recent: events?.slice(0, 10) || []
      },
      performance: {
        total: metrics?.length || 0,
        byMetric: {},
        averageResponseTime: 0
      }
    };

    // Count events by type
    events?.forEach(event => {
      analytics.events.byType[event.event_type] = (analytics.events.byType[event.event_type] || 0) + 1;
    });

    // Process performance metrics
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    metrics?.forEach(metric => {
      analytics.performance.byMetric[metric.metric_name] = (analytics.performance.byMetric[metric.metric_name] || 0) + 1;
      
      if (metric.metric_name === 'response_time') {
        totalResponseTime += parseFloat(metric.metric_value) || 0;
        responseTimeCount++;
      }
    });

    if (responseTimeCount > 0) {
      analytics.performance.averageResponseTime = totalResponseTime / responseTimeCount;
    }

    logger.info(`Analytics dashboard data retrieved for user ${userId} (${timeRange})`);

    sendSuccess(res, analytics, 'Analytics dashboard data retrieved successfully');

  } catch (error) {
    logger.error('Failed to get analytics dashboard data:', error);
    throw error;
  }
}));

export default router;
