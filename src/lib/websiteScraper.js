/**
 * Website Scraper for Business Profile Analysis
 * Extracts business information from company websites to supplement email analysis
 */

class WebsiteScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Extract business information from a website URL
   * @param {string} url - The website URL to scrape
   * @returns {Promise<Object>} - Extracted business information
   */
  async scrapeBusinessInfo(url) {
    try {
      console.log('🌐 Starting website scraping for:', url);
      
      // Validate and clean URL
      const cleanUrl = this.validateAndCleanUrl(url);
      if (!cleanUrl) {
        throw new Error('Invalid URL provided');
      }

      // Fetch website content
      const content = await this.fetchWebsiteContent(cleanUrl);
      if (!content) {
        throw new Error('Failed to fetch website content');
      }

      // Extract business information using multiple strategies
      const extractedInfo = await this.extractBusinessInformation(content, cleanUrl);
      
      console.log('✅ Website scraping completed:', extractedInfo);
      return {
        success: true,
        data: extractedInfo,
        source: 'website',
        url: cleanUrl
      };

    } catch (error) {
      console.error('❌ Website scraping failed:', error.message);
      return {
        success: false,
        error: error.message,
        url: url
      };
    }
  }

  /**
   * Validate and clean the provided URL
   * @param {string} url - Raw URL
   * @returns {string|null} - Clean URL or null if invalid
   */
  validateAndCleanUrl(url) {
    try {
      // Remove any whitespace
      url = url.trim();
      
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Validate URL format
      const urlObj = new URL(url);
      
      // Ensure it's a valid domain
      if (!urlObj.hostname || urlObj.hostname === '') {
        return null;
      }

      return urlObj.toString();
    } catch (error) {
      console.error('Invalid URL format:', url, error);
      return null;
    }
  }

  /**
   * Fetch website content with proper headers and error handling
   * @param {string} url - Valid URL
   * @returns {Promise<string|null>} - HTML content or null
   */
  async fetchWebsiteContent(url) {
    try {
      console.log('📡 Fetching website content from:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      console.log('📄 Website content fetched, length:', content.length);
      
      return content;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - website took too long to respond');
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS error - website blocks cross-origin requests');
      } else {
        throw new Error(`Failed to fetch website: ${error.message}`);
      }
    }
  }

  /**
   * Extract business information from HTML content
   * @param {string} htmlContent - Raw HTML content
   * @param {string} url - Source URL
   * @returns {Promise<Object>} - Extracted business information
   */
  async extractBusinessInformation(htmlContent, url) {
    console.log('🔍 Extracting business information from HTML content');
    
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const extractedInfo = {
      businessName: this.extractBusinessName(doc, url),
      phone: this.extractPhone(doc),
      email: this.extractEmail(doc),
      address: this.extractAddress(doc),
      businessType: this.extractBusinessType(doc),
      services: this.extractServices(doc),
      hours: this.extractBusinessHours(doc),
      socialMedia: this.extractSocialMedia(doc),
      description: this.extractDescription(doc),
      teamSize: this.extractTeamSize(doc),
      foundedYear: this.extractFoundedYear(doc),
      serviceArea: this.extractServiceArea(doc)
    };

    // Clean up extracted data
    return this.cleanExtractedData(extractedInfo);
  }

  /**
   * Extract business name from various HTML elements
   */
  extractBusinessName(doc, url) {
    const selectors = [
      'h1', 'h2', 'title',
      '[class*="logo"]', '[class*="brand"]', '[class*="company"]',
      'meta[property="og:title"]',
      'meta[name="application-name"]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        let text = '';
        if (element.tagName === 'META') {
          text = element.getAttribute('content') || '';
        } else {
          text = element.textContent || '';
        }
        
        if (text && text.length > 2 && text.length < 100) {
          // Clean up the text
          text = text.replace(/[|–-].*$/, '').trim(); // Remove suffixes after separators
          if (text && !text.toLowerCase().includes('home') && !text.toLowerCase().includes('welcome')) {
            return text;
          }
        }
      }
    }

    // Fallback to domain name
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '').split('.')[0].replace(/-/g, ' ');
    } catch {
      return '';
    }
  }

  /**
   * Extract phone numbers
   */
  extractPhone(doc) {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const text = doc.body.textContent || '';
    const matches = text.match(phoneRegex);
    
    if (matches && matches.length > 0) {
      // Return the first valid phone number
      return matches[0].replace(/[^\d+()-.\s]/g, '');
    }
    return '';
  }

  /**
   * Extract email addresses
   */
  extractEmail(doc) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const text = doc.body.textContent || '';
    const matches = text.match(emailRegex);
    
    if (matches && matches.length > 0) {
      // Filter out common non-business emails
      const businessEmails = matches.filter(email => 
        !email.includes('example') && 
        !email.includes('test') && 
        !email.includes('admin') &&
        !email.includes('noreply')
      );
      return businessEmails[0] || matches[0];
    }
    return '';
  }

  /**
   * Extract business address
   */
  extractAddress(doc) {
    // Look for structured data first
    const structuredSelectors = [
      '[itemtype*="PostalAddress"]',
      '[class*="address"]',
      '[class*="location"]'
    ];

    for (const selector of structuredSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text.length > 10 && text.length < 200) {
          return text;
        }
      }
    }

    // Look for address patterns in text
    const addressRegex = /\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct)/gi;
    const text = doc.body.textContent || '';
    const matches = text.match(addressRegex);
    
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }

    return '';
  }

  /**
   * Extract business type/category
   */
  extractBusinessType(doc) {
    const keywords = {
      'Hot Tub Services': ['hot tub', 'spa', 'jacuzzi', 'pool'],
      'Pools & Spas': ['pool', 'swimming', 'spa', 'hot tub'],
      'Home Services': ['home', 'residential', 'maintenance', 'repair'],
      'Retail': ['store', 'shop', 'retail', 'sale', 'buy'],
      'Restaurant': ['restaurant', 'dining', 'food', 'menu', 'eat'],
      'Professional Services': ['consulting', 'professional', 'services', 'business']
    };

    const text = (doc.body.textContent || '').toLowerCase();
    
    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some(term => text.includes(term))) {
        return category;
      }
    }

    return '';
  }

  /**
   * Extract services offered
   */
  extractServices(doc) {
    const serviceSelectors = [
      '[class*="service"]',
      '[class*="offer"]',
      '[class*="product"]'
    ];

    const services = [];
    
    for (const selector of serviceSelectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent.trim();
        if (text.length > 5 && text.length < 100 && !services.includes(text)) {
          services.push(text);
        }
      });
    }

    return services.slice(0, 5); // Limit to 5 services
  }

  /**
   * Extract business hours
   */
  extractBusinessHours(doc) {
    const hoursSelectors = [
      '[class*="hour"]',
      '[class*="time"]',
      '[class*="schedule"]'
    ];

    for (const selector of hoursSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text.length > 10 && text.length < 200) {
          return text;
        }
      }
    }

    return '';
  }

  /**
   * Extract social media links
   */
  extractSocialMedia(doc) {
    const socialLinks = {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    };

    const links = doc.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.href.toLowerCase();
      const text = link.textContent.toLowerCase();
      
      if (href.includes('facebook.com') || text.includes('facebook')) {
        socialLinks.facebook = link.href;
      } else if (href.includes('instagram.com') || text.includes('instagram')) {
        socialLinks.instagram = link.href;
      } else if (href.includes('twitter.com') || text.includes('twitter')) {
        socialLinks.twitter = link.href;
      } else if (href.includes('linkedin.com') || text.includes('linkedin')) {
        socialLinks.linkedin = link.href;
      }
    });

    return socialLinks;
  }

  /**
   * Extract business description
   */
  extractDescription(doc) {
    const descriptionSelectors = [
      'meta[name="description"]',
      '[class*="about"]',
      '[class*="description"]',
      '[class*="intro"]'
    ];

    for (const selector of descriptionSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        let text = '';
        if (element.tagName === 'META') {
          text = element.getAttribute('content') || '';
        } else {
          text = element.textContent || '';
        }
        
        if (text.length > 20 && text.length < 500) {
          return text.trim();
        }
      }
    }

    return '';
  }

  /**
   * Extract team size information
   */
  extractTeamSize(doc) {
    const text = (doc.body.textContent || '').toLowerCase();
    const teamRegex = /(\d+)\s*(?:employees?|staff|team|people|workers?)/;
    const match = text.match(teamRegex);
    
    if (match) {
      const size = parseInt(match[1]);
      if (size >= 1 && size <= 10000) {
        return `${size} employees`;
      }
    }

    return '';
  }

  /**
   * Extract founded year
   */
  extractFoundedYear(doc) {
    const text = (doc.body.textContent || '').toLowerCase();
    const foundedRegex = /(?:founded|established|since|est\.?)\s*(\d{4})/;
    const match = text.match(foundedRegex);
    
    if (match) {
      const year = parseInt(match[1]);
      const currentYear = new Date().getFullYear();
      if (year >= 1800 && year <= currentYear) {
        return year.toString();
      }
    }

    return '';
  }

  /**
   * Extract service area
   */
  extractServiceArea(doc) {
    const text = (doc.body.textContent || '').toLowerCase();
    const areaKeywords = ['serving', 'service area', 'coverage', 'locations'];
    
    for (const keyword of areaKeywords) {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        const afterKeyword = text.substring(index + keyword.length, index + keyword.length + 100);
        // Extract location names (basic implementation)
        const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
        const matches = afterKeyword.match(locationRegex);
        if (matches && matches.length > 0) {
          return matches.slice(0, 3).join(', ');
        }
      }
    }

    return '';
  }

  /**
   * Clean and validate extracted data
   */
  cleanExtractedData(data) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove extra whitespace and clean up
        cleaned[key] = value.trim().replace(/\s+/g, ' ');
        
        // Remove empty strings
        if (cleaned[key] === '' || cleaned[key] === 'null' || cleaned[key] === 'undefined') {
          cleaned[key] = '';
        }
      } else if (Array.isArray(value)) {
        // Clean array values
        cleaned[key] = value.filter(item => 
          item && typeof item === 'string' && item.trim() !== ''
        ).map(item => item.trim());
      } else if (typeof value === 'object' && value !== null) {
        // Clean object values (like social media)
        const cleanedObj = {};
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue && subValue.trim() !== '') {
            cleanedObj[subKey] = subValue.trim();
          }
        }
        cleaned[key] = cleanedObj;
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }
}

export default WebsiteScraper;

