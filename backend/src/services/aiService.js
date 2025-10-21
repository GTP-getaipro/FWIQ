import OpenAI from 'openai';
import {  createClient  } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

class AIService {
  constructor() {
    this.initialized = false;
    this.openai = null;
    this.isEnabled = false;
    this.init();
  }

  async init() {
    try {
      // Initialize OpenAI client
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey.includes('your-openai-api-key')) {
        logger.warn('OpenAI API key not configured. AI features will be limited.');
        this.isEnabled = false;
      } else {
        this.openai = new OpenAI({ apiKey });
        this.isEnabled = true;
        logger.info('AIService initialized with OpenAI integration');
      }

      this.initialized = true;

    } catch (error) {
      logger.error('AIService initialization failed:', error);
      this.isEnabled = false;
      this.initialized = true; // Still mark as initialized to allow fallback behavior
    }
  }

  /**
   * Generate email response using AI
   */
  async generateEmailResponse(email, businessContext, userId) {
    if (!this.isEnabled) {
      return this.generateFallbackResponse(email, businessContext);
    }

    try {
      logger.info(`Generating AI response for email from ${email.from}`);

      const prompt = this.buildPrompt(email, businessContext);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.getSystemPrompt(businessContext) },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content;
      
      // Store AI response in database
      await this.storeAIResponse(userId, email.id || `email_${Date.now()}`, prompt, aiResponse);
      
      logger.info('AI response generated successfully');

      return {
        response: aiResponse,
        success: true,
        model: 'gpt-4',
        confidence: 85,
        fallback: false
      };

    } catch (error) {
      logger.error('AI response generation failed:', error);
      return this.generateFallbackResponse(email, businessContext, error.message);
    }
  }

  /**
   * Build prompt for AI response generation
   */
  buildPrompt(email, businessContext) {
    return `
Customer Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Business Context:
- Name: ${businessContext.businessName || businessContext.name}
- Type: ${businessContext.businessType || businessContext.type}
- Services: ${businessContext.services?.map(s => s.name || s).join(', ') || 'General services'}
- Tone: ${businessContext.tone || 'professional'}

Generate a professional response that:
1. Acknowledges the customer's inquiry
2. Provides relevant information about services
3. Maintains a professional and helpful tone
4. Includes a clear call-to-action if appropriate
5. Matches the business's communication style
    `;
  }

  /**
   * Get system prompt for AI
   */
  getSystemPrompt(businessContext) {
    const businessName = businessContext.businessName || businessContext.name || 'the business';
    const businessType = businessContext.businessType || businessContext.type || 'service business';

    return `You are an AI assistant for ${businessName}, a ${businessType}. 

Your role is to generate professional, helpful responses to customer inquiries. Always:
- Be professional and courteous
- Provide accurate information about services
- Maintain the business's brand voice
- Include relevant details about services when appropriate
- End with a clear next step or call-to-action
- Keep responses concise but informative

Never make promises about specific pricing or availability without confirming with the business owner.
Always maintain a helpful and professional tone that reflects well on the business.`;
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  generateFallbackResponse(email, businessContext, errorMessage = null) {
    const businessName = businessContext.businessName || businessContext.name || 'Our Business';
    const phone = businessContext.phone || 'our main number';

    const fallbackResponse = `Thank you for contacting ${businessName}.

We have received your message and appreciate you reaching out to us. Our team will review your inquiry and respond promptly with the information you need.

If this is urgent, please feel free to contact us directly at ${phone}.

Thank you for your business.

Best regards,
${businessName} Team`;

    logger.warn('Using fallback response due to AI unavailability', { errorMessage });

    return {
      response: fallbackResponse,
      success: true,
      model: 'fallback',
      confidence: 50,
      fallback: true,
      fallbackReason: errorMessage || 'AI service unavailable'
    };
  }

  /**
   * Store AI response in database
   */
  async storeAIResponse(userId, emailId, prompt, response) {
    try {
      const { error } = await supabase
        .from('ai_responses')
        .insert({
          user_id: userId,
          email_id: emailId,
          ai_response: response,
          final_response: response,
          response_type: 'ai_generated',
          status: 'generated',
          confidence: 85,
          style_applied: false,
          metadata: {
            model: 'gpt-4',
            prompt_length: prompt.length,
            response_length: response.length,
            generated_at: new Date().toISOString()
          }
        });

      if (error) {
        logger.error('Failed to store AI response:', error);
      }

    } catch (error) {
      logger.error('Failed to store AI response:', error);
    }
  }

  /**
   * Classify email using AI
   */
  async classifyEmail(email) {
    if (!this.isEnabled) {
      return this.getFallbackClassification(email);
    }

    try {
      logger.info(`Classifying email: ${email.subject}`);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: `Classify this email by category, urgency, and sentiment. 
            
Categories: urgent, complaint, appointment, inquiry, followup, general
Urgency levels: critical, high, normal, low
Sentiment: positive, neutral, negative

Return JSON with category, urgency, sentiment, and confidence (0-100) fields.` 
          },
          { 
            role: 'user', 
            content: `Subject: ${email.subject}\nBody: ${email.body}` 
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      const classification = JSON.parse(response.choices[0].message.content);
      
      logger.info(`Email classified: ${classification.category} (${classification.confidence}%)`);

      return {
        ...classification,
        method: 'ai',
        model: 'gpt-4'
      };

    } catch (error) {
      logger.error('Email classification failed:', error);
      return this.getFallbackClassification(email);
    }
  }

  /**
   * Get fallback classification when AI is unavailable
   */
  getFallbackClassification(email) {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    let category = 'general';
    let urgency = 'normal';
    let sentiment = 'neutral';
    let confidence = 60;

    // Simple keyword-based classification
    if (subject.includes('urgent') || subject.includes('emergency') || subject.includes('asap')) {
      category = 'urgent';
      urgency = 'critical';
      confidence = 80;
    } else if (subject.includes('complaint') || body.includes('disappointed') || body.includes('unhappy')) {
      category = 'complaint';
      sentiment = 'negative';
      confidence = 75;
    } else if (subject.includes('appointment') || subject.includes('schedule') || body.includes('book')) {
      category = 'appointment';
      confidence = 70;
    } else if (subject.includes('question') || subject.includes('inquiry') || subject.includes('?')) {
      category = 'inquiry';
      confidence = 65;
    }

    // Detect urgency keywords
    if (body.includes('immediately') || body.includes('right now') || body.includes('emergency')) {
      urgency = 'critical';
    } else if (body.includes('soon') || body.includes('quickly')) {
      urgency = 'high';
    }

    // Detect sentiment
    if (body.includes('thank') || body.includes('great') || body.includes('excellent')) {
      sentiment = 'positive';
    } else if (body.includes('problem') || body.includes('issue') || body.includes('wrong')) {
      sentiment = 'negative';
    }

    logger.info(`Email classified using fallback: ${category} (${confidence}%)`);

    return {
      category,
      urgency,
      sentiment,
      confidence,
      method: 'fallback',
      model: 'keyword-based'
    };
  }

  /**
   * Analyze communication style
   */
  async analyzeCommunicationStyle(userId, emailHistory) {
    if (!this.isEnabled) {
      throw new Error('AI service is not available for communication style analysis');
    }

    try {
      logger.info(`Analyzing communication style for user ${userId}`);

      // Import CommunicationStyleAnalyzer dynamically
      const { CommunicationStyleAnalyzer } = await import('../../src/lib/styleAnalyzer.js');
      const analyzer = new CommunicationStyleAnalyzer();

      const styleProfile = await analyzer.analyzeEmailHistory(userId, emailHistory);

      logger.info(`Communication style analyzed for user ${userId}`);

      return styleProfile;

    } catch (error) {
      logger.error('Communication style analysis failed:', error);
      throw new Error(`Communication style analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze email voice patterns for voice training
   */
  async analyzeEmailVoice(userId, emails, businessType) {
    if (!this.isEnabled) {
      throw new Error('AI service is not available for voice analysis');
    }

    try {
      logger.info(`Analyzing email voice patterns for user ${userId} with ${emails.length} emails`);

      // Prepare emails for analysis
      const emailTexts = emails.map(email => ({
        subject: email.subject || '',
        body: email.body || email.body_text || '',
        from: email.from || email.from_addr || '',
        to: email.to || '',
        date: email.date || email.created_at || ''
      }));

      // Create analysis prompt
      const prompt = this.buildVoiceAnalysisPrompt(emailTexts, businessType);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert communication style analyst. Analyze the provided emails to extract voice patterns, tone, formality level, and communication style characteristics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      // Parse the analysis result
      const voiceAnalysis = this.parseVoiceAnalysis(analysisText);

      // Store the analysis in database
      await this.storeVoiceAnalysis(userId, voiceAnalysis, emails.length);

      logger.info(`Voice analysis completed for user ${userId}`);

      return voiceAnalysis;

    } catch (error) {
      logger.error('Voice analysis failed:', error);
      throw new Error(`Voice analysis failed: ${error.message}`);
    }
  }

  /**
   * Build voice analysis prompt
   */
  buildVoiceAnalysisPrompt(emails, businessType) {
    const emailSamples = emails.slice(0, 10).map((email, index) => 
      `Email ${index + 1}:
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}${email.body.length > 500 ? '...' : ''}`
    ).join('\n\n');

    return `Analyze the communication style and voice patterns from these ${emails.length} business emails for a ${businessType} company.

${emailSamples}

Please provide a JSON response with the following structure:
{
  "tone": "professional|casual|friendly|formal",
  "formality": "high|medium|low",
  "empathy": "high|medium|low",
  "directness": "high|medium|low",
  "responsiveness": "high|medium|low",
  "confidence": 0.0-1.0,
  "sampleSize": ${emails.length},
  "fewShotExamples": [
    {
      "category": "support|sales|general",
      "example": "Sample email text",
      "style": "Brief description of style"
    }
  ],
  "voiceCharacteristics": {
    "greeting": "How they typically start emails",
    "signOff": "How they typically end emails",
    "commonPhrases": ["phrase1", "phrase2"],
    "lengthPreference": "short|medium|long"
  }
}`;
  }

  /**
   * Parse voice analysis response
   */
  parseVoiceAnalysis(analysisText) {
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if JSON extraction fails
      return {
        tone: 'professional',
        formality: 'medium',
        empathy: 'medium',
        directness: 'medium',
        responsiveness: 'medium',
        confidence: 0.5,
        sampleSize: 0,
        fewShotExamples: [],
        voiceCharacteristics: {
          greeting: 'Hello',
          signOff: 'Best regards',
          commonPhrases: [],
          lengthPreference: 'medium'
        }
      };
    } catch (error) {
      logger.error('Failed to parse voice analysis:', error);
      return {
        tone: 'professional',
        formality: 'medium',
        empathy: 'medium',
        directness: 'medium',
        responsiveness: 'medium',
        confidence: 0.3,
        sampleSize: 0,
        fewShotExamples: [],
        voiceCharacteristics: {
          greeting: 'Hello',
          signOff: 'Best regards',
          commonPhrases: [],
          lengthPreference: 'medium'
        }
      };
    }
  }

  /**
   * Store voice analysis in database
   */
  async storeVoiceAnalysis(userId, voiceAnalysis, sampleSize) {
    try {
      const { error } = await supabase
        .from('communication_styles')
        .upsert({
          user_id: userId,
          style_profile: voiceAnalysis,
          sample_size: sampleSize,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        logger.error('Failed to store voice analysis:', error);
        throw error;
      }

      logger.info(`Voice analysis stored for user ${userId}`);
    } catch (error) {
      logger.error('Error storing voice analysis:', error);
      throw error;
    }
  }

  /**
   * Generate style-aware response
   */
  async generateStyleAwareResponse(userId, emailData, category, businessContext) {
    try {
      logger.info(`Generating style-aware response for user ${userId}`);

      // Import StyleAwareAI dynamically
      const { StyleAwareAI } = await import('../../src/lib/styleAwareAI.js');
      const styleAI = new StyleAwareAI();

      const response = await styleAI.generateResponseWithCategory(
        userId,
        emailData,
        category,
        businessContext
      );

      logger.info(`Style-aware response generated for user ${userId}`);

      return response;

    } catch (error) {
      logger.error('Style-aware response generation failed:', error);
      // Fallback to regular AI response
      return await this.generateEmailResponse(emailData, businessContext, userId);
    }
  }

  /**
   * Process email through complete AI pipeline
   */
  async processEmailPipeline(emailData, businessContext, userId) {
    try {
      logger.info(`Processing email through AI pipeline for user ${userId}`);

      // Import AIResponsePipeline dynamically
      const { AIResponsePipeline } = await import('../../src/lib/aiResponsePipeline.js');
      const aiPipeline = new AIResponsePipeline();

      const result = await aiPipeline.processEmailWithQuality(emailData, businessContext, userId);

      logger.info(`AI pipeline processing completed for user ${userId}`);

      return result;

    } catch (error) {
      logger.error('AI pipeline processing failed:', error);
      throw new Error(`AI pipeline processing failed: ${error.message}`);
    }
  }

  /**
   * Get AI processing statistics
   */
  async getAIStats(userId, timeframe = '7d') {
    try {
      // Calculate date range
      const now = new Date();
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const { data: responses, error } = await supabase
        .from('ai_responses')
        .select('category, urgency, confidence, style_applied, response_type, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      const stats = {
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        total: responses?.length || 0,
        byCategory: {},
        byUrgency: {},
        byStatus: {},
        averageConfidence: 0,
        styleAppliedCount: 0,
        responseTypes: {}
      };

      let totalConfidence = 0;

      responses?.forEach(response => {
        // Count by category
        stats.byCategory[response.category] = (stats.byCategory[response.category] || 0) + 1;
        
        // Count by urgency
        stats.byUrgency[response.urgency] = (stats.byUrgency[response.urgency] || 0) + 1;
        
        // Count by status
        stats.byStatus[response.status] = (stats.byStatus[response.status] || 0) + 1;
        
        // Count by response type
        stats.responseTypes[response.response_type] = (stats.responseTypes[response.response_type] || 0) + 1;
        
        // Count style applications
        if (response.style_applied) {
          stats.styleAppliedCount++;
        }
        
        // Sum confidence for average
        totalConfidence += response.confidence || 0;
      });

      stats.averageConfidence = responses?.length > 0 ? totalConfidence / responses.length : 0;

      return stats;

    } catch (error) {
      logger.error('Failed to get AI statistics:', error);
      throw new Error(`Failed to get AI statistics: ${error.message}`);
    }
  }

  /**
   * Validate AI configuration
   */
  async validateConfiguration() {
    const validation = {
      openaiConfigured: !!this.openai,
      openaiEnabled: this.isEnabled,
      modelAvailable: false,
      databaseConnected: false,
      issues: [],
      recommendations: []
    };

    try {
      // Test OpenAI connection
      if (this.isEnabled && this.openai) {
        const testResponse = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        });
        validation.modelAvailable = !!testResponse;
      } else {
        validation.issues.push('OpenAI API key not configured');
        validation.recommendations.push('Configure OPENAI_API_KEY environment variable');
      }

      // Test database connection
      const { error } = await supabase
        .from('ai_responses')
        .select('count')
        .limit(1);
      
      validation.databaseConnected = !error;
      
      if (error) {
        validation.issues.push('Database connection failed');
        validation.recommendations.push('Check Supabase configuration');
      }

    } catch (error) {
      validation.issues.push(`Configuration validation failed: ${error.message}`);
    }

    return validation;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      enabled: this.isEnabled,
      openaiConnected: !!this.openai,
      timestamp: new Date().toISOString()
    };
  }
}

export default new AIService();
