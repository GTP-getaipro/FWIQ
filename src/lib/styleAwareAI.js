import OpenAI from 'openai';
import { supabase } from '@/lib/customSupabaseClient';

export class StyleAwareAI {
  constructor() {
    // Use environment variable for OpenAI API key with fallback
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                   process.env.OPENAI_API_KEY || 
                   'your-openai-api-key-here';
    
    if (!apiKey || apiKey.includes('your-openai-api-key')) {
      console.warn('OpenAI API key not found. Style-aware responses will use fallback mode.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ 
        apiKey, 
        dangerouslyAllowBrowser: true 
      });
      console.log('StyleAwareAI initialized with OpenAI');
    }
  }

  async generatePersonalizedResponse(userId, incomingEmail, context = {}) {
    try {
      // Get user's communication style
      const styleProfile = await this.getStyleProfile(userId);
      
      if (!styleProfile || !this.openai) {
        // Fallback to generic response if no style profile or OpenAI unavailable
        return this.generateGenericResponse(incomingEmail, context);
      }

      // Create personalized system prompt
      const personalizedPrompt = this.createPersonalizedPrompt(styleProfile, context);
      
      // Generate response using learned style
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: personalizedPrompt },
          { role: 'user', content: this.formatIncomingEmail(incomingEmail) }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        success: true,
        response: response.choices[0].message.content,
        styleApplied: true,
        confidence: styleProfile.confidence || 75
      };

    } catch (error) {
      console.error('Personalized response generation failed:', error);
      
      // Fallback to generic response on error
      const fallbackResponse = this.generateGenericResponse(incomingEmail, context);
      return {
        success: true,
        response: fallbackResponse.response,
        styleApplied: false,
        error: error.message,
        fallback: true
      };
    }
  }

  createPersonalizedPrompt(styleProfile, businessContext) {
    const profile = styleProfile.style_profile || {};
    const vocabulary = styleProfile.vocabulary_patterns || {};
    const toneAnalysis = styleProfile.tone_analysis || {};
    const signaturePhrases = styleProfile.signature_phrases || [];

    const businessName = businessContext.businessName || 'the business';
    const businessType = businessContext.businessType || 'service business';

    return `You are responding to emails as ${businessName}, a ${businessType}.

COMMUNICATION STYLE:
- Tone: ${toneAnalysis.tone || profile.tone || 'professional'} 
- Formality: ${toneAnalysis.formality || profile.formality || 'balanced'}
- Personality: ${Array.isArray(toneAnalysis.personality) ? toneAnalysis.personality.join(', ') : 'professional, helpful'}
- Customer Approach: ${profile.customerApproach || 'professional and courteous'}

PREFERRED PATTERNS:
- Greeting: "${profile.greetingPattern || 'Hello'}"
- Closing: "${profile.closingPattern || 'Best regards'}"
- Industry Focus: ${businessType} terminology when appropriate

SIGNATURE PHRASES TO INCORPORATE:
${signaturePhrases.slice(0, 5).map(phrase => `- "${phrase}"`).join('\n')}

VOCABULARY PREFERENCES:
- Common words: ${vocabulary.common_words ? vocabulary.common_words.slice(0, 10).map(w => w.item || w).join(', ') : 'service, help, thank you'}
- Technical terms: ${vocabulary.technical_terms ? vocabulary.technical_terms.slice(0, 5).join(', ') : 'professional terminology'}

RESPONSE GUIDELINES:
1. Match the tone and formality level exactly
2. Use the preferred greeting and closing patterns
3. Incorporate signature phrases naturally
4. Keep the response length appropriate (${profile.averageEmailLength > 400 ? 'detailed' : 'concise'})
5. Sound authentic and personal, not robotic

Write a response that sounds exactly like how this business owner would personally respond.`;
  }

  formatIncomingEmail(email) {
    const subject = email.subject || 'No subject';
    const body = email.body || email.content || 'No content';
    const from = email.from || 'Customer';

    return `From: ${from}
Subject: ${subject}

${body}

---
Please respond to this email in the business owner's authentic communication style.`;
  }

  async getStyleProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('communication_styles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching style profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get style profile:', error);
      return null;
    }
  }

  generateGenericResponse(incomingEmail, context = {}) {
    const businessName = context.businessName || 'our team';
    const businessType = context.businessType || 'service';
    
    // Simple template-based response for fallback
    const templates = {
      inquiry: `Hello,

Thank you for your inquiry. We appreciate you reaching out to ${businessName}.

We will review your message and get back to you shortly with the information you need.

If you have any urgent questions, please don't hesitate to call us directly.

Best regards,
${businessName}`,

      complaint: `Hello,

Thank you for bringing this to our attention. We take all customer concerns seriously and want to make this right.

We will investigate this matter immediately and follow up with you within 24 hours with a resolution plan.

We appreciate your patience and the opportunity to address this issue.

Best regards,
${businessName}`,

      appointment: `Hello,

Thank you for your interest in scheduling ${businessType} with us.

We will check our availability and get back to you with available time slots that work for your schedule.

We look forward to serving you.

Best regards,
${businessName}`,

      general: `Hello,

Thank you for your message. We appreciate you contacting ${businessName}.

We have received your email and will respond promptly with the information you need.

Thank you for choosing our services.

Best regards,
${businessName}`
    };

    // Simple intent detection based on keywords
    const emailContent = (incomingEmail.subject + ' ' + incomingEmail.body).toLowerCase();
    let template = 'general';

    if (emailContent.includes('complaint') || emailContent.includes('problem') || emailContent.includes('issue')) {
      template = 'complaint';
    } else if (emailContent.includes('appointment') || emailContent.includes('schedule') || emailContent.includes('book')) {
      template = 'appointment';
    } else if (emailContent.includes('question') || emailContent.includes('inquiry') || emailContent.includes('information')) {
      template = 'inquiry';
    }

    return {
      success: true,
      response: templates[template],
      styleApplied: false,
      template: template
    };
  }

  async generateMultipleOptions(userId, incomingEmail, context = {}, optionCount = 3) {
    const responses = [];
    
    for (let i = 0; i < optionCount; i++) {
      const response = await this.generatePersonalizedResponse(userId, incomingEmail, {
        ...context,
        variation: i + 1
      });
      responses.push({
        option: i + 1,
        ...response
      });
    }

    return responses;
  }

  async generateResponseWithCategory(userId, incomingEmail, category, context = {}) {
    const categoryPrompts = {
      urgent: 'This is an urgent matter that requires immediate attention and a prompt response.',
      routine: 'This is a routine inquiry that should be handled professionally and thoroughly.',
      complaint: 'This is a customer complaint that requires empathy, acknowledgment, and a solution-focused approach.',
      inquiry: 'This is a general inquiry that requires helpful and informative response.',
      appointment: 'This is about scheduling or appointment-related matters.',
      followup: 'This is a follow-up communication that requires acknowledgment and next steps.'
    };

    const enhancedContext = {
      ...context,
      category: category,
      categoryGuidance: categoryPrompts[category] || categoryPrompts.routine
    };

    return this.generatePersonalizedResponse(userId, incomingEmail, enhancedContext);
  }

  // Utility method to validate response quality
  validateResponse(response, styleProfile) {
    const validation = {
      hasGreeting: false,
      hasClosing: false,
      matchesTone: false,
      appropriateLength: false,
      usesSignaturePhrases: false,
      score: 0
    };

    const responseText = response.toLowerCase();
    const profile = styleProfile?.style_profile || {};

    // Check for greeting
    const greetings = ['hello', 'hi', 'dear', 'good morning', 'good afternoon'];
    validation.hasGreeting = greetings.some(greeting => responseText.includes(greeting));

    // Check for closing
    const closings = ['best regards', 'sincerely', 'thank you', 'thanks', 'best'];
    validation.hasClosing = closings.some(closing => responseText.includes(closing));

    // Check length appropriateness
    const expectedLength = profile.averageEmailLength || 300;
    const actualLength = response.length;
    validation.appropriateLength = Math.abs(actualLength - expectedLength) < expectedLength * 0.5;

    // Check for signature phrases
    const signaturePhrases = styleProfile?.signature_phrases || [];
    validation.usesSignaturePhrases = signaturePhrases.some(phrase => 
      responseText.includes(phrase.toLowerCase())
    );

    // Calculate score
    validation.score = [
      validation.hasGreeting,
      validation.hasClosing,
      validation.appropriateLength,
      validation.usesSignaturePhrases
    ].filter(Boolean).length * 25;

    return validation;
  }
}
