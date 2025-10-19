/**
 * Email Validator
 * Validates email content, structure, and processing requirements
 */

export class EmailValidator {
  constructor() {
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.urlRegex = /(https?:\/\/[^\s]+)/g;
    this.phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  }

  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {Object} Validation result
   */
  validateEmailAddress(email) {
    const result = {
      isValid: false,
      errors: [],
      warnings: []
    };

    if (!email) {
      result.errors.push('Email address is required');
      return result;
    }

    if (typeof email !== 'string') {
      result.errors.push('Email address must be a string');
      return result;
    }

    // Check basic format
    if (!this.emailRegex.test(email)) {
      result.errors.push('Invalid email address format');
      return result;
    }

    // Check length
    if (email.length > 254) {
      result.errors.push('Email address too long (max 254 characters)');
      return result;
    }

    // Check for common issues
    if (email.includes('..')) {
      result.warnings.push('Email contains consecutive dots');
    }

    if (email.startsWith('.') || email.endsWith('.')) {
      result.warnings.push('Email starts or ends with dot');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate email content structure
   * @param {Object} emailData - Email data to validate
   * @returns {Object} Validation result
   */
  validateEmailContent(emailData) {
    const result = {
      isValid: false,
      errors: [],
      warnings: [],
      extractedData: {}
    };

    // Required fields
    if (!emailData.from) {
      result.errors.push('From field is required');
    } else {
      const fromValidation = this.validateEmailAddress(emailData.from);
      if (!fromValidation.isValid) {
        result.errors.push(`Invalid from address: ${fromValidation.errors.join(', ')}`);
      }
    }

    if (!emailData.subject && !emailData.body) {
      result.errors.push('Either subject or body is required');
    }

    // Optional but recommended fields
    if (emailData.to) {
      const toValidation = this.validateEmailAddress(emailData.to);
      if (!toValidation.isValid) {
        result.warnings.push(`Invalid to address: ${toValidation.errors.join(', ')}`);
      }
    }

    // Validate subject
    if (emailData.subject) {
      const subjectValidation = this.validateSubject(emailData.subject);
      if (!subjectValidation.isValid) {
        result.warnings.push(`Subject issues: ${subjectValidation.warnings.join(', ')}`);
      }
      result.extractedData.subjectAnalysis = subjectValidation;
    }

    // Validate body
    if (emailData.body) {
      const bodyValidation = this.validateBody(emailData.body);
      result.extractedData.bodyAnalysis = bodyValidation;
      
      if (bodyValidation.warnings.length > 0) {
        result.warnings.push(`Body issues: ${bodyValidation.warnings.join(', ')}`);
      }
    }

    // Check for spam indicators
    const spamIndicators = this.detectSpamIndicators(emailData);
    if (spamIndicators.length > 0) {
      result.warnings.push(`Potential spam indicators: ${spamIndicators.join(', ')}`);
    }

    // Extract metadata
    result.extractedData.metadata = this.extractMetadata(emailData);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate email subject
   * @param {string} subject - Email subject
   * @returns {Object} Validation result
   */
  validateSubject(subject) {
    const result = {
      isValid: true,
      warnings: [],
      length: subject.length,
      hasRePrefix: false,
      hasUrgentKeywords: false,
      hasSpamKeywords: false
    };

    if (subject.length > 998) {
      result.warnings.push('Subject too long (RFC 5322 limit is 998 characters)');
    }

    if (subject.length === 0) {
      result.warnings.push('Empty subject line');
    }

    // Check for Re: prefix
    result.hasRePrefix = /^re:\s*/i.test(subject);

    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'immediately', 'critical'];
    result.hasUrgentKeywords = urgentKeywords.some(keyword => 
      subject.toLowerCase().includes(keyword)
    );

    // Check for spam keywords
    const spamKeywords = ['free', 'win', 'click here', 'limited time', 'act now'];
    result.hasSpamKeywords = spamKeywords.some(keyword => 
      subject.toLowerCase().includes(keyword)
    );

    return result;
  }

  /**
   * Validate email body
   * @param {string} body - Email body
   * @returns {Object} Validation result
   */
  validateBody(body) {
    const result = {
      isValid: true,
      warnings: [],
      length: body.length,
      hasUrls: false,
      hasPhoneNumbers: false,
      hasAttachments: false,
      isHtml: false,
      sentiment: 'neutral'
    };

    if (body.length === 0) {
      result.warnings.push('Empty email body');
    }

    // Check for URLs
    result.hasUrls = this.urlRegex.test(body);

    // Check for phone numbers
    result.hasPhoneNumbers = this.phoneRegex.test(body);

    // Check for HTML
    result.isHtml = /<[^>]+>/i.test(body);

    // Check for attachment references
    result.hasAttachments = /attach|enclos/i.test(body);

    // Basic sentiment analysis
    result.sentiment = this.analyzeSentiment(body);

    return result;
  }

  /**
   * Detect spam indicators
   * @param {Object} emailData - Email data
   * @returns {Array} List of spam indicators
   */
  detectSpamIndicators(emailData) {
    const indicators = [];

    // Check subject
    if (emailData.subject) {
      const subject = emailData.subject.toLowerCase();
      
      if (subject.includes('!!!') || subject.includes('???')) {
        indicators.push('Excessive punctuation in subject');
      }

      if (subject.length > 50 && /[A-Z]{5,}/.test(subject)) {
        indicators.push('Excessive capitalization in subject');
      }
    }

    // Check body
    if (emailData.body) {
      const body = emailData.body.toLowerCase();
      
      if (body.includes('click here') || body.includes('click below')) {
        indicators.push('Suspicious click prompts');
      }

      if (body.includes('limited time') || body.includes('act now')) {
        indicators.push('Pressure tactics');
      }

      if (body.includes('congratulations') && body.includes('winner')) {
        indicators.push('Fake congratulations');
      }
    }

    // Check sender
    if (emailData.from) {
      const from = emailData.from.toLowerCase();
      
      if (from.includes('noreply') || from.includes('no-reply')) {
        indicators.push('No-reply sender');
      }

      if (from.includes('notification') || from.includes('alert')) {
        indicators.push('Automated sender');
      }
    }

    return indicators;
  }

  /**
   * Extract metadata from email
   * @param {Object} emailData - Email data
   * @returns {Object} Extracted metadata
   */
  extractMetadata(emailData) {
    const metadata = {
      hasSignature: false,
      hasGreeting: false,
      hasClosing: false,
      language: 'en',
      wordCount: 0,
      sentenceCount: 0,
      paragraphs: 0
    };

    if (emailData.body) {
      const body = emailData.body;

      // Check for signature
      metadata.hasSignature = /(--|best regards|sincerely|thanks)/i.test(body);

      // Check for greeting
      metadata.hasGreeting = /(dear|hello|hi|greetings)/i.test(body);

      // Check for closing
      metadata.hasClosing = /(best regards|sincerely|thanks|regards)/i.test(body);

      // Count words
      metadata.wordCount = body.split(/\s+/).filter(word => word.length > 0).length;

      // Count sentences
      metadata.sentenceCount = body.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;

      // Count paragraphs
      metadata.paragraphs = body.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
    }

    return metadata;
  }

  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze
   * @returns {string} Sentiment (positive, negative, neutral)
   */
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'disappointed'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Validate email for processing
   * @param {Object} emailData - Email data
   * @returns {Object} Processing validation result
   */
  validateForProcessing(emailData) {
    const result = {
      canProcess: false,
      errors: [],
      warnings: [],
      recommendations: [],
      priority: 'normal'
    };

    // Basic validation
    const contentValidation = this.validateEmailContent(emailData);
    
    if (!contentValidation.isValid) {
      result.errors = contentValidation.errors;
      return result;
    }

    // Check processing requirements
    if (!emailData.messageId) {
      result.warnings.push('Missing message ID - may affect tracking');
    }

    if (!emailData.timestamp) {
      result.warnings.push('Missing timestamp - using current time');
    }

    // Determine priority based on content
    result.priority = this.determinePriority(emailData, contentValidation.extractedData);

    // Generate recommendations
    result.recommendations = this.generateRecommendations(emailData, contentValidation.extractedData);

    result.canProcess = result.errors.length === 0;
    result.warnings = [...result.warnings, ...contentValidation.warnings];

    return result;
  }

  /**
   * Determine email priority
   * @param {Object} emailData - Email data
   * @param {Object} extractedData - Extracted data
   * @returns {string} Priority level
   */
  determinePriority(emailData, extractedData) {
    let priority = 'normal';

    // Check for urgent indicators
    if (extractedData.subjectAnalysis?.hasUrgentKeywords) {
      priority = 'high';
    }

    if (extractedData.bodyAnalysis?.sentiment === 'negative') {
      priority = 'high';
    }

    // Check for escalation keywords
    const escalationKeywords = ['complaint', 'refund', 'cancel', 'dispute'];
    const bodyText = (emailData.body || '').toLowerCase();
    const subjectText = (emailData.subject || '').toLowerCase();
    
    if (escalationKeywords.some(keyword => 
      bodyText.includes(keyword) || subjectText.includes(keyword)
    )) {
      priority = 'urgent';
    }

    return priority;
  }

  /**
   * Generate processing recommendations
   * @param {Object} emailData - Email data
   * @param {Object} extractedData - Extracted data
   * @returns {Array} Recommendations
   */
  generateRecommendations(emailData, extractedData) {
    const recommendations = [];

    if (extractedData.subjectAnalysis?.hasUrgentKeywords) {
      recommendations.push('Consider immediate response due to urgent keywords');
    }

    if (extractedData.bodyAnalysis?.sentiment === 'negative') {
      recommendations.push('Negative sentiment detected - consider escalation');
    }

    if (extractedData.bodyAnalysis?.hasUrls) {
      recommendations.push('Contains URLs - verify safety before clicking');
    }

    if (extractedData.bodyAnalysis?.hasPhoneNumbers) {
      recommendations.push('Contains phone numbers - consider calling customer');
    }

    if (extractedData.metadata?.hasSignature) {
      recommendations.push('Professional email with signature');
    }

    return recommendations;
  }

  /**
   * Validate batch of emails
   * @param {Array} emails - Array of email data
   * @returns {Object} Batch validation result
   */
  validateBatch(emails) {
    const result = {
      totalEmails: emails.length,
      validEmails: 0,
      invalidEmails: 0,
      warnings: 0,
      results: [],
      summary: {}
    };

    emails.forEach((email, index) => {
      const validation = this.validateForProcessing(email);
      result.results.push({
        index,
        emailId: email.id || `email_${index}`,
        ...validation
      });

      if (validation.canProcess) {
        result.validEmails++;
      } else {
        result.invalidEmails++;
      }

      result.warnings += validation.warnings.length;
    });

    // Generate summary
    result.summary = {
      successRate: result.totalEmails > 0 ? (result.validEmails / result.totalEmails) * 100 : 0,
      averageWarnings: result.totalEmails > 0 ? result.warnings / result.totalEmails : 0,
      priorityDistribution: this.calculatePriorityDistribution(result.results)
    };

    return result;
  }

  /**
   * Calculate priority distribution
   * @param {Array} results - Validation results
   * @returns {Object} Priority distribution
   */
  calculatePriorityDistribution(results) {
    const distribution = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0
    };

    results.forEach(result => {
      if (result.canProcess) {
        distribution[result.priority] = (distribution[result.priority] || 0) + 1;
      }
    });

    return distribution;
  }
}

// Export singleton instance
export const emailValidator = new EmailValidator();
