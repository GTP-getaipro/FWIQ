// Email Style Analysis Service - Integration utility
import { CommunicationStyleAnalyzer } from './styleAnalyzer.js';
import { CommunicationPatternAnalyzer } from './communicationPatterns.js';
import { VocabularyExtractor } from './vocabularyExtractor.js';

export class EmailStyleService {
  constructor() {
    this.styleAnalyzer = new CommunicationStyleAnalyzer();
    this.patternAnalyzer = new CommunicationPatternAnalyzer();
    this.vocabularyExtractor = new VocabularyExtractor();
  }

  async analyzeUserCommunicationStyle(userId, emailHistory) {
    try {
      if (!emailHistory || emailHistory.length < 5) {
        throw new Error('Insufficient email history for analysis (minimum 5 emails required)');
      }

      console.log(`Analyzing communication style for user ${userId} with ${emailHistory.length} emails`);

      // Extract patterns using local analysis
      const patterns = this.patternAnalyzer.analyzeEmailPatterns(emailHistory);
      const vocabulary = this.vocabularyExtractor.extractVocabularyPatterns(emailHistory);
      const signatures = this.vocabularyExtractor.extractSignatureVocabulary(emailHistory);
      const complexity = this.vocabularyExtractor.analyzeWritingComplexity(emailHistory);
      const businessContext = this.vocabularyExtractor.detectBusinessContext(vocabulary.commonWords.reduce((acc, item) => {
        acc[item.item] = item.count;
        return acc;
      }, {}));

      // Generate insights
      const insights = this.patternAnalyzer.generateStyleInsights(patterns, businessContext);

      // Create comprehensive style profile
      const styleProfile = {
        userId,
        analyzedAt: new Date().toISOString(),
        emailCount: emailHistory.length,
        
        // Communication patterns
        communicationStyle: patterns.communicationStyle,
        preferredGreeting: patterns.preferredGreeting,
        preferredClosing: patterns.preferredClosing,
        averageEmailLength: patterns.averageEmailLength,
        courtesyScore: patterns.courtesyScore,
        urgencyFrequency: patterns.urgencyFrequency,
        
        // Vocabulary analysis
        vocabularySize: vocabulary.vocabularySize,
        commonWords: vocabulary.commonWords.slice(0, 10),
        technicalTerms: vocabulary.technicalTerms,
        serviceTerms: vocabulary.serviceTerms,
        
        // Signature elements
        signatureGreeting: signatures.preferredGreeting,
        signatureClosing: signatures.preferredClosing,
        transitionPhrases: signatures.commonTransitions,
        emphasisWords: signatures.emphasisStyle,
        
        // Writing complexity
        writingComplexity: complexity,
        
        // Business context
        businessContext,
        
        // Generated insights
        insights,
        
        // Confidence score
        confidence: this.calculateOverallConfidence(emailHistory.length, patterns, vocabulary)
      };

      // Try to use OpenAI for enhanced analysis if available
      try {
        const enhancedProfile = await this.styleAnalyzer.analyzeEmailHistory(userId, emailHistory);
        console.log('Enhanced analysis completed with OpenAI');
        
        // Merge local and AI analysis
        styleProfile.aiEnhanced = true;
        styleProfile.aiAnalysis = enhancedProfile;
        styleProfile.tone = enhancedProfile.tone;
        styleProfile.personality = enhancedProfile.personality;
        
      } catch (aiError) {
        console.log('OpenAI analysis not available, using local analysis only:', aiError.message);
        styleProfile.aiEnhanced = false;
        
        // Use local analysis for tone and personality
        styleProfile.tone = this.inferTone(patterns, vocabulary);
        styleProfile.personality = this.inferPersonality(patterns, insights);
      }

      // Save the analysis
      await this.saveStyleAnalysis(userId, styleProfile);
      
      return styleProfile;

    } catch (error) {
      console.error('Communication style analysis failed:', error);
      throw error;
    }
  }

  async getStoredStyleProfile(userId) {
    try {
      return await this.styleAnalyzer.getStyleProfile(userId);
    } catch (error) {
      console.error('Failed to retrieve stored style profile:', error);
      return null;
    }
  }

