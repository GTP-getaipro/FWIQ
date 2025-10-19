/**
 * Advanced Email Processor
 * 
 * Extends the existing email processing system with advanced parsing,
 * content analysis, threading, and attachment processing capabilities.
 */

import { supabase } from './customSupabaseClient';
import { EmailProcessor } from './emailProcessor';
import { EmailContentAnalyzer } from './emailContentAnalyzer';
import { EmailThreading } from './emailThreading';
import { AttachmentProcessor } from './attachmentProcessor';
import { EmailOptimizer } from './emailOptimizer';

export class AdvancedEmailProcessor extends EmailProcessor {
  constructor() {
    super();
    this.contentAnalyzer = new EmailContentAnalyzer();
    this.threading = new EmailThreading();
    this.attachmentProcessor = new AttachmentProcessor();
    this.optimizer = new EmailOptimizer();
    this.processingCache = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Process email with advanced features
   * @param {Object} emailData - Email data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Processing result
   */
  async processEmail(emailData, userId) {
    const startTime = Date.now();
    
    try {
      console.log(`Advanced processing email from ${emailData.from}: ${emailData.subject}`);

      // 1. Advanced parsing and content analysis
      const parsedData = await this.parseEmailContent(emailData);
      
      // 2. Thread detection and management
      const threadInfo = await this.threading.detectThread(parsedData, userId);
      
      // 3. Attachment processing
      const attachmentData = await this.processAttachments(parsedData, userId);
      
      // 4. Enhanced email data with advanced features
      const enhancedEmailData = {
        ...emailData,
        ...parsedData,
        threadInfo,
        attachmentData,
        processingMetadata: {
          parsedAt: new Date().toISOString(),
          processingVersion: '2.0',
          advancedFeatures: true
        }
      };

      // 5. Performance optimization
      const optimizedData = await this.optimizer.optimizeEmailData(enhancedEmailData);

      // 6. Process with base EmailProcessor
      const baseResult = await super.processEmail(optimizedData, userId);

      // 7. Update performance metrics
      const processingTime = Date.now() - startTime;
      await this.updatePerformanceMetrics(userId, processingTime, enhancedEmailData);

      // 8. Store advanced processing results
      await this.storeAdvancedProcessingResults(userId, enhancedEmailData, baseResult);

      return {
        ...baseResult,
        advancedProcessing: {
          parsedData,
          threadInfo,
          attachmentData,
          processingTime,
          optimizationApplied: true
        }
      };

    } catch (error) {
      console.error('Advanced email processing failed:', error);
      
      // Fallback to base processing
      const fallbackResult = await super.processEmail(emailData, userId);
      
      // Log advanced processing error
      await this.logAdvancedProcessingError(userId, emailData, error);
      
      return {
        ...fallbackResult,
        advancedProcessing: {
          error: error.message,
          fallbackUsed: true
        }
      };
    }
  }

  /**
   * Parse email content with advanced analysis
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Parsed data
   */
  async parseEmailContent(emailData) {
    try {
      const analysis = await this.contentAnalyzer.analyze(emailData);
      
      return {
        // Basic parsing
        subject: this.parseSubject(emailData.subject),
        body: this.parseBody(emailData.body),
        htmlBody: this.parseHtmlBody(emailData.htmlBody),
        
        // Advanced analysis
        contentAnalysis: analysis,
        
        // Extracted entities
        entities: this.extractEntities(emailData),
        
        // Language detection
        language: this.detectLanguage(emailData),
        
        // Content structure
        structure: this.analyzeStructure(emailData),
        
        // Sentiment analysis
        sentiment: analysis.sentiment,
        
        // Key phrases
        keyPhrases: analysis.keyPhrases,
        
        // Intent detection
        intent: analysis.intent
      };

    } catch (error) {
      console.error('Email content parsing failed:', error);
      return this.getBasicParsedData(emailData);
    }
  }

  /**
   * Parse email subject with advanced features
   * @param {string} subject - Email subject
   * @returns {Object} Parsed subject
   */
  parseSubject(subject) {
    if (!subject) return { original: '', cleaned: '', tokens: [] };

    const cleaned = subject
      .replace(/^(re:|fwd?:|fw:)\s*/i, '') // Remove reply/forward prefixes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const tokens = cleaned.toLowerCase().split(/\s+/);
    
    return {
      original: subject,
      cleaned,
      tokens,
      isReply: /^(re:|fwd?:|fw:)\s*/i.test(subject),
      isForward: /^(fwd?:|fw:)\s*/i.test(subject),
      wordCount: tokens.length,
      characterCount: cleaned.length
    };
  }

  /**
   * Parse email body with advanced features
   * @param {string} body - Email body
   * @returns {Object} Parsed body
   */
  parseBody(body) {
    if (!body) return { original: '', cleaned: '', tokens: [], paragraphs: [] };

    const cleaned = this.cleanTextBody(body);
    const tokens = cleaned.toLowerCase().split(/\s+/);
    const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim());

    return {
      original: body,
      cleaned,
      tokens,
      paragraphs,
      wordCount: tokens.length,
      characterCount: cleaned.length,
      paragraphCount: paragraphs.length,
      averageWordsPerParagraph: paragraphs.length > 0 ? tokens.length / paragraphs.length : 0
    };
  }

