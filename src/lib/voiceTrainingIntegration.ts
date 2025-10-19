// Voice Training Integration with AI Behavior System
// This module integrates voice training with the existing behavior JSON system

import fs from 'fs';
import path from 'path';

interface VoiceProfile {
  formality: string;
  averageLength: string;
  greetingStyle: string;
  closingStyle: string;
  signatureConsistency: boolean;
  vocabulary: string[];
  empathyLevel: number;
  directness: number;
  clarityStyle: string;
}

interface ResponsePatterns {
  [key: string]: string;
}

interface VoiceTrainingResult {
  toneProfile: VoiceProfile;
  responsePatterns: ResponsePatterns;
  examplePhrases: string[];
  voiceConfidence: number;
  meta: {
    analyzedAt: string;
    sampleSize: number;
    businessId: string;
    emailProvider: string;
  };
}

interface BusinessBehaviorJson {
  meta: {
    schemaVersion: string;
    businessId: string;
    generatedAt: string;
    source: string;
    voiceTrainedAt?: string;
    voiceConfidence?: number;
    voiceSampleSize?: number;
    voiceEmailProvider?: string;
  };
  voiceProfile?: VoiceProfile;
  responsePatterns?: ResponsePatterns;
  examplePhrases?: string[];
  // ... other behavior fields
}

class VoiceTrainingIntegration {
  private businessId: string;
  private behaviorJsonPath: string;

  constructor(businessId: string) {
    this.businessId = businessId;
    this.behaviorJsonPath = `jsons/behavior/${businessId}_behavior.json`;
  }

