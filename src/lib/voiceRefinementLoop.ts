// Voice Refinement Loop - Learning from Human Edits
// This module implements continuous learning from human edits to improve voice profiles

import fs from 'fs';
import path from 'path';

interface DraftComparison {
  aiDraft: string;
  humanEdit: string;
  emailContext: {
    subject: string;
    recipient: string;
    intent: string;
    category: string;
  };
  timestamp: string;
  businessId: string;
}

interface VoiceRefinementData {
  totalEdits: number;
  averageEditRatio: number;
  commonChanges: {
    toneAdjustments: string[];
    phraseAdditions: string[];
    structureChanges: string[];
  };
  learningPatterns: {
    empathyAdjustments: number;
    directnessAdjustments: number;
    formalityAdjustments: number;
  };
  confidenceImprovement: number;
}

interface RefinedVoiceProfile {
  tone: string;
  averageLength: string;
  commonPhrases: string[];
  signOff: string;
  responseStructure: string;
  formalityLevel: number;
  empathyLevel: number;
  directnessLevel: number;
  signatureConsistency: boolean;
  vocabulary: string[];
  sentencePatterns: string[];
  confidence: number;
  refinementHistory: VoiceRefinementData;
}

class VoiceRefinementLoop {
  private businessId: string;
  private refinementDataPath: string;
  private voiceProfilePath: string;
  private learningThreshold: number = 10; // Minimum edits before applying learning

  constructor(businessId: string) {
    this.businessId = businessId;
    this.refinementDataPath = `jsons/refinement/${businessId}_refinement_data.json`;
    this.voiceProfilePath = `jsons/voice/${businessId}_voice_profile.json`;
  }

