import express from 'express';
import Joi from 'joi';
import {  createClient  } from '@supabase/supabase-js';
import {  asyncHandler, validate, ValidationError  } from '../middleware/errorHandler.js';
import {  sendSuccess, sendError  } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// Validation schema
const cspReportSchema = Joi.object({
  type: Joi.string().optional(),
  timestamp: Joi.string().isoDate().optional(),
  userAgent: Joi.string().optional(),
  url: Joi.string().uri().optional(),
  violation: Joi.object({
    documentURI: Joi.string().optional(),
    referrer: Joi.string().optional(),
    blockedURI: Joi.string().optional(),
    violatedDirective: Joi.string().optional(),
    effectiveDirective: Joi.string().optional(),
    originalPolicy: Joi.string().optional(),
    disposition: Joi.string().optional(),
    statusCode: Joi.number().optional(),
    sourceFile: Joi.string().optional(),
    lineNumber: Joi.number().optional(),
    columnNumber: Joi.number().optional()
  }).optional()
}).unknown(true); // Allow additional properties for CSP reports

/**
 * POST /api/csp-reports
 * Handle Content Security Policy violation reports
 */
router.post('/csp-reports', validate(cspReportSchema), asyncHandler(async (req, res) => {
  const reportData = req.body;

  try {
    // Extract violation data
    const violation = {
      type: reportData.type || 'csp-violation',
      timestamp: reportData.timestamp || new Date().toISOString(),
      user_agent: reportData.userAgent || req.get('User-Agent'),
      url: reportData.url || req.get('Referer') || 'unknown',
      violation_data: reportData.violation || reportData,
      ip_address: req.ip || req.connection.remoteAddress,
      referer: req.get('Referer'),
      created_at: new Date().toISOString()
    };

    // Log the violation for monitoring
    logger.warn('CSP Violation Reported', {
      type: violation.type,
      url: violation.url,
      violated_directive: violation.violation_data?.violatedDirective || violation.violation_data?.effectiveDirective,
      blocked_uri: violation.violation_data?.blockedURI,
      source_file: violation.violation_data?.sourceFile,
      line_number: violation.violation_data?.lineNumber,
      column_number: violation.violation_data?.columnNumber,
      user_agent: violation.user_agent,
      ip_address: violation.ip_address,
      timestamp: violation.timestamp
    });

    // Store in database if outlook_analytics_events table exists
    // This provides a fallback storage mechanism
    try {
      await supabase
        .from('outlook_analytics_events')
        .insert({
          event_type: 'csp_violation',
          data: violation,
          provider: 'security',
          timestamp: violation.timestamp,
          created_at: violation.created_at
        });
    } catch (dbError) {
      // Don't fail the request if database storage fails
      logger.warn('Failed to store CSP violation in database:', dbError.message);
    }

    // Return success response
    sendSuccess(res, { violationId: violation.timestamp }, 'CSP violation report received');

  } catch (error) {
    logger.error('CSP violation report processing failed:', error);
    
    // Still return success to avoid breaking the reporting mechanism
    sendSuccess(res, null, 'CSP violation report received (processing error logged)');
  }
}));

export default router;
