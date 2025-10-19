// Adaptive Tone Training System - Stage 2 Implementation
// This module implements the complete adaptive voice training system

import fs from 'fs';
import path from 'path';

interface EmailHistory {
  id: string;
  subject: string;
  body: string;
  sender: string;
  recipient: string;
  date: string;
  threadId: string;
  labels: string[];
  intent: string;
  wordCount: number;
  responseTime: number; // minutes from original email
}

interface VoiceProfile {
  tone: string;
  averageLength: string;
  commonPhrases: string[];
  signOff: string;
  responseStructure: string;
  formalityLevel: number; // 0-1 scale
  empathyLevel: number; // 0-1 scale
  directnessLevel: number; // 0-1 scale
  signatureConsistency: boolean;
  vocabulary: string[];
  sentencePatterns: string[];
  confidence: number; // 0-1 scale
}

interface IndustryBehaviorProfile {
  industry: string;
  rules: any;
  phrasing: any;
  templates: any;
  escalationRules: any;
}

interface ActiveBehaviorProfile {
  industry: IndustryBehaviorProfile;
  voice: VoiceProfile;
  merged: any;
  lastUpdated: string;
  version: string;
}

class AdaptiveToneTrainingSystem {
  private businessId: string;
  private emailProvider: 'gmail' | 'outlook';
  private voiceProfilePath: string;
  private behaviorProfilePath: string;

  constructor(businessId: string, emailProvider: 'gmail' | 'outlook') {
    this.businessId = businessId;
    this.emailProvider = emailProvider;
    this.voiceProfilePath = `jsons/voice/${businessId}_voice_profile.json`;
    this.behaviorProfilePath = `jsons/behavior/${businessId}_active_behavior.json`;
  }