  /**
   * Process a single draft comparison and update voice profile
   */
  async processDraftComparison(comparison: DraftComparison): Promise<void> {
    console.log(`🔄 Processing draft comparison for business: ${this.businessId}`);

    try {
      // Load existing refinement data
      const refinementData = await this.loadRefinementData();

      // Analyze the draft comparison
      const analysis = this.analyzeDraftComparison(comparison);

      // Add to refinement data
      refinementData.totalEdits += 1;
      refinementData.averageEditRatio = this.calculateAverageEditRatio(refinementData, analysis);

      // Update learning patterns
      this.updateLearningPatterns(refinementData, analysis);

      // Save updated refinement data
      await this.saveRefinementData(refinementData);

      // Check if we have enough data to refine voice profile
      if (refinementData.totalEdits >= this.learningThreshold) {
        await this.refineVoiceProfile(refinementData);
      }

      console.log(`✅ Draft comparison processed. Total edits: ${refinementData.totalEdits}`);
    } catch (error: any) {
      console.error(`❌ Draft comparison processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze differences between AI draft and human edit
   */
  private analyzeDraftComparison(comparison: DraftComparison): any {
    const aiDraft = comparison.aiDraft;
    const humanEdit = comparison.humanEdit;

    const analysis = {
      lengthDifference: humanEdit.length - aiDraft.length,
      wordDifference: humanEdit.split(' ').length - aiDraft.split(' ').length,
      editRatio: humanEdit.length / aiDraft.length,
      
      toneChanges: this.detectToneChanges(aiDraft, humanEdit),
      phraseChanges: this.detectPhraseChanges(aiDraft, humanEdit),
      structureChanges: this.detectStructureChanges(aiDraft, humanEdit),
      
      empathyAdjustment: this.calculateEmpathyAdjustment(aiDraft, humanEdit),
      directnessAdjustment: this.calculateDirectnessAdjustment(aiDraft, humanEdit),
      formalityAdjustment: this.calculateFormalityAdjustment(aiDraft, humanEdit),
      
      newVocabulary: this.extractNewVocabulary(aiDraft, humanEdit),
      newPhrases: this.extractNewPhrases(aiDraft, humanEdit),
      newPatterns: this.extractNewPatterns(aiDraft, humanEdit)
    };

    return analysis;
  }

  /**
   * Detect tone changes between AI draft and human edit
   */
  private detectToneChanges(aiDraft: string, humanEdit: string): string[] {
    const changes: string[] = [];
    const aiLower = aiDraft.toLowerCase();
    const humanLower = humanEdit.toLowerCase();

    // Check for apology additions
    if (humanLower.includes('sorry') && !aiLower.includes('sorry')) {
      changes.push('added_apology');
    }

    // Check for urgency additions
    if (humanLower.includes('urgent') && !aiLower.includes('urgent')) {
      changes.push('added_urgency');
    }

    // Check for enthusiasm additions
    if (humanLower.includes('excited') && !aiLower.includes('excited')) {
      changes.push('added_enthusiasm');
    }

    // Check for formality changes
    if (humanLower.includes('please') && !aiLower.includes('please')) {
      changes.push('increased_formality');
    }

    // Check for casualness additions
    if (humanLower.includes('no worries') && !aiLower.includes('no worries')) {
      changes.push('added_casualness');
    }

    return changes;
  }

  /**
   * Detect phrase changes between AI draft and human edit
   */
  private detectPhraseChanges(aiDraft: string, humanEdit: string): string[] {
    const aiPhrases = this.extractPhrases(aiDraft);
    const humanPhrases = this.extractPhrases(humanEdit);
    
    return humanPhrases.filter(phrase => !aiPhrases.includes(phrase));
  }

  /**
   * Detect structure changes between AI draft and human edit
   */
  private detectStructureChanges(aiDraft: string, humanEdit: string): string[] {
    const changes: string[] = [];

    // Check for greeting changes
    const aiGreeting = this.extractGreeting(aiDraft);
    const humanGreeting = this.extractGreeting(humanEdit);
    if (aiGreeting !== humanGreeting) {
      changes.push('greeting_change');
    }

    // Check for closing changes
    const aiClosing = this.extractClosing(aiDraft);
    const humanClosing = this.extractClosing(humanEdit);
    if (aiClosing !== humanClosing) {
      changes.push('closing_change');
    }

    // Check for paragraph structure changes
    const aiParagraphs = aiDraft.split('\n\n').length;
    const humanParagraphs = humanEdit.split('\n\n').length;
    if (aiParagraphs !== humanParagraphs) {
      changes.push('paragraph_structure_change');
    }

    return changes;
  }

  /**
   * Calculate empathy adjustment
   */
  private calculateEmpathyAdjustment(aiDraft: string, humanEdit: string): number {
    const empathyWords = ['sorry', 'understand', 'frustrating', 'apologize', 'empathize', 'feel'];
    
    const aiEmpathyCount = empathyWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const humanEmpathyCount = empathyWords.reduce((count, word) => 
      count + (humanEdit.toLowerCase().split(word).length - 1), 0);

    return humanEmpathyCount - aiEmpathyCount;
  }

  /**
   * Calculate directness adjustment
   */
  private calculateDirectnessAdjustment(aiDraft: string, humanEdit: string): number {
    const directWords = ['urgent', 'immediately', 'asap', 'critical', 'important', 'priority'];
    
    const aiDirectCount = directWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const humanDirectCount = directWords.reduce((count, word) => 
      count + (humanEdit.toLowerCase().split(word).length - 1), 0);

    return humanDirectCount - aiDirectCount;
  }

  /**
   * Calculate formality adjustment
   */
  private calculateFormalityAdjustment(aiDraft: string, humanEdit: string): number {
    const formalWords = ['please', 'thank you', 'appreciate', 'sincerely', 'respectfully'];
    const casualWords = ['hey', 'thanks', 'no worries', 'cool', 'awesome'];
    
    const aiFormalCount = formalWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const humanFormalCount = formalWords.reduce((count, word) => 
      count + (humanEdit.toLowerCase().split(word).length - 1), 0);

    const aiCasualCount = casualWords.reduce((count, word) => 
      count + (aiDraft.toLowerCase().split(word).length - 1), 0);
    const humanCasualCount = casualWords.reduce((count, word) => 
      count + (humanEdit.toLowerCase().split(word).length - 1), 0);

    return (humanFormalCount - aiFormalCount) - (humanCasualCount - aiCasualCount);
  }

  /**
   * Extract new vocabulary from human edit
   */
  private extractNewVocabulary(aiDraft: string, humanEdit: string): string[] {
    const aiWords = new Set(aiDraft.toLowerCase().split(/\s+/));
    const humanWords = humanEdit.toLowerCase().split(/\s+/);
    
    return humanWords.filter(word => 
      word.length > 3 && 
      !aiWords.has(word) && 
      /^[a-zA-Z]+$/.test(word)
    );
  }

  /**
   * Extract new phrases from human edit
   */
  private extractNewPhrases(aiDraft: string, humanEdit: string): string[] {
    const aiPhrases = this.extractPhrases(aiDraft);
    const humanPhrases = this.extractPhrases(humanEdit);
    
    return humanPhrases.filter(phrase => 
      phrase.length > 10 && 
      !aiPhrases.includes(phrase)
    );
  }

  /**
   * Extract new sentence patterns from human edit
   */
  private extractNewPatterns(aiDraft: string, humanEdit: string): string[] {
    const aiPatterns = this.extractSentencePatterns(aiDraft);
    const humanPatterns = this.extractSentencePatterns(humanEdit);
    
    return humanPatterns.filter(pattern => !aiPatterns.includes(pattern));
  }

  /**
   * Extract phrases from text
   */
  private extractPhrases(text: string): string[] {
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
   * Extract greeting from text
   */
  private extractGreeting(text: string): string {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim() || '';
    
    if (firstLine.match(/^(hi|hello|dear|good morning|good afternoon)/i)) {
      return firstLine;
    }
    
    return '';
  }

  /**
   * Extract closing from text
   */
  private extractClosing(text: string): string {
    const lines = text.split('\n');
    const lastLines = lines.slice(-3).join('\n').trim();
    
    if (lastLines.match(/(thanks|thank you|best|regards|sincerely)/i)) {
      return lastLines;
    }
    
    return '';
  }

  /**
   * Extract sentence patterns from text
   */
  private extractSentencePatterns(text: string): string[] {
    const patterns: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(' ');
      if (words.length >= 2) {
        // Extract pattern based on first few words
        const pattern = words.slice(0, 3).join(' ').toLowerCase();
        if (pattern.length > 5) {
          patterns.push(pattern);
        }
      }
    });

    return [...new Set(patterns)]; // Remove duplicates
  }

  /**
   * Calculate average edit ratio
   */
  private calculateAverageEditRatio(refinementData: VoiceRefinementData, analysis: any): number {
    const totalRatio = refinementData.averageEditRatio * (refinementData.totalEdits - 1) + analysis.editRatio;
    return totalRatio / refinementData.totalEdits;
  }

  /**
   * Update learning patterns based on analysis
   */
  private updateLearningPatterns(refinementData: VoiceRefinementData, analysis: any): void {
    // Update empathy adjustments
    refinementData.learningPatterns.empathyAdjustments += analysis.empathyAdjustment;

    // Update directness adjustments
    refinementData.learningPatterns.directnessAdjustments += analysis.directnessAdjustment;

    // Update formality adjustments
    refinementData.learningPatterns.formalityAdjustments += analysis.formalityAdjustment;

    // Update common changes
    analysis.toneChanges.forEach((change: string) => {
      if (!refinementData.commonChanges.toneAdjustments.includes(change)) {
        refinementData.commonChanges.toneAdjustments.push(change);
      }
    });

    analysis.phraseChanges.forEach((phrase: string) => {
      if (!refinementData.commonChanges.phraseAdditions.includes(phrase)) {
        refinementData.commonChanges.phraseAdditions.push(phrase);
      }
    });

    analysis.structureChanges.forEach((change: string) => {
      if (!refinementData.commonChanges.structureChanges.includes(change)) {
        refinementData.commonChanges.structureChanges.push(change);
      }
    });
  }

  /**
   * Refine voice profile based on accumulated learning data
   */
  private async refineVoiceProfile(refinementData: VoiceRefinementData): Promise<void> {
    console.log(`🎯 Refining voice profile based on ${refinementData.totalEdits} edits`);

    try {
      // Load current voice profile
      const currentProfile = await this.loadVoiceProfile();

      // Calculate adjustments based on learning patterns
      const adjustments = this.calculateVoiceAdjustments(refinementData);

      // Apply adjustments to voice profile
      const refinedProfile = this.applyVoiceAdjustments(currentProfile, adjustments);

      // Update confidence based on learning
      refinedProfile.confidence = Math.min(refinedProfile.confidence + 0.05, 1.0);

      // Add refinement history
      refinedProfile.refinementHistory = refinementData;

      // Save refined voice profile
      await this.saveVoiceProfile(refinedProfile);

      console.log(`✅ Voice profile refined successfully`);
    } catch (error: any) {
      console.error(`❌ Voice profile refinement failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate voice adjustments based on learning patterns
   */
  private calculateVoiceAdjustments(refinementData: VoiceRefinementData): any {
    const totalEdits = refinementData.totalEdits;
    
    return {
      empathyAdjustment: refinementData.learningPatterns.empathyAdjustments / totalEdits,
      directnessAdjustment: refinementData.learningPatterns.directnessAdjustments / totalEdits,
      formalityAdjustment: refinementData.learningPatterns.formalityAdjustments / totalEdits,
      
      newPhrases: refinementData.commonChanges.phraseAdditions.slice(0, 10), // Top 10
      newPatterns: refinementData.commonChanges.structureChanges,
      
      averageEditRatio: refinementData.averageEditRatio
    };
  }

  /**
   * Apply voice adjustments to current profile
   */
  private applyVoiceAdjustments(currentProfile: any, adjustments: any): RefinedVoiceProfile {
    const refinedProfile = { ...currentProfile };

    // Adjust empathy level
    refinedProfile.empathyLevel = Math.max(0, Math.min(1, 
      refinedProfile.empathyLevel + (adjustments.empathyAdjustment * 0.1)
    ));

    // Adjust directness level
    refinedProfile.directnessLevel = Math.max(0, Math.min(1, 
      refinedProfile.directnessLevel + (adjustments.directnessAdjustment * 0.1)
    ));

    // Adjust formality level
    refinedProfile.formalityLevel = Math.max(0, Math.min(1, 
      refinedProfile.formalityLevel + (adjustments.formalityAdjustment * 0.1)
    ));

    // Add new phrases
    adjustments.newPhrases.forEach((phrase: string) => {
      if (!refinedProfile.commonPhrases.includes(phrase)) {
        refinedProfile.commonPhrases.push(phrase);
      }
    });

    // Keep only top 20 phrases
    refinedProfile.commonPhrases = refinedProfile.commonPhrases.slice(0, 20);

    // Update average length based on edit ratio
    if (adjustments.averageEditRatio > 1.2) {
      refinedProfile.averageLength = "long";
    } else if (adjustments.averageEditRatio < 0.8) {
      refinedProfile.averageLength = "short";
    } else {
      refinedProfile.averageLength = "medium";
    }

    return refinedProfile;
  }

  /**
   * Load refinement data from file
   */
  private async loadRefinementData(): Promise<VoiceRefinementData> {
    if (fs.existsSync(this.refinementDataPath)) {
      const data = fs.readFileSync(this.refinementDataPath, 'utf8');
      return JSON.parse(data);
    }

    // Return default refinement data
    return {
      totalEdits: 0,
      averageEditRatio: 1.0,
      commonChanges: {
        toneAdjustments: [],
        phraseAdditions: [],
        structureChanges: []
      },
      learningPatterns: {
        empathyAdjustments: 0,
        directnessAdjustments: 0,
        formalityAdjustments: 0
      },
      confidenceImprovement: 0
    };
  }

  /**
   * Save refinement data to file
   */
  private async saveRefinementData(refinementData: VoiceRefinementData): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.refinementDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save refinement data
    fs.writeFileSync(this.refinementDataPath, JSON.stringify(refinementData, null, 2));
  }

  /**
   * Load voice profile from file
   */
  private async loadVoiceProfile(): Promise<any> {
    if (!fs.existsSync(this.voiceProfilePath)) {
      throw new Error('Voice profile not found');
    }

    const data = fs.readFileSync(this.voiceProfilePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Save voice profile to file
   */
  private async saveVoiceProfile(voiceProfile: RefinedVoiceProfile): Promise<void> {
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
        lastRefined: new Date().toISOString(),
        totalRefinements: voiceProfile.refinementHistory?.totalEdits || 0,
        version: "2.1"
      }
    };

    // Save voice profile
    fs.writeFileSync(this.voiceProfilePath, JSON.stringify(profileWithMeta, null, 2));
  }

  /**
   * Generate n8n workflow for voice refinement loop
   */
  generateVoiceRefinementWorkflow(): any {
    return {
      name: `Voice Refinement Loop - ${this.businessId}`,
      active: true,
      nodes: [
        {
          id: "draft-comparison-trigger",
          name: "Draft Comparison Trigger",
          type: "n8n-nodes-base.webhook",
          parameters: {
            httpMethod: "POST",
            path: "voice-refinement"
          }
        },
        {
          id: "analyze-draft-differences",
          name: "Analyze Draft Differences",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Analyze differences between AI draft and human edit
              const aiDraft = $json.aiDraft;
              const humanEdit = $json.humanEdit;
              
              const analysis = {
                lengthDifference: humanEdit.length - aiDraft.length,
                wordDifference: humanEdit.split(' ').length - aiDraft.split(' ').length,
                editRatio: humanEdit.length / aiDraft.length,
                
                toneChanges: [],
                phraseChanges: [],
                structureChanges: [],
                
                empathyAdjustment: 0,
                directnessAdjustment: 0,
                formalityAdjustment: 0,
                
                newVocabulary: [],
                newPhrases: [],
                newPatterns: []
              };
              
              // Detect tone changes
              const aiLower = aiDraft.toLowerCase();
              const humanLower = humanEdit.toLowerCase();
              
              if (humanLower.includes('sorry') && !aiLower.includes('sorry')) {
                analysis.toneChanges.push('added_apology');
                analysis.empathyAdjustment += 1;
              }
              
              if (humanLower.includes('urgent') && !aiLower.includes('urgent')) {
                analysis.toneChanges.push('added_urgency');
                analysis.directnessAdjustment += 1;
              }
              
              if (humanLower.includes('please') && !aiLower.includes('please')) {
                analysis.toneChanges.push('increased_formality');
                analysis.formalityAdjustment += 1;
              }
              
              return {
                json: {
                  analysis: analysis,
                  businessId: '${this.businessId}',
                  timestamp: new Date().toISOString()
                }
              };
            `
          }
        },
        {
          id: "update-refinement-data",
          name: "Update Refinement Data",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Update refinement data with new analysis
              const analysis = $json.analysis;
              const businessId = '${this.businessId}';
              
              // Load existing refinement data
              const refinementDataPath = \`jsons/refinement/\${businessId}_refinement_data.json\`;
              let refinementData = {
                totalEdits: 0,
                averageEditRatio: 1.0,
                commonChanges: {
                  toneAdjustments: [],
                  phraseAdditions: [],
                  structureChanges: []
                },
                learningPatterns: {
                  empathyAdjustments: 0,
                  directnessAdjustments: 0,
                  formalityAdjustments: 0
                },
                confidenceImprovement: 0
              };
              
              try {
                const existingData = $fs.readFileSync(refinementDataPath, 'utf8');
                refinementData = JSON.parse(existingData);
              } catch (error) {
                console.log('Creating new refinement data');
              }
              
              // Update refinement data
              refinementData.totalEdits += 1;
              refinementData.averageEditRatio = (refinementData.averageEditRatio * (refinementData.totalEdits - 1) + analysis.editRatio) / refinementData.totalEdits;
              
              refinementData.learningPatterns.empathyAdjustments += analysis.empathyAdjustment;
              refinementData.learningPatterns.directnessAdjustments += analysis.directnessAdjustment;
              refinementData.learningPatterns.formalityAdjustments += analysis.formalityAdjustment;
              
              // Add new tone adjustments
              analysis.toneChanges.forEach(change => {
                if (!refinementData.commonChanges.toneAdjustments.includes(change)) {
                  refinementData.commonChanges.toneAdjustments.push(change);
                }
              });
              
              // Save updated refinement data
              $fs.writeFileSync(refinementDataPath, JSON.stringify(refinementData, null, 2));
              
              return {
                json: {
                  refinementData: refinementData,
                  businessId: businessId,
                  updated: true
                }
              };
            `
          }
        },
        {
          id: "check-refinement-threshold",
          name: "Check Refinement Threshold",
          type: "n8n-nodes-base.if",
          parameters: {
            conditions: {
              number: [
                {
                  value1: "={{ $json.refinementData.totalEdits }}",
                  operation: "largerEqual",
                  value2: 10
                }
              ]
            }
          }
        },
        {
          id: "refine-voice-profile",
          name: "Refine Voice Profile",
          type: "n8n-nodes-base.code",
          parameters: {
            jsCode: `
              // Refine voice profile based on accumulated learning
              const refinementData = $json.refinementData;
              const businessId = '${this.businessId}';
              
              // Load current voice profile
              const voiceProfilePath = \`jsons/voice/\${businessId}_voice_profile.json\`;
              const currentProfile = JSON.parse($fs.readFileSync(voiceProfilePath, 'utf8'));
              
              // Calculate adjustments
              const totalEdits = refinementData.totalEdits;
              const adjustments = {
                empathyAdjustment: refinementData.learningPatterns.empathyAdjustments / totalEdits,
                directnessAdjustment: refinementData.learningPatterns.directnessAdjustments / totalEdits,
                formalityAdjustment: refinementData.learningPatterns.formalityAdjustments / totalEdits
              };
              
              // Apply adjustments
              const refinedProfile = { ...currentProfile };
              
              refinedProfile.empathyLevel = Math.max(0, Math.min(1, 
                refinedProfile.empathyLevel + (adjustments.empathyAdjustment * 0.1)
              ));
              
              refinedProfile.directnessLevel = Math.max(0, Math.min(1, 
                refinedProfile.directnessLevel + (adjustments.directnessAdjustment * 0.1)
              ));
              
              refinedProfile.formalityLevel = Math.max(0, Math.min(1, 
                refinedProfile.formalityLevel + (adjustments.formalityAdjustment * 0.1)
              ));
              
              refinedProfile.confidence = Math.min(refinedProfile.confidence + 0.05, 1.0);
              refinedProfile.refinementHistory = refinementData;
              
              // Save refined voice profile
              $fs.writeFileSync(voiceProfilePath, JSON.stringify(refinedProfile, null, 2));
              
              return {
                json: {
                  refinedProfile: refinedProfile,
                  businessId: businessId,
                  refined: true,
                  totalEdits: totalEdits
                }
              };
            `
          }
        }
      ],
      connections: {
        "draft-comparison-trigger": {
          "main": [["analyze-draft-differences"]]
        },
        "analyze-draft-differences": {
          "main": [["update-refinement-data"]]
        },
        "update-refinement-data": {
          "main": [["check-refinement-threshold"]]
        },
        "check-refinement-threshold": {
          "main": [
            ["refine-voice-profile"],
            []
          ]
        }
      }
    };
  }
}

export default VoiceRefinementLoop;
