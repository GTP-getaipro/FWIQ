// Voice Training Flow Integration
// This module implements automatic email analysis and tone learning from business sent emails

import fs from 'fs';
import path from 'path';

interface EmailSample {
  id: string;
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  date: string;
  threadId: string;
  labels: string[];
  intent: string;
}

interface ToneProfile {
  formality: string;
  averageLength: string;
  greetingStyle: string;
  closingStyle: string;
  signatureConsistency: boolean;
  vocabulary: string[];
  responsePatterns: {
    [key: string]: string;
  };
  examplePhrases: string[];
  voiceConfidence: number;
}

interface VoiceTrainingConfig {
  businessId: string;
  emailProvider: 'gmail' | 'outlook';
  managers: Array<{ name: string; email: string }>;
  businessDomain: string;
  sampleSize: number;
  dateRange: number; // days
  excludedDomains: string[];
}

class VoiceTrainingFlow {
  private config: VoiceTrainingConfig;

  constructor(config: VoiceTrainingConfig) {
    this.config = config;
  }

  /**
   * Main voice training process
   */
  async trainVoiceFromEmails(): Promise<ToneProfile> {
    console.log(`🎤 Starting voice training for business: ${this.config.businessId}`);

    try {
      // Step 1: Sample representative emails
      const emailSamples = await this.sampleRepresentativeEmails();
      console.log(`📧 Sampled ${emailSamples.length} representative emails`);

      // Step 2: Extract and clean email content
      const cleanedEmails = await this.extractAndCleanEmails(emailSamples);
      console.log(`🧹 Cleaned ${cleanedEmails.length} email contents`);

      // Step 3: Analyze tone and style
      const toneProfile = await this.analyzeToneAndStyle(cleanedEmails);
      console.log(`🎯 Generated tone profile with confidence: ${toneProfile.voiceConfidence}`);

      // Step 4: Save voice profile
      await this.saveVoiceProfile(toneProfile);
      console.log(`💾 Voice profile saved for business: ${this.config.businessId}`);

      return toneProfile;
    } catch (error: any) {
      console.error(`❌ Voice training failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sample representative emails from sent folder
   */
  private async sampleRepresentativeEmails(): Promise<EmailSample[]> {
    const searchQueries = this.buildSearchQueries();
    const allEmails: EmailSample[] = [];

    for (const query of searchQueries) {
      try {
        const emails = await this.searchEmails(query);
        allEmails.push(...emails);
      } catch (error: any) {
        console.warn(`⚠️ Search query failed: ${query} - ${error.message}`);
      }
    }

    // Remove duplicates and limit sample size
    const uniqueEmails = this.removeDuplicateEmails(allEmails);
    const sampledEmails = uniqueEmails.slice(0, this.config.sampleSize);

    console.log(`📊 Sampled ${sampledEmails.length} emails from ${allEmails.length} total matches`);
    return sampledEmails;
  }

  /**
   * Build search queries for different email types
   */
  private buildSearchQueries(): string[] {
    const queries: string[] = [];
    const dateFilter = `newer_than:${this.config.dateRange}d`;
    const domainFilter = this.buildDomainFilter();

    // Sales emails
    queries.push(`in:sent ${domainFilter} ${dateFilter} (quote OR estimate OR pricing OR consultation)`);
    
    // Support emails
    queries.push(`in:sent ${domainFilter} ${dateFilter} (help OR support OR issue OR problem)`);
    
    // Confirmation emails
    queries.push(`in:sent ${domainFilter} ${dateFilter} (confirm OR scheduled OR appointment OR booking)`);
    
    // Follow-up emails
    queries.push(`in:sent ${domainFilter} ${dateFilter} (follow-up OR followup OR check-in OR status)`);
    
    // General customer communication
    queries.push(`in:sent ${domainFilter} ${dateFilter} -in:spam -in:trash`);

    return queries;
  }

  /**
   * Build domain filter to exclude internal emails
   */
  private buildDomainFilter(): string {
    const excludedDomains = this.config.excludedDomains.join(' OR ');
    return `to:(-${excludedDomains})`;
  }

  /**
   * Search emails using Gmail API
   */
  private async searchEmails(query: string): Promise<EmailSample[]> {
    // Mock implementation - in production, this would use Gmail API
    const mockEmails: EmailSample[] = [
      {
        id: "email_001",
        subject: "Re: Pool Opening Service Quote",
        body: "Hi Sarah,\n\nThanks for reaching out about your pool opening service. We'd love to help you get your pool ready for the season!\n\nOur team can come out next Tuesday morning to open your pool and get everything running smoothly. The service includes:\n- Removing winter cover\n- Starting up equipment\n- Balancing water chemistry\n- Cleaning and vacuuming\n\nTotal cost: $150\n\nWe'll see you then!\n\nThanks again,\nThe Hot Tub Man Team",
        sender: "john@hottubman.ca",
        recipient: "sarah@customer.com",
        date: "2025-01-15T10:30:00Z",
        threadId: "thread_001",
        labels: ["SALES"],
        intent: "sales_response"
      },
      {
        id: "email_002",
        subject: "Re: Water Testing Results",
        body: "Hi Mike,\n\nGreat news! Your water chemistry is looking much better. The pH is now at 7.4, which is perfect, and your chlorine levels are right where they should be.\n\nI've added the chemicals we discussed, and you should be all set for swimming this weekend. Just remember to run your pump for at least 8 hours a day to keep everything circulating properly.\n\nIf you have any questions, just give us a call!\n\nThanks,\nHailey\nThe Hot Tub Man Team",
        sender: "hailey@hottubman.ca",
        recipient: "mike@customer.com",
        date: "2025-01-14T15:45:00Z",
        threadId: "thread_002",
        labels: ["SUPPORT"],
        intent: "technical_update"
      },
      {
        id: "email_003",
        subject: "Re: Emergency Pool Repair",
        body: "Hi Jennifer,\n\nI'm so sorry to hear about your pool pump issue! That's definitely frustrating, especially with the weather warming up.\n\nOur emergency team can be out there within 2 hours to take a look and get you back up and running. We'll diagnose the problem and have you swimming again as soon as possible.\n\nI'll send our technician, Tom, who specializes in pump repairs. He'll call you when he's on his way.\n\nThanks for your patience - we'll get this sorted out quickly!\n\nBest regards,\nJohn\nThe Hot Tub Man Team",
        sender: "john@hottubman.ca",
        recipient: "jennifer@customer.com",
        date: "2025-01-13T09:15:00Z",
        threadId: "thread_003",
        labels: ["URGENT"],
        intent: "apology_and_solution"
      }
    ];

    // Filter mock emails based on query
    return mockEmails.filter(email => 
      this.matchesSearchQuery(email, query)
    );
  }

  /**
   * Check if email matches search query
   */
  private matchesSearchQuery(email: EmailSample, query: string): boolean {
    const queryLower = query.toLowerCase();
    const subjectLower = email.subject.toLowerCase();
    const bodyLower = email.body.toLowerCase();

    // Simple keyword matching - in production, this would be more sophisticated
    if (queryLower.includes('quote') && (subjectLower.includes('quote') || bodyLower.includes('quote'))) {
      return true;
    }
    if (queryLower.includes('support') && (subjectLower.includes('support') || bodyLower.includes('help'))) {
      return true;
    }
    if (queryLower.includes('confirm') && (subjectLower.includes('confirm') || bodyLower.includes('scheduled'))) {
      return true;
    }
    if (queryLower.includes('follow-up') && (subjectLower.includes('follow') || bodyLower.includes('check'))) {
      return true;
    }

    return false;
  }

  /**
   * Remove duplicate emails based on thread ID and content similarity
   */
  private removeDuplicateEmails(emails: EmailSample[]): EmailSample[] {
    const seen = new Set<string>();
    const unique: EmailSample[] = [];

    for (const email of emails) {
      const key = `${email.threadId}_${email.sender}_${email.recipient}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(email);
      }
    }

    return unique;
  }

