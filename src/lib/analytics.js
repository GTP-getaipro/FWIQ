/**
 * Analytics Service
 * Comprehensive analytics and metrics collection for FloWorx
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';
import { analyticsApi } from './apiClient.js';

export class Analytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.startTime = Date.now();
    this.pageViews = [];
    this.events = [];
    this.metrics = {
      pageViews: 0,
      userActions: 0,
      apiCalls: 0,
      errors: 0,
      performance: []
    };
    
    // Initialize asynchronously
    this.init().catch(error => {
      logger.error('Analytics initialization failed', { error: error.message });
    });
  }

  /**
   * Initialize analytics
   */
  async init() {
    try {
      // Get authenticated user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.userId = user.id;
      }
      
      // Track page load
      this.trackPageView(window.location.pathname);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up performance observer
      this.setupPerformanceObserver();
      
      // Set up error tracking
      this.setupErrorTracking();
      
      logger.info('Analytics initialized', { 
        sessionId: this.sessionId, 
        userId: this.userId 
      });
    } catch (error) {
      logger.error('Failed to initialize analytics', { error: error.message });
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for analytics
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
    logger.info('Analytics user ID set', { userId, sessionId: this.sessionId });
  }

  /**
   * Track page view
   * @param {string} path - Page path
   * @param {Object} metadata - Additional metadata
   */
  trackPageView(path, metadata = {}) {
    const pageView = {
      path,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      ...metadata
    };

    this.pageViews.push(pageView);
    this.metrics.pageViews++;

    logger.info('Page view tracked', pageView);
    
    // Send to backend
    this.sendEvent('page_view', pageView);
  }

  /**
   * Track user action
   * @param {string} action - Action name
   * @param {Object} data - Action data
   * @param {Object} metadata - Additional metadata
   */
  trackUserAction(action, data = {}, metadata = {}) {
    const event = {
      action,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      path: window.location.pathname,
      ...metadata
    };

    this.events.push(event);
    this.metrics.userActions++;

    logger.userAction(action, data, { sessionId: this.sessionId, userId: this.userId });
    
    // Send to backend
    this.sendEvent('user_action', event);
  }

  /**
   * Track API call
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} status - Response status
   * @param {number} duration - Request duration
   * @param {Object} metadata - Additional metadata
   */
  trackApiCall(endpoint, method, status, duration, metadata = {}) {
    const apiCall = {
      endpoint,
      method,
      status,
      duration,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata
    };

    this.metrics.apiCalls++;
    logger.apiRequest(method, endpoint, status, duration, { sessionId: this.sessionId });
    
    // Send to backend
    this.sendEvent('api_call', apiCall);
  }

  /**
   * Track performance metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  trackPerformance(name, value, metadata = {}) {
    const performance = {
      name,
      value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata
    };

    this.metrics.performance.push(performance);
    logger.performance(name, value, { sessionId: this.sessionId });
    
    // Send to backend
    this.sendEvent('performance', performance);
  }

  /**
   * Track error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @param {Object} metadata - Additional metadata
   */
  trackError(error, context = {}, metadata = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      path: window.location.pathname,
      context,
      ...metadata
    };

    this.metrics.errors++;
    logger.error('Client error tracked', errorData);
    
    // Send to backend
    this.sendEvent('error', errorData);
  }

  /**
   * Track business event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {Object} metadata - Additional metadata
   */
  trackBusinessEvent(event, data = {}, metadata = {}) {
    const businessEvent = {
      event,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata
    };

    logger.businessEvent(event, data, { sessionId: this.sessionId, userId: this.userId });
    
    // Send to backend
    this.sendEvent('business_event', businessEvent);
  }

  /**
   * Send event to backend
   * @param {string} type - Event type
   * @param {Object} data - Event data
   */
  async sendEvent(type, data) {
    try {
      // Check if we're in development mode to avoid 404 errors
      const isDevelopment = import.meta.env.MODE === 'development';
      
      if (isDevelopment) {
        // In development, skip API call and go directly to Supabase fallback
        throw new Error('Development mode - skipping API call');
      }

      // Try to send to backend API first
      const { data: { user } } = await supabase.auth.getUser();
      const accessToken = user?.access_token;
      
      const response = await analyticsApi.trackEvent({
        type,
        data,
        timestamp: new Date().toISOString()
      }, accessToken);
      
      if (!response.success) {
        throw new Error(`Analytics API error: ${response.error}`);
      }
    } catch (error) {
      // Fallback to Supabase - only if user is authenticated
      if (this.userId) {
        try {
          await supabase
            .from('outlook_analytics_events')
            .insert({
              event_type: type,
              data,
              user_id: this.userId,
              provider: 'general',
              timestamp: new Date().toISOString(),
              created_at: new Date().toISOString()
            });
        } catch (dbError) {
          logger.error('Failed to store analytics event', { 
            type, 
            error: dbError.message,
            sessionId: this.sessionId 
          });
        }
      } else {
        // Store locally if no authenticated user
        this.events.push({ type, data, timestamp: Date.now() });
        logger.debug('Analytics event stored locally (no authenticated user)', { 
          type, 
          sessionId: this.sessionId 
        });
      }
    }
  }

  /**
   * Set up event listeners for automatic tracking
   */
  setupEventListeners() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const element = event.target;
      if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        this.trackUserAction('click', {
          element: element.tagName,
          text: element.textContent?.trim(),
          href: element.href,
          className: element.className
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.trackUserAction('form_submit', {
        formId: event.target.id,
        formAction: event.target.action,
        formMethod: event.target.method
      });
    });

    // Track route changes (if using client-side routing)
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });
  }

  /**
   * Set up performance observer
   */
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.trackPerformance('page_load', entry.loadEventEnd - entry.loadEventStart);
            this.trackPerformance('dom_content_loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
          }
        });
      });

      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 1000) { // Only track slow resources
            this.trackPerformance('slow_resource', entry.duration, {
              name: entry.name,
              type: entry.initiatorType
            });
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Set up error tracking
   */
  setupErrorTracking() {
    // Temporarily disabled to prevent infinite error loop
    // Track unhandled errors
    // window.addEventListener('error', (event) => {
    //   this.trackError(event.error, {
    //     filename: event.filename,
    //     lineno: event.lineno,
    //     colno: event.colno
    //   });
    // });

    // Track unhandled promise rejections
    // window.addEventListener('unhandledrejection', (event) => {
    //   this.trackError(new Error(event.reason), {
    //     type: 'unhandled_promise_rejection'
    //   });
    // });
  }

  /**
   * Get session summary
   * @returns {Object} Session summary
   */
  getSessionSummary() {
    const duration = Date.now() - this.startTime;
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      duration,
      pageViews: this.metrics.pageViews,
      userActions: this.metrics.userActions,
      apiCalls: this.metrics.apiCalls,
      errors: this.metrics.errors,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString()
    };
  }

  /**
   * Send session summary
   */
  async sendSessionSummary() {
    try {
      const summary = this.getSessionSummary();
      
      // Skip sending if we're in cleanup mode (page unloading)
      if (document.visibilityState === 'hidden' || document.hidden) {
        logger.debug('Skipping session summary during page unload');
        return;
      }
      
      // Send to backend with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const getUserPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([getUserPromise, timeoutPromise]);
      const accessToken = user?.access_token;
      
      const response = await analyticsApi.storeSession(summary, accessToken);
      
      if (!response.success) {
        throw new Error(`Session API error: ${response.error}`);
      }

      logger.info('Session summary sent', summary);
    } catch (error) {
      // Don't log errors during cleanup to avoid console spam
      if (document.visibilityState !== 'hidden') {
        logger.error('Failed to send session summary', { error: error.message });
      }
    }
  }

  /**
   * Get analytics dashboard data
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(userId, timeRange = '24h') {
    try {
      // Try backend API first
      const { data: { user } } = await supabase.auth.getUser();
      const accessToken = user?.access_token;
      
      const response = await analyticsApi.getDashboard(userId, timeRange, accessToken);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      logger.warn('Failed to get dashboard data from API, falling back to Supabase');
    }

    // Fallback to Supabase
    try {
      const timeRangeStart = this.getTimeRangeStart(timeRange);
      
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', timeRangeStart);

      if (error) throw error;

      return this.processDashboardData(events);
    } catch (error) {
      logger.error('Failed to get dashboard data from Supabase', { error: error.message });
      return {
        pageViews: 0,
        userActions: 0,
        apiCalls: 0,
        errors: 0,
        topPages: [],
        topActions: []
      };
    }
  }

  /**
   * Process dashboard data from events
   * @param {Array} events - Analytics events
   * @returns {Object} Processed dashboard data
   */
  processDashboardData(events) {
    const data = {
      pageViews: 0,
      userActions: 0,
      apiCalls: 0,
      errors: 0,
      topPages: {},
      topActions: {}
    };

    events.forEach(event => {
      const eventData = event.data;
      
      switch (event.type) {
        case 'page_view':
          data.pageViews++;
          data.topPages[eventData.path] = (data.topPages[eventData.path] || 0) + 1;
          break;
        case 'user_action':
          data.userActions++;
          data.topActions[eventData.action] = (data.topActions[eventData.action] || 0) + 1;
          break;
        case 'api_call':
          data.apiCalls++;
          break;
        case 'error':
          data.errors++;
          break;
      }
    });

    // Convert to arrays and sort
    data.topPages = Object.entries(data.topPages)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    data.topActions = Object.entries(data.topActions)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return data;
  }

  /**
   * Get time range start date
   * @param {string} timeRange - Time range
   * @returns {string} ISO date string
   */
  getTimeRangeStart(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Cleanup analytics on page unload
   */
  cleanup() {
    // Completely disabled to prevent Supabase connection errors
    logger.info('Analytics cleanup completed (disabled)', { sessionId: this.sessionId });
    return;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Cleanup on page unload (disabled to prevent Supabase connection errors)
// window.addEventListener('beforeunload', () => {
//   analytics.cleanup();
// });

export default Analytics;
