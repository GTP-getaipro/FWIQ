/**
 * Email Content Analyzer
 * 
 * Provides advanced content analysis including sentiment analysis,
 * key phrase extraction, intent detection, and content categorization.
 */

import { supabase } from './customSupabaseClient';

export class EmailContentAnalyzer {
  constructor() {
    this.sentimentPatterns = {
      positive: [
        'thank', 'thanks', 'appreciate', 'great', 'excellent', 'wonderful',
        'amazing', 'fantastic', 'perfect', 'love', 'happy', 'pleased',
        'satisfied', 'delighted', 'impressed', 'outstanding', 'brilliant'
      ],
      negative: [
        'problem', 'issue', 'error', 'wrong', 'bad', 'terrible', 'awful',
        'disappointed', 'frustrated', 'angry', 'upset', 'complaint',
        'unhappy', 'dissatisfied', 'poor', 'horrible', 'worst', 'hate'
      ],
      neutral: [
        'information', 'question', 'inquiry', 'request', 'schedule',
        'appointment', 'meeting', 'follow', 'update', 'status', 'check'
      ]
    };

    this.intentPatterns = {
      inquiry: [
        'question', 'ask', 'wonder', 'curious', 'information', 'details',
        'how', 'what', 'when', 'where', 'why', 'who', 'which'
      ],
      request: [
        'please', 'request', 'need', 'want', 'require', 'would like',
        'could you', 'can you', 'help', 'assistance', 'support'
      ],
      complaint: [
        'complaint', 'problem', 'issue', 'concern', 'unhappy', 'dissatisfied',
        'wrong', 'mistake', 'error', 'not working', 'broken', 'failed'
      ],
      appointment: [
        'schedule', 'appointment', 'book', 'reserve', 'meeting', 'visit',
        'available', 'time', 'date', 'when', 'calendar', 'agenda'
      ],
      followup: [
        'follow up', 'following up', 'check', 'status', 'update', 'progress',
        'completed', 'finished', 'done', 'result', 'outcome'
      ],
      urgent: [
        'urgent', 'emergency', 'asap', 'immediately', 'critical', 'important',
        'rush', 'priority', 'quickly', 'soon', 'now'
      ]
    };

    this.categoryPatterns = {
      sales: [
        'quote', 'price', 'cost', 'estimate', 'pricing', 'buy', 'purchase',
        'order', 'product', 'service', 'business', 'proposal'
      ],
      support: [
        'help', 'support', 'assistance', 'problem', 'issue', 'fix', 'repair',
        'broken', 'not working', 'error', 'troubleshoot'
      ],
      billing: [
        'invoice', 'payment', 'bill', 'charge', 'fee', 'cost', 'money',
        'account', 'balance', 'refund', 'credit'
      ],
      general: [
        'information', 'question', 'inquiry', 'general', 'hello', 'hi',
        'contact', 'reach out', 'connect'
      ]
    };

    this.keyPhrasePatterns = [
      /\b(?:urgent|emergency|asap|immediately)\b/gi,
      /\b(?:thank you|thanks|appreciate)\b/gi,
      /\b(?:please|could you|can you)\b/gi,
      /\b(?:schedule|appointment|meeting)\b/gi,
      /\b(?:problem|issue|concern)\b/gi,
      /\b(?:quote|estimate|price)\b/gi,
      /\b(?:follow up|following up)\b/gi,
      /\b(?:available|time|date)\b/gi
    ];
  }

  /**
   * Analyze email content comprehensively
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(emailData) {
    try {
      const text = this.combineEmailText(emailData);
      
      const analysis = {
        sentiment: this.analyzeSentiment(text),
        intent: this.detectIntent(text),
        category: this.categorizeContent(text),
        keyPhrases: this.extractKeyPhrases(text),
        urgency: this.detectUrgency(text),
        complexity: this.analyzeComplexity(text),
        readability: this.analyzeReadability(text),
        tone: this.analyzeTone(text),
        language: this.detectLanguage(text),
        entities: this.extractAdvancedEntities(text),
        topics: this.extractTopics(text),
        confidence: 0
      };

      // Calculate overall confidence
      analysis.confidence = this.calculateConfidence(analysis);

      // Store analysis in cache
      this.cacheAnalysis(emailData.id, analysis);

      return analysis;

    } catch (error) {
      console.error('Content analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Combine email text for analysis
   * @param {Object} emailData - Email data
   * @returns {string} Combined text
   */
  combineEmailText(emailData) {
    const parts = [
      emailData.subject || '',
      emailData.body || '',
      emailData.htmlBody ? this.htmlToText(emailData.htmlBody) : ''
    ];

    return parts.join(' ').trim();
  }