  async saveStyleAnalysis(userId, styleProfile) {
    try {
      // Save to communication_styles table
      const simplifiedProfile = {
        tone: styleProfile.tone,
        formality: styleProfile.communicationStyle,
        personality: styleProfile.personality || ['professional'],
        vocabulary: {
          commonWords: styleProfile.commonWords,
          technicalTerms: styleProfile.technicalTerms,
          serviceTerms: styleProfile.serviceTerms
        },
        signaturePhrases: [
          { phrase: styleProfile.signatureGreeting, context: 'greeting' },
          { phrase: styleProfile.signatureClosing, context: 'closing' }
        ].filter(p => p.phrase),
        greetingPattern: styleProfile.preferredGreeting,
        closingPattern: styleProfile.preferredClosing,
        customerApproach: styleProfile.businessContext?.detectedType || 'professional',
        industryTerminology: styleProfile.technicalTerms?.length > 5 ? 'high' : 'moderate',
        responsePatterns: {
          urgentResponse: styleProfile.urgencyFrequency > 0.3 ? 'Direct and immediate' : 'Professional and thorough',
          routineResponse: 'Professional and thorough',
          followUpStyle: styleProfile.courtesyScore > 2 ? 'Courteous reminder' : 'Direct follow-up'
        },
        confidence: styleProfile.confidence,
        lastAnalyzed: styleProfile.analyzedAt
      };

      await this.styleAnalyzer.saveStyleProfile(userId, simplifiedProfile);
      console.log('Style analysis saved successfully');
      
    } catch (error) {
      console.error('Failed to save style analysis:', error);
      // Don't throw error - analysis can still be returned even if save fails
    }
  }

  calculateOverallConfidence(emailCount, patterns, vocabulary) {
    let confidence = 0;
    
    // Email count factor (more emails = higher confidence)
    if (emailCount >= 20) confidence += 40;
    else if (emailCount >= 10) confidence += 30;
    else if (emailCount >= 5) confidence += 20;
    else confidence += 10;
    
    // Pattern consistency factor
    if (patterns.greetingVariety > 0) confidence += 15;
    if (patterns.closingVariety > 0) confidence += 15;
    if (patterns.courtesyScore > 1) confidence += 10;
    
    // Vocabulary richness factor
    if (vocabulary.vocabularySize > 100) confidence += 20;
    else if (vocabulary.vocabularySize > 50) confidence += 15;
    else confidence += 10;
    
    return Math.min(confidence, 100);
  }

  inferTone(patterns, vocabulary) {
    // Infer tone from patterns when AI is not available
    if (patterns.courtesyScore > 2) return 'friendly-professional';
    if (patterns.urgencyFrequency > 0.3) return 'direct';
    if (patterns.averageEmailLength > 500) return 'detailed-professional';
    if (vocabulary.technicalTerms?.length > 5) return 'technical-professional';
    return 'professional';
  }

  inferPersonality(patterns, insights) {
    const personality = ['professional'];
    
    if (patterns.courtesyScore > 2) personality.push('courteous');
    if (patterns.urgencyFrequency > 0.3) personality.push('direct');
    if (patterns.averageEmailLength > 500) personality.push('thorough');
    if (insights.some(i => i.type === 'detail')) personality.push('detail-oriented');
    if (insights.some(i => i.type === 'concise')) personality.push('concise');
    
    return personality;
  }

  // Utility method to format email history for analysis
  formatEmailHistory(rawEmails) {
    return rawEmails.map(email => ({
      id: email.id || email.messageId,
      subject: email.subject || '',
      body: email.body || email.content || '',
      type: email.type || 'sent',
      date: email.date || email.timestamp || new Date().toISOString()
    }));
  }

  // Quick analysis method for testing
  async quickAnalysis(userId, emailSamples) {
    try {
      const formattedEmails = this.formatEmailHistory(emailSamples);
      return await this.analyzeUserCommunicationStyle(userId, formattedEmails);
    } catch (error) {
      console.error('Quick analysis failed:', error);
      throw error;
    }
  }
}
