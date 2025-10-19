import { securityAuditLogger } from './securityAudit.js';
import { threatDetectionSystem } from './threatDetection.js';
import { securityMonitoringSystem } from './securityMonitoring.js';
import { dataEncryption } from './dataEncryption.js';

export class SecurityManager {
  constructor() {
    this.cspPolicy = this.getCSPPolicy();
    this.securityHeaders = this.getSecurityHeaders();
    this.rateLimits = this.getRateLimits();
    this.sanitizationRules = this.getSanitizationRules();
  }

  /**
   * Get Content Security Policy configuration
   * @returns {Object} CSP policy object
   */
  getCSPPolicy() {
    const environment = import.meta.env.MODE || 'development';
    
    const basePolicy = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Vite in development
        "'unsafe-eval'",   // Required for Vite in development
        "https://accounts.google.com",
        "https://login.microsoftonline.com"
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      'font-src': [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      'img-src': [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      'connect-src': [
        "'self'",
        "https://api.openai.com",
        "https://*.supabase.co",
        "https://*.supabase.in",
        "https://accounts.google.com",
        "https://login.microsoftonline.com",
        "https://graph.microsoft.com",
        "https://www.googleapis.com",
        "https://floworx-iq.com",
        "wss://*.supabase.co",
        "wss://*.supabase.in"
      ],
      'frame-src': [
        "https://accounts.google.com",
        "https://login.microsoftonline.com"
      ],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'", "https://accounts.google.com", "https://login.microsoftonline.com"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", "blob:"]
    };

    // Stricter policy for production
    if (environment === 'production') {
      basePolicy['script-src'] = basePolicy['script-src'].filter(src => 
        src !== "'unsafe-inline'" && src !== "'unsafe-eval'"
      );
    }

    return basePolicy;
  }

  /**
   * Get comprehensive security headers
   * @returns {Object} Security headers object
   */
  getSecurityHeaders() {
    return {
      'Content-Security-Policy': this.formatCSP(this.cspPolicy),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    };
  }

  /**
   * Format CSP policy for HTTP header
   * @param {Object} policy - CSP policy object
   * @returns {string} Formatted CSP header
   */
  formatCSP(policy) {
    return Object.entries(policy)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Get rate limiting configuration
   * @returns {Object} Rate limit configuration
   */
  getRateLimits() {
    return {
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
      },
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 auth requests per windowMs
        message: 'Too many authentication attempts, please try again later.'
      },
      email: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // limit each user to 50 emails per hour
        message: 'Email rate limit exceeded, please try again later.'
      }
    };
  }

  /**
   * Get input sanitization rules
   * @returns {Object} Sanitization rules
   */
  getSanitizationRules() {
    return {
      email: {
        maxLength: 254,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        allowedChars: /^[a-zA-Z0-9@._+-]+$/
      },
      name: {
        maxLength: 100,
        pattern: /^[a-zA-Z\s'-]+$/,
        minLength: 2
      },
      subject: {
        maxLength: 200,
        pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
        minLength: 1
      },
      content: {
        maxLength: 10000,
        allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
        allowedAttributes: {
          'a': ['href', 'target']
        }
      }
    };
  }

  /**
   * Validate input against security rules
   * @param {string} input - Input to validate
   * @param {string} type - Input type (email, name, subject, content)
   * @returns {Object} Validation result
   */
  validateInput(input, type) {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Invalid input type' };
    }

    const rules = this.sanitizationRules[type];
    if (!rules) {
      return { valid: false, error: 'Unknown input type' };
    }

    // Check length
    if (rules.maxLength && input.length > rules.maxLength) {
      return { valid: false, error: `Input too long (max ${rules.maxLength} characters)` };
    }

    if (rules.minLength && input.length < rules.minLength) {
      return { valid: false, error: `Input too short (min ${rules.minLength} characters)` };
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(input)) {
      return { valid: false, error: 'Input contains invalid characters' };
    }

    // Check allowed characters
    if (rules.allowedChars && !rules.allowedChars.test(input)) {
      return { valid: false, error: 'Input contains disallowed characters' };
    }

    return { valid: true };
  }

  /**
   * Sanitize HTML content
   * @param {string} content - HTML content to sanitize
   * @returns {string} Sanitized content
   */
  sanitizeHTML(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Basic HTML sanitization (in production, use a library like DOMPurify)
    const rules = this.sanitizationRules.content;
    const allowedTags = rules.allowedTags.join('|');
    const allowedAttributes = Object.keys(rules.allowedAttributes).join('|');
    
    // Remove script tags and event handlers
    let sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '');

    // Allow only specific tags and attributes
    const tagRegex = new RegExp(`<(?!\/?(?:${allowedTags})\\b)[^>]*>`, 'gi');
    sanitized = sanitized.replace(tagRegex, '');

    return sanitized.trim();
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length
   * @returns {string} Secure random token
   */
  generateSecureToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }

  /**
   * Hash sensitive data (client-side)
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hashed data
   */
  async hashData(data) {
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid data for hashing');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   * @param {string} token - CSRF token to validate
   * @param {string} sessionToken - Session token
   * @returns {boolean} Token validity
   */
  validateCSRFToken(token, sessionToken) {
    if (!token || !sessionToken) {
      return false;
    }

    // In a real implementation, you would compare with server-side stored token
    // For client-side, we'll do basic validation
    return token.length >= 32 && sessionToken.length >= 32;
  }

  /**
   * Check for XSS patterns
   * @param {string} input - Input to check
   * @returns {boolean} Contains XSS patterns
   */
  detectXSS(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<link\b[^>]*>/gi,
      /<meta\b[^>]*>/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for SQL injection patterns
   * @param {string} input - Input to check
   * @returns {boolean} Contains SQL injection patterns
   */
  detectSQLInjection(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\#|\/\*|\*\/)/gi,
      /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/gi,
      /(\bUNION\b.*\bSELECT\b)/gi,
      /(\bSELECT\b.*\bFROM\b)/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Generate security audit report
   * @returns {Object} Security audit report
   */
  generateSecurityAudit() {
    const environment = import.meta.env.MODE || 'development';
    const timestamp = new Date().toISOString();
    
    return {
      timestamp,
      environment,
      csp: {
        configured: true,
        policy: this.cspPolicy,
        header: this.formatCSP(this.cspPolicy)
      },
      headers: {
        configured: true,
        count: Object.keys(this.securityHeaders).length
      },
      rateLimiting: {
        configured: true,
        rules: Object.keys(this.rateLimits)
      },
      sanitization: {
        configured: true,
        rules: Object.keys(this.sanitizationRules)
      },
      recommendations: this.getSecurityRecommendations(environment)
    };
  }

  /**
   * Get security recommendations
   * @param {string} environment - Current environment
   * @returns {Array} Security recommendations
   */
  getSecurityRecommendations(environment) {
    const recommendations = [];

    if (environment === 'development') {
      recommendations.push({
        type: 'warning',
        message: 'Development mode detected - CSP allows unsafe-inline and unsafe-eval'
      });
    }

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      recommendations.push({
        type: 'info',
        message: 'OpenAI API key not configured - AI features will use fallback'
      });
    }

    recommendations.push({
      type: 'info',
      message: 'Consider implementing server-side rate limiting for production'
    });

    recommendations.push({
      type: 'info',
      message: 'Enable HTTPS in production for secure data transmission'
    });

    return recommendations;
  }

  /**
   * Initialize security measures
   */
  initialize() {
    // Set security headers in meta tags
    this.setSecurityMetaTags();
    
    // Initialize CSP reporting
    this.initializeCSPReporting();
    
    // Set up security event listeners
    this.setupSecurityEventListeners();
    
    // Initialize advanced security systems
    this.initializeAdvancedSecurity();
    
    console.log('🔒 Security Manager initialized');
  }

  /**
   * Initialize advanced security systems
   */
  initializeAdvancedSecurity() {
    // Initialize security audit logging
    securityAuditLogger.initialize();
    
    // Initialize threat detection
    threatDetectionSystem.initialize();
    
    // Initialize security monitoring
    securityMonitoringSystem.initialize();
    
    // Log security initialization
    securityAuditLogger.logSecurityEvent('security_system_initialized', {
      components: ['audit_logger', 'threat_detection', 'security_monitoring', 'data_encryption']
    }, null, 'low');
    
    console.log('🔒 Advanced security systems initialized');
  }

  /**
   * Enhanced input validation with threat detection
   * @param {string} input - Input to validate
   * @param {string} type - Input type (email, name, subject, content)
   * @returns {Object} Validation result with threat analysis
   */
  validateInputWithThreatDetection(input, type) {
    // Basic validation
    const basicValidation = this.validateInput(input, type);
    
    if (!basicValidation.valid) {
      return basicValidation;
    }
    
    // Threat detection analysis
    const threatAnalysis = threatDetectionSystem.analyzeInput(input, type);
    
    if (!threatAnalysis.safe) {
      // Log security threat
      securityAuditLogger.logSecurityEvent('input_threat_detected', {
        inputType: type,
        threatLevel: threatAnalysis.threatLevel,
        threats: threatAnalysis.threats,
        riskScore: threatAnalysis.riskScore
      }, null, threatAnalysis.threatLevel);
      
      // Create security alert
      securityMonitoringSystem.createAlert('malicious_input', threatAnalysis.threatLevel, {
        inputType: type,
        threats: threatAnalysis.threats
      });
      
      return {
        valid: false,
        error: 'Malicious content detected',
        threatAnalysis
      };
    }
    
    return {
      ...basicValidation,
      threatAnalysis
    };
  }

  /**
   * Enhanced HTML sanitization with threat detection
   * @param {string} content - HTML content to sanitize
   * @returns {string} Sanitized content
   */
  sanitizeHTMLWithThreatDetection(content) {
    // Threat detection analysis
    const threatAnalysis = threatDetectionSystem.analyzeInput(content, 'html_content');
    
    if (!threatAnalysis.safe) {
      // Log security threat
      securityAuditLogger.logSecurityEvent('html_threat_detected', {
        threatLevel: threatAnalysis.threatLevel,
        threats: threatAnalysis.threats,
        contentLength: content.length
      }, null, threatAnalysis.threatLevel);
      
      // Create security alert
      securityMonitoringSystem.createAlert('malicious_html', threatAnalysis.threatLevel, {
        threats: threatAnalysis.threats,
        contentLength: content.length
      });
    }
    
    // Perform sanitization
    return this.sanitizeHTML(content);
  }

  /**
   * Get comprehensive security status
   * @returns {Object} Security status
   */
  getSecurityStatus() {
    return {
      basicSecurity: {
        cspConfigured: true,
        headersConfigured: true,
        rateLimitingConfigured: true,
        sanitizationConfigured: true
      },
      advancedSecurity: {
        auditLogging: securityAuditLogger.auditEvents.length > 0,
        threatDetection: threatDetectionSystem.threatPatterns ? true : false,
        securityMonitoring: securityMonitoringSystem.monitoringActive,
        dataEncryption: dataEncryption.validateConfiguration().valid
      },
      threatStatistics: threatDetectionSystem.getThreatStatistics(),
      monitoringDashboard: securityMonitoringSystem.getDashboardData(),
      encryptionStatistics: dataEncryption.getStatistics()
    };
  }

  /**
   * Generate comprehensive security report
   * @returns {Object} Security report
   */
  generateComprehensiveSecurityReport() {
    const basicAudit = this.generateSecurityAudit();
    const threatStats = threatDetectionSystem.getThreatStatistics();
    const monitoringData = securityMonitoringSystem.getDashboardData();
    const encryptionStats = dataEncryption.getStatistics();
    
    return {
      timestamp: new Date().toISOString(),
      basicSecurity: basicAudit,
      threatDetection: threatStats,
      securityMonitoring: monitoringData,
      dataEncryption: encryptionStats,
      recommendations: this.getComprehensiveSecurityRecommendations()
    };
  }

  /**
   * Get comprehensive security recommendations
   * @returns {Array} Security recommendations
   */
  getComprehensiveSecurityRecommendations() {
    const recommendations = this.getSecurityRecommendations(import.meta.env.MODE || 'development');
    
    // Add advanced security recommendations
    const threatStats = threatDetectionSystem.getThreatStatistics();
    if (threatStats.totalThreats > 0) {
      recommendations.push({
        type: 'warning',
        message: `${threatStats.totalThreats} security threats detected`,
        action: 'Review threat detection logs and implement additional security measures'
      });
    }
    
    const monitoringData = securityMonitoringSystem.getDashboardData();
    if (monitoringData.activeAlerts.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${monitoringData.activeAlerts.length} active security alerts`,
        action: 'Review and resolve outstanding security alerts'
      });
    }
    
    const encryptionValidation = dataEncryption.validateConfiguration();
    if (!encryptionValidation.valid) {
      recommendations.push({
        type: 'error',
        message: 'Data encryption configuration issues detected',
        action: 'Fix encryption configuration errors'
      });
    }
    
    return recommendations;
  }

  /**
   * Set security-related meta tags
   */
  setSecurityMetaTags() {
    const metaTags = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'msapplication-tap-highlight', content: 'no' }
    ];

    metaTags.forEach(tag => {
      let meta = document.querySelector(`meta[name="${tag.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = tag.name;
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });
  }

  /**
   * Initialize CSP reporting
   */
  initializeCSPReporting() {
    // Report CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn('CSP Violation:', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });
    });
  }

  /**
   * Set up security event listeners
   */
  setupSecurityEventListeners() {
    // Prevent context menu on sensitive elements
    document.addEventListener('contextmenu', (event) => {
      if (event.target && typeof event.target.closest === 'function' && event.target.closest('[data-sensitive]')) {
        event.preventDefault();
      }
    });

    // Prevent text selection on sensitive elements
    document.addEventListener('selectstart', (event) => {
      if (event.target && typeof event.target.closest === 'function' && event.target.closest('[data-no-select]')) {
        event.preventDefault();
      }
    });

    // Detect and log suspicious activity
    let clickCount = 0;
    let lastClickTime = 0;
    
    document.addEventListener('click', (event) => {
      const now = Date.now();
      if (now - lastClickTime < 100) {
        clickCount++;
        if (clickCount > 10) {
          console.warn('🚨 Suspicious rapid clicking detected');
        }
      } else {
        clickCount = 0;
      }
      lastClickTime = now;
    });
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// Initialize security on module load
securityManager.initialize();

export default SecurityManager;
