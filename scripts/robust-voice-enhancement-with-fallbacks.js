/**
 * ROBUST VOICE ENHANCEMENT WITH FALLBACKS
 * Handles scenarios where there's no historical email data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class RobustVoiceEnhancer {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Main function that handles all scenarios (with or without history)
   */
  async buildRobustBehaviorPrompt(userId, businessInfo, category = 'General') {
    console.log(`🔍 Building behavior prompt for user: ${userId}`);
    
    try {
      // Step 1: Try to get historical data
      const historicalData = await this.getHistoricalData(userId, category);
      
      // Step 2: Determine enhancement strategy based on data quality
      const enhancementStrategy = this.determineEnhancementStrategy(historicalData);
      
      // Step 3: Build appropriate prompt based on strategy
      const enhancedPrompt = await this.buildPromptWithStrategy(
        businessInfo, 
        enhancementStrategy, 
        historicalData
      );
      
      console.log(`✅ Built prompt using strategy: ${enhancementStrategy.name}`);
      return enhancedPrompt;
      
    } catch (error) {
      console.error('❌ Error building prompt:', error);
      return this.getEmergencyFallbackPrompt(businessInfo);
    }
  }

  /**
   * Get historical data with quality assessment
   */
  async getHistoricalData(userId, category) {
    try {
      const { data, error } = await this.supabase
        .from('ai_human_comparison')
        .select('category, human_reply, created_at')
        .eq('client_id', userId)
        .not('human_reply', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('⚠️ Database error:', error.message);
        return { hasData: false, examples: [], quality: 'none' };
      }

      const examples = data || [];
      
      // Assess data quality
      const quality = this.assessDataQuality(examples);
      
      return {
        hasData: examples.length > 0,
        examples: examples,
        quality: quality,
        categoryExamples: this.filterByCategory(examples, category)
      };
      
    } catch (error) {
      console.warn('⚠️ Error fetching historical data:', error.message);
      return { hasData: false, examples: [], quality: 'none' };
    }
  }

  /**
   * Assess the quality of historical data
   */
  assessDataQuality(examples) {
    if (examples.length === 0) return 'none';
    
    // Check for minimum viable data
    const validExamples = examples.filter(ex => 
      ex.human_reply && 
      ex.human_reply.length > 50 && 
      !ex.human_reply.includes('automated') &&
      !ex.human_reply.includes('personal')
    );
    
    if (validExamples.length === 0) return 'poor';
    if (validExamples.length < 3) return 'minimal';
    if (validExamples.length < 10) return 'good';
    return 'excellent';
  }

  /**
   * Filter examples by category
   */
  filterByCategory(examples, category) {
    return examples.filter(ex => ex.category === category);
  }

  /**
   * Determine the best enhancement strategy based on available data
   */
  determineEnhancementStrategy(historicalData) {
    const { hasData, quality, examples } = historicalData;
    
    if (!hasData || quality === 'none') {
      return {
        name: 'Business Type Default',
        description: 'Use business type defaults with professional tone',
        confidence: 'low'
      };
    }
    
    if (quality === 'poor') {
      return {
        name: 'Business Type Enhanced',
        description: 'Use business type defaults with basic voice hints',
        confidence: 'low'
      };
    }
    
    if (quality === 'minimal') {
      return {
        name: 'Minimal Voice Learning',
        description: 'Use available examples with business type fallbacks',
        confidence: 'medium'
      };
    }
    
    if (quality === 'good') {
      return {
        name: 'Voice Learning',
        description: 'Use historical examples with voice analysis',
        confidence: 'high'
      };
    }
    
    return {
      name: 'Full Voice Learning',
      description: 'Complete voice analysis with rich examples',
      confidence: 'very_high'
    };
  }

  /**
   * Build prompt based on enhancement strategy
   */
  async buildPromptWithStrategy(businessInfo, strategy, historicalData) {
    const businessName = businessInfo.name || 'Your Business';
    const businessType = businessInfo.businessTypes?.[0] || 'general';
    
    switch (strategy.name) {
      case 'Business Type Default':
        return this.buildBusinessTypeDefaultPrompt(businessInfo);
        
      case 'Business Type Enhanced':
        return this.buildBusinessTypeEnhancedPrompt(businessInfo, historicalData);
        
      case 'Minimal Voice Learning':
        return this.buildMinimalVoiceLearningPrompt(businessInfo, historicalData);
        
      case 'Voice Learning':
        return this.buildVoiceLearningPrompt(businessInfo, historicalData);
        
      case 'Full Voice Learning':
        return this.buildFullVoiceLearningPrompt(businessInfo, historicalData);
        
      default:
        return this.buildBusinessTypeDefaultPrompt(businessInfo);
    }
  }

  /**
   * Strategy 1: Business Type Default (No History)
   */
  buildBusinessTypeDefaultPrompt(businessInfo) {
    const businessName = businessInfo.name || 'Your Business';
    const businessType = businessInfo.businessTypes?.[0] || 'general';
    
    return `You are drafting professional email replies for ${businessName}.

## VOICE PROFILE (Default - Will Learn Over Time)
- **Tone**: Professional and friendly
- **Formality**: Professional
- **Response Length**: Medium
- **Style**: Clear and helpful

## BUSINESS CONTEXT
- Business: ${businessName}
- Type: ${businessType}
- Maintain professional standards

## BEHAVIOR GUIDELINES
1. **Be professional and helpful** - Maintain a friendly but professional tone
2. **Acknowledge the customer's request** clearly and promptly
3. **Provide useful information** or next steps
4. **End with a clear call-to-action** or next step
5. **Be consistent** with business communication standards

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}

## NOTE
This prompt will be enhanced with your writing style as you use the system. The AI will learn from your edits and improve over time.`;
  }

  /**
   * Strategy 2: Business Type Enhanced (Poor Quality Data)
   */
  buildBusinessTypeEnhancedPrompt(businessInfo, historicalData) {
    const basePrompt = this.buildBusinessTypeDefaultPrompt(businessInfo);
    
    // Add minimal voice hints if any data is available
    if (historicalData.examples.length > 0) {
      const voiceHints = this.extractBasicVoiceHints(historicalData.examples);
      
      const enhancement = `

## VOICE HINTS (From Limited Data)
- **Detected Tone**: ${voiceHints.tone}
- **Response Style**: ${voiceHints.style}
- **Note**: Limited data available - will improve with more usage`;
      
      return basePrompt + enhancement;
    }
    
    return basePrompt;
  }

  /**
   * Strategy 3: Minimal Voice Learning (Few Examples)
   */
  buildMinimalVoiceLearningPrompt(businessInfo, historicalData) {
    const businessName = businessInfo.name || 'Your Business';
    const voiceAnalysis = this.analyzeVoicePatterns(historicalData.examples);
    
    return `You are drafting professional email replies for ${businessName}.

## VOICE PROFILE (Learning from Limited Examples)
- **Tone**: ${voiceAnalysis.tone}
- **Formality**: ${voiceAnalysis.formality}
- **Response Length**: ${voiceAnalysis.averageLength}
- **Style**: ${voiceAnalysis.writingStyle}

## AVAILABLE EXAMPLES (Limited)
${this.buildExamplesSection(historicalData.examples.slice(0, 2))}

## INSTRUCTIONS
- **Use the tone and style** from the examples above when appropriate
- **Be professional** and maintain business standards
- **Learn and improve** as more examples become available

## BEHAVIOR GUIDELINES
1. **Match the detected tone** from your previous emails
2. **Acknowledge the customer's request** clearly
3. **Provide helpful information** or next steps
4. **End with a clear call-to-action**
5. **Be consistent** with your communication style

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}

## NOTE
Limited examples available. The system will learn more about your writing style as you use it.`;
  }

  /**
   * Strategy 4: Voice Learning (Good Quality Data)
   */
  buildVoiceLearningPrompt(businessInfo, historicalData) {
    const businessName = businessInfo.name || 'Your Business';
    const voiceAnalysis = this.analyzeVoicePatterns(historicalData.examples);
    
    return `You are drafting professional email replies for ${businessName}.

## YOUR WRITING STYLE (Learned from Your Emails)
- **Tone**: ${voiceAnalysis.tone}
- **Formality**: ${voiceAnalysis.formality}
- **Response Length**: ${voiceAnalysis.averageLength}
- **Common Phrases**: ${voiceAnalysis.commonPhrases.join(', ')}

## WRITING EXAMPLES FROM YOUR PREVIOUS EMAILS
${this.buildExamplesSection(historicalData.examples.slice(0, 3))}

## INSTRUCTIONS
- **Match your natural writing style** from the examples above
- **Use your common phrases** when appropriate
- **Be authentic** to your voice, not generic AI responses
- **Maintain consistency** with your previous email tone

## BEHAVIOR GUIDELINES
1. **Acknowledge the customer's request** clearly
2. **Provide helpful information** or next steps
3. **Use your natural tone** and style
4. **End with a clear call-to-action**
5. **Be consistent** with your communication patterns

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}`;
  }

  /**
   * Strategy 5: Full Voice Learning (Excellent Data)
   */
  buildFullVoiceLearningPrompt(businessInfo, historicalData) {
    const businessName = businessInfo.name || 'Your Business';
    const voiceAnalysis = this.analyzeVoicePatterns(historicalData.examples);
    
    return `You are drafting professional email replies for ${businessName}.

## YOUR WRITING STYLE (Learned from Your Emails)
- **Tone**: ${voiceAnalysis.tone}
- **Formality**: ${voiceAnalysis.formality}
- **Response Length**: ${voiceAnalysis.averageLength}
- **Common Phrases**: ${voiceAnalysis.commonPhrases.join(', ')}
- **Writing Patterns**: ${voiceAnalysis.writingPatterns.join(', ')}

## WRITING EXAMPLES FROM YOUR PREVIOUS EMAILS
${this.buildExamplesSection(historicalData.examples.slice(0, 5))}

## INSTRUCTIONS
- **Match your natural writing style** from the examples above
- **Use your common phrases** and patterns when appropriate
- **Be authentic** to your voice, not generic AI responses
- **Maintain consistency** with your previous email tone
- **Adapt to context** while keeping your voice

## BEHAVIOR GUIDELINES
1. **Acknowledge the customer's request** clearly
2. **Provide helpful information** or next steps
3. **Use your natural tone** and style
4. **End with a clear call-to-action**
5. **Be consistent** with your communication patterns

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}`;
  }

  /**
   * Extract basic voice hints from poor quality data
   */
  extractBasicVoiceHints(examples) {
    const allText = examples.map(e => e.human_reply).join(' ').toLowerCase();
    
    let tone = 'Professional and friendly';
    let style = 'Standard';
    
    if (allText.includes('hi there') || allText.includes('hey')) {
      tone = 'Friendly and approachable';
      style = 'Casual professional';
    } else if (allText.includes('dear') || allText.includes('sincerely')) {
      tone = 'Formal and professional';
      style = 'Formal';
    }
    
    return { tone, style };
  }

  /**
   * Analyze voice patterns from examples
   */
  analyzeVoicePatterns(examples) {
    if (examples.length === 0) {
      return {
        tone: 'Professional and friendly',
        formality: 'Professional',
        averageLength: 'Medium',
        commonPhrases: [],
        writingPatterns: [],
        writingStyle: 'Standard'
      };
    }

    const analysis = {
      tone: 'Professional and friendly',
      formality: 'Professional',
      averageLength: 'Medium',
      commonPhrases: [],
      writingPatterns: [],
      writingStyle: 'Standard'
    };

    const allText = examples.map(e => e.human_reply).join(' ').toLowerCase();
    
    // Analyze tone and formality
    if (allText.includes('hi there') || allText.includes('hey') || allText.includes('thanks!')) {
      analysis.tone = 'Friendly and approachable';
      analysis.formality = 'Semi-professional';
    } else if (allText.includes('dear') || allText.includes('sincerely')) {
      analysis.tone = 'Formal and professional';
      analysis.formality = 'Formal';
    }

    // Analyze response length
    const avgLength = examples.reduce((sum, e) => sum + e.human_reply.length, 0) / examples.length;
    if (avgLength < 200) {
      analysis.averageLength = 'Short and concise';
    } else if (avgLength > 500) {
      analysis.averageLength = 'Detailed and comprehensive';
    }

    // Extract common phrases
    analysis.commonPhrases = this.extractCommonPhrases(examples);
    analysis.writingPatterns = this.extractWritingPatterns(examples);

    return analysis;
  }

  /**
   * Extract common phrases from examples
   */
  extractCommonPhrases(examples) {
    const phrases = [];
    const text = examples.map(e => e.human_reply).join(' ').toLowerCase();
    
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

    return phrases.slice(0, 5);
  }

  /**
   * Extract writing patterns from examples
   */
  extractWritingPatterns(examples) {
    const patterns = [];
    const text = examples.map(e => e.human_reply).join(' ').toLowerCase();
    
    if (text.includes('i\'m') || text.includes('i am')) {
      patterns.push('Uses contractions');
    }
    if (text.includes('!')) {
      patterns.push('Uses exclamation points');
    }
    if (text.includes('?')) {
      patterns.push('Asks questions');
    }
    if (text.includes('please')) {
      patterns.push('Uses polite language');
    }
    
    return patterns;
  }

  /**
   * Build examples section for prompt
   */
  buildExamplesSection(examples) {
    if (examples.length === 0) {
      return 'No examples available yet.';
    }

    let examplesText = '';
    examples.forEach((example, index) => {
      const preview = example.human_reply.substring(0, 150) + '...';
      examplesText += `\n**Example ${index + 1}:** "${preview}"\n`;
    });

    return examplesText;
  }

  /**
   * Emergency fallback prompt
   */
  getEmergencyFallbackPrompt(businessInfo) {
    const businessName = businessInfo.name || 'Your Business';
    
    return `You are drafting professional email replies for ${businessName}.

## VOICE PROFILE (Default)
- **Tone**: Professional and friendly
- **Formality**: Professional
- **Response Length**: Medium
- **Style**: Clear and helpful

## BEHAVIOR GUIDELINES
1. **Be professional and helpful**
2. **Acknowledge the customer's request** clearly
3. **Provide useful information** or next steps
4. **End with a clear call-to-action**
5. **Maintain a friendly but professional tone**

## SIGNATURE
${businessInfo.signature || `Best regards,\n${businessName}`}

## NOTE
This is a default prompt. The system will learn your writing style as you use it.`;
  }
}

// Example usage
const enhancer = new RobustVoiceEnhancer();

// Test different scenarios
const testScenarios = [
  { userId: 'user-with-no-history', businessInfo: { name: 'Test Business' } },
  { userId: 'user-with-poor-data', businessInfo: { name: 'Test Business' } },
  { userId: 'user-with-good-data', businessInfo: { name: 'Test Business' } }
];

testScenarios.forEach(async (scenario, index) => {
  console.log(`\n🧪 Testing Scenario ${index + 1}: ${scenario.userId}`);
  const prompt = await enhancer.buildRobustBehaviorPrompt(
    scenario.userId, 
    scenario.businessInfo
  );
  console.log(`📝 Generated prompt length: ${prompt.length} characters`);
  console.log(`📋 Prompt preview: ${prompt.substring(0, 200)}...`);
});

export default RobustVoiceEnhancer;