  /**
   * Stage 2.1: Email History Collection
   * Pull 200-500 sent emails and extract tone/style patterns
   */
  async collectEmailHistory(): Promise<EmailHistory[]> {
    console.log(`📧 Collecting email history for business: ${this.businessId}`);

    try {
      // Build search queries for different email types
      const searchQueries = this.buildEmailHistoryQueries();
      const allEmails: EmailHistory[] = [];

      for (const query of searchQueries) {
        const emails = await this.fetchEmailsByQuery(query);
        allEmails.push(...emails);
      }

      // Remove duplicates and limit to 500 emails
      const uniqueEmails = this.removeDuplicateEmails(allEmails);
      const sampledEmails = uniqueEmails.slice(0, 500);

      console.log(`📊 Collected ${sampledEmails.length} emails from ${allEmails.length} total matches`);

      // Analyze email patterns
      const analyzedEmails = await this.analyzeEmailPatterns(sampledEmails);

      return analyzedEmails;
    } catch (error: any) {
      console.error(`❌ Email history collection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build search queries for email history collection
   */
  private buildEmailHistoryQueries(): string[] {
    const queries: string[] = [];
    const dateFilter = `newer_than:180d`; // Last 6 months
    const domainFilter = this.buildDomainFilter();

    // Different email types for comprehensive analysis
    queries.push(`in:sent ${domainFilter} ${dateFilter} (quote OR estimate OR pricing)`);
    queries.push(`in:sent ${domainFilter} ${dateFilter} (confirm OR scheduled OR appointment)`);
    queries.push(`in:sent ${domainFilter} ${dateFilter} (sorry OR apologize OR apologize)`);
    queries.push(`in:sent ${domainFilter} ${dateFilter} (follow-up OR followup OR check-in)`);
    queries.push(`in:sent ${domainFilter} ${dateFilter} (help OR support OR issue)`);
    queries.push(`in:sent ${domainFilter} ${dateFilter} (thanks OR thank OR appreciate)`);
    queries.push(`in:sent ${domainFilter} ${dateFilter} -in:spam -in:trash`);

    return queries;
  }

  /**
   * Build domain filter to exclude internal emails
   */
  private buildDomainFilter(): string {
    const businessDomain = this.businessId.replace('_', '.');
    return `to:(-@${businessDomain} -@company.com -@internal.com)`;
  }

  /**
   * Fetch emails by query (mock implementation)
   */
  private async fetchEmailsByQuery(query: string): Promise<EmailHistory[]> {
    // Mock implementation - in production, this would use Gmail/Outlook API
    const mockEmails: EmailHistory[] = [
      {
        id: "email_001",
        subject: "Re: Pool Opening Service Quote",
        body: "Hi Sarah,\n\nThanks for reaching out about your pool opening service. We'd love to help you get your pool ready for the season!\n\nOur team can come out next Tuesday morning to open your pool and get everything running smoothly. The service includes removing the winter cover, starting up equipment, balancing water chemistry, and cleaning.\n\nTotal cost: $150\n\nWe'll see you then!\n\nThanks again,\nThe Hot Tub Man Team",
        sender: "john@hottubman.ca",
        recipient: "sarah@customer.com",
        date: "2025-01-15T10:30:00Z",
        threadId: "thread_001",
        labels: ["SALES"],
        intent: "sales_response",
        wordCount: 0, // Will be calculated
        responseTime: 0 // Will be calculated
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
        intent: "technical_update",
        wordCount: 0,
        responseTime: 0
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
        intent: "apology_and_solution",
        wordCount: 0,
        responseTime: 0
      }
    ];

    // Filter mock emails based on query
    return mockEmails.filter(email => this.matchesSearchQuery(email, query));
  }

  /**
   * Check if email matches search query
   */
  private matchesSearchQuery(email: EmailHistory, query: string): boolean {
    const queryLower = query.toLowerCase();
    const subjectLower = email.subject.toLowerCase();
    const bodyLower = email.body.toLowerCase();

    // Simple keyword matching - in production, this would be more sophisticated
    if (queryLower.includes('quote') && (subjectLower.includes('quote') || bodyLower.includes('quote'))) {
      return true;
    }
    if (queryLower.includes('confirm') && (subjectLower.includes('confirm') || bodyLower.includes('scheduled'))) {
      return true;
    }
    if (queryLower.includes('sorry') && (subjectLower.includes('sorry') || bodyLower.includes('apologize'))) {
      return true;
    }
    if (queryLower.includes('follow-up') && (subjectLower.includes('follow') || bodyLower.includes('check'))) {
      return true;
    }
    if (queryLower.includes('help') && (subjectLower.includes('help') || bodyLower.includes('support'))) {
      return true;
    }
    if (queryLower.includes('thanks') && (subjectLower.includes('thanks') || bodyLower.includes('thank'))) {
      return true;
    }

    return false;
  }

  /**
   * Remove duplicate emails
   */
  private removeDuplicateEmails(emails: EmailHistory[]): EmailHistory[] {
    const seen = new Set<string>();
    const unique: EmailHistory[] = [];

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
   * Analyze email patterns for tone and style
   */
  private async analyzeEmailPatterns(emails: EmailHistory[]): Promise<EmailHistory[]> {
    return emails.map(email => {
      // Calculate word count
      email.wordCount = email.body.split(' ').length;

      // Calculate response time (mock - in production, this would analyze thread timing)
      email.responseTime = Math.floor(Math.random() * 1440); // 0-24 hours in minutes

      return email;
    });
  }

  /**
   * Stage 2.2: AI Style Profiler Node
   * Create LangChain agent for tone analysis
   */
  async createAIStyleProfiler(emailHistory: EmailHistory[]): Promise<VoiceProfile> {
    console.log(`🎤 Creating AI Style Profiler for ${emailHistory.length} emails`);

    try {
      // Prepare email samples for analysis
      const emailSamples = this.prepareEmailSamples(emailHistory);

      // Generate AI analysis prompt
      const analysisPrompt = this.buildStyleAnalysisPrompt(emailSamples);

      // Mock AI analysis result - in production, this would use OpenAI API
      const voiceProfile: VoiceProfile = {
        tone: "friendly-professional",
        averageLength: "medium",
        commonPhrases: [
          "We'll see you then!",
          "Thanks for reaching out",
          "We'd love to help you",
          "We'll get this sorted out",
          "Appreciate your patience"
        ],
        signOff: "Thanks,\nThe [Team Name] Team",
        responseStructure: "acknowledge → resolve → close",
        formalityLevel: 0.7,
        empathyLevel: 0.9,
        directnessLevel: 0.8,
        signatureConsistency: true,
        vocabulary: [
          "pool opening",
          "water chemistry",
          "team",
          "technician",
          "service",
          "swimming",
          "equipment"
        ],
        sentencePatterns: [
          "Hi [Name],",
          "Thanks for [action],",
          "We'll [action] [timeline],",
          "If you have any questions, just give us a call!"
        ],
        confidence: this.calculateVoiceConfidence(emailHistory)
      };

      // Save voice profile
      await this.saveVoiceProfile(voiceProfile);

      console.log(`✅ Voice profile created with confidence: ${voiceProfile.confidence}`);

      return voiceProfile;
    } catch (error: any) {
      console.error(`❌ AI Style Profiler failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prepare email samples for AI analysis
   */
  private prepareEmailSamples(emailHistory: EmailHistory[]): string[] {
    // Group emails by intent and sample representative ones
    const intentGroups: { [key: string]: EmailHistory[] } = {};
    
    emailHistory.forEach(email => {
      if (!intentGroups[email.intent]) {
        intentGroups[email.intent] = [];
      }
      intentGroups[email.intent].push(email);
    });

    // Sample up to 5 emails per intent
    const samples: string[] = [];
    Object.entries(intentGroups).forEach(([intent, emails]) => {
      const sorted = emails.sort((a, b) => b.wordCount - a.wordCount); // Prefer longer emails
      const sampled = sorted.slice(0, 5);
      
      sampled.forEach(email => {
        samples.push(`Intent: ${intent}\nSubject: ${email.subject}\nBody: ${email.body}\n---`);
      });
    });

    return samples.slice(0, 20); // Limit to 20 samples for analysis
  }

  /**
   * Build style analysis prompt for AI
   */
  private buildStyleAnalysisPrompt(emailSamples: string[]): string {
    return `
Analyze the following business emails to extract the company's communication style and voice profile.

Email Samples:
${emailSamples.join('\n\n')}

Please provide a comprehensive voice profile including:

1. Tone Analysis:
   - Overall tone (casual, friendly-professional, formal)
   - Formality level (0-1 scale)
   - Empathy level (0-1 scale)
   - Directness level (0-1 scale)

2. Communication Patterns:
   - Average email length (short, medium, long)
   - Common phrases and vocabulary
   - Sentence patterns and structures
   - Signature consistency

3. Response Structure:
   - Typical response flow (e.g., "acknowledge → resolve → close")
   - Common sign-off patterns
   - Greeting patterns

4. Industry-Specific Language:
   - Technical terms and jargon
   - Service-specific vocabulary
   - Customer-facing terminology

Return a JSON object with this exact structure:
{
  "tone": "string",
  "averageLength": "string",
  "commonPhrases": ["string"],
  "signOff": "string",
  "responseStructure": "string",
  "formalityLevel": 0.0-1.0,
  "empathyLevel": 0.0-1.0,
  "directnessLevel": 0.0-1.0,
  "signatureConsistency": true|false,
  "vocabulary": ["string"],
  "sentencePatterns": ["string"],
  "confidence": 0.0-1.0
}
    `;
  }

  /**
   * Calculate voice confidence based on email analysis
   */
  private calculateVoiceConfidence(emailHistory: EmailHistory[]): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on sample size
    if (emailHistory.length >= 200) confidence += 0.2;
    else if (emailHistory.length >= 100) confidence += 0.1;
    else if (emailHistory.length >= 50) confidence += 0.05;

    // Increase confidence based on consistency
    const consistentGreetings = emailHistory.filter(email => 
      email.body.toLowerCase().includes('hi ') || 
      email.body.toLowerCase().includes('hello ')
    ).length;

    const greetingConsistency = consistentGreetings / emailHistory.length;
    confidence += greetingConsistency * 0.2;

    // Increase confidence based on signature consistency
    const consistentSignatures = emailHistory.filter(email => 
      email.body.toLowerCase().includes('team') ||
      email.body.toLowerCase().includes('thanks')
    ).length;

    const signatureConsistency = consistentSignatures / emailHistory.length;
    confidence += signatureConsistency * 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Save voice profile to file
   */
  private async saveVoiceProfile(voiceProfile: VoiceProfile): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.voiceProfilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Add metadata
    const profileWithMeta = {
      ...voiceProfile,
      meta: {
        businessId: this.businessId,
        emailProvider: this.emailProvider,
        generatedAt: new Date().toISOString(),
        sampleSize: 0, // Will be updated
        version: "2.0"
      }
    };

    // Save voice profile
    fs.writeFileSync(this.voiceProfilePath, JSON.stringify(profileWithMeta, null, 2));
    
    console.log(`💾 Voice profile saved to: ${this.voiceProfilePath}`);
  }

  /**
   * Stage 2.3: Voice Profile Injection
   * Modify AI Draft node system message
   */
  generateAIDraftSystemMessage(voiceProfile: VoiceProfile, industryProfile: IndustryBehaviorProfile): string {
    return `
You are an AI assistant for {{businessName}}. Your responses must match the company's authentic communication style.

COMPANY VOICE & TONE PROFILE:
- Tone: ${voiceProfile.tone}
- Average Length: ${voiceProfile.averageLength}
- Formality Level: ${voiceProfile.formalityLevel}/1.0
- Empathy Level: ${voiceProfile.empathyLevel}/1.0
- Directness Level: ${voiceProfile.directnessLevel}/1.0
- Signature Consistency: ${voiceProfile.signatureConsistency}

COMMON PHRASES TO USE:
${voiceProfile.commonPhrases.map(phrase => `- "${phrase}"`).join('\n')}

RESPONSE STRUCTURE:
${voiceProfile.responseStructure}

SIGN-OFF PATTERN:
${voiceProfile.signOff}

VOCABULARY:
${voiceProfile.vocabulary.map(word => `- ${word}`).join('\n')}

SENTENCE PATTERNS:
${voiceProfile.sentencePatterns.map(pattern => `- ${pattern}`).join('\n')}

INDUSTRY BEHAVIOR PROFILE:
${JSON.stringify(industryProfile, null, 2)}

Write responses that sound authentically like {{businessName}}. Use their common phrases, maintain their signature style, and follow their response structure. Be helpful, professional, and match their tone exactly.
    `.trim();
  }

  /**
   * Stage 2.4: Voice Refinement Loop
   * Learn from human edits to improve voice profile
   */
  async processVoiceRefinement(aiDraft: string, humanEdit: string, emailContext: any): Promise<void> {
    console.log(`🔄 Processing voice refinement for business: ${this.businessId}`);

    try {
      // Load current voice profile
      const currentProfile = await this.loadVoiceProfile();

      // Analyze differences between AI draft and human edit
      const differences = this.analyzeDraftDifferences(aiDraft, humanEdit);

      // Update voice profile based on differences
      const updatedProfile = this.updateVoiceProfileFromEdits(currentProfile, differences);

      // Save updated voice profile
      await this.saveVoiceProfile(updatedProfile);

      console.log(`✅ Voice profile refined based on human edits`);
    } catch (error: any) {
      console.error(`❌ Voice refinement failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze differences between AI draft and human edit
   */
  private analyzeDraftDifferences(aiDraft: string, humanEdit: string): any {
    // Simple difference analysis - in production, this would use more sophisticated NLP
    const differences = {
      toneChanges: [],
      phraseChanges: [],
      structureChanges: [],
      lengthDifference: humanEdit.length - aiDraft.length,
      wordDifference: humanEdit.split(' ').length - aiDraft.split(' ').length
    };

    // Analyze tone changes
    if (humanEdit.toLowerCase().includes('sorry') && !aiDraft.toLowerCase().includes('sorry')) {
      differences.toneChanges.push('added_apology');
    }

    if (humanEdit.toLowerCase().includes('urgent') && !aiDraft.toLowerCase().includes('urgent')) {
      differences.toneChanges.push('added_urgency');
    }

    // Analyze phrase changes
    const aiPhrases = this.extractPhrases(aiDraft);
    const humanPhrases = this.extractPhrases(humanEdit);
    
    const newPhrases = humanPhrases.filter(phrase => !aiPhrases.includes(phrase));
    differences.phraseChanges = newPhrases;

    return differences;
  }

  /**
   * Extract phrases from text
   */
  private extractPhrases(text: string): string[] {
    // Simple phrase extraction - in production, this would use NLP
    const phrases: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(' ');
      if (words.length >= 3 && words.length <= 8) {
        phrases.push(words.join(' '));
      }
    });

    return phrases;
  }

  /**
   * Update voice profile based on human edits
   */
  private updateVoiceProfileFromEdits(currentProfile: VoiceProfile, differences: any): VoiceProfile {
    const updatedProfile = { ...currentProfile };

    // Update common phrases based on new phrases found in edits
    if (differences.phraseChanges.length > 0) {
      differences.phraseChanges.forEach((phrase: string) => {
        if (!updatedProfile.commonPhrases.includes(phrase)) {
          updatedProfile.commonPhrases.push(phrase);
        }
      });

      // Keep only top 20 phrases
      updatedProfile.commonPhrases = updatedProfile.commonPhrases.slice(0, 20);
    }

    // Adjust empathy level based on apology additions
    if (differences.toneChanges.includes('added_apology')) {
      updatedProfile.empathyLevel = Math.min(updatedProfile.empathyLevel + 0.05, 1.0);
    }

    // Adjust directness level based on urgency additions
    if (differences.toneChanges.includes('added_urgency')) {
      updatedProfile.directnessLevel = Math.min(updatedProfile.directnessLevel + 0.05, 1.0);
    }

    // Update confidence based on refinement
    updatedProfile.confidence = Math.min(updatedProfile.confidence + 0.01, 1.0);

    return updatedProfile;
  }

  /**
   * Stage 2.5: Industry-Aware Voice Merge
   * Combine industry behavior with voice profile
   */
  async createActiveBehaviorProfile(industryProfile: IndustryBehaviorProfile): Promise<ActiveBehaviorProfile> {
    console.log(`🧩 Creating active behavior profile for industry: ${industryProfile.industry}`);

    try {
      // Load voice profile
      const voiceProfile = await this.loadVoiceProfile();

      // Merge industry and voice profiles
      const mergedProfile = this.mergeIndustryAndVoice(industryProfile, voiceProfile);

      // Create active behavior profile
      const activeProfile: ActiveBehaviorProfile = {
        industry: industryProfile,
        voice: voiceProfile,
        merged: mergedProfile,
        lastUpdated: new Date().toISOString(),
        version: "2.0"
      };

      // Save active behavior profile
      await this.saveActiveBehaviorProfile(activeProfile);

      console.log(`✅ Active behavior profile created and saved`);

      return activeProfile;
    } catch (error: any) {
      console.error(`❌ Active behavior profile creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Merge industry behavior with voice profile
   */
  private mergeIndustryAndVoice(industryProfile: IndustryBehaviorProfile, voiceProfile: VoiceProfile): any {
    return {
      // Industry-specific rules and templates
      industryRules: industryProfile.rules,
      industryTemplates: industryProfile.templates,
      industryPhrasing: industryProfile.phrasing,
      escalationRules: industryProfile.escalationRules,

      // Voice-specific tone and style
      tone: voiceProfile.tone,
      formalityLevel: voiceProfile.formalityLevel,
      empathyLevel: voiceProfile.empathyLevel,
      directnessLevel: voiceProfile.directnessLevel,

      // Combined vocabulary (industry + voice)
      vocabulary: [
        ...voiceProfile.vocabulary,
        ...this.extractIndustryVocabulary(industryProfile)
      ],

      // Combined phrases (industry + voice)
      commonPhrases: [
        ...voiceProfile.commonPhrases,
        ...this.extractIndustryPhrases(industryProfile)
      ],

      // Response structure (industry-aware)
      responseStructure: this.createIndustryAwareResponseStructure(industryProfile, voiceProfile),

      // Signature (voice-based)
      signature: voiceProfile.signOff,

      // Confidence score
      confidence: (voiceProfile.confidence + 0.8) / 2 // Blend voice confidence with industry confidence
    };
  }

  /**
   * Extract industry-specific vocabulary
   */
  private extractIndustryVocabulary(industryProfile: IndustryBehaviorProfile): string[] {
    // Mock implementation - in production, this would extract from industry profile
    const industryVocab: { [key: string]: string[] } = {
      "Pools & Spas": ["pool opening", "water chemistry", "chemical balance", "filter maintenance"],
      "HVAC": ["heating", "cooling", "thermostat", "air quality", "maintenance"],
      "Roofing": ["shingles", "leak repair", "storm damage", "inspection", "insurance"],
      "Landscaping": ["lawn care", "irrigation", "tree trimming", "design", "maintenance"]
    };

    return industryVocab[industryProfile.industry] || [];
  }

  /**
   * Extract industry-specific phrases
   */
  private extractIndustryPhrases(industryProfile: IndustryBehaviorProfile): string[] {
    // Mock implementation - in production, this would extract from industry profile
    const industryPhrases: { [key: string]: string[] } = {
      "Pools & Spas": ["We'll get your pool ready", "Your water chemistry looks great", "Ready for swimming"],
      "HVAC": ["We'll get your system running", "Temperature should be comfortable", "Energy efficient"],
      "Roofing": ["We'll protect your home", "Storm damage assessment", "Insurance claim support"],
      "Landscaping": ["We'll transform your space", "Seasonal maintenance", "Design consultation"]
    };

    return industryPhrases[industryProfile.industry] || [];
  }

  /**
   * Create industry-aware response structure
   */
  private createIndustryAwareResponseStructure(industryProfile: IndustryBehaviorProfile, voiceProfile: VoiceProfile): string {
    const baseStructure = voiceProfile.responseStructure;
    
    // Add industry-specific elements
    const industryElements: { [key: string]: string } = {
      "Pools & Spas": "acknowledge → water care advice → timeline → safety reminder",
      "HVAC": "acknowledge → technical solution → energy tip → follow-up",
      "Roofing": "acknowledge → damage assessment → insurance guidance → timeline",
      "Landscaping": "acknowledge → design suggestion → seasonal advice → maintenance tip"
    };

    const industryStructure = industryElements[industryProfile.industry];
    return industryStructure || baseStructure;
  }

  /**
   * Save active behavior profile
   */
  private async saveActiveBehaviorProfile(activeProfile: ActiveBehaviorProfile): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.behaviorProfilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save active behavior profile
    fs.writeFileSync(this.behaviorProfilePath, JSON.stringify(activeProfile, null, 2));
    
    console.log(`💾 Active behavior profile saved to: ${this.behaviorProfilePath}`);
  }

  /**
   * Load voice profile from file
   */
  private async loadVoiceProfile(): Promise<VoiceProfile> {
    if (!fs.existsSync(this.voiceProfilePath)) {
      throw new Error('Voice profile not found');
    }

    const data = fs.readFileSync(this.voiceProfilePath, 'utf8');
    const profile = JSON.parse(data);
    
    // Remove metadata for return
    delete profile.meta;
    return profile;
  }

  /**
   * Generate n8n workflow for adaptive tone training
   */
  generateAdaptiveToneTrainingWorkflow(): any {
    return {
      name: `Adaptive Tone Training - ${this.businessId}`,
      active: true,
      nodes: [
        {
          id: "email-history-collector",
          name: "Email History Collector",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Collect 200-500 sent emails for analysis
              const businessId = '${this.businessId}';
              const emailProvider = '${this.emailProvider}';
              
              // Mock implementation - in production, this would use Gmail/Outlook API
              const emailHistory = [
                {
                  id: "email_001",
                  subject: "Re: Pool Opening Service Quote",
                  body: "Hi Sarah, thanks for reaching out about your pool opening service...",
                  sender: "john@hottubman.ca",
                  recipient: "sarah@customer.com",
                  date: "2025-01-15T10:30:00Z",
                  intent: "sales_response",
                  wordCount: 45,
                  responseTime: 120
                }
                // ... more emails
              ];
              
              return emailHistory.map(email => ({ json: email }));
            `
          }
        },
        {
          id: "ai-style-profiler",
          name: "AI Style Profiler",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          parameters: {
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: {
              values: [
                {
                  role: "system",
                  content: `
                    Analyze the provided business emails to extract the company's communication style and voice profile.
                    
                    Return a JSON object with:
                    - tone: overall communication tone
                    - averageLength: short/medium/long
                    - commonPhrases: array of frequently used phrases
                    - signOff: common sign-off pattern
                    - responseStructure: typical response flow
                    - formalityLevel: 0-1 scale
                    - empathyLevel: 0-1 scale
                    - directnessLevel: 0-1 scale
                    - signatureConsistency: boolean
                    - vocabulary: array of common words
                    - sentencePatterns: array of sentence structures
                    - confidence: 0-1 scale
                  `
                },
                {
                  role: "user",
                  content: "{{ $json.body }}"
                }
              ]
            }
          }
        },
        {
          id: "voice-profile-generator",
          name: "Voice Profile Generator",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Generate voice profile from AI analysis
              const aiResponse = $json.choices[0].message.content;
              const voiceProfile = JSON.parse(aiResponse);
              
              // Add metadata
              voiceProfile.meta = {
                businessId: '${this.businessId}',
                emailProvider: '${this.emailProvider}',
                generatedAt: new Date().toISOString(),
                version: "2.0"
              };
              
              return {
                json: {
                  voiceProfile: voiceProfile,
                  businessId: '${this.businessId}',
                  generated: true
                }
              };
            `
          }
        },
        {
          id: "industry-voice-merger",
          name: "Industry-Voice Merger",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Merge industry behavior with voice profile
              const voiceProfile = $json.voiceProfile;
              const industryProfile = $('load-industry-profile').first().json;
              
              const activeBehaviorProfile = {
                industry: industryProfile,
                voice: voiceProfile,
                merged: {
                  industryRules: industryProfile.rules,
                  tone: voiceProfile.tone,
                  vocabulary: [...voiceProfile.vocabulary, ...industryProfile.vocabulary],
                  commonPhrases: [...voiceProfile.commonPhrases, ...industryProfile.phrases],
                  responseStructure: voiceProfile.responseStructure,
                  signature: voiceProfile.signOff,
                  confidence: (voiceProfile.confidence + 0.8) / 2
                },
                lastUpdated: new Date().toISOString(),
                version: "2.0"
              };
              
              return {
                json: {
                  activeBehaviorProfile: activeBehaviorProfile,
                  businessId: '${this.businessId}',
                  merged: true
                }
              };
            `
          }
        },
        {
          id: "ai-draft-system-prompt",
          name: "AI Draft System Prompt Generator",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Generate AI system prompt with voice profile
              const activeProfile = $json.activeBehaviorProfile;
              const voiceProfile = activeProfile.voice;
              const mergedProfile = activeProfile.merged;
              
              const systemPrompt = \`
You are an AI assistant for {{businessName}}. Your responses must match the company's authentic communication style.

COMPANY VOICE & TONE PROFILE:
- Tone: \${voiceProfile.tone}
- Average Length: \${voiceProfile.averageLength}
- Formality Level: \${voiceProfile.formalityLevel}/1.0
- Empathy Level: \${voiceProfile.empathyLevel}/1.0
- Directness Level: \${voiceProfile.directnessLevel}/1.0

COMMON PHRASES TO USE:
\${voiceProfile.commonPhrases.map(phrase => \`- "\${phrase}"\`).join('\\n')}

RESPONSE STRUCTURE:
\${voiceProfile.responseStructure}

SIGN-OFF PATTERN:
\${voiceProfile.signOff}

INDUSTRY BEHAVIOR:
\${JSON.stringify(mergedProfile, null, 2)}

Write responses that sound authentically like {{businessName}}. Use their common phrases, maintain their signature style, and follow their response structure.
              \`.trim();
              
              return {
                json: {
                  systemPrompt: systemPrompt,
                  voiceProfile: voiceProfile,
                  activeProfile: activeProfile,
                  businessId: '${this.businessId}',
                  promptGenerated: true
                }
              };
            `
          }
        }
      ],
      connections: {
        "email-history-collector": {
          "main": [["ai-style-profiler"]]
        },
        "ai-style-profiler": {
          "main": [["voice-profile-generator"]]
        },
        "voice-profile-generator": {
          "main": [["industry-voice-merger"]]
        },
        "industry-voice-merger": {
          "main": [["ai-draft-system-prompt"]]
        }
      }
    };
  }
}

export default AdaptiveToneTrainingSystem;
