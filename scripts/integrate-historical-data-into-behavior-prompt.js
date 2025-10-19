/**
 * INTEGRATE HISTORICAL DATA INTO BEHAVIOR PROMPT
 * Modifies the existing behaviorSchemaInjector.js to use historical email data
 */

import { createClient } from '@supabase/supabase-js';

// This would be imported in your actual behaviorSchemaInjector.js
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Enhanced version of buildVoiceEnhancedPrompt that uses historical email data
 * This replaces the existing function in voicePromptEnhancer.js
 */
export const buildVoiceEnhancedPromptWithHistoricalData = async (basePrompt, voiceProfile, userId, category) => {
  let enhancedPrompt = basePrompt;
  
  try {
    // 1. Get historical email examples for this user and category
    const historicalExamples = await getHistoricalEmailExamples(userId, category);
    
    // 2. Analyze voice patterns from historical data
    const voiceAnalysis = await analyzeHistoricalVoicePatterns(historicalExamples);
    
    // 3. Build enhanced prompt with historical data
    enhancedPrompt = buildEnhancedPromptWithHistoricalData(
      basePrompt, 
      voiceProfile, 
      voiceAnalysis, 
      historicalExamples
    );
    
    console.log(`✅ Enhanced prompt with ${historicalExamples.length} historical examples for ${category}`);
    
  } catch (error) {
    console.warn('⚠️ Could not enhance prompt with historical data:', error.message);
    // Fall back to existing voice profile enhancement
    enhancedPrompt = buildVoiceEnhancedPrompt(basePrompt, voiceProfile, userId, category);
  }
  
  return enhancedPrompt;
};

/**
 * Get historical email examples for a user and category
 */
async function getHistoricalEmailExamples(userId, category, limit = 5) {
  const { data, error } = await supabase
    .from('ai_human_comparison')
    .select('human_reply, created_at, category')
    .eq('client_id', userId)
    .eq('category', category)
    .not('human_reply', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Could not fetch historical examples:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Analyze voice patterns from historical email examples
 */
async function analyzeHistoricalVoicePatterns(examples) {
  if (examples.length === 0) {
    return {
      tone: 'Professional and friendly',
      formality: 'Professional',
      averageLength: 'Medium',
      commonPhrases: [],
      writingStyle: 'Standard'
    };
  }

  const analysis = {
    tone: 'Professional and friendly',
    formality: 'Professional',
    averageLength: 'Medium',
    commonPhrases: [],
    writingStyle: 'Standard'
  };

  // Analyze all examples
  const allText = examples.map(e => e.human_reply).join(' ').toLowerCase();
  
  // Detect tone and formality
  if (allText.includes('hi there') || allText.includes('hey') || allText.includes('thanks!')) {
    analysis.tone = 'Friendly and approachable';
    analysis.formality = 'Semi-professional';
  } else if (allText.includes('dear') || allText.includes('sincerely') || allText.includes('respectfully')) {
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
  analysis.commonPhrases = extractCommonPhrasesFromExamples(examples);

  return analysis;
}

/**
 * Extract common phrases from historical examples
 */
function extractCommonPhrasesFromExamples(examples) {
  const phrases = [];
  const text = examples.map(e => e.human_reply).join(' ').toLowerCase();
  
  const commonBusinessPhrases = [
    'thank you for reaching out',
    'i\'d be happy to help',
    'let me know if you have any questions',
    'i\'ll get back to you',
    'please let me know',
    'i appreciate your business',
    'looking forward to hearing from you',
    'i understand your concern',
    'i\'m here to help',
    'feel free to contact me'
  ];

  commonBusinessPhrases.forEach(phrase => {
    if (text.includes(phrase)) {
      phrases.push(phrase);
    }
  });

  return phrases.slice(0, 5); // Top 5 phrases
}

/**
 * Build enhanced prompt with historical data
 */
function buildEnhancedPromptWithHistoricalData(basePrompt, voiceProfile, voiceAnalysis, historicalExamples) {
  // Start with the base prompt
  let enhancedPrompt = basePrompt;
  
  // Add historical voice analysis section
  const historicalSection = `

## YOUR WRITING STYLE (Learned from Your Previous Emails)
- **Tone**: ${voiceAnalysis.tone}
- **Formality**: ${voiceAnalysis.formality}
- **Response Length**: ${voiceAnalysis.averageLength}
- **Common Phrases**: ${voiceAnalysis.commonPhrases.length > 0 ? voiceAnalysis.commonPhrases.join(', ') : 'Standard business phrases'}

## WRITING EXAMPLES FROM YOUR PREVIOUS EMAILS
${buildHistoricalExamplesSection(historicalExamples)}

## INSTRUCTIONS
- **Match your natural writing style** from the examples above
- **Use your common phrases** when appropriate
- **Maintain consistency** with your previous email tone
- **Be authentic** to your voice, not generic AI responses`;

  // Insert the historical section before the signature
  const signatureIndex = enhancedPrompt.lastIndexOf('SIGNATURE:');
  if (signatureIndex !== -1) {
    enhancedPrompt = enhancedPrompt.slice(0, signatureIndex) + 
                    historicalSection + '\n\n' + 
                    enhancedPrompt.slice(signatureIndex);
  } else {
    enhancedPrompt += historicalSection;
  }

  return enhancedPrompt;
}

/**
 * Build historical examples section for the prompt
 */
function buildHistoricalExamplesSection(examples) {
  if (examples.length === 0) {
    return 'No previous examples available yet. Write in a professional, helpful tone.';
  }

  let examplesText = '';
  
  examples.slice(0, 3).forEach((example, index) => {
    const preview = example.human_reply.substring(0, 200) + '...';
    examplesText += `\n**Example ${index + 1}:** "${preview}"\n`;
  });

  return examplesText;
}

/**
 * Integration function to modify existing behaviorSchemaInjector.js
 * This shows how to integrate the historical data enhancement
 */
export const integrateHistoricalDataEnhancement = () => {
  console.log('🔧 INTEGRATION INSTRUCTIONS:');
  console.log('='.repeat(50));
  console.log('');
  console.log('1. In src/lib/voicePromptEnhancer.js:');
  console.log('   - Replace buildVoiceEnhancedPrompt function with buildVoiceEnhancedPromptWithHistoricalData');
  console.log('   - Add the helper functions above');
  console.log('');
  console.log('2. In src/lib/behaviorSchemaInjector.js:');
  console.log('   - Update extractBehaviorConfigForN8n to call the enhanced function');
  console.log('   - Pass userId and category to buildVoiceEnhancedPrompt');
  console.log('');
  console.log('3. In supabase/functions/deploy-n8n/index.ts:');
  console.log('   - Update behaviorReplyPrompt generation to use enhanced prompts');
  console.log('   - Fetch from user_enhanced_prompts table if available');
  console.log('');
  console.log('4. Run the enhanced prompt generation script:');
  console.log('   node scripts/enhance-behavior-prompt-with-historical-data.js');
  console.log('');
  console.log('5. Deploy n8n workflows with enhanced prompts');
  console.log('');
  console.log('✅ This will give you personalized AI responses from day one!');
};

// Export the integration instructions
export default {
  buildVoiceEnhancedPromptWithHistoricalData,
  integrateHistoricalDataEnhancement
};
