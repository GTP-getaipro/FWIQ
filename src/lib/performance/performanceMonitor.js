/**
 * Performance Monitor
 * Advanced performance monitoring with Web Vitals, resource timing, and optimization
 */

import { logger } from '../logger';
import { analytics } from '../analytics';
import { supabase } from '../customSupabaseClient';

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.resourceTimings = [];
    this.userTimings = [];
    this.thresholds = {
      LCP: 2500, // Largest Contentful Paint - 2.5s
      FID: 100,  // First Input Delay - 100ms
      CLS: 0.1,  // Cumulative Layout Shift - 0.1
      FCP: 1800, // First Contentful Paint - 1.8s
      TTFB: 800, // Time to First Byte - 800ms
      TBT: 200   // Total Blocking Time - 200ms
    };
    
    this.isMonitoring = false;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Performance optimization flags
    this.optimizations = {
      lazyLoading: true,
      imageOptimization: true,
      bundleOptimization: true,
      prefetching: true
    };
  }

  /**
   * Start comprehensive performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting performance monitoring', { sessionId: this.sessionId });

    // Start monitoring different performance aspects
    this.observeWebVitals();
    this.observeResourceTiming();
    this.observeUserTiming();
    this.observeNavigationTiming();
    this.observeLongTasks();
    this.observeMemoryUsage();
    
    // Set up performance optimization
    this.setupOptimizations();
    
    // Start periodic reporting
    this.startPeriodicReporting();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    // Disconnect all observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.warn('Error disconnecting observer', { error: error.message });
      }
    });
    
    this.observers = [];
    
    // Send final report
    this.sendFinalReport();
    
    logger.info('Performance monitoring stopped');
  }

  /**
   * Observe Core Web Vitals
   */
  observeWebVitals() {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
    
    // First Contentful Paint (FCP)
    this.observeFCP();
    
    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
          size: lastEntry.size
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe LCP', { error: error.message });
    }
  }

  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('FID', fid, {
            eventType: entry.name,
            target: entry.target?.tagName
          });
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe FID', { error: error.message });
    }
  }

  observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue, {
          sources: entries.map(entry => ({
            element: entry.sources?.[0]?.node?.tagName,
            value: entry.value
          }))
        });
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe CLS', { error: error.message });
    }
  }

  observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FCP', entry.startTime, {
            element: entry.element?.tagName
          });
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe FCP', { error: error.message });
    }
  }

  observeTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.responseStart > 0) {
            const ttfb = entry.responseStart - entry.requestStart;
            this.recordMetric('TTFB', ttfb, {
              url: entry.name,
              transferSize: entry.transferSize
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe TTFB', { error: error.message });
    }
  }

  /**
   * Observe resource timing
   */
  observeResourceTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.resourceTimings.push({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType,
            startTime: entry.startTime
          });
          
          // Check for slow resources
          if (entry.duration > 1000) { // 1 second
            this.recordSlowResource(entry);
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe resource timing', { error: error.message });
    }
  }

  /**
   * Observe user timing
   */
  observeUserTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.userTimings.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
          
          // Log custom performance marks
          if (entry.entryType === 'measure') {
            this.recordMetric(`user_${entry.name}`, entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'mark'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe user timing', { error: error.message });
    }
  }

  /**
   * Observe navigation timing
   */
  observeNavigationTiming() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const navTiming = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            totalLoadTime: entry.loadEventEnd - entry.navigationStart
          };
          
          this.recordMetric('navigation_timing', navTiming);
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe navigation timing', { error: error.message });
    }
  }

  /**
   * Observe long tasks
   */
  observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('long_task', entry.duration, {
            startTime: entry.startTime,
            name: entry.name
          });
          
          if (entry.duration > 50) { // 50ms threshold
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe long tasks', { error: error.message });
    }
  }

  /**
   * Observe memory usage
   */
  observeMemoryUsage() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = performance.memory;
        this.recordMetric('memory_usage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
      };
      
      // Check memory every 30 seconds
      setInterval(checkMemory, 30000);
      checkMemory(); // Initial check
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata
    };
    
    this.metrics.set(name, metric);
    
    // Check if it's a performance issue
    if (this.isPerformanceIssue(name, value)) {
      this.handlePerformanceIssue(name, value, metadata);
    }
    
    // Send to analytics
    this.sendToAnalytics(name, value, metadata);
    
    logger.debug('Performance metric recorded', { name, value });
  }

  /**
   * Check if a metric indicates a performance issue
   */
  isPerformanceIssue(metric, value) {
    const threshold = this.thresholds[metric];
    if (!threshold) return false;
    
    return value > threshold;
  }

  /**
   * Handle performance issues
   */
  handlePerformanceIssue(metric, value, metadata) {
    const severity = this.getPerformanceSeverity(metric, value);
    
    logger.warn('Performance issue detected', {
      metric,
      value,
      threshold: this.thresholds[metric],
      severity,
      metadata
    });
    
    // Send alert to analytics
    analytics.trackEvent('performance_issue', {
      metric,
      value,
      threshold: this.thresholds[metric],
      severity,
      url: window.location.href
    });
    
    // Suggest optimizations
    this.suggestOptimizations(metric, value);
  }

  /**
   * Get performance severity level
   */
  getPerformanceSeverity(metric, value) {
    const threshold = this.thresholds[metric];
    const ratio = value / threshold;
    
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1.2) return 'medium';
    return 'low';
  }

  /**
   * Suggest performance optimizations
   */
  suggestOptimizations(metric, value) {
    const suggestions = {
      LCP: ['Optimize images', 'Reduce server response time', 'Eliminate render-blocking resources'],
      FID: ['Reduce JavaScript execution time', 'Use web workers', 'Optimize third-party scripts'],
      CLS: ['Set size attributes on images', 'Avoid inserting content above existing content'],
      FCP: ['Minify CSS', 'Remove unused CSS', 'Optimize critical rendering path'],
      TTFB: ['Improve server response time', 'Use CDN', 'Enable compression']
    };
    
    const metricSuggestions = suggestions[metric] || [];
    if (metricSuggestions.length > 0) {
      logger.info('Performance optimization suggestions', {
        metric,
        suggestions: metricSuggestions
      });
    }
  }

  /**
   * Record slow resource
   */
  recordSlowResource(entry) {
    this.recordMetric('slow_resource', entry.duration, {
      url: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize
    });
  }

  /**
   * Send metrics to analytics
   */
  sendToAnalytics(name, value, metadata = {}) {
    try {
      // Send to internal analytics
      analytics.trackEvent('performance_metric', {
        metric_name: name,
        metric_value: value,
        page_location: window.location.href,
        session_id: this.sessionId,
        ...metadata
      });
      
      // Send to Google Analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'performance_metric', {
          metric_name: name,
          metric_value: value,
          page_location: window.location.href
        });
      }
    } catch (error) {
      logger.warn('Failed to send performance metric to analytics', { error: error.message });
    }
  }

  /**
   * Set up performance optimizations
   */
  setupOptimizations() {
    if (this.optimizations.lazyLoading) {
      this.setupLazyLoading();
    }
    
    if (this.optimizations.imageOptimization) {
      this.setupImageOptimization();
    }
    
    if (this.optimizations.prefetching) {
      this.setupPrefetching();
    }
  }

  /**
   * Set up lazy loading
   */
  setupLazyLoading() {
    // Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Set up image optimization
   */
  setupImageOptimization() {
    // Add loading="lazy" to images without it
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.setAttribute('loading', 'lazy');
    });
  }

  /**
   * Set up prefetching
   */
  setupPrefetching() {
    // Prefetch critical resources
    const criticalResources = [
      '/fonts/',
      '/css/',
      '/js/'
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    // Report every 5 minutes
    setInterval(() => {
      this.sendPeriodicReport();
    }, 300000);
  }

  /**
   * Send periodic performance report
   */
  async sendPeriodicReport() {
    try {
      const report = this.generatePerformanceReport();
      
      // Send to Supabase
      const { error } = await supabase
        .from('performance_reports')
        .insert({
          session_id: this.sessionId,
          report_data: report,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        logger.warn('Failed to save performance report', { error: error.message });
      }
    } catch (error) {
      logger.error('Failed to send periodic report', { error: error.message });
    }
  }

  /**
   * Send final performance report
   */
  async sendFinalReport() {
    try {
      const report = this.generatePerformanceReport();
      report.session_duration = Date.now() - this.startTime;
      
      // Send to Supabase
      const { error } = await supabase
        .from('performance_sessions')
        .insert({
          session_id: this.sessionId,
          report_data: report,
          session_duration: report.session_duration,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        logger.warn('Failed to save final performance report', { error: error.message });
      }
    } catch (error) {
      logger.error('Failed to send final report', { error: error.message });
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    const metrics = Object.fromEntries(this.metrics);
    const report = {
      metrics,
      resourceTimings: this.resourceTimings,
      userTimings: this.userTimings,
      thresholds: this.thresholds,
      optimizations: this.optimizations,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Calculate performance score
    report.performanceScore = this.calculatePerformanceScore(metrics);
    
    return report;
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore(metrics) {
    let score = 100;
    
    // Deduct points for poor metrics
    Object.entries(metrics).forEach(([name, metric]) => {
      const threshold = this.thresholds[name];
      if (threshold && metric.value > threshold) {
        const ratio = metric.value / threshold;
        score -= Math.min(20, ratio * 10); // Max 20 points deduction per metric
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Get performance score
   */
  getPerformanceScore() {
    const metrics = this.getMetrics();
    return this.calculatePerformanceScore(metrics);
  }

  /**
   * Mark a custom performance point
   */
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
      logger.debug('Performance mark created', { name });
    }
  }

  /**
   * Measure performance between two marks
   */
  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        logger.debug('Performance measure created', { name, startMark, endMark });
      } catch (error) {
        logger.warn('Failed to create performance measure', { error: error.message });
      }
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update optimization settings
   */
  updateOptimizations(optimizations) {
    this.optimizations = { ...this.optimizations, ...optimizations };
    logger.info('Performance optimizations updated', this.optimizations);
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logger.info('Performance thresholds updated', this.thresholds);
  }
}

// Export a default instance
export const performanceMonitor = new PerformanceMonitor();
