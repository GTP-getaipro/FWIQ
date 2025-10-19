/**
 * Threat Detection System
 * Advanced threat detection and analysis for FloWorx
 */

import { logger } from './logger.js';
import { securityAuditLogger } from './securityAudit.js';

export class ThreatDetectionSystem {
  constructor() {
    this.threatPatterns = this.initializeThreatPatterns();
    this.behaviorBaselines = new Map();
    this.suspiciousActivities = [];
    this.threatLevels = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    this.initialize();
  }

  /**
   * Initialize threat detection system
   */
  initialize() {
    this.setupBehaviorMonitoring();
    this.setupPatternDetection();
    this.setupAnomalyDetection();
    logger.info('Threat Detection System initialized');
  }

  /**
   * Initialize threat patterns
   * @returns {Object} Threat patterns configuration
   */
  initializeThreatPatterns() {
    return {
      // XSS patterns
      xss: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^>]*>/gi,
        /<object\b[^>]*>/gi,
        /<embed\b[^>]*>/gi,
        /expression\s*\(/gi,
        /url\s*\(/gi
      ],

      // SQL injection patterns
      sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(--|\#|\/\*|\*\/)/gi,
        /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/gi,
        /(\bUNION\b.*\bSELECT\b)/gi,
        /(\bSELECT\b.*\bFROM\b)/gi,
        /(\bDROP\b.*\bTABLE\b)/gi,
        /(\bINSERT\b.*\bINTO\b)/gi,
        /(\bUPDATE\b.*\bSET\b)/gi
      ],

      // Path traversal patterns
      pathTraversal: [
        /\.\.\//g,
        /\.\.\\/g,
        /\.\.%2f/gi,
        /\.\.%5c/gi,
        /\.\.%252f/gi,
        /\.\.%255c/gi
      ],

      // Command injection patterns
      commandInjection: [
        /[;&|`$()]/g,
        /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b/gi,
        /\b(ping|traceroute|nslookup|dig)\b/gi,
        /\b(wget|curl|nc|telnet|ssh|ftp)\b/gi
      ],

      // Brute force patterns
      bruteForce: {
        maxAttempts: 5,
        timeWindow: 15 * 60 * 1000, // 15 minutes
        suspiciousPatterns: [
          /admin|root|administrator/gi,
          /password|123456|qwerty/gi
        ]
      },

      // Suspicious user agent patterns
      suspiciousUserAgents: [
        /bot|crawler|spider|scraper/gi,
        /curl|wget|python|java|php/gi,
        /sqlmap|nmap|nikto|burp/gi
      ],

      // Rate limiting patterns
      rateLimiting: {
        api: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
        auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
        email: { maxRequests: 50, windowMs: 60 * 60 * 1000 }
      }
    };
  }

  /**
   * Analyze input for threats
   * @param {string} input - Input to analyze
   * @param {string} context - Context of the input (form, api, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Threat analysis result
   */
  analyzeInput(input, context = 'general', metadata = {}) {
    if (!input || typeof input !== 'string') {
      return { threatLevel: 'low', threats: [], safe: true };
    }

    const threats = [];
    let maxThreatLevel = 'low';

    // Check for XSS threats
    const xssThreats = this.detectXSSThreats(input);
    if (xssThreats.length > 0) {
      threats.push(...xssThreats);
      maxThreatLevel = this.getHigherThreatLevel(maxThreatLevel, 'high');
    }

    // Check for SQL injection threats
    const sqlThreats = this.detectSQLInjectionThreats(input);
    if (sqlThreats.length > 0) {
      threats.push(...sqlThreats);
      maxThreatLevel = this.getHigherThreatLevel(maxThreatLevel, 'critical');
    }

    // Check for path traversal threats
    const pathThreats = this.detectPathTraversalThreats(input);
    if (pathThreats.length > 0) {
      threats.push(...pathThreats);
      maxThreatLevel = this.getHigherThreatLevel(maxThreatLevel, 'high');
    }

    // Check for command injection threats
    const cmdThreats = this.detectCommandInjectionThreats(input);
    if (cmdThreats.length > 0) {
      threats.push(...cmdThreats);
      maxThreatLevel = this.getHigherThreatLevel(maxThreatLevel, 'critical');
    }

    // Log threat detection
    if (threats.length > 0) {
      securityAuditLogger.logSecurityEvent('threat_detected', {
        input: this.sanitizeForLogging(input),
        context,
        threats,
        threatLevel: maxThreatLevel,
        ...metadata
      }, metadata.userId, maxThreatLevel);
    }

    return {
      threatLevel: maxThreatLevel,
      threats,
      safe: threats.length === 0,
      riskScore: this.calculateThreatRiskScore(threats, maxThreatLevel)
    };
  }

  /**
   * Detect XSS threats
   * @param {string} input - Input to check
   * @returns {Array} XSS threats found
   */
  detectXSSThreats(input) {
    const threats = [];
    
    this.threatPatterns.xss.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push({
          type: 'xss',
          pattern: pattern.toString(),
          severity: 'high',
          description: 'Cross-site scripting (XSS) attempt detected'
        });
      }
    });

    return threats;
  }

  /**
   * Detect SQL injection threats
   * @param {string} input - Input to check
   * @returns {Array} SQL injection threats found
   */
  detectSQLInjectionThreats(input) {
    const threats = [];
    
    this.threatPatterns.sqlInjection.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push({
          type: 'sql_injection',
          pattern: pattern.toString(),
          severity: 'critical',
          description: 'SQL injection attempt detected'
        });
      }
    });

    return threats;
  }

  /**
   * Detect path traversal threats
   * @param {string} input - Input to check
   * @returns {Array} Path traversal threats found
   */
  detectPathTraversalThreats(input) {
    const threats = [];
    
    this.threatPatterns.pathTraversal.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push({
          type: 'path_traversal',
          pattern: pattern.toString(),
          severity: 'high',
          description: 'Path traversal attempt detected'
        });
      }
    });

    return threats;
  }

  /**
   * Detect command injection threats
   * @param {string} input - Input to check
   * @returns {Array} Command injection threats found
   */
  detectCommandInjectionThreats(input) {
    const threats = [];
    
    this.threatPatterns.commandInjection.forEach((pattern, index) => {
      if (pattern.test(input)) {
        threats.push({
          type: 'command_injection',
          pattern: pattern.toString(),
          severity: 'critical',
          description: 'Command injection attempt detected'
        });
      }
    });

    return threats;
  }

  /**
   * Detect brute force attempts
   * @param {string} identifier - User identifier (email, username, etc.)
   * @param {string} attemptType - Type of attempt (login, password_reset, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Brute force analysis result
   */
  detectBruteForce(identifier, attemptType = 'login', metadata = {}) {
    const key = `${identifier}_${attemptType}`;
    const now = Date.now();
    
    if (!this.behaviorBaselines.has(key)) {
      this.behaviorBaselines.set(key, {
        attempts: [],
        lastAttempt: now,
        blocked: false,
        blockUntil: 0
      });
    }

    const baseline = this.behaviorBaselines.get(key);
    
    // Clean old attempts outside time window
    baseline.attempts = baseline.attempts.filter(
      attempt => now - attempt < this.threatPatterns.bruteForce.timeWindow
    );

    // Add current attempt
    baseline.attempts.push(now);
    baseline.lastAttempt = now;

    const isBruteForce = baseline.attempts.length > this.threatPatterns.bruteForce.maxAttempts;
    
    if (isBruteForce) {
      baseline.blocked = true;
      baseline.blockUntil = now + (30 * 60 * 1000); // Block for 30 minutes
      
      securityAuditLogger.logSecurityEvent('brute_force_detected', {
        identifier: this.sanitizeForLogging(identifier),
        attemptType,
        attemptCount: baseline.attempts.length,
        timeWindow: this.threatPatterns.bruteForce.timeWindow,
        ...metadata
      }, metadata.userId, 'high');
    }

    return {
      isBruteForce,
      attemptCount: baseline.attempts.length,
      blocked: baseline.blocked,
      blockUntil: baseline.blockUntil,
      timeWindow: this.threatPatterns.bruteForce.timeWindow
    };
  }

  /**
   * Detect suspicious user behavior
   * @param {string} userId - User ID
   * @param {Object} behavior - User behavior data
   * @returns {Object} Behavior analysis result
   */
  detectSuspiciousBehavior(userId, behavior) {
    const suspiciousIndicators = [];
    let threatLevel = 'low';

    // Check for unusual access patterns
    if (behavior.unusualHours) {
      suspiciousIndicators.push({
        type: 'unusual_access_time',
        description: 'Access during unusual hours',
        severity: 'medium'
      });
      threatLevel = this.getHigherThreatLevel(threatLevel, 'medium');
    }

    // Check for rapid actions
    if (behavior.rapidActions) {
      suspiciousIndicators.push({
        type: 'rapid_actions',
        description: 'Unusually rapid sequence of actions',
        severity: 'medium'
      });
      threatLevel = this.getHigherThreatLevel(threatLevel, 'medium');
    }

    // Check for data exfiltration patterns
    if (behavior.largeDataAccess) {
      suspiciousIndicators.push({
        type: 'large_data_access',
        description: 'Access to unusually large amounts of data',
        severity: 'high'
      });
      threatLevel = this.getHigherThreatLevel(threatLevel, 'high');
    }

    // Check for geographic anomalies
    if (behavior.geographicAnomaly) {
      suspiciousIndicators.push({
        type: 'geographic_anomaly',
        description: 'Access from unusual geographic location',
        severity: 'high'
      });
      threatLevel = this.getHigherThreatLevel(threatLevel, 'high');
    }

    if (suspiciousIndicators.length > 0) {
      securityAuditLogger.logSuspiciousActivity('user_behavior', {
        userId,
        indicators: suspiciousIndicators,
        threatLevel,
        ...behavior
      }, userId);
    }

    return {
      suspicious: suspiciousIndicators.length > 0,
      indicators: suspiciousIndicators,
      threatLevel,
      riskScore: this.calculateBehaviorRiskScore(suspiciousIndicators)
    };
  }

  /**
   * Analyze user agent for threats
   * @param {string} userAgent - User agent string
   * @returns {Object} User agent analysis result
   */
  analyzeUserAgent(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') {
      return { suspicious: false, threats: [], threatLevel: 'low' };
    }

    const threats = [];
    let threatLevel = 'low';

    // Check for suspicious patterns
    this.threatPatterns.suspiciousUserAgents.forEach(pattern => {
      if (pattern.test(userAgent)) {
        threats.push({
          type: 'suspicious_user_agent',
          pattern: pattern.toString(),
          severity: 'medium',
          description: 'Suspicious user agent detected'
        });
        threatLevel = this.getHigherThreatLevel(threatLevel, 'medium');
      }
    });

    // Check for missing or empty user agent
    if (!userAgent || userAgent.trim() === '') {
      threats.push({
        type: 'missing_user_agent',
        severity: 'high',
        description: 'Missing or empty user agent'
      });
      threatLevel = this.getHigherThreatLevel(threatLevel, 'high');
    }

    if (threats.length > 0) {
      securityAuditLogger.logSecurityEvent('suspicious_user_agent', {
        userAgent: this.sanitizeForLogging(userAgent),
        threats,
        threatLevel
      }, null, threatLevel);
    }

    return {
      suspicious: threats.length > 0,
      threats,
      threatLevel,
      riskScore: this.calculateThreatRiskScore(threats, threatLevel)
    };
  }

  /**
   * Monitor rate limiting
   * @param {string} identifier - Request identifier (IP, user ID, etc.)
   * @param {string} endpoint - API endpoint
   * @returns {Object} Rate limiting analysis result
   */
  monitorRateLimiting(identifier, endpoint) {
    const key = `${identifier}_${endpoint}`;
    const now = Date.now();
    
    if (!this.behaviorBaselines.has(key)) {
      this.behaviorBaselines.set(key, {
        requests: [],
        lastRequest: now
      });
    }

    const baseline = this.behaviorBaselines.get(key);
    const config = this.threatPatterns.rateLimiting[endpoint] || this.threatPatterns.rateLimiting.api;
    
    // Clean old requests outside time window
    baseline.requests = baseline.requests.filter(
      request => now - request < config.windowMs
    );

    // Add current request
    baseline.requests.push(now);
    baseline.lastRequest = now;

    const isRateLimited = baseline.requests.length > config.maxRequests;
    
    if (isRateLimited) {
      securityAuditLogger.logSecurityEvent('rate_limit_exceeded', {
        identifier: this.sanitizeForLogging(identifier),
        endpoint,
        requestCount: baseline.requests.length,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs
      }, identifier.includes('user_') ? identifier.replace('user_', '') : null, 'medium');
    }

    return {
      isRateLimited,
      requestCount: baseline.requests.length,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      resetTime: baseline.requests[0] + config.windowMs
    };
  }

  /**
   * Get higher threat level
   * @param {string} level1 - First threat level
   * @param {string} level2 - Second threat level
   * @returns {string} Higher threat level
   */
  getHigherThreatLevel(level1, level2) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    return levels[Math.max(index1, index2)];
  }

  /**
   * Calculate threat risk score
   * @param {Array} threats - Array of threats
   * @param {string} threatLevel - Overall threat level
   * @returns {number} Risk score (0-100)
   */
  calculateThreatRiskScore(threats, threatLevel) {
    let score = 0;
    
    // Base score by threat level
    const levelScores = {
      low: 10,
      medium: 30,
      high: 60,
      critical: 90
    };
    score += levelScores[threatLevel] || 30;

    // Additional score for number of threats
    score += Math.min(threats.length * 5, 20);

    return Math.min(score, 100);
  }

  /**
   * Calculate behavior risk score
   * @param {Array} indicators - Suspicious behavior indicators
   * @returns {number} Risk score (0-100)
   */
  calculateBehaviorRiskScore(indicators) {
    let score = 0;
    
    indicators.forEach(indicator => {
      const severityScores = {
        low: 10,
        medium: 30,
        high: 60,
        critical: 90
      };
      score += severityScores[indicator.severity] || 30;
    });

    return Math.min(score, 100);
  }

  /**
   * Sanitize input for logging
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeForLogging(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Truncate long inputs
    const truncated = input.length > 200 ? input.substring(0, 200) + '...' : input;
    
    // Remove sensitive information
    return truncated.replace(/password|token|key|secret|auth/gi, '[REDACTED]');
  }

  /**
   * Setup behavior monitoring
   */
  setupBehaviorMonitoring() {
    // Monitor mouse movements for bot detection
    let mouseMovements = 0;
    let lastMouseTime = 0;
    
    document.addEventListener('mousemove', () => {
      const now = Date.now();
      if (now - lastMouseTime < 100) {
        mouseMovements++;
        if (mouseMovements > 1000) {
          securityAuditLogger.logSuspiciousActivity('rapid_mouse_movements', {
            movementCount: mouseMovements,
            timeWindow: '1 minute'
          });
        }
      } else {
        mouseMovements = 0;
      }
      lastMouseTime = now;
    });

    // Monitor keyboard patterns
    let keystrokes = 0;
    let lastKeystrokeTime = 0;
    
    document.addEventListener('keydown', () => {
      const now = Date.now();
      if (now - lastKeystrokeTime < 50) {
        keystrokes++;
        if (keystrokes > 500) {
          securityAuditLogger.logSuspiciousActivity('rapid_keystrokes', {
            keystrokeCount: keystrokes,
            timeWindow: '1 minute'
          });
        }
      } else {
        keystrokes = 0;
      }
      lastKeystrokeTime = now;
    });
  }

  /**
   * Setup pattern detection
   */
  setupPatternDetection() {
    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formData = new FormData(form);
      
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          const analysis = this.analyzeInput(value, 'form_submission', {
            formId: form.id,
            fieldName: key
          });
          
          if (!analysis.safe) {
            event.preventDefault();
            securityAuditLogger.logSecurityEvent('malicious_form_submission', {
              formId: form.id,
              fieldName: key,
              threatAnalysis: analysis
            }, null, analysis.threatLevel);
          }
        }
      });
    });
  }

  /**
   * Setup anomaly detection
   */
  setupAnomalyDetection() {
    // Monitor for unusual page access patterns
    let pageAccesses = [];
    const maxAccesses = 100;
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      pageAccesses.push({ url: args[2], timestamp: Date.now(), method: 'pushState' });
      if (pageAccesses.length > maxAccesses) {
        pageAccesses = pageAccesses.slice(-maxAccesses);
      }
      return originalPushState.apply(this, args);
    };
    
    history.replaceState = function(...args) {
      pageAccesses.push({ url: args[2], timestamp: Date.now(), method: 'replaceState' });
      if (pageAccesses.length > maxAccesses) {
        pageAccesses = pageAccesses.slice(-maxAccesses);
      }
      return originalReplaceState.apply(this, args);
    };

    // Check for rapid page changes
    setInterval(() => {
      const now = Date.now();
      const recentAccesses = pageAccesses.filter(access => now - access.timestamp < 60000); // Last minute
      
      if (recentAccesses.length > 20) {
        securityAuditLogger.logSuspiciousActivity('rapid_page_navigation', {
          accessCount: recentAccesses.length,
          timeWindow: '1 minute',
          pages: recentAccesses.map(access => access.url)
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get threat detection statistics
   * @returns {Object} Threat detection statistics
   */
  getThreatStatistics() {
    return {
      totalThreats: this.suspiciousActivities.length,
      threatsByType: this.groupThreatsByType(),
      threatsBySeverity: this.groupThreatsBySeverity(),
      activeBruteForceAttempts: this.getActiveBruteForceAttempts(),
      rateLimitViolations: this.getRateLimitViolations()
    };
  }

  /**
   * Group threats by type
   * @returns {Object} Threats grouped by type
   */
  groupThreatsByType() {
    const grouped = {};
    this.suspiciousActivities.forEach(activity => {
      grouped[activity.type] = (grouped[activity.type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group threats by severity
   * @returns {Object} Threats grouped by severity
   */
  groupThreatsBySeverity() {
    const grouped = {};
    this.suspiciousActivities.forEach(activity => {
      grouped[activity.severity] = (grouped[activity.severity] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Get active brute force attempts
   * @returns {Array} Active brute force attempts
   */
  getActiveBruteForceAttempts() {
    const active = [];
    this.behaviorBaselines.forEach((baseline, key) => {
      if (key.includes('_login') && baseline.blocked && baseline.blockUntil > Date.now()) {
        active.push({
          identifier: key,
          attempts: baseline.attempts.length,
          blockUntil: baseline.blockUntil
        });
      }
    });
    return active;
  }

  /**
   * Get rate limit violations
   * @returns {Array} Rate limit violations
   */
  getRateLimitViolations() {
    const violations = [];
    this.behaviorBaselines.forEach((baseline, key) => {
      if (baseline.requests && baseline.requests.length > 0) {
        const config = this.threatPatterns.rateLimiting.api; // Default config
        if (baseline.requests.length > config.maxRequests) {
          violations.push({
            identifier: key,
            requestCount: baseline.requests.length,
            maxRequests: config.maxRequests
          });
        }
      }
    });
    return violations;
  }
}

// Export singleton instance
export const threatDetectionSystem = new ThreatDetectionSystem();

export default ThreatDetectionSystem;
