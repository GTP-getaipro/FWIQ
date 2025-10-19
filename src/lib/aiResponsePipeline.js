import { supabase } from './customSupabaseClient';
import { EmailClassifier } from './emailClassifier';
import { StyleAwareAI } from './styleAwareAI';
import { BusinessRulesEngine } from './businessRules';
import { EscalationEngine } from './escalationEngine';

export class AIResponsePipeline {
  constructor() {
    this.emailClassifier = new EmailClassifier();
    this.styleAwareAI = new StyleAwareAI();
    this.businessRules = new BusinessRulesEngine();
    this.escalationEngine = new EscalationEngine();
  }

  async processEmail(emailData, businessContext, userId) {
    try {
      console.log(`AI Pipeline: Processing email from ${emailData.from}`);
      
      // 1. Classify email using our existing classifier
      const classification = await this.emailClassifier.classify(emailData);
      console.log('AI Pipeline: Email classified:', classification);
      
      // 2. Evaluate business rules
      const triggeredRules = await this.businessRules.evaluateRules(
        emailData, 
        userId, 
        { classification }
      );
      console.log('AI Pipeline: Business rules evaluated:', triggeredRules);
      
      // 3. Generate AI response using style-aware AI
      const aiResponse = await this.styleAwareAI.generateResponseWithCategory(
        userId,
        emailData,
        classification.category,
        businessContext
      );
      console.log('AI Pipeline: AI response generated:', aiResponse.success);
      
      // 4. Apply response templates and formatting
      const finalResponse = await this.applyTemplates(aiResponse.response, businessContext, userId);
      
      // 5. Process escalations if needed
      let escalationResult = null;
      if (triggeredRules.length > 0) {
        escalationResult = await this.escalationEngine.processEscalation(
          emailData,
          userId,
          classification,
          { action: 'auto_reply', priority: Math.max(...triggeredRules.map(r => r.priority)) }
        );
      }
      
      // 6. Store complete processing result
      const processingResult = await this.storeProcessingResult(userId, emailData, {
        classification,
        aiResponse,
        finalResponse,
        triggeredRules,
        escalationResult,
        confidence: classification.confidence || aiResponse.confidence || 75
      });
      
      return {
        success: true,
        classification,
        aiResponse: aiResponse.response,
        finalResponse,
        styleApplied: aiResponse.styleApplied,
        confidence: classification.confidence || aiResponse.confidence || 75,
        triggeredRules,
        escalationResult,
        processingId: processingResult.id,
        pipeline: 'complete'
      };

    } catch (error) {
      console.error('AI response pipeline failed:', error);
      
      // Store error for debugging
      await this.storeProcessingError(userId, emailData, error);
      
      // Return fallback response
      return this.generateFallbackResponse(emailData, businessContext, error);
    }
  }

  async applyTemplates(response, businessContext, userId) {
    try {
      // Get response templates for the user
      const { data: templates } = await supabase
        .from('response_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (!templates || templates.length === 0) {
        console.log('AI Pipeline: No templates found, using response as-is');
        return response;
      }

      // Find the most appropriate template
      const applicableTemplate = this.findBestTemplate(templates, businessContext);
      
      if (!applicableTemplate) {
        return response;
      }

      // Apply template formatting
      const formattedResponse = this.applyTemplate(response, applicableTemplate, businessContext);
      
      console.log('AI Pipeline: Template applied successfully');
      return formattedResponse;

    } catch (error) {
      console.error('Template application failed:', error);
      return response; // Return original response on template error
    }
  }

  findBestTemplate(templates, businessContext) {
    // Look for default template first
    let defaultTemplate = templates.find(t => t.name === 'Default' || t.category === 'general');
    
    // Look for category-specific template
    const categoryTemplate = templates.find(t => 
      t.category === businessContext.category || 
      t.name.toLowerCase().includes(businessContext.category?.toLowerCase())
    );
    
    // Return category-specific template if available, otherwise default
    return categoryTemplate || defaultTemplate || templates[0];
  }

