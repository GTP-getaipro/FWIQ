import OpenAI from 'openai';

export class EmailClassifier {
  constructor() {
    // Use environment variable for OpenAI API key (standardized to VITE_OPENAI_API_KEY)
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                   import.meta.env.OPENAI_API_KEY ||
                   process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey.includes('your-openai-api-key') || apiKey === 'test-openai-key') {
      console.warn('OpenAI API key not found. Email classification will use rule-based approach.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true 
      });
      console.log('OpenAI client initialized for email classification');
    }

    // Rule-based classification patterns
    this.patterns = {
      urgent: [
        'urgent', 'emergency', 'asap', 'immediately', 'critical', 'help',
        'broken', 'not working', 'stopped', 'failed', 'problem', 'issue'
      ],
      appointment: [
        'schedule', 'appointment', 'book', 'available', 'when', 'time',
        'visit', 'come out', 'service call', 'estimate', 'quote'
      ],
      complaint: [
        'complaint', 'unhappy', 'dissatisfied', 'poor', 'bad', 'terrible',
        'disappointed', 'refund', 'cancel', 'wrong', 'mistake'
      ],
      inquiry: [
        'question', 'information', 'how', 'what', 'when', 'where', 'why',
        'cost', 'price', 'service', 'help', 'advice'
      ],
      followup: [
        'follow up', 'following up', 'check', 'status', 'update',
        'completed', 'finished', 'done', 'how did', 'satisfied'
      ]
    };
  }

  async classify(emailData) {
    try {
      // Try AI classification first if available
      if (this.openai) {
        const aiClassification = await this.classifyWithAI(emailData);
        if (aiClassification) {
          return aiClassification;
        }
      }

      // Fallback to rule-based classification
      return this.classifyWithRules(emailData);

    } catch (error) {
      console.error('Email classification failed:', error);
      // Return default classification on error
      return this.getDefaultClassification(emailData);
    }
  }

  async classifyWithAI(emailData) {
    if (!this.openai) return null;

    try {
      const emailContent = `Subject: ${emailData.subject || 'No subject'}
From: ${emailData.from || 'Unknown sender'}
Body: ${(emailData.body || '').substring(0, 1000)}`;

      const prompt = `Classify this business email into one of these categories and determine urgency:

${emailContent}

Analyze and return JSON with:
{
  "category": "urgent|appointment|complaint|inquiry|followup|general",
  "urgency": "low|normal|high|critical",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "keywords": ["key", "words", "found"],
  "sentiment": "positive|neutral|negative",
  "requires_response": true/false,
  "estimated_response_time": "immediate|same_day|24_hours|48_hours"
}

Return only valid JSON.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300
      });

      const classification = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      classification.method = 'ai';
      classification.timestamp = new Date().toISOString();
      
      return classification;

    } catch (error) {
      console.error('AI classification failed:', error);
      return null;
    }
  }

  classifyWithRules(emailData) {
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;

    const scores = {};
    let maxScore = 0;
    let primaryCategory = 'general';

    // Calculate scores for each category
    Object.keys(this.patterns).forEach(category => {
      scores[category] = 0;
      
      this.patterns[category].forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          scores[category] += matches.length;
        }
      });

      if (scores[category] > maxScore) {
        maxScore = scores[category];
        primaryCategory = category;
      }
    });

    // Determine urgency
    const urgency = this.determineUrgency(content, primaryCategory);
    
    // Determine sentiment
    const sentiment = this.determineSentiment(content);

    // Extract keywords
    const keywords = this.extractKeywords(content);

    return {
      category: primaryCategory,
      urgency: urgency,
      confidence: Math.min(maxScore * 20, 100), // Convert to percentage
      reasoning: `Rule-based classification found ${maxScore} matching patterns for ${primaryCategory}`,
      keywords: keywords,
      sentiment: sentiment,
      requires_response: this.requiresResponse(primaryCategory, urgency),
      estimated_response_time: this.estimateResponseTime(primaryCategory, urgency),
      method: 'rules',
      timestamp: new Date().toISOString(),
      scores: scores
    };
  }

  determineUrgency(content, category) {
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'broken', 'not working', 'stopped'];
    const urgentCount = urgentWords.reduce((count, word) => {
      return count + (content.includes(word) ? 1 : 0);
    }, 0);

    if (urgentCount >= 2 || category === 'urgent') return 'critical';
    if (urgentCount === 1) return 'high';
    if (category === 'complaint') return 'high';
    if (category === 'appointment') return 'normal';
    return 'normal';
  }

  determineSentiment(content) {
    const positiveWords = ['thank', 'great', 'excellent', 'good', 'happy', 'satisfied', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'poor', 'disappointed', 'unhappy', 'frustrated'];

    const positiveCount = positiveWords.reduce((count, word) => 
      count + (content.includes(word) ? 1 : 0), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (content.includes(word) ? 1 : 0), 0);

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  extractKeywords(content) {
    const words = content.split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    const wordCount = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  requiresResponse(category, urgency) {
    if (urgency === 'critical' || urgency === 'high') return true;
    if (category === 'complaint' || category === 'inquiry' || category === 'appointment') return true;
    return false;
  }

  estimateResponseTime(category, urgency) {
    if (urgency === 'critical') return 'immediate';
    if (urgency === 'high') return 'same_day';
    if (category === 'appointment' || category === 'inquiry') return '24_hours';
    return '48_hours';
  }

  getDefaultClassification(emailData) {
    return {
      category: 'general',
      urgency: 'normal',
      confidence: 25,
      reasoning: 'Default classification due to processing error',
      keywords: [],
      sentiment: 'neutral',
      requires_response: true,
      estimated_response_time: '24_hours',
      method: 'default',
      timestamp: new Date().toISOString()
    };
  }

  // Batch classification for multiple emails
  async classifyBatch(emails) {
    const classifications = [];
    
    for (const email of emails) {
      try {
        const classification = await this.classify(email);
        classifications.push({
          emailId: email.id,
          classification
        });
      } catch (error) {
        console.error(`Failed to classify email ${email.id}:`, error);
        classifications.push({
          emailId: email.id,
          classification: this.getDefaultClassification(email),
          error: error.message
        });
      }
    }

    return classifications;
  }

  // Get classification statistics
  getClassificationStats(classifications) {
    const stats = {
      total: classifications.length,
      categories: {},
      urgency: {},
      sentiment: {},
      requiresResponse: 0,
      averageConfidence: 0
    };

    let totalConfidence = 0;

    classifications.forEach(({ classification }) => {
      // Count categories
      stats.categories[classification.category] = (stats.categories[classification.category] || 0) + 1;
      
      // Count urgency levels
      stats.urgency[classification.urgency] = (stats.urgency[classification.urgency] || 0) + 1;
      
      // Count sentiment
      stats.sentiment[classification.sentiment] = (stats.sentiment[classification.sentiment] || 0) + 1;
      
      // Count responses required
      if (classification.requires_response) {
        stats.requiresResponse++;
      }
      
      // Sum confidence for average
      totalConfidence += classification.confidence;
    });

    stats.averageConfidence = classifications.length > 0 ? totalConfidence / classifications.length : 0;

    return stats;
  }
}
