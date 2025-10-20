/**
 * Content Security Policy Manager
 * Handles CSP configuration and violation reporting
 */

import { logger } from '@/lib/logger.js';

export class CSPManager {
  constructor() {
    this.violations = [];
    this.reportingEndpoint = '/api/csp-reports';
    this.maxViolations = 100;
    this.initialized = false;
  }

  /**
   * Initialize CSP manager
   */
  initialize() {
    if (this.initialized) return;

    this.setupViolationReporting();
    this.setupCSPMetaTags();
    this.initialized = true;

    logger.info('CSP Manager initialized');
    
    // Force refresh CSP multiple times to ensure it takes effect
    setTimeout(() => {
      this.refreshCSP();
    }, 100);
    
    setTimeout(() => {
      this.refreshCSP();
    }, 500);
    
    setTimeout(() => {
      this.refreshCSP();
    }, 1000);
  }

  /**
   * Force refresh CSP policy
   */
  refreshCSP() {
    console.log('🔄 Refreshing CSP Policy...');
    this.setupCSPMetaTags();
  }

  /**
   * Set up CSP violation reporting
   */
  setupViolationReporting() {
    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleViolation(event);
    });

    // Set up CSP reporting endpoint
    if ('ReportingObserver' in window) {
      const observer = new ReportingObserver((reports) => {
        reports.forEach(report => {
          if (report.type === 'csp-violation') {
            this.handleCSPReport(report);
          }
        });
      }, {
        types: ['csp-violation']
      });
      
      observer.observe();
    }
  }

  /**
   * Handle CSP violation event
   * @param {SecurityPolicyViolationEvent} event - CSP violation event
   */
  handleViolation(event) {
    const violation = {
      timestamp: new Date().toISOString(),
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      effectiveDirective: event.effectiveDirective,
      statusCode: event.statusCode,
      referrer: event.referrer,
      sample: event.sample
    };

    this.violations.push(violation);

    // Keep only the most recent violations
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations);
    }

    // Log violation
    logger.warn('CSP Violation detected', violation);

    // Send to reporting endpoint
    this.sendViolationReport(violation);
  }

  /**
   * Handle CSP report from ReportingObserver
   * @param {Report} report - CSP report
   */
  handleCSPReport(report) {
    try {
      const body = report.body;
      if (body.violatedDirective) {
        const violation = {
          timestamp: new Date().toISOString(),
          ...body
        };

        this.violations.push(violation);
        logger.warn('CSP Violation reported', violation);
        this.sendViolationReport(violation);
      }
    } catch (error) {
      logger.error('Failed to handle CSP report', error);
    }
  }

  /**
   * Send violation report to backend
   * @param {Object} violation - Violation data
   */
  async sendViolationReport(violation) {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'csp-violation',
          violation,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      logger.error('Failed to send CSP violation report', error);
    }
  }

  /**
   * Set up CSP meta tags
   */
  setupCSPMetaTags() {
    // Remove any existing CSP meta tags first
    const existingCspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCspMeta) {
      existingCspMeta.remove();
    }

    // Create new CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    
    // Set CSP policy
    const cspPolicy = this.getCSPPolicy();
    cspMeta.setAttribute('content', cspPolicy);
    
    // Add to head
    document.head.appendChild(cspMeta);
    
    console.log('🔒 CSP Policy Updated:', cspPolicy);
  }

  /**
   * Get CSP policy string
   * @returns {string} CSP policy
   */
  getCSPPolicy() {
    const environment = import.meta.env.MODE || 'development';
    
    // TEMPORARY: Disable CSP entirely in development to fix n8n API calls
    if (environment === 'development') {
      console.log('🔓 Development mode: CSP disabled for n8n API compatibility');
      return "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src *; frame-src *; object-src *; base-uri *; form-action *; manifest-src *; worker-src * blob:;";
    }
    
    const policy = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
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
        "https://oauth2.googleapis.com",
        "https://n8n.floworx-iq.com",
        "https://floworx-iq.com",
        "https://api.floworx-iq.com",
        "https://n8n.srv995290.hstgr.cloud",
        "https://*.hstgr.cloud",
        "wss://*.supabase.co",
        "wss://*.supabase.in"
      ],
      'frame-src': [
        "https://accounts.google.com",
        "https://login.microsoftonline.com"
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'", "https://accounts.google.com", "https://login.microsoftonline.com"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", "blob:"]
    };

    // Note: frame-ancestors and report-uri are not supported in meta tags
    // These should be set via HTTP headers in production

    return this.formatPolicy(policy);
  }

  /**
   * Format CSP policy for header/meta tag
   * @param {Object} policy - CSP policy object
   * @returns {string} Formatted policy
   */
  formatPolicy(policy) {
    return Object.entries(policy)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Get violation statistics
   * @returns {Object} Violation statistics
   */
  getViolationStats() {
    const stats = {
      total: this.violations.length,
      byDirective: {},
      bySource: {},
      recent: this.violations.slice(-10)
    };

    this.violations.forEach(violation => {
      // Count by directive
      const directive = violation.violatedDirective || violation.effectiveDirective;
      stats.byDirective[directive] = (stats.byDirective[directive] || 0) + 1;

      // Count by source
      const source = violation.sourceFile || violation.blockedURI || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear violation history
   */
  clearViolations() {
    this.violations = [];
    logger.info('CSP violation history cleared');
  }

  /**
   * Test CSP policy
   * @param {string} policy - Policy to test
   * @returns {Object} Test results
   */
  testPolicy(policy) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic validation
      if (!policy || typeof policy !== 'string') {
        results.valid = false;
        results.errors.push('Policy must be a non-empty string');
        return results;
      }

      // Check for dangerous directives
      const dangerousDirectives = [
        'unsafe-inline',
        'unsafe-eval',
        '*'
      ];

      dangerousDirectives.forEach(dangerous => {
        if (policy.includes(dangerous)) {
          results.warnings.push(`Policy contains potentially dangerous directive: ${dangerous}`);
        }
      });

      // Check for required directives
      const requiredDirectives = [
        'default-src',
        'script-src',
        'object-src'
      ];

      requiredDirectives.forEach(required => {
        if (!policy.includes(required)) {
          results.warnings.push(`Policy missing recommended directive: ${required}`);
        }
      });

    } catch (error) {
      results.valid = false;
      results.errors.push(`Policy validation error: ${error.message}`);
    }

    return results;
  }

  /**
   * Get CSP recommendations
   * @returns {Array} CSP recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const stats = this.getViolationStats();

    // Analyze violations
    if (stats.total > 0) {
      recommendations.push({
        type: 'warning',
        message: `${stats.total} CSP violations detected`,
        action: 'Review violations and adjust policy'
      });

      // Most common violations
      const topViolation = Object.entries(stats.byDirective)
        .sort(([,a], [,b]) => b - a)[0];

      if (topViolation) {
        recommendations.push({
          type: 'info',
          message: `Most common violation: ${topViolation[0]} (${topViolation[1]} times)`,
          action: 'Consider adjusting this directive'
        });
      }
    }

    // Environment-specific recommendations
    const environment = import.meta.env.MODE || 'development';
    if (environment === 'development') {
      recommendations.push({
        type: 'warning',
        message: 'Development mode: CSP allows unsafe-inline and unsafe-eval',
        action: 'Remove these directives in production'
      });
    }

    // General recommendations
    recommendations.push({
      type: 'info',
      message: 'Consider implementing CSP reporting',
      action: 'Set up violation reporting endpoint'
    });

    recommendations.push({
      type: 'info',
      message: 'Regularly review and update CSP policy',
      action: 'Monitor violations and adjust policy as needed'
    });

    return recommendations;
  }

  /**
   * Generate CSP report
   * @returns {Object} CSP report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'development',
      policy: this.getCSPPolicy(),
      violations: this.getViolationStats(),
      recommendations: this.getRecommendations(),
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const cspManager = new CSPManager();

// Initialize CSP manager
cspManager.initialize();

// Make CSP manager available globally for debugging
if (typeof window !== 'undefined') {
  window.cspManager = cspManager;
  console.log('🔒 CSP Manager available globally as window.cspManager');
  console.log('💡 To refresh CSP manually, run: window.cspManager.refreshCSP()');
}

export default CSPManager;