  /**
   * Parse HTML body with advanced features
   * @param {string} htmlBody - HTML body
   * @returns {Object} Parsed HTML
   */
  parseHtmlBody(htmlBody) {
    if (!htmlBody) return { original: '', textContent: '', links: [], images: [] };

    const textContent = this.htmlToText(htmlBody);
    const links = this.extractLinks(htmlBody);
    const images = this.extractImages(htmlBody);
    const structure = this.analyzeHtmlStructure(htmlBody);

    return {
      original: htmlBody,
      textContent,
      links,
      images,
      structure,
      hasHtml: true,
      linkCount: links.length,
      imageCount: images.length
    };
  }

  /**
   * Clean text body for analysis
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanTextBody(text) {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();
  }

  /**
   * Convert HTML to text
   * @param {string} html - HTML content
   * @returns {string} Text content
   */
  htmlToText(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/<br\s*\/?>/gi, '\n') // Convert br to newlines
      .replace(/<\/?(div|p|h[1-6]|li|tr)>/gi, '\n') // Convert block elements to newlines
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Convert HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
  }

  /**
   * Extract links from HTML
   * @param {string} html - HTML content
   * @returns {Array} Extracted links
   */
  extractLinks(html) {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    const links = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      links.push({
        url: match[1],
        text: this.htmlToText(match[2]),
        isExternal: this.isExternalLink(match[1])
      });
    }

    return links;
  }

  /**
   * Extract images from HTML
   * @param {string} html - HTML content
   * @returns {Array} Extracted images
   */
  extractImages(html) {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
      images.push({
        src: match[1],
        alt: altMatch ? altMatch[1] : '',
        isExternal: this.isExternalLink(match[1])
      });
    }

    return images;
  }

  /**
   * Check if link is external
   * @param {string} url - URL to check
   * @returns {boolean} Is external
   */
  isExternalLink(url) {
    try {
      const urlObj = new URL(url);
      return !['localhost', '127.0.0.1'].includes(urlObj.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Analyze HTML structure
   * @param {string} html - HTML content
   * @returns {Object} Structure analysis
   */
  analyzeHtmlStructure(html) {
    const structure = {
      hasHeadings: /<h[1-6][^>]*>/i.test(html),
      hasLists: /<(ul|ol|li)[^>]*>/i.test(html),
      hasTables: /<table[^>]*>/i.test(html),
      hasForms: /<form[^>]*>/i.test(html),
      hasButtons: /<button[^>]*>/i.test(html),
      hasInputs: /<input[^>]*>/i.test(html),
      headingCount: (html.match(/<h[1-6][^>]*>/gi) || []).length,
      listCount: (html.match(/<(ul|ol)[^>]*>/gi) || []).length,
      tableCount: (html.match(/<table[^>]*>/gi) || []).length
    };

    return structure;
  }

  /**
   * Extract entities from email
   * @param {Object} emailData - Email data
   * @returns {Object} Extracted entities
   */
  extractEntities(emailData) {
    const text = `${emailData.subject || ''} ${emailData.body || ''}`;
    
    return {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      urls: this.extractUrls(text),
      dates: this.extractDates(text),
      times: this.extractTimes(text),
      addresses: this.extractAddresses(text),
      names: this.extractNames(text)
    };
  }

  /**
   * Extract email addresses
   * @param {string} text - Text to search
   * @returns {Array} Email addresses
   */
  extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return [...new Set(text.match(emailRegex) || [])];
  }

  /**
   * Extract phone numbers
   * @param {string} text - Text to search
   * @returns {Array} Phone numbers
   */
  extractPhones(text) {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    return [...new Set(text.match(phoneRegex) || [])];
  }

  /**
   * Extract URLs
   * @param {string} text - Text to search
   * @returns {Array} URLs
   */
  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    return [...new Set(text.match(urlRegex) || [])];
  }

  /**
   * Extract dates
   * @param {string} text - Text to search
   * @returns {Array} Dates
   */
  extractDates(text) {
    const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
    return [...new Set(text.match(dateRegex) || [])];
  }

  /**
   * Extract times
   * @param {string} text - Text to search
   * @returns {Array} Times
   */
  extractTimes(text) {
    const timeRegex = /\b(?:[0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*(?:AM|PM|am|pm)?\b/g;
    return [...new Set(text.match(timeRegex) || [])];
  }

  /**
   * Extract addresses (basic pattern)
   * @param {string} text - Text to search
   * @returns {Array} Addresses
   */
  extractAddresses(text) {
    const addressRegex = /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b/g;
    return [...new Set(text.match(addressRegex) || [])];
  }

  /**
   * Extract names (basic pattern)
   * @param {string} text - Text to search
   * @returns {Array} Names
   */
  extractNames(text) {
    const nameRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    return [...new Set(text.match(nameRegex) || [])];
  }

  /**
   * Detect language of email content
   * @param {Object} emailData - Email data
   * @returns {string} Detected language
   */
  detectLanguage(emailData) {
    const text = `${emailData.subject || ''} ${emailData.body || ''}`;
    
    // Simple language detection based on common words
    const languages = {
      en: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo'],
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour'],
      de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf']
    };

    const words = text.toLowerCase().split(/\s+/);
    const scores = {};

    for (const [lang, commonWords] of Object.entries(languages)) {
      scores[lang] = commonWords.reduce((score, word) => {
        return score + (words.includes(word) ? 1 : 0);
      }, 0);
    }

    const detectedLang = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    return scores[detectedLang] > 0 ? detectedLang : 'en';
  }

  /**
   * Analyze email structure
   * @param {Object} emailData - Email data
   * @returns {Object} Structure analysis
   */
  analyzeStructure(emailData) {
    const body = emailData.body || '';
    
    return {
      hasGreeting: this.hasGreeting(body),
      hasSignature: this.hasSignature(body),
      hasCallToAction: this.hasCallToAction(body),
      hasQuestions: this.hasQuestions(body),
      hasLists: this.hasLists(body),
      hasNumbers: this.hasNumbers(body),
      paragraphCount: body.split(/\n\s*\n/).length,
      sentenceCount: body.split(/[.!?]+/).length,
      averageWordsPerSentence: this.calculateAverageWordsPerSentence(body)
    };
  }

  /**
   * Check if email has greeting
   * @param {string} body - Email body
   * @returns {boolean} Has greeting
   */
  hasGreeting(body) {
    const greetings = ['dear', 'hello', 'hi', 'good morning', 'good afternoon', 'good evening'];
    const firstLine = body.split('\n')[0].toLowerCase();
    return greetings.some(greeting => firstLine.includes(greeting));
  }

  /**
   * Check if email has signature
   * @param {string} body - Email body
   * @returns {boolean} Has signature
   */
  hasSignature(body) {
    const signatureIndicators = ['best regards', 'sincerely', 'thanks', 'thank you', 'yours truly'];
    const lastLines = body.split('\n').slice(-3).join(' ').toLowerCase();
    return signatureIndicators.some(indicator => lastLines.includes(indicator));
  }

  /**
   * Check if email has call to action
   * @param {string} body - Email body
   * @returns {boolean} Has call to action
   */
  hasCallToAction(body) {
    const ctaIndicators = ['please', 'call', 'contact', 'schedule', 'book', 'visit', 'click', 'reply'];
    return ctaIndicators.some(indicator => body.toLowerCase().includes(indicator));
  }

  /**
   * Check if email has questions
   * @param {string} body - Email body
   * @returns {boolean} Has questions
   */
  hasQuestions(body) {
    return /[?]/.test(body);
  }

  /**
   * Check if email has lists
   * @param {string} body - Email body
   * @returns {boolean} Has lists
   */
  hasLists(body) {
    return /^\s*[-*•]\s/.test(body) || /^\s*\d+\.\s/.test(body);
  }

  /**
   * Check if email has numbers
   * @param {string} body - Email body
   * @returns {boolean} Has numbers
   */
  hasNumbers(body) {
    return /\d/.test(body);
  }

  /**
   * Calculate average words per sentence
   * @param {string} body - Email body
   * @returns {number} Average words per sentence
   */
  calculateAverageWordsPerSentence(body) {
    const sentences = body.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length === 0) return 0;
    
    const totalWords = sentences.reduce((total, sentence) => {
      return total + sentence.trim().split(/\s+/).length;
    }, 0);
    
    return totalWords / sentences.length;
  }

  /**
   * Process attachments
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Attachment data
   */
  async processAttachments(parsedData, userId) {
    try {
      return await this.attachmentProcessor.processAttachments(parsedData, userId);
    } catch (error) {
      console.error('Attachment processing failed:', error);
      return {
        attachments: [],
        processingError: error.message
      };
    }
  }

  /**
   * Get basic parsed data as fallback
   * @param {Object} emailData - Email data
   * @returns {Object} Basic parsed data
   */
  getBasicParsedData(emailData) {
    return {
      subject: this.parseSubject(emailData.subject),
      body: this.parseBody(emailData.body),
      htmlBody: this.parseHtmlBody(emailData.htmlBody),
      entities: this.extractEntities(emailData),
      language: 'en',
      structure: this.analyzeStructure(emailData),
      contentAnalysis: {
        sentiment: 'neutral',
        keyPhrases: [],
        intent: 'general'
      }
    };
  }

  /**
   * Update performance metrics
   * @param {string} userId - User ID
   * @param {number} processingTime - Processing time in ms
   * @param {Object} emailData - Email data
   */
  async updatePerformanceMetrics(userId, processingTime, emailData) {
    try {
      const metrics = this.performanceMetrics.get(userId) || {
        totalEmails: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        lastProcessed: null
      };

      metrics.totalEmails++;
      metrics.totalProcessingTime += processingTime;
      metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.totalEmails;
      metrics.lastProcessed = new Date().toISOString();

      this.performanceMetrics.set(userId, metrics);

      // Store in database
      await supabase
        .from('email_processing_metrics')
        .upsert({
          user_id: userId,
          total_emails: metrics.totalEmails,
          total_processing_time: metrics.totalProcessingTime,
          average_processing_time: metrics.averageProcessingTime,
          last_processed: metrics.lastProcessed,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }

  /**
   * Store advanced processing results
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @param {Object} baseResult - Base processing result
   */
  async storeAdvancedProcessingResults(userId, emailData, baseResult) {
    try {
      await supabase
        .from('advanced_email_processing')
        .insert({
          user_id: userId,
          email_id: emailData.id,
          thread_id: emailData.threadInfo?.threadId,
          parsed_data: emailData,
          processing_result: baseResult,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to store advanced processing results:', error);
    }
  }

  /**
   * Log advanced processing error
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @param {Error} error - Error object
   */
  async logAdvancedProcessingError(userId, emailData, error) {
    try {
      await supabase
        .from('email_processing_errors')
        .insert({
          user_id: userId,
          email_id: emailData.id,
          error_type: 'advanced_processing',
          error_message: error.message,
          error_stack: error.stack,
          email_data: emailData,
          created_at: new Date().toISOString()
        });

    } catch (logError) {
      console.error('Failed to log advanced processing error:', logError);
    }
  }

  /**
   * Get processing performance metrics
   * @param {string} userId - User ID
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics(userId) {
    return this.performanceMetrics.get(userId) || {
      totalEmails: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      lastProcessed: null
    };
  }

  /**
   * Clear processing cache
   * @param {string} userId - Optional user ID
   */
  clearCache(userId = null) {
    if (userId) {
      this.processingCache.delete(userId);
    } else {
      this.processingCache.clear();
    }
  }
}

// Export singleton instance
export const advancedEmailProcessor = new AdvancedEmailProcessor();
