/**
 * Image Optimization Utilities
 * Advanced image optimization, compression, and responsive image handling
 */

import { logger } from '../logger';

export class ImageOptimizationManager {
  constructor(options = {}) {
    this.options = {
      quality: options.quality || 80,
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1080,
      enableWebP: options.enableWebP !== false,
      enableAVIF: options.enableAVIF !== false,
      enableResponsive: options.enableResponsive !== false,
      enableCompression: options.enableCompression !== false,
      lazyLoading: options.lazyLoading !== false,
      ...options
    };
    
    this.supportedFormats = this.detectSupportedFormats();
    this.imageCache = new Map();
    this.compressionQueue = [];
    this.isProcessing = false;
    
    this.init();
  }

  /**
   * Initialize image optimization manager
   */
  init() {
    this.setupImageOptimization();
    this.setupResponsiveImages();
    this.setupImageCompression();
    
    logger.info('Image optimization manager initialized', {
      supportedFormats: this.supportedFormats,
      quality: this.options.quality,
      maxDimensions: `${this.options.maxWidth}x${this.options.maxHeight}`
    });
  }

  /**
   * Detect supported image formats
   */
  detectSupportedFormats() {
    const formats = {
      webp: false,
      avif: false,
      jpeg: true,
      png: true,
      gif: true,
      svg: true
    };
    
    // Test WebP support
    const webpTest = document.createElement('canvas');
    webpTest.width = 1;
    webpTest.height = 1;
    formats.webp = webpTest.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    // Test AVIF support
    const avifTest = document.createElement('canvas');
    avifTest.width = 1;
    avifTest.height = 1;
    formats.avif = avifTest.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    
    return formats;
  }

  /**
   * Setup automatic image optimization
   */
  setupImageOptimization() {
    // Process existing images
    this.processExistingImages();
    
    // Setup mutation observer for new images
    this.setupMutationObserver();
    
    // Setup intersection observer for lazy loading
    if (this.options.lazyLoading) {
      this.setupLazyLoading();
    }
  }

