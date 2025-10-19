/**
 * Mobile Performance Validator
 * Validates mobile performance and provides optimization recommendations
 */

export class MobilePerformanceValidator {
  constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      touchLatency: 0,
      scrollPerformance: 0
    };
    this.recommendations = [];
  }

  /**
   * Validate mobile performance
   * @returns {Object} Performance validation results
   */
  async validatePerformance() {
    try {
      await this.measureLoadTime();
      await this.measureRenderTime();
      await this.measureMemoryUsage();
      await this.measureTouchLatency();
      await this.measureScrollPerformance();
      
      this.generateRecommendations();
      
      return {
        metrics: this.metrics,
        recommendations: this.recommendations,
        score: this.calculatePerformanceScore(),
        isMobileOptimized: this.isMobileOptimized()
      };
    } catch (error) {
      console.error('Mobile performance validation failed:', error);
      return {
        metrics: this.metrics,
        recommendations: ['Enable performance monitoring'],
        score: 0,
        isMobileOptimized: false,
        error: error.message
      };
    }
  }

  /**
   * Measure page load time
   */
  async measureLoadTime() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        this.metrics.loadTime = performance.now();
        resolve();
      } else {
        window.addEventListener('load', () => {
          this.metrics.loadTime = performance.now();
          resolve();
        });
      }
    });
  }

  /**
   * Measure render performance
   */
  async measureRenderTime() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const paintEntries = entries.filter(entry => 
            entry.name === 'first-contentful-paint' || 
            entry.name === 'largest-contentful-paint'
          );
          
          if (paintEntries.length > 0) {
            this.metrics.renderTime = paintEntries[0].startTime;
            observer.disconnect();
            resolve();
          }
        });
        
        observer.observe({ entryTypes: ['paint'] });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  /**
   * Measure memory usage
   */
  async measureMemoryUsage() {
    if ('memory' in performance) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Measure touch latency
   */
  async measureTouchLatency() {
    let touchStartTime = 0;
    let touchEndTime = 0;
    
    const touchStartHandler = (e) => {
      touchStartTime = performance.now();
    };
    
    const touchEndHandler = (e) => {
      touchEndTime = performance.now();
      this.metrics.touchLatency = touchEndTime - touchStartTime;
      
      // Remove listeners after first measurement
      document.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchend', touchEndHandler);
    };
    
    document.addEventListener('touchstart', touchStartHandler);
    document.addEventListener('touchend', touchEndHandler);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      document.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchend', touchEndHandler);
    }, 10000);
  }

  /**
   * Measure scroll performance
   */
  async measureScrollPerformance() {
    let scrollStartTime = 0;
    let scrollEndTime = 0;
    let frameCount = 0;
    
    const scrollHandler = () => {
      if (scrollStartTime === 0) {
        scrollStartTime = performance.now();
      }
      
      frameCount++;
      
      if (frameCount >= 10) { // Measure 10 frames
        scrollEndTime = performance.now();
        this.metrics.scrollPerformance = (scrollEndTime - scrollStartTime) / frameCount;
        
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    
    window.addEventListener('scroll', scrollHandler);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('scroll', scrollHandler);
    }, 5000);
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    this.recommendations = [];
    
    // Load time recommendations
    if (this.metrics.loadTime > 3000) {
      this.recommendations.push({
        type: 'load-time',
        priority: 'high',
        message: 'Page load time exceeds 3 seconds. Consider optimizing images and reducing bundle size.',
        impact: 'high'
      });
    }
    
    // Render time recommendations
    if (this.metrics.renderTime > 1500) {
      this.recommendations.push({
        type: 'render-time',
        priority: 'high',
        message: 'First contentful paint exceeds 1.5 seconds. Consider code splitting and lazy loading.',
        impact: 'high'
      });
    }
    
    // Memory usage recommendations
    if (this.metrics.memoryUsage > 50) {
      this.recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'Memory usage exceeds 50MB. Consider implementing memory cleanup.',
        impact: 'medium'
      });
    }
    
    // Touch latency recommendations
    if (this.metrics.touchLatency > 100) {
      this.recommendations.push({
        type: 'touch-latency',
        priority: 'high',
        message: 'Touch latency exceeds 100ms. Optimize touch event handlers.',
        impact: 'high'
      });
    }
    
    // Scroll performance recommendations
    if (this.metrics.scrollPerformance > 16.67) { // 60fps = 16.67ms per frame
      this.recommendations.push({
        type: 'scroll-performance',
        priority: 'medium',
        message: 'Scroll performance below 60fps. Consider optimizing scroll handlers.',
        impact: 'medium'
      });
    }
    
    // General mobile recommendations
    this.recommendations.push({
      type: 'general',
      priority: 'low',
      message: 'Ensure all interactive elements have minimum 44px touch targets.',
      impact: 'low'
    });
    
    this.recommendations.push({
      type: 'general',
      priority: 'low',
      message: 'Use CSS transforms instead of changing layout properties for animations.',
      impact: 'low'
    });
  }

  /**
   * Calculate overall performance score
   * @returns {number} Performance score (0-100)
   */
  calculatePerformanceScore() {
    let score = 100;
    
    // Deduct points for poor performance
    if (this.metrics.loadTime > 3000) score -= 20;
    if (this.metrics.renderTime > 1500) score -= 20;
    if (this.metrics.memoryUsage > 50) score -= 15;
    if (this.metrics.touchLatency > 100) score -= 20;
    if (this.metrics.scrollPerformance > 16.67) score -= 15;
    
    return Math.max(0, score);
  }

  /**
   * Check if mobile is optimized
   * @returns {boolean} True if mobile optimized
   */
  isMobileOptimized() {
    return this.calculatePerformanceScore() >= 70;
  }

  /**
   * Get mobile optimization checklist
   * @returns {Array} Optimization checklist
   */
  getOptimizationChecklist() {
    return [
      {
        item: 'Touch targets are at least 44px',
        checked: this.checkTouchTargets(),
        priority: 'high'
      },
      {
        item: 'Page loads in under 3 seconds',
        checked: this.metrics.loadTime < 3000,
        priority: 'high'
      },
      {
        item: 'First contentful paint under 1.5s',
        checked: this.metrics.renderTime < 1500,
        priority: 'high'
      },
      {
        item: 'Memory usage under 50MB',
        checked: this.metrics.memoryUsage < 50,
        priority: 'medium'
      },
      {
        item: 'Touch latency under 100ms',
        checked: this.metrics.touchLatency < 100,
        priority: 'high'
      },
      {
        item: 'Scroll performance at 60fps',
        checked: this.metrics.scrollPerformance < 16.67,
        priority: 'medium'
      },
      {
        item: 'Responsive design implemented',
        checked: this.checkResponsiveDesign(),
        priority: 'high'
      },
      {
        item: 'Mobile navigation optimized',
        checked: this.checkMobileNavigation(),
        priority: 'high'
      }
    ];
  }

  /**
   * Check touch target sizes
   * @returns {boolean} True if touch targets are adequate
   */
  checkTouchTargets() {
    const buttons = document.querySelectorAll('button, [role="button"], a');
    let adequateTargets = 0;
    
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        adequateTargets++;
      }
    });
    
    return adequateTargets / buttons.length >= 0.8; // 80% of targets should be adequate
  }

  /**
   * Check responsive design implementation
   * @returns {boolean} True if responsive design is implemented
   */
  checkResponsiveDesign() {
    const viewport = document.querySelector('meta[name="viewport"]');
    const hasResponsiveClasses = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]').length > 0;
    
    return viewport && hasResponsiveClasses;
  }

  /**
   * Check mobile navigation implementation
   * @returns {boolean} True if mobile navigation is implemented
   */
  checkMobileNavigation() {
    const mobileNav = document.querySelector('[class*="mobile"], [class*="lg:hidden"]');
    return !!mobileNav;
  }
}

export default MobilePerformanceValidator;
