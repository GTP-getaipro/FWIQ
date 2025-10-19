import OpenAI from 'openai';
import { supabase } from '@/lib/customSupabaseClient';

export class CommunicationStyleAnalyzer {
  constructor() {
    // Use environment variable for OpenAI API key
    const apiKey = import.meta.env.OPENAI_API_KEY || 
                   process.env.OPENAI_API_KEY;
    
    if (!apiKey || apiKey.includes('your-openai-api-key')) {
      console.warn('OpenAI API key not found or is placeholder. Style analysis will be limited.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true 
      });
      console.log('OpenAI client initialized successfully');
    }
  }

  async analyzeEmailHistory(userId, emailHistory) {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const sentEmails = emailHistory.filter(email => email.type === 'sent');
    
    if (sentEmails.length < 5) {
      throw new Error('Need at least 5 sent emails to analyze communication style');
    }

    try {
      // Analyze tone and style patterns
      const styleAnalysis = await this.extractStylePatterns(sentEmails);
      
      // Extract vocabulary and phrases
      const vocabularyAnalysis = await this.extractVocabularyPatterns(sentEmails);
      
      // Identify signature phrases
      const signaturePhrases = await this.extractSignaturePhrases(sentEmails);
      
      // Generate style profile
      const styleProfile = await this.generateStyleProfile({
        styleAnalysis,
        vocabularyAnalysis,
        signaturePhrases
      });

      // Store in database
      await this.saveStyleProfile(userId, styleProfile);
      
      return styleProfile;
    } catch (error) {
      console.error('Email history analysis failed:', error);
      throw error;
    }
  }

  async extractStylePatterns(emails) {
    if (!this.openai) {
      return this.getFallbackStylePatterns();
    }

    // Limit email content for API efficiency
    const emailContent = emails.slice(0, 10).map(email => 
      `Subject: ${email.subject || 'No subject'}\nBody: ${(email.body || '').substring(0, 500)}`
    ).join('\n\n---\n\n');

    const prompt = `Analyze these business emails and extract communication style patterns:

${emailContent}

Identify and return JSON with:
1. tone: formal/casual/friendly/professional/direct/diplomatic
2. sentence_structure: short/long/simple/complex
3. greeting_pattern: common greeting style
4. closing_pattern: common closing style
5. industry_terminology: level of technical language use
6. personality_traits: key personality traits in writing
7. customer_approach: relationship building style

Return only valid JSON format.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Style pattern extraction failed:', error);
      return this.getFallbackStylePatterns();
    }
  }

  async extractVocabularyPatterns(emails) {
    if (!this.openai) {
      return this.getFallbackVocabularyPatterns();
    }

    const emailContent = emails.slice(0, 10).map(email => email.body || '').join(' ');
    
    const prompt = `Extract vocabulary patterns from this business communication:

${emailContent.substring(0, 2000)}

Return JSON with:
1. common_words: most frequently used words (excluding common articles)
2. technical_terms: industry-specific terminology used
3. transition_phrases: connecting phrases used between ideas
4. emphasis_words: words used for emphasis or importance
5. courtesy_phrases: polite expressions and courtesies

Return only valid JSON format.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Vocabulary pattern extraction failed:', error);
      return this.getFallbackVocabularyPatterns();
    }
  }

  async extractSignaturePhrases(emails) {
    const phrases = [];
    
    // Extract common phrases from email content
    emails.forEach(email => {
      const body = email.body || '';
      
      // Look for signature phrases at the end of emails
      const lines = body.split('\n');
      const lastLines = lines.slice(-3);
      
      lastLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length > 5 && trimmed.length < 100) {
          phrases.push({
            phrase: trimmed,
            frequency: 1,
            context: 'closing'
          });
        }
      });
    });

    // Count phrase frequency
    const phraseMap = {};
    phrases.forEach(p => {
      if (phraseMap[p.phrase]) {
        phraseMap[p.phrase].frequency++;
      } else {
        phraseMap[p.phrase] = p;
      }
    });

    // Return most common phrases
    return Object.values(phraseMap)
      .filter(p => p.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  async generateStyleProfile(analysisData) {
    const { styleAnalysis, vocabularyAnalysis, signaturePhrases } = analysisData;

    return {
      tone: styleAnalysis.tone || 'professional',
      formality: styleAnalysis.sentence_structure || 'balanced',
      personality: styleAnalysis.personality_traits || ['professional', 'helpful'],
      vocabulary: vocabularyAnalysis,
      signaturePhrases: signaturePhrases,
      greetingPattern: styleAnalysis.greeting_pattern || 'Hello',
      closingPattern: styleAnalysis.closing_pattern || 'Best regards',
      customerApproach: styleAnalysis.customer_approach || 'professional',
      industryTerminology: styleAnalysis.industry_terminology || 'moderate',
      responsePatterns: {
        urgentResponse: 'Direct and immediate',
        routineResponse: 'Professional and thorough',
        followUpStyle: 'Courteous reminder'
      },
      confidence: this.calculateConfidence(analysisData),
      lastAnalyzed: new Date().toISOString()
    };
  }

  calculateConfidence(analysisData) {
    // Simple confidence calculation based on data availability
    let score = 0;
    if (analysisData.styleAnalysis) score += 40;
    if (analysisData.vocabularyAnalysis) score += 30;
    if (analysisData.signaturePhrases && analysisData.signaturePhrases.length > 0) score += 30;
    
    return Math.min(score, 100);
  }

  async saveStyleProfile(userId, styleProfile) {
    try {
      const { error } = await supabase
        .from('communication_styles')
        .upsert({
          user_id: userId,
          style_profile: styleProfile,
          vocabulary_patterns: styleProfile.vocabulary,
          tone_analysis: {
            tone: styleProfile.tone,
            formality: styleProfile.formality,
            personality: styleProfile.personality
          },
          signature_phrases: styleProfile.signaturePhrases.map(p => p.phrase),
          response_templates: styleProfile.responsePatterns
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      console.log('Style profile saved successfully for user:', userId);
    } catch (error) {
      console.error('Failed to save style profile:', error);
      throw error;
    }
  }

  async getStyleProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get style profile:', error);
      return null;
    }
  }

  // Fallback methods for when OpenAI is not available
  getFallbackStylePatterns() {
    return {
      tone: 'professional',
      sentence_structure: 'balanced',
      greeting_pattern: 'Hello',
      closing_pattern: 'Best regards',
      industry_terminology: 'moderate',
      personality_traits: ['professional', 'helpful'],
      customer_approach: 'professional'
    };
  }

  getFallbackVocabularyPatterns() {
    return {
      common_words: ['service', 'customer', 'help', 'support', 'thank'],
      technical_terms: ['system', 'process', 'solution'],
      transition_phrases: ['however', 'additionally', 'furthermore'],
      emphasis_words: ['important', 'urgent', 'priority'],
      courtesy_phrases: ['please', 'thank you', 'appreciate']
    };
  }
}