  /**
   * Convert HTML to text for analysis
   * @param {string} html - HTML content
   * @returns {string} Text content
   */
  htmlToText(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Analyze sentiment of email content
   * @param {string} text - Text to analyze
   * @returns {Object} Sentiment analysis
   */
  analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    // Count sentiment indicators
    words.forEach(word => {
      if (this.sentimentPatterns.positive.includes(word)) {
        positiveScore++;
      } else if (this.sentimentPatterns.negative.includes(word)) {
        negativeScore++;
      } else if (this.sentimentPatterns.neutral.includes(word)) {
        neutralScore++;
      }
    });

    // Determine primary sentiment
    let primarySentiment = 'neutral';
    let confidence = 0;

    if (positiveScore > negativeScore && positiveScore > neutralScore) {
      primarySentiment = 'positive';
      confidence = positiveScore / (positiveScore + negativeScore + neutralScore);
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
      primarySentiment = 'negative';
      confidence = negativeScore / (positiveScore + negativeScore + neutralScore);
    } else {
      primarySentiment = 'neutral';
      confidence = neutralScore / (positiveScore + negativeScore + neutralScore);
    }

    return {
      primary: primarySentiment,
      confidence: Math.round(confidence * 100),
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        neutral: neutralScore
      }
    };
  }

  /**
   * Detect intent of email
   * @param {string} text - Text to analyze
   * @returns {Object} Intent analysis
   */
  detectIntent(text) {
    const words = text.toLowerCase().split(/\s+/);
    const intentScores = {};

    // Initialize scores
    Object.keys(this.intentPatterns).forEach(intent => {
      intentScores[intent] = 0;
    });

    // Count intent indicators
    words.forEach(word => {
      Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
        if (patterns.includes(word)) {
          intentScores[intent]++;
        }
      });
    });

    // Find primary intent
    const primaryIntent = Object.keys(intentScores).reduce((a, b) => 
      intentScores[a] > intentScores[b] ? a : b
    );

    const totalScore = Object.values(intentScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? intentScores[primaryIntent] / totalScore : 0;

    return {
      primary: primaryIntent,
      confidence: Math.round(confidence * 100),
      scores: intentScores
    };
  }

  /**
   * Categorize email content
   * @param {string} text - Text to analyze
   * @returns {Object} Category analysis
   */
  categorizeContent(text) {
    const words = text.toLowerCase().split(/\s+/);
    const categoryScores = {};

    // Initialize scores
    Object.keys(this.categoryPatterns).forEach(category => {
      categoryScores[category] = 0;
    });

    // Count category indicators
    words.forEach(word => {
      Object.entries(this.categoryPatterns).forEach(([category, patterns]) => {
        if (patterns.includes(word)) {
          categoryScores[category]++;
        }
      });
    });

    // Find primary category
    const primaryCategory = Object.keys(categoryScores).reduce((a, b) => 
      categoryScores[a] > categoryScores[b] ? a : b
    );

    const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? categoryScores[primaryCategory] / totalScore : 0;

    return {
      primary: primaryCategory,
      confidence: Math.round(confidence * 100),
      scores: categoryScores
    };
  }

  /**
   * Extract key phrases from text
   * @param {string} text - Text to analyze
   * @returns {Array} Key phrases
   */
  extractKeyPhrases(text) {
    const phrases = [];

    this.keyPhrasePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.map(match => match.toLowerCase().trim()));
      }
    });

    // Remove duplicates and sort by frequency
    const phraseCounts = {};
    phrases.forEach(phrase => {
      phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
    });

    return Object.entries(phraseCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([phrase, count]) => ({ phrase, count }));
  }

  /**
   * Detect urgency level
   * @param {string} text - Text to analyze
   * @returns {Object} Urgency analysis
   */
  detectUrgency(text) {
    const urgentWords = [
      'urgent', 'emergency', 'asap', 'immediately', 'critical', 'important',
      'rush', 'priority', 'quickly', 'soon', 'now', 'right away'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const urgentCount = words.filter(word => urgentWords.includes(word)).length;

    let urgencyLevel = 'normal';
    let confidence = 0;

    if (urgentCount > 0) {
      urgencyLevel = urgentCount >= 2 ? 'high' : 'medium';
      confidence = Math.min(urgentCount * 25, 100);
    }

    return {
      level: urgencyLevel,
      confidence,
      urgentWordsFound: urgentCount
    };
  }

  /**
   * Analyze content complexity
   * @param {string} text - Text to analyze
   * @returns {Object} Complexity analysis
   */
  analyzeComplexity(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgSentencesPerParagraph = paragraphs.length > 0 ? sentences.length / paragraphs.length : 0;

    // Calculate complexity score (0-100)
    let complexityScore = 0;
    
    // Word count factor
    if (words.length > 200) complexityScore += 20;
    else if (words.length > 100) complexityScore += 10;
    
    // Sentence length factor
    if (avgWordsPerSentence > 20) complexityScore += 30;
    else if (avgWordsPerSentence > 15) complexityScore += 20;
    else if (avgWordsPerSentence > 10) complexityScore += 10;
    
    // Paragraph count factor
    if (paragraphs.length > 5) complexityScore += 20;
    else if (paragraphs.length > 3) complexityScore += 10;
    
    // Technical terms factor
    const technicalTerms = this.countTechnicalTerms(text);
    complexityScore += Math.min(technicalTerms * 5, 30);

    const complexityLevel = complexityScore >= 70 ? 'high' : 
                           complexityScore >= 40 ? 'medium' : 'low';

    return {
      level: complexityLevel,
      score: Math.min(complexityScore, 100),
      metrics: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
        avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 100) / 100,
        technicalTerms: technicalTerms
      }
    };
  }

  /**
   * Count technical terms in text
   * @param {string} text - Text to analyze
   * @returns {number} Technical term count
   */
  countTechnicalTerms(text) {
    const technicalTerms = [
      'api', 'database', 'server', 'client', 'protocol', 'algorithm',
      'configuration', 'implementation', 'integration', 'authentication',
      'authorization', 'encryption', 'decryption', 'framework', 'library'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => technicalTerms.includes(word)).length;
  }

  /**
   * Analyze readability of text
   * @param {string} text - Text to analyze
   * @returns {Object} Readability analysis
   */
  analyzeReadability(text) {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const syllables = this.countSyllables(text);

    if (sentences.length === 0) {
      return {
        score: 0,
        level: 'unknown',
        metrics: {
          avgWordsPerSentence: 0,
          avgSyllablesPerWord: 0,
          totalSyllables: 0
        }
      };
    }

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Simple Flesch Reading Ease approximation
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    let level = 'difficult';
    if (score >= 80) level = 'easy';
    else if (score >= 60) level = 'fairly easy';
    else if (score >= 50) level = 'standard';
    else if (score >= 30) level = 'fairly difficult';

    return {
      score: Math.round(Math.max(0, Math.min(100, score))),
      level,
      metrics: {
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
        avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
        totalSyllables: syllables
      }
    };
  }

  /**
   * Count syllables in text
   * @param {string} text - Text to analyze
   * @returns {number} Syllable count
   */
  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    words.forEach(word => {
      // Remove punctuation
      word = word.replace(/[^a-z]/g, '');
      
      if (word.length === 0) return;

      // Simple syllable counting algorithm
      let syllables = 0;
      let previousWasVowel = false;

      for (let i = 0; i < word.length; i++) {
        const isVowel = /[aeiouy]/.test(word[i]);
        
        if (isVowel && !previousWasVowel) {
          syllables++;
        }
        
        previousWasVowel = isVowel;
      }

      // Handle silent 'e'
      if (word.endsWith('e') && syllables > 1) {
        syllables--;
      }

      // Every word has at least one syllable
      if (syllables === 0) {
        syllables = 1;
      }

      totalSyllables += syllables;
    });

    return totalSyllables;
  }

  /**
   * Analyze tone of email
   * @param {string} text - Text to analyze
   * @returns {Object} Tone analysis
   */
  analyzeTone(text) {
    const toneIndicators = {
      formal: ['sir', 'madam', 'dear', 'sincerely', 'respectfully', 'regards'],
      informal: ['hi', 'hey', 'thanks', 'cheers', 'best', 'talk soon'],
      professional: ['please', 'thank you', 'appreciate', 'regarding', 'concerning'],
      friendly: ['hope', 'wish', 'glad', 'happy', 'pleased', 'delighted'],
      urgent: ['urgent', 'asap', 'immediately', 'critical', 'important'],
      apologetic: ['sorry', 'apologize', 'regret', 'unfortunately', 'mistake']
    };

    const words = text.toLowerCase().split(/\s+/);
    const toneScores = {};

    // Initialize scores
    Object.keys(toneIndicators).forEach(tone => {
      toneScores[tone] = 0;
    });

    // Count tone indicators
    words.forEach(word => {
      Object.entries(toneIndicators).forEach(([tone, indicators]) => {
        if (indicators.includes(word)) {
          toneScores[tone]++;
        }
      });
    });

    // Find primary tone
    const primaryTone = Object.keys(toneScores).reduce((a, b) => 
      toneScores[a] > toneScores[b] ? a : b
    );

    const totalScore = Object.values(toneScores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? toneScores[primaryTone] / totalScore : 0;

    return {
      primary: primaryTone,
      confidence: Math.round(confidence * 100),
      scores: toneScores
    };
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {string} Detected language
   */
  detectLanguage(text) {
    const languagePatterns = {
      en: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo'],
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour'],
      de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf']
    };

    const words = text.toLowerCase().split(/\s+/);
    const scores = {};

    for (const [lang, commonWords] of Object.entries(languagePatterns)) {
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
   * Extract advanced entities from text
   * @param {string} text - Text to analyze
   * @returns {Object} Extracted entities
   */
  extractAdvancedEntities(text) {
    return {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      urls: this.extractUrls(text),
      dates: this.extractDates(text),
      times: this.extractTimes(text),
      addresses: this.extractAddresses(text),
      names: this.extractNames(text),
      numbers: this.extractNumbers(text),
      currencies: this.extractCurrencies(text)
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
   * Extract addresses
   * @param {string} text - Text to search
   * @returns {Array} Addresses
   */
  extractAddresses(text) {
    const addressRegex = /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)\b/g;
    return [...new Set(text.match(addressRegex) || [])];
  }

  /**
   * Extract names
   * @param {string} text - Text to search
   * @returns {Array} Names
   */
  extractNames(text) {
    const nameRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    return [...new Set(text.match(nameRegex) || [])];
  }

  /**
   * Extract numbers
   * @param {string} text - Text to search
   * @returns {Array} Numbers
   */
  extractNumbers(text) {
    const numberRegex = /\b\d+(?:\.\d+)?\b/g;
    return [...new Set(text.match(numberRegex) || [])];
  }

  /**
   * Extract currencies
   * @param {string} text - Text to search
   * @returns {Array} Currencies
   */
  extractCurrencies(text) {
    const currencyRegex = /\$[\d,]+(?:\.\d{2})?|\b\d+(?:\.\d{2})?\s*(?:dollars?|USD|EUR|GBP)\b/gi;
    return [...new Set(text.match(currencyRegex) || [])];
  }

  /**
   * Extract topics from text
   * @param {string} text - Text to analyze
   * @returns {Array} Topics
   */
  extractTopics(text) {
    const topicKeywords = {
      'business': ['business', 'company', 'corporate', 'enterprise', 'organization'],
      'technology': ['technology', 'tech', 'software', 'hardware', 'digital', 'computer'],
      'finance': ['finance', 'financial', 'money', 'budget', 'cost', 'price', 'payment'],
      'healthcare': ['health', 'medical', 'doctor', 'patient', 'treatment', 'medicine'],
      'education': ['education', 'school', 'university', 'student', 'teacher', 'learning'],
      'travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'booking'],
      'food': ['food', 'restaurant', 'meal', 'cooking', 'recipe', 'dining'],
      'sports': ['sports', 'game', 'team', 'player', 'match', 'competition']
    };

    const words = text.toLowerCase().split(/\s+/);
    const topicScores = {};

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      topicScores[topic] = keywords.reduce((score, keyword) => {
        return score + (words.includes(keyword) ? 1 : 0);
      }, 0);
    });

    return Object.entries(topicScores)
      .filter(([, score]) => score > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, score]) => ({ topic, score }));
  }

  /**
   * Calculate overall confidence score
   * @param {Object} analysis - Analysis result
   * @returns {number} Confidence score
   */
  calculateConfidence(analysis) {
    const scores = [
      analysis.sentiment.confidence,
      analysis.intent.confidence,
      analysis.category.confidence,
      analysis.urgency.confidence,
      analysis.tone.confidence
    ];

    const validScores = scores.filter(score => score > 0);
    return validScores.length > 0 ? 
      Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;
  }

  /**
   * Cache analysis result
   * @param {string} emailId - Email ID
   * @param {Object} analysis - Analysis result
   */
  cacheAnalysis(emailId, analysis) {
    // In a real implementation, you might want to use a proper cache
    // For now, we'll just store it in memory
    this.analysisCache = this.analysisCache || new Map();
    this.analysisCache.set(emailId, {
      ...analysis,
      cachedAt: new Date().toISOString()
    });
  }

  /**
   * Get cached analysis
   * @param {string} emailId - Email ID
   * @returns {Object|null} Cached analysis
   */
  getCachedAnalysis(emailId) {
    if (!this.analysisCache) return null;
    return this.analysisCache.get(emailId) || null;
  }

  /**
   * Get default analysis result
   * @returns {Object} Default analysis
   */
  getDefaultAnalysis() {
    return {
      sentiment: { primary: 'neutral', confidence: 0, scores: { positive: 0, negative: 0, neutral: 0 } },
      intent: { primary: 'general', confidence: 0, scores: {} },
      category: { primary: 'general', confidence: 0, scores: {} },
      keyPhrases: [],
      urgency: { level: 'normal', confidence: 0, urgentWordsFound: 0 },
      complexity: { level: 'low', score: 0, metrics: {} },
      readability: { score: 0, level: 'unknown', metrics: {} },
      tone: { primary: 'neutral', confidence: 0, scores: {} },
      language: 'en',
      entities: {},
      topics: [],
      confidence: 0
    };
  }
}

// Export singleton instance
export const emailContentAnalyzer = new EmailContentAnalyzer();
