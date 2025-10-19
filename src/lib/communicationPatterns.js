// Communication pattern analysis utilities
import { supabase } from '@/lib/customSupabaseClient';

export class CommunicationPatternAnalyzer {
  constructor() {
    this.patterns = {
      greetings: [
        'Hello', 'Hi', 'Good morning', 'Good afternoon', 'Dear',
        'Hey', 'Greetings', 'Hope you are well'
      ],
      closings: [
        'Best regards', 'Sincerely', 'Thank you', 'Thanks',
        'Best', 'Regards', 'Cheers', 'Have a great day'
      ],
      urgencyIndicators: [
        'urgent', 'asap', 'immediately', 'priority', 'critical',
        'emergency', 'time sensitive', 'deadline'
      ],
      courtesyPhrases: [
        'please', 'thank you', 'appreciate', 'grateful',
        'sorry', 'apologize', 'excuse me', 'pardon'
      ]
    };
  }

  analyzeEmailPatterns(emails) {
    const patterns = {
      greetingFrequency: {},
      closingFrequency: {},
      responseTime: [],
      emailLength: [],
      urgencyUsage: 0,
      courtesyLevel: 0,
      totalEmails: emails.length
    };

    emails.forEach(email => {
      const body = (email.body || '').toLowerCase();
      const subject = (email.subject || '').toLowerCase();
      
      // Analyze greetings
      this.patterns.greetings.forEach(greeting => {
        if (body.includes(greeting.toLowerCase())) {
          patterns.greetingFrequency[greeting] = (patterns.greetingFrequency[greeting] || 0) + 1;
        }
      });

      // Analyze closings
      this.patterns.closings.forEach(closing => {
        if (body.includes(closing.toLowerCase())) {
          patterns.closingFrequency[closing] = (patterns.closingFrequency[closing] || 0) + 1;
        }
      });

      // Analyze urgency indicators
      this.patterns.urgencyIndicators.forEach(indicator => {
        if (body.includes(indicator) || subject.includes(indicator)) {
          patterns.urgencyUsage++;
        }
      });

      // Analyze courtesy level
      this.patterns.courtesyPhrases.forEach(phrase => {
        if (body.includes(phrase)) {
          patterns.courtesyLevel++;
        }
      });

      // Track email length
      patterns.emailLength.push(body.length);
    });

    return this.calculatePatternMetrics(patterns);
  }

  calculatePatternMetrics(patterns) {
    const avgEmailLength = patterns.emailLength.length > 0 
      ? patterns.emailLength.reduce((a, b) => a + b, 0) / patterns.emailLength.length 
      : 0;

    const mostUsedGreeting = Object.keys(patterns.greetingFrequency).reduce((a, b) => 
      patterns.greetingFrequency[a] > patterns.greetingFrequency[b] ? a : b, 'Hello');

    const mostUsedClosing = Object.keys(patterns.closingFrequency).reduce((a, b) => 
      patterns.closingFrequency[a] > patterns.closingFrequency[b] ? a : b, 'Best regards');

    return {
      preferredGreeting: mostUsedGreeting,
      preferredClosing: mostUsedClosing,
      averageEmailLength: Math.round(avgEmailLength),
      urgencyFrequency: patterns.urgencyUsage / patterns.totalEmails,
      courtesyScore: patterns.courtesyLevel / patterns.totalEmails,
      communicationStyle: this.determineCommunicationStyle(patterns, avgEmailLength),
      greetingVariety: Object.keys(patterns.greetingFrequency).length,
      closingVariety: Object.keys(patterns.closingFrequency).length
    };
  }

  determineCommunicationStyle(patterns, avgLength) {
    let style = 'professional';
    
    // Determine formality based on patterns
    const formalGreetings = ['Dear', 'Good morning', 'Good afternoon'];
    const casualGreetings = ['Hi', 'Hey', 'Hello'];
    
    const formalCount = formalGreetings.reduce((count, greeting) => 
      count + (patterns.greetingFrequency[greeting] || 0), 0);
    const casualCount = casualGreetings.reduce((count, greeting) => 
      count + (patterns.greetingFrequency[greeting] || 0), 0);

    if (formalCount > casualCount) {
      style = avgLength > 500 ? 'formal-detailed' : 'formal-concise';
    } else if (casualCount > formalCount) {
      style = avgLength > 500 ? 'casual-detailed' : 'casual-concise';
    } else {
      style = avgLength > 500 ? 'professional-detailed' : 'professional-concise';
    }

    return style;
  }

  async saveEmailAnalysis(userId, emailId, analysisData) {
    try {
      const { error } = await supabase
        .from('email_analysis')
        .insert({
          user_id: userId,
          email_id: emailId,
          email_type: analysisData.type || 'sent',
          content_analysis: analysisData.contentAnalysis,
          style_metrics: analysisData.styleMetrics,
          extracted_patterns: analysisData.patterns
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save email analysis:', error);
      throw error;
    }
  }

  async getEmailAnalysisHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('email_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get email analysis history:', error);
      return [];
    }
  }

  extractBusinessContext(emails) {
    const businessTerms = {
      'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'ac unit'],
      'Plumbing': ['plumbing', 'pipe', 'leak', 'drain', 'water', 'toilet', 'faucet'],
      'Electrical': ['electrical', 'wiring', 'outlet', 'circuit', 'voltage', 'electrical'],
      'Auto Repair': ['car', 'vehicle', 'engine', 'brake', 'transmission', 'oil change'],
      'Appliance Repair': ['appliance', 'refrigerator', 'washer', 'dryer', 'dishwasher']
    };

    const contextScore = {};
    
    emails.forEach(email => {
      const content = ((email.subject || '') + ' ' + (email.body || '')).toLowerCase();
      
      Object.keys(businessTerms).forEach(business => {
        businessTerms[business].forEach(term => {
          if (content.includes(term)) {
            contextScore[business] = (contextScore[business] || 0) + 1;
          }
        });
      });
    });

    const detectedBusiness = Object.keys(contextScore).reduce((a, b) => 
      contextScore[a] > contextScore[b] ? a : b, 'General');

    return {
      detectedBusinessType: detectedBusiness,
      businessTermFrequency: contextScore,
      confidence: Math.min((contextScore[detectedBusiness] || 0) / emails.length * 100, 100)
    };
  }

  generateStyleInsights(patterns, businessContext) {
    const insights = [];

    // Communication style insights
    if (patterns.courtesyScore > 2) {
      insights.push({
        type: 'courtesy',
        message: 'High courtesy level - maintains polite, professional tone',
        score: patterns.courtesyScore
      });
    }

    if (patterns.urgencyFrequency > 0.3) {
      insights.push({
        type: 'urgency',
        message: 'Frequently uses urgency indicators - direct communication style',
        score: patterns.urgencyFrequency
      });
    }

    if (patterns.averageEmailLength > 800) {
      insights.push({
        type: 'detail',
        message: 'Detailed communicator - provides comprehensive information',
        score: patterns.averageEmailLength
      });
    } else if (patterns.averageEmailLength < 200) {
      insights.push({
        type: 'concise',
        message: 'Concise communicator - prefers brief, direct messages',
        score: patterns.averageEmailLength
      });
    }

    // Business context insights
    if (businessContext.confidence > 70) {
      insights.push({
        type: 'industry',
        message: `Strong ${businessContext.detectedBusinessType} industry communication patterns`,
        score: businessContext.confidence
      });
    }

    return insights;
  }
}
