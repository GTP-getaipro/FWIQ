import express from 'express';
import {  createClient  } from '@supabase/supabase-js';
import {  asyncHandler  } from '../middleware/errorHandler.js';
import {  sendSuccess, sendError  } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client for health checks
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

/**
 * Basic health check
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    responseTime: Date.now() - startTime
  };

  sendSuccess(res, healthData, 'Health check successful');
}));

/**
 * Test endpoint for API client connection testing
 */
router.get('/test', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    service: 'floworx-api',
    timestamp: new Date().toISOString(),
    status: 'operational',
    version: process.env.npm_package_version || '1.0.0'
  });
}));

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const checks = {};

  // Check database connection
  try {
    const dbStart = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    checks.database = {
      status: error ? 'unhealthy' : 'healthy',
      responseTime: Date.now() - dbStart,
      error: error?.message
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }

  // Check OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiStart = Date.now();
      // Simple check - just verify the key format
      const keyValid = process.env.OPENAI_API_KEY.startsWith('sk-');
      
      checks.openai = {
        status: keyValid ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - aiStart,
        configured: true
      };
    } catch (error) {
      checks.openai = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        configured: true
      };
    }
  } else {
    checks.openai = {
      status: 'not_configured',
      configured: false
    };
  }

  // Check environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  checks.environment = {
    status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
    missing: missingEnvVars,
    configured: requiredEnvVars.length - missingEnvVars.length,
    total: requiredEnvVars.length
  };

  // Overall health status
  const allHealthy = Object.values(checks).every(check => 
    check.status === 'healthy' || check.status === 'not_configured'
  );

  const healthData = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    responseTime: Date.now() - startTime,
    checks
  };

  // Log unhealthy status
  if (!allHealthy) {
    logger.warn('Health check failed', healthData);
  }

  if (allHealthy) {
    sendSuccess(res, healthData, 'Detailed health check successful');
  } else {
    sendError(res, 'Health check failed', 'HEALTH_CHECK_FAILED', healthData, 503);
  }
}));

/**
 * Readiness probe
 */
router.get('/ready', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if we can connect to the database
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }

    sendSuccess(res, {
      status: 'ready',
      responseTime: Date.now() - startTime
    }, 'Service is ready');

  } catch (error) {
    logger.error('Readiness check failed:', error);
    
    sendError(res, 'Service not ready', 'NOT_READY', {
      status: 'not_ready',
      responseTime: Date.now() - startTime,
      error: error.message
    }, 503);
  }
}));

/**
 * Liveness probe
 */
router.get('/live', asyncHandler(async (req, res) => {
  sendSuccess(res, {
    status: 'alive',
    uptime: process.uptime(),
    pid: process.pid
  }, 'Service is alive');
}));

/**
 * Metrics endpoint
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const memUsage = process.memoryUsage();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    },
    cpu: process.cpuUsage(),
    version: {
      node: process.version,
      v8: process.versions.v8,
      app: process.env.npm_package_version || '1.0.0'
    },
    environment: process.env.NODE_ENV || 'development'
  };

  sendSuccess(res, metrics, 'Metrics retrieved successfully');
}));

export default router;