  /**
   * Process existing images on the page
   */
  processExistingImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach((img, index) => {
      this.optimizeImage(img, {
        priority: index < 5 ? 'high' : 'normal' // Prioritize first 5 images
      });
    });
  }

  /**
   * Setup mutation observer for new images
   */
  setupMutationObserver() {
    if ('MutationObserver' in window) {
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'IMG') {
                this.optimizeImage(node);
              } else {
                // Check for images in added nodes
                const images = node.querySelectorAll ? node.querySelectorAll('img:not([data-optimized])') : [];
                images.forEach(img => this.optimizeImage(img));
              }
            }
          });
        });
      });
      
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Setup lazy loading for images
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.optimizeImage(img);
            this.lazyObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });
      
      // Observe images that aren't immediately visible
      document.querySelectorAll('img:not([data-optimized])').forEach(img => {
        if (!this.isImageInViewport(img)) {
          this.lazyObserver.observe(img);
        }
      });
    }
  }

  /**
   * Check if image is in viewport
   */
  isImageInViewport(img) {
    const rect = img.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Optimize an image
   */
  async optimizeImage(img, options = {}) {
    try {
      // Skip if already optimized
      if (img.hasAttribute('data-optimized')) {
        return;
      }
      
      // Skip if no src
      if (!img.src && !img.dataset.src) {
        return;
      }
      
      const imageUrl = img.src || img.dataset.src;
      const cacheKey = this.generateCacheKey(imageUrl, options);
      
      // Check cache first
      if (this.imageCache.has(cacheKey)) {
        const cachedData = this.imageCache.get(cacheKey);
        this.applyOptimizedImage(img, cachedData);
        return;
      }
      
      // Add loading state
      img.classList.add('image-optimizing');
      
      // Load and process image
      const optimizedData = await this.processImage(imageUrl, options);
      
      // Cache the result
      this.imageCache.set(cacheKey, optimizedData);
      
      // Apply optimized image
      this.applyOptimizedImage(img, optimizedData);
      
      // Mark as optimized
      img.setAttribute('data-optimized', 'true');
      img.classList.remove('image-optimizing');
      img.classList.add('image-optimized');
      
      logger.debug('Image optimized', {
        originalUrl: imageUrl,
        optimizedSize: optimizedData.size,
        format: optimizedData.format
      });
      
    } catch (error) {
      img.classList.remove('image-optimizing');
      img.classList.add('image-optimization-error');
      
      logger.error('Failed to optimize image', {
        imageUrl: img.src || img.dataset.src,
        error: error.message
      });
    }
  }

  /**
   * Process image for optimization
   */
  async processImage(imageUrl, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate optimal dimensions
          const dimensions = this.calculateOptimalDimensions(
            img.naturalWidth,
            img.naturalHeight,
            options
          );
          
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
          
          // Determine best format
          const format = this.selectBestFormat(options);
          
          // Compress image
          const compressedDataUrl = this.compressImage(canvas, format, options);
          
          resolve({
            dataUrl: compressedDataUrl,
            format,
            width: dimensions.width,
            height: dimensions.height,
            size: compressedDataUrl.length,
            originalSize: imageUrl.length
          });
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Calculate optimal dimensions
   */
  calculateOptimalDimensions(originalWidth, originalHeight, options = {}) {
    const maxWidth = options.maxWidth || this.options.maxWidth;
    const maxHeight = options.maxHeight || this.options.maxHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Scale down if too large
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    return { width, height };
  }

  /**
   * Select best format for the image
   */
  selectBestFormat(options = {}) {
    if (options.format) {
      return options.format;
    }
    
    // Prefer AVIF if supported
    if (this.supportedFormats.avif && this.options.enableAVIF) {
      return 'image/avif';
    }
    
    // Prefer WebP if supported
    if (this.supportedFormats.webp && this.options.enableWebP) {
      return 'image/webp';
    }
    
    // Fallback to JPEG
    return 'image/jpeg';
  }

  /**
   * Compress image
   */
  compressImage(canvas, format, options = {}) {
    const quality = options.quality || this.options.quality;
    const qualityDecimal = quality / 100;
    
    return canvas.toDataURL(format, qualityDecimal);
  }

  /**
   * Apply optimized image to element
   */
  applyOptimizedImage(img, optimizedData) {
    // Use srcset for responsive images
    if (this.options.enableResponsive) {
      this.applyResponsiveImage(img, optimizedData);
    } else {
      img.src = optimizedData.dataUrl;
    }
    
    // Set dimensions
    img.width = optimizedData.width;
    img.height = optimizedData.height;
    
    // Add loading attribute for lazy loading
    if (this.options.lazyLoading && !img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  }

  /**
   * Apply responsive image
   */
  applyResponsiveImage(img, optimizedData) {
    const srcset = this.generateSrcSet(optimizedData);
    
    if (srcset.length > 1) {
      img.srcset = srcset.map(item => `${item.url} ${item.width}w`).join(', ');
      img.sizes = this.generateSizes();
      img.src = srcset[0].url; // Fallback for older browsers
    } else {
      img.src = optimizedData.dataUrl;
    }
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcSet(optimizedData) {
    const srcset = [];
    const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
    
    widths.forEach(width => {
      if (width <= optimizedData.width) {
        // In a real implementation, you'd generate different sizes
        // For now, we'll use the same optimized image
        srcset.push({
          url: optimizedData.dataUrl,
          width: width
        });
      }
    });
    
    return srcset;
  }

  /**
   * Generate sizes attribute
   */
  generateSizes() {
    return '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1280px) 1280px, (max-width: 1536px) 1536px, 1920px';
  }

  /**
   * Setup responsive images
   */
  setupResponsiveImages() {
    if (!this.options.enableResponsive) return;
    
    const images = document.querySelectorAll('img[data-responsive]');
    
    images.forEach(img => {
      this.convertToResponsive(img);
    });
  }

  /**
   * Convert image to responsive
   */
  convertToResponsive(img) {
    const src = img.src;
    if (!src) return;
    
    // Generate multiple sizes
    const sizes = [320, 640, 768, 1024, 1280, 1536, 1920];
    const srcset = sizes.map(size => `${src}?w=${size} ${size}w`).join(', ');
    
    img.srcset = srcset;
    img.sizes = this.generateSizes();
  }

  /**
   * Setup image compression
   */
  setupImageCompression() {
    if (!this.options.enableCompression) return;
    
    // Process compression queue
    this.processCompressionQueue();
  }

  /**
   * Add image to compression queue
   */
  addToCompressionQueue(imageUrl, options = {}) {
    this.compressionQueue.push({ imageUrl, options });
    
    if (!this.isProcessing) {
      this.processCompressionQueue();
    }
  }

  /**
   * Process compression queue
   */
  async processCompressionQueue() {
    if (this.isProcessing || this.compressionQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.compressionQueue.length > 0) {
      const { imageUrl, options } = this.compressionQueue.shift();
      
      try {
        await this.compressImageFile(imageUrl, options);
      } catch (error) {
        logger.error('Failed to compress image', {
          imageUrl,
          error: error.message
        });
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Compress image file
   */
  async compressImageFile(imageUrl, options = {}) {
    // This would typically involve server-side compression
    // For client-side, we can only optimize display
    logger.debug('Image compression requested', { imageUrl, options });
  }

  /**
   * Generate cache key
   */
  generateCacheKey(imageUrl, options = {}) {
    const key = `${imageUrl}_${JSON.stringify(options)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const totalImages = document.querySelectorAll('img').length;
    const optimizedImages = document.querySelectorAll('img[data-optimized]').length;
    const cacheSize = this.imageCache.size;
    
    return {
      totalImages,
      optimizedImages,
      cacheSize,
      optimizationRate: totalImages > 0 ? (optimizedImages / totalImages) * 100 : 0,
      supportedFormats: this.supportedFormats
    };
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.imageCache.clear();
    logger.info('Image cache cleared');
  }

  /**
   * Update optimization options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    logger.info('Image optimization options updated', this.options);
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages() {
    const criticalImages = document.querySelectorAll('img[data-critical]');
    
    criticalImages.forEach(img => {
      if (img.src && !img.hasAttribute('data-optimized')) {
        this.optimizeImage(img, { priority: 'critical' });
      }
    });
  }

  /**
   * Setup image error handling
   */
  setupErrorHandling() {
    document.addEventListener('error', (event) => {
      if (event.target.tagName === 'IMG') {
        const img = event.target;
        
        // Try to load fallback image
        if (img.dataset.fallback) {
          img.src = img.dataset.fallback;
        } else {
          // Create placeholder
          this.createPlaceholder(img);
        }
      }
    }, true);
  }

  /**
   * Create placeholder for failed images
   */
  createPlaceholder(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 300;
    canvas.height = img.height || 200;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image failed to load', canvas.width / 2, canvas.height / 2);
    
    img.src = canvas.toDataURL();
  }

  /**
   * Destroy image optimization manager
   */
  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    if (this.lazyObserver) {
      this.lazyObserver.disconnect();
    }
    
    this.imageCache.clear();
    this.compressionQueue = [];
    
    logger.info('Image optimization manager destroyed');
  }
}

// Utility functions
export const createOptimizedImage = (src, options = {}) => {
  const img = document.createElement('img');
  img.src = src;
  
  if (options.alt) img.alt = options.alt;
  if (options.className) img.className = options.className;
  if (options.loading) img.setAttribute('loading', options.loading);
  if (options.critical) img.setAttribute('data-critical', 'true');
  if (options.responsive) img.setAttribute('data-responsive', 'true');
  
  return img;
};

export const createResponsiveImage = (src, alt, options = {}) => {
  const img = createOptimizedImage(src, { ...options, alt, responsive: true });
  return img;
};

export const createLazyImage = (src, alt, options = {}) => {
  const img = createOptimizedImage(src, { ...options, alt, loading: 'lazy' });
  img.setAttribute('data-src', src);
  img.removeAttribute('src');
  return img;
};

// Export default instance
export const imageOptimizationManager = new ImageOptimizationManager();
