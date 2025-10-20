/**
 * AI Service
 * Handles AI-related API operations and OpenAI integration
 */

import { apiClient } from './apiClient.js';
import { supabase } from './customSupabaseClient.js';

export class AIService {
  constructor() {
    this.apiClient = apiClient;
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Classify email content
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Classification result
   */
  async classifyEmail(emailData) {
    try {
      console.log('🤖 Classifying email via backend API');
      
      const response = await this.apiClient.post('/ai/classify', {
        subject: emailData.subject,
        body: emailData.body,
        sender: emailData.sender,
        timestamp: emailData.timestamp
      });

      console.log('✅ Email classified successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to classify email:', error);
      // Fallback to direct OpenAI call
      return this.classifyEmailDirect(emailData);
    }
  }

  /**
   * Fallback: Direct OpenAI classification
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Classification result
   */
  async classifyEmailDirect(emailData) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an email classification assistant. Classify the following email into one of these categories:
              - urgent: Requires immediate attention
              - support: Technical support request
              - sales: Sales inquiry or lead
              - quote: Request for quote or pricing
              - general: General inquiry or information
              - spam: Spam or irrelevant content
              
              Respond with JSON: {"category": "category_name", "confidence": 0.95, "priority": "high|medium|low", "sentiment": "positive|neutral|negative"}`
            },
            {
              role: 'user',
              content: `Subject: ${emailData.subject}\n\nBody: ${emailData.body}`
            }
          ],
          max_tokens: 150,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const classification = JSON.parse(data.choices[0].message.content);
      
      return {
        category: classification.category,
        confidence: classification.confidence,
        priority: classification.priority,
        sentiment: classification.sentiment,
        source: 'openai_direct'
      };
    } catch (error) {
      console.error('❌ Direct OpenAI classification failed:', error);
      return {
        category: 'general',
        confidence: 0.5,
        priority: 'medium',
        sentiment: 'neutral',
        source: 'fallback'
      };
    }
  }

  /**
   * Generate AI response for email
   * @param {Object} emailData - Email data
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated response
   */
  async generateResponse(emailData, context = {}) {
    try {
      console.log('🤖 Generating AI response via backend API');
      
      const response = await this.apiClient.post('/ai/generate-response', {
        email: emailData,
        context: {
          businessType: context.businessType,
          businessName: context.businessName,
          userPreferences: context.userPreferences,
          ...context
        }
      });

      console.log('✅ AI response generated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to generate AI response:', error);
      // Fallback to direct OpenAI call
      return this.generateResponseDirect(emailData, context);
    }
  }

  /**
   * Fallback: Direct OpenAI response generation
   * @param {Object} emailData - Email data
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Generated response
   */
  async generateResponseDirect(emailData, context = {}) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const businessContext = context.businessName ? 
        `Business: ${context.businessName} (${context.businessType || 'service business'})` : 
        'Service business';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant helping a ${businessContext} respond to customer emails professionally and helpfully. 
              
              Guidelines:
              - Be professional, friendly, and helpful
              - Keep responses concise but informative
              - Address the customer's specific needs
              - Maintain brand consistency
              - If you need more information, ask specific questions
              
              Generate a professional email response.`
            },
            {
              role: 'user',
              content: `Customer email:\nSubject: ${emailData.subject}\nFrom: ${emailData.sender}\n\nMessage: ${emailData.body}\n\nGenerate an appropriate response.`
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      return {
        response: aiResponse,
        subject: `Re: ${emailData.subject}`,
        confidence: 0.8,
        source: 'openai_direct'
      };
    } catch (error) {
      console.error('❌ Direct OpenAI response generation failed:', error);
      return {
        response: 'Thank you for your email. We have received your message and will respond shortly.',
        subject: `Re: ${emailData.subject}`,
        confidence: 0.3,
        source: 'fallback'
      };
    }
  }

  /**
   * Analyze communication style
   * @param {string} userId - User ID
   * @param {Array} emailHistory - Email history
   * @returns {Promise<Object>} Style analysis
   */
  async analyzeCommunicationStyle(userId, emailHistory) {
    try {
      console.log('🤖 Analyzing communication style via backend API');
      
      const response = await this.apiClient.post('/ai/analyze-style', {
        userId,
        emailHistory: emailHistory.slice(0, 50) // Limit to recent emails
      });

      console.log('✅ Communication style analyzed');
      return response;
    } catch (error) {
      console.error('❌ Failed to analyze communication style:', error);
      // Fallback to Supabase storage
      return this.getStoredStyleProfile(userId);
    }
  }

  /**
   * Get stored communication style profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Style profile
   */
  async getStoredStyleProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        userId,
        tone: 'professional',
        formality: 'medium',
        length: 'medium',
        greeting: 'Dear',
        closing: 'Best regards',
        confidence: 0.5,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get stored style profile:', error);
      return {
        userId,
        tone: 'professional',
        formality: 'medium',
        length: 'medium',
        greeting: 'Dear',
        closing: 'Best regards',
        confidence: 0.5,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get AI usage statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getAIUsageStats(userId) {
    try {
      const response = await this.apiClient.get(`/ai/usage/${userId}`);
      return response.stats || {
        totalRequests: 0,
        classifications: 0,
        responses: 0,
        styleAnalysis: 0,
        cost: 0
      };
    } catch (error) {
      console.error('❌ Failed to get AI usage stats:', error);
      // Fallback to Supabase query
      return this.getAIUsageStatsFromSupabase(userId);
    }
  }

  /**
   * Fallback: Get AI usage stats from Supabase
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Usage statistics
   */
  async getAIUsageStatsFromSupabase(userId) {
    try {
      const { data: usageLogs, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        totalRequests: usageLogs.length,
        classifications: usageLogs.filter(log => log.operation === 'classify').length,
        responses: usageLogs.filter(log => log.operation === 'generate_response').length,
        styleAnalysis: usageLogs.filter(log => log.operation === 'analyze_style').length,
        cost: usageLogs.reduce((sum, log) => sum + (log.cost || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('❌ Failed to get AI usage stats from Supabase:', error);
      return {
        totalRequests: 0,
        classifications: 0,
        responses: 0,
        styleAnalysis: 0,
        cost: 0
      };
    }
  }

  /**
   * Log AI usage
   * @param {string} userId - User ID
   * @param {string} operation - Operation type
   * @param {Object} metadata - Additional metadata
   * @param {number} cost - Operation cost
   */
  async logAIUsage(userId, operation, metadata = {}, cost = 0) {
    try {
      // Try backend API first
      await this.apiClient.post('/ai/log-usage', {
        userId,
        operation,
        metadata,
        cost
      });
    } catch (error) {
      console.error('❌ Failed to log AI usage via API:', error);
      
      // Fallback to direct Supabase insert
      try {
        await supabase
          .from('ai_usage_logs')
          .insert({
            user_id: userId,
            operation,
            metadata,
            cost,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('❌ Failed to log AI usage to database:', dbError);
      }
    }
  }

  /**
   * Test AI service connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const response = await this.apiClient.get('/ai/health');
      console.log('✅ AI service connection successful');
      return true;
    } catch (error) {
      console.error('❌ AI service connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export OpenAI client for direct usage
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});