  /**
   * Integrate voice training results with existing behavior JSON
   */
  async integrateVoiceTraining(voiceResult: VoiceTrainingResult): Promise<BusinessBehaviorJson> {
    console.log(`🎤 Integrating voice training for business: ${this.businessId}`);

    try {
      // Load existing behavior JSON or create new one
      let behaviorJson: BusinessBehaviorJson = await this.loadOrCreateBehaviorJson();

      // Integrate voice training results
      behaviorJson.voiceProfile = voiceResult.toneProfile;
      behaviorJson.responsePatterns = voiceResult.responsePatterns;
      behaviorJson.examplePhrases = voiceResult.examplePhrases;

      // Update metadata
      behaviorJson.meta.voiceTrainedAt = voiceResult.meta.analyzedAt;
      behaviorJson.meta.voiceConfidence = voiceResult.voiceConfidence;
      behaviorJson.meta.voiceSampleSize = voiceResult.meta.sampleSize;
      behaviorJson.meta.voiceEmailProvider = voiceResult.meta.emailProvider;

      // Save updated behavior JSON
      await this.saveBehaviorJson(behaviorJson);

      console.log(`✅ Voice training integrated successfully`);
      console.log(`📊 Confidence: ${voiceResult.voiceConfidence}`);
      console.log(`📧 Sample size: ${voiceResult.meta.sampleSize}`);

      return behaviorJson;
    } catch (error: any) {
      console.error(`❌ Voice training integration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load existing behavior JSON or create new one
   */
  private async loadOrCreateBehaviorJson(): Promise<BusinessBehaviorJson> {
    try {
      if (fs.existsSync(this.behaviorJsonPath)) {
        const data = fs.readFileSync(this.behaviorJsonPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error: any) {
      console.warn(`⚠️ Failed to load existing behavior JSON: ${error.message}`);
    }

    // Create new behavior JSON
    return {
      meta: {
        schemaVersion: "v2.0",
        businessId: this.businessId,
        generatedAt: new Date().toISOString(),
        source: "voice-training-integration"
      }
    };
  }

  /**
   * Save behavior JSON to file
   */
  private async saveBehaviorJson(behaviorJson: BusinessBehaviorJson): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.behaviorJsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save behavior JSON
    fs.writeFileSync(this.behaviorJsonPath, JSON.stringify(behaviorJson, null, 2));
  }

  /**
   * Generate AI system prompt with voice profile
   */
  generateAISystemPrompt(behaviorJson: BusinessBehaviorJson, businessName: string): string {
    if (!behaviorJson.voiceProfile) {
      throw new Error('Voice profile not found in behavior JSON');
    }

    const voiceProfile = behaviorJson.voiceProfile;
    const confidence = behaviorJson.meta.voiceConfidence || 0.5;

    return `
You are an AI assistant for ${businessName}. Your responses should match the company's authentic communication style.

VOICE PROFILE (Confidence: ${confidence}):
- Formality Level: ${voiceProfile.formality}
- Average Length: ${voiceProfile.averageLength}
- Greeting Style: ${voiceProfile.greetingStyle}
- Closing Style: ${voiceProfile.closingStyle}
- Signature Consistency: ${voiceProfile.signatureConsistency}
- Empathy Level: ${voiceProfile.empathyLevel}/1.0
- Directness Level: ${voiceProfile.directness}/1.0
- Clarity Style: ${voiceProfile.clarityStyle}

COMMON VOCABULARY:
${voiceProfile.vocabulary.map(phrase => `- "${phrase}"`).join('\n')}

RESPONSE PATTERNS:
${Object.entries(behaviorJson.responsePatterns || {}).map(([intent, pattern]) => 
  `- ${intent}: ${pattern}`
).join('\n')}

EXAMPLE PHRASES TO USE:
${behaviorJson.examplePhrases?.map(phrase => `- "${phrase}"`).join('\n') || 'No example phrases available'}

Write responses that sound authentic to ${businessName}'s voice. Use their common phrases and maintain their signature style. Be helpful, professional, and match their tone exactly.
    `.trim();
  }

  /**
   * Inject voice profile into n8n AI Draft node
   */
  generateN8nAIDraftNode(behaviorJson: BusinessBehaviorJson, businessName: string): any {
    const systemPrompt = this.generateAISystemPrompt(behaviorJson, businessName);

    return {
      id: "ai-draft-generator",
      name: "AI Draft Generator",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [2000, 400],
      parameters: {
        jsCode: `
          // AI Draft Generator with Voice Profile
          const voiceProfile = ${JSON.stringify(behaviorJson.voiceProfile, null, 2)};
          const responsePatterns = ${JSON.stringify(behaviorJson.responsePatterns, null, 2)};
          const examplePhrases = ${JSON.stringify(behaviorJson.examplePhrases, null, 2)};
          const businessName = "${businessName}";
          const confidence = ${behaviorJson.meta.voiceConfidence || 0.5};
          
          // System prompt with voice profile
          const systemPrompt = \`${systemPrompt}\`;
          
          // Generate AI response using voice profile
          const emailData = $json;
          const customerEmail = emailData.body || emailData.text || '';
          const customerSubject = emailData.subject || '';
          const customerName = emailData.from?.split('@')[0] || 'there';
          
          // Determine response intent
          let responseIntent = 'general';
          const emailLower = customerEmail.toLowerCase();
          
          if (emailLower.includes('quote') || emailLower.includes('estimate')) {
            responseIntent = 'sales';
          } else if (emailLower.includes('help') || emailLower.includes('support')) {
            responseIntent = 'support';
          } else if (emailLower.includes('sorry') || emailLower.includes('apologize')) {
            responseIntent = 'apology';
          } else if (emailLower.includes('confirm') || emailLower.includes('scheduled')) {
            responseIntent = 'confirmation';
          }
          
          // Generate response using voice profile
          const response = generateResponse({
            intent: responseIntent,
            customerName: customerName,
            businessName: businessName,
            voiceProfile: voiceProfile,
            responsePatterns: responsePatterns,
            examplePhrases: examplePhrases
          });
          
          return {
            json: {
              draftSubject: response.subject,
              draftBody: response.body,
              voiceProfile: voiceProfile,
              confidence: confidence,
              intent: responseIntent,
              generatedAt: new Date().toISOString()
            }
          };
          
          function generateResponse({ intent, customerName, businessName, voiceProfile, responsePatterns, examplePhrases }) {
            // Generate greeting
            let greeting = voiceProfile.greetingStyle.replace('[FirstName]', customerName);
            
            // Generate body based on intent and voice profile
            let body = '';
            const pattern = responsePatterns[intent] || responsePatterns.general || 'helpful and professional';
            
            // Use example phrases and vocabulary
            const phrases = examplePhrases || [];
            const vocabulary = voiceProfile.vocabulary || [];
            
            // Generate response body (simplified - in production, this would use AI)
            body = \`\${greeting}\\n\\n\`;
            
            if (intent === 'sales') {
              body += \`Thanks for your interest! We'd love to help you with that. \${phrases[0] || 'We appreciate your business.'}\\n\\n\`;
            } else if (intent === 'support') {
              body += \`We're here to help! \${phrases[1] || 'Let us know if you need anything else.'}\\n\\n\`;
            } else if (intent === 'apology') {
              body += \`We apologize for any inconvenience. \${phrases[2] || 'We'll make this right.'}\\n\\n\`;
            } else {
              body += \`\${phrases[0] || 'Thank you for reaching out.'}\\n\\n\`;
            }
            
            // Generate closing
            let closing = voiceProfile.closingStyle.replace('[BusinessName]', businessName);
            body += closing;
            
            // Generate subject
            const subject = \`Re: \${emailData.subject || 'Your inquiry'}\`;
            
            return {
              subject: subject,
              body: body
            };
          }
        `
      }
    };
  }

