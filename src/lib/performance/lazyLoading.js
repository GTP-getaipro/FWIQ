/**
 * Lazy Loading Utilities
 * Advanced lazy loading for components, images, and resources
 */

import { logger } from '../logger';

export class LazyLoadingManager {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.1,
      delay: options.delay || 100,
      enableIntersectionObserver: options.enableIntersectionObserver !== false,
      enableScrollListener: options.enableScrollListener || false,
      ...options
    };
    
    this.observers = new Map();
    this.lazyElements = new Map();
    this.loadedElements = new Set();
    this.failedElements = new Set();
    
    this.init();
  }

  /**
   * Initialize lazy loading manager
   */
  init() {
    if (this.options.enableIntersectionObserver && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else if (this.options.enableScrollListener) {
      this.setupScrollListener();
    }
    
    // Auto-detect and setup lazy elements
    this.setupLazyElements();
    
    logger.info('Lazy loading manager initialized', {
      intersectionObserver: this.options.enableIntersectionObserver,
      scrollListener: this.options.enableScrollListener,
      rootMargin: this.options.rootMargin
    });
  }

  /**
   * Setup Intersection Observer
   */
  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );
  }

  /**
   * Setup scroll listener fallback
   */
  setupScrollListener() {
    this.scrollHandler = this.throttle(() => {
      this.checkElementsInViewport();
    }, this.options.delay);
    
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });
  }

  /**
   * Auto-detect and setup lazy elements
   */
  setupLazyElements() {
    // Setup lazy images
    this.setupLazyImages();
    
    // Setup lazy components
    this.setupLazyComponents();
    
    // Setup lazy iframes
    this.setupLazyIframes();
    
    // Setup lazy videos
    this.setupLazyVideos();
  }

  /**
   * Setup lazy images
   */
  setupLazyImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    lazyImages.forEach((img, index) => {
      const elementId = `img_${index}_${Date.now()}`;
      this.lazyElements.set(elementId, {
        element: img,
        type: 'image',
        src: img.dataset.src,
        srcset: img.dataset.srcset,
        alt: img.dataset.alt || img.alt
      });
      
      this.observeElement(elementId, img);
    });
  }

  /**
   * Setup lazy components (React components with data-lazy-component)
   */
  setupLazyComponents() {
    const lazyComponents = document.querySelectorAll('[data-lazy-component]');
    
    lazyComponents.forEach((component, index) => {
      const elementId = `component_${index}_${Date.now()}`;
      this.lazyElements.set(elementId, {
        element: component,
        type: 'component',
        componentName: component.dataset.lazyComponent,
        props: JSON.parse(component.dataset.lazyProps || '{}')
      });
      
      this.observeElement(elementId, component);
    });
  }

  /**
   * Setup lazy iframes
   */
  setupLazyIframes() {
    const lazyIframes = document.querySelectorAll('iframe[data-src]');
    
    lazyIframes.forEach((iframe, index) => {
      const elementId = `iframe_${index}_${Date.now()}`;
      this.lazyElements.set(elementId, {
        element: iframe,
        type: 'iframe',
        src: iframe.dataset.src
      });
      
      this.observeElement(elementId, iframe);
    });
  }

  /**
   * Setup lazy videos
   */
  setupLazyVideos() {
    const lazyVideos = document.querySelectorAll('video[data-src], video[data-poster]');
    
    lazyVideos.forEach((video, index) => {
      const elementId = `video_${index}_${Date.now()}`;
      this.lazyElements.set(elementId, {
        element: video,
        type: 'video',
        src: video.dataset.src,
        poster: video.dataset.poster
      });
      
      this.observeElement(elementId, video);
    });
  }

  /**
   * Observe an element for lazy loading
   */
  observeElement(elementId, element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
      this.observers.set(element, elementId);
    }
  }

  /**
   * Handle intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const elementId = this.observers.get(entry.target);
        if (elementId) {
          this.loadElement(elementId);
          this.unobserveElement(entry.target);
        }
      }
    });
  }

  /**
   * Check elements in viewport (scroll listener fallback)
   */
  checkElementsInViewport() {
    this.lazyElements.forEach((lazyElement, elementId) => {
      if (!this.loadedElements.has(elementId) && !this.failedElements.has(elementId)) {
        if (this.isElementInViewport(lazyElement.element)) {
          this.loadElement(elementId);
        }
      }
    });
  }

  /**
   * Check if element is in viewport
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= -parseInt(this.options.rootMargin) &&
      rect.left >= -parseInt(this.options.rootMargin) &&
      rect.bottom <= windowHeight + parseInt(this.options.rootMargin) &&
      rect.right <= windowWidth + parseInt(this.options.rootMargin)
    );
  }

  /**
   * Load a lazy element
   */
  async loadElement(elementId) {
    const lazyElement = this.lazyElements.get(elementId);
    if (!lazyElement) return;

    const { element, type } = lazyElement;
    
    try {
      // Add loading state
      element.classList.add('lazy-loading');
      
      switch (type) {
        case 'image':
          await this.loadImage(lazyElement);
          break;
        case 'component':
          await this.loadComponent(lazyElement);
          break;
        case 'iframe':
          await this.loadIframe(lazyElement);
          break;
        case 'video':
          await this.loadVideo(lazyElement);
          break;
        default:
          logger.warn('Unknown lazy element type', { type, elementId });
      }
      
      // Mark as loaded
      element.classList.remove('lazy-loading');
      element.classList.add('lazy-loaded');
      this.loadedElements.add(elementId);
      
      logger.debug('Lazy element loaded', { elementId, type });
      
    } catch (error) {
      element.classList.remove('lazy-loading');
      element.classList.add('lazy-error');
      this.failedElements.add(elementId);
      
      logger.error('Failed to load lazy element', {
        elementId,
        type,
        error: error.message
      });
    }
  }

  /**
   * Load lazy image
   */
  async loadImage(lazyElement) {
    const { element, src, srcset, alt } = lazyElement;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        element.src = src;
        if (srcset) element.srcset = srcset;
        if (alt) element.alt = alt;
        
        // Remove data attributes
        element.removeAttribute('data-src');
        element.removeAttribute('data-srcset');
        element.removeAttribute('data-alt');
        
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
      if (srcset) img.srcset = srcset;
    });
  }

  /**
   * Load lazy component
   */
  async loadComponent(lazyElement) {
    const { element, componentName, props } = lazyElement;
    
    try {
      // This would integrate with your component loading system
      // For now, we'll just trigger a custom event
      const event = new CustomEvent('lazyComponentLoad', {
        detail: { componentName, props, element }
      });
      
      element.dispatchEvent(event);
      
      // Mark component as loaded
      element.setAttribute('data-lazy-loaded', 'true');
      
    } catch (error) {
      throw new Error(`Failed to load component ${componentName}: ${error.message}`);
    }
  }

  /**
   * Load lazy iframe
   */
  async loadIframe(lazyElement) {
    const { element, src } = lazyElement;
    
    return new Promise((resolve, reject) => {
      element.onload = () => {
        element.removeAttribute('data-src');
        resolve();
      };
      
      element.onerror = () => {
        reject(new Error(`Failed to load iframe: ${src}`));
      };
      
      element.src = src;
    });
  }

  /**
   * Load lazy video
   */
  async loadVideo(lazyElement) {
    const { element, src, poster } = lazyElement;
    
    if (src) {
      element.src = src;
      element.removeAttribute('data-src');
    }
    
    if (poster) {
      element.poster = poster;
      element.removeAttribute('data-poster');
    }
    
    // Load video metadata
    element.load();
  }

  /**
   * Unobserve element
   */
  unobserveElement(element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
      this.observers.delete(element);
    }
  }

  /**
   * Add lazy element manually
   */
  addLazyElement(element, options = {}) {
    const elementId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.lazyElements.set(elementId, {
      element,
      type: options.type || 'image',
      ...options
    });
    
    this.observeElement(elementId, element);
    
    return elementId;
  }

  /**
   * Remove lazy element
   */
  removeLazyElement(elementId) {
    const lazyElement = this.lazyElements.get(elementId);
    if (lazyElement) {
      this.unobserveElement(lazyElement.element);
      this.lazyElements.delete(elementId);
      this.loadedElements.delete(elementId);
      this.failedElements.delete(elementId);
    }
  }

  /**
   * Preload element
   */
  preloadElement(elementId) {
    const lazyElement = this.lazyElements.get(elementId);
    if (lazyElement && !this.loadedElements.has(elementId)) {
      this.loadElement(elementId);
    }
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      total: this.lazyElements.size,
      loaded: this.loadedElements.size,
      failed: this.failedElements.size,
      pending: this.lazyElements.size - this.loadedElements.size - this.failedElements.size,
      loadRate: this.lazyElements.size > 0 ? 
        (this.loadedElements.size / this.lazyElements.size) * 100 : 0
    };
  }

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Destroy lazy loading manager
   */
  destroy() {
    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    // Remove scroll listeners
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
    
    // Clear all data
    this.observers.clear();
    this.lazyElements.clear();
    this.loadedElements.clear();
    this.failedElements.clear();
    
    logger.info('Lazy loading manager destroyed');
  }
}