  /**
   * Extract and clean email content
   */
  private async extractAndCleanEmails(emails: EmailSample[]): Promise<EmailSample[]> {
    return emails.map(email => ({
      ...email,
      body: this.cleanEmailBody(email.body)
    }));
  }

  /**
   * Clean email body by removing signatures, quotes, and formatting
   */
  private cleanEmailBody(body: string): string {
    let cleaned = body;

    // Remove common signature patterns
    cleaned = cleaned.replace(/\n--\s*\n.*$/s, '');
    cleaned = cleaned.replace(/\nBest regards,.*$/s, '');
    cleaned = cleaned.replace(/\nThanks,.*$/s, '');
    cleaned = cleaned.replace(/\nSincerely,.*$/s, '');

    // Remove quoted text (lines starting with >)
    cleaned = cleaned.replace(/^>.*$/gm, '');

    // Remove multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Analyze tone and style using AI
   */
  private async analyzeToneAndStyle(emails: EmailSample[]): Promise<ToneProfile> {
    // Mock AI analysis - in production, this would use OpenAI API
    const analysisPrompt = this.buildAnalysisPrompt(emails);
    
    // Simulate AI response
    const mockAnalysis: ToneProfile = {
      formality: "friendly-professional",
      averageLength: "medium",
      greetingStyle: "Hi [FirstName],",
      closingStyle: "Thanks again,\nThe [BusinessName] Team",
      signatureConsistency: true,
      vocabulary: [
        "We'll see you then!",
        "Thanks for your patience",
        "We'll get this sorted out",
        "You're all set!",
        "We've got you covered"
      ],
      responsePatterns: {
        "apology": "empathetic + specific reason + fix plan",
        "confirmation": "clear + timeline + cheerful close",
        "technical": "straightforward + concise + proactive",
        "sales": "enthusiastic + helpful + clear next steps"
      },
      examplePhrases: [
        "We'll see you then!",
        "Thanks for checking in — you're all set.",
        "We've got that scheduled and will confirm once complete.",
        "Thanks for your patience - we'll get this sorted out quickly!",
        "Great news! Your water chemistry is looking much better."
      ],
      voiceConfidence: 0.92
    };

    // Calculate confidence based on sample size and consistency
    mockAnalysis.voiceConfidence = this.calculateVoiceConfidence(emails, mockAnalysis);

    return mockAnalysis;
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(emails: EmailSample[]): string {
    const emailTexts = emails.map(email => 
      `Subject: ${email.subject}\nBody: ${email.body}`
    ).join('\n\n---\n\n');

    return `
Analyze the following business emails to extract the company's communication style and tone:

${emailTexts}

Please provide:
1. Formality level (casual, friendly-professional, formal)
2. Average email length (short, medium, long)
3. Common greeting patterns
4. Common closing patterns
5. Signature consistency
6. Frequently used vocabulary/phrases
7. Response patterns for different intents
8. Example phrases that capture their voice
9. Confidence score (0-1) based on sample consistency

Format as JSON with the structure provided in the ToneProfile interface.
    `;
  }

  /**
   * Calculate voice confidence based on sample consistency
   */
  private calculateVoiceConfidence(emails: EmailSample[], profile: ToneProfile): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on sample size
    if (emails.length >= 20) confidence += 0.2;
    else if (emails.length >= 10) confidence += 0.1;

    // Increase confidence based on consistency
    const consistentGreetings = emails.filter(email => 
      email.body.toLowerCase().includes('hi ') || 
      email.body.toLowerCase().includes('hello ')
    ).length;

    const greetingConsistency = consistentGreetings / emails.length;
    confidence += greetingConsistency * 0.2;

    // Increase confidence based on signature consistency
    if (profile.signatureConsistency) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Save voice profile to business behavior JSON
   */
  private async saveVoiceProfile(toneProfile: ToneProfile): Promise<void> {
    const behaviorPath = `jsons/behavior/${this.config.businessId}_behavior.json`;
    
    // Load existing behavior JSON or create new one
    let behaviorJson: any = {};
    if (fs.existsSync(behaviorPath)) {
      behaviorJson = JSON.parse(fs.readFileSync(behaviorPath, 'utf8'));
    }

    // Add voice profile to behavior JSON
    behaviorJson.voiceProfile = toneProfile;
    behaviorJson.meta = {
      ...behaviorJson.meta,
      voiceTrainedAt: new Date().toISOString(),
      voiceConfidence: toneProfile.voiceConfidence
    };

    // Save updated behavior JSON
    fs.writeFileSync(behaviorPath, JSON.stringify(behaviorJson, null, 2));
    
    console.log(`💾 Voice profile saved to: ${behaviorPath}`);
  }

  /**
   * Generate AI system prompt with voice profile
   */
  generateAISystemPrompt(toneProfile: ToneProfile, businessName: string): string {
    return `
You are an AI assistant for ${businessName}. Your responses should match the company's authentic communication style.

VOICE PROFILE:
- Formality Level: ${toneProfile.formality}
- Average Length: ${toneProfile.averageLength}
- Greeting Style: ${toneProfile.greetingStyle}
- Closing Style: ${toneProfile.closingStyle}
- Signature Consistency: ${toneProfile.signatureConsistency}

COMMON VOCABULARY:
${toneProfile.vocabulary.map(phrase => `- "${phrase}"`).join('\n')}

RESPONSE PATTERNS:
${Object.entries(toneProfile.responsePatterns).map(([intent, pattern]) => 
  `- ${intent}: ${pattern}`
).join('\n')}

EXAMPLE PHRASES TO USE:
${toneProfile.examplePhrases.map(phrase => `- "${phrase}"`).join('\n')}

Write responses that sound authentic to ${businessName}'s voice. Use their common phrases and maintain their signature style. Be helpful, professional, and match their tone exactly.
    `.trim();
  }

  /**
   * Validate voice training results
   */
  validateVoiceProfile(toneProfile: ToneProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!toneProfile.formality) {
      errors.push('Formality level is required');
    }

    if (!toneProfile.greetingStyle) {
      errors.push('Greeting style is required');
    }

    if (!toneProfile.closingStyle) {
      errors.push('Closing style is required');
    }

    if (!Array.isArray(toneProfile.vocabulary) || toneProfile.vocabulary.length === 0) {
      errors.push('Vocabulary array is required and must not be empty');
    }

    if (!Array.isArray(toneProfile.examplePhrases) || toneProfile.examplePhrases.length === 0) {
      errors.push('Example phrases array is required and must not be empty');
    }

    if (toneProfile.voiceConfidence < 0 || toneProfile.voiceConfidence > 1) {
      errors.push('Voice confidence must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Voice Training Flow Integration for n8n
 */
export class VoiceTrainingN8nIntegration {
  /**
   * Generate n8n subworkflow for voice training
   */
  static generateVoiceTrainingWorkflow(businessId: string): any {
    return {
      name: `Voice Training - ${businessId}`,
      active: true,
      nodes: [
        {
          id: "gmail-list-sent",
          name: "Gmail List Sent Emails",
          type: "n8n-nodes-base.gmail",
          parameters: {
            operation: "getAll",
            returnAll: false,
            limit: 30,
            filters: {
              q: "in:sent newer_than:90d"
            }
          },
          credentials: {
            gmailOAuth2Api: {
              id: `gmail-${businessId}`,
              name: `gmail-${businessId}`
            }
          }
        },
        {
          id: "filter-customer-emails",
          name: "Filter Customer Emails",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Filter emails to customers only (exclude internal)
              const items = $input.all();
              const businessDomain = '${businessId}.com'; // This would be dynamic
              
              const customerEmails = items.filter(item => {
                const email = item.json;
                const recipient = email.to || '';
                
                // Exclude emails to internal domains
                return !recipient.includes('@' + businessDomain) && 
                       !recipient.includes('@company.com') &&
                       recipient.includes('@');
              });
              
              return customerEmails.map(item => ({
                json: {
                  id: item.json.id,
                  subject: item.json.subject,
                  body: item.json.body,
                  sender: item.json.from,
                  recipient: item.json.to,
                  date: item.json.date,
                  threadId: item.json.threadId,
                  labels: item.json.labels || []
                }
              }));
            `
          }
        },
        {
          id: "clean-email-content",
          name: "Clean Email Content",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Clean email body by removing signatures and quotes
              const items = $input.all();
              
              return items.map(item => {
                let body = item.json.body || '';
                
                // Remove signatures
                body = body.replace(/\\n--\\s*\\n.*$/s, '');
                body = body.replace(/\\nBest regards,.*$/s, '');
                body = body.replace(/\\nThanks,.*$/s, '');
                
                // Remove quoted text
                body = body.replace(/^>.*$/gm, '');
                
                // Clean up whitespace
                body = body.replace(/\\n{3,}/g, '\\n\\n').trim();
                
                return {
                  json: {
                    ...item.json,
                    cleanedBody: body
                  }
                };
              });
            `
          }
        },
        {
          id: "ai-tone-analyzer",
          name: "AI Tone Analyzer",
          type: "n8n-nodes-base.openAi",
          parameters: {
            model: "gpt-4o-mini",
            messages: {
              values: [
                {
                  role: "system",
                  content: `
                    Analyze the following business emails to extract the company's communication style and tone.
                    
                    Provide a JSON response with:
                    - formality: "casual" | "friendly-professional" | "formal"
                    - averageLength: "short" | "medium" | "long"
                    - greetingStyle: common greeting pattern
                    - closingStyle: common closing pattern
                    - signatureConsistency: boolean
                    - vocabulary: array of frequently used phrases
                    - responsePatterns: object with intent patterns
                    - examplePhrases: array of representative phrases
                    - voiceConfidence: number between 0-1
                  `
                },
                {
                  role: "user",
                  content: "{{ $json.cleanedBody }}"
                }
              ]
            },
            temperature: 0.3
          }
        },
        {
          id: "save-voice-profile",
          name: "Save Voice Profile",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Save voice profile to business behavior JSON
              const toneProfile = JSON.parse($json.choices[0].message.content);
              const businessId = '${businessId}';
              
              // Load existing behavior JSON
              const behaviorPath = \`jsons/behavior/\${businessId}_behavior.json\`;
              let behaviorJson = {};
              
              try {
                const existingData = $fs.readFileSync(behaviorPath, 'utf8');
                behaviorJson = JSON.parse(existingData);
              } catch (error) {
                console.log('Creating new behavior JSON');
              }
              
              // Add voice profile
              behaviorJson.voiceProfile = toneProfile;
              behaviorJson.meta = {
                ...behaviorJson.meta,
                voiceTrainedAt: new Date().toISOString(),
                voiceConfidence: toneProfile.voiceConfidence
              };
              
              // Save updated behavior JSON
              $fs.writeFileSync(behaviorPath, JSON.stringify(behaviorJson, null, 2));
              
              return {
                json: {
                  businessId: businessId,
                  voiceProfile: toneProfile,
                  saved: true,
                  confidence: toneProfile.voiceConfidence
                }
              };
            `
          }
        }
      ],
      connections: {
        "gmail-list-sent": {
          "main": [
            [
              {
                "node": "filter-customer-emails",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "filter-customer-emails": {
          "main": [
            [
              {
                "node": "clean-email-content",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "clean-email-content": {
          "main": [
            [
              {
                "node": "ai-tone-analyzer",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "ai-tone-analyzer": {
          "main": [
            [
              {
                "node": "save-voice-profile",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      }
    };
  }
}

export default VoiceTrainingFlow;