  /**
   * Validate voice training integration
   */
  validateIntegration(behaviorJson: BusinessBehaviorJson): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!behaviorJson.voiceProfile) {
      errors.push('Voice profile is missing');
    } else {
      const voiceProfile = behaviorJson.voiceProfile;
      
      if (!voiceProfile.formality) {
        errors.push('Formality level is missing');
      }
      
      if (!voiceProfile.greetingStyle) {
        errors.push('Greeting style is missing');
      }
      
      if (!voiceProfile.closingStyle) {
        errors.push('Closing style is missing');
      }
      
      if (!Array.isArray(voiceProfile.vocabulary) || voiceProfile.vocabulary.length === 0) {
        errors.push('Vocabulary array is missing or empty');
      }
    }

    if (!behaviorJson.meta.voiceConfidence) {
      errors.push('Voice confidence is missing');
    } else if (behaviorJson.meta.voiceConfidence < 0 || behaviorJson.meta.voiceConfidence > 1) {
      errors.push('Voice confidence must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get voice training status
   */
  getVoiceTrainingStatus(): {
    trained: boolean;
    confidence: number;
    sampleSize: number;
    lastTrained: string | null;
  } {
    try {
      if (!fs.existsSync(this.behaviorJsonPath)) {
        return {
          trained: false,
          confidence: 0,
          sampleSize: 0,
          lastTrained: null
        };
      }

      const data = fs.readFileSync(this.behaviorJsonPath, 'utf8');
      const behaviorJson = JSON.parse(data);

      return {
        trained: !!behaviorJson.voiceProfile,
        confidence: behaviorJson.meta.voiceConfidence || 0,
        sampleSize: behaviorJson.meta.voiceSampleSize || 0,
        lastTrained: behaviorJson.meta.voiceTrainedAt || null
      };
    } catch (error: any) {
      console.error(`Failed to get voice training status: ${error.message}`);
      return {
        trained: false,
        confidence: 0,
        sampleSize: 0,
        lastTrained: null
      };
    }
  }
}

/**
 * Voice Training Workflow Integration
 */
export class VoiceTrainingWorkflowIntegration {
  /**
   * Generate complete voice training workflow for n8n
   */
  static generateCompleteWorkflow(businessId: string, businessName: string): any {
    const integration = new VoiceTrainingIntegration(businessId);
    
    return {
      name: `Voice Training - ${businessName}`,
      active: true,
      nodes: [
        // ... voice training nodes from previous implementation
        // ... AI Draft node with voice profile injection
      ],
      connections: {
        // ... workflow connections
      },
      tags: [
        { id: "voice-training", name: "Voice Training" },
        { id: "onboarding", name: "Onboarding" },
        { id: "ai-analysis", name: "AI Analysis" }
      ]
    };
  }

  /**
   * Generate voice training API endpoint
   */
  static generateAPIEndpoint(): any {
    return {
      method: 'POST',
      path: '/api/voice-training',
      handler: async (req: any, res: any) => {
        try {
          const { businessId, businessProfile } = req.body;
          
          if (!businessId || !businessProfile) {
            return res.status(400).json({
              error: 'Business ID and profile are required'
            });
          }

          const integration = new VoiceTrainingIntegration(businessId);
          const status = integration.getVoiceTrainingStatus();

          // Trigger voice training workflow
          const workflowResult = await this.triggerVoiceTrainingWorkflow(businessId, businessProfile);

          return res.json({
            success: true,
            businessId: businessId,
            voiceTrainingStatus: status,
            workflowTriggered: true,
            result: workflowResult
          });

        } catch (error: any) {
          console.error('Voice training API error:', error);
          return res.status(500).json({
            error: 'Voice training failed',
            message: error.message
          });
        }
      }
    };
  }

  /**
   * Trigger voice training workflow
   */
  private static async triggerVoiceTrainingWorkflow(businessId: string, businessProfile: any): Promise<any> {
    // Mock implementation - in production, this would trigger the actual n8n workflow
    console.log(`🎤 Triggering voice training workflow for business: ${businessId}`);
    
    return {
      workflowId: `voice-training-${businessId}`,
      status: 'triggered',
      estimatedCompletion: '5-10 minutes'
    };
  }
}

export default VoiceTrainingIntegration;