  applyTemplate(response, template, businessContext) {
    try {
      let formattedResponse = template.body_template || template.template_content || '{response}';
      
      // Replace template variables
      const replacements = {
        '{response}': response,
        '{{response}}': response,
        '{business_name}': businessContext.businessName || 'Our Business',
        '{{business_name}}': businessContext.businessName || 'Our Business',
        '{business_phone}': businessContext.phone || '',
        '{{business_phone}}': businessContext.phone || '',
        '{business_email}': businessContext.email || '',
        '{{business_email}}': businessContext.email || '',
        '{business_type}': businessContext.businessType || 'Service Business',
        '{{business_type}}': businessContext.businessType || 'Service Business',
        '{date}': new Date().toLocaleDateString(),
        '{{date}}': new Date().toLocaleDateString(),
        '{time}': new Date().toLocaleTimeString(),
        '{{time}}': new Date().toLocaleTimeString()
      };

      // Apply all replacements
      Object.entries(replacements).forEach(([placeholder, value]) => {
        formattedResponse = formattedResponse.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      });

      return formattedResponse;

    } catch (error) {
      console.error('Template formatting failed:', error);
      return response;
    }
  }

  async storeProcessingResult(userId, emailData, result) {
    try {
      // Store in ai_responses table
      const { data: aiResponseRecord, error: aiError } = await supabase
        .from('ai_responses')
        .insert({
          user_id: userId,
          email_id: emailData.id || 'pipeline_' + Date.now(),
          category: result.classification.category || 'general',
          urgency: result.classification.urgency || 'normal',
          ai_response: result.aiResponse,
          final_response: result.finalResponse,
          style_applied: result.aiResponse?.styleApplied || false,
          confidence: result.confidence,
          response_type: 'pipeline_generated',
          status: 'generated',
          metadata: {
            classification: result.classification,
            triggered_rules: result.triggeredRules,
            escalation_result: result.escalationResult,
            pipeline_version: '1.0'
          }
        })
        .select('id')
        .single();

      if (aiError) {
        console.error('Failed to store AI response:', aiError);
      }

      // Store in email_logs table for audit trail
      const { data: logRecord, error: logError } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: emailData.subject,
          category: result.classification.category || 'general',
          urgency: result.classification.urgency || 'normal',
          response_sent: false,
          escalated: result.escalationResult?.escalated || false,
          escalation_reason: result.escalationResult?.triggeredRules?.map(r => r.condition).join(', '),
          processing_completed: true,
          metadata: {
            ai_response_id: aiResponseRecord?.id,
            confidence: result.confidence,
            style_applied: result.aiResponse?.styleApplied,
            pipeline_processed: true
          }
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Failed to store email log:', logError);
      }

      return aiResponseRecord || logRecord || { id: 'fallback_' + Date.now() };

    } catch (error) {
      console.error('Failed to store processing result:', error);
      return { id: 'error_' + Date.now() };
    }
  }

  async storeProcessingError(userId, emailData, error) {
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from || 'unknown',
          email_subject: emailData.subject || 'No subject',
          category: 'pipeline_error',
          urgency: 'normal',
          processing_completed: false,
          error_message: error.message,
          metadata: {
            error_type: 'ai_pipeline_error',
            error_stack: error.stack,
            pipeline_version: '1.0'
          }
        });

    } catch (logError) {
      console.error('Failed to log pipeline error:', logError);
    }
  }

  generateFallbackResponse(emailData, businessContext, error) {
    const fallbackResponse = `Thank you for your email. We have received your message and will respond promptly.

If this is urgent, please contact us directly at ${businessContext.phone || 'our main number'}.

Best regards,
${businessContext.businessName || 'Our Team'}`;

    return {
      success: false,
      classification: { category: 'general', urgency: 'normal', confidence: 25 },
      aiResponse: fallbackResponse,
      finalResponse: fallbackResponse,
      styleApplied: false,
      confidence: 25,
      triggeredRules: [],
      escalationResult: null,
      error: error.message,
      pipeline: 'fallback'
    };
  }

  // Batch processing for multiple emails
  async processBatch(emails, businessContext, userId) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.processEmail(email, businessContext, userId);
        results.push({
          emailId: email.id,
          success: true,
          result
        });
      } catch (error) {
        console.error(`Failed to process email ${email.id} in pipeline:`, error);
        results.push({
          emailId: email.id,
          success: false,
          error: error.message,
          result: this.generateFallbackResponse(email, businessContext, error)
        });
      }
    }

    return results;
  }

  // Get processing history
  async getResponseHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_responses')
        .select(`
          id,
          email_id,
          category,
          urgency,
          ai_response,
          final_response,
          style_applied,
          confidence,
          response_type,
          status,
          created_at,
          metadata
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch response history:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Failed to get response history:', error);
      return [];
    }
  }

  // Update response status (e.g., when sent, approved, etc.)
  async updateResponseStatus(responseId, status, metadata = {}) {
    try {
      const { error } = await supabase
        .from('ai_responses')
        .update({ 
          status,
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', responseId);

      if (error) {
        console.error('Failed to update response status:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Failed to update response status:', error);
      return false;
    }
  }

  // Get pipeline statistics
  async getPipelineStats(userId, timeframe = '24h') {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data: responses, error } = await supabase
        .from('ai_responses')
        .select('category, urgency, confidence, style_applied, response_type, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', since);

      if (error) throw error;

      const stats = {
        total: responses.length,
        byCategory: {},
        byUrgency: {},
        byStatus: {},
        averageConfidence: 0,
        styleAppliedCount: 0,
        pipelineTypes: {}
      };

      let totalConfidence = 0;

      responses.forEach(response => {
        // Count by category
        stats.byCategory[response.category] = (stats.byCategory[response.category] || 0) + 1;
        
        // Count by urgency
        stats.byUrgency[response.urgency] = (stats.byUrgency[response.urgency] || 0) + 1;
        
        // Count by status
        stats.byStatus[response.status] = (stats.byStatus[response.status] || 0) + 1;
        
        // Count by response type
        stats.pipelineTypes[response.response_type] = (stats.pipelineTypes[response.response_type] || 0) + 1;
        
        // Count style applications
        if (response.style_applied) {
          stats.styleAppliedCount++;
        }
        
        // Sum confidence for average
        totalConfidence += response.confidence || 0;
      });

      stats.averageConfidence = responses.length > 0 ? totalConfidence / responses.length : 0;

      return stats;

    } catch (error) {
      console.error('Failed to get pipeline stats:', error);
      return null;
    }
  }

  // Validate pipeline configuration
  async validatePipelineConfig(userId) {
    const validation = {
      valid: true,
      issues: [],
      recommendations: []
    };

    try {
      // Check for response templates
      const { data: templates } = await supabase
        .from('response_templates')
        .select('id')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (!templates || templates.length === 0) {
        validation.issues.push('No response templates configured');
        validation.recommendations.push('Create at least one default response template');
      }

      // Check for business rules
      const { data: rules } = await supabase
        .from('escalation_rules')
        .select('id')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (!rules || rules.length === 0) {
        validation.issues.push('No business rules configured');
        validation.recommendations.push('Configure business rules for automated processing');
      }

      // Check for notification settings
      const { data: notifications } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', userId);

      if (!notifications || notifications.length === 0) {
        validation.issues.push('No notification settings configured');
        validation.recommendations.push('Configure notification preferences');
      }

      validation.valid = validation.issues.length === 0;

      return validation;

    } catch (error) {
      console.error('Pipeline validation failed:', error);
      return {
        valid: false,
        issues: ['Pipeline validation failed'],
        recommendations: ['Check system configuration and try again']
      };
    }
  }

  // Process email with quality checks
  async processEmailWithQuality(emailData, businessContext, userId) {
    const result = await this.processEmail(emailData, businessContext, userId);
    
    // Add quality metrics
    result.quality = this.assessResponseQuality(result);
    
    return result;
  }

  assessResponseQuality(result) {
    const quality = {
      score: 0,
      factors: {},
      recommendations: []
    };

    // Confidence factor (0-40 points)
    const confidenceScore = Math.min(40, (result.confidence / 100) * 40);
    quality.factors.confidence = confidenceScore;
    quality.score += confidenceScore;

    // Style application factor (0-20 points)
    const styleScore = result.styleApplied ? 20 : 0;
    quality.factors.style = styleScore;
    quality.score += styleScore;

    // Classification accuracy factor (0-20 points)
    const classificationScore = result.classification.confidence >= 70 ? 20 : 
                               result.classification.confidence >= 50 ? 15 : 10;
    quality.factors.classification = classificationScore;
    quality.score += classificationScore;

    // Response length factor (0-10 points)
    const responseLength = result.finalResponse.length;
    const lengthScore = responseLength >= 100 && responseLength <= 500 ? 10 : 
                       responseLength >= 50 && responseLength <= 800 ? 7 : 5;
    quality.factors.length = lengthScore;
    quality.score += lengthScore;

    // Pipeline completion factor (0-10 points)
    const completionScore = result.pipeline === 'complete' ? 10 : 5;
    quality.factors.completion = completionScore;
    quality.score += completionScore;

    // Generate recommendations
    if (quality.score < 70) {
      quality.recommendations.push('Consider reviewing and improving response templates');
    }
    if (!result.styleApplied) {
      quality.recommendations.push('Analyze more email history to improve style matching');
    }
    if (result.confidence < 70) {
      quality.recommendations.push('Review email classification accuracy');
    }

    return quality;
  }
}

export default new AIResponsePipeline();