// React Hook for lazy loading
export const useLazyLoading = (options = {}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const elementRef = React.useRef(null);
  const managerRef = React.useRef(null);

  React.useEffect(() => {
    if (elementRef.current) {
      managerRef.current = new LazyLoadingManager(options);
      const elementId = managerRef.current.addLazyElement(elementRef.current, {
        ...options,
        onLoad: () => {
          setIsLoaded(true);
          setIsLoading(false);
        },
        onError: (err) => {
          setError(err);
          setIsLoading(false);
        }
      });

      return () => {
        if (managerRef.current) {
          managerRef.current.removeLazyElement(elementId);
        }
      };
    }
  }, []);

  return {
    elementRef,
    isLoaded,
    isLoading,
    error
  };
};

// Utility functions
export const createLazyImage = (src, options = {}) => {
  const img = document.createElement('img');
  img.setAttribute('data-src', src);
  img.setAttribute('loading', 'lazy');
  
  if (options.alt) img.setAttribute('alt', options.alt);
  if (options.className) img.className = options.className;
  if (options.srcset) img.setAttribute('data-srcset', options.srcset);
  
  return img;
};

export const createLazyComponent = (componentName, props = {}) => {
  const div = document.createElement('div');
  div.setAttribute('data-lazy-component', componentName);
  div.setAttribute('data-lazy-props', JSON.stringify(props));
  
  return div;
};

export const createLazyIframe = (src, options = {}) => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('data-src', src);
  
  if (options.width) iframe.width = options.width;
  if (options.height) iframe.height = options.height;
  if (options.className) iframe.className = options.className;
  
  return iframe;
};

// Export default instance
export const lazyLoadingManager = new LazyLoadingManager();
