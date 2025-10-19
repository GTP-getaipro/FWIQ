import supabaseClient from '../lib/supabaseClient.js';
import logger from '../utils/logger.js';

const { supabase } = supabaseClient;

/**
 * Authentication middleware for protecting routes
 * Uses Supabase authentication exclusively for security
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header missing',
        code: 'AUTH_HEADER_MISSING'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Token missing from authorization header',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token with Supabase - fail fast if invalid
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.warn('Supabase authentication failed:', {
        error: error.message,
        code: error.code,
        status: error.status
      });

      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        message: error.message
      });
    }

    if (!user) {
      logger.warn('Token valid but user not found');
      return res.status(401).json({
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      metadata: user.user_metadata || {},
      appMetadata: user.app_metadata || {}
    };

    logger.info(`Authenticated user: ${user.email} (${user.id})`);
    next();

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Role(s) allowed to access the route
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.email}: required ${roles}, has ${userRole}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user info if token is valid, but doesn't reject if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'user',
          metadata: user.user_metadata || {},
          appMetadata: user.app_metadata || {}
        };
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed:', error.message);
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without auth for optional middleware
  }
};

/**
 * API key authentication middleware
 * For service-to-service communication
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'API_KEY_MISSING'
    });
  }

  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'API_KEY_INVALID'
    });
  }

  // Set service user context
  req.user = {
    id: 'service',
    email: 'service@floworx.com',
    role: 'service',
    metadata: { type: 'api_key' },
    appMetadata: {}
  };

  logger.info('API key authentication successful');
  next();
};

/**
 * Rate limiting by user ID
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const userReqs = userRequests.get(userId);
      userRequests.set(userId, userReqs.filter(time => time > windowStart));
    }

    // Get current user requests
    const currentRequests = userRequests.get(userId) || [];

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded for user',
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    currentRequests.push(now);
    userRequests.set(userId, currentRequests);

    next();
  };
};

export {
  authMiddleware,
  requireRole,
  optionalAuth,
  apiKeyAuth,
  userRateLimit
};

export default {
  authMiddleware,
  requireRole,
  optionalAuth,
  apiKeyAuth,
  userRateLimit
};
