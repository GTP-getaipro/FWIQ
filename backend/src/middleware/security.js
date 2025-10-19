/**
 * Security Middleware for FloWorx Backend
 * Comprehensive security measures for Express.js backend
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

class SecurityMiddleware {
  constructor() {
    this.rateLimits = this.createRateLimits();
    this.corsOptions = this.getCorsOptions();
    this.helmetOptions = this.getHelmetOptions();
  }

  /**
   * Create rate limiting configurations
   * @returns {Object} Rate limit configurations
   */
  createRateLimits() {
    return {
      // General API rate limiting
      api: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
          });
        }
      }),

      // Authentication rate limiting
      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 auth requests per windowMs
        message: {
          error: 'Too many authentication attempts, please try again later.',
          retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        handler: (req, res) => {
          res.status(429).json({
            error: 'Authentication rate limit exceeded',
            message: 'Too many authentication attempts, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
          });
        }
      }),

      // Email sending rate limiting
      email: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // limit each user to 50 emails per hour
        keyGenerator: (req) => {
          return req.user?.id || req.ip;
        },
        message: {
          error: 'Email rate limit exceeded, please try again later.',
          retryAfter: '1 hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            error: 'Email rate limit exceeded',
            message: 'Too many emails sent, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
          });
        }
      }),

      // AI requests rate limiting
      ai: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 100, // limit each user to 100 AI requests per hour
        keyGenerator: (req) => {
          return req.user?.id || req.ip;
        },
        message: {
          error: 'AI request rate limit exceeded, please try again later.',
          retryAfter: '1 hour'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            error: 'AI rate limit exceeded',
            message: 'Too many AI requests, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
          });
        }
      })
    };
  }

  /**
   * Get CORS configuration
   * @returns {Object} CORS options
   */
  getCorsOptions() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://app.floworx-iq.com'
    ];

    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID'
      ],
      exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset']
    };
  }

  /**
   * Get Helmet security options
   * @returns {Object} Helmet options
   */
  getHelmetOptions() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for some frontend frameworks
            "https://accounts.google.com",
            "https://login.microsoftonline.com"
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:"
          ],
          connectSrc: [
            "'self'",
            "https://api.openai.com",
            "https://*.supabase.co",
            "https://*.supabase.in",
            "https://accounts.google.com",
            "https://login.microsoftonline.com",
            "https://graph.microsoft.com",
            "https://www.googleapis.com"
          ],
          frameSrc: [
            "https://accounts.google.com",
            "https://login.microsoftonline.com"
          ],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: [
            "'self'",
            "https://accounts.google.com",
            "https://login.microsoftonline.com"
          ],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"]
        }
      },
      crossOriginEmbedderPolicy: { policy: 'credentialless' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true
    };
  }

  /**
   * Input validation middleware
   * @param {Object} schema - Validation schema
   * @returns {Function} Middleware function
   */
  validateInput(schema) {
    return (req, res, next) => {
      const errors = [];

      // Validate request body
      if (schema.body) {
        const bodyErrors = this.validateObject(req.body, schema.body);
        if (bodyErrors.length > 0) {
          errors.push(...bodyErrors.map(error => `Body: ${error}`));
        }
      }

      // Validate query parameters
      if (schema.query) {
        const queryErrors = this.validateObject(req.query, schema.query);
        if (queryErrors.length > 0) {
          errors.push(...queryErrors.map(error => `Query: ${error}`));
        }
      }

      // Validate URL parameters
      if (schema.params) {
        const paramsErrors = this.validateObject(req.params, schema.params);
        if (paramsErrors.length > 0) {
          errors.push(...paramsErrors.map(error => `Params: ${error}`));
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid input provided',
          details: errors
        });
      }

      next();
    };
  }

  /**
   * Validate object against schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Validation schema
   * @returns {Array} Validation errors
   */
  validateObject(obj, schema) {
    const errors = [];

    Object.entries(schema).forEach(([field, rules]) => {
      const value = obj[field];

      // Required field check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }

      // Skip validation if field is not required and not present
      if (!rules.required && (value === undefined || value === null)) {
        return;
      }

      // Type validation
      if (rules.type) {
        if (typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          return;
        }
      }

      // String validation
      if (rules.type === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} contains invalid characters`);
        }
        if (rules.email && !validator.isEmail(value)) {
          errors.push(`${field} must be a valid email address`);
        }
        if (rules.url && !validator.isURL(value)) {
          errors.push(`${field} must be a valid URL`);
        }
      }

      // Number validation
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be no more than ${rules.max}`);
        }
      }

      // Array validation
      if (rules.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
          return;
        }
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must contain at least ${rules.minLength} items`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must contain no more than ${rules.maxLength} items`);
        }
      }
    });

    return errors;
  }

  /**
   * HTML sanitization middleware
   * @returns {Function} Middleware function
   */
  sanitizeHTML() {
    return (req, res, next) => {
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body);
      }
      next();
    };
  }

  /**
   * Sanitize object recursively
   * @param {Object} obj - Object to sanitize
   * @returns {Object} Sanitized object
   */
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = {};
      Object.keys(obj).forEach(key => {
        sanitized[key] = this.sanitizeObject(obj[key]);
      });
      return sanitized;
    }

    return obj;
  }

  /**
   * XSS protection middleware
   * @returns {Function} Middleware function
   */
  xssProtection() {
    return (req, res, next) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^>]*>/gi,
        /<object\b[^>]*>/gi,
        /<embed\b[^>]*>/gi,
        /expression\s*\(/gi,
        /url\s*\(/gi
      ];

      const checkForXSS = (obj) => {
        if (typeof obj === 'string') {
          return xssPatterns.some(pattern => pattern.test(obj));
        }

        if (Array.isArray(obj)) {
          return obj.some(item => checkForXSS(item));
        }

        if (obj && typeof obj === 'object') {
          return Object.values(obj).some(value => checkForXSS(value));
        }

        return false;
      };

      if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
        return res.status(400).json({
          error: 'XSS attempt detected',
          message: 'Request contains potentially malicious content'
        });
      }

      next();
    };
  }

  /**
   * Request logging middleware
   * @returns {Function} Middleware function
   */
  requestLogging() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          userId: req.user?.id
        };

        if (res.statusCode >= 400) {
          console.error('Request error:', logData);
        } else {
          console.log('Request completed:', logData);
        }
      });

      next();
    };
  }

  /**
   * Security headers middleware
   * @returns {Function} Middleware function
   */
  securityHeaders() {
    return (req, res, next) => {
      // Custom security headers
      res.setHeader('X-API-Version', '1.0');
      res.setHeader('X-Response-Time', Date.now() - req.startTime);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    };
  }

  /**
   * Get all middleware configurations
   * @returns {Object} Middleware configurations
   */
  getMiddleware() {
    return {
      helmet: helmet(this.helmetOptions),
      cors: cors(this.corsOptions),
      rateLimits: this.rateLimits,
      validateInput: this.validateInput.bind(this),
      sanitizeHTML: this.sanitizeHTML.bind(this),
      xssProtection: this.xssProtection.bind(this),
      requestLogging: this.requestLogging.bind(this),
      securityHeaders: this.securityHeaders.bind(this)
    };
  }
}

export default new SecurityMiddleware();
