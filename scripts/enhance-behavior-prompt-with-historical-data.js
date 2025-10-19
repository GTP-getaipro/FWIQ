/**
 * ENHANCE BEHAVIOR PROMPT WITH HISTORICAL EMAIL DATA
 * Generates personalized system messages using historical email analysis
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class HistoricalPromptEnhancer {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Generate enhanced behavior prompt for a user using historical email data
   */
  async generateEnhancedBehaviorPrompt(userId, businessInfo) {
    console.log(`🚀 Generating enhanced behavior prompt for user: ${userId}`);
    
    try {
      // 1. Fetch historical email examples from ai_human_comparison
      const historicalExamples = await this.fetchHistoricalExamples(userId);
      
      // 2. Analyze writing patterns
      const voiceAnalysis = await this.analyzeVoicePatterns(historicalExamples);
      
      // 3. Generate category-specific examples
      const categoryExamples = this.categorizeExamples(historicalExamples);
      
      // 4. Build enhanced system message
      const enhancedPrompt = this.buildEnhancedSystemMessage(
        businessInfo, 
        voiceAnalysis, 
        categoryExamples
      );
      
      // 5. Save for deployment
      await this.saveEnhancedPrompt(userId, enhancedPrompt);
      
      return enhancedPrompt;
      
    } catch (error) {
      console.error('❌ Failed to generate enhanced prompt:', error);
      return this.getFallbackPrompt(businessInfo);
    }
  }

  /**
   * Fetch historical email examples from database
   */
  async fetchHistoricalExamples(userId) {
    const { data, error } = await this.supabase
      .from('ai_human_comparison')
      .select('category, human_reply, created_at')
      .eq('client_id', userId)
      .not('human_reply', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50); // Get recent examples

    if (error) {
      console.warn('⚠️ Could not fetch historical examples:', error.message);
      return [];
    }

    console.log(`📧 Found ${data.length} historical email examples`);
    return data || [];
  }

  /**
   * Analyze voice patterns from historical emails
   */
  async analyzeVoicePatterns(examples) {
    if (examples.length === 0) {
      return this.getDefaultVoiceAnalysis();
    }

    const analysis = {
      tone: 'Professional and friendly',
      formality: 'Professional',
      averageLength: 'Medium',
      greetingStyle: 'Standard',
      closingStyle: 'Professional',
      commonPhrases: [],
      responsePatterns: {}
    };

    // Analyze tone and formality
    const allText = examples.map(e => e.human_reply).join(' ');
    
    // Detect formality level
    if (allText.includes('Hi there') || allText.includes('Hey')) {
      analysis.tone = 'Friendly and approachable';
      analysis.formality = 'Semi-professional';
    } else if (allText.includes('Dear') || allText.includes('Sincerely')) {
      analysis.tone = 'Formal and professional';
      analysis.formality = 'Formal';
    }

    // Analyze average length
    const avgLength = examples.reduce((sum, e) => sum + e.human_reply.length, 0) / examples.length;
    if (avgLength < 200) {
      analysis.averageLength = 'Short and concise';
    } else if (avgLength > 500) {
      analysis.averageLength = 'Detailed and comprehensive';
    }

    // Extract common phrases
    analysis.commonPhrases = this.extractCommonPhrases(examples);

    console.log('🎯 Voice analysis completed:', analysis);
    return analysis;
  }

  /**
   * Extract common phrases from examples
   */
  extractCommonPhrases(examples) {
    const phrases = [];
    const text = examples.map(e => e.human_reply).join(' ').toLowerCase();
    
    // Common business phrases
    const commonBusinessPhrases = [
      'thank you for reaching out',
      'i\'d be happy to help',
      'let me know if you have any questions',
      'i\'ll get back to you',
      'please let me know',
      'i appreciate your business',
      'looking forward to hearing from you'
    ];

    commonBusinessPhrases.forEach(phrase => {
      if (text.includes(phrase)) {
        phrases.push(phrase);
      }
    });

    return phrases.slice(0, 5); // Top 5 phrases
  }

  /**
   * Categorize examples by email type
   */
  categorizeExamples(examples) {
    const categories = {
      'Sales': [],
      'Support': [],
      'Urgent': [],
      'General': []
    };

    examples.forEach(example => {
      const category = example.category || 'General';
      if (categories[category]) {
        categories[category].push(example);
      }
    });

    return categories;
  }

  /**
   * Build enhanced system message with historical data
   */
  buildEnhancedSystemMessage(businessInfo, voiceAnalysis, categoryExamples) {
    const businessName = businessInfo.name || 'Your Business';
    const businessType = businessInfo.businessTypes?.[0] || 'general';

    // Base prompt structure (matches your current GoldStandardReplyPrompt)
    let enhancedPrompt = `You are drafting professional email replies for ${businessName}.

## VOICE PROFILE (Learned from Historical Emails)
- **Tone**: ${voiceAnalysis.tone}
- **Formality Level**: ${voiceAnalysis.formality}
- **Response Length**: ${voiceAnalysis.averageLength}
- **Greeting Style**: ${voiceAnalysis.greetingStyle}
- **Closing Style**: ${voiceAnalysis.closingStyle}

## WRITING PATTERNS (From Your Previous Emails)
${voiceAnalysis.commonPhrases.length > 0 ? 
  `Common phrases you use: ${voiceAnalysis.commonPhrases.join(', ')}` : 
  'No specific patterns detected yet'}

## CATEGORY-SPECIFIC EXAMPLES
${this.buildCategoryExamples(categoryExamples)}

## BEHAVIOR GUIDELINES
1. **Match the voice profile above** - Use the tone and style patterns from your historical emails
2. **Be consistent** - Follow the same formality level and response patterns
3. **Acknowledge the customer's request** clearly and professionally
4. **Provide helpful information** or next steps
5. **End with a clear call-to-action** or next step
6. **Use your natural phrases** when appropriate

## BUSINESS CONTEXT
- Business: ${businessName}
- Type: ${businessType}
- Maintain professional standards while being ${voiceAnalysis.tone.toLowerCase()}

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}

Remember: Write in YOUR voice, not a generic AI voice. Use the patterns and style from your historical emails.`;

    return enhancedPrompt;
  }

  /**
   * Build category-specific examples section
   */
  buildCategoryExamples(categoryExamples) {
    let examplesText = '';

    for (const [category, examples] of Object.entries(categoryExamples)) {
      if (examples.length === 0) continue;

      examplesText += `\n### ${category} Emails:\n`;
      
      // Show 1-2 examples per category
      const topExamples = examples.slice(0, 2);
      topExamples.forEach((example, index) => {
        const preview = example.human_reply.substring(0, 150) + '...';
        examplesText += `${index + 1}. "${preview}"\n`;
      });
    }

    return examplesText || 'No category examples available yet.';
  }

  /**
   * Save enhanced prompt for deployment
   */
  async saveEnhancedPrompt(userId, enhancedPrompt) {
    const output = {
      userId: userId,
      timestamp: new Date().toISOString(),
      enhancedPrompt: enhancedPrompt,
      promptLength: enhancedPrompt.length,
      deploymentReady: true
    };

    // Save to file
    await fs.promises.writeFile(
      `enhanced-prompt-${userId}.json`,
      JSON.stringify(output, null, 2)
    );

    // Also save to database for n8n deployment
    const { error } = await this.supabase
      .from('user_enhanced_prompts')
      .upsert({
        user_id: userId,
        enhanced_behavior_prompt: enhancedPrompt,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.warn('⚠️ Could not save to database:', error.message);
    }

    console.log('✅ Enhanced prompt saved for deployment');
  }

  /**
   * Get fallback prompt when no historical data is available
   */
  getFallbackPrompt(businessInfo) {
    const businessName = businessInfo.name || 'Your Business';
    
    return `You are drafting professional email replies for ${businessName}.

## VOICE PROFILE (Default - Will Learn Over Time)
- **Tone**: Professional and friendly
- **Formality Level**: Professional
- **Response Length**: Medium
- **Style**: Clear and helpful

## BEHAVIOR GUIDELINES
1. Be professional and helpful
2. Acknowledge the customer's request clearly
3. Provide useful information or next steps
4. End with a clear call-to-action
5. Maintain a friendly but professional tone

## BUSINESS CONTEXT
- Business: ${businessName}
- Maintain professional standards

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}

Note: This prompt will be enhanced with your writing style as you use the system.`;
  }

  /**
   * Get default voice analysis when no data is available
   */
  getDefaultVoiceAnalysis() {
    return {
      tone: 'Professional and friendly',
      formality: 'Professional',
      averageLength: 'Medium',
      greetingStyle: 'Standard',
      closingStyle: 'Professional',
      commonPhrases: [],
      responsePatterns: {}
    };
  }
}

// Example usage
const enhancer = new HistoricalPromptEnhancer();

// Example business info (replace with actual data)
const businessInfo = {
  name: 'The Hot Tub Man Ltd.',
  businessTypes: ['pools_spas'],
  signature: 'Best regards,\nThe Hot Tub Man Ltd.\nPhone: (555) 123-4567'
};

// Example user ID (replace with actual user ID)
const userId = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';

// Generate enhanced prompt
enhancer.generateEnhancedBehaviorPrompt(userId, businessInfo)
  .then(prompt => {
    console.log('\n🎉 ENHANCED BEHAVIOR PROMPT GENERATED:');
    console.log('='.repeat(60));
    console.log(prompt);
  })
  .catch(console.error);
